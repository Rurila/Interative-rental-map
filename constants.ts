import { PostcodeZone } from './types';
import { getDistrictColorFromPC4, getDistrictNameFromPC4 } from './services/geoService';

export const AMSTERDAM_CENTER: [number, number] = [52.3702, 4.8952];
export const ZOOM_LEVEL = 13;

export const POPULAR_ITEMS = [
  "Thermal camera", "Projector", "Karaoke set", "Montessori Stepping Stones", "Sewing machine",
  "Bush cutter", "Hedge trimmer", "Weed puller", "Drill", "Sander",
  "Toolbox", "Telescopic ladder", "Moisture meter", "Bicycle toolkit",
  "Jigsaw", "Large pan set", "Slow cooker Professional", "Handheld pressure washer",
  "Wet and dry vacuum cleaner", "Carpet cleaner"
];

// Fallback zones in case GeoJSON fails to load
// This ensures the app is usable immediately even without the external file
export const PC4_ZONES: PostcodeZone[] = [
  {
    id: '1012',
    districtName: 'Centrum (Dam/Red Light)',
    color: getDistrictColorFromPC4('1012'),
    center: [52.3730, 4.8930],
    polygon: [
      [52.378, 4.895], [52.377, 4.900], [52.369, 4.898], [52.368, 4.891], [52.374, 4.890]
    ]
  },
  {
    id: '1054',
    districtName: 'Oud-West (Overtoom)',
    color: getDistrictColorFromPC4('1054'),
    center: [52.3600, 4.8650],
    polygon: [
      [52.363, 4.860], [52.364, 4.874], [52.356, 4.872], [52.355, 4.858]
    ]
  },
  {
    id: '1071',
    districtName: 'Zuid (Museumkwartier)',
    color: getDistrictColorFromPC4('1071'),
    center: [52.3580, 4.8800],
    polygon: [
      [52.362, 4.878], [52.361, 4.888], [52.354, 4.886], [52.355, 4.875]
    ]
  },
  {
    id: '1091',
    districtName: 'Oost (Oosterpark)',
    color: getDistrictColorFromPC4('1091'),
    center: [52.3550, 4.9150],
    polygon: [
      [52.360, 4.910], [52.359, 4.925], [52.350, 4.920], [52.351, 4.908]
    ]
  },
  {
    id: '1031',
    districtName: 'Noord (Overhoeks)',
    color: getDistrictColorFromPC4('1031'),
    center: [52.3850, 4.9000],
    polygon: [
       [52.382, 4.895], [52.383, 4.910], [52.392, 4.908], [52.390, 4.892]
    ]
  }
];

export const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & Amsterdam Open Data';
