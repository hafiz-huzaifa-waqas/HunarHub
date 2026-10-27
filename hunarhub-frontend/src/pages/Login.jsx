import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout, { Field, ErrorBox, inputClass } from '../components/AuthLayout.jsx';

export default function Login() {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from || '/';
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in? Go straight to Home.
  if (isLoggedIn) return <Navigate to={from} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(contact.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in with your contact number and password."
      footer={
        <>
          New to HunarHub?{' '}
          <Link to="/signup" className="font-semibold text-maroon hover:underline">Create an account</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Contact number" htmlFor="contact">
          <input
            id="contact"
            type="text"
            autoComplete="username"
            required
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="0300-1234567"
            className={inputClass}
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className={inputClass}
          />
        </Field>

        <ErrorBox message={error} />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-maroon hover:bg-maroon-hover disabled:opacity-60 disabled:cursor-not-allowed text-cream-50 font-medium py-3.5 rounded-full text-sm shadow-warm transition"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  );
}
