// @ts-nocheck
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';

export default function NotFound(): JSX.Element {
  return (
    <Layout title="404 - Page Not Found">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '8rem',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1rem'
        }}>
          404
        </div>
        <h1 style={{
          fontSize: '2rem',
          marginBottom: '1rem',
          color: '#fff'
        }}>
          Page Not Found
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '2rem',
          maxWidth: '400px'
        }}>
          Oops! The page you're looking for doesn't exist. Maybe you followed a broken link or entered an incorrect URL.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link
            to="/"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#fff',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
            }}
          >
            Go Back Home
          </Link>
          <Link
            to="/guide/getting-started"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            Quick Start
          </Link>
        </div>
      </div>
    </Layout>
  );
}
