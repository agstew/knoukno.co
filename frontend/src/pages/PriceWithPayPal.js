import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PayPalButton from "../components/PayPalButton";

export default function Price() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState("");
  const [message, setMessage] = useState("");
  const [mockTier, setMockTier] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("stripe"); // "stripe" or "paypal"
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const { isAuthenticated, token } = useAuth();
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
    if (params.get("payment") === "success") {
      setMessage("Payment successful! Your plan has been activated.");
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
      console.error("Error fetching prices:", err);
    }
  };

  const handleStripeCheckout = async (tierId) => {
    if (!isAuthenticated) {
      window.location.href = "/register";
      return;
    }
    setCheckoutLoading(tierId);
    try {
      const res = await fetch("/api/payment/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tier: tierId }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setMessage(data.message || "Could not start checkout. Please try again.");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
    } finally {
      setCheckoutLoading("");
    }
  };

  const handlePayPalSuccess = (data) => {
    setPaymentSuccess(data);
    setMessage("Payment successful! Your plan has been activated.");
    setTimeout(() => {
      window.location.href = "/dashboard?payment=success";
    }, 2000);
  };

  const handlePayPalError = (error) => {
    setMessage(`Payment error: ${error}`);
  };

  return (
    <div className="price-container">
      <h1>Choose Your Plan</h1>
      
      {message && (
        <div className={`alert ${paymentSuccess || message.includes("successful") ? "alert-success" : "alert-warning"}`}>
          {message}
        </div>
      )}

      {/* Payment Method Selection */}
      {!mockTier && (
        <div className="payment-method-selector">
          <label>
            <input
              type="radio"
              value="stripe"
              checked={selectedPaymentMethod === "stripe"}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            />
            Stripe
          </label>
          <label>
            <input
              type="radio"
              value="paypal"
              checked={selectedPaymentMethod === "paypal"}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            />
            PayPal
          </label>
        </div>
      )}

      <div className="pricing-grid">
        {prices.map((price) => (
          <div key={price.id} className="price-card">
            <h2>{price.name}</h2>
            <p className="price">{price.display}</p>
            {price.original && <p className="original-price">{price.original}</p>}
            {price.discount && <p className="discount">{price.discount}</p>}
            <p className="features">{price.questions} questions included</p>

            {!isAuthenticated ? (
              <Link to="/register" className="btn btn-primary">
                Sign Up & Purchase
              </Link>
            ) : mockTier === price.id ? (
              <button className="btn btn-primary" onClick={() => window.location.href = `/dashboard?mockCheckout=${price.id}`}>
                Complete Test Payment
              </button>
            ) : selectedPaymentMethod === "stripe" ? (
              <button
                className="btn btn-primary"
                onClick={() => handleStripeCheckout(price.id)}
                disabled={checkoutLoading === price.id || !price.checkoutAvailable}
              >
                {checkoutLoading === price.id ? "Processing..." : "Pay with Stripe"}
              </button>
            ) : (
              price.checkoutAvailable && (
                <PayPalButton
                  tier={price.id}
                  onSuccess={handlePayPalSuccess}
                  onError={handlePayPalError}
                />
              )
            )}
          </div>
        ))}
      </div>

      {!isAuthenticated && (
        <p className="auth-prompt">
          <Link to="/login">Already have an account? Log in</Link>
        </p>
      )}
    </div>
  );
}
