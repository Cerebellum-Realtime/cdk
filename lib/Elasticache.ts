import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elasticache from "aws-cdk-lib/aws-elasticache";

export class Elasticache extends Construct {
  redisEndpointAddress: string;
  redisEndpointPort: string;

  constructor(scope: Construct, id: string, vpc: ec2.IVpc) {
    super(scope, id);

    const redisSecurityGroup = new ec2.SecurityGroup(
      this,
      "RedisSecurityGroup",
      {
        vpc,
        securityGroupName: "redis-sec-group",
        allowAllOutbound: true,
      }
    );

    redisSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(6379));

    const subnetRedisGroup = new elasticache.CfnSubnetGroup(
      this,
      "ElasticacheSubnetGroup",
      {
        description: "Subnet group for Redis Elasticache",
        subnetIds: vpc.publicSubnets.map((subnet) => subnet.subnetId),
      }
    );

    const redis = new elasticache.CfnCacheCluster(this, "Redis", {
      cacheNodeType: "cache.t3.micro",
      engine: "redis",
      numCacheNodes: 1,
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
      cacheSubnetGroupName: subnetRedisGroup.ref,
    });

    redis.addDependency(subnetRedisGroup);

    this.redisEndpointAddress = redis.attrRedisEndpointAddress;
    this.redisEndpointPort = redis.attrRedisEndpointPort;
  }
}
