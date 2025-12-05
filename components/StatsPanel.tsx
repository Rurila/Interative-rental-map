import React, { useState, useMemo } from 'react';
import { PostcodeZone, RentalRequest, ItemStat } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { X, Wand2, Loader2, MapPin, Globe, Sparkles, AlertCircle } from 'lucide-react';
import { analyzeDistrictTrends } from '../services/geminiService';
import { POPULAR_ITEMS } from '../constants';

interface StatsPanelProps {
  zone: PostcodeZone;
  requests: RentalRequest[];
  onClose: () => void;
}

// Data Cleaning Dictionary
// Maps common variations (keys) to Standard Preset Names (values) defined in POPULAR_ITEMS
const SYNONYMS: Record<string, string> = {
  // Tools
  'drill': 'Power Drill',
  'hammer drill': 'Power Drill',
  'boormachine': 'Power Drill',
  'sander': 'Sander',
  'schuurmachine': 'Sander',
  'high pressure cleaner': 'Pressure Washer',
  'hogedrukreiniger': 'Pressure Washer',
  'kärcher': 'Pressure Washer',
  'ladder': 'Ladder',
  'trap': 'Ladder',
  'stepladder': 'Ladder',
  'toolbox': 'Toolbox',
  'gereedschapskist': 'Toolbox',
  
  // Transport
  'bike': 'Cargo Bike', // Assumption: most people borrowing bikes mean cargo bikes for moving
  'bakfiets': 'Cargo Bike',
  'cargo bike': 'Cargo Bike',
  'dolly': 'Moving Dolly',
  'hondje': 'Moving Dolly',
  'wheelbarrow': 'Wheelbarrow',
  'kruiwagen': 'Wheelbarrow',

  // Household / Event
  'party tent': 'Party Tent',
  'partytent': 'Party Tent',
  'folding chair': 'Folding Chairs',
  'folding chairs': 'Folding Chairs',
  'klapstoel': 'Folding Chairs',
  'klapstoelen': 'Folding Chairs',
  'bbq': 'BBQ',
  'barbecue': 'BBQ',
  'sound system': 'Sound System',
  'jbl': 'Sound System',
  'speaker': 'Sound System',
  'projector': 'Projector',
  'beamer': 'Projector',
  'air mattress': 'Air Mattress',
  'luchtbed': 'Air Mattress',
  'heater': 'Heater',
  'kachel': 'Heater',
  'sewing machine': 'Sewing Machine',
  'naaimachine': 'Sewing Machine',
  'cat carrier': 'Cat Carrier',
  'kattenmand': 'Cat Carrier'
};

const normalizeAndSplitItems = (rawItem: string): string[] => {
  // 1. Split by common separators: comma, ampersand, plus, or ' and '
  // e.g. "Drill, Helmet" -> ["Drill", "Helmet"]
  const parts = rawItem.split(/[,&+]|\s+and\s+/i);

  // 2. Clean and Normalize each part
  return parts
    .map(part => {
      let s = part.trim().toLowerCase();
      
      // Remove articles (a, an, the) from the start
      s = s.replace(/^(a|an|the)\s+/i, '');

      // Check synonyms
      if (SYNONYMS[s]) {
        return SYNONYMS[s];
      }
      
      // Capitalize first letter for display
      if (s.length === 0) return '';
      return s.charAt(0).toUpperCase() + s.slice(1);
    })
    .filter(s => s.length > 0); // Remove empty strings
};

const StatsPanel: React.FC<StatsPanelProps> = ({ zone, requests, onClose }) => {
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week'>('all');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const isGlobal = zone.id === 'ALL';

  // Memoize the data processing to avoid recalculating on every render unless deps change
  const { popularStats, customStats } = useMemo(() => {
    // 1. Filter requests based on zone and time
    const filteredRequests = requests.filter(req => {
      // If Global mode, don't filter by zoneId. Otherwise, match zoneId.
      if (!isGlobal && req.zoneId !== zone.id) return false;
      
      const reqDate = new Date(req.date);
      const now = new Date();
      
      if (timeFilter === 'today') {
        return reqDate.toDateString() === now.toDateString();
      }
      if (timeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return reqDate >= weekAgo;
      }
      return true;
    });

    const presetCounts: Record<string, number> = {};
    const otherCounts: Record<string, number> = {};

    // 2. Aggregate item counts with Cleaning Logic
    filteredRequests.forEach(req => {
      // Split "Locker, bolt cutter" into multiple items
      const cleanedItems = normalizeAndSplitItems(req.item);
      
      cleanedItems.forEach(item => {
        // Check if this item maps to our Popular/Preset List
        if (POPULAR_ITEMS.includes(item)) {
          presetCounts[item] = (presetCounts[item] || 0) + 1;
        } else {
          otherCounts[item] = (otherCounts[item] || 0) + 1;
        }
      });
    });

    // 3. Convert to arrays and sort
    const popSorted = Object.entries(presetCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const customSorted = Object.entries(otherCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Limit long tail

    return { popularStats: popSorted, customStats: customSorted };
  }, [requests, zone.id, isGlobal, timeFilter]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const contextName = isGlobal 
      ? "The entire city of Amsterdam" 
      : `${zone.districtName} (PC ${zone.id})`;
      
    // Combine both lists for AI analysis
    const allItems = [...popularStats, ...customStats].slice(0, 15);
    
    const result = await analyzeDistrictTrends(contextName, allItems);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const hasData = popularStats.length > 0 || customStats.length > 0;

  return (
    <div className="absolute right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-[1000] flex flex-col transform transition-transform duration-300 border-l border-gray-200">
      <div className="p-5 border-b flex justify-between items-start bg-gradient-to-b from-gray-50 to-white">
        <div>
          <div className={`flex items-center gap-2 mb-1 ${isGlobal ? 'text-red-600' : 'text-blue-600'}`}>
             {isGlobal ? <Globe className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
             <span className="text-xs font-bold uppercase tracking-wider">
               {isGlobal ? 'City Overview' : `Postcode ${zone.id}`}
             </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{zone.districtName}</h2>
          <p className="text-sm text-gray-500 mt-1">
             Analyzing {isGlobal ? 'city-wide' : 'local'} demand
          </p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 border-b space-x-2 flex bg-white">
        {(['all', 'today', 'week'] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeFilter(tf)}
            className={`px-3 py-1 text-xs font-medium rounded-full border transition ${
              timeFilter === tf
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tf.charAt(0).toUpperCase() + tf.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Loader2 className="w-6 h-6" />
            </div>
            <p>No requests found for this period.</p>
          </div>
        ) : (
          <>
            {/* Section 1: Standard Items */}
            {popularStats.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  Top Standard Items
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={popularStats} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={90} 
                        tick={{fontSize: 11, fill: '#4b5563'}} 
                        interval={0}
                      />
                      <Tooltip 
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        cursor={{fill: '#f3f4f6'}}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                        {popularStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={zone.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Section 2: Custom / Unique Items */}
            {customStats.length > 0 && (
              <div className="mb-8">
                 <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-500" />
                    Additional Needs (Long Tail)
                 </h3>
                 <ul className="space-y-2">
                   {customStats.map((item, idx) => (
                     <li key={idx} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition text-sm">
                       <span className="text-gray-700 font-medium truncate pr-2" title={item.name}>
                          {item.name}
                       </span>
                       <span className="bg-white border border-gray-200 text-gray-500 text-xs font-bold px-1.5 py-0.5 rounded shadow-sm shrink-0">
                          {item.count}
                       </span>
                     </li>
                   ))}
                 </ul>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100">
              {!analysis ? (
                 <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-medium text-sm hover:bg-gray-800 transition disabled:opacity-70 shadow-lg shadow-gray-200"
                 >
                   {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Wand2 className="w-4 h-4" />}
                   {isAnalyzing ? 'Analyze Trends (AI)' : `Analyze ${isGlobal ? 'City' : 'Local'} Patterns`}
                 </button>
              ) : (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-100 shadow-inner">
                  <div className="flex items-center justify-between text-purple-800 font-semibold mb-3">
                    <div className="flex items-center gap-2">
                        <Wand2 className="w-4 h-4" />
                        <span>Insight</span>
                    </div>
                    <button 
                        onClick={() => setAnalysis(null)} 
                        className="text-xs bg-white/50 hover:bg-white px-2 py-1 rounded text-purple-700 transition"
                    >
                        Reset
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {analysis}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatsPanel;