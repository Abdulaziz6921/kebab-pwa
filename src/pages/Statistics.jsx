import { useState, useMemo } from "react";
import { useOrders } from "../contexts";
import {
  formatCurrency,
  formatRevenue,
  formatOrderTime,
} from "../utils/formatters";
import { dayStart } from "../utils/orderDisplay";
import {
  CheckCheck,
  File,
  FileText,
  MinusSquare,
  SquarePlus,
  X,
} from "lucide-react";

// ─── SVG Donut Chart ──────────────────────────────────────────────────────────
function DonutChart({ paid, total, size = 148 }) {
  const pct = total > 0 ? paid / total : 0;
  const inner = size * 0.62;
  const angle = `${(pct * 360).toFixed(1)}deg`;

  const bg =
    pct === 0
      ? "#fed7aa"
      : pct === 1
        ? "#6ee7b7"
        : `conic-gradient(#10b981 0deg ${angle}, #fed7aa ${angle} 360deg)`;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Ring */}
      <div
        className="rounded-full"
        style={{ width: size, height: size, background: bg }}
      />
      {/* Hole */}
      <div
        className="absolute rounded-full bg-white dark:bg-gray-800 flex flex-col items-center justify-center"
        style={{ width: inner, height: inner }}
      >
        <span className="text-2xl font-extrabold text-navy-900 dark:text-white leading-none">
          {Math.round(pct * 100)}%
        </span>
        <span className="text-xs text-gray-400 mt-0.5">To'langan</span>
      </div>
    </div>
  );
}

// ─── Horizontal bar (kebab types) ─────────────────────────────────────────────
function HBar({ label, value, max, color, unit = "ta" }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-navy-800 dark:text-gray-200">
          {label}
        </span>
        <span className="font-bold text-navy-900 dark:text-white">
          {value} {unit}
        </span>
      </div>
      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Vertical revenue bar chart ───────────────────────────────────────────────
function RevenueBarChart({ data, label }) {
  if (!data.length) return null;

  //  Ustunlar ko'p bo'lsa (Soatlik/Oylikda > 12) grafikni balandroq qilamiz

  const isLarge = data.length > 12;
  const maxPx = isLarge ? 140 : 96; // 96px dan 140px ga balandlashdi

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const today = dayStart(Date.now());

  return (
    <div>
      <div
        className="flex items-end gap-0.5 overflow-x-auto pb-2 scrollbar-none"
        style={{ height: maxPx + 55 }} // Vertikal joyni kengaytirdik
      >
        {data.map((d, i) => {
          const h = Math.max((d.value / maxVal) * maxPx, d.value > 0 ? 5 : 2);
          const isTdy = d.dayTs === today;

          return (
            <div
              key={i}
              className="flex flex-col items-center justify-end gap-1 shrink-0"
              style={{ flex: 1, minWidth: isLarge ? 20 : 25 }}
            >
              {d.value > 0 && (
                <span
                  className={`font-semibold text-gray-500 leading-none whitespace-nowrap mb-0.5 tracking-tighter ${
                    data.length > 20
                      ? "text-[9px]"
                      : isLarge
                        ? "text-[11px]"
                        : "text-[13px]"
                  }`}
                >
                  {formatRevenue(d.value)}
                </span>
              )}

              <div
                className="w-full rounded-t-sm transition-all duration-500"
                style={{
                  height: h,
                  background: isTdy
                    ? "#f97316"
                    : d.value > 0
                      ? "#fdba74"
                      : "#f3f4f6",
                  minHeight: 2,
                }}
              />

              {d.label && (
                <span
                  className={`text-center text-gray-400 leading-none mt-1 ${
                    data.length > 20 ? "text-[8px]" : "text-[10px]"
                  } ${isTdy ? "font-bold text-primary-500" : ""}`}
                >
                  {d.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {label && (
        <p className="text-xs text-gray-400 text-center mt-1">{label}</p>
      )}
    </div>
  );
}

//  ORDER DETAILS HELPER FUNCTION
function getOrderSecondary(order) {
  if (order.isObed) {
    return "";
  }

  // New orders (Regular customers)
  if (order.items?.length) {
    return order.items
      .map((item) => `${item.quantity} ta ${item.kebabName}`)
      .join(", ");
  }

  // Backward compatibility for old orders (Regular customers)
  const kebabMap = {
    qiyma: "Qiyma",
    mol: "Mol go'shti",
    quy: "Qo'y go'shti",
  };

  const kebab = kebabMap[order.kebabType] || order.kebabType || "";
  return `${order.quantity || 1} ta ${kebab}`;
}

// ─── Metric card ───
function MetricCard({ label, value, sub, accent, className }) {
  const isCustomBg = !!className;
  const baseCardStyles =
    "rounded-2xl p-3.5 sm:p-4 shadow-sm border border-gray-100/50 dark:border-gray-700/30 transition-all select-none";

  const theme = {
    bg:
      className ||
      (accent
        ? "bg-navy-800 text-white"
        : "bg-white dark:bg-gray-800 text-navy-900 dark:text-white"),
    label: isCustomBg
      ? "text-white/75"
      : accent
        ? "text-navy-200/90"
        : "text-gray-400 dark:text-gray-400",
    value:
      isCustomBg || accent ? "text-white" : "text-navy-900 dark:text-white",
    sub: isCustomBg
      ? "text-white/85"
      : accent
        ? "text-navy-300"
        : "text-gray-400 dark:text-gray-500",
  };

  return (
    <div className={`${baseCardStyles} ${theme.bg}`}>
      <p
        className={`text-[11px] sm:text-xs font-bold tracking-wide mb-1 uppercase opacity-90 ${theme.label}`}
      >
        {label}
      </p>

      <p
        className={`text-base sm:text-lg md:text-xl font-black tracking-tight leading-none ${theme.value}`}
      >
        {value}
      </p>

      {/* 🟢 TO'G'RILANDI: Ortiqcha qavslar olib tashlandi, endi xato bermaydi */}
      {sub && (
        <p
          className={`text-[10px] sm:text-xs font-medium mt-1.5 truncate ${theme.sub}`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const PERIODS = [
  { id: "today", label: "Bugun" },
  { id: "week", label: "Hafta" },
  { id: "month", label: "Oy" },
];

const KEBAB_CONFIG = [
  { id: "qiyma", label: "Qiyma", color: "#f97316" },
  { id: "mol", label: "Mol go'shti", color: "#2c3260" },
  { id: "quy", label: "Qo'y go'shti", color: "#10b981" },
];

const DAY_SHORT = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

function getDayLabel(ts) {
  const d = new Date(ts);
  return `${d.getDate()}`;
}

function getWeekDayLabel(ts) {
  const d = new Date(ts);
  return DAY_SHORT[d.getDay() === 0 ? 6 : d.getDay() - 1];
}

const Statistics = () => {
  const { orders } = useOrders();
  const [period, setPeriod] = useState("today");
  const [activeMetricFilter, setActiveMetricFilter] = useState(" ");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const now = Date.now();
  const today = dayStart(now);

  // ── Filter orders for period ──────────────────────────────────────────────
  const periodOrders = useMemo(() => {
    switch (period) {
      case "today":
        return orders.filter((o) => o.createdAt >= today);
      case "week":
        return orders.filter((o) => o.createdAt >= today - 6 * 86400000);
      case "month":
        return orders.filter((o) => o.createdAt >= today - 29 * 86400000);
      default:
        return orders;
    }
  }, [orders, period, today]);

  // ── Key metrics ───────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    // 1. Bugungi kunni tekshirish uchun helper
    const isToday = (date) => {
      const d = new Date(date);
      const today = new Date();
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    };

    // Agar bu Obed yozuvi bo'lsa va items massivi bo'sh bo'lsa (shashlik tanlanmagan bo'lsa),
    // uni asosiy buyurtmalar ro'yxatidan butunlay o'chirib tashlaymiz!
    const cleanPeriodOrders = periodOrders.filter(
      (o) => !(o.isObed && (!o.items || o.items.length === 0)),
    );

    // Buyurtmalarni statuslariga ko'ra ajratamiz (Faqat tozalangan buyurtmalarni)
    const paid = cleanPeriodOrders.filter((o) => o.paid);

    // Bugungi to'lanmagan va nasiya bo'lmaganlar (Kutilmoqda)
    const pendingOrders = cleanPeriodOrders.filter(
      (o) => !o.paid && isToday(o.createdAt) && !o.isDebt,
    );

    // Jami nasiya buyurtmalar (Haqiqiy qarzlar + "Man"ning hamma xarajatlari)
    const debtOrders = periodOrders.filter(
      (o) => o.isDebt || (!o.paid && !isToday(o.createdAt)),
    );

    // Pullarni (Summalarni) hisoblaymiz

    // G'aladondan olingan jami sof obed pullari summasi (Masalan: 20000)
    const obedTotalSum = periodOrders
      .filter((o) => o.isObed)
      .reduce((s, o) => {
        return s + (o.totalPrice || 0); // Jami 20,000 so'm (kabob 15k + naqd 5k)
      }, 0);

    // Naqd savdo puli (Revenue / Kassa): Haqiqiy to'langan puldan olingan sof naqd pul AYRILADI!
    const revenue =
      paid.reduce((s, o) => s + (o.totalPrice || 0), 0) - obedTotalSum;

    const paidTotalSum = paid.reduce((s, o) => s + (o.totalPrice || 0), 0);

    // Nasiya (Qarzlar): "Man"ning hamma qarzi (kabob + naqd pul) to'liq qo'shiladi
    const debtTotal = debtOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);

    // Jami buyurtmalar summasi: Faqat kaboblar pulini qo'shadi, obed pullarini qo'shmaydi
    const allOrdersTotalSum = cleanPeriodOrders.reduce((s, o) => {
      // Agar bu "Man" (Obed) yozuvi bo'lsa, jami pul summasiga 0 so'm qo'shiladi (ya'ni qo'shilmaydi!)
      if (o.isObed) {
        return s;
      }
      // Faqat haqiqiy xaridorlar sotib olgan kaboblar puli qo'shiladi
      return s + (o.totalPrice || 0);
    }, 0);

    return {
      revenue,
      paidTotalSum,
      debtTotal,
      allOrdersTotalSum,
      //  Endi faqat pul kiritilganda buyurtma soni mutloq oshmaydi va toza chiqadi!
      total: cleanPeriodOrders.length,
      paid: paid.length,
      pendingCount: pendingOrders.length,
      debtCount: debtOrders.length,
    };
  }, [periodOrders]);

  // ─── 🌟 MANA SHU YERGA JURIDIK REJADA JOYLASHTIRING ───
  const displayedOrders = useMemo(() => {
    const baseOrders = periodOrders.filter(
      (o) => !(o.isObed && (!o.items || o.items.length === 0)),
    );

    const isToday = (date) => {
      const d = new Date(date);
      const today = new Date();
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    };

    switch (activeMetricFilter) {
      case "paid":
        return baseOrders.filter((o) => o.paid);
      case "debt":
        return periodOrders.filter(
          (o) => o.isDebt || (!o.paid && !isToday(o.createdAt)),
        );
      case "revenue":
        return periodOrders.filter((o) => o.paid || o.isObed);
      case "all":
      default:
        return baseOrders;
    }
  }, [periodOrders, activeMetricFilter]);
  // ───────────────────────────────────────────────────

  // ── Kebab quantities ──────────────────────────────────────────────────────
  const kebabStats = useMemo(() => {
    return KEBAB_CONFIG.map((k) => {
      const qty = periodOrders.reduce((sum, order) => {
        if (!order.items) return sum;
        return (
          sum +
          order.items
            .filter((item) => item.kebabType === k.id)
            .reduce((s, item) => s + (item.quantity || 0), 0)
        );
      }, 0);

      const debtQty = periodOrders.reduce((sum, order) => {
        if (order.paid || order.isObed || !order.items) return sum;
        return (
          sum +
          order.items
            .filter((item) => item.kebabType === k.id)
            .reduce((s, item) => s + (item.quantity || 0), 0)
        );
      }, 0);

      const paidQty = Math.max(0, qty - debtQty);

      return {
        ...k,
        qty,
        paidQty,
        debtQty,
      };
    }).filter((k) => k.qty > 0); // Faqat sotilgan shashliklarni qoldiradi
  }, [periodOrders]);

  const maxKebabQty = useMemo(() => {
    if (kebabStats.length === 0) return 1;
    return Math.max(...kebabStats.map((k) => k.qty), 1);
  }, [kebabStats]);

  const kebabDistribution = useMemo(() => {
    return kebabStats.map((k) => ({
      ...k,
      paidPct: maxKebabQty > 0 ? (k.paidQty / maxKebabQty) * 100 : 0,
      debtPct: maxKebabQty > 0 ? (k.debtQty / maxKebabQty) * 100 : 0,
    }));
  }, [kebabStats, maxKebabQty]);

  // ── Revenue bar chart data ────────────────────────────────────────────────
  const barData = useMemo(() => {
    // Muayyan kunda g'aladondan olingan naqd pulni hisoblash (Masalan: 5,000)
    const getDayObedCash = (targetDayTs) => {
      return orders
        .filter((o) => o.isObed && dayStart(o.createdAt) === targetDayTs)
        .reduce((sum, o) => sum + (o.debtAmount || 0), 0);
    };

    // Muayyan kunda siz qarzga yegan kabob pulini hisoblash (Masalan: 15,000)
    const getDayObedKebab = (targetDayTs) => {
      return orders
        .filter((o) => o.isObed && dayStart(o.createdAt) === targetDayTs)
        .reduce(
          (sum, o) => sum + ((o.totalPrice || 0) - (o.debtAmount || 0)),
          0,
        );
    };

    if (period === "today") {
      const buckets = Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        value: 0,
        label: h % 3 === 0 ? `${h}` : "",
        dayTs: today,
      }));

      periodOrders
        .filter((o) => o.paid && !o.isObed)
        .forEach((o) => {
          const h = new Date(o.createdAt).getHours();
          buckets[h].value += o.totalPrice || 0;
        });

      // Bugungi jami xarajatlarni (5,000 cash + 15,000 kebab = 20,000) oxirgi faol soatdan ayiramiz
      const todayObedSum = getDayObedCash(today) + getDayObedKebab(today);
      if (todayObedSum > 0) {
        const activeHours = periodOrders
          .filter((o) => o.paid && !o.isObed)
          .map((o) => new Date(o.createdAt).getHours());

        const lastActiveHour =
          activeHours.length > 0
            ? Math.max(...activeHours)
            : new Date().getHours();
        buckets[lastActiveHour].value = Math.max(
          0,
          buckets[lastActiveHour].value - todayObedSum,
        );
      }

      return buckets;
    }

    if (period === "week") {
      return Array.from({ length: 7 }, (_, i) => {
        const dayTs = today - (6 - i) * 86400000;

        // Haqiqiy xaridorlar naqd to'lagan pul baseline
        const rawPaidRevenue = orders
          .filter((o) => o.paid && !o.isObed && dayStart(o.createdAt) === dayTs)
          .reduce((s, o) => s + (o.totalPrice || 0), 0);

        // 🌟 QAT'IY KUNMA-KUN MATEMATIKA:
        // Bugun (24-June): 660,000 - 5,000 (cash) - 15,000 (kebab) = 640,000 so'm
        // Kecha (23-June): 665,000 - 5,000 (cash) - 0 (kebab chetlatilgan) = 660,000 so'm
        let finalValue = rawPaidRevenue - getDayObedCash(dayTs);
        if (dayTs === today) {
          finalValue = finalValue - getDayObedKebab(dayTs); // Faqat bugungi kundan kabob qarzini majburiy ayiradi
        }

        return {
          dayTs,
          value: Math.max(0, finalValue),
          label: getWeekDayLabel(dayTs),
        };
      });
    }

    // month — 30 days
    return Array.from({ length: 30 }, (_, i) => {
      const dayTs = today - (29 - i) * 86400000;

      const rawPaidRevenue = orders
        .filter((o) => o.paid && !o.isObed && dayStart(o.createdAt) === dayTs)
        .reduce((s, o) => s + (o.totalPrice || 0), 0);

      let finalValue = rawPaidRevenue - getDayObedCash(dayTs);
      if (dayTs === today) {
        finalValue = finalValue - getDayObedKebab(dayTs);
      }

      const d = new Date(dayTs);
      const label = i % 5 === 0 ? `${d.getDate()}` : "";
      return { dayTs, value: Math.max(0, finalValue), label };
    });
  }, [orders, periodOrders, period, today]);

  const barChartLabel =
    period === "today"
      ? "Bugungi soatlik daromad"
      : period === "week"
        ? "So'nggi 7 kunlik daromad"
        : "So'nggi 30 kunlik daromad";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
        <div className="px-4 pt-4 pb-3">
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white mb-3">
            Statistika
          </h1>

          {/* Period tabs */}
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  period === p.id
                    ? "bg-navy-800 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* ── Key metrics ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => {
              setActiveMetricFilter("all");
              setIsModalOpen(true);
            }}
          >
            <MetricCard
              label="Jami buyurtma"
              value={formatCurrency(metrics.allOrdersTotalSum)}
              sub={`${metrics.total} ta umumiy buyurtma`}
              accent
            />
          </div>

          <div
            onClick={() => {
              setActiveMetricFilter("paid");
              setIsModalOpen(true);
            }}
          >
            <MetricCard
              label="To'langan"
              value={formatCurrency(metrics.paidTotalSum)}
              sub={`${metrics.paid} ta buyurtma to'landi`}
              className="!bg-orange-500 dark:!bg-orange-600"
            />
          </div>

          <div
            onClick={() => {
              setActiveMetricFilter("debt");
              setIsModalOpen(true);
            }}
          >
            <MetricCard
              label="Nasiyalar"
              value={formatCurrency(metrics.debtTotal)}
              sub={`${metrics.debtCount} ta buyurtma nasiya`}
              className="!bg-red-500 dark:!bg-red-600"
            />
          </div>

          <div
            onClick={() => {
              setActiveMetricFilter("revenue");
              setIsModalOpen(true);
            }}
          >
            <MetricCard
              label="Sof daromad"
              value={formatCurrency(metrics.revenue)}
              sub={`savdo puli bo'lishi kerak`}
              className="!bg-green-500 dark:!bg-green-600"
            />
          </div>
        </div>

        {/* ── Kebab quantity revenue breakdown ─────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-4">
            Shashlik miqdori bo'yicha taqsimot
          </h3>

          {kebabDistribution.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">
              Hali buyurtma yo'q
            </p>
          ) : (
            <div className="space-y-4">
              {kebabDistribution.map((k) => (
                <div key={k.id} className="space-y-1 select-none">
                  {/* Tepadagi Panel: Yozuvlar va Ikonkalar qat'iy yonma-yon */}
                  <div className="flex justify-between items-center text-xs font-bold text-navy-900 dark:text-gray-200">
                    <span className="flex items-center gap-1">
                      {k.label}
                      <span className="text-[11px] font-medium text-accent">
                        {k.qty}ta sotildi
                      </span>
                    </span>

                    {/* To'langan va Nasiya donalari (Ikonkalar matn yonida mukammal joylashgan) */}
                    <span className="font-mono text-[11px] flex items-center gap-2">
                      {k.paidQty > 0 && (
                        <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                          <CheckCheck size={11} className="shrink-0" />
                          <span>{k.paidQty}</span>
                        </span>
                      )}
                      {k.debtQty > 0 && (
                        <span className="flex items-center gap-0.5 text-red-500 dark:text-red-400">
                          <MinusSquare size={11} className="shrink-0" />
                          <span>{k.debtQty}</span>
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Stacked Progress Bar Chizig'i */}
                  <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700/60 rounded-full overflow-hidden flex">
                    {k.paidQty > 0 && (
                      <div
                        className="h-full bg-green-500 dark:bg-green-600 rounded-l-full transition-all duration-500"
                        style={{ width: `${k.paidPct}%` }}
                      />
                    )}
                    {k.debtQty > 0 && (
                      <div
                        className={`h-full bg-red-500 dark:bg-red-600 transition-all duration-500 ${k.paidQty === 0 ? "rounded-full" : "rounded-r-full"}`}
                        style={{ width: `${k.debtPct}%` }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Kebab type revenue breakdown ──────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-3">
            To'langan shashliklar turi buyicha taqsimot
          </h3>
          <div className="space-y-2.5">
            {KEBAB_CONFIG.map((k) => {
              const rev = periodOrders.reduce((sum, order) => {
                if (!order.paid) return sum;

                // NEW ORDERS
                if (order.items?.length) {
                  const kebabRevenue = order.items
                    .filter((item) => item.kebabType === k.id)
                    .reduce(
                      (s, item) =>
                        s + (item.quantity || 1) * (item.unitPrice || 0),
                      0,
                    );

                  return sum + kebabRevenue;
                }

                // OLD ORDERS (backward compatibility)
                if (order.kebabType === k.id) {
                  return sum + (order.totalPrice || 0);
                }

                return sum;
              }, 0);
              const total = periodOrders
                .filter((o) => o.paid)
                .reduce((s, o) => s + (o.totalPrice || 0), 0);
              const pct = total > 0 ? (rev / total) * 100 : 0;
              return (
                <div key={k.id} className="flex flex-col gap-0.5">
                  <div className="flex justify-end">
                    <span className="text-xs font-bold text-navy-800 dark:text-gray-100 whitespace-nowrap">
                      {formatCurrency(rev)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: k.color }}
                    />
                    <span className="text-sm text-gray-600 dark:text-white w-28 shrink-0">
                      {k.label}
                    </span>
                    <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: k.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* ── Paid / Debt donut ──────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-4">
            To'lov holati
          </h3>
          <div className="flex items-center justify-between">
            <DonutChart paid={metrics.paid} total={metrics.total} size={148} />
            <div className="flex-1 pl-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-success-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">To'langan</p>
                  <p className="text-lg font-extrabold text-navy-900 dark:text-white leading-none mt-0.5">
                    {metrics.paid}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-orange-300 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Nasiyalar</p>
                  <p className="text-lg font-extrabold text-navy-900 dark:text-white leading-none mt-0.5">
                    {metrics.debtCount}
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                <p className="text-xs text-gray-500">Jami buyurtma</p>
                <p className="text-base font-extrabold text-navy-900 dark:text-white">
                  {metrics.total}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* ── Revenue bar chart ────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-4">
            {barChartLabel}
          </h3>
          {periodOrders.filter((o) => o.paid).length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">
              Hali daromad yo'q
            </p>
          ) : (
            <div className="w-full overflow-x-auto scrollbar-none">
              <div className={"w-full"}>
                <RevenueBarChart data={barData} />
              </div>
            </div>
          )}
        </div>
        {/* ─── 🌟 UNIVERSAL FULL-PAGE MODAL: BUYURTMALAR RO'YXATI EKRA NUSTIDAN CHIQADI ─── */}
        {/* ─── 🌟 UNIVERSAL FULL-PAGE MODAL: BUYURTMALAR RO'YXATI EKRA NUSTIDAN CHIQADI ─── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[99999] bg-gray-900/60 dark:bg-black/70 backdrop-blur-md animate-in fade-in duration-200 flex flex-col justify-end sm:justify-center p-0 sm:p-4">
            {/* Modal Oynasining Asosiy Korpusi */}
            <div className="w-full  h-[92vh] sm:h-[85vh] bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
              {/* Modal Sarlavhasi va X Yopish Tugmasi Panel */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 shrink-0 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      activeMetricFilter === "all"
                        ? "bg-primary-500"
                        : activeMetricFilter === "paid"
                          ? "bg-orange-500"
                          : activeMetricFilter === "debt"
                            ? "bg-red-500"
                            : "bg-green-500"
                    }`}
                  />
                  <h3 className="text-base font-black text-navy-900 dark:text-white">
                    {activeMetricFilter === "all"
                      ? "Jami buyurtmalar ro'yxati"
                      : activeMetricFilter === "paid"
                        ? "To'langan buyurtmalar"
                        : activeMetricFilter === "debt"
                          ? "Nasiya buyurtmalar"
                          : "Sof daromad aylanmasi"}
                  </h3>
                </div>

                {/* 🌟 YANGILANDI: X tugmasi endi modal oynani 100% to'g'ri yopadi! */}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-gray-500 dark:text-gray-300 transition-all active:scale-95 outline-none"
                >
                  <X size={18} className="stroke-[2.5]" />
                </button>
              </div>

              {/* Dinamik Ma'lumot Soni Hisoblagichi */}
              <div
                className={`px-5 py-2 border-b border-gray-100 dark:border-gray-700/40 shrink-0 ${
                  activeMetricFilter === "all"
                    ? "bg-primary-500"
                    : activeMetricFilter === "paid"
                      ? "bg-orange-500"
                      : activeMetricFilter === "debt"
                        ? "bg-red-500"
                        : "bg-green-500"
                }`}
              >
                <p className="text-xs font-bold ">
                  Ushbu bo'limda jami {displayedOrders?.length || 0} ta buyurtma
                  aniqlandi
                </p>
              </div>

              {/* 📜 SKROLL BO'LADIGAN BUYURTMALAR RO'YXATI */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-none bg-gray-50/30 dark:bg-gray-900/10">
                {!displayedOrders || displayedOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10">
                    <p className="text-gray-400 text-sm font-semibold">
                      Bu bo'limda buyurtmalar hozircha mavjud emas.
                    </p>
                  </div>
                ) : (
                  displayedOrders.map((order) => (
                    <div
                      key={order.id || order.identifier}
                      className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700/80 bg-white dark:bg-gray-800 flex flex-col gap-2.5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* <div className="flex items-center justify-end">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
                            order.paid
                              ? "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400"
                              : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                          }`}
                        >
                          {order.paid ? "To'langan" : "Nasiya"}
                        </span>
                      </div> */}

                      <div className="flex justify-between items-center">
                        <div className="max-w-[70%]">
                          <h4 className="font-extrabold text-navy-900 dark:text-white text-sm truncate">
                            {order.description}
                          </h4>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5 tracking-wide">
                            {getOrderSecondary(order)}
                          </p>
                          <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 font-bold mt-0.5 tracking-wide flex flex-wrap gap-0.5 items-center select-none">
                            {/* Yaratilgan vaqt ikonkasi va matni */}
                            <FileText
                              size={11}
                              className="shrink-0 text-gray-400 dark:text-gray-500"
                            />
                            <span>{formatOrderTime(order.createdAt)}</span>

                            {/* Agar to'langan bo'lsa, yo'nalish o'qi va to'langan vaqt */}
                            {order.paidAt && (
                              <>
                                <span className="text-gray-300 dark:text-gray-600 font-normal mx-0.5">
                                  -&gt;
                                </span>
                                <SquarePlus
                                  size={12}
                                  className="text-emerald-600 dark:text-emerald-500 shrink-0"
                                />
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  {formatOrderTime(order.paidAt)}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                        <div className="flex flex-col gap-3">
                          <span
                            className={`text-[10px] text-center px-2 py-0.5 rounded-full font-black ${
                              order.paid
                                ? "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400"
                                : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                            }`}
                          >
                            {order.paid ? "To'langan" : "Nasiya"}
                          </span>
                          <span className="text-base font-black text-navy-900 dark:text-white tracking-tight">
                            {formatCurrency(order.totalPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        {/* ─────────────────────────────────────────────────────────────────── */}
      </div>
    </div>
  );
};

export default Statistics;
