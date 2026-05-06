<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { useOrdersStore } from "@/stores/orders";
import { useAuthStore } from "@/stores/auth";
import { formatRWF } from "@/lib/format";

const props = defineProps<{ orderId: string }>();
const auth = useAuthStore();
const orders = useOrdersStore();

const order = computed(() => {
  if (!auth.user) return null;
  return orders.forUser(auth.user.id).find((o) => o.id === props.orderId) ?? null;
});
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-16">
    <div class="text-center">
      <div class="mx-auto w-20 h-20 rounded-full bg-rwanda-green text-white grid place-items-center">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="m5 12 5 5L20 7" />
        </svg>
      </div>
      <h1 class="mt-6 font-display text-3xl md:text-4xl font-extrabold">
        Murakoze! Your order is confirmed
      </h1>
      <p class="text-ink-soft mt-2">
        Thank you for shopping with Kigali Tech Store.
      </p>
    </div>

    <div v-if="order" class="mt-10 bg-white border border-line rounded-2xl p-6 md:p-8">
      <div class="flex flex-wrap justify-between gap-3 text-sm">
        <div>
          <p class="text-xs text-ink-soft uppercase tracking-wider">Order number</p>
          <p class="font-display font-extrabold text-lg">{{ order.id }}</p>
        </div>
        <div>
          <p class="text-xs text-ink-soft uppercase tracking-wider">Total paid</p>
          <p class="font-display font-extrabold text-lg">{{ formatRWF(order.total) }}</p>
        </div>
        <div>
          <p class="text-xs text-ink-soft uppercase tracking-wider">Status</p>
          <p class="inline-flex items-center gap-2 mt-1">
            <span class="w-2 h-2 rounded-full bg-rwanda-yellow animate-pulse"></span>
            <span class="font-semibold text-sm">{{ order.status }}</span>
          </p>
        </div>
      </div>

      <div class="border-t border-line my-6"></div>

      <h3 class="text-sm font-semibold mb-3">Delivery to</h3>
      <p class="text-sm">
        {{ order.address.fullName }} · {{ order.address.phone }}<br />
        <span class="text-ink-soft">{{ order.address.street }}, {{ order.address.district }}, {{ order.address.city }}</span>
      </p>

      <h3 class="text-sm font-semibold mt-6 mb-3">Items</h3>
      <ul class="space-y-3">
        <li v-for="i in order.items" :key="i.id" class="flex gap-3 items-center text-sm">
          <div class="w-12 h-12 bg-paper-warm rounded-lg p-1 grid place-items-center">
            <img :src="i.image" :alt="i.title" class="max-h-full max-w-full object-contain mix-blend-multiply" />
          </div>
          <p class="flex-1 line-clamp-2">{{ i.title }}</p>
          <span class="text-ink-soft">×{{ i.qty }}</span>
          <span class="font-medium">{{ formatRWF(i.price * i.qty) }}</span>
        </li>
      </ul>
    </div>

    <div class="mt-8 flex flex-wrap gap-3 justify-center">
      <RouterLink
        to="/profile/orders"
        class="bg-ink hover:bg-rwanda-blue text-white rounded-full px-6 py-3 text-sm font-semibold transition"
        >View order history</RouterLink
      >
      <RouterLink
        to="/products"
        class="bg-white border border-line hover:border-rwanda-blue rounded-full px-6 py-3 text-sm font-semibold"
        >Continue shopping</RouterLink
      >
    </div>
  </div>
</template>
