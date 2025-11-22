import * as XLSX from 'xlsx';
import { RentalRequest } from '../types';

export const exportRequestsToExcel = (requests: RentalRequest[]) => {
  // Format data for spreadsheet
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

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rental Requests");

  // Generate Excel file
  XLSX.writeFile(workbook, `Amsterdam_Rental_Requests_${new Date().toISOString().split('T')[0]}.xlsx`);
};