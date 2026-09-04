import React from 'react';
import { useDisasterData } from '../../context/DisasterDataContext';
import { Newspaper, ExternalLink } from 'lucide-react';

export const NewsTicker: React.FC = () => {
  const { newsArticles, setSelectedZone, hazardZones } = useDisasterData();
  const tickerArticles = newsArticles.filter(n => n.is_ticker || n.scope === 'LOCALITY' || n.scope === 'CITYWIDE');

  if (tickerArticles.length === 0) return null;

  return (
    <div className="bg-[#0F172A] border-y border-[#1E293B] text-slate-200 text-xs py-2 px-3 overflow-hidden relative flex items-center z-20 transition-colors duration-200 shrink-0">
      {/* Ticker Label */}
      <div className="flex items-center gap-1.5 bg-[#DC2626] text-white font-semibold px-2 py-0.5 rounded text-[11px] shrink-0 mr-3 z-20">
        <span className="inline-block h-2 w-2 rounded-full bg-white mr-0.5"></span>
        <Newspaper className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">LIVE BULLETINS:</span>
      </div>

      {/* Marquee Track */}
      <div className="flex-1 overflow-hidden relative">
        <div className="ticker-track">
          {/* Double the list for seamless continuous infinite marquee */}
          {[...tickerArticles, ...tickerArticles].map((article, idx) => {
            return (
              <div
                key={`${article.id}-${idx}`}
                className="inline-flex items-center gap-2 mr-8 text-slate-200 hover:text-white transition-colors cursor-pointer group"
                onClick={() => {
                  if (article.ward_id) {
                    const zone = hazardZones.find(z => z.ward_id === article.ward_id);
                    if (zone) setSelectedZone(zone);
                  }
                }}
              >
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#1E293B] text-[#D97706] border border-[#334155]">
                  {article.locality || 'Bhubaneswar'}
                </span>
                
                <span className="font-medium hover:underline flex items-center gap-1">
                  {article.title}
                </span>

                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="Read Original Article"
                  className="text-slate-400 hover:text-[#D97706] p-0.5 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
