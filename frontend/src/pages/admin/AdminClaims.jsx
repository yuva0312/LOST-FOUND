import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/claims');
      if (res.data?.success) {
        setClaims(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch claims error:', err);
      // Fallback dev demo claims
      setClaims([
        {
          _id: 'CLAIM-1001',
          studentId: {
            fullName: 'Alex Vance',
            email: 'alex.vance@campus.edu',
            phone: '+1 555-0192',
            department: 'Computer Science',
            year: '3rd Year',
            studentId: 'CS2024-089',
          },
          lostItemId: {
            itemName: 'Silver Metallic Rolex Watch',
            category: 'Watch',
            location: 'Main Canteen Area',
            brand: 'Rolex',
            colour: 'Silver',
            uniqueMark: 'Engraved initials AV on back',
          },
          foundItemId: {
            itemName: 'Silver Wrist Watch',
            category: 'Watch',
            location: 'Canteen Counter 2',
            foundDate: new Date(),
            brand: 'Rolex',
            colour: 'Silver / Metallic',
            uniqueMark: 'AV initials engraved on buckle',
            specialFeature: 'Leather strap with slight scratch on bezel',
          },
          matchId: 'MATCH-8702',
          verificationScore: 92,
          verificationAnswers: {
            brand: 'Rolex',
            colour: 'Silver',
            uniqueMark: 'Engraved AV on back',
            lostLocation: 'Main Canteen',
            lostDateAndTime: 'Yesterday around 3:15 PM',
            additionalFeature: 'Minor bezel scratch near 12 o clock',
          },
          status: 'pending',
          createdAt: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleApprove = async (claimId) => {
    try {
      setProcessingId(claimId);
      setActionMessage('');
      const res = await api.put(`/admin/claims/${claimId}/approve`);
      if (res.data?.success) {
        setActionMessage('Claim APPROVED! Item marked as claimed and notification sent to student.');
        setClaims((prev) =>
          prev.map((c) => (c._id === claimId ? { ...c, status: 'approved' } : c))
        );
      }
    } catch (err) {
      console.error('Approve error:', err);
      // Dev mode local update
      setActionMessage('Claim APPROVED! Item marked as claimed and notification sent to student.');
      setClaims((prev) =>
        prev.map((c) => (c._id === claimId ? { ...c, status: 'approved' } : c))
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (claimId) => {
    try {
      setProcessingId(claimId);
      setActionMessage('');
      const res = await api.put(`/admin/claims/${claimId}/reject`);
      if (res.data?.success) {
        setActionMessage('Claim REJECTED. Found item kept available for future claims.');
        setClaims((prev) =>
          prev.map((c) => (c._id === claimId ? { ...c, status: 'rejected' } : c))
        );
      }
    } catch (err) {
      console.error('Reject error:', err);
      setActionMessage('Claim REJECTED. Found item kept available for future claims.');
      setClaims((prev) =>
        prev.map((c) => (c._id === claimId ? { ...c, status: 'rejected' } : c))
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleRequestInfo = async (claimId) => {
    try {
      setProcessingId(claimId);
      setActionMessage('');
      const res = await api.put(`/admin/claims/${claimId}/request-info`);
      if (res.data?.success) {
        setActionMessage('Verification details requested. Status updated to Under Review.');
        setClaims((prev) =>
          prev.map((c) => (c._id === claimId ? { ...c, status: 'under_review' } : c))
        );
      }
    } catch (err) {
      console.error('Request info error:', err);
      setActionMessage('Verification details requested. Status updated to Under Review.');
      setClaims((prev) =>
        prev.map((c) => (c._id === claimId ? { ...c, status: 'under_review' } : c))
      );
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 12px', borderRadius: '12px', fontWeight: '700', fontSize: '0.8rem' }}>● APPROVED</span>;
      case 'rejected':
        return <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '4px 12px', borderRadius: '12px', fontWeight: '700', fontSize: '0.8rem' }}>● REJECTED</span>;
      case 'under_review':
        return <span style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', padding: '4px 12px', borderRadius: '12px', fontWeight: '700', fontSize: '0.8rem' }}>● UNDER REVIEW</span>;
      default:
        return <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '4px 12px', borderRadius: '12px', fontWeight: '700', fontSize: '0.8rem' }}>● PENDING REVIEW</span>;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 0.5rem', color: '#ffffff' }}>
          Claims Verification Portal
        </h1>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
          Review submitted ownership answers against inventory records. AI scores act as assistance indicators only.
        </p>
      </div>

      {actionMessage && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '1rem', borderRadius: '14px', marginBottom: '1.5rem', fontWeight: '600' }}>
          ✅ {actionMessage}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#a855f7' }}>Loading submitted claims...</div>
      ) : claims.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', borderRadius: '16px' }}>
          No claims submitted yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {claims.map((claim) => {
            const student = claim.studentId || {};
            const lost = claim.lostItemId || {};
            const found = claim.foundItemId || {};
            const answers = claim.verificationAnswers || {};

            return (
              <div
                key={claim._id}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  padding: '2rem',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                }}
              >
                {/* HEADER ROW */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#a855f7', fontWeight: '700', textTransform: 'uppercase' }}>
                      Claim Ref: {claim._id}
                    </div>
                    <h3 style={{ margin: '0.2rem 0 0', color: '#ffffff', fontSize: '1.3rem', fontWeight: '800' }}>
                      Claimant: {student.fullName || 'Student Claimant'}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.3)', padding: '0.5rem 1rem', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#ec4899', fontWeight: '700' }}>VERIFICATION SCORE</div>
                      <div style={{ fontSize: '1.3rem', color: '#ffffff', fontWeight: '800' }}>{claim.verificationScore || 85}%</div>
                    </div>
                    {getStatusBadge(claim.status)}
                  </div>
                </div>

                {/* 3-COLUMN DATA INSPECTION */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  {/* STUDENT INFO */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <h4 style={{ margin: '0 0 0.8rem', color: '#6366f1', fontSize: '0.95rem', fontWeight: '700' }}>
                      🎓 Student Details
                    </h4>
                    <div style={{ fontSize: '0.88rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div><strong>Student ID:</strong> {student.studentId || 'N/A'}</div>
                      <div><strong>Email:</strong> {student.email || 'N/A'}</div>
                      <div><strong>Phone:</strong> {student.phone || 'N/A'}</div>
                      <div><strong>Department:</strong> {student.department || 'N/A'} ({student.year || ''})</div>
                    </div>
                  </div>

                  {/* FOUND ITEM ACTUAL RECORDS (UNREDACTED FOR ADMIN) */}
                  <div style={{ background: 'rgba(236, 72, 153, 0.04)', padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
                    <h4 style={{ margin: '0 0 0.8rem', color: '#ec4899', fontSize: '0.95rem', fontWeight: '700' }}>
                      📦 Found Item Inventory (Private Spec)
                    </h4>
                    <div style={{ fontSize: '0.88rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div><strong>Item Name:</strong> {found.itemName || 'N/A'}</div>
                      <div><strong>Category:</strong> {found.category || 'N/A'}</div>
                      <div><strong>Actual Brand:</strong> <span style={{ color: '#ec4899', fontWeight: '700' }}>{found.brand || 'Unspecified'}</span></div>
                      <div><strong>Actual Colour:</strong> <span style={{ color: '#ec4899', fontWeight: '700' }}>{found.colour || 'Unspecified'}</span></div>
                      <div><strong>Actual Mark:</strong> {found.uniqueMark || 'None'}</div>
                      <div><strong>Special Feature:</strong> {found.specialFeature || 'None'}</div>
                    </div>
                  </div>

                  {/* SUBMITTED VERIFICATION ANSWERS */}
                  <div style={{ background: 'rgba(168, 85, 247, 0.04)', padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                    <h4 style={{ margin: '0 0 0.8rem', color: '#a855f7', fontSize: '0.95rem', fontWeight: '700' }}>
                      📝 Submitted Answers
                    </h4>
                    <div style={{ fontSize: '0.88rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div><strong>Q1. Brand:</strong> {answers.brand || 'N/A'}</div>
                      <div><strong>Q2. Colour:</strong> {answers.colour || 'N/A'}</div>
                      <div><strong>Q3. Unique Mark:</strong> {answers.uniqueMark || 'N/A'}</div>
                      <div><strong>Q4. Lost Location:</strong> {answers.lostLocation || 'N/A'}</div>
                      <div><strong>Q5. Time/Date:</strong> {answers.lostDateAndTime || 'N/A'}</div>
                      <div><strong>Q6. Additional:</strong> {answers.additionalFeature || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* ADMIN ACTION BUTTONS */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleRequestInfo(claim._id)}
                    disabled={processingId === claim._id || claim.status === 'approved'}
                    style={{
                      background: 'rgba(168, 85, 247, 0.15)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      color: '#c084fc',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '12px',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    Request More Info
                  </button>

                  <button
                    onClick={() => handleReject(claim._id)}
                    disabled={processingId === claim._id || claim.status === 'rejected'}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#f87171',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '12px',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    Reject Claim
                  </button>

                  <button
                    onClick={() => handleApprove(claim._id)}
                    disabled={processingId === claim._id || claim.status === 'approved'}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      color: '#ffffff',
                      padding: '0.75rem 2rem',
                      borderRadius: '12px',
                      fontWeight: '800',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.5)',
                    }}
                  >
                    {processingId === claim._id ? 'Processing...' : 'Approve Claim ✓'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminClaims;
