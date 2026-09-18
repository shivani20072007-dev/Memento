import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import type { MediaItem, GameType } from '@/lib/types';
import { useApp } from '@/lib/context';

interface FamilyContactWithPhoto {
  contactId: string;
  name: string;
  relation: string;
  photoUrl: string;
}

interface Props {
  photos: MediaItem[];
  getPhotoUrl: (item: MediaItem) => string;
  onRecord: (gameType: GameType, completed: boolean, seconds: number, mistakes: number, difficulty: number) => void;
}

const RELATION_GROUPS = [
  { key: 'parent', labels: ['mother', 'mom', 'father', 'dad', 'parent', 'amma', 'appa', 'amma', 'appa', 'maa', 'papa', 'mata', 'pita'] },
  { key: 'spouse', labels: ['wife', 'husband', 'spouse', 'partner', 'manaivi', 'kanavan', 'patni', 'pati'] },
  { key: 'child', labels: ['son', 'daughter', 'child', 'magan', 'magan', 'magal', 'beti', 'beta', 'bacha'] },
  { key: 'sibling', labels: ['brother', 'sister', 'sibling', 'sagotharan', 'sagothari', 'bhai', 'behan'] },
  { key: 'grandparent', labels: ['grandmother', 'grandfather', 'grandparent', 'paati', 'thaatha', 'dadi', 'dada', 'nani', 'nana'] },
  { key: 'other', labels: [] },
];

function classifyRelation(relation: string): string {
  const lower = relation.toLowerCase();
  for (const group of RELATION_GROUPS) {
    if (group.labels.some((l) => lower.includes(l))) return group.key;
  }
  return 'other';
}

export default function FamilyTreeGame({ photos, getPhotoUrl, onRecord }: Props) {
  const { t } = useApp();
  const [phase, setPhase] = useState<'setup' | 'playing' | 'done'>('setup');
  const [photoData, setPhotoData] = useState<MediaItem[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);
  const [draggedPhoto, setDraggedPhoto] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Set<string>>(new Set());

  // For each photo, we need to know its relation from the caption or contact
  // Photos are just media_items with captions; we use the caption as the "relation" label
  // The game: each photo has a caption (name), and we ask the patient to place
  // it into the correct relation category. Since photos don't have a "relation" field,
  // we'll show relation groups and the patient matches photos to groups based on caption.
  // For a simpler, more playable game: we shuffle photos, and the patient drags each
  // photo to a "relation" slot. The correct slot is derived from caption keywords.

  useEffect(() => {
    setPhotoData(photos.slice(0, 6));
  }, [photos]);

  useEffect(() => {
    if (phase === 'playing') {
      setStartTime(Date.now());
      timerRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 500);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, startTime]);

  const start = () => {
    setPhase('playing');
    setAssignments({});
    setMistakes(0);
    setPlaced(new Set());
    setElapsed(0);
  };

  const expectedGroup = useCallback((item: MediaItem) => {
    return classifyRelation(item.caption);
  }, []);

  const handleDrop = (photoId: string, groupKey: string) => {
    const photo = photoData.find((p) => p.id === photoId);
    if (!photo) return;
    const expected = expectedGroup(photo);
    if (expected === groupKey) {
      setAssignments((prev) => ({ ...prev, [photoId]: groupKey }));
      setPlaced((prev) => new Set(prev).add(photoId));
      setDraggedPhoto(null);
      if (placed.size + 1 >= photoData.length) {
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        setPhase('done');
        if (timerRef.current) clearInterval(timerRef.current);
        onRecord('family_tree', true, seconds, mistakes, 3);
      }
    } else {
      setMistakes((m) => {
        const next = m + 1;
        return next;
      });
    }
  };

  if (phase === 'setup') {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md border border-stone-200">
        <h3 className="text-xl font-bold text-stone-800 mb-3">{t('games.familyTree')}</h3>
        <p className="text-stone-600 mb-4">{t('games.familyTreeDesc')}</p>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {photoData.map((p) => (
            <img key={p.id} src={getPhotoUrl(p)} alt={p.caption} className="w-full h-24 object-cover rounded-lg" />
          ))}
        </div>
        <button
          onClick={start}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-xl text-lg transition-colors"
        >
          {t('games.start')}
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md border border-stone-200 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-stone-800 mb-2">{t('games.completed')}</h3>
        <div className="flex justify-center gap-6 my-4">
          <div className="flex items-center gap-2 text-stone-600">
            <Clock className="w-5 h-5" /> {elapsed}{t('insights.seconds')}
          </div>
          <div className="flex items-center gap-2 text-stone-600">
            <AlertCircle className="w-5 h-5" /> {mistakes} {t('games.mistakes')}
          </div>
        </div>
        <button
          onClick={start}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
        >
          <RefreshCw className="w-5 h-5" /> {t('games.restart')}
        </button>
      </div>
    );
  }

  // Playing
  const unplacedPhotos = photoData.filter((p) => !placed.has(p.id));
  const groupLabels: Record<string, string> = {
    parent: 'Parent',
    spouse: 'Spouse',
    child: 'Child',
    sibling: 'Sibling',
    grandparent: 'Grandparent',
    other: 'Other',
  };

  return (
    <div className="space-y-4">
      {/* Timer + mistakes */}
      <div className="flex justify-center gap-6 bg-white rounded-xl p-3 shadow-sm border border-stone-200">
        <span className="flex items-center gap-2 font-semibold text-stone-700">
          <Clock className="w-5 h-5 text-teal-600" /> {elapsed}s
        </span>
        <span className="flex items-center gap-2 font-semibold text-stone-700">
          <AlertCircle className="w-5 h-5 text-rose-500" /> {mistakes}
        </span>
      </div>

      {/* Photos to drag */}
      {unplacedPhotos.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-md border border-stone-200">
          <p className="text-sm text-stone-500 mb-3 font-semibold">{t('games.dragHere')}:</p>
          <div className="flex flex-wrap gap-3">
            {unplacedPhotos.map((p) => (
              <div
                key={p.id}
                draggable
                onDragStart={() => setDraggedPhoto(p.id)}
                onDragEnd={() => setDraggedPhoto(null)}
                className={`cursor-grab active:cursor-grabbing border-2 rounded-xl p-2 bg-stone-50 ${
                  draggedPhoto === p.id ? 'border-amber-400 opacity-50' : 'border-stone-200'
                }`}
              >
                <img src={getPhotoUrl(p)} alt={p.caption} className="w-20 h-20 object-cover rounded-lg" />
                <p className="text-xs text-center mt-1 text-stone-600 max-w-[80px] truncate">{p.caption}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relation slots */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {RELATION_GROUPS.map((group) => {
          const placedHere = photoData.filter((p) => assignments[p.id] === group.key);
          return (
            <div
              key={group.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => draggedPhoto && handleDrop(draggedPhoto, group.key)}
              className="bg-white rounded-2xl p-4 shadow-md border-2 border-dashed border-stone-300 min-h-[120px] flex flex-col"
            >
              <p className="font-bold text-stone-700 text-center mb-3">{groupLabels[group.key]}</p>
              <div className="flex flex-wrap gap-2 justify-center flex-1 content-start">
                {placedHere.map((p) => (
                  <div key={p.id} className="bg-emerald-50 rounded-lg p-1">
                    <img src={getPhotoUrl(p)} alt={p.caption} className="w-16 h-16 object-cover rounded-md" />
                    <p className="text-xs text-center text-emerald-700 mt-1 max-w-[64px] truncate">{p.caption}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
