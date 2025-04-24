import '../../src/assets/styles.css';
import { useEffect, useState } from 'react';
import axios from '../api';
import { jwtDecode } from 'jwt-decode';

const StudentDashboard = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [certs, setCerts] = useState([]);
  const [studentEmail, setStudentEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMyCertificates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/certificates/my-certificates');
      setCerts(res.data);
    } catch (err) {
      setError('❌ Failed to fetch your certificates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      const email = decoded.email;
      setStudentEmail(email);
      fetchMyCertificates(email);
    }
  }, []);

  const handleDownload = async (certificateId) => {
    try {
      const downloadURL = `/certificates/download/${certificateId}`;
      console.log("Attempting to download from:", downloadURL);
      const response = await axios.get(downloadURL, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${certificateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download certificate.');
    }
  };

  if (showWelcome) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h2>🎓 Welcome, Student!</h2>
        <p>You are now logged in to your student dashboard.</p>
        <button
          onClick={() => setShowWelcome(false)}
          style={{
            padding: '0.8rem 2rem',
            marginTop: '1.5rem',
            backgroundColor: '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          View My Certificates
        </button>
      </div>
    );
  }

  return (
    <div className="page" style={{ padding: '2rem' }}>
      <h2>🎓 My Certificates</h2>

      {loading && (
        <p style={{ fontStyle: 'italic', color: '#888' }}>
          ⏳ Loading certificates...
        </p>
      )}

      {error && (
        <div
          style={{
            backgroundColor: '#ffdddd',
            color: '#d8000c',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid #d8000c',
          }}
        >
          {error}
        </div>
      )}

      {certs.length === 0 && !loading ? (
        <p>No certificates found for <strong>{studentEmail}</strong>.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Certificate ID</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {certs.map((cert) => {
              console.log(cert);
              return (
                <tr key={cert._id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px', textAlign: 'left' }}>{cert.name}</td>
                <td style={{ padding: '12px', textAlign: 'left' }}>{cert.certificateId}</td>
                <td style={{ padding: '12px', textAlign: 'left' }}>{cert.verified === true ? 'Verified' : 'Not Verified'}</td>
                  <td style={{ padding: '12px', textAlign: 'left' }}>
                    <button onClick={() => handleDownload(cert.certificateId)}>Download</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StudentDashboard;
