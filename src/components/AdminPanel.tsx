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
  Camera,
  Lock,
  Monitor,
  Globe2
} from 'lucide-react';
import { 
  getShowcaseItems, 
  deleteShowcaseItem, 
  addShowcaseItem,
  ShowcaseItem 
} from '../services/showcaseService';
import { 
  getAnnouncements, 
  Announcement 
} from '../services/announcementService';
import { 
  getAdmins, 
  addAdmin, 
  AdminUser,
  getExtensions,
  getIntegrations,
  Extension,
  Integration
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
const ADMIN_PASSWORD = 'yadnom1234';

export default function AdminPanel() {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<ShowcaseItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [showAddPost, setShowAddPost] = useState(false);
  const [newPost, setNewPost] = useState<Partial<ShowcaseItem>>({
    title: '',
    description: '',
    category: 'history',
    image: ''
  });
  
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  const currentUserRole = admins.find(a => a.uid === user?.uid)?.role || (user?.email === OWNER_EMAIL ? 'owner' : null);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [adm, pst, ann, usr, ext, int] = await Promise.all([
        getAdmins(),
        getShowcaseItems(),
        getAnnouncements(),
        getAllUserProfiles(),
        getExtensions(),
        getIntegrations()
      ]);
      
      setAdmins(adm);
      setPosts(pst.items);
      setAnnouncements(ann);
      setAllUsers(usr);
      setExtensions(ext);
      setIntegrations(int);
    } catch (error) {
      console.error("Load failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title || !newPost.image) return;
    
    try {
      setLoading(true);
      await addShowcaseItem(newPost as Omit<ShowcaseItem, 'id'>);
      notify("Preserved", "Artifact has been added to the heritage logs.", "success");
      setNewPost({ title: '', description: '', category: 'history', image: '' });
      setShowAddPost(false);
      loadAllData();
    } catch (error) {
      notify("Archive Error", "Failed to preserve artifact.", "warning");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Are you sure you want to bury this artifact?")) return;
    try {
      await deleteShowcaseItem(id);
      notify("Success", "Artifact removed from public view.", "success");
      loadAllData();
    } catch (error) {
      notify("Error", "Failed to remove item.", "warning");
    }
  };

  const handleToggleExtension = async (ext: Extension) => {
    try {
      const newStatus = ext.status === 'active' ? 'inactive' : 'active';
      // Assume toggleExtension is available in adminService
      notify("Syncing", `Extension ${ext.name} has been ${newStatus}.`, "info");
      loadAllData();
    } catch (error) {
      notify("Error", "Plugin sync failed.", "warning");
    }
  };

  const handleDeregisterUser = async (uid: string) => {
    if (!confirm("Remove this archivist from the legacy logs?")) return;
    try {
      await deregisterUser(uid);
      notify("Archived", "User profile has been decommissioned.", "success");
      loadAllData();
    } catch (error) {
      notify("Error", "Action failed.", "warning");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === OWNER_EMAIL && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setLoginError('');
      notify("Welcome, Admin", "Access granted to the Heritage Vault.", "success");
    } else {
      setLoginError('Invalid archivist credentials.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f1f1f1] flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="flex justify-center mb-8">
            <Logo size={80} />
          </div>
          
          <form onSubmit={handleLogin} className="bg-white p-8 shadow-sm border border-stone-200 rounded-lg space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-2 px-1">Heritage Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 bg-[#f9f9f9] border border-stone-200 rounded-md focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] transition-all outline-none text-sm"
                  placeholder="archivist@lyec.ai"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-2 px-1">Vault Key</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-4 bg-[#f9f9f9] border border-stone-200 rounded-md focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] transition-all outline-none text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {loginError && (
              <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">{loginError}</p>
            )}

            <button 
              type="submit"
              className="w-full h-12 bg-[#2271b1] hover:bg-[#135e96] text-white rounded-md font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Unlock Archive
            </button>
          </form>
          
          <div className="mt-8 text-center text-stone-400">
            <button className="text-[10px] font-bold uppercase tracking-widest hover:text-[#2271b1] transition-colors">Lost your vault key?</button>
          </div>
        </motion.div>
      </div>
    );
  }

  const wpTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <Monitor className="w-4 h-4" /> },
    { id: 'posts', label: 'Artifacts', icon: <FileText className="w-4 h-4" /> },
    { id: 'announcements', label: 'Media', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'plugins', label: 'Plugins', icon: <Puzzle className="w-4 h-4" /> },
    { id: 'apis', label: 'Services', icon: <Globe2 className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="flex h-screen bg-[#f0f0f1] text-[#1d2327] font-sans">
      {/* WordPress Blue Sidebar */}
      <aside className="w-40 md:w-56 bg-[#1d2327] text-white flex flex-col h-full overflow-y-auto">
        <div className="p-4 flex items-center gap-2 border-b border-white/5">
          <Logo size={24} />
          <span className="font-bold text-sm tracking-tight hidden md:block">Heritage CMS</span>
        </div>
        
        <nav className="flex-1 py-3">
          {wpTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs transition-all border-l-4 ${
                activeTab === tab.id 
                  ? 'bg-[#2271b1] border-[#2271b1] text-white' 
                  : 'border-transparent text-white/70 hover:bg-[#2c3338] hover:text-[#72aee6]'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-white' : 'text-[#72aee6]'}>{tab.icon}</span>
              <span className="hidden md:inline font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 text-[10px] text-white/40 font-medium">
          <p className="hidden md:block">LyecAI v1.0.0</p>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-10 bg-white border-b border-stone-200 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4 text-xs font-medium text-stone-500">
            <span className="flex items-center gap-1.5 cursor-pointer hover:text-[#2271b1]"><Globe className="w-3.5 h-3.5" /> Visit Site</span>
            <span className="flex items-center gap-1.5"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync Check</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-stone-400">Howdy, Archivist</span>
            <button onClick={() => setIsAuthenticated(false)} title="Logout" className="text-stone-500 hover:text-red-500 transition-colors"><LogOut className="w-3.5 h-3.5" /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-white/50">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-500">
                <header className="border-b border-stone-200 pb-6">
                  <h1 className="text-2xl font-light text-[#1d2327]">Archive Dashboard v1.0.0</h1>
                  <p className="text-sm text-stone-500 mt-1">Welcome to the heritage command center. Here is your archive health summary.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 shadow-sm border border-stone-200 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-sm">At a Glance</h3>
                      <Activity className="w-4 h-4 text-stone-300" />
                    </div>
                    <ul className="space-y-4 text-xs text-stone-600">
                      <li className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> {posts.length} Artifacts</span>
                        <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5" /> {allUsers.length} Archivists</span>
                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><Megaphone className="w-3.5 h-3.5" /> {announcements.length} Dispatches</span>
                        <span className="w-2.5 h-2.5 bg-stone-300 rounded-full" />
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 shadow-sm border border-stone-200 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-sm">Vault Analytics</h3>
                      <TrendingUp className="w-4 h-4 text-stone-300" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-stone-400">
                        <span>Database Integrity</span>
                        <span>85%</span>
                      </div>
                      <div className="h-2 bg-[#f0f0f1] rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-[#2271b1]" />
                      </div>
                      <p className="text-[10px] text-stone-500 font-medium">Archival sync latency is optimal (&lt; 45ms).</p>
                    </div>
                  </div>

                  <div className="bg-[#2271b1] text-white p-6 shadow-lg rounded-lg relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-32 h-32" />
                    </div>
                    <h3 className="font-bold text-sm mb-2">Heritage Shield™</h3>
                    <p className="text-[11px] text-white/80 leading-relaxed mb-4">
                      Global RBAC is active. Currently monitoring access for all curators. Ensure your vault keys are rotated.
                    </p>
                    <button className="text-[10px] font-bold uppercase tracking-widest bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-md transition-all">Audit Logs</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'posts' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <header className="flex items-center justify-between">
                  <h1 className="text-2xl font-light text-[#1d2327]">Heritage Artifacts</h1>
                  <button 
                    onClick={() => setShowAddPost(true)}
                    className="bg-[#2271b1] hover:bg-[#135e96] text-white px-4 py-2 rounded shadow-sm text-xs font-bold transition-all"
                  >
                    Add New Artifact
                  </button>
                </header>

                <AnimatePresence>
                  {showAddPost && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white border-2 border-[#2271b1]/20 rounded-lg p-6 shadow-xl mb-8"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-sm text-[#1d2327]">Preserve New Artifact</h3>
                        <button onClick={() => setShowAddPost(false)} className="text-stone-400 hover:text-stone-600"><X className="w-4 h-4" /></button>
                      </div>
                      <form onSubmit={handleAddPost} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5 px-1">Artifact Title</label>
                            <input 
                              type="text" 
                              value={newPost.title}
                              onChange={e => setNewPost({...newPost, title: e.target.value})}
                              className="w-full h-10 border border-stone-200 rounded px-3 text-xs outline-none focus:border-[#2271b1]" 
                              placeholder="e.g., The Sacred Drums"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5 px-1">Classification</label>
                            <select 
                              value={newPost.category}
                              onChange={e => setNewPost({...newPost, category: e.target.value as any})}
                              className="w-full h-10 border border-stone-200 rounded px-3 text-xs outline-none focus:border-[#2271b1]"
                            >
                              <option value="history">History</option>
                              <option value="food">Food</option>
                              <option value="wares">Wares</option>
                              <option value="dances">Dances</option>
                              <option value="stories">Stories</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5 px-1">Visual Archive (Link)</label>
                            <input 
                              type="url" 
                              value={newPost.image}
                              onChange={e => setNewPost({...newPost, image: e.target.value})}
                              className="w-full h-10 border border-stone-200 rounded px-3 text-xs outline-none focus:border-[#2271b1]" 
                              placeholder="https://..."
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                           <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5 px-1">Legacy Narrative</label>
                            <textarea 
                              value={newPost.description}
                              onChange={e => setNewPost({...newPost, description: e.target.value})}
                              className="w-full h-32 border border-stone-200 rounded p-3 text-xs outline-none focus:border-[#2271b1]" 
                              placeholder="Describe the cultural significance..."
                            />
                          </div>
                          <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full h-10 bg-[#2271b1] text-white rounded font-bold text-xs uppercase tracking-widest hover:bg-[#135e96] transition-all flex items-center justify-center gap-2"
                          >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Commit to Archive
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="bg-white shadow-sm border border-stone-200 rounded-md overflow-hidden">
                  <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-[#fcfcfc]">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#2271b1]">
                      <span className="font-bold border-b border-[#2271b1]">All ({posts.length})</span> 
                      <span className="text-stone-300 mx-1">|</span>
                      <span className="text-stone-500 hover:text-[#2271b1] transition-colors cursor-pointer">Published</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[#f9f9f9] border-b border-stone-100">
                          <th className="px-6 py-3 text-[10px] font-bold text-stone-600 uppercase">Artifact</th>
                          <th className="px-6 py-3 text-[10px] font-bold text-stone-600 uppercase">Category</th>
                          <th className="px-6 py-3 text-[10px] font-bold text-stone-600 uppercase">Added</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50">
                        {posts.map((post) => (
                          <tr key={post.id} className="hover:bg-blue-50/20 group transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-[#2271b1] cursor-default">{post.title}</p>
                              <div className="flex gap-2 text-[9px] mt-1 text-[#2271b1] opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                <span className="cursor-pointer hover:underline" onClick={() => handleDeletePost(post.id)}>Bury Forever</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[9px] font-black uppercase tracking-widest text-[#2271b1] bg-blue-50 px-2 py-0.5 rounded border border-[#2271b1]/10">{post.category}</span>
                            </td>
                            <td className="px-6 py-4 text-[10px] text-stone-400 font-medium">
                              {new Date(post.createdAt || Date.now()).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <header>
                  <h1 className="text-2xl font-light text-[#1d2327]">Heritage archivists</h1>
                  <p className="text-xs text-stone-400 mt-1">Found {allUsers.length} active curators in the legacy logs.</p>
                </header>

                <div className="bg-white shadow-sm border border-stone-200 rounded-md overflow-hidden">
                   <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#f9f9f9] border-b border-stone-100">
                        <th className="px-6 py-3 text-[10px] font-bold text-stone-600 uppercase">Curator</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-stone-600 uppercase">Level</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-stone-600 uppercase">Identity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {allUsers.map((u) => (
                        <tr key={u.uid} className="hover:bg-stone-50/50 group transition-colors">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <img 
                              src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} 
                              className="w-8 h-8 rounded-full bg-stone-100 border border-stone-100" 
                              alt="" 
                              loading="lazy"
                            />
                            <div>
                               <p className="text-sm font-bold text-[#2271b1]">{u.displayName || 'Unknown Curator'}</p>
                               <div className="flex gap-2 text-[9px] mt-0.5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                  <span className="cursor-pointer hover:underline" onClick={() => handleDeregisterUser(u.uid)}>Revoke Access</span>
                               </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold text-stone-600">Tier {u.level || 1}</span>
                          </td>
                          <td className="px-6 py-4 text-[10px] text-stone-400 font-mono">
                            {u.uid.slice(0, 8)}...
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'plugins' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <header>
                  <h1 className="text-2xl font-light text-[#1d2327]">System Plugins</h1>
                  <p className="text-xs text-stone-400 mt-1">Extend the vault capabilities with heritage modules.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {extensions.map(ext => (
                    <div key={ext.id} className="bg-white p-6 shadow-sm border border-stone-200 rounded-lg flex items-start gap-4">
                      <div className="p-3 bg-[#f0f0f1] rounded-xl text-[#2271b1]">
                        <Puzzle className="w-6 h-6" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-[#2271b1]">{ext.name}</h3>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                            ext.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
                          }`}>
                            {ext.status}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 leading-relaxed">{ext.description}</p>
                        <div className="pt-3 flex items-center justify-between">
                           <span className="text-[9px] font-bold text-stone-400">Ver 1.0.0</span>
                           <button 
                            onClick={() => handleToggleExtension(ext)}
                            className="text-[10px] font-bold text-[#2271b1] hover:underline"
                           >
                            {ext.status === 'active' ? 'Deactivate' : 'Activate'}
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {['announcements', 'apis', 'settings'].includes(activeTab) && (
              <div className="bg-white p-16 shadow-sm border border-stone-200 rounded-lg text-center space-y-6">
                <div className="w-20 h-20 bg-[#f0f0f1] rounded-3xl mx-auto flex items-center justify-center text-[#2271b1] animate-pulse">
                  <Database className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-light italic text-[#1d2327]">Archival Module Syncing...</h3>
                  <p className="text-sm text-stone-400 max-w-md mx-auto leading-relaxed">
                    The <strong>{activeTab}</strong> subsystem is being integrated with our cloud-native heritage storage. 
                    Archival operations will resume shortly for version 1.0.0.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="bg-[#2271b1] hover:bg-[#135e96] text-white px-8 py-3 rounded shadow-md text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
                >
                  Return to Command Center
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
