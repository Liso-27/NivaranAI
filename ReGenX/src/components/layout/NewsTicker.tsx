import React from 'react';
import { useDisasterData } from '../../context/DisasterDataContext';
import { Newspaper, ExternalLink } from 'lucide-react';

export const NewsTicker: React.FC = () => {
  const { newsArticles, setSelectedZone, hazardZones } = useDisasterData();
  const tickerArticles = newsArticles.filter(n => n.is_ticker || n.scope === 'LOCALITY' || n.scope === 'CITYWIDE');

  if (tickerArticles.length === 0) return null;

  const TAG_PALETTES = [
    'bg-amber-100/90 text-amber-950 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
    'bg-blue-100/90 text-blue-950 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
    'bg-teal-100/90 text-teal-950 border-teal-300 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30',
    'bg-indigo-100/90 text-indigo-950 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30',
    'bg-emerald-100/90 text-emerald-950 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
  ];

  return (
    <div className="bg-slate-100 dark:bg-slate-900/90 border-y border-slate-200 dark:border-slate-800 text-xs py-2 px-3 overflow-hidden relative flex items-center z-20 backdrop-blur-md transition-colors duration-200 shrink-0">
      {/* Ticker Label */}
      <div className="flex items-center gap-1.5 bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400 font-bold px-2.5 py-1 rounded-md border border-rose-300 dark:border-rose-500/30 uppercase tracking-wider text-[11px] shrink-0 mr-3 shadow-2xs z-20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
        </span>
        <Newspaper className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">LIVE WIRE:</span>
      </div>

      {/* Marquee Track with Fade Gradient Masks */}
      <div className="flex-1 overflow-hidden relative">
        {/* Left & Right Edge Gradient Fade */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-100 dark:from-slate-900 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-100 dark:from-slate-900 to-transparent z-10" />

        <div className="ticker-track">
          {/* Double the list for seamless continuous infinite marquee */}
          {[...tickerArticles, ...tickerArticles].map((article, idx) => {
            const tagStyle = TAG_PALETTES[idx % TAG_PALETTES.length];
            return (
              <div
                key={`${article.id}-${idx}`}
                className="inline-flex items-center gap-2 mr-8 text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer group"
                onClick={() => {
                  if (article.ward_id) {
                    const zone = hazardZones.find(z => z.ward_id === article.ward_id);
                    if (zone) setSelectedZone(zone);
                  }
                }}
              >
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border shadow-2xs ${tagStyle}`}>
                  {article.locality}
                </span>
                
                <span className="font-semibold hover:underline flex items-center gap-1">
                  {article.title}
                </span>

                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="Read Original Article"
                  className="text-slate-400 hover:text-[#0B3D91] dark:hover:text-cyan-400 p-0.5 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>

                <span className="text-slate-300 dark:text-slate-700 ml-2 font-mono">•</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

};
