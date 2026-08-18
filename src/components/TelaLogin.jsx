import { useState } from 'react';
import { COLORS, FONT_DISPLAY, FONT_BODY } from '../theme.js';
import { Field, inputStyle, Btn, SenhaInput } from './ui.jsx';
import { registrarHistorico, notificar } from '../utils.js';
import logoSigae from '../assets/logo-sigae.png';

export function TelaLogin({ db, setDb, onEntrar, carregando, erroConexao }) {
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [tela, setTela] = useState("login"); // 'login' | 'recuperar' | 'solicitar'
  const [emailRecuperacao, setEmailRecuperacao] = useState("");

  const [nomeSolicitante, setNomeSolicitante] = useState("");
  const [escolaSolicitante, setEscolaSolicitante] = useState("");
  const [emailSolicitante, setEmailSolicitante] = useState("");
  const [telefoneSolicitante, setTelefoneSolicitante] = useState("");
  const [cargoSolicitante, setCargoSolicitante] = useState("Nutricionista");
  const [solicitacaoEnviada, setSolicitacaoEnviada] = useState(false);

  const icones = ["🍚", "🥗", "🍊", "🍗", "🥕", "🍝", "🥦", "🌾"];

  function entrar() {
    const usuario = db.usuarios.find((u) => u.login.toLowerCase() === login.trim().toLowerCase());
    if (!usuario || usuario.senha !== senha) {
      setErro("Usuário ou senha inválidos.");
      return;
    }
    setErro("");
    onEntrar(usuario);
  }

  function solicitarRecuperacao() {
    const usuario = db.usuarios.find((u) => u.email.toLowerCase() === emailRecuperacao.trim().toLowerCase());
    if (!usuario) {
      alert("Não encontramos um usuário com esse e-mail.");
      return;
    }
    alert(`Instruções de redefinição de senha enviadas para ${usuario.email} (simulação — sem envio real neste protótipo).`);
    setTela("login");
    setEmailRecuperacao("");
  }

  function enviarSolicitacao() {
    if (!nomeSolicitante || !escolaSolicitante || !emailSolicitante || !telefoneSolicitante) {
      alert("Preencha todos os campos.");
      return;
    }
    const nova = {
      id: "sol" + Date.now(),
      nomeCompleto: nomeSolicitante,
      escola: escolaSolicitante,
      email: emailSolicitante,
      telefone: telefoneSolicitante,
      cargo: cargoSolicitante,
      status: "Pendente",
      criadoEm: new Date().toISOString(),
    };
    setDb((prev) => ({ ...prev, solicitacoes: [nova, ...(prev.solicitacoes || [])] }));
    registrarHistorico(setDb, null, `Nova solicitação de acesso recebida: ${nomeSolicitante} (${cargoSolicitante}).`);
    notificar(setDb, "admin", `Nova solicitação de acesso: ${nomeSolicitante} — ${cargoSolicitante}.`);
    setSolicitacaoEnviada(true);
  }

  function reiniciarSolicitacao() {
    setTela("login");
    setSolicitacaoEnviada(false);
    setNomeSolicitante("");
    setEscolaSolicitante("");
    setEmailSolicitante("");
    setTelefoneSolicitante("");
    setCargoSolicitante("Nutricionista");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(155deg, ${COLORS.primaryDark}, ${COLORS.primary} 60%, ${COLORS.accent})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_BODY,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 22,
          overflow: "hidden",
          display: "flex",
          maxWidth: 780,
          width: "100%",
          boxShadow: "0 20px 60px rgba(20, 40, 25, 0.35)",
        }}
      >
        <div
          className="login-illustration"
          style={{
            flex: "0 0 44%",
            background: `linear-gradient(165deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
            padding: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 28,
            color: "#fff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <img src={logoSigae} alt="SIGAE" style={{ width: 220, height: "auto", filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.25))" }} />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 10,
            }}
          >
            {icones.map((ic, i) => (
              <div
                key={i}
                style={{
                  fontSize: 22,
                  background: "rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  textAlign: "center",
                  padding: "8px 0",
                }}
              >
                {ic}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: "1 1 56%", padding: "40px 36px", maxHeight: "92vh", overflowY: "auto" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.primary, letterSpacing: 1.2, textTransform: "uppercase" }}>
            Secretaria Municipal de Educação
          </div>
          <h1 style={{ fontSize: 25, margin: "6px 0 18px", color: COLORS.ink, fontFamily: FONT_DISPLAY, fontWeight: 600 }}>
            Sistema de Refeições Escolares
          </h1>

          {carregando && (
            <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
              ⏳ Conectando à base de dados...
            </div>
          )}
          {!carregando && erroConexao && (
            <div style={{ fontSize: 12.5, color: COLORS.warn, marginBottom: 16, background: COLORS.warnSoft, padding: "8px 12px", borderRadius: 8 }}>
              ⚠ Não foi possível conectar ao servidor agora. Você pode continuar navegando, mas os dados não serão salvos até a conexão voltar.
            </div>
          )}
          {!carregando && !erroConexao && (
            <div style={{ fontSize: 12.5, color: COLORS.good, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
              ✓ Conectado à base de dados
            </div>
          )}

          {tela === "login" && (
            <>
              <Field label="Usuário">
                <input style={inputStyle} value={login} onChange={(e) => { setLogin(e.target.value); setErro(""); }} placeholder="NOME.SOBRENOME" onKeyDown={(e) => e.key === "Enter" && entrar()} />
              </Field>
              <Field label="Senha">
                <SenhaInput style={inputStyle} value={senha} onChange={(e) => { setSenha(e.target.value); setErro(""); }} onKeyDown={(e) => e.key === "Enter" && entrar()} />
              </Field>

              {erro && <div style={{ color: COLORS.warn, fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{erro}</div>}

              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <Btn onClick={entrar}>Entrar</Btn>
                <button onClick={() => setTela("recuperar")} style={{ background: "none", border: "none", color: COLORS.primary, fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 0 }}>
                  Esqueci minha senha
                </button>
              </div>

              <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${COLORS.line}` }}>
                <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 8 }}>Ainda não tem acesso?</div>
                <Btn variant="secondary" onClick={() => setTela("solicitar")}>Solicitar cadastro</Btn>
              </div>
            </>
          )}

          {tela === "recuperar" && (
            <>
              <Field label="E-mail cadastrado" hint="Enviaremos instruções de redefinição de senha para este e-mail.">
                <input type="email" style={inputStyle} value={emailRecuperacao} onChange={(e) => setEmailRecuperacao(e.target.value)} placeholder="seu.email@seme.gov.br" />
              </Field>
              <div style={{ display: "flex", gap: 12 }}>
                <Btn onClick={solicitarRecuperacao}>Enviar instruções</Btn>
                <Btn variant="ghost" onClick={() => setTela("login")}>Voltar</Btn>
              </div>
            </>
          )}

          {tela === "solicitar" && !solicitacaoEnviada && (
            <>
              <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 14 }}>
                Preencha os dados abaixo. O Administrador Geral vai analisar sua solicitação e enviar o login e a senha por e-mail.
              </div>
              <Field label="Nome completo">
                <input style={inputStyle} value={nomeSolicitante} onChange={(e) => setNomeSolicitante(e.target.value.toUpperCase())} />
              </Field>
              <Field label="Escola em que trabalha">
                <input style={inputStyle} value={escolaSolicitante} onChange={(e) => setEscolaSolicitante(e.target.value.toUpperCase())} placeholder="Ex: EMEIEF Amarilis Fernandes Garcia" />
              </Field>
              <Field label="E-mail">
                <input type="email" style={inputStyle} value={emailSolicitante} onChange={(e) => setEmailSolicitante(e.target.value)} />
              </Field>
              <Field label="Telefone">
                <input style={inputStyle} value={telefoneSolicitante} onChange={(e) => setTelefoneSolicitante(e.target.value)} placeholder="(27) 90000-0000" />
              </Field>
              <Field label="Cargo">
                <select style={inputStyle} value={cargoSolicitante} onChange={(e) => setCargoSolicitante(e.target.value)}>
                  <option value="Nutricionista">Nutricionista</option>
                  <option value="Escola">Escola</option>
                </select>
              </Field>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <Btn onClick={enviarSolicitacao}>Enviar solicitação</Btn>
                <Btn variant="ghost" onClick={() => setTela("login")}>Voltar</Btn>
              </div>
            </>
          )}

          {tela === "solicitar" && solicitacaoEnviada && (
            <div style={{ background: COLORS.goodSoft, border: `1px solid ${COLORS.good}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontWeight: 800, color: COLORS.good, marginBottom: 6 }}>✓ Solicitação enviada</div>
              <div style={{ fontSize: 13.5, color: COLORS.ink, marginBottom: 14 }}>
                Assim que for aprovada, você vai receber o login e a senha por e-mail.
              </div>
              <Btn variant="secondary" onClick={reiniciarSolicitacao}>Voltar para o login</Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
