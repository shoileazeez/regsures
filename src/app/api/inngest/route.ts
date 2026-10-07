import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { sendMailgunEmail } from "@/lib/mailgun";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
const emailShell = (content: string) =>
  `<div style="background:#f4f0e8;padding:40px 16px;font-family:Arial,sans-serif;color:#142b2b"><div style="max-width:560px;margin:0 auto;background:#fffdf7;border-top:5px solid #dce84f;padding:36px"><div style="font-size:22px;font-weight:700;letter-spacing:-1px;margin-bottom:42px">regsure</div>${content}<div style="border-top:1px solid #d5d5c9;margin-top:36px;padding-top:18px;color:#687270;font-size:12px">Stock. Sales. Sense.<br/>You are receiving this because you created or joined a Regsure business account.</div></div></div>`;
const sendVerificationEmail = inngest.createFunction(
  { id: "send-verification-email", retries: 5 },
  { event: "regsure/auth.verification.requested" },
  async ({ event }) => {
    const { email, code } = event.data as { email: string; code: string };
    await sendMailgunEmail({
      to: email,
      subject: "Your Regsure verification code",
      html: emailShell(
        `<h1 style="font-size:32px;line-height:1.05;margin:0 0 18px">Verify your account.</h1><p style="font-size:16px;line-height:1.6;color:#687270">Use this code to finish creating your Regsure account.</p><div style="background:#dce84f;color:#142b2b;font-size:32px;font-weight:700;letter-spacing:8px;padding:18px 20px;margin:28px 0;display:inline-block">${code}</div><p style="font-size:13px;color:#687270">This code expires in 10 minutes.</p>`,
      ),
    });
    return { sent: true };
  },
);
const sendProductUpdatesEmail = inngest.createFunction(
  { id: "send-product-updates-confirmation", retries: 5 },
  { event: "regsure/marketing.product-updates.subscribed" },
  async ({ event }) => {
    const { email } = event.data as { email: string };
    await sendMailgunEmail({
      to: email,
      subject: "You’re subscribed to Regsure updates",
      html: emailShell(
        `<h1 style="font-size:32px;line-height:1.05;margin:0 0 18px">You’re on the list.</h1><p style="font-size:16px;line-height:1.6;color:#687270">Thanks for subscribing to Regsure product updates. We’ll send practical news about new features, business tools, and useful ways to run your operation with more clarity.</p><p style="font-size:13px;color:#687270">We’ll keep it useful and infrequent.</p>`,
      ),
    });
    return { sent: true };
  },
);
const sendInviteEmail = inngest.createFunction(
  { id: "send-business-invite", retries: 5 },
  { event: "regsure/team.invite.created" },
  async ({ event }) => {
    const { email, token, businessName, role } = event.data as {
      email: string;
      token: string;
      businessName: string;
      role: string;
    };
    const link = `${process.env.APP_URL || "http://localhost:3000"}/invite/accept?token=${token}`;
    await sendMailgunEmail({
      to: email,
      subject: `You have been invited to ${businessName} on Regsure`,
      html: emailShell(
        `<h1 style="font-size:32px;line-height:1.05;margin:0 0 18px">Join ${businessName}.</h1><p style="font-size:16px;line-height:1.6;color:#687270">You have been invited to work as a <strong>${role}</strong> on Regsure.</p><a href="${link}" style="display:inline-block;background:#142b2b;color:#f4f0e8;text-decoration:none;padding:15px 20px;margin:18px 0">Accept invitation ↗</a><p style="font-size:13px;color:#687270">This invitation expires in 7 days.</p>`,
      ),
    });
    return { sent: true };
  },
);
const sendPlanSuccessEmail = inngest.createFunction(
  { id: "send-plan-success-email", retries: 5 },
  { event: "regsure/billing.plan.activated" },
  async ({ event }) => {
    const { email, plan, amount } = event.data as {
      email: string;
      plan: string;
      amount: number;
    };
    await sendMailgunEmail({
      to: email,
      subject: `Your Regsure ${plan} plan is active`,
      html: emailShell(
        `<h1 style="font-size:32px;line-height:1.05;margin:0 0 18px">Your plan is active.</h1><p style="font-size:16px;line-height:1.6;color:#687270">Your <strong>${plan}</strong> plan is now ready. Your payment of ₦${amount.toLocaleString()} was confirmed.</p><a href="${process.env.APP_URL || "http://localhost:3000"}/dashboard" style="display:inline-block;background:#142b2b;color:#f4f0e8;text-decoration:none;padding:15px 20px;margin:18px 0">Open your workspace ↗</a>`,
      ),
    });
    return { sent: true };
  },
);
const subscriptionReminders = inngest.createFunction(
  { id: "subscription-expiry-reminders", retries: 3 },
  { cron: "0 8 * * *" },
  async () => {
    const expiring = await db.query(
      `select b.id,b.owner_id,b.name,b.plan,b.plan_expires_at,b.grace_until,u.email,u.name as owner_name from businesses b join users u on u.id=b.owner_id where b.plan in ('basic','pro') and (b.plan_expires_at::date = current_date + interval '5 days' or b.plan_expires_at::date = current_date + interval '1 day')`,
    );
    const expired = await db.query(
      `select b.id,b.owner_id,b.name,b.plan,b.grace_until,u.email from businesses b join users u on u.id=b.owner_id where b.plan in ('basic','pro') and b.grace_until is not null and b.grace_until < now()`,
    );
    for (const business of expiring.rows) {
      const days = Math.ceil(
        (new Date(business.plan_expires_at).getTime() - Date.now()) / 86400000,
      );
      await createNotification({
        businessId: business.id,
        userId: business.owner_id,
        type: "subscription_expiry",
        title: "Subscription renewal reminder",
        body: `Your ${business.plan} plan expires in ${days} day${days === 1 ? "" : "s"}.`,
      });
      await sendMailgunEmail({
        to: business.email,
        subject: `Your Regsure ${business.plan} plan expires in ${days} day${days === 1 ? "" : "s"}`,
        html: emailShell(
          `<h1 style="font-size:32px;line-height:1.05;margin:0 0 18px">Your plan is nearly due.</h1><p style="font-size:16px;line-height:1.6;color:#687270">The <strong>${business.name}</strong> ${business.plan} plan expires in ${days} day${days === 1 ? "" : "s"}. Renew to keep analytics, team access, and your paid features active.</p><a href="${process.env.APP_URL || "http://localhost:3000"}/dashboard/billing" style="display:inline-block;background:#142b2b;color:#f4f0e8;text-decoration:none;padding:15px 20px;margin:18px 0">Review billing</a>`,
        ),
      });
    }
    for (const business of expired.rows) {
      await db.query(
        "update businesses set plan='free',plan_started_at=null,plan_expires_at=null,grace_until=null where id=$1",
        [business.id],
      );
      await createNotification({
        businessId: business.id,
        userId: business.owner_id,
        type: "subscription_expired",
        title: "Plan moved to Free",
        body: "Your grace period ended. Renew to restore paid features.",
      });
      await sendMailgunEmail({
        to: business.email,
        subject: `Your Regsure plan is now Free`,
        html: emailShell(
          `<h1 style="font-size:32px;line-height:1.05;margin:0 0 18px">Your grace period has ended.</h1><p style="font-size:16px;line-height:1.6;color:#687270"><strong>${business.name}</strong> is now on the Free plan. Your records remain available, while paid features are locked until you renew.</p><a href="${process.env.APP_URL || "http://localhost:3000"}/dashboard/billing" style="display:inline-block;background:#142b2b;color:#f4f0e8;text-decoration:none;padding:15px 20px;margin:18px 0">Renew your plan</a>`,
        ),
      });
    }
    return { reminders: expiring.rowCount, downgraded: expired.rowCount };
  },
);
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendVerificationEmail,
    sendProductUpdatesEmail,
    sendInviteEmail,
    sendPlanSuccessEmail,
    subscriptionReminders,
  ],
});
