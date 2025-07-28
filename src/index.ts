import 'dotenv/config';
import { UpdateHandler } from './handler/UpdateHandler.js';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { Commands } from './commands/index.js';
await import('dotenv/config');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages
    ]
})
const channelId = process.env.DISCORD_CHANNEL_ID;
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);

if (!channelId) {
    console.error('✖DISCORD_CHANNEL_ID is not set in .env');
    process.exit(1);
}

const handler = new UpdateHandler(client, channelId);
const commandManager = new Commands(handler);

if (!process.env.DISCORD_BOT_TOKEN) {
    console.error('✖DISCORD_BOT_TOKEN is not set in .env');
    process.exit(1);
}
if (!process.env.DISCORD_CLIENT_ID) {
    console.error('✖DISCORD_CLIENT_ID is not set in .env');
    process.exit(1);
}

try {
    await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        {
            body: commandManager.meta,
        },
    );
    console.log('✅Register application commands successfully!');
} catch (err) {
    console.error('✖Failed register application commands:', err);
    process.exit(1);
}

client.once('ready', async () => {
    console.log(`✅Logged in as ${client.user?.tag}`);
    await handler.start();
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    await commandManager.handleCommand(interaction);
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