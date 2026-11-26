import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import { MessageSquare, Send, X, Users } from 'lucide-react';

export default function ChatSidebar({ documentId, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Load messages
  useEffect(() => {
    const socket = getSocket();
    if (!socket?.connected) return;

    socket.emit('get-messages', documentId, (msgs) => {
      setMessages(msgs || []);
      setLoading(false);
    });

    socket.on('receive-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('receive-message');
    };
  }, [documentId]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const socket = getSocket();
    if (!socket?.connected) return;

    socket.emit('send-message', documentId, {
      senderId: user._id,
      text: text.trim(),
    });
    setText('');
  };

  const formatTime = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">Document Chat</h3>
            <span className="text-[11px] text-slate-400">Real-time team discussion</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition flex items-center justify-center"
          title="Close Chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <span className="text-xs">Connecting to chat...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 mx-auto flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700 mb-1">No messages yet</h4>
            <p className="text-xs text-slate-400">
              Leave a note, share ideas, or collaborate on this document with your team.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?._id === user?._id;
            return (
              <div key={msg._id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs ${
                    isMe
                      ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500'
                      : 'bg-gradient-to-tr from-slate-600 to-slate-500'
                  }`}
                >
                  {msg.sender?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className={`max-w-[78%] ${isMe ? 'text-right' : ''}`}>
                  <div className={`flex items-center gap-1.5 mb-1 ${isMe ? 'justify-end' : ''}`}>
                    <span className="text-[11px] font-semibold text-slate-700">
                      {isMe ? 'You' : msg.sender?.name}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatTime(msg.createdAt)}</span>
                  </div>
                  <div
                    className={`inline-block px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-xs text-left ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={sendMessage} className="p-3 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1.5 border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition disabled:opacity-30 disabled:hover:bg-indigo-600 flex-shrink-0"
            title="Send"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
