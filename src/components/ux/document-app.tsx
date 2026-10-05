import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Toaster } from "sonner";
import { plainText } from "@/lib/document/html";
import { DocProvider, useDoc } from "@/lib/document/context";
import { orderedSections } from "@/lib/document/model";
import { copy } from "@/lib/document/copy";
import { ActionDock, AddProTip, FooterCard, HeaderCard, ProTipCard, ReferencesCard } from "./meta-cards";
import { AddSection, SectionCard } from "./section-card";

function ThemeSwitch() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const choose = (next: "light" | "dark") => {
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("uxrnd.theme", next);
    setTheme(next);
  };

  return (
    <div className="no-print inline-flex rounded-full bg-sheet p-1 shadow-border" role="group" aria-label="Color theme">
      {(["light", "dark"] as const).map((option) => {
        const selected = theme === option;
        const Icon = option === "light" ? Sun : Moon;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => choose(option)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ${
              selected ? "bg-accent text-accent-ink" : "text-muted hover:text-ink"
            }`}
          >
            <Icon className="size-4" />
            {option === "light" ? "Light" : "Dark"}
          </button>
        );
      })}
    </div>
  );
}

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
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const current = visible[0];
        if (!current) return;
        const id = Number((current.target as HTMLElement).dataset.sectionId);
        if (Number.isFinite(id)) setActive(id);
      },
      { rootMargin: "-96px 0px -45% 0px", threshold: [0, 0.15, 0.4] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [doc.sectionOrder.join("|"), sections.length]);

  const activeSection = sections.find((section) => section.id === active) ?? sections[0];
  const activeTitle = plainText(activeSection?.title ?? "") || copy.section;

  return (
    <nav
      aria-label="Contents"
      className="sticky-contents sticky top-0 z-20 -mx-4 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-2xl md:border md:px-4"
    >
      <h2 className="truncate font-serif text-2xl text-ink">{activeTitle}</h2>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {sections.map((section) => {
          const label = plainText(section.title) || copy.section;
          const current = section.id === activeSection?.id;
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
      <div className="mb-4 flex justify-end">
        <ThemeSwitch />
      </div>
      <HeaderCard />
      <div className="mt-4">
        <Contents />
        <div className="mt-4 space-y-4">
          {sections.map((section, index) => (
            <SectionCard key={section.id} section={section} index={index} total={sections.length} />
          ))}
          <AddSection />
          {doc.proTips.map((tip) => (
            <ProTipCard key={tip.id} id={tip.id} />
          ))}
          <AddProTip />
          <ReferencesCard />
          <FooterCard />
        </div>
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
        <Toaster position="bottom-right" offset={{ bottom: "5.75rem", right: "1rem" }} className="no-print" toastOptions={{ className: "no-print" }} />
      </main>
    </DocProvider>
  );
}