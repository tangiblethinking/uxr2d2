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
  dialog,
}: {
  kicker: string;
  title: string;
  sectionId?: number;
  tone?: "sheet" | "tip";
  read: ReactNode;
  edit: ReactNode;
  dialog?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const surface = tone === "tip" ? "bg-tip" : "bg-sheet";

  return (
    <article
      id={sectionId ? `section-${sectionId}` : undefined}
      data-section-id={sectionId}
      className={`relative scroll-mt-16 rounded-2xl shadow-border ${surface}`}
    >
      <button
        type="button"
        className="no-print absolute top-3 right-3 z-10 inline-flex size-11 items-center justify-center rounded-xl text-ink hover:bg-paper"
        aria-label={`Edit ${kicker}`}
        onClick={() => setOpen(true)}
      >
        <Pencil className="size-4" />
      </button>
      <div className="read-surface px-4 py-5 pr-14 wide:hidden md:px-6 md:py-6 md:pr-16">{read}</div>
      <div className="edit-surface hidden px-4 py-5 pr-14 wide:block md:px-6 md:py-6 md:pr-16">{open ? null : edit}</div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="no-print fixed inset-0 z-40 bg-ink/40" />
          <Dialog.Content className="focus-panel z-50 focus:outline-none">
            <div className="flex items-center justify-end gap-3 border-b border-line px-4 py-3">
              <Dialog.Title className="sr-only">{title || kicker}</Dialog.Title>
              <Dialog.Description className="sr-only">
                Focused editing. Changes stay in the brief. Choose Done when finished.
              </Dialog.Description>
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
              {open ? (dialog ?? edit) : null}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </article>
  );
}
