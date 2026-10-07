import { defineTool } from "eve/tools";
import { z } from "zod";
import { regsureRequest } from "../lib/regsure-api";
export default defineTool({
  description:
    "Find inventory items at or below a requested reorder threshold.",
  inputSchema: z.object({ threshold: z.number().int().min(0).default(5) }),
  async execute({ threshold }, ctx) {
    const data = await regsureRequest<{
      items: Array<Record<string, unknown>>;
    }>(ctx, "/api/inventory");
    return {
      items: data.items.filter(
        (item) => Number(item.quantity || 0) <= threshold,
      ),
    };
  },
});
