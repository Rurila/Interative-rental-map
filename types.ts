export interface RentalRequest {
  id: string;
  item: string;
  postcode: string; // Full postcode e.g. "1012 AB"
  lat: number;
  lng: number;
  date: string; // ISO String
  description: string;
  zoneId: string; // The PC4 (e.g., "1012") this request belongs to
}

export interface PostcodeZone {
  id: string; // This is the PC4 code (e.g., "1012")
  districtName: string; // e.g., "Centrum", "West"
  color: string;
  center: [number, number]; 
  polygon: [number, number][]; // Detailed PC4 boundary
}

export interface ItemStat {
  name: string;
  count: number;
}