// commands/Information/standings.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('standings')
        .setDescription('Get current RT25K standings')
        .addStringOption(option =>
            option.setName('worksheet')
                .setDescription('Worksheet name')
                .setRequired(false)),
    
    async execute(interaction) {
        await interaction.deferReply();
        
        const worksheet = interaction.options.getString('worksheet') || 'Sheet1';
        const sheetKey = process.env.GOOGLE_SHEET_KEY; // Make sure to set this in your .env
        
        try {
            const response = await axios.get(`http://localhost:8000/simulate`, {
                params: { sheet_key: sheetKey, worksheet }
            });
            
            const standings = response.data;
            
            const embed = new EmbedBuilder()
                .setTitle('RT25K Standings')
                .setColor('#0099ff')
                .setTimestamp();
                
            // Format the standings into the embed
            // This is a simplified example - adjust based on your actual data structure
            for (const [group, teams] of Object.entries(standings)) {
                const groupStandings = teams
                    .map((team, index) => `${index + 1}. ${team.name} - ${team.points} pts`)
                    .join('\n');
                    
                embed.addFields({ 
                    name: `Group ${group}`, 
                    value: groupStandings,
                    inline: true 
                });
            }
            
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error fetching standings:', error);
            await interaction.editReply('❌ Failed to fetch standings. Please try again later.');
        }
    }
};