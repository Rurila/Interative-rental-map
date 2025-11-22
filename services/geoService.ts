import { PostcodeZone } from "../types";

// Geocode a Dutch postcode (e.g., "1012 AB") to Lat/Lng using OpenStreetMap Nominatim
export const geocodePostcode = async (postcode: string): Promise<[number, number] | null> => {
  try {
    const cleanPostcode = postcode.replace(/\s/g, '');
    // Query Nominatim
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${cleanPostcode},Amsterdam&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'AmsterdamRentalMapDemo/1.0'
        }
      }
    );

    if (!response.ok) throw new Error("Geocoding failed");

    const data = await response.json();
    
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    return null;
  } catch (error) {
    console.error("Geocoding Error:", error);
    return null;
  }
};

// Helper to determine district name based on PC4
// Ranges based on official Amsterdam Stadsdelen
export const getDistrictNameFromPC4 = (pc4: string): string => {
  const val = parseInt(pc4);
  
  // Centrum
  if (val >= 1011 && val <= 1018) return "Centrum";
  
  // Oost (includes Zeeburg, IJburg 1086+, Watergraafsmeer)
  if (val === 1019) return "Oost (Oostelijk Havengebied)";
  if (val >= 1086 && val <= 1099) return "Oost";
  
  // Noord
  if (val >= 1020 && val <= 1039) return "Noord";
  
  // Westpoort (Port area)
  if (val >= 1040 && val <= 1049) return "Westpoort";
  
  // West
  if (val >= 1050 && val <= 1059) return "West";
  
  // Nieuw-West
  if (val >= 1060 && val <= 1069) return "Nieuw-West";
  
  // Zuid (includes Buitenveldert)
  if (val >= 1070 && val <= 1083) return "Zuid";
  
  // Zuidoost (Bijlmer, Gaasperdam)
  if (val >= 1100 && val <= 1109) return "Zuidoost";
  
  return "Metropolitan Area";
};

// Official Amsterdam Map Colors style approximation
// Reference: https://maps.amsterdam.nl/postcode/
export const getDistrictColorFromPC4 = (pc4: string): string => {
  const val = parseInt(pc4);
  
  // Centrum: Red
  if (val >= 1011 && val <= 1018) return '#E4002B'; 
  
  // Oost: Orange
  if (val === 1019 || (val >= 1086 && val <= 1099)) return '#FF7F00'; 
  
  // Noord: Purple
  if (val >= 1020 && val <= 1039) return '#8F00FF'; 
  
  // Westpoort: Grey (Industrial)
  if (val >= 1040 && val <= 1049) return '#787878'; 
  
  // West: Blue
  if (val >= 1050 && val <= 1059) return '#009DE6'; 
  
  // Nieuw-West: Olive Green
  if (val >= 1060 && val <= 1069) return '#6D8B24'; 
  
  // Zuid: Dark Green
  if (val >= 1070 && val <= 1083) return '#007E3C'; 
  
  // Zuidoost: Magenta/Pink
  if (val >= 1100 && val <= 1109) return '#EC008C'; 
  
  return '#A0A0A0'; // Default Gray
};

export const getZoneFromPostcode = (postcode: string): PostcodeZone | undefined => {
  const pc4 = postcode.trim().substring(0, 4);
  return {
    id: pc4,
    districtName: getDistrictNameFromPC4(pc4),
    color: getDistrictColorFromPC4(pc4),
    center: [52.3702, 4.8952], // Default center
    polygon: []
  };
};