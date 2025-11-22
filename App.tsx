import React, { useState, useEffect } from 'react';
import MapBoard from './components/MapBoard';
import StatsPanel from './components/StatsPanel';
import AddRequestModal from './components/AddRequestModal';
import { RentalRequest, PostcodeZone } from './types';
import { PC4_ZONES } from './constants';
import { generateMockData } from './services/geminiService';
import { getZoneFromPostcode } from './services/geoService';
import { exportRequestsToExcel } from './services/excelService';
import { Plus, Map as MapIcon, Sparkles, Loader2, Download } from 'lucide-react';

const App: React.FC = () => {
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [selectedZone, setSelectedZone] = useState<PostcodeZone | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initial Demo Data
  useEffect(() => {
    const initialData: RentalRequest[] = [
      {
        id: '1',
        item: 'Hammer Drill',
        postcode: '1012 JS',
        lat: 52.3710, // Specific coordinate
        lng: 4.8940,
        date: new Date().toISOString(),
        description: 'Need for weekend renovation',
        zoneId: '1012'
      }
    ];
    setRequests(initialData);
  }, []);

  const handleZoneSelect = (zone: PostcodeZone) => {
    setSelectedZone(zone);
  };

  const handleAddRequest = (data: { item: string; postcode: string; description: string; lat: number; lng: number }) => {
    // Determine which PC4 zone this falls into
    const pc4 = data.postcode.substring(0, 4);
    
    const newRequest: RentalRequest = {
      id: Date.now().toString(),
      item: data.item,
      postcode: data.postcode,
      lat: data.lat,
      lng: data.lng,
      date: new Date().toISOString(),
      description: data.description,
      zoneId: pc4
    };

    setRequests(prev => [...prev, newRequest]);
  };

  const handleGenerateData = async () => {
    setIsGenerating(true);
    const mockItems = await generateMockData(10);
    
    const newRequests: RentalRequest[] = mockItems.map((item, idx) => {
      const pc4 = item.postcode.substring(0, 4);
      const fallbackZone = PC4_ZONES[0]; // Fallback if not exact
      
      // Simple jitter for demo purposes if we don't have full geo-engine here
      const jitterLat = (Math.random() - 0.5) * 0.008;
      const jitterLng = (Math.random() - 0.5) * 0.008;

      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));

      return {
        id: `gen-${Date.now()}-${idx}`,
        item: item.item,
        postcode: item.postcode,
        lat: fallbackZone.center[0] + jitterLat, // In real app, use geocodePostcode
        lng: fallbackZone.center[1] + jitterLng,
        date: date.toISOString(),
        description: item.description,
        zoneId: pc4
      };
    });

    setRequests(prev => [...prev, ...newRequests]);
    setIsGenerating(false);
  };

  const handleExport = () => {
    exportRequestsToExcel(requests);
  };

  return (
    <div className="h-screen w-full flex flex-col relative overflow-hidden font-sans text-gray-900 bg-gray-50">
      
      {/* Header / Navbar */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm h-16 flex items-center justify-between px-6 z-10 shrink-0 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="bg-black text-white p-2 rounded-lg">
            <MapIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900">
              Amsterdam ShareMap
            </h1>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Hyperlocal Lending</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            title="Download as Excel"
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 rounded-full transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>

          <button
            onClick={handleGenerateData}
            disabled={isGenerating}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-full transition shadow-sm"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4 text-purple-600" />}
            {isGenerating ? 'Populating...' : 'Populate Demo'}
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium text-sm">Add Request</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative">
        <MapBoard 
          requests={requests} 
          onZoneSelect={handleZoneSelect}
        />
        
        {/* Statistics Sidebar */}
        {selectedZone && (
          <StatsPanel 
            zone={selectedZone} 
            requests={requests} 
            onClose={() => setSelectedZone(null)} 
          />
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <AddRequestModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleAddRequest} 
        />
      )}
    </div>
  );
};

export default App;