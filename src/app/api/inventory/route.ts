import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessContext } from "@/lib/request-auth";
import { can } from "@/lib/permissions";
import { createNotification } from "@/lib/notifications";
export async function GET() {
  const c = await getBusinessContext();
  if (!c) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const r = await db.query(
    "select * from inventory_items where business_id=$1 and ($2::bigint is null or branch_id=$2 or branch_id is null) order by name",
    [c.businessId, c.branchId],
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
  const thresholdType = b.reorderThresholdType === "percent" ? "percent" : "quantity";
  const thresholdValue = Math.max(0, Number(b.reorderThresholdValue ?? reorderPoint) || 0);
  const itemBranchId = b.branchId || c.branchId || null;
  if (c.assignedBranchId && itemBranchId !== c.assignedBranchId)
    return NextResponse.json(
      { error: "You can only add inventory to your assigned branch." },
      { status: 403 },
    );
  if (!b.name || q < 0)
    return NextResponse.json(
      { error: "Name and a valid quantity are required." },
      { status: 400 },
    );
  const r = await db.query(
    "insert into inventory_items (business_id,branch_id,name,sku,quantity,price,cost_price,category,unit_of_measure,description,opening_stock,reorder_point,reorder_threshold_type,reorder_threshold_value) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$5,$11,$12,$13) returning *",
    [
      c.businessId,
      itemBranchId,
      b.name,
      b.sku || null,
      q,
      Number(b.price) || 0,
      Number(b.costPrice) || 0,
      b.category || null,
      b.unitOfMeasure || "unit",
      b.description || null,
      reorderPoint,
      thresholdType,
      thresholdValue,
    ],
  );
  const isLowStock = thresholdValue > 0 &&
    (thresholdType === "percent" ? q <= Math.ceil(q / 100 * thresholdValue) : q <= thresholdValue);
  if (isLowStock)
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
  const itemBranchId = b.branchId || c.branchId || null;
  const thresholdType = b.reorderThresholdType === "percent" ? "percent" : "quantity";
  const thresholdValue = Math.max(0, Number(b.reorderThresholdValue ?? b.reorderPoint) || 0);
  if (c.assignedBranchId && itemBranchId !== c.assignedBranchId)
    return NextResponse.json(
      { error: "You can only assign inventory to your assigned branch." },
      { status: 403 },
    );
  const r = await db.query(
    "update inventory_items set branch_id=$1,name=$2,sku=$3,quantity=$4,price=$5,cost_price=$6,category=$7,unit_of_measure=$8,description=$9,reorder_point=$10,reorder_threshold_type=$11,reorder_threshold_value=$12 where id=$13 and business_id=$14 and ($15::bigint is null or branch_id=$15 or branch_id is null) returning *",
    [
      itemBranchId,
      b.name,
      b.sku || null,
      Number(b.quantity),
      Number(b.price) || 0,
      Number(b.costPrice) || 0,
      b.category || null,
      b.unitOfMeasure || "unit",
      b.description || null,
      Math.max(0, Number(b.reorderPoint) || 0),
      thresholdType,
      thresholdValue,
      b.id,
      c.businessId,
      c.branchId,
    ],
  );
  if (!r.rows[0])
    return NextResponse.json(
      { error: "Inventory item not found." },
      { status: 404 },
    );
  const isLowStock = thresholdValue > 0 &&
    (thresholdType === "percent" ? Number(r.rows[0].quantity) <= Math.ceil(Number(r.rows[0].opening_stock) / 100 * thresholdValue) : Number(r.rows[0].quantity) <= thresholdValue);
  if (isLowStock)
    await createNotification({
      businessId: c.businessId!,
      userId: c.user.sub,
      type: "low_stock",
      title: `Low stock: ${r.rows[0].name}`,
      body: `${r.rows[0].name} is at or below its configured alert threshold.`,
    });
  return NextResponse.json({ item: r.rows[0] });
}
