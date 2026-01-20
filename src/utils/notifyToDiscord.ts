import pLimit from "p-limit";
import { MessageFlags } from "discord.js";
import { Core, Logger } from "diskernel";
import { NotifyBuilder } from "./notifyBuilder.js";
import { Registration } from "../database/schema/registration.js";

const logger = Logger("notifyToDiscord");
const limit = pLimit(3);

export class NotifyToDiscord {
  public static async notify(notifyBuilder: NotifyBuilder): Promise<void> {
    const component = notifyBuilder.toComponentsV2();
    const client = Core.Client;
    if (!client) {
      logger.warn("❌️ Discord client isn't initalized: notify()");
      return;
    }

    const channelIds = await Registration.find().lean();

    if (channelIds.length === 0) {
      logger.warn("❌️ No destnation channel found: notify()");
    }

    const promises = channelIds.map(({ _id: channelId }) =>
      limit(async () => {
        const channel = await client.channels.fetch(channelId).catch((err) => {
          logger.error(
            `❌️ Failed to fetch channel: ${channelId} - ${err instanceof Error ? err.message : err.toString()}`,
          );
          return null;
        });

        if (!channel?.isTextBased() || channel.isDMBased()) {
          logger.warn(`❌️ Channel isn't guild text based: ${channelId}`);
          return;
        }

        await channel
          .send({
            components: [component],
            flags: [MessageFlags.IsComponentsV2],
          })
          .then(() => {
            logger.info(`✅ Message sent to channel: ${channelId}`);
          })
          .catch((err) => {
            logger.error(
              `❌️ Failed to send message to channel: ${channelId}`,
              err,
            );
          });
      }),
    );

    await Promise.all(promises);
  }
}
