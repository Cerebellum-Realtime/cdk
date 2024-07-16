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
      "WebSocketServer-MessagesTable",
      {
        tableName: "messagesAvery",
        partitionKey: {
          name: "channelId",
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: "createdAt_messageId",
          type: dynamodb.AttributeType.STRING,
        },
        billing: dynamodb.Billing.onDemand(),
        removalPolicy: RemovalPolicy.DESTROY, // Optional: specify removal policy
      }
    );

    const channelsTable = new dynamodb.TableV2(
      this,
      "WebSocketServer-ChannelsTable",
      {
        tableName: "channelsAvery",
        partitionKey: {
          name: "channelName",
          type: dynamodb.AttributeType.STRING,
        },
        billing: dynamodb.Billing.onDemand(),
        removalPolicy: RemovalPolicy.DESTROY, // Optional: specify removal policy
      }
    );

    const ecsTaskRole = new iam.Role(this, "EcsTaskRole", {
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

    const dynamoGatewayEndpoint = vpc.addGatewayEndpoint(
      "dynamoGatewayEndpoint",
      {
        service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      }
    );

    messagesTable.grantReadWriteData(ecsTaskRole);
    channelsTable.grantReadWriteData(ecsTaskRole);

    this.messagesTable = messagesTable;
    this.channelsTable = channelsTable;
    this.ecsTaskRole = ecsTaskRole;
  }
}
