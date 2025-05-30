const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Load service account credentials
const serviceAccount = require('../../service-account.json');

// Create a JWT client for authentication
const jwtClient = new JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

/**
 * Fetches data from Google Sheets
 * @returns {Promise<Array>} Array of team standings
 */
async function getStandings() {
  try {
    // Initialize the sheet - doc ID is the long id in the sheets URL
    const doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      jwtClient
    );
    
    // Load document info and worksheets
    await doc.loadInfo();
    
    // Get the specific worksheet by name
    const sheet = doc.sheetsByTitle[process.env.GOOGLE_SHEETS_WORKSHEET_NAME || 'Overall Standings'];
    
    if (!sheet) {
      throw new Error(`Worksheet "${process.env.GOOGLE_SHEETS_WORKSHEET_NAME}" not found`);
    }
    
    // Get all rows
    const rows = await sheet.getRows();
    console.log('Raw rows from Google Sheets:', JSON.stringify(rows.map(r => r._rawData), null, 2)); // Log raw data
    
    // Map the rows to include position, name, and total points
    const standings = rows.map(row => ({
      position: row._rawData[0], // Assuming Position is the first column
      name: row._rawData[1],     // Assuming Teams is the second column
      totalPoints: parseFloat(row._rawData[2]) || 0 // Assuming Total Points is the third column, ensure it's a number
    }));
    
    // Sort by points if not already sorted
    standings.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
    
    // Add rank based on position
    console.log('Mapped standings data:', JSON.stringify(standings, null, 2)); // Log mapped data
    return standings.map((teams, index) => ({
      ...teams,
      rank: index + 1
    }));
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    throw error;
  }
}

module.exports = {
  getStandings
};
