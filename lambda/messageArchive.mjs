import AWS from "aws-sdk";
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

export const handler = async (event) => {
  const now = new Date();
  const oneMinuteAgo = new Date(now);
  oneMinuteAgo.setMinutes(now.getMinutes() - 1);

  const params = {
    TableName: process.env.MESSAGES_TABLE_NAME,
    FilterExpression: "createdAt <= :oneMinuteAgo",
    ExpressionAttributeValues: {
      ":oneMinuteAgo": oneMinuteAgo.toISOString(),
    },
  };

  console.log("params: ", JSON.stringify(params));

  const data = await dynamodb.scan(params).promise();

  console.log("data: ", JSON.stringify(data));

  if (data.Items.length > 0) {
    const s3params = {
      Bucket: process.env.BUCKET_NAME,
      Key: `data-${now.toISOString()}.json`,
      Body: JSON.stringify(data.Items),
    };

    await s3.putObject(s3params).promise();

    console.log("s3params: ", JSON.stringify(s3params));

    for (const item of data.Items) {
      console.log("item: ", JSON.stringify(item));
      const deleteParams = {
        TableName: process.env.MESSAGES_TABLE_NAME,
        Key: {
          channelId: item.channelId,
          createdAt_messageId: item.createdAt_messageId,
        },
      };
      await dynamodb.delete(deleteParams).promise();
    }
  }
};
