import { defineTool } from "eve/tools";
import { z } from "zod";
import { regsureRequest } from "../lib/regsure-api";

export default defineTool({
  description:
    "List branches and the currently selected branch for the active Regsure business. Respect assigned-branch restrictions returned by the API.",
  inputSchema: z.object({}),
  async execute(_, ctx) {
    return regsureRequest(ctx, "/api/branches");
  },
});
