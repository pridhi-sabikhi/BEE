import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Sparkles,
  FileText,
  CheckCheck,
  Languages,
  HelpCircle,
  Maximize2,
  Minimize2,
  Copy,
  PlusCircle,
  X,
  Send,
  ListTree,
  Loader2,
  Check,
  FileEdit,
} from 'lucide-react';

const AI_COMMANDS = [
  {
    key: 'summarize',
    label: 'Summarize',
    desc: 'Extract key points',
    icon: FileText,
    color: 'text-blue-500 bg-blue-50 hover:bg-blue-100',
  },
  {
    key: 'fix_grammar',
    label: 'Fix Grammar',
    desc: 'Spelling & punctuation',
    icon: CheckCheck,
    color: 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100',
  },
  {
    key: 'translate',
    label: 'Translate',
    desc: 'English / Spanish',
    icon: Languages,
    color: 'text-amber-500 bg-amber-50 hover:bg-amber-100',
  },
  {
    key: 'explain',
    label: 'Explain',
    desc: 'Simplify complex ideas',
    icon: HelpCircle,
    color: 'text-purple-500 bg-purple-50 hover:bg-purple-100',
  },
  {
    key: 'expand',
    label: 'Expand',
    desc: 'Add detail & depth',
    icon: Maximize2,
    color: 'text-indigo-500 bg-indigo-50 hover:bg-indigo-100',
  },
  {
    key: 'make_shorter',
    label: 'Make Shorter',
    desc: 'Concise phrasing',
    icon: Minimize2,
    color: 'text-rose-500 bg-rose-50 hover:bg-rose-100',
  },
];

export default function AISidebar({ selectedText, onInsert, onOutlineInsert, onClose }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [outlineTopic, setOutlineTopic] = useState('');
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [activeCommand, setActiveCommand] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('actions'); // 'actions' | 'outline'

  const runCommand = async (command) => {
    if (!selectedText) {
      toast.error('Please highlight some text in the document first');
      return;
    }
    setLoading(true);
    setActiveCommand(command);
    setResult('');
    try {
      const res = await api.post('/ai/command', {
        selectedText,
        command,
      });
      setResult(res.data.result);
      toast.success('AI response ready');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const generateOutline = async (e) => {
    e.preventDefault();
    if (!outlineTopic.trim()) return;
    setOutlineLoading(true);
    try {
      const res = await api.post('/ai/generate-outline', { topic: outlineTopic.trim() });
      onOutlineInsert(res.data.result);
      setOutlineTopic('');
      toast.success('Document outline generated and applied');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Outline generation failed');
    } finally {
      setOutlineLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-inner">
            <Sparkles className="w-4 h-4 text-violet-200" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
              AI Copilot
              <span className="text-[10px] font-medium bg-white/20 text-violet-100 px-1.5 py-0.5 rounded-full">
                Gemini
              </span>
            </h3>
            <p className="text-[11px] text-violet-200 font-normal">Intelligent writing companion</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition flex items-center justify-center"
          title="Close AI Sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-2 pt-1">
        <button
          type="button"
          onClick={() => setActiveTab('actions')}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 transition flex items-center justify-center gap-1.5 ${
            activeTab === 'actions'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileEdit className="w-3.5 h-3.5" />
          Quick Actions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('outline')}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 transition flex items-center justify-center gap-1.5 ${
            activeTab === 'outline'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListTree className="w-3.5 h-3.5" />
          Outline Generator
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'actions' && (
          <>
            {/* Selection Status Banner */}
            <div
              className={`p-3 rounded-xl border text-xs transition ${
                selectedText
                  ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900 shadow-xs'
                  : 'bg-amber-50/70 border-amber-200/80 text-amber-900'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="font-semibold text-xs mt-0.5">
                  {selectedText ? '✓ Text Selected:' : '💡 Hint:'}
                </span>
                <p className="line-clamp-2 italic text-slate-600 leading-relaxed">
                  {selectedText
                    ? `"${selectedText.slice(0, 110)}${selectedText.length > 110 ? '...' : ''}"`
                    : 'Select or highlight text in the document, then choose any AI action below.'}
                </p>
              </div>
            </div>

            {/* Quick Actions List */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Transform Selection
              </label>
              <div className="grid grid-cols-2 gap-2">
                {AI_COMMANDS.map((cmd) => {
                  const Icon = cmd.icon;
                  const isActive = loading && activeCommand === cmd.key;
                  return (
                    <button
                      key={cmd.key}
                      onClick={() => runCommand(cmd.key)}
                      disabled={loading || !selectedText}
                      className={`text-left p-2.5 rounded-xl border transition flex flex-col justify-between group relative overflow-hidden ${
                        isActive
                          ? 'border-indigo-500 bg-indigo-50/90 ring-2 ring-indigo-200'
                          : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:shadow-none'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${cmd.color}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition truncate">
                          {cmd.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 group-hover:text-slate-500 transition line-clamp-1">
                        {cmd.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {activeTab === 'outline' && (
          <div className="space-y-4">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <ListTree className="w-3.5 h-3.5 text-indigo-600" />
                Generate Full Outline
              </h4>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                Enter any topic and AI will structure headers and starter paragraphs directly for your doc.
              </p>
              <form onSubmit={generateOutline} className="space-y-2.5">
                <input
                  type="text"
                  value={outlineTopic}
                  onChange={(e) => setOutlineTopic(e.target.value)}
                  placeholder="e.g. Modern Web Development in 2026..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
                <button
                  type="submit"
                  disabled={outlineLoading || !outlineTopic.trim()}
                  className="w-full py-2 px-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {outlineLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Structuring Document...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Generate Outline
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="bg-slate-100/70 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                💡 Popular Ideas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Product Launch Plan',
                  'Team Meeting Agenda',
                  'Engineering Design Doc',
                  'Research Paper Abstract',
                ].map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => setOutlineTopic(idea)}
                    className="text-[10px] bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 px-2 py-1 rounded-md transition"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-3 p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-700 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <div className="text-xs">
              <span className="font-semibold block">Crafting suggestions...</span>
              <span className="text-[10px] text-indigo-500">Synthesizing with Gemini</span>
            </div>
          </div>
        )}

        {/* AI Result Card */}
        {result && !loading && (
          <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                AI Output
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto font-normal bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
              {result}
            </p>

            <button
              type="button"
              onClick={() => {
                onInsert(result);
                setResult('');
              }}
              className="w-full flex items-center justify-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-lg shadow-xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Insert into Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
