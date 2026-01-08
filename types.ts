
export enum SessionStatus {
  PLAYING = 'playing',
  FINISHED = 'finished'
}

export enum ServiceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export type SubscriptionTier = 'FREE' | 'MONTHLY' | 'YEARLY';

export interface Club {
  id: string;
  name: string;
  username: string;
  password?: string;
  email?: string;
  hotline?: string;
  address?: string;
  status: 'active' | 'inactive';
  role: 'SUPER_ADMIN' | 'CLUB_ADMIN';
  subscriptionTier: SubscriptionTier;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
}

export interface SubscriptionPayment {
  id: string;
  clubId: string;
  tier: SubscriptionTier;
  amount: number;
  paymentDate: string;
  startDate: string;
  endDate: string;
  note?: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
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
  points?: number;
  skillLevel?: string;
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
  price: number;
  totalAmount: number;
}

export interface Session {
  id: string;
  clubId: string;
  playerId: string;
  tableNumber?: number;
  checkInTime: string;
  checkOutTime?: string;
  status: SessionStatus;
  totalAmount: number;
}

export interface Expense {
  id: string;
  clubId: string;
  date: string;
  name: string;
  description: string;
  amount: number;
}

export interface Notification {
  id: string;
  clubId: string;
  title: string;
  content: string;
  type: 'promotion' | 'reminder' | 'tournament' | 'other';
  sentAt: string;
  targetCount?: number;
}

export interface Booking {
  id: string;
  clubId: string;
  playerId: string;
  tableId: number;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'pending';
}

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  score1: number;
  score2: number;
  winnerId?: string;
  round: string;
}

export interface Tournament {
  id: string;
  clubId: string;
  name: string;
  startDate: string;
  status: 'ongoing' | 'upcoming' | 'finished';
  matches: Match[];
}

export type ViewType = 'dashboard' | 'players' | 'services' | 'expenses' | 'history' | 'reports' | 'admin-clubs' | 'admin-reports' | 'admin-saas';
