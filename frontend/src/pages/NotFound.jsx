import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0e1a',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        width: '72px',
        height: '72px',
        borderRadius: '20px',
        background: 'rgba(99, 102, 241, 0.15)',
        color: '#818cf8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem'
      }}>
        <HelpCircle size={40} />
      </div>
      <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#fff' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 1rem 0', color: '#cbd5e1' }}>Page Not Found</h2>
      <p style={{ color: '#94a3b8', maxWidth: '420px', margin: '0 0 2rem 0' }}>
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/login"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.8rem 1.5rem',
          backgroundColor: '#6366f1',
          color: '#ffffff',
          borderRadius: '10px',
          fontWeight: 600,
          textDecoration: 'none'
        }}
      >
        <ArrowLeft size={18} />
        <span>Return to Login</span>
      </Link>
    </div>
  );
};

export default NotFound;
