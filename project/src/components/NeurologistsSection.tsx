import { useState, useEffect, useCallback } from 'react';
import { Stethoscope, Plus, Trash2, Phone, Edit, X, Save } from 'lucide-react';
import { useApp } from '@/lib/context';
import { supabase } from '@/lib/supabase';
import type { NeurologistContact } from '@/lib/types';

export default function NeurologistsSection() {
  const { t } = useApp();
  const [contacts, setContacts] = useState<NeurologistContact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', specialty: '', phone: '', notes: '' });

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('neurologist_contacts')
      .select('*')
      .order('created_at', { ascending: false });
    setContacts((data as NeurologistContact[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!form.name.trim()) return;
    if (editing) {
      await supabase.from('neurologist_contacts').update(form).eq('id', editing);
    } else {
      await supabase.from('neurologist_contacts').insert([form]);
    }
    setForm({ name: '', specialty: '', phone: '', notes: '' });
    setShowForm(false);
    setEditing(null);
    load();
  };

  const edit = (c: NeurologistContact) => {
    setForm({ name: c.name, specialty: c.specialty, phone: c.phone, notes: c.notes });
    setEditing(c.id);
    setShowForm(true);
  };

  const remove = async (id: string) => {
    await supabase.from('neurologist_contacts').delete().eq('id', id);
    load();
  };

  const inputCls = 'w-full rounded-xl border-2 border-stone-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500';
  const labelCls = 'block text-sm font-semibold text-stone-700 mb-1';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-3">
          <Stethoscope className="w-7 h-7 text-emerald-600" />
          {t('doctors.title')}
        </h2>
        {!showForm && (
          <button
            onClick={() => { setForm({ name: '', specialty: '', phone: '', notes: '' }); setEditing(null); setShowForm(true); }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl text-base transition-colors"
          >
            <Plus className="w-5 h-5" /> {t('doctors.add')}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-md border border-stone-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-stone-700">{editing ? t('common.edit') : t('doctors.add')}</h3>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('doctors.name')}</label>
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>{t('doctors.specialty')}</label>
              <input className={inputCls} value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>{t('doctors.phone')}</label>
              <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>{t('doctors.notes')}</label>
              <textarea className={inputCls} rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={save} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
              <Save className="w-5 h-5" /> {t('doctors.save')}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold px-5 py-2.5 rounded-xl transition-colors">
              {t('doctors.cancel')}
            </button>
          </div>
        </div>
      )}

      {contacts.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl p-10 shadow-md border border-stone-200 text-center">
          <Stethoscope className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 text-lg">{t('doctors.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl p-5 shadow-md border border-stone-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-stone-800 text-lg">{c.name}</h4>
                    {c.specialty && <p className="text-sm text-emerald-600 font-medium">{c.specialty}</p>}
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-stone-600 mt-2 hover:text-emerald-600 transition-colors">
                        <Phone className="w-4 h-4" /> {c.phone}
                      </a>
                    )}
                    {c.notes && <p className="text-sm text-stone-500 mt-2">{c.notes}</p>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => edit(c)} className="text-stone-400 hover:text-emerald-600 p-2 transition-colors">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => remove(c.id)} className="text-stone-400 hover:text-rose-500 p-2 transition-colors">
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
