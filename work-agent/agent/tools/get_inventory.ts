import { defineTool } from "eve/tools";
import { z } from "zod";
import { regsureRequest } from "../lib/regsure-api";
export default defineTool({
  description:
    "Read inventory for the selected Regsure business or branch. Never invent stock values.",
  inputSchema: z.object({ search: z.string().optional() }),
  async execute({ search }, ctx) {
    const data = await regsureRequest<{
      items: Array<Record<string, unknown>>;
    }>(ctx, "/api/inventory");
    const items = search
      ? data.items.filter(
          (item) =>
            String(item.name || "")
              .toLowerCase()
              .includes(search.toLowerCase()) ||
            String(item.sku || "")
              .toLowerCase()
              .includes(search.toLowerCase()),
        )
      : data.items;
    return { items };
  },
});
