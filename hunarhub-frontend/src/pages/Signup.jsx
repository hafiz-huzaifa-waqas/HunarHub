import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import AuthLayout, { Field, ErrorBox, inputClass } from '../components/AuthLayout.jsx';

export default function Signup() {
  const { register, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    contact: '',
    password: '',
    confirm: '',
    region_id: '',
    address: '',
  });
  const [regions, setRegions] = useState([]);
  const [regionsError, setRegionsError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // GET /api/regions → fills the dropdown
  useEffect(() => {
    api('/regions')
      .then((data) => setRegions(Array.isArray(data) ? data : data.regions || []))
      .catch((err) => setRegionsError(err.message));
  }, []);

  if (isLoggedIn) return <Navigate to="/" replace />;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (!form.region_id) return setError('Please choose your area.');

    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        contact: form.contact.trim(),
        password: form.password,
        region_id: Number(form.region_id),
        address: form.address.trim() || undefined,
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Shop handmade work from artisans in your city."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-maroon hover:underline">Log in</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name" htmlFor="name">
          <input id="name" type="text" required autoComplete="name" value={form.name} onChange={set('name')} placeholder="Hina Shahid" className={inputClass} />
        </Field>

        <Field label="Contact number" htmlFor="contact">
          <input id="contact" type="text" required autoComplete="username" value={form.contact} onChange={set('contact')} placeholder="0300-1234567" className={inputClass} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Password" htmlFor="password">
            <input id="password" type="password" required autoComplete="new-password" value={form.password} onChange={set('password')} placeholder="At least 6 characters" className={inputClass} />
          </Field>
          <Field label="Confirm password" htmlFor="confirm">
            <input id="confirm" type="password" required autoComplete="new-password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" className={inputClass} />
          </Field>
        </div>

        <Field label="Area" htmlFor="region">
          <select id="region" required value={form.region_id} onChange={set('region_id')} className={inputClass}>
            <option value="">{regions.length ? 'Select your area' : 'Loading areas…'}</option>
            {regions.map((r) => (
              <option key={r.region_id} value={r.region_id}>{r.name}</option>
            ))}
          </select>
          {regionsError && (
            <p className="text-[11px] text-maroon mt-1.5">Couldn’t load areas: {regionsError}</p>
          )}
        </Field>

        <Field label="Delivery address (optional)" htmlFor="address">
          <input id="address" type="text" maxLength={200} value={form.address} onChange={set('address')} placeholder="House 10, Street 4, Block 2" className={inputClass} />
        </Field>

        <ErrorBox message={error} />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-maroon hover:bg-maroon-hover disabled:opacity-60 disabled:cursor-not-allowed text-cream-50 font-medium py-3.5 rounded-full text-sm shadow-warm transition"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
