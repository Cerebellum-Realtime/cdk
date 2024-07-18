"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDB = void 0;
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const constructs_1 = require("constructs");
const ec2 = require("aws-cdk-lib/aws-ec2");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const iam = require("aws-cdk-lib/aws-iam");
class DynamoDB extends constructs_1.Construct {
    constructor(scope, id, vpc) {
        super(scope, id);
        const messagesTable = new dynamodb.TableV2(this, "WebSocketServer-MessagesTable", {
            tableName: "messages",
            partitionKey: {
                name: "channelId",
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: "createdAt_messageId",
                type: dynamodb.AttributeType.STRING,
            },
            billing: dynamodb.Billing.onDemand(),
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY, // Optional: specify removal policy
        });
        const channelsTable = new dynamodb.TableV2(this, "WebSocketServer-ChannelsTable", {
            tableName: "channels",
            partitionKey: {
                name: "channelName",
                type: dynamodb.AttributeType.STRING,
            },
            billing: dynamodb.Billing.onDemand(),
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY, // Optional: specify removal policy
        });
        const ecsTaskRole = new iam.Role(this, "EcsTaskRole", {
            assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            inlinePolicies: {
                dynamoDBPolicy: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            actions: ["dynamodb:*"],
                            resources: [messagesTable.tableArn, channelsTable.tableArn],
                        }),
                    ],
                }),
            },
        });
        const dynamoGatewayEndpoint = vpc.addGatewayEndpoint("dynamoGatewayEndpoint", {
            service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        });
        messagesTable.grantReadWriteData(ecsTaskRole);
        channelsTable.grantReadWriteData(ecsTaskRole);
        this.messagesTable = messagesTable;
        this.channelsTable = channelsTable;
        this.ecsTaskRole = ecsTaskRole;
    }
}
exports.DynamoDB = DynamoDB;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRHluYW1vREIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJEeW5hbW9EQi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxREFBcUQ7QUFDckQsMkNBQXVDO0FBQ3ZDLDJDQUEyQztBQUMzQyw2Q0FBNEM7QUFFNUMsMkNBQTJDO0FBRTNDLE1BQWEsUUFBUyxTQUFRLHNCQUFTO0lBS3JDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsR0FBYTtRQUNyRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLE1BQU0sYUFBYSxHQUFHLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FDeEMsSUFBSSxFQUNKLCtCQUErQixFQUMvQjtZQUNFLFNBQVMsRUFBRSxVQUFVO1lBQ3JCLFlBQVksRUFBRTtnQkFDWixJQUFJLEVBQUUsV0FBVztnQkFDakIsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTTthQUNwQztZQUNELE9BQU8sRUFBRTtnQkFDUCxJQUFJLEVBQUUscUJBQXFCO2dCQUMzQixJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNO2FBQ3BDO1lBQ0QsT0FBTyxFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFO1lBQ3BDLGFBQWEsRUFBRSwyQkFBYSxDQUFDLE9BQU8sRUFBRSxtQ0FBbUM7U0FDMUUsQ0FDRixDQUFDO1FBRUYsTUFBTSxhQUFhLEdBQUcsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUN4QyxJQUFJLEVBQ0osK0JBQStCLEVBQy9CO1lBQ0UsU0FBUyxFQUFFLFVBQVU7WUFDckIsWUFBWSxFQUFFO2dCQUNaLElBQUksRUFBRSxhQUFhO2dCQUNuQixJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNO2FBQ3BDO1lBQ0QsT0FBTyxFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFO1lBQ3BDLGFBQWEsRUFBRSwyQkFBYSxDQUFDLE9BQU8sRUFBRSxtQ0FBbUM7U0FDMUUsQ0FDRixDQUFDO1FBRUYsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDcEQsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLHlCQUF5QixDQUFDO1lBQzlELGNBQWMsRUFBRTtnQkFDZCxjQUFjLEVBQUUsSUFBSSxHQUFHLENBQUMsY0FBYyxDQUFDO29CQUNyQyxVQUFVLEVBQUU7d0JBQ1YsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDOzRCQUN0QixPQUFPLEVBQUUsQ0FBQyxZQUFZLENBQUM7NEJBQ3ZCLFNBQVMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLFFBQVEsQ0FBQzt5QkFDNUQsQ0FBQztxQkFDSDtpQkFDRixDQUFDO2FBQ0g7U0FDRixDQUFDLENBQUM7UUFFSCxNQUFNLHFCQUFxQixHQUFHLEdBQUcsQ0FBQyxrQkFBa0IsQ0FDbEQsdUJBQXVCLEVBQ3ZCO1lBQ0UsT0FBTyxFQUFFLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxRQUFRO1NBQ25ELENBQ0YsQ0FBQztRQUVGLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM5QyxhQUFhLENBQUMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFOUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7UUFDbkMsSUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7UUFDbkMsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7SUFDakMsQ0FBQztDQUNGO0FBcEVELDRCQW9FQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGJcIjtcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gXCJjb25zdHJ1Y3RzXCI7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSBcImF3cy1jZGstbGliL2F3cy1lYzJcIjtcbmltcG9ydCB7IFJlbW92YWxQb2xpY3kgfSBmcm9tIFwiYXdzLWNkay1saWJcIjtcbmltcG9ydCAqIGFzIGNkayBmcm9tIFwiYXdzLWNkay1saWJcIjtcbmltcG9ydCAqIGFzIGlhbSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWlhbVwiO1xuXG5leHBvcnQgY2xhc3MgRHluYW1vREIgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBtZXNzYWdlc1RhYmxlOiBkeW5hbW9kYi5UYWJsZVYyO1xuICBjaGFubmVsc1RhYmxlOiBkeW5hbW9kYi5UYWJsZVYyO1xuICBlY3NUYXNrUm9sZTogY2RrLmF3c19pYW0uUm9sZTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCB2cGM6IGVjMi5JVnBjKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIGNvbnN0IG1lc3NhZ2VzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGVWMihcbiAgICAgIHRoaXMsXG4gICAgICBcIldlYlNvY2tldFNlcnZlci1NZXNzYWdlc1RhYmxlXCIsXG4gICAgICB7XG4gICAgICAgIHRhYmxlTmFtZTogXCJtZXNzYWdlc1wiLFxuICAgICAgICBwYXJ0aXRpb25LZXk6IHtcbiAgICAgICAgICBuYW1lOiBcImNoYW5uZWxJZFwiLFxuICAgICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgICB9LFxuICAgICAgICBzb3J0S2V5OiB7XG4gICAgICAgICAgbmFtZTogXCJjcmVhdGVkQXRfbWVzc2FnZUlkXCIsXG4gICAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICAgIH0sXG4gICAgICAgIGJpbGxpbmc6IGR5bmFtb2RiLkJpbGxpbmcub25EZW1hbmQoKSxcbiAgICAgICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLCAvLyBPcHRpb25hbDogc3BlY2lmeSByZW1vdmFsIHBvbGljeVxuICAgICAgfVxuICAgICk7XG5cbiAgICBjb25zdCBjaGFubmVsc1RhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlVjIoXG4gICAgICB0aGlzLFxuICAgICAgXCJXZWJTb2NrZXRTZXJ2ZXItQ2hhbm5lbHNUYWJsZVwiLFxuICAgICAge1xuICAgICAgICB0YWJsZU5hbWU6IFwiY2hhbm5lbHNcIixcbiAgICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgICAgbmFtZTogXCJjaGFubmVsTmFtZVwiLFxuICAgICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgICB9LFxuICAgICAgICBiaWxsaW5nOiBkeW5hbW9kYi5CaWxsaW5nLm9uRGVtYW5kKCksXG4gICAgICAgIHJlbW92YWxQb2xpY3k6IFJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gT3B0aW9uYWw6IHNwZWNpZnkgcmVtb3ZhbCBwb2xpY3lcbiAgICAgIH1cbiAgICApO1xuXG4gICAgY29uc3QgZWNzVGFza1JvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgXCJFY3NUYXNrUm9sZVwiLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbChcImVjcy10YXNrcy5hbWF6b25hd3MuY29tXCIpLFxuICAgICAgaW5saW5lUG9saWNpZXM6IHtcbiAgICAgICAgZHluYW1vREJQb2xpY3k6IG5ldyBpYW0uUG9saWN5RG9jdW1lbnQoe1xuICAgICAgICAgIHN0YXRlbWVudHM6IFtcbiAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgYWN0aW9uczogW1wiZHluYW1vZGI6KlwiXSxcbiAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbbWVzc2FnZXNUYWJsZS50YWJsZUFybiwgY2hhbm5lbHNUYWJsZS50YWJsZUFybl0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBkeW5hbW9HYXRld2F5RW5kcG9pbnQgPSB2cGMuYWRkR2F0ZXdheUVuZHBvaW50KFxuICAgICAgXCJkeW5hbW9HYXRld2F5RW5kcG9pbnRcIixcbiAgICAgIHtcbiAgICAgICAgc2VydmljZTogZWMyLkdhdGV3YXlWcGNFbmRwb2ludEF3c1NlcnZpY2UuRFlOQU1PREIsXG4gICAgICB9XG4gICAgKTtcblxuICAgIG1lc3NhZ2VzVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGVjc1Rhc2tSb2xlKTtcbiAgICBjaGFubmVsc1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShlY3NUYXNrUm9sZSk7XG5cbiAgICB0aGlzLm1lc3NhZ2VzVGFibGUgPSBtZXNzYWdlc1RhYmxlO1xuICAgIHRoaXMuY2hhbm5lbHNUYWJsZSA9IGNoYW5uZWxzVGFibGU7XG4gICAgdGhpcy5lY3NUYXNrUm9sZSA9IGVjc1Rhc2tSb2xlO1xuICB9XG59XG4iXX0=