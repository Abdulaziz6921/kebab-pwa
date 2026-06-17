import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  useTheme,
  useOffline,
  useCustomers,
  useSettings,
  useToast,
  useAuth,
} from "../contexts";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { LOC_TYPE, PRESET_LOCATIONS } from "../utils/locations";
import { KEBAB_TYPES } from "../contexts/SettingsContext";
import {
  User,
  ChevronDown,
  ChevronRight,
  Check,
  Sun,
  Moon,
  Monitor,
  RefreshCw,
  Trash2,
  Download,
  X,
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
} from "lucide-react";

// ─── Icons ────────────────────────────────────────────────────────────────────

const ChevronToggle = ({ open }) => {
  return (
    <ChevronDown
      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      strokeWidth={2.5}
    />
  );
};

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3.5 flex items-center justify-between active:bg-gray-50 dark:active:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-bold text-navy-900 dark:text-white text-sm">
            {title}
          </span>
        </div>
        <ChevronToggle open={open} />
      </button>
      {open && (
        <div className="animate-fade-in border-t border-gray-100 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Editable price row ───────────────────────────────────────────────────────
function PriceRow({ id, label, value, onChange }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      <span className="text-sm font-medium text-navy-800 dark:text-gray-200">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(id, parseInt(e.target.value) || 0)}
          className="w-24 text-right bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5 text-sm font-bold text-navy-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-400"
        />
        <span className="text-xs text-gray-400 w-8">so'm</span>
      </div>
    </div>
  );
}

// ─── Theme selector row ────────────────────────────────────────────────────────
function ThemeRow({ icon, label, value, current, onSelect }) {
  const isActive = current === value;
  return (
    <button
      onClick={() => onSelect(value)}
      className={`w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors ${
        isActive
          ? "bg-primary-50 dark:bg-primary-900/20"
          : "active:bg-gray-50 dark:active:bg-gray-700"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isActive
              ? "bg-primary-500 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
          }`}
        >
          {icon}
        </div>
        <span
          className={`text-sm font-medium ${isActive ? "text-primary-700 dark:text-primary-300" : "text-navy-800 dark:text-gray-200"}`}
        >
          {label}
        </span>
      </div>
      {isActive && (
        <div className="text-primary-500">
          <Check />
        </div>
      )}
    </button>
  );
}

// ─── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value, valueColor }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`text-sm font-semibold ${valueColor || "text-navy-800 dark:text-white"}`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── PWA status badge ──────────────────────────────────────────────────────────
function PwaBadge({ ok, label }) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
        ok ? "bg-success-100 text-success-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full ${ok ? "bg-success-500" : "bg-gray-300"}`}
      />
      {label}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const Settings = () => {
  const navigate = useNavigate();

  const { theme, setTheme, resolvedTheme } = useTheme();
  const {
    isOnline,
    pendingSyncCount,
    lastSyncTime,
    syncInProgress,
    triggerSync,
    isConfigured,
  } = useOffline();
  const { customers } = useCustomers();
  const {
    kebabPrices,
    setKebabPrices,
    loading: settingsLoading,
  } = useSettings();
  const { success, error, confirm, prompt } = useToast();

  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [modalError, setModalError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [prices, setPrices] = useState(() => ({ ...kebabPrices }));
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setPrices(kebabPrices);
  }, [kebabPrices]);

  const handlePriceChange = useCallback((id, val) => {
    setPrices((p) => ({
      ...p,
      [id]: val,
    }));
  }, []);

  const handleSavePrices = async () => {
    try {
      await setKebabPrices(prices);
      success("Narxlar saqlandi");
    } catch (err) {
      error("Xatolik: " + err.message);
    }
  };

  const isDirty = JSON.stringify(prices) !== JSON.stringify(kebabPrices);

  const handleResetPrices = () => {
    const defaults = { qiyma: 15000, mol: 20000, quy: 25000 };
    setPrices(defaults);
    setKebabPrices(defaults);
    success("Narxlar tiklandi");
  };

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await triggerSync();

      if (result && result.success === false) {
        if (result.reason === "offline") {
          error("Sinxronizatsiya imkonsiz: Internet yo'q");
        } else if (result.reason === "syncing") {
          error("Sinxronizatsiya allaqachon bajarilmoqda");
        } else {
          error("Sinxronizatsiya xatosi: " + (result.error || "Noma'lum xato"));
        }
        return;
      }

      success("Sinxronizatsiya tugadi");
    } catch (err) {
      // Kutilmagan texnik xatoliklar uchun
      error("Sinxronizatsiya xatosi: " + err.message);
    } finally {
      setSyncing(false);
    }
  }, [triggerSync, success, error]);

  // PWA detection
  const [isStandalone, setIsStandalone] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone,
    );
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => setSwRegistered(!!reg));
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setCanInstall(true);
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setCanInstall(false);
      setIsStandalone(true);
      success("Ilova o'rnatildi");
    }
    setInstallPrompt(null);
  };

  // 1. Parol muvaffaqiyatli tekshirilgandan keyin ishlaydigan yakuniy o'chirish mantiqi
  const executeDataDeletion = async () => {
    // Sizning amaldagi tasdiqlash modalingiz
    const confirmed = await confirm(
      "Ma'lumotlarni o'chirish",
      "Barcha mahalliy ma'lumotlar o'chadi. Bu amalni qaytarib bo'lmaydi.",
    );
    if (!confirmed) return;

    indexedDB.deleteDatabase("restaurant-order-tracker");
    localStorage.clear();
    success("Ma'lumotlar o'chirildi");
    setTimeout(() => window.location.reload(), 1000);
  };

  // 2. "Barcha mahalliy ma'lumotlarni o'chirish" tugmasi bosilganda birinchi bo'lib shu ishlaydi
  const handleClearAllData = () => {
    setModalError("");
    setConfirmPassword("");
    setIsModalOpen(true); // Parol so'raydigan yangi modalni ochish
  };

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setModalError("");

    if (!confirmPassword) {
      setModalError("Parolni kiritish majburiy");
      return;
    }

    setIsVerifying(true);
    try {
      // To'g'ridan-to'g'ri 'firebase/auth' kutubxonasidan olingan metodlar orqali tekshirish
      const credential = EmailAuthProvider.credential(
        user.email,
        confirmPassword,
      );
      await reauthenticateWithCredential(user, credential);

      // Parol to'g'ri bo'lsa: modalni yopamiz va yakuniy tasdiqlash oynasini chiqaramiz
      setIsModalOpen(false);
      setConfirmPassword("");
      await executeDataDeletion(); // Yuqoridagi o'chirish funksiyasini chaqirish
    } catch (err) {
      console.error(err);
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setModalError("Kiritilgan parol noto'g'ri!");
      } else {
        setModalError("Xavfsizlikni tekshirishda xatolik yuz berdi.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const formatLastSync = lastSyncTime
    ? new Intl.DateTimeFormat("uz-UZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(lastSyncTime))
    : "Hech qachon";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-20">
      <header className="bg-white dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
        <div className="px-4 pt-4 pb-3">
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
            Sozlamalar
          </h1>
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">
        <Section
          title="Shashlik narxlari"
          icon={<span className="text-lg">{"\uD83C\uDF56"}</span>}
          defaultOpen
        >
          {settingsLoading ? (
            <div className="px-4 py-6 text-center text-gray-400">
              Yuklanmoqda...
            </div>
          ) : (
            <>
              <div>
                {KEBAB_TYPES.map((k) => (
                  <PriceRow
                    key={k.id}
                    id={k.id}
                    label={k.name}
                    value={prices[k.id] || 0}
                    onChange={handlePriceChange}
                  />
                ))}
              </div>
              <div className="px-4 py-3 flex gap-2">
                <button
                  onClick={handleSavePrices}
                  disabled={!isDirty}
                  className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold transition-all ${
                    isDirty
                      ? "bg-primary-500 hover:bg-primary-600 text-white shadow-sm shadow-primary-500/20"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-not-allowed opacity-50"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  Saqlash
                </button>

                <button
                  onClick={handleResetPrices}
                  className="flex items-center gap-2 py-2 px-4 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300"
                >
                  <RefreshCw /> Tiklash
                </button>
              </div>
            </>
          )}
        </Section>

        <div
          onClick={() => navigate("/customers")}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm px-4 py-4 flex items-center justify-between cursor-pointer active:bg-gray-50 dark:active:bg-gray-700"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy-100 dark:bg-navy-900/30 flex items-center justify-center text-navy-600 dark:text-navy-300">
              <User />
            </div>
            <div>
              <p className="font-bold text-navy-900 dark:text-white">
                Mijozlar
              </p>
              <p className="text-xs text-gray-400">
                {customers.length} ta mijoz
              </p>
            </div>
          </div>
          <ChevronRight />
        </div>

        <Section
          title="Ko'rinish"
          icon={
            resolvedTheme === "dark" ? (
              <span className="text-navy-400">
                <Moon />
              </span>
            ) : (
              <span className="text-orange-500">
                <Sun />
              </span>
            )
          }
        >
          <div>
            <ThemeRow
              icon={<Sun />}
              label="Oq"
              value="light"
              current={theme}
              onSelect={setTheme}
            />
            <ThemeRow
              icon={<Moon />}
              label="Qorong'i"
              value="dark"
              current={theme}
              onSelect={setTheme}
            />
            <ThemeRow
              icon={<Monitor />}
              label="Tizim"
              value="system"
              current={theme}
              onSelect={setTheme}
            />
          </div>
        </Section>

        <Section
          title="Zaxira va sinxronizatsiya"
          icon={
            <span
              className={
                syncInProgress || syncing
                  ? "text-primary-500 animate-spin"
                  : "text-gray-500"
              }
            >
              <RefreshCw
                className={`w-4 h-4 ${syncInProgress || syncing ? "animate-spin" : ""}`}
              />
            </span>
          }
          defaultOpen
        >
          <div>
            <InfoRow
              label="Internet"
              value={isOnline ? "Online" : "Offlayn"}
              valueColor={isOnline ? "text-success-600" : "text-error-600"}
            />
            <InfoRow
              label="Firebase"
              value={isConfigured ? "Sozlangan" : "Sozlanmagan"}
              valueColor={
                isConfigured ? "text-success-600" : "text-warning-600"
              }
            />
            <InfoRow label="Oxirgi sinx" value={formatLastSync} />
            <InfoRow
              label="Kutilmoqda"
              value={
                syncInProgress ? "Sinxronizatsiya..." : `${pendingSyncCount} ta`
              }
              valueColor={
                pendingSyncCount > 0 && !syncInProgress
                  ? "text-primary-600"
                  : undefined
              }
            />
          </div>
          <div className="px-4 py-3">
            <button
              onClick={handleSync}
              // Kutilayotgan buyurtmalar 0 ta bo'lsa ham tugma o'chadigan qilindi
              disabled={
                !isOnline ||
                syncInProgress ||
                syncing ||
                !isConfigured ||
                pendingSyncCount === 0
              }
              className="w-full flex items-center justify-center gap-2 py-3 bg-navy-800 text-white rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <RefreshCw
                className={`w-4 h-4 ${syncInProgress || syncing ? "animate-spin" : ""}`}
              />
              {syncInProgress || syncing ? "Sinxronizatsiya..." : "Hozir sinx"}
            </button>
          </div>
        </Section>

        <Section
          title="PWA holati"
          icon={
            <span className="text-primary-500">
              <Download />
            </span>
          }
        >
          <div className="px-4 py-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <PwaBadge ok={isStandalone} label="O'rnatilgan" />
              <PwaBadge ok={swRegistered} label="Service Worker" />
              <PwaBadge ok={true} label="Offline qo'llab-quvvatlash" />
              <PwaBadge ok={true} label="Splash Screen" />
              <PwaBadge ok={true} label="App Icons" />
              <PwaBadge ok={isConfigured} label="Background Sync" />
            </div>
            {canInstall && (
              <button
                onClick={handleInstall}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-500 text-white rounded-xl font-bold"
              >
                <Download /> Ilovani o'rnatish
              </button>
            )}
          </div>
        </Section>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-error-200 dark:border-error-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-error-200 dark:border-error-900">
            <h3 className="font-bold text-error-600 text-sm">Xavfli zona</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Bu amallarni qaytarib bo'lmaydi
            </p>
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
              <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-error-500" />
                    Xavfsizlik tekshiruvi
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                  Ushbu amalni bajarish uchun tizim parolingizni kiritib
                  shaxsingizni tasdiqlashingiz shart.
                </p>

                {modalError && (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs mb-4">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyPassword} className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Admin parolini kiriting"
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-navy-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-semibold"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="flex-1 py-2.5 bg-error-500 hover:bg-error-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
                    >
                      {isVerifying ? "Tekshirilmoqda..." : "Tasdiqlash"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="px-4 py-3">
            <button
              onClick={handleClearAllData}
              className="w-full py-3 bg-error-100 dark:bg-error-900/20 text-error-600 rounded-xl font-semibold text-sm"
            >
              Barcha mahalliy ma'lumotlarni o'chirish
            </button>
          </div>
        </div>

        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            Restaurant Order Tracker v1.0.0
          </p>
          <p className="text-xs text-gray-400 mt-1">Offline-first PWA</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
