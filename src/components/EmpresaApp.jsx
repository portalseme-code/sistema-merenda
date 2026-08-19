import { useState } from 'react';
import { COLORS, FONT_DISPLAY, DIAS_SEMANA } from '../theme.js';
import { Card, SectionTitle, Field, inputStyle, Btn, Pill, Tabs, ItemChecklist, ChipInsumo } from './ui.jsx';
import { fmtData, fmtMes, diaSemanaDe, mesReferenciaDe, registrarHistorico, notificar } from '../utils.js';
import { CadastroInsumos, CadastroSubcategorias, CadastroSimples, RelatorioLancamentos, RelatorioPagamento } from './NutricionistaApp.jsx';

const STATUS_LABEL = {
  Rascunho: "Rascunho",
  Enviado: "Aguardando análise",
  Aprovado: "Aprovado",
  Reprovado: "Reprovado",
  AlteracoesSolicitadas: "Alterações solicitadas",
};
const STATUS_TONE = {
  Rascunho: "neutral",
  Enviado: "info",
  Aprovado: "good",
  Reprovado: "warn",
  AlteracoesSolicitadas: "gold",
};

function podeEditar(c) {
  return !c || c.status === "Rascunho" || c.status === "AlteracoesSolicitadas";
}

export function CadastroCardapiosEmpresa({ db, setDb, usuario }) {
  const [editandoId, setEditandoId] = useState(null);
  const [modalidadeId, setModalidadeId] = useState("");
  const [tipoRefeicaoId, setTipoRefeicaoId] = useState("");
  const [turnoId, setTurnoId] = useState("");
  const [mesReferencia, setMesReferencia] = useState("");
  const [dataReferencia, setDataReferencia] = useState("");
  const [diaSemana, setDiaSemana] = useState("Segunda");
  const [itens, setItens] = useState([]);
  const [buscaInsumo, setBuscaInsumo] = useState("");

  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroTipoRefeicao, setFiltroTipoRefeicao] = useState("todos");
  const [filtroMes, setFiltroMes] = useState("todos");

  const nomeModalidade = (id) => db.modalidades.find((m) => m.id === id)?.nome || id;
  const nomeTipoRefeicao = (id) => (db.tiposRefeicaoCardapio || []).find((r) => r.id === id)?.nome || id;
  const nomeTurno = (id) => db.turnos.find((t) => t.id === id)?.nome || id;

  function toggle(id) {
    setItens((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleDataReferencia(valor) {
    setDataReferencia(valor);
    if (valor) {
      setDiaSemana(diaSemanaDe(valor));
      const mesDaData = mesReferenciaDe(valor);
      if (db.meses.some((m) => m.valor === mesDaData)) setMesReferencia(mesDaData);
    }
  }

  function handleDiaSemana(valor) {
    if (dataReferencia && diaSemanaDe(dataReferencia) !== valor) {
      alert(`A data selecionada (${fmtData(dataReferencia)}) cai numa ${diaSemanaDe(dataReferencia)}, não numa ${valor}. A data foi removida.`);
      setDataReferencia("");
    }
    setDiaSemana(valor);
  }

  function limpar() {
    setEditandoId(null);
    setModalidadeId(""); setTipoRefeicaoId(""); setTurnoId("");
    setMesReferencia(""); setDataReferencia(""); setDiaSemana("Segunda");
    setItens([]);
  }

  function validar() {
    if (!turnoId || !modalidadeId || !tipoRefeicaoId) { alert("Selecione tipo de cardápio, modalidade e tipo de refeição."); return false; }
    if (!mesReferencia) { alert("Selecione o mês de referência do cardápio."); return false; }
    if (dataReferencia && diaSemanaDe(dataReferencia) !== diaSemana) { alert("A data não corresponde ao dia da semana selecionado."); return false; }
    if (itens.length === 0) { alert("Selecione ao menos um insumo."); return false; }
    return true;
  }

  function montarDados() {
    return {
      modalidadeId, tipoRefeicaoId, turnoId, mesReferencia, dataReferencia, diaSemana, itens,
      descricao: nomeModalidade(modalidadeId).toUpperCase(),
    };
  }

  function salvarRascunho() {
    if (!validar()) return;
    const dados = montarDados();
    if (editandoId) {
      setDb((prev) => ({
        ...prev,
        cardapios: prev.cardapios.map((c) => (c.id === editandoId ? { ...c, ...dados, status: "Rascunho" } : c)),
      }));
      registrarHistorico(setDb, usuario, `A empresa atualizou o rascunho do cardápio "${dados.descricao}".`);
    } else {
      const novo = { id: "c" + Date.now(), ...dados, status: "Rascunho", parecer: "", criadoPor: usuario ? usuario.nomeCompleto : "" };
      setDb((prev) => ({ ...prev, cardapios: [...prev.cardapios, novo] }));
      registrarHistorico(setDb, usuario, `A empresa criou o rascunho do cardápio "${novo.descricao}".`);
    }
    limpar();
  }

  function enviarParaAnalise() {
    if (!validar()) return;
    const dados = montarDados();
    if (editandoId) {
      setDb((prev) => ({
        ...prev,
        cardapios: prev.cardapios.map((c) => (c.id === editandoId ? { ...c, ...dados, status: "Enviado", enviadoEm: new Date().toISOString() } : c)),
      }));
      registrarHistorico(setDb, usuario, `A empresa enviou o cardápio "${dados.descricao}" para análise da SEME.`);
    } else {
      const novo = { id: "c" + Date.now(), ...dados, status: "Enviado", parecer: "", criadoPor: usuario ? usuario.nomeCompleto : "", enviadoEm: new Date().toISOString() };
      setDb((prev) => ({ ...prev, cardapios: [...prev.cardapios, novo] }));
      registrarHistorico(setDb, usuario, `A empresa enviou o cardápio "${novo.descricao}" para análise da SEME.`);
    }
    notificar(setDb, "nutricionista", `Novo cardápio enviado para análise: ${dados.descricao} (${fmtMes(mesReferencia)}).`);
    limpar();
  }

  function editar(c) {
    if (!podeEditar(c)) {
      alert("Este cardápio já foi enviado e não pode mais ser editado enquanto estiver em análise ou aprovado.");
      return;
    }
    setEditandoId(c.id);
    setModalidadeId(c.modalidadeId); setTipoRefeicaoId(c.tipoRefeicaoId); setTurnoId(c.turnoId);
    setMesReferencia(c.mesReferencia); setDataReferencia(c.dataReferencia || "");
    setDiaSemana(c.diaSemana); setItens(c.itens || []);
  }

  function excluir(c) {
    if (!podeEditar(c)) {
      alert("Só é possível excluir cardápios em rascunho ou com alterações solicitadas.");
      return;
    }
    if (!window.confirm(`Excluir o cardápio "${c.descricao}"?`)) return;
    setDb((prev) => ({ ...prev, cardapios: prev.cardapios.filter((x) => x.id !== c.id) }));
    registrarHistorico(setDb, usuario, `A empresa excluiu o cardápio "${c.descricao}".`);
  }

  const insumosFiltrados = db.insumos.filter((i) => i.nome.toLowerCase().includes(buscaInsumo.toLowerCase()));

  const listaFiltrada = db.cardapios.filter((c) => {
    if (filtroStatus !== "todos" && c.status !== filtroStatus) return false;
    if (filtroTipoRefeicao !== "todos" && c.tipoRefeicaoId !== filtroTipoRefeicao) return false;
    if (filtroMes !== "todos" && c.mesReferencia !== filtroMes) return false;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <h3 style={{ marginTop: 0, fontSize: 15.5, fontFamily: FONT_DISPLAY, fontWeight: 600, color: COLORS.primaryDark }}>
          {editandoId ? "Editar cardápio" : "Novo cardápio"}
        </h3>

        <div className="form-fields-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Mês de referência" hint={db.meses.length === 0 ? "Peça para a SEME cadastrar um mês primeiro." : undefined}>
            <select style={inputStyle} value={mesReferencia} onChange={(e) => setMesReferencia(e.target.value)}>
              <option value="" disabled>Selecione</option>
              {db.meses.map((m) => <option key={m.id} value={m.valor}>{fmtMes(m.valor)}</option>)}
            </select>
          </Field>
          <Field label="Data" hint="Opcional — ao escolher, o dia da semana é preenchido automaticamente.">
            <input type="date" style={inputStyle} value={dataReferencia} onChange={(e) => handleDataReferencia(e.target.value)} />
          </Field>
          <Field label="Dia da semana">
            <select style={inputStyle} value={diaSemana} onChange={(e) => handleDiaSemana(e.target.value)}>
              {DIAS_SEMANA.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Tipo de Cardápio">
            <select style={inputStyle} value={turnoId} onChange={(e) => setTurnoId(e.target.value)}>
              <option value="" disabled>Selecione</option>
              {db.turnos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </Field>
          <Field label="Modalidade" hint="O nome do cardápio é preenchido automaticamente com a modalidade escolhida.">
            <select style={inputStyle} value={modalidadeId} onChange={(e) => setModalidadeId(e.target.value)}>
              <option value="" disabled>Selecione</option>
              {db.modalidades.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </Field>
          <Field label="Tipo de Refeição" hint={(db.tiposRefeicaoCardapio || []).length === 0 ? "Cadastre um na aba \"Tipos de Refeição\" primeiro." : undefined}>
            <select style={inputStyle} value={tipoRefeicaoId} onChange={(e) => setTipoRefeicaoId(e.target.value)}>
              <option value="" disabled>Selecione</option>
              {(db.tiposRefeicaoCardapio || []).map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
          </Field>
        </div>

        {modalidadeId && (
          <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 14 }}>
            Nome do cardápio: <strong style={{ color: COLORS.ink }}>{nomeModalidade(modalidadeId).toUpperCase()}</strong>
          </div>
        )}

        <Field label="Insumos do cardápio">
          <input style={{ ...inputStyle, marginBottom: 10 }} value={buscaInsumo} onChange={(e) => setBuscaInsumo(e.target.value)} placeholder="Pesquisar insumo por nome..." />
          <ItemChecklist insumos={insumosFiltrados} selecionados={itens} onToggle={toggle} />
          {db.insumos.length === 0 && <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 6 }}>Cadastre insumos na aba "Insumos" primeiro.</div>}
        </Field>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn variant="secondary" onClick={salvarRascunho}>Salvar rascunho</Btn>
          <Btn onClick={enviarParaAnalise}>Enviar para análise da SEME</Btn>
          {editandoId && <Btn variant="ghost" onClick={limpar}>Cancelar edição</Btn>}
        </div>
      </Card>

      <Card>
        <h3 style={{ marginTop: 0, fontSize: 15.5, fontFamily: FONT_DISPLAY, fontWeight: 600, color: COLORS.primaryDark }}>Cardápios cadastrados</h3>

        <div className="filtro-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
          <Field label="Status">
            <select style={inputStyle} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="Rascunho">Rascunho</option>
              <option value="Enviado">Aguardando análise</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Reprovado">Reprovado</option>
              <option value="AlteracoesSolicitadas">Alterações solicitadas</option>
            </select>
          </Field>
          <Field label="Tipo de Refeição">
            <select style={inputStyle} value={filtroTipoRefeicao} onChange={(e) => setFiltroTipoRefeicao(e.target.value)}>
              <option value="todos">Todos</option>
              {(db.tiposRefeicaoCardapio || []).map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
          </Field>
          <Field label="Mês">
            <select style={inputStyle} value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
              <option value="todos">Todos</option>
              {db.meses.map((m) => <option key={m.id} value={m.valor}>{fmtMes(m.valor)}</option>)}
            </select>
          </Field>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {listaFiltrada.map((c) => (
            <div key={c.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{c.descricao}</div>
                  <div style={{ fontSize: 12, color: COLORS.inkSoft }}>
                    {fmtMes(c.mesReferencia)} · toda {c.diaSemana} · {nomeTurno(c.turnoId)} · {nomeTipoRefeicao(c.tipoRefeicaoId)}
                  </div>
                  {c.parecer && (c.status === "Reprovado" || c.status === "AlteracoesSolicitadas") && (
                    <div style={{ fontSize: 12.5, color: COLORS.warn, marginTop: 4 }}><strong>Parecer da SEME:</strong> {c.parecer}</div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <Pill tone={STATUS_TONE[c.status] || "neutral"}>{STATUS_LABEL[c.status] || c.status}</Pill>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn small variant="secondary" onClick={() => editar(c)} disabled={!podeEditar(c)}>Editar</Btn>
                    <Btn small variant="danger" onClick={() => excluir(c)} disabled={!podeEditar(c)}>Excluir</Btn>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {listaFiltrada.length === 0 && <div style={{ color: COLORS.inkSoft, fontSize: 13.5 }}>Nenhum cardápio encontrado com esses filtros.</div>}
        </div>
      </Card>
    </div>
  );
}

function LancamentosEPagamentos({ db }) {
  const [sub, setSub] = useState("lancamentos");
  return (
    <div>
      <Tabs
        tabs={[
          { key: "lancamentos", label: "Lançamentos" },
          { key: "pagamento", label: "Pagamento" },
        ]}
        active={sub}
        onChange={setSub}
      />
      {sub === "lancamentos" && <RelatorioLancamentos db={db} />}
      {sub === "pagamento" && <RelatorioPagamento db={db} />}
    </div>
  );
}

function InsumosEmpresa({ db, setDb, usuario }) {
  const [sub, setSub] = useState("insumos");
  return (
    <div>
      <Tabs
        tabs={[
          { key: "insumos", label: "Insumos" },
          { key: "categorias", label: "Categorias" },
          { key: "subcategorias", label: "Subcategorias" },
        ]}
        active={sub}
        onChange={setSub}
      />
      {sub === "insumos" && <CadastroInsumos db={db} setDb={setDb} usuario={usuario} />}
      {sub === "categorias" && (
        <CadastroSimples db={db} setDb={setDb} usuario={usuario} chave="categorias" titulo="Categoria" campos={[{ key: "nome", label: "Nome da categoria" }]} />
      )}
      {sub === "subcategorias" && <CadastroSubcategorias db={db} setDb={setDb} usuario={usuario} />}
    </div>
  );
}

function CardapiosEmpresa({ db, setDb, usuario }) {
  const [sub, setSub] = useState("cardapios");
  return (
    <div>
      <Tabs
        tabs={[
          { key: "cardapios", label: "Cardápios" },
          { key: "tiposRefeicao", label: "Tipos de Refeição" },
        ]}
        active={sub}
        onChange={setSub}
      />
      {sub === "cardapios" && <CadastroCardapiosEmpresa db={db} setDb={setDb} usuario={usuario} />}
      {sub === "tiposRefeicao" && (
        <CadastroSimples db={db} setDb={setDb} usuario={usuario} chave="tiposRefeicaoCardapio" titulo="Tipo de Refeição" campos={[{ key: "nome", label: "Nome do tipo de refeição" }]} />
      )}
    </div>
  );
}

export function EmpresaContent({ tab, db, setDb, usuario }) {
  return (
    <div>
      {tab === "insumos" && <InsumosEmpresa db={db} setDb={setDb} usuario={usuario} />}
      {tab === "cardapios" && <CardapiosEmpresa db={db} setDb={setDb} usuario={usuario} />}
      {tab === "lancamentos" && <LancamentosEPagamentos db={db} />}
    </div>
  );
}
