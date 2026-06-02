import { Suspense } from "react";
import PaymentClient from "@/components/billing/PaymentClient";

export default function PaymentPage() {
  return (
    <Suspense fallback={null}>
      <PaymentClient />
    </Suspense>
  );
}
