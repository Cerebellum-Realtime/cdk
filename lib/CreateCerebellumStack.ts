import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Elasticache } from "./Elasticache";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { LoadBalancer } from "./LoadBalancer";

export class CerebellumStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "CerebellumVpc", {
      maxAzs: 2,
      natGateways: 1,
    });

    const elasticache = new Elasticache(this, "CerebellumElasticache", vpc);

    new LoadBalancer(this, "CerebellumALB", vpc, elasticache);
  }
}
