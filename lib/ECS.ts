import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elasticache from "aws-cdk-lib/aws-elasticache";

export class Elasticache extends Construct {
  // redisEndpointAddress: string;
  // redisEndpointPort: string;

  constructor(scope: Construct, id: string, vpc: ec2.IVpc) {
    super(scope, id);

    // Create a security group for the container
    const ecsSecurityGroup = new ec2.SecurityGroup(
      this,
      "ContainerFromALBSecurityGroup",
      {
        vpc,
        description: "Allow HTTP traffic from ALB to Containers",
        allowAllOutbound: true, // Allow outbound traffic
      }
    );

    // Allow inbound HTTP traffic from ALB on any port
    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcpRange(0, 65535), // Allow TCP traffic for ports 0-65535
      "Allow traffic from ALB to containers"
    );
  }
}
