const dynamoose = require("dynamoose");

const ddb = new dynamoose.aws.ddb.DynamoDB();
dynamoose.aws.ddb.set(ddb);

const channelSchema = new dynamoose.Schema({
  channelName: {
    type: String,
    hashKey: true,
  },
  channelId: {
    type: String,
  },
});

const Channel = dynamoose.model("channels", channelSchema);

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  const newChannel = new Channel({
    channelId: `12345test${record.body}`,
    channelName: record.body,
  });

  try {
    await newChannel.save();
    return record.body;
  } catch (e) {
    console.log(error);
    return record.body;
  }

  return {};
};
