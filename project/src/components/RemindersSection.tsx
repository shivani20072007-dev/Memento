import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Plus, Trash2, X, Save, Pill, Calendar, Droplet, BellRing, Clock } from 'lucide-react';
import { useApp } from '@/lib/context';
import { supabase } from '@/lib/supabase';
import type { Reminder, ReminderType } from '@/lib/types';

export default function RemindersSection() {
  const { t } = useApp();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ title: string; type: ReminderType; time: string; days: string }>({
    title: '',
    type: 'pill',
    time: '08:00',
    days: 'daily',
  });
  const [activeAlert, setActiveAlert] = useState<Reminder | null>(null);
  const alertedRef = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('reminders')
      .select('*')
      .order('time', { ascending: true });
    setReminders((data as Reminder[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Check for due reminders every 30 seconds
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      for (const r of reminders) {
        if (!r.active) continue;
        if (r.time === currentHM && !alertedRef.current.has(`${r.id}-${currentHM}`)) {
          alertedRef.current.add(`${r.id}-${currentHM}`);
          setActiveAlert(r);
        }
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [reminders]);

  const save = async () => {
    if (!form.title.trim()) return;
    await supabase.from('reminders').insert([form]);
    setForm({ title: '', type: 'pill', time: '08:00', days: 'daily' });
    setShowForm(false);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('reminders').delete().eq('id', id);
    load();
  };

  const toggleActive = async (r: Reminder) => {
    await supabase.from('reminders').update({ active: !r.active }).eq('id', r.id);
    load();
  };

  const typeIcon = (type: ReminderType) => {
    if (type === 'pill') return <Pill className="w-5 h-5" />;
    if (type === 'appointment') return <Calendar className="w-5 h-5" />;
    return <Droplet className="w-5 h-5" />;
  };

  const typeColor = (type: ReminderType) => {
    if (type === 'pill') return 'bg-rose-100 text-rose-600';
    if (type === 'appointment') return 'bg-blue-100 text-blue-600';
    return 'bg-cyan-100 text-cyan-600';
  };

  const inputCls = 'w-full rounded-xl border-2 border-stone-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500';
  const labelCls = 'block text-sm font-semibold text-stone-700 mb-1';

  return (
    <div className="space-y-6">
      {/* In-app alert popup */}
      {activeAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BellRing className="w-8 h-8 text-rose-600 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">{t('reminders.dueNow')}</h3>
            <p className="text-lg text-stone-700 font-semibold">{activeAlert.title}</p>
            <p className="text-stone-500 text-sm mt-1">{activeAlert.time}</p>
            <button
              onClick={() => setActiveAlert(null)}
              className="mt-6 bg-rose-500 hover:bg-rose-600 text-white font-bold px-8 py-3 rounded-xl text-lg transition-colors"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-3">
          <Bell className="w-7 h-7 text-rose-500" />
          {t('reminders.title')}
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold px-5 py-3 rounded-xl text-base transition-colors"
          >
            <Plus className="w-5 h-5" /> {t('reminders.add')}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-md border border-stone-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-stone-700">{t('reminders.add')}</h3>
            <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>{t('reminders.title_field')}</label>
              <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>{t('reminders.type')}</label>
              <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ReminderType })}>
                <option value="pill">{t('reminders.pill')}</option>
                <option value="appointment">{t('reminders.appointment')}</option>
                <option value="water">{t('reminders.water')}</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('reminders.time')}</label>
              <input type="time" className={inputCls} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={save} className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
              <Save className="w-5 h-5" /> {t('reminders.save')}
            </button>
            <button onClick={() => setShowForm(false)} className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold px-5 py-2.5 rounded-xl transition-colors">
              {t('reminders.cancel')}
            </button>
          </div>
        </div>
      )}

      {reminders.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl p-10 shadow-md border border-stone-200 text-center">
          <Bell className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 text-lg">{t('reminders.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((r) => (
            <div key={r.id} className={`bg-white rounded-2xl p-4 shadow-md border border-stone-200 ${!r.active ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColor(r.type)}`}>
                  {typeIcon(r.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-stone-800">{r.title}</h4>
                  <div className="flex items-center gap-3 text-sm text-stone-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {r.time}
                    </span>
                    <span>{r.days === 'daily' ? t('reminders.daily') : r.days}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(r)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${r.active ? 'bg-emerald-500' : 'bg-stone-300'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${r.active ? 'left-7' : 'left-1'}`} />
                  </button>
                  <button onClick={() => remove(r.id)} className="text-stone-400 hover:text-rose-500 p-1 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
