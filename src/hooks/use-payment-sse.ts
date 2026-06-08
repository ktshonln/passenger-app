/**
 * Hook for SSE payment status updates
 */

import {
    createPaymentSSE,
    type PaymentStatus,
} from "@/src/services/trip.service";
import { useEffect, useRef, useState } from "react";

export function usePaymentSSE(ticketId: string | null) {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!ticketId) return;

    const handleMessage = (data: PaymentStatus) => {
      setStatus(data);
    };

    const handleError = (err: Error) => {
      setError(err.message);
    };

    eventSourceRef.current = createPaymentSSE(
      ticketId,
      handleMessage,
      handleError,
    );

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [ticketId]);

  return { status, error };
}
