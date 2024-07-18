import { Channel } from "../models/channels";

export const getChannel = async (channelName) => {
  const channel = await Channel.query("channelName").eq(channelName).exec();
  if (channel.length === 0) {
    throw new Error(`No channel found matching name: ${channelName}`);
  }
  return channel[0].channelId;
};
