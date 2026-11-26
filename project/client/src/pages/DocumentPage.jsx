import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';
import toast from 'react-hot-toast';
import Editor from '../components/Editor';
import AISidebar from '../components/AISidebar';
import ChatSidebar from '../components/ChatSidebar';
import OnlineUsers from '../components/OnlineUsers';
import {
  FileText,
  Cloud,
  Check,
  Share2,
  Sparkles,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  Plus,
  Search,
  Star,
  Printer,
  Copy,
  BarChart2,
  ArrowLeft,
  Loader2,
  ChevronDown,
} from 'lucide-react';

export default function DocumentPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [rightPanel, setRightPanel] = useState(null); // 'ai' | 'chat' | null
  const [selectedText, setSelectedText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showWordCountModal, setShowWordCountModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); // 'file' | 'edit' | 'tools' | null

  const editorRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Load document
  useEffect(() => {
    const loadDoc = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/documents/${id}`);
        setDocument(res.data);

        // Load sibling docs
        const workspaceId = res.data.workspace?._id || res.data.workspace;
        if (workspaceId) {
          const docsRes = await api.get(`/documents/workspace/${workspaceId}`);
          setDocuments(docsRes.data);
        }
      } catch {
        toast.error('Failed to load document');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    loadDoc();
  }, [id, navigate]);

  // Socket connection
  useEffect(() => {
    if (!document || !user) return;

    const socket = connectSocket();

    socket.emit('join-document', id);

    socket.on('active-users', (users) => {
      setActiveUsers(users);
    });

    socket.on('user-joined', (userData) => {
      setActiveUsers((prev) => {
        if (prev.find((u) => u._id === userData._id)) return prev;
        return [...prev, userData];
      });
    });

    socket.on('user-left', (userId) => {
      setActiveUsers((prev) => prev.filter((u) => u._id !== userId));
    });

    socket.on('document-change', (delta) => {
      if (editorRef.current) {
        const editor = editorRef.current;
        const { from, to } = editor.state.selection;
        editor.commands.setContent(delta, false);
        try {
          editor.commands.setTextSelection({ from, to });
        } catch {
          // Position might be out of bounds
        }
      }
    });

    return () => {
      socket.emit('leave-document', id);
      socket.off('active-users');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('document-change');
      disconnectSocket();
    };
  }, [document?._id, user?._id, id]);

  // Auto-save with debounce
  const saveDocument = useCallback(
    async (content, title) => {
      setSaving(true);
      try {
        const payload = {};
        if (content !== undefined) payload.content = content;
        if (title !== undefined) payload.title = title;

        await api.put(`/documents/${id}`, payload);
        setLastSaved(new Date());
      } catch {
        // Silent fail for auto-save
      } finally {
        setSaving(false);
      }
    },
    [id]
  );

  const handleEditorChange = useCallback(
    (content) => {
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit('document-change', id, content, user._id);
      }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveDocument(content);
      }, 2500);
    },
    [id, user?._id, saveDocument]
  );

  const handleTitleChange = useCallback(
    (newTitle) => {
      setDocument((prev) => ({ ...prev, title: newTitle }));
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveDocument(undefined, newTitle);
      }, 1000);
    },
    [saveDocument]
  );

  const handleTextSelect = useCallback((text) => {
    setSelectedText(text);
  }, []);

  const handleAIInsert = useCallback((text) => {
    if (editorRef.current) {
      editorRef.current.commands.insertContent(text);
      toast.success('Inserted into document');
    }
  }, []);

  const handleOutlineInsert = useCallback((json) => {
    if (editorRef.current) {
      editorRef.current.commands.setContent(json);
      toast.success('Outline loaded into document');
    }
  }, []);

  const createNewDocInWorkspace = async () => {
    const wsId = document?.workspace?._id || document?.workspace;
    if (!wsId) return;
    try {
      const res = await api.post('/documents', { workspaceId: wsId, title: 'Untitled Document' });
      toast.success('New document created');
      navigate(`/document/${res.data._id}`);
    } catch {
      toast.error('Failed to create document');
    }
  };

  const getDocStats = () => {
    if (!editorRef.current) return { words: 0, characters: 0, readingTime: 0 };
    const text = editorRef.current.getText();
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    const readingTime = Math.ceil(words / 200);
    return { words, characters, readingTime };
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchDocQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-screen flex bg-slate-50">
        <div className="w-64 bg-slate-900 border-r border-slate-800 p-4 space-y-4">
          <div className="skeleton h-8 w-3/4 rounded bg-slate-800"></div>
          <div className="space-y-2 pt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-8 rounded bg-slate-800"></div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
            <div className="skeleton h-6 w-52 rounded"></div>
            <div className="flex gap-2">
              <div className="skeleton h-8 w-20 rounded-lg"></div>
              <div className="skeleton h-8 w-20 rounded-lg"></div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-8 bg-slate-100">
            <div className="w-full max-w-[850px] h-[900px] bg-white rounded-md shadow-paper p-12 space-y-6">
              <div className="skeleton h-10 w-2/3 rounded"></div>
              <div className="skeleton h-4 w-full rounded"></div>
              <div className="skeleton h-4 w-5/6 rounded"></div>
              <div className="skeleton h-4 w-4/6 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = getDocStats();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-100/70 select-none">
      {/* Google Docs Modern Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between flex-shrink-0 z-30 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          {/* Sidebar Toggle & Docs Icon */}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            title={sidebarOpen ? 'Collapse sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
          </button>

          <Link
            to={`/workspace/${document?.workspace?._id || document?.workspace}`}
            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-xs flex-shrink-0 hover:opacity-90 transition"
            title="Back to Workspace"
          >
            <FileText className="w-5 h-5" />
          </Link>

          {/* Title and Menus */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={document?.title || ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-base font-bold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-brand-500 px-1.5 py-0.5 rounded transition truncate max-w-[280px] sm:max-w-md outline-none"
                placeholder="Untitled Document"
              />
              <button
                type="button"
                onClick={() => setIsStarred(!isStarred)}
                className="text-slate-400 hover:text-amber-500 transition p-1"
                title={isStarred ? 'Starred' : 'Star document'}
              >
                <Star
                  className={`w-4 h-4 ${
                    isStarred ? 'fill-amber-400 text-amber-500' : 'text-slate-400'
                  }`}
                />
              </button>

              {/* Save Status Badge */}
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-brand-600 animate-spin" />
                    <span className="text-[11px] text-brand-600 font-medium">Saving...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px] text-slate-600 font-medium">
                      {lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Saved to Cloud'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Google Docs Menubar */}
            <div className="flex items-center gap-1 text-xs text-slate-600 font-medium mt-0.5">
              {/* File Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
                  className="px-2 py-0.5 rounded hover:bg-slate-100 transition"
                >
                  File
                </button>
                {activeMenu === 'file' && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                    <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 text-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          createNewDocInWorkspace();
                          setActiveMenu(null);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-500" />
                        New Document
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          window.print();
                          setActiveMenu(null);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        Print Document
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowShareModal(true);
                          setActiveMenu(null);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-xs"
                      >
                        <Share2 className="w-3.5 h-3.5 text-slate-500" />
                        Share Link
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Tools Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveMenu(activeMenu === 'tools' ? null : 'tools')}
                  className="px-2 py-0.5 rounded hover:bg-slate-100 transition"
                >
                  Tools
                </button>
                {activeMenu === 'tools' && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                    <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 text-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          setShowWordCountModal(true);
                          setActiveMenu(null);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-xs"
                      >
                        <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
                        Word Count & Stats
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRightPanel('ai');
                          setActiveMenu(null);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-xs text-indigo-600 font-semibold"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Open AI Assistant
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Direct print shortcut */}
              <button
                type="button"
                onClick={() => window.print()}
                className="hidden sm:inline-block px-2 py-0.5 rounded hover:bg-slate-100 transition text-slate-500 hover:text-slate-800"
                title="Print Document"
              >
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Right Header: Active Users & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <OnlineUsers users={activeUsers} />

          {/* AI Copilot Button */}
          <button
            type="button"
            onClick={() => setRightPanel(rightPanel === 'ai' ? null : 'ai')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs ${
              rightPanel === 'ai'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white ring-2 ring-violet-300'
                : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Copilot</span>
          </button>

          {/* Chat Button */}
          <button
            type="button"
            onClick={() => setRightPanel(rightPanel === 'chat' ? null : 'chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              rightPanel === 'chat'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1.5 shadow-xs transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Left Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 transition-all duration-200 z-20">
            {/* Workspace Link */}
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
              <Link
                to={`/workspace/${document?.workspace?._id || document?.workspace}`}
                className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="truncate">
                  {document?.workspace?.name || 'Workspace'}
                </span>
              </Link>
              <button
                type="button"
                onClick={createNewDocInWorkspace}
                className="p-1 rounded-md bg-slate-800 hover:bg-brand-600 text-slate-300 hover:text-white transition shadow-xs"
                title="Create New Document"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Document Search Filter */}
            <div className="p-3 border-b border-slate-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchDocQuery}
                  onChange={(e) => setSearchDocQuery(e.target.value)}
                  placeholder="Filter documents..."
                  className="w-full bg-slate-800/80 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-brand-500 placeholder-slate-500"
                />
              </div>
            </div>

            {/* Document List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Workspace Docs ({filteredDocuments.length})
              </div>
              {filteredDocuments.map((doc) => {
                const isActive = doc._id === id;
                return (
                  <Link
                    key={doc._id}
                    to={`/document/${doc._id}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? 'bg-brand-600 text-white font-semibold shadow-xs'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                    }`}
                  >
                    <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate flex-1">{doc.title || 'Untitled'}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0"></span>
                    )}
                  </Link>
                );
              })}
            </div>
          </aside>
        )}

        {/* Center Paper Canvas Work Area */}
        <div className="flex-1 overflow-y-auto bg-slate-100/90 relative flex flex-col items-center">
          {/* Document Sheet Container */}
          <div className="w-full max-w-[860px] mx-auto py-8 px-4 sm:px-6">
            <div className="bg-white rounded-xl shadow-paper border border-slate-200/80 overflow-hidden transition-all duration-200">
              <Editor
                ref={editorRef}
                initialContent={document?.content}
                onChange={handleEditorChange}
                onTextSelect={handleTextSelect}
                onOpenAI={() => setRightPanel('ai')}
              />
            </div>

            {/* Bottom Document Status Bar */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 px-2">
              <div className="flex items-center gap-4">
                <span>{stats.words} words</span>
                <span>{stats.characters} characters</span>
                <span>~{stats.readingTime} min read</span>
              </div>
              <button
                type="button"
                onClick={() => setShowWordCountModal(true)}
                className="hover:text-brand-600 transition underline underline-offset-2"
              >
                Document details
              </button>
            </div>
          </div>
        </div>

        {/* Right Collapsible Panel (AI Copilot or Team Chat) */}
        {rightPanel && (
          <aside className="w-80 sm:w-96 border-l border-slate-200 bg-white flex flex-col flex-shrink-0 shadow-lg z-20 transition-all">
            {rightPanel === 'ai' ? (
              <AISidebar
                selectedText={selectedText}
                onInsert={handleAIInsert}
                onOutlineInsert={handleOutlineInsert}
                onClose={() => setRightPanel(null)}
              />
            ) : (
              <ChatSidebar
                documentId={id}
                onClose={() => setRightPanel(null)}
              />
            )}
          </aside>
        )}
      </div>

      {/* Share Modal Dialog */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800">Share Document</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Anyone with access to this workspace can view and edit this document in real-time.
            </p>
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 mb-5">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="bg-transparent text-xs text-slate-700 flex-1 outline-none px-2 select-all"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Document link copied to clipboard');
                }}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Word Count & Stats Modal */}
      {showWordCountModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800">Document Statistics</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWordCountModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Words</span>
                <span className="font-bold text-slate-800">{stats.words}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Characters</span>
                <span className="font-bold text-slate-800">{stats.characters}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Estimated Reading Time</span>
                <span className="font-bold text-slate-800">{stats.readingTime} min</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Version Number</span>
                <span className="font-bold text-slate-800">v{document?.version || 1}</span>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowWordCountModal(false)}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
