---
name: regsure-operations
description: Use Regsure tools to manage and report on the selected business workspace.
---

# Regsure operations

Use the Regsure tools for the authenticated user's selected business and branch. The API is the source of truth for workspace membership, branch assignment, role permissions, and plan access. Never guess or combine data across tenants or branches. Read data before summarizing it and label branch versus business-wide results. Treat unpaid and partial sales as outstanding balances, not completed paid revenue. Before any write, explain the exact change and require explicit confirmation. Never expose or persist passwords, tokens, API keys, payment secrets, or raw authorization headers.

For workspace questions, call `get_businesses` first. If more than one business is available, ask the user which business to manage. For branch questions, call `get_branches` and distinguish a selected branch from the full-business view. Switching workspace or branch requires explicit confirmation and a fresh context read afterward.

Only Pro businesses are exposed to Eve workspace switching. Business creation is web-only. Resolve customer names exactly for sales and stop when the customer does not exist; never substitute another customer or Walk-in Guest.

Keep internal IDs available for tool chaining, but never expose database IDs, foreign keys, session IDs, or raw API objects in user-facing responses. Prefer business names, branch names, customer names, product names, SKUs, dates, and amounts.
