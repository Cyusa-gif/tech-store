<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { useAuthStore } from "@/stores/auth";

const cart = useCartStore();
const wishlist = useWishlistStore();
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const search = ref((route.query.q as string) ?? "");
const menuOpen = ref(false);

watch(
  () => route.fullPath,
  () => (menuOpen.value = false),
);

function submitSearch(e: Event) {
  e.preventDefault();
  router.push({ name: "products", query: search.value ? { q: search.value } : {} });
}

const initials = computed(() => {
  if (!auth.user) return "";
  return auth.user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
});
</script>

<template>
  <header class="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-line">
    <!-- Promo strip -->
    <div class="bg-rwanda-green text-white text-xs">
      <div class="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between gap-4">
        <span class="hidden sm:inline">Free delivery in Kigali on orders above RWF 67,000</span>
        <span class="sm:hidden">Free Kigali delivery · RWF 67,000+</span>
        <span class="hidden md:inline opacity-80">Mon–Sat · 8:00 – 19:00 · Kicukiro warehouse</span>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4">
      <div class="h-16 flex items-center gap-3 md:gap-6">
        <button
          class="md:hidden p-2 -ml-2 rounded hover:bg-paper-warm"
          aria-label="Open menu"
          @click="menuOpen = !menuOpen"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>

        <RouterLink to="/" class="flex items-center gap-2 group" aria-label="Kigali Tech Store home">
          <span
            class="w-9 h-9 rounded-lg bg-rwanda-blue text-rwanda-yellow grid place-items-center font-display text-lg font-extrabold shadow-sm"
            >K</span
          >
          <span class="hidden sm:flex flex-col leading-tight">
            <span class="font-display font-extrabold text-ink text-base">Kigali Tech</span>
            <span class="text-[10px] uppercase tracking-widest text-ink-soft">Store · Rwanda</span>
          </span>
        </RouterLink>

        <form
          class="hidden md:flex flex-1 max-w-xl items-center bg-paper-warm rounded-full pl-4 pr-1 py-1 border border-transparent focus-within:border-rwanda-blue focus-within:bg-white transition"
          role="search"
          @submit="submitSearch"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-ink-soft">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            v-model="search"
            type="search"
            placeholder="Search phones, laptops, accessories…"
            aria-label="Search products"
            class="flex-1 bg-transparent outline-none px-3 text-sm placeholder:text-ink-soft/70"
          />
          <button
            type="submit"
            class="bg-rwanda-blue hover:bg-rwanda-blue-dark text-white rounded-full text-sm font-medium px-4 py-1.5 transition"
          >
            Search
          </button>
        </form>

        <nav class="ml-auto flex items-center gap-1 md:gap-2" aria-label="Primary">
          <RouterLink
            to="/products"
            class="hidden md:inline-block px-3 py-2 rounded-md text-sm font-medium hover:bg-paper-warm"
            >Shop</RouterLink
          >
          <RouterLink
            to="/wishlist"
            class="relative p-2 rounded-md hover:bg-paper-warm"
            aria-label="Wishlist"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            <span
              v-if="wishlist.count"
              class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rwanda-yellow text-ink text-[11px] font-bold grid place-items-center"
              >{{ wishlist.count }}</span
            >
          </RouterLink>
          <RouterLink to="/cart" class="relative p-2 rounded-md hover:bg-paper-warm" aria-label="Cart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
            </svg>
            <span
              v-if="cart.count"
              class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rwanda-blue text-white text-[11px] font-bold grid place-items-center"
              >{{ cart.count }}</span
            >
          </RouterLink>

          <template v-if="auth.isAuthenticated">
            <RouterLink
              v-if="auth.isAdmin"
              to="/admin"
              class="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rwanda-yellow/20 text-amber-700 hover:bg-rwanda-yellow/30 transition"
              aria-label="Admin panel"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              Admin
            </RouterLink>
            <RouterLink
              to="/profile"
              class="ml-1 hidden sm:flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-paper-warm"
              aria-label="Profile"
            >
              <span
                class="w-8 h-8 rounded-full bg-rwanda-green text-white grid place-items-center font-bold text-xs"
                >{{ initials }}</span
              >
              <span class="text-sm font-medium">{{ auth.user?.name.split(" ")[0] }}</span>
            </RouterLink>
          </template>
          <template v-else>
            <RouterLink
              to="/login"
              class="hidden sm:inline-block ml-1 text-sm font-medium px-3 py-2 rounded-md hover:bg-paper-warm"
              >Sign in</RouterLink
            >
            <RouterLink
              to="/register"
              class="hidden sm:inline-block bg-ink text-white text-sm font-medium rounded-full px-4 py-2 hover:bg-ink-soft transition"
              >Join</RouterLink
            >
          </template>
        </nav>
      </div>

      <!-- Mobile search -->
      <form class="md:hidden pb-3" role="search" @submit="submitSearch">
        <div class="flex items-center bg-paper-warm rounded-full pl-4 pr-1 py-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-ink-soft">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            v-model="search"
            type="search"
            placeholder="Search products…"
            aria-label="Search products"
            class="flex-1 bg-transparent outline-none px-3 text-sm placeholder:text-ink-soft/70"
          />
          <button
            type="submit"
            class="bg-rwanda-blue text-white rounded-full text-sm font-medium px-4 py-1.5"
          >
            Go
          </button>
        </div>
      </form>
    </div>

    <!-- Mobile menu -->
    <transition name="fade">
      <div v-if="menuOpen" class="md:hidden border-t border-line bg-white">
        <div class="px-4 py-3 space-y-1">
          <RouterLink to="/" class="block py-2 text-sm font-medium">Home</RouterLink>
          <RouterLink to="/products" class="block py-2 text-sm font-medium">Shop all</RouterLink>
          <RouterLink to="/cart" class="block py-2 text-sm font-medium"
            >Cart ({{ cart.count }})</RouterLink
          >
          <RouterLink to="/wishlist" class="block py-2 text-sm font-medium"
            >Wishlist ({{ wishlist.count }})</RouterLink
          >
          <RouterLink v-if="auth.isAuthenticated" to="/profile" class="block py-2 text-sm font-medium">Profile</RouterLink>
          <RouterLink v-if="auth.isAdmin" to="/admin" class="block py-2 text-sm font-semibold text-amber-700">Admin panel</RouterLink>
          <RouterLink v-else to="/login" class="block py-2 text-sm font-medium">Sign in</RouterLink>
        </div>
      </div>
    </transition>
  </header>
</template>
