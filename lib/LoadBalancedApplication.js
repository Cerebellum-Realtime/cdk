"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadBalancedApplication = void 0;
const ec2 = require("aws-cdk-lib/aws-ec2");
const elbv2 = require("aws-cdk-lib/aws-elasticloadbalancingv2");
const cdk = require("aws-cdk-lib");
const constructs_1 = require("constructs");
const ECS_1 = require("./ECS");
class LoadBalancedApplication extends constructs_1.Construct {
    constructor(scope, id, vpc, elasticache) {
        super(scope, id);
        const vpsIp = "159.203.61.78/32"; // specify IP address of client, followed by /32
        const approvedCertificateARN = "arn:aws:acm:us-east-1:654654177904:certificate/bf0b34c0-80cb-460b-92ff-b5e19aa30b19"; // Verified Certificate ARN from Certificate Manger
        // Create a security group for the Load Balancer
        const albSecurityGroup = new ec2.SecurityGroup(this, "ALBSecurityGroup", {
            vpc,
            description: "Allow HTTP and HTTPS traffic to the Load Balancer",
            allowAllOutbound: true, // Allow outbound traffic
        });
        // // Allow inbound HTTP traffic on port 80 from the VPS IP
        // albSecurityGroup.addIngressRule(
        //   ec2.Peer.ipv4(vpsIp),
        //   ec2.Port.tcp(80),
        //   "Allow HTTP traffic from the VPS"
        // );
        // // Allow inbound HTTPS traffic on port 443 from the VPS IP
        // albSecurityGroup.addIngressRule(
        //   ec2.Peer.ipv4(vpsIp),
        //   ec2.Port.tcp(443),
        //   "Allow HTTPS traffic from the VPS"
        // );
        // Allow inbound HTTP traffic on port 80
        albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), "Allow HTTP traffic from anywhere");
        albSecurityGroup.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(80), "Allow HTTP traffic from anywhere");
        // Allow inbound HTTPS traffic on port 443
        albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), "Allow HTTPS traffic from anywhere");
        albSecurityGroup.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(443), "Allow HTTPS traffic from anywhere");
        // Create a Load Balancer
        const lb = new elbv2.ApplicationLoadBalancer(this, "WebSocketServer-ALB", {
            vpc,
            internetFacing: true,
            securityGroup: albSecurityGroup, // Associate the security group with the Load Balancer
        });
        // Add a listener and a default target group
        const httpListener = lb.addListener("HTTPListener", {
            port: 80,
        });
        const ecs = new ECS_1.ECS(this, id, vpc, albSecurityGroup, elasticache);
        const scalableTarget = ecs.service.autoScaleTaskCount({
            minCapacity: 2,
            maxCapacity: 5,
        });
        scalableTarget.scaleOnCpuUtilization("CpuScaling", {
            targetUtilizationPercent: 50,
        });
        scalableTarget.scaleOnMemoryUtilization("MemoryScaling", {
            targetUtilizationPercent: 50,
        });
        httpListener.addTargets("HTTPTargets", {
            port: 80,
            targets: [ecs.service],
            stickinessCookieDuration: cdk.Duration.minutes(1), // Enable stickiness and set cookie duration
            healthCheck: {
                path: "/", // The path where the health check endpoint is located – could implement /health path
                interval: cdk.Duration.seconds(30), // The time interval between health checks
                timeout: cdk.Duration.seconds(5), // The amount of time to wait when receiving a response from the health check
                healthyThresholdCount: 5, // The number of consecutive health check successes required before considering an unhealthy target healthy
                unhealthyThresholdCount: 2, // The number of consecutive health check failures required before considering a target unhealthy
            },
        });
        // Adding HTTPS Listener
        const httpsListener = lb.addListener("HTTPSListener", {
            port: 443,
            certificates: [
                {
                    certificateArn: approvedCertificateARN,
                },
            ],
            open: true,
            protocol: elbv2.ApplicationProtocol.HTTPS,
        });
        // Add targets to the HTTPS listener (same as HTTP)
        httpsListener.addTargets("HTTPSTargets", {
            port: 80,
            targets: [ecs.service],
            stickinessCookieDuration: cdk.Duration.minutes(1),
            healthCheck: {
                path: "/",
                interval: cdk.Duration.seconds(30),
                timeout: cdk.Duration.seconds(5),
                healthyThresholdCount: 5,
                unhealthyThresholdCount: 2,
            },
        });
    }
}
exports.LoadBalancedApplication = LoadBalancedApplication;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTG9hZEJhbGFuY2VkQXBwbGljYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJMb2FkQmFsYW5jZWRBcHBsaWNhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwyQ0FBMkM7QUFDM0MsZ0VBQWdFO0FBQ2hFLG1DQUFtQztBQUNuQywyQ0FBdUM7QUFDdkMsK0JBQTRCO0FBRzVCLE1BQWEsdUJBQXdCLFNBQVEsc0JBQVM7SUFDcEQsWUFDRSxLQUFnQixFQUNoQixFQUFVLEVBQ1YsR0FBYSxFQUNiLFdBQXdCO1FBRXhCLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsTUFBTSxLQUFLLEdBQUcsa0JBQWtCLENBQUMsQ0FBQyxnREFBZ0Q7UUFDbEYsTUFBTSxzQkFBc0IsR0FDMUIscUZBQXFGLENBQUMsQ0FBQyxtREFBbUQ7UUFFNUksZ0RBQWdEO1FBQ2hELE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUN2RSxHQUFHO1lBQ0gsV0FBVyxFQUFFLG1EQUFtRDtZQUNoRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUseUJBQXlCO1NBQ2xELENBQUMsQ0FBQztRQUVILDJEQUEyRDtRQUMzRCxtQ0FBbUM7UUFDbkMsMEJBQTBCO1FBQzFCLHNCQUFzQjtRQUN0QixzQ0FBc0M7UUFDdEMsS0FBSztRQUVMLDZEQUE2RDtRQUM3RCxtQ0FBbUM7UUFDbkMsMEJBQTBCO1FBQzFCLHVCQUF1QjtRQUN2Qix1Q0FBdUM7UUFDdkMsS0FBSztRQUVMLHdDQUF3QztRQUN4QyxnQkFBZ0IsQ0FBQyxjQUFjLENBQzdCLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQ2xCLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUNoQixrQ0FBa0MsQ0FDbkMsQ0FBQztRQUNGLGdCQUFnQixDQUFDLGNBQWMsQ0FDN0IsR0FBRyxD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Q0FBQyxDQUFDO1lBQ2pELFdBQVcsRUFBRTtnQkFDWCxJQUFJLEVBQUUsR0FBRztnQkFDVCxRQUFRLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNsQyxPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUN4Qix1QkFBdUIsRUFBRSxDQUFDO2FBQzNCO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBN0hELDBEQTZIQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGVjMiBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWVjMlwiO1xuaW1wb3J0ICogYXMgZWxidjIgZnJvbSBcImF3cy1jZGstbGliL2F3cy1lbGFzdGljbG9hZGJhbGFuY2luZ3YyXCI7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xuaW1wb3J0IHsgRUNTIH0gZnJvbSBcIi4vRUNTXCI7XG5pbXBvcnQgeyBFbGFzdGljYWNoZSB9IGZyb20gXCIuL0VsYXN0aWNhY2hlXCI7XG5cbmV4cG9ydCBjbGFzcyBMb2FkQmFsYW5jZWRBcHBsaWNhdGlvbiBleHRlbmRzIENvbnN0cnVjdCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHNjb3BlOiBDb25zdHJ1Y3QsXG4gICAgaWQ6IHN0cmluZyxcbiAgICB2cGM6IGVjMi5JVnBjLFxuICAgIGVsYXN0aWNhY2hlOiBFbGFzdGljYWNoZVxuICApIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgY29uc3QgdnBzSXAgPSBcIjE1OS4yMDMuNjEuNzgvMzJcIjsgLy8gc3BlY2lmeSBJUCBhZGRyZXNzIG9mIGNsaWVudCwgZm9sbG93ZWQgYnkgLzMyXG4gICAgY29uc3QgYXBwcm92ZWRDZXJ0aWZpY2F0ZUFSTiA9XG4gICAgICBcImFybjphd3M6YWNtOnVzLWVhc3QtMTo2NTQ2NTQxNzc5MDQ6Y2VydGlmaWNhdGUvYmYwYjM0YzAtODBjYi00NjBiLTkyZmYtYjVlMTlhYTMwYjE5XCI7IC8vIFZlcmlmaWVkIENlcnRpZmljYXRlIEFSTiBmcm9tIENlcnRpZmljYXRlIE1hbmdlclxuXG4gICAgLy8gQ3JlYXRlIGEgc2VjdXJpdHkgZ3JvdXAgZm9yIHRoZSBMb2FkIEJhbGFuY2VyXG4gICAgY29uc3QgYWxiU2VjdXJpdHlHcm91cCA9IG5ldyBlYzIuU2VjdXJpdHlHcm91cCh0aGlzLCBcIkFMQlNlY3VyaXR5R3JvdXBcIiwge1xuICAgICAgdnBjLFxuICAgICAgZGVzY3JpcHRpb246IFwiQWxsb3cgSFRUUCBhbmQgSFRUUFMgdHJhZmZpYyB0byB0aGUgTG9hZCBCYWxhbmNlclwiLFxuICAgICAgYWxsb3dBbGxPdXRib3VuZDogdHJ1ZSwgLy8gQWxsb3cgb3V0Ym91bmQgdHJhZmZpY1xuICAgIH0pO1xuXG4gICAgLy8gLy8gQWxsb3cgaW5ib3VuZCBIVFRQIHRyYWZmaWMgb24gcG9ydCA4MCBmcm9tIHRoZSBWUFMgSVBcbiAgICAvLyBhbGJTZWN1cml0eUdyb3VwLmFkZEluZ3Jlc3NSdWxlKFxuICAgIC8vICAgZWMyLlBlZXIuaXB2NCh2cHNJcCksXG4gICAgLy8gICBlYzIuUG9ydC50Y3AoODApLFxuICAgIC8vICAgXCJBbGxvdyBIVFRQIHRyYWZmaWMgZnJvbSB0aGUgVlBTXCJcbiAgICAvLyApO1xuXG4gICAgLy8gLy8gQWxsb3cgaW5ib3VuZCBIVFRQUyB0cmFmZmljIG9uIHBvcnQgNDQzIGZyb20gdGhlIFZQUyBJUFxuICAgIC8vIGFsYlNlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoXG4gICAgLy8gICBlYzIuUGVlci5pcHY0KHZwc0lwKSxcbiAgICAvLyAgIGVjMi5Qb3J0LnRjcCg0NDMpLFxuICAgIC8vICAgXCJBbGxvdyBIVFRQUyB0cmFmZmljIGZyb20gdGhlIFZQU1wiXG4gICAgLy8gKTtcblxuICAgIC8vIEFsbG93IGluYm91bmQgSFRUUCB0cmFmZmljIG9uIHBvcnQgODBcbiAgICBhbGJTZWN1cml0eUdyb3VwLmFkZEluZ3Jlc3NSdWxlKFxuICAgICAgZWMyLlBlZXIuYW55SXB2NCgpLFxuICAgICAgZWMyLlBvcnQudGNwKDgwKSxcbiAgICAgIFwiQWxsb3cgSFRUUCB0cmFmZmljIGZyb20gYW55d2hlcmVcIlxuICAgICk7XG4gICAgYWxiU2VjdXJpdHlHcm91cC5hZGRJbmdyZXNzUnVsZShcbiAgICAgIGVjMi5QZWVyLmFueUlwdjYoKSxcbiAgICAgIGVjMi5Qb3J0LnRjcCg4MCksXG4gICAgICBcIkFsbG93IEhUVFAgdHJhZmZpYyBmcm9tIGFueXdoZXJlXCJcbiAgICApO1xuXG4gICAgLy8gQWxsb3cgaW5ib3VuZCBIVFRQUyB0cmFmZmljIG9uIHBvcnQgNDQzXG4gICAgYWxiU2VjdXJpdHlHcm91cC5hZGRJbmdyZXNzUnVsZShcbiAgICAgIGVjMi5QZWVyLmFueUlwdjQoKSxcbiAgICAgIGVjMi5Qb3J0LnRjcCg0NDMpLFxuICAgICAgXCJBbGxvdyBIVFRQUyB0cmFmZmljIGZyb20gYW55d2hlcmVcIlxuICAgICk7XG5cbiAgICBhbGJTZWN1cml0eUdyb3VwLmFkZEluZ3Jlc3NSdWxlKFxuICAgICAgZWMyLlBlZXIuYW55SXB2NigpLFxuICAgICAgZWMyLlBvcnQudGNwKDQ0MyksXG4gICAgICBcIkFsbG93IEhUVFBTIHRyYWZmaWMgZnJvbSBhbnl3aGVyZVwiXG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBhIExvYWQgQmFsYW5jZXJcbiAgICBjb25zdCBsYiA9IG5ldyBlbGJ2Mi5BcHBsaWNhdGlvbkxvYWRCYWxhbmNlcih0aGlzLCBcIldlYlNvY2tldFNlcnZlci1BTEJcIiwge1xuICAgICAgdnBjLFxuICAgICAgaW50ZXJuZXRGYWNpbmc6IHRydWUsXG4gICAgICBzZWN1cml0eUdyb3VwOiBhbGJTZWN1cml0eUdyb3VwLCAvLyBBc3NvY2lhdGUgdGhlIHNlY3VyaXR5IGdyb3VwIHdpdGggdGhlIExvYWQgQmFsYW5jZXJcbiAgICB9KTtcblxuICAgIC8vIEFkZCBhIGxpc3RlbmVyIGFuZCBhIGRlZmF1bHQgdGFyZ2V0IGdyb3VwXG4gICAgY29uc3QgaHR0cExpc3RlbmVyID0gbGIuYWRkTGlzdGVuZXIoXCJIVFRQTGlzdGVuZXJcIiwge1xuICAgICAgcG9ydDogODAsXG4gICAgfSk7XG5cbiAgICBjb25zdCBlY3MgPSBuZXcgRUNTKHRoaXMsIGlkLCB2cGMsIGFsYlNlY3VyaXR5R3JvdXAsIGVsYXN0aWNhY2hlKTtcblxuICAgIGNvbnN0IHNjYWxhYmxlVGFyZ2V0ID0gZWNzLnNlcnZpY2UuYXV0b1NjYWxlVGFza0NvdW50KHtcbiAgICAgIG1pbkNhcGFjaXR5OiAyLFxuICAgICAgbWF4Q2FwYWNpdHk6IDUsXG4gICAgfSk7XG5cbiAgICBzY2FsYWJsZVRhcmdldC5zY2FsZU9uQ3B1VXRpbGl6YXRpb24oXCJDcHVTY2FsaW5nXCIsIHtcbiAgICAgIHRhcmdldFV0aWxpemF0aW9uUGVyY2VudDogNTAsXG4gICAgfSk7XG5cbiAgICBzY2FsYWJsZVRhcmdldC5zY2FsZU9uTWVtb3J5VXRpbGl6YXRpb24oXCJNZW1vcnlTY2FsaW5nXCIsIHtcbiAgICAgIHRhcmdldFV0aWxpemF0aW9uUGVyY2VudDogNTAsXG4gICAgfSk7XG5cbiAgICBodHRwTGlzdGVuZXIuYWRkVGFyZ2V0cyhcIkhUVFBUYXJnZXRzXCIsIHtcbiAgICAgIHBvcnQ6IDgwLFxuICAgICAgdGFyZ2V0czogW2Vjcy5zZXJ2aWNlXSxcbiAgICAgIHN0aWNraW5lc3NDb29raWVEdXJhdGlvbjogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMSksIC8vIEVuYWJsZSBzdGlja2luZXNzIGFuZCBzZXQgY29va2llIGR1cmF0aW9uXG4gICAgICBoZWFsdGhDaGVjazoge1xuICAgICAgICBwYXRoOiBcIi9cIiwgLy8gVGhlIHBhdGggd2hlcmUgdGhlIGhlYWx0aCBjaGVjayBlbmRwb2ludCBpcyBsb2NhdGVkIOKAkyBjb3VsZCBpbXBsZW1lbnQgL2hlYWx0aCBwYXRoXG4gICAgICAgIGludGVydmFsOiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksIC8vIFRoZSB0aW1lIGludGVydmFsIGJldHdlZW4gaGVhbHRoIGNoZWNrc1xuICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcyg1KSwgLy8gVGhlIGFtb3VudCBvZiB0aW1lIHRvIHdhaXQgd2hlbiByZWNlaXZpbmcgYSByZXNwb25zZSBmcm9tIHRoZSBoZWFsdGggY2hlY2tcbiAgICAgICAgaGVhbHRoeVRocmVzaG9sZENvdW50OiA1LCAvLyBUaGUgbnVtYmVyIG9mIGNvbnNlY3V0aXZlIGhlYWx0aCBjaGVjayBzdWNjZXNzZXMgcmVxdWlyZWQgYmVmb3JlIGNvbnNpZGVyaW5nIGFuIHVuaGVhbHRoeSB0YXJnZXQgaGVhbHRoeVxuICAgICAgICB1bmhlYWx0aHlUaHJlc2hvbGRDb3VudDogMiwgLy8gVGhlIG51bWJlciBvZiBjb25zZWN1dGl2ZSBoZWFsdGggY2hlY2sgZmFpbHVyZXMgcmVxdWlyZWQgYmVmb3JlIGNvbnNpZGVyaW5nIGEgdGFyZ2V0IHVuaGVhbHRoeVxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIEFkZGluZyBIVFRQUyBMaXN0ZW5lclxuICAgIGNvbnN0IGh0dHBzTGlzdGVuZXIgPSBsYi5hZGRMaXN0ZW5lcihcIkhUVFBTTGlzdGVuZXJcIiwge1xuICAgICAgcG9ydDogNDQzLFxuICAgICAgY2VydGlmaWNhdGVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBjZXJ0aWZpY2F0ZUFybjogYXBwcm92ZWRDZXJ0aWZpY2F0ZUFSTixcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBvcGVuOiB0cnVlLFxuICAgICAgcHJvdG9jb2w6IGVsYnYyLkFwcGxpY2F0aW9uUHJvdG9jb2wuSFRUUFMsXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgdGFyZ2V0cyB0byB0aGUgSFRUUFMgbGlzdGVuZXIgKHNhbWUgYXMgSFRUUClcbiAgICBodHRwc0xpc3RlbmVyLmFkZFRhcmdldHMoXCJIVFRQU1RhcmdldHNcIiwge1xuICAgICAgcG9ydDogODAsXG4gICAgICB0YXJnZXRzOiBbZWNzLnNlcnZpY2VdLFxuICAgICAgc3RpY2tpbmVzc0Nvb2tpZUR1cmF0aW9uOiBjZGsuRHVyYXRpb24ubWludXRlcygxKSxcbiAgICAgIGhlYWx0aENoZWNrOiB7XG4gICAgICAgIHBhdGg6IFwiL1wiLFxuICAgICAgICBpbnRlcnZhbDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcyg1KSxcbiAgICAgICAgaGVhbHRoeVRocmVzaG9sZENvdW50OiA1LFxuICAgICAgICB1bmhlYWx0aHlUaHJlc2hvbGRDb3VudDogMixcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==