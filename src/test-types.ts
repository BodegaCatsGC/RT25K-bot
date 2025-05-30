// Test file to check Discord.js types
import { 
  Client, 
  GatewayIntentBits, 
  Collection, 
  Events, 
  ActivityType,
  EmbedBuilder,
  ChatInputCommandInteraction,
  CommandInteraction,
  SlashCommandBuilder
} from 'discord.js';

// Just a test function to see what types are available
function testTypes() {
  console.log("Testing Discord.js types");
  console.log("ActivityType:", ActivityType);
  
  // Test client creation
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ]
  });
  
  // Test embed creation
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('Test Embed')
    .setDescription('This is a test embed');
    
  console.log("Types loaded successfully");
}

export default testTypes;
