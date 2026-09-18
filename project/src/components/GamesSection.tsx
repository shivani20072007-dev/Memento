import { useState, useEffect, useRef, useCallback } from 'react';
import { Gamepad2, ArrowLeft, Check, Clock, AlertCircle, RefreshCw, Music, TreePine, Puzzle } from 'lucide-react';
import { useApp } from '@/lib/context';
import { supabase, MEDIA_BUCKET } from '@/lib/supabase';
import type { MediaItem, GameType } from '@/lib/types';
import FamilyTreeGame from '@/components/games/FamilyTreeGame';
import JigsawGame from '@/components/games/JigsawGame';

type View = 'menu' | 'family_tree' | 'jigsaw';

export default function GamesSection() {
  const { t, profile, gameSessions, loadGameSessions } = useApp();
  const [view, setView] = useState<View>('menu');
  const [songs, setSongs] = useState<MediaItem[]>([]);
  const [musicOn, setMusicOn] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [photos, setPhotos] = useState<MediaItem[]>([]);

  useEffect(() => {
    supabase
      .from('media_items')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const items = (data as MediaItem[]) ?? [];
        setSongs(items.filter((m) => m.type === 'song' && m.storage_path));
        setPhotos(items.filter((m) => m.type === 'photo'));
      });
  }, []);

  const getSongUrl = useCallback((item: MediaItem) => {
    if (item.storage_path) {
      const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(item.storage_path);
      return data.publicUrl;
    }
    return '';
  }, []);

  // Background music: use uploaded songs, fallback to royalty-free tracks
  useEffect(() => {
    if (!musicOn || view === 'menu') {
      audioRef.current?.pause();
      return;
    }
    if (songs.length > 0) {
      const idx = Math.floor(Math.random() * songs.length);
      audioRef.current = new Audio(getSongUrl(songs[idx]));
    } else {
      // Royalty-free fallback tracks (public domain / CC0)
      const fallbacks = [
        'https://www.soundjay.com/misc/sounds/bell-ringing-04.wav',
      ];
      audioRef.current = new Audio(fallbacks[0]);
    }
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {});
    }
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [musicOn, view, songs, getSongUrl]);

  const recordSession = async (gameType: GameType, completed: boolean, seconds: number, mistakes: number, difficulty: number) => {
    await supabase.from('game_sessions').insert([
      {
        game_type: gameType,
        difficulty,
        completed,
        completion_seconds: completed ? seconds : null,
        mistakes,
      },
    ]);
    loadGameSessions();
  };

  const gamesEnabled = profile?.games_enabled ?? false;

  if (!gamesEnabled) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Gamepad2 className="w-16 h-16 text-stone-300 mb-4" />
        <p className="text-lg text-stone-500 mb-2">{t('games.toggle')}</p>
        <button
          onClick={async () => {
            if (profile?.id) {
              await supabase.from('profiles').update({ games_enabled: true }).eq('id', profile.id);
            } else {
              await supabase.from('profiles').insert([{ games_enabled: true }]);
            }
            window.location.reload();
          }}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl text-lg transition-colors"
        >
          {t('games.enable')}
        </button>
      </div>
    );
  }

  if (view === 'menu') {
    const totalSessions = gameSessions.length;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-3">
            <Gamepad2 className="w-7 h-7 text-amber-500" />
            {t('games.title')}
          </h2>
          {/* Music toggle */}
          <button
            onClick={() => setMusicOn(!musicOn)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
              musicOn ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'
            }`}
          >
            <Music className="w-4 h-4" />
            {t('games.music')}: {musicOn ? t('games.musicOn') : t('games.musicOff')}
          </button>
        </div>

        {totalSessions > 0 && (
          <p className="text-sm text-stone-400">{totalSessions} sessions played</p>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => setView('family_tree')}
            className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl border border-stone-200 hover:border-amber-400 transition-all text-left group"
          >
            <div className="bg-amber-500 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <TreePine className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-stone-800">{t('games.familyTree')}</h3>
            <p className="text-sm text-stone-500 mt-1">{t('games.familyTreeDesc')}</p>
          </button>

          <button
            onClick={() => setView('jigsaw')}
            className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl border border-stone-200 hover:border-teal-400 transition-all text-left group"
          >
            <div className="bg-teal-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Puzzle className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-stone-800">{t('games.jigsaw')}</h3>
            <p className="text-sm text-stone-500 mt-1">{t('games.jigsawDesc')}</p>
          </button>
        </div>
      </div>
    );
  }

  const getPhotoUrl = (item: MediaItem) => {
    if (item.storage_path) {
      const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(item.storage_path);
      return data.publicUrl;
    }
    return '';
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setView('menu')}
        className="flex items-center gap-2 text-stone-600 hover:text-stone-900 font-semibold transition-colors"
      >
        <ArrowLeft className="w-5 h-5" /> {t('games.back')}
      </button>

      {photos.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-stone-700">{t('games.noPhotos')}</p>
        </div>
      ) : view === 'family_tree' ? (
        <FamilyTreeGame photos={photos} getPhotoUrl={getPhotoUrl} onRecord={recordSession} />
      ) : (
        <JigsawGame photos={photos} getPhotoUrl={getPhotoUrl} onRecord={recordSession} />
      )}
    </div>
  );
}
