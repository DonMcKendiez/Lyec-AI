import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  LayoutGrid, 
  Megaphone, 
  Users, 
  Settings, 
  Database, 
  Puzzle, 
  Globe, 
  ShieldCheck, 
  ChevronRight,
  TrendingUp,
  FileText,
  Activity,
  Key,
  LogOut,
  Bell,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Camera
} from 'lucide-react';
import { 
  getShowcaseItems, 
  addShowcaseItem, 
  updateShowcaseItem, 
  deleteShowcaseItem, 
  ShowcaseItem 
} from '../services/showcaseService';
import { 
  getAnnouncements, 
  addAnnouncement, 
  deleteAnnouncement, 
  Announcement 
} from '../services/announcementService';
import { 
  getAdmins, 
  addAdmin, 
  removeAdmin, 
  transferOwnership, 
  AdminUser,
  getExtensions,
  getIntegrations,
  Extension,
  Integration,
  updateAdminRole
} from '../services/adminService';
import { 
  getAllUserProfiles, 
  deregisterUser 
} from '../services/userService';
import { motion, AnimatePresence } from 'motion/react';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth, UserProfile } from '../contexts/AuthContext';
import Logo from './Logo';

type AdminTab = 'dashboard' | 'posts' | 'announcements' | 'users' | 'plugins' | 'apis' | 'settings';

const OWNER_EMAIL = 'donmckenz20@gmail.com';

export default function AdminPanel() {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<ShowcaseItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  
  // UI State
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const currentUserRole = admins.find(a => a.uid === user?.uid)?.role || (user?.email === OWNER_EMAIL ? 'owner' : null);
  const isOwner = currentUserRole === 'owner';

  useEffect(() => {
    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [adm, pst, ann, ext, int, usr] = await Promise.all([
        getAdmins(),
        getShowcaseItems(),
        getAnnouncements(),
        getExtensions(),
        getIntegrations(),
        getAllUserProfiles()
      ]);
      
      setAdmins(adm);
      setPosts(pst);
      setAnnouncements(ann);
      setExtensions(ext);
      setIntegrations(int);
      setAllUsers(usr);

      // Self-provision if owner email matches but not in list
      if (user?.email === OWNER_EMAIL && !adm.find(a => a.uid === user.uid)) {
        await addAdmin({
          uid: user.uid,
          email: user.email,
          role: 'owner',
          displayName: user.displayName || 'Primary Archivist'
        });
        const updatedAdm = await getAdmins();
        setAdmins(updatedAdm);
      }
    } catch (error) {
      console.error("Load failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferOwnership = async (newOwnerUid: string) => {
    if (!user || !isOwner) return;
    if (!confirm("HEIRLOOM TRANSFER: Are you sure you want to transfer primary ownership? You will lose root privileges.")) return;
    
    try {
      await transferOwnership(user.uid, newOwnerUid);
      notify("Ownership Transferred", "A new Primary Archivist has been designated.", "warning");
      loadAllData();
    } catch (error) {
       notify("Transfer Failed", "The archival succession was interrupted.", "warning");
    }
  };

  const handleDeregisterUser = async (uid: string) => {
    if (!confirm("Wipe this person from the archives? Their XP, progress, and profile will be permanently deleted.")) return;
    try {
      await deregisterUser(uid);
      notify("Identity Expelled", "The user's heritage archive has been removed.", "info");
      loadAllData();
    } catch (error) {
      notify("Deletion Failed", "Could not remove the archivist's record.", "warning");
    }
  };

  const renderSidebar = () => (
    <aside className="w-64 bg-brand-text text-white flex flex-col h-full overflow-y-auto border-r border-white/5">
      <div className="p-8 flex items-center gap-3">
        <Logo size={32} />
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Command</span>
          <span className="text-sm font-display italic font-black">Archive Manager</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-1">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid className="w-4 h-4" /> },
          { id: 'posts', label: 'Heritage Posts', icon: <FileText className="w-4 h-4" /> },
          { id: 'announcements', label: 'Radio Dispatches', icon: <Megaphone className="w-4 h-4" /> },
          { id: 'users', label: 'Archivists', icon: <Users className="w-4 h-4" /> },
          { id: 'plugins', label: 'Archive Plugins', icon: <Puzzle className="w-4 h-4" /> },
          { id: 'apis', label: 'Vault APIs', icon: <Globe className="w-4 h-4" /> },
          { id: 'settings', label: 'System Settings', icon: <Settings className="w-4 h-4" /> },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as AdminTab)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-black uppercase tracking-widest text-[9px] ${
              activeTab === item.id 
                ? 'bg-brand-primary text-brand-text shadow-lg shadow-brand-primary/10' 
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5 space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-black uppercase">
            {user?.email?.charAt(0)}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[9px] font-black uppercase tracking-widest text-white truncate">{user?.displayName || 'User'}</span>
            <span className="text-[8px] font-bold text-stone-500 uppercase tracking-widest">{currentUserRole}</span>
          </div>
        </div>
      </div>
    </aside>
  );

  const renderDashboard = () => (
    <div className="space-y-8 p-10 animate-in fade-in slide-in-from-bottom-4">
      <header>
        <h2 className="text-4xl font-display italic font-black text-brand-text tracking-tighter">Archivist Overview</h2>
        <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">Health & Vital Signs of the Heritage Cloud</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Artifacts', value: posts.length, icon: <FileText className="w-5 h-5" />, color: 'bg-emerald-500' },
          { label: 'Broadcasts', value: announcements.length, icon: <Megaphone className="w-5 h-5" />, color: 'bg-indigo-500' },
          { label: 'Guardians', value: admins.length, icon: <Users className="w-5 h-5" />, color: 'bg-amber-500' },
          { label: 'API Health', value: '100%', icon: <Activity className="w-5 h-5" />, color: 'bg-brand-primary' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.color} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{stat.label}</p>
              <p className="text-2xl font-black text-brand-text">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 text-left">
        <div className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-brand-text">Recent Transmissions</h3>
            <button className="text-[10px] font-black uppercase tracking-widest text-brand-primary">View Radio</button>
          </div>
          <div className="space-y-4">
            {announcements.slice(0, 3).map((ann, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-stone-300">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-brand-text">{ann.title}</p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest">{new Date(ann.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-brand-text p-8 rounded-[3rem] shadow-xl text-white space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
             <ShieldCheck className="w-32 h-32" />
          </div>
          <div className="relative z-10 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-[0.2em]">Archival Security</h3>
            <p className="text-white/60 text-xs font-medium leading-relaxed">
              Global RBAC is active. Currently monitoring heritage access for all archivists. Ensure your credentials are rotated quarterly.
            </p>
            <div className="flex gap-3">
              <div className="px-4 py-2 bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest">TLS 1.3 Active</div>
              <div className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl text-[9px] font-black uppercase tracking-widest">WAF Shield On</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="p-10 space-y-8 text-left animate-in fade-in">
       <header className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-display italic font-black text-brand-text tracking-tighter">Archivist Registry</h2>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">Personnel Oversight & Inheritance Control</p>
        </div>
      </header>

      <div className="bg-white rounded-[3rem] border border-stone-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-stone-50">
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">Identity</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">Clearance</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">XP / Level</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {allUsers.map((usr) => {
              const admin = admins.find(a => a.uid === usr.uid);
              const isAdminEntry = !!admin;
              return (
                <tr key={usr.uid} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center font-black text-xs text-stone-400 uppercase">
                        {(usr as any).email?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-black text-brand-text">{(usr as any).email || 'Anonymous'}</p>
                        <p className="text-[10px] text-stone-300 font-bold tracking-widest uppercase">{(usr as any).displayName || 'Vanguard'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      admin?.role === 'owner' ? 'bg-indigo-500 text-white' : isAdminEntry ? 'bg-brand-primary text-brand-text' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {admin?.role || 'user'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    Level {usr.level} • {usr.xp} XP
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 text-stone-300">
                      {isOwner && usr.uid !== user?.uid && (
                        <>
                          {isAdminEntry && (
                            <button 
                              onClick={() => handleTransferOwnership(usr.uid)}
                              className="p-2 hover:text-indigo-500 transition-all" title="Transfer Ownership">
                              <Key className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeregisterUser(usr.uid)}
                            className="p-2 hover:text-red-500 transition-all" title="Deregister User">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {usr.uid === user?.uid && <span className="text-[8px] font-black uppercase tracking-widest text-brand-primary py-1 px-3 bg-brand-primary/5 rounded-full">Your Account</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPlugins = () => (
    <div className="p-10 space-y-8 text-left animate-in fade-in">
       <header>
          <h2 className="text-4xl font-display italic font-black text-brand-text tracking-tighter">System Extensions</h2>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">Modular Enhancements for Digital Heritage</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: 'AI Scribe', desc: 'Auto-transcription of Acholi audio recordings.', status: 'active', icon: <Puzzle className="w-6 h-6" /> },
          { name: 'Google Vision Hub', desc: 'Object recognition for cultural scanner.', status: 'active', icon: <Camera className="w-6 h-6" /> },
          { name: 'Heritage Mailer', desc: 'SMTP relay for archival dispatches.', status: 'inactive', icon: <Bell className="w-6 h-6" /> },
          { name: 'Cloud Vault 2.0', desc: 'Extended storage for sacrificial rituals data.', status: 'inactive', icon: <Database className="w-6 h-6" /> },
        ].map((plugin, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-sm space-y-6 group">
            <div className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all ${plugin.status === 'active' ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20' : 'bg-stone-50 text-stone-300'}`}>
              {plugin.icon}
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-brand-text">{plugin.name}</h4>
              <p className="text-[11px] text-stone-400 italic mt-1 leading-relaxed">{plugin.desc}</p>
            </div>
            <div className="flex items-center justify-between pt-4">
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${plugin.status === 'active' ? 'text-green-500' : 'text-stone-300'}`}>
                {plugin.status}
              </span>
              <button className={`w-12 h-6 rounded-full p-1 transition-all flex items-center ${plugin.status === 'active' ? 'bg-black justify-end' : 'bg-stone-100 justify-start'}`}>
                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPosts = () => (
    <div className="p-10 space-y-8 text-left animate-in fade-in">
       <header className="flex items-end justify-between px-2">
        <div>
          <h2 className="text-4xl font-display italic font-black text-brand-text tracking-tighter">Content Archives</h2>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">Curating the Heritage Flow</p>
        </div>
        <button 
          onClick={() => { setEditingItem({}); setIsEditing(true); }}
          className="px-6 py-4 bg-brand-text text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl">
          Commit New Entry
        </button>
      </header>

      <div className="bg-white rounded-[3rem] border border-stone-100 shadow-sm p-4">
        <div className="flex items-center gap-4 px-6 py-4 border-b border-stone-50 mb-4">
          <Search className="w-4 h-4 text-stone-300" />
          <input 
            type="text" 
            placeholder="Search artifacts..." 
            className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-bold uppercase tracking-widest text-brand-text placeholder-stone-200"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <div key={post.id} className="p-6 bg-stone-50/50 hover:bg-stone-50 rounded-3xl border border-stone-100/50 flex items-center gap-5 group transition-all">
              <div className="w-16 h-16 rounded-2xl bg-white border border-stone-100 overflow-hidden shadow-sm">
                <img src={post.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex-1 overflow-hidden">
                 <p className="text-[8px] font-black uppercase tracking-widest text-brand-primary">{post.category}</p>
                 <h4 className="text-sm font-black text-brand-text italic truncate group-hover:text-brand-primary transition-colors">{post.title}</h4>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button className="p-2 text-stone-300 hover:text-brand-text"><Edit className="w-4 h-4" /></button>
                 <button onClick={() => deleteShowcaseItem(post.id).then(loadAllData)} className="p-2 text-stone-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-brand-bg font-sans selection:bg-brand-primary/20">
      {renderSidebar()}
      
      <main className="flex-1 overflow-y-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
             <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'plugins' && renderPlugins()}
          {activeTab === 'posts' && renderPosts()}
          {['announcements', 'apis', 'settings'].includes(activeTab) && (
            <div className="p-10 flex flex-col items-center justify-center h-[70vh] space-y-6 text-center">
               <div className="w-24 h-24 bg-stone-50 rounded-[2.5rem] flex items-center justify-center text-stone-200">
                  <Database className="w-12 h-12" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-2xl font-display italic font-black text-brand-text italic">Module Sync Underway</h3>
                 <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Integrating {activeTab} with our cloud archives...</p>
               </div>
               <button onClick={() => setActiveTab('dashboard')} className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary border-b-2 border-brand-primary pb-1">Return to Dashboard</button>
            </div>
          )}
        </div>
      </main>

      {/* Persistence Notifications */}
      <div className="fixed bottom-10 right-10 flex flex-col gap-3 z-[100]">
        <AnimatePresence>
          {loading && (
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="px-6 py-4 bg-brand-text text-white rounded-2xl shadow-2xl flex items-center gap-3">
                <RefreshCw className="w-4 h-4 animate-spin text-brand-primary" />
                <span className="text-[9px] font-black uppercase tracking-widest">Syncing Cloud</span>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

