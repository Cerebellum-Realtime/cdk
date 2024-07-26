import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { v4 as uuidv4 } from "uuid";

const sqs = new SQSClient();

export const sendMessageToQueue = async (channelName, content) => {
  // Use the queue URL from an environment variable or configuration

  const now = new Date();

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
    console.log("Message sent:", result.MessageId);
  } catch (error) {
    console.error("Error sending message:", error);
  }
};
