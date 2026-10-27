// Maps DB category names (Categories table) to the filter tabs on the home page.
const FILTER_MAP = {
  fashion: ['stitching', 'embroidery'],
  bakery: ['baking', 'cooking classes'],
  henna: ['henna art'],
  crafts: ['handicrafts'],
  tutoring: ['tutoring'],
};

export const TABS = [
  { key: 'all', label: 'All Items' },
  { key: 'fashion', label: 'Fashion & Apparel' },
  { key: 'bakery', label: 'Food & Baking' },
  { key: 'henna', label: 'Henna & Beauty' },
  { key: 'crafts', label: 'Handicrafts' },
  { key: 'tutoring', label: 'Tutoring' },
];

// Turns a row from GET /api/products into the shape the UI uses.
export function normalizeProduct(p) {
  const categoryName = p.category_name || p.category || '';
  const filter =
    Object.entries(FILTER_MAP).find(([, names]) =>
      names.includes(categoryName.toLowerCase())
    )?.[0] || 'other';

  return {
    id: p.product_id ?? p.id,
    sellerId: p.seller_id,
    title: p.name,
    seller: p.seller_name || `Seller #${p.seller_id}`,
    categoryName: categoryName || 'Handmade',
    filter,
    type: p.product_type,
    price: Number(p.price),
    stock: p.available_qty,
    image: p.image_url,
    active: p.is_active !== false,
    // NEW: rating data
    avgRating: Number(p.avg_rating ?? 0),
    reviewCount: Number(p.review_count ?? 0),
  };
}

export const formatPrice = (n) => `Rs. ${Number(n).toLocaleString()}`;

// Flat nationwide shipping fee (the backend sets the real value on each order).
export const SHIPPING_FEE = 200;