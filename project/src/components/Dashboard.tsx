import { Home, UserCircle2, Gamepad2, TrendingUp, Stethoscope, Bell, Phone, Users } from 'lucide-react';
import { useApp } from '@/lib/context';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { FamilyContact } from '@/lib/types';

interface DashboardProps {
  onNavigate: (section: 'dashboard' | 'profile' | 'games' | 'insights' | 'neurologists' | 'reminders') => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { t, profile, gameSessions } = useApp();
  const [familyContacts, setFamilyContacts] = useState<FamilyContact[]>([]);

  useEffect(() => {
    supabase
      .from('family_contacts')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setFamilyContacts((data as FamilyContact[]) ?? []));
  }, []);

  const gamesEnabled = profile?.games_enabled ?? false;

  const cards: {
    icon: typeof Home;
    label: string;
    desc: string;
    section: 'profile' | 'games' | 'insights' | 'neurologists' | 'reminders';
    color: string;
  }[] = [
    { icon: UserCircle2, label: t('dashboard.profile'), desc: t('profile.desc'), section: 'profile', color: 'bg-teal-600' },
    ...(gamesEnabled
      ? [{ icon: Gamepad2, label: t('dashboard.games'), desc: t('games.desc'), section: 'games' as const, color: 'bg-amber-500' }]
      : []),
    { icon: TrendingUp, label: t('dashboard.insights'), desc: t('insights.desc'), section: 'insights', color: 'bg-blue-600' },
    { icon: Stethoscope, label: t('dashboard.doctors'), desc: t('doctors.desc'), section: 'neurologists', color: 'bg-emerald-600' },
    { icon: Bell, label: t('dashboard.reminders'), desc: t('reminders.desc'), section: 'reminders', color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="bg-gradient-to-br from-teal-700 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <h2 className="text-2xl sm:text-3xl font-bold">
          {t('dashboard.welcome')}
          {profile?.patient_name ? `, ${profile.patient_name}` : ''}
        </h2>
        <p className="text-teal-100 text-lg mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Navigation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.section}
              onClick={() => onNavigate(card.section)}
              className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all text-left group border border-stone-200 hover:border-teal-400"
            >
              <div className="flex items-center gap-4">
                <div className={`${card.color} w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-800">{card.label}</h3>
                  <p className="text-sm text-stone-500">{card.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {!gamesEnabled && (
        <p className="text-sm text-stone-500 italic">{t('dashboard.gamesOff')}</p>
      )}

      {/* Family contacts quick view */}
      <div className="bg-white rounded-2xl p-5 shadow-md border border-stone-200">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-teal-600" strokeWidth={2} />
          <h3 className="text-lg font-bold text-stone-800">{t('dashboard.family')}</h3>
        </div>
        {familyContacts.length === 0 ? (
          <p className="text-stone-400">{t('dashboard.family.empty')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {familyContacts.map((c) => (
              <div key={c.id} className="flex items-center gap-3 bg-stone-50 rounded-xl p-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-teal-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-stone-800 truncate">{c.name}</p>
                  <p className="text-sm text-stone-500">
                    {c.relation && `${c.relation} · `}
                    {c.phone || '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session count */}
      {gameSessions.length > 0 && (
        <p className="text-center text-sm text-stone-400">
          {gameSessions.length} {t('insights.total').toLowerCase()}
        </p>
      )}
    </div>
  );
}
