export type Role = "owner" | "admin" | "manager" | "staff";
const permissions: Record<Role, string[]> = {
  owner: ["*"],
  admin: [
    "team:manage",
    "branches:manage",
    "sales:write",
    "customers:write",
    "inventory:write",
    "analytics:read",
  ],
  manager: [
    "sales:write",
    "customers:write",
    "inventory:write",
    "analytics:read",
  ],
  staff: ["sales:write", "customers:write", "inventory:read"],
};
export function can(role: string | undefined, permission: string) {
  const allowed = permissions[role as Role] || [];
  return allowed.includes("*") || allowed.includes(permission);
}
