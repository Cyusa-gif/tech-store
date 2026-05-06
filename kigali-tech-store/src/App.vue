<script setup lang="ts">
import { onMounted } from "vue";
import { RouterView } from "vue-router";
import SiteHeader from "@/components/SiteHeader.vue";
import SiteFooter from "@/components/SiteFooter.vue";
import ToastShelf from "@/components/ToastShelf.vue";
import { useProductsStore } from "@/stores/products";

const products = useProductsStore();
onMounted(() => {
  void products.fetchAll();
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-paper">
    <SiteHeader />
    <main class="flex-1">
      <RouterView v-slot="{ Component, route }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </transition>
      </RouterView>
    </main>
    <SiteFooter />
    <ToastShelf />
  </div>
</template>
