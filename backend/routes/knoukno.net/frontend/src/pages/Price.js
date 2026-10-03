import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check, Sparkles, Crown, Rocket, ShieldCheck, RotateCcw, CreditCard, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/client";

const PLAN_ICONS = { free: Sparkles, members: Crown, pro: Rocket };

const FAQS = [
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
];

export default function Price() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState("");
  const [message, setMessage] = useState("");
  const [openFaq, setOpenFaq] = useState(0);
  const { isAuthenticated, tier: tokenTier, isAdmin, logout, refreshUser } = useAuth();
  const [currentTier, setCurrentTier] = useState(tokenTier);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("payment") === "cancelled") {
      setMessage("Payment was cancelled. You can try again below.");
    }
    const orderId = params.get("paypal") === "return" ? params.get("token") : null;
    if (orderId) capturePayPal(orderId);
    fetchPrices();
  }, [location.search]);

  useEffect(() => {
    setCurrentTier(tokenTier);
    if (!isAuthenticated) return;

    refreshUser()
      .then((account) => {
        if (account?.tier) setCurrentTier(account.tier);
      })
      .catch(() => {});
  }, [isAuthenticated, tokenTier, refreshUser]);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/payment/prices");
      if (res.ok) {
        const data = await res.json();
        setPrices(data);
      } else {
        setMessage("Could not load plan availability. Please try again.");
      }
    } catch (err) {
      setMessage("Network error loading plan availability.");
    } finally {
      setLoading(false);
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
      const res = await apiFetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: tierId }),
      });
      const data = await res.json();
      if (res.status === 401) {
        logout();
        navigate("/login", { replace: true, state: { message: "Your session expired. Please log in again to continue to PayPal." } });
        return;
      }
      if (res.ok && data.url) {
        if (data.message) {
          setMessage(data.message);
        }
        window.location.href = data.url;
      } else {
        setMessage(
          data.message || "Could not start checkout. Please try again."
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setCheckoutLoading("");
    }
  };

  const capturePayPal = async (orderId) => {
    const token = localStorage.getItem("token");
    setLoading(true);
    setMessage("Confirming your PayPal payment…");
    try {
      const res = await apiFetch("/api/payment/capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.status === 401) {
        logout();
        navigate("/login", { replace: true, state: { message: "Your session expired. Please log in again to finish your payment." } });
        return;
      }
      if (res.ok) {
        window.location.href = "/dashboard?payment=success";
        return;
      }
      setMessage(data.message || "Could not confirm the payment.");
    } catch (err) {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const paidPlansById = prices.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});
  const checkoutAvailable = prices.some((plan) => plan.checkoutAvailable);
  const tierRank = { free: 0, members: 1, pro: 2 };

  const planAction = (plan) => {
    if (!isAuthenticated) {
      return plan.id === "free" ? (
        <Link to="/register" className="btn btn-primary btn-block">
          Start Free Trial
        </Link>
      ) : (
        <Link to="/register" className="btn btn-primary btn-block">
          Buy {plan.name} with PayPal
        </Link>
      );
    }

    if (isAdmin) {
      return <button className="btn btn-secondary btn-block" disabled>Admin Access</button>;
    }

    if (plan.id === currentTier) {
      return <button className="btn btn-secondary btn-block" disabled>Current Plan</button>;
    }

    if (tierRank[plan.id] < tierRank[currentTier]) {
      return <button className="btn btn-secondary btn-block" disabled>Included in Your Plan</button>;
    }

    if (plan.id === "free") {
      return <button className="btn btn-secondary btn-block" disabled>Free Trial Used</button>;
    }

    return (
      <button
        className="btn btn-primary btn-block"
        onClick={() => handleCheckout(plan.id)}
        disabled={checkoutLoading === plan.id || !checkoutAvailable}
      >
        {checkoutLoading === plan.id
          ? "Redirecting…"
          : checkoutAvailable ? `Buy ${plan.name} with PayPal` : "Purchases unavailable"}
      </button>
    );
  };

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
        "Rated page access",
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
        "Rated page access",
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

      <div className="pricing-trustbar">
        <span><CreditCard size={16} /> One-time payment</span>
        <span><RotateCcw size={16} /> 7-day refund guarantee</span>
        <span><ShieldCheck size={16} /> Secure checkout via PayPal</span>
      </div>

      {loading && <p className="subtitle" role="status">Checking PayPal availability…</p>}
      {!checkoutAvailable && !loading && (
        <p className="subtitle" role="status">
          PayPal checkout is not configured yet. You can still start free.
        </p>
      )}

      {message && (
        <div
          className="alert alert-warning"
          style={{ maxWidth: "600px", margin: "0 auto 1.5rem" }}
        >
          {message}
        </div>
      )}

      <div className="pricing-grid">
        {plans.map((plan, idx) => {
          const PlanIcon = PLAN_ICONS[plan.id];
          return (
            <div
              key={plan.id}
              className={`pricing-card${idx === 1 ? " featured" : ""}`}
            >
              {idx === 1 && (
                <div className="pricing-badge">
                  <Crown size={13} /> Most Popular
                </div>
              )}
              <div className="pricing-icon"><PlanIcon size={22} /></div>
              <h3>{plan.name}</h3>
              <div className="pricing-price-row">
                <span className="pricing-price">{plan.display}</span>
                {plan.original && (
                  <>
                    <span className="pricing-original">{plan.original}</span>
                    <span className="pricing-discount">{plan.discount}</span>
                  </>
                )}
              </div>
              <p className="pricing-summary">
                {plan.id === "free" ? `${plan.questions} questions` : plan.questionSummary} • {plan.durationText}
              </p>

              <ul className="pricing-features">
                {plan.features.map((f) => (
                  <li key={f}><Check size={15} className="pricing-check" /> {f}</li>
                ))}
              </ul>

              <div className="pricing-action">{planAction(plan)}</div>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="pricing-faq">
        <h3>Frequently Asked Questions</h3>
        {FAQS.map((faq, idx) => {
          const isOpen = openFaq === idx;
          return (
            <div key={faq.q} className={`faq-item${isOpen ? " open" : ""}`}>
              <button
                type="button"
                className="faq-question"
                onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                aria-expanded={isOpen}
              >
                <span>{faq.q}</span>
                <ChevronDown size={18} className="faq-chevron" />
              </button>
              {isOpen && <p className="faq-answer">{faq.a}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
