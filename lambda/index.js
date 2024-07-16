const dynamoose = require("dynamoose");

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
  createdAt: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
});

// const channelSchema = new dynamoose.Schema({
//   channelName: {
//     type: String,
//     hashKey: true,
//   },
//   channelId: {
//     type: String,
//   },
// });

const Message = dynamoose.model("messages", messageSchema);
// const Channel = dynamoose.model("channels", channelSchema);

exports.handler = async (event) => {
  console.log("Received event:", event);

  const { channelId, createdAt, createdAt_messageId, content } = JSON.parse(
    event.Records[0].body
  );

  const newMessage = new Message({
    channelId,
    createdAt,
    createdAt_messageId,
    content,
  });

  try {
    await newMessage.save();
    return { statusCode: 200, body: "Message processing completed" };
  } catch (e) {
    console.log("Error in newMessage.save()");
    console.log(e);
    return { statusCode: 500, body: "Error processing message" };
  }

  // try {
  //   await newChannel.save();
  // } catch (e) {
  //   console.log("Error in newChannel.save()");
  //   console.log(error);
  // }
};
