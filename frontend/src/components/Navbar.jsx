import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const logout = () => {
    localStorage.removeItem('token');
    alert('Logged out!');
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="navbar-brand-icon">🏠</span>
        <span>Home</span>
      </Link>
      
      <div className="navbar-menu">
        {token && (
          <button onClick={logout} className="navbar-button">
            <span>🚪</span>
            <span>Logout</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
