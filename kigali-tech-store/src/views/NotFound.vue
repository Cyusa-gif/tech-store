<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <div class="min-h-[70vh] grid place-items-center px-4">
    <div class="max-w-lg text-center">
      <p class="font-display text-rwanda-blue font-extrabold text-sm tracking-widest uppercase">
        Error 404
      </p>
      <h1 class="mt-3 font-display text-5xl md:text-6xl font-extrabold leading-[1]">
        We can't find <br />that page.
      </h1>
      <p class="mt-4 text-ink-soft">
        The link might be broken, or the page may have moved. Let's get you back to shopping.
      </p>

      <div class="mt-8 flex gap-3 justify-center flex-wrap">
        <RouterLink
          to="/"
          class="bg-rwanda-blue hover:bg-rwanda-blue-dark text-white rounded-full px-6 py-3 text-sm font-semibold transition"
          >Back to home</RouterLink
        >
        <RouterLink
          to="/products"
          class="bg-white border border-line hover:border-rwanda-blue rounded-full px-6 py-3 text-sm font-semibold"
          >Browse the shop</RouterLink
        >
      </div>

      <div class="mt-12 flex justify-center gap-1">
        <span class="w-3 h-12 rounded-full bg-rwanda-blue"></span>
        <span class="w-3 h-12 rounded-full bg-rwanda-yellow"></span>
        <span class="w-3 h-12 rounded-full bg-rwanda-green"></span>
      </div>
    </div>
  </div>
</template>
