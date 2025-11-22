# Amsterdam Rental Map - Developer Guide

## 1. Deployment (GitHub Pages)

This application is configured to be deployed easily to GitHub Pages.

### Prerequisites
- Ensure you have a GitHub repository connected.

### Steps
1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Build and Deploy:**
   The `package.json` includes a deploy script that builds the app and pushes the `dist` folder to the `gh-pages` branch.
   ```bash
   npm run deploy
   ```
   
3. **Configuration:**
   - If deploying to `https://<user>.github.io/<repo>/`, no changes are needed.
   - The `vite.config.ts` has `base: './'` set to handle relative paths correctly.

## 2. Updating Map Data (GeoJSON)

The map is designed to load official Amsterdam administrative boundaries. 

**The app expects a file named `amsterdam_pc4.geojson` in the `public/` folder.**

### How to get the data:
1. Go to [Amsterdam Open Geodata](https://maps.amsterdam.nl/open_geodata/geojson_lnglat.php?KAARTLAAG=PC4_BUURTEN&THEMA=postcode).
2. Download the GeoJSON file.
3. Rename it to `amsterdam_pc4.geojson`.
4. Place it in the `public/` directory of your project.
5. The application will automatically detect it and replace the demo fallback polygons with the official detailed map.

*Note: If the file is missing, the app uses a small fallback set defined in `constants.ts` to prevent crashing.*

## 3. Customizing Colors & Zones

The logic for coloring districts is located in `services/geoService.ts`.

To change the color of a specific neighborhood (e.g., make "Centrum" Orange instead of Red):

1. Open `services/geoService.ts`.
2. Find the function `getDistrictColorFromPC4`.
3. Update the return value for the relevant Postcode range.

```typescript
if (val >= 1011 && val <= 1018) return '#NEW_COLOR_HEX'; // Centrum
```

## 4. Excel Export

The app uses `xlsx` (SheetJS) to generate Excel files client-side.
- Logic location: `services/excelService.ts`.
- Trigger: "Export Data" button in `App.tsx`.

No backend server is required for this feature.
