import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const PayPalButton = ({ tier, onSuccess, onError }) => {
  const containerRef = useRef(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!containerRef.current || !process.env.REACT_APP_PAYPAL_CLIENT_ID) {
      return;
    }

    // Load PayPal script dynamically
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.REACT_APP_PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;

    script.onload = () => {
      if (window.paypal) {
        window.paypal.Buttons({
          createOrder: async (data, actions) => {
            try {
              const response = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tier })
              });

              const orderData = await response.json();

              if (!response.ok) {
                throw new Error(orderData.message || 'Failed to create order');
              }

              return orderData.id;
            } catch (err) {
              console.error('Order creation error:', err);
              onError?.(err.message);
              throw err;
            }
          },

          onApprove: async (data, actions) => {
            try {
              const response = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  orderId: data.orderID,
                  tier
                })
              });

              const captureData = await response.json();

              if (!response.ok || !captureData.success) {
                throw new Error(captureData.message || 'Failed to capture order');
              }

              onSuccess?.(captureData);
            } catch (err) {
              console.error('Capture error:', err);
              onError?.(err.message);
              throw err;
            }
          },

          onError: (err) => {
            console.error('PayPal error:', err);
            onError?.(err.message || 'An error occurred during payment');
          }
        }).render(containerRef.current);
      }
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [tier, token, onSuccess, onError]);

  return <div ref={containerRef} className="paypal-button-container"></div>;
};

export default PayPalButton;
