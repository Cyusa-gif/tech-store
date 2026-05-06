import Stripe from "stripe";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY in environment");
  if (key.startsWith("sk_test_your")) {
    throw new Error(
      "STRIPE_SECRET_KEY is a placeholder. Put real test secret key in Vercel environment variables.",
    );
  }
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { amountRwf, currency = "rwf", orderId = "" } = req.body ?? {};

    if (typeof amountRwf !== "number" || amountRwf <= 0) {
      return res.status(400).json({ error: "amountRwf must be a positive number" });
    }

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amountRwf),
      currency: String(currency).toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: String(orderId ?? "") },
    });

    return res.status(200).json({ clientSecret: intent.client_secret, paymentIntentId: intent.id });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
}

