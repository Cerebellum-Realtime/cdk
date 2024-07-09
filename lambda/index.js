const dynamoose = require("dynamoose");
const uuid = require("uuid");
// import dynamoose from "dynamoose";
// import { v4 as uuidv4 } from "uuid";

const ddb = new dynamoose.aws.ddb.DynamoDB();
dynamoose.aws.ddb.set(ddb);

const messageSchema = new dynamoose.Schema({
  channelId: {
    type: String,
    hashKey: true,
    required: true,
  },
  createdAt_messageId: {
    type: String,
    rangeKey: true,
  },
  content: {
    type: String,
    required: true,
  },
});

const channelSchema = new dynamoose.Schema({
  channelName: {
    type: String,
    hashKey: true,
  },
  channelId: {
    type: String,
  },
});

const Message = dynamoose.model("messages", messageSchema);
const Channel = dynamoose.model("channels", channelSchema);

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  const newChannel = new Channel({
    channelId: `12345test${event.Records[0].body}`,
    channelName: event.Records[0].body,
  });

  const newMessage = new Message({
    channelId: newChannel.channelId,
    content: "From Lambda: Hello",
  });

  // if data is channel, save to channel db
  // if data is msg, save to msg db

  try {
    await newMessage.save();
  } catch (e) {
    console.log("Error in newMessage.save()");
    console.log(e);
  }

  try {
    await newChannel.save();
  } catch (e) {
    console.log("Error in newChannel.save()");
    console.log(error);
  }

  return {};
};
