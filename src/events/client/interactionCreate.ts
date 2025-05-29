import { Interaction, Client, Events, ButtonInteraction } from 'discord.js';
import { createLogger, format, transports } from 'winston';
import { createStandingsActivity, getActivityUrl } from '../../utils/activityManager';

// Setup logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [new transports.Console()],
});

export default {
  name: Events.InteractionCreate,
  async execute(client: Client, interaction: Interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        logger.warn(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
        logger.info(`Executed command ${interaction.commandName} for user ${interaction.user.tag}`);
      } catch (error) {
        logger.error(`Error executing command ${interaction.commandName}:`, error);
        
        const errorMessage = { content: 'There was an error while executing this command!', ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }
    
    // Handle button interactions
    if (interaction.isButton()) {
      await handleButtonInteraction(interaction);
    }
  },
};

// Handle button interactions
async function handleButtonInteraction(interaction: ButtonInteraction) {
  const { customId } = interaction;
  
  switch (customId) {
    case 'open_activity':
      try {
        await interaction.deferReply({ ephemeral: true });
        
        // Make sure we're in a guild and channel
        if (!interaction.guildId || !interaction.channelId) {
          await interaction.editReply('This button can only be used in a server channel.');
          return;
        }
        
        // Create an Activity instance for the RT25K standings
        const activityId = await createStandingsActivity(
          interaction.guildId,
          interaction.channelId,
          interaction.user.id
        );
        
        // Get the URL for the activity
        const activityUrl = getActivityUrl(activityId);
        
        await interaction.editReply({
          content: `RT25K Standings Activity is ready! [Click here to open](${activityUrl})`,
        });
        
        logger.info(`User ${interaction.user.tag} opened the RT25K Standings Activity`);
      } catch (error) {
        logger.error('Error opening Activity:', error);
        await interaction.editReply({
          content: 'There was an error opening the RT25K Standings Activity. Please try again later.',
        });
      }
      break;
      
    default:
      logger.warn(`Unknown button interaction: ${customId}`);
      await interaction.reply({
        content: 'This button is not currently configured.',
        ephemeral: true
      });
      break;
  }
}
