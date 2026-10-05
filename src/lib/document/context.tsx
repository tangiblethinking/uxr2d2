import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  blankDoc,
  bumpVersion,
  decodeShare,
  normalizeDoc,
  type DocState,
  shareHref,
  STORAGE_KEY,
} from "./model";

type DocContextValue = {
  doc: DocState;
  update: (recipe: (doc: DocState) => DocState) => void;
  replace: (doc: DocState) => void;
  save: (silent?: boolean) => DocState;
  reset: () => void;
  printShareUrl: string;
  setPrintShareUrl: (url: string) => void;
  shareCurrent: () => string;
};

const DocContext = createContext<DocContextValue | null>(null);

function stamp(doc: DocState): DocState {
  const version = bumpVersion(doc.version);
  const footerGenerated = `Generated for download on ${new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
  return { ...doc, version, footerGenerated, date: new Date().toISOString() };
}

export function DocProvider({ children }: { children: ReactNode }) {
  const [doc, setDoc] = useState<DocState>(blankDoc);
  const [printShareUrl, setPrintShareUrl] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const share = params.get("share");
    if (share) {
      try {
        const next = decodeShare(share);
        setDoc(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        toast.success("Opened shared brief");
        return;
      } catch (error) {
        console.error(error);
        toast.error("Could not open that share link");
      }
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      setDoc(normalizeDoc(JSON.parse(saved)));
    } catch (error) {
      console.error(error);
      toast.error("Saved brief could not be read");
    }
  }, []);

  const api = useMemo<DocContextValue>(() => {
    const update = (recipe: (current: DocState) => DocState) => {
      setDoc((current) => recipe(current));
    };
    const replace = (next: DocState) => setDoc(normalizeDoc(next));
    const save = (silent = false) => {
      const next = stamp(doc);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setDoc(next);
      if (!silent) toast.success(`Version ${next.version} saved`);
      return next;
    };
    return {
      doc,
      update,
      replace,
      save,
      reset: () => {
        const next = blankDoc();
        localStorage.removeItem(STORAGE_KEY);
        setDoc(next);
        setPrintShareUrl("");
        toast.success("Brief reset");
      },
      printShareUrl,
      setPrintShareUrl,
      shareCurrent: () => shareHref(doc),
    };
  }, [doc, printShareUrl]);

  return <DocContext.Provider value={api}>{children}</DocContext.Provider>;
}

export function useDoc() {
  const value = useContext(DocContext);
  if (!value) throw new Error("useDoc must be used within DocProvider");
  return value;
}
