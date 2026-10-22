import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../store/slices/authSlice';
import Button from '../components/common/Button';

export const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    branch: 'Metropolitan Central (Flagship)',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [receiveDigests, setReceiveDigests] = useState(true);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setValidationError('');
  };

  // Password strength checks
  const hasLength = formData.password.length >= 8;
  const hasNumber = /\d/.test(formData.password);
  const hasSpecial = /[^A-Za-z0-9]/.test(formData.password);
  const strengthScore = (hasLength ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);

  const getStrengthLabel = () => {
    if (!formData.password) return 'Awaiting Input';
    if (strengthScore === 1) return 'Weak';
    if (strengthScore === 2) return 'Moderate';
    return 'Strong Passphrase';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setValidationError('Please complete all required fields.');
      return;
    }
    if (!hasLength) {
      setValidationError('Password must be at least 8 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Password and confirmation do not match.');
      return;
    }
    if (!agreedToTerms) {
      setValidationError('Please agree to the Library Patron Agreement.');
      return;
    }
    dispatch(register(formData));
  };

  const BRANCHES = [
    'Metropolitan Central (Flagship)',
    'Academic Research Network (Univ. Collective)',
    'North Campus Engineering Archive',
    'South Park Science & Arts Stacks',
    'Open Sphere Global (Digital Archive)',
  ];

  const displayError = validationError || error;

  return (
    <div className="w-full min-h-[calc(100vh-12rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto my-4 lg:my-8 bg-surface rounded-3xl p-4 sm:p-6 lg:p-8 flex flex-col neo-raised">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Column: Registration Form Panel */}
          <div className="lg:col-span-7 flex flex-col justify-between pr-0 lg:pr-4">
            <div>
              {/* Brand Header */}
              <div className="flex items-center gap-3.5 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-surface p-2 neo-raised-sm flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[28px]">local_library</span>
                </div>
                <div>
                  <span className="text-xl font-bold font-headline tracking-tight text-on-surface">BookSphere</span>
                  <span className="block text-xs uppercase tracking-widest text-primary font-semibold">
                    Digital Catalog Network
                  </span>
                </div>
              </div>

              {/* Titles */}
              <div className="mb-6">
                <h1 className="text-3xl sm:text-4xl font-bold font-headline tracking-tight text-on-surface mb-2">
                  Join the BookSphere Community
                </h1>
                <p className="text-sm sm:text-base text-on-surface-variant">
                  Create your digital patron pass in less than 2 minutes.
                </p>
              </div>

              {/* Social Sign-up Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  className="h-12 px-4 rounded-xl bg-surface flex items-center justify-center gap-3 neo-raised-sm hover:neo-pressed-sm transition-all cursor-pointer"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" fill="#EA4335" />
                    <path d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.9z" fill="#4285F4" />
                    <path d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.2-1.9.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" fill="#FBBC05" />
                    <path d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z" fill="#34A853" />
                  </svg>
                  <span className="text-sm font-semibold text-on-surface">Sign up with Google</span>
                </button>
                <button
                  type="button"
                  className="h-12 px-4 rounded-xl bg-surface flex items-center justify-center gap-3 neo-raised-sm hover:neo-pressed-sm transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-primary text-xl">account_balance</span>
                  <span className="text-sm font-semibold text-on-surface">Institutional SSO</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-6">
                <div className="w-full h-px bg-surface-container-high" />
                <span className="absolute bg-surface px-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  or register with personal email
                </span>
              </div>

              {/* Error Alert */}
              {displayError && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span className="font-medium">{displayError}</span>
                </div>
              )}

              {/* Main Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name & Email Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" htmlFor="reg-name">
                      Full Legal Name
                    </label>
                    <div className="relative rounded-xl bg-surface neo-pressed-input flex items-center px-4 py-3">
                      <span className="material-symbols-outlined text-secondary text-xl mr-2.5">badge</span>
                      <input
                        id="reg-name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Eleanor Vance"
                        className="w-full bg-transparent border-none outline-none text-sm text-on-surface placeholder:text-on-surface-variant/50 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" htmlFor="reg-email">
                      Email Address
                    </label>
                    <div className="relative rounded-xl bg-surface neo-pressed-input flex items-center px-4 py-3">
                      <span className="material-symbols-outlined text-secondary text-xl mr-2.5">alternate_email</span>
                      <input
                        id="reg-email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="eleanor@library.org"
                        className="w-full bg-transparent border-none outline-none text-sm text-on-surface placeholder:text-on-surface-variant/50 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Library Branch Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" htmlFor="reg-branch">
                    Library Branch / Home Catalog
                  </label>
                  <div className="relative rounded-xl bg-surface neo-pressed-input flex items-center px-4 py-3">
                    <span className="material-symbols-outlined text-secondary text-xl mr-2.5">local_library</span>
                    <select
                      id="reg-branch"
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      className="w-full bg-transparent border-none outline-none text-sm text-on-surface font-medium cursor-pointer"
                    >
                      {BRANCHES.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" htmlFor="reg-password">
                      Create Password
                    </label>
                    <div className="relative rounded-xl bg-surface neo-pressed-input flex items-center px-4 py-3">
                      <span className="material-symbols-outlined text-secondary text-xl mr-2.5">lock</span>
                      <input
                        id="reg-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••••••"
                        className="w-full bg-transparent border-none outline-none text-sm text-on-surface placeholder:text-on-surface-variant/50 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-secondary hover:text-primary transition-colors focus:outline-none cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" htmlFor="reg-confirm">
                      Confirm Password
                    </label>
                    <div className="relative rounded-xl bg-surface neo-pressed-input flex items-center px-4 py-3">
                      <span className="material-symbols-outlined text-secondary text-xl mr-2.5">lock_clock</span>
                      <input
                        id="reg-confirm"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••••••"
                        className="w-full bg-transparent border-none outline-none text-sm text-on-surface placeholder:text-on-surface-variant/50 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Password Strength Bar & Checklist */}
                <div className="p-3.5 rounded-xl bg-surface neo-pressed">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-on-surface-variant">Security Rating:</span>
                    <span
                      className={`text-xs font-bold ${
                        strengthScore === 3
                          ? 'text-emerald-600'
                          : strengthScore === 2
                          ? 'text-amber-600'
                          : strengthScore === 1
                          ? 'text-rose-500'
                          : 'text-secondary'
                      }`}
                    >
                      {getStrengthLabel()}
                    </span>
                  </div>
                  {/* 3 Bars */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div
                      className={`h-1.5 rounded-full transition-colors duration-300 ${
                        strengthScore >= 1 ? 'bg-primary' : 'bg-surface-container-high'
                      }`}
                    />
                    <div
                      className={`h-1.5 rounded-full transition-colors duration-300 ${
                        strengthScore >= 2 ? 'bg-primary' : 'bg-surface-container-high'
                      }`}
                    />
                    <div
                      className={`h-1.5 rounded-full transition-colors duration-300 ${
                        strengthScore === 3 ? 'bg-emerald-500' : 'bg-surface-container-high'
                      }`}
                    />
                  </div>
                  {/* Security Checklist */}
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-on-surface-variant">
                    <div className="flex items-center gap-1">
                      <span
                        className={`material-symbols-outlined text-sm ${
                          hasLength ? 'text-emerald-600 font-bold' : 'text-secondary'
                        }`}
                      >
                        {hasLength ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>8+ Chars</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`material-symbols-outlined text-sm ${
                          hasNumber ? 'text-emerald-600 font-bold' : 'text-secondary'
                        }`}
                      >
                        {hasNumber ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>1+ Number</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`material-symbols-outlined text-sm ${
                          hasSpecial ? 'text-emerald-600 font-bold' : 'text-secondary'
                        }`}
                      >
                        {hasSpecial ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>1+ Symbol</span>
                    </div>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3 pt-1">
                  <label className="flex items-start gap-3 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 mt-0.5 rounded-lg flex items-center justify-center transition-all ${
                        agreedToTerms ? 'bg-primary text-white' : 'bg-surface neo-pressed-sm text-transparent'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base font-bold">check</span>
                    </div>
                    <span className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                      I agree to the{' '}
                      <span className="text-primary font-semibold hover:underline">Library Patron Agreement</span> and{' '}
                      <span className="text-primary font-semibold hover:underline">Privacy Terms</span>.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={receiveDigests}
                      onChange={(e) => setReceiveDigests(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 mt-0.5 rounded-lg flex items-center justify-center transition-all ${
                        receiveDigests ? 'bg-primary text-white' : 'bg-surface neo-pressed-sm text-transparent'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base font-bold">check</span>
                    </div>
                    <span className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                      Receive monthly curated reading digests and author event invites (optional).
                    </span>
                  </label>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={loading}
                    icon="auto_stories"
                  >
                    Issue Digital Library Card
                  </Button>
                </div>
              </form>
            </div>

            {/* Footer Redirect */}
            <div className="pt-6 mt-6 flex items-center justify-center">
              <p className="text-sm text-on-surface-variant">
                Already have a BookSphere pass?{' '}
                <Link to="/login" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
                  Sign in here <span className="material-symbols-outlined text-base leading-none">arrow_forward</span>
                </Link>
              </p>
            </div>
          </div>

          {/* Right Column: Editorial Benefits Showcase Panel */}
          <div
            className="lg:col-span-5 relative rounded-2xl bg-slate-900 text-white p-7 sm:p-9 flex flex-col justify-between overflow-hidden"
            style={{
              background: 'radial-gradient(130% 120% at 85% 15%, #312e81 0%, #1e1b4b 60%, #0f0d2b 100%)',
              boxShadow: '8px 8px 20px rgba(0,0,0,0.15)',
            }}
          >
            {/* Glowing Ambient Highlights */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Tag & Metric Badge */}
              <div className="flex items-center justify-between mb-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-indigo-300 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                  Free Universal Patron Access
                </span>
                <div className="flex items-center gap-1 text-xs text-indigo-200 font-medium">
                  <span className="material-symbols-outlined text-sm">groups</span>
                  <span>120k+ Members</span>
                </div>
              </div>

              {/* Editorial Headline */}
              <h2 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight text-white leading-snug mb-8">
                Unlock the World's Finest Digital Collection
              </h2>

              {/* Privileges Stack */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex-shrink-0 flex items-center justify-center text-indigo-300 shadow-sm">
                    <span className="material-symbols-outlined text-2xl">library_books</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Borrow up to 10 titles simultaneously</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Monographs, academic papers, and curated fiction delivered directly to your reader.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex-shrink-0 flex items-center justify-center text-indigo-300 shadow-sm">
                    <span className="material-symbols-outlined text-2xl">insights</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Personalized reading analytics &amp; AI taste sync</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Continuous reading velocity stats, favorite genres, and cross-device bookmark synchronization.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex-shrink-0 flex items-center justify-center text-indigo-300 shadow-sm">
                    <span className="material-symbols-outlined text-2xl">forum</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Author discussions &amp; reading circles</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Curated literary salon sessions and community book clubs across 40+ interest groups.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial Card */}
            <div className="relative z-10 mt-10 pt-6 border-t border-white/10">
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-1 text-amber-400 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-200 italic leading-relaxed">
                  “The fastest registration and cleanest catalog experience of any academic library I have used.”
                </p>
                <div className="mt-2 text-[10px] text-indigo-300 font-semibold uppercase tracking-wider">
                  Dr. Aris Thorne — Stanford Humanities
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
