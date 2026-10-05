import { deflate, inflate } from "pako";
import { plainText } from "./html";

export type SectionType = "interaction" | "checklist";

export type TableData = {
  id: number;
  label: string;
  headers: string[];
  rows: string[][];
  columnWidths?: Record<string, number>;
};

export type SectionData = {
  id: number;
  title: string;
  type: SectionType;
  images: string[];
  tables: TableData[];
};

export type ProTip = {
  id: number;
  label: string;
  content: string;
};

export type DocLink = {
  url: string;
  displayText: string;
};

export type DocState = {
  title: string;
  authorLabel: string;
  author: string;
  dateLabel: string;
  date: string;
  versionLabel: string;
  version: string;
  purposeLabel: string;
  purpose: string;
  audienceLabel: string;
  audience: string;
  sections: SectionData[];
  sectionOrder: number[];
  proTips: ProTip[];
  references: string[];
  links: DocLink[];
  footerCopyright: string;
  footerGenerated: string;
};

export const STORAGE_KEY = "uxrnd.doc.v1";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function blankTable(id = 1): TableData {
  return {
    id,
    label: "",
    headers: ["#", ""],
    rows: [["1", ""]],
  };
}

export function blankSection(id = 1): SectionData {
  return {
    id,
    title: "",
    type: "interaction",
    images: [""],
    tables: [blankTable(1)],
  };
}

export function blankDoc(): DocState {
  return {
    title: "",
    authorLabel: "Author:",
    author: "",
    dateLabel: "Date:",
    date: "",
    versionLabel: "Version:",
    version: "1.0",
    purposeLabel: "Purpose:",
    purpose: "",
    audienceLabel: "Audience:",
    audience: "",
    sections: [blankSection(1)],
    sectionOrder: [1],
    proTips: [{ id: 1, label: "", content: "" }],
    references: [""],
    links: [{ url: "", displayText: "" }],
    footerCopyright: "",
    footerGenerated: "",
  };
}

export function bumpVersion(version: string): string {
  const current = parseFloat(version);
  const base = Number.isFinite(current) ? current : 0;
  const incremented = Math.round((base + 0.1) * 10) / 10;
  const nextWhole = Math.floor(base) + 1;
  if (incremented >= nextWhole) return nextWhole.toFixed(1);
  return incremented.toFixed(1);
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

export function hasRowNumbers(headers: string[]): boolean {
  const first = plainText(headers[0] ?? "").trim().toLowerCase();
  return first === "#" || first.includes("number");
}

export function withRowNumbers(headers: string[], rows: string[][]): string[][] {
  if (!hasRowNumbers(headers)) return rows;
  let changed = false;
  const next = rows.map((row, index) => {
    const label = String(index + 1);
    if (row[0] === label) return row;
    changed = true;
    const copy = row.slice();
    copy[0] = label;
    return copy;
  });
  return changed ? next : rows;
}

export function orderedSections(doc: DocState): SectionData[] {
  const ordered = doc.sectionOrder
    .map((id) => doc.sections.find((section) => section.id === id))
    .filter((section): section is SectionData => !!section);
  const missing = doc.sections.filter((section) => !ordered.includes(section));
  return [...ordered, ...missing];
}

function normalizeTable(value: unknown, index: number): TableData {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const headers =
    Array.isArray(raw.headers) && raw.headers.length > 0
      ? raw.headers.map((header) => asString(header))
      : ["#", ""];
  const rowsIn = Array.isArray(raw.rows) ? raw.rows : [];
  let rows =
    rowsIn.length > 0
      ? rowsIn.map((row) => {
          const cells = Array.isArray(row) ? row : [];
          return headers.map((_, cellIndex) => asString(cells[cellIndex]));
        })
      : [headers.map(() => "")];
  rows = withRowNumbers(headers, rows);
  const columnWidths: Record<string, number> = {};
  if (raw.columnWidths && typeof raw.columnWidths === "object") {
    for (const [key, width] of Object.entries(raw.columnWidths as Record<string, unknown>)) {
      if (typeof width === "number" && Number.isFinite(width)) columnWidths[String(key)] = width;
    }
  }
  return {
    id: typeof raw.id === "number" ? raw.id : index + 1,
    label: asString(raw.label),
    headers,
    rows,
    columnWidths,
  };
}

function normalizeSection(value: unknown, index: number): SectionData {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const tablesIn = Array.isArray(raw.tables) ? raw.tables : [];
  const tables = (tablesIn.length > 0 ? tablesIn : [undefined]).map((table, tableIndex) =>
    normalizeTable(table, tableIndex),
  );
  return {
    id: typeof raw.id === "number" ? raw.id : index + 1,
    title: asString(raw.title),
    type: raw.type === "checklist" ? "checklist" : "interaction",
    images: Array.isArray(raw.images) ? raw.images.map((image) => asString(image)) : [""],
    tables,
  };
}

export function normalizeDoc(input: unknown): DocState {
  const blank = blankDoc();
  if (!input || typeof input !== "object") return blank;
  const raw = input as Record<string, unknown>;
  const sectionsIn = Array.isArray(raw.sections) ? raw.sections : [];
  const sections = (sectionsIn.length > 0 ? sectionsIn : [undefined]).map((section, index) =>
    normalizeSection(section, index),
  );
  const seen = new Set<number>();
  for (const section of sections) {
    while (seen.has(section.id)) section.id += 1;
    seen.add(section.id);
  }
  const known = new Set(sections.map((section) => section.id));
  const sectionOrder = Array.isArray(raw.sectionOrder)
    ? raw.sectionOrder.filter((id): id is number => typeof id === "number" && known.has(id))
    : [];
  for (const section of sections) {
    if (!sectionOrder.includes(section.id)) sectionOrder.push(section.id);
  }

  const tipsIn = Array.isArray(raw.proTips) ? raw.proTips : [];
  const proTips: ProTip[] =
    tipsIn.length > 0
      ? tipsIn.map((tip, index) => {
          const item = tip && typeof tip === "object" ? (tip as Record<string, unknown>) : {};
          return {
            id: typeof item.id === "number" ? item.id : index + 1,
            label: asString(item.label),
            content: asString(item.content),
          };
        })
      : blank.proTips;

  const references = Array.isArray(raw.references)
    ? raw.references.map((item) => asString(item))
    : blank.references;

  const links = Array.isArray(raw.links)
    ? raw.links.map((link) => {
        const item = link && typeof link === "object" ? (link as Record<string, unknown>) : {};
        return { url: asString(item.url), displayText: asString(item.displayText) };
      })
    : blank.links;

  return {
    title: asString(raw.title),
    authorLabel: asString(raw.authorLabel, blank.authorLabel),
    author: asString(raw.author),
    dateLabel: asString(raw.dateLabel, blank.dateLabel),
    date: asString(raw.date),
    versionLabel: asString(raw.versionLabel, blank.versionLabel),
    version: asString(raw.version, blank.version),
    purposeLabel: asString(raw.purposeLabel, blank.purposeLabel),
    purpose: asString(raw.purpose),
    audienceLabel: asString(raw.audienceLabel, blank.audienceLabel),
    audience: asString(raw.audience),
    sections,
    sectionOrder,
    proTips,
    references,
    links,
    footerCopyright: asString(raw.footerCopyright),
    footerGenerated: asString(raw.footerGenerated),
  };
}

export function encodeShare(doc: DocState): string {
  const compressed = deflate(JSON.stringify(doc), { level: 9 });
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < compressed.length; index += chunk) {
    binary += String.fromCharCode(...compressed.subarray(index, index + chunk));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeShare(urlSafe: string): DocState {
  let base64 = urlSafe.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  const json = inflate(bytes, { toText: true });
  return normalizeDoc(JSON.parse(json));
}

export function shareHref(doc: DocState): string {
  const encoded = encodeShare(doc);
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("share", encoded);
  return url.toString();
}

export function nextId(ids: number[]): number {
  return ids.reduce((max, id) => Math.max(max, id), 0) + 1;
}

export function addSection(doc: DocState): DocState {
  const id = nextId(doc.sections.map((section) => section.id));
  return {
    ...doc,
    sections: [...doc.sections, blankSection(id)],
    sectionOrder: [...doc.sectionOrder, id],
  };
}

export function cloneSection(doc: DocState, afterId: number): DocState {
  const source = doc.sections.find((section) => section.id === afterId);
  if (!source) return doc;
  const id = nextId(doc.sections.map((section) => section.id));
  const clone: SectionData = {
    id,
    title: plainText(source.title) ? `${source.title} (Copy)` : "",
    type: source.type,
    images: source.images.slice(),
    tables: source.tables.map((table, index) => ({
      id: id * 1000 + index + 1,
      label: table.label,
      headers: table.headers.slice(),
      rows: table.rows.map((row) => row.slice()),
      columnWidths: { ...table.columnWidths },
    })),
  };
  const sections = doc.sections.slice();
  const sourceIndex = sections.findIndex((section) => section.id === afterId);
  sections.splice(sourceIndex + 1, 0, clone);
  const sectionOrder = doc.sectionOrder.slice();
  const orderIndex = sectionOrder.indexOf(afterId);
  sectionOrder.splice(orderIndex + 1, 0, id);
  return { ...doc, sections, sectionOrder };
}

export function moveSection(doc: DocState, id: number, direction: -1 | 1): DocState {
  const index = doc.sectionOrder.indexOf(id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= doc.sectionOrder.length) return doc;
  return { ...doc, sectionOrder: moveItem(doc.sectionOrder, index, target) };
}

export function addColumn(table: TableData): TableData {
  const lastHeader = table.headers[table.headers.length - 1] ?? "";
  const headers = [...table.headers, lastHeader];
  const rows = table.rows.map((row) => [...row, row[row.length - 1] ?? ""]);
  return { ...table, headers, rows: withRowNumbers(headers, rows) };
}

export function removeColumn(table: TableData): TableData {
  if (table.headers.length <= 1) return table;
  const headers = table.headers.slice(0, -1);
  const rows = table.rows.map((row) => row.slice(0, -1));
  const columnWidths: Record<string, number> = {};
  for (const [key, width] of Object.entries(table.columnWidths ?? {})) {
    const index = Number(key);
    if (index < headers.length) columnWidths[String(index)] = width;
  }
  return { ...table, headers, rows: withRowNumbers(headers, rows), columnWidths };
}

export function addRow(table: TableData): TableData {
  const numbered = hasRowNumbers(table.headers);
  const row = table.headers.map((_, index) => (index === 0 && numbered ? String(table.rows.length + 1) : ""));
  return { ...table, rows: withRowNumbers(table.headers, [...table.rows, row]) };
}

export function removeRow(table: TableData): TableData {
  if (table.rows.length <= 1) return table;
  return { ...table, rows: withRowNumbers(table.headers, table.rows.slice(0, -1)) };
}

export function moveColumn(table: TableData, from: number, to: number): TableData {
  const headers = moveItem(table.headers, from, to);
  const rows = table.rows.map((row) => moveItem(row, from, to));
  const previous = table.headers.map((_, index) => table.columnWidths?.[String(index)]);
  const moved = moveItem(previous, from, to);
  const columnWidths: Record<string, number> = {};
  moved.forEach((width, index) => {
    if (typeof width === "number") columnWidths[String(index)] = width;
  });
  return { ...table, headers, rows: withRowNumbers(headers, rows), columnWidths };
}

export function moveRow(table: TableData, from: number, to: number): TableData {
  return { ...table, rows: withRowNumbers(table.headers, moveItem(table.rows, from, to)) };
}

export function setHeader(table: TableData, index: number, value: string): TableData {
  const headers = table.headers.slice();
  headers[index] = value;
  return { ...table, headers, rows: withRowNumbers(headers, table.rows) };
}

export function setCell(table: TableData, rowIndex: number, cellIndex: number, value: string): TableData {
  if (cellIndex === 0 && hasRowNumbers(table.headers)) return table;
  const rows = table.rows.map((row, index) => {
    if (index !== rowIndex) return row;
    const next = row.slice();
    while (next.length < table.headers.length) next.push("");
    next[cellIndex] = value;
    return next;
  });
  return { ...table, rows };
}
