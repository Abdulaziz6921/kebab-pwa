import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers, useToast } from '../contexts';

// ─── Icons ────────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const StarIcon = ({ filled }) => (
  <svg className={`w-5 h-5 ${filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
    viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" d="M12 5v14m-7-7h14" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4z" />
  </svg>
);

// ─── Add Customer Modal ───────────────────────────────────────────────────────
function AddModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onAdd(name.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 w-full rounded-t-3xl p-5 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />

        <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-4">Yangi mijoz</h3>

        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Mijoz ismi..."
          className="w-full bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-3 text-navy-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-400 mb-4"
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-semibold"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || loading}
            className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-bold disabled:opacity-50"
          >
            {loading ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
const Customers = () => {
  const navigate = useNavigate();
  const { customers, toggleFavorite, deleteCustomer, addCustomer } = useCustomers();
  const { success, error, confirm } = useToast();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(q));
  }, [customers, search]);

  const favorites = filtered.filter(c => c.is_favorite);
  const others    = filtered.filter(c => !c.is_favorite);

  const handleAddCustomer = async (name) => {
    try {
      await addCustomer(name);
      success("Mijoz qo'shildi");
    } catch (err) {
      error("Xatolik: " + err.message);
    }
  };

  const handleDeleteCustomer = async (id) => {
    const confirmed = await confirm("Mijozni o'chirish", "Bu amalni qaytarib bo'lmaydi.");
    if (!confirmed) return;

    setDeleting(id);
    try {
      await deleteCustomer(id);
      success("Mijoz o'chirildi");
    } catch (err) {
      error("Xatolik: " + err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 active:scale-95"
            >
              <ArrowLeftIcon />
            </button>
            <h1 className="text-xl font-bold text-navy-900 dark:text-white flex-1">Mijozlar</h1>
            <button
              onClick={() => setShowModal(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-500 text-white active:scale-95"
            >
              <PlusIcon />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="w-full bg-gray-100 dark:bg-gray-700 rounded-xl pl-10 pr-10 py-2.5 text-navy-900 dark:text-white outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <XIcon />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* List */}
      <div className="px-4 py-4 space-y-3">
        {/* Favorites Section */}
        {favorites.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2 px-1">Sevimli</p>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
              {favorites.map(c => (
                <CustomerRow key={c.id} customer={c} onFavorite={toggleFavorite} onDelete={handleDeleteCustomer} deleting={deleting} />
              ))}
            </div>
          </div>
        )}

        {/* Others Section */}
        {others.length > 0 && (
          <div>
            {favorites.length > 0 && (
              <p className="text-xs font-semibold text-gray-400 mb-2 px-1">Boshqalar</p>
            )}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
              {others.map(c => (
                <CustomerRow key={c.id} customer={c} onFavorite={toggleFavorite} onDelete={handleDeleteCustomer} deleting={deleting} />
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4 text-gray-400">
              <UserIcon />
            </div>
            <p className="text-gray-400">
              {search ? 'Topilmadi' : "Hali mijozlar yo'q"}
            </p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <AddModal onClose={() => setShowModal(false)} onAdd={handleAddCustomer} />
      )}
    </div>
  );
};

// ─── Customer Row ─────────────────────────────────────────────────────────────
function CustomerRow({ customer, onFavorite, onDelete, deleting }) {
  const initials = customer.name
    .split(' ')
    .slice(0, 2)
    .map(s => s[0])
    .join('')
    .toUpperCase();

  const isDeleting = deleting === customer.id;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-10 h-10 rounded-xl bg-navy-100 dark:bg-navy-900/30 flex items-center justify-center text-navy-600 dark:text-navy-300 font-bold text-sm">
        {initials || 'M'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-navy-900 dark:text-white truncate">{customer.name}</p>
      </div>

      {/* Favorite */}
      <button onClick={() => onFavorite(customer.id)} className="w-9 h-9 flex items-center justify-center rounded-lg active:scale-95 transition-transform">
        <StarIcon filled={customer.is_favorite} />
      </button>

      {/* Delete */}
      <button
        onClick={() => onDelete(customer.id)}
        disabled={isDeleting}
        className="w-9 h-9 flex items-center justify-center rounded-lg active:scale-95 transition-all text-gray-400 hover:text-error-500 disabled:opacity-50"
      >
        {isDeleting ? (
          <div className="w-4 h-4 border-2 border-error-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default Customers;
