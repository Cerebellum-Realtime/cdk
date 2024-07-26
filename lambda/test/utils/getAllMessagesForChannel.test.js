import { getAllMessagesForChannel } from "../../utils/getAllMessagesForChannel.js";
import { Message } from "../../models/messages.js";

vi.mock("../../models/messages.js", () => ({
  Message: {
    query: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      exec: vi.fn(),
    }),
  },
}));

describe("getAllMessagesForChannel.js tests...", () => {
  it("should return a list of messages for the channel", async () => {
    const channelName = "test-channel";
    const mockMessages = [
      { content: "Message 1", createdAt: "2024-01-01T00:00:00Z" },
      { content: "Message 2", createdAt: "2024-01-02T00:00:00Z" },
    ];

    Message.query().eq.mockReturnValueOnce({
      exec: vi.fn().mockResolvedValueOnce(mockMessages),
    });

    const result = await getAllMessagesForChannel(channelName);

    expect(result).toEqual([
      { content: "Message 1", createdAt: "2024-01-01T00:00:00Z" },
      { content: "Message 2", createdAt: "2024-01-02T00:00:00Z" },
    ]);
  });

  it("should handle errors when message querying fails", async () => {
    const channelName = "test-channel";
    Message.query().eq.mockReturnValueOnce({
      exec: vi.fn().mockRejectedValueOnce(new Error("DynamoDB error")),
    });

    await expect(getAllMessagesForChannel(channelName)).rejects.toThrow(
      "DynamoDB error"
    );
  });
});
