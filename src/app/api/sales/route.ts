import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessContext } from "@/lib/request-auth";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const result = await db.query(
    "select s.*,c.name as customer_name,u.name as salesperson_name from sales s left join customers c on c.id=s.customer_id left join users u on u.id=s.salesperson_id where s.business_id=$1 and ($2::bigint is null or s.branch_id=$2) order by s.created_at desc",
    [context.businessId, context.branchId],
  );
  return NextResponse.json({ sales: result.rows });
}
export async function POST(request: Request) {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const {
    items,
    customerId,
    branchId,
    discount = 0,
    loan = false,
    amountPaid = 0,
    notes,
  } = await request.json();
  const saleBranchId = branchId || context.branchId || null;
  if (context.assignedBranchId && saleBranchId !== context.assignedBranchId)
    return NextResponse.json(
      { error: "You can only record sales for your assigned branch." },
      { status: 403 },
    );
  if (!Array.isArray(items) || !items.length)
    return NextResponse.json(
      { error: "Add at least one product to the sale." },
      { status: 400 },
    );
  const client = await db.connect();
  try {
    await client.query("begin");
    let subtotal = 0;
    let lineDiscount = 0;
    for (const item of items) {
      const check = await client.query(
        "select price,quantity from inventory_items where id=$1 and business_id=$2 and ($3::bigint is null or branch_id=$3 or branch_id is null) for update",
        [item.inventoryItemId, context.businessId, saleBranchId],
      );
      if (!check.rows[0] || check.rows[0].quantity < Number(item.quantity))
        throw new Error("Not enough stock for one of the selected products.");
      const unitPrice = Number(item.unitPrice || check.rows[0].price);
      const discountPerUnit = Math.max(0, Number(item.discountPerUnit) || 0);
      if (discountPerUnit > unitPrice)
        throw new Error("Per-item discount cannot be greater than the unit price.");
      subtotal += Number(item.quantity) * unitPrice;
      lineDiscount += Number(item.quantity) * discountPerUnit;
    }
    const safeDiscount = Math.max(0, Math.min((Number(discount) || 0) + lineDiscount, subtotal));
    const total = subtotal - safeDiscount;
    const requestedPaid = Number(amountPaid) || 0;
    if (requestedPaid < 0 || requestedPaid > total)
      throw new Error("Amount paid cannot be greater than the sale total.");
    const paid = loan
      ? requestedPaid
      : total;
    const status =
      paid >= total ? "completed" : paid > 0 ? "partial" : "unpaid";
    if (loan && customerId) {
      const credit = await client.query(
        "select credit_limit,coalesce(sum(case when status in ('unpaid','partial') then total-amount_paid else 0 end),0) as outstanding from customers c left join sales s on s.customer_id=c.id where c.id=$1 group by c.id",
        [customerId],
      );
      if (
        credit.rows[0] &&
        Number(credit.rows[0].credit_limit) > 0 &&
        Number(credit.rows[0].outstanding) + total - paid >
          Number(credit.rows[0].credit_limit)
      )
        throw new Error("This sale would exceed the customer credit limit.");
    }
    const sale = (
      await client.query(
        "insert into sales (business_id,branch_id,customer_id,subtotal,discount,total,status,amount_paid,payment_date,notes,salesperson_id,paid_at) values ($1,$2,$3,$4,$5,$6,$7,$8,case when $8>0 then now() end,$9,$10,case when $7='completed' then now() end) returning *",
        [
          context.businessId,
          saleBranchId,
          customerId || null,
          subtotal,
          safeDiscount,
          total,
          status,
          paid,
          notes || null,
          context.user.sub,
        ],
      )
    ).rows[0];
    for (const item of items) {
      await client.query(
        "insert into sale_items (sale_id,inventory_item_id,quantity,unit_price,discount_per_unit) values ($1,$2,$3,$4,$5)",
        [sale.id, item.inventoryItemId, item.quantity, item.unitPrice, Math.max(0, Number(item.discountPerUnit) || 0)],
      );
      await client.query(
        "update inventory_items set quantity=quantity-$1 where id=$2",
        [item.quantity, item.inventoryItemId],
      );
    }
    await client.query("commit");
    if (status !== "completed")
      await createNotification({
        businessId: context.businessId!,
        userId: context.user.sub,
        type: "unpaid_sale",
        title: "Unpaid sale recorded",
        body: `A ${status} sale of ₦${total.toLocaleString()} was recorded.`,
      });
    return NextResponse.json({ sale }, { status: 201 });
  } catch (error) {
    await client.query("rollback");
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to record sale.",
      },
      { status: 400 },
    );
  } finally {
    client.release();
  }
}
export async function PATCH(request: Request) {
  const context = await getBusinessContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id, amountPaid } = await request.json();
  const sale = await db.query(
    "select total,status from sales where id=$1 and business_id=$2",
    [id, context.businessId],
  );
  if (!sale.rows[0])
    return NextResponse.json({ error: "Sale not found." }, { status: 404 });
  if (sale.rows[0].status === "completed")
    return NextResponse.json(
      { error: "Completed sales cannot be edited." },
      { status: 400 },
    );
  const paid = Math.max(
    0,
    Number(amountPaid) || 0,
  );
  if (Number(amountPaid) < 0 || paid > Number(sale.rows[0].total))
    return NextResponse.json(
      { error: "Amount paid cannot be greater than the sale total." },
      { status: 400 },
    );
  const status =
    paid >= Number(sale.rows[0].total)
      ? "completed"
      : paid > 0
        ? "partial"
        : "unpaid";
  const result = await db.query(
    "update sales set amount_paid=$1,status=$2,payment_date=case when $1>0 then now() else payment_date end,paid_at=case when $2='completed' then now() else null end where id=$3 returning *",
    [paid, status, id],
  );
  if (status === "completed")
    await createNotification({
      businessId: context.businessId!,
      userId: context.user.sub,
      type: "sale_paid",
      title: "Sale payment completed",
      body: "An outstanding sale has been fully paid.",
    });
  return NextResponse.json({ sale: result.rows[0] });
}
