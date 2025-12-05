import * as XLSX from 'xlsx';
import { RentalRequest } from '../types';

export const exportRequestsToExcel = (requests: RentalRequest[]) => {
  try {
    // 1. Format data for spreadsheet
    const data = requests.map(req => ({
      ID: req.id,
      Item: req.item,
      Postcode: req.postcode,
      District_Code: req.zoneId,
      Description: req.description,
      Date_Posted: new Date(req.date).toLocaleDateString(),
      Time_Posted: new Date(req.date).toLocaleTimeString(),
      Latitude: req.lat,
      Longitude: req.lng
    }));

    // 2. Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // 3. Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rental Requests");

    // 4. Generate Binary Data (Array Buffer)
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // 5. Create Blob manually
    // This method is robust for iframes where direct file triggers might be blocked
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    
    // 6. Create temporary download link
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.style.display = 'none';
    anchor.href = url;
    anchor.download = `Amsterdam_Rental_Requests_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // 7. Append to body, click, and cleanup
    // Appending to body is crucial for some browsers/iframes to register the click
    document.body.appendChild(anchor);
    anchor.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    }, 100);

  } catch (error) {
    console.error("Export failed:", error);
    alert("Download failed. If you are viewing this map inside another website (like Wix), please try opening the map in a new tab to download files.");
  }
};