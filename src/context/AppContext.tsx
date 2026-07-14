import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import { USERS as SEED_USERS, TRUST_DATA as SEED_TRUST, MESSAGES as SEED_MESSAGES, ADMIN_USER_ID } from '../data/mockData';

// ── Types ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  priority: number | null; // Admin has null priority
  color: string;
  photo?: string;
}

export interface Message {
  id: string;
  sender: string;
  receiver: string;
  content: string;
  type: 'NORMAL' | 'URGENT' | 'ALERT';
  time: string;
  flagged?: boolean;
}

export interface TrustEdge {
  score: number;
  comms: number;
  history: number[];
}

export type TrustMap = Record<string, Record<string, TrustEdge>>;

// ── Priority Scoring Rules ───────────────────────────────────────────────────
const PRIORITY_THRESHOLDS = [
  { min: 80, priority: 5 },
  { min: 60, priority: 4 },
  { min: 40, priority: 3 },
  { min: 20, priority: 2 },
  { min: 0,  priority: 1 },
];

const PRIORITY_COLORS: Record<number, string> = {
  1: '#64748B', 2: '#10B981', 3: '#EAB308', 4: '#F97316', 5: '#EF4444',
};

const ADMIN_COLOR = '#3B82F6'; // Special color for admin

// Relationship score is now computed dynamically inside the provider

export function scoreToPriority(score: number): number {
  for (const t of PRIORITY_THRESHOLDS) {
    if (score >= t.min) return t.priority;
  }
  return 1;
}

// ── Trust Model v2 ───────────────────────────────────────────────────────────
// score = decay(oldScore) + qualityWeight(direction) × saturation(currentScore) − penalties
// Design rationale: MASTER.md §9 (decay = EMA aging, saturation = anti-spam,
// direction weight = admin engagement is worth more than messaging the admin).
export const DECAY_FACTOR = 0.95;        // per simulated "day"
export const DECAY_INTERVAL_MS = 60_000; // 1 simulated day = 60s of app runtime
export const FLAG_PENALTY = 15;

export function gainPerMessage(sender: string, receiver: string, currentScore: number): number {
  const base = sender === ADMIN_USER_ID ? 8 : receiver === ADMIN_USER_ID ? 2 : 4;
  return base / (1 + currentScore / 20);
}

// ── Seed data conversion ─────────────────────────────────────────────────────
function seedUsers(): User[] {
  // Return base users, priority will be calculated dynamically
  return SEED_USERS.map(u => ({ 
    ...u, 
    priority: u.id === ADMIN_USER_ID ? null : u.priority, 
    color: u.id === ADMIN_USER_ID ? ADMIN_COLOR : u.color 
  }));
}

function seedMessages(): Message[] {
  // Strip out old properties like status, origPriority, etc.
  return SEED_MESSAGES.map(m => ({
    id: m.id,
    sender: m.sender,
    receiver: m.receiver,
    content: m.content,
    type: m.type as Message['type'],
    time: m.time,
  }));
}

function seedTrust(): TrustMap {
  const t: TrustMap = {};
  for (const [src, edges] of Object.entries(SEED_TRUST)) {
    t[src] = {};
    for (const [tgt, data] of Object.entries(edges)) {
      t[src][tgt] = { ...data };
    }
  }
  return t;
}

// ── Context Shape ────────────────────────────────────────────────────────────
interface AppState {
  users: User[];
  messages: Message[];
  trustData: TrustMap;

  addUser: (name: string, photo?: string) => void;
  editUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  sendMessage: (sender: string, receiver: string, content: string, type: 'NORMAL' | 'URGENT' | 'ALERT') => void;
  flagMessage: (msgId: string) => void;
  getRelationshipScore: (userId: string) => number;
}

const AppContext = createContext<AppState | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage or fallback to seed data
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('trustnet_users');
    return saved ? JSON.parse(saved) : seedUsers();
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('trustnet_messages');
    return saved ? JSON.parse(saved) : seedMessages();
  });
  const [trustData, setTrustData] = useState<TrustMap>(() => {
    const saved = localStorage.getItem('trustnet_trust');
    return saved ? JSON.parse(saved) : seedTrust();
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('trustnet_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('trustnet_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('trustnet_trust', JSON.stringify(trustData));
  }, [trustData]);

  const getRelationshipScore = useCallback((userId: string) => {
    if (userId === ADMIN_USER_ID) return 100;
    const toUser = trustData[ADMIN_USER_ID]?.[userId]?.score || 0;
    const fromUser = trustData[userId]?.[ADMIN_USER_ID]?.score || 0;
    return Math.round(Math.max(toUser, fromUser));
  }, [trustData]);

  // Trust decay: every simulated "day" all trust edges lose 5% (exponential aging).
  useEffect(() => {
    const id = setInterval(() => {
      setTrustData(prev => {
        const next: TrustMap = {};
        for (const [src, edges] of Object.entries(prev)) {
          next[src] = {};
          for (const [tgt, e] of Object.entries(edges)) {
            next[src][tgt] = { ...e, score: +(e.score * DECAY_FACTOR).toFixed(1) };
          }
        }
        return next;
      });
    }, DECAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // Dynamically enrich users with their current priority
  const enrichedUsers = useMemo(() => {
    return users.map(u => {
      if (u.id === ADMIN_USER_ID) return u;
      const score = getRelationshipScore(u.id);
      const prio = scoreToPriority(score);
      return { ...u, priority: prio, color: PRIORITY_COLORS[prio] };
    });
  }, [users, getRelationshipScore]);

  const updateTrust = useCallback((a: string, b: string) => {
    setTrustData(prev => {
      const next = { ...prev };
      if (!next[a]) next[a] = {};
      
      // Deep copy to prevent state mutation bugs
      const nextA = { ...next[a] };
      if (!nextA[b]) nextA[b] = { score: 0, comms: 0, history: [] };
      
      const edge = { ...nextA[b] };
      edge.comms += 1;
      // Diminishing returns: the 1st message is worth ~base points, the 50th almost nothing.
      edge.score = Math.min(100, +(edge.score + gainPerMessage(a, b, edge.score)).toFixed(1));
      edge.history = [...edge.history, edge.score].slice(-10);
      
      nextA[b] = edge;
      next[a] = nextA;
      
      return next;
    });
  }, []);

  const addUser = useCallback((name: string, photo?: string) => {
    const id = `u${Date.now()}`;
    const newUser: User = {
      id, name,
      priority: 1, // New users start at lowest priority
      color: PRIORITY_COLORS[1],
      photo,
    };
    setUsers(prev => [...prev, newUser]);
  }, []);

  const editUser = useCallback((id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== id) return u;
      return { ...u, ...updates };
    }));
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    setMessages(prev => prev.filter(m => m.sender !== id && m.receiver !== id));
  }, []);

  const sendMessage = useCallback((sender: string, receiver: string, content: string, type: 'NORMAL' | 'URGENT' | 'ALERT') => {
    setMessages(currentMsgs => {
      const newMsg: Message = {
        id: `m${Date.now()}`,
        sender, receiver, content, type,
        time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      };

      const updatedMsgs = [newMsg, ...currentMsgs];

      return updatedMsgs;
    });

    updateTrust(sender, receiver);
  }, [updateTrust]);

  // Flagging a message as spam/malicious costs the sender trust with the receiver.
  const flagMessage = useCallback((msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || msg.flagged) return;
    setMessages(prev => prev.map(m => (m.id === msgId ? { ...m, flagged: true } : m)));
    setTrustData(prev => {
      const edge = prev[msg.sender]?.[msg.receiver];
      if (!edge) return prev;
      const penalized = Math.max(0, +(edge.score - FLAG_PENALTY).toFixed(1));
      return {
        ...prev,
        [msg.sender]: {
          ...prev[msg.sender],
          [msg.receiver]: { ...edge, score: penalized, history: [...edge.history, penalized].slice(-10) },
        },
      };
    });
  }, [messages]);

  return (
    <AppContext.Provider value={{
      users: enrichedUsers, messages, trustData,
      addUser, editUser, deleteUser,
      sendMessage, flagMessage, getRelationshipScore,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Re-export constants
export { PRIORITY_COLORS, PRIORITY_THRESHOLDS, ADMIN_USER_ID, ADMIN_COLOR };
