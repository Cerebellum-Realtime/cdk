import { Message } from "../models/messages.js";

export const getAllMessagesForChannel = async (channelId) => {
  try {
    const messages = await Message.query("channelId").eq(channelId).exec();

    const contents = messages.map((message) => {
      return { time: message.createdAt, content: message.content };
    });
    return contents;
  } catch (error) {
    console.error("Error retrieving messages for channel:", error);
    throw error;
  }
};
