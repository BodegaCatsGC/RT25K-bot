const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows information about available commands')
    .addStringOption(option =>
      option.setName('command')
        .setDescription('Get detailed information about a specific command')
        .setRequired(false)),
  
  async execute(interaction) {
    const { client } = interaction;
    const commandName = interaction.options.getString('command');
    
    // If a specific command was requested, show detailed info for that command
    if (commandName) {
      const command = client.commands.get(commandName);
      
      if (!command) {
        return interaction.reply({ 
          content: `No command with the name \`${commandName}\` was found.`, 
          ephemeral: true 
        });
      }
      
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Command: ${command.data.name}`)
        .setDescription(command.data.description)
        .setTimestamp()
        .setFooter({ text: 'RT25K Bot', iconURL: client.user?.displayAvatarURL() });
      
      // Add options if they exist
      if (command.data.options && command.data.options.length > 0) {
        const optionsField = command.data.options.map(option => 
          `**${option.name}**: ${option.description} ${option.required ? '(Required)' : '(Optional)'}`
        ).join('\n');
        
        embed.addFields({ name: 'Options', value: optionsField });
      }
      
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    // Otherwise, show all commands
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('RT25K Bot Commands')
      .setDescription('Here are all the available commands:')
      .setTimestamp()
      .setFooter({ text: 'RT25K Bot', iconURL: client.user?.displayAvatarURL() });
    
    // Group commands by category based on their file location
    const commands = client.commands;
    const categories = new Map();
    
    commands.forEach(command => {
      const category = command.category || 'General';
      
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      
      categories.get(category).push(command);
    });
    
    // Add each category as a field
    categories.forEach((commands, category) => {
      const commandList = commands.map(command => 
        `**/${command.data.name}** - ${command.data.description}`
      ).join('\n');
      
      embed.addFields({ name: category, value: commandList });
    });
    
    embed.addFields({ 
      name: 'Get Detailed Help', 
      value: 'Use `/help [command]` to get detailed information about a specific command.' 
    });
    
    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
