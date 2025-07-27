import 'dotenv/config';
import { UpdateHandler } from './handler/UpdateHandler.js';
import { Client, GatewayIntentBits } from 'discord.js';
await import('dotenv/config');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});
const channelId = process.env.DISCORD_CHANNEL_ID;
if (!channelId) {
    console.error('✖DISCORD_CHANNEL_ID is not set in .env');
    process.exit(1);
}
const handler = new UpdateHandler(client, channelId);
client.once('ready', async () => {
    console.log(`✅Logged in as ${client.user?.tag}`);
    await handler.start();
});
process.on("SIGINT", () => {
    console.log("✅SIGINT received. Exiting...");
    handler.stop();
    process.exit(0);
});
client.login(process.env.DISCORD_BOT_TOKEN).catch((err) => {
    console.error('✖Failed to login to Discord:', err);
    process.exit(1);
});
