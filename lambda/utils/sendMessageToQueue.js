import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { v4 as uuidv4 } from "uuid";

const sqs = new SQSClient();

export const sendMessageToQueue = async (channelName, content) => {
  // Use the queue URL from an environment variable or configuration

  const now = new Date();

  if (!channelName || !content) {
    throw new Error("Invalid input: channelName and content are required");
  }

  // we create messageId and createdAt time
  const params = {
    QueueUrl: process.env.QUEUE_URL,
    MessageBody: JSON.stringify({
      channelName,
      messageId: uuidv4(),
      content,
      createdAt: `${now.toISOString()}`,
    }),
  };

  try {
    const result = await sqs.send(new SendMessageCommand(params));
    return { statusCode: 201 };
  } catch (error) {
    throw new Error(error);
  }
};
