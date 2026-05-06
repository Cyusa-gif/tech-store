<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";
import type { Product } from "@/types";
import { formatRWF, shortTitle, categoryLabel } from "@/lib/format";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { useToast } from "@/composables/useToast";
import StarRating from "@/components/StarRating.vue";

const props = defineProps<{ product: Product }>();
const cart = useCartStore();
const wishlist = useWishlistStore();
const toast = useToast();
const heartPulse = ref(false);

function addToCart() {
  cart.add(props.product);
  toast.success(`Added "${shortTitle(props.product.title, 30)}" to cart`);
}

function toggleWish() {
  const added = wishlist.toggle(props.product);
  heartPulse.value = true;
  setTimeout(() => (heartPulse.value = false), 400);
  toast.info(added ? "Saved to wishlist" : "Removed from wishlist");
}
</script>

<template>
  <article class="group bg-white rounded-2xl border border-line overflow-hidden lift flex flex-col">
    <RouterLink
      :to="{ name: 'product-detail', params: { id: product.id } }"
      class="relative block aspect-square bg-paper-warm p-6"
      :aria-label="`View ${product.title}`"
    >
      <img
        :src="product.image"
        :alt="product.title"
        loading="lazy"
        class="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
      />
      <span
        class="absolute top-3 left-3 text-[10px] uppercase tracking-wider font-bold bg-white/90 backdrop-blur px-2 py-1 rounded-full text-ink-soft"
        >{{ categoryLabel(product.category) }}</span
      >
    </RouterLink>
    <div class="p-4 flex-1 flex flex-col gap-2">
      <RouterLink
        :to="{ name: 'product-detail', params: { id: product.id } }"
        class="text-sm font-semibold leading-snug text-ink hover:text-rwanda-blue line-clamp-2 min-h-[2.5rem]"
        >{{ product.title }}</RouterLink
      >
      <div class="flex items-center justify-between">
        <StarRating :rate="product.rating.rate" :count="product.rating.count" size="sm" />
        <button
          type="button"
          @click="toggleWish"
          class="p-1.5 -mr-1 rounded-full hover:bg-paper-warm"
          :aria-pressed="wishlist.has(product.id)"
          :aria-label="wishlist.has(product.id) ? 'Remove from wishlist' : 'Add to wishlist'"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            :fill="wishlist.has(product.id) ? '#dc2626' : 'none'"
            stroke="currentColor"
            stroke-width="2"
            :class="{ 'text-red-600': wishlist.has(product.id), 'text-ink-soft': !wishlist.has(product.id), 'heart-pulse': heartPulse }"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>
      </div>
      <div class="mt-auto flex items-end justify-between gap-2 pt-2">
        <div>
          <div class="font-display font-extrabold text-ink text-base leading-none">
            {{ formatRWF(product.price) }}
          </div>
          <div class="text-[10px] text-ink-soft mt-1">incl. VAT</div>
        </div>
        <button
          type="button"
          @click="addToCart"
          class="bg-ink hover:bg-rwanda-blue text-white text-xs font-semibold rounded-full px-3 py-2 transition flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add
        </button>
      </div>
    </div>
  </article>
</template>
