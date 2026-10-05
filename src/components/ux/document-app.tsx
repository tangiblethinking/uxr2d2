import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { plainText } from "@/lib/document/html";
import { DocProvider, useDoc } from "@/lib/document/context";
import { orderedSections } from "@/lib/document/model";
import { copy } from "@/lib/document/copy";
import { ActionDock, AddProTip, FooterCard, HeaderCard, ProTipCard, ReferencesCard } from "./meta-cards";
import { SectionCard } from "./section-card";

function Contents() {
  const { doc } = useDoc();
  const sections = orderedSections(doc);
  const [active, setActive] = useState<number | null>(sections[0]?.id ?? null);

  useEffect(() => {
    const nodes = sections
      .map((section) => document.getElementById(`section-${section.id}`))
      .filter((node): node is HTMLElement => !!node);
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const id = Number((visible.target as HTMLElement).dataset.sectionId);
        if (Number.isFinite(id)) setActive(id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.15, 0.4, 0.7] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [doc.sectionOrder.join("|"), sections.length]);

  return (
    <nav aria-label="Contents" className="sticky top-0 z-20 -mx-4 bg-paper/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-2xl md:px-2">
      <h2 className="mb-2 font-serif text-xl text-ink">Contents</h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sections.map((section) => {
          const label = plainText(section.title) || copy.section;
          const current = section.id === active;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className={`max-w-56 shrink-0 truncate rounded-full px-4 py-3 text-sm font-medium ${
                current ? "bg-accent text-accent-ink" : "bg-sheet text-ink shadow-border"
              }`}
              aria-current={current ? "true" : undefined}
            >
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Brief() {
  const { doc } = useDoc();
  const sections = orderedSections(doc);

  useEffect(() => {
    const title = plainText(doc.title);
    document.title = title ? `${title} · UX R&A` : "UX R&A";
  }, [doc.title]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-6 pb-28 md:px-6 md:pt-10 wide:pr-36">
      <HeaderCard />
      <div className="mt-4">
        <Contents />
      </div>
      <div className="mt-4 space-y-4">
        {sections.map((section, index) => (
          <SectionCard key={section.id} section={section} index={index} total={sections.length} />
        ))}
        {doc.proTips.map((tip) => (
          <ProTipCard key={tip.id} id={tip.id} />
        ))}
        <AddProTip />
        <ReferencesCard />
        <FooterCard />
      </div>
      <ActionDock />
    </div>
  );
}

export function DocumentApp() {
  return (
    <DocProvider>
      <main>
        <Brief />
        <Toaster position="top-center" />
      </main>
    </DocProvider>
  );
}
