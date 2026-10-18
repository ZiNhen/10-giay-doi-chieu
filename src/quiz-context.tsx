import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import demoRaw from './data/quiz.demo.json';
import { validateDataset, restoreAttempt, storageKey, type Dataset, type Attempt } from './domain';

if (!validateDataset(demoRaw, false)) throw new Error('Invalid bundled demo data');
const demo: Dataset = demoRaw;
interface QuizContextValue {
  data: Dataset; loading: boolean; dataError: boolean; retry: () => void;
  attempt: Attempt | null; update: (fn: (a: Attempt | null) => Attempt | null) => void; storageFailed: boolean;
}
const QuizContext = createContext<QuizContextValue | null>(null);
export function QuizProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(demo);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState(false);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [storageFailed, setStorageFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    const timer = window.setTimeout(() => controller.abort(), 8000);
    setLoading(true);
    async function load() {
      let next = demo;
      let failed = false;
      try {
        const response = await fetch('/data/quiz.official.json', { signal: controller.signal, cache: 'no-cache' });
        if (!response.ok) throw new Error('Unavailable quiz data');
        const value: unknown = await response.json();
        if (validateDataset(value)) next = value;
        else failed = true;
      } catch { failed = true; }
      finally { clearTimeout(timer); }
      if (disposed) return;
      setData(next); setDataError(failed); setAttempt(restoreAttempt(next)); setLoading(false);
    }
    void load();
    return () => { disposed = true; clearTimeout(timer); controller.abort(); };
  }, [revision]);
  useEffect(() => {
    if (loading) return;
    try {
      if (attempt) sessionStorage.setItem(storageKey, JSON.stringify(attempt));
      else sessionStorage.removeItem(storageKey);
      setStorageFailed(false);
    } catch { setStorageFailed(true); }
  }, [attempt, loading]);
  const update = useCallback((fn: (a: Attempt | null) => Attempt | null) => setAttempt(fn), []);
  return <QuizContext.Provider value={{ data, loading, dataError, retry: () => setRevision(r => r + 1), attempt, update, storageFailed }}>{children}</QuizContext.Provider>;
}
export function useQuiz() { const value = useContext(QuizContext); if (!value) throw new Error('QuizProvider required'); return value; }
