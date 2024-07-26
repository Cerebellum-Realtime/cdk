// import * as dynamoose from "dynamoose";
import { Message } from "./models/messages.js";
import dynamoose from "dynamoose";

const ddb = new dynamoose.aws.ddb.DynamoDB();
dynamoose.aws.ddb.set(ddb);

export const handler = async (event) => {
  console.log("Received event:", event);

  const { channelName, messageId, content, createdAt } = JSON.parse(
    event.Records[0].body
  );

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
    console.log("Error in newMessage.save()");
    console.log(e);
    return { statusCode: 500, body: "Error processing message" };
  }
};
