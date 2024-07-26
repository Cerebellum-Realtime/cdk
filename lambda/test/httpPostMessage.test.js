import { describe, it, expect, vi } from "vitest";
import { handler } from "../httpPostMessage.mjs";
import { sendMessageToQueue } from "../utils/sendMessageToQueue.js";
import { checkChannelExists } from "../utils/checkChannelExists.js";
import { initializeRedis } from "../utils/initializeRedis.js";

vi.mock("../utils/sendMessageToQueue.js");
vi.mock("../utils/checkChannelExists.js");
vi.mock("../utils/initializeRedis.js");

describe("httpPostMessage.mjs tests...", () => {
  it("should return a 200 response when message is sent with correct arguments", async () => {
    initializeRedis.mockResolvedValueOnce({
      io: {
        to: vi.fn().mockReturnThis(),
        emit: vi.fn(),
      },
    });

    const event = {
      body: JSON.stringify({
        channelName: "test-channel",
        content: "This is a test message",
      }),
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe("Message processing completed");
  });

  it("should return a 400 response when message is sent with incomplete arguments", async () => {
    initializeRedis.mockResolvedValueOnce({
      io: {
        to: vi.fn().mockReturnThis(),
        emit: vi.fn(),
      },
    });

    const event = {
      body: JSON.stringify({
        content: "This is a test message",
      }),
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(result.body).toBe(
      "Invalid input: channelName and content are required"
    );
  });
});
