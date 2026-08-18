import { useState } from 'react';
import { COLORS, FONT_DISPLAY } from '../theme.js';
import { fmtDataHora } from '../utils.js';
import { PlateIcon, BellIcon, HamburgerIcon, UserIcon, ChevronIcon, Btn } from './ui.jsx';

export const NAV_NUTRICIONISTA = [
  { key: "dashboard", label: "Painel", icon: "🥗" },
  { key: "pendencias", label: "Pendências", icon: "📋" },
  { key: "cadastros", label: "Cadastros", icon: "🗂️" },
  { key: "relatorios", label: "Relatórios", icon: "📑" },
  { key: "fechamento", label: "Fechamento de mês", icon: "🔒" },
  { key: "historico", label: "Histórico", icon: "🕓" },
];
export const NAV_ESCOLA = [
  { key: "novo", label: "Novo lançamento", icon: "🍽️" },
  { key: "historico", label: "Meus lançamentos", icon: "📖" },
];
export function AppStyles() {
  return (
    <style>{`
      html { -webkit-text-size-adjust: 100%; }
      .lancamento-grid { grid-template-columns: 1.3fr 1fr; }
      .form-fields-grid { grid-template-columns: 1fr 1fr; }
      .cadastro-grid { grid-template-columns: 1fr 1.3fr; }
      .compare-grid { grid-template-columns: 1fr 1fr; }
      .filtro-grid { grid-template-columns: 1fr 1fr 1fr 1fr; }
      .header-inner { flex-direction: row; align-items: center; }
      .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .table-scroll table { min-width: 560px; }

      @keyframes campoPendente {
        0%, 100% { box-shadow: 0 0 0 0 rgba(217,143,19,0); border-color: ${COLORS.line}; }
        50% { box-shadow: 0 0 0 4px rgba(217,143,19,0.38); border-color: ${COLORS.accent}; }
      }
      .campo-pendente { animation: campoPendente 1.5s ease-in-out infinite; border-radius: 10px; }
      .campo-pendente-caixa { animation: campoPendente 1.5s ease-in-out infinite; border-radius: 12px; padding: 8px; border: 1px solid transparent; }

      .app-shell { display: flex; align-items: stretch; min-height: calc(100vh - 58px); }
      .sidebar {
        background: #fff; border-right: 1px solid ${COLORS.line}; width: 246px; flex-shrink: 0;
        padding: 18px 12px; box-sizing: border-box;
      }
      .sidebar-nav-label { display: inline; }
      .sidebar-overlay { display: none; }
      .shell-content { flex: 1; min-width: 0; padding: 24px 22px 60px; box-sizing: border-box; }
      .shell-content-inner { max-width: 1100px; margin: 0 auto; }

      @media (min-width: 881px) {
        .sidebar { position: sticky; top: 58px; height: calc(100vh - 58px); overflow-y: auto; transition: width 0.2s ease; }
        .app-shell.colapsada .sidebar { width: 66px; padding-left: 8px; padding-right: 8px; }
        .app-shell.colapsada .sidebar-nav-label { display: none; }
        .app-shell.colapsada .sidebar-nav-btn { justify-content: center; }
      }

      @media (max-width: 900px) {
        .cadastro-grid { grid-template-columns: 1fr !important; }
        .filtro-grid { grid-template-columns: 1fr 1fr !important; }
      }
      @media (max-width: 880px) {
        .sidebar {
          position: fixed; top: 0; left: 0; height: 100vh; width: 258px; z-index: 60;
          transform: translateX(-100%); transition: transform 0.25s ease; box-shadow: 8px 0 24px rgba(0,0,0,0.15);
        }
        .sidebar.aberta { transform: translateX(0); }
        .sidebar-overlay.aberta { display: block; position: fixed; inset: 0; background: rgba(20,30,20,0.45); z-index: 55; }
        .shell-content { padding: 18px 16px 60px; }
      }
      @media (max-width: 720px) {
        .lancamento-grid { grid-template-columns: 1fr !important; }
      }
      @media (max-width: 560px) {
        .form-fields-grid { grid-template-columns: 1fr !important; }
        .filtro-grid { grid-template-columns: 1fr !important; }
        .compare-grid { grid-template-columns: 1fr !important; }
        .header-inner { flex-direction: column !important; align-items: flex-start !important; gap: 10px; }
        .stat-row { flex-direction: column !important; }
        .topbar-user-info { display: none !important; }
      }
      @media (max-width: 600px) {
        input, select, textarea, button { font-size: 16px !important; }
        .card-pad { padding: 16px !important; }
      }
      @media (max-width: 680px) {
        .login-illustration { display: none; }
      }
    `}</style>
  );
}
export function TopBar({ usuario, acesso, escola, db, setDb, onSair, onToggleSidebar }) {
  const [abrirNotif, setAbrirNotif] = useState(false);
  const escolaLogada = escola ? escola.id : null;

  const minhasNotificacoes = db.notificacoes
    .filter((n) => (acesso === "nutricionista" ? n.destinatario === "nutricionista" : n.destinatario === escolaLogada || n.destinatario === "todas_escolas"))
    .slice(0, 25);
  const naoLidas = minhasNotificacoes.filter((n) => !n.lida).length;

  function abrirPainel() {
    setAbrirNotif((v) => !v);
    if (!abrirNotif && naoLidas > 0) {
      const idsVisiveis = new Set(minhasNotificacoes.map((n) => n.id));
      setDb((prev) => ({ ...prev, notificacoes: prev.notificacoes.map((n) => (idsVisiveis.has(n.id) ? { ...n, lida: true } : n)) }));
    }
  }

  return (
    <div style={{ background: COLORS.primaryDark, color: "#fff", padding: "10px 16px", position: "sticky", top: 0, zIndex: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onToggleSidebar}
            style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, width: 36, height: 36, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <HamburgerIcon />
          </button>
          <PlateIcon size={30} />
          <div style={{ fontWeight: 700, fontSize: 15.5, letterSpacing: 0.2, fontFamily: FONT_DISPLAY }}>Alimentação Escolar · SEME</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <button
              onClick={abrirPainel}
              style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 9, width: 36, height: 36, color: "#fff", cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <BellIcon />
              {naoLidas > 0 && (
                <span style={{ position: "absolute", top: -3, right: -3, background: COLORS.warn, color: "#fff", fontSize: 10.5, fontWeight: 800, borderRadius: 999, minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                  {naoLidas}
                </span>
              )}
            </button>
            {abrirNotif && (
              <div style={{ position: "absolute", right: 0, top: 46, width: 320, maxWidth: "85vw", maxHeight: 360, overflowY: "auto", background: "#fff", borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.25)", zIndex: 45 }}>
                <div style={{ padding: "12px 14px", borderBottom: `1px solid ${COLORS.line}`, fontWeight: 700, color: COLORS.ink, fontSize: 13.5 }}>Notificações</div>
                {minhasNotificacoes.length === 0 && <div style={{ padding: 16, color: COLORS.inkSoft, fontSize: 13 }}>Nenhuma notificação ainda.</div>}
                {minhasNotificacoes.map((n) => (
                  <div key={n.id} style={{ padding: "10px 14px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 13, color: COLORS.ink }}>
                    <div>{n.mensagem}</div>
                    <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 3 }}>{fmtDataHora(n.data)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="topbar-user-info" style={{ textAlign: "right", lineHeight: 1.25 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{usuario.nomeCompleto}</div>
            <div style={{ fontSize: 11, opacity: 0.75 }}>{acesso === "nutricionista" ? "Nutricionista/Administrador" : (usuario.cargo || "Escola")}</div>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <UserIcon />
          </div>
          <Btn variant="ghost" onClick={onSair}>
            <span style={{ color: "#fff" }}>Sair</span>
          </Btn>
        </div>
      </div>
    </div>
  );
}
export function Sidebar({ aberta, colapsada, contexto, navItems, activeKey, onNavigate }) {
  return (
    <div className={`sidebar${aberta ? " aberta" : ""}`}>
      {contexto && (
        <div className="sidebar-nav-label" style={{ fontSize: 11, fontWeight: 800, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 16, padding: "0 8px" }}>
          {contexto}
        </div>
      )}
      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {navItems.map((item) => {
          const ativo = activeKey === item.key;
          return (
            <button
              key={item.key}
              className="sidebar-nav-btn"
              title={item.label}
              onClick={() => onNavigate(item.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                background: ativo ? COLORS.primary : "transparent",
                color: ativo ? "#fff" : COLORS.ink,
                fontWeight: ativo ? 700 : 600,
                fontSize: 14,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
              }}
            >
              <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
export function PageHeader({ icon, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 26, paddingBottom: 18, borderBottom: `2px solid ${COLORS.primarySoft}` }}>
      <div
        style={{
          width: 46, height: 46, borderRadius: 13, flexShrink: 0,
          background: `linear-gradient(155deg, ${COLORS.accentSoft}, ${COLORS.primarySoft})`,
          border: `1.5px solid ${COLORS.line}`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23,
        }}
      >
        {icon}
      </div>
      <h1 style={{ margin: 0, fontSize: 25, fontFamily: FONT_DISPLAY, fontWeight: 700, color: COLORS.primaryDark }}>{title}</h1>
    </div>
  );
}
export function AppShell({ usuario, db, setDb, acesso, escolaLogada, navItems, activeKey, onNavigate, onSair, children }) {
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [sidebarColapsada, setSidebarColapsada] = useState(false);
  const escola = db.escolas.find((e) => e.id === escolaLogada);
  const contexto = acesso === "nutricionista" ? "Secretaria de Educação" : (escola ? escola.nome : "");
  const itemAtivo = navItems.find((n) => n.key === activeKey);

  function alternarMenu() {
    if (typeof window !== "undefined" && window.innerWidth <= 880) {
      setSidebarAberta((v) => !v);
    } else {
      setSidebarColapsada((v) => !v);
    }
  }

  return (
    <div>
      <TopBar
        usuario={usuario}
        acesso={acesso}
        escola={escola}
        db={db}
        setDb={setDb}
        onSair={onSair}
        onToggleSidebar={alternarMenu}
      />
      <div className={`app-shell${sidebarColapsada ? " colapsada" : ""}`}>
        <div className={`sidebar-overlay${sidebarAberta ? " aberta" : ""}`} onClick={() => setSidebarAberta(false)} />
        <Sidebar
          aberta={sidebarAberta}
          colapsada={sidebarColapsada}
          contexto={contexto}
          navItems={navItems}
          activeKey={activeKey}
          onNavigate={(k) => { onNavigate(k); setSidebarAberta(false); }}
        />
        <div className="shell-content">
          <div className="shell-content-inner">
            {itemAtivo && <PageHeader icon={itemAtivo.icon} title={itemAtivo.label} />}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
