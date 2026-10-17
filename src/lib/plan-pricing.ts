export const PLAN_PRICES = {
  free: 0,
  basic: 7000,
  pro: 15000,
} as const;

export function formatPlanPrice(plan: keyof typeof PLAN_PRICES) {
  return `₦${PLAN_PRICES[plan].toLocaleString("en-NG")}`;
}
