import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useOrders, useCustomers, useSettings, useToast } from "../contexts";
import { generateOrderNumber } from "../utils/helpers";
import { formatCurrency } from "../utils/formatters";
import { LOC_TYPE } from "../utils/locations";
import KebabSvg from "../assets/kebab.svg";
import {
  Plus,
  UserRound,
  House,
  DoorClosed,
  CircleDot,
  CircleQuestionMark,
  Star,
  X,
  Check,
  Trash2,
  Pencil,
  Search,
  Edit2,
} from "lucide-react";

// ─── Location button visual config ────────────────────────────────────────────
const LOC_CONFIG = {
  [LOC_TYPE.PARALLEL]: {
    bg: "bg-green-100",
    textColor: "text-green-700",
    selBg: "bg-green-600",
    selText: "text-white",
  },
  [LOC_TYPE.HASH]: {
    bg: "bg-orange-100",
    textColor: "text-orange-700",
    selBg: "bg-orange-500",
    selText: "text-white",
  },
  [LOC_TYPE.ORQASI]: {
    bg: "bg-gray-100",
    textColor: "text-gray-700",
    selBg: "bg-gray-600",
    selText: "text-white",
  },
  [LOC_TYPE.HOVLI]: {
    bg: "bg-green-100",
    textColor: "text-green-700",
    selBg: "bg-green-600",
    selText: "text-white",
  },
  [LOC_TYPE.XONA]: {
    bg: "bg-blue-100",
    textColor: "text-blue-700",
    selBg: "bg-blue-600",
    selText: "text-white",
  },
  [LOC_TYPE.CUSTOM]: {
    bg: "bg-purple-100",
    textColor: "text-purple-700",
    selBg: "bg-purple-600",
    selText: "text-white",
  },
};

function LocationIcon({ type, size = 18, active = false }) {
  const color = active ? "white" : undefined;
  switch (type) {
    case LOC_TYPE.ORQASI:
      return <CircleDot size={size} color={color || "#000000"} />;
    case LOC_TYPE.HOVLI:
      return <House size={size} color={color || "#15803d"} />;
    case LOC_TYPE.XONA:
      return <DoorClosed size={size} color={color || "#1d4ed8"} />;
  }
}

// ─── Add/Edit Customer Modal ──────────────────────────────────────────────────
function CustomerModal({ existing, onSave, onClose }) {
  const [name, setName] = useState(existing?.name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white dark:bg-gray-800 w-full rounded-t-3xl p-5 animate-slide-up">
        <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-4">
          {existing ? "Tahrirlash" : "Yangi mijoz"}
        </h3>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mijoz ismi..."
          className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-navy-900 dark:text-white text-lg outline-none focus:ring-2 focus:ring-primary-400 mb-4"
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) handleSave();
          }}
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-semibold text-gray-600 dark:text-gray-300"
            disabled={saving}
          >
            Bekor
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 py-3 bg-primary-500 rounded-xl font-semibold text-white disabled:opacity-40"
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "customers", label: "Mijozlar" },
  { id: "locations", label: "Joylar" },
  { id: "tavsif", label: "Noma'lum" },
];

const NewOrder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { createOrder, updateOrder, orders, loading } = useOrders();

  const {
    customers,
    addCustomer,
    updateCustomer,
    toggleFavorite,
    deleteCustomer,
  } = useCustomers();
  const { getKebabTypesWithPrices, allLocations } = useSettings();
  const { success, error, confirm } = useToast();

  const KEBAB_TYPES = getKebabTypesWithPrices();

  const [activeTab, setActiveTab] = useState("customers");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [tavsif, setTavsif] = useState("");
  const [addLocToTavsif, setAddLocToTavsif] = useState(false);
  const [tavsifLocation, setTavsifLocation] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");

  const [orderItems, setOrderItems] = useState([
    {
      kebab: KEBAB_TYPES[0],
      qty: 1,
    },
  ]);

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [obedSumma, setObedSumma] = useState("");
  const isMan = selectedCustomer?.name?.toLowerCase() === "man";

  const handleSaveObed = async () => {
    if (!obedSumma || isNaN(obedSumma)) {
      error("Iltimos, summani to'g'ri kiriting!");
      return;
    }

    try {
      await updateCustomer(selectedCustomer.id, {
        ...selectedCustomer,
        balance: (selectedCustomer.balance || 0) + Number(obedSumma), // Nasiyaga qarz bo'lib qo'shiladi
      });

      // Kassadagi umumiy summadan (TotalOrderAmount) ayirish logikasi:

      await createOrder({
        orderNumber: generateOrderNumber(),
        customerName: "Man (Obed)",
        customerId: selectedCustomer.id,
        totalPrice: -Number(obedSumma), // SUMMA MINUS BO'LADI
        items: [],
        createdAt: new Date().toISOString(),
      });

      success("Obed summasi savdo pulidan ayirildi va Nasiyaga yozildi!");
      setObedSumma("");
      setSelectedCustomer(null);
      navigate("/orders");
    } catch (err) {
      error("Xatolik yuz berdi!");
    }
  };
  // ──────────────────────────────────────────────────────────────────

  const [editingCustomer, setEditingCustomer] = useState(null);

  const [saved, setSaved] = useState(false);
  const [isDataRestored, setIsDataRestored] = useState(false);

  // 📝 Tahrirlash rejimi uchun eski ma'lumotlarni xavfsiz yuklash logikasi:
  useEffect(() => {
    if (!id || !orders || orders.length === 0 || isDataRestored) return;

    const orderToEdit = orders.find((o) => o.id === id);
    if (!orderToEdit) return;

    // 1. Agar mijoz bog'langan bo'lsa
    if (orderToEdit.customerId || orderToEdit.customerName) {
      setActiveTab("customers");
      setSelectedCustomer({
        id: orderToEdit.customerId,
        name: orderToEdit.customerName,
      });
    }
    // 2. Agar joylashuv (Location) tanlangan bo'lsa
    else if (orderToEdit.locationLabel) {
      setActiveTab("locations");
      setSelectedLocation({
        id: orderToEdit.locationId || "",
        label: orderToEdit.locationLabel,
        desc: orderToEdit.locationDesc,
        type: orderToEdit.locationType,
      });
    }
    // 3. Agar faqat tavsif (Noma'lum) yozilgan bo'lsa
    else if (orderToEdit.tavsif || orderToEdit.description) {
      setActiveTab("tavsif");
      setTavsif(orderToEdit.tavsif || orderToEdit.description);
    }

    // 4. Kabob mahsulotlarini qayta tiklash
    if (orderToEdit.items && orderToEdit.items.length > 0) {
      const restoredItems = orderToEdit.items.map((item) => {
        const kebabConfig = KEBAB_TYPES.find(
          (k) => k.id === item.kebabType || k.name === item.kebabName,
        );
        return {
          kebab: kebabConfig || {
            id: item.kebabType,
            name: item.kebabName,
            basePrice: item.unitPrice || item.price / item.quantity,
          },
          qty: item.quantity,
        };
      });
      setOrderItems(restoredItems);
    }

    setIsDataRestored(true);
  }, [id, orders, isDataRestored]);

  useEffect(() => {
    setIsDataRestored(false);
  }, [id]);

  const totalPrice = orderItems.reduce(
    (sum, item) => sum + item.qty * item.kebab.basePrice,
    0,
  );

  const activeLocation = addLocToTavsif ? tavsifLocation : selectedLocation;
  const hasSelection = selectedCustomer || activeLocation || tavsif.trim();

  const orderIdentifier = (() => {
    if (selectedCustomer) return selectedCustomer.name;
    if (activeLocation) {
      const desc = activeLocation.desc ? ` (${activeLocation.desc})` : "";
      return `${activeLocation.label}${desc}`;
    }
    if (tavsif.trim()) return tavsif.trim();
    return "";
  })();

  const handleSelectCustomer = useCallback(
    (c) => {
      setSelectedCustomer((prev) => {
        const isSelected = prev?.id === c.id;
        const nextSelection = isSelected ? null : c;

        //  Agar "Man" tanlansa, pastdagi shashlik ro'yxatini bo'shatamiz (ixtiyoriy rejim)
        if (nextSelection && nextSelection.name?.toLowerCase() === "man") {
          setOrderItems([]);
        } else {
          // Agar boshqa har qanday mijoz tanlansa yoki tanlov bekor qilinsa, standart 1 ta shashlikni qaytaramiz
          setOrderItems([{ kebab: KEBAB_TYPES[0], qty: 1 }]);
        }

        return nextSelection;
      });

      setSelectedLocation(null);
    },
    [KEBAB_TYPES],
  );

  const handleSelectLocation = useCallback((loc) => {
    setSelectedLocation((prev) => (prev?.id === loc.id ? null : loc));
    setSelectedCustomer(null);
  }, []);

  const handleQtyPreset = useCallback((n) => {
    setQty(n);
    setCustomQtyStr("");
  }, []);

  const addOrderItem = () => {
    setOrderItems((prev) => [
      ...prev,
      {
        kebab: KEBAB_TYPES[0],
        qty: 1,
      },
    ]);
  };

  const removeOrderItem = (index) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItemQty = (index, qty) => {
    setOrderItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, qty: Math.max(1, qty) } : item,
      ),
    );
  };

  const updateItemKebab = (index, kebab) => {
    setOrderItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, kebab } : item)),
    );
  };

  const handleAddCustomer = useCallback(
    async (name) => {
      try {
        const created = await addCustomer(name);
        setSelectedCustomer(created);
        setSelectedLocation(null);
        success("Mijoz qo'shildi");
      } catch (err) {
        error("Xatolik: " + err.message);
      } finally {
        setShowAddCustomer(false);
      }
    },
    [addCustomer, success, error],
  );

  const handleUpdateCustomer = useCallback(
    async (name) => {
      if (!editingCustomer) return;
      try {
        const updated = await updateCustomer(editingCustomer.id, { name });
        if (selectedCustomer?.id === editingCustomer.id) {
          setSelectedCustomer(updated);
        }
        success("Mijoz yangilandi");
      } catch (err) {
        error("Xatolik: " + err.message);
      } finally {
        setEditingCustomer(null);
      }
    },
    [editingCustomer, updateCustomer, selectedCustomer, success, error],
  );

  const handleDeleteCustomer = useCallback(
    async (id) => {
      const confirmed = await confirm(
        "Mijozni o'chirish",
        "Bu amalni qaytarib bo'lmaydi.",
      );
      if (!confirmed) return;

      try {
        await deleteCustomer(id);
        if (selectedCustomer?.id === id) setSelectedCustomer(null);
        success("Mijoz o'chirildi");
      } catch (err) {
        error("Xatolik: " + err.message);
      }
    },
    [deleteCustomer, selectedCustomer, confirm, success, error],
  );

  const handleSubmit = useCallback(async () => {
    if (isMan) {
      const obedAmount = Number(obedSumma) || 0;

      // Tanlangan kaboblar miqdori va umumiy narxi
      const kebabQty = orderItems.reduce(
        (sum, item) => sum + Number(item.qty),
        0,
      );

      //Agar shashlik tanlanmagan bo'lsa, uning narxi 0 so'm bo'ladi
      const kebabPrice = orderItems.reduce((sum, item) => {
        if (!item.kebab || !item.kebab.basePrice) return sum;
        return sum + Number(item.qty) * Number(item.kebab.basePrice || 0);
      }, 0);

      // Agar pul ham kiritilmagan, kabob ham tanlanmagan bo'lsa, unda ogohlantiramiz
      if (obedAmount === 0 && kebabQty === 0) {
        error("Iltimos, summani kiriting yoki shashlik tanlang!");
        return;
      }

      const orderTotal = kebabPrice + obedAmount;

      try {
        await createOrder({
          identifier: generateOrderNumber("ORD"),

          // ─── 🌟 DINAMIK DESCRIPTION LOGIKASI ───
          description: (() => {
            if (kebabQty > 0) {
              const kebabDetails = orderItems
                .map((item) => `${item.qty} ta ${item.kebab?.name || ""}`)
                .join(", ");

              // Agar qo'shimcha obed puli ham bo'lsa, uni ham yoniga qo'shadi
              return obedAmount > 0
                ? `Man (${kebabDetails} + ${obedAmount} so'm pul)`
                : `Man (${kebabDetails})`;
            }
            // Agar shashlik tanlanmay, faqat pul olingan bo'lsa
            return `Man (Obedga: ${obedAmount} so'm)`;
          })(),
          // ───────────────────────────────────────

          customerName: "Man",
          customerId: selectedCustomer.id,
          totalPrice: orderTotal,
          debtAmount: obedAmount,
          items:
            kebabQty > 0
              ? orderItems.map((item) => ({
                  kebabType: item.kebab?.id || "",
                  kebabName: item.kebab?.name || "",
                  quantity: Number(item.qty),
                  unitPrice: Number(item.kebab?.basePrice || 0),
                }))
              : [],

          //  Agar kabob sotilmagan bo'lsa, quantity mutloq 0 bo'ladi!
          quantity: kebabQty > 0 ? kebabQty : 0,

          paid: false,
          isDebt: true,
          isObed: true,
          createdAt: new Date().toISOString(),
        });

        success("Muvaffaqiyatli saqlandi!");
        setObedSumma("");
        setSelectedCustomer(null);
        setSaved(true);
        setTimeout(() => navigate("/orders"), 900);
      } catch (err) {
        error("Xatolik: " + err.message);
      }
      return;
    }

    // Man dan tashqari BOSHQA MIJOZLAR UCHUN ISHLAYDIGAN KOD
    const loc = addLocToTavsif ? tavsifLocation : selectedLocation;
    const hasTavsif = tavsif.trim().length > 0;

    if (!selectedCustomer && !loc && !hasTavsif) {
      error("Iltimos, mijoz, joy yoki noma'lum kishi tavsifini kiriting!");
      return;
    }
    const description = (() => {
      if (selectedCustomer) return selectedCustomer.name;
      if (loc) {
        return loc.desc ? `${loc.label} (${loc.desc})` : loc.label;
      }
      if (tavsif.trim()) return tavsif.trim();
      return "";
    })();

    // O'zgaradigan yangi ma'lumotlar
    const orderData = {
      description,
      customerName: selectedCustomer?.name || "",
      customerId: selectedCustomer?.id || "",
      locationType: loc?.type || "",
      locationId: loc?.id || "",
      locationLabel: loc?.label || "",
      locationDesc: loc?.desc || "",
      location: loc
        ? loc.desc
          ? `${loc.label} (${loc.desc})`
          : loc.label
        : "",
      tavsif: tavsif.trim(),
      items: orderItems.map((item) => ({
        kebabType: item.kebab.id || item.kebab.kebabType || "",
        kebabName: item.kebab.name || item.kebab.kebabName || "",
        quantity: Number(item.qty),
        unitPrice: Number(item.kebab.basePrice || item.kebab.unitPrice || 0),
      })),
      totalPrice: Number(totalPrice),
      quantity: orderItems.reduce((sum, item) => sum + Number(item.qty), 0),
    };

    try {
      if (id) {
        const originalOrder = orders.find((o) => o.id === id);
        const fullUpdates = {
          ...originalOrder,
          ...orderData,
          id: id,
          synced: false,
          updatedAt: Date.now(),
        };
        await updateOrder(id, fullUpdates);
        success("Buyurtma yangilandi");
      } else {
        await createOrder({
          ...orderData,
          identifier: generateOrderNumber("ORD"),
        });
        success("Buyurtma saqlandi");
      }

      setSaved(true);
      setTimeout(() => navigate("/orders"), 900);
    } catch (err) {
      error("Xatolik: " + err.message);
    }
  }, [
    id,
    orders,
    updateOrder,
    selectedCustomer,
    selectedLocation,
    tavsif,
    tavsifLocation,
    addLocToTavsif,
    orderItems,
    totalPrice,
    createOrder,
    navigate,
    success,
    error,
    isMan,
    obedSumma,
    updateCustomer,
  ]);

  if (saved) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <div className="w-24 h-24 bg-success-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
            <Check size={48} color="white" />
          </div>
          <h2 className="text-3xl font-bold text-navy-900 dark:text-white mb-1">
            Saqlandi!
          </h2>
        </div>
      </div>
    );
  }

  const parallelLocs = allLocations.filter((l) => l.type === LOC_TYPE.PARALLEL);
  const hashLocs = allLocations.filter((l) => l.type === LOC_TYPE.HASH);
  const orqasiLoc = allLocations.find((l) => l.type === LOC_TYPE.ORQASI);
  const insideLocs = allLocations.filter(
    (l) => l.type === LOC_TYPE.HOVLI || l.type === LOC_TYPE.XONA,
  );
  const customLocs = allLocations.filter((l) => l.type === LOC_TYPE.CUSTOM);

  const activeLoc = addLocToTavsif ? tavsifLocation : selectedLocation;

  const ichkaridaLocs = [...insideLocs];

  const LocationSection = ({ title, locs, icon }) => {
    if (!locs.length) return null;

    return (
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          {title}
        </p>

        <div className="grid grid-cols-3 gap-2">
          {locs.map((loc) => {
            const isSel = selectedLocation?.id === loc.id;
            const cfg = LOC_CONFIG[loc.type];

            return (
              <button
                key={loc.id}
                onClick={() => handleSelectLocation(loc)}
                className={`flex flex-col items-center py-3 rounded-xl border-2 font-bold active:scale-95 ${
                  isSel
                    ? `${cfg.selBg} border-transparent ${cfg.selText}`
                    : `${cfg.bg} border-transparent ${cfg.textColor}`
                }`}
              >
                <LocationIcon type={loc.type} size={20} active={isSel} />

                <span className="mt-1 text-sm font-bold text-center">
                  {loc.label}
                </span>

                {loc.desc && (
                  <span className="text-xs opacity-75 text-center">
                    {loc.desc}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-10">
      <header className="bg-navy-900 sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center active:opacity-70"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">
            {id ? "Buyurtmani tahrirlash" : "Yangi buyurtma"}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-base font-bold text-navy-900 dark:text-white mb-3">
              1. Kim / Qayerda?
            </h2>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                    activeTab === tab.id
                      ? "bg-primary-50 text-primary-600 border-b-2 border-primary-500"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "customers" && (
            <div className="px-4 pb-4 space-y-3">
              {/* JONLI QIDIRUV INPUT MAYDONI (Vaqtni tejash uchun eng muhim qism) */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Mijoz ismini yozing (Masalan: Abdulloh)..."
                  className="w-full pl-10 pr-9 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-navy-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-400 transition-all"
                />
                {customerSearch && (
                  <button
                    onClick={() => setCustomerSearch("")}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {customers.length === 0 ? (
                <p className="text-gray-400 text-sm py-2">
                  Hozircha mijoz yo'q
                </p>
              ) : (
                /* FILTERLASH VA SARALASH MANTIQI: Kiritilgan harfga ko'ra darhol elakdan o'tkazadi */
                (() => {
                  const filtered = customers
                    .filter((c) =>
                      (c.name || "")
                        .toLowerCase()
                        .includes(customerSearch.toLowerCase()),
                    )
                    .sort((a, b) =>
                      (a.name || "").localeCompare(b.name || "", "uz"),
                    );

                  if (filtered.length === 0) {
                    return (
                      <p className="text-gray-400 text-xs py-4 text-center">
                        Bunday mijoz topilmadi
                      </p>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 gap-2 mb-2 max-h-[45vh] overflow-y-auto pr-1 scrollbar-none">
                      {filtered.map((c) => {
                        const isSelected = selectedCustomer?.id === c.id;
                        return (
                          <div key={c.id} className="relative group">
                            <button
                              onClick={() => {
                                handleSelectCustomer(c);
                                setCustomerSearch(""); // Mijoz tanlangach qidiruvni tozalaydi
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-3 rounded-xl border-2 font-semibold text-sm active:scale-95 transition-all text-left ${
                                isSelected
                                  ? "border-primary-500 bg-primary-50 dark:bg-primary-950 text-primary-600"
                                  : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-navy-800 dark:text-gray-200"
                              }`}
                            >
                              <span
                                className={
                                  isSelected
                                    ? "text-primary-500"
                                    : "text-navy-400"
                                }
                              >
                                <UserRound size={16} />
                              </span>
                              <span className="truncate flex-1">{c.name}</span>
                              {c.is_favorite && (
                                <span className="text-yellow-400 shrink-0">
                                  <Star size={13} filled color="#facc15" />
                                </span>
                              )}
                            </button>

                            <div className="absolute top-1 right-1 hidden group-hover:flex gap-1 z-10">
                              <button
                                onClick={() => setEditingCustomer(c)}
                                className="w-6 h-6 bg-white dark:bg-gray-700 rounded-full shadow flex items-center justify-center hover:bg-gray-50"
                              >
                                <Edit2 size={11} color="#6b7280" />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(c.id)}
                                className="w-6 h-6 bg-white dark:bg-gray-700 rounded-full shadow flex items-center justify-center hover:bg-red-50"
                              >
                                <Trash2 size={11} color="#ef4444" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}

              <button
                onClick={() => setShowAddCustomer(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-primary-300 text-primary-500 font-semibold text-sm w-full justify-center active:scale-95"
              >
                <Plus size={16} /> Yangi mijoz qo'shish
              </button>
            </div>
          )}

          {activeTab === "locations" && (
            <div className="px-4 pb-4 space-y-4 ">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Tashqarida:
                </p>

                <LocationSection locs={hashLocs} className="my-2 text-lg" />

                <LocationSection locs={parallelLocs} className="mb-2 text-sm" />

                {orqasiLoc && <LocationSection locs={[orqasiLoc]} />}
              </div>

              <LocationSection title="Ichkarida:" locs={ichkaridaLocs} />

              {customLocs.length > 0 && (
                <LocationSection title="Qo'shimcha joylar" locs={customLocs} />
              )}
            </div>
          )}

          {activeTab === "tavsif" && (
            <div className="px-4 pb-4 space-y-3">
              <div className="relative">
                <textarea
                  value={tavsif}
                  onChange={(e) => setTavsif(e.target.value.slice(0, 80))}
                  placeholder="Tavsifni yozing..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-navy-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                />
                <span className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {tavsif.length}/80
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Masalan: Oq ko'ylak, qora do'ppi
              </p>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addLocToTavsif}
                  onChange={(e) => setAddLocToTavsif(e.target.checked)}
                  className="w-4 h-4 accent-primary-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Stol/joyni qo'shish (ixtiyoriy)
                </span>
              </label>

              {addLocToTavsif && (
                <div className="grid grid-cols-3 gap-2 animate-slide-up">
                  {allLocations.map((loc) => {
                    const isSel = tavsifLocation?.id === loc.id;
                    const cfg =
                      LOC_CONFIG[loc.type] || LOC_CONFIG[LOC_TYPE.CUSTOM];
                    return (
                      <button
                        key={loc.id}
                        onClick={() =>
                          setTavsifLocation((prev) =>
                            prev?.id === loc.id ? null : loc,
                          )
                        }
                        className={`flex flex-col items-center py-2 px-1 rounded-xl border-2 text-xs font-bold active:scale-95 ${isSel ? `${cfg.selBg} border-transparent ${cfg.selText}` : `${cfg.bg} border-transparent ${cfg.textColor}`}`}
                      >
                        <LocationIcon
                          type={loc.type}
                          size={16}
                          active={isSel}
                        />
                        <span className="mt-1 leading-tight text-center">
                          {loc.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {hasSelection && (
          <div className="animate-slide-up">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
              Tanlangan:
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedCustomer && (
                <span className="flex items-center gap-2 px-3 py-2 bg-navy-100 dark:bg-navy-800 rounded-xl">
                  <UserRound size={14} color="#4a5394" />
                  <span className="text-sm font-semibold text-navy-700 dark:text-navy-200">
                    {selectedCustomer.name}
                  </span>
                  <button onClick={() => setSelectedCustomer(null)}>
                    <X size={14} color="#6b7280" />
                  </button>
                </span>
              )}
              {activeLoc && (
                <span className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  <LocationIcon type={activeLoc.type} size={14} />
                  <span className="text-sm font-semibold text-navy-700 dark:text-gray-200">
                    {activeLoc.label}
                    {activeLoc.desc ? ` (${activeLoc.desc})` : ""}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedLocation(null);
                      setTavsifLocation(null);
                    }}
                  >
                    <X size={14} color="#6b7280" />
                  </button>
                </span>
              )}
              {tavsif.trim() && (
                <span className="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-950 rounded-xl">
                  <CircleQuestionMark size={14} color="#f97316" />
                  <span className="text-sm font-semibold text-orange-700 dark:text-orange-300 max-w-[160px] truncate">
                    {tavsif}
                  </span>
                  <button onClick={() => setTavsif("")}>
                    <X size={14} color="#6b7280" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
        {isMan && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 space-y-3 border border-orange-100 dark:border-orange-950/40">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                Savdo pulidan olingan pul (Obed)
              </h2>
              <span className="text-xs font-semibold text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-2 py-1 rounded-lg">
                Nasiyaga yoziladi
              </span>
            </div>

            <div className="relative flex items-center justify-between bg-gray-50/50 dark:bg-gray-700/30 rounded-2xl px-4 py-3 border border-gray-100 dark:border-gray-700 shadow-inner focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-transparent transition-all">
              <input
                type="number"
                pattern="[0-9]*"
                inputMode="numeric"
                placeholder="20000"
                value={obedSumma}
                onChange={(e) => setObedSumma(e.target.value)}
                className="w-full text-md font-bold bg-transparent text-navy-900 dark:text-white outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
              <span className="text-xl font-black text-gray-400 dark:text-gray-500 ml-2 tracking-wide uppercase select-none">
                so'm
              </span>
            </div>

            <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 pl-1">
              * Ushbu xarajat summasi jami naqd savdo pulidan (kassadan)
              avtomatik chegiriladi.
            </p>
          </div>
        )}

        {/* KABOB TURI VA MIQDORI DOIM KO'RINIB TURADI */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 space-y-6">
          <h2 className="text-base font-bold text-navy-900 dark:text-white">
            2. Nechta va Qanaqa?
          </h2>

          <div className="space-y-6">
            {orderItems.map((item, index) => {
              const selectedKebabId = item.kebab?.id;

              return (
                <div
                  key={index}
                  className="border border-gray-100 dark:border-gray-700 rounded-2xl p-4 space-y-4 bg-gray-50/50 dark:bg-gray-800/50 relative"
                >
                  {/* Sarlavha va O'chirish tugmasi */}
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-navy-900 dark:text-white text-sm uppercase tracking-wider">
                      Shashlik {index + 1}
                    </h3>
                    {orderItems.length > 1 && (
                      <button
                        onClick={() => removeOrderItem(index)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition active:scale-90"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  {/* Miqdor (Dona) qismi */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                      Miqdor (dona)
                    </p>
                    <div className="flex items-center justify-between mb-3 bg-white dark:bg-gray-700 rounded-xl px-2 py-2 shadow-sm border border-gray-100 dark:border-gray-600">
                      <button
                        onClick={() =>
                          updateItemQty(index, Math.max(1, item.qty - 1))
                        }
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-600 shadow-sm text-2xl text-navy-700 dark:text-white font-bold active:scale-90 transition"
                      >
                        −
                      </button>

                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => {
                          const val =
                            parseInt(e.target.value.replace(/\D/g, "")) || 1;
                          updateItemQty(index, val);
                        }}
                        className="w-20 text-center text-3xl font-extrabold bg-transparent text-navy-900 dark:text-white outline-none"
                        min="1"
                      />

                      <button
                        onClick={() => updateItemQty(index, item.qty + 1)}
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-600 shadow-sm text-2xl text-navy-700 dark:text-white font-bold active:scale-90 transition"
                      >
                        +
                      </button>
                    </div>

                    {/* Tezkor miqdor presetlari (+1, +2, +3...) */}
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((n) => {
                        return (
                          <button
                            key={n}
                            onClick={() => updateItemQty(index, item.qty + n)}
                            className="h-11 rounded-xl font-bold text-sm bg-white dark:bg-gray-700 text-navy-700 dark:text-gray-300 shadow-sm border border-gray-100 dark:border-gray-600 active:scale-95 transition"
                          >
                            +{n}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Shashlik turi qismi */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                      Shashlik turi
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {KEBAB_TYPES.map((k) => {
                        const isSel = selectedKebabId === k.id;
                        return (
                          <button
                            key={k.id}
                            onClick={() => updateItemKebab(index, k)}
                            className={`flex flex-col items-center py-4 px-2 rounded-2xl border-2 transition active:scale-95 ${
                              isSel
                                ? "border-primary-500 bg-primary-50 dark:bg-primary-950/40"
                                : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                            }`}
                          >
                            <img
                              src={KebabSvg}
                              style={{
                                filter: isSel
                                  ? "none"
                                  : "grayscale(100%) opacity(0.6)",
                              }}
                              className="w-12 h-12 object-contain"
                              alt={k.name}
                            />
                            <span
                              className={`mt-2 text-sm font-bold leading-tight text-center ${isSel ? "text-primary-500" : "text-navy-800 dark:text-white"}`}
                            >
                              {k.name}
                            </span>
                            <span
                              className={`mt-1 text-xs ${isSel ? "text-primary-400" : "text-gray-500"}`}
                            >
                              {formatCurrency(k.basePrice)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Yangi shashlik turi qo'shish tugmasi */}
            <button
              onClick={addOrderItem}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 font-bold hover:border-primary-500 hover:text-primary-500 transition bg-white dark:bg-gray-800 flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <span>+</span> Yangi shashlik turi qo'shish
            </button>
          </div>
        </div>

        {!isMan && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
            <h2 className="text-base font-bold text-navy-900 dark:text-white mb-3">
              Buyurtma hisoboti
            </h2>

            <div className="space-y-2.5">
              {/* 1. Mijoz yoki Joy nomi */}
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-500 mt-0.5">Mijoz/Joy</span>
                <span className="text-sm font-semibold text-navy-900 dark:text-white text-right max-w-[60%] break-words">
                  {selectedCustomer?.name ||
                    (addLocToTavsif
                      ? tavsifLocation?.label
                      : selectedLocation?.label) ||
                    tavsif.trim() ||
                    "—"}
                </span>
              </div>

              {/* 2. Shashlik turi va har biridan nechta olingani */}
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-500 mt-0.5">
                  Shashlik turi va miqdori
                </span>
                <div className="text-right space-y-1">
                  {orderItems.map((item, i) => (
                    <div
                      key={i}
                      className="text-sm font-semibold text-navy-900 dark:text-white"
                    >
                      {item.qty} ta {item.kebab?.name || "Noma'lum"}
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Umumiy miqdor (Jami shashliklar soni) */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Umumiy miqdor</span>
                <span className="text-sm font-bold text-navy-900 dark:text-white">
                  {orderItems.reduce((sum, item) => sum + (item.qty || 0), 0)}{" "}
                  ta
                </span>
              </div>

              {/* 4. Jami kassa summasi */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-2.5 flex justify-between items-baseline">
                <span className="text-base font-bold text-navy-900 dark:text-white">
                  Jami summasi
                </span>
                <span className="text-2xl font-extrabold text-primary-500">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pt-6 z-20 mt-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-14 bg-primary-500 active:bg-primary-600 disabled:opacity-50 rounded-2xl flex items-center justify-center gap-3 shadow-lg active:scale-[0.98]"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {id ? (
                <Pencil size={22} color="white" />
              ) : (
                <Check size={22} color="white" />
              )}
              <span className="text-white text-lg font-extrabold tracking-wider">
                {id ? "Tahrirlash" : "Qo'shish"}
              </span>
            </>
          )}
        </button>
      </div>
      {showAddCustomer && (
        <CustomerModal
          onSave={handleAddCustomer}
          onClose={() => setShowAddCustomer(false)}
        />
      )}
      {editingCustomer && (
        <CustomerModal
          existing={editingCustomer}
          onSave={handleUpdateCustomer}
          onClose={() => setEditingCustomer(null)}
        />
      )}
    </div>
  );
};

export default NewOrder;
