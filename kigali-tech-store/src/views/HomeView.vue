<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { useProductsStore } from "@/stores/products";
import { categoryLabel } from "@/lib/format";
import ProductCard from "@/components/ProductCard.vue";
import Spinner from "@/components/Spinner.vue";

const products = useProductsStore();
const featured = computed(() => products.featured);

const categoryArt: Record<string, { color: string; emoji: string }> = {
  electronics: { color: "from-rwanda-blue/15 to-rwanda-blue/5", emoji: "📱" },
  jewelery: { color: "from-rwanda-yellow/30 to-rwanda-yellow/5", emoji: "💎" },
  "men's clothing": { color: "from-rwanda-green/15 to-rwanda-green/5", emoji: "👔" },
  "women's clothing": { color: "from-pink-200/40 to-pink-100/10", emoji: "👗" },
};

function art(slug: string) {
  return categoryArt[slug] ?? { color: "from-paper-warm to-white", emoji: "🛍" };
}
</script>

<template>
  <div>
  <!-- Hero -->
  <section class="relative overflow-hidden bg-gradient-to-br from-rwanda-blue via-rwanda-blue-dark to-rwanda-green">
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute -right-24 -bottom-24 w-[480px] h-[480px] rounded-full bg-rwanda-yellow/30 blur-3xl"></div>
      <div class="absolute -left-32 -top-20 w-[420px] h-[420px] rounded-full bg-white/10 blur-3xl"></div>
    </div>
    <div class="max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
      <div class="text-white">
        <span
          class="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs font-medium border border-white/20"
        >
          <span class="w-2 h-2 rounded-full bg-rwanda-yellow"></span>
          New arrivals · Made for Kigali
        </span>
        <h1 class="mt-4 font-display text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight">
          Smart tech, <br /><span class="text-rwanda-yellow">honest prices.</span>
        </h1>
        <p class="mt-5 text-white/85 text-lg max-w-md leading-relaxed">
          Smartphones, laptops and accessories—curated for everyday life in
          Kigali. Free delivery, 14-day returns, real warranty.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <RouterLink
            to="/products"
            class="bg-rwanda-yellow text-ink hover:bg-rwanda-yellow-dark font-semibold rounded-full px-6 py-3 transition shadow-lg shadow-rwanda-yellow/30"
          >
            Shop everything
          </RouterLink>
          <RouterLink
            to="/products/category/electronics"
            class="bg-white/10 hover:bg-white/20 backdrop-blur text-white font-medium rounded-full px-6 py-3 transition border border-white/20"
          >
            Browse electronics
          </RouterLink>
        </div>
        <dl class="mt-10 grid grid-cols-3 gap-6 max-w-md">
          <div>
            <dt class="text-xs uppercase tracking-wider text-white/70">Free delivery</dt>
            <dd class="mt-1 font-bold">Across Kigali</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-wider text-white/70">Returns</dt>
            <dd class="mt-1 font-bold">14 days, no fuss</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-wider text-white/70">Pay with</dt>
            <dd class="mt-1 font-bold">Card · MoMo</dd>
          </div>
        </dl>
      </div>

      <div class="relative">
        <div class="grid grid-cols-2 gap-4">
          <div
            v-for="(p, i) in featured.slice(0, 4)"
            :key="p.id"
            class="bg-white rounded-2xl p-4 shadow-xl"
            :class="{ 'translate-y-6': i % 2 === 1 }"
          >
            <div class="aspect-square bg-paper-warm rounded-xl p-3 grid place-items-center">
              <img :src="p.image" :alt="p.title" class="max-h-full max-w-full object-contain" />
            </div>
            <p class="mt-2 text-xs font-semibold text-ink line-clamp-1">{{ p.title }}</p>
          </div>
          <div
            v-if="!featured.length"
            class="col-span-2 bg-white rounded-2xl aspect-square grid place-items-center"
          >
            <Spinner :size="40" />
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Trust strip -->
  <section class="bg-white border-y border-line">
    <div class="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="t in [
        { t: 'Genuine stock', d: 'Imported direct, sealed boxes' },
        { t: 'Local warranty', d: '12 months on electronics' },
        { t: 'Fast checkout', d: 'Card or mobile money' },
        { t: 'Same-day delivery', d: 'Order before 2pm in Kigali' },
      ]" :key="t.t" class="flex items-start gap-3">
        <span class="w-8 h-8 rounded-full bg-rwanda-blue-light grid place-items-center text-rwanda-blue">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="m5 12 5 5L20 7" />
          </svg>
        </span>
        <div>
          <p class="text-sm font-semibold">{{ t.t }}</p>
          <p class="text-xs text-ink-soft">{{ t.d }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Categories -->
  <section class="max-w-7xl mx-auto px-4 py-14">
    <div class="flex items-end justify-between mb-6">
      <div>
        <h2 class="font-display text-2xl md:text-3xl font-extrabold">Shop by category</h2>
        <p class="text-ink-soft mt-1">Pick your aisle. Scroll, tap, done.</p>
      </div>
    </div>
    <div v-if="products.loading && !products.categories.length" class="py-12 grid place-items-center">
      <Spinner :size="32" />
    </div>
    <div v-else-if="products.error" class="text-red-600 text-sm">{{ products.error }}</div>
    <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <RouterLink
        v-for="cat in products.categories"
        :key="cat"
        :to="{ name: 'products-category', params: { category: cat } }"
        class="group relative rounded-2xl border border-line bg-gradient-to-br p-6 h-44 flex flex-col justify-between overflow-hidden lift"
        :class="art(cat).color"
      >
        <span class="text-4xl">{{ art(cat).emoji }}</span>
        <div>
          <p class="text-xs text-ink-soft uppercase tracking-wider">Category</p>
          <p class="font-display font-extrabold text-lg leading-tight">
            {{ categoryLabel(cat) }}
          </p>
          <p class="text-xs text-ink-soft mt-1">
            {{ products.inCategory(cat).length }} products
          </p>
        </div>
        <span
          class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur grid place-items-center text-ink group-hover:bg-rwanda-blue group-hover:text-white transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </span>
      </RouterLink>
    </div>
  </section>

  <!-- Featured products -->
  <section class="max-w-7xl mx-auto px-4 pb-16">
    <div class="flex items-end justify-between mb-6">
      <div>
        <h2 class="font-display text-2xl md:text-3xl font-extrabold">Featured this week</h2>
        <p class="text-ink-soft mt-1">Top-rated picks from our shelves.</p>
      </div>
      <RouterLink to="/products" class="text-sm font-semibold text-rwanda-blue hover:underline">
        See all →
      </RouterLink>
    </div>
    <div v-if="products.loading && !featured.length" class="py-12 grid place-items-center">
      <Spinner :size="32" />
    </div>
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
      <ProductCard v-for="p in featured" :key="p.id" :product="p" />
    </div>
  </section>

  <!-- Promo banner -->
  <section class="max-w-7xl mx-auto px-4 pb-20">
    <div class="rounded-3xl bg-rwanda-green text-white p-8 md:p-12 grid md:grid-cols-2 gap-6 items-center overflow-hidden relative">
      <div class="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-rwanda-yellow/20 blur-3xl"></div>
      <div class="relative">
        <p class="uppercase tracking-widest text-xs text-rwanda-yellow font-bold">Mobile money ready</p>
        <h3 class="font-display text-2xl md:text-3xl font-extrabold mt-2">
          Pay your way—card, MTN MoMo, or Airtel Money.
        </h3>
        <p class="mt-3 text-white/85 max-w-md">
          We accept Stripe-secured cards plus local mobile money for fast, friction-free checkout.
        </p>
      </div>
      <div class="relative flex flex-wrap gap-3 md:justify-end">
        <span
          v-for="m in ['Visa', 'Mastercard', 'MTN MoMo', 'Airtel Money']"
          :key="m"
          class="bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2 text-sm font-medium"
          >{{ m }}</span
        >
      </div>
    </div>
  </section>
  </div>
</template>
