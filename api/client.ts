
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { Club, Player, Service, Session, SessionService, Expense, MembershipPayment, SessionStatus } from '../types';

const SUPABASE_URL = 'https://vtvgflsxzwvekivjeykx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dmdmbHN4end2ZWtpdmpleWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDA3NDgsImV4cCI6MjA4MzI3Njc0OH0.fYCh3u2McrWDU726R_51Ni6EyKxLExs3t3qxnd6N4CU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Ánh xạ tên cột từ Database sang App (camelCase)
 */
const mapToCamel = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(mapToCamel);
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) return obj;

  return Object.keys(obj).reduce((acc, key) => {
    const mapping: Record<string, string> = {
      'club_id': 'clubId',
      'clubid': 'clubId',
      'player_id': 'playerId',
      'playerid': 'playerId',
      'session_id': 'sessionId',
      'sessionid': 'sessionId',
      'service_id': 'serviceId',
      'serviceid': 'serviceId',
      'check_in_time': 'checkInTime',
      'check_out_time': 'checkOutTime',
      'total_amount': 'totalAmount',
      'unit_price': 'price', 
      'unitprice': 'price',
      'total_price': 'totalAmount',
      'totalprice': 'totalAmount',
      'total': 'totalAmount',
      'payment_date': 'paymentDate',
      'paymentdate': 'paymentDate',
      'start_date': 'startDate',
      'startdate': 'startDate',
      'end_date': 'endDate',
      'enddate': 'endDate',
      'membership_start_date': 'membershipStartDate',
      'membership_end_date': 'membershipEndDate',
      'membership_enddate': 'membershipEndDate',
      'note': 'note',
      'notes': 'note',
      'skill_level': 'skillLevel'
    };

    let camelKey = mapping[key] || key.replace(/([-_][a-z])/g, (group) =>
      group.toUpperCase().replace('-', '').replace('_', '')
    );

    let value = obj[key];
    
    if (key === 'status' && typeof value === 'string') {
      value = value.toLowerCase();
    }

    if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
      value = mapToCamel(value);
    }
    acc[camelKey] = value;
    return acc;
  }, {} as any);
};

/**
 * Ánh xạ tên cột từ App sang Database
 */
const mapToSnake = (obj: any, tableName?: string): any => {
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(o => mapToSnake(o, tableName));

  return Object.keys(obj).reduce((acc, key) => {
    const special: Record<string, string> = {
      'clubId': (tableName === 'sessions') ? 'club_id' : 'clubid',
      'playerId': (tableName === 'sessions') ? 'player_id' : (tableName === 'membership_payments' ? 'playerid' : 'player_id'),
      'paymentDate': (tableName === 'membership_payments') ? 'payment_date' : 'payment_date',
      'startDate': (tableName === 'membership_payments') ? 'startdate' : 'start_date',
      'endDate': (tableName === 'membership_payments') ? 'enddate' : 'end_date',
      'sessionId': 'session_id',
      'serviceId': 'service_id',
      'price': 'price',
      'totalAmount': 'total_amount',
      'checkInTime': 'check_in_time',
      'checkOutTime': 'check_out_time',
      'membershipStartDate': 'membership_start_date',
      'membershipEndDate': (tableName === 'players') ? 'membership_enddate' : 'membership_end_date',
      'note': (tableName === 'expenses') ? 'description' : (tableName === 'players' ? 'note' : 'notes'),
      'skillLevel': 'skill_level'
    };

    let dbKey = special[key] || key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    
    if (tableName === 'expenses' && (dbKey === 'notes' || dbKey === 'note')) {
        // Fallback for note/notes mapping in expenses
        dbKey = 'description';
    }

    let value = obj[key];
    
    if (key === 'role' || key === 'status') {
      if (typeof value === 'string') {
        value = value.toUpperCase();
      }
    }
    
    acc[dbKey] = value;
    return acc;
  }, {} as any);
};

const normalizeRole = (dbRole: string, username?: string): 'SUPER_ADMIN' | 'CLUB_ADMIN' => {
  if (!dbRole) return 'CLUB_ADMIN';
  const r = dbRole.toUpperCase().replace(/[^A-Z_]/g, '');
  const u = username?.toLowerCase() || '';
  
  if (r === 'SUPER_ADMIN' || r === 'SUPERADMIN' || u === 'admin_supper' || u === 'sadmin') {
    return 'SUPER_ADMIN';
  }
  return 'CLUB_ADMIN';
};

const handleApiError = (error: any, context: string) => {
  if (!error) return;
  console.error(`[Supabase Error Details - ${context}]`, JSON.stringify(error, null, 2));
  let message = "Lỗi không xác định";
  let detail = "";
  if (typeof error === 'string') {
    message = error;
  } else if (error.message) {
    message = error.message;
    detail = error.details || error.hint || "";
  } else if (error.error_description) {
    message = error.error_description;
  }
  throw new Error(`${context}: ${message}${detail ? ` (Chi tiết: ${detail})` : ""}`);
};

export const API = {
  auth: {
    login: async (username: string, pass: string): Promise<Club> => {
      const { data, error } = await supabase.rpc('login_club', { p_username: username, p_password: pass });
      if (error) handleApiError(error, "Xác thực");
      if (!data || data.length === 0) throw new Error("Sai tài khoản hoặc mật khẩu.");
      const rawClub = mapToCamel(data[0]);
      return { 
        ...rawClub, 
        role: normalizeRole(rawClub.role, rawClub.username) 
      } as Club;
    },
  },

  clubs: {
    list: async (): Promise<Club[]> => {
      const { data, error } = await supabase.from('clubs').select('*').order('name');
      if (error) handleApiError(error, "Tải danh sách cơ sở");
      return (data || []).map(c => {
        const club = mapToCamel(c);
        return { ...club, role: normalizeRole(club.role, club.username) };
      });
    },
    create: async (data: Partial<Club>): Promise<Club> => {
      const payload = { ...data };
      if (payload.password) {
        const salt = await bcrypt.genSalt(10);
        payload.password = await bcrypt.hash(payload.password, salt);
      }
      if (!payload.role) payload.role = 'CLUB_ADMIN';
      if (!payload.status) payload.status = 'active';
      const dbData = mapToSnake(payload, 'clubs');
      const { data: result, error } = await supabase.from('clubs').insert([dbData]).select().single();
      if (error) handleApiError(error, "Tạo cơ sở");
      const club = mapToCamel(result);
      return { ...club, role: normalizeRole(club.role, club.username) };
    },
    update: async (id: string, data: Partial<Club>): Promise<Club> => {
      const { id: _, ...payload } = data; 
      if (payload.password) {
        const salt = await bcrypt.genSalt(10);
        payload.password = await bcrypt.hash(payload.password, salt);
      }
      const dbData = mapToSnake(payload, 'clubs');
      const { data: result, error } = await supabase.from('clubs').update(dbData).eq('id', id).select().single();
      if (error) handleApiError(error, "Cập nhật cơ sở");
      const club = mapToCamel(result);
      return { ...club, role: normalizeRole(club.role, club.username) };
    },
    remove: async (id: string): Promise<void> => {
      const { error } = await supabase.from('clubs').delete().eq('id', id);
      if (error) handleApiError(error, "Xóa cơ sở");
    },
  },

  players: {
    list: async (clubId?: string): Promise<Player[]> => {
      let query = supabase.from('players').select('*');
      if (clubId) query = query.eq('clubid', clubId); 
      const { data, error } = await query.order('name');
      if (error) handleApiError(error, "Tải người chơi");
      return mapToCamel(data || []);
    },
    create: async (data: Partial<Player>): Promise<Player> => {
      const { id, ...cleanData } = data;
      const dbData = mapToSnake(cleanData, 'players');
      const { data: result, error } = await supabase.from('players').insert([dbData]).select().single();
      if (error) handleApiError(error, "Thêm người chơi");
      return mapToCamel(result);
    },
    update: async (id: string, data: Partial<Player>): Promise<Player> => {
      const { id: _, ...payload } = data;
      const dbData = mapToSnake(payload, 'players');
      const { data: result, error } = await supabase.from('players').update(dbData).eq('id', id).select().single();
      if (error) handleApiError(error, "Cập nhật người chơi");
      return mapToCamel(result);
    },
  },

  services: {
    list: async (clubId?: string): Promise<Service[]> => {
      let query = supabase.from('services').select('*');
      if (clubId) query = query.eq('clubid', clubId); 
      const { data, error } = await query.order('name');
      if (error) handleApiError(error, "Tải dịch vụ");
      return mapToCamel(data || []);
    },
    create: async (data: Partial<Service>): Promise<Service> => {
      const { id, ...cleanData } = data;
      const dbData = mapToSnake(cleanData, 'services');
      const { data: result, error } = await supabase.from('services').insert([dbData]).select().single();
      if (error) handleApiError(error, "Thêm dịch vụ");
      return mapToCamel(result);
    },
    update: async (id: string, data: Partial<Service>): Promise<Service> => {
      const { id: _, ...payload } = data;
      const dbData = mapToSnake(payload, 'services');
      const { data: result, error } = await supabase.from('services').update(dbData).eq('id', id).select().single();
      if (error) handleApiError(error, "Cập nhật dịch vụ");
      return mapToCamel(result);
    },
  },

  sessions: {
    list: async (clubId?: string): Promise<any[]> => {
      let query = supabase.from('sessions').select('*, session_services(*)');
      if (clubId) query = query.eq('club_id', clubId); 
      const { data, error } = await query.order('check_in_time', { ascending: false });
      if (error) handleApiError(error, "Tải phiên chơi");
      return mapToCamel(data || []);
    },
    checkIn: async (clubId: string, playerId: string): Promise<any> => {
      const { data, error } = await supabase
        .from('sessions')
        .insert([{
          club_id: clubId, 
          player_id: playerId,
          check_in_time: new Date().toISOString(),
          status: 'PLAYING',
          total_amount: 0
        }])
        .select()
        .single();
      if (error) handleApiError(error, "Check-in");
      return { ...mapToCamel(data), sessionServices: [] };
    },
    addService: async (sessionId: string, data: Partial<SessionService>): Promise<SessionService> => {
      const { id, ...cleanData } = data;
      const dbData = mapToSnake({ ...cleanData, sessionId }, 'session_services');
      const { data: result, error } = await supabase.from('session_services').insert([dbData]).select().single();
      if (error) handleApiError(error, "Thêm dịch vụ vào phiên");
      return mapToCamel(result);
    },
    updateService: async (id: string, quantity: number, totalAmount: number): Promise<SessionService> => {
      const { data, error } = await supabase
        .from('session_services')
        .update({ quantity, total_amount: totalAmount })
        .eq('id', id)
        .select()
        .single();
      if (error) handleApiError(error, "Cập nhật số lượng dịch vụ");
      return mapToCamel(data);
    },
    removeService: async (id: string): Promise<void> => {
      const { error } = await supabase.from('session_services').delete().eq('id', id);
      if (error) handleApiError(error, "Xóa dịch vụ");
    },
    checkOut: async (id: string, totalAmount: number): Promise<any> => {
      const { data, error } = await supabase
        .from('sessions')
        .update({
          status: 'FINISHED',
          total_amount: totalAmount,
          check_out_time: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) handleApiError(error, "Thanh toán");
      return mapToCamel(data);
    },
  },

  expenses: {
    list: async (clubId?: string): Promise<Expense[]> => {
      let query = supabase.from('expenses').select('*');
      if (clubId) query = query.eq('clubid', clubId); 
      const { data, error } = await query.order('date', { ascending: false });
      if (error) handleApiError(error, "Tải chi phí");
      return mapToCamel(data || []);
    },
    create: async (data: Partial<Expense>): Promise<Expense> => {
      const { id, ...cleanData } = data;
      const dbData = mapToSnake(cleanData, 'expenses');
      const { data: result, error } = await supabase.from('expenses').insert([dbData]).select().single();
      if (error) handleApiError(error, "Ghi chi phí");
      return mapToCamel(result);
    },
    update: async (id: string, data: Partial<Expense>): Promise<Expense> => {
      const { id: _, ...payload } = data;
      const dbData = mapToSnake(payload, 'expenses');
      const { data: result, error } = await supabase.from('expenses').update(dbData).eq('id', id).select().single();
      if (error) handleApiError(error, "Cập nhật chi phí");
      return mapToCamel(result);
    },
    remove: async (id: string): Promise<void> => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) handleApiError(error, "Xóa chi phí");
    },
  },

  membership: {
    list: async (clubId?: string): Promise<MembershipPayment[]> => {
      let query = supabase.from('membership_payments').select('*');
      if (clubId) query = query.eq('clubid', clubId); 
      const { data, error } = await query.order('payment_date', { ascending: false });
      if (error) handleApiError(error, "Tải hội viên");
      return mapToCamel(data || []);
    },
    create: async (data: Partial<MembershipPayment>): Promise<MembershipPayment> => {
      const { id, ...cleanData } = data;
      const dbData = mapToSnake(cleanData, 'membership_payments');
      const { data: result, error } = await supabase.from('membership_payments').insert([dbData]).select().single();
      if (error) handleApiError(error, "Gia hạn");
      const playerUpdateData = mapToSnake({ membershipStartDate: data.startDate, membershipEndDate: data.endDate }, 'players');
      await supabase.from('players').update(playerUpdateData).eq('id', data.playerId);
      return mapToCamel(result);
    },
  }
};
