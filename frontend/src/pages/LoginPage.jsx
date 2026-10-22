import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../store/slices/authSlice';
import Button from '../components/common/Button';

export const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const from = location.state?.from?.pathname || (user?.role === 'admin' ? '/admin' : '/dashboard');

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    dispatch(login(formData));
  };

  const handleDemoLogin = (email, password) => {
    setFormData({ email, password });
    dispatch(login({ email, password }));
  };

  return (
    <div className="w-full min-h-[calc(100vh-12rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl mx-auto my-4 lg:my-8 bg-surface rounded-3xl p-4 sm:p-6 lg:p-8 neo-raised">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Column: Neomorphic Authentication Form */}
          <div className="lg:col-span-7 flex flex-col justify-between py-2 sm:py-4 px-2 sm:px-4">
            <div>
              {/* Brand Header */}
              <div className="flex items-center gap-3.5 mb-8">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center p-2 bg-surface neo-raised-sm text-primary">
                  <span className="material-symbols-outlined text-[28px]">local_library</span>
                </div>
                <div>
                  <span className="text-xl font-bold font-headline tracking-tight text-on-surface">BookSphere</span>
                  <span className="block text-xs font-semibold text-secondary tracking-wider uppercase">
                    Universal Library Network
                  </span>
                </div>
              </div>

              {/* Page Headings */}
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight text-on-surface mb-2">
                  Welcome back to your library
                </h1>
                <p className="text-sm sm:text-base text-on-surface-variant font-normal">
                  Enter your credentials to access your reading shelf, active loans, and holds.
                </p>
              </div>

              {/* Social Sign-in Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-surface text-on-surface text-sm font-semibold neo-raised-sm hover:neo-pressed-sm transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 text-on-surface shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  <span>Continue with Google</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-surface text-on-surface text-sm font-semibold neo-raised-sm hover:neo-pressed-sm transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-primary text-xl">account_balance</span>
                  <span>Institutional SSO</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-6">
                <div className="w-full h-px bg-surface-container-high" />
                <span className="absolute px-4 bg-surface text-xs tracking-wider uppercase text-secondary font-medium">
                  or sign in with library ID / email
                </span>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Credentials Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email / Patron ID */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2" htmlFor="login-email">
                    Email or Library Card ID
                  </label>
                  <div className="relative flex items-center rounded-xl bg-surface px-4 py-3 neo-pressed-input">
                    <span className="material-symbols-outlined text-secondary text-xl mr-3 select-none">mail</span>
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="patron@booksphere.org or #LIB-98402"
                      className="w-full bg-transparent border-0 p-0 text-sm font-medium text-on-surface placeholder:text-secondary/70 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2" htmlFor="login-password">
                    Password
                  </label>
                  <div className="relative flex items-center rounded-xl bg-surface px-4 py-3 neo-pressed-input">
                    <span className="material-symbols-outlined text-secondary text-xl mr-3 select-none">lock</span>
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••••••"
                      className="w-full bg-transparent border-0 p-0 text-sm font-medium text-on-surface placeholder:text-secondary/70 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-secondary hover:text-primary transition-colors flex items-center justify-center p-1 focus:outline-none cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Options Row: Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-3 select-none cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                        rememberMe ? 'bg-primary text-white' : 'bg-surface neo-pressed-sm text-transparent'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm font-bold">check</span>
                    </div>
                    <span className="text-xs sm:text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                      Remember me on this device
                    </span>
                  </label>
                  <span className="text-xs sm:text-sm font-semibold text-primary cursor-pointer hover:underline">
                    Forgot password?
                  </span>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={loading}
                    icon="arrow_forward"
                  >
                    Sign In to BookSphere
                  </Button>
                </div>
              </form>

              {/* Demo Credentials Tray */}
              <div className="mt-6 pt-5 border-t border-surface-container-high space-y-2">
                <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider text-center">
                  Quick Demonstration Access
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('patron@booksphere.org', 'PatronSecret123!')}
                    className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-surface neo-raised-sm hover:neo-pressed-sm text-on-surface flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm text-primary">person</span>
                    Demo Patron
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('admin@booksphere.org', 'AdminSecret123!')}
                    className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-surface neo-raised-sm hover:neo-pressed-sm text-amber-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm text-amber-600">shield_person</span>
                    Demo Admin
                  </button>
                </div>
              </div>

              {/* Register Link */}
              <div className="text-center mt-6">
                <span className="text-sm text-on-surface-variant">Don't have a library pass? </span>
                <Link to="/register" className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-1">
                  <span>Register for free</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Security Guarantee Footer */}
            <div className="mt-6 pt-3 flex items-center justify-center gap-2 text-xs font-medium text-secondary">
              <span className="material-symbols-outlined text-sm text-primary">verified_user</span>
              <span>256-bit SSL encrypted patron session</span>
            </div>
          </div>

          {/* Right Column: Atmospheric Showcase Panel */}
          <div
            className="lg:col-span-5 relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 sm:p-8 text-white min-h-[420px]"
            style={{
              background: 'radial-gradient(130% 120% at 85% 15%, #4338ca 0%, #1e1b4b 60%, #0f0d2b 100%)',
              boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.1), 10px 10px 24px rgba(30,27,75,0.25)',
            }}
          >
            {/* Glowing Ambient Highlights */}
            <div className="absolute -right-8 -top-8 w-64 h-64 rounded-full opacity-20 bg-indigo-400 blur-2xl pointer-events-none" />

            {/* Top Badge: Active Readers Counter */}
            <div className="relative z-10 self-start">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md">
                <div className="flex -space-x-1.5 overflow-hidden">
                  <div className="inline-block h-6 w-6 rounded-full ring-2 ring-indigo-900 bg-primary text-[10px] flex items-center justify-center font-bold text-white">
                    AL
                  </div>
                  <div className="inline-block h-6 w-6 rounded-full ring-2 ring-indigo-900 bg-purple-500 text-[10px] flex items-center justify-center font-bold text-white">
                    MR
                  </div>
                  <div className="inline-block h-6 w-6 rounded-full ring-2 ring-indigo-900 bg-indigo-400 text-[10px] flex items-center justify-center font-bold text-indigo-950">
                    SK
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium text-slate-100">4,000+ patrons reading now</span>
                </div>
              </div>
            </div>

            {/* Center: Curated Literary Quote */}
            <div className="relative z-10 my-8 sm:my-10">
              <span className="text-5xl font-serif text-indigo-300/40 leading-none select-none block mb-2 font-light">
                “
              </span>
              <blockquote className="text-lg sm:text-xl md:text-2xl font-serif italic text-white leading-relaxed -mt-6">
                A room without books is like a body without a soul.
              </blockquote>
              <p className="mt-4 text-xs sm:text-sm font-semibold tracking-wider uppercase text-indigo-300">
                — Marcus Tullius Cicero
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default LoginPage;
