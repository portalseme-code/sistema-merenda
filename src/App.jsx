import { useState, useEffect, useRef } from 'react';
import { COLORS, FONT_BODY } from './theme.js';
import { SEED } from './mockData.js';
import { carregarDb, salvarDb } from './api.js';
import { AppShell, NAV_NUTRICIONISTA, NAV_ESCOLA, NAV_ADMIN, AppStyles } from './components/AppShell.jsx';
import { TelaLogin } from './components/TelaLogin.jsx';
import { NutricionistaContent } from './components/NutricionistaApp.jsx';
import { EscolaContent } from './components/EscolaApp.jsx';
import { AdminContent } from './components/AdminApp.jsx';

const CHAVE_SESSAO = 'sigae_sessao_usuario_id';
const CHAVE_ABA = 'sigae_sessao_aba';

function tabInicial(usuario) {
  return usuario.nivelAcesso === "nutricionista" ? "dashboard" : usuario.nivelAcesso === "admin" ? "solicitacoes" : "novo";
}

export default function App() {
  const [db, setDb] = useState(SEED);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [tab, setTab] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroConexao, setErroConexao] = useState(false);
  const primeiraCarga = useRef(true);
  const sessaoRestaurada = useRef(false);

  // Ao abrir o sistema, busca o estado salvo no backend (planilha).
  // Se não conseguir (offline, backend ainda não configurado, etc.),
  // continua com os dados de exemplo em memória.
  useEffect(() => {
    carregarDb()
      .then((dados) => setDb((prev) => ({ ...prev, ...dados })))
      .catch(() => setErroConexao(true))
      .finally(() => setCarregando(false));
  }, []);

  // Assim que os dados terminam de carregar, tenta restaurar a sessão
  // (login) salva no navegador — assim, atualizar a página não desloga.
  useEffect(() => {
    if (carregando || sessaoRestaurada.current) return;
    sessaoRestaurada.current = true;
    try {
      const idSalvo = window.localStorage.getItem(CHAVE_SESSAO);
      if (!idSalvo) return;
      const usuario = db.usuarios.find((u) => String(u.id) === idSalvo);
      if (usuario) {
        setUsuarioLogado(usuario);
        const abaSalva = window.localStorage.getItem(CHAVE_ABA);
        setTab(abaSalva || tabInicial(usuario));
      } else {
        window.localStorage.removeItem(CHAVE_SESSAO);
        window.localStorage.removeItem(CHAVE_ABA);
      }
    } catch (err) {
      // localStorage indisponível (modo privado restrito, etc.) — sem problema,
      // o sistema continua funcionando, só não guarda a sessão entre recarregamentos.
    }
  }, [carregando, db.usuarios]);

  // A cada mudança no estado, salva no backend (com um pequeno atraso,
  // para não disparar uma gravação a cada tecla digitada).
  useEffect(() => {
    if (carregando) return;
    if (primeiraCarga.current) { primeiraCarga.current = false; return; }
    const timer = setTimeout(() => { salvarDb(db); }, 900);
    return () => clearTimeout(timer);
  }, [db, carregando]);

  function entrar(usuario) {
    setUsuarioLogado(usuario);
    const aba = tabInicial(usuario);
    setTab(aba);
    try {
      window.localStorage.setItem(CHAVE_SESSAO, String(usuario.id));
      window.localStorage.setItem(CHAVE_ABA, aba);
    } catch (err) {
      // sem problema, só não persiste entre recarregamentos
    }
  }

  function navegar(k) {
    setTab(k);
    try {
      window.localStorage.setItem(CHAVE_ABA, k);
    } catch (err) {}
  }

  function sair() {
    setUsuarioLogado(null);
    setTab(null);
    try {
      window.localStorage.removeItem(CHAVE_SESSAO);
      window.localStorage.removeItem(CHAVE_ABA);
    } catch (err) {}
  }

  if (!usuarioLogado) {
    return (
      <>
        <AppStyles />
        <TelaLogin
          db={db}
          setDb={setDb}
          carregando={carregando}
          erroConexao={erroConexao}
          onEntrar={entrar}
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
        onNavigate={navegar}
        onSair={sair}
      >
        {acesso === "nutricionista" && (
          <NutricionistaContent tab={tab} db={db} setDb={setDb} usuario={usuarioLogado} />
        )}
        {acesso === "admin" && (
          <AdminContent tab={tab} db={db} setDb={setDb} usuario={usuarioLogado} />
        )}
        {acesso === "escola" && (
          <EscolaContent tab={tab} onNavigate={navegar} db={db} setDb={setDb} escolaId={escolaLogada} usuario={usuarioLogado} />
        )}
      </AppShell>
    </div>
  );
}
