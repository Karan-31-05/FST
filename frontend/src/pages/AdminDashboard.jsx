import '../../src/assets/styles.css'; // Keep global styles if needed
import React, { useState, useEffect } from 'react';
import axios from '../api'; // Ensure this points to your configured axios instance
// import { useNavigate } from 'react-router-dom'; // Uncomment if needed later

const AdminDashboard = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [view, setView] = useState('cert-list'); // Default view
  const [certs, setCerts] = useState([]);
  const [form, setForm] = useState({ name: '', email: '' }); // For cert issue form
  const [verifyId, setVerifyId] = useState('');
  const [verifyResult, setVerifyResult] = useState(null); // Holds success data or { error: 'Not found' }

  // Certificate Error States
  const [issueError, setIssueError] = useState('');
  const [listError, setListError] = useState('');
  const [verifyApiError, setVerifyApiError] = useState(''); // For API/network errors during verify
  const [downloadError, setDownloadError] = useState('');

  // --- LOR State ---
  const [lorRequests, setLorRequests] = useState([]);
  const [lorLoading, setLorLoading] = useState(false);
  const [lorListError, setLorListError] = useState('');
  const [lorActionStatus, setLorActionStatus] = useState({ id: null, loading: false, error: '', message: '' });
  const [directLorForm, setDirectLorForm] = useState({ email: '', adminNotes: '' }); // Separate form state for direct LOR
  const [directLorStatus, setDirectLorStatus] = useState({ loading: false, error: '', message: '' });
  // ---------------

  // const navigate = useNavigate(); // Uncomment if needed later

  // Helper function for basic email validation
  const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

  // --- Certificate Functions ---
  const fetchCerts = async () => {
    setListError('');
    setDownloadError('');
    try {
      console.log("Fetching certificates...");
      const res = await axios.get('/certificates');
      console.log("Certificates fetched:", res.data);
      setCerts(res.data || []); // Ensure it's an array
    } catch (error) {
      console.error("Error fetching certificates:", error);
      setListError(error.response?.data?.error || "Failed to fetch certificates. Please try again.");
      setCerts([]);
    }
  };

  const verifyCert = async () => {
    setVerifyApiError('');
    setVerifyResult(null);
    if (!verifyId.trim()) {
      setVerifyApiError("Please enter a Certificate ID to verify.");
      return;
    }
    try {
      const res = await axios.get(`/certificates/verify/${verifyId.trim()}`);
      setVerifyResult(res.data);
    } catch (error) {
      console.error("Error verifying certificate:", error);
      if (error.response?.status === 404) {
        setVerifyResult({ error: 'Certificate not found.' });
      } else {
        setVerifyApiError(error.response?.data?.error || 'An error occurred during verification.');
        setVerifyResult(null);
      }
    }
  };

  const issueCert = async () => {
    setIssueError('');
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
      console.log('Attempting to issue certificate with data:', form);
      const res = await axios.post('/certificates/issue', form);
      alert(res.data?.message || 'Certificate issued successfully');
      setForm({ name: '', email: '' });
      fetchCerts();
      setView('cert-list');
    } catch (err) {
      console.error("Error issuing certificate:", err);
      setIssueError(err.response?.data?.error || 'An unexpected error occurred while issuing.');
    }
  };

  const handleDownload = async (certificateId) => {
    setDownloadError('');
    if (!certificateId) return;
    try {
      const downloadURL = `/certificates/download/${certificateId}`;
      console.log("Attempting to download from:", downloadURL);
      const response = await axios.get(downloadURL, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let filename = `certificate-${certificateId}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch?.[1]) filename = filenameMatch[1];
      }
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      let errorMsg = 'Failed to download certificate.';
       if (error.response?.data instanceof Blob && error.response.data.type.includes('json')) {
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
  // --------------------------------------------------------------------------------

  // --- LOR Functions ---
  const fetchLORRequests = async () => {
    setLorLoading(true);
    setLorListError('');
    setLorActionStatus({ id: null, loading: false, error: '', message: '' });
    try {
      console.log("Fetching LOR requests...");
      const res = await axios.get('/lor/requests');
      setLorRequests(res.data || []);
      console.log("LOR Requests fetched:", res.data);
    } catch (error) {
      console.error("Error fetching LOR requests:", error);
      setLorListError(error.response?.data?.error || "Failed to fetch LOR requests.");
      setLorRequests([]);
    } finally {
      setLorLoading(false);
    }
  };

  const handleLORAction = async (requestId, newStatus) => {
    setLorActionStatus({ id: requestId, loading: true, error: '', message: '' });
    const adminNotes = prompt(`Enter optional notes for ${newStatus === 'approved' ? 'approval' : 'rejection'}:`, "");
    try {
      const res = await axios.put(`/lor/requests/${requestId}/status`, { status: newStatus, adminNotes: adminNotes });
      setLorActionStatus({ id: requestId, loading: false, error: '', message: res.data?.message || `Request ${newStatus} successfully.` });
      fetchLORRequests();
    } catch (error) {
      console.error(`Error ${newStatus} LOR request ${requestId}:`, error);
      setLorActionStatus({ id: requestId, loading: false, error: error.response?.data?.error || `Failed to ${newStatus} request.`, message: '' });
    }
  };

  const handleDirectIssueLOR = async () => {
    setDirectLorStatus({ loading: true, error: '', message: '' });
    if (!directLorForm.email.trim() || !isValidEmail(directLorForm.email)) {
      setDirectLorStatus({ loading: false, error: 'Please enter a valid recipient email address.', message: '' });
      return;
    }
    try {
      const res = await axios.post('/lor/issue-direct', { email: directLorForm.email, adminNotes: directLorForm.adminNotes });
      setDirectLorStatus({ loading: false, error: '', message: res.data?.message || 'LOR issued directly successfully.' });
      setDirectLorForm({ email: '', adminNotes: '' });
    } catch (error) {
      console.error("Error issuing direct LOR:", error);
      setDirectLorStatus({ loading: false, error: error.response?.data?.error || 'Failed to issue direct LOR.', message: '' });
    }
  };
  // -------------------

  // Initial data fetch logic based on view
  useEffect(() => {
    if (!showWelcome) {
      console.log("AdminDashboard visible. Fetching initial data based on view:", view);
      // Clear previous view data/errors to prevent stale info
      setCerts([]);
      setLorRequests([]);
      setListError('');
      setLorListError('');
      setDownloadError('');
      setVerifyResult(null);
      setVerifyApiError('');
      setIssueError('');
      setLorActionStatus({ id: null, loading: false, error: '', message: '' });
      setDirectLorStatus({ loading: false, error: '', message: '' });


      // Fetch data for the current view
      if (view === 'cert-list') {
        fetchCerts();
      } else if (view === 'lor-requests') {
        fetchLORRequests();
      }
      // Add fetches for other views if they need initial data
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWelcome, view]); // Refetch when view changes or welcome screen dismissed


  // --- Welcome Screen ---
  if (showWelcome) {
     return (
      <div className="page" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h2>🛡️ Welcome, Admin!</h2>
        <p>You are now logged in to the Admin Panel.</p>
        <button
          className="action-button"
          onClick={() => setShowWelcome(false)}
          style={{ backgroundColor: '#4CAF50', marginTop:'1.5rem' }}
        >
          Continue to Dashboard
        </button>
      </div>
    );
  }

  // --- Main Dashboard ---
  return (
    <div className="page" key={view}>
      <h2 style={{ color: 'purple', textAlign: 'center', marginBottom: '1.5rem' }}>🛡️ Admin Dashboard</h2>

      {/* Navigation Buttons */}
      <div className="admin-nav-buttons">
        <button className={`nav-button ${view === 'issue-cert' ? 'active' : ''}`} onClick={() => setView('issue-cert')}>Issue Certificate</button>
        <button className={`nav-button ${view === 'verify-cert' ? 'active' : ''}`} onClick={() => setView('verify-cert')}>Verify Certificate</button>
        <button className={`nav-button ${view === 'cert-list' ? 'active' : ''}`} onClick={() => setView('cert-list')}>View Certificates</button>
        <button className={`nav-button ${view === 'lor-requests' ? 'active' : ''}`} onClick={() => setView('lor-requests')}>Manage LOR Requests</button>
        <button className={`nav-button ${view === 'lor-issue-direct' ? 'active' : ''}`} onClick={() => setView('lor-issue-direct')}>Issue LOR</button>
      </div>

      {/* Conditional Views */}

      {/* --- Issue Certificate View (RESTORED) --- */}
      {view === 'issue-cert' && (
        <div className="view-container">
          <h3>Issue Certificate</h3>
          <input
            className="input-wide"
            value={form.name} placeholder="Student Name"
            onChange={e => { setForm({ ...form, name: e.target.value }); setIssueError(''); }}
          />
          <input
            className="input-wide"
            value={form.email} placeholder="Student Email" type="email"
            onChange={e => { setForm({ ...form, email: e.target.value }); setIssueError(''); }}
          />
          <button className="action-button" onClick={issueCert}>Issue Certificate</button>
          {issueError && <p className="error-message">{issueError}</p>}
        </div>
      )}
      {/* --- End Issue Certificate View --- */}


      {/* --- Verify Certificate View (RESTORED) --- */}
      {view === 'verify-cert' && (
        <div className="view-container">
          <h3>Verify Certificate</h3>
          <input
            className="input-wide"
            placeholder="Certificate ID (e.g., CERT-123456789)" value={verifyId}
            onChange={e => { setVerifyId(e.target.value); setVerifyApiError(''); setVerifyResult(null); }}
          />
          <button className="action-button" onClick={verifyCert}>Verify</button>
          {verifyApiError && <p className="error-message">{verifyApiError}</p>}
          {verifyResult && verifyResult.error ? (
            <p className="error-message" style={{ color: 'orange' }}>{verifyResult.error}</p> // Not Found message
          ) : verifyResult ? (
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
      {/* --- End Verify Certificate View --- */}


      {/* --- Certificate List View (RESTORED) --- */}
      {view === 'cert-list' && (
        <div className="view-container">
          <h3>All Issued Certificates</h3>
          {listError && <p className="error-message">{listError}</p>}
          {downloadError && <p className="error-message">{downloadError}</p>}
          {certs.length > 0 ? (
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
                      <button className="small-button" onClick={() => handleDownload(cert.certificateId)}>Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            // Show message only if not loading and no error occurred
            !listError && certs.length === 0 && <p style={{textAlign:'center', marginTop:'20px'}}>No certificates found.</p>
          )}
        </div>
      )}
      {/* --- End Certificate List View --- */}


      {/* --- LOR Request Management View --- */}
      {view === 'lor-requests' && (
        <div className="view-container">
          <h3>Manage LOR Requests</h3>
          {lorLoading && <p className="loading-message">⏳ Loading LOR requests...</p>}
          {lorListError && <p className="error-message">{lorListError}</p>}
          {lorActionStatus.message && !lorActionStatus.error && <p className="success-message">{lorActionStatus.message}</p>}
          {!lorLoading && lorRequests.length === 0 && !lorListError && (
            <p>No LOR requests found.</p>
          )}
          {!lorLoading && lorRequests.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="table-header">Student Name</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Request Date</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Reason</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lorRequests.map(req => (
                  <tr key={req._id}>
                    <td className="table-cell">{req.student?.name || 'N/A'}</td>
                    <td className="table-cell">{req.studentEmail}</td>
                    <td className="table-cell">{new Date(req.requestDate).toLocaleDateString()}</td>
                    <td className="table-cell" style={{ textTransform: 'capitalize' }}>{req.status}</td>
                    <td className="table-cell" title={req.reason}>{req.reason ? `${req.reason.substring(0, 30)}...` : '-'}</td>
                    <td className="table-cell">
                      {req.status === 'pending' ? (
                        <>
                          <button
                            className="small-button"
                            style={{ backgroundColor: '#28a745', marginRight: '5px' }}
                            onClick={() => handleLORAction(req._id, 'approved')}
                            disabled={lorActionStatus.loading && lorActionStatus.id === req._id}
                          >
                            {lorActionStatus.loading && lorActionStatus.id === req._id ? '...' : 'Approve'}
                          </button>
                          <button
                            className="small-button"
                            style={{ backgroundColor: '#dc3545' }}
                            onClick={() => handleLORAction(req._id, 'rejected')}
                            disabled={lorActionStatus.loading && lorActionStatus.id === req._id}
                          >
                             {lorActionStatus.loading && lorActionStatus.id === req._id ? '...' : 'Reject'}
                          </button>
                           {lorActionStatus.error && lorActionStatus.id === req._id && <p className="error-message" style={{fontSize:'12px', marginTop:'5px'}}>{lorActionStatus.error}</p>}
                        </>
                      ) : (
                        `Actioned on ${req.actionDate ? new Date(req.actionDate).toLocaleDateString() : 'N/A'}`
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {/* --- End LOR Request Management View --- */}


      {/* --- Direct LOR Issue View --- */}
      {view === 'lor-issue-direct' && (
        <div className="view-container">
          <h3>Issue LOR</h3>
          <p>Issue and email an LOR directly to a registered student.</p>
          <input
            className="input-wide"
            type="email"
            placeholder="Student Email Address"
            value={directLorForm.email}
            onChange={e => { setDirectLorForm({ ...directLorForm, email: e.target.value }); setDirectLorStatus({loading:false, error:'', message:''}); }}
          />
          <textarea
            className="input-wide"
            rows="5"
            placeholder="Optional: Add custom notes to include in the LOR PDF and email"
            value={directLorForm.adminNotes}
            onChange={e => setDirectLorForm({ ...directLorForm, adminNotes: e.target.value })}
            style={{ marginTop: '10px' }}
          />
          <button
            className="action-button"
            onClick={handleDirectIssueLOR}
            disabled={directLorStatus.loading}
          >
            {directLorStatus.loading ? 'Issuing...' : 'Issue and Send LOR'}
          </button>
          {directLorStatus.error && <p className="error-message">{directLorStatus.error}</p>}
          {directLorStatus.message && <p className="success-message">{directLorStatus.message}</p>}
        </div>
      )}
      {/* --- End Direct LOR Issue View --- */}

    </div> // End Page Div
  );
};

export default AdminDashboard;


// **Summary of Changes:**

// 1.  **Restored JSX:** The blocks for `view === 'issue-cert'`, `view === 'verify-cert'`, and `view === 'cert-list'` have been fully restored with their respective inputs, buttons, tables, and error message displays, using the CSS classes we defined earlier.
// 2.  **Functions:** The corresponding functions (`fetchCerts`, `verifyCert`, `issueCert`, `handleDownload`) were already present in the code you provided, so they remain.
// 3.  **State:** The necessary state variables for certificate management (`certs`, `form`, `verifyId`, `verifyResult`, `issueError`, etc.) were also already present.
// 4.  **Data Fetching `useEffect`:** I slightly modified the `useEffect` hook to clear out data/errors from other views when the `view` changes, preventing stale information from potentially showing up briefly. It still fetches data based on the current `view`.

// This version should now correctly display all the certificate management sections (`Issue Certificate`, `Verify Certificate`, `View Certificates`) along with the LOR management sections when you click the corresponding navigation butto