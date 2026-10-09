import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { CheckCircle2, AlertTriangle, XCircle, Mail, RefreshCw, ArrowRight, Music2, Sparkles } from 'lucide-react';

type VerificationStatus = 'verifying' | 'success' | 'expired' | 'invalid';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { verifyEmail, resendVerification } = useAuth();
  const { isLight, isCyber } = useTheme();

  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [verifiedUser, setVerifiedUser] = useState<any>(null);

  // Resend state for expired/invalid
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!token || !token.trim()) {
      setStatus('invalid');
      setErrorMessage('No verification token was provided in the link.');
      return;
    }

    let isMounted = true;

    const performVerification = async () => {
      try {
        const data = await verifyEmail(token.trim());
        if (!isMounted) return;
        setStatus('success');
        setVerifiedUser(data?.user || null);
      } catch (err: any) {
        if (!isMounted) return;
        const resp = err?.response?.data;
        if (resp?.expired || err?.response?.status === 410) {
          setStatus('expired');
          setErrorMessage(resp?.error || 'This verification link has expired (links are valid for 15 minutes).');
          if (resp?.email) setResendEmail(resp.email);
        } else {
          setStatus('invalid');
          setErrorMessage(resp?.error || 'This verification link is invalid or has already been used.');
        }
      }
    };

    performVerification();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Handle countdown for resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim() || !resendEmail.includes('@')) {
      setResendError('Please enter a valid email address.');
      return;
    }

    setResendLoading(true);
    setResendError('');
    setResendSuccess('');

    try {
      const res = await resendVerification(resendEmail.trim());
      setResendSuccess(res?.message || 'A fresh verification link has been sent to your email address.');
      setCooldown(60);
    } catch (err: any) {
      const resp = err?.response?.data;
      if (err?.response?.status === 429) {
        setCooldown(resp?.retryAfterSeconds || 60);
      }
      setResendError(resp?.error || 'Could not resend verification email. Please try again later.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 select-none font-sans relative overflow-hidden transition-colors duration-500 ${
        isLight
          ? 'bg-[#f6f4fa] text-[#160c28]'
          : isCyber
          ? 'bg-[#030712] text-white'
          : 'bg-[#0a0514] text-white'
      }`}
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-pink-600/15 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* PLAYX Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] flex items-center justify-center shadow-lg shadow-purple-900/30 group-hover:scale-105 transition-transform">
              <Music2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-black text-3xl tracking-tight bg-gradient-to-r from-white via-purple-200 to-pink-400 bg-clip-text text-transparent">
              PLAY<span className="text-[#ec4899]">X</span>
            </span>
          </Link>
        </div>

        {/* Card Box */}
        <div
          className={`backdrop-blur-2xl rounded-3xl p-8 border shadow-2xl transition-all duration-300 ${
            isLight
              ? 'bg-white/80 border-purple-200/60 shadow-purple-900/10'
              : isCyber
              ? 'bg-[#0c1427]/85 border-cyan-500/30 shadow-cyan-900/20'
              : 'bg-[#130d22]/85 border-purple-500/20 shadow-black/60'
          }`}
        >
          {/* STATE 1: VERIFYING */}
          {status === 'verifying' && (
            <div className="text-center py-6">
              <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 animate-ping opacity-30" />
                <div className="w-16 h-16 rounded-full border-4 border-t-purple-500 border-r-pink-500 border-b-transparent border-l-transparent animate-spin" />
                <Sparkles className="w-6 h-6 text-purple-400 absolute" />
              </div>
              <h2 className="text-2xl font-bold font-display mb-2">Verifying Your Account</h2>
              <p className="text-sm text-purple-300/70">
                Please wait a moment while we validate your email verification token...
              </p>
            </div>
          )}

          {/* STATE 2: SUCCESS */}
          {status === 'success' && (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/60 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
              </div>
              <h2 className="text-2xl font-bold font-display mb-2 bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Email Verified!
              </h2>
              <p className="text-sm text-purple-200/80 mb-6">
                {verifiedUser?.name ? `Welcome to PLAYX, ${verifiedUser.name}! ` : 'Welcome to PLAYX! '}
                Your email has been verified and your account is now active.
              </p>

              <button
                type="button"
                onClick={() => navigate('/', { replace: true })}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-purple-900/40 hover:shadow-purple-900/60 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
              >
                <span>Enter Music Universe</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* STATE 3: EXPIRED */}
          {status === 'expired' && (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500/60 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold font-display mb-2 text-amber-300">
                Verification Link Expired
              </h2>
              <p className="text-sm text-purple-300/70 mb-6">
                {errorMessage || 'This link has expired for security reasons (valid for 15 minutes).'}
              </p>

              {/* Resend Verification Form */}
              <form onSubmit={handleResend} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-purple-300/80 mb-1.5 uppercase tracking-wider">
                    Your Registered Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={e => setResendEmail(e.target.value)}
                      placeholder="e.g. user@example.com"
                      required
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                        isLight
                          ? 'bg-purple-50/60 border-purple-200 text-gray-900 focus:border-purple-500'
                          : 'bg-purple-950/40 border-purple-500/30 text-white focus:border-pink-500'
                      }`}
                    />
                  </div>
                </div>

                {resendError && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
                    {resendError}
                  </div>
                )}

                {resendSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
                    {resendSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resendLoading || cooldown > 0}
                  className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-purple-900/30 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {resendLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Link...</span>
                    </>
                  ) : cooldown > 0 ? (
                    <span>Resend in {cooldown}s</span>
                  ) : (
                    <span>Request New Verification Link</span>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-purple-500/20">
                <Link to="/login" className="text-xs text-purple-300/80 hover:text-pink-300 transition-colors">
                  &larr; Back to Sign In
                </Link>
              </div>
            </div>
          )}

          {/* STATE 4: INVALID OR ALREADY USED */}
          {status === 'invalid' && (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/60 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold font-display mb-2 text-red-300">
                Invalid or Used Link
              </h2>
              <p className="text-sm text-purple-300/70 mb-6">
                {errorMessage || 'This link may have already been used, or it is invalid.'}
              </p>

              <div className="space-y-3">
                <Link
                  to="/login"
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-purple-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span>Go to Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/register"
                  className="block text-xs text-purple-300/80 hover:text-pink-300 transition-colors pt-2"
                >
                  Create a new account
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
