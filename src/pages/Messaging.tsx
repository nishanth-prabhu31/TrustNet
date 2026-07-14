import { useState } from 'react';
import { Send, MessageSquare, ArrowUpRight, Zap, Trophy, ShieldCheck, Flag } from 'lucide-react';
import { useApp, ADMIN_USER_ID, PRIORITY_COLORS } from '../context/AppContext';

export default function Messaging() {
  const { users, messages, sendMessage, flagMessage, getRelationshipScore } = useApp();
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [content, setContent] = useState('');
  const [msgType, setMsgType] = useState<'NORMAL' | 'URGENT' | 'ALERT'>('NORMAL');
  const [sendSuccess, setSendSuccess] = useState(false);

  const handleSend = () => {
    if (!sender || !receiver || !content.trim()) return;
    sendMessage(sender, receiver, content.trim(), msgType);
    setContent('');
    setSendSuccess(true);
    setTimeout(() => setSendSuccess(false), 2000);
  };

  // Stats
  const totalMessages = messages.length;
  const adminInteractions = messages.filter(m => m.sender === ADMIN_USER_ID || m.receiver === ADMIN_USER_ID).length;
  const urgentMessages = messages.filter(m => m.type !== 'NORMAL').length;

  // Per-user message counts & scores
  const userMsgCounts = users.filter(u => u.id !== ADMIN_USER_ID).map(u => ({
    ...u,
    sent: messages.filter(m => m.sender === u.id).length,
    received: messages.filter(m => m.receiver === u.id).length,
    relationshipScore: getRelationshipScore(u.id),
  })).sort((a, b) => b.relationshipScore - a.relationshipScore);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Instant Messaging</h1>
        <p className="text-slate-400 mt-1">Direct communication with instantaneous delivery. Interactions with Admin directly boost Priority.</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400"><MessageSquare className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Total Messages</p>
            <p className="text-xl font-bold text-white">{totalMessages}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400"><ShieldCheck className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Admin Interactions</p>
            <p className="text-xl font-bold text-white">{adminInteractions}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-400"><Zap className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Alerts / Urgent</p>
            <p className="text-xl font-bold text-white">{urgentMessages}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Panel */}
        <div className="glass-panel p-6 space-y-5">
          <h2 className="font-bold text-slate-200 flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-400" /> Compose Message
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Sender</label>
              <select value={sender} onChange={e => setSender(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                <option value="">Select sender...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.id === ADMIN_USER_ID ? '(Root Admin)' : `(P${u.priority})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Receiver</label>
              <select value={receiver} onChange={e => setReceiver(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                <option value="">Select receiver...</option>
                {users.filter(u => u.id !== sender).map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.id === ADMIN_USER_ID ? '(Root Admin)' : `(P${u.priority})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Message Type</label>
              <select value={msgType} onChange={e => setMsgType(e.target.value as any)}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                <option value="NORMAL">Normal</option>
                <option value="URGENT">Urgent</option>
                <option value="ALERT">Alert</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Content</label>
              <textarea value={content} onChange={e => setContent(e.target.value)}
                rows={3} placeholder="Type your message..."
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" />
            </div>

            <button onClick={handleSend} disabled={!sender || !receiver || !content.trim()}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg transition-all shadow-lg ${
                sendSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white shadow-blue-500/20'
              }`}>
              <Send className="w-4 h-4" /> {sendSuccess ? '✓ Delivered Instantly!' : 'Send Message'}
            </button>

            {/* Hint Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-slate-300">
              <span className="font-bold text-blue-400">Pro Tip:</span> Sending messages directly to or receiving from Nirmith (Admin) instantly increases a node's Relationship Score and Priority Level.
            </div>
          </div>

          {/* User Score Tracking */}
          <div className="border-t border-glass-border pt-4">
            <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" /> Admin Relationship Scores
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {userMsgCounts.map(u => (
                <div key={u.id} className="flex items-center gap-2 text-xs p-2 rounded-md bg-slate-800/30">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ backgroundColor: u.color + '30', color: u.color }}>
                    {u.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="flex-1 text-slate-300 truncate">{u.name.split(' ')[0]}</span>
                  <span className="text-slate-400 font-mono">Score: {u.relationshipScore}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                    style={{ backgroundColor: PRIORITY_COLORS[u.priority!] + '30', color: PRIORITY_COLORS[u.priority!] }}>
                    P{u.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Message History */}
        <div className="lg:col-span-2 glass-panel p-6 overflow-hidden flex flex-col">
          <h2 className="font-bold text-slate-200 flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-blue-400" /> Delivery History ({messages.length})
          </h2>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-700/50">
                  <th className="py-3 px-2">Time</th>
                  <th className="py-3 px-2">Sender → Receiver</th>
                  <th className="py-3 px-2 w-1/2">Content</th>
                  <th className="py-3 px-2 text-right">Type</th>
                  <th className="py-3 px-2 text-right">Flag</th>
                </tr>
              </thead>
              <tbody>
                {messages.map(msg => {
                  const sUser = users.find(u => u.id === msg.sender);
                  const rUser = users.find(u => u.id === msg.receiver);
                  const isWithAdmin = msg.sender === ADMIN_USER_ID || msg.receiver === ADMIN_USER_ID;

                  return (
                    <tr key={msg.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${isWithAdmin ? 'bg-blue-500/5' : ''}`}>
                      <td className="py-3 px-2 text-slate-400 font-mono text-xs">{msg.time}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <span className={sUser?.id === ADMIN_USER_ID ? 'text-blue-400 font-bold' : 'text-slate-200'}>
                            {sUser?.name?.split(' ')[0]}
                          </span>
                          <ArrowUpRight className="w-3 h-3 text-slate-500" />
                          <span className={rUser?.id === ADMIN_USER_ID ? 'text-blue-400 font-bold' : 'text-slate-200'}>
                            {rUser?.name?.split(' ')[0]}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-slate-300 max-w-[200px] truncate">{msg.content}</td>
                      <td className="py-3 px-2 text-right">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          msg.type === 'ALERT' ? 'text-red-400 bg-red-400/10' :
                          msg.type === 'URGENT' ? 'text-orange-400 bg-orange-400/10' :
                          'text-slate-400 bg-slate-400/10'
                        }`}>{msg.type}</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button onClick={() => flagMessage(msg.id)} disabled={msg.flagged}
                          title={msg.flagged ? 'Flagged — sender penalized' : 'Flag as spam/malicious (−15 trust to sender)'}
                          className={`p-1.5 rounded-md transition-colors ${
                            msg.flagged
                              ? 'text-red-400 bg-red-400/10 cursor-not-allowed'
                              : 'text-slate-500 hover:text-red-400 hover:bg-red-400/10'
                          }`}>
                          <Flag className="w-3.5 h-3.5" fill={msg.flagged ? 'currentColor' : 'none'} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {messages.length === 0 && (
              <div className="h-48 flex flex-col items-center justify-center text-slate-500">
                <MessageSquare className="w-10 h-10 mb-3 opacity-50" />
                <p className="text-sm">No messages yet. Send one to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
