import { ChatInputCommandInteraction, SlashCommandBuilder, ApplicationCommandDataResolvable } from "discord.js";
import { ping } from "./ping.js";
import { UpdateHandler } from "../handler/UpdateHandler.js";
import { test } from "./test.js";
import { clear } from "./clear.js";

export interface metadata {
    name: string;
    description: string;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export class Commands {
    public commands: metadata[] = [
        new ping,
        new test,
        new clear
    ]

    public meta: ApplicationCommandDataResolvable[] = this.commands.map(cmd => {
        return new SlashCommandBuilder()
            .setName(cmd.name)
            .setDescription(cmd.description)
            .toJSON();
    });

    private handler: UpdateHandler;

    constructor(handler: UpdateHandler) {
        this.handler = handler;
    }

    public async handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!interaction.isChatInputCommand()) return;
        const command = this.commands.find(cmd => cmd.name === interaction.commandName);
        switch (command?.name) {
            case 'ping': {
                command.execute(interaction);
                break;
            }
            case 'test': {
                (interaction as any).handler = this.handler;
                command.execute(interaction);
                break;
            }
            case 'clear': {
                command.execute(interaction);
                break;
            }
        }
    }
}