import axios from 'axios';

// Fetch standings from Google Sheets
export async function getStandings(spreadsheetId, sheetName = 's4-standings', apiKey) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?key=${apiKey}`;
  const res = await axios.get(url);
  return res.data.values;
}
