import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, ChevronUp, Code, FileText, Link2, Minus, Plus, RotateCcw, Save, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { copy } from "@/lib/document/copy";
import { plainText, safeHttpUrl } from "@/lib/document/html";
import { useDoc } from "@/lib/document/context";
import { moveItem, nextId, normalizeDoc } from "@/lib/document/model";
import { FocusCard } from "./focus-card";
import { RichField, RichRead } from "./rich-text";

const quiet =
  "inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-medium text-muted hover:bg-paper hover:text-ink disabled:opacity-40";

function savedStamp(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function HeaderCard() {
  const { doc, update } = useDoc();
  const set = (key: keyof typeof doc, value: string) => update((current) => ({ ...current, [key]: value }));
  const title = plainText(doc.title) || copy.title;

  const fields = (editing: boolean) => (
    <div>
      {editing ? (
        <RichField
          value={doc.title}
          onChange={(value) => set("title", value)}
          placeholder={copy.title}
          ariaLabel="Brief title"
          className="text-center font-serif text-4xl leading-tight text-ink"
        />
      ) : (
        <RichRead
          value={doc.title}
          placeholder={copy.title}
          className="text-center font-serif text-4xl leading-tight text-ink"
        />
      )}
      <div className="mt-4 flex w-full items-start gap-x-4 text-sm leading-relaxed text-muted">
        <div className="flex min-w-0 flex-1 items-start">
          <Pair
            editing={editing}
            label={doc.authorLabel}
            labelPlaceholder={copy.authorLabel}
            onLabel={(value) => set("authorLabel", value)}
            value={doc.author}
            valuePlaceholder={copy.author}
            onValue={(value) => set("author", value)}
            labelAria="Author label"
            valueAria="Author"
          />
        </div>
        <span className="hidden shrink-0 pt-1 text-line wide:inline" aria-hidden>
          |
        </span>
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {editing ? (
            <RichField
              value={doc.dateLabel}
              onChange={(value) => set("dateLabel", value)}
              placeholder={copy.dateLabel}
              ariaLabel="Date label"
              singleLine
              className="font-semibold text-ink"
            />
          ) : (
            <RichRead value={doc.dateLabel} placeholder={copy.dateLabel} className="min-w-0 flex-1 break-words font-semibold text-ink" />
          )}
          <time dateTime={doc.date || undefined} className="min-w-0 flex-1 break-words tabular-nums">
            {savedStamp(doc.date)}
          </time>
        </div>
        <span className="hidden shrink-0 pt-1 text-line wide:inline" aria-hidden>
          |
        </span>
        <div className="flex min-w-0 flex-1 items-start">
          <Pair
            editing={editing}
            label={doc.versionLabel}
            labelPlaceholder={copy.versionLabel}
            onLabel={(value) => set("versionLabel", value)}
            value={doc.version}
            valuePlaceholder={copy.version}
            onValue={(value) => set("version", value)}
            labelAria="Version label"
            valueAria="Version"
          />
        </div>
      </div>
      <Block
        editing={editing}
        label={doc.purposeLabel}
        labelPlaceholder={copy.purposeLabel}
        onLabel={(value) => set("purposeLabel", value)}
        value={doc.purpose}
        valuePlaceholder={copy.purpose}
        onValue={(value) => set("purpose", value)}
        labelAria="Purpose label"
        valueAria="Purpose"
      />
      <Block
        editing={editing}
        label={doc.audienceLabel}
        labelPlaceholder={copy.audienceLabel}
        onLabel={(value) => set("audienceLabel", value)}
        value={doc.audience}
        valuePlaceholder={copy.audience}
        onValue={(value) => set("audience", value)}
        labelAria="Audience label"
        valueAria="Audience"
      />
    </div>
  );

  return <FocusCard kicker="Brief" title={title} read={fields(false)} edit={fields(true)} />;
}

function Pair(props: {
  editing: boolean;
  label: string;
  labelPlaceholder: string;
  onLabel: (value: string) => void;
  value: string;
  valuePlaceholder: string;
  onValue: (value: string) => void;
  labelAria: string;
  valueAria: string;
}) {
  return (
    <span className="flex min-w-0 w-full flex-wrap items-baseline gap-x-2">
      {props.editing ? (
        <>
          <RichField
            value={props.label}
            onChange={props.onLabel}
            placeholder={props.labelPlaceholder}
            ariaLabel={props.labelAria}
            singleLine
            className="font-semibold text-ink"
          />
          <RichField
            value={props.value}
            onChange={props.onValue}
            placeholder={props.valuePlaceholder}
            ariaLabel={props.valueAria}
            singleLine
          />
        </>
      ) : (
        <>
          <RichRead value={props.label} placeholder={props.labelPlaceholder} className="min-w-0 flex-1 break-words font-semibold text-ink" />
          <RichRead value={props.value} placeholder={props.valuePlaceholder} className="min-w-0 flex-1 break-words" />
        </>
      )}
    </span>
  );
}

function Block(props: {
  editing: boolean;
  label: string;
  labelPlaceholder: string;
  onLabel: (value: string) => void;
  value: string;
  valuePlaceholder: string;
  onValue: (value: string) => void;
  labelAria: string;
  valueAria: string;
}) {
  return (
    <div className="mt-5 w-full">
      {props.editing ? (
        <>
          <RichField
            value={props.label}
            onChange={props.onLabel}
            placeholder={props.labelPlaceholder}
            ariaLabel={props.labelAria}
            singleLine
            className="min-w-0 break-words font-semibold text-ink"
          />
          <RichField
            value={props.value}
            onChange={props.onValue}
            placeholder={props.valuePlaceholder}
            ariaLabel={props.valueAria}
            className="mt-1 min-w-0 break-words text-base leading-relaxed"
          />
        </>
      ) : (
        <>
          <RichRead value={props.label} placeholder={props.labelPlaceholder} className="break-words font-semibold text-ink" />
          <RichRead value={props.value} placeholder={props.valuePlaceholder} className="mt-1 break-words text-base leading-relaxed" />
        </>
      )}
    </div>
  );
}

export function ProTipCard({ id }: { id: number }) {
  const { doc, update } = useDoc();
  const tip = doc.proTips.find((item) => item.id === id);
  if (!tip) return null;
  const title = plainText(tip.label) || copy.tipLabel;
  const fields = (editing: boolean) => (
    <div>
      {editing && doc.proTips.length > 1 ? (
        <button
          type="button"
          className={`${quiet} mb-2`}
          onClick={() => update((current) => ({ ...current, proTips: current.proTips.filter((item) => item.id !== id) }))}
        >
          <Minus className="size-4" /> Remove
        </button>
      ) : null}
      {editing ? (
        <>
          <RichField
            value={tip.label}
            onChange={(label) =>
              update((current) => ({
                ...current,
                proTips: current.proTips.map((item) => (item.id === id ? { ...item, label } : item)),
              }))
            }
            placeholder={copy.tipLabel}
            ariaLabel="Pro tip label"
            singleLine
            className="font-semibold text-ink not-italic"
          />
          <RichField
            value={tip.content}
            onChange={(content) =>
              update((current) => ({
                ...current,
                proTips: current.proTips.map((item) => (item.id === id ? { ...item, content } : item)),
              }))
            }
            placeholder={copy.tip}
            ariaLabel="Pro tip"
            className="mt-1 font-serif text-lg leading-relaxed italic"
          />
        </>
      ) : (
        <>
          <RichRead value={tip.label} placeholder={copy.tipLabel} className="font-semibold text-ink not-italic" />
          <RichRead value={tip.content} placeholder={copy.tip} className="mt-1 font-serif text-lg leading-relaxed italic" />
        </>
      )}
    </div>
  );
  return <FocusCard kicker="Pro tip" title={title} tone="tip" read={fields(false)} edit={fields(true)} />;
}

export function AddProTip() {
  const { update } = useDoc();
  return (
    <button
      type="button"
      className={`${quiet} no-print`}
      onClick={() =>
        update((current) => ({
          ...current,
          proTips: [...current.proTips, { id: nextId(current.proTips.map((item) => item.id)), label: "", content: "" }],
        }))
      }
    >
      <Plus className="size-4" /> Add pro tip
    </button>
  );
}

function LinkLabel({ displayText, url }: { displayText: string; url: string }) {
  const label = plainText(displayText);
  const href = safeHttpUrl(url);
  if (!label) return <span className="text-sm text-muted italic">{copy.linkLabel}</span>;
  if (!href) return <span className="text-base text-ink">{label}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-base text-accent underline">
      {label}
    </a>
  );
}

export function ReferencesCard() {
  const { doc, update } = useDoc();
  const [urlIndex, setUrlIndex] = useState<number | null>(null);
  const editingUrl = urlIndex !== null ? doc.links[urlIndex] : undefined;
  const fields = (editing: boolean) => (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">Reference</span>
          {editing ? (
            <button
              type="button"
              className={quiet}
              onClick={() => update((current) => ({ ...current, references: [...current.references, ""] }))}
            >
              <Plus className="size-4" /> Add
            </button>
          ) : null}
        </div>
        <ul className="space-y-2">
          {doc.references.map((reference, index) => (
            <li key={`ref-${index}`} className="flex items-start gap-1">
              {editing ? (
                <>
                  <button
                    type="button"
                    className={`${quiet} focus-only`}
                    aria-label="Move reference up"
                    disabled={index === 0}
                    onClick={() =>
                      update((current) => ({ ...current, references: moveItem(current.references, index, index - 1) }))
                    }
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    className={`${quiet} focus-only`}
                    aria-label="Move reference down"
                    disabled={index === doc.references.length - 1}
                    onClick={() =>
                      update((current) => ({ ...current, references: moveItem(current.references, index, index + 1) }))
                    }
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <RichField
                      value={reference}
                      ariaLabel={`Reference ${index + 1}`}
                      placeholder={copy.reference}
                      onChange={(value) =>
                        update((current) => ({
                          ...current,
                          references: current.references.map((item, itemIndex) => (itemIndex === index ? value : item)),
                        }))
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className={quiet}
                    aria-label="Remove reference"
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        references: current.references.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                  >
                    <Minus className="size-4" />
                  </button>
                </>
              ) : (
                <RichRead value={reference} placeholder={copy.reference} className="text-base" />
              )}
            </li>
          ))}
          {doc.references.length === 0 ? <li className="text-sm text-muted italic">{copy.reference}</li> : null}
        </ul>
      </div>
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">Link</span>
          {editing ? (
            <button
              type="button"
              className={quiet}
              onClick={() =>
                update((current) => ({ ...current, links: [...current.links, { url: "", displayText: "" }] }))
              }
            >
              <Plus className="size-4" /> Add
            </button>
          ) : null}
        </div>
        <ul className="space-y-3">
          {doc.links.map((link, index) => (
            <li key={`link-${index}`}>
                {editing ? (
                  <div className="rounded-xl bg-paper p-3">
                    <div className="mb-2 flex gap-1">
                      <button
                        type="button"
                        className={`${quiet} focus-only`}
                        aria-label="Move link up"
                        disabled={index === 0}
                        onClick={() => update((current) => ({ ...current, links: moveItem(current.links, index, index - 1) }))}
                      >
                        <ChevronUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        className={`${quiet} focus-only`}
                        aria-label="Move link down"
                        disabled={index === doc.links.length - 1}
                        onClick={() => update((current) => ({ ...current, links: moveItem(current.links, index, index + 1) }))}
                      >
                        <ChevronDown className="size-4" />
                      </button>
                      <button
                        type="button"
                        className={quiet}
                        aria-label="Remove link"
                        onClick={() =>
                          update((current) => ({
                            ...current,
                            links: current.links.filter((_, itemIndex) => itemIndex !== index),
                          }))
                        }
                      >
                        <Minus className="size-4" />
                      </button>
                    </div>
                    <RichField
                      value={link.displayText}
                      ariaLabel={`Link ${index + 1} label`}
                      placeholder={copy.linkLabel}
                      singleLine
                      onChange={(displayText) =>
                        update((current) => ({
                          ...current,
                          links: current.links.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, displayText } : item,
                          ),
                        }))
                      }
                    />
                    <button type="button" className={`${quiet} mt-2`} onClick={() => setUrlIndex(index)}>
                      <Link2 className="size-4" /> Edit URL
                    </button>
                    {plainText(link.displayText) ? (
                      <div className="mt-2">
                        <LinkLabel displayText={link.displayText} url={link.url} />
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <LinkLabel displayText={link.displayText} url={link.url} />
                )}
            </li>
          ))}
          {doc.links.length === 0 ? <li className="text-sm text-muted italic">{copy.linkLabel}</li> : null}
        </ul>
      </div>
    </div>
  );

  return (
    <>
      <FocusCard kicker="References & links" title="References & links" read={fields(false)} edit={fields(true)} />
      <Dialog.Root open={urlIndex !== null} onOpenChange={(open) => !open && setUrlIndex(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="no-print fixed inset-0 z-[60] bg-ink/40" />
          <Dialog.Content className="no-print fixed top-1/2 left-1/2 z-[60] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-sheet p-5 shadow-lift focus:outline-none">
            <Dialog.Title className="font-serif text-2xl text-ink">Link URL</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted">
              Only the label is shown. This address stays behind that text.
            </Dialog.Description>
            <label className="mt-4 block text-sm text-muted">
              {copy.linkUrl}
              <input
                type="url"
                inputMode="url"
                value={editingUrl?.url ?? ""}
                placeholder="https:// or www.example.com"
                onChange={(event) => {
                  const value = event.target.value;
                  if (urlIndex === null) return;
                  update((current) => ({
                    ...current,
                    links: current.links.map((item, itemIndex) =>
                      itemIndex === urlIndex ? { ...item, url: value } : item,
                    ),
                  }));
                }}
                className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 text-base text-ink outline-none"
              />
            </label>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink"
                onClick={() => setUrlIndex(null)}
              >
                Done
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

export function FooterCard() {
  const { doc, update, printShareUrl } = useDoc();
  const fields = (editing: boolean) => (
    <div className="text-center text-sm text-muted">
      {editing ? (
        <RichField
          value={doc.footerCopyright}
          onChange={(footerCopyright) => update((current) => ({ ...current, footerCopyright }))}
          placeholder={copy.footer}
          ariaLabel="Footer"
          className="text-center"
        />
      ) : (
        <RichRead value={doc.footerCopyright} placeholder={copy.footer} className="text-center" />
      )}
      <p className="mt-2 italic">
        <time dateTime={doc.date || undefined}>{savedStamp(doc.date)}</time>
      </p>
      {printShareUrl ? (
        <p className="print-only mt-6 border-t border-line pt-4">
          <a href={printShareUrl} className="text-accent underline">
            View online
          </a>
        </p>
      ) : null}
    </div>
  );
  return <FocusCard kicker="Footer" title="Footer" read={fields(false)} edit={fields(true)} />;
}

export function ActionDock() {
  const { doc, save, reset, shareCurrent, setPrintShareUrl, replace } = useDoc();
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  const openCode = () => {
    setCode(JSON.stringify(doc, null, 2));
    setCodeOpen(true);
  };

  const applyCode = () => {
    try {
      const parsed = JSON.parse(code) as unknown;
      if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { sections?: unknown }).sections)) {
        toast.error("Invalid code structure: sections are required");
        return;
      }
      replace(normalizeDoc(parsed));
      setCodeOpen(false);
      toast.success("Code applied");
    } catch (error) {
      console.error(error);
      toast.error("Failed to parse JSON. Check the syntax.");
    }
  };

  const share = async () => {
    const url = shareCurrent();
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Shareable link copied to clipboard");
    } catch (error) {
      console.error(error);
      toast.error("Could not copy the link. It is selected in the code editor instead.");
      setCode(url);
      setCodeOpen(true);
    }
  };

  const downloadPdf = () => {
    try {
      setPrintShareUrl(shareCurrent());
    } catch (error) {
      console.error(error);
    }
    window.setTimeout(() => window.print(), 80);
  };

  const actions = [
    { label: "Code", icon: Code, onClick: openCode, hint: "Import or export the brief as JSON" },
    { label: "Share", icon: Share2, onClick: () => void share(), hint: "Copy a link that keeps this brief in the address" },
    { label: "Save", icon: Save, onClick: () => save(false), hint: "Save this brief on this device, stamp the time, and bump the version" },
    { label: "Reset", icon: RotateCcw, onClick: () => setResetOpen(true), hint: "Clear this brief" },
    { label: "PDF", icon: FileText, onClick: downloadPdf, hint: "Open the print dialog without changing the version" },
  ];

  return (
    <>
      <nav
        aria-label="Brief actions"
        className="no-print fixed inset-x-3 bottom-3 z-30 rounded-2xl border border-line bg-sheet/95 shadow-border backdrop-blur wide:inset-x-auto wide:top-1/2 wide:right-4 wide:bottom-auto wide:left-auto wide:w-28 wide:-translate-y-1/2"
      >
        <ul className="grid grid-cols-5 pb-[max(0.25rem,env(safe-area-inset-bottom))] wide:grid-cols-1">
          {actions.map((action) => (
            <li key={action.label}>
              <button
                type="button"
                onClick={action.onClick}
                title={action.hint}
                className="flex min-h-14 w-full flex-col items-center justify-center gap-1 px-1 text-xs font-medium text-ink hover:bg-paper wide:min-h-16"
              >
                <action.icon className="size-5" />
                {action.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <Dialog.Root open={codeOpen} onOpenChange={setCodeOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-ink/40" />
          <Dialog.Content className="focus-panel z-[60] focus:outline-none">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div>
                <Dialog.Title className="font-serif text-2xl text-ink">Code import / export</Dialog.Title>
                <Dialog.Description className="text-sm text-muted">
                  Edit the JSON, then apply it to replace this brief.
                </Dialog.Description>
              </div>
              <button type="button" className={quiet} aria-label="Close" onClick={() => setCodeOpen(false)}>
                <X className="size-4" />
              </button>
            </div>
            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              spellCheck={false}
              className="min-h-0 flex-1 resize-none bg-paper p-4 font-mono text-sm text-ink outline-none"
            />
            <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
              <button type="button" className={quiet} onClick={() => setCodeOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={quiet}
                onClick={() => {
                  void navigator.clipboard.writeText(code).then(
                    () => toast.success("Code copied"),
                    () => toast.error("Could not copy code"),
                  );
                }}
              >
                Copy
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink"
                onClick={applyCode}
              >
                Apply code
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={resetOpen} onOpenChange={setResetOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-ink/40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-[60] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-sheet p-5 shadow-lift focus:outline-none">
            <Dialog.Title className="font-serif text-2xl text-ink">Reset this brief?</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted">
              This clears everything saved on this device and cannot be undone.
            </Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={quiet} onClick={() => setResetOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center rounded-xl bg-danger px-4 text-sm font-semibold text-sheet"
                onClick={() => {
                  reset();
                  setResetOpen(false);
                }}
              >
                Reset
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
