// Not found page - 404
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        404
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Page not found
      </p>
      <Link
        to="/"
        className="btn-primary"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
