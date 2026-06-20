import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import {
  Orders,
  NewOrder,
  History,
  Statistics,
  Settings,
  Customers,
  NotFound,
} from "./pages";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Orders />,
      },
      {
        path: "orders",
        element: <Orders />,
      },
      {
        path: "new-order",
        element: <NewOrder />,
      },
      {
        path: "edit-order/:id",
        element: <NewOrder />,
      },
      {
        path: "history",
        element: <History />,
      },
      {
        path: "statistics",
        element: <Statistics />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "customers",
        element: <Customers />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

export default router;
