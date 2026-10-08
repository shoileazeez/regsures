"use client";
import { useEffect, useState } from "react";
import DashboardLoading from "../DashboardLoading";
type Settings = {
  name: string;
  email: string;
  phone: string;
  business_name: string;
  notification_email: boolean;
  restock_notifications: boolean;
  payment_notifications: boolean;
};
export default function Settings() {
  const [s, setS] = useState<Settings | null>(null);
  const [modal, setModal] = useState<
    "profile" | "notifications" | "security" | null
  >(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setS(d.settings));
  }, []);
  async function save(section: string) {
    if (!s) return;
    const body =
      section === "profile"
        ? {
            section,
            name: s.name,
            phone: s.phone,
            businessName: s.business_name,
          }
        : {
            section,
            email: s.notification_email,
            restock: s.restock_notifications,
            payments: s.payment_notifications,
          };
    const r = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setMessage(r.ok ? "Settings saved." : "Unable to save settings.");
  }
  if (!s)
    return (
      <div className="dashboard-content">
        <DashboardLoading label="Loading settings" />
      </div>
    );
  return (
    <div className="dashboard-content">
      <p className="kicker">
        <span className="kicker-line" />
        Business settings
      </p>
      <h1>
        Keep the details
        <br />
        <em>up to date.</em>
      </h1>
      <p className="dashboard-lede">
        Profile and notification preferences belong to the active business.
        Security takes you to the account recovery flow.
      </p>
      <div className="settings-list">
        <div>
          <h2>Business profile</h2>
          <p>Business name, owner details, and contact information.</p>
          <button className="text-link" onClick={() => setModal("profile")}>
            Edit profile ↗
          </button>
        </div>
        <div>
          <h2>Notifications</h2>
          <p>Choose where restock reminders and payment updates should go.</p>
          <button
            className="text-link"
            onClick={() => setModal("notifications")}
          >
            Manage notifications ↗
          </button>
        </div>
        <div>
          <h2>Security</h2>
          <p>Review sign-in details and change your password.</p>
          <button className="text-link" onClick={() => setModal("security")}>
            Review security ↗
          </button>
        </div>
      </div>
      {modal && (
        <div
          className="settings-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModal(null);
          }}
        >
          <section
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
          >
            <button
              className="settings-modal-close"
              type="button"
              onClick={() => setModal(null)}
              aria-label="Close settings modal"
            >
              ×
            </button>
            {modal === "profile" && (
              <>
                <p className="kicker">
                  <span className="kicker-line" />
                  Business profile
                </p>
                <h2 id="settings-modal-title">Edit your workspace details.</h2>
                <p className="settings-modal-copy">
                  Keep your name, business identity, and contact details
                  accurate for invoices, team access, and notifications.
                </p>
                <form
                  className="settings-modal-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    save("profile");
                    setModal(null);
                  }}
                >
                  <input
                    value={s.name}
                    onChange={(e) => setS({ ...s, name: e.target.value })}
                    placeholder="Your name"
                    required
                  />
                  <input
                    value={s.business_name}
                    onChange={(e) =>
                      setS({ ...s, business_name: e.target.value })
                    }
                    placeholder="Business name"
                    required
                  />
                  <input
                    value={s.phone || ""}
                    onChange={(e) => setS({ ...s, phone: e.target.value })}
                    placeholder="Phone"
                  />
                  <button className="button dark">Save profile</button>
                </form>
              </>
            )}
            {modal === "notifications" && (
              <>
                <p className="kicker">
                  <span className="kicker-line" />
                  Notifications
                </p>
                <h2 id="settings-modal-title">Choose what reaches you.</h2>
                <p className="settings-modal-copy">
                  Control the updates your active workspace sends to your
                  account.
                </p>
                <form
                  className="settings-modal-form settings-checkboxes"
                  onSubmit={(e) => {
                    e.preventDefault();
                    save("notifications");
                    setModal(null);
                  }}
                >
                  <label>
                    <input
                      type="checkbox"
                      checked={s.notification_email}
                      onChange={(e) =>
                        setS({ ...s, notification_email: e.target.checked })
                      }
                    />{" "}
                    Email updates
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={s.restock_notifications}
                      onChange={(e) =>
                        setS({ ...s, restock_notifications: e.target.checked })
                      }
                    />{" "}
                    Restock reminders
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={s.payment_notifications}
                      onChange={(e) =>
                        setS({ ...s, payment_notifications: e.target.checked })
                      }
                    />{" "}
                    Payment updates
                  </label>
                  <button className="button dark">Save notifications</button>
                </form>
              </>
            )}
            {modal === "security" && (
              <>
                <p className="kicker">
                  <span className="kicker-line" />
                  Security
                </p>
                <h2 id="settings-modal-title">Review your sign-in settings.</h2>
                <p className="settings-modal-copy">
                  Your account email is <strong>{s.email}</strong>. Password
                  changes happen through a secure, one-time reset link.
                </p>
                <div className="security-review">
                  <div>
                    <span>Account email</span>
                    <strong>{s.email}</strong>
                  </div>
                  <div>
                    <span>Password</span>
                    <strong>Hidden for your protection</strong>
                  </div>
                </div>
                <a
                  className="button dark settings-modal-action"
                  href="/auth/forgot-password"
                >
                  Change password ↗
                </a>
              </>
            )}
          </section>
        </div>
      )}
      {message && <p className="payment-status">{message}</p>}
    </div>
  );
}
