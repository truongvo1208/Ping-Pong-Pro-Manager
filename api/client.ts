
import { createClient } from '@supabase/supabase-js';
import { Club, Player, Service, Session, SessionService, Expense, MembershipPayment, SessionStatus } from '../types';

// Cấu hình kết nối
const SUPABASE_URL = 'https://vtvgflsxzwvekivjeykx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dmdmbHN4end2ZWtpdmpleWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDA3NDgsImV4cCI6MjA4MzI3Njc0OH0.fYCh3u2McrWDU726R_51Ni6EyKxLExs3t3qxnd6N4CU';

// Khởi tạo client với kiểm tra an toàn
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Supabase URL hoặc Anon Key bị thiếu! Vui lòng kiểm tra lại cấu hình.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const API = {
  system: {
    /**
     * Kiểm tra trạng thái thực tế của Database
     */
    testConnection: async () => {
      try {
        const start = performance.now();
        // Thử truy vấn bảng clubs - bảng quan trọng nhất để login
        const { data, error, status } = await supabase
          .from('clubs')
          .select('id')
          .limit(1);

        const end = performance.now();
        const latency = Math.round(end - start);

        if (error) {
          // Lỗi từ Supabase (ví dụ: bảng không tồn tại hoặc sai Key)
          return { 
            success: false, 
            message: `Lỗi Database (${error.code}): ${error.message}`,
            latency 
          };
        }

        return { 
          success: true, 
          message: "Kết nối Supabase Online", 
          latency 
        };
      } catch (err: any) {
        // Lỗi mạng hoặc lỗi code nghiêm trọng
        return { 
          success: false, 
          message: "Không thể kết nối Internet hoặc lỗi URL Supabase",
          latency: 0 
        };
      }
    }
  },

  auth: {
    login: async (username: string, pass: string): Promise<Club> => {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('username', username)
        .eq('password', pass)
        .maybeSingle(); // maybeSingle trả về null thay vì lỗi nếu không tìm thấy
      
      if (error) throw new Error(`Lỗi hệ thống: ${error.message}`);
      if (!data) throw new Error("Sai tài khoản hoặc mật khẩu");
      
      return data as Club;
    },
  },

  clubs: {
    list: async (): Promise<Club[]> => {
      const { data, error } = await supabase.from('clubs').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
    create: async (data: Partial<Club>): Promise<Club> => {
      const { data: result, error } = await supabase.from('clubs').insert([data]).select().single();
      if (error) throw error;
      return result;
    },
    update: async (id: string, data: Partial<Club>): Promise<Club> => {
      const { data: result, error } = await supabase.from('clubs').update(data).eq('id', id).select().single();
      if (error) throw error;
      return result;
    },
    remove: async (id: string): Promise<void> => {
      const { error } = await supabase.from('clubs').delete().eq('id', id);
      if (error) throw error;
    },
  },

  players: {
    list: async (clubId?: string): Promise<Player[]> => {
      let query = supabase.from('players').select('*');
      if (clubId) query = query.eq('clubId', clubId);
      const { data, error } = await query.order('name');
      if (error) throw error;
      return data || [];
    },
    create: async (data: Partial<Player>): Promise<Player> => {
      // Để database tự tạo ID nếu ID không được cung cấp
      const { data: result, error } = await supabase.from('players').insert([data]).select().single();
      if (error) throw error;
      return result;
    },
    update: async (id: string, data: Partial<Player>): Promise<Player> => {
      const { data: result, error } = await supabase.from('players').update(data).eq('id', id).select().single();
      if (error) throw error;
      return result;
    },
  },

  services: {
    list: async (clubId?: string): Promise<Service[]> => {
      let query = supabase.from('services').select('*');
      if (clubId) query = query.eq('clubId', clubId);
      const { data, error } = await query.order('name');
      if (error) throw error;
      return data || [];
    },
    create: async (data: Partial<Service>): Promise<Service> => {
      const { data: result, error } = await supabase.from('services').insert([data]).select().single();
      if (error) throw error;
      return result;
    },
    update: async (id: string, data: Partial<Service>): Promise<Service> => {
      const { data: result, error } = await supabase.from('services').update(data).eq('id', id).select().single();
      if (error) throw error;
      return result;
    },
  },

  sessions: {
    list: async (clubId?: string): Promise<any[]> => {
      let query = supabase.from('sessions').select('*, session_services(*)');
      if (clubId) query = query.eq('clubId', clubId);
      const { data, error } = await query.order('checkInTime', { ascending: false });
      if (error) throw error;
      
      return (data || []).map(s => ({
        ...s,
        sessionServices: s.session_services
      }));
    },
    checkIn: async (clubId: string, playerId: string): Promise<any> => {
      const { data, error } = await supabase
        .from('sessions')
        .insert([{
          clubId,
          playerId,
          checkInTime: new Date().toISOString(),
          status: SessionStatus.PLAYING,
          totalAmount: 0
        }])
        .select()
        .single();
      
      if (error) throw error;
      return { ...data, sessionServices: [] };
    },
    addService: async (sessionId: string, data: Partial<SessionService>): Promise<SessionService> => {
      // Loại bỏ ID cũ để database tự generate ID đồng bộ
      const { id, ...cleanData } = data as any;
      const { data: result, error } = await supabase
        .from('session_services')
        .insert([{ ...cleanData, sessionId }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    removeService: async (id: string): Promise<void> => {
      const { error } = await supabase.from('session_services').delete().eq('id', id);
      if (error) throw error;
    },
    checkOut: async (id: string, totalAmount: number): Promise<any> => {
      const { data, error } = await supabase
        .from('sessions')
        .update({
          status: SessionStatus.FINISHED,
          totalAmount,
          checkOutTime: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
  },

  expenses: {
    list: async (clubId?: string): Promise<Expense[]> => {
      let query = supabase.from('expenses').select('*');
      if (clubId) query = query.eq('clubId', clubId);
      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    create: async (data: Partial<Expense>): Promise<Expense> => {
      const { data: result, error } = await supabase.from('expenses').insert([data]).select().single();
      if (error) throw error;
      return result;
    },
    remove: async (id: string): Promise<void> => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
  },

  membership: {
    list: async (clubId?: string): Promise<MembershipPayment[]> => {
      let query = supabase.from('membership_payments').select('*');
      if (clubId) query = query.eq('clubId', clubId);
      const { data, error } = await query.order('paymentDate', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    create: async (data: Partial<MembershipPayment>): Promise<MembershipPayment> => {
      const { data: result, error } = await supabase.from('membership_payments').insert([data]).select().single();
      if (error) throw error;
      
      // Cập nhật ngày hết hạn cho người chơi
      await supabase.from('players').update({ membershipEndDate: data.endDate }).eq('id', data.playerId);
      
      return result;
    },
  }
};
