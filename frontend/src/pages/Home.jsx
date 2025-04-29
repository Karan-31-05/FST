import { useNavigate } from 'react-router-dom';
import '../assets/styles/pages/home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Floating background elements */}
      <div className="floating-element"></div>
      <div className="floating-element"></div>
      <div className="floating-element"></div>

      <div className="home-content">
        <h1 className="home-title">Welcome to CertifyMe</h1>
        <p className="home-subtitle">
          Your trusted platform for secure certificate management and verification
        </p>

        <div className="login-options">
          <button
            className="login-button student-login"
            onClick={() => navigate('/login?role=student')}
          >
            <span>🎓</span>
            Student Login
          </button>

          <button
            className="login-button admin-login"
            onClick={() => navigate('/login?role=admin')}
          >
            <span>🛡️</span>
            Admin Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
