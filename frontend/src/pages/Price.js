import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Price() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState("");
  const [message, setMessage] = useState("");
  const [mockTier, setMockTier] = useState("");
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("payment") === "cancelled") {
      setMessage("Payment was cancelled. You can try again below.");
    }
    const mockCheckoutTier = params.get("mockCheckout");
    if (mockCheckoutTier) {
      setMockTier(mockCheckoutTier);
      setMessage("Stripe is not configured here, so this page is in local test checkout mode. Complete the test payment below to continue.");
    } else {
      setMockTier("");
    }
    fetchPrices();
  }, [location.search]);

  const fetchPrices = async () => {
    try {
      const res = await fetch("/api/payment/prices");
      if (res.ok) {
        const data = await res.json();
        setPrices(data);
      }
    } catch (err) {
      // use defaults if API unavailable
    }
  };

  const handleCheckout = async (tierId) => {
    if (!isAuthenticated) {
      window.location.href = "/register";
      return;
    }
    const token = localStorage.getItem("token");
    setCheckoutLoading(tierId);
    try {
      const res = await fetch("/api/payment/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: tierId }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        if (data.message) {
          setMessage(data.message);
        }
        window.location.href = data.url;
      } else {
        setMessage(
          data.message || "Could not start checkout. Please try again."
        );
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
    } finally {
      setCheckoutLoading("");
    }
  };

  const completeMockCheckout = async () => {
    if (!mockTier) return;
    const token = localStorage.getItem("token");
    setCheckoutLoading(mockTier);

    try {
      const res = await fetch("/api/payment/mock-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: mockTier }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        window.location.href = "/dashboard?payment=success";
        return;
      }

      setMessage(data.message || "Could not complete the test payment.");
    } catch (err) {
      setMessage("Network error. Please try again.");
    } finally {
      setCheckoutLoading("");
    }
  };

  const paidPlansById = prices.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});
  const checkoutAvailable = prices.some((plan) => plan.checkoutAvailable);

  const plans = [
    {
      id: "free",
      name: "Free Tier",
      display: "$0",
      original: null,
      discount: "3 days",
      questions: 5,
      durationText: "3-day access",
      features: [
        "5 questions",
        "Save page access",
        "Print page access",
      ],
    },
    {
      id: "members",
      name: "Members Tier",
      display: paidPlansById.members?.display || "$39.00",
      original: paidPlansById.members?.original || "$49.00",
      discount: "20% off (Save $10.00)",
      questions: paidPlansById.members?.questions || 50,
      questionSummary: "50 questions",
      durationText: "one-time access",
      features: [
        "50 questions",
        "Print page access",
        "Save page access",
        "Grade page access",
        "Rate page access",
        "Average page access",
      ],
    },
    {
      id: "pro",
      name: "Pro Tier",
      display: paidPlansById.pro?.display || "$436.00",
      original: paidPlansById.pro?.original || "$675.00",
      discount: "35% off (Save $235.00)",
      questions: paidPlansById.pro?.questions || 75,
      questionSummary: "75 questions",
      durationText: "one-time access",
      features: [
        "75 questions",
        "Print page access",
        "Save page access",
        "Grade page access",
        "Rate page access",
        "Average page access",
      ],
    },
  ];

  return (
    <div className="pricing-section">
      <h2>Simple, One-Time Pricing</h2>
      <p className="subtitle">
        Pay once. Access forever. No subscriptions, no renewals.
      </p>
      {!checkoutAvailable && !loading && <p className="subtitle" role="status">Paid checkout is currently unavailable. You can still start free.</p>}

      {message && (
        <div
          className="alert alert-warning"
          style={{ maxWidth: "600px", margin: "0 auto 1.5rem" }}
        >
          {message}
        </div>
      )}

      {mockTier && (
        <div
          className="alert alert-info"
          style={{ maxWidth: "600px", margin: "0 auto 1.5rem" }}
        >
          <strong>Test checkout:</strong> Stripe keys are not configured in this workspace. Use the button below to complete a local payment simulation for {mockTier}.
          <div style={{ marginTop: "0.85rem" }}>
            <button
              className="btn btn-primary"
              onClick={completeMockCheckout}
              disabled={checkoutLoading === mockTier}
            >
              {checkoutLoading === mockTier ? "Completing…" : "Complete Test Payment"}
            </button>
          </div>
        </div>
      )}

      <div className="pricing-grid">
        {plans.map((plan, idx) => (
          <div
            key={plan.id}
            className={`pricing-card${idx === 1 ? " featured" : ""}`}
          >
            {idx === 1 && <div className="pricing-badge">Most Popular</div>}
            <h3>{plan.name}</h3>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <span className="pricing-price">{plan.display}</span>
              {plan.original && (
                <>
                  <span className="pricing-original">{plan.original}</span>
                  <span className="pricing-discount">{plan.discount}</span>
                </>
              )}
            </div>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--color-text-light)",
                marginTop: "0.4rem",
              }}
            >
              {plan.id === "free" ? `${plan.questions} questions` : plan.questionSummary} • {plan.durationText}
            </p>

            <ul className="pricing-features">
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>

            {plan.id === "free" ? (
              <Link to="/register" className="btn btn-primary btn-block">
                Start Free Trial
              </Link>
            ) : (
              <div style={{ display: 'grid', gap: '0.55rem' }}>
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => handleCheckout(plan.id)}
                  disabled={checkoutLoading === plan.id || !checkoutAvailable}
                >
                  {checkoutLoading === plan.id
                    ? "Redirecting…"
                    : checkoutAvailable ? `Buy ${plan.name} with Stripe` : 'Purchases unavailable'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div style={{ overflowX: "auto", marginTop: "3rem" }}>
        <table className="compare-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Free</th>
              <th>Members</th>
              <th>Pro</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Questions</td>
              <td>5</td>
              <td>50</td>
              <td>75</td>
            </tr>
            <tr>
              <td>Access Period</td>
              <td>3 days</td>
              <td>Lifetime</td>
              <td>Lifetime</td>
            </tr>
            <tr>
              <td>Save Answers</td>
              <td>✓</td>
              <td>✓</td>
              <td>✓</td>
            </tr>
            <tr>
              <td>Print</td>
              <td>✓</td>
              <td>✓</td>
              <td>✓</td>
            </tr>
            <tr>
              <td>Grade</td>
              <td>—</td>
              <td>✓</td>
              <td>✓</td>
            </tr>
            <tr>
              <td>Rate</td>
              <td>—</td>
              <td>✓</td>
              <td>✓</td>
            </tr>
            <tr>
              <td>Average</td>
              <td>—</td>
              <td>✓</td>
              <td>✓</td>
            </tr>
            <tr>
              <td>Bonus: 100 questions for $100</td>
              <td>—</td>
              <td>Add-on</td>
              <td>Add-on</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* FAQ */}
      <div
        style={{ marginTop: "3rem", maxWidth: "680px", margin: "3rem auto 0" }}
      >
        <h3
          style={{
            fontSize: "1.3rem",
            fontWeight: 700,
            color: "var(--color-dark)",
            marginBottom: "1.5rem",
            textAlign: "center",
          }}
        >
          Frequently Asked Questions
        </h3>
        {[
          {
            q: "Is this a subscription?",
            a: "No. Kno U Kno uses one-time pricing. Pay once and access your questions forever.",
          },
          {
            q: "What happens after the free trial?",
            a: "After 3 days, free trial access expires. Your account remains and you can upgrade to continue.",
          },
          {
            q: "Can I get a refund?",
            a: "We offer a 7-day money-back guarantee if you are not satisfied. Contact us with your purchase email.",
          },
          {
            q: "How do I access my questions?",
            a: "Once registered and logged in, go to your Dashboard. Questions unlock based on your plan immediately after payment.",
          },
        ].map((faq) => (
          <div
            key={faq.q}
            style={{
              marginBottom: "1.25rem",
              borderBottom: "1px solid var(--color-border)",
              paddingBottom: "1.25rem",
            }}
          >
            <p
              style={{
                fontWeight: 700,
                color: "var(--color-dark)",
                marginBottom: "0.35rem",
              }}
            >
              {faq.q}
            </p>
            <p
              style={{
                color: "var(--color-text-light)",
                fontSize: "0.92rem",
                lineHeight: 1.6,
              }}
            >
              {faq.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
