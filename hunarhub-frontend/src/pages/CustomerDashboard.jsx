import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { api } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice } from '../utils/products.js';

const STATUS_STYLE = {
  Placed: 'bg-gold-bg text-gold-soft border-gold/30',
  Confirmed: 'bg-brown-light text-brown border-brown/20',
  Ready: 'bg-maroon-light text-maroon border-maroon/20',
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-cream-200 text-muted border-cream-300',
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDateTime = (d) =>
  new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function StatusBadge({ status }) {
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLE[status] || STATUS_STYLE.Cancelled}`}>
      {status}
    </span>
  );
}

/* ---------- Stars ---------- */
function Stars({ value = 0, size = 'text-base', interactive = false, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className={`inline-flex items-center gap-0.5 ${size}`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hover || value) >= n;
        return (
          <button
            key={n}
            type={interactive ? 'button' : undefined}
            disabled={!interactive}
            onClick={() => interactive && onChange?.(n)}
            onMouseEnter={() => interactive && setHover(n)}
            onMouseLeave={() => interactive && setHover(0)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition' : 'cursor-default'} ${filled ? 'text-gold' : 'text-cream-300'}`}
          >
            <i className="fa-solid fa-star" />
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Order Summary ---------- */
function OrderSummary({ detail }) {
  const itemsTotal =
    detail.order?.items_total ?? detail.items.reduce((sum, it) => sum + Number(it.line_total), 0);
  const shipping = detail.order?.shipping_fee ?? 0;
  const total = detail.order?.total_amount ?? Number(itemsTotal) + Number(shipping);

  return (
    <dl className="mt-4 pt-3 border-t border-cream-300 space-y-1.5 text-xs">
      <div className="flex justify-between text-muted">
        <dt>Items subtotal</dt>
        <dd className="text-charcoal font-medium">{formatPrice(itemsTotal)}</dd>
      </div>
      <div className="flex justify-between text-muted">
        <dt>Shipping fee</dt>
        <dd className="text-charcoal font-medium">{formatPrice(shipping)}</dd>
      </div>
      <div className="flex justify-between pt-1.5 border-t border-cream-200 text-sm font-bold text-charcoal">
        <dt>Final total</dt>
        <dd className="text-maroon">{formatPrice(total)}</dd>
      </div>
    </dl>
  );
}

/* ---------- Review Modal ---------- */
function ReviewModal({ order, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (rating < 1) return setError('Please select a rating (1-5 stars).');

    setSaving(true);
    try {
      await api('/customer/reviews', {
        method: 'POST',
        body: {
          order_id: order.order_id,
          rating,
          comment: comment.trim() || undefined,
        },
      });
      onSubmitted?.({ rating, comment: comment.trim() });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-cream-200 flex items-start justify-between gap-3">
          <div>
            <h3 className="serif-title text-2xl font-bold text-charcoal">Write a review</h3>
            <p className="text-xs text-muted mt-1">Order #{order.order_id} — {order.seller_name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-cream-100 flex items-center justify-center text-muted">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-brown mb-2">Your rating</label>
            <Stars value={rating} onChange={setRating} interactive size="text-3xl" />
            {rating > 0 && (
              <p className="text-xs text-muted mt-1.5">
                {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rating]}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="comment" className="block text-xs font-semibold text-brown mb-1.5">
              Comment (optional)
            </label>
            <textarea
              id="comment"
              rows={4}
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this seller..."
              className="w-full px-4 py-3 text-sm bg-cream-50 border border-cream-300 rounded-xl text-charcoal placeholder-muted focus:outline-none focus:border-maroon focus:ring-1 focus:ring-maroon transition resize-none"
            />
            <p className="text-[11px] text-muted mt-1 text-right">{comment.length}/500</p>
          </div>

          {error && (
            <div role="alert" className="flex items-start space-x-2 bg-maroon-light text-maroon text-xs rounded-xl px-4 py-3">
              <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full text-sm font-semibold text-muted hover:text-charcoal">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || rating < 1}
              className="bg-maroon hover:bg-maroon-hover disabled:opacity-50 disabled:cursor-not-allowed text-cream-50 font-medium px-6 py-2.5 rounded-full text-sm shadow-warm transition"
            >
              {saving ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Report Modal ---------- */
function ReportModal({ order, onClose, onSubmitted }) {
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (description.trim().length < 10) {
      return setError('Please describe the issue (min 10 characters).');
    }

    setSaving(true);
    try {
      await api('/customer/reports', {
        method: 'POST',
        body: {
          order_id: order.order_id,
          description: description.trim(),
        },
      });
      onSubmitted?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-cream-200 flex items-start justify-between gap-3">
          <div>
            <h3 className="serif-title text-2xl font-bold text-charcoal">Report an issue</h3>
            <p className="text-xs text-muted mt-1">Order #{order.order_id} — {order.seller_name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-cream-100 flex items-center justify-center text-muted">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          <div>
            <label htmlFor="description" className="block text-xs font-semibold text-brown mb-1.5">
              What went wrong?
            </label>
            <textarea
              id="description"
              rows={5}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem in detail..."
              className="w-full px-4 py-3 text-sm bg-cream-50 border border-cream-300 rounded-xl text-charcoal placeholder-muted focus:outline-none focus:border-maroon focus:ring-1 focus:ring-maroon transition resize-none"
            />
            <p className="text-[11px] text-muted mt-1 text-right">{description.length}/500</p>
          </div>

          {/* ⭐ UPDATED: Info box maroon theme */}
          <div className="bg-maroon-light border border-maroon/20 rounded-xl px-4 py-3 text-xs text-maroon">
            <i className="fa-solid fa-circle-info mr-1.5"></i>
            Your report will be reviewed by an admin.
          </div>

          {error && (
            <div role="alert" className="flex items-start space-x-2 bg-maroon-light text-maroon text-xs rounded-xl px-4 py-3">
              <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full text-sm font-semibold text-muted hover:text-charcoal">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-maroon hover:bg-maroon-hover disabled:opacity-50 disabled:cursor-not-allowed text-cream-50 font-medium px-6 py-2.5 rounded-full text-sm shadow-warm transition"
            >
              {saving ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Order Card ---------- */
function OrderCard({ order, onWriteReview, onReport, onCancel }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [review, setReview] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const toggle = async () => {
    setOpen((o) => !o);
    if (detail || loading) return;
    setLoading(true);
    setError('');
    try {
      const data = await api(`/customer/orders/${order.order_id}`);
      setDetail({ order: data.order, items: data.items, history: data.history });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isDelivered = order.status === 'Delivered';
  const isPlaced = order.status === 'Placed';

  const handleCancel = async () => {
    if (!window.confirm(`Cancel Order #${order.order_id}? Stock will be returned to the seller.`)) return;
    setCancelling(true);
    try {
      await api(`/customer/orders/${order.order_id}/cancel`, { method: 'PUT' });
      onCancel?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelling(false);
    }
  };

  // ⭐ Product thumbnail info from list response
  const items = order.items || [];
  const firstItem = items[0];
  const extraCount = items.length - 1;

  return (
    <article className="bg-white rounded-2xl border border-cream-200 shadow-card overflow-hidden">
      <button
        onClick={toggle}
        aria-expanded={open}
        className="w-full text-left p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-cream-50 transition"
      >
        <div className="flex items-center gap-4">
          {/* ⭐ Product Thumbnail */}
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-cream-100 flex-shrink-0 border border-cream-200 relative">
            {firstItem?.image_url ? (
              <img
                src={firstItem.image_url}
                alt={firstItem.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`absolute inset-0 flex items-center justify-center text-cream-300 ${firstItem?.image_url ? 'hidden' : ''}`}>
              <i className="fa-solid fa-box text-xl" />
            </div>
            {extraCount > 0 && (
              <span className="absolute bottom-1 right-1 bg-charcoal/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                +{extraCount}
              </span>
            )}
          </div>

          <div>
            <p className="serif-title text-xl font-bold text-charcoal">Order #{order.order_id}</p>
            <p className="text-xs text-muted mt-0.5">
              {order.seller_name} — {fmtDate(order.order_date)}
            </p>
            {/* ⭐ Product Name */}
            {firstItem && (
              <p className="text-xs text-charcoal mt-1 line-clamp-1">
                <i className="fa-solid fa-tag text-muted mr-1 text-[10px]" />
                {firstItem.name}
                {extraCount > 0 && <span className="text-muted"> + {extraCount} more</span>}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <StatusBadge status={order.status} />
          <span className="serif-title text-xl font-bold text-maroon">{formatPrice(order.total_amount)}</span>
          <i className={`fa-solid fa-chevron-down text-xs text-muted transition-transform ${open ? 'rotate-180' : ''}`}></i>
        </div>
      </button>

      {open && (
        <div className="border-t border-cream-200 p-5 grid gap-6 md:grid-cols-2 bg-cream-50/50">
          {loading && <p className="text-xs text-muted">Loading details…</p>}
          {error && <p className="text-xs text-maroon">{error}</p>}

          {detail && (
            <>
              <div>
                <h4 className="text-xs font-bold text-brown mb-3">Items</h4>
                <ul className="space-y-2">
                  {detail.items.map((it) => (
                    <li key={it.product_id} className="flex justify-between gap-3 text-xs">
                      <span className="text-charcoal">
                        {it.product_name} <span className="text-muted">× {it.quantity}</span>
                      </span>
                      <span className="font-semibold text-charcoal whitespace-nowrap">{formatPrice(it.line_total)}</span>
                    </li>
                  ))}
                </ul>
                <OrderSummary detail={detail} />

                <div className="mt-5 pt-4 border-t border-cream-300 space-y-2">
                  {/* Cancel — only if Placed */}
                  {isPlaced && (
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="w-full border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium py-2.5 rounded-full text-xs transition flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-ban"></i>
                      {cancelling ? 'Cancelling…' : 'Cancel order'}
                    </button>
                  )}

                  {/* Review — only if Delivered */}
                  {isDelivered && !review && (
                    <button
                      onClick={() => onWriteReview(order, (r) => setReview(r))}
                      className="w-full bg-maroon hover:bg-maroon-hover text-cream-50 font-medium py-2.5 rounded-full text-xs shadow-sm transition flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-star"></i>
                      Write a review
                    </button>
                  )}
                  {review && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Stars value={review.rating} size="text-xs" />
                        <span className="text-[11px] font-semibold text-emerald-800">Review submitted</span>
                      </div>
                      {review.comment && <p className="text-xs text-charcoal">{review.comment}</p>}
                    </div>
                  )}

                  {/* Report — maroon color */}
                  <button
                    onClick={() => onReport(order)}
                    className="w-full border border-maroon/30 text-maroon hover:bg-maroon-light font-medium py-2.5 rounded-full text-xs transition flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-flag"></i>
                    Report an issue
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-brown mb-3">Status history</h4>
                <ol className="space-y-2 border-l-2 border-cream-300 pl-4">
                  {detail.history.map((h, i) => (
                    <li key={i} className="text-xs relative">
                      <span className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-maroon"></span>
                      <span className="font-semibold text-charcoal">{h.status}</span>
                      <span className="text-muted"> — {fmtDateTime(h.changed_at)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}
        </div>
      )}
    </article>
  );
}

/* ---------- Main Dashboard ---------- */
export default function CustomerDashboard() {
  const location = useLocation();
  const { showToast } = useCart();
  const placedId = location.state?.placed;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewCallback, setReviewCallback] = useState(null);
  const [reportOrder, setReportOrder] = useState(null);

  const loadOrders = () => {
    setLoading(true);
    api('/customer/orders')
      .then((data) => setOrders(data.orders || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openReview = (order, cb) => {
    setReviewOrder(order);
    setReviewCallback(() => cb);
  };

  const handleReviewSubmitted = (data) => {
    if (reviewCallback) reviewCallback(data);
    setReviewOrder(null);
    setReviewCallback(null);
    showToast?.('Review submitted. Thank you!');
  };

  const handleReportSubmitted = () => {
    setReportOrder(null);
    showToast?.('Report submitted. Admin will review it.');
  };

  const handleOrderCancelled = () => {
    showToast?.('Order cancelled. Stock returned to the seller.');
    loadOrders();
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="serif-title text-4xl font-bold text-charcoal">My orders</h1>
        <p className="text-sm text-muted mt-1 mb-8">Track what you've ordered and where it is.</p>

        {placedId && (
          <div role="status" className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm rounded-xl px-4 py-3 mb-6">
            <i className="fa-solid fa-circle-check"></i>
            <span>Order #{placedId} placed. Your agent will confirm it soon.</span>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-cream-100 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="py-12 text-center">
            <p className="text-base font-semibold text-charcoal">Couldn't load your orders</p>
            <p className="text-xs text-muted mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="py-16 text-center bg-white rounded-2xl border border-cream-200">
            <i className="fa-solid fa-basket-shopping text-4xl text-cream-300 mb-3"></i>
            <p className="text-base font-semibold text-charcoal">No orders yet</p>
            <p className="text-xs text-muted mt-1 mb-5">When you place an order, it will show up here.</p>
            <Link to="/#featured" className="inline-block bg-maroon hover:bg-maroon-hover text-cream-50 text-xs font-semibold px-6 py-3 rounded-full transition">
              Browse products
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((o) => (
              <OrderCard
                key={o.order_id}
                order={o}
                onWriteReview={openReview}
                onReport={setReportOrder}
                onCancel={handleOrderCancelled}
              />
            ))}
          </div>
        )}
      </div>

      {reviewOrder && (
        <ReviewModal
          order={reviewOrder}
          onClose={() => {
            setReviewOrder(null);
            setReviewCallback(null);
          }}
          onSubmitted={handleReviewSubmitted}
        />
      )}
      {reportOrder && (
        <ReportModal
          order={reportOrder}
          onClose={() => setReportOrder(null)}
          onSubmitted={handleReportSubmitted}
        />
      )}
    </Layout>
  );
}