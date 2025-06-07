// src/commands/simulate.ts
import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { RT25KSimulator } from '../simulation';

// Assuming you have a way to get the googleSheets client
// This would be passed in from your command handler
interface CommandDependencies {
    googleSheets: any; // Replace with your Google Sheets client type
    sheetId: string;
    teamsSheetName: string;
    matchesSheetName: string;
}

export const data = new SlashCommandBuilder()
    .setName('simulate')
    .setDescription('Simulate the remaining matches and show projected standings');

export const execute = async (interaction: ChatInputCommandInteraction, deps: CommandDependencies) => {
    await interaction.deferReply();

    try {
        const { googleSheets, sheetId, teamsSheetName, matchesSheetName } = deps;
        const simulator = new RT25KSimulator(googleSheets);

        // Load data
        await simulator.loadTeamData(sheetId, teamsSheetName);
        await simulator.loadMatches(sheetId, matchesSheetName);

        // Run simulation
        const results = simulator.simulateRemainingMatches();

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle('🏆 Projected Standings')
            .setColor('#0099ff')
            .setDescription('Simulation results based on current standings and team power levels')
            .setTimestamp();

        // Add a field for each group
        for (const [group, teams] of Object.entries(results)) {
            const groupStandings = teams
                .map((team, index) => 
                    `**${index + 1}.** ${team.team} - ${team.points} pts ` +
                    `(${team.wins}W-${team.losses}L, ${team.roundWins}-${team.roundLosses} RD)`
                )
                .join('\n');

            embed.addFields({
                name: `Group ${group}`,
                value: groupStandings,
                inline: false
            });
        }

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Error in simulate command:', error);
        await interaction.editReply('❌ An error occurred while running the simulation.');
    }
};
