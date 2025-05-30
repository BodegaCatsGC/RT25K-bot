const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { initChallonge, getChallongeClient } = require('../utils/challonge');

// Initialize Challonge client when the command is loaded
if (!getChallongeClient() && process.env.CHALLONGE_API_KEY) {
  initChallonge(process.env.CHALLONGE_API_KEY);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tournament')
    .setDescription('Get Challonge tournament information')
    .addStringOption(option =>
      option.setName('id')
        .setDescription('Tournament ID or URL (e.g., mytourney123 or challonge.com/mytourney123)')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    const challonge = getChallongeClient();
    if (!challonge) {
      return interaction.editReply('❌ Challonge integration is not properly configured.');
    }

    const tournamentId = interaction.options.getString('id');
    
    // Log the tournament ID being used
    console.log(`Fetching tournament with ID/URL: ${tournamentId}`);

    try {
      // Get tournament details (which now includes participants and matches)
      const tournamentData = await challonge.getTournament(tournamentId);
      
      // Extract the tournament object from the response
      const tournament = tournamentData.data || tournamentData.tournament || tournamentData;
      
      if (!tournament) {
        throw new Error('No tournament data received from API');
      }
      
      // Extract participants and matches from the tournament data
      const participants = tournament.relationships?.participants?.data || [];
      const matches = tournament.relationships?.matches?.data || [];
      
      // Filter completed and upcoming matches
      const completedMatches = matches.filter(match => match.attributes?.state === 'complete');
      const upcomingMatches = matches.filter(match => match.attributes?.state === 'open');

      // Format the tournament URL
      const tournamentUrl = `https://challonge.com/${tournament.attributes?.url || tournament.attributes?.tournament_url || ''}`;
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(tournament.attributes?.name || 'Unknown Tournament')
        .setURL(tournamentUrl)
        .setDescription(tournament.attributes?.description || 'No description available')
        .addFields(
          { 
            name: 'Status', 
            value: tournament.attributes?.state ? 
                   tournament.attributes.state.charAt(0).toUpperCase() + tournament.attributes.state.slice(1) : 
                   'Unknown', 
            inline: true 
          },
          { 
            name: 'Participants', 
            value: participants.length.toString(), 
            inline: true 
          },
          { 
            name: 'Matches', 
            value: matches.length.toString(), 
            inline: true 
          },
          { 
            name: 'Completed', 
            value: completedMatches.length.toString(), 
            inline: true 
          },
          { 
            name: 'Upcoming', 
            value: upcomingMatches.length.toString(), 
            inline: true 
          },
        )
        .setFooter({ text: 'Challonge Tournament' })
        .setTimestamp(new Date(tournament.attributes?.started_at || Date.now()));

      // Add top participants if available
      if (participants.length > 0) {
        // Try to get participant details if they're included
        let participantDetails = [];
        if (tournament.included) {
          participantDetails = tournament.included.filter(item => item.type === 'participant');
        }
        
        const topParticipants = participantDetails
          .filter(p => p.attributes?.final_rank !== null)
          .sort((a, b) => (a.attributes.final_rank || 999) - (b.attributes.final_rank || 999))
          .slice(0, 5);

        if (topParticipants.length > 0) {
          const topPlayers = topParticipants
            .map((p, i) => {
              const rank = p.attributes.final_rank ? `#${p.attributes.final_rank}` : 'N/A';
              return `${i + 1}. ${p.attributes.display_name || p.attributes.name || 'Unknown'} (${rank})`;
            })
            .join('\n');

          embed.addFields({ 
            name: 'Top Participants', 
            value: topPlayers || 'No participants found', 
            inline: false 
          });
        }
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in tournament command:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      let errorMessage = '❌ An error occurred while fetching tournament data.';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = '❌ Tournament not found. Please check the tournament ID or URL and try again.';
        } else if (error.response.status === 401) {
          errorMessage = '❌ Authentication failed. Please check the Challonge API key in the bot configuration.';
        } else if (error.response.status === 403) {
          errorMessage = '❌ Access denied. The API key may not have permission to access this tournament.';
        } else if (error.response.status >= 500) {
          errorMessage = '❌ Challonge API is currently unavailable. Please try again later.';
        }
      } else if (error.request) {
        errorMessage = '❌ Could not connect to Challonge. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = `❌ Error: ${error.message}`;
      }
      
      await interaction.editReply({
        content: errorMessage,
        ephemeral: true
      });
    }
  },
};
