import { useEffect, useState } from "react";
import { useAuth } from "../contexts";
import {
  LogIn,
  Mail,
  Lock,
  AlertCircle,
  EyeOff,
  Eye,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const { login } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [firebaseError, setFirebaseError] = useState("");
  const navigate = useNavigate();

  const validateForm = () => {
    const tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) tempErrors.email = "Email kiritish majburiy";
    else if (!emailRegex.test(email))
      tempErrors.email = "Email formati noto'g'ri";

    if (!password) tempErrors.password = "Parol kiritish majburiy";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFirebaseError("");

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await login(email, password);

      navigate("/orders");
    } catch (err) {
      console.error(err.code);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setFirebaseError("Email yoki parol noto'g'ri. Kirish taqiqlangan.");
      } else {
        setFirebaseError(
          "Tizimga ulanishda xatolik yuz berdi. Internetni tekshiring.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-xs text-gray-400 mt-2">Tizim yuklanmoqda...</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 select-none">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-center text-navy-900 dark:text-white mb-2">
          Tizimga kirish
        </h2>
        <p className="text-sm text-center text-gray-400 dark:text-gray-500 mb-6">
          <em>
            Faqat <b>Abdulaziz</b> kirish huquqiga ega. <br /> Agar siz admin
            bo'lmasangiz, iltimos tizimga kirishga urinmang.
          </em>
        </p>

        {firebaseError && (
          <div className="flex flex-col items-center text-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{firebaseError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border rounded-xl text-sm text-navy-900 dark:text-white outline-none transition-all
                  ${errors.email ? "border-red-500 focus:ring-2 focus:ring-red-400" : "border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-400"}`}
                placeholder="admin@mail.com"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Parol
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border rounded-xl text-sm text-navy-900 dark:text-white outline-none transition-all
        ${errors.password ? "border-red-500 focus:ring-2 focus:ring-red-400" : "border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-400"}`}
                placeholder="******"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" /> // Hide
                ) : (
                  <Eye className="w-4 h-4" /> // Show
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold shadow-md transition-colors mt-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Tekshirilmoqda...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Tizimga kirish
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
