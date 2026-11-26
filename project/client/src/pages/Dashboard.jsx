import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  FolderPlus,
  FileText,
  Users,
  Search,
  Plus,
  Sparkles,
  ArrowRight,
  LogOut,
  Calendar,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Folder,
} from 'lucide-react';

const TEMPLATES = [
  {
    title: 'Blank Document',
    desc: 'Start writing from a clean slate',
    icon: FileText,
    color: 'from-blue-500 to-indigo-600',
  },
  {
    title: 'Meeting Notes',
    desc: 'Agenda, discussion, & action items',
    icon: Calendar,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'Product Specs',
    desc: 'Overview, user stories, requirements',
    icon: Layers,
    color: 'from-violet-500 to-purple-600',
  },
  {
    title: 'Project Proposal',
    desc: 'Goals, timelines, and deliverables',
    icon: FileSpreadsheet,
    color: 'from-amber-500 to-orange-600',
  },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const res = await api.get('/workspaces');
      setWorkspaces(res.data);
    } catch {
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/workspaces', { name: newName.trim() });
      setWorkspaces((prev) => [res.data, ...prev]);
      setNewName('');
      setShowModal(false);
      toast.success('Workspace created successfully');
      navigate(`/workspace/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  const handleTemplateClick = async (templateTitle) => {
    if (workspaces.length === 0) {
      setShowModal(true);
      return;
    }
    // Navigate to first workspace or prompt
    const targetWs = workspaces[0];
    try {
      const res = await api.post('/documents', {
        workspaceId: targetWs._id,
        title: templateTitle,
      });
      navigate(`/document/${res.data._id}`);
    } catch {
      navigate(`/workspace/${targetWs._id}`);
    }
  };

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                CollabDocs
              </h1>
              <span className="text-[11px] text-slate-400 font-medium">Smart AI Workspace</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workspaces..."
                className="w-full bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-xs text-slate-800 pl-10 pr-4 py-2 rounded-xl border border-transparent focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
              />
            </div>
          </div>

          {/* User profile & actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/60">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                {user?.name}
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-10">
        {/* Welcome & Templates Banner */}
        <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              TipTap Editor + Gemini AI Writing Assistant
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-2">
              Welcome back, {user?.name || 'Writer'} 👋
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Create, collaborate in real-time, and draft documents powered by Gemini AI and live multiplayer synchronization.
            </p>
          </div>

          {/* Decorative blur spheres */}
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-indigo-600/30 blur-3xl pointer-events-none" />
          <div className="absolute right-40 bottom-0 -mb-10 w-60 h-60 rounded-full bg-violet-600/20 blur-2xl pointer-events-none" />
        </section>

        {/* Start New Document with Templates */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Start a new document
            </h3>
            <span className="text-xs text-slate-400">Quick-start templates</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATES.map((tmpl, idx) => {
              const Icon = tmpl.icon;
              return (
                <div
                  key={idx}
                  onClick={() => handleTemplateClick(tmpl.title)}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-brand-400 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${tmpl.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <Plus className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 group-hover:text-brand-600 transition mb-1">
                      {tmpl.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{tmpl.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Workspaces Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Your Workspaces</h3>
              <p className="text-xs text-slate-400">
                Shared document spaces with real-time permissions
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <FolderPlus className="w-4 h-4" />
              <span>New Workspace</span>
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-44 rounded-2xl"></div>
              ))}
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4 shadow-inner">
                <Folder className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-800 mb-1">No workspaces found</h4>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Workspaces keep your documents organized and allow collaboration with your teammates.
              </p>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create your first workspace
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredWorkspaces.map((ws) => (
                <div
                  key={ws._id}
                  onClick={() => navigate(`/workspace/${ws._id}`)}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-lg hover:border-brand-300 transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-brand-50 group-hover:text-brand-600 flex items-center justify-center transition">
                      <Folder className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold bg-slate-100 group-hover:bg-brand-50 text-slate-600 group-hover:text-brand-700 px-2.5 py-1 rounded-full transition flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {ws.members?.length || 1} members
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-800 group-hover:text-brand-600 transition mb-1 truncate">
                      {ws.name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Owner: {ws.owner?.name ? (ws.owner?._id === user?._id ? 'You' : ws.owner?.name) : 'You'}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Created {new Date(ws.createdAt).toLocaleDateString()}</span>
                    <span className="text-brand-600 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Open <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Create Workspace Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800">Create New Workspace</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setNewName('');
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Enter a descriptive name for your workspace (e.g. Engineering Team, Marketing, Personal).
            </p>
            <form onSubmit={createWorkspace}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Workspace name"
                className="w-full px-3.5 py-2.5 text-xs text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none mb-5 transition"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setNewName('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
