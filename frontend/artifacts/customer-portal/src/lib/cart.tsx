import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type CartItem = {
  partId: number;
  partName: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string | null;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (partId: number) => void;
  updateQuantity: (partId: number, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem("autoparts_cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("autoparts_cart", JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((current) => {
      const existing = current.find((i) => i.partId === newItem.partId);
      if (existing) {
        return current.map((i) =>
          i.partId === newItem.partId
            ? { ...i, quantity: i.quantity + (newItem.quantity || 1) }
            : i
        );
      }
      return [...current, { ...newItem, quantity: newItem.quantity || 1 }];
    });
  };

  const removeItem = (partId: number) => {
    setItems((current) => current.filter((i) => i.partId !== partId));
  };

  const updateQuantity = (partId: number, quantity: number) => {
    if (quantity < 1) {
      removeItem(partId);
      return;
    }
    setItems((current) =>
      current.map((i) => (i.partId === partId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discount = subtotal >= 5000 ? subtotal * 0.1 : 0; // 10% off if subtotal >= 5000
  const total = subtotal - discount;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        discount,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
