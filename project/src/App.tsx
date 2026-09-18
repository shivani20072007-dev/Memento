import { useState } from 'react';
import { Home, UserCircle2, Gamepad2, TrendingUp, Stethoscope, Bell, Globe, Brain } from 'lucide-react';
import { AppProvider, useApp } from '@/lib/context';
import type { Language } from '@/lib/types';
import Dashboard from '@/components/Dashboard';
import ProfileSection from '@/components/ProfileSection';
import GamesSection from '@/components/GamesSection';
import InsightsSection from '@/components/InsightsSection';
import NeurologistsSection from '@/components/NeurologistsSection';
import RemindersSection from '@/components/RemindersSection';

type Section = 'dashboard' | 'profile' | 'games' | 'insights' | 'neurologists' | 'reminders';

function Shell() {
  const { t, lang, setLang, profile } = useApp();
  const [section, setSection] = useState<Section>('dashboard');

  const navItems: { id: Section; icon: typeof Home; label: string }[] = [
    { id: 'dashboard', icon: Home, label: t('nav.dashboard') },
    { id: 'profile', icon: UserCircle2, label: t('nav.profile') },
    { id: 'games', icon: Gamepad2, label: t('nav.games') },
    { id: 'insights', icon: TrendingUp, label: t('nav.insights') },
    { id: 'neurologists', icon: Stethoscope, label: t('nav.neurologists') },
    { id: 'reminders', icon: Bell, label: t('nav.reminders') },
  ];

  const gamesEnabled = profile?.games_enabled ?? false;
  const navItemsFiltered = navItems.filter(
    (item) => item.id !== 'games' || gamesEnabled
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col lg:flex-row">
      {/* Sidebar (desktop) / Top bar (mobile) */}
      <nav className="bg-teal-800 text-white lg:w-64 lg:min-h-screen flex lg:flex-col flex-row items-center lg:items-stretch px-4 py-3 lg:py-6 gap-2 lg:gap-1 overflow-x-auto lg:overflow-visible shadow-lg z-10">
        <div className="hidden lg:flex items-center gap-3 px-2 mb-6 pb-4 border-b border-teal-700">
          <Brain className="w-8 h-8 text-amber-300" strokeWidth={2.5} />
          <div>
            <h1 className="text-lg font-bold leading-tight">{t('app.title')}</h1>
            <p className="text-xs text-teal-200">{t('app.subtitle')}</p>
          </div>
        </div>
        <div className="flex lg:hidden items-center gap-2 mr-auto">
          <Brain className="w-6 h-6 text-amber-300 flex-shrink-0" strokeWidth={2.5} />
          <span className="font-bold text-sm whitespace-nowrap">{t('app.title')}</span>
        </div>
        {navItemsFiltered.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 lg:py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                active
                  ? 'bg-amber-400 text-stone-900 shadow-md'
                  : 'text-teal-100 hover:bg-teal-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
        {/* Language switcher */}
        <div className="lg:mt-auto lg:pt-4 lg:border-t border-teal-700 flex items-center gap-2 ml-auto lg:ml-0">
          <Globe className="w-5 h-5 text-teal-200 flex-shrink-0" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Language)}
            className="bg-teal-700 text-white text-sm rounded-lg px-2 py-1.5 border border-teal-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="en">English</option>
            <option value="bn">বাংলা</option>
            <option value="as">অসমীয়া</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
        {section === 'dashboard' && <Dashboard onNavigate={setSection} />}
        {section === 'profile' && <ProfileSection />}
        {section === 'games' && <GamesSection />}
        {section === 'insights' && <InsightsSection />}
        {section === 'neurologists' && <NeurologistsSection />}
        {section === 'reminders' && <RemindersSection />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
