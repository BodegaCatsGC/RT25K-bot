const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getSchedule, getAvailableSheets } = require('../utils/googleSheets');

// List of allowed team sheets - same as in simulate.js
const ALLOWED_TEAMS = [
  'Achieve Greatness',
  'Bodega Cats',
  'On Site',
  'High Octane',
  'Zero Tolerance',
  'Zero Gaming',
  'Before The Fame',
  'Coatesville',
  'Lights Out',
  'Liquid Pro Am',
  'Hitlist',
  'Nobody Plays Harder'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Displays game recaps by team')
    .addStringOption(option =>
      option.setName('team')
        .setDescription('Team name to show schedule for (leave blank to list all teams)')
        .setRequired(false)
        .setAutocomplete(true)),

  async autocomplete(interaction) {
    try {
      const focusedValue = interaction.options.getFocused().toLowerCase();
      console.log(`[Schedule] Autocomplete triggered for team: ${focusedValue}`);
      
      // Filter and sort the teams based on the focused value
      const filtered = ALLOWED_TEAMS
        .filter(team => team.toLowerCase().includes(focusedValue))
        .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
        .slice(0, 25); // Discord limit for autocomplete options
      
      console.log(`[Schedule] Sending ${filtered.length} autocomplete options`);
      
      await interaction.respond(
        filtered.map(team => ({
          name: team,
          value: team
        }))
      );
    } catch (error) {
      console.error('[Schedule] Error in autocomplete:', error);
      // Send an empty array to prevent unhandled interaction errors
      if (!interaction.responded) {
        await interaction.respond([]).catch(console.error);
      }
    }
  },

  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const teamFilter = interaction.options.getString('team')?.trim();
      
      if (!teamFilter) {
        // If no team specified, show the list of allowed teams
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('Available Teams')
          .setDescription('Please specify a team to see their schedule')
          .addFields(
            { 
              name: 'Teams', 
              value: ALLOWED_TEAMS.sort().join('\n') 
            }
          );
        
        return interaction.editReply({ embeds: [embed] });
      }
      
      // Get schedule for specific team
      const schedule = await getSchedule({ sheetName: teamFilter });
      
      if (!schedule || schedule.length === 0) {
        return interaction.editReply({
          content: `No schedule found for team "${teamFilter}". Please check the team name and try again.`
        });
      }

      // Create embed for the team's schedule
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Game Recaps: ${teamFilter}`);

      const matchesText = schedule.map((match) => {
        const isHome = match.homeTeam.toLowerCase() === teamFilter.toLowerCase();
        const opponent = isHome ? match.awayTeam : match.homeTeam;
        
        // Determine result emoji
        let result = '➡️'; // Default to right arrow for upcoming matches
        if (match.seriesWinner) {
          result = match.seriesWinner.toLowerCase() === teamFilter.toLowerCase() ? '✅' : '❌';
        } else if (match.seriesScore === '1-1') {
          result = '❓'; // Question mark for tied series
        }
        
        // Format game scores if available
        const gameScores = match.games
          .filter(game => game.homeScore > 0 || game.awayScore > 0)
          .map((game, index) => {
            const homeScore = isHome ? game.homeScore : game.awayScore;
            const awayScore = isHome ? game.awayScore : game.homeScore;
            return `G${index + 1}: ${homeScore}-${awayScore}`;
          });
        
        const homeAway = isHome ? 'vs' : 'at';
        let matchText = `${result} ${homeAway} **${opponent}** [${match.seriesScore || '0-0'}]`;
        
        // Add individual game scores if available
        if (gameScores.length > 0) {
          matchText += '\n   ' + gameScores.join(' | ');
        } else {
          matchText += '\n   No games played';
        }
        
        return matchText;
      }).join('\n\n');

      embed.setDescription(matchesText || 'No games found.');
      
      // Count all games played across all series
      let totalGamesPlayed = 0;
      schedule.forEach(match => {
        totalGamesPlayed += match.games.filter(g => g.homeScore > 0 || g.awayScore > 0).length;
      });
      
      // Add win/loss record if there are completed games
      const completedGames = schedule.filter(match => match.seriesWinner || match.seriesScore === '1-1');
      if (completedGames.length > 0) {
        let wins = 0;
        let losses = 0;
        let ties = 0;
        
        completedGames.forEach(match => {
          // Count wins/losses/ties
          if (match.seriesScore === '1-1') {
            ties++;
          } else if (match.seriesWinner?.toLowerCase() === teamFilter.toLowerCase()) {
            wins++;
          } else {
            losses++;
          }
        });
        
        const recordText = ties > 0 
          ? `**${wins}-${losses}-${ties}**`
          : `**${wins}-${losses}**`;
          
        const winRate = (wins + (ties * 0.5)) / (wins + losses + ties) * 100;
        
        // Add games played/remaining
        const remainingGames = Math.max(0, 15 - totalGamesPlayed);
        const gamesPlayedText = `**${totalGamesPlayed}** games played (${remainingGames} of 15 remaining)`;
        
        embed.addFields(
          {
            name: 'Overall Series Record',
            value: `${recordText} (${winRate.toFixed(1)}% win rate)`,
            inline: true
          },
          {
            name: 'Games Played',
            value: gamesPlayedText,
            inline: true
          }
        );
      } else {
        // Still show games played even if no completed series
        const remainingGames = Math.max(0, 15 - totalGamesPlayed);
        const gamesPlayedText = `**${totalGamesPlayed}** games played (${remainingGames} of 15 remaining)`;
        
        embed.addFields({
          name: 'Games Played',
          value: gamesPlayedText,
          inline: false
        });
      }

      // Add upcoming opponents and remaining games
      const incompleteSeries = schedule.filter(match => 
        !match.seriesWinner || match.seriesScore === '1-1'
      );
      
      if (incompleteSeries.length > 0) {
        const remainingGames = incompleteSeries.reduce((total, match) => {
          if (match.seriesScore === '1-1') {
            return total + 1; // 1 game left in a 1-1 series
          } else if (match.seriesScore === '0-0') {
            return total + 3; // No games played yet
          }
          return total + (3 - Math.max(
            match.games.filter(g => g.homeScore > 0 || g.awayScore > 0).length,
            3 - match.games.filter(g => g.homeScore === 0 && g.awayScore === 0).length
          ));
        }, 0);
        
        const opponents = [...new Set(incompleteSeries.map(match => {
          const isHome = match.homeTeam.toLowerCase() === teamFilter.toLowerCase();
          return isHome ? match.awayTeam : match.homeTeam;
        }))];
        
        const remainingText = [
          `**${remainingGames}** game${remainingGames !== 1 ? 's' : ''} remaining`,
          `(${incompleteSeries.length} ${incompleteSeries.length === 1 ? 'series' : 'series'})`
        ].join(' ');
        
        embed.addFields({
          name: 'Incomplete Series',
          value: `${opponents.join(', ')}\n${remainingText}`,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in schedule command:', error);
      await interaction.editReply({
        content: `Error: ${error.message || 'Failed to fetch schedule'}. Please try again later.`,
        ephemeral: true
      });
    }
  },
};
