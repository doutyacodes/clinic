import { NextRequest, NextResponse } from "next/server";
import { getPayUService } from "@/lib/utils/payu";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request, { params }) {
  try {
    const { txnId } = params;

    if (!txnId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    // Check our database first
    const existingPayment = await db.query.payments.findFirst({
      where: eq(payments.transactionId, txnId),
      with: {
        appointment: {
          with: {
            doctor: true,
            hospital: true,
            user: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (existingPayment) {
      return NextResponse.json({
        success: true,
        payment: {
          id: existingPayment.id,
          transactionId: existingPayment.transactionId,
          gatewayTransactionId: existingPayment.gatewayTransactionId,
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          status: existingPayment.status,
          gateway: existingPayment.gateway,
          paidAt: existingPayment.paidAt,
          failedAt: existingPayment.failedAt,
          failureReason: existingPayment.failureReason,
          appointment: existingPayment.appointment,
        },
      });
    }

    // If not found in database, check with PayU
    try {
      const payuService = getPayUService();
      const payuStatus = await payuService.checkTransactionStatus(txnId);

      return NextResponse.json({
        success: true,
        payuResponse: payuStatus,
        inDatabase: false,
        note: "Payment found in PayU but not in our database. This might be a pending transaction.",
      });
    } catch (payuError) {
      return NextResponse.json({
        success: false,
        error: "Transaction not found in database and PayU API call failed",
        inDatabase: false,
        payuError:
          payuError instanceof Error ? payuError.message : "Unknown PayU error",
      });
    }
  } catch (error) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}
