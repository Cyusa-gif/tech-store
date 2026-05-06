<script setup lang="ts">
import { computed, ref, reactive, onMounted } from "vue";
import { useOrdersStore } from "@/stores/orders";
import { formatRWF } from "@/lib/format";
import type { Order } from "@/types";

const orders = useOrdersStore();

const activeTab = ref<"all" | Order["status"]>("all");
const expanded = ref<string | null>(null);
const search = ref("");

const STATUS_FLOW: Order["status"][] = ["Processing", "Shipped", "Delivered"];

const allOrders = computed(() => orders.allOrders);

const filtered = computed(() => {
  let list = allOrders.value;
  if (activeTab.value !== "all") list = list.filter((o) => o.status === activeTab.value);
  if (search.value.trim()) {
    const q = search.value.toLowerCase();
    list = list.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.address.fullName.toLowerCase().includes(q) ||
        o.address.phone.includes(q),
    );
  }
  return list;
});

// Stats
const totalRevenue = computed(() => allOrders.value.reduce((s, o) => s + o.total, 0));
const countByStatus = computed(() => ({
  Processing: allOrders.value.filter((o) => o.status === "Processing").length,
  Shipped: allOrders.value.filter((o) => o.status === "Shipped").length,
  Delivered: allOrders.value.filter((o) => o.status === "Delivered").length,
}));
const todayCount = computed(() => {
  const today = new Date().toDateString();
  return allOrders.value.filter((o) => new Date(o.date).toDateString() === today).length;
});

// Live Stripe status cache
const stripeStatus = reactive<Record<string, { status: string; loading: boolean; error: string | null }>>({});

function statusLabel(s: string) {
  return ({ succeeded: "Paid", processing: "Processing", requires_action: "Needs action", requires_payment_method: "Payment failed", canceled: "Cancelled" })[s] ?? s;
}
function stripeColor(s: string) {
  return ({ succeeded: "bg-rwanda-green/15 text-rwanda-green", processing: "bg-rwanda-yellow/30 text-amber-700", requires_action: "bg-orange-100 text-orange-700", requires_payment_method: "bg-red-50 text-red-600", canceled: "bg-gray-100 text-gray-500" })[s] ?? "bg-gray-100 text-gray-500";
}
function orderStatusColor(s: Order["status"]) {
  return ({ Processing: "bg-rwanda-yellow/30 text-amber-700", Shipped: "bg-rwanda-blue-light text-rwanda-blue-dark", Delivered: "bg-rwanda-green/15 text-rwanda-green" })[s];
}
function nextStatus(s: Order["status"]): Order["status"] | null {
  const i = STATUS_FLOW.indexOf(s);
  return i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null;
}

async function fetchStripeStatus(piId: string, force = false) {
  if (!piId.startsWith("pi_")) return;
  if (!force && (stripeStatus[piId]?.status || stripeStatus[piId]?.loading)) return;
  stripeStatus[piId] = { status: "", loading: true, error: null };
  try {
    const base = (import.meta.env.BASE_URL as string ?? "/").replace(/\/$/, "");
    const res = await fetch(`${base}/api/payments/status/${piId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { status: string };
    stripeStatus[piId] = { status: data.status, loading: false, error: null };
  } catch (err) {
    stripeStatus[piId] = { status: "", loading: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

function toggle(o: Order & { userId: string }) {
  if (expanded.value === o.id) { expanded.value = null; return; }
  expanded.value = o.id;
  if (o.paymentIntentId) void fetchStripeStatus(o.paymentIntentId);
}

function advance(o: Order & { userId: string }) {
  const next = nextStatus(o.status);
  if (!next) return;
  orders.updateOrderStatus(o.userId, o.id, next);
}

onMounted(() => {
  allOrders.value.slice(0, 10).forEach((o) => {
    if (o.paymentIntentId) void fetchStripeStatus(o.paymentIntentId);
  });
});
</script>

<template>
  <div class="min-h-screen bg-paper-warm">
    <!-- Admin top bar -->
    <div class="bg-ink text-white">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="w-7 h-7 rounded-md bg-rwanda-yellow grid place-items-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-ink">
              <path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </span>
          <div>
            <p class="font-display font-extrabold text-sm leading-none">Admin Panel</p>
            <p class="text-[11px] text-white/60 mt-0.5">Kigali Tech Store · Order management</p>
          </div>
        </div>
        <RouterLink to="/" class="text-xs text-white/60 hover:text-white transition flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
          Back to store
        </RouterLink>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-8 space-y-6">

      <!-- Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white border border-line rounded-2xl p-5">
          <p class="text-xs text-ink-soft uppercase tracking-wider">Total orders</p>
          <p class="font-display text-4xl font-extrabold mt-1">{{ allOrders.length }}</p>
        </div>
        <div class="bg-white border border-line rounded-2xl p-5">
          <p class="text-xs text-ink-soft uppercase tracking-wider">Total revenue</p>
          <p class="font-display text-2xl font-extrabold mt-1 truncate">{{ formatRWF(totalRevenue) }}</p>
        </div>
        <div class="bg-white border border-line rounded-2xl p-5">
          <p class="text-xs text-ink-soft uppercase tracking-wider">Pending shipment</p>
          <p class="font-display text-4xl font-extrabold mt-1 text-amber-600">{{ countByStatus.Processing }}</p>
        </div>
        <div class="bg-white border border-line rounded-2xl p-5">
          <p class="text-xs text-ink-soft uppercase tracking-wider">Today</p>
          <p class="font-display text-4xl font-extrabold mt-1 text-rwanda-blue">{{ todayCount }}</p>
          <p class="text-xs text-ink-soft">new order{{ todayCount === 1 ? "" : "s" }}</p>
        </div>
      </div>

      <!-- Status pipeline -->
      <div class="grid grid-cols-3 gap-3">
        <div v-for="s in STATUS_FLOW" :key="s"
          class="bg-white border border-line rounded-2xl p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl grid place-items-center shrink-0"
            :class="{ 'bg-rwanda-yellow/20': s === 'Processing', 'bg-rwanda-blue-light': s === 'Shipped', 'bg-rwanda-green/15': s === 'Delivered' }">
            <svg v-if="s === 'Processing'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber-600">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <svg v-else-if="s === 'Shipped'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-rwanda-blue">
              <rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-rwanda-green">
              <path d="m5 12 5 5L20 7"/>
            </svg>
          </div>
          <div>
            <p class="text-xs text-ink-soft">{{ s }}</p>
            <p class="font-display text-2xl font-extrabold">{{ countByStatus[s] }}</p>
          </div>
        </div>
      </div>

      <!-- Orders table -->
      <div class="bg-white border border-line rounded-2xl overflow-hidden">
        <div class="px-6 pt-5 pb-4 flex flex-wrap items-center justify-between gap-4 border-b border-line">
          <h2 class="font-display font-extrabold text-lg">All orders</h2>
          <div class="flex flex-wrap items-center gap-3">
            <!-- Search -->
            <div class="flex items-center bg-paper-warm rounded-full pl-3 pr-1 py-1 gap-2 border border-transparent focus-within:border-rwanda-blue focus-within:bg-white transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-ink-soft shrink-0">
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                v-model="search"
                type="search"
                placeholder="Search by order ID or name…"
                class="bg-transparent outline-none text-xs w-44"
              />
            </div>
            <!-- Tabs -->
            <nav class="flex gap-1">
              <button
                v-for="tab in ['all', ...STATUS_FLOW] as const"
                :key="tab"
                type="button"
                class="px-3 py-1.5 rounded-full text-xs font-semibold transition"
                :class="activeTab === tab ? 'bg-ink text-white' : 'bg-paper-warm text-ink-soft hover:text-ink'"
                @click="activeTab = tab"
              >
                {{ tab === 'all' ? 'All' : tab }}
                <span class="ml-1 opacity-60">
                  {{ tab === 'all' ? allOrders.length : countByStatus[tab as Order['status']] }}
                </span>
              </button>
            </nav>
          </div>
        </div>

        <!-- Empty -->
        <div v-if="!allOrders.length" class="text-center py-20 text-ink-soft">
          <svg class="mx-auto mb-4 text-ink-soft/40" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
          </svg>
          <p class="font-semibold">No orders yet</p>
          <p class="text-sm mt-1">Orders will appear here once customers check out.</p>
        </div>
        <div v-else-if="!filtered.length" class="py-12 text-center text-sm text-ink-soft">
          No orders match the current filter.
        </div>

        <ul v-else class="divide-y divide-line">
          <li v-for="o in filtered" :key="o.id">
            <!-- Row -->
            <button
              type="button"
              class="w-full flex flex-wrap items-center gap-4 px-6 py-4 hover:bg-paper-warm/60 transition text-left"
              :aria-expanded="expanded === o.id"
              @click="toggle(o)"
            >
              <!-- ID + name -->
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="font-display font-extrabold text-sm">{{ o.id }}</p>
                  <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full" :class="orderStatusColor(o.status)">
                    {{ o.status }}
                  </span>
                  <!-- Live Stripe badge -->
                  <template v-if="o.paymentIntentId">
                    <span v-if="stripeStatus[o.paymentIntentId]?.loading"
                      class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 animate-pulse">
                      Stripe…
                    </span>
                    <span v-else-if="stripeStatus[o.paymentIntentId]?.status"
                      class="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      :class="stripeColor(stripeStatus[o.paymentIntentId].status)">
                      {{ statusLabel(stripeStatus[o.paymentIntentId].status) }}
                    </span>
                  </template>
                </div>
                <p class="text-xs text-ink-soft mt-0.5">
                  {{ o.address.fullName }} ·
                  {{ new Date(o.date).toLocaleDateString("en-RW", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) }}
                </p>
              </div>

              <!-- Amount -->
              <span class="font-semibold text-sm shrink-0">{{ formatRWF(o.total) }}</span>

              <!-- Advance button -->
              <button
                v-if="nextStatus(o.status)"
                type="button"
                class="shrink-0 flex items-center gap-1.5 bg-rwanda-blue hover:bg-rwanda-blue-dark text-white text-xs font-semibold rounded-full px-3 py-1.5 transition"
                @click.stop="advance(o)"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
                Mark {{ nextStatus(o.status) }}
              </button>
              <span v-else class="shrink-0 text-[10px] font-semibold text-rwanda-green bg-rwanda-green/10 px-3 py-1.5 rounded-full">
                Complete
              </span>

              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                class="text-ink-soft transition-transform duration-200 shrink-0"
                :class="{ 'rotate-180': expanded === o.id }">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>

            <!-- Expanded -->
            <div v-if="expanded === o.id" class="border-t border-line bg-paper-warm/40">
              <div class="px-6 py-5 grid md:grid-cols-2 gap-6">

                <!-- Left: Payment + Address -->
                <div class="space-y-4">
                  <!-- Stripe status panel -->
                  <div v-if="o.paymentIntentId" class="bg-white border border-line rounded-xl p-4">
                    <div class="flex items-center justify-between mb-3">
                      <p class="text-xs font-semibold uppercase tracking-wider text-ink-soft">Stripe payment</p>
                      <button
                        type="button"
                        class="text-xs font-medium text-rwanda-blue hover:underline flex items-center gap-1"
                        :disabled="stripeStatus[o.paymentIntentId]?.loading"
                        @click="fetchStripeStatus(o.paymentIntentId!, true)"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                          :class="{ 'animate-spin': stripeStatus[o.paymentIntentId]?.loading }">
                          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                          <path d="M8 16H3v5"/><path d="M16 3h5v5"/>
                        </svg>
                        Refresh
                      </button>
                    </div>
                    <div v-if="stripeStatus[o.paymentIntentId]?.loading" class="text-xs text-ink-soft animate-pulse">Fetching…</div>
                    <template v-else-if="stripeStatus[o.paymentIntentId]?.status">
                      <span class="text-sm font-semibold px-3 py-1 rounded-full"
                        :class="stripeColor(stripeStatus[o.paymentIntentId].status)">
                        {{ statusLabel(stripeStatus[o.paymentIntentId].status) }}
                      </span>
                      <p class="mt-2 text-[11px] font-mono text-ink-soft break-all">{{ o.paymentIntentId }}</p>
                    </template>
                    <div v-else-if="stripeStatus[o.paymentIntentId]?.error" class="text-xs text-red-500">
                      {{ stripeStatus[o.paymentIntentId].error }}
                    </div>
                  </div>
                  <div v-else class="bg-white border border-line rounded-xl p-4 text-xs text-ink-soft">
                    {{ o.paymentMethod === 'momo' ? 'Paid via mobile money' : 'Demo / no Stripe key' }}
                  </div>

                  <!-- Delivery -->
                  <div class="bg-white border border-line rounded-xl p-4">
                    <p class="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-2">Delivery</p>
                    <p class="font-semibold text-sm">{{ o.address.fullName }}</p>
                    <p class="text-xs text-ink-soft">{{ o.address.phone }}</p>
                    <p class="text-xs text-ink-soft">{{ o.address.street }}, {{ o.address.district }}, {{ o.address.city }}</p>
                    <p v-if="o.address.notes" class="text-xs text-ink-soft italic mt-1">"{{ o.address.notes }}"</p>
                  </div>

                  <!-- Status advancement -->
                  <div class="bg-white border border-line rounded-xl p-4">
                    <p class="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-3">Order status</p>
                    <ol class="flex items-center gap-2">
                      <li v-for="(s, i) in STATUS_FLOW" :key="s" class="flex items-center gap-2">
                        <div class="flex flex-col items-center gap-1">
                          <div class="w-7 h-7 rounded-full grid place-items-center border-2 text-xs font-bold transition"
                            :class="
                              STATUS_FLOW.indexOf(o.status) >= i
                                ? 'bg-rwanda-green border-rwanda-green text-white'
                                : 'bg-white border-line text-ink-soft'
                            ">
                            {{ STATUS_FLOW.indexOf(o.status) > i ? '✓' : i + 1 }}
                          </div>
                          <p class="text-[10px] text-ink-soft whitespace-nowrap">{{ s }}</p>
                        </div>
                        <div v-if="i < 2" class="w-8 h-px mb-5" :class="STATUS_FLOW.indexOf(o.status) > i ? 'bg-rwanda-green' : 'bg-line'"></div>
                      </li>
                    </ol>
                    <button
                      v-if="nextStatus(o.status)"
                      type="button"
                      class="mt-4 w-full bg-rwanda-blue hover:bg-rwanda-blue-dark text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition flex items-center justify-center gap-2"
                      @click="advance(o)"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="m9 18 6-6-6-6"/>
                      </svg>
                      Advance to "{{ nextStatus(o.status) }}"
                    </button>
                    <p v-else class="mt-4 text-center text-xs text-rwanda-green font-semibold">Order completed</p>
                  </div>
                </div>

                <!-- Right: Items + Totals -->
                <div class="space-y-4">
                  <div class="bg-white border border-line rounded-xl p-4">
                    <p class="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-3">
                      Items ({{ o.items.length }})
                    </p>
                    <ul class="space-y-2">
                      <li v-for="item in o.items" :key="item.id" class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-paper-warm rounded-lg p-1 grid place-items-center shrink-0">
                          <img :src="item.image" :alt="item.title" class="max-h-full max-w-full object-contain mix-blend-multiply" />
                        </div>
                        <p class="flex-1 text-xs line-clamp-2 min-w-0">{{ item.title }}</p>
                        <span class="text-xs text-ink-soft">×{{ item.qty }}</span>
                        <span class="text-xs font-semibold shrink-0">{{ formatRWF(item.price * item.qty) }}</span>
                      </li>
                    </ul>
                  </div>

                  <div class="bg-white border border-line rounded-xl p-4">
                    <dl class="space-y-1.5 text-sm">
                      <div class="flex justify-between text-ink-soft">
                        <dt>Subtotal</dt><dd>{{ formatRWF(o.total - o.shipping - o.tax) }}</dd>
                      </div>
                      <div class="flex justify-between text-ink-soft">
                        <dt>Shipping</dt><dd>{{ o.shipping ? formatRWF(o.shipping) : "Free" }}</dd>
                      </div>
                      <div class="flex justify-between text-ink-soft">
                        <dt>VAT (18%)</dt><dd>{{ formatRWF(o.tax) }}</dd>
                      </div>
                      <div class="border-t border-line pt-2 flex justify-between font-display font-extrabold">
                        <dt>Total</dt><dd>{{ formatRWF(o.total) }}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
