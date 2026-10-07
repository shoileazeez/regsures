import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessContext } from "@/lib/request-auth";
import { can } from "@/lib/permissions";
export async function GET() {
  const c = await getBusinessContext();
  if (!c) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const r = await db.query(
    `select c.*,coalesce(sum(case when s.status in ('unpaid','partial') then s.total-s.amount_paid else 0 end),0) as outstanding_balance,count(s.id) as purchase_count from customers c left join sales s on s.customer_id=c.id where c.business_id=$1 group by c.id order by c.created_at desc`,
    [c.businessId],
  );
  return NextResponse.json({ customers: r.rows });
}
export async function POST(req: Request) {
  const c = await getBusinessContext();
  if (!c) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(c.role, "customers:write"))
    return NextResponse.json(
      { error: "You do not have permission to add customers." },
      { status: 403 },
    );
  const b = await req.json();
  if (!b.name)
    return NextResponse.json(
      { error: "Customer name is required." },
      { status: 400 },
    );
  const r = await db.query(
    "insert into customers (business_id,name,phone,email,customer_type,credit_limit,notes) values ($1,$2,$3,$4,$5,$6,$7) returning *",
    [
      c.businessId,
      b.name,
      b.phone || null,
      b.email || null,
      b.customerType || "retail",
      Number(b.creditLimit) || 0,
      b.notes || null,
    ],
  );
  return NextResponse.json({ customer: r.rows[0] }, { status: 201 });
}
export async function PATCH(req: Request) {
  const c = await getBusinessContext();
  if (!c) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(c.role, "customers:write"))
    return NextResponse.json(
      { error: "You do not have permission to edit customers." },
      { status: 403 },
    );
  const b = await req.json();
  const r = await db.query(
    "update customers set name=$1,phone=$2,email=$3,customer_type=$4,credit_limit=$5,notes=$6 where id=$7 and business_id=$8 returning *",
    [
      b.name,
      b.phone || null,
      b.email || null,
      b.customerType || "retail",
      Number(b.creditLimit) || 0,
      b.notes || null,
      b.id,
      c.businessId,
    ],
  );
  return r.rows[0]
    ? NextResponse.json({ customer: r.rows[0] })
    : NextResponse.json({ error: "Customer not found." }, { status: 404 });
}
