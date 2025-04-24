import '../../src/assets/styles.css';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="page" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <h1>Welcome to CertifyMe</h1>
      <p>Please select your login type:</p>

      <div style={{ marginTop: '2rem' }}>
        <button
          style={buttonStyle}
          onClick={() => navigate('/login?role=student')}
        >
          🎓 Student Login
        </button>

        <button
          style={{ ...buttonStyle, marginLeft: '1rem' }}
          onClick={() => navigate('/login?role=admin')}
        >
          🛡️ Admin Login
        </button>
      </div>
    </div>
  );
};

const buttonStyle = {
  padding: '1rem 2rem',
  fontSize: '16px',
  cursor: 'pointer',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#4CAF50',
  color: 'white',
};

export default Home;
