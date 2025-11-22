import React, { useState, useEffect } from 'react';
import MapBoard from './components/MapBoard';
import StatsPanel from './components/StatsPanel';
import AddRequestModal from './components/AddRequestModal';
import { RentalRequest, PostcodeZone } from './types';
import { PC4_ZONES } from './constants';
import { generateMockData } from './services/geminiService';
import { exportRequestsToExcel } from './services/excelService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { Plus, Map as MapIcon, Sparkles, Loader2, Download, Trash2, Cloud, CloudOff, Wifi } from 'lucide-react';

const STORAGE_KEY = 'amsterdam_rental_requests';

const App: React.FC = () => {
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [selectedZone, setSelectedZone] = useState<PostcodeZone | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Cloud Status
  const [useCloud, setUseCloud] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'live' | 'offline' | 'local'>('local');

  // 1. Initialization Effect
  useEffect(() => {
    const initialize = async () => {
      if (isSupabaseConfigured() && supabase) {
        setUseCloud(true);
        setSyncStatus('connecting');
        
        // A. Fetch initial data from Cloud
        const { data, error } = await supabase
          .from('requests')
          .select('*');
          
        if (error) {
          console.error("Supabase fetch error:", error);
          // Fallback to local if cloud fails
          loadLocalData();
        } else {
          setRequests(data as RentalRequest[] || []);
          setSyncStatus('live');
          
          // B. Setup Realtime Subscription
          const channel = supabase
            .channel('public:requests')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests' }, (payload) => {
              const newReq = payload.new as RentalRequest;
              setRequests(prev => [...prev, newReq]);
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'requests' }, (payload) => {
              setRequests(prev => prev.filter(req => req.id !== payload.old.id));
            })
            .subscribe((status) => {
               if (status === 'SUBSCRIBED') setSyncStatus('live');
               if (status === 'CLOSED') setSyncStatus('offline');
            });

          return () => {
            supabase.removeChannel(channel);
          };
        }
      } else {
        // Fallback: No keys configured
        loadLocalData();
      }
      setIsLoaded(true);
    };

    initialize();
  }, []);

  // 2. Local Storage Fallback Sync
  // Only runs if NOT using cloud
  useEffect(() => {
    if (isLoaded && !useCloud) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    }
  }, [requests, isLoaded, useCloud]);

  const loadLocalData = () => {
    setUseCloud(false);
    setSyncStatus('local');
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        setRequests(JSON.parse(savedData));
      } catch (e) {
        loadDemoData();
      }
    } else {
      loadDemoData();
    }
  };

  const loadDemoData = () => {
    const initialData: RentalRequest[] = [
      {
        id: '1',
        item: 'Hammer Drill',
        postcode: '1012 JS',
        lat: 52.3710,
        lng: 4.8940,
        date: new Date().toISOString(),
        description: 'Need for weekend renovation',
        zoneId: '1012'
      }
    ];
    setRequests(initialData);
  };

  const handleResetData = async () => {
    if (!window.confirm('WARNING: This will delete ALL data. If you are in Cloud mode, this deletes data for everyone. Continue?')) {
      return;
    }

    if (useCloud && supabase) {
      // Delete from Cloud
      const { error } = await supabase
        .from('requests')
        .delete()
        .neq('id', '0'); // Delete all rows where id is not 0 (basically all)
      
      if (error) {
        alert('Failed to clear cloud data');
        console.error(error);
      } else {
        setRequests([]); // Optimistic update
      }
    } else {
      // Delete Local
      localStorage.removeItem(STORAGE_KEY);
      loadDemoData();
      window.location.reload();
    }
  };

  const handleZoneSelect = (zone: PostcodeZone) => {
    setSelectedZone(zone);
  };

  const handleAddRequest = async (data: { item: string; postcode: string; description: string; lat: number; lng: number }) => {
    const pc4 = data.postcode.substring(0, 4);
    
    const newRequest: RentalRequest = {
      id: Date.now().toString(), // Temporarily use timestamp, DB might auto-generate UUID but string is fine
      item: data.item,
      postcode: data.postcode,
      lat: data.lat,
      lng: data.lng,
      date: new Date().toISOString(),
      description: data.description,
      zoneId: pc4
    };

    if (useCloud && supabase) {
      // Insert to Cloud
      const { error } = await supabase
        .from('requests')
        .insert([newRequest]);
      
      if (error) {
        alert("Error saving to cloud: " + error.message);
        // Fallback optimistic update
        setRequests(prev => [...prev, newRequest]);
      }
      // Note: We don't need to manually setRequests here because the Realtime subscription will catch our own insertion!
    } else {
      // Local Save
      setRequests(prev => [...prev, newRequest]);
    }
  };

  const handleGenerateData = async () => {
    setIsGenerating(true);
    const mockItems = await generateMockData(5);
    
    const newRequests: RentalRequest[] = mockItems.map((item, idx) => {
      const pc4 = item.postcode.substring(0, 4);
      const fallbackZone = PC4_ZONES[0];
      
      const jitterLat = (Math.random() - 0.5) * 0.008;
      const jitterLng = (Math.random() - 0.5) * 0.008;
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));

      return {
        id: `gen-${Date.now()}-${idx}`,
        item: item.item,
        postcode: item.postcode,
        lat: fallbackZone.center[0] + jitterLat,
        lng: fallbackZone.center[1] + jitterLng,
        date: date.toISOString(),
        description: item.description,
        zoneId: pc4
      };
    });

    if (useCloud && supabase) {
      await supabase.from('requests').insert(newRequests);
    } else {
      setRequests(prev => [...prev, ...newRequests]);
    }
    setIsGenerating(false);
  };

  const handleExport = () => {
    exportRequestsToExcel(requests);
  };

  return (
    <div className="h-screen w-full flex flex-col relative overflow-hidden font-sans text-gray-900 bg-gray-50">
      
      {/* Header / Navbar */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm h-16 flex items-center justify-between px-6 z-10 shrink-0 border-b border-gray-200">
        <div className="flex items-center gap-4">
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

          {/* Status Indicator */}
          <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
            useCloud 
              ? syncStatus === 'live' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
              : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}>
            {useCloud ? (
              syncStatus === 'live' ? <Wifi className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <CloudOff className="w-3 h-3" />
            )}
            {useCloud 
              ? (syncStatus === 'live' ? 'Live Sync Active' : 'Connecting...') 
              : 'Local Mode (Not Shared)'}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetData}
            title={useCloud ? "Clear Database (Careful!)" : "Reset Local Data"}
            className="hidden sm:flex items-center justify-center w-9 h-9 text-gray-400 hover:text-red-600 bg-transparent hover:bg-red-50 rounded-full transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleExport}
            title="Download as Excel"
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 rounded-full transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          <button
            onClick={handleGenerateData}
            disabled={isGenerating}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-full transition shadow-sm"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4 text-purple-600" />}
            {isGenerating ? 'Populating...' : 'Demo Data'}
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