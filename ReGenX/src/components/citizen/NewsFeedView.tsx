import React, { useState } from 'react';
import { useDisasterData } from '../../context/DisasterDataContext';
import { 
  Newspaper, 
  ExternalLink, 
  Search, 
  Clock, 
  ShieldAlert,
  CloudRain,
  Droplets,
  Zap,
  Wind
} from 'lucide-react';

/**
 * Format bulletin dates as DD/MM/YY, HH:MM AM/PM with leading zeros
 * Example: 02/09/26, 02:02 PM
 */
export const formatBulletinDate = (isoString?: string): string => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');

    return `${day}/${month}/${year}, ${strHours}:${minutes} ${ampm}`;
  } catch {
    return isoString || '';
  }
};

interface HazardMitigationItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  before?: string[];
  during: string[];
  after?: string[];
}

const HAZARD_MITIGATION_DATA: Record<string, HazardMitigationItem> = {
  heavy_rainfall: {
    id: 'heavy_rainfall',
    name: 'Heavy Rainfall',
    icon: <CloudRain className="w-4 h-4" />,
    before: [
      'Monitor official weather and disaster alerts.',
      'Avoid unnecessary travel during intense rainfall.',
      'Keep essential medicines, drinking water, torch and charged phones ready.',
      'Keep important documents and electrical equipment protected from water.',
      'Clear household drains only when it is safe to do so.'
    ],
    during: [
      'Stay indoors when conditions are severe.',
      'Close doors and windows securely.',
      'Avoid low-lying roads, underpasses and areas where water accumulates.',
      'Do not walk or drive through flowing water.',
      'Keep away from damaged electrical installations and fallen wires.'
    ],
    after: [
      'Check official updates before travelling.',
      'Avoid standing water until it is confirmed safe.'
    ]
  },
  flood: {
    id: 'flood',
    name: 'Flood',
    icon: <Droplets className="w-4 h-4" />,
    during: [
      'Move to higher ground or a designated safe place when advised.',
      'Follow evacuation instructions from authorized authorities.',
      'Do not walk, swim or drive through moving floodwater.',
      'Avoid bridges, culverts and fast-flowing channels.',
      'Switch off electricity at the main supply only if it is safe to do so.',
      'Keep drinking water protected from contamination.',
      'Do not touch fallen electrical wires.',
      'Keep children away from floodwater.',
      'Carry essential medicines, identification documents, drinking water and a charged phone if evacuation is required.'
    ],
    after: [
      'Return only after authorities indicate that it is safe.',
      'Avoid damaged buildings and electrical equipment.',
      'Treat potentially contaminated water as unsafe until verified.'
    ]
  },
  waterlogging: {
    id: 'waterlogging',
    name: 'Waterlogging',
    icon: <Droplets className="w-4 h-4" />,
    during: [
      'Avoid waterlogged roads whenever possible.',
      'Do not attempt to cross moving or deep water on foot.',
      'Do not drive a vehicle into flooded underpasses or roads with unknown water depth.',
      'Stay away from open drains, manholes and submerged road edges.',
      'Keep away from electrical poles, transformers and exposed wires.',
      'If water begins entering the home, move people and important items to a safer higher level.',
      'Report dangerous waterlogging through the existing NivaranAI reporting workflow when safe to do so.',
      'Follow local traffic and evacuation instructions.'
    ]
  },
  lightning: {
    id: 'lightning',
    name: 'Lightning',
    icon: <Zap className="w-4 h-4" />,
    during: [
      'Move indoors immediately when thunder is heard.',
      'Close windows and doors.',
      'Stay away from windows, balconies, rooftops and exposed areas.',
      'Avoid sheltering under isolated trees.',
      'Stay away from metal fences, poles and exposed electrical equipment.',
      'Avoid unnecessary use of corded electrical equipment.',
      'Avoid bathing or contact with running water during an active lightning storm.',
      'If outdoors and no building is nearby, move toward a safe substantial shelter immediately.',
      'Do not remain in open fields, hilltops or near isolated tall objects.',
      'If travelling by vehicle during severe lightning, remain inside the vehicle with windows closed.'
    ]
  },
  cyclone: {
    id: 'cyclone',
    name: 'Cyclone / Severe Wind',
    icon: <Wind className="w-4 h-4" />,
    before: [
      'Follow official warnings and evacuation instructions.',
      'Secure loose outdoor objects.',
      'Close and secure doors and windows.',
      'Keep essential medicines, drinking water, food, torch and charged phones ready.',
      'Keep important documents protected in waterproof packaging.',
      'Move away from coastal/low-lying areas if evacuation is ordered.',
      'Use designated cyclone shelters when instructed.'
    ],
    during: [
      'Stay indoors and away from windows.',
      'Keep listening to official warnings.',
      'Do not go outside during a temporary lull in the wind; the storm may not be over.',
      'Do not approach fallen trees, poles or electrical wires.',
      'Avoid flooded roads and coastal areas.',
      'Follow evacuation and shelter instructions from authorities.'
    ],
    after: [
      'Remain in the shelter or safe location until authorities permit return.',
      'Avoid damaged buildings and downed power lines.',
      'Do not enter floodwater if its depth or electrical safety is unknown.',
      'Follow official instructions before travelling.'
    ]
  }
};

export const NewsFeedView: React.FC = () => {
  const { newsArticles } = useDisasterData();
  const [activeTab, setActiveTab] = useState<'BULLETINS' | 'MITIGATION'>('BULLETINS');
  const [search, setSearch] = useState('');
  const [selectedLocality, setSelectedLocality] = useState('ALL');
  const [selectedHazardId, setSelectedHazardId] = useState<string>('heavy_rainfall');

  const localities = ['ALL', ...new Set(newsArticles.map(n => n.locality).filter(Boolean))];

  const filteredArticles = newsArticles.filter(art => {
    const matchesLocality = selectedLocality === 'ALL' || art.locality === selectedLocality;
    const textToMatch = `${art.title} ${art.summary || art.overview || art.description || ''} ${art.source || art.source_name || ''}`.toLowerCase();
    const matchesSearch = textToMatch.includes(search.toLowerCase());
    return matchesLocality && matchesSearch;
  });

  const selectedMitigation = HAZARD_MITIGATION_DATA[selectedHazardId] || HAZARD_MITIGATION_DATA.heavy_rainfall;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto w-full space-y-5 animate-fade-in transition-colors duration-200">
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D1D5DB] dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#0F172A] rounded-md text-[#D97706]">
              <Newspaper className="w-4 h-4" />
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-[#0F172A] dark:text-white">
              Local Disaster Intelligence & Mitigation
            </h2>
          </div>
          <p className="text-xs text-[#475569] dark:text-slate-400 mt-1 font-medium">
            Bhubaneswar bulletins, hazard guidance and response precautions
          </p>
        </div>

        {/* Section Tab Switcher (Local Bulletins vs Risk Mitigation) */}
        <div className="flex items-center gap-1.5 bg-[#F8F9FA] dark:bg-slate-900 p-1 rounded-lg border border-[#D1D5DB] dark:border-slate-800 shrink-0 select-none">
          <button
            role="tab"
            aria-selected={activeTab === 'BULLETINS'}
            tabIndex={0}
            onClick={() => setActiveTab('BULLETINS')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('BULLETINS');
              }
            }}
            className={`px-3.5 py-1.5 rounded-md font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'BULLETINS'
                ? 'bg-[#0F172A] text-white shadow-2xs'
                : 'text-[#475569] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#FFFFFF]'
            }`}
          >
            Local Bulletins
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'MITIGATION'}
            tabIndex={0}
            onClick={() => setActiveTab('MITIGATION')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('MITIGATION');
              }
            }}
            className={`px-3.5 py-1.5 rounded-md font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'MITIGATION'
                ? 'bg-[#0F172A] text-white shadow-2xs'
                : 'text-[#475569] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#FFFFFF]'
            }`}
          >
            Risk Mitigation
          </button>
        </div>
      </div>

      {/* TAB 1: LOCAL BULLETINS */}
      {activeTab === 'BULLETINS' && (
        <div className="space-y-4">
          {/* Search & Locality Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Bhubaneswar bulletins..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#FFFFFF] dark:bg-slate-900 border border-[#D1D5DB] dark:border-slate-800 rounded-md pl-9 pr-3 py-2 text-xs text-[#0F172A] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#D97706]"
              />
            </div>

            {/* Locality Filter Tags */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {localities.map(loc => (
                <button
                  key={loc}
                  onClick={() => setSelectedLocality(loc)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition whitespace-nowrap border cursor-pointer ${
                    selectedLocality === loc
                      ? 'bg-[#D97706] text-white border-[#D97706]'
                      : 'bg-[#FFFFFF] dark:bg-slate-900 text-[#475569] dark:text-slate-400 border-[#D1D5DB] dark:border-slate-800 hover:bg-[#F8F9FA]'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Articles Feed or Empty State */}
          {filteredArticles.length === 0 ? (
            <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-8 border border-[#D1D5DB] dark:border-slate-800 text-center space-y-2">
              <ShieldAlert className="w-8 h-8 text-[#475569] dark:text-slate-400 mx-auto opacity-60" />
              <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">
                No recent Bhubaneswar-specific disaster bulletins found.
              </h4>
              <p className="text-xs text-[#475569] dark:text-slate-400">
                Check again later for new local reports.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredArticles.map(article => (
                <div
                  key={article.id}
                  className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-4 border border-[#D1D5DB] dark:border-slate-800 space-y-2.5 transition duration-150 hover:border-[#D97706]"
                >
                  {/* Meta header row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase ${
                        article.scope === 'LOCALITY'
                          ? 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/30'
                          : 'bg-[#0F172A]/10 text-[#0F172A] border-[#0F172A]/30 dark:bg-slate-800 dark:text-slate-200'
                      }`}>
                        📍 {article.locality || 'Bhubaneswar'}
                      </span>

                      {article.ward_id && (
                        <span className="text-[11px] text-[#475569] dark:text-slate-400 font-semibold">
                          Ward #{article.ward_id}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-[#475569] dark:text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatBulletinDate(article.published_at)}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-bold text-[#0F172A] dark:text-white hover:text-[#D97706] transition">
                    {article.title}
                  </h3>

                  <p className="text-xs text-[#475569] dark:text-slate-300 leading-normal">
                    {article.summary || article.overview || article.description}
                  </p>

                  {/* Footer with exact URL link */}
                  <div className="pt-2 border-t border-[#D1D5DB] dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[#475569] dark:text-slate-400 font-medium">
                      Source: <strong className="text-[#0F172A] dark:text-slate-300">{article.source || article.source_name || 'News Outlet'}</strong>
                    </span>

                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#D97706] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <span>Read Full Bulletin</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RISK MITIGATION */}
      {activeTab === 'MITIGATION' && (
        <div className="space-y-5">
          {/* Hazard Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {Object.values(HAZARD_MITIGATION_DATA).map(item => (
              <button
                key={item.id}
                role="tab"
                aria-selected={selectedHazardId === item.id}
                tabIndex={0}
                onClick={() => setSelectedHazardId(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedHazardId(item.id);
                  }
                }}
                className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 whitespace-nowrap border cursor-pointer ${
                  selectedHazardId === item.id
                    ? 'bg-[#0F172A] text-[#D97706] border-[#0F172A]'
                    : 'bg-[#FFFFFF] dark:bg-slate-900 text-[#475569] dark:text-slate-400 border-[#D1D5DB] dark:border-slate-800 hover:bg-[#F8F9FA]'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            ))}
          </div>

          {/* Selected Hazard Guidance Container */}
          <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-5 border border-[#D1D5DB] dark:border-slate-800 space-y-4">
            <div className="border-b border-[#D1D5DB] dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-[#0F172A] dark:text-white uppercase tracking-wide flex items-center gap-2">
                <span>{selectedMitigation.name}</span>
              </h3>
              <p className="text-xs text-[#475569] dark:text-slate-400 font-medium mt-0.5">
                Official safety instructions during {selectedMitigation.name.toLowerCase()} conditions
              </p>
            </div>

            {/* Guidance Content Sections */}
            <div className="space-y-4 text-xs text-[#0F172A] dark:text-slate-300">
              {/* Before Section */}
              {selectedMitigation.before && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-[#0F172A] dark:text-white uppercase tracking-wider">
                    Before / When Expected
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-[#475569] dark:text-slate-300 leading-normal pl-1">
                    {selectedMitigation.before.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* During Section */}
              {selectedMitigation.during && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-[#0F172A] dark:text-white uppercase tracking-wider">
                    During {selectedMitigation.name}
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-[#475569] dark:text-slate-300 leading-normal pl-1">
                    {selectedMitigation.during.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* After Section */}
              {selectedMitigation.after && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-[#0F172A] dark:text-white uppercase tracking-wider">
                    After
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-[#475569] dark:text-slate-300 leading-normal pl-1">
                    {selectedMitigation.after.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Source Footer Note */}
            <div className="pt-3 border-t border-[#D1D5DB] dark:border-slate-800 text-[11px] text-[#475569] dark:text-slate-400 font-medium">
              Safety guidance based on OSDMA, NDMA and IMD public advisories.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
