import { useState, useEffect, useCallback, useRef } from 'react';
import { UserCircle2, Plus, Trash2, Music, Video, Image as ImageIcon, Link2, Save, Check, Phone, X, AlertCircle } from 'lucide-react';
import { useApp } from '@/lib/context';
import { supabase, MEDIA_BUCKET } from '@/lib/supabase';
import type { FamilyContact, MediaItem, MediaType, PhotoRelation } from '@/lib/types';

const RELATION_OPTIONS: PhotoRelation[] = ['spouse', 'son', 'daughter', 'grandson', 'granddaughter', 'sibling', 'parent', 'friend', 'other'];

function isSpotifyUrl(url: string): boolean {
  return url.includes('open.spotify.com') || url.includes('spotify.com');
}

function spotifyEmbedUrl(url: string): string {
  const match = url.match(/spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/);
  if (match) {
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
  }
  const uriMatch = url.match(/spotify:([a-z]+):([a-zA-Z0-9]+)/);
  if (uriMatch) {
    return `https://open.spotify.com/embed/${uriMatch[1]}/${uriMatch[2]}`;
  }
  return '';
}

export default function ProfileSection() {
  const { t, profile, loadProfile } = useApp();
  const [form, setForm] = useState({
    patient_name: '',
    patient_birthdate: '',
    caregiver_name: '',
    caregiver_phone: '',
    caregiver_email: '',
    caregiver_relation: '',
    games_enabled: false,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [familyContacts, setFamilyContacts] = useState<FamilyContact[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [newContact, setNewContact] = useState({ name: '', relation: '', phone: '' });
  const [linkInput, setLinkInput] = useState('');
  const [linkCaption, setLinkCaption] = useState('');
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Photo upload modal state
  const [pendingPhoto, setPendingPhoto] = useState<{ file: File; preview: string } | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoRelation, setPhotoRelation] = useState<PhotoRelation | ''>('');
  const [photoOtherRelation, setPhotoOtherRelation] = useState('');
  const [uploading, setUploading] = useState(false);

  // Edit relation for existing photos
  const [editingRelation, setEditingRelation] = useState<string | null>(null);
  const [editRelationValue, setEditRelationValue] = useState<PhotoRelation | ''>('');
  const [editOtherRelation, setEditOtherRelation] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({
        patient_name: profile.patient_name,
        patient_birthdate: profile.patient_birthdate ?? '',
        caregiver_name: profile.caregiver_name,
        caregiver_phone: profile.caregiver_phone,
        caregiver_email: profile.caregiver_email,
        caregiver_relation: profile.caregiver_relation,
        games_enabled: profile.games_enabled,
      });
    }
  }, [profile]);

  const loadData = useCallback(async () => {
    const [contactsRes, mediaRes] = await Promise.all([
      supabase.from('family_contacts').select('*').order('created_at', { ascending: false }),
      supabase.from('media_items').select('*').order('created_at', { ascending: false }),
    ]);
    setFamilyContacts((contactsRes.data as FamilyContact[]) ?? []);
    setMediaItems((mediaRes.data as MediaItem[]) ?? []);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveProfile = async () => {
    setSaving(true);
    if (profile?.id) {
      await supabase
        .from('profiles')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', profile.id);
    } else {
      await supabase.from('profiles').insert([form]);
    }
    await loadProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addContact = async () => {
    if (!newContact.name.trim()) return;
    await supabase.from('family_contacts').insert([newContact]);
    setNewContact({ name: '', relation: '', phone: '' });
    loadData();
  };

  const deleteContact = async (id: string) => {
    await supabase.from('family_contacts').delete().eq('id', id);
    loadData();
  };

  const handlePhotoSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPendingPhoto({ file, preview: reader.result as string });
      setPhotoCaption(file.name.replace(/\.[^.]+$/, ''));
      setPhotoRelation('');
      setPhotoOtherRelation('');
    };
    reader.readAsDataURL(file);
  };

  const confirmPhotoUpload = async () => {
    if (!pendingPhoto) return;
    const relationValue = photoRelation === 'other' ? photoOtherRelation.trim() : photoRelation;
    if (!relationValue) return;

    setUploading(true);
    const file = pendingPhoto.file;
    const ext = file.name.split('.').pop();
    const path = `photo/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file);
    if (error) {
      alert(t('common.error'));
      setUploading(false);
      return;
    }
    await supabase.from('media_items').insert([
      { type: 'photo', caption: photoCaption, storage_path: path, external_url: null, relation: relationValue },
    ]);
    setPendingPhoto(null);
    setPhotoCaption('');
    setPhotoRelation('');
    setPhotoOtherRelation('');
    setUploading(false);
    loadData();
  };

  const uploadMedia = async (file: File, type: MediaType) => {
    const ext = file.name.split('.').pop();
    const path = `${type}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file);
    if (error) {
      alert(t('common.error'));
      return;
    }
    const caption = file.name.replace(/\.[^.]+$/, '');
    await supabase.from('media_items').insert([
      { type, caption, storage_path: path, external_url: null, relation: null },
    ]);
    loadData();
  };

  const addExternalLink = async () => {
    if (!linkInput.trim()) return;
    await supabase.from('media_items').insert([
      { type: 'song', caption: linkCaption || 'External Link', storage_path: null, external_url: linkInput.trim(), relation: null },
    ]);
    setLinkInput('');
    setLinkCaption('');
    loadData();
  };

  const deleteMedia = async (item: MediaItem) => {
    if (item.storage_path) {
      await supabase.storage.from(MEDIA_BUCKET).remove([item.storage_path]);
    }
    await supabase.from('media_items').delete().eq('id', item.id);
    loadData();
  };

  const saveRelationEdit = async (itemId: string) => {
    const relationValue = editRelationValue === 'other' ? editOtherRelation.trim() : editRelationValue;
    if (!relationValue) return;
    await supabase.from('media_items').update({ relation: relationValue }).eq('id', itemId);
    setEditingRelation(null);
    setEditRelationValue('');
    setEditOtherRelation('');
    loadData();
  };

  const getMediaUrl = (item: MediaItem) => {
    if (item.external_url) return item.external_url;
    if (item.storage_path) {
      const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(item.storage_path);
      return data.publicUrl;
    }
    return '';
  };

  const photos = mediaItems.filter((m) => m.type === 'photo');
  const videos = mediaItems.filter((m) => m.type === 'video');
  const songs = mediaItems.filter((m) => m.type === 'song');

  const labelCls = 'block text-sm font-semibold text-stone-700 mb-1';
  const inputCls = 'w-full rounded-xl border-2 border-stone-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500';
  const selectCls = inputCls + ' bg-white';
  const cardCls = 'bg-white rounded-2xl p-5 shadow-md border border-stone-200';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-3">
        <UserCircle2 className="w-7 h-7 text-teal-600" />
        {t('profile.title')}
      </h2>

      {/* Patient & Caregiver form */}
      <div className={cardCls}>
        <h3 className="text-lg font-bold text-teal-700 mb-4">{t('profile.patient')}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t('profile.patientName')}</label>
            <input className={inputCls} value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>{t('profile.birthdate')}</label>
            <input type="date" className={inputCls} value={form.patient_birthdate} onChange={(e) => setForm({ ...form, patient_birthdate: e.target.value })} />
          </div>
        </div>

        <h3 className="text-lg font-bold text-teal-700 mt-6 mb-4">{t('profile.caregiver')}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t('profile.caregiverName')}</label>
            <input className={inputCls} value={form.caregiver_name} onChange={(e) => setForm({ ...form, caregiver_name: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>{t('profile.caregiverRelation')}</label>
            <input className={inputCls} value={form.caregiver_relation} onChange={(e) => setForm({ ...form, caregiver_relation: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>{t('profile.caregiverPhone')}</label>
            <input className={inputCls} value={form.caregiver_phone} onChange={(e) => setForm({ ...form, caregiver_phone: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>{t('profile.caregiverEmail')}</label>
            <input type="email" className={inputCls} value={form.caregiver_email} onChange={(e) => setForm({ ...form, caregiver_email: e.target.value })} />
          </div>
        </div>

        {/* Games toggle */}
        <div className="mt-6 bg-stone-50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-stone-800">{t('profile.gamesToggle')}</p>
            <p className="text-sm text-stone-500">{t('profile.gamesToggleDesc')}</p>
          </div>
          <button
            onClick={() => setForm({ ...form, games_enabled: !form.games_enabled })}
            className={`relative w-16 h-8 rounded-full transition-colors flex-shrink-0 ${form.games_enabled ? 'bg-teal-500' : 'bg-stone-300'}`}
          >
            <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${form.games_enabled ? 'left-9' : 'left-1'}`} />
          </button>
        </div>

        <button
          onClick={saveProfile}
          disabled={saving}
          className="mt-5 flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl text-base transition-colors disabled:opacity-50"
        >
          {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saved ? t('profile.saved') : t('profile.save')}
        </button>
      </div>

      {/* Family contacts */}
      <div className={cardCls}>
        <h3 className="text-lg font-bold text-teal-700 mb-4">{t('profile.familyContacts')}</h3>
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <input className={inputCls} placeholder={t('profile.contactName')} value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} />
          <input className={inputCls} placeholder={t('profile.contactRelation')} value={newContact.relation} onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })} />
          <div className="flex gap-2">
            <input className={inputCls} placeholder={t('profile.contactPhone')} value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addContact()} />
            <button onClick={addContact} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-4 flex-shrink-0 flex items-center justify-center transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {familyContacts.map((c) => (
            <div key={c.id} className="flex items-center gap-3 bg-stone-50 rounded-xl p-3">
              <Phone className="w-5 h-5 text-teal-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-stone-800">{c.name}</span>
                <span className="text-stone-500 ml-2 text-sm">{c.relation && `${c.relation} · `}{c.phone}</span>
              </div>
              <button onClick={() => deleteContact(c.id)} className="text-stone-400 hover:text-rose-500 transition-colors p-1">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Media section */}
      <div className={cardCls}>
        <h3 className="text-lg font-bold text-teal-700 mb-4">{t('profile.media')}</h3>

        {/* Upload buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => fileRefs.current.photo?.click()}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-3 rounded-xl transition-colors"
          >
            <ImageIcon className="w-5 h-5" /> {t('profile.uploadPhoto')}
          </button>
          <button
            onClick={() => fileRefs.current.video?.click()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded-xl transition-colors"
          >
            <Video className="w-5 h-5" /> {t('profile.uploadVideo')}
          </button>
          <button
            onClick={() => fileRefs.current.song?.click()}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-3 rounded-xl transition-colors"
          >
            <Music className="w-5 h-5" /> {t('profile.uploadSong')}
          </button>
        </div>
        <input ref={(el) => { fileRefs.current.photo = el; }} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhotoSelect(e.target.files[0])} />
        <input ref={(el) => { fileRefs.current.video = el; }} type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0], 'video')} />
        <input ref={(el) => { fileRefs.current.song = el; }} type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0], 'song')} />

        {/* External link for songs */}
        <div className="bg-stone-50 rounded-xl p-4 mb-6">
          <p className="font-semibold text-stone-700 mb-3 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-teal-600" /> {t('profile.addLink')}
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            <input className={inputCls} placeholder={t('profile.caption')} value={linkCaption} onChange={(e) => setLinkCaption(e.target.value)} />
            <input className={`${inputCls} sm:col-span-1`} placeholder={t('profile.externalLink')} value={linkInput} onChange={(e) => setLinkInput(e.target.value)} />
            <button onClick={addExternalLink} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl px-4 py-3 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" /> {t('profile.addLinkBtn')}
            </button>
          </div>
        </div>

        {/* Photos grid with relation tags */}
        <div className="mb-6">
          <h4 className="font-bold text-stone-700 mb-3 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-teal-600" /> {t('profile.photos')}
          </h4>
          {photos.length === 0 ? (
            <p className="text-stone-400 text-sm">{t('profile.noMedia')}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((item) => {
                const url = getMediaUrl(item);
                return (
                  <div key={item.id} className="bg-stone-50 rounded-xl p-3 relative group">
                    {url && <img src={url} alt={item.caption} className="w-full h-32 object-cover rounded-lg mb-2" />}
                    <p className="text-sm font-medium text-stone-700 truncate">{item.caption}</p>
                    {/* Relation tag */}
                    {editingRelation === item.id ? (
                      <div className="mt-2 space-y-2">
                        <select
                          className="w-full text-sm rounded-lg border-2 border-stone-300 px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          value={editRelationValue}
                          onChange={(e) => setEditRelationValue(e.target.value as PhotoRelation | '')}
                        >
                          <option value="">{t('profile.relation')}</option>
                          {RELATION_OPTIONS.map((r) => (
                            <option key={r} value={r}>{t(`relation.${r}`)}</option>
                          ))}
                        </select>
                        {editRelationValue === 'other' && (
                          <input
                            className="w-full text-sm rounded-lg border-2 border-stone-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder={t('relation.other')}
                            value={editOtherRelation}
                            onChange={(e) => setEditOtherRelation(e.target.value)}
                          />
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveRelationEdit(item.id)}
                            disabled={!editRelationValue || (editRelationValue === 'other' && !editOtherRelation.trim())}
                            className="bg-teal-600 text-white text-xs font-semibold rounded-lg px-3 py-1 disabled:opacity-50"
                          >
                            {t('common.save')}
                          </button>
                          <button
                            onClick={() => { setEditingRelation(null); setEditRelationValue(''); setEditOtherRelation(''); }}
                            className="bg-stone-200 text-stone-600 text-xs font-semibold rounded-lg px-3 py-1"
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : item.relation ? (
                      <span
                        className="inline-block mt-1 text-xs font-semibold bg-teal-100 text-teal-700 rounded-full px-2 py-0.5 cursor-pointer hover:bg-teal-200"
                        onClick={() => { setEditingRelation(item.id); setEditRelationValue(RELATION_OPTIONS.find((r) => t(`relation.${r}`) === item.relation) ?? ''); setEditOtherRelation(item.relation); }}
                      >
                        {item.relation}
                      </span>
                    ) : (
                      <button
                        onClick={() => { setEditingRelation(item.id); setEditRelationValue(''); setEditOtherRelation(''); }}
                        className="mt-1 flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 hover:bg-amber-200"
                      >
                        <AlertCircle className="w-3 h-3" /> {t('profile.relationRequired')}
                      </button>
                    )}
                    <button
                      onClick={() => onDelete?.(item)}
                      className="absolute top-2 right-2 bg-white/80 rounded-lg p-1 text-stone-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Videos grid */}
        <MediaGallery title={t('profile.videos')} icon={<Video className="w-5 h-5 text-blue-600" />} items={videos} onDelete={deleteMedia} t={t} renderType="video" getMediaUrl={getMediaUrl} />

        {/* Songs with Spotify embed support */}
        <div className="mb-6">
          <h4 className="font-bold text-stone-700 mb-3 flex items-center gap-2">
            <Music className="w-5 h-5 text-amber-500" /> {t('profile.songs')}
          </h4>
          {songs.length === 0 ? (
            <p className="text-stone-400 text-sm">{t('profile.noMedia')}</p>
          ) : (
            <div className="space-y-3">
              {songs.map((item) => {
                const url = getMediaUrl(item);
                const isExternal = !!item.external_url;
                const isSpotify = isExternal && isSpotifyUrl(url);
                const embedUrl = isSpotify ? spotifyEmbedUrl(url) : '';
                return (
                  <div key={item.id} className="bg-stone-50 rounded-xl p-3 relative group">
                    <p className="text-sm font-medium text-stone-700 mb-2">{item.caption}</p>
                    {/* Uploaded audio file — primary, always works */}
                    {!isExternal && url && (
                      <audio src={url} controls className="w-full" />
                    )}
                    {/* Spotify embed — mini player inside app */}
                    {isSpotify && embedUrl && (
                      <iframe
                        src={embedUrl}
                        width="100%"
                        height="152"
                        frameBorder="0"
                        allow="encrypted-media"
                        className="rounded-lg"
                        title={item.caption}
                      />
                    )}
                    {/* Non-Spotify external link (YouTube etc.) — open externally */}
                    {isExternal && !isSpotify && (
                      <button
                        onClick={() => window.open(url, '_blank')}
                        className="w-full flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold rounded-lg p-2 transition-colors"
                      >
                        <Link2 className="w-4 h-4" /> {t('profile.openExternal')}
                      </button>
                    )}
                    {/* Fallback: "Open in Spotify" button */}
                    {isSpotify && (
                      <button
                        onClick={() => window.open(url, '_blank')}
                        className="mt-2 flex items-center gap-2 bg-green-100 hover:bg-green-200 text-green-800 font-semibold rounded-lg px-3 py-1.5 text-sm transition-colors"
                      >
                        <Music className="w-4 h-4" /> {t('profile.openLink')}
                      </button>
                    )}
                    <button
                      onClick={() => deleteMedia(item)}
                      className="absolute top-2 right-2 bg-white/80 rounded-lg p-1 text-stone-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Photo upload modal — requires relation */}
      {pendingPhoto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-stone-800">{t('profile.uploadPhoto')}</h3>
              <button onClick={() => setPendingPhoto(null)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <img src={pendingPhoto.preview} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-4" />
            <div className="space-y-3">
              <div>
                <label className={labelCls}>{t('profile.caption')}</label>
                <input className={inputCls} value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>{t('profile.relation')} <span className="text-rose-500">*</span></label>
                <select
                  className={selectCls}
                  value={photoRelation}
                  onChange={(e) => setPhotoRelation(e.target.value as PhotoRelation | '')}
                >
                  <option value="">-- {t('profile.relation')} --</option>
                  {RELATION_OPTIONS.map((r) => (
                    <option key={r} value={r}>{t(`relation.${r}`)}</option>
                  ))}
                </select>
              </div>
              {photoRelation === 'other' && (
                <div>
                  <label className={labelCls}>{t('relation.other')}</label>
                  <input className={inputCls} value={photoOtherRelation} onChange={(e) => setPhotoOtherRelation(e.target.value)} placeholder={t('relation.other')} />
                </div>
              )}
              {photoRelation && photoRelation !== 'other' && (
                <p className="text-xs text-stone-500">{t('profile.relationRequired')}</p>
              )}
              <button
                onClick={confirmPhotoUpload}
                disabled={!photoRelation || (photoRelation === 'other' && !photoOtherRelation.trim()) || uploading}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {uploading ? t('common.loading') : <>{<Save className="w-5 h-5" />} {t('common.save')}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface MediaGalleryProps {
  title: string;
  icon: React.ReactNode;
  items: MediaItem[];
  onDelete: (item: MediaItem) => void;
  t: (k: string) => string;
  renderType: 'video';
  getMediaUrl: (item: MediaItem) => string;
}

function MediaGallery({ title, icon, items, onDelete, t, renderType, getMediaUrl }: MediaGalleryProps) {
  return (
    <div className="mb-6">
      <h4 className="font-bold text-stone-700 mb-3 flex items-center gap-2">{icon} {title}</h4>
      {items.length === 0 ? (
        <p className="text-stone-400 text-sm">{t('profile.noMedia')}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item) => {
            const url = getMediaUrl(item);
            return (
              <div key={item.id} className="bg-stone-50 rounded-xl p-3 relative group">
                {renderType === 'video' && url && (
                  <video src={url} className="w-full h-32 object-cover rounded-lg mb-2" controls />
                )}
                <p className="text-sm font-medium text-stone-700 truncate">{item.caption}</p>
                <button
                  onClick={() => onDelete(item)}
                  className="absolute top-2 right-2 bg-white/80 rounded-lg p-1 text-stone-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
