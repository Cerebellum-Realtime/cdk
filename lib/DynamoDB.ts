import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { RemovalPolicy } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";

export class DynamoDB extends Construct {
  messagesTable: dynamodb.TableV2;
  channelsTable: dynamodb.TableV2;
  ecsTaskRole: cdk.aws_iam.Role;

  constructor(scope: Construct, id: string, vpc: ec2.IVpc) {
    super(scope, id);

    const messagesTable = new dynamodb.TableV2(
      this,
      "Cerebellum-MessagesTable",
      {
        tableName: "messages",
        partitionKey: {
          name: "channelName",
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: "messageId",
          type: dynamodb.AttributeType.STRING,
        },
        billing: dynamodb.Billing.onDemand(),
        removalPolicy: RemovalPolicy.DESTROY,
        localSecondaryIndexes: [
          {
            indexName: "createdAtIndex",
            sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
          },
        ],
      }
    );

    const channelsTable = new dynamodb.TableV2(
      this,
      "Cerebellum-ChannelsTable",
      {
        tableName: "channels",
        partitionKey: {
          name: "channelName",
          type: dynamodb.AttributeType.STRING,
        },
        billing: dynamodb.Billing.onDemand(),
        removalPolicy: RemovalPolicy.DESTROY,
      }
    );

    const ecsTaskRole = new iam.Role(this, "CerebellumEcsTaskRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      inlinePolicies: {
        dynamoDBPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ["dynamodb:*"],
              resources: [messagesTable.tableArn, channelsTable.tableArn],
            }),
          ],
        }),
      },
    });

    vpc.addGatewayEndpoint("CerebellumDynamoGatewayEndpoint", {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    messagesTable.grantReadWriteData(ecsTaskRole);
    channelsTable.grantReadWriteData(ecsTaskRole);

    this.messagesTable = messagesTable;
    this.channelsTable = channelsTable;
    this.ecsTaskRole = ecsTaskRole;
  }
}
