import { Message } from "../models/messages.js";

export const getAllMessagesForChannel = async (channelName) => {
  try {
    const messages = await Message.query("channelName").eq(channelName).exec();

    const contents = messages.map((message) => {
      return { content: message.content, createdAt: message.createdAt };
    });
    return contents;
  } catch (error) {
    throw error;
  }
};
