<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useProductsStore } from "@/stores/products";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { useToast } from "@/composables/useToast";
import { categoryLabel, formatRWF, RWF_PER_USD } from "@/lib/format";
import StarRating from "@/components/StarRating.vue";
import ProductCard from "@/components/ProductCard.vue";
import Spinner from "@/components/Spinner.vue";

const props = defineProps<{ id: string | number }>();
const products = useProductsStore();
const cart = useCartStore();
const wishlist = useWishlistStore();
const toast = useToast();
const router = useRouter();

const qty = ref(1);
const selectedImage = ref(0);

const product = computed(() => products.byId(Number(props.id)));

watch(
  () => props.id,
  () => {
    qty.value = 1;
    selectedImage.value = 0;
  },
);

const related = computed(() => {
  if (!product.value) return [];
  return products
    .inCategory(product.value.category)
    .filter((p) => p.id !== product.value!.id)
    .slice(0, 4);
});

// Build a "gallery" by reusing the main image with subtle visual variants
const gallery = computed(() => {
  if (!product.value) return [];
  return [product.value.image, product.value.image, product.value.image];
});

function addToCart() {
  if (!product.value) return;
  cart.add(product.value, qty.value);
  toast.success(`Added ${qty.value} × to cart`);
}

function buyNow() {
  if (!product.value) return;
  cart.add(product.value, qty.value);
  router.push("/checkout");
}

function toggleWish() {
  if (!product.value) return;
  const added = wishlist.toggle(product.value);
  toast.info(added ? "Saved to wishlist" : "Removed from wishlist");
}

const reviews = computed(() => {
  if (!product.value) return [];
  const seed = product.value.id;
  const names = ["Aline U.", "Eric M.", "Patricia I.", "Jean-Paul N.", "Sandrine K."];
  const phrases = [
    "Arrived in Kigali in 2 days. Perfectly packed.",
    "Solid value for the price. Recommended.",
    "Quality matches the description—happy customer.",
    "Customer support sorted my question fast.",
    "I would buy from KTS again.",
  ];
  const count = Math.min(3, names.length);
  return Array.from({ length: count }, (_, i) => ({
    name: names[(seed + i) % names.length],
    text: phrases[(seed + i) % phrases.length],
    rate: Math.min(5, Math.round(product.value!.rating.rate + (i % 2 === 0 ? 0 : -0.5))),
    date: ["3 days ago", "1 week ago", "2 weeks ago"][i],
  }));
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <div v-if="products.loading && !product" class="py-20 grid place-items-center">
      <Spinner :size="36" />
    </div>

    <div v-else-if="!product" class="py-20 text-center">
      <p class="font-display text-2xl font-extrabold">Product not found</p>
      <p class="text-ink-soft mt-1">It may have been removed or moved.</p>
      <RouterLink
        to="/products"
        class="inline-block mt-4 bg-ink text-white rounded-full px-5 py-2 text-sm font-semibold"
        >Back to shop</RouterLink
      >
    </div>

    <template v-else>
      <nav class="text-xs text-ink-soft mb-3 flex flex-wrap items-center gap-1.5" aria-label="Breadcrumb">
        <RouterLink to="/" class="hover:text-rwanda-blue">Home</RouterLink>
        <span>/</span>
        <RouterLink to="/products" class="hover:text-rwanda-blue">Shop</RouterLink>
        <span>/</span>
        <RouterLink
          :to="{ name: 'products-category', params: { category: product.category } }"
          class="hover:text-rwanda-blue"
          >{{ categoryLabel(product.category) }}</RouterLink
        >
        <span>/</span>
        <span class="text-ink font-medium line-clamp-1">{{ product.title }}</span>
      </nav>

      <div class="grid lg:grid-cols-2 gap-10">
        <!-- Gallery -->
        <div>
          <div class="bg-white border border-line rounded-3xl p-8 aspect-square grid place-items-center">
            <img
              :src="gallery[selectedImage]"
              :alt="product.title"
              class="max-h-full max-w-full object-contain mix-blend-multiply"
            />
          </div>
          <div class="mt-3 flex gap-3">
            <button
              v-for="(img, i) in gallery"
              :key="i"
              type="button"
              @click="selectedImage = i"
              :aria-label="`View image ${i + 1}`"
              class="w-20 h-20 bg-white border-2 rounded-xl p-2 transition"
              :class="selectedImage === i ? 'border-rwanda-blue' : 'border-line hover:border-ink-soft'"
            >
              <img :src="img" alt="" class="w-full h-full object-contain mix-blend-multiply" />
            </button>
          </div>
        </div>

        <!-- Info -->
        <div>
          <span
            class="inline-block text-[10px] uppercase tracking-widest font-bold text-rwanda-blue bg-rwanda-blue-light px-2 py-1 rounded-full"
          >
            {{ categoryLabel(product.category) }}
          </span>
          <h1 class="mt-3 font-display text-2xl md:text-3xl font-extrabold leading-tight">
            {{ product.title }}
          </h1>
          <div class="mt-3 flex items-center gap-3">
            <StarRating :rate="product.rating.rate" :count="product.rating.count" size="md" />
            <span class="text-xs text-ink-soft">·</span>
            <a href="#reviews" class="text-xs font-medium text-rwanda-blue hover:underline">
              Read reviews
            </a>
          </div>

          <div class="mt-5 flex items-baseline gap-3">
            <span class="font-display text-3xl font-extrabold text-ink">
              {{ formatRWF(product.price) }}
            </span>
            <span class="text-sm text-ink-soft">≈ ${{ product.price.toFixed(2) }} USD</span>
          </div>
          <p class="text-xs text-ink-soft mt-1">VAT included · Free delivery in Kigali</p>

          <p class="mt-6 text-ink-soft leading-relaxed text-sm">{{ product.description }}</p>

          <div class="mt-6 flex items-center gap-3">
            <div
              class="flex items-center gap-1 bg-paper-warm rounded-full p-1 border border-line"
              role="group"
              aria-label="Quantity"
            >
              <button
                type="button"
                @click="qty = Math.max(1, qty - 1)"
                class="w-9 h-9 grid place-items-center rounded-full hover:bg-white"
                aria-label="Decrease quantity"
              >
                –
              </button>
              <span class="w-8 text-center text-sm font-bold">{{ qty }}</span>
              <button
                type="button"
                @click="qty = Math.min(99, qty + 1)"
                class="w-9 h-9 grid place-items-center rounded-full hover:bg-white"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button
              type="button"
              @click="addToCart"
              class="flex-1 bg-rwanda-blue hover:bg-rwanda-blue-dark text-white rounded-full px-6 py-3 font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
              </svg>
              Add to cart
            </button>
            <button
              type="button"
              @click="toggleWish"
              class="w-12 h-12 grid place-items-center rounded-full border border-line bg-white hover:border-red-400 transition"
              :aria-pressed="wishlist.has(product.id)"
              aria-label="Toggle wishlist"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                :fill="wishlist.has(product.id) ? '#dc2626' : 'none'"
                stroke="currentColor"
                stroke-width="2"
                :class="wishlist.has(product.id) ? 'text-red-600' : 'text-ink-soft'"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            @click="buyNow"
            class="mt-3 w-full bg-ink hover:bg-rwanda-green text-white rounded-full px-6 py-3 font-semibold text-sm transition"
          >
            Buy now
          </button>

          <ul class="mt-8 grid grid-cols-2 gap-3 text-xs text-ink-soft">
            <li class="bg-white border border-line rounded-lg p-3">
              <p class="font-semibold text-ink">Free delivery</p>
              <p>1–2 days in Kigali</p>
            </li>
            <li class="bg-white border border-line rounded-lg p-3">
              <p class="font-semibold text-ink">14-day returns</p>
              <p>Hassle-free</p>
            </li>
            <li class="bg-white border border-line rounded-lg p-3">
              <p class="font-semibold text-ink">Local warranty</p>
              <p>12 months on electronics</p>
            </li>
            <li class="bg-white border border-line rounded-lg p-3">
              <p class="font-semibold text-ink">Secure payment</p>
              <p>Stripe-protected</p>
            </li>
          </ul>
        </div>
      </div>

      <!-- Reviews -->
      <section id="reviews" class="mt-16 bg-white border border-line rounded-3xl p-6 md:p-10">
        <div class="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 class="font-display text-xl md:text-2xl font-extrabold">Customer reviews</h2>
            <p class="text-ink-soft text-sm">Verified after delivery in Kigali.</p>
          </div>
          <div class="text-right">
            <div class="font-display text-3xl font-extrabold">
              {{ product.rating.rate.toFixed(1) }}
              <span class="text-base text-ink-soft font-medium">/ 5</span>
            </div>
            <StarRating :rate="product.rating.rate" :count="product.rating.count" size="sm" />
          </div>
        </div>
        <ul class="grid md:grid-cols-3 gap-4">
          <li v-for="r in reviews" :key="r.name" class="bg-paper-warm rounded-xl p-4">
            <div class="flex items-center justify-between">
              <p class="font-semibold text-sm">{{ r.name }}</p>
              <span class="text-[11px] text-ink-soft">{{ r.date }}</span>
            </div>
            <StarRating :rate="r.rate" size="sm" class="mt-1" />
            <p class="mt-2 text-sm text-ink-soft">{{ r.text }}</p>
          </li>
        </ul>
      </section>

      <!-- Related -->
      <section v-if="related.length" class="mt-16">
        <h2 class="font-display text-xl md:text-2xl font-extrabold mb-4">You might also like</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ProductCard v-for="p in related" :key="p.id" :product="p" />
        </div>
      </section>
    </template>
  </div>
</template>
