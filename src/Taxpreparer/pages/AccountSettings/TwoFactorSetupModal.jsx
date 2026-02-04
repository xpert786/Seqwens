import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { userAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import TwoFactorCodeInput from '../../../ClientOnboarding/components/TwoFactorCodeInput';

function TwoFactorSetupModal({ show, onClose, onSuccess }) {
  const [setupLoading, setSetupLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [setupInstructions, setSetupInstructions] = useState(null);
  const [showSecret, setShowSecret] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [step, setStep] = useState(1); // 1: Setup, 2: Verification

  // Reset state when modal opens/closes
  useEffect(() => {
    if (show) {
      setStep(1);
      setQrCode(null);
      setSecret(null);
      setSetupInstructions(null);
      setVerificationCode('');
      setVerificationError(null);
      setShowSecret(false);
      // Call setup when modal opens
      handleSetup2FA();
    } else {
      // Reset everything when modal closes
      setStep(1);
      setQrCode(null);
      setSecret(null);
      setSetupInstructions(null);
      setVerificationCode('');
      setVerificationError(null);
      setShowSecret(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const handleSetup2FA = async () => {
    setSetupLoading(true);
    setVerificationError(null);

    try {
      const response = await userAPI.setup2FA();
      
      if (response.success) {
        // Check if 2FA is already enabled
        if (response.data.is_enabled) {
          toast.info("2FA is already enabled for your account", {
            position: "top-right",
            autoClose: 3000,
          });
          onSuccess?.();
          onClose();
        } else {
          // Show setup UI with QR code
          setQrCode(response.data.qr_code);
          setSecret(response.data.secret);
          setSetupInstructions(response.data.instructions);
          setStep(1);
        }
      } else {
        throw new Error(response.message || 'Failed to setup 2FA');
      }
    } catch (err) {
      console.error('Error setting up 2FA:', err);
      const errorMessage = handleAPIError(err);
      toast.error(errorMessage || "Failed to setup 2FA", {
        position: "top-right",
        autoClose: 3000,
      });
      onClose();
    } finally {
      setSetupLoading(false);
    }
  };

  const handleVerify2FASetup = async (code) => {
    if (!code || code.length !== 6) {
      setVerificationError('Please enter a valid 6-digit code');
      return;
    }

    setVerifying(true);
    setVerificationError(null);

    try {
      const response = await userAPI.verify2FASetup(code, secret);
      
      if (response.success) {
        toast.success("2FA enabled successfully!", {
          position: "top-right",
          autoClose: 3000,
        });

        // Reset state
        setVerificationCode('');
        setQrCode(null);
        setSecret(null);
        setSetupInstructions(null);
        
        // Call success callback and close modal
        onSuccess?.();
        onClose();
      } else {
        throw new Error(response.message || 'Verification failed');
      }
    } catch (err) {
      console.error('Error verifying 2FA setup:', err);
      const errorMessage = handleAPIError(err);
      setVerificationError(errorMessage);
      toast.error(errorMessage || "Invalid verification code", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleCodeComplete = (code) => {
    setVerificationCode(code);
    if (code.length === 6) {
      handleVerify2FASetup(code);
    }
  };

  const handleClose = () => {
    if (!verifying && !setupLoading) {
      onClose();
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      backdrop={verifying || setupLoading ? 'static' : true}
      keyboard={!verifying && !setupLoading}
      centered
      size="lg"
      style={{ zIndex: 1070 }}
    >
      <Modal.Header
        closeButton={!verifying && !setupLoading}
        style={{
          borderBottom: '1px solid #E8F0FF',
          padding: '20px 24px',
        }}
      >
        <Modal.Title
          style={{
            color: '#3B4A66',
            fontSize: '20px',
            fontWeight: '500',
            fontFamily: 'BasisGrotesquePro',
          }}
        >
          Setup Two-Factor Authentication
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: '24px' }}>
        {setupLoading ? (
          <div className="d-flex flex-column align-items-center justify-content-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p style={{ color: '#4B5563', fontSize: '14px', fontFamily: 'BasisGrotesquePro' }}>
              Generating QR code...
            </p>
          </div>
        ) : qrCode ? (
          <div>
            {/* Step 1: QR Code and Instructions */}
            {step === 1 && (
              <div>
                {setupInstructions && (
                  <div
                    className="mb-4 p-3 rounded"
                    style={{
                      backgroundColor: '#F3F7FF',
                      border: '1px solid #E8F0FF',
                      color: '#4B5563',
                      fontSize: '14px',
                      fontFamily: 'BasisGrotesquePro',
                      lineHeight: '1.6',
                    }}
                  >
                    {setupInstructions}
                  </div>
                )}

                <div className="d-flex justify-content-center mb-4">
                  <img
                    src={qrCode}
                    alt="2FA QR Code"
                    style={{
                      maxWidth: '280px',
                      width: '280px',
                      height: '280px',
                      border: '2px solid #E8F0FF',
                      borderRadius: '8px',
                      padding: '12px',
                      backgroundColor: '#ffffff',
                      display: 'block',
                      margin: '0 auto',
                    }}
                  />
                </div>

                {secret && (
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label
                        style={{
                          color: '#3B4A66',
                          fontSize: '14px',
                          fontWeight: '500',
                          fontFamily: 'BasisGrotesquePro',
                        }}
                      >
                        Secret Key (Backup):
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="btn "
                        style={{
                          backgroundColor: 'transparent',
                          color: '#F56D2D',
                          fontSize: '12px',
                          fontFamily: 'BasisGrotesquePro',
                          border: '1px solid #F56D2D',
                          padding: '4px 12px',
                          borderRadius: '6px',
                        }}
                      >
                        {showSecret ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {showSecret && (
                      <div
                        className="p-3 rounded"
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #E8F0FF',
                          fontFamily: 'monospace',
                          fontSize: '14px',
                          color: '#3B4A66',
                          wordBreak: 'break-all',
                          textAlign: 'center',
                        }}
                      >
                        {secret}
                      </div>
                    )}
                    <p
                      className="mt-2 mb-0"
                      style={{
                        color: '#6B7280',
                        fontSize: '12px',
                        fontFamily: 'BasisGrotesquePro',
                      }}
                    >
                      Save this secret key in a safe place. You'll need it if you lose access to your authenticator app.
                    </p>
                  </div>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn"
                    style={{
                      backgroundColor: '#F56D2D',
                      color: '#ffffff',
                      fontSize: '15px',
                      fontWeight: '400',
                      fontFamily: 'BasisGrotesquePro',
                      border: 'none',
                      padding: '10px 24px',
                      borderRadius: '8px',
                    }}
                  >
                    I've Scanned the QR Code
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Verification */}
            {step === 2 && (
              <div>
                <div className="mb-4">
                  <h6
                    style={{
                      color: '#3B4A66',
                      fontSize: '16px',
                      fontWeight: '500',
                      fontFamily: 'BasisGrotesquePro',
                      marginBottom: '8px',
                    }}
                  >
                    Verify Setup
                  </h6>
                  <p
                    style={{
                      color: '#4B5563',
                      fontSize: '14px',
                      fontFamily: 'BasisGrotesquePro',
                      marginBottom: '0',
                    }}
                  >
                    Enter the 6-digit code from your authenticator app to complete the setup:
                  </p>
                </div>

                <TwoFactorCodeInput
                  value={verificationCode}
                  onChange={(code) => {
                    setVerificationCode(code);
                    setVerificationError(null);
                  }}
                  onComplete={handleCodeComplete}
                  error={verificationError}
                  disabled={verifying}
                />

                <div className="d-flex gap-2 justify-content-end mt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={verifying}
                    className="btn"
                    style={{
                      backgroundColor: 'transparent',
                      color: '#3B4A66',
                      fontSize: '14px',
                      fontFamily: 'BasisGrotesquePro',
                      border: '1px solid #E8F0FF',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      opacity: verifying ? 0.6 : 1,
                      cursor: verifying ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerify2FASetup(verificationCode)}
                    disabled={verifying || verificationCode.length !== 6}
                    className="btn"
                    style={{
                      backgroundColor: '#F56D2D',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontFamily: 'BasisGrotesquePro',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      opacity: (verifying || verificationCode.length !== 6) ? 0.6 : 1,
                      cursor: (verifying || verificationCode.length !== 6) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {verifying ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Verifying...
                      </>
                    ) : (
                      'Verify & Enable'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal.Body>
    </Modal>
  );
}

export default TwoFactorSetupModal;
