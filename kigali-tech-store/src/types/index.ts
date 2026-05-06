export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}

export interface CartItem {
  id: number;
  title: string;
  price: number;
  image: string;
  qty: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  shipping: number;
  tax: number;
  address: ShippingAddress;
  status: "Processing" | "Shipped" | "Delivered";
  paymentIntentId?: string;
  paymentMethod?: "card" | "momo";
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  district: string;
  city: string;
  notes?: string;
}

export interface ToastMessage {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}
