import { useEffect, useState } from 'react';
import { formatPrice } from '../utils/products.js';
import { ProductImage, RatingStars } from './ProductCard.jsx';
import { api } from '../api.js';

export default function QuickViewModal({ product, onClose, onAdd }) {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Load seller's reviews (fresh each time modal opens)
  useEffect(() => {
    if (!product?.sellerId) return;
    setLoadingReviews(true);
    setReviews([]);
    api(`/customer/sellers/${product.sellerId}/reviews`)
      .then((d) => setReviews(d.reviews || []))
      .catch(() => setReviews([]))  // graceful: endpoint na ho toh koi issue nahi
      .finally(() => setLoadingReviews(false));
  }, [product?.sellerId]);

  if (!product) return null;
  const soldOut = product.stock != null && product.stock <= 0;

  return (
    <div
      className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-cream-200 max-h-[90vh] flex flex-col md:flex-row relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur text-charcoal hover:bg-maroon hover:text-white flex items-center justify-center transition shadow">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="md:w-1/2 bg-cream-100 relative min-h-[250px] md:min-h-full">
          <ProductImage src={product.image} alt={product.title} className="w-full h-full object-cover absolute inset-0" />
          <span className="absolute top-4 left-4 bg-maroon text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
            {product.categoryName}
          </span>
        </div>

        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-circle-check text-maroon text-xs"></i>
              <span className="text-xs font-semibold text-brown">{product.seller}</span>
            </div>
            <h3 className="serif-title text-2xl md:text-3xl font-bold text-charcoal">{product.title}</h3>
            <p className="text-xl font-bold text-maroon">{formatPrice(product.price)}</p>

            {/* ⭐ Rating */}
            <div className="flex items-center gap-2">
              <RatingStars value={product.avgRating} count={product.reviewCount} size="text-sm" />
            </div>

            <dl className="text-xs text-muted space-y-1">
              <div className="flex justify-between"><dt>Type</dt><dd className="text-charcoal font-medium">{product.type}</dd></div>
              <div className="flex justify-between">
                <dt>Availability</dt>
                <dd className="text-charcoal font-medium">{soldOut ? 'Sold out' : `${product.stock} available`}</dd>
              </div>
            </dl>

            {/* Reviews list */}
            {loadingReviews && (
              <p className="text-xs text-muted pt-2 border-t border-cream-200">Loading reviews…</p>
            )}
            {!loadingReviews && reviews.length > 0 && (
              <div className="pt-3 border-t border-cream-200 space-y-3">
                <h4 className="text-xs font-bold text-brown">Recent reviews</h4>
                {reviews.slice(0, 3).map((r, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <RatingStars value={r.rating} count={1} size="text-[10px]" />
                      <span className="text-muted">— {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    {r.comment && <p className="text-charcoal leading-relaxed">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-cream-200 mt-6 space-y-3">
            <button
              onClick={() => { onAdd(product); onClose(); }}
              disabled={soldOut}
              className="w-full bg-maroon hover:bg-maroon-hover disabled:bg-cream-300 text-cream-50 font-medium py-3 rounded-full text-xs uppercase tracking-wider shadow-warm transition flex items-center justify-center space-x-2"
            >
              <i className="fa-solid fa-bag-shopping"></i>
              <span>Add to basket</span>
            </button>
            <p className="text-[10px] text-center text-muted">Prepared by the artisan and delivered by your local agent</p>
          </div>
        </div>
      </div>
    </div>
  );
}