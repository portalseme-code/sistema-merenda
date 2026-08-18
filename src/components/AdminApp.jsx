import { useState } from 'react';
import { COLORS, FONT_DISPLAY } from '../theme.js';
import { Card, SectionTitle, Field, inputStyle, Btn, Pill } from './ui.jsx';
import { fmtDataHora, registrarHistorico, notificar, gerarLoginUsuario, SENHA_PADRAO_SOLICITACAO } from '../utils.js';
import { CadastroUsuarios } from './NutricionistaApp.jsx';

function CartaoSolicitacao({ s, db, setDb, usuario }) {
  const [escolaId, setEscolaId] = useState('');
  const [gerado, setGerado] = useState(null);

  function aprovar() {
    if (s.cargo === 'Escola' && !escolaId) {
      alert('Selecione a escola vinculada antes de aprovar.');
      return;
    }
    const login = gerarLoginUsuario(s.nomeCompleto);
    if (db.usuarios.some((u) => u.login.toLowerCase() === login.toLowerCase())) {
      alert(`Já existe um usuário com o login ${login}. Ajuste o nome do solicitante ou cadastre manualmente em Usuários.`);
      return;
    }
    const novoUsuario = {
      id: 'u' + Date.now(),
      nomeCompleto: s.nomeCompleto,
      login,
      senha: SENHA_PADRAO_SOLICITACAO,
      email: s.email,
      telefone: s.telefone,
      localTrabalho: s.escola,
      cargo: s.cargo === 'Escola' ? 'Merendeira' : 'Nutricionista',
      nivelAcesso: s.cargo === 'Escola' ? 'escola' : 'nutricionista',
      escolaId: s.cargo === 'Escola' ? escolaId : null,
    };
    setDb((prev) => ({
      ...prev,
      usuarios: [...prev.usuarios, novoUsuario],
      solicitacoes: prev.solicitacoes.map((x) =>
        x.id === s.id ? { ...x, status: 'Aprovada', decididoEm: new Date().toISOString(), decididoPor: usuario ? usuario.nomeCompleto : '', loginGerado: login } : x
      ),
    }));
    registrarHistorico(setDb, usuario, `Aprovou a solicitação de acesso de ${s.nomeCompleto} — usuário ${login} criado.`);
    setGerado({ login, senha: SENHA_PADRAO_SOLICITACAO });
  }

  function reprovar() {
    if (!window.confirm(`Reprovar a solicitação de ${s.nomeCompleto}?`)) return;
    setDb((prev) => ({
      ...prev,
      solicitacoes: prev.solicitacoes.map((x) =>
        x.id === s.id ? { ...x, status: 'Reprovada', decididoEm: new Date().toISOString(), decididoPor: usuario ? usuario.nomeCompleto : '' } : x
      ),
    }));
    registrarHistorico(setDb, usuario, `Reprovou a solicitação de acesso de ${s.nomeCompleto}.`);
  }

  function copiar(texto) {
    navigator.clipboard && navigator.clipboard.writeText(texto);
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{s.nomeCompleto}</div>
          <div style={{ fontSize: 13, color: COLORS.inkSoft }}>{s.escola} · {s.cargo}</div>
        </div>
        <Pill tone={s.status === 'Pendente' ? 'gold' : s.status === 'Aprovada' ? 'good' : 'warn'}>{s.status}</Pill>
      </div>

      <div style={{ marginTop: 10, fontSize: 13.5, color: COLORS.ink, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div><strong>E-mail:</strong> {s.email}</div>
        <div><strong>Telefone:</strong> {s.telefone}</div>
        <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 4 }}>Solicitado em {fmtDataHora(s.criadoEm)}</div>
      </div>

      {s.status === 'Pendente' && !gerado && (
        <div style={{ marginTop: 14, borderTop: `1px solid ${COLORS.line}`, paddingTop: 14 }}>
          {s.cargo === 'Escola' && (
            <div style={{ maxWidth: 320, marginBottom: 10 }}>
              <Field label="Vincular à escola">
                <select style={inputStyle} value={escolaId} onChange={(e) => setEscolaId(e.target.value)}>
                  <option value="">Selecione</option>
                  {db.escolas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </Field>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn onClick={aprovar}>Aprovar e gerar acesso</Btn>
            <Btn variant="danger" onClick={reprovar}>Reprovar</Btn>
          </div>
        </div>
      )}

      {gerado && (
        <div style={{ marginTop: 14, background: COLORS.goodSoft, border: `1px solid ${COLORS.good}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontWeight: 800, color: COLORS.good, marginBottom: 8 }}>✓ Acesso criado — encaminhe por e-mail para {s.email}</div>
          <div style={{ fontSize: 14, marginBottom: 4 }}>
            <strong>Login:</strong> {gerado.login}{' '}
            <Btn small variant="secondary" onClick={() => copiar(gerado.login)}>Copiar</Btn>
          </div>
          <div style={{ fontSize: 14 }}>
            <strong>Senha:</strong> {gerado.senha}{' '}
            <Btn small variant="secondary" onClick={() => copiar(gerado.senha)}>Copiar</Btn>
          </div>
        </div>
      )}

      {s.status !== 'Pendente' && s.decididoEm && (
        <div style={{ marginTop: 10, fontSize: 12, color: COLORS.inkSoft }}>
          {s.status} em {fmtDataHora(s.decididoEm)} por {s.decididoPor}
          {s.loginGerado && ` — login gerado: ${s.loginGerado}`}
        </div>
      )}
    </Card>
  );
}

export function SolicitacoesAcesso({ db, setDb, usuario }) {
  const [mostrarDecididas, setMostrarDecididas] = useState(false);
  const pendentes = (db.solicitacoes || []).filter((s) => s.status === 'Pendente');
  const decididas = (db.solicitacoes || []).filter((s) => s.status !== 'Pendente');

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {pendentes.length === 0 && (
          <Card><div style={{ color: COLORS.inkSoft }}>Nenhuma solicitação pendente.</div></Card>
        )}
        {pendentes.map((s) => <CartaoSolicitacao key={s.id} s={s} db={db} setDb={setDb} usuario={usuario} />)}
      </div>

      {decididas.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button
            onClick={() => setMostrarDecididas((v) => !v)}
            style={{ background: 'none', border: 'none', color: COLORS.primary, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', padding: 0, marginBottom: 12 }}
          >
            {mostrarDecididas ? 'Ocultar' : 'Ver'} solicitações já decididas ({decididas.length})
          </button>
          {mostrarDecididas && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {decididas.map((s) => <CartaoSolicitacao key={s.id} s={s} db={db} setDb={setDb} usuario={usuario} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminContent({ tab, db, setDb, usuario }) {
  return (
    <div>
      {tab === 'solicitacoes' && <SolicitacoesAcesso db={db} setDb={setDb} usuario={usuario} />}
      {tab === 'usuarios' && <CadastroUsuarios db={db} setDb={setDb} usuario={usuario} />}
    </div>
  );
}
