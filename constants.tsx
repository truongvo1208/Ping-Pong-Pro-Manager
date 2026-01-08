
import { Club, Player, Service, ServiceStatus } from './types';

export const CLUBS: Club[] = [
  { 
    id: 'super-admin', 
    name: 'Hệ thống Quản trị', 
    username: 'sadmin', 
    password: 'M@i250563533', 
    status: 'active', 
    role: 'SUPER_ADMIN',
    // Added required subscriptionTier property
    subscriptionTier: 'YEARLY'
  },
  // Updated demo club
  { id: 'club-demopro', name: 'CLB Bóng Bàn Demo Pro', username: 'demopro', password: 'demopro@123', status: 'active', role: 'CLUB_ADMIN', subscriptionTier: 'MONTHLY' },
  { id: 'club-hanoi', name: 'CLB Bóng Bàn 3T', username: 'admin_sg', password: 'admin', status: 'active', role: 'CLUB_ADMIN', subscriptionTier: 'FREE' },
  { id: 'club-phoco', name: 'CLB Phố Cổ PingPong', username: 'admin_phoco', password: 'admin', status: 'active', role: 'CLUB_ADMIN', subscriptionTier: 'FREE' },
  { id: 'club-saigon', name: 'CLB Sài Gòn Team', username: 'admin_saigon', password: 'admin', status: 'active', role: 'CLUB_ADMIN', subscriptionTier: 'FREE' },
];

export const INITIAL_PLAYERS: Player[] = [
  { id: 'p1', clubId: 'club-hanoi', name: 'Nguyễn Văn A', phone: '0912345678', createdAt: new Date().toISOString() },
  { id: 'p2', clubId: 'club-hanoi', name: 'Trần Thị B', phone: '0987654321', createdAt: new Date().toISOString() },
  { id: 'p3', clubId: 'club-phoco', name: 'Lê Văn C', phone: '0900112233', createdAt: new Date().toISOString() },
];

export const INITIAL_SERVICES: Service[] = [
  { id: 's1', clubId: 'club-hanoi', name: 'Tiền sân (giờ)', price: 50000, unit: 'giờ', status: ServiceStatus.ACTIVE },
  { id: 's2', clubId: 'club-hanoi', name: 'Nước suối', price: 10000, unit: 'chai', status: ServiceStatus.ACTIVE },
  { id: 's3', clubId: 'club-phoco', name: 'Phí sân tập', price: 60000, unit: 'giờ', status: ServiceStatus.ACTIVE },
  { id: 's4', clubId: 'club-phoco', name: 'Trà đá', price: 5000, unit: 'ly', status: ServiceStatus.ACTIVE },
];
