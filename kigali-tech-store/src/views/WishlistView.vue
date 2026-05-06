<script setup lang="ts">
import { RouterLink } from "vue-router";
import { useWishlistStore } from "@/stores/wishlist";
import { useCartStore } from "@/stores/cart";
import { useToast } from "@/composables/useToast";
import { formatRWF, shortTitle } from "@/lib/format";

const wishlist = useWishlistStore();
const cart = useCartStore();
const toast = useToast();

function moveToCart(id: number) {
  const p = wishlist.items.find((i) => i.id === id);
  if (!p) return;
  cart.add(p);
  wishlist.remove(id);
  toast.success(`Moved "${shortTitle(p.title, 30)}" to cart`);
}

function moveAll() {
  const items = [...wishlist.items];
  items.forEach((p) => cart.add(p));
  wishlist.clear();
  toast.success(`Moved ${items.length} item${items.length === 1 ? "" : "s"} to cart`);
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <div class="flex flex-wrap justify-between items-end gap-4 mb-8">
      <div>
        <h1 class="font-display text-3xl md:text-4xl font-extrabold">Your wishlist</h1>
        <p class="text-ink-soft text-sm mt-1">
          {{ wishlist.count }} saved item{{ wishlist.count === 1 ? "" : "s" }}
        </p>
      </div>
      <button
        v-if="wishlist.count"
        type="button"
        class="bg-ink hover:bg-rwanda-green text-white text-sm font-semibold rounded-full px-5 py-2.5 transition"
        @click="moveAll"
      >
        Move all to cart
      </button>
    </div>

    <div v-if="!wishlist.items.length" class="bg-white border border-line rounded-3xl p-12 text-center">
      <div class="mx-auto w-20 h-20 rounded-full bg-paper-warm grid place-items-center text-4xl">
        💛
      </div>
      <p class="mt-4 font-display text-xl font-extrabold">Nothing saved yet</p>
      <p class="text-ink-soft text-sm mt-1">
        Tap the heart on any product to bookmark it for later.
      </p>
      <RouterLink
        to="/products"
        class="inline-block mt-5 bg-rwanda-blue text-white rounded-full px-6 py-3 font-semibold text-sm"
        >Discover products</RouterLink
      >
    </div>

    <ul v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <li
        v-for="item in wishlist.items"
        :key="item.id"
        class="bg-white border border-line rounded-2xl p-4 flex gap-4"
      >
        <RouterLink
          :to="{ name: 'product-detail', params: { id: item.id } }"
          class="w-24 h-24 bg-paper-warm rounded-xl p-2 grid place-items-center shrink-0"
        >
          <img :src="item.image" :alt="item.title" class="max-h-full max-w-full object-contain mix-blend-multiply" />
        </RouterLink>
        <div class="flex-1 min-w-0 flex flex-col">
          <RouterLink
            :to="{ name: 'product-detail', params: { id: item.id } }"
            class="text-sm font-semibold hover:text-rwanda-blue line-clamp-2"
            >{{ item.title }}</RouterLink
          >
          <p class="font-display font-extrabold mt-1">{{ formatRWF(item.price) }}</p>
          <div class="mt-auto flex gap-2">
            <button
              type="button"
              class="flex-1 bg-rwanda-blue hover:bg-rwanda-blue-dark text-white text-xs font-semibold rounded-full py-2"
              @click="moveToCart(item.id)"
            >
              Move to cart
            </button>
            <button
              type="button"
              class="text-xs text-ink-soft hover:text-red-600 px-2"
              @click="wishlist.remove(item.id)"
              aria-label="Remove from wishlist"
            >
              Remove
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
