import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { api } from '../api.js';
import ProductCard from '../components/ProductCard.jsx'; // 👈 ProductCard import kiya
import QuickViewModal from '../components/QuickViewModal.jsx';
import { useCart } from '../context/CartContext.jsx';
import { normalizeProduct } from '../utils/products.js'; // 👈 normalizeProduct import kiya

export default function SellerProfile() {
  const { id } = useParams();
  const { addToCart } = useCart();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // For QuickView Modal
  const [quickView, setQuickView] = useState(null);

  useEffect(() => {

    window.scrollTo(0, 0);
    
    api(`/sellers/${id}`)
      .then((res) => setData(res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-20 text-center animate-pulse text-muted">
          Loading seller profile...
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-20 text-center text-maroon">
          <i className="fa-solid fa-circle-exclamation text-4xl mb-3"></i>
          <p>{error}</p>
          <Link to="/" className="text-sm underline mt-4 inline-block">Back to Home</Link>
        </div>
      </Layout>
    );
  }

  const { seller, products } = data;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        
        {/* Header Section */}
        <div className="bg-white rounded-3xl border border-cream-200 p-8 shadow-card mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="text-xs uppercase font-bold tracking-widest text-maroon">{seller.category_name}</span>
            <h1 className="serif-title text-4xl font-bold text-charcoal mt-1">{seller.name}</h1>
            <p className="text-sm text-muted mt-2">
              <i className="fa-solid fa-location-dot mr-1 text-brown" /> {seller.region_name}
            </p>
          </div>
          
          <div className="bg-cream-50 border border-cream-200 px-8 py-5 rounded-2xl flex items-center gap-6">
             <div className="text-center">
                <p className="text-3xl font-bold text-maroon">{seller.avg_rating > 0 ? Number(seller.avg_rating).toFixed(1) : '—'}</p>
                <div className="text-gold text-sm mt-1"><i className="fa-solid fa-star" /></div>
             </div>
             <div className="w-px h-12 bg-cream-300"></div>
             <div className="text-center">
                <p className="text-3xl font-bold text-charcoal">{seller.review_count}</p>
                <p className="text-[10px] uppercase text-muted font-bold tracking-wider mt-1">Reviews</p>
             </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-charcoal">All Products <span className="text-sm font-normal text-muted">({products.length})</span></h2>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-cream-200">
            <i className="fa-solid fa-box-open text-4xl text-cream-300 mb-3"></i>
            <p className="text-charcoal font-semibold">No products available</p>
            <p className="text-sm text-muted mt-1">This seller hasn't listed any products yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 👇 Yahan ProductCard use kiya hai */}
            {products.map((p) => {
              // Backend response ko frontend format mein convert kar rahe hain
              const normalized = normalizeProduct({
                ...p,
                seller_id: seller.seller_id,
                seller_name: seller.name,
                category_name: seller.category_name,
                avg_rating: seller.avg_rating,
                review_count: seller.review_count
              });
              return (
                <ProductCard 
                  key={normalized.id} 
                  product={normalized} 
                  onQuickView={setQuickView} 
                  onAdd={addToCart} 
                />
              );
            })}
          </div>
        )}
      </div>

      {/* QuickView Modal */}
      <QuickViewModal 
        product={quickView} 
        onClose={() => setQuickView(null)} 
        onAdd={addToCart} 
      />
    </Layout>
  );
}