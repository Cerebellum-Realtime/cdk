"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Elasticache = void 0;
const constructs_1 = require("constructs");
const ec2 = require("aws-cdk-lib/aws-ec2");
const elasticache = require("aws-cdk-lib/aws-elasticache");
class Elasticache extends constructs_1.Construct {
    constructor(scope, id, vpc) {
        super(scope, id);
        const redisSecurityGroup = new ec2.SecurityGroup(this, "RedisSecurityGroup", {
            vpc,
            securityGroupName: "redis-sec-group",
            allowAllOutbound: true,
        });
        redisSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(6379));
        const subnetRedisGroup = new elasticache.CfnSubnetGroup(this, "ElasticacheSubnetGroup", {
            description: "Subnet group for Redis Elasticache",
            subnetIds: vpc.publicSubnets.map((subnet) => subnet.subnetId),
        });
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
exports.Elasticache = Elasticache;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRWxhc3RpY2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJFbGFzdGljYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwyQ0FBdUM7QUFDdkMsMkNBQTJDO0FBQzNDLDJEQUEyRDtBQUUzRCxNQUFhLFdBQVksU0FBUSxzQkFBUztJQUl4QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEdBQWE7UUFDckQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixNQUFNLGtCQUFrQixHQUFHLElBQUksR0FBRyxDQUFDLGFBQWEsQ0FDOUMsSUFBSSxFQUNKLG9CQUFvQixFQUNwQjtZQUNFLEdBQUc7WUFDSCxpQkFBaUIsRUFBRSxpQkFBaUI7WUFDcEMsZ0JBQWdCLEVBQUUsSUFBSTtTQUN2QixDQUNGLENBQUM7UUFFRixrQkFBa0IsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBRTFFLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxXQUFXLENBQUMsY0FBYyxDQUNyRCxJQUFJLEVBQ0osd0JBQXdCLEVBQ3hCO1lBQ0UsV0FBVyxFQUFFLG9DQUFvQztZQUNqRCxTQUFTLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7U0FDOUQsQ0FDRixDQUFDO1FBRUYsTUFBTSxLQUFLLEdBQUcsSUFBSSxXQUFXLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUU7WUFDM0QsYUFBYSxFQUFFLGdCQUFnQjtZQUMvQixNQUFNLEVBQUUsT0FBTztZQUNmLGFBQWEsRUFBRSxDQUFDO1lBQ2hCLG1CQUFtQixFQUFFLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDO1lBQ3pELG9CQUFvQixFQUFFLGdCQUFnQixDQUFDLEdBQUc7U0FDM0MsQ0FBQyxDQUFDO1FBRUgsS0FBSyxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBRXRDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxLQUFLLENBQUMsd0JBQXdCLENBQUM7UUFDM0QsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQztJQUN2RCxDQUFDO0NBQ0Y7QUF6Q0Qsa0NBeUNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcbmltcG9ydCAqIGFzIGVjMiBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWVjMlwiO1xuaW1wb3J0ICogYXMgZWxhc3RpY2FjaGUgZnJvbSBcImF3cy1jZGstbGliL2F3cy1lbGFzdGljYWNoZVwiO1xuXG5leHBvcnQgY2xhc3MgRWxhc3RpY2FjaGUgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICByZWRpc0VuZHBvaW50QWRkcmVzczogc3RyaW5nO1xuICByZWRpc0VuZHBvaW50UG9ydDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHZwYzogZWMyLklWcGMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgY29uc3QgcmVkaXNTZWN1cml0eUdyb3VwID0gbmV3IGVjMi5TZWN1cml0eUdyb3VwKFxuICAgICAgdGhpcyxcbiAgICAgIFwiUmVkaXNTZWN1cml0eUdyb3VwXCIsXG4gICAgICB7XG4gICAgICAgIHZwYyxcbiAgICAgICAgc2VjdXJpdHlHcm91cE5hbWU6IFwicmVkaXMtc2VjLWdyb3VwXCIsXG4gICAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWUsXG4gICAgICB9XG4gICAgKTtcblxuICAgIHJlZGlzU2VjdXJpdHlHcm91cC5hZGRJbmdyZXNzUnVsZShlYzIuUGVlci5hbnlJcHY0KCksIGVjMi5Qb3J0LnRjcCg2Mzc5KSk7XG5cbiAgICBjb25zdCBzdWJuZXRSZWRpc0dyb3VwID0gbmV3IGVsYXN0aWNhY2hlLkNmblN1Ym5ldEdyb3VwKFxuICAgICAgdGhpcyxcbiAgICAgIFwiRWxhc3RpY2FjaGVTdWJuZXRHcm91cFwiLFxuICAgICAge1xuICAgICAgICBkZXNjcmlwdGlvbjogXCJTdWJuZXQgZ3JvdXAgZm9yIFJlZGlzIEVsYXN0aWNhY2hlXCIsXG4gICAgICAgIHN1Ym5ldElkczogdnBjLnB1YmxpY1N1Ym5ldHMubWFwKChzdWJuZXQpID0+IHN1Ym5ldC5zdWJuZXRJZCksXG4gICAgICB9XG4gICAgKTtcblxuICAgIGNvbnN0IHJlZGlzID0gbmV3IGVsYXN0aWNhY2hlLkNmbkNhY2hlQ2x1c3Rlcih0aGlzLCBcIlJlZGlzXCIsIHtcbiAgICAgIGNhY2hlTm9kZVR5cGU6IFwiY2FjaGUudDMubWljcm9cIixcbiAgICAgIGVuZ2luZTogXCJyZWRpc1wiLFxuICAgICAgbnVtQ2FjaGVOb2RlczogMSxcbiAgICAgIHZwY1NlY3VyaXR5R3JvdXBJZHM6IFtyZWRpc1NlY3VyaXR5R3JvdXAuc2VjdXJpdHlHcm91cElkXSxcbiAgICAgIGNhY2hlU3VibmV0R3JvdXBOYW1lOiBzdWJuZXRSZWRpc0dyb3VwLnJlZixcbiAgICB9KTtcblxuICAgIHJlZGlzLmFkZERlcGVuZGVuY3koc3VibmV0UmVkaXNHcm91cCk7XG5cbiAgICB0aGlzLnJlZGlzRW5kcG9pbnRBZGRyZXNzID0gcmVkaXMuYXR0clJlZGlzRW5kcG9pbnRBZGRyZXNzO1xuICAgIHRoaXMucmVkaXNFbmRwb2ludFBvcnQgPSByZWRpcy5hdHRyUmVkaXNFbmRwb2ludFBvcnQ7XG4gIH1cbn1cbiJdfQ==