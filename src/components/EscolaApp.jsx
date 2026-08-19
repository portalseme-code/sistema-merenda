import { useState, useMemo, useRef } from 'react';
import { COLORS, FONT_DISPLAY } from '../theme.js';
import { Card, SectionTitle, FormSection, Field, inputStyle, Btn, ItemChecklist, CameraIcon, Pill } from './ui.jsx';
import { todayISO, mesReferenciaDe, fmtMes, buscarCardapioVigente, compararCardapio, registrarHistorico, notificar, fmtData, exportarCSV } from '../utils.js';

export function NovoLancamento({ db, setDb, escolaId, usuario, editandoId, onFimEdicao }) {
  const lancamentoOriginal = editandoId ? db.lancamentos.find((l) => l.id === editandoId) : null;

  const [data, setData] = useState(lancamentoOriginal ? lancamentoOriginal.data : todayISO());
  const [turnoId, setTurnoId] = useState(lancamentoOriginal ? lancamentoOriginal.turnoId : "");
  const [modalidadeId, setModalidadeId] = useState(lancamentoOriginal ? lancamentoOriginal.modalidadeId : "");
  const [tipoRefeicaoId, setTipoRefeicaoId] = useState(lancamentoOriginal ? lancamentoOriginal.tipoRefeicaoId : "");
  const [quantidade, setQuantidade] = useState(lancamentoOriginal ? String(lancamentoOriginal.quantidade) : "");
  const [servidos, setServidos] = useState(lancamentoOriginal ? lancamentoOriginal.itensServidos : []);
  const [foto, setFoto] = useState(lancamentoOriginal ? lancamentoOriginal.foto : null);
  const [ocorrencia, setOcorrencia] = useState(lancamentoOriginal ? lancamentoOriginal.ocorrencia : "");
  const [confirmado, setConfirmado] = useState(false);
  const fileRef = useRef();

  const cardapio = useMemo(
    () => (modalidadeId && tipoRefeicaoId && turnoId ? buscarCardapioVigente(db, { modalidadeId, tipoRefeicaoId, turnoId, data }) : null),
    [db, modalidadeId, tipoRefeicaoId, turnoId, data]
  );
  const previstos = cardapio ? cardapio.itens : [];
  const mesFechado = data ? db.mesesFechados.includes(mesReferenciaDe(data)) : false;

  function toggleItem(id) {
    setServidos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setConfirmado(false);
  }

  function handleFoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFoto(reader.result);
    reader.readAsDataURL(file);
  }

  function limpar() {
    setData(todayISO());
    setTurnoId("");
    setModalidadeId("");
    setTipoRefeicaoId("");
    setQuantidade("");
    setServidos([]);
    setFoto(null);
    setOcorrencia("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function salvar() {
    if (!data) {
      alert("Informe a data.");
      return;
    }
    if (db.mesesFechados.includes(mesReferenciaDe(data))) {
      alert(`O mês de ${fmtMes(mesReferenciaDe(data))} já foi fechado pela Secretaria. Não é mais possível registrar lançamentos referentes a ele.`);
      return;
    }
    if (!turnoId) {
      alert("Selecione o turno.");
      return;
    }
    if (!modalidadeId) {
      alert("Selecione a modalidade de ensino.");
      return;
    }
    if (!tipoRefeicaoId) {
      alert("Selecione o tipo de refeição.");
      return;
    }
    if (!quantidade || Number(quantidade) <= 0) {
      alert("Informe a quantidade de pratos servidos.");
      return;
    }
    if (servidos.length === 0) {
      alert("Selecione ao menos um insumo servido.");
      return;
    }
    const comp = compararCardapio(previstos, servidos);
    const nomeEscola = db.escolas.find((e) => e.id === escolaId)?.nome || "";

    if (lancamentoOriginal) {
      const atualizado = {
        ...lancamentoOriginal,
        data, turnoId, modalidadeId, tipoRefeicaoId,
        quantidade: Number(quantidade),
        itensServidos: servidos,
        foto,
        ocorrencia,
        statusValidacao: comp.conforme ? "Conforme" : "Divergente",
      };
      setDb((prev) => ({ ...prev, lancamentos: prev.lancamentos.map((l) => (l.id === editandoId ? atualizado : l)) }));
      registrarHistorico(setDb, usuario, `Editou lançamento de ${fmtData(data)} (${nomeEscola}).`);
      notificar(setDb, "nutricionista", `${nomeEscola} editou um lançamento de ${fmtData(data)}.`);
      onFimEdicao && onFimEdicao();
      return;
    }

    const novo = {
      id: "l" + Date.now(),
      escolaId,
      data,
      turnoId,
      modalidadeId,
      tipoRefeicaoId,
      quantidade: Number(quantidade),
      itensServidos: servidos,
      foto,
      statusValidacao: comp.conforme ? "Conforme" : "Divergente",
      statusPagamento: "Pendente",
      parecer: "",
      ocorrencia,
      lancadoPor: usuario ? usuario.nomeCompleto : "",
    };
    setDb((prev) => ({ ...prev, lancamentos: [novo, ...prev.lancamentos] }));
    registrarHistorico(setDb, usuario, `Registrou lançamento de ${fmtData(data)} (${nomeEscola}) — ${comp.conforme ? "conforme" : "divergente"}.`);
    notificar(setDb, "nutricionista", `Novo lançamento${comp.conforme ? "" : " divergente"} de ${nomeEscola} aguardando validação (${fmtData(data)}).`);
    setConfirmado(true);
    limpar();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <SectionTitle icon="🍽️">{lancamentoOriginal ? "Editar lançamento" : "Registrar refeição servida"}</SectionTitle>

        {confirmado && (
          <div style={{ background: COLORS.goodSoft, border: `1px solid ${COLORS.good}`, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.good }}>✓ Lançamento registrado com sucesso</div>
            <div style={{ fontSize: 13, color: COLORS.ink, marginTop: 4 }}>Os dados foram enviados para a Secretaria.</div>
          </div>
        )}

        {mesFechado && (
          <div style={{ background: COLORS.warnSoft, color: COLORS.warn, padding: "10px 14px", borderRadius: 10, fontSize: 13.5, fontWeight: 600, marginBottom: 16 }}>
            🔒 O mês de {fmtMes(mesReferenciaDe(data))} já foi fechado pela Secretaria. Não é mais possível registrar/editar lançamentos para esta data.
          </div>
        )}

        <FormSection icon="🗓️" title="Quando" color={COLORS.primary}>
          <div className="form-fields-grid" style={{ display: "grid", gap: 14 }}>
            <Field label="Data">
              <input type="date" required style={inputStyle} value={data} onChange={(e) => { setData(e.target.value); setConfirmado(false); }} />
            </Field>
            <Field label="Turno">
              <select required className={!turnoId ? "campo-pendente" : ""} style={inputStyle} value={turnoId} onChange={(e) => { setTurnoId(e.target.value); setConfirmado(false); }}>
                <option value="" disabled>Selecione</option>
                {db.turnos.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </Field>
          </div>
        </FormSection>

        <FormSection icon="🏫" title="O que foi servido" color={COLORS.accent}>
          <div className="form-fields-grid" style={{ display: "grid", gap: 14 }}>
            <Field label="Modalidade de ensino">
              <select required className={!modalidadeId ? "campo-pendente" : ""} style={inputStyle} value={modalidadeId} onChange={(e) => { setModalidadeId(e.target.value); setServidos([]); setConfirmado(false); }}>
                <option value="" disabled>Selecione</option>
                {db.modalidades.map((m) => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </select>
            </Field>
            <Field label="Tipo de refeição">
              <select required className={!tipoRefeicaoId ? "campo-pendente" : ""} style={inputStyle} value={tipoRefeicaoId} onChange={(e) => { setTipoRefeicaoId(e.target.value); setServidos([]); setConfirmado(false); }}>
                <option value="" disabled>Selecione</option>
                {db.tiposRefeicao.map((r) => (
                  <option key={r.id} value={r.id}>{r.nome}</option>
                ))}
              </select>
            </Field>
            <Field label="Quantidade de pratos servidos">
              <input type="number" min="0" required className={!quantidade ? "campo-pendente" : ""} style={inputStyle} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} placeholder="Ex: 150" />
            </Field>
          </div>
        </FormSection>

        <FormSection icon="🥗" title="Itens servidos" color="#3B6E8F">
          <div className={servidos.length === 0 ? "campo-pendente-caixa" : ""}>
            <ItemChecklist insumos={db.insumos} selecionados={servidos} onToggle={toggleItem} />
          </div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 8 }}>Marque os itens que compõem o prato servido hoje. Campo obrigatório.</div>
        </FormSection>

        <FormSection icon="📎" title="Registro complementar" color="#8B5FBF">
          <Field label="Foto do prato (opcional, por enquanto)" hint="A foto é feita na hora, pela câmera do dispositivo — não é possível anexar uma imagem já salva na galeria.">
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFoto} style={{ display: "none" }} />
            {!foto ? (
              <button
                type="button"
                onClick={() => fileRef.current && fileRef.current.click()}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                  width: "100%", padding: "24px 16px", borderRadius: 12, border: `2px dashed ${COLORS.line}`,
                  background: COLORS.panelAlt, color: COLORS.inkSoft, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <CameraIcon size={28} color={COLORS.primary} />
                <span style={{ fontWeight: 700, fontSize: 13.5, color: COLORS.primary }}>Tirar foto do prato</span>
                <span style={{ fontSize: 12 }}>Toque para abrir a câmera do dispositivo</span>
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", padding: 10, borderRadius: 12, border: `1.5px solid ${COLORS.good}`, background: COLORS.goodSoft }}>
                <img src={foto} alt="Prévia do prato" style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 10, border: `1px solid ${COLORS.line}`, flexShrink: 0 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.good }}>✓ Foto anexada</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Btn small variant="secondary" onClick={() => fileRef.current && fileRef.current.click()}>Tirar outra</Btn>
                    <Btn small variant="ghost" onClick={() => { setFoto(null); if (fileRef.current) fileRef.current.value = ""; }}>Remover</Btn>
                  </div>
                </div>
              </div>
            )}
          </Field>

          <Field label="Ocorrência (opcional)" hint="Registre aqui qualquer situação que tenha acontecido no fornecimento da refeição.">
            <textarea style={{ ...inputStyle, minHeight: 60 }} value={ocorrencia} onChange={(e) => setOcorrencia(e.target.value.toUpperCase())} placeholder="Ex: item substituído por falta de entrega do fornecedor." />
          </Field>
        </FormSection>

        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={salvar} disabled={mesFechado}>{lancamentoOriginal ? "Salvar alterações" : "Salvar lançamento"}</Btn>
          {lancamentoOriginal && <Btn variant="ghost" onClick={() => onFimEdicao && onFimEdicao()}>Cancelar edição</Btn>}
        </div>
      </Card>
    </div>
  );
}
export function HistoricoEscola({ db, setDb, escolaId, usuario, onEditar }) {
  const lancamentos = db.lancamentos.filter((l) => l.escolaId === escolaId).sort((a, b) => (a.data < b.data ? 1 : -1));
  const nomeModalidade = (id) => db.modalidades.find((m) => m.id === id)?.nome || id;
  const nomeTurno = (id) => db.turnos.find((t) => t.id === id)?.nome || id;
  const nomeTipoRefeicao = (id) => db.tiposRefeicao.find((r) => r.id === id)?.nome || id;

  function excluir(l) {
    if (!window.confirm(`Excluir o lançamento de ${fmtData(l.data)}? Essa ação não pode ser desfeita.`)) return;
    setDb((prev) => ({ ...prev, lancamentos: prev.lancamentos.filter((x) => x.id !== l.id) }));
    registrarHistorico(setDb, usuario, `Excluiu lançamento de ${fmtData(l.data)}.`);
  }

  function exportar() {
    exportarCSV(
      "meus-lancamentos.csv",
      ["Data", "Turno", "Modalidade", "Tipo de refeição", "Pratos", "Cardápio seguido"],
      lancamentos.map((l) => [fmtData(l.data), nomeTurno(l.turnoId), nomeModalidade(l.modalidadeId), nomeTipoRefeicao(l.tipoRefeicaoId), l.quantidade, l.statusValidacao])
    );
  }

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        <Btn small variant="secondary" onClick={exportar}>Exportar CSV</Btn>
      </div>
      <div className="table-scroll">
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
        <thead>
          <tr style={{ textAlign: "left", color: COLORS.inkSoft, fontSize: 12, textTransform: "uppercase" }}>
            <th style={{ padding: 8 }}>Data</th>
            <th style={{ padding: 8 }}>Turno</th>
            <th style={{ padding: 8 }}>Modalidade</th>
            <th style={{ padding: 8 }}>Refeição</th>
            <th style={{ padding: 8 }}>Pratos</th>
            <th style={{ padding: 8 }}>Cardápio seguido</th>
            <th style={{ padding: 8 }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {lancamentos.map((l) => (
            <tr key={l.id} style={{ borderTop: `1px solid ${COLORS.line}` }}>
              <td style={{ padding: 8 }}>{fmtData(l.data)}</td>
              <td style={{ padding: 8 }}>{nomeTurno(l.turnoId)}</td>
              <td style={{ padding: 8 }}>{nomeModalidade(l.modalidadeId)}</td>
              <td style={{ padding: 8 }}>{nomeTipoRefeicao(l.tipoRefeicaoId)}</td>
              <td style={{ padding: 8 }}>{l.quantidade}</td>
              <td style={{ padding: 8 }}><Pill tone={l.statusValidacao === "Conforme" ? "good" : "warn"}>{l.statusValidacao}</Pill></td>
              <td style={{ padding: 8, whiteSpace: "nowrap" }}>
                {l.statusPagamento === "Pendente" ? (
                  <>
                    <Btn small variant="secondary" onClick={() => onEditar(l.id)}>Editar</Btn>{" "}
                    <Btn small variant="danger" onClick={() => excluir(l)}>Excluir</Btn>
                  </>
                ) : (
                  <span style={{ fontSize: 12, color: COLORS.inkSoft }}>Já avaliado</span>
                )}
              </td>
            </tr>
          ))}
          {lancamentos.length === 0 && (
            <tr><td colSpan={7} style={{ padding: 16, color: COLORS.inkSoft, textAlign: "center" }}>Nenhum lançamento ainda.</td></tr>
          )}
        </tbody>
      </table>
      </div>
    </Card>
  );
}
export function EscolaContent({ tab, onNavigate, db, setDb, escolaId, usuario }) {
  const [editandoId, setEditandoId] = useState(null);

  function editar(id) {
    setEditandoId(id);
    onNavigate("novo");
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      {tab === "novo" && (
        <NovoLancamento
          db={db}
          setDb={setDb}
          escolaId={escolaId}
          usuario={usuario}
          editandoId={editandoId}
          onFimEdicao={() => { setEditandoId(null); onNavigate("historico"); }}
        />
      )}
      {tab === "historico" && <HistoricoEscola db={db} setDb={setDb} escolaId={escolaId} usuario={usuario} onEditar={editar} />}
    </div>
  );
}
