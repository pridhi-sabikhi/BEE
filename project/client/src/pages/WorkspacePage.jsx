import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  FileText,
  Plus,
  Users,
  UserPlus,
  ArrowLeft,
  Search,
  Clock,
  Trash2,
  Shield,
  Layers,
  Sparkles,
  ChevronRight,
  LogOut,
  Folder,
} from 'lucide-react';

export default function WorkspacePage() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviting, setInviting] = useState(false);
  const [creatingDoc, setCreatingDoc] = useState(false);
  const [searchDoc, setSearchDoc] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [wsRes, docsRes] = await Promise.all([
        api.get('/workspaces'),
        api.get(`/documents/workspace/${id}`),
      ]);
      const ws = wsRes.data.find((w) => w._id === id);
      setWorkspace(ws);
      setDocuments(docsRes.data);
    } catch {
      toast.error('Failed to load workspace');
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async () => {
    setCreatingDoc(true);
    try {
      const res = await api.post('/documents', { workspaceId: id, title: 'Untitled Document' });
      navigate(`/document/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create document');
    } finally {
      setCreatingDoc(false);
    }
  };

  const inviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await api.post(`/workspaces/${id}/invite`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setWorkspace(res.data);
      setInviteEmail('');
      setShowInviteModal(false);
      toast.success('Collaborator invited successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const removeMember = async (userId) => {
    try {
      const res = await api.delete(`/workspaces/${id}/members/${userId}`);
      setWorkspace(res.data);
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchDoc.toLowerCase())
  );

  const isOwner = workspace?.owner?._id === user?._id || workspace?.owner === user?._id;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/70">
        <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center">
          <div className="skeleton h-6 w-48 rounded"></div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <div className="skeleton h-32 rounded-3xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-20 rounded-2xl"></div>
              ))}
            </div>
            <div className="skeleton h-64 rounded-2xl"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Folder className="w-4 h-4" />
              </div>
              <h1 className="text-base font-bold text-slate-800 truncate max-w-xs sm:max-w-md">
                {workspace?.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/60">
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-8">
        {/* Workspace Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">
              <Layers className="w-3.5 h-3.5" />
              Collaborative Workspace
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
              {workspace?.name}
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                {documents.length} {documents.length === 1 ? 'Document' : 'Documents'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                {workspace?.members?.length || 1} Members
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-2 transition"
              >
                <UserPlus className="w-4 h-4 text-slate-500" />
                <span>Invite Teammate</span>
              </button>
            )}
            <button
              type="button"
              onClick={createDocument}
              disabled={creatingDoc}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{creatingDoc ? 'Creating...' : 'New Document'}</span>
            </button>
          </div>
        </div>

        {/* Content Split: Documents (Left) and Members (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Documents Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-bold text-slate-800">
                Documents ({filteredDocs.length})
              </h3>
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchDoc}
                  onChange={(e) => setSearchDoc(e.target.value)}
                  placeholder="Filter documents..."
                  className="w-full bg-white text-xs text-slate-800 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 transition"
                />
              </div>
            </div>

            {filteredDocs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-3">
                  <FileText className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">No documents found</h4>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                  Start drafting notes, project docs, or collaborative write-ups in this workspace.
                </p>
                <button
                  type="button"
                  onClick={createDocument}
                  disabled={creatingDoc}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs transition inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Create First Document
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => navigate(`/document/${doc._id}`)}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 hover:shadow-md hover:border-brand-300 transition-all duration-200 cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-brand-600 transition truncate">
                          {doc.title || 'Untitled Document'}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(doc.updatedAt).toLocaleDateString()}
                          </span>
                          {doc.lastEditedBy && (
                            <>
                              <span>•</span>
                              <span>Edited by {doc.lastEditedBy.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        v{doc.version || 1}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Members Sidebar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Team Members</h3>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
                >
                  + Invite
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs overflow-hidden">
              {workspace?.members?.map((m) => (
                <div
                  key={m.user?._id || m._id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {m.user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {m.user?.name || 'Member'}
                        {m.user?._id === user?._id && ' (You)'}
                      </p>
                      <span className="text-[10px] text-slate-400 capitalize">{m.role}</span>
                    </div>
                  </div>

                  {isOwner && m.role !== 'owner' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMember(m.user?._id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800">Invite Team Member</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Add collaborators to this workspace to edit documents and chat in real-time.
            </p>
            <form onSubmit={inviteMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full px-3.5 py-2.5 text-xs text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Access Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                >
                  <option value="editor">Editor (Can create & edit documents)</option>
                  <option value="viewer">Viewer (Read-only access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50"
                >
                  {inviting ? 'Sending Invite...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
