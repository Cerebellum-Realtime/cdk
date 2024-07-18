import dynamoose from "dynamoose";

const ddb = new dynamoose.aws.ddb.DynamoDB();
dynamoose.aws.ddb.set(ddb);

const Message = dynamoose.model("messages", messageSchema);

export const handler = async (event) => {
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

};
