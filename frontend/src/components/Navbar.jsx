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
    <nav className="navbar" style={navStyle}>
      <Link to="/">Home</Link>

      {token && (
        <>
          <button onClick={logout} style={buttonStyle}>Logout</button>
        </>
      )}
    </nav>
  );
};

const navStyle = {
  backgroundColor: '#333',
  padding: '1rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const buttonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#f44336',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

export default Navbar;
