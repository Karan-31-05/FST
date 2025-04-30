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
      console.log("Login response:", res.data);

      localStorage.setItem('token', res.data.token);
      alert(`${role} login successful`);

      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } catch (err) {
      console.error("Login error:", err);
      alert('Login failed');
    }
    setEmail('');
    setPassword('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      login();
    }
  };

  return (
    <div className="page-container">
      <div className="form-container">
        <div className="form-header">
          <h1 className="form-title">{role === 'admin' ? 'Admin' : 'Student'} Login</h1>
          <p className="form-subtitle">Welcome back! Please enter your credentials</p>
        </div>
        
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email Address</label>
          <input
            id="email"
            type="email"
            className="form-input"
            value={email}
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            id="password"
            type="password"
            className="form-input"
            value={password}
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        
        <button className="form-button" onClick={login}>
          <span>Login</span>
        </button>
        
        <div className="form-footer">
          {/* <a href="/forgot-password" className="form-link">Forgot Password?</a> */}
        </div>
      </div>
    </div>
  );
};

export default Login;
