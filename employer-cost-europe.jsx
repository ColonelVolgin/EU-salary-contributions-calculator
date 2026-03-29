import { useState, useMemo, useCallback } from "react";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const band = (gross, floor, ceiling) => clamp(gross, floor, ceiling ?? Infinity) - floor;
const calcComp = (c, gross) => {
  if (c.compute) return c.compute(gross);
  return band(gross, c.floor ?? 0, c.ceiling) * c.rate;
};

const fmt = (v) => v.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const fmtPct = (v) => `${(v * 100).toFixed(1)}%`;

const progressiveTax = (taxable, brackets) => {
  let tax = 0, prev = 0;
  for (const [limit, rate] of brackets) {
    const chunk = Math.min(Math.max(taxable - prev, 0), limit - prev);
    tax += chunk * rate;
    prev = limit;
    if (taxable <= limit) break;
  }
  return tax;
};

const COUNTRIES = [
  {
    name: "Germany", flag: "\u{1F1E9}\u{1F1EA}",
    employer: [
      { name: "Pension", rate: 0.093, ceiling: 101400 },
      { name: "Unemployment", rate: 0.013, ceiling: 101400 },
      { name: "Health", rate: 0.0875, ceiling: 69750 },
      { name: "Long-term care", rate: 0.018, ceiling: 69750 },
      { name: "Other levies", rate: 0.016 },
    ],
    employeeSocial: (g) => {
      return Math.min(g, 101400) * 0.093 + Math.min(g, 101400) * 0.013 +
             Math.min(g, 69750) * 0.0825 + Math.min(g, 69750) * 0.023;
    },
    incomeTax: (g, soc) => {
      const taxable = g - soc * 0.5;
      return progressiveTax(Math.max(taxable, 0), [
        [11784, 0], [17005, 0.14], [66760, 0.2397], [277825, 0.42], [Infinity, 0.45],
      ]);
    },
  },
  {
    name: "France", flag: "\u{1F1EB}\u{1F1F7}",
    employer: [
      { name: "Maladie", compute: (g) => g * (g <= 54060 ? 0.07 : 0.13) },
      { name: "Alloc. familiales", compute: (g) => g * (g <= 75684 ? 0.0345 : 0.0525) },
      { name: "Vieillesse plaf.", rate: 0.0855, ceiling: 47100 },
      { name: "Vieillesse d\u00E9plaf.", rate: 0.0202 },
      { name: "AT/MP", rate: 0.02 },
      { name: "Ch\u00F4mage", rate: 0.0405, ceiling: 188400 },
      { name: "AGS", rate: 0.002, ceiling: 188400 },
      { name: "AGIRC-ARRCO", compute: (g) => band(g, 0, 47100) * 0.0472 + band(g, 47100, 376800) * 0.1295 },
      { name: "CEG+CET", compute: (g) => band(g, 0, 47100) * 0.0129 + band(g, 47100, 376800) * 0.0183 },
      { name: "FNAL+Formation", rate: 0.0243 },
    ],
    employeeSocial: (g) => {
      return Math.min(g, 47100) * 0.069 + g * 0.004 + g * 0.9825 * 0.092 +
             band(g, 0, 47100) * 0.0315 + band(g, 47100, 376800) * 0.0864 +
             band(g, 0, 47100) * 0.0086 + band(g, 47100, 376800) * 0.0108;
    },
    incomeTax: (g, soc) => {
      const taxable = (g - soc) * 0.9;
      return progressiveTax(Math.max(taxable, 0), [
        [11294, 0], [28797, 0.11], [82341, 0.30], [177106, 0.41], [Infinity, 0.45],
      ]);
    },
  },
  {
    name: "Belgium", flag: "\u{1F1E7}\u{1F1EA}",
    employer: [
      { name: "ONSS/RSZ", compute: (g) => Math.min(g, 340000) * 0.2492 },
      { name: "Annual vacation", rate: 0.0618 },
      { name: "Other levies", rate: 0.035 },
    ],
    employeeSocial: (g) => g * 0.1307,
    incomeTax: (g, soc) => {
      const taxable = g - soc - 10570;
      return progressiveTax(Math.max(taxable, 0), [
        [15820, 0.25], [27920, 0.40], [48320, 0.45], [Infinity, 0.50],
      ]);
    },
  },
  {
    name: "Italy", flag: "\u{1F1EE}\u{1F1F9}",
    employer: [
      { name: "INPS pension", rate: 0.2381 },
      { name: "Sickness/maternity", rate: 0.0266 },
      { name: "NASpl", rate: 0.0161 },
      { name: "CUAF family", rate: 0.0068 },
      { name: "TFR", rate: 0.027 },
      { name: "INAIL", rate: 0.015 },
      { name: "Other funds", rate: 0.009 },
    ],
    employeeSocial: (g) => g * 0.0919,
    incomeTax: (g, soc) => {
      const taxable = g - soc;
      const tax = progressiveTax(Math.max(taxable, 0), [
        [28000, 0.23], [50000, 0.35], [Infinity, 0.43],
      ]);
      const credit = taxable <= 15000 ? 1955 : taxable <= 28000 ? 1910 * (28000 - taxable) / 13000 : taxable <= 50000 ? 1910 * (50000 - taxable) / 22000 : 0;
      return Math.max(0, tax - credit);
    },
  },
  {
    name: "Spain", flag: "\u{1F1EA}\u{1F1F8}",
    employer: [
      { name: "Common contingencies", rate: 0.236, ceiling: 68733 },
      { name: "Unemployment", rate: 0.055, ceiling: 68733 },
      { name: "FOGASA", rate: 0.002, ceiling: 68733 },
      { name: "Prof. training", rate: 0.006, ceiling: 68733 },
      { name: "Work accidents", rate: 0.015, ceiling: 68733 },
      { name: "MEI+Solidarity", compute: (g) => {
        const cap = 68733;
        return Math.min(g, cap) * 0.0075 + band(g, cap, cap * 1.1) * 0.0115 + band(g, cap * 1.1, cap * 1.5) * 0.0104 + Math.max(0, g - cap * 1.5) * 0.0122;
      }},
    ],
    employeeSocial: (g) => Math.min(g, 68733) * (0.047 + 0.0155 + 0.001 + 0.0075),
    incomeTax: (g, soc) => {
      const taxable = g - soc - 2000 - 5550;
      return progressiveTax(Math.max(taxable, 0), [
        [12450, 0.19], [20200, 0.24], [35200, 0.30], [60000, 0.37], [300000, 0.45], [Infinity, 0.47],
      ]);
    },
  },
  {
    name: "Austria", flag: "\u{1F1E6}\u{1F1F9}",
    employer: [
      { name: "Pension", rate: 0.1255, ceiling: 72720 },
      { name: "Health", rate: 0.0387, ceiling: 72720 },
      { name: "Accident", rate: 0.011, ceiling: 72720 },
      { name: "Unemployment", rate: 0.03, ceiling: 72720 },
      { name: "IESG", rate: 0.002, ceiling: 72720 },
      { name: "KommSt+DB+DZ", rate: 0.081 },
    ],
    employeeSocial: (g) => Math.min(g, 72720) * 0.1812,
    incomeTax: (g, soc) => {
      const taxable = g - soc;
      return progressiveTax(Math.max(taxable, 0), [
        [12816, 0], [20818, 0.20], [34513, 0.30], [66612, 0.40], [99266, 0.48], [1000000, 0.50], [Infinity, 0.55],
      ]);
    },
  },
  {
    name: "Netherlands", flag: "\u{1F1F3}\u{1F1F1}",
    employer: [
      { name: "ZVW (health)", rate: 0.065, ceiling: 71628 },
      { name: "WW-Awf", rate: 0.0264, ceiling: 71628 },
      { name: "WAO/WIA", rate: 0.074, ceiling: 71628 },
      { name: "Whk", rate: 0.015, ceiling: 71628 },
      { name: "Childcare levy", rate: 0.005, ceiling: 71628 },
      { name: "ZW-flex", rate: 0.01, ceiling: 71628 },
    ],
    employeeSocial: (g) => Math.min(g, 38441) * 0.1770 + Math.min(g, 71628) * 0.0055,
    incomeTax: (g, soc) => {
      const taxable = g - soc;
      return progressiveTax(Math.max(taxable, 0), [
        [38441, 0.0893], [75518, 0.3693], [Infinity, 0.495],
      ]);
    },
  },
  {
    name: "Sweden", flag: "\u{1F1F8}\u{1F1EA}",
    employer: [
      { name: "Old-age pension", rate: 0.1021 },
      { name: "Survivor pension", rate: 0.007 },
      { name: "Health insurance", rate: 0.0355 },
      { name: "Parental insurance", rate: 0.026 },
      { name: "Unemployment", rate: 0.0264 },
      { name: "Work injury", rate: 0.002 },
      { name: "General payroll tax", rate: 0.1152 },
    ],
    employeeSocial: (g) => g * 0.07,
    incomeTax: (g, soc) => {
      const taxable = g - soc - 16800;
      const municipal = Math.max(taxable, 0) * 0.32;
      const state = Math.max(taxable - 614000, 0) * 0.20;
      return municipal + state;
    },
  },
  {
    name: "Finland", flag: "\u{1F1EB}\u{1F1EE}",
    employer: [
      { name: "TyEL pension", rate: 0.173 },
      { name: "Unemployment low", rate: 0.0053, ceiling: 42102 },
      { name: "Unemployment high", rate: 0.021, floor: 42102 },
      { name: "Health (sava)", rate: 0.0163 },
      { name: "Accident ins.", rate: 0.008 },
      { name: "Group life", rate: 0.0006 },
    ],
    employeeSocial: (g) => g * (0.0715 + 0.014 + 0.018),
    incomeTax: (g, soc) => {
      const taxable = g - soc;
      const state = progressiveTax(Math.max(taxable, 0), [
        [20500, 0], [30500, 0.06], [50400, 0.1725], [88200, 0.2125], [150000, 0.3125], [Infinity, 0.44],
      ]);
      const municipal = Math.max(taxable - 4300, 0) * 0.0773;
      return state + municipal;
    },
  },
  {
    name: "Norway", flag: "\u{1F1F3}\u{1F1F4}",
    employer: [
      { name: "Employer levy", rate: 0.141 },
      { name: "Extra levy (high sal.)", compute: (g) => Math.max(0, g - 73000) * 0.05 },
    ],
    employeeSocial: (g) => g * 0.079,
    incomeTax: (g, soc) => {
      const taxable = g - soc - 5200;
      const ordinary = Math.max(taxable, 0) * 0.22;
      const bracket = progressiveTax(Math.max(g - 20800, 0), [
        [25700, 0.017], [41200, 0.04], [48200, 0.137], [120000, 0.166], [Infinity, 0.176],
      ]);
      return ordinary + bracket;
    },
  },
  {
    name: "Denmark", flag: "\u{1F1E9}\u{1F1F0}",
    employer: [
      { name: "ATP", compute: () => 310 },
      { name: "AUB/AES", compute: () => 385 },
      { name: "Barsel", compute: () => 181 },
      { name: "Work injury ins.", rate: 0.008 },
      { name: "Labour mkt pension", rate: 0.08 },
    ],
    employeeSocial: (g) => g * 0.08 + 145 + g * 0.004,
    incomeTax: (g, soc) => {
      const amBidrag = g * 0.08;
      const taxable = g - amBidrag - soc * 0.3 - 48000;
      const municipal = Math.max(taxable, 0) * 0.2482;
      const bottom = Math.max(taxable, 0) * 0.1204;
      const top = Math.max(taxable - 63700, 0) * 0.15;
      return amBidrag + municipal + bottom + top;
    },
  },
  {
    name: "Ireland", flag: "\u{1F1EE}\u{1F1EA}",
    employer: [
      { name: "Employer PRSI", compute: (g) => g * (g <= 22932 ? 0.088 : 0.1105) },
    ],
    employeeSocial: (g) => g * 0.04 + Math.max(0, g - 352 * 52) * 0.004,
    incomeTax: (g, soc) => {
      const taxable = g - soc - 1875;
      const tax = progressiveTax(Math.max(taxable, 0), [
        [42000, 0.20], [Infinity, 0.40],
      ]);
      const usc = progressiveTax(g, [
        [12012, 0.005], [25760, 0.02], [70044, 0.04], [Infinity, 0.08],
      ]);
      return Math.max(0, tax - 3750) + usc;
    },
  },
  {
    name: "UK", flag: "\u{1F1EC}\u{1F1E7}",
    employer: [
      { name: "Employer NIC", compute: (g) => Math.max(0, g - 5900) * 0.15 },
      { name: "Apprenticeship levy", compute: (g) => g >= 100000 ? g * 0.005 : 0 },
    ],
    employeeSocial: (g) => {
      return Math.max(0, band(g, 12570 * 1.18, 50270 * 1.18) * 0.08 + Math.max(0, g - 50270 * 1.18) * 0.02);
    },
    incomeTax: (g, soc) => {
      const allowance = g > 125140 * 1.18 ? 0 : 14840;
      const taxable = Math.max(g - allowance, 0);
      return progressiveTax(taxable, [
        [37700 * 1.18, 0.20], [125140 * 1.18, 0.40], [Infinity, 0.45],
      ]);
    },
  },
  {
    name: "Switzerland", flag: "\u{1F1E8}\u{1F1ED}",
    employer: [
      { name: "AHV/IV/EO", rate: 0.053 },
      { name: "ALV", rate: 0.011, ceiling: 157000 },
      { name: "ALV solidarity", compute: (g) => Math.max(0, g - 157000) * 0.005 },
      { name: "BVG", compute: (g) => Math.max(0, Math.min(g, 90000) - 26000) * 0.075 },
      { name: "UVG", rate: 0.008 },
      { name: "FAK", rate: 0.02 },
      { name: "Admin", rate: 0.003 },
    ],
    employeeSocial: (g) => {
      return g * 0.053 + Math.min(g, 157000) * 0.011 + Math.max(0, g - 157000) * 0.005 +
             Math.max(0, Math.min(g, 90000) - 26000) * 0.075;
    },
    incomeTax: (g, soc) => {
      const taxable = g - soc - 6500;
      const fed = progressiveTax(Math.max(taxable, 0), [
        [18800, 0], [31600, 0.0077], [41400, 0.0088], [55200, 0.028], [72500, 0.0506],
        [78100, 0.0611], [103600, 0.0722], [134600, 0.0833], [176000, 0.0944],
        [755200, 0.1050], [Infinity, 0.115],
      ]);
      const cantonal = Math.max(taxable, 0) * 0.08;
      return fed + cantonal;
    },
  },
  {
    name: "Poland", flag: "\u{1F1F5}\u{1F1F1}",
    employer: [
      { name: "Pension", rate: 0.0976, ceiling: 62600 },
      { name: "Disability", rate: 0.065, ceiling: 62600 },
      { name: "Accident", rate: 0.0167 },
      { name: "Labour Fund", rate: 0.0245 },
      { name: "FG\u015AP", rate: 0.001 },
    ],
    employeeSocial: (g) => {
      const pen = Math.min(g, 62600) * 0.0976;
      const dis = Math.min(g, 62600) * 0.015;
      const sick = g * 0.0245;
      const health = (g - pen - dis - sick) * 0.09;
      return pen + dis + sick + health;
    },
    incomeTax: (g, soc) => {
      const taxable = g - soc - 30000;
      return progressiveTax(Math.max(taxable, 0), [
        [120000, 0.12], [Infinity, 0.32],
      ]);
    },
  },
  {
    name: "Czech Republic", flag: "\u{1F1E8}\u{1F1FF}",
    employer: [
      { name: "Pension ins.", rate: 0.217, ceiling: 90000 },
      { name: "Sickness ins.", rate: 0.0114, ceiling: 90000 },
      { name: "Unemployment", rate: 0.012, ceiling: 90000 },
      { name: "Health ins.", rate: 0.09 },
    ],
    employeeSocial: (g) => Math.min(g, 90000) * 0.071 + g * 0.045,
    incomeTax: (g, soc) => {
      const taxable = g - 30840;
      return progressiveTax(Math.max(taxable, 0), [
        [50300, 0.15], [Infinity, 0.23],
      ]);
    },
  },
  {
    name: "Portugal", flag: "\u{1F1F5}\u{1F1F9}",
    employer: [
      { name: "TSU", rate: 0.2375 },
      { name: "MEI", rate: 0.0075 },
      { name: "Work accident", rate: 0.01 },
    ],
    employeeSocial: (g) => g * 0.11,
    incomeTax: (g, soc) => {
      const taxable = g - soc - 4104;
      return progressiveTax(Math.max(taxable, 0), [
        [7703, 0.13], [11623, 0.18], [16472, 0.23], [21321, 0.26],
        [27146, 0.3275], [39791, 0.37], [51997, 0.435], [81199, 0.45], [Infinity, 0.48],
      ]);
    },
  },
  {
    name: "Greece", flag: "\u{1F1EC}\u{1F1F7}",
    employer: [
      { name: "Main pension", rate: 0.1333, ceiling: 85518 },
      { name: "Suppl. pension", rate: 0.0325, ceiling: 85518 },
      { name: "Sickness", rate: 0.0487, ceiling: 85518 },
      { name: "Unemployment", rate: 0.0029, ceiling: 85518 },
      { name: "Other EFKA", rate: 0.007, ceiling: 85518 },
    ],
    employeeSocial: (g) => Math.min(g, 85518) * 0.1387,
    incomeTax: (g, soc) => {
      const taxable = g - soc;
      return progressiveTax(Math.max(taxable, 0), [
        [10000, 0.09], [20000, 0.22], [30000, 0.28], [40000, 0.36], [Infinity, 0.44],
      ]);
    },
  },
  {
    name: "Romania", flag: "\u{1F1F7}\u{1F1F4}",
    employer: [
      { name: "CAM", rate: 0.0225 },
    ],
    employeeSocial: (g) => g * 0.25 + g * 0.10,
    incomeTax: (g, soc) => {
      return Math.max(g - soc, 0) * 0.10;
    },
  },
  {
    name: "Hungary", flag: "\u{1F1ED}\u{1F1FA}",
    employer: [
      { name: "SZOCHO", rate: 0.13 },
      { name: "Vocational training", rate: 0.015 },
    ],
    employeeSocial: (g) => g * 0.185,
    incomeTax: (g) => g * 0.15,
  },
];

export default function EmployerCostCalculator() {
  const [gross, setGross] = useState(60000);
  const [sortKey, setSortKey] = useState("totalCost");
  const [sortDir, setSortDir] = useState("desc");
  const [expanded, setExpanded] = useState(null);

  const data = useMemo(() => {
    return COUNTRIES.map((c) => {
      const employerBreakdown = c.employer.map((comp) => ({ ...comp, amount: calcComp(comp, gross) }));
      const employerTotal = employerBreakdown.reduce((s, b) => s + b.amount, 0);
      const totalCost = gross + employerTotal;
      const employerRate = gross > 0 ? employerTotal / gross : 0;
      const empSocial = c.employeeSocial(gross);
      const incomeTax = c.incomeTax(gross, empSocial);
      const totalDeductions = empSocial + incomeTax;
      const takeHome = gross - totalDeductions;
      const takeHomeRate = gross > 0 ? takeHome / gross : 0;
      return {
        ...c, employerBreakdown, employerTotal, totalCost, employerRate,
        empSocial, incomeTax, totalDeductions, takeHome, takeHomeRate,
      };
    }).sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "name") return mul * a.name.localeCompare(b.name);
      return mul * (a[sortKey] - b[sortKey]);
    });
  }, [gross, sortKey, sortDir]);

  const maxCost = useMemo(() => Math.max(...data.map((d) => d.totalCost)), [data]);

  const toggleSort = useCallback((key) => {
    setSortKey((prev) => {
      if (prev === key) { setSortDir((d) => d === "asc" ? "desc" : "asc"); return key; }
      setSortDir("desc");
      return key;
    });
  }, []);

  const arrow = (key) => sortKey === key ? (sortDir === "asc" ? " \u2191" : " \u2193") : "";

  const thStyle = (key) => ({
    padding: "11px 10px", textAlign: key === "name" ? "left" : "right",
    fontWeight: 600, fontSize: 10.5, letterSpacing: "0.3px", whiteSpace: "nowrap",
    color: sortKey === key ? "#5046e5" : "#666",
    cursor: "pointer", userSelect: "none",
    borderBottom: "2px solid #e2e2ef",
  });

  const mono = { fontFamily: "'JetBrains Mono', monospace", fontSize: 12 };

  return (
    <div style={{
      fontFamily: "'DM Sans', 'S\u00F6hne', system-ui, sans-serif",
      maxWidth: 980, margin: "0 auto", padding: "24px 10px",
      color: "#1a1a2e", lineHeight: 1.5,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #5046e5; cursor: pointer; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.2); margin-top: -6px; }
        input[type=range]::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #5046e5; cursor: pointer; border: 2px solid #fff; }
        tr.rh:hover { background: rgba(80,70,229,0.04) !important; }
      `}</style>

      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>
        Employment Cost & Take-Home Pay
        <span style={{ color: "#5046e5" }}> {"\u2014"} Europe</span>
      </h1>
      <p style={{ fontSize: 12, color: "#888", margin: "6px 0 20px", maxWidth: 720 }}>
        Full picture: what the employer pays on top of gross salary, and what the employee actually takes home after social contributions and income tax. Click any row for a detailed breakdown.
      </p>

      {/* SLIDER */}
      <div style={{
        background: "linear-gradient(135deg, #eef0ff 0%, #e6f3fc 100%)",
        borderRadius: 14, padding: "18px 22px 16px", marginBottom: 20,
        border: "1px solid rgba(80,70,229,0.1)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "#555" }}>Annual Gross Salary</label>
          <span style={{ ...mono, fontSize: 28, fontWeight: 700, color: "#5046e5", letterSpacing: "-1.5px" }}>
            {fmt(gross)}
          </span>
        </div>
        <input type="range" min={15000} max={250000} step={500} value={gross}
          onChange={(e) => setGross(Number(e.target.value))}
          style={{
            width: "100%", height: 6, appearance: "none", WebkitAppearance: "none",
            background: `linear-gradient(to right, #5046e5 ${((gross - 15000) / 235000) * 100}%, #d0cdf5 ${((gross - 15000) / 235000) * 100}%)`,
            borderRadius: 3, outline: "none", cursor: "pointer",
          }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#aaa", marginTop: 3 }}>
          <span>{"\u20AC"}15,000</span><span>{"\u20AC"}250,000</span>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e2e2ef" }}>
        <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 720 }}>
          <thead>
            <tr style={{ background: "#f8f8ff" }}>
              <th onClick={() => toggleSort("name")} style={thStyle("name")}>Country{arrow("name")}</th>
              <th onClick={() => toggleSort("employerRate")} style={thStyle("employerRate")}>Employer %{arrow("employerRate")}</th>
              <th onClick={() => toggleSort("totalCost")} style={thStyle("totalCost")}>Total Employer Cost{arrow("totalCost")}</th>
              <th onClick={() => toggleSort("totalDeductions")} style={{ ...thStyle("totalDeductions"), borderLeft: "2px solid #f0eeff" }}>
                Employee Deductions{arrow("totalDeductions")}
              </th>
              <th onClick={() => toggleSort("takeHome")} style={{ ...thStyle("takeHome"), background: "rgba(39,174,96,0.04)", borderLeft: "2px solid #e0f5e9" }}>
                Take-Home Pay{arrow("takeHome")}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const isOpen = expanded === row.name;
              const barW = (row.totalCost / maxCost) * 100;
              const netPct = Math.max(row.takeHomeRate, 0);
              const netColor = netPct >= 0.7 ? "#27ae60" : netPct >= 0.55 ? "#e67e22" : "#c0392b";
              return [
                <tr key={row.name} className="rh"
                  onClick={() => setExpanded(isOpen ? null : row.name)}
                  style={{
                    background: isOpen ? "rgba(80,70,229,0.04)" : i % 2 === 0 ? "#fff" : "#fafaff",
                    cursor: "pointer", transition: "background 0.1s",
                  }}
                >
                  <td style={{ padding: "9px 10px", borderBottom: "1px solid #f0f0f5" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 17 }}>{row.flag}</span>
                      <div>
                        <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                          {row.name}
                          <span style={{ fontSize: 9, color: "#bbb" }}>{isOpen ? "\u25B2" : "\u25BC"}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: "9px 10px", textAlign: "right", borderBottom: "1px solid #f0f0f5", ...mono,
                    color: row.employerRate > 0.35 ? "#c0392b" : row.employerRate > 0.2 ? "#e67e22" : "#27ae60",
                    fontWeight: 600,
                  }}>
                    {fmtPct(row.employerRate)}
                  </td>

                  <td style={{ padding: "9px 10px", textAlign: "right", borderBottom: "1px solid #f0f0f5", position: "relative", minWidth: 130 }}>
                    <div style={{
                      position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                      height: 24, width: `${barW}%`,
                      background: `linear-gradient(90deg, rgba(80,70,229,0.04), rgba(80,70,229,${0.06 + barW / 900}))`,
                      borderRadius: 4, transition: "width 0.25s",
                    }} />
                    <span style={{ position: "relative", ...mono, fontWeight: 700, fontSize: 12.5, color: "#1a1a2e" }}>
                      {fmt(row.totalCost)}
                    </span>
                    <div style={{ position: "relative", ...mono, fontSize: 9.5, color: "#c0392b", fontWeight: 500 }}>
                      +{fmt(row.employerTotal)}
                    </div>
                  </td>

                  <td style={{ padding: "9px 10px", textAlign: "right", borderBottom: "1px solid #f0f0f5", borderLeft: "2px solid #f0eeff" }}>
                    <span style={{ ...mono, fontSize: 12, color: "#c0392b" }}>
                      {"\u2212"}{fmt(row.totalDeductions)}
                    </span>
                    <div style={{ ...mono, fontSize: 9.5, color: "#999" }}>
                      {fmtPct(gross > 0 ? row.totalDeductions / gross : 0)}
                    </div>
                  </td>

                  <td style={{ padding: "9px 10px", textAlign: "right", borderBottom: "1px solid #f0f0f5", borderLeft: "2px solid #e0f5e9", background: isOpen ? "rgba(39,174,96,0.02)" : "rgba(39,174,96,0.015)" }}>
                    <span style={{ ...mono, fontSize: 13, fontWeight: 700, color: netColor }}>
                      {fmt(Math.max(row.takeHome, 0))}
                    </span>
                    <div style={{ ...mono, fontSize: 9.5, color: netColor, fontWeight: 500 }}>
                      {fmtPct(netPct)}
                    </div>
                  </td>
                </tr>,

                isOpen && (
                  <tr key={row.name + "-exp"}>
                    <td colSpan={5} style={{ padding: 0, borderBottom: "2px solid #e2e2ef" }}>
                      <div style={{ background: "rgba(80,70,229,0.02)", padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                          {/* Employer */}
                          <div style={{ flex: 1, minWidth: 240 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#5046e5", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              Employer Contributions
                            </div>
                            {row.employerBreakdown.map((b, j) => (
                              <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", fontSize: 12 }}>
                                <span style={{ color: "#555" }}>{b.name}</span>
                                <span style={{ ...mono, fontSize: 11.5, color: "#333", fontWeight: 500 }}>{fmt(b.amount)}</span>
                              </div>
                            ))}
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 0", fontSize: 12, fontWeight: 700, borderTop: "2px solid rgba(80,70,229,0.12)", marginTop: 4 }}>
                              <span>Total employer add-on</span>
                              <span style={{ ...mono, color: "#c0392b" }}>+{fmt(row.employerTotal)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0 0", fontSize: 13, fontWeight: 700 }}>
                              <span>Total cost to employer</span>
                              <span style={{ ...mono, color: "#1a1a2e" }}>{fmt(row.totalCost)}</span>
                            </div>
                          </div>

                          {/* Employee */}
                          <div style={{ flex: 1, minWidth: 240 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#27ae60", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              Employee Deductions
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", fontSize: 12 }}>
                              <span style={{ color: "#555" }}>Social contributions</span>
                              <span style={{ ...mono, fontSize: 11.5, color: "#333", fontWeight: 500 }}>{fmt(row.empSocial)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", fontSize: 12 }}>
                              <span style={{ color: "#555" }}>Income tax (est.)</span>
                              <span style={{ ...mono, fontSize: 11.5, color: "#333", fontWeight: 500 }}>{fmt(row.incomeTax)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 0", fontSize: 12, fontWeight: 700, borderTop: "2px solid rgba(192,57,43,0.15)", marginTop: 4 }}>
                              <span>Total deducted</span>
                              <span style={{ ...mono, color: "#c0392b" }}>{"\u2212"}{fmt(row.totalDeductions)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0 0", fontSize: 13, fontWeight: 700 }}>
                              <span style={{ color: "#27ae60" }}>Take-home pay</span>
                              <span style={{ ...mono, color: "#27ae60", fontSize: 14 }}>{fmt(Math.max(row.takeHome, 0))}</span>
                            </div>
                          </div>

                          {/* Bar */}
                          <div style={{ flex: 0.55, minWidth: 150, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
                            <div style={{ fontSize: 10, color: "#999", textAlign: "center", marginBottom: 4 }}>Gross salary breakdown</div>
                            <div style={{ height: 20, borderRadius: 10, overflow: "hidden", display: "flex", background: "#eee" }}>
                              <div style={{ width: `${netPct * 100}%`, background: "linear-gradient(90deg, #27ae60, #2ecc71)", transition: "width 0.3s" }} />
                              <div style={{ width: `${(row.empSocial / gross) * 100}%`, background: "#e67e22", transition: "width 0.3s" }} />
                              <div style={{ width: `${(Math.max(row.incomeTax, 0) / gross) * 100}%`, background: "#c0392b", transition: "width 0.3s" }} />
                            </div>
                            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 2 }}>
                              <span style={{ fontSize: 9, color: "#27ae60" }}>{"\u25CF"} Net {fmtPct(netPct)}</span>
                              <span style={{ fontSize: 9, color: "#e67e22" }}>{"\u25CF"} Social {fmtPct(row.empSocial / gross)}</span>
                              <span style={{ fontSize: 9, color: "#c0392b" }}>{"\u25CF"} Tax {fmtPct(Math.max(row.incomeTax, 0) / gross)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ),
              ];
            })}
          </tbody>
        </table>
        </div>
      </div>

      <div style={{
        marginTop: 14, padding: "10px 14px", background: "#fafaff",
        borderRadius: 8, fontSize: 10, color: "#999", lineHeight: 1.7,
        border: "1px solid #f0f0f5",
      }}>
        <strong style={{ color: "#777" }}>Disclaimer:</strong> Income tax uses simplified progressive brackets for a single filer with no dependents or special deductions. Actual take-home varies with filing status, local taxes, tax credits, collective agreements, and country-specific rules. Employee social contributions use standard rates with applicable ceilings. Non-EUR amounts converted at approximate rates (GBP 1 {"\u2248"} {"\u20AC"}1.18, CHF 1 {"\u2248"} {"\u20AC"}0.95). For comparison purposes only {"\u2014"} consult a local tax advisor for precise figures.
      </div>
    </div>
  );
}
