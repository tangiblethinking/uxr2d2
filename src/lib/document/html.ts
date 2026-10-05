const ALLOWED_TAGS = new Set([
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "S",
  "STRIKE",
  "SPAN",
  "BR",
  "DIV",
  "P",
  "UL",
  "OL",
  "LI",
  "BLOCKQUOTE",
  "MARK",
  "FONT",
  "A",
  "SUB",
  "SUP",
]);

const ALLOWED_STYLE = new Set([
  "font-size",
  "font-family",
  "font-weight",
  "font-style",
  "color",
  "background-color",
  "padding",
  "padding-left",
  "padding-right",
  "padding-top",
  "padding-bottom",
  "border-left",
  "border-radius",
  "margin-top",
  "margin-bottom",
  "text-decoration",
]);

export function plainText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(div|p|li|blockquote)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">");
}

function filterStyle(style: string): string {
  return style
    .split(";")
    .map((part) => part.trim())
    .filter((part) => {
      const name = part.split(":")[0]?.trim().toLowerCase();
      return !!name && ALLOWED_STYLE.has(name);
    })
    .join("; ");
}

export function sanitizeHtml(input: string): string {
  if (!input) return "";
  if (typeof document === "undefined") return escapeText(input);
  const template = document.createElement("template");
  template.innerHTML = input;

  const clean = (node: Node) => {
    let child = node.firstChild;
    while (child) {
      const next = child.nextSibling;
      if (child.nodeType === Node.TEXT_NODE) {
        child = next;
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.remove();
        child = next;
        continue;
      }
      const el = child as HTMLElement;
      if (!ALLOWED_TAGS.has(el.tagName)) {
        const firstMoved = el.firstChild;
        while (el.firstChild) node.insertBefore(el.firstChild, el);
        el.remove();
        child = firstMoved ?? next;
        continue;
      }
      for (const attr of [...el.attributes]) {
        const name = attr.name.toLowerCase();
        if (name === "style") {
          const filtered = filterStyle(attr.value);
          if (filtered) el.setAttribute("style", filtered);
          else el.removeAttribute("style");
        } else if (name === "href" && el.tagName === "A") {
          const href = attr.value.trim();
          if (!/^https?:/i.test(href)) el.removeAttribute("href");
          else {
            el.setAttribute("href", href);
            el.setAttribute("rel", "noopener noreferrer");
            el.setAttribute("target", "_blank");
          }
        } else {
          el.removeAttribute(attr.name);
        }
      }
      clean(el);
      child = next;
    }
  };

  clean(template.content);
  return template.innerHTML;
}

export function toEditorHtml(value: string): string {
  if (!value) return "";
  if (/[<>]/.test(value)) return sanitizeHtml(value);
  let safe = escapeText(value);
  safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  return safe.replace(/\n/g, "<br>");
}

export function safeHttpUrl(url: string): string | undefined {
  const trimmed = url.trim();
  if (!trimmed || /^\s*javascript:/i.test(trimmed) || /^\s*data:/i.test(trimmed)) return undefined;
  const withProtocol = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.toString();
  } catch {
    return undefined;
  }
  return undefined;
}
