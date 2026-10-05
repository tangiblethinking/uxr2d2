import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Bold,
  Check,
  Highlighter,
  Italic,
  MoreHorizontal,
  Strikethrough,
  Underline,
} from "lucide-react";
import { plainText, sanitizeHtml, toEditorHtml } from "@/lib/document/html";

const COLORS = [
  { label: "Purple", value: "#a855f7" },
  { label: "Pink", value: "#ec4899" },
  { label: "Orange", value: "#f97316" },
  { label: "Mint", value: "#2dd4bf" },
  { label: "Blue", value: "#3b82f6" },
];

const STYLES = [
  { label: "Title", size: "32px", style: "normal" },
  { label: "Heading", size: "24px", style: "normal" },
  { label: "Subheading", size: "18px", style: "normal" },
  { label: "Body", size: "16px", style: "normal" },
  { label: "Monostyled", size: "12px", style: "monostyled" },
  { label: "Bulleted list", size: "16px", style: "bulleted" },
  { label: "Dashed list", size: "16px", style: "dashed" },
  { label: "Numbered list", size: "16px", style: "numbered" },
  { label: "Block quote", size: "16px", style: "blockquote" },
];

type RichFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  className?: string;
  singleLine?: boolean;
};

function applyCustomStyle(style: string) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const selectedText = range.toString();
  if (!selectedText) return;
  range.deleteContents();
  let wrapper: HTMLElement;
  if (style === "monostyled") {
    wrapper = document.createElement("span");
    wrapper.style.fontFamily = "ui-monospace, monospace";
    wrapper.style.fontSize = "12px";
    wrapper.style.backgroundColor = "#f3f4f6";
    wrapper.style.padding = "2px 4px";
    wrapper.style.borderRadius = "3px";
    wrapper.textContent = selectedText;
  } else if (style === "blockquote") {
    wrapper = document.createElement("div");
    wrapper.style.backgroundColor = "#f3f4f6";
    wrapper.style.borderLeft = "4px solid #6b7280";
    wrapper.style.padding = "8px 12px";
    wrapper.style.marginTop = "4px";
    wrapper.style.marginBottom = "4px";
    wrapper.textContent = selectedText;
  } else {
    const lines = selectedText.split("\n").filter((line) => line.trim());
    wrapper = document.createElement("div");
    lines.forEach((line, index) => {
      const lineNode = document.createElement("div");
      const prefix = style === "bulleted" ? "• " : style === "dashed" ? "– " : `${index + 1}. `;
      lineNode.textContent = `${prefix}${line}`;
      wrapper.appendChild(lineNode);
    });
  }
  range.insertNode(wrapper);
  const after = document.createRange();
  after.setStartAfter(wrapper);
  after.collapse(true);
  selection.removeAllRanges();
  selection.addRange(after);
}

export function RichRead({
  value,
  placeholder,
  className = "",
}: {
  value: string;
  placeholder: string;
  className?: string;
}) {
  if (!plainText(value)) {
    return <p className={`italic text-muted ${className}`}>{placeholder}</p>;
  }
  return <div className={className} dangerouslySetInnerHTML={{ __html: toEditorHtml(value) }} />;
}

export function RichField({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = "",
  singleLine = false,
}: RichFieldProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [menu, setMenu] = useState<{ top: number; left: number } | null>(null);
  const [colorsOpen, setColorsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (document.activeElement === editor) return;
    const html = toEditorHtml(value);
    if (editor.innerHTML !== html) editor.innerHTML = html;
  }, [value, mounted]);

  useEffect(() => {
    const onSelection = () => {
      const editor = editorRef.current;
      const selection = window.getSelection();
      if (!editor || !selection || selection.rangeCount === 0) return;
      const node = selection.anchorNode;
      if (node && editor.contains(node)) savedRange.current = selection.getRangeAt(0).cloneRange();
    };
    document.addEventListener("selectionchange", onSelection);
    return () => document.removeEventListener("selectionchange", onSelection);
  }, []);

  const commit = () => {
    const editor = editorRef.current;
    if (!editor) return;
    onChange(sanitizeHtml(editor.innerHTML));
  };

  const focusTarget = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    if (!selection) return;
    const saved = savedRange.current;
    if (saved && editor.contains(saved.commonAncestorContainer) && !saved.collapsed) {
      selection.removeAllRanges();
      selection.addRange(saved);
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const run = (command: string, commandValue?: string) => {
    focusTarget();
    if (command === "customStyle" && commandValue) applyCustomStyle(commandValue);
    else if (command === "fontSize" && commandValue) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || !selection.toString()) return;
      const range = selection.getRangeAt(0);
      const text = range.toString();
      range.deleteContents();
      const span = document.createElement("span");
      span.style.fontSize = commandValue;
      span.textContent = text;
      range.insertNode(span);
    } else {
      document.execCommand(command, false, commandValue);
    }
    commit();
  };

  const openMenu = (button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const width = 240;
    const left = Math.min(rect.left, window.innerWidth - width - 12);
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > 300 ? rect.bottom + 8 : Math.max(8, rect.top - 300);
    setColorsOpen(false);
    setMenu({ top, left: Math.max(8, left) });
  };

  if (!mounted) {
    return <RichRead value={value} placeholder={placeholder} className={className} />;
  }

  return (
    <div className="group/field relative min-w-0 flex-1">
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={ariaLabel}
        aria-multiline={!singleLine}
        data-placeholder={placeholder}
        data-empty={plainText(value) ? "false" : "true"}
        onInput={commit}
        onKeyDown={(event) => {
          if (singleLine && event.key === "Enter") event.preventDefault();
        }}
        onPaste={(event) => {
          event.preventDefault();
          const html = event.clipboardData.getData("text/html");
          const text = event.clipboardData.getData("text/plain");
          if (html) document.execCommand("insertHTML", false, sanitizeHtml(html));
          else document.execCommand("insertText", false, text);
          commit();
        }}
        className={`min-w-0 whitespace-pre-wrap break-words outline-none ${className}`}
      />
      <button
        type="button"
        className="no-print absolute top-0 right-0 inline-flex size-11 items-center justify-center rounded-xl bg-sheet text-muted opacity-0 group-focus-within/field:opacity-100 hover:bg-paper hover:text-ink"
        aria-label={`Format ${ariaLabel}`}
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => openMenu(event.currentTarget)}
      >
        <MoreHorizontal className="size-4" />
      </button>
      {menu
        ? createPortal(
            <FormatMenu
              top={menu.top}
              left={menu.left}
              colorsOpen={colorsOpen}
              setColorsOpen={setColorsOpen}
              onClose={() => setMenu(null)}
              run={run}
            />,
            document.body,
          )
        : null}
    </div>
  );
}

function FormatMenu({
  top,
  left,
  colorsOpen,
  setColorsOpen,
  onClose,
  run,
}: {
  top: number;
  left: number;
  colorsOpen: boolean;
  setColorsOpen: (open: boolean) => void;
  onClose: () => void;
  run: (command: string, value?: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const hold = (event: MouseEvent) => event.preventDefault();

  return (
    <div
      ref={ref}
      className="no-print fixed z-[80] w-60 overflow-hidden rounded-2xl bg-ink text-sheet shadow-lift"
      style={{ top, left }}
    >
      <div className="flex items-center gap-1 border-b border-sheet/15 px-2 py-2">
        <MarkButton label="Bold" onMouseDown={hold} onClick={() => run("bold")}>
          <Bold className="size-4" />
        </MarkButton>
        <MarkButton label="Italic" onMouseDown={hold} onClick={() => run("italic")}>
          <Italic className="size-4" />
        </MarkButton>
        <MarkButton label="Underline" onMouseDown={hold} onClick={() => run("underline")}>
          <Underline className="size-4" />
        </MarkButton>
        <MarkButton label="Strikethrough" onMouseDown={hold} onClick={() => run("strikeThrough")}>
          <Strikethrough className="size-4" />
        </MarkButton>
        <MarkButton label="Highlight" onMouseDown={hold} onClick={() => run("backColor", "#add8e6")}>
          <Highlighter className="size-4" />
        </MarkButton>
        <MarkButton label="Text color" onMouseDown={hold} onClick={() => setColorsOpen(!colorsOpen)}>
          <span className="size-3 rounded-full" style={{ background: "#f97316" }} />
        </MarkButton>
      </div>
      {colorsOpen ? (
        <div className="border-b border-sheet/15 px-2 py-2">
          {COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onMouseDown={hold}
              onClick={() => run("foreColor", color.value)}
              className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-sm hover:bg-sheet/10"
            >
              <span className="size-3 rounded-full" style={{ background: color.value }} />
              {color.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="max-h-64 overflow-y-auto py-1">
        {STYLES.map((style) => (
          <button
            key={style.label}
            type="button"
            onMouseDown={hold}
            onClick={() =>
              style.style === "normal" ? run("fontSize", style.size) : run("customStyle", style.style)
            }
            className="flex min-h-11 w-full items-center gap-2 px-3 text-left hover:bg-sheet/10"
          >
            <Check className="size-3 opacity-0" />
            <span style={{ fontSize: Math.min(parseInt(style.size, 10), 18) }}>{style.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MarkButton({
  label,
  children,
  onClick,
  onMouseDown,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  onMouseDown: (event: MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={onMouseDown}
      onClick={onClick}
      className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-sheet/10"
    >
      {children}
    </button>
  );
}
