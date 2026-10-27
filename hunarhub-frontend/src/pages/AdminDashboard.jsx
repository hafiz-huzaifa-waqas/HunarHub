import { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { api } from '../api.js';
import { useCart } from '../context/CartContext.jsx';

/* ============================================================
   CONSTANTS & HELPERS
   ============================================================ */

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'fa-chart-pie' },
  { id: 'sellers', label: 'Verify Sellers', icon: 'fa-user-check' },
  { id: 'commission', label: 'Commission Rates', icon: 'fa-percent' },
  { id: 'reports', label: 'Reports', icon: 'fa-flag' },
  { id: 'payouts', label: 'Payouts', icon: 'fa-money-bill-transfer' },
];

const STATUS_STYLES = {
  Pending: 'bg-gold-bg text-gold-soft border-gold/30',
  Verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactive: 'bg-cream-200 text-muted border-cream-300',
  Open: 'bg-maroon-light text-maroon border-maroon/20',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const fmtMoney = (n) =>
  `Rs. ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—';

const inputClass =
  'w-full px-4 py-2.5 text-sm bg-cream-50 border border-cream-300 rounded-xl text-charcoal placeholder-muted focus:outline-none focus:border-maroon focus:ring-1 focus:ring-maroon transition';

function Field({ label, htmlFor, children, hint }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-brown mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted mt-1">{hint}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[status] || 'bg-cream-200 text-muted border-cream-300'}`}>
      {status}
    </span>
  );
}

function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start space-x-2 bg-maroon-light text-maroon text-xs rounded-xl px-4 py-3">
      <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
      <span>{message}</span>
    </div>
  );
}

function Empty({ icon, title, body }) {
  return (
    <div className="py-12 text-center bg-white rounded-2xl border border-cream-200">
      <i className={`fa-solid ${icon} text-4xl text-cream-300 mb-3`}></i>
      <p className="text-base font-semibold text-charcoal">{title}</p>
      <p className="text-xs text-muted mt-1 max-w-md mx-auto">{body}</p>
    </div>
  );
}

function Skeleton({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-16 rounded-2xl bg-cream-100 animate-pulse" />
      ))}
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */

export default function AdminDashboard() {
  const { showToast } = useCart();
  const [tab, setTab] = useState('overview');

  // Overview
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');

  // Verify Sellers
  const [pendingSellers, setPendingSellers] = useState([]);
  const [sellersLoading, setSellersLoading] = useState(true);
  const [sellersError, setSellersError] = useState('');

  // Commission
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesError, setRulesError] = useState('');

  // Reports
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState('');

  // Payouts
  const [payouts, setPayouts] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [payoutsError, setPayoutsError] = useState('');

  /* ---------- Loaders ---------- */

  const loadSummary = useCallback(() => {
    setSummaryLoading(true);
    setSummaryError('');
    api('/admin/dashboard')
      .then((d) => setSummary(d.summary || {}))
      .catch((e) => setSummaryError(e.message))
      .finally(() => setSummaryLoading(false));
  }, []);

  const loadPendingSellers = useCallback(() => {
    setSellersLoading(true);
    setSellersError('');
    api('/admin/sellers/pending')
      .then((d) => setPendingSellers(d.sellers || []))
      .catch((e) => setSellersError(e.message))
      .finally(() => setSellersLoading(false));
  }, []);

  const loadRules = useCallback(() => {
    setRulesLoading(true);
    setRulesError('');
    api('/admin/commission-rules')
      .then((d) => setRules(d.rules || []))
      .catch((e) => setRulesError(e.message))
      .finally(() => setRulesLoading(false));
  }, []);

  const loadReports = useCallback(() => {
    setReportsLoading(true);
    setReportsError('');
    api('/admin/reports')
      .then((d) => setReports(d.reports || []))
      .catch((e) => setReportsError(e.message))
      .finally(() => setReportsLoading(false));
  }, []);

  const loadPayouts = useCallback(() => {
    setPayoutsLoading(true);
    setPayoutsError('');
    api('/admin/payouts')
      .then((d) => setPayouts(d.payouts || []))
      .catch((e) => setPayoutsError(e.message))
      .finally(() => setPayoutsLoading(false));
  }, []);

  useEffect(() => {
    loadSummary();
    loadPendingSellers();
    loadRules();
    loadReports();
    loadPayouts();
  }, [loadSummary, loadPendingSellers, loadRules, loadReports, loadPayouts]);

  /* ---------- Actions ---------- */

  const verifySeller = async (sellerId) => {
    if (!window.confirm(`Verify seller #${sellerId}? Their products will become visible to customers.`)) return;
    try {
      await api(`/admin/sellers/${sellerId}/verify`, { method: 'PUT' });
      showToast?.(`Seller #${sellerId} verified`);
      loadPendingSellers();
      loadSummary();
    } catch (err) {
      showToast?.(err.message);
    }
  };

  const inactivateSeller = async (sellerId) => {
    if (!window.confirm(`Set seller #${sellerId} to Inactive? Their products will be hidden.`)) return;
    try {
      await api(`/admin/sellers/${sellerId}/inactivate`, { method: 'PUT' });
      showToast?.(`Seller #${sellerId} set to Inactive`);
      loadPendingSellers();
      loadSummary();
    } catch (err) {
      showToast?.(err.message);
    }
  };

  const saveCommission = async (categoryId, pct) => {
    const num = Number(pct);
    if (!Number.isFinite(num) || num < 0 || num > 100) {
      showToast?.('Commission must be between 0 and 100');
      return;
    }
    try {
      await api(`/admin/commission-rules/${categoryId}`, {
        method: 'PUT',
        body: { commission_percentage: num },
      });
      showToast?.('Commission rate saved');
      loadRules();
    } catch (err) {
      showToast?.(err.message);
    }
  };

  const resolveReport = async (reportId) => {
    if (!window.confirm(`Mark report #${reportId} as Resolved?`)) return;
    try {
      await api(`/admin/reports/${reportId}/resolve`, { method: 'PUT' });
      showToast?.(`Report #${reportId} resolved`);
      loadReports();
      loadSummary();
    } catch (err) {
      showToast?.(err.message);
    }
  };

  const recordPayout = async ({ agent_id, amount, paid_on }) => {
    try {
      await api('/admin/payouts', {
        method: 'POST',
        body: { agent_id: Number(agent_id), amount: Number(amount), paid_on },
      });
      showToast?.('Payout recorded');
      loadPayouts();
      loadSummary();
      return true;
    } catch (err) {
      showToast?.(err.message);
      return false;
    }
  };

  /* ---------- Render ---------- */

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <span className="text-xs uppercase font-bold tracking-widest text-maroon">
            Admin panel
          </span>
          <h1 className="serif-title text-3xl sm:text-4xl md:text-5xl font-bold text-charcoal mt-1">
            Platform administration
          </h1>
          <p className="text-sm text-muted mt-2 max-w-2xl">
            Verify sellers, manage commission rates, resolve reports, and record agent payouts.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-cream-200 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition flex items-center gap-2 ${
                tab === t.id
                  ? 'border-maroon text-maroon'
                  : 'border-transparent text-muted hover:text-charcoal'
              }`}
            >
              <i className={`fa-solid ${t.icon} text-xs`} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== OVERVIEW ===== */}
        {tab === 'overview' && (
          <section>
            {summaryLoading && <Skeleton rows={2} />}
            {!summaryLoading && summaryError && <ErrorBox message={summaryError} />}
            {!summaryLoading && !summaryError && summary && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <StatCard label="Total users" value={summary.total_users} icon="fa-users" tone="maroon" />
                  <StatCard label="Total sellers" value={summary.total_sellers} icon="fa-store" tone="brown" />
                  <StatCard label="Verified sellers" value={summary.verified_sellers} icon="fa-circle-check" tone="emerald" />
                  <StatCard label="Pending sellers" value={summary.pending_sellers} icon="fa-hourglass-half" tone="gold" />
                  <StatCard label="Total products" value={summary.total_products} icon="fa-box" tone="maroon" />
                  <StatCard label="Total orders" value={summary.total_orders} icon="fa-receipt" tone="brown" />
                  <StatCard label="Delivered orders" value={summary.delivered_orders} icon="fa-truck-fast" tone="emerald" />
                  <StatCard label="Open reports" value={summary.open_reports} icon="fa-flag" tone="gold" />
                </div>

                <div className="bg-white rounded-2xl border border-cream-200 shadow-card p-6">
                  <h3 className="font-bold text-charcoal mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-circle-info text-gold" />
                    Quick actions
                  </h3>
                  <p className="text-xs text-muted mb-4">
                    Jump to the section you need.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {summary.pending_sellers > 0 && (
                      <button onClick={() => setTab('sellers')} className="text-xs font-semibold bg-maroon text-cream-50 px-4 py-2 rounded-full hover:bg-maroon-hover transition">
                        Review {summary.pending_sellers} pending seller{summary.pending_sellers > 1 ? 's' : ''}
                      </button>
                    )}
                    {summary.open_reports > 0 && (
                      <button onClick={() => setTab('reports')} className="text-xs font-semibold bg-brown text-cream-50 px-4 py-2 rounded-full hover:bg-brown-hover transition">
                        Resolve {summary.open_reports} open report{summary.open_reports > 1 ? 's' : ''}
                      </button>
                    )}
                    <button onClick={() => setTab('commission')} className="text-xs font-semibold border border-cream-300 text-charcoal px-4 py-2 rounded-full hover:bg-cream-100 transition">
                      Update commission rates
                    </button>
                    <button onClick={() => setTab('payouts')} className="text-xs font-semibold border border-cream-300 text-charcoal px-4 py-2 rounded-full hover:bg-cream-100 transition">
                      Record a payout
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {/* ===== VERIFY SELLERS ===== */}
        {tab === 'sellers' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-charcoal">Pending sellers</h2>
              <button onClick={loadPendingSellers} className="text-xs font-semibold text-maroon hover:underline">
                <i className="fa-solid fa-rotate-right mr-1" /> Refresh
              </button>
            </div>
            {sellersLoading && <Skeleton rows={3} />}
            {!sellersLoading && sellersError && <ErrorBox message={sellersError} />}
            {!sellersLoading && !sellersError && pendingSellers.length === 0 && (
              <Empty icon="fa-circle-check" title="All caught up" body="No sellers are waiting for verification." />
            )}
            {!sellersLoading && !sellersError && pendingSellers.length > 0 && (
              <div className="overflow-x-auto bg-white rounded-2xl border border-cream-200 shadow-card">
                <table className="w-full text-sm">
                  <thead className="bg-cream-100 text-charcoal">
                    <tr>
                      <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold">Seller</th>
                      <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold">Category</th>
                      <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold">Region</th>
                      <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold">Agent</th>
                      <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold">Consent</th>
                      <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSellers.map((s) => (
                      <tr key={s.seller_id} className="border-t border-cream-200 hover:bg-cream-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-charcoal">{s.name}</div>
                          <div className="text-xs text-muted">{s.contact}</div>
                        </td>
                        <td className="px-4 py-3">{s.category_name}</td>
                        <td className="px-4 py-3">{s.region_name}</td>
                        <td className="px-4 py-3 text-xs text-muted">{s.managed_by_agent}</td>
                        <td className="px-4 py-3 text-xs text-muted">{fmtDate(s.consent_date)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => verifySeller(s.seller_id)}
                            className="text-xs font-semibold bg-maroon text-cream-50 px-3.5 py-1.5 rounded-full hover:bg-maroon-hover transition"
                          >
                            Verify
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-muted mt-4">
              Note: sellers already verified can be inactivated from the platform by admins via API
              (PUT /api/admin/sellers/:id/inactivate). This UI shows pending sellers only.
            </p>
          </section>
        )}

        {/* ===== COMMISSION RATES ===== */}
        {tab === 'commission' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-charcoal">Commission rates per category</h2>
              <button onClick={loadRules} className="text-xs font-semibold text-maroon hover:underline">
                <i className="fa-solid fa-rotate-right mr-1" /> Refresh
              </button>
            </div>
            {rulesLoading && <Skeleton rows={3} />}
            {!rulesLoading && rulesError && <ErrorBox message={rulesError} />}
            {!rulesLoading && !rulesError && rules.length === 0 && (
              <Empty icon="fa-percent" title="No commission rules yet" body="Create rules in the backend or add categories first." />
            )}
            {!rulesLoading && !rulesError && rules.length > 0 && (
              <div className="overflow-x-auto bg-white rounded-2xl border border-cream-200 shadow-card">
                <table className="w-full text-sm">
                  <thead className="bg-cream-100 text-charcoal">
                    <tr>
                      <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold">Category</th>
                      <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold">Commission %</th>
                      <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((r) => (
                      <CommissionRow key={r.rule_id || r.category_id} rule={r} onSave={saveCommission} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-muted mt-4">
              Rates are applied when an order becomes <b>Delivered</b> (SRS FR-12). Changing a rate does not affect past orders.
            </p>
          </section>
        )}

        {/* ===== REPORTS ===== */}
        {tab === 'reports' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-charcoal">All reports</h2>
              <button onClick={loadReports} className="text-xs font-semibold text-maroon hover:underline">
                <i className="fa-solid fa-rotate-right mr-1" /> Refresh
              </button>
            </div>
            {reportsLoading && <Skeleton rows={3} />}
            {!reportsLoading && reportsError && <ErrorBox message={reportsError} />}
            {!reportsLoading && !reportsError && reports.length === 0 && (
              <Empty icon="fa-flag" title="No reports" body="Customers and agents haven't reported any orders yet." />
            )}
            {!reportsLoading && !reportsError && reports.length > 0 && (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div key={r.report_id} className="bg-white rounded-2xl border border-cream-200 shadow-card p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-charcoal text-sm">Report #{r.report_id}</span>
                          <StatusBadge status={r.status} />
                        </div>
                        <p className="text-xs text-muted mb-2">
                          Order #{r.order_id} · Filed by {r.filed_by} · {fmtDateTime(r.created_at)}
                        </p>
                        <p className="text-sm text-charcoal">{r.description}</p>
                      </div>
                      {r.status === 'Open' && (
                        <button
                          onClick={() => resolveReport(r.report_id)}
                          className="text-xs font-semibold bg-maroon text-cream-50 px-4 py-2 rounded-full hover:bg-maroon-hover transition flex-shrink-0"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ===== PAYOUTS ===== */}
        {tab === 'payouts' && (
          <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-charcoal">Payout history</h2>
                <button onClick={loadPayouts} className="text-xs font-semibold text-maroon hover:underline">
                  <i className="fa-solid fa-rotate-right mr-1" /> Refresh
                </button>
              </div>
              {payoutsLoading && <Skeleton rows={3} />}
              {!payoutsLoading && payoutsError && <ErrorBox message={payoutsError} />}
              {!payoutsLoading && !payoutsError && payouts.length === 0 && (
                <Empty icon="fa-money-bill-transfer" title="No payouts yet" body="Record your first agent payout using the form." />
              )}
              {!payoutsLoading && !payoutsError && payouts.length > 0 && (
                <div className="overflow-x-auto bg-white rounded-2xl border border-cream-200 shadow-card">
                  <table className="w-full text-sm">
                    <thead className="bg-cream-100 text-charcoal">
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold">Payout</th>
                        <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold">Agent</th>
                        <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold">Amount</th>
                        <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((p) => (
                        <tr key={p.payout_id} className="border-t border-cream-200">
                          <td className="px-4 py-3 font-semibold">#{p.payout_id}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-charcoal">{p.agent_name}</div>
                            <div className="text-xs text-muted">Agent ID {p.agent_id}</div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-maroon">{fmtMoney(p.amount)}</td>
                          <td className="px-4 py-3 text-xs text-muted">{fmtDate(p.paid_on)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <h2 className="text-lg font-bold text-charcoal mb-4">Record a payout</h2>
              <PayoutForm onSubmit={recordPayout} />
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

function StatCard({ label, value, icon, tone = 'maroon' }) {
  const tones = {
    maroon: 'bg-maroon-light text-maroon',
    brown: 'bg-brown-light text-brown',
    gold: 'bg-gold-bg text-gold-soft',
    emerald: 'bg-emerald-50 text-emerald-700',
  };
  return (
    <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-card">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tones[tone]}`}>
          <i className={`fa-solid ${icon}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-muted font-semibold">{label}</p>
          <p className="serif-title text-2xl font-bold text-charcoal mt-0.5">{value ?? '—'}</p>
        </div>
      </div>
    </div>
  );
}

function CommissionRow({ rule, onSave }) {
  const [pct, setPct] = useState(String(rule.commission_percentage));
  const [saving, setSaving] = useState(false);
  const dirty = String(rule.commission_percentage) !== String(pct);

  const handleSave = async () => {
    setSaving(true);
    await onSave(rule.category_id, pct);
    setSaving(false);
  };

  return (
    <tr className="border-t border-cream-200">
      <td className="px-4 py-3 font-medium text-charcoal">{rule.category_name}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 max-w-[160px]">
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            className={inputClass}
          />
          <span className="text-xs text-muted">%</span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="text-xs font-semibold bg-maroon text-cream-50 px-3.5 py-1.5 rounded-full hover:bg-maroon-hover transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
        </button>
      </td>
    </tr>
  );
}

function PayoutForm({ onSubmit }) {
  const [form, setForm] = useState({
    agent_id: '',
    amount: '',
    paid_on: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handle = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.agent_id || !form.amount || !form.paid_on) {
      setErr('All fields are required.');
      return;
    }
    if (!(Number(form.amount) > 0)) {
      setErr('Amount must be greater than 0.');
      return;
    }
    setSaving(true);
    const ok = await onSubmit(form);
    setSaving(false);
    if (ok) {
      setForm({ agent_id: '', amount: '', paid_on: new Date().toISOString().slice(0, 10) });
    }
  };

  return (
    <form onSubmit={handle} className="bg-white rounded-2xl border border-cream-200 shadow-card p-5 space-y-4">
      <Field label="Agent ID" htmlFor="agent_id" hint="Enter the numeric agent ID (from Users/Agents table).">
        <input
          id="agent_id"
          type="number"
          min="1"
          value={form.agent_id}
          onChange={set('agent_id')}
          placeholder="e.g. 5"
          className={inputClass}
          required
        />
      </Field>
      <Field label="Amount (Rs.)" htmlFor="amount">
        <input
          id="amount"
          type="number"
          min="0.01"
          step="0.01"
          value={form.amount}
          onChange={set('amount')}
          placeholder="e.g. 5000"
          className={inputClass}
          required
        />
      </Field>
      <Field label="Paid on" htmlFor="paid_on">
        <input
          id="paid_on"
          type="date"
          value={form.paid_on}
          onChange={set('paid_on')}
          className={inputClass}
          required
        />
      </Field>
      {err && <ErrorBox message={err} />}
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-maroon hover:bg-maroon-hover disabled:opacity-60 text-cream-50 font-medium py-3 rounded-full text-sm shadow-warm transition"
      >
        {saving ? 'Recording…' : 'Record payout'}
      </button>
      <p className="text-[11px] text-muted text-center">
        Pending commission = total earned − total paid. Check the Overview tab for totals.
      </p>
    </form>
  );
}