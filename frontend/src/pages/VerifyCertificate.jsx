import '../../src/assets/styles.css';
import { useState, useEffect } from 'react';
import axios from '../api';
import { useParams, useNavigate } from 'react-router-dom';

const tableStyle = {
  borderCollapse: 'collapse',
  width: '100%',
  marginTop: '1rem'
};

const thStyle = {
  backgroundColor: '#f2f2f2',
  border: '1px solid #ddd',
  padding: '8px',
  textAlign: 'left'
};

const tdStyle = {
  border: '1px solid #ddd',
  padding: '8px'
};

const VerifyCertificate = () => {
  const { id } = useParams();
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  return (
    <div className="page">
      <h2>Verify Certificate</h2>
      <button onClick={() => navigate('/admin')}>Back to Admin Dashboard</button>
      <p>Please access this page through the route (e.g., http://localhost:3000/verify/CERT-1234)</p>
    </div>
  );
};

export default VerifyCertificate;
