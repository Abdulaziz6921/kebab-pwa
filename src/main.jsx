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
// 🌟 1. YANGI QO'SHILGAN IMPORT: AuthProvider ni shu yerga olib kelamiz
import { AuthProvider } from "./contexts/AuthContext";
import { router } from "./router";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* 🌟 2. TUZATISH: AuthProvider eng tepaga qo'yildi, endi useAuth() hamma yerda ishlaydi */}
    <AuthProvider>
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
    </AuthProvider>
  </StrictMode>,
);
