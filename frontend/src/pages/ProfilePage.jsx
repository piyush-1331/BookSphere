import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile, updateProfile, clearUserMessages } from '../store/slices/userSlice';
import Sidebar from '../components/common/Sidebar';
import Button from '../components/common/Button';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

const AVAILABLE_GENRES = [
  'Fiction',
  'Non-Fiction',
  'Science Fiction',
  'Fantasy',
  'Mystery',
  'Thriller',
  'Romance',
  'Historical Fiction',
  'Biography',
  'Computer Science',
  'Philosophy',
  'Psychology',
  'Science',
];

export const ProfilePage = () => {
  const dispatch = useDispatch();
  const { profile, stats, loading, updateLoading, error, successMessage } = useSelector(
    (state) => state.user
  );
  const { user: authUser } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    libraryBranch: '',
    favoriteGenres: [],
    favoriteAuthors: '',
  });

  const [prevProfile, setPrevProfile] = useState(null);
  const [prevAuthUser, setPrevAuthUser] = useState(null);

  if (profile !== prevProfile || authUser !== prevAuthUser) {
    setPrevProfile(profile);
    setPrevAuthUser(authUser);
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        libraryBranch: profile.libraryBranch || '',
        favoriteGenres: profile.preferences?.favorite_genres || [],
        favoriteAuthors: (profile.preferences?.favorite_authors || []).join(', '),
      });
    } else if (authUser) {
      setFormData({
        name: authUser.name || '',
        email: authUser.email || '',
        phone: authUser.phone || '',
        libraryBranch: authUser.libraryBranch || '',
        favoriteGenres: authUser.preferences?.favorite_genres || [],
        favoriteAuthors: (authUser.preferences?.favorite_authors || []).join(', '),
      });
    }
  }

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  const handleGenreToggle = (genre) => {
    setFormData((prev) => {
      const exists = prev.favoriteGenres.includes(genre);
      return {
        ...prev,
        favoriteGenres: exists
          ? prev.favoriteGenres.filter((g) => g !== genre)
          : [...prev.favoriteGenres, genre],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearUserMessages());

    const authorsList = formData.favoriteAuthors
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const payload = {
      name: formData.name,
      phone: formData.phone,
      libraryBranch: formData.libraryBranch,
      preferences: {
        favorite_genres: formData.favoriteGenres,
        favorite_authors: authorsList,
      },
    };

    dispatch(updateProfile(payload));
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 pb-16">
      <Sidebar mode="patron" />

      <main className="flex-1 space-y-8 min-w-0">
        {/* Top Identity Card: Neomorphic Extruded Slab */}
        <div className="relative w-full rounded-2xl bg-surface p-6 sm:p-8 lg:p-10 neo-raised">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            {/* Patron Bio Segment */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-1 bg-surface neo-raised flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full rounded-xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold font-headline">
                    {(profile?.name || authUser?.name || 'P').charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-lg bg-surface neo-raised-sm text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-on-surface">
                    Patron
                  </span>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-headline font-semibold text-on-surface tracking-tight m-0">
                    {profile?.name || authUser?.name || 'Reader'}
                  </h1>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold text-primary bg-surface neo-pressed-sm">
                    Card: {profile?.profile?.cardId || authUser?.profile?.cardId || 'BKSP-ACTIVE'}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant font-medium mt-1">
                  Patron Member • Home: {formData.libraryBranch || 'Metropolitan Central Flagship'}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-on-surface-variant">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface neo-pressed-sm text-secondary">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Good Standing
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface neo-pressed-sm text-secondary">
                    <span className="material-symbols-outlined text-[14px] text-primary">credit_card_off</span>
                    Zero Overdue Fees
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface neo-pressed-sm text-secondary">
                    <span className="material-symbols-outlined text-[14px] text-tertiary">star</span>
                    Tier: 10 Borrow Cap
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Passport ID Box */}
            <div className="p-4 rounded-xl bg-surface neo-pressed flex items-center gap-3 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-2xl">qr_code_2</span>
              <div>
                <p className="font-semibold text-on-surface">Digital Kiosk Barcode</p>
                <p className="text-[11px] font-mono text-outline">
                  {profile?.libraryCardId || profile?._id?.slice(-8).toUpperCase() || 'BKSP-ONLINE'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-surface-container-high">
            <div className="p-4 rounded-xl bg-surface neo-pressed flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-surface neo-raised-sm flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[22px]">book_online</span>
              </div>
              <div>
                <div className="text-xl font-headline font-semibold text-on-surface">
                  {stats?.activeBorrows ?? profile?.activeBorrowsCount ?? 0}
                </div>
                <div className="text-xs text-on-surface-variant font-medium">Active Loans</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface neo-pressed flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-surface neo-raised-sm flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[22px]">history_edu</span>
              </div>
              <div>
                <div className="text-xl font-headline font-semibold text-on-surface">
                  {stats?.totalBorrows ?? profile?.totalBorrowsCount ?? 0}
                </div>
                <div className="text-xs text-on-surface-variant font-medium">Total Borrows</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface neo-pressed flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-surface neo-raised-sm flex items-center justify-center text-amber-500">
                <span className="material-symbols-outlined text-[22px]">local_fire_department</span>
              </div>
              <div>
                <div className="text-xl font-headline font-semibold text-on-surface">18 Days</div>
                <div className="text-xs text-on-surface-variant font-medium">Reading Streak</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface neo-pressed flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-surface neo-raised-sm flex items-center justify-center text-rose-500">
                <span className="material-symbols-outlined text-[22px]">bookmark_heart</span>
              </div>
              <div>
                <div className="text-xl font-headline font-semibold text-on-surface">Active</div>
                <div className="text-xs text-on-surface-variant font-medium">Favorites Sync</div>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-rose-600">error</span>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {loading ? (
          <LoadingSkeleton variant="detail" />
        ) : (
          <div className="p-6 sm:p-8 rounded-2xl bg-surface neo-raised space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
                  <div>
                    <h2 className="text-lg font-headline font-semibold text-on-surface m-0">
                      Patron Profile Record
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Contact details associated with interlibrary loans and circulation notices.
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-surface neo-pressed-sm flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px]">edit_note</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1.5">
                      Legal Patron Name
                    </label>
                    <div className="px-4 py-3 rounded-xl bg-surface neo-pressed-input flex items-center gap-3">
                      <span className="material-symbols-outlined text-outline text-[18px]">person</span>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-transparent border-0 outline-none w-full text-sm font-medium text-on-surface"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1.5">
                      Institutional Email
                    </label>
                    <div className="px-4 py-3 rounded-xl bg-surface neo-pressed-input flex items-center gap-3 opacity-75">
                      <span className="material-symbols-outlined text-outline text-[18px]">mail</span>
                      <input
                        type="email"
                        disabled
                        value={formData.email}
                        className="bg-transparent border-0 outline-none w-full text-sm font-medium text-on-surface cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1.5">
                      Phone Number
                    </label>
                    <div className="px-4 py-3 rounded-xl bg-surface neo-pressed-input flex items-center gap-3">
                      <span className="material-symbols-outlined text-outline text-[18px]">phone</span>
                      <input
                        type="text"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-transparent border-0 outline-none w-full text-sm font-medium text-on-surface"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1.5">
                      Designated Home Branch
                    </label>
                    <div className="px-4 py-3 rounded-xl bg-surface neo-pressed-input flex items-center gap-3">
                      <span className="material-symbols-outlined text-outline text-[18px]">local_library</span>
                      <input
                        type="text"
                        placeholder="e.g. Central Metropolitan Flagship"
                        value={formData.libraryBranch}
                        onChange={(e) => setFormData({ ...formData, libraryBranch: e.target.value })}
                        className="bg-transparent border-0 outline-none w-full text-sm font-medium text-on-surface"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Reading Preferences */}
              <div className="space-y-4 pt-4 border-t border-surface-container-high">
                <div>
                  <h2 className="text-lg font-headline font-semibold text-on-surface m-0">
                    AI Reading Taste &amp; Synapse Preferences
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Select your preferred literary genres and favorite authors to guide algorithmic recommendations.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-2.5">
                    Preferred Literary Genres
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_GENRES.map((genre) => {
                      const selected = formData.favoriteGenres.includes(genre);
                      return (
                        <button
                          type="button"
                          key={genre}
                          onClick={() => handleGenreToggle(genre)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            selected
                              ? 'bg-surface text-primary neo-pressed-sm'
                              : 'bg-surface text-on-surface-variant hover:text-on-surface neo-raised-sm'
                          }`}
                        >
                          {selected && '✓ '}
                          {genre}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-on-surface uppercase tracking-wider block mb-1.5">
                    Favorite Authors
                  </label>
                  <div className="px-4 py-3 rounded-xl bg-surface neo-pressed-input flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline text-[18px]">history_edu</span>
                    <input
                      type="text"
                      placeholder="e.g. Frank Herbert, Jane Austen, Isaac Asimov (comma separated)"
                      value={formData.favoriteAuthors}
                      onChange={(e) => setFormData({ ...formData, favoriteAuthors: e.target.value })}
                      className="bg-transparent border-0 outline-none w-full text-sm font-medium text-on-surface"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-surface-container-high">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon="save"
                  loading={updateLoading}
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfilePage;
