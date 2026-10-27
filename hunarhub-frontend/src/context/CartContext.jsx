import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  // Backend rule BR-3: one order = one seller, so the cart holds one seller only.
  const addToCart = (product) => {
    if (cart.length > 0 && cart[0].sellerId !== product.sellerId) {
      showToast('Your basket has items from another artisan. Check out or clear it first.');
      return;
    }
    if (product.stock != null && product.stock <= 0) {
      showToast('This item is out of stock.');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        const next = existing.qty + 1;
        if (product.stock != null && next > product.stock) return prev;
        return prev.map((i) => (i.id === product.id ? { ...i, qty: next } : i));
      }
      return [...prev, { ...product, qty: 1 }];
    });
    showToast(`Added "${product.title}" to your basket`);
  };

  const updateQty = (id, delta) =>
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id !== id) return i;
          const qty = i.qty + delta;
          if (i.stock != null && qty > i.stock) return i;
          return { ...i, qty };
        })
        .filter((i) => i.qty > 0)
    );

  const clearCart = () => setCart([]);

  const count = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider
      value={{ cart, count, subtotal, addToCart, updateQty, clearCart, cartOpen, setCartOpen, toast, showToast }}
    >
      {children}
    </CartContext.Provider>
  );
}
