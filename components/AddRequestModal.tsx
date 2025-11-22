import React, { useState } from 'react';
import { X, MapPin, Package, FileText, Loader2, CheckCircle } from 'lucide-react';
import { geocodePostcode, getZoneFromPostcode } from '../services/geoService';

interface AddRequestModalProps {
  onClose: () => void;
  onSubmit: (data: { item: string; postcode: string; description: string; lat: number; lng: number }) => void;
}

const AddRequestModal: React.FC<AddRequestModalProps> = ({ onClose, onSubmit }) => {
  const [item, setItem] = useState('');
  const [postcode, setPostcode] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusStep, setStatusStep] = useState<'idle' | 'geocoding' | 'finalizing'>('idle');

  // Helper to capitalize first letter of sentences/items
  const formatItemInput = (val: string) => {
    return val.charAt(0).toUpperCase() + val.slice(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Explicit Validation
    const missingFields = [];
    if (!item.trim()) missingFields.push("Item");
    if (!postcode.trim()) missingFields.push("Postcode");
    // Description is now OPTIONAL

    if (missingFields.length > 0) {
      setError(`Required: ${missingFields.join(', ')}`);
      return;
    }

    const cleanPostcode = postcode.trim().toUpperCase();
    
    // Basic regex check, but allow some flexibility to avoid blocking valid inputs
    if (!/^[1-9][0-9]{3}\s?[A-Z]{2}$/.test(cleanPostcode)) {
      setError('Invalid Postcode format. Example: 1012 AB');
      return;
    }

    setIsSubmitting(true);
    setStatusStep('geocoding');

    try {
      // 1. Geocode the postcode to get real Lat/Lng
      const coords = await geocodePostcode(cleanPostcode);
      
      if (!coords) {
        setError('Location not found in Amsterdam. Try a valid postcode.');
        setIsSubmitting(false);
        setStatusStep('idle');
        return;
      }

      setStatusStep('finalizing');

      // 2. Prepare Data
      // Basic cleaning: Capitalize item, set default description if empty
      const finalItem = formatItemInput(item.trim());
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">New Rental Request</h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 hover:bg-gray-200 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Postcode <span className="text-red-500">*</span></label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. 1012 AB"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 focus:bg-white font-mono uppercase"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Required for map placement.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">What do you need? <span className="text-red-500">*</span></label>
            <div className="relative">
              <Package className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. Drill, Ladder (can list multiple)"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Details <span className="text-gray-400 font-normal">(Optional)</span></label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                placeholder="When do you need it? Any specific requirements?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition min-h-[100px] bg-gray-50 focus:bg-white resize-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {statusStep === 'geocoding' ? 'Locating...' : 'Posting...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Post Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRequestModal;