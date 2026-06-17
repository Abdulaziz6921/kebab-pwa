// Order details page - placeholder
// Will show detailed view of a single order

import { useParams } from 'react-router-dom';

const OrderDetails = () => {
  const { orderId } = useParams();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Order Details
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Order ID: {orderId || 'Not specified'}
      </p>
    </div>
  );
};

export default OrderDetails;
