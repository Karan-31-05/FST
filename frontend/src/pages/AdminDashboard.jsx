// ============================================================
// FILE: frontend/src/pages/AdminDashboard.jsx
// ============================================================

import '../../src/assets/styles.css'; // Keep global styles if needed
//import './AdminDashboard.css'; // Import component-specific styles (ensure path is correct)
import React, { useState, useEffect } from 'react';
import axios from '../api'; // Ensure this points to your configured axios instance
// import { useNavigate } from 'react-router-dom'; // Uncomment if needed later

const AdminDashboard = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [view, setView] = useState('cert-list'); // Default view
  const [certs, setCerts] = useState([]);
  const [form, setForm] = useState({ name: '', email: '' });
  const [verifyId, setVerifyId] = useState('');
  const [verifyResult, setVerifyResult] = useState(null); // Holds success data or { error: 'Not found' }

  // State variables for inline error messages
  const [issueError, setIssueError] = useState('');
  const [listError, setListError] = useState('');
  const [verifyApiError, setVerifyApiError] = useState(''); // For API/network errors during verify
  const [lorError, setLorError] = useState('');
  const [downloadError, setDownloadError] = useState('');

  // const navigate = useNavigate(); // Uncomment if needed later

  // Helper function for basic email validation
  const isValidEmail = (email) => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    return emailRegex.test(email);
  };

  // --- Fetch All Certificates ---
  const fetchCerts = async () => {
    setListError(''); // Clear previous list errors
    setDownloadError(''); // Clear download errors when refreshing list
    try {
      console.log("Fetching certificates...");
      const res = await axios.get('/certificates'); // Endpoint for getting all certs
      console.log("Certificates fetched:", res.data);
      setCerts(res.data);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      setListError(error.response?.data?.error || "Failed to fetch certificates. Please try again.");
      setCerts([]);
    }
  };

  // --- Verify Certificate (CORRECTED FUNCTION) ---
  const verifyCert = async () => {
    setVerifyApiError(''); // Clear previous API errors
    setVerifyResult(null); // Clear previous results
    if (!verifyId.trim()) {
      setVerifyApiError("Please enter a Certificate ID to verify.");
      return; // Stop if input is empty
    }
    try {
      // Use GET request to the verify endpoint, inserting the verifyId
      const res = await axios.get(`/certificates/verify/${verifyId.trim()}`);
      // On success (status 200), set the result state with the certificate data
      setVerifyResult(res.data);
      setVerifyApiError(''); // Clear any previous API errors
    } catch (error) {
      // Handle errors
      console.error("Error verifying certificate:", error);
      if (error.response?.status === 404) {
        // If backend returns 404, set the result state to show "Not Found"
        setVerifyResult({ error: 'Certificate not found.' });
      } else {
        // For any other errors (network, server 500, etc.), set the API error state
        setVerifyApiError(error.response?.data?.error || 'An error occurred during verification.');
        setVerifyResult(null); // Ensure result area is cleared on other API errors
      }
    }
    // Optional: Clear input after verification attempt
    // setVerifyId('');
  };

  // --- Issue Certificate ---
  const issueCert = async () => {
    setIssueError(''); // Clear previous errors

    // Frontend validation
    if (!form.name.trim()) {
      setIssueError('Student Name is required.');
      return;
    }
    if (!form.email.trim()) {
      setIssueError('Student Email is required.');
      return;
    }
    if (!isValidEmail(form.email)) {
      setIssueError('Please enter a valid email address.');
      return;
    }

    try {
      console.log('Attempting to issue certificate with data:', form); // Log data being sent
      const res = await axios.post('/certificates/issue', form);
      alert(res.data?.message || 'Certificate issued successfully'); // Success alert remains for now
      setForm({ name: '', email: '' }); // Clear form on success
      fetchCerts(); // Refresh list
      setView('cert-list'); // Switch view back to list after success
    } catch (err) {
      console.error("Error issuing certificate:", err);
      // Display error from backend
      setIssueError(err.response?.data?.error || 'An unexpected error occurred while issuing.');
      // Don't clear form on error
    }
  };

  // --- Issue LOR ---
  const issueLOR = async () => {
    setLorError(''); // Clear previous LOR errors
    // Add frontend validation for LOR fields if necessary
    // if (!form.name.trim() || !form.email.trim() /* || !other_lor_fields */) {
    //   setLorError('Please fill in all required LOR fields.');
    //   return;
    // }
    // if (form.email && !isValidEmail(form.email)) {
    //   setLorError('Please enter a valid recipient email address.');
    //   return;
    // }

    try {
      // Ensure '/certificates/issue-lor' is your correct backend endpoint
      const res = await axios.post('/certificates/issue-lor', form); // Send form data
      alert(res.data?.message || 'LOR issued successfully'); // Success alert remains for now
      setForm({ name: '', email: '' }); // Clear form on success
      // Potentially fetch/refresh an LOR list or change view
    } catch (err) {
      console.error("Error issuing LOR:", err);
      setLorError(err.response?.data?.error || 'Error issuing LOR. Please try again.');
      // Don't clear form on error
    }
  };

  // --- Download Certificate ---
  const handleDownload = async (certificateId) => {
    setDownloadError(''); // Clear previous download errors
    if (!certificateId) return; // Prevent download attempt if ID is missing

    try {
      const downloadURL = `/certificates/download/${certificateId}`;
      console.log("Attempting to download from:", downloadURL);
      const response = await axios.get(downloadURL, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = `certificate-${certificateId}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch && filenameMatch.length > 1) filename = filenameMatch[1];
      }
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Download error:', error);
      let errorMsg = 'Failed to download certificate.';
       if (error.response && error.response.data && error.response.data instanceof Blob && error.response.data.type.includes('json')) {
          try {
              const errorJson = JSON.parse(await error.response.data.text());
              errorMsg = errorJson.error || errorMsg;
          } catch (parseError) { console.error('Failed to parse error blob:', parseError); }
      } else if (error.response?.data?.error) {
          errorMsg = error.response.data.error;
      }
      setDownloadError(errorMsg);
    }
  };

  // Initial data fetch when dashboard becomes visible
  useEffect(() => {
    if (!showWelcome) {
        console.log("AdminDashboard visible. Calling fetchCerts...");
        fetchCerts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWelcome]); // Dependency ensures it runs when showWelcome changes to false

  // --- Welcome Screen ---
  if (showWelcome) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h2>🛡️ Welcome, Admin!</h2>
        <p>You are now logged in to the Admin Panel.</p>
        <button
          onClick={() => setShowWelcome(false)}
          style={{ // Keeping specific style here as it's unique and simple
            padding: '0.8rem 2rem', marginTop: '1.5rem', backgroundColor: '#4CAF50',
            color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer',
          }}
        >
          Continue to Dashboard
        </button>
      </div>
    );
  }

  // --- Main Dashboard ---
  return (
    <div className="page" key={view}> {/* Applied className="page" */}
      <h2 style={{ color: 'purple', textAlign: 'center', marginBottom: '1.5rem' }}>🛡️ Admin Dashboard</h2>

      {/* Navigation Buttons */}
      <div className="admin-nav-buttons"> {/* Use CSS class for styling */}
        <button className="nav-button" onClick={() => setView('issue-cert')}>Issue Certificate</button>
        <button className="nav-button" onClick={() => setView('verify-cert')}>Verify Certificate</button>
        <button className="nav-button" onClick={() => setView('cert-list')}>View All Certificates</button>
        <button className="nav-button" onClick={() => setView('issue-lor')}>Issue LOR</button>
      </div>

      {/* Conditional Views */}
      {view === 'issue-cert' && (
        <div className="view-container"> {/* Use CSS class */}
          <h3>Issue Certificate</h3>
          <input
            className="input-wide" // Use CSS class
            value={form.name} placeholder="Student Name"
            onChange={e => { setForm({ ...form, name: e.target.value }); setIssueError(''); }}
          />
          <input
            className="input-wide" // Use CSS class
            value={form.email} placeholder="Student Email" type="email"
            onChange={e => { setForm({ ...form, email: e.target.value }); setIssueError(''); }}
          />
          <button className="action-button" onClick={issueCert}>Issue Certificate</button> {/* Use CSS class */}
          {issueError && <p className="error-message">{issueError}</p>} {/* Use CSS class */}
        </div>
      )}

      {view === 'verify-cert' && (
        <div className="view-container"> {/* Use CSS class */}
          <h3>Verify Certificate</h3>
          <input
            className="input-wide" // Use CSS class
            placeholder="Certificate ID (e.g., CERT-123456789)" value={verifyId}
            onChange={e => { setVerifyId(e.target.value); setVerifyApiError(''); setVerifyResult(null); }}
          />
          <button className="action-button" onClick={verifyCert}>Verify</button> {/* Use CSS class */}
          {/* Display Verify API Error */}
          {verifyApiError && <p className="error-message">{verifyApiError}</p>} {/* Use CSS class */}
          {/* Display Verification Result (Success or Not Found) */}
          {verifyResult && verifyResult.error ? (
            <p className="error-message" style={{ color: 'orange' }}>{verifyResult.error}</p> // Not Found message
          ) : verifyResult ? (
            // Use CSS classes for table
            <table className="data-table" style={{maxWidth:'600px', margin:'15px auto'}}>
              <thead><tr><th className="table-header" colSpan="2" style={{textAlign:'center'}}>Verification Result</th></tr></thead>
              <tbody>
                <tr><td className="table-cell-label">Name:</td><td className="table-cell">{verifyResult.name}</td></tr>
                <tr><td className="table-cell-label">Email:</td><td className="table-cell">{verifyResult.email}</td></tr>
                <tr><td className="table-cell-label">Certificate ID:</td><td className="table-cell">{verifyResult.certificateId}</td></tr>
                <tr><td className="table-cell-label">Issue Date:</td><td className="table-cell">{new Date(verifyResult.issueDate).toLocaleDateString()}</td></tr>
                <tr><td className="table-cell-label">Verified:</td><td className="table-cell">{verifyResult.verified ? 'Yes' : 'No'}</td></tr>
              </tbody>
            </table>
          ) : null}
        </div>
      )}

      {view === 'cert-list' && (
        <div className="view-container"> {/* Use CSS class */}
          <h3>All Issued Certificates</h3>
          {listError && <p className="error-message">{listError}</p>} {/* Use CSS class */}
          {downloadError && <p className="error-message">{downloadError}</p>} {/* Use CSS class */}
          {certs.length > 0 ? (
             // Use CSS classes for table
            <table className="data-table">
              <thead>
                <tr>
                  <th className="table-header">Name</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Certificate ID</th>
                  <th className="table-header">Issued Date</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {certs.map(cert => (
                  <tr key={cert._id}>
                    <td className="table-cell">{cert.name}</td>
                    <td className="table-cell">{cert.email}</td>
                    <td className="table-cell">{cert.certificateId}</td>
                    <td className="table-cell">{new Date(cert.issueDate).toLocaleDateString()}</td>
                    <td className="table-cell">
                      <button className="small-button" onClick={() => handleDownload(cert.certificateId)}>Download</button> {/* Use CSS class */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            !listError && <p style={{textAlign:'center', marginTop:'20px'}}>No certificates found.</p>
          )}
        </div>
      )}

      {view === 'issue-lor' && (
        <div className="view-container"> {/* Use CSS class */}
          <h3>Issue LOR</h3>
          <input
            className="input-wide" // Use CSS class
            value={form.name} placeholder="Recipient Name"
            onChange={e => { setForm({ ...form, name: e.target.value }); setLorError(''); }}
          />
          <input
             className="input-wide" // Use CSS class
             value={form.email} placeholder="Recipient Email" type="email"
            onChange={e => { setForm({ ...form, email: e.target.value }); setLorError(''); }}
          />
          {/* Add other fields for LOR here, e.g., a textarea */}
          {/* <textarea className="input-wide" placeholder="LOR Content..." rows="5" onChange={...}></textarea> */}
          <button className="action-button" onClick={issueLOR}>Issue LOR</button> {/* Use CSS class */}
          {lorError && <p className="error-message">{lorError}</p>} {/* Use CSS class */}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;