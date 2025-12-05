import React, { useState, useEffect } from 'react';
import MapBoard from './components/MapBoard';
import StatsPanel from './components/StatsPanel';
import AddRequestModal from './components/AddRequestModal';
import { RentalRequest, PostcodeZone } from './types';
import { PC4_ZONES, AMSTERDAM_CENTER } from './constants';
import { generateMockData } from './services/geminiService';
import { exportRequestsToExcel } from './services/excelService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { Plus, Map as MapIcon, Loader2, Download, Trash2, CloudOff, Wifi, LayoutDashboard, Undo2 } from 'lucide-react';

const STORAGE_KEY = 'amsterdam_rental_requests';
const MY_REQUESTS_KEY = 'amsterdam_my_request_ids';

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
  
  // Track IDs created by this user on this device
  const [myRequestIds, setMyRequestIds] = useState<string[]>([]);
  
  // Cloud Status
  const [useCloud, setUseCloud] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'live' | 'offline' | 'local'>('local');

  // Helper: Get jittered coordinates based on PC4 ranges
  const getSmartCoords = (pc4: string) => {
    // 1. Try exact match in our highlighted zones first
    const zone = PC4_ZONES.find(z => z.id === pc4);
    if (zone) {
      return {
        lat: zone.center[0] + (Math.random() - 0.5) * 0.006,
        lng: zone.center[1] + (Math.random() - 0.5) * 0.006
      };
    }

    // 2. Fallback: Map broader PC4 ranges to district centers
    const p = parseInt(pc4);
    let center = AMSTERDAM_CENTER; // Default fallback

    if (p >= 1011 && p <= 1018) center = [52.373, 4.893];      // Centrum
    else if (p >= 1020 && p <= 1039) center = [52.395, 4.910]; // Noord
    else if (p >= 1040 && p <= 1049) center = [52.390, 4.840]; // Westpoort
    else if (p >= 1050 && p <= 1059) center = [52.365, 4.860]; // West
    else if (p >= 1060 && p <= 1069) center = [52.360, 4.830]; // Nieuw-West
    else if (p >= 1070 && p <= 1083) center = [52.345, 4.870]; // Zuid
    else if (p >= 1086 && p <= 1099) center = [52.355, 4.925]; // Oost
    else if (p >= 1100 && p <= 1109) center = [52.300, 4.950]; // Zuidoost
    
    return {
      lat: center[0] + (Math.random() - 0.5) * 0.015, // Larger jitter for broader districts
      lng: center[1] + (Math.random() - 0.5) * 0.015
    };
  };

  // 1. Initialization Effect
  useEffect(() => {
    // Load "My Requests" history from local storage
    const savedMyIds = localStorage.getItem(MY_REQUESTS_KEY);
    if (savedMyIds) {
      try {
        setMyRequestIds(JSON.parse(savedMyIds));
      } catch (e) {
        console.error("Failed to parse my request ids", e);
      }
    }

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
          loadLocalData();
        } else {
          setRequests(data as RentalRequest[] || []);
          setSyncStatus('live');
          
          // B. Setup Realtime Subscription
          const channel = supabase
            .channel('public:requests')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests' }, (payload) => {
              const newReq = payload.new as RentalRequest;
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
        loadLocalData();
      }
      setIsLoaded(true);
    };

    initialize();
  }, []);

  // 2. Persist "My Request IDs" whenever they change
  useEffect(() => {
    localStorage.setItem(MY_REQUESTS_KEY, JSON.stringify(myRequestIds));
  }, [myRequestIds]);

  // 3. Local Storage Fallback Sync (Only when offline)
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

  // NEW: Only delete requests created by this user
  const handleUndoMyRequests = async () => {
    if (myRequestIds.length === 0) {
      alert("You haven't posted any requests yet.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete your ${myRequestIds.length} submitted request(s)? This cannot be undone.`)) {
      return;
    }

    // 1. Optimistic Update (remove from UI immediately)
    setRequests(prev => prev.filter(req => !myRequestIds.includes(req.id)));

    // 2. Cloud Delete
    if (useCloud && supabase) {
      const { error } = await supabase
        .from('requests')
        .delete()
        .in('id', myRequestIds); // Delete where ID is in our list
      
      if (error) {
        console.error("Failed to delete from cloud", error);
        alert('Failed to sync deletion with cloud. Please try again.');
        // Re-fetch or reload page might be needed here in a strictly consistent app, 
        // but for this demo, keeping the optimistic update is usually fine.
      }
    }

    // 3. Clear local history
    setMyRequestIds([]);
  };

  const handleZoneSelect = (zone: PostcodeZone) => {
    setSelectedZone(zone);
  };

  const handleAddRequest = async (data: { item: string; postcode: string; description: string; lat: number; lng: number }) => {
    const pc4 = data.postcode.substring(0, 4);
    
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Add random jitter (approx 30-50m)
    const JITTER_AMOUNT = 0.0006;
    const jitterLat = (Math.random() - 0.5) * JITTER_AMOUNT;
    const jitterLng = (Math.random() - 0.5) * JITTER_AMOUNT;

    const newRequest: RentalRequest = {
      id: newId,
      item: data.item,
      postcode: data.postcode,
      lat: data.lat + jitterLat,
      lng: data.lng + jitterLng,
      date: new Date().toISOString(),
      description: data.description,
      zoneId: pc4
    };

    // Track this ID as "Mine"
    setMyRequestIds(prev => [...prev, newId]);

    // Optimistic Update
    setRequests(prev => [...prev, newRequest]);

    if (useCloud && supabase) {
      const { error } = await supabase
        .from('requests')
        .insert([newRequest]);
      
      if (error) {
        console.error("Supabase saving error:", error);
        alert("Error saving to cloud. Changes reverted.");
        setRequests(prev => prev.filter(r => r.id !== newId));
        setMyRequestIds(prev => prev.filter(id => id !== newId));
      } 
    }
  };

  const handleGenerateData = async () => {
    setIsGenerating(true);
    const mockItems = await generateMockData(5);
    
    const newRequests: RentalRequest[] = mockItems.map((item, idx) => {
      const pc4 = item.postcode.substring(0, 4);
      const coords = getSmartCoords(pc4); 
      
      const newId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `gen-${Date.now()}-${idx}`;

      return {
        id: newId,
        item: item.item,
        postcode: item.postcode,
        lat: coords.lat,
        lng: coords.lng,
        date: new Date().toISOString(),
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
          {/* Modified Delete Button -> Undo My Requests */}
          <button
            onClick={handleUndoMyRequests}
            title={myRequestIds.length > 0 ? `Undo my ${myRequestIds.length} posts` : "No posts to undo"}
            className={`hidden sm:flex items-center justify-center w-9 h-9 rounded-full transition ${
              myRequestIds.length > 0 
                ? 'text-gray-500 hover:text-red-600 hover:bg-red-50 cursor-pointer' 
                : 'text-gray-300 cursor-not-allowed'
            }`}
            disabled={myRequestIds.length === 0}
          >
            {/* Changed icon to Undo2 or Trash with context */}
            <Undo2 className="w-4 h-4" />
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