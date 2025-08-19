// app/payment/initaite/page.jsx
'use client';

import { Suspense } from "react";
import PaymentInitiatePage from "./PaymentInitiatePage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentInitiatePage />
    </Suspense>
  );
}
