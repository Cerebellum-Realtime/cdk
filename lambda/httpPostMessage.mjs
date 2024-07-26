import { sendMessageToQueue } from "./utils/sendMessageToQueue.js";
import { checkChannelExists } from "./utils/checkChannelExists.js";
import { initializeRedis } from "./utils/initializeRedis.js";

const validateInput = (body) => {
  const { channelName, content } = JSON.parse(body);
  if (!channelName || !content) {
    throw new Error("Invalid input: channelName and content are required");
  }
  return { channelName, content };
};

export const handler = async (event) => {
  const { io } = await initializeRedis();

  try {
    const { channelName, content } = validateInput(event.body);

    await checkChannelExists(channelName);

    const temporaryDate = new Date();

    io.to(channelName).emit(`message:receive:${channelName}`, {
      channelName,
      content,
      createdAt: temporaryDate.toISOString(),
    });

    await sendMessageToQueue(channelName, content);

    return { statusCode: 200, body: "Message processing completed" };
  } catch (error) {
    console.log(error);
    if (
      error.message &&
      error.message === "Invalid input: channelName and content are required"
    ) {
      return { statusCode: 400, body: error.message };
    }

    return { statusCode: 500, body: "Error Sending Message to redis" };
  }
};
