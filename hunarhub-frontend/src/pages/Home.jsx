import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import ProductCard from '../components/ProductCard.jsx';
import QuickViewModal from '../components/QuickViewModal.jsx';
import { useCart } from '../context/CartContext.jsx';
import { api } from '../api.js';
import { TABS, normalizeProduct } from '../utils/products.js';

export default function Home() {
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').toLowerCase();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [quickView, setQuickView] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api('/products')
      .then((data) => {
        if (cancelled) return;
        // Accept either [ ... ] or { products: [ ... ] }
        const rows = Array.isArray(data) ? data : data.products || [];
        setProducts(rows.map(normalizeProduct).filter((p) => p.active));
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  // Filter products and keep only ONE per seller
  const visible = useMemo(() => {
    const filtered = products.filter((p) => {
      const okCat = filter === 'all' || p.filter === filter;
      const okSearch =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.seller.toLowerCase().includes(query) ||
        p.categoryName.toLowerCase().includes(query);
      return okCat && okSearch;
    });

    // Unique Seller Logic: Har seller ka sirf pehla product dikhao
    const uniqueSellers = new Map();
    filtered.forEach((product) => {
      if (!uniqueSellers.has(product.sellerId)) {
        uniqueSellers.set(product.sellerId, product);
      }
    });
    return Array.from(uniqueSellers.values());
  }, [products, filter, query]);

  return (
    <Layout>

      {/* HERO */}
      <section className="relative py-12 md:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left z-10">
              <div className="inline-flex items-center space-x-2 bg-cream-100 border border-cream-300 rounded-full px-4 py-1.5 text-xs font-semibold text-maroon shadow-sm">
                <span className="w-2 h-2 rounded-full bg-maroon inline-block"></span>
                <span className="tracking-wide">Directly supporting local women artisans</span>
              </div>

              <h1 className="serif-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-charcoal leading-[1.1]">
                Empowering Local Artisans. <br className="hidden sm:inline" />
                <span className="italic font-normal text-maroon">Find Your Hunar.</span>
              </h1>

              <p className="text-muted text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Discover Pakistan’s finest home-based creations. From hand-stitched kurtas and home-baked cakes to
                henna artistry, delivered to your doorstep.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <a href="#featured" className="w-full sm:w-auto text-center bg-maroon hover:bg-maroon-hover text-cream-50 font-medium px-8 py-4 rounded-full shadow-warm hover:shadow-warm-hover transition-all duration-300 text-sm tracking-wide flex items-center justify-center space-x-3 group">
                  <span>Explore products</span>
                  <i className="fa-solid fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
                </a>
                <a href="#artisans" className="w-full sm:w-auto text-center border-2 border-brown text-brown hover:bg-brown hover:text-cream-50 font-semibold px-8 py-3.5 rounded-full transition-all duration-300 text-sm tracking-wide">
                  Meet our artisans
                </a>
              </div>

              <div className="pt-8 border-t border-cream-200/80 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                <div>
                  <p className="serif-title text-2xl md:text-3xl font-bold text-charcoal">100%</p>
                  <p className="text-xs text-muted">Handmade quality</p>
                </div>
                <div>
                  <p className="serif-title text-2xl md:text-3xl font-bold text-charcoal">{products.length || '—'}</p>
                  <p className="text-xs text-muted">Items available now</p>
                </div>
                <div>
                  <p className="serif-title text-2xl md:text-3xl font-bold text-charcoal">Verified</p>
                  <p className="text-xs text-muted">Every seller checked</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="absolute -top-6 -left-6 w-72 h-72 bg-gold/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-6 -right-6 w-72 h-72 bg-maroon/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/5] bg-cream-200 group">
                  <img
                    src="https://images.unsplash.com/photo-1606760227091-3dd850d97f1d?auto=format&fit=crop&q=80&w=1000"
                    alt="Artisan hands creating intricate handmade embroidery"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6 text-cream-50">
                    <span className="bg-gold/90 text-charcoal font-bold text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-md">Artisan spotlight</span>
                    <h3 className="serif-title text-xl font-bold mt-1.5">Master embroidery by Kulsoom Bibi</h3>
                    <p className="text-xs text-cream-200">Multan, Punjab • 14 years of craftsmanship</p>
                  </div>
                </div>

                <div className="absolute -top-4 -right-4 sm:-right-6 bg-white p-3.5 rounded-2xl shadow-xl border border-cream-200 items-center space-x-3 hidden sm:flex max-w-[200px]">
                  <div className="w-10 h-10 rounded-full bg-maroon-light flex items-center justify-center text-maroon">
                    <i className="fa-solid fa-award"></i>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-charcoal">Guaranteed authentic</p>
                    <p className="text-[10px] text-muted">Direct from artisan homes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-12 bg-cream-100/60 border-y border-cream-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: 'fa-user-check', t: 'Verified sellers', d: 'Every artisan is checked by an admin before their products go live.', c: 'bg-maroon-light text-maroon group-hover:bg-maroon group-hover:text-white' },
            { icon: 'fa-handshake-angle', t: 'Agent-assisted', d: 'A local agent manages each seller, handles orders, and keeps you updated.', c: 'bg-brown-light text-brown group-hover:bg-brown group-hover:text-white' },
            { icon: 'fa-truck-fast', t: 'Home delivered', d: 'Orders are prepared by the artisan and delivered to your door.', c: 'bg-gold-bg text-gold-soft group-hover:bg-gold group-hover:text-white' },
          ].map((f) => (
            <div key={f.t} className="bg-white p-6 rounded-2xl border border-cream-200 shadow-card hover:shadow-warm transition-all duration-300 flex items-start space-x-4 group">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors duration-300 flex-shrink-0 ${f.c}`}>
                <i className={`fa-solid ${f.icon}`}></i>
              </div>
              <div>
                <h4 className="font-bold text-charcoal text-base mb-1">{f.t}</h4>
                <p className="text-xs text-muted leading-relaxed">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="featured" className="py-16 md:py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-maroon">Handcrafted collections</span>
              <h2 className="serif-title text-3xl sm:text-4xl md:text-5xl font-bold text-charcoal mt-1">Explore local treasures</h2>
              {query && <p className="text-xs text-muted mt-2">Showing results for “{searchParams.get('q')}”</p>}
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={`px-5 py-2 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                    filter === t.key
                      ? 'bg-maroon text-cream-50 shadow-sm'
                      : 'bg-white text-charcoal hover:bg-cream-200 border border-cream-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-80 rounded-2xl bg-cream-100 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="py-12 text-center">
              <i className="fa-solid fa-plug-circle-exclamation text-4xl text-cream-300 mb-3"></i>
              <p className="text-base font-semibold text-charcoal">Couldn’t load products</p>
              <p className="text-xs text-muted mt-1">{error}. Check that the backend is running and GET /api/products exists.</p>
            </div>
          )}

          {!loading && !error && visible.length === 0 && (
            <div className="py-12 text-center">
              <i className="fa-solid fa-store-slash text-4xl text-cream-300 mb-3"></i>
              <p className="text-base font-semibold text-charcoal">No items found</p>
              <p className="text-xs text-muted mt-1">Try a different search or category.</p>
            </div>
          )}

          {!loading && !error && visible.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {visible.map((p) => (
                <ProductCard key={p.id} product={p} onQuickView={setQuickView} onAdd={addToCart} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ARTISAN STORY */}
      <section id="artisans" className="py-16 bg-maroon-dark text-cream-50 relative overflow-hidden scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-gold text-xs uppercase tracking-widest font-bold">Behind the craft</span>
            <h2 className="serif-title text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              “Every stitch and recipe carries generations of Pakistani heritage.”
            </h2>
            <p className="text-cream-200 text-sm font-light leading-relaxed">
              HunarHub gives home-based artisans, especially women in their own neighbourhoods, direct market access
              and a local agent who helps them sell.
            </p>
          </div>
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="bg-brown/50 p-5 rounded-2xl border border-white/10">
              <i className="fa-solid fa-hand-holding-heart text-gold text-2xl mb-3"></i>
              <h4 className="font-bold text-sm text-white mb-1">Fair earnings</h4>
              <p className="text-xs text-cream-300">Commission is set per category and recorded on every delivered order.</p>
            </div>
            <div className="bg-brown/50 p-5 rounded-2xl border border-white/10">
              <i className="fa-solid fa-location-dot text-gold text-2xl mb-3"></i>
              <h4 className="font-bold text-sm text-white mb-1">Local first</h4>
              <p className="text-xs text-cream-300">Sellers and agents are matched by region across Karachi.</p>
            </div>
          </div>
        </div>
      </section>

      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} onAdd={addToCart} />
    </Layout>
  );
}