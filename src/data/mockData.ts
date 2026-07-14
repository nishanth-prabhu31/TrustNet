// Shared mock data used across all pages
// 'admin' is the current logged-in user (Nirmith Shetty)
export const ADMIN_USER_ID = 'admin';

export const USERS = [
  { id: 'admin', name: 'Nirmith Shetty', priority: 3, color: '#3B82F6' },
  { id: 'u1', name: 'Alice Smith',    priority: 5, color: '#EF4444' },
  { id: 'u2', name: 'Bob Johnson',    priority: 2, color: '#10B981' },
  { id: 'u3', name: 'Charlie Davis',  priority: 1, color: '#64748B' },
  { id: 'u4', name: 'Diana Prince',   priority: 4, color: '#F97316' },
  { id: 'u5', name: 'Evan Wright',    priority: 3, color: '#EAB308' },
  { id: 'u6', name: 'Fiona Gallagher',priority: 5, color: '#EF4444' },
  { id: 'u7', name: 'George Miller',  priority: 2, color: '#10B981' },
  { id: 'u8', name: 'Hannah Lee',     priority: 4, color: '#F97316' },
];

export const TRUST_DATA: Record<string, Record<string, { score: number; comms: number; history: number[] }>> = {
  admin: {
    u1: { score: 82, comms: 130, history: [15,30,45,55,65,72,78,82] },
    u2: { score: 68, comms: 95,  history: [10,20,35,45,52,58,63,68] },
    u4: { score: 55, comms: 70,  history: [8,15,25,35,42,48,52,55] },
    u6: { score: 90, comms: 195, history: [25,40,55,68,75,82,87,90] },
  },
  u1: { u2: { score: 87, comms: 142, history: [20,35,50,60,70,80,85,87] },
        u4: { score: 62, comms: 89,  history: [10,20,30,40,50,55,60,62] },
        u6: { score: 95, comms: 210, history: [30,50,65,75,82,88,92,95] } },
  u2: { u3: { score: 44, comms: 55,  history: [5,10,20,28,35,38,41,44] },
        u5: { score: 71, comms: 113, history: [15,25,40,52,60,65,68,71] } },
  u4: { u5: { score: 58, comms: 76,  history: [8,18,30,40,48,52,55,58] },
        u8: { score: 79, comms: 128, history: [20,30,45,56,65,70,75,79] } },
  u7: { u2: { score: 65, comms: 90,  history: [10,20,30,40,50,55,60,65] },
        admin: { score: 50, comms: 40, history: [5,10,15,25,35,40,45,50] } },
};

export const MESSAGES = [
  { id: 'm1', sender: 'admin', receiver: 'u1', content: 'Hey Alice, please review my proposal.', type: 'NORMAL', time: '19:25:00' },
  { id: 'm2', sender: 'admin', receiver: 'u2', content: 'Bob, meeting at 3PM today.', type: 'URGENT', time: '19:26:30' },
  { id: 'm3', sender: 'admin', receiver: 'u6', content: 'Fiona, project report is ready.', type: 'NORMAL', time: '19:27:00' },
  { id: 'm4', sender: 'u1',    receiver: 'admin', content: 'Proposal looks good, approved!', type: 'NORMAL', time: '19:28:11' },
  { id: 'm5', sender: 'u3',    receiver: 'u1', content: 'Can you review my proposal?', type: 'NORMAL', time: '19:28:11' },
  { id: 'm6', sender: 'u2',    receiver: 'u8', content: 'Meeting at 3PM confirmed.', type: 'URGENT', time: '19:29:45' },
  { id: 'm7', sender: 'u5',    receiver: 'u4', content: 'System alert: CPU at 90%.', type: 'ALERT', time: '19:31:02' },
  { id: 'm8', sender: 'admin', receiver: 'u4', content: 'Diana, can you check the deployment?', type: 'ALERT', time: '19:32:00' },
  { id: 'm9', sender: 'u7',    receiver: 'admin', content: 'Urgent: Server down!', type: 'ALERT', time: '19:27:10' },
  { id: 'm10', sender: 'u6',   receiver: 'admin', content: 'Report feedback attached.', type: 'NORMAL', time: '19:33:00' },
];

export const priorityColors: Record<number, string> = {
  1: '#64748B', 2: '#10B981', 3: '#EAB308', 4: '#F97316', 5: '#EF4444',
};

