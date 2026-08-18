import { useState, useEffect, useRef } from 'react';
import { COLORS, FONT_BODY } from './theme.js';
import { SEED } from './mockData.js';
import { carregarDb, salvarDb } from './api.js';
import { AppShell, NAV_NUTRICIONISTA, NAV_ESCOLA, NAV_ADMIN, AppStyles } from './components/AppShell.jsx';
import { TelaLogin } from './components/TelaLogin.jsx';
import { NutricionistaContent } from './components/NutricionistaApp.jsx';
import { EscolaContent } from './components/EscolaApp.jsx';
import { AdminContent } from './components/AdminApp.jsx';

export default function App() {
  const [db, setDb] = useState(SEED);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [tab, setTab] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroConexao, setErroConexao] = useState(false);
  const primeiraCarga = useRef(true);

  // Ao abrir o sistema, busca o estado salvo no backend (planilha).
  // Se não conseguir (offline, backend ainda não configurado, etc.),
  // continua com os dados de exemplo em memória.
  useEffect(() => {
    carregarDb()
      .then((dados) => setDb((prev) => ({ ...prev, ...dados })))
      .catch(() => setErroConexao(true))
      .finally(() => setCarregando(false));
  }, []);

  // A cada mudança no estado, salva no backend (com um pequeno atraso,
  // para não disparar uma gravação a cada tecla digitada).
  useEffect(() => {
    if (carregando) return;
    if (primeiraCarga.current) { primeiraCarga.current = false; return; }
    const timer = setTimeout(() => { salvarDb(db); }, 900);
    return () => clearTimeout(timer);
  }, [db, carregando]);

  if (!usuarioLogado) {
    return (
      <>
        <AppStyles />
        <TelaLogin
          db={db}
          setDb={setDb}
          carregando={carregando}
          erroConexao={erroConexao}
          onEntrar={(usuario) => {
            setUsuarioLogado(usuario);
            setTab(usuario.nivelAcesso === "nutricionista" ? "dashboard" : usuario.nivelAcesso === "admin" ? "solicitacoes" : "novo");
          }}
        />
      </>
    );
  }

  const acesso = usuarioLogado.nivelAcesso;
  const escolaLogada = usuarioLogado.escolaId;
  const navItems = acesso === "nutricionista" ? NAV_NUTRICIONISTA : acesso === "admin" ? NAV_ADMIN : NAV_ESCOLA;

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: FONT_BODY }}>
      <AppStyles />
      <AppShell
        usuario={usuarioLogado}
        db={db}
        setDb={setDb}
        acesso={acesso}
        escolaLogada={escolaLogada}
        navItems={navItems}
        activeKey={tab}
        onNavigate={setTab}
        onSair={() => { setUsuarioLogado(null); setTab(null); }}
      >
        {acesso === "nutricionista" && (
          <NutricionistaContent tab={tab} db={db} setDb={setDb} usuario={usuarioLogado} />
        )}
        {acesso === "admin" && (
          <AdminContent tab={tab} db={db} setDb={setDb} usuario={usuarioLogado} />
        )}
        {acesso === "escola" && (
          <EscolaContent tab={tab} onNavigate={setTab} db={db} setDb={setDb} escolaId={escolaLogada} usuario={usuarioLogado} />
        )}
      </AppShell>
    </div>
  );
}
