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
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const paymentIntentId = req.query?.paymentIntentId as string | undefined;

    if (!paymentIntentId || typeof paymentIntentId !== "string" || !paymentIntentId.startsWith("pi_")) {
      return res.status(400).json({ error: "Invalid paymentIntentId" });
    }

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return res.status(200).json({
      paymentIntentId: intent.id,
      status: intent.status,
      amount: intent.amount,
      currency: intent.currency,
      created: intent.created,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
}

