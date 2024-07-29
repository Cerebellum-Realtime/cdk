import { checkChannelExists } from "../../utils/checkChannelExists.js"; // Adjust the path as necessary
import { Channel } from "../../models/channels.js";

vi.mock("../../models/channels.js", () => {
  return {
    Channel: {
      query: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        exec: vi.fn(),
      }),
    },
  };
});

describe("checkChannelExists.js tests...", () => {
  it("should not throw an error when channel exists", async () => {
    const channelName = "test-channel";
    Channel.query().eq.mockReturnValueOnce({
      exec: vi.fn().mockResolvedValueOnce([{ channelName }]),
    });

    await expect(checkChannelExists(channelName)).resolves.not.toThrow();
  });

  it("should throw an error when channel does not exist", async () => {
    const channelName = "test-channel";
    Channel.query().eq.mockReturnValueOnce({
      exec: vi.fn().mockResolvedValueOnce([]),
    });

    await expect(checkChannelExists(channelName)).rejects.toThrow(
      `No channel found matching name: ${channelName}`
    );
  });
});
