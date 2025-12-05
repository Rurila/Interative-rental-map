import React, { useState } from 'react';
import { X, MapPin, Package, FileText, Loader2, CheckCircle, Plus, Check } from 'lucide-react';
import { geocodePostcode } from '../services/geoService';
import { POPULAR_ITEMS } from '../constants';

interface AddRequestModalProps {
  onClose: () => void;
  onSubmit: (data: { item: string; postcode: string; description: string; lat: number; lng: number }) => void;
}

const AddRequestModal: React.FC<AddRequestModalProps> = ({ onClose, onSubmit }) => {
  // Changed from single string to array for multi-selection
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customItem, setCustomItem] = useState('');
  const [postcode, setPostcode] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusStep, setStatusStep] = useState<'idle' | 'geocoding' | 'finalizing'>('idle');

  const toggleItem = (item: string) => {
    setSelectedItems(prev => {
      if (prev.includes(item)) {
        return prev.filter(i => i !== item);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Explicit Validation
    const missingFields = [];
    
    // Require at least one item source (either clicked items OR typed custom item)
    if (selectedItems.length === 0 && !customItem.trim()) missingFields.push("Item selection");
    if (!postcode.trim()) missingFields.push("Postcode");

    if (missingFields.length > 0) {
      setError(`Required: ${missingFields.join(', ')}`);
      return;
    }

    const cleanPostcode = postcode.trim().toUpperCase();
    
    // Basic regex check
    if (!/^[1-9][0-9]{3}\s?[A-Z]{2}$/.test(cleanPostcode)) {
      setError('Invalid Postcode format. Example: 1012 AB');
      return;
    }

    setIsSubmitting(true);
    setStatusStep('geocoding');

    try {
      // 1. Geocode
      const coords = await geocodePostcode(cleanPostcode);
      
      if (!coords) {
        setError('Location not found in Amsterdam. Try a valid postcode.');
        setIsSubmitting(false);
        setStatusStep('idle');
        return;
      }

      setStatusStep('finalizing');

      // 2. Prepare Data
      // Combine all selected items and custom item into one string
      const parts = [...selectedItems];
      if (customItem.trim()) {
        // Capitalize custom item
        const cleanCustom = customItem.trim().charAt(0).toUpperCase() + customItem.trim().slice(1);
        parts.push(cleanCustom);
      }
      
      const finalItem = parts.join(', ');
      const finalDesc = description.trim() || "No details provided";

      // 3. Submit
      setTimeout(() => {
        onSubmit({ 
          item: finalItem, 
          postcode: cleanPostcode, 
          description: finalDesc, 
          lat: coords[0], 
          lng: coords[1] 
        });
        setIsSubmitting(false);
        onClose();
      }, 500);

    } catch (err) {
      setError('Network error while verifying location.');
      setIsSubmitting(false);
      setStatusStep('idle');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b flex justify-between items-center bg-gray-50 shrink-0">
          <h2 className="text-lg font-bold text-gray-800">New Rental Request</h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 hover:bg-gray-200 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {/* Section 1: Item Selection (Multi-select) */}
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                Select items you need (Multiple allowed)
             </label>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {POPULAR_ITEMS.map((itemName) => {
                  const isSelected = selectedItems.includes(itemName);
                  return (
                    <button
                      key={itemName}
                      type="button"
                      onClick={() => toggleItem(itemName)}
                      className={`relative px-2 py-3 text-xs font-medium rounded-lg border transition-all text-center group
                        ${isSelected 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200' 
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1 right-1">
                          <Check className="w-3 h-3 text-blue-200" />
                        </div>
                      )}
                      {itemName}
                    </button>
                  );
                })}
             </div>
          </div>

          {/* Section 2: Custom Item */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
               What else do you need? <span className="font-normal text-gray-400">(Not in list above)</span>
            </label>
            <div className="relative">
              <Plus className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Type other items here..."
                value={customItem}
                onChange={(e) => setCustomItem(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 focus:bg-white text-sm"
              />
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full my-2"></div>

          {/* Section 3: Location & Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Postcode <span className="text-red-500">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. 1012 AB"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 focus:bg-white font-mono uppercase text-sm"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Full postcode for map placement.</p>
             </div>
             
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Details <span className="text-gray-400 font-normal">(Opt)</span></label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    placeholder="Requirements?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition min-h-[50px] bg-gray-50 focus:bg-white resize-none text-sm h-[82px]"
                  />
                </div>
             </div>
          </div>
        </div>

        <div className="p-5 border-t bg-gray-50 shrink-0">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {statusStep === 'geocoding' ? 'Verifying Address...' : 'Posting...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Post Request
                </>
              )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AddRequestModal;