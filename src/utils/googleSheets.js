const { GoogleSpreadsheet } = require('google-spreadsheet');
require('dotenv').config();

/**
 * Fetches data from Google Sheets
 * @returns {Promise<Array>} Array of team standings
 */
async function getStandings() {
  try {
    // Initialize the sheet - doc ID is the long id in the sheets URL
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
    
    // Use service account credentials
    const serviceAccount = require('../../service-account.json');
    await doc.useServiceAccountAuth(serviceAccount);
    
    // Load document properties and worksheets
    await doc.loadInfo();
    
    // Get the specific worksheet by name
    const sheet = doc.sheetsByTitle[process.env.GOOGLE_SHEETS_WORKSHEET_NAME || 'Overall Standings'];
    
    if (!sheet) {
      throw new Error(`Worksheet "${process.env.GOOGLE_SHEETS_WORKSHEET_NAME}" not found`);
    }
    
    // Get all rows
    const rows = await sheet.getRows();
    
    // Map the rows to the expected format
    const standings = rows.map((row, index) => ({
      rank: parseInt(row.position || index + 1, 10),
      team: row.team || '',
      points: parseInt(row.total_points || 0, 10),
      wins: parseInt(row.wins || 0, 10),
      losses: parseInt(row.losses || 0, 10),
      // Add any additional fields from your sheet
      ...(row.games_played && { gamesPlayed: parseInt(row.games_played, 10) }),
      ...(row.win_percentage && { winPercentage: parseFloat(row.win_percentage) })
    }));
    
    return standings;
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    throw error;
  }
}

module.exports = {
  getStandings
};
