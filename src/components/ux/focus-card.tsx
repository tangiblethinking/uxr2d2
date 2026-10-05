import { useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Pencil } from "lucide-react";

export function FocusCard({
  kicker,
  title,
  sectionId,
  tone = "sheet",
  read,
  edit,
}: {
  kicker: string;
  title: string;
  sectionId?: number;
  tone?: "sheet" | "tip";
  read: ReactNode;
  edit: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const surface = tone === "tip" ? "bg-tip" : "bg-sheet";

  return (
    <article
      id={sectionId ? `section-${sectionId}` : undefined}
      data-section-id={sectionId}
      className={`scroll-mt-40 rounded-2xl shadow-border ${surface}`}
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-4 md:px-6 md:pt-5">
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">{kicker}</p>
        <button
          type="button"
          className="no-print inline-flex size-11 items-center justify-center rounded-xl text-ink hover:bg-paper"
          aria-label={`Edit ${kicker}`}
          onClick={() => setOpen(true)}
        >
          <Pencil className="size-4" />
        </button>
      </div>
      <div className="read-surface px-4 pb-5 wide:hidden md:px-6 md:pb-6">{read}</div>
      <div className="edit-surface hidden px-4 pb-5 wide:block md:px-6 md:pb-6">{open ? null : edit}</div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="no-print fixed inset-0 z-40 bg-ink/40" />
          <Dialog.Content className="focus-panel z-50 focus:outline-none">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">{kicker}</p>
                <Dialog.Title className="truncate font-serif text-xl text-ink">{title || kicker}</Dialog.Title>
                <Dialog.Description className="sr-only">
                  Focused editing for {kicker}. Changes stay in the brief. Choose Done when finished.
                </Dialog.Description>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink"
              >
                <Check className="size-4" />
                Done
              </button>
            </div>
            <div className={`min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5 ${tone === "tip" ? "bg-tip" : ""}`}>
              {open ? edit : null}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </article>
  );
}
