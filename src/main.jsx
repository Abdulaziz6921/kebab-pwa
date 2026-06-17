import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import {
  ThemeProvider,
  OrderProvider,
  OfflineProvider,
  CustomerProvider,
  SettingsProvider,
  ToastProvider,
} from "./contexts";
import { router } from "./router";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

// Service Worker-ni avtomatik ro'yxatdan o'tkazish
registerSW({ immediate: true });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <OfflineProvider>
        <SettingsProvider>
          <CustomerProvider>
            <OrderProvider>
              <ToastProvider>
                <RouterProvider router={router} />
              </ToastProvider>
            </OrderProvider>
          </CustomerProvider>
        </SettingsProvider>
      </OfflineProvider>
    </ThemeProvider>
  </StrictMode>,
);
