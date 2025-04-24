import '../../src/assets/styles.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from '../api';

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const role = new URLSearchParams(location.search).get('role') || 'student';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
    try {
      const res = await axios.post('/auth/login', { email, password, role });
      console.log("Login response:", res.data); // Log the entire response

      localStorage.setItem('token', res.data.token);
      alert(`${role} login successful`);

      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } catch (err) {
      console.error("Login error:", err); // Log the error
      alert('Login failed');
    }
  };

  return (
    <div className="page" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <h2>{role === 'admin' ? 'Admin' : 'Student'} Login</h2>
      <input
        className="input-field"
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            login();
          }
        }}
      />
      <input
        className="input-field"
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            login();
          }
        }}
      />
      <br />
      <button onClick={login} style={{ ...inputStyle, backgroundColor: '#2196F3', color: 'white' }}>
        Login
      </button>
    </div>
  );
};

const inputStyle = {
  margin: '1rem',
  padding: '0.8rem',
  width: '250px',
  borderRadius: '6px',
  border: '1px solid #ccc',
};

export default Login; // ✅ THIS LINE IS MANDATORY!
