import { formatPrice } from '../utils/products.js';

export function ProductImage({ src, alt, className = '' }) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-cream-100 text-cream-300 ${className}`}>
        <i className="fa-solid fa-hands-holding-circle text-4xl"></i>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}

// Small reusable star display
export function RatingStars({ value = 0, count = 0, size = 'text-xs' }) {
  if (count === 0) {
    return <span className={`${size} text-muted italic`}>No reviews yet</span>;
  }
  return (
    <span className={`inline-flex items-center gap-1 ${size}`}>
      <i className="fa-solid fa-star text-gold"></i>
      <span className="font-semibold text-charcoal">{value.toFixed(1)}</span>
      <span className="text-muted">({count})</span>
    </span>
  );
}

export default function ProductCard({ product, onQuickView, onAdd }) {
  const soldOut = product.stock != null && product.stock <= 0;

  return (
    <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-card hover:shadow-warm transition-all duration-300 flex flex-col justify-between group">
      <div className="relative overflow-hidden aspect-[4/3] bg-cream-100 cursor-pointer" onClick={() => onQuickView(product)}>
        <ProductImage
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-white/95 backdrop-blur text-brown text-[10px] font-bold px-2.5 py-1 rounded-full border border-cream-200 shadow-sm flex items-center space-x-1">
            <i className="fa-solid fa-circle-check text-maroon text-[9px]"></i>
            <span>{product.seller}</span>
          </span>
        </div>
        {soldOut && (
          <span className="absolute top-3 right-3 bg-charcoal text-white text-[10px] font-bold px-2.5 py-1 rounded-full">Sold out</span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-[11px] text-muted mb-1">
            <span className="uppercase tracking-wider font-medium text-gold-soft">{product.categoryName}</span>
            <span className="font-medium">{product.type}</span>
          </div>
          <h3
            onClick={() => onQuickView(product)}
            className="font-semibold text-charcoal text-base group-hover:text-maroon transition line-clamp-2 cursor-pointer"
          >
            {product.title}
          </h3>
          {/* ⭐ NEW: Rating */}
          <div className="mt-1.5">
            <RatingStars value={product.avgRating} count={product.reviewCount} />
          </div>
        </div>

        <div className="pt-3 border-t border-cream-100 flex items-center justify-between">
          <span className="serif-title text-xl font-bold text-maroon">{formatPrice(product.price)}</span>
          <button
            onClick={() => onAdd(product)}
            disabled={soldOut}
            className="bg-maroon hover:bg-maroon-hover disabled:bg-cream-300 disabled:cursor-not-allowed text-cream-50 px-4 py-2 rounded-full text-xs font-semibold transition flex items-center space-x-1.5"
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
            <span>Add to basket</span>
          </button>
        </div>
      </div>
    </div>
  );
}