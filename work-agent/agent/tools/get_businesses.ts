import { defineTool } from "eve/tools";
import { z } from "zod";
import { regsureRequest } from "../lib/regsure-api";

export default defineTool({
  description:
    "List the authenticated user's Regsure businesses and identify the currently selected workspace. Use this before workspace-specific work or when the user asks which business is active.",
  inputSchema: z.object({}),
  async execute(_, ctx) {
    const data = await regsureRequest<{
      businesses: Array<Record<string, unknown>>;
      selectedBusinessId?: string;
    }>(ctx, "/api/businesses");
    return {
      businesses: data.businesses.filter(
        (business) => String(business.plan).toLowerCase() === "pro",
      ),
      selectedBusinessId: data.selectedBusinessId,
      note: "Only Pro businesses are available for Eve workspace switching.",
    };
  },
});
