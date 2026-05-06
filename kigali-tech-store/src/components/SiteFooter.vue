<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <footer class="mt-16 border-t border-line bg-white">
    <div class="max-w-7xl mx-auto px-4 py-12 grid gap-10 md:grid-cols-4">
      <div>
        <div class="flex items-center gap-2">
          <span
            class="w-9 h-9 rounded-lg bg-rwanda-blue text-rwanda-yellow grid place-items-center font-display text-lg font-extrabold"
            >K</span
          >
          <span class="font-display font-extrabold text-base">Kigali Tech Store</span>
        </div>
        <p class="mt-3 text-sm text-ink-soft leading-relaxed">
          Honest tech, delivered across Kigali. Backed by a 14-day return promise and on-the-ground support.
        </p>
      </div>
      <div>
        <h4 class="text-sm font-semibold mb-3">Shop</h4>
        <ul class="space-y-2 text-sm text-ink-soft">
          <li><RouterLink to="/products" class="hover:text-rwanda-blue">All products</RouterLink></li>
          <li>
            <RouterLink to="/products/category/electronics" class="hover:text-rwanda-blue"
              >Electronics</RouterLink
            >
          </li>
          <li><RouterLink to="/wishlist" class="hover:text-rwanda-blue">Wishlist</RouterLink></li>
          <li><RouterLink to="/cart" class="hover:text-rwanda-blue">Cart</RouterLink></li>
        </ul>
      </div>
      <div>
        <h4 class="text-sm font-semibold mb-3">Company</h4>
        <ul class="space-y-2 text-sm text-ink-soft">
          <li>About</li>
          <li>Careers</li>
          <li>Press</li>
          <li>Contact</li>
        </ul>
      </div>
      <div>
        <h4 class="text-sm font-semibold mb-3">Visit us</h4>
        <p class="text-sm text-ink-soft leading-relaxed">
          KN 4 Avenue<br />
          Kiyovu, Kigali<br />
          +250 788 000 000
        </p>
      </div>
    </div>
    <div class="border-t border-line">
      <div class="max-w-7xl mx-auto px-4 py-4 text-xs text-ink-soft flex flex-col sm:flex-row justify-between gap-2">
        <span>© {{ new Date().getFullYear() }} Kigali Tech Store. Made in Rwanda.</span>
        <span class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-rwanda-blue"></span>
          <span class="w-2 h-2 rounded-full bg-rwanda-yellow"></span>
          <span class="w-2 h-2 rounded-full bg-rwanda-green"></span>
        </span>
      </div>
    </div>
  </footer>
</template>
