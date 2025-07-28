import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { metadata } from "./";

export class ping implements metadata {
    public name = "ping";
    public description = "Pingを表示";

    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const embed = new EmbedBuilder()
            .setTitle("🏓 Pong!")
            .setDescription(`現在のPing: ${Math.round(interaction.client.ws.ping)}ms`)
            .setColor("Green");
        await interaction.reply({ embeds: [embed] });
    }
}