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
  { id: 'all_sellers', label: 'All Sellers', icon: 'fa-store' }, 
  { id: 'agents', label: 'Manage Agents', icon: 'fa-users' },
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

  // Data States
  const [summary, setSummary] = useState(null);
  const [pendingSellers, setPendingSellers] = useState([]);
  const [allSellers, setAllSellers] = useState([]);
  const [allAgents, setAllAgents] = useState([]);
  const [rules, setRules] = useState([]);
  const [reports, setReports] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [agentsList, setAgentsList] = useState([]); // for payout dropdown

  // Loading States
  const [loading, setLoading] = useState({ summary: true, pending: true, allSellers: true, allAgents: true, rules: true, reports: true, payouts: true });

  /* ---------- Loaders ---------- */
  const loadSummary = useCallback(() => {
    setLoading(l => ({ ...l, summary: true }));
    api('/admin/dashboard').then((d) => setSummary(d.summary || {})).catch((e) => showToast(e.message)).finally(() => setLoading(l => ({ ...l, summary: false })));
  }, [showToast]);

  const loadPendingSellers = useCallback(() => {
    setLoading(l => ({ ...l, pending: true }));
    api('/admin/sellers/pending').then((d) => setPendingSellers(d.sellers || [])).catch((e) => showToast(e.message)).finally(() => setLoading(l => ({ ...l, pending: false })));
  }, [showToast]);

  const loadAllSellers = useCallback(() => {
    setLoading(l => ({ ...l, allSellers: true }));
    api('/admin/sellers/all').then((d) => setAllSellers(d.sellers || [])).catch((e) => showToast(e.message)).finally(() => setLoading(l => ({ ...l, allSellers: false })));
  }, [showToast]);

  const loadAllAgents = useCallback(() => {
    setLoading(l => ({ ...l, allAgents: true }));
    api('/admin/agents/all').then((d) => setAllAgents(d.agents || [])).catch((e) => showToast(e.message)).finally(() => setLoading(l => ({ ...l, allAgents: false })));
  }, [showToast]);

  const loadRules = useCallback(() => {
    setLoading(l => ({ ...l, rules: true }));
    api('/admin/commission-rules').then((d) => setRules(d.rules || [])).catch((e) => showToast(e.message)).finally(() => setLoading(l => ({ ...l, rules: false })));
  }, [showToast]);

  const loadReports = useCallback(() => {
    setLoading(l => ({ ...l, reports: true }));
    api('/admin/reports').then((d) => setReports(d.reports || [])).catch((e) => showToast(e.message)).finally(() => setLoading(l => ({ ...l, reports: false })));
  }, [showToast]);

  const loadPayouts = useCallback(() => {
    setLoading(l => ({ ...l, payouts: true }));
    api('/admin/payouts').then((d) => setPayouts(d.payouts || [])).catch((e) => showToast(e.message)).finally(() => setLoading(l => ({ ...l, payouts: false })));
  }, [showToast]);

  const loadAgentsDropdown = useCallback(() => {
    api('/admin/agents').then((d) => setAgentsList(d.agents || [])).catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    loadSummary();
    loadPendingSellers();
    loadAllSellers();
    loadAllAgents();
    loadRules();
    loadReports();
    loadPayouts();
    loadAgentsDropdown();
  }, [loadSummary, loadPendingSellers, loadAllSellers, loadAllAgents, loadRules, loadReports, loadPayouts, loadAgentsDropdown]);

  /* ---------- Actions ---------- */

  const verifySeller = async (sellerId) => {
    if (!window.confirm(`Verify seller #${sellerId}?`)) return;
    try {
      await api(`/admin/sellers/${sellerId}/verify`, { method: 'PUT' });
      showToast?.(`Seller verified`);
      loadPendingSellers(); loadAllSellers(); loadSummary();
    } catch (err) { showToast?.(err.message); }
  };

  const unverifySeller = async (sellerId) => {
    if (!window.confirm("Unverify this seller? Their products will be hidden until verified again.")) return;
    try {
      await api(`/admin/sellers/${sellerId}/unverify`, { method: 'PUT' });
      showToast?.('Seller moved to Pending');
      loadAllSellers(); loadPendingSellers(); loadSummary();
    } catch (err) { showToast?.(err.message); }
  };

  const removeSeller = async (sellerId) => {
    if (!window.confirm("Remove this seller? Their products will be hidden.")) return;
    try {
      await api(`/admin/sellers/${sellerId}/remove`, { method: 'PUT' });
      showToast?.('Seller removed');
      loadAllSellers(); loadPendingSellers(); loadSummary();
    } catch (err) { showToast?.(err.message); }
  };

  const deleteAgent = async (agentId) => {
    if (!window.confirm("Are you sure you want to delete this agent? This action cannot be undone.")) return;
    try {
      await api(`/admin/agents/${agentId}`, { method: 'DELETE' });
      showToast?.('Agent deleted');
      loadAllAgents(); loadAgentsDropdown();
    } catch (err) { showToast?.(err.message); }
  };

  const createAgent = async ({ name, contact, password, region_id }) => {
    try {
      await api('/admin/agents', {
        method: 'POST',
        body: { name, contact, password, region_id: Number(region_id) }
      });
      showToast?.('Agent created successfully');
      loadAllAgents(); loadAgentsDropdown();
      return true;
    } catch (err) {
      showToast?.(err.message);
      return false;
    }
  };

  const saveCommission = async (categoryId, pct) => {
    const num = Number(pct);
    if (!Number.isFinite(num) || num < 0 || num > 100) return showToast?.('Commission must be 0-100');
    try {
      await api(`/admin/commission-rules/${categoryId}`, { method: 'PUT', body: { commission_percentage: num } });
      showToast?.('Rate saved'); loadRules();
    } catch (err) { showToast?.(err.message); }
  };

  const resolveReport = async (reportId) => {
    if (!window.confirm(`Mark report #${reportId} as Resolved?`)) return;
    try {
      await api(`/admin/reports/${reportId}/resolve`, { method: 'PUT' });
      showToast?.(`Report resolved`); loadReports(); loadSummary();
    } catch (err) { showToast?.(err.message); }
  };

  const recordPayout = async ({ agent_id, amount, paid_on }) => {
    try {
      await api('/admin/payouts', { method: 'POST', body: { agent_id: Number(agent_id), amount: Number(amount), paid_on } });
      showToast?.('Payout recorded'); loadPayouts(); loadSummary();
      return true;
    } catch (err) { showToast?.(err.message); return false; }
  };

  /* ---------- Render ---------- */
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <span className="text-xs uppercase font-bold tracking-widest text-maroon">Admin panel</span>
          <h1 className="serif-title text-3xl sm:text-4xl md:text-5xl font-bold text-charcoal mt-1">Platform administration</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-cream-200 mb-6">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition flex items-center gap-2 ${tab === t.id ? 'border-maroon text-maroon' : 'border-transparent text-muted hover:text-charcoal'}`}>
              <i className={`fa-solid ${t.icon} text-xs`} />{t.label}
            </button>
          ))}
        </div>

        {/* ===== OVERVIEW ===== */}
        {tab === 'overview' && (
          <section>
            {loading.summary ? <Skeleton rows={2} /> : summary && (
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
              </>
            )}
          </section>
        )}

        {/* ===== VERIFY SELLERS ===== */}
        {tab === 'sellers' && (
          <section>
            <h2 className="text-lg font-bold text-charcoal mb-4">Pending sellers</h2>
            {loading.pending ? <Skeleton rows={3} /> : pendingSellers.length === 0 ? (
              <Empty icon="fa-circle-check" title="All caught up" body="No sellers waiting for verification." />
            ) : (
              <div className="overflow-x-auto bg-white rounded-2xl border border-cream-200 shadow-card">
                <table className="w-full text-sm">
                  <thead className="bg-cream-100 text-charcoal">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold">Seller</th>
                      <th className="px-4 py-3 text-left font-bold">Agent</th>
                      <th className="px-4 py-3 text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSellers.map((s) => (
                      <tr key={s.seller_id} className="border-t border-cream-200">
                        <td className="px-4 py-3"><div className="font-semibold">{s.name}</div><div className="text-xs text-muted">{s.contact}</div></td>
                        <td className="px-4 py-3 text-muted">{s.managed_by_agent}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => verifySeller(s.seller_id)} className="text-xs font-semibold bg-maroon text-cream-50 px-3.5 py-1.5 rounded-full hover:bg-maroon-hover">Verify</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ===== ALL SELLERS ===== */}
        {tab === 'all_sellers' && (
          <section>
            <h2 className="text-lg font-bold text-charcoal mb-4">All Registered Sellers</h2>
            {loading.allSellers ? <Skeleton rows={4} /> : (
              <div className="overflow-x-auto bg-white rounded-2xl border border-cream-200 shadow-card">
                <table className="w-full text-sm">
                  <thead className="bg-cream-100 text-charcoal">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold">Seller</th>
                      <th className="px-4 py-3 text-left font-bold">Agent</th>
                      <th className="px-4 py-3 text-left font-bold">Status</th>
                      <th className="px-4 py-3 text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSellers.map(s => (
                      <tr key={s.seller_id} className="border-t border-cream-200 hover:bg-cream-50">
                        <td className="px-4 py-3 font-semibold text-charcoal">{s.name}</td>
                        <td className="px-4 py-3 text-muted">{s.managed_by_agent}</td>
                        <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                        <td className="px-4 py-3 text-right">
                          {/* 👇 Unverify Button */}
                          {s.status === 'Verified' && (
                            <button 
                              onClick={() => unverifySeller(s.seller_id)} 
                              className="text-xs text-gold-soft font-semibold border border-gold/30 px-3 py-1 rounded hover:bg-gold-bg mr-2 transition"
                            >
                              Unverify
                            </button>
                          )}
                          
                          {/* Remove Button */}
                          {s.status !== 'Inactive' && (
                            <button onClick={() => removeSeller(s.seller_id)} className="text-xs text-red-600 font-semibold border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition">
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ===== MANAGE AGENTS ===== */}
        {tab === 'agents' && (
          <section>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h2 className="text-lg font-bold text-charcoal mb-4">All Agents</h2>
                {loading.allAgents ? <Skeleton rows={4} /> : (
                  <div className="overflow-x-auto bg-white rounded-2xl border border-cream-200 shadow-card">
                    <table className="w-full text-sm">
                      <thead className="bg-cream-100 text-charcoal">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold">Agent Name</th>
                          <th className="px-4 py-3 text-left font-bold">Contact / Region</th>
                          <th className="px-4 py-3 text-right font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allAgents.map(a => (
                          <tr key={a.agent_id} className="border-t border-cream-200 hover:bg-cream-50">
                            <td className="px-4 py-3 font-semibold text-charcoal">{a.name}</td>
                            <td className="px-4 py-3">
                              <div className="text-xs">{a.contact}</div>
                              <div className="text-xs text-muted">{a.region_name}</div>
                            </td>
                            <td className="px-4 py-3 text-right">
                               <button onClick={() => deleteAgent(a.agent_id)} className="text-xs text-red-600 font-semibold border border-red-200 px-3 py-1 rounded hover:bg-red-50">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div>
                 <h2 className="text-lg font-bold text-charcoal mb-4">Add New Agent</h2>
                 <AddAgentForm onAdd={createAgent} />
              </div>
            </div>
          </section>
        )}

        {/* ===== COMMISSION ===== */}
        {tab === 'commission' && (
          <section>
            <h2 className="text-lg font-bold text-charcoal mb-4">Commission rates</h2>
            {loading.rules ? <Skeleton rows={3} /> : (
              <div className="overflow-x-auto bg-white rounded-2xl border border-cream-200 shadow-card">
                <table className="w-full text-sm">
                  <thead className="bg-cream-100"><tr><th className="px-4 py-3 text-left">Category</th><th className="px-4 py-3 text-left">Rate %</th><th className="px-4 py-3 text-right">Save</th></tr></thead>
                  <tbody>{rules.map((r) => <CommissionRow key={r.category_id} rule={r} onSave={saveCommission} />)}</tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ===== REPORTS ===== */}
        {tab === 'reports' && (
          <section>
            <h2 className="text-lg font-bold text-charcoal mb-4">All reports</h2>
            {loading.reports ? <Skeleton rows={3} /> : reports.length === 0 ? <Empty icon="fa-flag" title="No reports" body="All clear." /> : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div key={r.report_id} className="bg-white rounded-2xl border border-cream-200 p-5 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1"><span className="font-semibold text-charcoal">Report #{r.report_id}</span><StatusBadge status={r.status} /></div>
                      <p className="text-xs text-muted mb-2">Order #{r.order_id} · By {r.filed_by}</p>
                      <p className="text-sm text-charcoal">{r.description}</p>
                    </div>
                    {r.status === 'Open' && <button onClick={() => resolveReport(r.report_id)} className="bg-maroon text-cream-50 px-4 py-2 rounded-full text-xs">Resolve</button>}
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
              <h2 className="text-lg font-bold text-charcoal mb-4">Payout history</h2>
              {loading.payouts ? <Skeleton rows={3} /> : (
                <div className="overflow-x-auto bg-white rounded-2xl border border-cream-200 shadow-card">
                  <table className="w-full text-sm">
                    <thead className="bg-cream-100"><tr><th className="px-4 py-3 text-left">ID</th><th className="px-4 py-3 text-left">Agent</th><th className="px-4 py-3 text-left">Amount</th><th className="px-4 py-3 text-left">Date</th></tr></thead>
                    <tbody>{payouts.map((p) => (<tr key={p.payout_id} className="border-t border-cream-200"><td className="px-4 py-3">#{p.payout_id}</td><td className="px-4 py-3">{p.agent_name}</td><td className="px-4 py-3 font-semibold text-maroon">{fmtMoney(p.amount)}</td><td className="px-4 py-3 text-xs text-muted">{fmtDate(p.paid_on)}</td></tr>))}</tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="lg:col-span-2">
              <h2 className="text-lg font-bold text-charcoal mb-4">Record a payout</h2>
              <PayoutForm onSubmit={recordPayout} agents={agentsList} />
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
  const tones = { maroon: 'bg-maroon-light text-maroon', brown: 'bg-brown-light text-brown', gold: 'bg-gold-bg text-gold-soft', emerald: 'bg-emerald-50 text-emerald-700' };
  return (
    <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-card">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones[tone]}`}><i className={`fa-solid ${icon}`} /></div>
        <div><p className="text-[11px] uppercase text-muted font-semibold">{label}</p><p className="serif-title text-2xl font-bold text-charcoal mt-0.5">{value ?? '—'}</p></div>
      </div>
    </div>
  );
}

function CommissionRow({ rule, onSave }) {
  const [pct, setPct] = useState(String(rule.commission_percentage));
  const [saving, setSaving] = useState(false);
  const dirty = String(rule.commission_percentage) !== String(pct);
  return (
    <tr className="border-t border-cream-200">
      <td className="px-4 py-3 font-medium text-charcoal">{rule.category_name}</td>
      <td className="px-4 py-3"><div className="flex items-center gap-2 max-w-[120px]"><input type="number" value={pct} onChange={(e) => setPct(e.target.value)} className={inputClass} /><span>%</span></div></td>
      <td className="px-4 py-3 text-right"><button onClick={async () => { setSaving(true); await onSave(rule.category_id, pct); setSaving(false); }} disabled={!dirty || saving} className="bg-maroon text-cream-50 px-3.5 py-1.5 rounded-full text-xs disabled:opacity-50">{saving ? '...' : dirty ? 'Save' : 'Saved'}</button></td>
    </tr>
  );
}

function PayoutForm({ onSubmit, agents }) {
  const [form, setForm] = useState({ agent_id: '', amount: '', paid_on: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  return (
    <form onSubmit={async (e) => { e.preventDefault(); setSaving(true); const ok = await onSubmit(form); setSaving(false); if (ok) setForm({ agent_id: '', amount: '', paid_on: form.paid_on }); }} className="bg-white rounded-2xl border border-cream-200 shadow-card p-5 space-y-4">
      <Field label="Select Agent">
        <select value={form.agent_id} onChange={(e) => setForm({ ...form, agent_id: e.target.value })} className={inputClass} required>
          <option value="">-- Select Agent --</option>
          {agents.map((a) => <option key={a.agent_id} value={a.agent_id}>{a.name} (ID: {a.agent_id})</option>)}
        </select>
      </Field>
      <Field label="Amount (Rs.)"><input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} required /></Field>
      <Field label="Paid on"><input type="date" value={form.paid_on} onChange={(e) => setForm({ ...form, paid_on: e.target.value })} className={inputClass} required /></Field>
      <button type="submit" disabled={saving} className="w-full bg-maroon text-cream-50 py-3 rounded-full font-medium text-sm">{saving ? 'Saving...' : 'Record payout'}</button>
    </form>
  );
}

function AddAgentForm({ onAdd }) {
  const [form, setForm] = useState({ name: '', contact: '', password: '', region_id: '' });
  const [saving, setSaving] = useState(false);
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    api('/regions').then(d => setRegions(d.regions || [])).catch(() => {});
  }, []);

  return (
    <form onSubmit={async (e) => { e.preventDefault(); setSaving(true); const ok = await onAdd(form); setSaving(false); if (ok) setForm({ name: '', contact: '', password: '', region_id: '' }); }} className="bg-white rounded-2xl border border-cream-200 shadow-card p-5 space-y-4">
      <Field label="Name"><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} required /></Field>
      <Field label="Contact"><input type="text" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className={inputClass} required /></Field>
      <Field label="Password"><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} required /></Field>
      <Field label="Region">
        <select value={form.region_id} onChange={(e) => setForm({ ...form, region_id: e.target.value })} className={inputClass} required>
          <option value="">-- Select Region --</option>
          {regions.map((r) => <option key={r.region_id} value={r.region_id}>{r.name}</option>)}
        </select>
      </Field>
      <button type="submit" disabled={saving} className="w-full bg-maroon text-cream-50 py-3 rounded-full font-medium text-sm">{saving ? 'Adding...' : 'Add Agent'}</button>
    </form>
  );
}