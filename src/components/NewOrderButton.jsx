import { useNavigate, useLocation } from 'react-router-dom';

const NewOrderButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on new order page
  if (location.pathname === '/new-order') {
    return null;
  }

  return (
    <button
      onClick={() => navigate('/new-order')}
      className="fixed right-4 bottom-24 w-16 h-16 bg-primary-600 rounded-full shadow-lg flex items-center justify-center z-30 active:scale-95 transition-transform"
      aria-label="Add new order"
    >
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  );
};

export default NewOrderButton;
