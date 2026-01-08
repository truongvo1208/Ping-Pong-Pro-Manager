
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { Club, Player, Service, Session, SessionService, Expense, MembershipPayment, SessionStatus, SubscriptionPayment, SubscriptionTier } from '../types';

const SUPABASE_URL = 'https://vtvgflsxzwvekivjeykx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dmdmbHN4end2ZWtpdmpleWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDA3NDgsImV4cCI6MjA4MzI3Njc0OH0.fYCh3u2McrWDU726R_51Ni6EyKxLExs3t3qxnd6N4CU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Xử lý lỗi API để hiển thị thông báo rõ ràng hơn
 */
const handleApiError = (error: any, context: string) => {
  if (!error) return;
  
  // Log full error object for debugging
  console.error(`[Supabase Error - ${context}]`, JSON.stringify(error, null, 2));

  let message = "Lỗi không xác định";
  if (error.message) message = error.message;
  else if (typeof error === 'string') message = error;
  else if (error.error_description) message = error.error_description;
  else if (error.details) message = error.details;
  
  throw new Error(`${context}: ${message}`);
};

/**
 * Helper chuyển snake_case sang camelCase
 */
const toCamel = (s: string) => {
  return s.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
};

/**
 * Helper chuyển camelCase sang snake_case
 */
const toSnake = (s: string) => {
  return s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * Ánh xạ dữ liệu từ DB (snake_case hoặc lowercase) sang App (camelCase)
 */
const mapToCamel = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(mapToCamel);
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) return obj;

  const newObj: any = {};
  for (const key of Object.keys(obj)) {
    let value = obj[key];
    
    // Normalize key mapping
    let newKey = toCamel(key);
    
    // Handle specific oddities if any (e.g., flat lowercase keys like 'clubid')
    if (key === 'clubid') newKey = 'clubId';
    if (key === 'playerid') newKey = 'playerId';
    if (key === 'sessionid') newKey = 'sessionId';
    if (key === 'serviceid') newKey = 'serviceId';
    
    // Dates flat lowercase mapping
    if (key === 'startdate') newKey = 'startDate';
    if (key === 'enddate') newKey = 'endDate';
    
    // session_services specific mapping
    if (key === 'unit_price') newKey = 'price';
    if (key === 'total_price') newKey = 'totalAmount';
    
    // sessions specific mapping
    if (key === 'total_amount') newKey = 'totalAmount';

    // Chuẩn hóa Status về lowercase để khớp với logic frontend
    if (key === 'status' && typeof value === 'string') {
        const upper = value.toUpperCase();
        if (['PLAYING', 'FINISHED', 'ACTIVE', 'INACTIVE'].includes(upper)) {
            value = value.toLowerCase();
        }
    }

    // Đệ quy cho nested objects (ví dụ session_services bên trong sessions)
    if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
        value = mapToCamel(value);
    }

    newObj[newKey] = value;
  }
  return newObj;
};

/**
 * Chuẩn bị dữ liệu để ghi xuống DB (Mapping App camelCase -> DB specific schema)
 * Schema Notes:
 * - sessions, session_services: uses snake_case (e.g. club_id, check_in_time)
 * - players: clubid, created_at, membership_end_date
 * - membership_payments: clubid, payment_date, startdate, enddate (mixed!)
 * - services, expenses: clubid (lowercase)
 */
const prepareForDb = (obj: any, table: string) => {
  const out: any = {};
  // session_services reinstated to isSnakeCaseTable
  const isSnakeCaseTable = ['sessions', 'session_services', 'clubs', 'subscription_payments'].includes(table);

  Object.keys(obj).forEach(k => {
    let val = obj[k];
    if (typeof val === 'string' && val.trim() === '') val = null;

    // Skip 'id' if null so DB can auto-generate it
    if (k === 'id' && val === null) return;

    // Force Status to Uppercase for DB ENUM compatibility
    if (k === 'status' && typeof val === 'string') {
      val = val.toUpperCase();
    }

    // Mapping đặc thù từng bảng
    if (table === 'session_services') {
       // if (k === 'price') { out['unit_price'] = val; return; } 
       if (k === 'totalAmount') { out['total_amount'] = val; return; }
       // 'clubId' không tồn tại trong session_services
       if (k === 'clubId') return;
    }
    else if (table === 'membership_payments') {
       // Table này có schema hỗn hợp: clubid (flat), payment_date (snake), startdate/enddate (flat)
       if (k === 'startDate') { out['startdate'] = val; return; }
       if (k === 'endDate') { out['enddate'] = val; return; }
       if (k === 'paymentDate') { out['payment_date'] = val; return; }
       // Fallthrough cho clubId -> clubid
    }

    // Logic định danh cột chung
    if (isSnakeCaseTable) {
        // Table dùng full snake_case
        out[toSnake(k)] = val;
    } else {
        // Table dùng mixed (lowercase ID, snake_case others)
        if (k.toLowerCase().endsWith('id') && k !== 'id' && k !== 'uuid') {
            // clubId -> clubid, sessionId -> sessionid, serviceId -> serviceid
            out[k.toLowerCase()] = val;
        } else {
            // createdAt -> created_at, membershipEndDate -> membership_end_date, totalAmount -> total_amount
            out[toSnake(k)] = val;
        }
    }
  });
  return out;
};

const normalizeRole = (dbRole: string, username?: string): 'SUPER_ADMIN' | 'CLUB_ADMIN' => {
  if (!dbRole) return 'CLUB_ADMIN';
  const r = dbRole.toUpperCase();
  if (r === 'SUPER_ADMIN' || r === 'SUPERADMIN' || r === 'SADMIN' || username === 'sadmin') return 'SUPER_ADMIN';
  return 'CLUB_ADMIN';
};

export const API = {
  auth: {
    login: async (username: string, pass: string): Promise<Club> => {
      // Query trực tiếp từ bảng clubs
      const { data, error } = await supabase.from('clubs').select('*').eq('username', username).single();
      
      if (error || !data) {
        // Fallback rpc
        const { data: rpcData, error: rpcError } = await supabase.rpc('login_club', { p_username: username, p_password: pass });
        if (rpcError) handleApiError(rpcError || error, "Đăng nhập");
        if (!rpcData || rpcData.length === 0) throw new Error("Sai tài khoản hoặc mật khẩu.");
        
        const club = mapToCamel(rpcData[0]);
        return { 
          ...club, 
          role: normalizeRole(club.role, club.username),
          subscriptionTier: (club.subscriptionTier || 'FREE').toUpperCase()
        } as Club;
      }

      // Verify password
      const isMatch = await bcrypt.compare(pass, data.password);
      if (!isMatch) throw new Error("Sai tài khoản hoặc mật khẩu.");

      const club = mapToCamel(data);
      return { 
        ...club, 
        role: normalizeRole(club.role, club.username),
        subscriptionTier: (club.subscriptionTier || 'FREE').toUpperCase()
      } as Club;
    },
  },

  clubs: {
    list: async (): Promise<Club[]> => {
      const { data, error } = await supabase.from('clubs').select('*').order('name');
      if (error) handleApiError(error, "Tải danh sách cơ sở");
      return (data || []).map(c => {
        const club = mapToCamel(c);
        return { 
          ...club, 
          role: normalizeRole(club.role, club.username),
          subscriptionTier: (club.subscriptionTier || 'FREE').toUpperCase()
        };
      });
    },
    getById: async (id: string): Promise<Club> => {
      const { data, error } = await supabase.from('clubs').select('*').eq('id', id).single();
      if (error) handleApiError(error, "Tải thông tin cơ sở");
      const club = mapToCamel(data);
      return { 
        ...club, 
        role: normalizeRole(club.role, club.username),
        subscriptionTier: (club.subscriptionTier || 'FREE').toUpperCase()
      };
    },
    create: async (club: any): Promise<Club> => {
      const { paymentAmount, password, ...rest } = club;
      let hashedPassword = password;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(password, salt);
      }

      const dbClub = prepareForDb({ ...rest, password: hashedPassword }, 'clubs');
      const { data, error } = await supabase.from('clubs').insert([dbClub]).select().single();
      if (error) handleApiError(error, "Tạo cơ sở");
      
      const newClub = mapToCamel(data);

      if (paymentAmount > 0 && newClub) {
        await API.subscriptions.create({
          clubId: newClub.id,
          tier: rest.subscriptionTier,
          amount: paymentAmount,
          startDate: rest.subscriptionStartDate,
          endDate: rest.subscriptionEndDate,
          paymentDate: new Date().toISOString(),
          status: 'COMPLETED'
        });
      }
      return newClub;
    },
    update: async (id: string, club: any): Promise<Club> => {
      const { paymentAmount, password, ...rest } = club;
      const updateData: any = { ...rest };
      if (password && password.trim() !== '') {
         const salt = await bcrypt.genSalt(10);
         updateData.password = await bcrypt.hash(password, salt);
      }

      const dbClub = prepareForDb(updateData, 'clubs');
      const { data, error } = await supabase.from('clubs').update(dbClub).eq('id', id).select().single();
      if (error) handleApiError(error, "Cập nhật cơ sở");
      
      if (paymentAmount > 0) {
        await API.subscriptions.create({
          clubId: id,
          tier: rest.subscriptionTier,
          amount: paymentAmount,
          startDate: rest.subscriptionStartDate,
          endDate: rest.subscriptionEndDate,
          paymentDate: new Date().toISOString(),
          status: 'COMPLETED'
        });
      }
      return mapToCamel(data);
    },
    remove: async (id: string): Promise<void> => {
      const { error } = await supabase.from('clubs').delete().eq('id', id);
      if (error) handleApiError(error, "Xóa cơ sở");
    }
  },

  players: {
    list: async (clubId?: string): Promise<Player[]> => {
      // players use 'clubid' (lowercase) and 'created_at' (snake)
      let query = supabase.from('players').select('*').order('created_at', { ascending: false });
      if (clubId) query = query.eq('clubid', clubId);
      const { data, error } = await query;
      if (error) handleApiError(error, "Tải danh sách người chơi");
      return mapToCamel(data || []);
    },
    create: async (player: any): Promise<Player> => {
      const dbPlayer = prepareForDb(player, 'players');
      const { data, error } = await supabase.from('players').insert([dbPlayer]).select().single();
      if (error) handleApiError(error, "Thêm người chơi");
      return mapToCamel(data);
    },
    update: async (id: string, player: any): Promise<Player> => {
      const dbPlayer = prepareForDb(player, 'players');
      const { data, error } = await supabase.from('players').update(dbPlayer).eq('id', id).select().single();
      if (error) handleApiError(error, "Cập nhật người chơi");
      return mapToCamel(data);
    }
  },

  services: {
    list: async (clubId?: string): Promise<Service[]> => {
      // services use 'clubid'
      let query = supabase.from('services').select('*').order('name');
      if (clubId) query = query.eq('clubid', clubId);
      const { data, error } = await query;
      if (error) handleApiError(error, "Tải danh sách dịch vụ");
      return mapToCamel(data || []);
    },
    create: async (service: any): Promise<Service> => {
      const dbService = prepareForDb(service, 'services');
      const { data, error } = await supabase.from('services').insert([dbService]).select().single();
      if (error) handleApiError(error, "Thêm dịch vụ");
      return mapToCamel(data);
    },
    update: async (id: string, service: any): Promise<Service> => {
      const dbService = prepareForDb(service, 'services');
      const { data, error } = await supabase.from('services').update(dbService).eq('id', id).select().single();
      if (error) handleApiError(error, "Cập nhật dịch vụ");
      return mapToCamel(data);
    },
    delete: async (id: string): Promise<void> => {
       // Not exposed in API object but good to have if needed internally
       const { error } = await supabase.from('services').delete().eq('id', id);
       if (error) handleApiError(error, "Xóa dịch vụ");
    }
  },

  sessions: {
    list: async (clubId?: string): Promise<any[]> => {
      // sessions use 'club_id' (snake_case)
      let query = supabase.from('sessions').select('*, session_services(*)').order('check_in_time', { ascending: false });
      if (clubId) query = query.eq('club_id', clubId);
      const { data, error } = await query;
      if (error) handleApiError(error, "Tải lịch sử chơi");
      return mapToCamel(data || []);
    },
    checkIn: async (clubId: string, playerId: string): Promise<Session> => {
      const session = {
        clubId,
        playerId,
        checkInTime: new Date().toISOString(),
        status: SessionStatus.PLAYING,
        totalAmount: 0
      };
      const dbSession = prepareForDb(session, 'sessions');
      const { data, error } = await supabase.from('sessions').insert([dbSession]).select().single();
      if (error) handleApiError(error, "Check-in");
      return mapToCamel(data);
    },
    checkOut: async (id: string, totalAmount: number): Promise<Session> => {
      const update = {
        status: SessionStatus.FINISHED,
        checkOutTime: new Date().toISOString(),
        totalAmount
      };
      const dbUpdate = prepareForDb(update, 'sessions');
      const { data, error } = await supabase.from('sessions').update(dbUpdate).eq('id', id).select().single();
      if (error) handleApiError(error, "Thanh toán");
      return mapToCamel(data);
    },
    addService: async (sessionId: string, ss: any): Promise<SessionService> => {
      const dbSS = prepareForDb(ss, 'session_services');
      const { data, error } = await supabase.from('session_services').insert([dbSS]).select().single();
      if (error) handleApiError(error, "Thêm dịch vụ cho lượt chơi");
      return mapToCamel(data);
    },
    updateService: async (id: string, quantity: number, totalAmount: number): Promise<SessionService> => {
      const { data, error } = await supabase.from('session_services').update({ quantity, total_amount: totalAmount }).eq('id', id).select().single();
      if (error) handleApiError(error, "Cập nhật dịch vụ");
      return mapToCamel(data);
    },
    removeService: async (id: string): Promise<void> => {
      const { error } = await supabase.from('session_services').delete().eq('id', id);
      if (error) handleApiError(error, "Xóa dịch vụ");
    }
  },

  expenses: {
    list: async (clubId?: string): Promise<Expense[]> => {
      // expenses use 'clubid'
      let query = supabase.from('expenses').select('*').order('date', { ascending: false });
      if (clubId) query = query.eq('clubid', clubId);
      const { data, error } = await query;
      if (error) handleApiError(error, "Tải danh sách chi phí");
      
      return mapToCamel(data || []);
    },
    create: async (expense: any): Promise<Expense> => {
      const dbExpense = prepareForDb(expense, 'expenses');
      const { data, error } = await supabase.from('expenses').insert([dbExpense]).select().single();
      if (error) handleApiError(error, "Thêm chi phí");
      
      return mapToCamel(data);
    },
    update: async (id: string, expense: any): Promise<Expense> => {
      const dbExpense = prepareForDb(expense, 'expenses');
      const { data, error } = await supabase.from('expenses').update(dbExpense).eq('id', id).select().single();
      if (error) handleApiError(error, "Cập nhật chi phí");
      
      return mapToCamel(data);
    },
    remove: async (id: string): Promise<void> => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) handleApiError(error, "Xóa chi phí");
    }
  },

  membership: {
    list: async (clubId?: string): Promise<MembershipPayment[]> => {
      // membership_payments use 'clubid' and 'payment_date'
      let query = supabase.from('membership_payments').select('*').order('payment_date', { ascending: false });
      if (clubId) query = query.eq('clubid', clubId);
      const { data, error } = await query;
      if (error) handleApiError(error, "Tải danh sách hội viên");
      return mapToCamel(data || []);
    },
    create: async (payment: any): Promise<MembershipPayment> => {
      const dbPayment = prepareForDb(payment, 'membership_payments');
      const { data, error } = await supabase.from('membership_payments').insert([dbPayment]).select().single();
      if (error) handleApiError(error, "Gia hạn hội viên");
      
      if (data) {
        // Update player membership end date. players table uses 'membership_end_date' (snake_case)
        await supabase.from('players').update({ membership_end_date: payment.endDate }).eq('id', payment.playerId);
      }
      return mapToCamel(data);
    }
  },

  subscriptions: {
    list: async (): Promise<SubscriptionPayment[]> => {
      const { data, error } = await supabase.from('subscription_payments').select('*').order('payment_date', { ascending: false });
      if (error) handleApiError(error, "Tải danh sách thuê bao");
      return mapToCamel(data || []);
    },
    create: async (payment: any): Promise<SubscriptionPayment> => {
      const dbPayment = prepareForDb(payment, 'subscription_payments');
      const { data, error } = await supabase.from('subscription_payments').insert([dbPayment]).select().single();
      if (error) handleApiError(error, "Ghi nhận thanh toán thuê bao");
      return mapToCamel(data);
    }
  }
};
