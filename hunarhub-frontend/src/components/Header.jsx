import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_LINK } from '../utils/roles.js';

export default function Header() {
  const { count, setCartOpen } = useCart();
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const roleLink = isLoggedIn ? ROLE_LINK[user.role] : null;
  // Only customers shop, so only they get the basket button.
  const showCart = !isLoggedIn || user.role === 'Customer';

  const onSearch = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/?q=${encodeURIComponent(q.trim())}#featured` : '/');
  };

  const onLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <div className="bg-brown-dark text-cream-50 text-xs py-2 px-6 lg:px-12 text-center font-medium tracking-wide flex justify-between items-center">
        <span className="hidden md:inline text-cream-200">
          <i className="fa-solid fa-heart text-rose-300 mr-1.5"></i>
          Supporting local women artisans across Pakistan
        </span>
        <span className="mx-auto md:mx-0">
          Free shipping on your first order with code{' '}
          <strong className="text-gold font-semibold tracking-wider">HUNARFIRST</strong>
        </span>
        <span className="hidden md:inline text-cream-200">Help &amp; Support</span>
      </div>

      <header className="sticky top-0 z-40 bg-cream-50/90 backdrop-blur-md border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            <Link to="/" className="flex items-center space-x-2.5 group flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-maroon text-cream-50 flex items-center justify-center font-serif text-2xl font-bold group-hover:bg-maroon-hover transition shadow-sm">
                H
              </div>
              <div className="flex flex-col">
                <span className="serif-title text-2xl md:text-3xl font-bold tracking-tight text-charcoal group-hover:text-maroon transition">
                  HunarHub
                </span>
                <span className="text-[9px] uppercase tracking-widest text-brown font-bold -mt-1">
                  Handcrafted &amp; Local
                </span>
              </div>
            </Link>

            <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-xl mx-4">
              <div className="relative w-full flex items-center bg-white rounded-full border border-cream-300 focus-within:border-maroon focus-within:ring-1 focus-within:ring-maroon shadow-sm transition">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  type="text"
                  placeholder="Search kurtas, cakes, henna services..."
                  className="w-full py-2.5 px-5 text-xs text-charcoal placeholder-muted focus:outline-none rounded-full bg-transparent"
                />
                <button type="submit" aria-label="Search" className="p-2 mr-1.5 text-cream-50 bg-maroon hover:bg-maroon-hover rounded-full w-8 h-8 flex items-center justify-center transition">
                  <i className="fa-solid fa-magnifying-glass text-xs"></i>
                </button>
              </div>
            </form>

            <div className="flex items-center space-x-3 sm:space-x-5">
              <nav className="hidden lg:flex space-x-6 text-sm font-medium text-charcoal">
                <Link to="/" className="hover:text-maroon transition">Shop</Link>
                <a href="/#artisans" className="hover:text-maroon transition">Our Artisans</a>
              </nav>

              <div className="flex items-center space-x-2 sm:space-x-3 border-l border-cream-200 pl-3 sm:pl-5">
                {roleLink && (
                  <NavLink
                    to={roleLink.to}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 text-xs font-semibold px-3.5 py-2.5 rounded-full border transition ${
                        isActive
                          ? 'bg-maroon text-cream-50 border-maroon'
                          : 'text-maroon border-maroon/20 hover:bg-maroon-light'
                      }`
                    }
                  >
                    <i className={`fa-solid ${roleLink.icon}`}></i>
                    <span>{roleLink.label}</span>
                  </NavLink>
                )}

                {showCart && (
                  <button onClick={() => setCartOpen(true)} className="relative p-2 text-charcoal hover:text-maroon transition" aria-label="Open basket">
                    <i className="fa-solid fa-bag-shopping text-xl"></i>
                    <span className="absolute -top-1 -right-1 bg-maroon text-cream-50 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                      {count}
                    </span>
                  </button>
                )}

                {isLoggedIn ? (
                  <div className="flex items-center space-x-3">
                    <span className="hidden xl:inline text-xs text-muted">
                      {user.name.split(' ')[0]} · {user.role}
                    </span>
                    <button onClick={onLogout} className="bg-maroon hover:bg-maroon-hover text-cream-50 text-xs font-medium px-4 py-2.5 rounded-full transition shadow-sm">
                      Log out
                    </button>
                  </div>
                ) : (
                  <Link to="/login" className="bg-maroon hover:bg-maroon-hover text-cream-50 text-xs sm:text-sm font-medium px-4 py-2.5 rounded-full transition shadow-sm flex items-center space-x-2">
                    <i className="fa-regular fa-user"></i>
                    <span className="hidden sm:inline">Join / Login</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}