import { useState, useMemo } from "react";
import { useOrders } from "../contexts";
import { formatCurrency, formatRevenue } from "../utils/formatters";
import { dayStart } from "../utils/orderDisplay";

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

  // 🌟 Ustunlar ko'p bo'lsa (Soatlik/Oylikda > 12) grafikni balandroq qilamiz,
  // bu raqamlar ustma-ust tushib ketishining oldini oladi
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
              // 🌟 Ustunlar ko'p bo'lsa eng kichik kenglikni siqib qo'ymaymiz (minimal joy qoldiramiz)
              style={{ flex: 1, minWidth: isLarge ? 20 : 25 }}
            >
              {d.value > 0 && (
                <span
                  // 🌟 Raqamlar yopishib ketmasligi uchun matn o'lchamini soatlikda text-[9px] qildik
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

// ─── Metric card ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, accent }) {
  return (
    <div
      className={`rounded-2xl p-4 ${accent ? "bg-navy-800" : "bg-white dark:bg-gray-800"} shadow-sm`}
    >
      <p
        className={`text-xs font-semibold mb-1 ${accent ? "text-navy-200" : "text-gray-400"}`}
      >
        {label}
      </p>
      <p
        className={`text-xl font-extrabold leading-tight ${accent ? "text-white" : "text-navy-900 dark:text-white"}`}
      >
        {value}
      </p>
      {sub && (
        <p
          className={`text-xs mt-1 ${accent ? "text-navy-300" : "text-gray-400"}`}
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
    // 1. Bugungi kunni tekshirish uchun helper (agar kerak bo'lsa)
    const isToday = (date) => {
      const d = new Date(date);
      const today = new Date();
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    };

    // 2. Buyurtmalarni statuslariga ko'ra ajratamiz
    const paid = periodOrders.filter((o) => o.paid);

    // Bugungi to'lanmagan va nasiya bo'lmaganlar (Kutilmoqda)
    const pendingOrders = periodOrders.filter(
      (o) => !o.paid && isToday(o.createdAt) && !o.isDebt,
    );

    // Jami nasiya buyurtmalar
    const debtOrders = periodOrders.filter(
      (o) => o.isDebt || (!o.paid && !isToday(o.createdAt)),
    );

    // 3. Pullarni (Summalarni) hisoblaymiz
    const revenue = paid.reduce((s, o) => s + (o.totalPrice || 0), 0);
    const pendingRev = pendingOrders.reduce(
      (s, o) => s + (o.totalPrice || 0),
      0,
    );
    const debtTotal = debtOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);

    return {
      revenue,
      pendingRev,
      debtTotal, // Nasiyadagi jami pul summasi
      total: periodOrders.length,
      paid: paid.length,
      pendingCount: pendingOrders.length, // Bugungi kutilayotgan buyurtmalar soni
      debtCount: debtOrders.length, // Jami nasiya buyurtmalar soni
      avgRev: paid.length > 0 ? Math.round(revenue / paid.length) : 0,
    };
  }, [periodOrders]);

  // ── Kebab quantities ──────────────────────────────────────────────────────
  const kebabStats = useMemo(() => {
    return KEBAB_CONFIG.map((k) => ({
      ...k,
      qty: periodOrders.reduce((sum, order) => {
        if (!order.items) return sum;

        const itemQty = order.items
          .filter((item) => item.kebabType === k.id)
          .reduce((s, item) => s + item.quantity, 0);

        return sum + itemQty;
      }, 0),
    }));
  }, [periodOrders]);

  const maxKebabQty = Math.max(...kebabStats.map((k) => k.qty), 1);

  // ── Revenue bar chart data ────────────────────────────────────────────────
  const barData = useMemo(() => {
    if (period === "today") {
      // 24 hourly buckets
      const buckets = Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        value: 0,
        label: h % 3 === 0 ? `${h}` : "",
        dayTs: today,
      }));
      periodOrders
        .filter((o) => o.paid)
        .forEach((o) => {
          const h = new Date(o.createdAt).getHours();
          buckets[h].value += o.totalPrice || 0;
        });
      return buckets;
    }

    if (period === "week") {
      return Array.from({ length: 7 }, (_, i) => {
        const dayTs = today - (6 - i) * 86400000;
        const value = orders
          .filter((o) => o.paid && dayStart(o.createdAt) === dayTs)
          .reduce((s, o) => s + (o.totalPrice || 0), 0);
        return { dayTs, value, label: getWeekDayLabel(dayTs) };
      });
    }

    // month — 30 days
    return Array.from({ length: 30 }, (_, i) => {
      const dayTs = today - (29 - i) * 86400000;
      const value = orders
        .filter((o) => o.paid && dayStart(o.createdAt) === dayTs)
        .reduce((s, o) => s + (o.totalPrice || 0), 0);
      const d = new Date(dayTs);
      // label every 5th day
      const label = i % 5 === 0 ? `${d.getDate()}` : "";
      return { dayTs, value, label };
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
          <MetricCard
            label="Daromad"
            value={formatCurrency(metrics.revenue)}
            sub={
              metrics.avgRev > 0
                ? `O'rtacha: ${formatCurrency(metrics.avgRev)}`
                : undefined
            }
            accent
          />
          <MetricCard
            label="Kutilmoqda"
            value={formatCurrency(metrics.pendingRev)}
            sub={`${metrics.pendingCount} ta to'lanmagan`} // 🌟 "unpaid" o'rniga "pendingCount" ulandi
          />
          <MetricCard
            label="Jami buyurtma"
            value={metrics.total}
            sub={`${metrics.paid} to'langan`}
          />
          <MetricCard
            label="Nasiyalar"
            value={formatCurrency(metrics.debtTotal)} // 🌟 Nasiya bo'lib turgan jami pul miqdori
            sub={`${metrics.debtCount} ta buyurtma nasiya`} // 🌟 Nasiya buyurtmalar soni
          />
        </div>

        {/* ── Kebab quantity revenue breakdown ─────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-4">
            Shashlik miqdori bo'yicha taqsimot
          </h3>
          {kebabStats.every((k) => k.qty === 0) ? (
            <p className="text-gray-400 text-sm text-center py-4">
              Hali buyurtma yo'q
            </p>
          ) : (
            <div className="space-y-4">
              {kebabStats.map((k) => (
                <HBar
                  key={k.id}
                  label={k.label}
                  value={k.qty}
                  max={maxKebabQty}
                  color={k.color}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Kebab type revenue breakdown ──────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-3">
            Daromad - shashlik turi bo'yicha
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
                    {metrics.isDebt}
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
            /* 🌟 MUHIM TUZATISH: Mobil uchun skrol va dinamik kenglik qo'shildi */
            <div className="w-full overflow-x-auto scrollbar-none">
              <div className={"w-full"}>
                <RevenueBarChart data={barData} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;
