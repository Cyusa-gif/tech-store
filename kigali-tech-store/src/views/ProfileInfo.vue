<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useOrdersStore } from "@/stores/orders";
import { useWishlistStore } from "@/stores/wishlist";
import { useCartStore } from "@/stores/cart";
import { formatRWF } from "@/lib/format";

const auth = useAuthStore();
const orders = useOrdersStore();
const wishlist = useWishlistStore();
const cart = useCartStore();

const userOrders = computed(() => (auth.user ? orders.forUser(auth.user.id) : []));
const lifetimeSpend = computed(() =>
  userOrders.value.reduce((sum, o) => sum + o.total, 0),
);
</script>

<template>
  <div class="space-y-6">
    <div class="grid sm:grid-cols-3 gap-4">
      <div class="bg-white border border-line rounded-2xl p-5">
        <p class="text-xs uppercase tracking-wider text-ink-soft">Orders placed</p>
        <p class="font-display text-3xl font-extrabold mt-1">{{ userOrders.length }}</p>
      </div>
      <div class="bg-white border border-line rounded-2xl p-5">
        <p class="text-xs uppercase tracking-wider text-ink-soft">Lifetime spend</p>
        <p class="font-display text-3xl font-extrabold mt-1">{{ formatRWF(lifetimeSpend) }}</p>
      </div>
      <div class="bg-white border border-line rounded-2xl p-5">
        <p class="text-xs uppercase tracking-wider text-ink-soft">Saved for later</p>
        <p class="font-display text-3xl font-extrabold mt-1">{{ wishlist.count }}</p>
      </div>
    </div>

    <div class="bg-white border border-line rounded-2xl p-6">
      <h2 class="font-display font-extrabold text-lg">Account details</h2>
      <dl class="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <dt class="text-xs text-ink-soft uppercase tracking-wider">Name</dt>
          <dd class="mt-1 font-medium">{{ auth.user?.name }}</dd>
        </div>
        <div>
          <dt class="text-xs text-ink-soft uppercase tracking-wider">Email</dt>
          <dd class="mt-1 font-medium">{{ auth.user?.email }}</dd>
        </div>
        <div>
          <dt class="text-xs text-ink-soft uppercase tracking-wider">Customer ID</dt>
          <dd class="mt-1 font-mono text-xs">{{ auth.user?.id }}</dd>
        </div>
        <div>
          <dt class="text-xs text-ink-soft uppercase tracking-wider">Currently in cart</dt>
          <dd class="mt-1 font-medium">{{ cart.count }} item{{ cart.count === 1 ? "" : "s" }}</dd>
        </div>
      </dl>
    </div>

    <div class="bg-white border border-line rounded-2xl p-6">
      <div class="flex justify-between items-center mb-2">
        <h2 class="font-display font-extrabold text-lg">Recent orders</h2>
        <RouterLink to="/profile/orders" class="text-sm text-rwanda-blue font-semibold hover:underline">
          View all
        </RouterLink>
      </div>
      <p v-if="!userOrders.length" class="text-sm text-ink-soft">
        No orders yet. Once you check out, your orders will appear here.
      </p>
      <ul v-else class="divide-y divide-line">
        <li
          v-for="o in userOrders.slice(0, 3)"
          :key="o.id"
          class="py-3 flex items-center justify-between text-sm"
        >
          <div>
            <p class="font-semibold">{{ o.id }}</p>
            <p class="text-xs text-ink-soft">
              {{ new Date(o.date).toLocaleDateString() }} · {{ o.items.length }} item{{ o.items.length === 1 ? "" : "s" }}
            </p>
          </div>
          <p class="font-medium">{{ formatRWF(o.total) }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>
