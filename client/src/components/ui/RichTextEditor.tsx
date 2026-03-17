import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { BoldIcon, ItalicIcon, ListIcon, ListOrderedIcon } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  limit?: number;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, limit, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || 'Start typing...',
        emptyEditorClass: 'is-editor-empty',
      }),
      CharacterCount.configure({
        limit: limit || 0,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getText()); // Use getText for social media compatibility
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px] p-4',
      },
    },
  });

  useEffect(() => {
    // Prevent cursor jumping by only updating if content actually changed from outside
    if (editor && editor.getText() !== value && typeof value === 'string') {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return <div className="min-h-[150px] animate-pulse bg-muted rounded-md" />;
  }

  const isNearLimit = limit ? editor.storage.characterCount.characters() > limit * 0.9 : false;
  const isAtLimit = limit ? editor.storage.characterCount.characters() >= limit : false;

  return (
    <div className={cn("flex flex-col rounded-xl border border-input bg-background shadow-sm focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500 transition-all", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-border bg-muted/30 p-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn("p-1.5 rounded-md hover:bg-muted text-muted-foreground", editor.isActive('bold') && "bg-muted text-foreground font-bold")}
          title="Bold"
        >
          <BoldIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn("p-1.5 rounded-md hover:bg-muted text-muted-foreground", editor.isActive('italic') && "bg-muted text-foreground")}
          title="Italic"
        >
          <ItalicIcon className="h-4 w-4" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn("p-1.5 rounded-md hover:bg-muted text-muted-foreground", editor.isActive('bulletList') && "bg-muted text-foreground")}
          title="Bullet List"
        >
          <ListIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn("p-1.5 rounded-md hover:bg-muted text-muted-foreground", editor.isActive('orderedList') && "bg-muted text-foreground")}
          title="Numbered List"
        >
          <ListOrderedIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Editor Area */}
      <div className="relative flex-1 overflow-y-auto custom-scrollbar">
        <EditorContent editor={editor} />
        
        {/* Placeholder styling is handled via css, but we can display limit here */}
        {limit && limit > 0 && (
          <div className={cn(
            "absolute bottom-2 right-3 text-[10px] font-medium transition-colors",
            isAtLimit ? "text-destructive" : isNearLimit ? "text-amber-500" : "text-muted-foreground"
          )}>
            {editor.storage.characterCount.characters()} / {limit}
          </div>
        )}
      </div>
    </div>
  );
}
