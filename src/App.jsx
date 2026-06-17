import { Outlet } from "react-router-dom";
import { BottomNav, SyncIndicator } from "./components";
import { AuthProvider, useAuth } from "./contexts/AuthContext"; // To'g'ri yo'lni yozing
import AuthPage from "./pages/AuthPage";

// 1. Himoya qatlamini alohida komponentga olamiz
function ProjectLayout() {
  const { user } = useAuth();

  // Agar foydalanuvchi tizimga kirmagan bo'lsa, faqat login sahifasi ko'rinadi
  if (!user) {
    return <AuthPage />;
  }

  // Faqat tizimga muvaffaqiyatli kirilgandagina butun loyiha ochiladi
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <SyncIndicator />
      <main className="pb-16">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

// 2. Asosiy App komponenti context provayder bilan o'raladi
function App() {
  return (
    <AuthProvider>
      <ProjectLayout />
    </AuthProvider>
  );
}

export default App;
