<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, RouterView, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";

const auth = useAuthStore();
const router = useRouter();
const toast = useToast();

const initials = computed(() => {
  if (!auth.user) return "";
  return auth.user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
});

function logout() {
  auth.logout();
  toast.info("Signed out");
  router.push("/");
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-10">
    <div class="bg-white border border-line rounded-3xl p-6 md:p-8 mb-6 flex flex-wrap items-center gap-4">
      <span
        class="w-16 h-16 rounded-full bg-rwanda-green text-white grid place-items-center font-display font-extrabold text-2xl"
        >{{ initials }}</span
      >
      <div class="flex-1 min-w-0">
        <h1 class="font-display text-2xl font-extrabold">{{ auth.user?.name }}</h1>
        <p class="text-ink-soft text-sm">{{ auth.user?.email }}</p>
      </div>
      <button
        type="button"
        @click="logout"
        class="bg-paper-warm hover:bg-red-50 hover:text-red-600 text-sm font-semibold rounded-full px-4 py-2 transition"
      >
        Sign out
      </button>
    </div>

    <div class="grid md:grid-cols-[200px_1fr] gap-6">
      <nav class="flex md:flex-col gap-1 overflow-x-auto" aria-label="Profile">
        <RouterLink
          v-for="link in [
            { to: { name: 'profile' }, label: 'Profile' },
            { to: { name: 'profile-orders' }, label: 'Orders' },
            { to: { name: 'profile-wishlist' }, label: 'Wishlist' },
          ]"
          :key="link.label"
          :to="link.to"
          class="px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap"
          active-class="bg-rwanda-blue-light text-rwanda-blue-dark font-semibold"
          exact-active-class=""
        >
          {{ link.label }}
        </RouterLink>
      </nav>
      <section>
        <RouterView />
      </section>
    </div>
  </div>
</template>
