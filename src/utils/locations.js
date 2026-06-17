// Location types
export const LOC_TYPE = {
  PARALLEL: "parallel", // || style (devor yonidagi)
  HASH: "hash", // # style (panjara yonidagi)
  ORQASI: "Tandir orqasi", // Tandir orqasi
  HOVLI: "hovli", // Hovli
  XONA: "xona", // Xona ichi
  CUSTOM: "custom", // user-defined
};

// Preset locations — shown in the locations grid
export const PRESET_LOCATIONS = [
  // Outside — devor yonidagi stollar (|| style)
  { id: "p1", type: LOC_TYPE.PARALLEL, label: "|| 1-stol" },
  { id: "p2", type: LOC_TYPE.PARALLEL, label: "|| 2-stol" },
  { id: "p3", type: LOC_TYPE.PARALLEL, label: "|| 3-stol" },
  { id: "p4", type: LOC_TYPE.PARALLEL, label: "|| 4-stol" },
  { id: "p5", type: LOC_TYPE.PARALLEL, label: "|| 5-stol" },

  // Outside — panjara yonidagi stollar (# style)
  { id: "h1", type: LOC_TYPE.HASH, label: "# 1-stol" },
  { id: "h2", type: LOC_TYPE.HASH, label: "# 2-stol" },
  { id: "h3", type: LOC_TYPE.HASH, label: "# 3-stol" },
  { id: "h4", type: LOC_TYPE.HASH, label: "# 4-stol" },
  { id: "h5", type: LOC_TYPE.HASH, label: "# 5-stol" },

  // Outside — orqasi
  {
    id: "orq",
    type: LOC_TYPE.ORQASI,
    label: "Tandir orqasi",
  },
  // Inside
  { id: "hovli", type: LOC_TYPE.HOVLI, label: "Hovli" },
  { id: "xona", type: LOC_TYPE.XONA, label: "Xona ichi" },
];

// Build a display string for an order row (e.g., "|| 2 (2-stol devordan)")
export const getLocationDisplay = (order) => {
  if (!order) return "";
  const { locationLabel, locationDesc, locationType } = order;
  if (!locationLabel) return order.location || "";
  if (locationDesc) return `${locationLabel} (${locationDesc})`;
  return locationLabel;
};

// Pick the right icon type for a location type
export const getLocationIconType = (locationType) => {
  switch (locationType) {
    case LOC_TYPE.PARALLEL:
      return "parallel";
    case LOC_TYPE.HASH:
      return "hash";
    case LOC_TYPE.ORQASI:
      return "circle";
    case LOC_TYPE.HOVLI:
      return "home";
    case LOC_TYPE.XONA:
      return "door";
    default:
      return "pin";
  }
};
