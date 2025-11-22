import React, { useState, useMemo } from 'react';
import { PostcodeZone, RentalRequest, ItemStat } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { X, Wand2, Loader2, MapPin, Globe } from 'lucide-react';
import { analyzeDistrictTrends } from '../services/geminiService';

interface StatsPanelProps {
  zone: PostcodeZone;
  requests: RentalRequest[];
  onClose: () => void;
}

// Basic Synonym Dictionary for Data Cleaning
const SYNONYMS: Record<string, string> = {
  'spanner': 'Wrench',
  'wrench': 'Wrench',
  'adjustable spanner': 'Wrench',
  'moersleutel': 'Wrench',
  'bike': 'Bicycle',
  'bicycle': 'Bicycle',
  'fiets': 'Bicycle',
  'cargo bike': 'Cargo Bike',
  'bakfiets': 'Cargo Bike',
  'drill': 'Power Drill',
  'power drill': 'Power Drill',
  'hammer drill': 'Power Drill',
  'boormachine': 'Power Drill',
  'ladder': 'Ladder',
  'step ladder': 'Ladder',
  'trap': 'Ladder',
  'bbq': 'Barbecue',
  'barbecue': 'Barbecue',
  'grill': 'Barbecue'
};

const normalizeAndSplitItems = (rawItem: string): string[] => {
  // 1. Split by common separators: comma, ampersand, plus, or ' and '
  // e.g. "Locker, bolt cutter" -> ["Locker", "bolt cutter"]
  const parts = rawItem.split(/[,&+]|\s+and\s+/i);

  // 2. Clean and Normalize each part
  return parts
    .map(part => {
      let s = part.trim().toLowerCase();
      // Remove generic articles if needed (optional, keeping simple for now)
      
      // Check synonyms
      if (SYNONYMS[s]) {
        return SYNONYMS[s];
      }
      
      // Capitalize first letter for display
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
  const data = useMemo(() => {
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

    // 2. Aggregate item counts with Cleaning Logic
    const itemCounts = filteredRequests.reduce((acc, curr) => {
      // Split "Locker, bolt cutter" into multiple items
      const cleanedItems = normalizeAndSplitItems(curr.item);
      
      cleanedItems.forEach(item => {
        acc[item] = (acc[item] || 0) + 1;
      });
      
      return acc;
    }, {} as Record<string, number>);

    // 3. Convert to array and sort
    return Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [requests, zone.id, isGlobal, timeFilter]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const contextName = isGlobal 
      ? "The entire city of Amsterdam" 
      : `${zone.districtName} (PC ${zone.id})`;
      
    const result = await analyzeDistrictTrends(contextName, data);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

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
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Loader2 className="w-6 h-6" />
            </div>
            <p>No requests found for this period.</p>
          </div>
        ) : (
          <>
            <div className="h-56 mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
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
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={zone.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
               <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Most Wanted Items (Top 10)</h3>
               <ul className="space-y-2">
                 {data.map((item, idx) => (
                   <li key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition">
                     <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-gray-400 w-4">#{idx + 1}</span>
                        <span className="text-gray-800 font-medium text-sm">{item.name}</span>
                     </div>
                     <span className="bg-white border border-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                        {item.count}
                     </span>
                   </li>
                 ))}
               </ul>
            </div>

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