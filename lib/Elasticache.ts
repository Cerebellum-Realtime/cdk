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

    // const redis = new elasticache.CfnReplicationGroup(
    //   this,
    //   "RedisReplicationGroup",
    //   {
    //     replicationGroupDescription: "Redis replication group",
    //     engine: "redis",
    //     cacheNodeType: "cache.t3.micro",
    //     numNodeGroups: 1,
    //     replicasPerNodeGroup: 1, // 1 primary + 1 replica
    //     automaticFailoverEnabled: true,
    //     securityGroupIds: [redisSecurityGroup.securityGroupId],
    //     cacheSubnetGroupName: subnetRedisGroup.ref,
    //   }
    // );

    // LEGACY
    const redis = new elasticache.CfnCacheCluster(this, "Redis", {
      cacheNodeType: "cache.t3.micro",
      engine: "redis",
      numCacheNodes: 1,
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
      cacheSubnetGroupName: subnetRedisGroup.ref,
    });

    redis.addDependency(subnetRedisGroup);

    // // Note: For replication groups, endpoint is not available as an attribute directly
    // // Instead, you can use the configuration endpoint of the replication group
    // this.redisEndpointAddress = redis.attrConfigurationEndPointAddress;
    // this.redisEndpointPort = redis.attrConfigurationEndPointPort;

    // LEGACY
    this.redisEndpointAddress = redis.attrRedisEndpointAddress;
    this.redisEndpointPort = redis.attrRedisEndpointPort;
  }
}
