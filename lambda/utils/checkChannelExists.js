import { Channel } from "../models/channels.js";

export const checkChannelExists = async (channelName) => {
  const channel = await Channel.query("channelName").eq(channelName).exec();
  if (channel.length === 0) {
    throw new Error(`No channel found matching name: ${channelName}`);
  }
};
