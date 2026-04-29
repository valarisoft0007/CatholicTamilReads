"use client";

import { useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { uploadImageViaApi, getChapterImagePath } from "@/lib/firebase/storage";

// For songs/lyrics: Enter inserts <br> instead of creating a new <p>
const EnterAsLineBreak = Extension.create({
  name: "enterAsLineBreak",
  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.setHardBreak(),
    };
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  bookId?: string;
  chapterId?: string;
  bookType?: "book" | "songs";
}

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded px-2 py-1 text-sm transition-colors ${
        active
          ? "bg-gold/20 text-gold-dark"
          : "text-muted hover:bg-card-hover hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ content, onChange, bookId, chapterId, bookType }: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const isSongs = bookType === "songs";
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      ...(isSongs ? [EnterAsLineBreak] : []),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
      }),
      ImageExtension,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: isSongs
          ? "prose prose-lg max-w-none min-h-[400px] p-4 focus:outline-none [&_p]:my-0 [&_p]:leading-snug"
          : "prose prose-lg max-w-none min-h-[400px] p-4 focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  const addImage = () => {
    if (bookId) {
      imageInputRef.current?.click();
    } else {
      const url = prompt("Enter image URL:");
      if (url) editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !bookId) return;
    e.target.value = "";
    try {
      const path = getChapterImagePath(bookId, chapterId || "new", file.name);
      const url = await uploadImageViaApi(file, path);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Image upload failed. Please try again.");
    }
  };

  const addLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="overflow-hidden rounded-md border border-border">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 border-b border-border bg-card p-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline"
        >
          <u>U</u>
        </ToolbarButton>

        <span className="mx-1 border-l border-border" />

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          H3
        </ToolbarButton>

        <span className="mx-1 border-l border-border" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
        >
          &bull; List
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Ordered List"
        >
          1. List
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Blockquote"
        >
          &ldquo; Quote
        </ToolbarButton>

        <span className="mx-1 border-l border-border" />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="Align Left"
        >
          Left
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="Align Center"
        >
          Center
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="Align Right"
        >
          Right
        </ToolbarButton>

        <span className="mx-1 border-l border-border" />

        <ToolbarButton onClick={addLink} title="Insert Link">
          Link
        </ToolbarButton>
        <ToolbarButton onClick={addImage} title="Insert Image">
          Image
        </ToolbarButton>

        <span className="mx-1 border-l border-border" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          Undo
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          Redo
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFile}
        className="hidden"
      />
    </div>
  );
}
