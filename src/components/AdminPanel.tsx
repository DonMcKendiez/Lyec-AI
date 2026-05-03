import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Image as ImageIcon, Loader2, LayoutGrid, Megaphone } from 'lucide-react';
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
import { motion, AnimatePresence } from 'motion/react';
import { useNotification } from '../contexts/NotificationContext';

export default function AdminPanel() {
  const { notify } = useNotification();
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'items' | 'announcements'>('items');
  
  // Form State for items
  const [formData, setFormData] = useState<Omit<ShowcaseItem, 'id'>>({
    title: '',
    description: '',
    category: 'food',
    image: '',
  });

  // Form State for announcements
  const [announcementForm, setAnnouncementForm] = useState<Omit<Announcement, 'id'>>({
    title: '',
    content: '',
    date: new Date().toISOString(),
    type: 'info'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [itemsData, annData] = await Promise.all([
      getShowcaseItems(),
      getAnnouncements()
    ]);
    setItems(itemsData);
    setAnnouncements(annData);
    setLoading(false);
  };

  const handleEdit = (item: ShowcaseItem) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      description: item.description,
      category: item.category,
      image: item.image,
    });
    setIsAdding(true);
    setActiveTab('items');
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ title: '', description: '', category: 'food', image: '' });
    setAnnouncementForm({ title: '', content: '', date: new Date().toISOString(), type: 'info' });
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateShowcaseItem(editingId, formData);
        notify("Artifact Refined", `${formData.title} has been updated in the archives.`, 'success');
      } else {
        await addShowcaseItem(formData);
        notify("Artifact Committed", `${formData.title} is now preserved in the heritage feed.`, 'success');
      }
      await loadData();
      handleCancel();
    } catch (error) {
      console.error(error);
      alert("Management Error: Archive write failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addAnnouncement({ ...announcementForm, date: new Date().toISOString() });
      notify("Dispatch Broadcasted", `The announcement "${announcementForm.title}" is now live.`, 'success');
      await loadData();
      handleCancel();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to remove this artifact?")) return;
    setLoading(true);
    try {
      await deleteShowcaseItem(id);
      notify("Artifact Removed", "The entry has been purged from the archive.", 'warning');
      await loadData();
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    setLoading(true);
    try {
      await deleteAnnouncement(id);
      await loadData();
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 rounded-full text-[10px] font-black uppercase tracking-widest text-brand-primary">
            Curator Access
          </div>
          <h2 className="text-5xl font-display italic font-black text-brand-text tracking-tighter">Archive Management</h2>
          <p className="text-stone-400 font-medium">Control the heritage feed and official dispatches.</p>
        </div>
        {!isAdding && (
          <div className="flex gap-4">
            <button 
              onClick={() => { setActiveTab('items'); setIsAdding(true); }}
              className="flex items-center gap-2 px-6 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-primary-hover transition-all shadow-xl shadow-brand-primary/20"
            >
              <Plus className="w-4 h-4" /> Artifact
            </button>
            <button 
              onClick={() => { setActiveTab('announcements'); setIsAdding(true); }}
              className="flex items-center gap-2 px-6 py-4 bg-brand-text text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:opacity-90 transition-all shadow-xl"
            >
              <Megaphone className="w-4 h-4" /> Announcement
            </button>
          </div>
        )}
      </header>

      <div className="flex border-b border-stone-100">
        <button 
          onClick={() => setActiveTab('items')}
          className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'items' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-stone-300'}`}
        >
          Cultural Artifacts
        </button>
        <button 
          onClick={() => setActiveTab('announcements')}
          className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'announcements' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-stone-300'}`}
        >
          System Dispatches
        </button>
      </div>

      {isAdding && activeTab === 'items' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="interactive-card p-8 bg-white border-2 border-brand-primary/20">
          <form onSubmit={handleSaveItem} className="space-y-6">
            <h3 className="text-2xl font-display italic font-black text-brand-text">{editingId ? 'Refine Entry' : 'New Archive Entry'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-6 py-4 bg-stone-50 rounded-2xl border" placeholder="Title" required />
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as any })} className="w-full px-6 py-4 bg-stone-50 rounded-2xl border">
                <option value="food">Food & Stews</option>
                <option value="wares">Tools & Wares</option>
                <option value="activities">Activities & Rituals</option>
              </select>
            </div>
            <input type="url" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full px-6 py-4 bg-stone-50 rounded-2xl border" placeholder="Image URL" required />
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-6 py-4 bg-stone-50 rounded-2xl border h-32" placeholder="Description" required />
            <div className="flex gap-4">
              <button type="submit" disabled={loading} className="flex-1 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs">Commit Artifact</button>
              <button type="button" onClick={handleCancel} className="px-8 py-4 bg-stone-100 text-stone-500 rounded-2xl font-black">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      {isAdding && activeTab === 'announcements' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="interactive-card p-8 bg-brand-text text-white">
          <form onSubmit={handleSaveAnnouncement} className="space-y-6">
            <h3 className="text-2xl font-display italic font-black">Issue New Dispatch</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} className="w-full px-6 py-4 bg-white/5 rounded-2xl border border-white/10" placeholder="Announcement Title" required />
              <select value={announcementForm.type} onChange={(e) => setAnnouncementForm({ ...announcementForm, type: e.target.value as any })} className="w-full px-6 py-4 bg-white/5 rounded-2xl border border-white/10">
                <option value="info">Information</option>
                <option value="warning">Alert</option>
                <option value="achievement">Global Milestone</option>
              </select>
            </div>
            <textarea value={announcementForm.content} onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })} className="w-full px-6 py-4 bg-white/5 rounded-2xl border border-white/10 h-32" placeholder="Content details..." required />
            <div className="flex gap-4">
              <button type="submit" disabled={loading} className="flex-1 py-4 bg-brand-primary text-brand-text rounded-2xl font-black uppercase tracking-widest text-xs uppercase">Broadcast Transmission</button>
              <button type="button" onClick={handleCancel} className="px-8 py-4 bg-white/10 rounded-2xl font-black">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      {activeTab === 'items' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="interactive-card p-6 bg-white border flex gap-4 group">
              <img src={item.image} className="w-20 h-20 bg-stone-100 rounded-xl object-cover" />
              <div className="flex-1">
                <h4 className="font-black text-brand-text truncate uppercase italic">{item.title}</h4>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => handleEdit(item)} className="p-2 text-stone-300 hover:text-brand-primary transition-all"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-stone-300 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div key={ann.id} className="p-6 bg-white border rounded-3xl flex justify-between items-center">
              <div>
                <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${ann.type === 'warning' ? 'text-red-500' : 'text-brand-primary'}`}>{ann.type} • {new Date(ann.date).toLocaleDateString()}</p>
                <h4 className="text-lg font-black text-brand-text uppercase italic">{ann.title}</h4>
                <p className="text-xs text-stone-400 mt-1">{ann.content}</p>
              </div>
              <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all"><Trash2 className="w-5 h-5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
