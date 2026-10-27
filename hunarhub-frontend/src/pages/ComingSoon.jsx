import Layout from '../components/Layout.jsx';

// Temporary page for the Agent and Admin dashboards.
export default function ComingSoon({ title }) {
  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h1 className="serif-title text-4xl font-bold text-charcoal">{title}</h1>
        <p className="text-sm text-muted mt-3">This dashboard is built in the next step.</p>
      </div>
    </Layout>
  );
}
