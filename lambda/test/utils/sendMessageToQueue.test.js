import { describe, it, expect, vi } from "vitest";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { sendMessageToQueue } from "../../utils/sendMessageToQueue.js";

vi.mock("@aws-sdk/client-sqs", () => ({
  SQSClient: vi.fn(() => ({
    send: vi.fn(),
  })),
  SendMessageCommand: vi.fn(),
}));

describe("sendMessageToQueue Tests", () => {
  let mockSend = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    SQSClient.prototype.send = mockSend;
  });

  it("should send a message to the SQS queue", async () => {
    const channelName = "test-channel";
    const content = "test-content";

    mockSend.mockResolvedValue({ MessageId: "mock-message-id" });

    const result = await sendMessageToQueue(channelName, content);

    expect(result.statusCode).toBe(201);
  });

  it("should handle errors when sending a message", async () => {
    const content = "test-content";

    await expect(sendMessageToQueue(undefined, content)).rejects.toThrow(
      "Invalid input: channelName and content are required"
    );
  });
});
