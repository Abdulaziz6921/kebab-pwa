import { Outlet } from "react-router-dom";
import { BottomNav, SyncIndicator } from "./components";
import { useAuth } from "./contexts/AuthContext"; // AuthProvider importi olib tashlandi
import AuthPage from "./pages/AuthPage";

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

function App() {
  return <ProjectLayout />;
}

export default App;
