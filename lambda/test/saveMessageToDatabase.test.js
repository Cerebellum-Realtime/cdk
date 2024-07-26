import { handler } from "../saveMessageToDatabase.mjs";
import { Message } from "../models/messages.js";

vi.mock("../models/messages.js");

describe("saveMessageToDatabase.mjs tests...", () => {
  it("should return a 200 response when message is sent with correct arguments", async () => {
    const event = {
      Records: [
        {
          body: JSON.stringify({
            channelName: "test-channel",
            messageId: "1",
            content: "This is a test message",
            createdAt: new Date().toISOString(),
          }),
        },
      ],
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe("Message processing completed");
  });

  it("should return a 400 response when message is sent with incomplete arguments", async () => {
    const event = {
      Records: [
        {
          body: JSON.stringify({
            channelName: "test-channel",
            createdAt: new Date().toISOString(),
          }),
        },
      ],
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(result.body).toBe(
      "Invalid arguments. Make sure to include all fields (channelName, messageId, content, createdAt)"
    );
  });
});
