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

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const sig = req.headers["stripe-signature"] as string | undefined;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret || webhookSecret.startsWith("whsec_your")) {
      return res.status(200).json({ received: true });
    }


    // In Vercel/Next API routes bodyParser:false gives a raw buffer in req.body
    const rawBody = req.body;

    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(rawBody, sig ?? "", webhookSecret);

    if (event.type === "payment_intent.succeeded") {
      console.log(`[stripe] succeeded: ${event.data.object.id}`);
    } else if (event.type === "payment_intent.payment_failed") {
      console.warn(`[stripe] failed: ${event.data.object.id}`);
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message ?? "Webhook verification failed" });
  }
}

