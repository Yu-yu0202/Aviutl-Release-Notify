import { EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { SlashCommandT } from "diskernel";

export class Ping extends SlashCommandT {
  public name: string = "ping";
  public description: string = "Pingを表示します";

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const embed: EmbedBuilder = new EmbedBuilder()
      .setTitle("🏓 Pong!")
      .setDescription(`Ping: ${Math.round(interaction.client.ws.ping)}`)
      .setColor("Green")
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
}
