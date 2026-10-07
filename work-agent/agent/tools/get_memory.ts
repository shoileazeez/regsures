import { defineTool } from "eve/tools";
import { z } from "zod";
import { readMemory } from "../lib/memory";
export default defineTool({
  description:
    "Read the authenticated user memory for the selected Regsure business, such as preferred workspace, plan context, and previous operational preferences.",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    const user = ctx.session.auth.current?.principalId;
    if (!user) throw new Error("Authenticated user required.");
    return readMemory(user);
  },
});
