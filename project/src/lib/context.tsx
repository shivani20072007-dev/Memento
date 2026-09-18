import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Language, Profile, GameSession } from './types';
import { getTranslator } from './i18n';
import { supabase } from './supabase';

interface AppContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
  profile: Profile | null;
  loadProfile: () => Promise<void>;
  gameSessions: GameSession[];
  loadGameSessions: () => Promise<void>;
  loading: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const LANG_KEY = 'companion_lang';

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANG_KEY) as Language | null;
    return stored ?? 'en';
  });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);

  const t = getTranslator(lang);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  }, []);

  const loadProfile = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').limit(1).maybeSingle();
    setProfile(data as Profile | null);
  }, []);

  const loadGameSessions = useCallback(async () => {
    const { data } = await supabase
      .from('game_sessions')
      .select('*')
      .order('played_at', { ascending: true });
    setGameSessions((data as GameSession[]) ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.all([loadProfile(), loadGameSessions()]);
      setLoading(false);
    })();
  }, [loadProfile, loadGameSessions]);

  return (
    <AppContext.Provider
      value={{ lang, setLang, t, profile, loadProfile, gameSessions, loadGameSessions, loading }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
