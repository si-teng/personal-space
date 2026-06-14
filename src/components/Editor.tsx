import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered } from 'lucide-react';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export const Editor: React.FC<EditorProps> = ({ content, onChange, placeholder = '开始写作...' }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const toggle = (action: () => boolean, isActive: boolean) => (
    <button
      onClick={() => action()}
      className={`p-2 rounded-lg transition-colors ${
        isActive ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {action.name.includes('bold') && <Bold size={18} />}
      {action.name.includes('italic') && <Italic size={18} />}
      {action.name.includes('underline') && <UnderlineIcon size={18} />}
      {action.name.includes('Bullet') && <List size={18} />}
      {action.name.includes('Ordered') && <ListOrdered size={18} />}
    </button>
  );

  return (
    <div className="border border-gray-200 rounded-xl bg-white">
      <div className="flex gap-1 p-2 border-b border-gray-100">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive('bold') ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Bold size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive('italic') ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Italic size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive('underline') ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <UnderlineIcon size={18} />
        </button>
        <div className="w-px h-6 bg-gray-200 mx-1 self-center" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive('bulletList') ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <List size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-lg transition-colors ${
            editor.isActive('orderedList') ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <ListOrdered size={18} />
        </button>
      </div>
      <EditorContent
        editor={editor}
        className="p-4 min-h-[200px] prose prose-sm max-w-none focus:outline-none"
      />
    </div>
  );
};
