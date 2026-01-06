
import { Club, Player, Service, Session, SessionService, Expense, MembershipPayment, SessionStatus, ServiceStatus } from '../types';
import { CLUBS, INITIAL_PLAYERS, INITIAL_SERVICES } from '../constants';

const MAX_RETRIES = 1;
const INITIAL_BACKOFF = 200;

// Mock Database State for Offline/Demo Mode
const getLocalData = (key: string, defaultValue: any) => {
  try {
    const saved = localStorage.getItem(`pingpong_pro_${key}`);
    const data = saved ? JSON.parse(saved) : defaultValue;
    
    // ĐẶC BIỆT: Đồng bộ mật khẩu admin từ constants nếu nó khác với localStorage
    // Điều này giúp tránh việc bị kẹt mật khẩu cũ khi dev/update code
    if (key === 'clubs' && Array.isArray(data)) {
      return data.map(localClub => {
        const defaultClub = (defaultValue as Club[]).find(c => c.username === localClub.username);
        if (defaultClub && defaultClub.password !== localClub.password) {
          return { ...localClub, password: defaultClub.password };
        }
        return localClub;
      });
    }
    
    return data;
  } catch (e) {
    return defaultValue;
  }
};

const saveLocalData = (key: string, data: any) => {
  localStorage.setItem(`pingpong_pro_${key}`, JSON.stringify(data));
};

let mockDb = {
  clubs: getLocalData('clubs', CLUBS),
  players: getLocalData('players', INITIAL_PLAYERS),
  services: getLocalData('services', INITIAL_SERVICES),
  sessions: getLocalData('sessions', []),
  expenses: getLocalData('expenses', []),
  membershipPayments: getLocalData('membership', [])
};

const syncDb = () => {
  Object.keys(mockDb).forEach(key => saveLocalData(key, (mockDb as any)[key]));
};

/**
 * Enhanced apiFetch with Mock Fallback.
 */
async function apiFetch(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<any> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `/api/${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json', 
        ...options.headers 
      },
    });

    if (response.status === 404 || response.status >= 500) {
      throw new Error(`BACKEND_OFFLINE:${response.status}`);
    }

    const text = await response.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch (parseError) {
      throw new Error('BACKEND_OFFLINE:InvalidJSON');
    }
  } catch (error: any) {
    const isOffline = 
      error.message?.startsWith('BACKEND_OFFLINE') || 
      error.name === 'TypeError' || 
      error.name === 'SyntaxError';
    
    if (isOffline) {
      return new Promise((resolve, reject) => {
        try {
          const result = handleMockRequest(cleanEndpoint, options);
          resolve(result);
        } catch (mockError) {
          reject(mockError);
        }
      });
    }

    if (retryCount < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, INITIAL_BACKOFF * (retryCount + 1)));
      return apiFetch(endpoint, options, retryCount + 1);
    }
    throw error;
  }
}

function handleMockRequest(endpoint: string, options: RequestInit): any {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body as string) : null;

  if (endpoint === 'health') return { status: 'online', mode: 'demo' };
  
  if (endpoint === 'auth/login') {
    if (body.username === '__check__') throw new Error("Check connection");
    
    const club = mockDb.clubs.find((c: Club) => c.username === body.username && c.password === body.password);
    if (!club) throw new Error("Tài khoản hoặc mật khẩu không đúng.");
    return club;
  }

  if (endpoint.startsWith('players')) {
    if (method === 'GET') return mockDb.players;
    if (method === 'POST') {
      const newPlayer = { ...body, id: `p-${Date.now()}`, createdAt: new Date().toISOString() };
      mockDb.players = [newPlayer, ...mockDb.players];
      syncDb();
      return newPlayer;
    }
  }

  if (endpoint.startsWith('services')) {
    if (method === 'GET') return mockDb.services;
    if (method === 'POST') {
      const newService = { ...body, id: `s-${Date.now()}` };
      mockDb.services = [...mockDb.services, newService];
      syncDb();
      return newService;
    }
  }

  if (endpoint.startsWith('sessions')) {
    if (endpoint === 'sessions/checkin' && method === 'POST') {
      const newSession: Session = {
        id: `sess-${Date.now()}`,
        clubId: body.clubId,
        playerId: body.playerId,
        checkInTime: new Date().toISOString(),
        status: SessionStatus.PLAYING,
        totalAmount: 0
      };
      mockDb.sessions = [newSession, ...mockDb.sessions];
      syncDb();
      return newSession;
    }
    if (endpoint.includes('/checkout') && method === 'POST') {
      const id = endpoint.split('/')[1];
      mockDb.sessions = mockDb.sessions.map((s: Session) => 
        s.id === id ? { ...s, status: SessionStatus.FINISHED, totalAmount: body.totalAmount, checkOutTime: new Date().toISOString() } : s
      );
      syncDb();
      return mockDb.sessions.find((s: Session) => s.id === id);
    }
    return mockDb.sessions;
  }

  if (endpoint.startsWith('expenses')) {
    if (method === 'GET') return mockDb.expenses;
    if (method === 'POST') {
      const newExp = { ...body, id: `exp-${Date.now()}` };
      mockDb.expenses = [newExp, ...mockDb.expenses];
      syncDb();
      return newExp;
    }
  }

  return [];
}

export const API = {
  auth: {
    login: (username: string, pass: string) => 
      apiFetch('auth/login', { 
        method: 'POST', 
        body: JSON.stringify({ username, password: pass }) 
      }),
  },
  clubs: {
    list: () => apiFetch('clubs'),
    create: (data: any) => apiFetch('clubs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch(`clubs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => apiFetch(`clubs/${id}`, { method: 'DELETE' }),
  },
  players: {
    list: (clubId: string) => apiFetch(`players?clubId=${clubId || ''}`),
    create: (data: any) => apiFetch('players', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch(`players/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  services: {
    list: (clubId: string) => apiFetch(`services?clubId=${clubId || ''}`),
    create: (data: any) => apiFetch('services', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Service>) => apiFetch(`services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  sessions: {
    list: (clubId: string) => apiFetch(`sessions?clubId=${clubId || ''}`),
    checkIn: (clubId: string, playerId: string) => 
      apiFetch('sessions/checkin', { method: 'POST', body: JSON.stringify({ clubId, playerId }) }),
    addService: (sessionId: string, data: any) => 
      apiFetch(`sessions/${sessionId}/services`, { method: 'POST', body: JSON.stringify(data) }),
    checkOut: (id: string, totalAmount: number) => 
      apiFetch(`sessions/${id}/checkout`, { method: 'POST', body: JSON.stringify({ totalAmount }) }),
  },
  expenses: {
    list: (clubId: string) => apiFetch(`expenses?clubId=${clubId || ''}`),
    create: (data: any) => apiFetch('expenses', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id: string) => apiFetch(`expenses/${id}`, { method: 'DELETE' }),
  },
  membership: {
    create: (data: any) => apiFetch('membership-payments', { method: 'POST', body: JSON.stringify(data) }),
  }
};
