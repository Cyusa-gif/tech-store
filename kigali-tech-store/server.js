/**
 * Kigali Tech Store — backend server
 * Handles Stripe PaymentIntent creation and webhook verification.
 *
 * Run:  node server.js
 * Env:  STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET (optional)
 */

import express from "express";
import cors from "cors";
import Stripe from "stripe";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// ---------------------------------------------------------------------------
// Load .env manually (no dotenv dependency needed — Node 20.6+ handles it via
// --env-file flag in the npm scripts, but we also support older Node here)
// ---------------------------------------------------------------------------
try {
  const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), ".env");
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = val;
  }
} catch {
  // .env not found — rely on real environment variables
}

const PORT = Number(process.env.SERVER_PORT ?? 3001);

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.startsWith("sk_test_your")) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Add it to .env to enable real card payments.",
    );
  }
  return new Stripe(key, { apiVersion: "2025-04-30" });
}

const app = express();
app.use(cors());

// Stripe webhook needs the raw body before JSON parsing
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

// ---------------------------------------------------------------------------
// POST /api/payments/create-payment-intent
// Body: { amountRwf: number, currency?: string, orderId?: string }
// ---------------------------------------------------------------------------
app.post("/api/payments/create-payment-intent", async (req, res) => {
  try {
    const { amountRwf, currency = "rwf", orderId = "" } = req.body;
    if (typeof amountRwf !== "number" || amountRwf <= 0) {
      return res.status(400).json({ error: "amountRwf must be a positive number" });
    }
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amountRwf),
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: { orderId },
    });
    console.log(`[stripe] PaymentIntent created: ${intent.id} — RWF ${amountRwf}`);
    res.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id });
  } catch (err) {
    console.error("[stripe] create-payment-intent error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/payments/status/:paymentIntentId
// ---------------------------------------------------------------------------
app.get("/api/payments/status/:paymentIntentId", async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    if (!paymentIntentId.startsWith("pi_")) {
      return res.status(400).json({ error: "Invalid paymentIntentId" });
    }
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    res.json({
      paymentIntentId: intent.id,
      status: intent.status,
      amount: intent.amount,
      currency: intent.currency,
      created: intent.created,
    });
  } catch (err) {
    console.error("[stripe] status-fetch error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/payments/webhook
// ---------------------------------------------------------------------------
app.post("/api/payments/webhook", (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || webhookSecret.startsWith("whsec_your")) {
    // No secret configured — just acknowledge
    return res.json({ received: true });
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe] webhook verification failed:", err.message);
    return res.status(400).json({ error: err.message });
  }

  if (event.type === "payment_intent.succeeded") {
    console.log(`[stripe] Payment succeeded: ${event.data.object.id}`);
  } else if (event.type === "payment_intent.payment_failed") {
    console.warn(`[stripe] Payment failed: ${event.data.object.id}`);
  }

  res.json({ received: true });
});

// Health check
app.get("/api/healthz", (_req, res) => res.json({ status: "ok" }));

// 404
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  const hasKey = !!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith("sk_test_your");
  console.log(`\n🚀  Kigali Tech Store backend`);
  console.log(`   Listening on http://localhost:${PORT}`);
  console.log(`   Stripe: ${hasKey ? "✅  key configured" : "⚠️   no key — demo mode only"}\n`);
});
