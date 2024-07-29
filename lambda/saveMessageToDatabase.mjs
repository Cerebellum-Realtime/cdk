import { Message } from "./models/messages.js";
import dynamoose from "dynamoose";

const ddb = new dynamoose.aws.ddb.DynamoDB();
dynamoose.aws.ddb.set(ddb);

export const handler = async (event) => {
  const { channelName, messageId, content, createdAt } = JSON.parse(
    event.Records[0].body
  );

  if (!channelName || !messageId || !content || !createdAt) {
    return {
      statusCode: 400,
      body: "Invalid arguments. Make sure to include all fields (channelName, messageId, content, createdAt)",
    };
  }

  const newMessage = new Message({
    channelName,
    messageId,
    content,
    createdAt,
  });

  try {
    await newMessage.save();
    return { statusCode: 200, body: "Message processing completed" };
  } catch (e) {
    return { statusCode: 500, body: `Error processing message: ${e}` };
  }
};
