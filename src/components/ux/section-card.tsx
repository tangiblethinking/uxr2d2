import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Minus, Plus, X } from "lucide-react";
import { copy } from "@/lib/document/copy";
import { plainText, safeHttpUrl } from "@/lib/document/html";
import {
  blankTable,
  cloneSection,
  moveItem,
  moveSection,
  nextId,
  type SectionData,
} from "@/lib/document/model";
import { useDoc } from "@/lib/document/context";
import { ChartTable } from "./chart-table";
import { FocusCard } from "./focus-card";
import { RichField, RichRead } from "./rich-text";

const quiet =
  "inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-medium text-muted hover:bg-paper hover:text-ink disabled:opacity-40";

export function SectionCard({ section, index, total }: { section: SectionData; index: number; total: number }) {
  const { update } = useDoc();
  const title = plainText(section.title) || copy.section;
  const patch = (recipe: (current: SectionData) => SectionData) => {
    update((doc) => ({
      ...doc,
      sections: doc.sections.map((item) => (item.id === section.id ? recipe(item) : item)),
    }));
  };

  const body = (editing: boolean) => (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {editing ? (
          <>
            <button
              type="button"
              className={`${quiet} focus-only`}
              disabled={index === 0}
              onClick={() => update((doc) => moveSection(doc, section.id, -1))}
            >
              <ChevronUp className="size-4" /> Move up
            </button>
            <button
              type="button"
              className={`${quiet} focus-only`}
              disabled={index === total - 1}
              onClick={() => update((doc) => moveSection(doc, section.id, 1))}
            >
              <ChevronDown className="size-4" /> Move down
            </button>
            <div className="focus-only flex rounded-xl bg-paper p-1">
              {(["interaction", "checklist"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={section.type === type}
                  onClick={() => patch((current) => ({ ...current, type }))}
                  className={`min-h-11 rounded-lg px-3 text-sm font-medium ${
                    section.type === type ? "bg-sheet text-ink shadow-border" : "text-muted"
                  }`}
                >
                  {type === "interaction" ? "Interaction" : "Checklist"}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={quiet}
              onClick={() => update((doc) => cloneSection(doc, section.id))}
            >
              <Plus className="size-4" /> Add section
            </button>
            <button
              type="button"
              className={quiet}
              disabled={total <= 1}
              onClick={() =>
                update((doc) => ({
                  ...doc,
                  sections: doc.sections.filter((item) => item.id !== section.id),
                  sectionOrder: doc.sectionOrder.filter((id) => id !== section.id),
                }))
              }
            >
              <Minus className="size-4" /> Remove section
            </button>
          </>
        ) : null}
      </div>

      {editing ? (
        <RichField
          value={section.title}
          ariaLabel="Section title"
          placeholder={copy.section}
          className="font-serif text-2xl text-ink"
          onChange={(title) => patch((current) => ({ ...current, title }))}
        />
      ) : (
        <RichRead value={section.title} placeholder={copy.section} className="font-serif text-2xl text-ink" />
      )}

      <ImageRow section={section} editing={editing} patch={patch} />

      {section.tables.map((table, tableIndex) => (
        <div key={table.id} className="mt-6 border-t border-line pt-4">
          {editing ? (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={`${quiet} focus-only`}
                aria-label="Move chart up"
                disabled={tableIndex === 0}
                onClick={() =>
                  patch((current) => ({ ...current, tables: moveItem(current.tables, tableIndex, tableIndex - 1) }))
                }
              >
                <ChevronUp className="size-4" />
              </button>
              <button
                type="button"
                className={`${quiet} focus-only`}
                aria-label="Move chart down"
                disabled={tableIndex === section.tables.length - 1}
                onClick={() =>
                  patch((current) => ({ ...current, tables: moveItem(current.tables, tableIndex, tableIndex + 1) }))
                }
              >
                <ChevronDown className="size-4" />
              </button>
              <button
                type="button"
                className={quiet}
                disabled={section.tables.length <= 1}
                onClick={() =>
                  patch((current) => ({
                    ...current,
                    tables: current.tables.filter((item) => item.id !== table.id),
                  }))
                }
              >
                <Minus className="size-4" /> Remove chart
              </button>
            </div>
          ) : null}
          {editing ? (
            <RichField
              value={table.label}
              ariaLabel="Chart label"
              placeholder={copy.chart}
              singleLine
              className="text-base font-semibold text-ink"
              onChange={(label) =>
                patch((current) => ({
                  ...current,
                  tables: current.tables.map((item) => (item.id === table.id ? { ...item, label } : item)),
                }))
              }
            />
          ) : (
            <RichRead value={table.label} placeholder={copy.chart} className="text-base font-semibold text-ink" />
          )}
          <ChartTable
            table={table}
            variant={section.type}
            editing={editing}
            onChange={(next) =>
              patch((current) => ({
                ...current,
                tables: current.tables.map((item) => (item.id === table.id ? next : item)),
              }))
            }
          />
        </div>
      ))}

      {editing ? (
        <button
          type="button"
          className={`${quiet} mt-3`}
          onClick={() =>
            patch((current) => ({
              ...current,
              tables: [...current.tables, blankTable(nextId(current.tables.map((item) => item.id)))],
            }))
          }
        >
          <Plus className="size-4" /> Add chart
        </button>
      ) : null}
    </div>
  );

  return (
    <FocusCard kicker="Section" title={title} sectionId={section.id} read={body(false)} edit={body(true)} />
  );
}

function ImageRow({
  section,
  editing,
  patch,
}: {
  section: SectionData;
  editing: boolean;
  patch: (recipe: (current: SectionData) => SectionData) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const images = section.images;
  const open = openIndex !== null ? images[openIndex] : undefined;

  return (
    <div className="mt-4">
      {editing ? (
        <button
          type="button"
          className={quiet}
          onClick={() => patch((current) => ({ ...current, images: [...current.images, ""] }))}
        >
          <Plus className="size-4" /> Image
        </button>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-4">
        {images.map((url, imageIndex) => {
          const href = safeHttpUrl(url);
          return (
            <div key={`${section.id}-image-${imageIndex}`} className="w-full max-w-[18.75rem]">
              {editing ? (
                <div className="mb-2 flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    className={`${quiet} focus-only`}
                    aria-label="Move image earlier"
                    disabled={imageIndex === 0}
                    onClick={() =>
                      patch((current) => ({ ...current, images: moveItem(current.images, imageIndex, imageIndex - 1) }))
                    }
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    className={`${quiet} focus-only`}
                    aria-label="Move image later"
                    disabled={imageIndex === images.length - 1}
                    onClick={() =>
                      patch((current) => ({ ...current, images: moveItem(current.images, imageIndex, imageIndex + 1) }))
                    }
                  >
                    <ChevronRight className="size-4" />
                  </button>
                  <button
                    type="button"
                    className={quiet}
                    aria-label="Remove image"
                    onClick={() =>
                      patch((current) => ({
                        ...current,
                        images: current.images.filter((_, index) => index !== imageIndex),
                      }))
                    }
                  >
                    <Minus className="size-4" />
                  </button>
                </div>
              ) : null}
              <div className={`frame-portrait overflow-hidden rounded-xl bg-paper ${url ? "" : "print:hidden"}`}>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full"
                    onClick={(event) => {
                      event.preventDefault();
                      setOpenIndex(imageIndex);
                    }}
                  >
                    <img
                      src={href}
                      alt={copy.image}
                      className="h-full w-full object-cover outline outline-1 -outline-offset-1 outline-ink/10"
                    />
                  </a>
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted italic">
                    {copy.image}
                  </div>
                )}
              </div>
              {editing ? (
                <label className="mt-2 block text-sm text-muted">
                  {copy.imageUrl}
                  <input
                    type="url"
                    inputMode="url"
                    value={url}
                    placeholder="https://"
                    onChange={(event) =>
                      patch((current) => ({
                        ...current,
                        images: current.images.map((item, index) => (index === imageIndex ? event.target.value : item)),
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-line bg-sheet px-3 py-3 text-base break-all text-ink outline-none"
                  />
                </label>
              ) : null}
            </div>
          );
        })}
      </div>

      {open && safeHttpUrl(open) ? (
        <div
          className="no-print fixed inset-0 z-[70] flex flex-col items-center justify-center bg-ink/90 p-4"
          onClick={() => setOpenIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Expanded image"
        >
          <button
            type="button"
            className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-sheet px-4 text-sm font-semibold text-ink"
            onClick={() => setOpenIndex(null)}
          >
            <X className="size-4" /> Close
          </button>
          <div className="flex w-full max-w-5xl items-center justify-center gap-3" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-full bg-sheet text-ink"
              aria-label="Previous image"
              onClick={() =>
                setOpenIndex((current) => {
                  if (current === null) return current;
                  return current > 0 ? current - 1 : images.length - 1;
                })
              }
            >
              <ChevronLeft className="size-5" />
            </button>
            <img src={safeHttpUrl(open)} alt={copy.image} className="max-h-[75vh] max-w-[70vw] object-contain" />
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-full bg-sheet text-ink"
              aria-label="Next image"
              onClick={() =>
                setOpenIndex((current) => {
                  if (current === null) return current;
                  return current < images.length - 1 ? current + 1 : 0;
                })
              }
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
