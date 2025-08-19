// app/payment/failure/page.jsx
'use client';

import { Suspense } from "react";
import PaymentFailurePage from "./PaymentFailurePage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentFailurePage />
    </Suspense>
  );
}
