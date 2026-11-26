import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { forwardRef, useImperativeHandle, useState } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  FileCode,
  Minus,
  Undo2,
  Redo2,
  RemoveFormatting,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

const ToolbarButton = ({ onClick, active = false, disabled = false, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded-md text-slate-700 hover:text-slate-900 transition-all duration-150 flex items-center justify-center ${
      active
        ? 'bg-brand-50 text-brand-600 font-semibold ring-1 ring-brand-200 shadow-xs'
        : 'hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent'
    }`}
  >
    {children}
  </button>
);

const ToolbarDivider = () => <div className="w-[1px] h-5 bg-slate-200 mx-1 self-center" />;

const Editor = forwardRef(({ initialContent, onChange, onTextSelect, onOpenAI }, ref) => {
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: true,
      }),
      Placeholder.configure({
        placeholder: 'Type your thoughts, notes, or press AI to generate...',
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: initialContent || {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange(json);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, ' ');
        onTextSelect(text);
      } else {
        onTextSelect('');
      }
    },
  });

  useImperativeHandle(ref, () => editor, [editor]);

  if (!editor) return null;

  const getCurrentHeadingLabel = () => {
    if (editor.isActive('heading', { level: 1 })) return 'Heading 1';
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2';
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3';
    return 'Normal text';
  };

  const handleHeadingSelect = (level) => {
    if (level === 0) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level }).run();
    }
    setStyleDropdownOpen(false);
  };

  return (
    <div className="relative w-full">
      {/* Sticky Google Docs Style Format Toolbar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-1.5 flex items-center gap-0.5 flex-wrap rounded-t-xl shadow-xs">
        {/* Undo / Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Heading Style Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setStyleDropdownOpen(!styleDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md border border-slate-200 hover:border-slate-300 transition"
          >
            <span>{getCurrentHeadingLabel()}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {styleDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setStyleDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-40 text-left">
                <button
                  type="button"
                  onClick={() => handleHeadingSelect(0)}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100 transition ${
                    !editor.isActive('heading') ? 'text-brand-600 font-semibold bg-brand-50' : 'text-slate-700'
                  }`}
                >
                  Normal text
                </button>
                <button
                  type="button"
                  onClick={() => handleHeadingSelect(1)}
                  className={`w-full text-left px-3 py-1.5 text-lg font-bold hover:bg-slate-100 transition ${
                    editor.isActive('heading', { level: 1 }) ? 'text-brand-600 bg-brand-50' : 'text-slate-800'
                  }`}
                >
                  Heading 1
                </button>
                <button
                  type="button"
                  onClick={() => handleHeadingSelect(2)}
                  className={`w-full text-left px-3 py-1.5 text-base font-semibold hover:bg-slate-100 transition ${
                    editor.isActive('heading', { level: 2 }) ? 'text-brand-600 bg-brand-50' : 'text-slate-800'
                  }`}
                >
                  Heading 2
                </button>
                <button
                  type="button"
                  onClick={() => handleHeadingSelect(3)}
                  className={`w-full text-left px-3 py-1.5 text-sm font-medium hover:bg-slate-100 transition ${
                    editor.isActive('heading', { level: 3 }) ? 'text-brand-600 bg-brand-50' : 'text-slate-800'
                  }`}
                >
                  Heading 3
                </button>
              </div>
            </>
          )}
        </div>

        <ToolbarDivider />

        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Alignments */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          active={editor.isActive({ textAlign: 'justify' })}
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Lists & Blocks */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <FileCode className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Divider line"
        >
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Clear Formatting"
        >
          <RemoveFormatting className="w-4 h-4" />
        </ToolbarButton>

        {/* AI Quick Trigger Button in Toolbar */}
        {onOpenAI && (
          <button
            type="button"
            onClick={onOpenAI}
            className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs hover:from-violet-700 hover:to-indigo-700 transition"
            title="Open AI Assistant"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Copilot</span>
          </button>
        )}
      </div>

      {/* Floating Bubble Menu on Text Selection */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 150 }}>
          <div className="flex items-center gap-1 bg-slate-900/95 text-white rounded-xl shadow-xl px-2 py-1.5 border border-slate-700 backdrop-blur-md">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded-lg text-xs transition ${
                editor.isActive('bold') ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-200'
              }`}
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded-lg text-xs transition ${
                editor.isActive('italic') ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-200'
              }`}
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1.5 rounded-lg text-xs transition ${
                editor.isActive('underline') ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-200'
              }`}
              title="Underline"
            >
              <UnderlineIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-1.5 rounded-lg text-xs transition ${
                editor.isActive('strike') ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-200'
              }`}
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`p-1.5 rounded-lg text-xs transition ${
                editor.isActive('code') ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-200'
              }`}
              title="Inline Code"
            >
              <Code className="w-3.5 h-3.5" />
            </button>

            {onOpenAI && (
              <>
                <div className="w-[1px] h-4 bg-slate-700 mx-1" />
                <button
                  type="button"
                  onClick={onOpenAI}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600 transition"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Ask AI</span>
                </button>
              </>
            )}
          </div>
        </BubbleMenu>
      )}

      {/* Editor Paper Canvas Area */}
      <div className="p-8 sm:p-14 min-h-[850px] cursor-text" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});

Editor.displayName = 'Editor';

export default Editor;
