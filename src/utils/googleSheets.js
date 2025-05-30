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

/**
 * Fetches schedule data from a team's sheet in Google Sheets
 * @param {Object} [options] - Configuration options
 * @param {string} [options.sheetName] - Name of the team's worksheet
 * @returns {Promise<Array>} Array of scheduled games with N/A for missing data
 */
async function getSchedule(options = {}) {
  const { sheetName = 'Schedule' } = options;

  console.log(`Fetching schedule from sheet: ${sheetName}`);
  
  try {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SPREADSHEET_ID, jwtClient);
    await doc.loadInfo();
    
    console.log(`Available sheets:`, Object.keys(doc.sheetsByTitle));
    
    const sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) {
      console.error(`Sheet "${sheetName}" not found in the spreadsheet`);
      return [];
    }
    
    console.log(`Found sheet "${sheetName}", loading rows...`);
    const rows = await sheet.getRows();
    console.log(`Processing ${rows.length} rows from "${sheetName}"`);
    
    const schedule = [];
    
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const rawData = row._rawData || [];
        
        // Skip header row
        if (i === 0) {
          console.log('Skipping header row');
          continue;
        }
        
        // Skip rows where home and away team columns are empty
        if (!rawData[0] && !rawData[1]) {
          console.log(`Skipping row ${i} (missing teams)`);
          continue;
        }
        
        // Process row with null/undefined handling
        const entry = {
          homeTeam: sheetName, // Always use the sheet name as home team
          awayTeam: rawData[1] ? String(rawData[1]).trim() : 'N/A',
          games: [
            { homeScore: rawData[2] !== undefined ? Number(rawData[2]) || 0 : 0, awayScore: rawData[3] !== undefined ? Number(rawData[3]) || 0 : 0 },
            { homeScore: rawData[4] !== undefined ? Number(rawData[4]) || 0 : 0, awayScore: rawData[5] !== undefined ? Number(rawData[5]) || 0 : 0 },
            { homeScore: rawData[6] !== undefined ? Number(rawData[6]) || 0 : 0, awayScore: rawData[7] !== undefined ? Number(rawData[7]) || 0 : 0 }
          ],
          seriesWinner: rawData[8] ? String(rawData[8]).trim() : null
        };
        
        // Calculate series score and determine winner if there are any played games
        const playedGames = entry.games.filter(g => g.homeScore > 0 || g.awayScore > 0);
        if (playedGames.length > 0) {
          let homeWins = 0;
          let awayWins = 0;
          
          playedGames.forEach(game => {
            if (game.homeScore > game.awayScore) {
              homeWins++;
            } else if (game.awayScore > game.homeScore) {
              awayWins++;
            }
          });
          
          entry.seriesScore = `${homeWins}-${awayWins}`;
          
          // Determine series winner (first to 2+ wins)
          if (homeWins >= 2) {
            entry.seriesWinner = entry.homeTeam;
          } else if (awayWins >= 2) {
            entry.seriesWinner = entry.awayTeam;
          }
        } else {
          entry.seriesScore = '0-0';
        }
        
        console.log(`Processed entry ${i}:`, JSON.stringify(entry, null, 2));
        
        // Skip if all scores are 0 and there's no series winner
        const hasScores = entry.games.some(g => g.homeScore > 0 || g.awayScore > 0);
        if (!hasScores && !entry.seriesWinner) {
          console.log(`Skipping entry ${i} (no scores and no series winner)`);
          continue;
        }
        
        schedule.push(entry);
      } catch (rowError) {
        console.error(`Error processing row ${i} in sheet ${sheetName}:`, rowError);
        continue;
      }
    }
    
    console.log(`Successfully processed ${schedule.length} games from "${sheetName}"`);
    return schedule;
  } catch (error) {
    console.error('Error in getSchedule:', error);
    throw new Error(`Failed to fetch schedule from sheet "${sheetName}": ${error.message}`);
  }
}

module.exports = {
  getStandings,
  getAvailableSheets,
  getSchedule
};
