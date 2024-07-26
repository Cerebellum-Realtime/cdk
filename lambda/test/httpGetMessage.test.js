import { handler } from "../httpGetMessage.mjs";
import { getAllMessagesForChannel } from "../utils/getAllMessagesForChannel.js";
import { checkChannelExists } from "../utils/checkChannelExists.js";
import dynamoose from "dynamoose";

vi.mock("../utils/getAllMessagesForChannel.js", () => ({
  getAllMessagesForChannel: vi.fn(),
}));

vi.mock("../utils/checkChannelExists.js", () => ({
  checkChannelExists: vi.fn(),
}));

describe("httpGetMessage.mjs tests...", () => {
  it("should return a 200 response when message is sent with correct arguments", async () => {
    const event = {
      queryStringParameters: {
        channelName: "test-channel",
      },
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
  });

  it("should return a 400 response when message is sent with incorrect arguments", async () => {
    const event = {
      queryStringParameters: {},
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
  });
});
