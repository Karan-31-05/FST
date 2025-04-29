import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from '../api';

const VerifyCertificate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyCertificate = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/certificates/verify/${id}`);
        setCertificate(response.data);
        setError(null);
      } catch (err) {
        setError('Certificate not found or invalid');
        setCertificate(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      verifyCertificate();
    }
  }, [id]);

  return (
    <div className="verify-certificate-container">
      <div className="verify-header">
        <button 
          className="back-button" 
          onClick={() => navigate('/admin')}
        >
          <i className="fas fa-arrow-left"></i>
          Back to Dashboard
        </button>
        <h1>Certificate Verification Portal</h1>
      </div>

      <div className="verification-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Verifying certificate...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <i className="fas fa-times-circle"></i>
            <h2>Verification Failed</h2>
            <p>{error}</p>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Enter certificate ID to verify"
                value={id || ''}
                onChange={(e) => navigate(`/verify/${e.target.value}`)}
              />
              <button className="search-btn">
                <i className="fas fa-search"></i>
                Verify
              </button>
            </div>
          </div>
        ) : certificate && (
          <div className="certificate-details">
            <div className="verification-badge">
              <i className="fas fa-check-circle"></i>
              <span>Verified Certificate</span>
            </div>
            
            <div className="certificate-card">
              <div className="certificate-header">
                <h2>{certificate.studentName}</h2>
                <span className="certificate-id">ID: {certificate.id}</span>
              </div>
              
              <div className="certificate-body">
                <div className="info-group">
                  <label>Course</label>
                  <p>{certificate.courseName}</p>
                </div>
                <div className="info-group">
                  <label>Issue Date</label>
                  <p>{new Date(certificate.issueDate).toLocaleDateString()}</p>
                </div>
                <div className="info-group">
                  <label>Grade</label>
                  <p>{certificate.grade}</p>
                </div>
                <div className="info-group">
                  <label>Issuing Authority</label>
                  <p>{certificate.issuingAuthority}</p>
                </div>
              </div>
              
              <div className="certificate-footer">
                <button className="download-btn">
                  <i className="fas fa-download"></i>
                  Download Certificate
                </button>
                <div className="qr-code">
                  {/* Add QR code component here */}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyCertificate;
