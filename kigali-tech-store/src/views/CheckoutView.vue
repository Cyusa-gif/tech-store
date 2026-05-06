<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { loadStripe, type Stripe, type StripeElements, type StripeCardElement } from "@stripe/stripe-js";
import { useCartStore } from "@/stores/cart";
import { useAuthStore } from "@/stores/auth";
import { useOrdersStore } from "@/stores/orders";
import { useToast } from "@/composables/useToast";
import { formatRWF, toRWF } from "@/lib/format";

import type { ShippingAddress, Order } from "@/types";

const cart = useCartStore();
const auth = useAuthStore();
const orders = useOrdersStore();
const toast = useToast();
const router = useRouter();

type Step = 1 | 2 | 3;
const step = ref<Step>(1);

const address = reactive<ShippingAddress>({
  fullName: auth.user?.name ?? "",
  phone: "",
  street: "",
  district: "Gasabo",
  city: "Kigali",
  notes: "",
});

const paymentMethod = ref<"card" | "momo">("card");
const momo = reactive({ provider: "MTN", phone: "" });

const stripeKey = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined) ?? "";
const stripe = ref<Stripe | null>(null);
const elements = ref<StripeElements | null>(null);
const cardElement = ref<StripeCardElement | null>(null);
const cardMounted = ref(false);
const cardError = ref<string | null>(null);
const cardComplete = ref(false);
const stripeReady = ref(false);

const processing = ref(false);
const errors = reactive<Record<string, string>>({});

// Demo card fields (used when no real Stripe key is configured)
const demoCard = reactive({ number: "4242 4242 4242 4242", expiry: "12/29", cvc: "123" });

function validateAddress(): boolean {
  for (const k of Object.keys(errors)) delete errors[k];
  if (!address.fullName.trim()) errors.fullName = "Required";
  if (!/^(\+?2507|07)\d{8}$/.test(address.phone.replace(/\s/g, "")))
    errors.phone = "Use a Rwandan mobile (e.g. 0788123456)";
  if (!address.street.trim()) errors.street = "Required";
  if (!address.district) errors.district = "Required";
  if (!address.city.trim()) errors.city = "Required";
  return Object.keys(errors).length === 0;
}

function nextStep() {
  if (step.value === 1) {
    if (!validateAddress()) {
      toast.error("Please complete all required fields");
      return;
    }
    step.value = 2;
  } else if (step.value === 2) {
    step.value = 3;
    if (paymentMethod.value === "card") void mountCard();
  }
}

async function mountCard() {
  if (!stripeKey) {
    stripeReady.value = false;
    return;
  }
  try {
    if (!stripe.value) {
      stripe.value = await loadStripe(stripeKey);
    }
    if (!stripe.value) {
      stripeReady.value = false;
      return;
    }
    stripeReady.value = true;
    if (!elements.value) {
      elements.value = stripe.value.elements();
    }
    if (!cardMounted.value) {
      const card = elements.value.create("card", {
        style: {
          base: {
            color: "#0f1724",
            fontSize: "15px",
            fontFamily: "Inter, system-ui, sans-serif",
            "::placeholder": { color: "#9aa3b2" },
          },
          invalid: { color: "#dc2626" },
        },
      });
      cardElement.value = card;
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const target = document.getElementById("kts-card-element");
      if (target) {
        card.mount(target);
        cardMounted.value = true;
        card.on("change", (e) => {
          cardError.value = e.error ? e.error.message : null;
          cardComplete.value = e.complete;
        });
      }
    }
  } catch {
    stripeReady.value = false;
  }
}

onBeforeUnmount(() => {
  if (cardElement.value) {
    try { cardElement.value.unmount(); } catch {}
  }
});

/**
 * Ask the backend to create a PaymentIntent and return the client secret.
 * The backend charges the cart total in RWF (a zero-decimal Stripe currency).
 */
async function createPaymentIntent(orderId: string): Promise<string> {
  // Vercel-friendly: call same-origin backend routes.
  const url = `/api/payments/create-payment-intent`;


  // Helps debug “Could not reach the payment server” in production.
  console.log("[payments] createPaymentIntent url:", url);


  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amountRwf: Math.round(toRWF(cart.total)),
      currency: "rwf",
      orderId,
    }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    const msg = body.error ?? `Payment server error (status ${res.status})`;
    throw new Error(msg);
  }


  const data = (await res.json()) as { clientSecret: string };
  if (!data.clientSecret) throw new Error("No client secret returned from server");
  return data.clientSecret;
}

async function placeOrder() {
  if (processing.value) return;
  processing.value = true;

  const orderId = "KTS-" + Date.now().toString(36).toUpperCase();
  let confirmedPaymentIntentId: string | undefined;

  try {
    if (paymentMethod.value === "card") {
      if (stripeReady.value && stripe.value && cardElement.value) {
        if (!cardComplete.value) {
          toast.error("Please complete the card details");
          processing.value = false;
          return;
        }

        // 1. Ask backend to create a PaymentIntent
        let clientSecret: string;
        try {
          clientSecret = await createPaymentIntent(orderId);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Payment server error");
          processing.value = false;
          return;
        }

        // 2. Confirm the card payment with Stripe — this triggers 3-D Secure if needed
        const { error, paymentIntent } = await stripe.value.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement.value,
            billing_details: {
              name: address.fullName,
              phone: address.phone,
            },
          },
        });

        if (error) {
          toast.error(error.message ?? "Card was declined");
          processing.value = false;
          return;
        }

        if (paymentIntent?.status !== "succeeded") {
          toast.error("Payment was not completed. Please try again.");
          processing.value = false;
          return;
        }

        // Persist the PaymentIntent ID so the dashboard can look up live status
        confirmedPaymentIntentId = paymentIntent.id;
      } else {
        // Demo fallback — no Stripe key configured
        if (!demoCard.cvc) {
          toast.error("Please complete the card details");
          processing.value = false;
          return;
        }
        await new Promise((r) => setTimeout(r, 900));
      }
    } else {
      // Mobile money — simulated STK push
      if (!/^07\d{8}$/.test(momo.phone.replace(/\s/g, ""))) {
        toast.error("Enter a valid mobile money number");
        processing.value = false;
        return;
      }
      await new Promise((r) => setTimeout(r, 1200));
    }

    const order: Order = {
      id: orderId,
      date: new Date().toISOString(),
      items: [...cart.items],
      total: cart.total,
      shipping: cart.shipping,
      tax: cart.tax,
      address: { ...address },
      status: "Processing",
      paymentIntentId: confirmedPaymentIntentId,
      paymentMethod: paymentMethod.value,
    };
    if (auth.user) orders.addOrder(auth.user.id, order);
    cart.clear();
    toast.success("Payment successful — your order is on its way");
    router.replace({ name: "order-success", params: { orderId: order.id } });
  } finally {
    processing.value = false;
  }
}

const districts = [
  "Gasabo", "Kicukiro", "Nyarugenge",
  "Bugesera", "Rwamagana", "Musanze", "Huye",
];

onMounted(() => {
  if (stripeKey) {
    loadStripe(stripeKey)
      .then((s) => {
        stripe.value = s;
        stripeReady.value = !!s;
      })
      .catch(() => (stripeReady.value = false));
  }
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <h1 class="font-display text-3xl md:text-4xl font-extrabold mb-2">Checkout</h1>

    <!-- Stepper -->
    <ol class="flex items-center gap-2 text-xs font-medium text-ink-soft mb-8 mt-4">
      <li
        v-for="(label, i) in ['Address', 'Payment method', 'Review & pay']"
        :key="label"
        class="flex items-center gap-2"
      >
        <span
          class="w-7 h-7 rounded-full grid place-items-center font-bold border-2 transition"
          :class="
            step > i + 1
              ? 'bg-rwanda-green text-white border-rwanda-green'
              : step === i + 1
                ? 'bg-rwanda-blue text-white border-rwanda-blue'
                : 'bg-white text-ink-soft border-line'
          "
        >
          {{ step > i + 1 ? "✓" : i + 1 }}
        </span>
        <span :class="{ 'text-ink font-semibold': step === i + 1 }">{{ label }}</span>
        <span v-if="i < 2" class="w-8 h-px bg-line"></span>
      </li>
    </ol>

    <div class="grid lg:grid-cols-[1fr_360px] gap-8">
      <section class="bg-white border border-line rounded-2xl p-6 md:p-8">
        <!-- Step 1: Address -->
        <div v-if="step === 1">
          <h2 class="font-display text-xl font-extrabold mb-4">Delivery address</h2>
          <div class="grid sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="text-xs font-semibold text-ink-soft" for="fullName">Full name</label>
              <input
                id="fullName"
                v-model="address.fullName"
                type="text"
                autocomplete="name"
                class="mt-1 w-full bg-paper-warm rounded-lg px-3 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rwanda-blue"
              />
              <p v-if="errors.fullName" class="text-red-600 text-xs mt-1">{{ errors.fullName }}</p>
            </div>
            <div>
              <label class="text-xs font-semibold text-ink-soft" for="phone">Phone</label>
              <input
                id="phone"
                v-model="address.phone"
                type="tel"
                autocomplete="tel"
                placeholder="0788 123 456"
                class="mt-1 w-full bg-paper-warm rounded-lg px-3 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rwanda-blue"
              />
              <p v-if="errors.phone" class="text-red-600 text-xs mt-1">{{ errors.phone }}</p>
            </div>
            <div>
              <label class="text-xs font-semibold text-ink-soft" for="city">City</label>
              <input
                id="city"
                v-model="address.city"
                type="text"
                class="mt-1 w-full bg-paper-warm rounded-lg px-3 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rwanda-blue"
              />
            </div>
            <div>
              <label class="text-xs font-semibold text-ink-soft" for="district">District</label>
              <select
                id="district"
                v-model="address.district"
                class="mt-1 w-full bg-paper-warm rounded-lg px-3 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rwanda-blue"
              >
                <option v-for="d in districts" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-semibold text-ink-soft" for="street">Street / sector</label>
              <input
                id="street"
                v-model="address.street"
                type="text"
                placeholder="KG 11 Ave, Kacyiru"
                class="mt-1 w-full bg-paper-warm rounded-lg px-3 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rwanda-blue"
              />
              <p v-if="errors.street" class="text-red-600 text-xs mt-1">{{ errors.street }}</p>
            </div>
            <div class="sm:col-span-2">
              <label class="text-xs font-semibold text-ink-soft" for="notes">Delivery notes (optional)</label>
              <textarea
                id="notes"
                v-model="address.notes"
                rows="2"
                class="mt-1 w-full bg-paper-warm rounded-lg px-3 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rwanda-blue"
              ></textarea>
            </div>
          </div>
          <button
            type="button"
            class="mt-6 bg-rwanda-blue hover:bg-rwanda-blue-dark text-white font-semibold rounded-full px-6 py-3 text-sm transition"
            @click="nextStep"
          >
            Continue to payment →
          </button>
        </div>

        <!-- Step 2: Payment method -->
        <div v-else-if="step === 2">
          <h2 class="font-display text-xl font-extrabold mb-4">Choose payment method</h2>
          <div class="grid sm:grid-cols-2 gap-3">
            <label
              class="bg-paper-warm hover:bg-white border-2 rounded-2xl p-4 cursor-pointer transition"
              :class="paymentMethod === 'card' ? 'border-rwanda-blue bg-white' : 'border-transparent'"
            >
              <input type="radio" v-model="paymentMethod" value="card" class="sr-only" />
              <div class="flex items-center justify-between">
                <span class="font-semibold text-sm">Credit / Debit card</span>
                <span class="flex gap-1">
                  <span class="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">VISA</span>
                  <span class="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">MC</span>
                </span>
              </div>
              <p class="text-xs text-ink-soft mt-1">Secured by Stripe · 3-D Secure supported</p>
            </label>
            <label
              class="bg-paper-warm hover:bg-white border-2 rounded-2xl p-4 cursor-pointer transition"
              :class="paymentMethod === 'momo' ? 'border-rwanda-blue bg-white' : 'border-transparent'"
            >
              <input type="radio" v-model="paymentMethod" value="momo" class="sr-only" />
              <div class="flex items-center justify-between">
                <span class="font-semibold text-sm">Mobile money</span>
                <span class="flex gap-1">
                  <span class="bg-yellow-500 text-ink text-[9px] font-bold px-1.5 py-0.5 rounded">MTN</span>
                  <span class="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Airtel</span>
                </span>
              </div>
              <p class="text-xs text-ink-soft mt-1">Pay via STK push to your phone</p>
            </label>
          </div>

          <div class="mt-6 flex gap-2">
            <button type="button" class="text-sm text-ink-soft hover:text-ink px-4 py-3" @click="step = 1">
              ← Back
            </button>
            <button
              type="button"
              class="ml-auto bg-rwanda-blue hover:bg-rwanda-blue-dark text-white font-semibold rounded-full px-6 py-3 text-sm transition"
              @click="nextStep"
            >
              Continue →
            </button>
          </div>
        </div>

        <!-- Step 3: Review & Pay -->
        <div v-else>
          <h2 class="font-display text-xl font-extrabold mb-4">Review & pay</h2>

          <div class="bg-paper-warm rounded-xl p-4 text-sm space-y-1">
            <p class="font-semibold">{{ address.fullName }} · {{ address.phone }}</p>
            <p class="text-ink-soft">{{ address.street }}, {{ address.district }}, {{ address.city }}</p>
            <button type="button" class="text-xs font-medium text-rwanda-blue hover:underline mt-1" @click="step = 1">
              Edit address
            </button>
          </div>

          <div class="mt-5">
            <h3 class="text-sm font-semibold mb-2">Payment</h3>

            <!-- Card payment -->
            <div v-if="paymentMethod === 'card'">
              <!-- Real Stripe Elements (key configured) -->
              <div v-if="stripeReady" class="bg-paper-warm border border-line rounded-xl p-4">
                <div id="kts-card-element" class="bg-white rounded-lg p-3 border border-line min-h-[44px]"></div>
                <p v-if="cardError" class="text-red-600 text-xs mt-2">{{ cardError }}</p>
                <p v-else class="text-[11px] text-ink-soft mt-2">
                  Your card is processed securely by Stripe. Test card: 4242 4242 4242 4242.
                </p>
              </div>
              <!-- Demo fallback (no key) -->
              <div v-else class="bg-paper-warm border border-line rounded-xl p-4 space-y-3">
                <div class="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  </svg>
                  <p class="text-[11px] font-medium">Demo mode — add <code>VITE_STRIPE_PUBLISHABLE_KEY</code> to enable real payments</p>
                </div>
                <div>
                  <label class="text-xs font-semibold text-ink-soft">Card number</label>
                  <input v-model="demoCard.number" type="text" class="mt-1 w-full bg-white border border-line rounded-lg px-3 py-2 text-sm font-mono" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="text-xs font-semibold text-ink-soft">Expiry</label>
                    <input v-model="demoCard.expiry" type="text" class="mt-1 w-full bg-white border border-line rounded-lg px-3 py-2 text-sm font-mono" />
                  </div>
                  <div>
                    <label class="text-xs font-semibold text-ink-soft">CVC</label>
                    <input v-model="demoCard.cvc" type="text" class="mt-1 w-full bg-white border border-line rounded-lg px-3 py-2 text-sm font-mono" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Mobile money -->
            <div v-else class="bg-paper-warm border border-line rounded-xl p-4 space-y-3">
              <div class="flex gap-2">
                <button
                  v-for="p in ['MTN', 'Airtel']"
                  :key="p"
                  type="button"
                  @click="momo.provider = p"
                  class="flex-1 px-3 py-2 rounded-lg text-sm font-semibold border-2 transition"
                  :class="momo.provider === p ? 'border-rwanda-blue bg-white' : 'border-transparent bg-white/60 text-ink-soft'"
                >
                  {{ p }} Money
                </button>
              </div>
              <div>
                <label class="text-xs font-semibold text-ink-soft">Mobile money number</label>
                <input
                  v-model="momo.phone"
                  type="tel"
                  placeholder="0788 123 456"
                  class="mt-1 w-full bg-white border border-line rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <p class="text-[11px] text-ink-soft">You'll receive an STK push to authorize the payment.</p>
            </div>
          </div>

          <div class="mt-6 flex gap-2 items-center">
            <button type="button" class="text-sm text-ink-soft hover:text-ink px-4 py-3" @click="step = 2">
              ← Back
            </button>
            <button
              type="button"
              :disabled="processing"
              class="ml-auto bg-rwanda-green hover:bg-rwanda-green-light text-white font-semibold rounded-full px-8 py-3 text-sm transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              @click="placeOrder"
            >
              <svg v-if="processing" width="16" height="16" viewBox="0 0 24 24" class="spinner">
                <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="3" />
                <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" />
              </svg>
              {{ processing ? "Processing…" : `Pay ${formatRWF(cart.total)}` }}
            </button>
          </div>
        </div>
      </section>

      <!-- Order summary -->
      <aside class="bg-white border border-line rounded-2xl p-6 h-fit lg:sticky lg:top-24">
        <h2 class="font-display font-extrabold text-lg mb-4">Order summary</h2>
        <ul class="space-y-3 max-h-72 overflow-auto pr-1">
          <li v-for="item in cart.items" :key="item.id" class="flex gap-3 text-sm">
            <div class="relative w-12 h-12 bg-paper-warm rounded-lg p-1 grid place-items-center shrink-0">
              <img :src="item.image" :alt="item.title" class="max-h-full max-w-full object-contain mix-blend-multiply" />
              <span class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink text-white text-[10px] font-bold grid place-items-center">{{ item.qty }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="line-clamp-2 text-xs">{{ item.title }}</p>
            </div>
            <span class="font-medium text-xs whitespace-nowrap">{{ formatRWF(item.price * item.qty) }}</span>
          </li>
        </ul>
        <div class="border-t border-line my-4"></div>
        <dl class="space-y-1.5 text-sm">
          <div class="flex justify-between"><dt class="text-ink-soft">Subtotal</dt><dd>{{ formatRWF(cart.subtotal) }}</dd></div>
          <div class="flex justify-between"><dt class="text-ink-soft">Shipping</dt><dd>{{ cart.shipping ? formatRWF(cart.shipping) : "Free" }}</dd></div>
          <div class="flex justify-between"><dt class="text-ink-soft">VAT (18%)</dt><dd>{{ formatRWF(cart.tax) }}</dd></div>
        </dl>
        <div class="border-t border-line my-3"></div>
        <div class="flex justify-between items-baseline">
          <span class="text-sm font-medium">Total</span>
          <span class="font-display text-2xl font-extrabold">{{ formatRWF(cart.total) }}</span>
        </div>
      </aside>
    </div>
  </div>
</template>
