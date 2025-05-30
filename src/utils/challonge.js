const axios = require('axios');

class ChallongeClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.challonge.com/v1';
    this.client = axios.create({
      baseURL: this.baseUrl,
      params: {
        api_key: this.apiKey
      },
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RT25K-Discord-Bot/1.0',
      },
    });
  }

  /**
   * Get tournament details
   * @param {string} tournamentId - Tournament ID or URL (e.g., 'my-tournament' or 'mytourney123')
   * @returns {Promise<Object>} Tournament data
   */
  async getTournament(tournamentId) {
    try {
      // Handle full URL input by extracting just the tournament ID
      let id = tournamentId;
      if (tournamentId.includes('challonge.com/')) {
        const url = new URL(tournamentId);
        id = url.pathname.split('/').pop();
      }
      
      const response = await this.client.get(`/tournaments/${id}.json`, {
        params: {
          include_matches: 1,
          include_participants: 1
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching tournament:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get tournament participants
   * @param {string} tournamentId - Tournament ID or URL
   * @returns {Promise<Array>} Array of participants
   */
  async getParticipants(tournamentId) {
    try {
      let id = tournamentId;
      if (tournamentId.includes('challonge.com/')) {
        const url = new URL(tournamentId);
        id = url.pathname.split('/').pop();
      }
      
      const response = await this.client.get(`/tournaments/${id}/participants.json`);
      return response.data;
    } catch (error) {
      console.error('Error fetching participants:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get tournament matches
   * @param {string} tournamentId - Tournament ID or URL
   * @returns {Promise<Array>} Array of matches
   */
  async getMatches(tournamentId) {
    try {
      let id = tournamentId;
      if (tournamentId.includes('challonge.com/')) {
        const url = new URL(tournamentId);
        id = url.pathname.split('/').pop();
      }
      
      const response = await this.client.get(`/tournaments/${id}/matches.json`);
      return response.data;
    } catch (error) {
      console.error('Error fetching matches:', error.response?.data || error.message);
      throw error;
    }
  }
}

// Create and export a singleton instance
let challongeClient = null;

/**
 * Initialize the Challonge client
 * @param {string} apiKey - Challonge API key
 * @returns {ChallongeClient} Initialized Challonge client
 */
function initChallonge(apiKey) {
  if (!challongeClient) {
    challongeClient = new ChallongeClient(apiKey);
  }
  return challongeClient;
}

module.exports = {
  initChallonge,
  getChallongeClient: () => challongeClient,
};
