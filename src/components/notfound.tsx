import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      padding: '32px', 
      backgroundColor: '#ffffff', 
      borderRadius: '16px', 
      border: '1px solid #e2e8f0',
      textAlign: 'center',
      minHeight: '400px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ 
        fontSize: '48px', 
        color: '#ef4444', 
        marginBottom: '16px',
        fontWeight: 'bold'
      }}>
        404
      </h1>
      <h2 style={{ 
        fontSize: '24px', 
        color: '#1e293b', 
        marginBottom: '16px',
        fontWeight: '600'
      }}>
        Page Not Found
      </h2>
      <p style={{ 
        color: '#64748b', 
        marginBottom: '24px',
        fontSize: '16px',
        maxWidth: '400px'
      }}>
        The page you are looking for doesn't exist or has been moved.
      </p>
      <button 
        onClick={() => navigate('/')}
        style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
      >
        Go to Dashboard
      </button>
    </div>
  );
}