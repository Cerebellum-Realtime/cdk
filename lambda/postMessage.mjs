import { sendMessageToQueue } from "./utils/sendMessageToQueue.js";
import { getChannel } from "./utils/getChannelId.js";
import { initializeRedis } from "./utils/initializeRedis.js";

const validateInput = (body) => {
  const { channelName, content } = JSON.parse(body);
  if (!channelName || !content) {
    throw new Error("Invalid input: channelName and content are required");
  }
  return { channelName, content };
};

const { io } = await initializeRedis();

export const handler = async (event) => {
  try {
    const { channelName, content } = validateInput(event.body);

    const channelId = await getChannel(channelName);

    io.to(channelName).emit(`message:receive:${channelName}`, {
      channelName,
      message: content,
      sendDescription: "from lambda",
    });

    await sendMessageToQueue(channelId, content);

    return { statusCode: 200, body: "Message processing completed" };
  } catch (error) {
    console.log(error);
    return { statusCode: 500, body: "Error Sending Message to redis" };
  }
};
