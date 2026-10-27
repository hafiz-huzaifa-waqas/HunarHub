import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { formatPrice, SHIPPING_FEE } from '../utils/products.js';
import { ProductImage } from './ProductCard.jsx';

export default function CartDrawer() {
  // 👇 Yahan removeFromCart add kiya hai
  const { cart, count, subtotal, updateQty, removeFromCart, clearCart, cartOpen, setCartOpen, showToast } = useCart();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const checkout = async () => {
    setError('');
    if (cart.length === 0) return showToast('Your basket is empty.');

    if (!isLoggedIn) {
      setCartOpen(false);
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (user.role !== 'Customer') {
      return setError('Only customer accounts can place orders. Log in with a customer account to check out.');
    }

    setPlacing(true);
    try {
      const data = await api('/customer/orders', {
        method: 'POST',
        body: {
          seller_id: cart[0].sellerId, // basket only ever holds one seller (BR-3)
          items: cart.map((i) => ({ product_id: i.id, quantity: i.qty })),
        },
      });
      clearCart();
      setCartOpen(false);
      showToast(`Order #${data.order_id} placed`);
      navigate('/customer', { state: { placed: data.order_id } });
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
        cartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setCartOpen(false)}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className={`fixed inset-y-0 right-0 max-w-md w-full bg-cream-50 shadow-drawer flex flex-col transition-transform duration-300 ease-in-out ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-cream-200 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-bag-shopping text-maroon text-lg"></i>
            <h3 className="serif-title text-xl font-bold text-charcoal">Your basket</h3>
            <span className="bg-maroon-light text-maroon text-xs font-bold px-2.5 py-0.5 rounded-full">
              {count} {count === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button onClick={() => setCartOpen(false)} aria-label="Close basket" className="text-muted hover:text-charcoal text-xl p-1">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center text-muted text-2xl mb-3">
                <i className="fa-solid fa-basket-shopping"></i>
              </div>
              <p className="font-semibold text-charcoal text-sm">Your basket is empty</p>
              <p className="text-xs text-muted mt-1 max-w-xs">Add something handmade to get started.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="bg-white p-3.5 rounded-xl border border-cream-200 flex items-center space-x-3 shadow-sm relative group">
                <ProductImage src={item.image} alt={item.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-charcoal truncate">{item.title}</h4>
                  <p className="text-[10px] text-brown font-medium">{item.seller}</p>
                  <p className="text-xs font-bold text-maroon mt-1">{formatPrice(item.price * item.qty)}</p>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center space-x-2 bg-cream-100 rounded-lg p-1 border border-cream-200">
                    <button onClick={() => updateQty(item.id, -1)} aria-label="Decrease" className="w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-white rounded transition">-</button>
                    <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} aria-label="Increase" className="w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-white rounded transition">+</button>
                  </div>
                  
                  {/* 👇 Naya Remove (Trash) Button */}
                  <button 
                    onClick={() => removeFromCart(item.id)} 
                    aria-label="Remove item" 
                    className="text-[10px] text-muted hover:text-red-600 font-semibold transition flex items-center gap-1"
                  >
                    <i className="fa-solid fa-trash-can"></i> Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-cream-200 bg-white space-y-4">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span className="font-medium text-charcoal">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Estimated Shipping (Nationwide)</span>
              <span className="font-medium text-brown">{count > 0 ? formatPrice(SHIPPING_FEE) : formatPrice(0)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-charcoal pt-2 border-t border-cream-200">
              <span>Total</span>
              <span className="text-maroon text-base">{formatPrice(subtotal + (count > 0 ? SHIPPING_FEE : 0))}</span>
            </div>
          </div>
          {error && (
            <div role="alert" className="flex items-start space-x-2 bg-maroon-light text-maroon text-xs rounded-xl px-4 py-3">
              <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
              <span>{error}</span>
            </div>
          )}
          <button
            onClick={checkout}
            disabled={placing}
            className="w-full bg-maroon hover:bg-maroon-hover disabled:opacity-60 disabled:cursor-not-allowed text-cream-50 font-medium py-3.5 rounded-full text-xs uppercase tracking-wider shadow-warm transition"
          >
            {placing ? 'Placing order…' : 'Place order'}
          </button>
          <p className="text-[10px] text-center text-muted">Items in one basket must come from one artisan.</p>
        </div>
      </aside>
    </div>
  );
}