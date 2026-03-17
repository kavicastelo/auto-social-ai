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
      const html = editor.getHTML();
      // Only call onChange if the content is actually different to avoid loops
      if (html !== value) {
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px] p-4',
      },
      handlePaste: () => {
        // Allow default paste behavior
        return false;
      }
    },
  });

  useEffect(() => {
    if (!editor || value === undefined) return;

    const currentHTML = editor.getHTML();
    const currentText = editor.getText().trim();
    
    // Only sync from parent if the editor is not focused 
    // OR if we are transitioning between placeholders and real content
    const isPlaceholder = currentText === 'AI is generating...' || currentText === 'Refining...';
    const isNewPlaceholder = value === 'AI is generating...' || value === 'Refining...';
    
    // Use HTML comparison for accurate state check
    const isDifferent = currentHTML !== value && currentHTML !== `<p>${value}</p>` && currentText !== value;
    
    if (isDifferent && (!editor.isFocused || isPlaceholder || isNewPlaceholder)) {
      editor.commands.setContent(value || '', { emitUpdate: false });
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
