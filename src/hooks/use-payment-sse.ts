/**
 * Hook for SSE payment status updates
 */

import {
  createPaymentSSE,
  type PaymentStatus,
} from "@/src/services/trip.service";
import { useEffect, useRef, useState } from "react";
import EventSource from "react-native-sse";

export function usePaymentSSE(ticketId: string | null, token: string | null) {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!ticketId) return;

    const handleMessage = (data: PaymentStatus) => {
      console.log("usePaymentSSE received message:", data);
      setStatus(data);
    };

    const handleError = (err: Error) => {
      console.error("usePaymentSSE error:", err);
      setError(err.message);
    };

    console.log("usePaymentSSE: creating SSE with token:", !!token);
    eventSourceRef.current = createPaymentSSE(
      ticketId,
      token,
      handleMessage,
      handleError,
    );

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [ticketId, token]);

  return { status, error };
}
