import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class WebsocketServerEcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "MyVpc", { maxAzs: 2 });

    const cluster = new ecs.Cluster(this, "MyCluster", { vpc });
    
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "websocket-task-file",
      {
        cpu: 1024,
        memoryLimitMiB: 2048,
      }
    );

    taskDefinition.addContainer("MyContainer", {
      image: ecs.ContainerImage.fromRegistry(
        "public.ecr.aws/q8e0a8z0/websocket-server:latest"
      ),
      memoryLimitMiB: 2048,
      cpu: 1024,
      portMappings: [{ containerPort: 8000 }],
    });

    const service = new ecs.FargateService(this, "WebsocketFargateService", {
      cluster,
      taskDefinition,
      desiredCount: 1,
      assignPublicIp: true,
    });

    const securityGroup = service.connections.securityGroups[0];
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8000),
      "Allow access to port 8000 from any IP"
    );
  }
}
