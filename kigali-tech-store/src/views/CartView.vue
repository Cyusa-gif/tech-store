<script setup lang="ts">
import { RouterLink, useRouter } from "vue-router";
import { useCartStore } from "@/stores/cart";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";
import { formatRWF, shortTitle } from "@/lib/format";

const cart = useCartStore();
const auth = useAuthStore();
const toast = useToast();
const router = useRouter();

function checkout() {
  if (!cart.items.length) return;
  if (!auth.isAuthenticated) {
    toast.info("Please sign in to complete your purchase");
    router.push({ name: "login", query: { redirect: "/checkout" } });
    return;
  }
  router.push("/checkout");
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <h1 class="font-display text-3xl md:text-4xl font-extrabold mb-2">Your cart</h1>
    <p class="text-ink-soft text-sm mb-8">
      {{ cart.count }} item{{ cart.count === 1 ? "" : "s" }} ready for checkout
    </p>

    <div v-if="!cart.items.length" class="bg-white border border-line rounded-3xl p-12 text-center">
      <div class="mx-auto w-20 h-20 rounded-full bg-paper-warm grid place-items-center text-4xl">
        🛒
      </div>
      <p class="mt-4 font-display text-xl font-extrabold">Your cart is empty</p>
      <p class="text-ink-soft text-sm mt-1">
        Browse the shop and add a few favorites to get started.
      </p>
      <RouterLink
        to="/products"
        class="inline-block mt-5 bg-rwanda-blue text-white rounded-full px-6 py-3 font-semibold text-sm"
        >Start shopping</RouterLink
      >
    </div>

    <div v-else class="grid lg:grid-cols-[1fr_360px] gap-8">
      <ul class="space-y-3">
        <li
          v-for="item in cart.items"
          :key="item.id"
          class="bg-white border border-line rounded-2xl p-4 flex gap-4"
        >
          <RouterLink
            :to="{ name: 'product-detail', params: { id: item.id } }"
            class="w-20 h-20 md:w-24 md:h-24 bg-paper-warm rounded-xl p-2 grid place-items-center shrink-0"
          >
            <img :src="item.image" :alt="item.title" class="max-h-full max-w-full object-contain mix-blend-multiply" />
          </RouterLink>
          <div class="flex-1 min-w-0">
            <RouterLink
              :to="{ name: 'product-detail', params: { id: item.id } }"
              class="text-sm font-semibold hover:text-rwanda-blue line-clamp-2"
              >{{ item.title }}</RouterLink
            >
            <p class="text-xs text-ink-soft mt-1">{{ formatRWF(item.price) }} each</p>
            <div class="mt-3 flex items-center justify-between">
              <div class="flex items-center bg-paper-warm rounded-full p-1 border border-line" role="group" aria-label="Quantity">
                <button
                  class="w-7 h-7 rounded-full hover:bg-white"
                  @click="cart.setQty(item.id, item.qty - 1)"
                  :aria-label="`Decrease ${shortTitle(item.title, 20)} quantity`"
                >
                  –
                </button>
                <span class="w-8 text-center text-sm font-bold">{{ item.qty }}</span>
                <button
                  class="w-7 h-7 rounded-full hover:bg-white"
                  @click="cart.setQty(item.id, item.qty + 1)"
                  :aria-label="`Increase ${shortTitle(item.title, 20)} quantity`"
                >
                  +
                </button>
              </div>
              <button
                @click="cart.remove(item.id)"
                class="text-xs font-medium text-ink-soft hover:text-red-600"
              >
                Remove
              </button>
            </div>
          </div>
          <div class="text-right hidden md:block">
            <p class="font-display font-extrabold">{{ formatRWF(item.price * item.qty) }}</p>
          </div>
        </li>
      </ul>

      <aside class="bg-white border border-line rounded-2xl p-6 h-fit lg:sticky lg:top-24">
        <h2 class="font-display font-extrabold text-lg">Order summary</h2>
        <dl class="mt-4 space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-ink-soft">Subtotal</dt>
            <dd class="font-medium">{{ formatRWF(cart.subtotal) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-ink-soft">Shipping</dt>
            <dd class="font-medium">
              {{ cart.shipping ? formatRWF(cart.shipping) : "Free" }}
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-ink-soft">VAT (18%)</dt>
            <dd class="font-medium">{{ formatRWF(cart.tax) }}</dd>
          </div>
        </dl>
        <div class="border-t border-line my-4"></div>
        <div class="flex justify-between items-baseline">
          <span class="text-sm font-medium">Total</span>
          <span class="font-display text-2xl font-extrabold">{{ formatRWF(cart.total) }}</span>
        </div>
        <button
          type="button"
          @click="checkout"
          class="mt-5 w-full bg-rwanda-blue hover:bg-rwanda-blue-dark text-white font-semibold rounded-full py-3 transition"
        >
          Proceed to checkout
        </button>
        <RouterLink
          to="/products"
          class="mt-2 block text-center text-xs font-medium text-ink-soft hover:text-rwanda-blue"
          >Continue shopping</RouterLink
        >
        <p class="mt-4 text-[11px] text-ink-soft leading-relaxed">
          Secure checkout with Stripe. We accept Visa, Mastercard and local mobile money.
        </p>
      </aside>
    </div>
  </div>
</template>
