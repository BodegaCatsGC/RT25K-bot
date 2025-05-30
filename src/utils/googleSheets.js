const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

// Validate required environment variables
const REQUIRED_ENV_VARS = ['GOOGLE_SHEETS_SPREADSHEET_ID'];
const MISSING_ENV_VARS = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);

if (MISSING_ENV_VARS.length > 0) {
  throw new Error(`Missing required environment variables: ${MISSING_ENV_VARS.join(', ')}`);
}

// Load service account credentials
let serviceAccount;
try {
  serviceAccount = require('../../service-account.json');
} catch (error) {
  throw new Error('Failed to load service account credentials. Make sure service-account.json exists in the root directory.');
}

// Create a JWT client for authentication
const jwtClient = new JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key.replace(/\\n/g, '\n'), // Handle newlines in private key
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

// Default column mapping (0-based indices)
const DEFAULT_COLUMN_MAPPING = {
  group: 0,           // Column A - Group
  position: 1,        // Column B - Position
  team: 2,            // Column C - Team
  totalPoints: 7,     // Column H - Total Points (skipping D-G)
  
  // Alternative mapping if the above doesn't work
  // group: 0,        // Column A - Group
  // position: 1,     // Column B - Position
  // team: 2,         // Column C - Team
  // totalPoints: 2   // If totalPoints is in column C
};

/**
 * Fetches and processes standings data from Google Sheets
 * @param {Object} [options] - Configuration options
 * @param {string} [options.sheetName] - Name of the worksheet to fetch data from
 * @param {Object} [options.columnMapping] - Custom column mapping (0-based indices)
 * @returns {Promise<Array<{
 *   group: string,
 *   position: string,
 *   team: string,
 *   totalPoints: number,
 *   rank: number
 * }>>} Array of team standings with essential columns
 * @throws {Error} If there's an error fetching or processing the data
 */
async function getStandings(options = {}) {
  const {
    sheetName = process.env.GOOGLE_SHEETS_WORKSHEET_NAME || 's4-standings',
    columnMapping = DEFAULT_COLUMN_MAPPING
  } = options;

  console.log(`Fetching standings from sheet: ${sheetName}`);
  
  try {
    // Initialize the Google Sheets document
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SPREADSHEET_ID, jwtClient);
    
    // Load document info and worksheets
    await doc.loadInfo();
    
    // Get the specific worksheet by name
    const sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) {
      throw new Error(`Worksheet "${sheetName}" not found in the spreadsheet`);
    }
    
    // Get all rows with header row
    const rows = await sheet.getRows();
    
    if (rows.length === 0) {
      console.warn('No data rows found in the worksheet');
      return [];
    }
    
    // Process each row into a standings entry
    const standings = [];
    
    console.log('Processing rows. Total rows:', rows.length);
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const rawData = row._rawData || [];
        console.log(`Row ${i} raw data:`, JSON.stringify(rawData));
        
        const entry = {
          group: rawData[columnMapping.group] !== undefined ? String(rawData[columnMapping.group]).trim() : '',
          position: rawData[columnMapping.position] !== undefined ? String(rawData[columnMapping.position]).trim() : '',
          team: rawData[columnMapping.team] !== undefined ? String(rawData[columnMapping.team]).trim() : '',
          totalPoints: rawData[columnMapping.totalPoints] !== undefined ? parseFloat(rawData[columnMapping.totalPoints]) || 0 : 0
        };
        
        console.log(`Processed entry ${i}:`, JSON.stringify(entry));
        
        // Skip empty rows
        if (!entry.team) continue;
        
        standings.push(entry);
      } catch (rowError) {
        console.error(`Error processing row ${row.rowNumber}:`, rowError);
        continue;
      }
    }
    
    // Sort by points in descending order
    standings.sort((a, b) => b.totalPoints - a.totalPoints);
    
    // Add rank based on sorted position (1-based index)
    return standings.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
    
  } catch (error) {
    console.error('Error in getStandings:', error.message);
    throw new Error(`Failed to fetch standings: ${error.message}`);
  }
}

/**
 * Get the list of available worksheets in the spreadsheet
 * @returns {Promise<Array<{title: string, index: number, rowCount: number, columnCount: number}>>}
 */
async function getAvailableSheets() {
  try {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SPREADSHEET_ID, jwtClient);
    await doc.loadInfo();
    
    return doc.sheetsByIndex.map(sheet => ({
      title: sheet.title,
      index: sheet.index,
      rowCount: sheet.rowCount,
      columnCount: sheet.columnCount
    }));
  } catch (error) {
    console.error('Error fetching sheet list:', error);
    throw new Error(`Failed to fetch sheet list: ${error.message}`);
  }
}

module.exports = {
  getStandings,
  getAvailableSheets
};
