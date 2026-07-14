import { UserPlus, Search, Filter, Edit2, Trash2, History, X, Upload, Camera } from 'lucide-react';
import { useState, useRef } from 'react';
import { useApp, ADMIN_USER_ID } from '../context/AppContext';
const priorityColors: Record<number, string> = {
  1: 'bg-slate-500 text-slate-100',
  2: 'bg-emerald-500 text-emerald-100',
  3: 'bg-yellow-500 text-yellow-100',
  4: 'bg-orange-500 text-orange-100',
  5: 'bg-red-500 text-red-100',
};

const priorityLabels: Record<number, string> = {
  1: 'Very Low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Critical',
};

export default function Users() {
  const { users, messages, addUser, editUser, deleteUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<number | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  // Edit modal
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History modal
  const [historyUserId, setHistoryUserId] = useState<string | null>(null);

  // Delete confirmation
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const [showAddUser, setShowAddUser] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhoto, setNewPhoto] = useState<string | undefined>(undefined);
  const newFileInputRef = useRef<HTMLInputElement>(null);

  // Enrich users with computed data
  const { getRelationshipScore } = useApp();
  const enrichedUsers = users.map(u => {
    const score = getRelationshipScore(u.id);
    const sent = messages.filter(m => m.sender === u.id).length;
    const received = messages.filter(m => m.receiver === u.id).length;
    return { ...u, score, sent, received };
  });

  const filtered = enrichedUsers.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPriority = filterPriority === null || u.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  const openEdit = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    setEditingUser(userId);
    setEditName(user.name);
    setEditPhoto(user.photo);
  };

  const saveEdit = () => {
    if (!editingUser) return;
    editUser(editingUser, { name: editName, photo: editPhoto });
    setEditingUser(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isNew = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (isNew) setNewPhoto(result);
      else setEditPhoto(result);
    };
    reader.readAsDataURL(file);
  };

  const confirmDelete = () => {
    if (!deleteUserId) return;
    deleteUser(deleteUserId);
    setDeleteUserId(null);
  };

  const handleAddUser = () => {
    if (!newName.trim()) return;
    addUser(newName.trim(), newPhoto);
    setNewName('');
    setNewPhoto(undefined);
    setShowAddUser(false);
  };

  // History entries for a user
  const getHistoryEntries = (userId: string) => {
    const userMsgs = messages.filter(m => m.sender === userId || m.receiver === userId);
    return userMsgs.slice(0, 8).map(m => ({
      time: m.time,
      action: m.sender === userId ? 'Message sent' : 'Message received',
      detail: `${m.sender === userId ? 'To' : 'From'} ${users.find(u => u.id === (m.sender === userId ? m.receiver : m.sender))?.name || 'Unknown'}: "${m.content}"`,
    }));
  };

  const editingUserData = editingUser ? users.find(u => u.id === editingUser) : null;
  const historyUser = historyUserId ? users.find(u => u.id === historyUserId) : null;
  const deleteUserData = deleteUserId ? users.find(u => u.id === deleteUserId) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">User Management</h1>
          <p className="text-slate-400 mt-1">Manage nodes and their base priority levels</p>
        </div>
        <button onClick={() => setShowAddUser(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/20">
          <UserPlus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search users by name or ID..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/50 border border-glass-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
        </div>
        <div className="relative">
          <button onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 px-4 py-2.5 glass-panel hover:bg-slate-800 transition-colors rounded-lg text-sm font-medium ${filterPriority !== null ? 'text-blue-400 border-blue-500/30' : 'text-slate-300'}`}>
            <Filter className="w-4 h-4" />
            {filterPriority !== null ? `Priority ${filterPriority}` : 'Filter by Priority'}
          </button>
          {showFilter && (
            <div className="absolute right-0 top-12 z-50 glass-panel rounded-lg p-2 min-w-[180px] shadow-xl shadow-black/30">
              <button onClick={() => { setFilterPriority(null); setShowFilter(false); }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${filterPriority === null ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'}`}>
                All Priorities
              </button>
              {[5, 4, 3, 2, 1].map(p => (
                <button key={p} onClick={() => { setFilterPriority(p); setShowFilter(false); }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${filterPriority === p ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'}`}>
                  <span className={`w-2 h-2 rounded-full ${priorityColors[p].split(' ')[0]}`} />
                  P{p} — {priorityLabels[p]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(user => (
          <div key={user.id} className="glass-card p-5 group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-lg font-bold border border-slate-600 overflow-hidden">
                  {user.photo ? (
                    <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.split(' ').map(n => n[0]).join('')
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-200">{user.name}</h3>
                  <span className="text-xs text-slate-400">ID: {user.id.replace('u', '').padStart(4, '0')}</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.id === ADMIN_USER_ID ? 'bg-blue-500 text-blue-100' : priorityColors[user.priority!]}`}>
                {user.id === ADMIN_USER_ID ? 'ROOT' : `P${user.priority}`}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5 pb-5 border-b border-glass-border">
              <div>
                <p className="text-xs text-slate-400 mb-1">Sent</p>
                <p className="font-semibold text-slate-200">{user.sent}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Received</p>
                <p className="font-semibold text-slate-200">{user.received}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Relationship</p>
                <p className="font-semibold text-white">{user.score}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => openEdit(user.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-md transition-colors">
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              <button onClick={() => setHistoryUserId(user.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-md transition-colors">
                <History className="w-4 h-4" /> History
              </button>
              <button onClick={() => setDeleteUserId(user.id)}
                className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-md transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No users found</p>
          <p className="text-sm mt-1">Try adjusting your search or filter</p>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && editingUserData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditingUser(null)}>
          <div className="glass-panel rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-50">Edit User</h2>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-200 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col items-center mb-6">
              <div onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold border-2 border-dashed border-slate-500 hover:border-blue-500 cursor-pointer transition-colors overflow-hidden relative group">
                {editPhoto ? (<img src={editPhoto} alt="avatar" className="w-full h-full object-cover" />) : (editingUserData.name.split(' ').map(n => n[0]).join(''))}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="w-6 h-6 text-white" /></div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e)} />
              <div className="flex items-center gap-3 mt-2">
                <button onClick={() => fileInputRef.current?.click()} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"><Upload className="w-3 h-3" /> Upload Photo</button>
                {editPhoto && (<button onClick={() => setEditPhoto(undefined)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"><X className="w-3 h-3" /> Remove Photo</button>)}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-800/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Priority Level</label>
                <p className="text-sm text-slate-500">Priority is managed automatically based on Relationship Score.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingUser(null)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors">Cancel</button>
              <button onClick={saveEdit} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyUserId && historyUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setHistoryUserId(null)}>
          <div className="glass-panel rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-50">History — {historyUser.name}</h2>
              <button onClick={() => setHistoryUserId(null)} className="text-slate-400 hover:text-slate-200 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
              {getHistoryEntries(historyUserId).length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No activity yet.</p>
              ) : (
                getHistoryEntries(historyUserId).map((entry, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5" />
                      {i < getHistoryEntries(historyUserId).length - 1 && <div className="w-0.5 flex-1 bg-slate-700 mt-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-slate-200">{entry.action}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{entry.detail}</p>
                      <p className="text-xs text-slate-600 mt-1">{entry.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setHistoryUserId(null)} className="w-full mt-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors">Close</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteUserId && deleteUserData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteUserId(null)}>
          <div className="glass-panel rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mb-4"><Trash2 className="w-7 h-7 text-red-400" /></div>
              <h2 className="text-xl font-bold text-slate-50 mb-2">Delete User</h2>
              <p className="text-slate-400 text-sm">
                Are you sure you want to remove <span className="text-white font-medium">{deleteUserData.name}</span> from the network? This will also delete all their messages.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteUserId(null)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-red-500/20">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddUser(false)}>
          <div className="glass-panel rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-50">Add New User</h2>
              <button onClick={() => setShowAddUser(false)} className="text-slate-400 hover:text-slate-200 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col items-center mb-6">
              <div onClick={() => newFileInputRef.current?.click()}
                className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center border-2 border-dashed border-slate-500 hover:border-blue-500 cursor-pointer transition-colors overflow-hidden relative group">
                {newPhoto ? (<img src={newPhoto} alt="avatar" className="w-full h-full object-cover" />) : (<Camera className="w-8 h-8 text-slate-500" />)}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="w-6 h-6 text-white" /></div>
              </div>
              <input ref={newFileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, true)} />
              <button onClick={() => newFileInputRef.current?.click()} className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"><Upload className="w-3 h-3" /> Upload Photo</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Name</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Enter user name..."
                  className="w-full bg-slate-800/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Priority Level</label>
                <p className="text-sm text-slate-500">New users start at P1.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddUser(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors">Cancel</button>
              <button onClick={handleAddUser} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20">Add User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
