// ============================================================
// FILE: frontend/src/pages/StudentDashboard.jsx
// ============================================================

import '../../src/assets/styles.css'; // Keep global styles if needed
import React, { useEffect, useState } from 'react'; // Import React
import axios from '../api'; // Your configured axios instance
import { jwtDecode } from 'jwt-decode'; // Or your preferred JWT decoding method
// import { useNavigate } from 'react-router-dom'; // Uncomment if needed for redirects

const StudentDashboard = () => {
  // --- State Variables ---
  const [showWelcome, setShowWelcome] = useState(true);
  const [view, setView] = useState('my-certs'); // Default view
  const [certs, setCerts] = useState([]);
  const [studentInfo, setStudentInfo] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false); // For loading certificates
  const [error, setError] = useState(null); // For general errors (e.g., fetching certs, token issues)
  const [downloadError, setDownloadError] = useState('');

  // LOR State
  const [lorReason, setLorReason] = useState('');
  const [lorStatus, setLorStatus] = useState({ message: '', error: '', loading: false });
  // Add state for LOR history if needed:
  // const [lorHistory, setLorHistory] = useState([]);
  // const [loadingLorHistory, setLoadingLorHistory] = useState(false);
  // const [lorHistoryError, setLorHistoryError] = useState('');

  // const navigate = useNavigate(); // Uncomment if needed

  // --- API Call Functions ---

  // Fetch student's certificates
  const fetchMyCertificates = async () => {
    // Ensure token is available before fetching (though axios interceptor should handle this)
    const token = localStorage.getItem('token');
    if (!token) {
        setError("Not logged in. Cannot fetch certificates.");
        setLoading(false); // Ensure loading is false if we return early
        return;
    }

    console.log("fetchMyCertificates called");
    setLoading(true);
    setError(null); // Clear general errors
    setDownloadError(''); // Clear specific download errors
    try {
      // Backend route uses token from header (via axios interceptor) to identify user
      const res = await axios.get('/certificates/my-certificates');
      console.log("Certificates API Response received:", res.data);
      setCerts(res.data || []); // Ensure it's an array
    } catch (err) {
      console.error("Error fetching student certificates:", err);
      console.error("Error response data:", err.response?.data);
      // Set specific error message from backend if available
      setError(err.response?.data?.error || 'Failed to fetch your certificates.');
      setCerts([]); // Clear certs on error
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  // Handle certificate download (RESTORED LOGIC)
  const handleDownload = async (certificateId) => {
    setDownloadError(''); // Clear previous download errors
    if (!certificateId) {
        setDownloadError("Invalid Certificate ID for download.");
        return;
    }

    try {
      const downloadURL = `/certificates/download/${certificateId}`;
      console.log("Attempting to download from:", downloadURL);
      const response = await axios.get(downloadURL, { responseType: 'blob' });

      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = `certificate-${certificateId}.pdf`; // Default filename
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch?.[1]) filename = filenameMatch[1];
      }
      link.download = filename;
      document.body.appendChild(link);
      link.click(); // Trigger download
      document.body.removeChild(link); // Clean up link element
      window.URL.revokeObjectURL(url); // Free up memory

    } catch (error) {
      console.error('Download error:', error);
      let errorMsg = 'Failed to download certificate.';
      // Attempt to parse error message if backend sent JSON error as blob
      if (error.response?.data instanceof Blob && error.response.data.type.includes('json')) {
          try {
              const errorJson = JSON.parse(await error.response.data.text());
              errorMsg = errorJson.error || errorMsg;
          } catch (parseError) { console.error('Failed to parse error blob:', parseError); }
      } else if (error.response?.data?.error) {
          errorMsg = error.response.data.error;
      }
      setDownloadError(errorMsg); // Set specific download error state
    }
  };

  // Handle LOR Request Submission (RESTORED LOGIC)
  const handleRequestLOR = async () => {
    setLorStatus({ message: '', error: '', loading: true }); // Reset status, start loading
    try {
      // Call the backend endpoint to submit the request
      // The reason is sent in the request body
      const res = await axios.post('/lor/request', { reason: lorReason });
      // Update status with success message from backend
      setLorStatus({ message: res.data?.message || 'LOR request submitted successfully!', error: '', loading: false });
      setLorReason(''); // Clear reason field on success
      // Optionally: Refetch LOR history here if implementing that feature
      // fetchLorHistory();
    } catch (err) {
      console.error("Error requesting LOR:", err);
      // Update status with error message from backend, or a generic one
      setLorStatus({ message: '', error: err.response?.data?.error || 'Failed to submit LOR request.', loading: false });
    }
  };

  // --- useEffect Hooks ---

  // Effect 1: Decode token on initial mount to get student info
  useEffect(() => {
    console.log("Component mounted. Decoding token...");
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log("Token decoded:", decoded);
        setStudentInfo({ name: decoded.name || 'Student', email: decoded.email });
      } catch (error) {
        console.error("Error decoding token:", error);
        setError("Invalid session token. Please log in again.");
        // Optionally redirect to login
        // navigate('/login');
      }
    } else {
      console.log("No token found on mount.");
      setError("No session token found. Please log in.");
      // Optionally redirect to login
      // navigate('/login');
    }
  }, []); // Empty dependency array means run once on mount

  // Effect 2: Fetch data based on view when dashboard becomes visible or view changes
  useEffect(() => {
    // Only run fetch logic if welcome screen is dismissed AND we have student email
    if (!showWelcome && studentInfo.email) {
      console.log("StudentDashboard visible. Fetching data for view:", view);

      // Clear previous view's data/errors
      if (view !== 'my-certs') setCerts([]);
      // if (view !== 'lor-history') setLorHistory([]); // If history implemented
      setError(null); // Clear general errors when view changes
      setDownloadError('');
      // setLorHistoryError(''); // If history implemented

      // Fetch data specifically for the current view
      if (view === 'my-certs') {
        fetchMyCertificates();
      }
      // else if (view === 'lor-history') { // If history implemented
      //   fetchLorHistory();
      // }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWelcome, studentInfo.email, view]); // Re-run when welcome dismissed, email set, OR view changes


  // --- Render Logic ---

  // Welcome Screen
  if (showWelcome) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h2>🎓 Welcome, {studentInfo.name || 'Student'}!</h2>
        <p>You are logged in to your student dashboard.</p>
        <button
          className="action-button" // Use a standard class
          onClick={() => {
              console.log("Continue to Dashboard clicked"); // Log button click
              setShowWelcome(false);
          }}
          style={{ backgroundColor: '#4CAF50', marginTop: '1.5rem' }} // Keep specific color
        >
          Continue to Dashboard
        </button>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="page">
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>🎓 Student Dashboard</h2>
      <p style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Email: <strong>{studentInfo.email}</strong></p>

      {/* Navigation */}
      <div className="student-nav-buttons" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <button className={`nav-button ${view === 'my-certs' ? 'active' : ''}`} onClick={() => setView('my-certs')}>My Certificates</button>
          <button className={`nav-button ${view === 'request-lor' ? 'active' : ''}`} onClick={() => setView('request-lor')}>Request LOR</button>
          {/* Add button for LOR History if implemented */}
      </div>

      {/* Display general errors (like token issues) prominently */}
      {error && view !== 'my-certs' && <p className="error-message">{error}</p>}

      {/* --- My Certificates View --- */}
      {view === 'my-certs' && (
        <div className="view-container">
          <h3>My Certificates</h3>
          {loading && <p className="loading-message">⏳ Loading certificates...</p>}
          {/* Display fetch/download errors specific to this view */}
          {error && <p className="error-message">{error}</p>}
          {downloadError && <p className="error-message">{downloadError}</p>}

          {!loading && !error && certs.length === 0 && (
            <p>No certificates found.</p>
          )}

          {!loading && certs.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="table-header">Course/Program Name</th>
                  <th className="table-header">Certificate ID</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Issued Date</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {certs.map((cert) => (
                  <tr key={cert._id}>
                    <td className="table-cell">{cert.name}</td>
                    <td className="table-cell">{cert.certificateId}</td>
                    <td className="table-cell">{cert.verified ? 'Verified' : 'Pending'}</td>
                    <td className="table-cell">{new Date(cert.issueDate).toLocaleDateString()}</td>
                    <td className="table-cell">
                      <button className="small-button" onClick={() => handleDownload(cert.certificateId)}>Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* --- Request LOR View --- */}
      {view === 'request-lor' && (
         <div className="view-container">
            <h3>Request Letter of Recommendation</h3>
            <p>Submit a request for an LOR. You can optionally provide a reason or specific details for your request below.</p>
            <textarea
                className="input-wide" // Use existing class or create new one
                rows="4"
                placeholder="Optional: Reason for request, specific requirements, etc."
                value={lorReason}
                onChange={(e) => {
                    setLorReason(e.target.value);
                    // Clear status message when user types
                    setLorStatus({ message: '', error: '', loading: false });
                }}
                style={{ margin: '15px auto' }} // Keep style or move to CSS
            />
            <button
                className="action-button"
                onClick={handleRequestLOR}
                disabled={lorStatus.loading} // Disable button while loading
            >
                {lorStatus.loading ? 'Submitting...' : 'Submit LOR Request'}
            </button>

            {/* Display LOR Status Messages */}
            {lorStatus.error && <p className="error-message">{lorStatus.error}</p>}
            {lorStatus.message && <p className="success-message">{lorStatus.message}</p>}
            {/* Add section here later to display LOR request history if needed */}
         </div>
      )}

      {/* --- LOR History View (Placeholder) --- */}
      {/* {view === 'lor-history' && ( ... display history table ... )} */}

    </div> // End Page Div
  );
};

export default StudentDashboard;

// Remember to define CSS classes like .student-nav-buttons, .nav-button.active,
// .loading-message, .success-message, .error-message in a corresponding CSS file
// (e.g., StudentDashboard.css) and import it.
