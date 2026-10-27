import { Link } from 'react-router-dom';

// Shared page shell for Login and Signup.
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <div className="p-5 sm:p-8">
        <Link to="/" className="inline-flex items-center space-x-2.5 group">
          <div className="w-10 h-10 rounded-full bg-maroon text-cream-50 flex items-center justify-center font-serif text-2xl font-bold group-hover:bg-maroon-hover transition shadow-sm">
            H
          </div>
          <span className="serif-title text-2xl font-bold text-charcoal group-hover:text-maroon transition">HunarHub</span>
        </Link>
      </div>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md bg-white rounded-3xl border border-cream-200 shadow-card p-7 sm:p-9">
          <h1 className="serif-title text-3xl sm:text-4xl font-bold text-charcoal">{title}</h1>
          <p className="text-sm text-muted mt-1.5 mb-7">{subtitle}</p>
          {children}
          <p className="text-xs text-muted text-center mt-7">{footer}</p>
        </div>
      </main>
    </div>
  );
}

export const inputClass =
  'w-full px-4 py-3 text-sm bg-cream-50 border border-cream-300 rounded-xl text-charcoal placeholder-muted focus:outline-none focus:border-maroon focus:ring-1 focus:ring-maroon transition';

export function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-brown mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

export function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start space-x-2 bg-maroon-light text-maroon text-xs rounded-xl px-4 py-3">
      <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
      <span>{message}</span>
    </div>
  );
}
