"use client";

import { create } from "zustand";

export type ToastKind = "success" | "error" | "info";
export type Toast = { id: number; kind: ToastKind; message: string };

type ToastStore = {
  items: Toast[];
  show: (message: string, kind?: ToastKind) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

export const useToasts = create<ToastStore>((set, get) => ({
  items: [],
  show: (message, kind = "success") => {
    const id = nextId++;
    set({ items: [...get().items, { id, kind, message }] });
    setTimeout(() => get().dismiss(id), 3200);
  },
  dismiss: (id) =>
    set({ items: get().items.filter((t) => t.id !== id) }),
}));

export const toast = {
  success: (m: string) => useToasts.getState().show(m, "success"),
  error: (m: string) => useToasts.getState().show(m, "error"),
  info: (m: string) => useToasts.getState().show(m, "info"),
};
