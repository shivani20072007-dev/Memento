import { useState, useRef, useEffect } from 'react';
import { Check, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import type { MediaItem, GameType } from '@/lib/types';
import { useApp } from '@/lib/context';

interface Props {
  photos: MediaItem[];
  getPhotoUrl: (item: MediaItem) => string;
  onRecord: (gameType: GameType, completed: boolean, seconds: number, mistakes: number, difficulty: number) => void;
}

interface Piece {
  id: number;
  correctIndex: number;
  currentIndex: number;
}

export default function JigsawGame({ photos, getPhotoUrl, onRecord }: Props) {
  const { t } = useApp();
  const [phase, setPhase] = useState<'setup' | 'playing' | 'done'>('setup');
  const [difficulty, setDifficulty] = useState(3);
  const [selectedPhoto, setSelectedPhoto] = useState<MediaItem | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [draggedPiece, setDraggedPiece] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

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
    if (!selectedPhoto) return;
    const total = difficulty * difficulty;
    const correctOrder = Array.from({ length: total }, (_, i) => i);
    const shuffled = [...correctOrder].sort(() => Math.random() - 0.5);
    // Make sure it's not already solved
    const isSolved = shuffled.every((v, i) => v === i);
    const finalOrder = isSolved ? [shuffled[shuffled.length - 1], ...shuffled.slice(0, -1)] : shuffled;
    setPieces(
      finalOrder.map((correctIndex, i) => ({
        id: i,
        correctIndex,
        currentIndex: i,
      }))
    );
    setMistakes(0);
    setElapsed(0);
    setPhase('playing');
  };

  const handleDrop = (targetId: number) => {
    if (draggedPiece === null || draggedPiece === targetId) return;
    const dragged = pieces.find((p) => p.id === draggedPiece);
    const target = pieces.find((p) => p.id === targetId);
    if (!dragged || !target) return;

    // Swap their currentIndex
    setPieces((prev) =>
      prev.map((p) => {
        if (p.id === draggedPiece) return { ...p, currentIndex: target.currentIndex };
        if (p.id === targetId) return { ...p, currentIndex: dragged.currentIndex };
        return p;
      })
    );
    setDraggedPiece(null);

    // Count a mistake if neither piece is now in its correct spot
    const draggedCorrect = dragged.correctIndex === target.currentIndex;
    const targetCorrect = target.correctIndex === dragged.currentIndex;
    if (!draggedCorrect && !targetCorrect) {
      setMistakes((m) => m + 1);
    }

    // Check completion after state update
    setTimeout(() => {
      setPieces((current) => {
        const solved = current.every((p) => p.currentIndex === p.correctIndex);
        if (solved) {
          const seconds = Math.floor((Date.now() - startTime) / 1000);
          setPhase('done');
          if (timerRef.current) clearInterval(timerRef.current);
          onRecord('jigsaw', true, seconds, mistakes, difficulty);
        }
        return current;
      });
    }, 50);
  };

  const imgUrl = selectedPhoto ? getPhotoUrl(selectedPhoto) : '';

  if (phase === 'setup') {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md border border-stone-200">
        <h3 className="text-xl font-bold text-stone-800 mb-3">{t('games.jigsaw')}</h3>
        <p className="text-stone-600 mb-4">{t('games.jigsawDesc')}</p>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-stone-700 mb-2">{t('games.difficulty')}</label>
          <div className="flex gap-3">
            {[
              { val: 3, label: t('games.easy') },
              { val: 4, label: t('games.medium') },
              { val: 5, label: t('games.hard') },
            ].map((d) => (
              <button
                key={d.val}
                onClick={() => setDifficulty(d.val)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
                  difficulty === d.val
                    ? 'bg-teal-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm font-semibold text-stone-700 mb-2">{t('profile.photos')}:</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
          {photos.slice(0, 8).map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPhoto(p)}
              className={`rounded-lg overflow-hidden border-2 transition-all ${
                selectedPhoto?.id === p.id
                  ? 'border-teal-500 ring-2 ring-teal-300'
                  : 'border-stone-200 hover:border-stone-400'
              }`}
            >
              <img src={getPhotoUrl(p)} alt={p.caption} className="w-full h-20 object-cover" />
            </button>
          ))}
        </div>

        {selectedPhoto && (
          <div className="mb-4">
            <p className="text-sm text-stone-600 mb-1">{t('profile.caption')}: <span className="font-semibold">{selectedPhoto.caption}</span></p>
            <img src={imgUrl} alt="Preview" className="w-48 h-48 object-cover rounded-lg border border-stone-200" />
          </div>
        )}

        <button
          onClick={start}
          disabled={!selectedPhoto}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl text-lg transition-colors disabled:opacity-50"
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
        {selectedPhoto && (
          <img src={imgUrl} alt="Completed" className="w-40 h-40 object-cover rounded-lg mx-auto my-4 border border-stone-200" />
        )}
        <div className="flex justify-center gap-6 my-4">
          <div className="flex items-center gap-2 text-stone-600">
            <Clock className="w-5 h-5" /> {elapsed}{t('insights.seconds')}
          </div>
          <div className="flex items-center gap-2 text-stone-600">
            <AlertCircle className="w-5 h-5" /> {mistakes} {t('games.mistakes')}
          </div>
        </div>
        <button
          onClick={() => setPhase('setup')}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
        >
          <RefreshCw className="w-5 h-5" /> {t('games.restart')}
        </button>
      </div>
    );
  }

  // Playing - render jigsaw grid
  const sortedPieces = [...pieces].sort((a, b) => a.currentIndex - b.currentIndex);

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-6 bg-white rounded-xl p-3 shadow-sm border border-stone-200">
        <span className="flex items-center gap-2 font-semibold text-stone-700">
          <Clock className="w-5 h-5 text-teal-600" /> {elapsed}s
        </span>
        <span className="flex items-center gap-2 font-semibold text-stone-700">
          <AlertCircle className="w-5 h-5 text-rose-500" /> {mistakes}
        </span>
      </div>

      {/* Reference image (small) */}
      {imgUrl && (
        <div className="flex justify-center">
          <img src={imgUrl} alt="Reference" className="w-24 h-24 object-cover rounded-lg border border-stone-200 opacity-70" />
        </div>
      )}

      {/* Jigsaw board */}
      <div
        className="grid gap-1 mx-auto bg-stone-200 p-2 rounded-xl"
        style={{
          gridTemplateColumns: `repeat(${difficulty}, 1fr)`,
          width: 'min(400px, 90vw)',
          aspectRatio: '1',
        }}
      >
        {sortedPieces.map((piece) => {
          const row = Math.floor(piece.correctIndex / difficulty);
          const col = piece.correctIndex % difficulty;
          const pct = 100 / (difficulty - 1);
          return (
            <div
              key={piece.id}
              draggable
              onDragStart={() => setDraggedPiece(piece.id)}
              onDragEnd={() => setDraggedPiece(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(piece.id)}
              className={`cursor-grab active:cursor-grabbing rounded-sm bg-cover bg-no-repeat transition-all ${
                draggedPiece === piece.id ? 'opacity-40' : 'opacity-100'
              }`}
              style={{
                backgroundImage: `url(${imgUrl})`,
                backgroundSize: `${difficulty * 100}% ${difficulty * 100}%`,
                backgroundPosition: `${col * pct}% ${row * pct}%`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
