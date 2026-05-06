<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useProductsStore } from "@/stores/products";
import { categoryLabel, formatRWF, RWF_PER_USD } from "@/lib/format";
import ProductCard from "@/components/ProductCard.vue";
import Spinner from "@/components/Spinner.vue";

const props = defineProps<{ category?: string }>();
const route = useRoute();
const router = useRouter();
const products = useProductsStore();

const search = ref((route.query.q as string) ?? "");
const sort = ref<"featured" | "price-asc" | "price-desc" | "rating">(
  (route.query.sort as "featured" | "price-asc" | "price-desc" | "rating") ?? "featured",
);
const min = ref<number | null>(route.query.min ? Number(route.query.min) : null);
const max = ref<number | null>(route.query.max ? Number(route.query.max) : null);
const visible = ref(24);

watch(
  () => route.query,
  () => {
    search.value = (route.query.q as string) ?? "";
    if (route.query.sort)
      sort.value = route.query.sort as "featured" | "price-asc" | "price-desc" | "rating";
    visible.value = 24;
  },
);

function syncQuery() {
  const q: Record<string, string> = {};
  if (search.value) q.q = search.value;
  if (sort.value && sort.value !== "featured") q.sort = sort.value;
  if (min.value !== null) q.min = String(min.value);
  if (max.value !== null) q.max = String(max.value);
  router.replace({ query: q });
}

const list = computed(() =>
  products.filtered({
    category: props.category,
    search: search.value,
    min: min.value !== null ? min.value : undefined,
    max: max.value !== null ? max.value : undefined,
    sort: sort.value,
  }),
);

const visibleList = computed(() => list.value.slice(0, visible.value));

function clearFilters() {
  search.value = "";
  sort.value = "featured";
  min.value = null;
  max.value = null;
  syncQuery();
}

function loadMore() {
  visible.value += 24;
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-10">
    <!-- Breadcrumbs -->
    <nav class="text-xs text-ink-soft mb-3 flex flex-wrap items-center gap-1.5" aria-label="Breadcrumb">
      <RouterLink to="/" class="hover:text-rwanda-blue">Home</RouterLink>
      <span>/</span>
      <RouterLink to="/products" class="hover:text-rwanda-blue">Shop</RouterLink>
      <template v-if="category">
        <span>/</span>
        <span class="text-ink font-medium">{{ categoryLabel(category) }}</span>
      </template>
    </nav>

    <header class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="font-display text-3xl md:text-4xl font-extrabold">
          {{ category ? categoryLabel(category) : "Shop everything" }}
        </h1>
        <p class="text-ink-soft mt-1 text-sm">
          {{ list.length }} product{{ list.length === 1 ? "" : "s" }} available
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <label class="text-xs text-ink-soft" for="sort">Sort</label>
        <select
          id="sort"
          v-model="sort"
          @change="syncQuery"
          class="bg-white border border-line rounded-full px-3 py-2 text-sm focus:border-rwanda-blue outline-none"
        >
          <option value="featured">Featured</option>
          <option value="rating">Top rated</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>
    </header>

    <div class="grid lg:grid-cols-[260px_1fr] gap-8">
      <!-- Sidebar -->
      <aside class="space-y-6">
        <div class="bg-white rounded-2xl border border-line p-4">
          <h3 class="text-sm font-semibold mb-3">Search</h3>
          <input
            v-model="search"
            @input="syncQuery"
            type="search"
            placeholder="Filter products…"
            aria-label="Filter products"
            class="w-full bg-paper-warm rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rwanda-blue"
          />
        </div>

        <div class="bg-white rounded-2xl border border-line p-4">
          <h3 class="text-sm font-semibold mb-3">Categories</h3>
          <ul class="space-y-1.5">
            <li>
              <RouterLink
                to="/products"
                class="block text-sm py-1 px-2 rounded hover:bg-paper-warm"
                :class="{ 'bg-rwanda-blue-light text-rwanda-blue-dark font-semibold': !category }"
                >All</RouterLink
              >
            </li>
            <li v-for="cat in products.categories" :key="cat">
              <RouterLink
                :to="{ name: 'products-category', params: { category: cat } }"
                class="block text-sm py-1 px-2 rounded hover:bg-paper-warm"
                :class="{ 'bg-rwanda-blue-light text-rwanda-blue-dark font-semibold': category === cat }"
                >{{ categoryLabel(cat) }}</RouterLink
              >
            </li>
          </ul>
        </div>

        <div class="bg-white rounded-2xl border border-line p-4">
          <h3 class="text-sm font-semibold mb-3">Price (USD)</h3>
          <div class="flex items-center gap-2">
            <input
              v-model.number="min"
              type="number"
              placeholder="Min"
              min="0"
              @change="syncQuery"
              class="w-full bg-paper-warm rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rwanda-blue"
              aria-label="Minimum price USD"
            />
            <span class="text-ink-soft">—</span>
            <input
              v-model.number="max"
              type="number"
              placeholder="Max"
              min="0"
              @change="syncQuery"
              class="w-full bg-paper-warm rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-rwanda-blue"
              aria-label="Maximum price USD"
            />
          </div>
          <p class="mt-2 text-[11px] text-ink-soft">
            ≈ RWF {{ (min ?? 0) * RWF_PER_USD | 0 }} – {{ max ? (max * RWF_PER_USD) : "no limit" }}
          </p>
          <button
            type="button"
            class="mt-3 w-full text-xs font-medium text-ink-soft hover:text-rwanda-blue"
            @click="clearFilters"
          >
            Clear filters
          </button>
        </div>
      </aside>

      <!-- Results -->
      <section>
        <div v-if="products.loading && !list.length" class="py-20 grid place-items-center">
          <Spinner :size="36" />
        </div>
        <div
          v-else-if="products.error"
          class="rounded-2xl bg-red-50 border border-red-200 text-red-700 p-6 text-sm"
        >
          {{ products.error }}
        </div>
        <div
          v-else-if="!list.length"
          class="rounded-2xl bg-white border border-line p-10 text-center"
        >
          <p class="font-display text-xl font-extrabold">Nothing matches yet</p>
          <p class="text-ink-soft text-sm mt-1">Try a different filter or clear them all.</p>
          <button
            class="mt-4 bg-ink text-white text-sm font-semibold rounded-full px-4 py-2"
            @click="clearFilters"
          >
            Reset filters
          </button>
        </div>
        <div v-else>
          <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            <ProductCard v-for="p in visibleList" :key="p.id" :product="p" />
          </div>
          <div v-if="visible < list.length" class="mt-8 text-center">
            <button
              type="button"
              class="bg-white border border-line hover:border-rwanda-blue px-6 py-3 rounded-full font-semibold text-sm"
              @click="loadMore"
            >
              Load more ({{ list.length - visible }} more)
            </button>
          </div>
          <p v-else class="mt-8 text-center text-xs text-ink-soft">
            You've reached the end. Check back soon for fresh arrivals.
          </p>
        </div>
      </section>
    </div>
  </div>
</template>
