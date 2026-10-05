import React, { useState, useEffect } from 'react';
import {
  FiCheckCircle,
  FiFileText,
  FiUploadCloud,
  FiTrash2,
  FiShield,
  FiAlertCircle,
  FiLock,
  FiChevronRight,
  FiClock,
} from 'react-icons/fi';
import { agencyProfileApi } from '../lib/api.js';

const DOCUMENT_TYPES = [
  { id: 'license', label: 'Operating Licence / Tourism Certificate' },
  { id: 'tax_certificate', label: 'Tax Registration Certificate (VAT/Tax ID)' },
  { id: 'identity', label: 'Company Business Registration Certificate' },
  { id: 'other', label: 'Supporting Identity / Passport of Director' },
];

export default function AgencyOnboardingWizard({ onComplete }) {
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docType, setDocType] = useState('license');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [onboardingStatus, docs] = await Promise.all([
        agencyProfileApi.getOnboardingStatus(),
        agencyProfileApi.getDocuments(),
      ]);
      setStatus(onboardingStatus);
      setDocuments(docs || []);
      if (onboardingStatus.agreementAccepted) {
        setAgreementChecked(true);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load onboarding information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds maximum limit of 5 MB.');
      return;
    }

    try {
      setUploadingDoc(true);
      setErrorMsg('');
      setSuccessMsg('');

      // Convert file to base64 data url for safe transmission
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result;
          await agencyProfileApi.uploadDocument({
            documentType: docType,
            filePath: dataUrl,
            originalName: file.name,
            mimeType: file.type || 'application/pdf',
            size: file.size,
          });
          setSuccessMsg('Document uploaded successfully.');
          loadData();
        } catch (uploadErr) {
          setErrorMsg(uploadErr.message || 'Failed to upload document.');
        } finally {
          setUploadingDoc(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setErrorMsg(err.message || 'Upload failed.');
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      setErrorMsg('');
      await agencyProfileApi.deleteDocument(docId);
      setSuccessMsg('Document removed.');
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to remove document.');
    }
  };

  const handleAcceptAgreement = async () => {
    if (!agreementChecked) {
      setErrorMsg('Please select the checkbox to accept the Membership Agreement.');
      return;
    }
    try {
      setErrorMsg('');
      await agencyProfileApi.acceptAgreement({ agreementVersion: 'v1.0' });
      setSuccessMsg('Membership Agreement accepted and persisted.');
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to accept agreement.');
    }
  };

  const handleSubmitOnboarding = async () => {
    try {
      setErrorMsg('');
      await agencyProfileApi.submitOnboarding();
      setSuccessMsg('Onboarding application submitted for Admin review.');
      await loadData();
      if (onComplete) onComplete();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit onboarding.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#717D79' }}>
        <FiClock size={32} style={{ color: '#147D33', marginBottom: '12px' }} />
        <p>Loading onboarding status...</p>
      </div>
    );
  }

  const steps = [
    { num: 1, title: 'Business Details', isComplete: status?.profileComplete },
    { num: 2, title: 'Documents', isComplete: documents.length > 0 },
    { num: 3, title: 'Membership Agreement', isComplete: status?.agreementAccepted },
    { num: 4, title: 'Review & Submit', isComplete: status?.status === 'approved' },
  ];

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2DCD1',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(12, 78, 40, 0.05)',
        marginBottom: '24px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#13291C' }}>
            Agency Onboarding Formalities
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#717D79' }}>
            Complete all steps to activate your agency matching eligibility.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: status?.isOperational ? '#E5F2EA' : '#FFF3E0',
              color: status?.isOperational ? '#147D33' : '#FC7C00',
              border: `1px solid ${status?.isOperational ? '#147D33' : '#FC7C00'}`,
            }}
          >
            {status?.isOperational ? '✓ Operational' : 'Action Required'}
          </span>
        </div>
      </div>

      {/* Feedback Messages */}
      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#FEE2E2',
            color: '#991B1B',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FiAlertCircle /> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#E5F2EA',
            color: '#147D33',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FiCheckCircle /> {successMsg}
        </div>
      )}

      {/* Step Indicator */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '28px',
        }}
      >
        {steps.map((step) => {
          const isActive = activeStep === step.num;
          return (
            <div
              key={step.num}
              onClick={() => setActiveStep(step.num)}
              style={{
                padding: '12px',
                borderRadius: '12px',
                cursor: 'pointer',
                background: isActive ? '#0C4E28' : step.isComplete ? '#E5F2EA' : '#F9F8F3',
                color: isActive ? '#FFFFFF' : step.isComplete ? '#0C4E28' : '#717D79',
                border: `1px solid ${isActive ? '#0C4E28' : step.isComplete ? '#147D33' : '#E2DCD1'}`,
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isActive ? '#FC7C00' : step.isComplete ? '#147D33' : '#CBD5E1',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.78rem',
                  }}
                >
                  {step.isComplete ? '✓' : step.num}
                </span>
                <span>{step.title}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 1: Business Details */}
      {activeStep === 1 && (
        <div>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 16px', color: '#13291C' }}>Step 1: Business Details Overview</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#F9F8F3', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#717D79', display: 'block', fontWeight: 600 }}>AGENCY NAME</label>
              <div style={{ fontWeight: 700, color: '#13291C', marginTop: '4px' }}>{status?.agencyName || 'Not Set'}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#717D79', display: 'block', fontWeight: 600 }}>PROFILE COMPLETION</label>
              <div style={{ fontWeight: 700, color: status?.profileComplete ? '#147D33' : '#FC7C00', marginTop: '4px' }}>
                {status?.profileComplete ? '✓ Profile Complete' : 'Incomplete'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveStep(2)}
            style={{
              padding: '10px 20px',
              background: '#0C4E28',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Continue to Documents <FiChevronRight />
          </button>
        </div>
      )}

      {/* Step 2: Document Upload */}
      {activeStep === 2 && (
        <div>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 16px', color: '#13291C' }}>Step 2: Required Document Upload</h3>
          <p style={{ fontSize: '0.88rem', color: '#4E5754', marginBottom: '16px' }}>
            Upload mandatory operating licenses and tax certificates for administrative verification.
          </p>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #E2DCD1',
                background: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.88rem',
              }}
            >
              {DOCUMENT_TYPES.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.label}
                </option>
              ))}
            </select>

            <label
              style={{
                padding: '10px 18px',
                background: uploadingDoc ? '#CBD5E1' : '#147D33',
                color: '#FFFFFF',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: uploadingDoc ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <FiUploadCloud size={18} />
              {uploadingDoc ? 'Uploading...' : 'Choose File & Upload'}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileUpload}
                disabled={uploadingDoc}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Document Table */}
          <div style={{ border: '1px solid #E2DCD1', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#F9F8F3', borderBottom: '1px solid #E2DCD1', color: '#4E5754' }}>
                  <th style={{ padding: '12px 16px' }}>Document Type</th>
                  <th style={{ padding: '12px 16px' }}>Filename</th>
                  <th style={{ padding: '12px 16px' }}>Verification Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#717D79' }}>
                      No documents uploaded yet. Please select and upload required documents above.
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid #F1ECE1' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#13291C' }}>
                        {DOCUMENT_TYPES.find((d) => d.id === doc.documentType)?.label || doc.documentType}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#4E5754' }}>{doc.originalName || 'document'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background:
                              doc.status === 'approved' || doc.status === 'verified'
                                ? '#E5F2EA'
                                : doc.status === 'rejected'
                                ? '#FEE2E2'
                                : '#FFF3E0',
                            color:
                              doc.status === 'approved' || doc.status === 'verified'
                                ? '#147D33'
                                : doc.status === 'rejected'
                                ? '#991B1B'
                                : '#FC7C00',
                          }}
                        >
                          {doc.status === 'approved' ? 'Verified' : doc.status || 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#DC2626',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Remove Document"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() => setActiveStep(3)}
            style={{
              padding: '10px 20px',
              background: '#0C4E28',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Continue to Membership Agreement <FiChevronRight />
          </button>
        </div>
      )}

      {/* Step 3: Membership Agreement */}
      {activeStep === 3 && (
        <div>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 16px', color: '#13291C' }}>Step 3: Membership Agreement</h3>

          <div
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              border: '1px solid #E2DCD1',
              borderRadius: '8px',
              padding: '16px',
              background: '#F9F8F3',
              fontSize: '0.85rem',
              lineHeight: '1.6',
              color: '#4E5754',
              marginBottom: '20px',
            }}
          >
            <h4 style={{ margin: '0 0 8px', color: '#13291C' }}>QuoteMyTrip Agency Partner Agreement</h4>
            <p>
              By registering and providing quotations on QuoteMyTrip ("Platform"), the Agency agrees to abide by all platform operational standards, guest protection policies, and quotation pricing honesty requirements.
            </p>
            <p>
              1. <strong>Document Authenticity:</strong> All business licenses, tax documents, and permits provided must be valid and authentic.
            </p>
            <p>
              2. <strong>Quotation Compliance:</strong> All submitted quotations must accurately reflect full inclusive pricing without hidden surcharges upon traveler acceptance.
            </p>
            <p>
              3. <strong>Admin Oversight:</strong> QuoteMyTrip reserves the right to review agency status, suspend non-compliant profiles, and verify credentials periodically.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <input
              type="checkbox"
              id="agreementCheck"
              checked={agreementChecked}
              onChange={(e) => setAgreementChecked(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#147D33', cursor: 'pointer' }}
            />
            <label htmlFor="agreementCheck" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#13291C', cursor: 'pointer' }}>
              I have read and agree to the QuoteMyTrip Membership Agreement.
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={handleAcceptAgreement}
              disabled={!agreementChecked || status?.agreementAccepted}
              style={{
                padding: '10px 20px',
                background: status?.agreementAccepted ? '#E5F2EA' : agreementChecked ? '#147D33' : '#CBD5E1',
                color: status?.agreementAccepted ? '#147D33' : '#FFFFFF',
                border: status?.agreementAccepted ? '1px solid #147D33' : 'none',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: agreementChecked && !status?.agreementAccepted ? 'pointer' : 'default',
              }}
            >
              {status?.agreementAccepted ? '✓ Agreement Accepted' : 'Accept & Persist Agreement'}
            </button>

            <button
              type="button"
              onClick={() => setActiveStep(4)}
              style={{
                padding: '10px 20px',
                background: '#0C4E28',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Proceed to Review <FiChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Submit */}
      {activeStep === 4 && (
        <div>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 16px', color: '#13291C' }}>Step 4: Review & Final Submission</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ border: '1px solid #E2DCD1', borderRadius: '12px', padding: '16px', background: '#F9F8F3' }}>
              <div style={{ fontWeight: 700, color: '#13291C', marginBottom: '12px' }}>Profile Formalities Checklist</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Business Profile Details:</span>
                  <span style={{ fontWeight: 700, color: status?.profileComplete ? '#147D33' : '#DC2626' }}>
                    {status?.profileComplete ? '✓ Complete' : 'Incomplete'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Uploaded Documents:</span>
                  <span style={{ fontWeight: 700, color: documents.length > 0 ? '#147D33' : '#DC2626' }}>
                    {documents.length} File(s)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Membership Agreement:</span>
                  <span style={{ fontWeight: 700, color: status?.agreementAccepted ? '#147D33' : '#DC2626' }}>
                    {status?.agreementAccepted ? '✓ Accepted' : 'Not Accepted'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ border: '1px solid #E2DCD1', borderRadius: '12px', padding: '16px', background: '#F9F8F3' }}>
              <div style={{ fontWeight: 700, color: '#13291C', marginBottom: '12px' }}>Admin Approval Status</div>
              <div style={{ fontSize: '0.88rem', color: '#4E5754', marginBottom: '12px' }}>
                Current Agency Status:{' '}
                <strong style={{ color: status?.status === 'approved' ? '#147D33' : '#FC7C00' }}>
                  {status?.status ? status.status.toUpperCase() : 'PENDING'}
                </strong>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#717D79', margin: 0 }}>
                Agencies become eligible for request matching only after document verification and Admin approval.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmitOnboarding}
            style={{
              padding: '12px 24px',
              background: '#FC7C00',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(252, 124, 0, 0.25)',
            }}
          >
            <FiShield size={18} /> Submit Onboarding for Review
          </button>
        </div>
      )}
    </div>
  );
}
