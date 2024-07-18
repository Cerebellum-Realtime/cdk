"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageDataArchive = void 0;
const constructs_1 = require("constructs");
const lambda = require("aws-cdk-lib/aws-lambda");
const s3 = require("aws-cdk-lib/aws-s3");
const events = require("aws-cdk-lib/aws-events");
const targets = require("aws-cdk-lib/aws-events-targets");
class MessageDataArchive extends constructs_1.Construct {
    constructor(scope, id, dynamodb) {
        super(scope, id);
        // Define the S3 bucket where "old data" can be moved to
        const dataArchiveS3 = new s3.Bucket(this, "DataArchive");
        const archiveLambda = new lambda.Function(this, "ArchiveDataFn", {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: "messageArchive.handler",
            code: lambda.Code.fromAsset("lambda"),
            environment: {
                MESSAGES_TABLE_NAME: dynamodb.messagesTable.tableName,
                BUCKET_NAME: dataArchiveS3.bucketName,
            },
        });
        // Grant permissions
        dynamodb.messagesTable.grantReadData(archiveLambda);
        dynamodb.messagesTable.grantWriteData(archiveLambda);
        dataArchiveS3.grantPut(archiveLambda);
        const rule = new events.Rule(this, "ScheduleRule", {
            schedule: events.Schedule.cron({
                minute: "0",
                hour: "0",
                weekDay: "SUN",
            }), // Runs at midnight every Sunday
        });
        rule.addTarget(new targets.LambdaFunction(archiveLambda));
    }
}
exports.MessageDataArchive = MessageDataArchive;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVzc2FnZURhdGFBcmNoaXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiTWVzc2FnZURhdGFBcmNoaXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDJDQUF1QztBQUN2QyxpREFBaUQ7QUFDakQseUNBQXlDO0FBQ3pDLGlEQUFpRDtBQUNqRCwwREFBMEQ7QUFHMUQsTUFBYSxrQkFBbUIsU0FBUSxzQkFBUztJQUMvQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLFFBQWtCO1FBQzFELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsd0RBQXdEO1FBQ3hELE1BQU0sYUFBYSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFFekQsTUFBTSxhQUFhLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDL0QsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsd0JBQXdCO1lBQ2pDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7WUFDckMsV0FBVyxFQUFFO2dCQUNYLG1CQUFtQixFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsU0FBUztnQkFDckQsV0FBVyxFQUFFLGFBQWEsQ0FBQyxVQUFVO2FBQ3RDO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsb0JBQW9CO1FBQ3BCLFFBQVEsQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3BELFFBQVEsQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3JELGFBQWEsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUM7UUFFdEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDakQsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO2dCQUM3QixNQUFNLEVBQUUsR0FBRztnQkFDWCxJQUFJLEVBQUUsR0FBRztnQkFDVCxPQUFPLEVBQUUsS0FBSzthQUNmLENBQUMsRUFBRSxnQ0FBZ0M7U0FDckMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUM1RCxDQUFDO0NBQ0Y7QUFoQ0QsZ0RBZ0NDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSBcImF3cy1jZGstbGliL2F3cy1keW5hbW9kYlwiO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWxhbWJkYVwiO1xuaW1wb3J0ICogYXMgczMgZnJvbSBcImF3cy1jZGstbGliL2F3cy1zM1wiO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZXZlbnRzXCI7XG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZXZlbnRzLXRhcmdldHNcIjtcbmltcG9ydCB7IER5bmFtb0RCIH0gZnJvbSBcIi4vRHluYW1vREJcIjtcblxuZXhwb3J0IGNsYXNzIE1lc3NhZ2VEYXRhQXJjaGl2ZSBleHRlbmRzIENvbnN0cnVjdCB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIGR5bmFtb2RiOiBEeW5hbW9EQikge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICAvLyBEZWZpbmUgdGhlIFMzIGJ1Y2tldCB3aGVyZSBcIm9sZCBkYXRhXCIgY2FuIGJlIG1vdmVkIHRvXG4gICAgY29uc3QgZGF0YUFyY2hpdmVTMyA9IG5ldyBzMy5CdWNrZXQodGhpcywgXCJEYXRhQXJjaGl2ZVwiKTtcblxuICAgIGNvbnN0IGFyY2hpdmVMYW1iZGEgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsIFwiQXJjaGl2ZURhdGFGblwiLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGhhbmRsZXI6IFwibWVzc2FnZUFyY2hpdmUuaGFuZGxlclwiLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KFwibGFtYmRhXCIpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgTUVTU0FHRVNfVEFCTEVfTkFNRTogZHluYW1vZGIubWVzc2FnZXNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIEJVQ0tFVF9OQU1FOiBkYXRhQXJjaGl2ZVMzLmJ1Y2tldE5hbWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgcGVybWlzc2lvbnNcbiAgICBkeW5hbW9kYi5tZXNzYWdlc1RhYmxlLmdyYW50UmVhZERhdGEoYXJjaGl2ZUxhbWJkYSk7XG4gICAgZHluYW1vZGIubWVzc2FnZXNUYWJsZS5ncmFudFdyaXRlRGF0YShhcmNoaXZlTGFtYmRhKTtcbiAgICBkYXRhQXJjaGl2ZVMzLmdyYW50UHV0KGFyY2hpdmVMYW1iZGEpO1xuXG4gICAgY29uc3QgcnVsZSA9IG5ldyBldmVudHMuUnVsZSh0aGlzLCBcIlNjaGVkdWxlUnVsZVwiLCB7XG4gICAgICBzY2hlZHVsZTogZXZlbnRzLlNjaGVkdWxlLmNyb24oe1xuICAgICAgICBtaW51dGU6IFwiMFwiLFxuICAgICAgICBob3VyOiBcIjBcIixcbiAgICAgICAgd2Vla0RheTogXCJTVU5cIixcbiAgICAgIH0pLCAvLyBSdW5zIGF0IG1pZG5pZ2h0IGV2ZXJ5IFN1bmRheVxuICAgIH0pO1xuXG4gICAgcnVsZS5hZGRUYXJnZXQobmV3IHRhcmdldHMuTGFtYmRhRnVuY3Rpb24oYXJjaGl2ZUxhbWJkYSkpO1xuICB9XG59XG4iXX0=