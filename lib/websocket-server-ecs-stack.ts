import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Elasticache } from "./Elasticache";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { LoadBalancedApplication } from "./LoadBalancedApplication";

export class WebSocketServerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "WebSocketServer-Vpc", {
      maxAzs: 2,
      natGateways: 1,
    });

    const elasticache = new Elasticache(this, "elasticache", vpc);

    new LoadBalancedApplication(this, "ALB", vpc, elasticache);
  }
}
