import { defineTool } from "eve/tools";
import { z } from "zod";
import { regsureRequest } from "../lib/regsure-api";
export default defineTool({
  description:
    "Read monthly sales analytics for the selected Regsure business. Explain when analytics requires a paid plan.",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    return regsureRequest(ctx, "/api/analytics");
  },
});
