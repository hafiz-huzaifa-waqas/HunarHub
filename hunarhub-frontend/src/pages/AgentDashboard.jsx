import { useCallback, useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout.jsx';
import { api } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatPrice } from '../utils/products.js';

/* ---------- Constants ---------- */
const NEXT_STATUS = {
  Placed: ['Confirmed', 'Cancelled'],
  Confirmed: ['Ready', 'Cancelled'],
  Ready: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

const ACTION_LABEL = {
  Confirmed: 'Confirm',
  Ready: 'Mark ready',
  Delivered: 'Mark delivered',
  Cancelled: 'Cancel',
};

const STATUS_STYLE = {
  Placed: 'bg-gold-bg text-gold-soft border-gold/30',
  Confirmed: 'bg-brown-light text-brown border-brown/20',
  Ready: 'bg-maroon-light text-maroon border-maroon/20',
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-cream-200 text-muted border-cream-300',
  Pending: 'bg-gold-bg text-gold-soft border-gold/30',
  Verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactive: 'bg-cream-200 text-muted border-cream-300',
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const inputCls =
  'w-full px-4 py-2.5 text-sm bg-cream-50 border border-cream-300 rounded-xl text-charcoal placeholder-muted focus:outline-none focus:border-maroon focus:ring-1 focus:ring-maroon transition';

/* ---------- Small UI bits ---------- */
function Badge({ status }) {
  return (
    <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLE[status] || 'bg-cream-200 text-muted border-cream-300'}`}>
      {status}
    </span>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-brown mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted mt-1">{hint}</span>}
    </label>
  );
}

function Empty({ title, body, action }) {
  return (
    <div className="bg-white rounded-2xl border border-cream-200 px-6 py-12 text-center">
      <p className="text-base font-semibold text-charcoal">{title}</p>
      <p className="text-xs text-muted mt-1 max-w-md mx-auto">{body}</p>
      {action}
    </div>
  );
}

function ModalShell({ title, subtitle, onClose, wide, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-3xl shadow-2xl w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="px-6 py-4 border-b border-cream-200 flex items-start justify-between gap-4">
          <div>
            <h3 className="serif-title text-xl font-bold text-charcoal">{title}</h3>
            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-cream-100 flex items-center justify-center text-muted">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* =================================================================
   MAIN DASHBOARD
   ================================================================= */
export default function AgentDashboard() {
  const { user } = useAuth();
  const { showToast } = useCart();

  const [tab, setTab] = useState('overview');

  const [earnings, setEarnings] = useState(null);
  const [orders, setOrders] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [registerOpen, setRegisterOpen] = useState(false);
  const [productsSeller, setProductsSeller] = useState(null);
  const [historyOrder, setHistoryOrder] = useState(null);
  const [reportOrder, setReportOrder] = useState(null);

  // ---------- Loaders ----------
  const loadEarnings = useCallback(async () => {
    const d = await api('/agent/earnings');
    setEarnings(d.earnings);
  }, []);
  const loadOrders = useCallback(async () => {
    const d = await api('/agent/orders');
    setOrders(d.orders || []);
  }, []);
  const loadSellers = useCallback(async () => {
    const d = await api('/agent/sellers');
    setSellers(d.sellers || []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadEarnings(), loadOrders(), loadSellers()]);
      } catch (e) {
        setLoadError(e.message);
      } finally {
        setLoading(false);
      }
    })();
    Promise.allSettled([api('/regions'), api('/categories')]).then(([r, c]) => {
      if (r.status === 'fulfilled') setRegions(r.value.regions || []);
      if (c.status === 'fulfilled') setCategories(c.value.categories || []);
    });
  }, [loadEarnings, loadOrders, loadSellers]);

  // ---------- Helpers ----------
  const sellerName = (id) => sellers.find((s) => s.seller_id === id)?.name || `Seller #${id}`;
  const categoryName = (id) => categories.find((c) => c.category_id === id)?.name || `#${id}`;
  const regionName = (id) => regions.find((r) => r.region_id === id)?.name || `#${id}`;

  // ---------- Order status update ----------
  const [busyOrder, setBusyOrder] = useState(null);
  async function updateStatus(orderId, status) {
    if (status === 'Cancelled' && !window.confirm(`Cancel order #${orderId}? Stock will be returned.`)) return;
    setBusyOrder(orderId);
    try {
      await api(`/agent/orders/${orderId}/status`, {
        method: 'PUT',
        body: { status },
      });
      setOrders((prev) => prev.map((o) => (o.order_id === orderId ? { ...o, status } : o)));
      showToast?.(`Order #${orderId} → ${status}`);
      if (status === 'Delivered') loadEarnings().catch(() => {});
    } catch (e) {
      showToast?.(e.message);
    } finally {
      setBusyOrder(null);
    }
  }

  // ---------- Derived ----------
  const stats = useState(() => {
    const earned = Number(earnings?.total_earned ?? 0);
    const paid = Number(earnings?.total_paid ?? 0);
    return {
      earned,
      paid,
      pending: Math.max(0, Number(earnings?.pending ?? earned - paid)),
      activeSellers: sellers.filter((s) => s.status === 'Verified').length,
    };
  })[0];

  const pendingCount = orders.filter((o) => !['Delivered', 'Cancelled'].includes(o.status)).length;

  const TABS = [
    { id: 'overview', label: 'Overview', icon: 'fa-chart-pie' },
    { id: 'sellers', label: `My Sellers (${sellers.length})`, icon: 'fa-store' },
    { id: 'orders', label: `Orders${pendingCount ? ` (${pendingCount})` : ''}`, icon: 'fa-box' },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="h-12 w-64 bg-cream-100 rounded-2xl animate-pulse mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-cream-100 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-maroon">Agent workspace</span>
            <h1 className="serif-title text-3xl sm:text-4xl font-bold text-charcoal mt-1">
              Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-sm text-muted mt-1">Manage your sellers, orders, and earnings.</p>
          </div>
          <button
            onClick={() => setRegisterOpen(true)}
            className="bg-maroon hover:bg-maroon-hover text-cream-50 font-medium px-5 py-2.5 rounded-full text-sm shadow-warm transition flex items-center gap-2"
          >
            <i className="fa-solid fa-plus text-xs" />
            Register seller
          </button>
        </div>

        {loadError && (
          <div className="mb-4 text-xs text-maroon bg-maroon-light border border-maroon/20 rounded-xl px-4 py-3">
            Couldn't load some data: {loadError}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-cream-200 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition flex items-center gap-2 ${
                tab === t.id ? 'border-maroon text-maroon' : 'border-transparent text-muted hover:text-charcoal'
              }`}
            >
              <i className={`fa-solid ${t.icon} text-xs`} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== OVERVIEW ===== */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-card">
                <p className="text-[11px] uppercase text-muted font-semibold">Total earned</p>
                <p className="serif-title text-2xl font-bold text-charcoal mt-0.5">{formatPrice(stats.earned)}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-card">
                <p className="text-[11px] uppercase text-muted font-semibold">Paid out</p>
                <p className="serif-title text-2xl font-bold text-charcoal mt-0.5">{formatPrice(stats.paid)}</p>
              </div>
              <div className="bg-maroon-light p-5 rounded-2xl border border-maroon/30 shadow-card">
                <p className="text-[11px] uppercase text-maroon font-semibold">Pending commission</p>
                <p className="serif-title text-2xl font-bold text-maroon mt-0.5">{formatPrice(stats.pending)}</p>
              </div>
            </div>

            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-charcoal">Recent orders</h2>
                {orders.length > 5 && (
                  <button onClick={() => setTab('orders')} className="text-xs font-semibold text-maroon hover:underline">
                    See all {orders.length}
                  </button>
                )}
              </div>
              {orders.length === 0 ? (
                <Empty title="No orders yet" body="Orders from your sellers' customers will show up here." />
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((o) => (
                    <OrderRow
                      key={o.order_id}
                      order={o}
                      sellerName={sellerName(o.seller_id)}
                      busyOrder={busyOrder}
                      onUpdate={updateStatus}
                      onHistory={setHistoryOrder}
                      onReport={setReportOrder}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ===== SELLERS ===== */}
        {tab === 'sellers' && (
          <div className="space-y-4">
            {sellers.length === 0 ? (
              <Empty
                title="No sellers yet"
                body="Register your first seller to start listing products."
                action={
                  <button
                    onClick={() => setRegisterOpen(true)}
                    className="mt-4 bg-maroon hover:bg-maroon-hover text-cream-50 font-medium px-5 py-2.5 rounded-full text-sm"
                  >
                    Register seller
                  </button>
                }
              />
            ) : (
              <div className="bg-white rounded-2xl border border-cream-200 shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-cream-100 text-charcoal">
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold">Seller</th>
                        <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold">Category</th>
                        <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold">Region</th>
                        <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold">Status</th>
                        <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellers.map((s) => (
                        <tr key={s.seller_id} className="border-t border-cream-200 hover:bg-cream-50">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-charcoal">{s.name}</div>
                            <div className="text-xs text-muted">{s.contact}</div>
                          </td>
                          <td className="px-4 py-3">{categoryName(s.category_id)}</td>
                          <td className="px-4 py-3">{regionName(s.region_id)}</td>
                          <td className="px-4 py-3"><Badge status={s.status} /></td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setProductsSeller(s)}
                              className="text-xs font-semibold text-maroon hover:underline"
                            >
                              Manage products
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== ORDERS ===== */}
        {tab === 'orders' && (
          <section>
            <div className="space-y-3">
              {orders.length === 0 ? (
                <Empty title="No orders yet" body="Orders from your sellers' customers will show up here." />
              ) : (
                orders.map((o) => (
                  <OrderRow
                    key={o.order_id}
                    order={o}
                    sellerName={sellerName(o.seller_id)}
                    busyOrder={busyOrder}
                    onUpdate={updateStatus}
                    onHistory={setHistoryOrder}
                    onReport={setReportOrder}
                  />
                ))
              )}
            </div>
          </section>
        )}
      </div>

      {/* Modals */}
      {registerOpen && (
        <RegisterSellerModal
          regions={regions}
          categories={categories}
          onClose={() => setRegisterOpen(false)}
          onCreated={() => {
            setRegisterOpen(false);
            showToast?.('Seller registered. Admin will verify soon.');
            loadSellers();
          }}
        />
      )}

      {productsSeller && (
        <ManageProductsModal
          seller={productsSeller}
          categories={categories}
          onClose={() => setProductsSeller(null)}
          onChanged={loadSellers}
        />
      )}

      {historyOrder && (
        <OrderHistoryModal order={historyOrder} onClose={() => setHistoryOrder(null)} />
      )}

      {reportOrder && (
        <FileReportModal
          order={reportOrder}
          onClose={() => setReportOrder(null)}
          onFiled={() => {
            setReportOrder(null);
            showToast?.('Report filed. Admin will review it.');
          }}
        />
      )}
    </Layout>
  );
}

/* ===================== Sub-components ===================== */

function OrderRow({ order, sellerName, busyOrder, onUpdate, onHistory, onReport }) {
  const next = NEXT_STATUS[order.status] || [];
  const items = order.items || [];
  const firstItem = items[0];
  const extraCount = items.length - 1;

  return (
    <div className="bg-white rounded-2xl border border-cream-200 shadow-card hover:shadow-warm transition overflow-hidden p-5">
      <div className="flex flex-wrap items-start gap-4 mb-3">
        {/* Product thumbnail */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-cream-100 flex-shrink-0 border border-cream-200 relative">
          {firstItem?.image_url ? (
            <img
              src={firstItem.image_url}
              alt={firstItem.name}
              className="w-full h-full object-cover"
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

        {/* Order info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-charcoal">Order #{order.order_id}</h3>
            <Badge status={order.status} />
          </div>
          <p className="text-xs text-muted mt-0.5">
            {sellerName} · {fmtDate(order.order_date)}
          </p>
          {firstItem && (
            <p className="text-xs text-charcoal mt-1 line-clamp-1">
              <i className="fa-solid fa-tag text-muted mr-1 text-[10px]" />
              {firstItem.name}
              {extraCount > 0 && (
                <span className="text-muted"> + {extraCount} more</span>
              )}
            </p>
          )}
        </div>

        {/* Total */}
        <p className="serif-title text-xl font-bold text-maroon flex-shrink-0">
          {formatPrice(order.total_amount ?? (Number(order.items_total || 0) + Number(order.shipping_fee || 0)))}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-cream-200">
        {next.length > 0 ? (
          <>
            <span className="text-[11px] uppercase tracking-widest text-muted font-semibold mr-1">
              Update:
            </span>
            {next.map((s) => (
              <button
                key={s}
                disabled={busyOrder === order.order_id}
                onClick={() => onUpdate(order.order_id, s)}
                className={
                  s === 'Cancelled'
                    ? 'rounded-full border border-red-300 px-4 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 transition'
                    : 'rounded-full bg-maroon px-4 py-1.5 text-xs font-semibold text-cream-50 hover:bg-maroon-hover disabled:opacity-50 transition'
                }
              >
                {ACTION_LABEL[s] || s}
              </button>
            ))}
          </>
        ) : (
          <p className="text-xs text-muted italic">No further actions available.</p>
        )}
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => onHistory(order)}
            className="text-xs font-semibold text-muted hover:text-charcoal transition flex items-center gap-1.5"
          >
            <i className="fa-solid fa-clock-rotate-left" />
            History
          </button>
          <button
            onClick={() => onReport(order)}
            className="text-xs font-semibold text-brown hover:underline flex items-center gap-1.5"
          >
            <i className="fa-solid fa-flag" />
            Report
          </button>
        </div>
      </div>
    </div>
  );
}

function RegisterSellerModal({ regions, categories, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    contact: '',
    region_id: '',
    category_id: '',
    consent_given: false,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Seller name is required.');
    if (!form.contact.trim()) return setError('Contact is required.');
    if (!form.region_id) return setError('Region is required.');
    if (!form.category_id) return setError('Category is required.');
    if (!form.consent_given) return setError('Consent is mandatory (BR-1).');

    setSaving(true);
    try {
      await api('/agent/sellers', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          contact: form.contact.trim(),
          region_id: Number(form.region_id),
          category_id: Number(form.category_id),
          consent_given: true,
        },
      });
      onCreated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Register new seller" subtitle="Consent is mandatory (BR-1)." onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Seller name">
          <input className={inputCls} value={form.name} onChange={set('name')} placeholder="Kulsoom Bibi" required />
        </Field>
        <Field label="Contact number">
          <input className={inputCls} value={form.contact} onChange={set('contact')} placeholder="0300-1234567" required />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Region">
            <select className={inputCls} value={form.region_id} onChange={set('region_id')} required>
              <option value="">{regions.length ? 'Select region' : 'Loading…'}</option>
              {regions.map((r) => (
                <option key={r.region_id} value={r.region_id}>{r.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Main category">
            <select className={inputCls} value={form.category_id} onChange={set('category_id')} required>
              <option value="">{categories.length ? 'Select category' : 'Loading…'}</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <label className="flex items-start gap-2 text-xs text-brown">
          <input
            type="checkbox"
            className="mt-0.5 accent-maroon"
            checked={form.consent_given}
            onChange={set('consent_given')}
          />
          <span>This seller has agreed to let me list and manage their products on HunarHub.</span>
        </label>

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
            disabled={saving || !form.consent_given}
            className="bg-maroon hover:bg-maroon-hover disabled:opacity-50 text-cream-50 font-medium px-6 py-2.5 rounded-full text-sm shadow-warm transition"
          >
            {saving ? 'Registering…' : 'Register seller'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ManageProductsModal({ seller, categories, onClose, onChanged }) {
  const { showToast } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', product_type: 'Product', price: '', category_id: '', available_qty: '', image_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const formRef = useRef(null);

  const load = () => {
    setLoading(true);
    setError('');
    api(`/agent/sellers/${seller.seller_id}/products`)
      .then((d) => setProducts(d.products || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [seller.seller_id]);

  // 👇 Auto Scroll to Top
  const scrollToForm = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const openNew = () => {
    setEditing('new');
    setForm({
      name: '', product_type: 'Product', price: '', category_id: String(seller.category_id || ''),
      available_qty: '', image_url: '',
    });
    setFormError('');
    scrollToForm();
  };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name, product_type: p.product_type, price: String(p.price),
      category_id: String(p.category_id), available_qty: String(p.available_qty),
      image_url: p.image_url || '',
    });
    setFormError('');
    scrollToForm();
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) return setFormError('Name is required.');
    if (!(Number(form.price) > 0)) return setFormError('Price must be greater than 0.');
    if (Number(form.available_qty) < 0) return setFormError('Quantity cannot be negative.');
    if (!form.category_id) return setFormError('Category is required.');

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        product_type: form.product_type,
        price: Number(form.price),
        category_id: Number(form.category_id),
        available_qty: Number(form.available_qty),
        image_url: form.image_url.trim() || null,
      };
      if (editing === 'new') {
        await api('/agent/products', { method: 'POST', body: { ...body, seller_id: seller.seller_id } });
        showToast?.('Product added');
      } else {
        await api(`/agent/products/${editing.product_id}`, { method: 'PUT', body });
        showToast?.('Product updated');
      }
      setEditing(null);
      load();
      onChanged?.();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p) => {
    try {
      await api(`/agent/products/${p.product_id}`, {
        method: 'PUT',
        body: { is_active: !p.is_active },
      });
      showToast?.(`Product ${p.is_active ? 'deactivated' : 'activated'}`);
      load();
    } catch (err) {
      showToast?.(err.message);
    }
  };

  return (
    <ModalShell
      title={`Products — ${seller.name}`}
      subtitle="Add, edit, or deactivate products. Past orders keep a snapshot (BR-7)."
      onClose={onClose}
      wide
    >
      {/* 👇 Editing Form with scroll ref */}
      {editing && (
        <form
          ref={formRef}
          onSubmit={save}
          className="mb-6 p-4 rounded-xl border border-cream-200 bg-cream-50 space-y-3 scroll-mt-4"
        >
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-charcoal text-sm">
              {editing === 'new' ? 'Add new product' : `Edit: ${editing.name}`}
            </h4>
            <button type="button" onClick={() => setEditing(null)} className="text-xs font-semibold text-muted hover:text-charcoal">
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Name">
              <input className={inputCls} value={form.name} onChange={set('name')} required />
            </Field>
            <Field label="Type">
              <select className={inputCls} value={form.product_type} onChange={set('product_type')}>
                <option value="Product">Product</option>
                <option value="Service">Service</option>
              </select>
            </Field>
            <Field label="Price (Rs.)">
              <input type="number" step="0.01" min="0.01" className={inputCls} value={form.price} onChange={set('price')} required />
            </Field>
            <Field label="Available quantity">
              <input type="number" min="0" className={inputCls} value={form.available_qty} onChange={set('available_qty')} required />
            </Field>
            <Field label="Category">
              <select className={inputCls} value={form.category_id} onChange={set('category_id')} required>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Image URL (optional)">
              <input className={inputCls} value={form.image_url} onChange={set('image_url')} placeholder="https://…" />
            </Field>
          </div>

          {/* Image Preview */}
          {form.image_url && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-cream-200">
              <img
                src={form.image_url}
                alt="Preview"
                className="w-16 h-16 rounded-lg object-cover bg-cream-100"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div>
                <p className="text-xs font-semibold text-charcoal">Image preview</p>
                <p className="text-[11px] text-muted">This is how it will appear to customers.</p>
              </div>
            </div>
          )}

          {formError && (
            <div className="text-xs text-maroon bg-maroon-light border border-maroon/20 rounded-lg px-3 py-2">{formError}</div>
          )}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-full text-sm font-semibold text-muted hover:text-charcoal">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="bg-maroon hover:bg-maroon-hover disabled:opacity-60 text-cream-50 font-medium px-6 py-2.5 rounded-full text-sm">
              {saving ? 'Saving…' : editing === 'new' ? 'Add product' : 'Save changes'}
            </button>
          </div>
        </form>
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-charcoal">{products.length} product(s)</p>
          <p className="text-xs text-muted mt-0.5">Preview of what customers see</p>
        </div>
        {!editing && (
          <button onClick={openNew} className="bg-maroon hover:bg-maroon-hover text-cream-50 font-medium px-5 py-2 rounded-full text-xs flex items-center gap-2">
            <i className="fa-solid fa-plus text-[10px]" /> Add product
          </button>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-cream-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-xs text-maroon bg-maroon-light border border-maroon/20 rounded-lg px-3 py-2">{error}</div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-3">
            <i className="fa-solid fa-box-open text-2xl text-muted" />
          </div>
          <p className="text-sm font-semibold text-charcoal">No products yet</p>
          <p className="text-xs text-muted mt-1 mb-5">Add your first product to start selling.</p>
          <button onClick={openNew} className="bg-maroon hover:bg-maroon-hover text-cream-50 font-medium px-5 py-2.5 rounded-full text-sm">
            Add product
          </button>
        </div>
      )}

      {/* 👇 Products Grid (Small Boxes) */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((p) => (
            <div
              key={p.product_id}
              className={`bg-white rounded-2xl border overflow-hidden shadow-card hover:shadow-warm transition ${
                p.is_active ? 'border-cream-200' : 'border-red-200 opacity-75'
              }`}
            >
              <div className="relative aspect-[4/3] bg-cream-100">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`absolute inset-0 flex items-center justify-center text-cream-300 ${p.image_url ? 'hidden' : ''}`}>
                  <i className="fa-solid fa-hands-holding-circle text-4xl" />
                </div>

                <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full border ${p.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {p.is_active ? 'Active' : 'Inactive'}
                </span>

                <span className="absolute top-2 left-2 bg-white/90 backdrop-blur text-brown text-[10px] font-bold px-2 py-1 rounded-full border border-cream-200">
                  {p.product_type}
                </span>
              </div>

              <div className="p-4">
                <h4 className="font-semibold text-charcoal text-sm line-clamp-2">{p.name}</h4>
                <div className="flex items-center justify-between mt-2">
                  <p className="serif-title text-lg font-bold text-maroon">{formatPrice(p.price)}</p>
                  <p className="text-xs text-muted">
                    {p.available_qty > 0 ? `${p.available_qty} in stock` : <span className="text-red-600 font-semibold">Sold out</span>}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-cream-200">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex-1 text-xs font-semibold bg-cream-100 hover:bg-cream-200 text-charcoal px-3 py-2 rounded-full transition flex items-center justify-center gap-1.5"
                  >
                    <i className="fa-solid fa-pen text-[10px]" /> Edit
                  </button>
                  <button
                    onClick={() => toggleActive(p)}
                    className={`flex-1 text-xs font-semibold px-3 py-2 rounded-full transition flex items-center justify-center gap-1.5 ${
                      p.is_active
                        ? 'bg-red-50 hover:bg-red-100 text-red-700'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <i className={`fa-solid ${p.is_active ? 'fa-eye-slash' : 'fa-eye'} text-[10px]`} />
                    {p.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
}

function OrderHistoryModal({ order, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/agent/orders/${order.order_id}/history`)
      .then((d) => setHistory(d.history || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [order.order_id]);

  return (
    <ModalShell title={`Order #${order.order_id} — history`} onClose={onClose}>
      {loading && <p className="text-sm text-muted">Loading…</p>}
      {!loading && error && (
        <div className="text-xs text-maroon bg-maroon-light border border-maroon/20 rounded-lg px-3 py-2">{error}</div>
      )}
      {!loading && !error && history.length === 0 && <p className="text-sm text-muted">No history entries.</p>}
      {!loading && !error && history.length > 0 && (
        <ol className="space-y-4 border-l-2 border-cream-300 pl-4">
          {history.map((h, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-maroon" />
              <p className="font-semibold text-charcoal text-sm">{h.status}</p>
              <p className="text-xs text-muted">
                {fmtDateTime(h.changed_at)} · by {h.changed_by_name || `User #${h.changed_by_user_id}`}
              </p>
            </li>
          ))}
        </ol>
      )}
    </ModalShell>
  );
}

function FileReportModal({ order, onClose, onFiled }) {
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (description.trim().length < 10) {
      return setError('Please describe the issue (min 10 characters).');
    }
    setSaving(true);
    try {
      await api('/agent/reports', {
        method: 'POST',
        body: { order_id: order.order_id, description: description.trim() },
      });
      onFiled?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={`Report order #${order.order_id}`} subtitle="Admin will review it." onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Description">
          <textarea
            rows={4}
            className={inputCls}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What went wrong? Be specific."
            maxLength={500}
          />
        </Field>
        {error && (
          <div className="text-xs text-maroon bg-maroon-light border border-maroon/20 rounded-lg px-3 py-2">{error}</div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full text-sm font-semibold text-muted hover:text-charcoal">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="bg-maroon hover:bg-maroon-hover disabled:opacity-60 text-cream-50 font-medium px-6 py-2.5 rounded-full text-sm shadow-warm">
            {saving ? 'Filing…' : 'File report'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}