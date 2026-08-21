import React, { useState } from 'react';
import { useDisasterData } from '../../context/DisasterDataContext';
import { 
  Newspaper, 
  ExternalLink, 
  Search, 
  Filter, 
  Clock, 
  MapPin,
  Sparkles
} from 'lucide-react';

export const NewsFeedView: React.FC = () => {
  const { newsArticles, setSelectedZone, hazardZones } = useDisasterData();
  const [search, setSearch] = useState('');
  const [selectedLocality, setSelectedLocality] = useState('ALL');

  const localities = ['ALL', ...new Set(newsArticles.map(n => n.locality))];

  const filteredArticles = newsArticles.filter(art => {
    const matchesLocality = selectedLocality === 'ALL' || art.locality === selectedLocality;
    const textToMatch = `${art.title} ${art.summary || art.overview || ''}`.toLowerCase();
    const matchesSearch = textToMatch.includes(search.toLowerCase());
    return matchesLocality && matchesSearch;
  });


  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6 animate-fade-in transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#0B3D91] rounded-xl text-white">
              <Newspaper className="w-5 h-5" />
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-heading">
              Bhubaneswar Disaster News & Bulletins
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time disaster reporting extracted with locality tagging (news_service.py).
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search news by locality or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0B3D91] dark:focus:border-cyan-500 shadow-xs"
          />
        </div>
      </div>

      {/* Locality Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {localities.map(loc => (
          <button
            key={loc}
            onClick={() => setSelectedLocality(loc)}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap border ${
              selectedLocality === loc
                ? 'bg-[#0B3D91] text-white border-[#0B3D91] dark:bg-sky-600 dark:border-sky-500 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {loc}
          </button>
        ))}
      </div>

      {/* Articles Feed */}
      <div className="space-y-4">
        {filteredArticles.map(article => (
          <div
            key={article.id}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 space-y-3"
          >

            {/* Meta row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                  article.scope === 'LOCALITY'
                    ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                    : 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30'
                }`}>
                  📍 {article.locality}
                </span>

                {article.ward_id && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Ward #{article.ward_id}
                  </span>
                )}
              </div>

              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(article.published_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>

            {/* Title & Summary */}
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading hover:text-[#0B3D91] dark:hover:text-cyan-400 transition">
              {article.title}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {article.summary || article.overview}
            </p>


            {/* Footer Links */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">
                Source: {article.source}
              </span>

              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0B3D91] dark:text-sky-400 hover:underline flex items-center gap-1 font-bold"
              >
                <span>Read Full Article</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
