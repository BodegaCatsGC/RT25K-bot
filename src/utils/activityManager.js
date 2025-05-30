const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { EmbedAppSDK } = require('@discord/embedded-app-sdk');

/**
 * Handles Discord Activity functionality for the RT25K bot
 */
class ActivityManager {
  /**
   * Create a new ActivityManager instance
   * @param {string} activityId - The Discord Activity ID
   */
  constructor(activityId) {
    this.activityId = activityId;
    this.sdk = new EmbedAppSDK();
  }

  /**
   * Creates a button for launching the activity
   * @param {string} label - The button label
   * @returns {ActionRowBuilder} - The button row
   */
  createActivityButton(label = 'View Full Standings') {
    return new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`activity_${this.activityId}`)
          .setLabel(label)
          .setStyle(ButtonStyle.Primary)
      );
  }

  /**
   * Handles button interactions for launching activities
   * @param {ButtonInteraction} interaction - The button interaction
   * @returns {Promise<void>}
   */
  async handleActivityButtonInteraction(interaction) {
    if (!interaction.isButton()) return;
    
    const customId = interaction.customId;
    
    // Check if this is an activity button
    if (!customId.startsWith('activity_')) return;
    
    try {
      // Extract the activity ID from the custom ID
      const activityId = customId.replace('activity_', '');
      
      // Create the activity
      const activity = await this.sdk.createActivity({
        applicationId: activityId,
      });
      
      // Get the activity URL
      const activityUrl = activity.getJoinURL();
      
      // Reply with the activity URL
      await interaction.reply({
        content: `Click here to view the RT25K standings: ${activityUrl}`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error creating activity:', error);
      await interaction.reply({
        content: 'There was an error creating the activity. Please try again later.',
        ephemeral: true
      });
    }
  }
}

module.exports = ActivityManager;
