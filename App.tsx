import React, { useState, useEffect } from 'react';
import MapBoard from './components/MapBoard';
import StatsPanel from './components/StatsPanel';
import AddRequestModal from './components/AddRequestModal';
import { RentalRequest, PostcodeZone } from './types';
import { PC4_ZONES, AMSTERDAM_CENTER } from './constants';
import { generateMockData } from './services/geminiService';
import { exportRequestsToExcel } from './services/excelService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { Plus, Map as MapIcon, Loader2, Download, Trash2, Cloud, CloudOff, Wifi, LayoutDashboard } from 'lucide-react';

const STORAGE_KEY = 'amsterdam_rental_requests';

const AMSTERDAM_GLOBAL_ZONE: PostcodeZone = {
  id: 'ALL',
  districtName: 'City of Amsterdam',
  color: '#E4002B', // Amsterdam Red
  center: AMSTERDAM_CENTER,
  polygon: []
};

const App: React.FC = () => {
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [selectedZone, setSelectedZone] = useState<PostcodeZone | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Cloud Status
  const [useCloud, setUseCloud] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'live' | 'offline' | 'local'>('local');

  // Helper: Get jittered coordinates based on PC4
  const getSmartCoords = (pc4: string) => {
    const zone = PC4_ZONES.find(z => z.id === pc4);
    // If zone found, use its center. If not, fallback to City center.
    const center = zone ? zone.center : AMSTERDAM_CENTER;
    
    // Add randomness (approx 500m radius) so dots don't stack
    const jitterLat = (Math.random() - 0.5) * 0.006;
    const jitterLng = (Math.random() - 0.5) * 0.006;
    
    return {
      lat: center[0] + jitterLat,
      lng: center[1] + jitterLng
    };
  };

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
              // Prevent duplicates: Check if ID already exists (e.g. if we added it optimistically)
              setRequests(prev => {
                if (prev.some(req => req.id === newReq.id)) return prev;
                return [...prev, newReq];
              });
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
    // Create specific demo data that maps correctly to our defined zones
    const demoItems = [
      { item: 'Hammer Drill', pc: '1012', desc: 'Renovation work' },
      { item: 'Cargo Bike', pc: '1054', desc: 'Moving boxes' },
      { item: 'Party Tent', pc: '1071', desc: 'Garden party' },
      { item: 'Ladder', pc: '1091', desc: 'Painting ceiling' },
      { item: 'Sound System', pc: '1031', desc: 'Event' }
    ];

    const initialData: RentalRequest[] = demoItems.map((d, i) => {
      const coords = getSmartCoords(d.pc);
      return {
        id: `demo-${i}`,
        item: d.item,
        postcode: `${d.pc} XX`,
        lat: coords.lat,
        lng: coords.lng,
        date: new Date().toISOString(),
        description: d.desc,
        zoneId: d.pc
      };
    });
    
    setRequests(initialData);
  };

  const handleResetData = async () => {
    if (!window.confirm('WARNING: This will delete ALL data. If you are in Cloud mode, this deletes data for everyone. Continue?')) {
      return;
    }

    if (useCloud && supabase) {
      const { error } = await supabase
        .from('requests')
        .delete()
        .neq('id', '0'); 
      
      if (error) {
        alert('Failed to clear cloud data');
      } else {
        setRequests([]); 
      }
    } else {
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
      id: Date.now().toString(),
      item: data.item,
      postcode: data.postcode,
      lat: data.lat,
      lng: data.lng,
      date: new Date().toISOString(),
      description: data.description,
      zoneId: pc4
    };

    if (useCloud && supabase) {
      const { error } = await supabase
        .from('requests')
        .insert([newRequest]);
      
      if (error) {
        alert("Error saving to cloud: " + error.message);
        // Even if cloud fails, we might want to show it locally? 
        // For now, let's assume if it fails we don't show it.
      } else {
        // SUCCESS! Optimistic Update:
        // We update the local state IMMEDIATELY so the user sees the dot instantly.
        // The realtime subscription (in useEffect) has a check to prevent duplicates.
        setRequests(prev => {
           if (prev.some(r => r.id === newRequest.id)) return prev;
           return [...prev, newRequest];
        });
      }
    } else {
      // Local Mode
      setRequests(prev => [...prev, newRequest]);
    }
  };

  // Kept for internal use or advanced debug, but removed from main UI button
  const handleGenerateData = async () => {
    setIsGenerating(true);
    const mockItems = await generateMockData(5);
    
    const newRequests: RentalRequest[] = mockItems.map((item, idx) => {
      const pc4 = item.postcode.substring(0, 4);
      const coords = getSmartCoords(pc4); // Use smart coords logic
      
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));

      return {
        id: `gen-${Date.now()}-${idx}`,
        item: item.item,
        postcode: item.postcode,
        lat: coords.lat,
        lng: coords.lng,
        date: date.toISOString(),
        description: item.description,
        zoneId: pc4
      };
    });

    if (useCloud && supabase) {
      await supabase.from('requests').insert(newRequests);
      // We rely on realtime sub for bulk generates to avoid complex local state merging here
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

          {/* UPDATED BUTTON: "Amsterdam" shows overall stats */}
          <button
            onClick={() => handleZoneSelect(AMSTERDAM_GLOBAL_ZONE)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-full transition shadow-sm uppercase tracking-wide"
          >
            <LayoutDashboard className="w-4 h-4" />
            Amsterdam
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