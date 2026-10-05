import { useEffect, useState } from "react";
import { ChevronDown, Moon, Sun } from "lucide-react";
import { Toaster } from "sonner";
import { plainText } from "@/lib/document/html";
import { DocProvider, useDoc } from "@/lib/document/context";
import { orderedSections } from "@/lib/document/model";
import { copy } from "@/lib/document/copy";
import { ActionDock, AddProTip, FooterCard, HeaderCard, ProTipCard, ReferencesCard } from "./meta-cards";
import { AddSection, SectionCard } from "./section-card";

function ThemeFab() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("uxrnd.theme", next ? "dark" : "light");
    setDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="no-print fixed bottom-24 left-4 z-30 inline-flex size-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-lift wide:bottom-6"
    >
      {dark ? <Sun className="size-6" /> : <Moon className="size-6" />}
    </button>
  );
}

function Contents() {
  const { doc } = useDoc();
  const sections = orderedSections(doc);
  const [active, setActive] = useState<number | null>(sections[0]?.id ?? null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const ids = sections.map((section) => section.id);
    let frame = 0;
    const update = () => {
      const marker = 72;
      let current = ids[0] ?? null;
      for (const id of ids) {
        const node = document.getElementById(`section-${id}`);
        if (!node) continue;
        if (node.getBoundingClientRect().top - marker <= 0) current = id;
      }
      setActive((previous) => (previous === current ? previous : current));
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [doc.sectionOrder.join("|"), sections.length]);

  const activeSection = sections.find((section) => section.id === active) ?? sections[0];
  const jump = (id: number) => {
    setMenuOpen(false);
    setActive(id);
    const node = document.getElementById(`section-${id}`);
    if (!node) return;
    const top = node.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  return (
    <nav aria-label="Contents" className="sticky-contents sticky top-0 z-20 -mx-4 bg-paper/95 px-4 py-2 backdrop-blur md:mx-0">
      <div className="relative wide:hidden">
        <button
          type="button"
          className="inline-flex max-w-full items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
          aria-expanded={menuOpen}
          aria-haspopup="listbox"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="truncate">{plainText(activeSection?.title ?? "") || copy.section}</span>
          <ChevronDown className="size-4 shrink-0" />
        </button>
        {menuOpen ? (
          <ul className="absolute top-full left-0 z-30 mt-2 max-h-64 w-64 overflow-y-auto rounded-2xl bg-sheet p-1 shadow-lift" role="listbox">
            {sections.map((section) => {
              const label = plainText(section.title) || copy.section;
              const current = section.id === activeSection?.id;
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={current}
                    onClick={() => jump(section.id)}
                    className={`block w-full truncate rounded-xl px-3 py-3 text-left text-sm ${
                      current ? "bg-accent text-accent-ink" : "text-ink hover:bg-paper"
                    }`}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      <div className="hidden gap-2 overflow-x-auto wide:flex">
        {sections.map((section) => {
          const label = plainText(section.title) || copy.section;
          const current = section.id === activeSection?.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => jump(section.id)}
              className={`max-w-56 shrink-0 truncate rounded-full px-4 py-2 text-sm font-medium ${
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
        <ThemeFab />
        <Toaster position="bottom-right" offset={{ bottom: "5.75rem", right: "1rem" }} className="no-print" toastOptions={{ className: "no-print" }} />
      </main>
    </DocProvider>
  );
}