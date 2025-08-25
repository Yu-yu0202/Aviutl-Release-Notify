import { EmbedBuilder } from "discord.js";
import type { CommandMeta } from "botmanager";
import type { ChatInputCommandInteraction } from "discord.js";

export class Ping implements CommandMeta {
  public name: string = "ping";
  public description: string = "Pingを表示します";
  public type: "slash" = "slash";

  public async exec(interaction: ChatInputCommandInteraction): Promise<void> {
    const embed: EmbedBuilder = new EmbedBuilder()
      .setTitle("🏓 Pong!")
      .setDescription(`Ping: ${Math.round(interaction.client.ws.ping)}`)
      .setColor("Green")
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
}
