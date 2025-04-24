import '../../src/assets/styles.css';
import React, { useState, useEffect } from 'react';
import axios from '../api';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [view, setView] = useState('cert-list');
  const [certs, setCerts] = useState([]);
  const [form, setForm] = useState({ name: '', email: '' });
  const [verifyId, setVerifyId] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const navigate = useNavigate();

  const fetchCerts = async () => {
    try {
      console.log("Fetching certificates...");
      const res = await axios.get('/certificates');
      console.log("Certificates fetched:", res.data);
      setCerts(res.data);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      alert("Failed to fetch certificates. Check console for details.");
      setCerts([]);
    }
  };

  const verifyCert = async () => {
    try {
      const res = await axios.get(`/certificates/verify/${verifyId}`);
      setVerifyResult(res.data);
    } catch {
      setVerifyResult({ error: 'Not found' });
    }
    setVerifyId('');
  };

  const issueCert = async () => {
    try {
      await axios.post('/certificates/issue', form);
      alert('Certificate issued');
      fetchCerts();
    } catch (err) {
      alert('Error issuing certificate');
    }
    setForm({ name: '', email: '' });
  };

  const issueLOR = async () => {
    try {
      await axios.post('/certificates/issue-lor', form);
      alert('LOR issued');
    } catch (err) {
      alert('Error issuing LOR');
    }
    set
  };

  useEffect(() => {
    console.log("AdminDashboard useEffect running. Calling fetchCerts...");
    fetchCerts();
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
        <h2>🛡️ Welcome, Admin!</h2>
        <p>You are now logged in to the Admin Panel.</p>
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
          Continue to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="page" style={{ padding: '2rem', border: '2px solid red' }}>
      <h2 style={{ color: 'purple' }}>🛡️ Admin Dashboard</h2>

      <div style={{ margin: '1rem 0' }}>
        <button onClick={() => setView('issue-cert')}>Issue Certificate</button>
        <button onClick={() => setView('verify-cert')}>Verify Certificate</button>
        <button onClick={() => setView('cert-list')}>View All Certificates</button>
        <button onClick={() => setView('issue-lor')}>Issue LOR</button>
      </div>

      {view === 'issue-cert' && (
        <div>
          <h3>Issue Certificate</h3>
          <input className="input-field" value={form.name} placeholder="Name" onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="input-field" value={form.email} placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} />
          <button onClick={issueCert}>Issue Certificate</button>
        </div>
      )}

      {view === 'verify-cert' && (
        <div>
          <h3>Verify Certificate</h3>
          <input
            placeholder="Certificate ID"
            value={verifyId}
            onChange={e => setVerifyId(e.target.value)}
            style={{
              margin: '1rem',
              padding: '0.8rem',
              width: '250px',
              borderRadius: '6px',
              border: '1px solid #ccc',
            }}
          />
          <button onClick={verifyCert}>Verify</button>
          {verifyResult && verifyResult.error ? (
            <p>{verifyResult.error}</p>
          ) : verifyResult ? (
            <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: '1rem' }}>
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#f2f2f2', border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Name</th>
                  <th style={{ backgroundColor: '#f2f2f2', border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Email</th>
                  <th style={{ backgroundColor: '#f2f2f2', border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Certificate ID</th>
                  <th style={{ backgroundColor: '#f2f2f2', border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Verified</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{verifyResult.name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{verifyResult.email}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{verifyResult.certificateId}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{verifyResult.verified ? 'Yes' : 'No'}</td>
                </tr>
              </tbody>
            </table>
          ) : null}
        </div>
      )}

      {view === 'cert-list' && (
        <div>
          <h3>All Issued Certificates</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={tableHeaderStyle}>Name</th>
                <th style={tableHeaderStyle}>Certificate ID</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {certs.map(cert => (
                <tr key={cert._id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={tableCellStyle}>{cert.name}</td>
                  <td style={tableCellStyle}>{cert.certificateId}</td>
                  <td style={tableCellStyle}>
                    <button onClick={() => handleDownload.bind(null, cert.certificateId)()}>Download</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'issue-lor' && (
        <div>
          <h3>Issue LOR</h3>
          <input className="input-field" value={form.name} placeholder="Name" onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="input-field" value={form.email} placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} />
          <button onClick={issueLOR}>Issue LOR</button>
        </div>
      )}
    </div>
  );
};

const tableHeaderStyle = {
  padding: '12px',
  textAlign: 'left',
  borderBottom: '2px solid #ddd',
};

const tableCellStyle = {
  padding: '12px',
  textAlign: 'left',
};

export default AdminDashboard;
