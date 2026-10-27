import Header from './Header.jsx';
import Footer from './Footer.jsx';
import CartDrawer from './CartDrawer.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Layout({ children }) {
  const { toast } = useCart();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <div
        role="status"
        className={`fixed bottom-6 right-6 bg-charcoal text-white px-5 py-3 rounded-2xl shadow-xl z-[60] flex items-center space-x-3 transition-all duration-300 pointer-events-none text-xs max-w-sm ${
          toast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
        }`}
      >
        <i className="fa-solid fa-circle-check text-gold text-base"></i>
        <span>{toast}</span>
      </div>
    </div>
  );
}
