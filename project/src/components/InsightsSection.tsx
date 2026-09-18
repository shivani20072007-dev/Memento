import { TrendingUp, Clock, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useApp } from '@/lib/context';
import { useState } from 'react';
import type { GameType } from '@/lib/types';

export default function InsightsSection() {
  const { t, gameSessions } = useApp();
  const [filter, setFilter] = useState<'all' | GameType>('all');

  const sessions = filter === 'all' ? gameSessions : gameSessions.filter((s) => s.game_type === filter);
  const completedSessions = sessions.filter((s) => s.completed);
  const totalSessions = sessions.length;
  const avgTime = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.completion_seconds ?? 0), 0) / completedSessions.length)
    : 0;
  const avgMistakes = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.mistakes, 0) / sessions.length * 10) / 10
    : 0;

  const statCard = (icon: React.ReactNode, label: string, value: string, color: string) => (
    <div className="bg-white rounded-2xl p-5 shadow-md border border-stone-200">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-sm text-stone-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-stone-800 mt-1">{value}</p>
    </div>
  );

  // Build trend data points
  const trendData = completedSessions.map((s) => ({
    date: new Date(s.played_at).toLocaleDateString(),
    time: s.completion_seconds ?? 0,
    mistakes: s.mistakes,
    accuracy: s.mistakes === 0 ? 100 : Math.max(0, Math.round(100 - s.mistakes * 10)),
  }));

  // Simple sparkline / bar chart
  const maxTime = Math.max(...trendData.map((d) => d.time), 1);
  const maxMistakes = Math.max(...trendData.map((d) => d.mistakes), 1);

  const Chart = ({ data, max, color, label, unit }: { data: number[]; max: number; color: string; label: string; unit: string }) => {
    if (data.length === 0) return null;
    return (
      <div className="bg-white rounded-2xl p-5 shadow-md border border-stone-200">
        <h4 className="font-bold text-stone-700 mb-4">{label}</h4>
        <div className="flex items-end gap-2 h-32">
          {data.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <div
                className={`${color} w-full rounded-t-md transition-all hover:opacity-80`}
                style={{ height: `${(v / max) * 100}%`, minHeight: '4px' }}
                title={`${v}${unit}`}
              />
              <span className="text-xs text-stone-400 truncate w-full text-center">{v}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-blue-600" />
          {t('insights.title')}
        </h2>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800 text-sm">{t('insights.disclaimer')}</p>
            <p className="text-amber-700 text-sm mt-1">{t('insights.note')}</p>
          </div>
        </div>
      </div>

      {totalSessions === 0 ? (
        <div className="bg-white rounded-2xl p-10 shadow-md border border-stone-200 text-center">
          <TrendingUp className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 text-lg">{t('insights.noData')}</p>
        </div>
      ) : (
        <>
          {/* Filter */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-stone-600">{t('insights.byGame')}:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {t('insights.all')}
            </button>
            <button
              onClick={() => setFilter('family_tree')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                filter === 'family_tree' ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {t('games.familyTree')}
            </button>
            <button
              onClick={() => setFilter('jigsaw')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                filter === 'jigsaw' ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {t('games.jigsaw')}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCard(<CheckCircle className="w-6 h-6 text-white" />, t('insights.total'), String(totalSessions), 'bg-blue-600')}
            {statCard(<CheckCircle className="w-6 h-6 text-white" />, t('insights.completed'), String(completedSessions.length), 'bg-emerald-600')}
            {statCard(<Clock className="w-6 h-6 text-white" />, t('insights.avgTime'), `${avgTime}${t('insights.seconds')}`, 'bg-teal-600')}
            {statCard(<AlertCircle className="w-6 h-6 text-white" />, t('insights.avgMistakes'), String(avgMistakes), 'bg-rose-500')}
          </div>

          {/* Charts */}
          {trendData.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Chart
                data={trendData.map((d) => d.time)}
                max={maxTime}
                color="bg-teal-500"
                label={t('insights.timeTrend')}
                unit={t('insights.seconds')}
              />
              <Chart
                data={trendData.map((d) => d.mistakes)}
                max={maxMistakes}
                color="bg-rose-400"
                label={t('insights.mistakesTrend')}
                unit=""
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
