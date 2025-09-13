import { ChatInputCommandInteraction, SlashCommandBuilder, ApplicationCommandDataResolvable } from "discord.js";
import { WatchUpdateHandler } from "../handler/WatchUpdate.handler";

import { ping } from "./ping.js";
import { update } from "./update.js";
import { clear } from "./clear.js";
import { getlatestinfo } from "./getlatestinfo.js";

export interface metadata {
    name: string;
    description: string;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export class Commands {
    public commands: metadata[] = [
        new ping,
        new update,
        new clear,
        new getlatestinfo
    ]

    public meta: ApplicationCommandDataResolvable[] = this.commands.map(cmd => {
        return new SlashCommandBuilder()
            .setName(cmd.name)
            .setDescription(cmd.description)
            .toJSON();
    });

    private handler: WatchUpdateHandler;

    constructor(handler: WatchUpdateHandler) {
        this.handler = handler;
    }

    public async handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!interaction.isChatInputCommand()) return;
        const command: metadata | undefined = this.commands.find(cmd => cmd.name === interaction.commandName);
        switch (command?.name) {
            case 'ping': {
                command.execute(interaction);
                break;
            }
            case 'update': {
                (interaction as any).handler = this.handler;
                command.execute(interaction);
                break;
            }
            case 'clear': {
                command.execute(interaction);
                break;
            }
            case 'getlatestinfo': {
                command.execute(interaction);
                break;
            }
        }
    }
}