import { defineTool } from "eve/tools";
import { z } from "zod";
import { readMemory, writeMemory } from "../lib/memory";
export default defineTool({
  description:
    "Save a non-sensitive user preference or selected Regsure workspace in persistent memory. Never save passwords, access tokens, payment secrets, or sensitive personal data.",
  inputSchema: z.object({
    key: z.string().min(1),
    value: z.string().min(1),
    confirm: z.literal(true),
  }),
  async execute({ key, value }, ctx) {
    const user = ctx.session.auth.current?.principalId;
    if (!user) throw new Error("Authenticated user required.");
    const memory = await readMemory(user);
    memory[key] = value;
    return writeMemory(user, memory);
  },
});
