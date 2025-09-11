// src/app/api/razorpay/route.ts
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
    const { amount } = await request.json();

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        return NextResponse.json({ error: "Razorpay credentials are not configured." }, { status: 500 });
    }

    const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });

    const options = {
        amount, // amount in the smallest currency unit (paise)
        currency: "INR",
        receipt: `receipt_order_${randomBytes(4).toString('hex')}`,
    };

    try {
        const order = await razorpay.orders.create(options);
        return NextResponse.json({ order });
    } catch (error) {
        console.error("Razorpay order creation failed:", error);
        return NextResponse.json({ error: "Failed to create Razorpay order." }, { status: 500 });
    }
}
