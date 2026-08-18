import { COLORS, FONT_DISPLAY } from '../theme.js';

export function PlateIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill={COLORS.accentSoft} />
      <circle cx="32" cy="32" r="30" stroke={COLORS.accent} strokeWidth="1.5" opacity="0.5" />
      <path d="M32 8 A24 24 0 0 1 52.78 44 L32 32 Z" fill={COLORS.primary} />
      <path d="M32 8 A24 24 0 0 0 11.22 44 L32 32 Z" fill={COLORS.accent} />
      <path d="M11.22 44 A24 24 0 0 0 52.78 44 L32 32 Z" fill={COLORS.warn} />
      <circle cx="32" cy="32" r="8" fill={COLORS.panel} />
      <circle cx="32" cy="32" r="8" stroke={COLORS.line} strokeWidth="1" />
    </svg>
  );
}
export function Pill({ tone = "neutral", children }) {
  const tones = {
    neutral: { bg: COLORS.line, fg: COLORS.inkSoft },
    good: { bg: COLORS.goodSoft, fg: COLORS.good },
    warn: { bg: COLORS.warnSoft, fg: COLORS.warn },
    gold: { bg: "#F3EBD3", fg: COLORS.gold },
  };
  const t = tones[tone];
  return (
    <span
      style={{
        background: t.bg,
        color: t.fg,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.3,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
export function Card({ children, style, className }) {
  return (
    <div
      className={`card-pad${className ? " " + className : ""}`}
      style={{
        background: COLORS.panel,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 16,
        padding: 22,
        boxShadow: "0 2px 10px rgba(32, 48, 31, 0.05)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
export function SectionTitle({ icon, children }) {
  return (
    <h2 style={{ margin: "0 0 18px", fontSize: 19, display: "flex", alignItems: "center", gap: 10, fontFamily: FONT_DISPLAY, fontWeight: 600, color: COLORS.primaryDark }}>
      {icon && <span style={{ fontSize: 22 }}>{icon}</span>}
      {children}
    </h2>
  );
}
export function FormSection({ icon, title, color, children }) {
  return (
    <div style={{ borderLeft: `4px solid ${color}`, background: `${color}0d`, borderRadius: "0 10px 10px 0", padding: "14px 16px", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
export function Field({ label, children, hint }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 }}>
        {label}
      </div>
      {children}
      {hint && <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 4 }}>{hint}</div>}
    </label>
  );
}
export const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1.5px solid ${COLORS.line}`,
  fontSize: 14.5,
  background: COLORS.panelAlt,
  color: COLORS.ink,
  boxSizing: "border-box",
  fontFamily: "inherit",
};
export function Btn({ children, onClick, variant = "primary", disabled, type = "button", small }) {
  const styles = {
    primary: { background: COLORS.primary, color: "#fff", border: "none", boxShadow: "0 2px 8px rgba(44, 107, 74, 0.28)" },
    secondary: { background: "#fff", color: COLORS.primary, border: `1.5px solid ${COLORS.primary}` },
    danger: { background: "#fff", color: COLORS.warn, border: `1.5px solid ${COLORS.warn}` },
    ghost: { background: "transparent", color: COLORS.inkSoft, border: `1px solid transparent` },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        padding: small ? "6px 12px" : "10px 20px",
        borderRadius: 10,
        fontSize: small ? 13 : 14.5,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}
export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: `2px solid ${COLORS.line}`, marginBottom: 22, flexWrap: "wrap" }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            padding: "10px 16px",
            border: "none",
            background: "transparent",
            fontFamily: "inherit",
            fontSize: 14,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: active === t.key ? COLORS.primary : COLORS.inkSoft,
            borderBottom: active === t.key ? `3px solid ${COLORS.primary}` : "3px solid transparent",
            cursor: "pointer",
            marginBottom: -2,
          }}
        >
          {t.icon && <span>{t.icon}</span>}
          {t.label}
        </button>
      ))}
    </div>
  );
}
export function ItemChecklist({ insumos, selecionados, onToggle }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {insumos.map((ins) => {
        const marcado = selecionados.includes(ins.id);
        return (
          <label
            key={ins.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 14px",
              borderRadius: 10,
              border: `1.5px solid ${marcado ? COLORS.primary : COLORS.line}`,
              background: marcado ? COLORS.primarySoft : "#fff",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            <input type="checkbox" checked={marcado} onChange={() => onToggle(ins.id)} />
            {ins.nome}
          </label>
        );
      })}
    </div>
  );
}
export function ChipInsumo({ label, tone, upper }) {
  const tones = {
    match: { bg: COLORS.goodSoft, fg: COLORS.good, border: COLORS.good, prefixo: "✓" },
    falta: { bg: COLORS.warnSoft, fg: COLORS.warn, border: COLORS.warn, prefixo: "✗" },
    extra: { bg: COLORS.accentSoft, fg: "#8A5A0A", border: COLORS.accent, prefixo: "+" },
  };
  const t = tones[tone];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999,
        fontSize: 13, fontWeight: 600, background: t.bg, color: t.fg, border: `1.3px solid ${t.border}`,
        textTransform: upper ? "uppercase" : "none", letterSpacing: upper ? 0.3 : 0,
      }}
    >
      <span style={{ fontWeight: 800 }}>{t.prefixo}</span> {label}
    </span>
  );
}
export function InfoBadge({ label, value, color }) {
  return (
    <div
      style={{
        background: COLORS.panelAlt, border: `1px solid ${COLORS.line}`, borderLeft: `3px solid ${color}`,
        borderRadius: 8, padding: "7px 14px", minWidth: 96,
      }}
    >
      <div style={{ fontSize: 10.5, fontWeight: 800, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 15.5, fontWeight: 800, color: COLORS.ink, fontFamily: FONT_DISPLAY }}>{value}</div>
    </div>
  );
}
export function BarChartH({ data, formatValue }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const fmt = formatValue || ((v) => v);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.map((d, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4, color: COLORS.ink }}>
            <span>{d.label}</span>
            <span style={{ fontWeight: 700 }}>{fmt(d.value)}</span>
          </div>
          <div style={{ background: COLORS.line, borderRadius: 7, height: 11, overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.max(3, (d.value / max) * 100)}%`,
                background: d.color || COLORS.primary,
                height: "100%",
                borderRadius: 7,
              }}
            />
          </div>
        </div>
      ))}
      {data.length === 0 && <div style={{ fontSize: 13, color: COLORS.inkSoft }}>Sem dados suficientes ainda.</div>}
    </div>
  );
}
export function DonutChart({ data, size = 140 }) {
  const totalReal = data.reduce((s, d) => s + d.value, 0);
  const totalParaCalculo = totalReal || 1;
  let acc = 0;
  const stops = data.map((d) => {
    const start = (acc / totalParaCalculo) * 360;
    acc += d.value;
    const end = (acc / totalParaCalculo) * 360;
    return `${d.color} ${start}deg ${end}deg`;
  });
  const gradient = totalReal > 0 ? `conic-gradient(${stops.join(", ")})` : COLORS.line;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ width: size * 0.62, height: size * 0.62, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.ink, fontFamily: FONT_DISPLAY }}>{totalReal}</div>
          <div style={{ fontSize: 10.5, color: COLORS.inkSoft, textTransform: "uppercase" }}>total</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, display: "inline-block" }} />
            {d.label} <strong>({d.value})</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
export function BellIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3a5 5 0 00-5 5v3.2c0 .6-.2 1.2-.6 1.7L5 15h14l-1.4-2.1c-.4-.5-.6-1.1-.6-1.7V8a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9.5 18a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
export function HamburgerIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
export function UserIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 19.5c1.4-3.4 4.2-5.2 7.5-5.2s6.1 1.8 7.5 5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
export function CameraIcon({ size = 26, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 8.5A1.5 1.5 0 015.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0120 8.5v9A1.5 1.5 0 0118.5 19h-13A1.5 1.5 0 014 17.5v-9z" stroke={color || "currentColor"} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.4" stroke={color || "currentColor"} strokeWidth="1.6" />
    </svg>
  );
}
export function ChevronIcon({ direction = "left" }) {
  const d = direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6";
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={d} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
