import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
} from "vue-router";
import { useAuthStore } from "@/stores/auth";

const base = import.meta.env.BASE_URL;

export const router = createRouter({
  history: createWebHistory(base),
  scrollBehavior(_to, _from, saved) {
    return saved ?? { left: 0, top: 0, behavior: "smooth" };
  },
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/views/HomeView.vue"),
      meta: { title: "Kigali Tech Store — Smart tech for everyday Kigali" },
    },
    {
      path: "/products",
      component: () => import("@/views/ProductsLayout.vue"),
      children: [
        {
          path: "",
          name: "products",
          component: () => import("@/views/ProductsList.vue"),
          meta: { title: "Shop all products" },
        },
        {
          path: "category/:category",
          name: "products-category",
          component: () => import("@/views/ProductsList.vue"),
          props: true,
          meta: { title: "Shop by category" },
        },
        {
          path: ":id(\\d+)",
          name: "product-detail",
          component: () => import("@/views/ProductDetail.vue"),
          props: true,
        },
      ],
    },
    {
      path: "/cart",
      name: "cart",
      component: () => import("@/views/CartView.vue"),
      meta: { title: "Your cart" },
    },
    {
      path: "/wishlist",
      name: "wishlist",
      component: () => import("@/views/WishlistView.vue"),
      meta: { title: "Your wishlist" },
    },
    {
      path: "/checkout",
      name: "checkout",
      component: () => import("@/views/CheckoutView.vue"),
      meta: { title: "Checkout", requiresAuth: true },
    },
    {
      path: "/order-success/:orderId",
      name: "order-success",
      component: () => import("@/views/OrderSuccess.vue"),
      props: true,
      meta: { title: "Order confirmed", requiresAuth: true },
    },
    {
      path: "/profile",
      component: () => import("@/views/ProfileLayout.vue"),
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          name: "profile",
          component: () => import("@/views/ProfileInfo.vue"),
          meta: { title: "Your profile" },
        },
        {
          path: "orders",
          name: "profile-orders",
          component: () => import("@/views/ProfileOrders.vue"),
          meta: { title: "Order history" },
        },
        {
          path: "wishlist",
          name: "profile-wishlist",
          component: () => import("@/views/WishlistView.vue"),
          meta: { title: "Saved items" },
        },
      ],
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
      meta: { title: "Sign in" },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("@/views/RegisterView.vue"),
      meta: { title: "Create account" },
    },
    {
      path: "/admin",
      name: "admin",
      component: () => import("@/views/AdminPanel.vue"),
      meta: { title: "Admin — Order management", requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("@/views/NotFound.vue"),
      meta: { title: "Page not found" },
    },
  ],
});

router.beforeEach((to: RouteLocationNormalized) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: "home" };
  }
  return true;
});

router.afterEach((to) => {
  const t = (to.meta.title as string | undefined) ?? "Kigali Tech Store";
  document.title = t.includes("Kigali") ? t : `${t} · Kigali Tech Store`;
});
