import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessContext } from "@/lib/request-auth";
import { can } from "@/lib/permissions";
import { createNotification } from "@/lib/notifications";
export async function GET() {
  const c = await getBusinessContext();
  if (!c) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const r = await db.query(
    "select * from inventory_items where business_id=$1 order by name",
    [c.businessId],
  );
  return NextResponse.json({ items: r.rows });
}
export async function POST(req: Request) {
  const c = await getBusinessContext();
  if (!c) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(c.role, "inventory:write"))
    return NextResponse.json(
      { error: "You do not have permission to add inventory." },
      { status: 403 },
    );
  const b = await req.json();
  const q = Number(b.quantity);
  const reorderPoint = Math.max(0, Number(b.reorderPoint) || 0);
  if (!b.name || q < 0)
    return NextResponse.json(
      { error: "Name and a valid quantity are required." },
      { status: 400 },
    );
  const r = await db.query(
    "insert into inventory_items (business_id,branch_id,name,sku,quantity,price,cost_price,category,unit_of_measure,description,opening_stock,reorder_point) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$5,$11) returning *",
    [
      c.businessId,
      b.branchId || c.branchId || null,
      b.name,
      b.sku || null,
      q,
      Number(b.price) || 0,
      Number(b.costPrice) || 0,
      b.category || null,
      b.unitOfMeasure || "unit",
      b.description || null,
      reorderPoint,
    ],
  );
  if (reorderPoint > 0 && q <= reorderPoint)
    await createNotification({
      businessId: c.businessId!,
      userId: c.user.sub,
      type: "low_stock",
      title: `Low stock: ${b.name}`,
      body: `${b.name} was added at or below its reorder point.`,
    });
  return NextResponse.json({ item: r.rows[0] }, { status: 201 });
}
export async function PATCH(req: Request) {
  const c = await getBusinessContext();
  if (!c) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!can(c.role, "inventory:write"))
    return NextResponse.json(
      { error: "You do not have permission to edit inventory." },
      { status: 403 },
    );
  const b = await req.json();
  const r = await db.query(
    "update inventory_items set name=$1,sku=$2,quantity=$3,price=$4,cost_price=$5,category=$6,unit_of_measure=$7,description=$8,reorder_point=$9 where id=$10 and business_id=$11 returning *",
    [
      b.name,
      b.sku || null,
      Number(b.quantity),
      Number(b.price) || 0,
      Number(b.costPrice) || 0,
      b.category || null,
      b.unitOfMeasure || "unit",
      b.description || null,
      Math.max(0, Number(b.reorderPoint) || 0),
      b.id,
      c.businessId,
    ],
  );
  if (!r.rows[0])
    return NextResponse.json(
      { error: "Inventory item not found." },
      { status: 404 },
    );
  return NextResponse.json({ item: r.rows[0] });
}
