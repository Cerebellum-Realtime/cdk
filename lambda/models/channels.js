import dynamoose from "dynamoose";

const ddb = new dynamoose.aws.ddb.DynamoDB();
dynamoose.aws.ddb.set(ddb);

const channelSchema = new dynamoose.Schema({
  channelName: {
    type: String,
    hashKey: true,
  },
  channelId: {
    type: String,
    required: true,
  },
});

export const Channel = dynamoose.model("channels", channelSchema);
