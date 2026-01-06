
export enum SessionStatus {
  PLAYING = 'playing',
  FINISHED = 'finished'
}

export enum ServiceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface Club {
  id: string;
  name: string;
  username: string;
  password?: string; // Thêm trường password để quản lý
  status: 'active' | 'inactive';
  role: 'superadmin' | 'club'; // Phân quyền
}

export interface Player {
  id: string;
  clubId: string; 
  name: string;
  phone?: string;
  note?: string;
  createdAt: string;
  membershipStartDate?: string;
  membershipEndDate?: string;
}

export interface MembershipPayment {
  id: string;
  clubId: string;
  playerId: string;
  amount: number;
  paymentDate: string;
  startDate: string;
  endDate: string;
}

export interface Service {
  id: string;
  clubId: string;
  name: string;
  price: number;
  unit: string;
  status: ServiceStatus;
}

export interface SessionService {
  id: string;
  sessionId: string;
  serviceId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Session {
  id: string;
  clubId: string;
  playerId: string;
  checkInTime: string;
  checkOutTime?: string;
  status: SessionStatus;
  totalAmount: number;
}

export interface Notification {
  id: string;
  clubId: string;
  title: string;
  content: string;
  type: 'promotion' | 'reminder' | 'tournament';
  sentAt: string;
  targetCount: number;
}

export interface Expense {
  id: string;
  clubId: string;
  date: string;
  description: string;
  amount: number;
  note?: string;
}

export interface Booking {
  id: string;
  clubId: string;
  playerId: string;
  tableId: number;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'playing';
}

export type ViewType = 'dashboard' | 'players' | 'services' | 'expenses' | 'history' | 'reports' | 'notifications' | 'admin-clubs' | 'admin-reports';
