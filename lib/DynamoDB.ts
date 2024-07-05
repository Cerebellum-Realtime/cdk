import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { RemovalPolicy } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";

export class DynamoDB extends Construct {
  dynamoTable: dynamodb.TableV2;
  ecsTaskRole: cdk.aws_iam.Role;

  constructor(scope: Construct, id: string, vpc: ec2.IVpc) {
    super(scope, id);

    const dynamoTable = new dynamodb.TableV2(this, "WebSocketServer-Table", {
      tableName: "Messages",
      partitionKey: { name: "channelId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      removalPolicy: RemovalPolicy.DESTROY, // Optional: specify removal policy
    });

    const ecsTaskRole = new iam.Role(this, "EcsTaskRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      inlinePolicies: {
        dynamoDBPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ["dynamodb:*"],
              resources: [dynamoTable.tableArn],
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

    dynamoTable.grantReadWriteData(ecsTaskRole);

    this.dynamoTable = dynamoTable;
    this.ecsTaskRole = ecsTaskRole;
  }
}
