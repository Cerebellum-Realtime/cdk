import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class WebsocketServerEcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //creates the virtual private network
    const vpc = new ec2.Vpc(this, "MyVpc", { maxAzs: 2 });
    //create the cluster where we will deploy our container, called MyCluster
    //uses the vpc that we defined above
    const cluster = new ecs.Cluster(this, "MyCluster", { vpc });
    //creates a taskDefinition
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "websocket-task-file",
      {
        cpu: 1024,
        memoryLimitMiB: 2048,
      }
    );

    //We are adding the container to the taskDefinition, and information
    taskDefinition.addContainer("MyContainer", {
      image: ecs.ContainerImage.fromRegistry(
        "public.ecr.aws/q8e0a8z0/websocket-server:latest"
      ), //works because it is public.
      memoryLimitMiB: 2048,
      cpu: 1024,
      portMappings: [{ containerPort: 8000 }],
    });

    const service = new ecs.FargateService(this, "WebsocketFargateService", {
      cluster,
      taskDefinition,
      desiredCount: 1,
      assignPublicIp: true, //Give this badboy a public ip address
    });
    //This allows us to access the container directly from the internet
    const securityGroup = service.connections.securityGroups[0];
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8000),
      "Allow access to port 8000 from any IP"
    );
  }
}
