<script setup lang="ts">
import { computed, ref, reactive, onMounted } from "vue";
import { RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useOrdersStore } from "@/stores/orders";
import { formatRWF } from "@/lib/format";
import type { Order } from "@/types";

const auth = useAuthStore();
const orders = useOrdersStore();

const expanded = ref<string | null>(null);
const activeTab = ref<"all" | "Processing" | "Shipped" | "Delivered">("all");

const userOrders = computed(() => (auth.user ? orders.forUser(auth.user.id) : []));

const filteredOrders = computed(() => {
  if (activeTab.value === "all") return userOrders.value;
  return userOrders.value.filter((o) => o.status === activeTab.value);
});

// Stats
const totalSpent = computed(() => userOrders.value.reduce((s, o) => s + o.total, 0));
const thisMonth = computed(() => {
  const now = new Date();
  return userOrders.value.filter((o) => {
    const d = new Date(o.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
});

// Live Stripe payment status per order (only for card orders with a paymentIntentId)
const stripeStatus = reactive<Record<string, { status: string; loading: boolean; error: string | null }>>({});

function statusLabel(s: string): string {
  return (
    {
      succeeded: "Paid",
      processing: "Processing",
      requires_action: "Needs action",
      requires_payment_method: "Payment failed",
      canceled: "Cancelled",
    }[s] ?? s
  );
}

function statusColor(s: string): string {
  return (
    {
      succeeded: "bg-rwanda-green/15 text-rwanda-green",
      processing: "bg-rwanda-yellow/30 text-amber-700",
      requires_action: "bg-orange-100 text-orange-700",
      requires_payment_method: "bg-red-50 text-red-600",
      canceled: "bg-gray-100 text-gray-500",
    }[s] ?? "bg-gray-100 text-gray-500"
  );
}

function orderStatusColor(s: Order["status"]): string {
  return {
    Processing: "bg-rwanda-yellow/30 text-amber-700",
    Shipped: "bg-rwanda-blue-light text-rwanda-blue-dark",
    Delivered: "bg-rwanda-green/15 text-rwanda-green",
  }[s];
}

async function fetchStripeStatus(order: Order) {
  if (!order.paymentIntentId) return;
  const id = order.paymentIntentId;
  if (stripeStatus[id]?.status || stripeStatus[id]?.loading) return;

  stripeStatus[id] = { status: "", loading: true, error: null };

  try {
    const res = await fetch(`/api/payments/status/${id}`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { status: string };
    stripeStatus[id] = { status: data.status, loading: false, error: null };
  } catch (err) {
    stripeStatus[id] = {
      status: "",
      loading: false,
      error: err instanceof Error ? err.message : "Failed",
    };
  }
}

async function refreshStatus(order: Order) {
  if (!order.paymentIntentId) return;
  const id = order.paymentIntentId;
  stripeStatus[id] = { status: "", loading: true, error: null };
  await fetchStripeStatus(order);
}

function toggle(order: Order) {
  if (expanded.value === order.id) {
    expanded.value = null;
  } else {
    expanded.value = order.id;
    void fetchStripeStatus(order);
  }
}

onMounted(() => {
  // Pre-fetch status for the first few orders that have a paymentIntentId
  userOrders.value.slice(0, 5).forEach((o) => {
    if (o.paymentIntentId) void fetchStripeStatus(o);
  });
});
</script>

<template>
  <div class="space-y-5">
    <!-- Stats strip -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div class="bg-white border border-line rounded-2xl p-4">
        <p class="text-xs text-ink-soft uppercase tracking-wider">Total orders</p>
        <p class="font-display text-3xl font-extrabold mt-1">{{ userOrders.length }}</p>
      </div>
      <div class="bg-white border border-line rounded-2xl p-4">
        <p class="text-xs text-ink-soft uppercase tracking-wider">Total spent</p>
        <p class="font-display text-2xl font-extrabold mt-1 truncate">{{ formatRWF(totalSpent) }}</p>
      </div>
      <div class="bg-white border border-line rounded-2xl p-4 col-span-2 sm:col-span-1">
        <p class="text-xs text-ink-soft uppercase tracking-wider">This month</p>
        <p class="font-display text-3xl font-extrabold mt-1">{{ thisMonth }}</p>
        <p class="text-xs text-ink-soft">order{{ thisMonth === 1 ? "" : "s" }}</p>
      </div>
    </div>

    <!-- Orders card -->
    <div class="bg-white border border-line rounded-2xl overflow-hidden">
      <div class="px-6 pt-5 pb-0 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-display font-extrabold text-lg">Order history</h2>
          <p class="text-ink-soft text-xs mt-0.5">{{ userOrders.length }} order{{ userOrders.length === 1 ? "" : "s" }} total</p>
        </div>
        <!-- Tab filter -->
        <nav class="flex gap-1 flex-wrap" aria-label="Filter orders">
          <button
            v-for="tab in ['all', 'Processing', 'Shipped', 'Delivered'] as const"
            :key="tab"
            type="button"
            class="px-3 py-1.5 rounded-full text-xs font-semibold transition"
            :class="
              activeTab === tab
                ? 'bg-ink text-white'
                : 'bg-paper-warm text-ink-soft hover:text-ink'
            "
            @click="activeTab = tab"
          >
            {{ tab === 'all' ? 'All' : tab }}
            <span class="ml-1 opacity-60">
              {{ tab === 'all' ? userOrders.length : userOrders.filter(o => o.status === tab).length }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Empty -->
      <div v-if="!userOrders.length" class="text-center py-16 px-6">
        <div class="w-14 h-14 rounded-full bg-paper-warm grid place-items-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-ink-soft">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
        <p class="font-semibold">No orders yet</p>
        <p class="text-sm text-ink-soft mt-1 mb-5">Your purchases will appear here.</p>
        <RouterLink to="/products" class="inline-block bg-rwanda-blue text-white rounded-full px-5 py-2.5 text-sm font-semibold">
          Start shopping
        </RouterLink>
      </div>

      <div v-else-if="!filteredOrders.length" class="text-center py-10 text-sm text-ink-soft">
        No orders with status "{{ activeTab }}".
      </div>

      <!-- Order list -->
      <ul v-else class="divide-y divide-line mt-4">
        <li v-for="o in filteredOrders" :key="o.id">
          <!-- Row header -->
          <button
            type="button"
            class="w-full flex items-start gap-4 px-6 py-4 hover:bg-paper-warm transition text-left"
            :aria-expanded="expanded === o.id"
            @click="toggle(o)"
          >
            <!-- Payment method icon -->
            <div class="mt-0.5 shrink-0 w-9 h-9 rounded-xl grid place-items-center"
              :class="o.paymentMethod === 'momo' ? 'bg-yellow-50' : 'bg-rwanda-blue-light'">
              <svg v-if="o.paymentMethod === 'momo'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber-600">
                <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-rwanda-blue">
                <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <p class="font-display font-extrabold text-sm">{{ o.id }}</p>
                <!-- Order status -->
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full" :class="orderStatusColor(o.status)">
                  {{ o.status }}
                </span>
                <!-- Live Stripe badge -->
                <template v-if="o.paymentIntentId">
                  <span v-if="stripeStatus[o.paymentIntentId]?.loading"
                    class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 animate-pulse">
                    Checking…
                  </span>
                  <span v-else-if="stripeStatus[o.paymentIntentId]?.status"
                    class="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    :class="statusColor(stripeStatus[o.paymentIntentId].status)">
                    Stripe: {{ statusLabel(stripeStatus[o.paymentIntentId].status) }}
                  </span>
                </template>
              </div>
              <p class="text-xs text-ink-soft mt-0.5">
                {{ new Date(o.date).toLocaleDateString("en-RW", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) }}
                · {{ o.items.length }} item{{ o.items.length === 1 ? "" : "s" }}
              </p>
            </div>

            <div class="flex items-center gap-3 shrink-0">
              <span class="font-semibold text-sm">{{ formatRWF(o.total) }}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                class="text-ink-soft transition-transform duration-200"
                :class="{ 'rotate-180': expanded === o.id }">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
          </button>

          <!-- Expanded detail -->
          <div v-if="expanded === o.id" class="border-t border-line bg-paper-warm/50">
            <div class="px-6 py-5 space-y-5">

              <!-- Live Stripe status panel -->
              <div v-if="o.paymentIntentId" class="rounded-xl border border-line bg-white p-4">
                <div class="flex items-center justify-between mb-3">
                  <p class="text-xs font-semibold uppercase tracking-wider text-ink-soft">Live payment status</p>
                  <button
                    type="button"
                    class="text-xs font-medium text-rwanda-blue hover:underline flex items-center gap-1"
                    :disabled="stripeStatus[o.paymentIntentId]?.loading"
                    @click.stop="refreshStatus(o)"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                      :class="{ 'animate-spin': stripeStatus[o.paymentIntentId]?.loading }">
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                      <path d="M8 16H3v5"/><path d="M16 3h5v5"/>
                    </svg>
                    Refresh
                  </button>
                </div>
                <div class="flex items-center gap-3">
                  <div v-if="stripeStatus[o.paymentIntentId]?.loading" class="text-sm text-ink-soft animate-pulse">Fetching from Stripe…</div>
                  <template v-else-if="stripeStatus[o.paymentIntentId]?.status">
                    <span class="text-sm font-semibold px-3 py-1 rounded-full"
                      :class="statusColor(stripeStatus[o.paymentIntentId].status)">
                      {{ statusLabel(stripeStatus[o.paymentIntentId].status) }}
                    </span>
                    <span class="text-xs text-ink-soft font-mono">{{ o.paymentIntentId }}</span>
                  </template>
                  <div v-else-if="stripeStatus[o.paymentIntentId]?.error" class="text-xs text-red-500">
                    {{ stripeStatus[o.paymentIntentId].error }}
                  </div>
                </div>
              </div>

              <!-- Delivery address -->
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-2">Delivery</p>
                <div class="rounded-xl bg-white border border-line p-3 text-sm">
                  <p class="font-semibold">{{ o.address.fullName }}</p>
                  <p class="text-ink-soft text-xs mt-0.5">{{ o.address.phone }}</p>
                  <p class="text-ink-soft text-xs">{{ o.address.street }}, {{ o.address.district }}, {{ o.address.city }}</p>
                  <p v-if="o.address.notes" class="text-ink-soft text-xs italic mt-1">"{{ o.address.notes }}"</p>
                </div>
              </div>

              <!-- Items -->
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-2">Items ordered</p>
                <ul class="space-y-2">
                  <li v-for="i in o.items" :key="i.id"
                    class="flex items-center gap-3 bg-white border border-line rounded-xl p-3">
                    <div class="w-12 h-12 bg-paper-warm rounded-lg p-1.5 grid place-items-center shrink-0">
                      <img :src="i.image" :alt="i.title" class="max-h-full max-w-full object-contain mix-blend-multiply" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs line-clamp-2">{{ i.title }}</p>
                      <p class="text-[11px] text-ink-soft mt-0.5">Qty: {{ i.qty }}</p>
                    </div>
                    <span class="text-sm font-semibold shrink-0">{{ formatRWF(i.price * i.qty) }}</span>
                  </li>
                </ul>
              </div>

              <!-- Totals -->
              <div class="bg-white border border-line rounded-xl p-4">
                <dl class="space-y-1.5 text-sm">
                  <div class="flex justify-between text-ink-soft">
                    <dt>Subtotal</dt>
                    <dd>{{ formatRWF(o.total - o.shipping - o.tax) }}</dd>
                  </div>
                  <div class="flex justify-between text-ink-soft">
                    <dt>Shipping</dt>
                    <dd>{{ o.shipping ? formatRWF(o.shipping) : "Free" }}</dd>
                  </div>
                  <div class="flex justify-between text-ink-soft">
                    <dt>VAT (18%)</dt>
                    <dd>{{ formatRWF(o.tax) }}</dd>
                  </div>
                  <div class="border-t border-line pt-2 flex justify-between font-display font-extrabold text-base">
                    <dt>Total</dt>
                    <dd>{{ formatRWF(o.total) }}</dd>
                  </div>
                </dl>
              </div>

            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
