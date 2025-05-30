const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getSchedule, getAvailableSheets } = require('../utils/googleSheets');

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
      const sheets = await getAvailableSheets();
      
      // Filter out common sheet names and match against focused value
      const teamSheets = sheets
        .filter(sheet => {
          const title = sheet.title.toLowerCase();
          return !['standings', 'schedule', 'overall', 'template'].includes(title) && 
                 title.includes(focusedValue);
        })
        .slice(0, 25); // Discord limit for autocomplete options
      
      await interaction.respond(
        teamSheets.map(sheet => ({
          name: sheet.title,
          value: sheet.title
        }))
      );
    } catch (error) {
      console.error('Error in autocomplete:', error);
    }
  },

  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const teamFilter = interaction.options.getString('team')?.trim();
      
      if (!teamFilter) {
        // If no team specified, list all available teams
        const sheets = await getAvailableSheets();
        const teamSheets = sheets
          .filter(sheet => !['Standings', 'Schedule', 'Overall', 'Template'].includes(sheet.title))
          .map(sheet => sheet.title);
        
        if (teamSheets.length === 0) {
          return interaction.editReply('No team sheets found in the spreadsheet.');
        }
        
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('Available Teams')
          .setDescription('Use `/schedule team:TeamName` to view a team\'s schedule\n\n' +
            teamSheets.map(team => `• ${team}`).join('\n'))
          .setFooter({ text: `Total teams: ${teamSheets.length}` });
        
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
      
      // Add win/loss record if there are completed games
      const completedGames = schedule.filter(match => match.seriesWinner || match.seriesScore === '1-1');
      if (completedGames.length > 0) {
        let wins = 0;
        let losses = 0;
        let ties = 0;
        
        completedGames.forEach(match => {
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
        
        embed.addFields({
          name: 'Overall Series Record',
          value: `${recordText} (${winRate.toFixed(1)}% win rate)`,
          inline: true
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
