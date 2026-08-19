import { useState, useMemo } from 'react';
import { COLORS, FONT_DISPLAY, CHART_PALETTE, DIAS_SEMANA } from '../theme.js';
import { Card, SectionTitle, Field, inputStyle, Btn, Pill, Tabs, ItemChecklist, BarChartH, DonutChart, ChipInsumo, InfoBadge } from './ui.jsx';
import { fmtData, fmtMoeda, fmtMes, fmtDataHora, mesReferenciaDe, diaSemanaDe, agora, buscarCardapioVigente, compararCardapio, gerarSnapshotMes, registrarHistorico, notificar, exportarCSV, gerarLoginUsuario, gerarSenhaAleatoria } from '../utils.js';

function CartaoCardapioAprovacao({ c, db, setDb, usuario }) {
  const [parecer, setParecer] = useState("");
  const nomeModalidade = (id) => db.modalidades.find((m) => m.id === id)?.nome || id;
  const nomeTipoRefeicao = (id) => db.tiposRefeicao.find((r) => r.id === id)?.nome || id;
  const nomeTurno = (id) => db.turnos.find((t) => t.id === id)?.nome || id;
  const nomeEscola = (id) => db.escolas.find((e) => e.id === id)?.nome || id;
  const insumo = (id) => db.insumos.find((i) => i.id === id);

  function decidir(novoStatus) {
    if (novoStatus !== "Aprovado" && !parecer.trim()) {
      alert("Escreva um parecer explicando o motivo.");
      return;
    }
    setDb((prev) => ({
      ...prev,
      cardapios: prev.cardapios.map((x) =>
        x.id === c.id ? { ...x, status: novoStatus, parecer: parecer.trim(), decididoEm: new Date().toISOString(), decididoPor: usuario ? usuario.nomeCompleto : "" } : x
      ),
    }));
    registrarHistorico(setDb, usuario, `${novoStatus === "Aprovado" ? "Aprovou" : novoStatus === "Reprovado" ? "Reprovou" : "Solicitou alterações no"} cardápio "${c.descricao}".`);
    if (novoStatus === "Aprovado") {
      notificar(setDb, c.escolaIds || [], `Cardápio aprovado e disponível: ${c.descricao} (${fmtMes(c.mesReferencia)}).`);
    }
  }

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{c.descricao}</div>
          <div style={{ fontSize: 13, color: COLORS.inkSoft }}>
            {fmtMes(c.mesReferencia)} · toda {c.diaSemana} · {nomeTurno(c.turnoId)} · {nomeModalidade(c.modalidadeId)} · {nomeTipoRefeicao(c.tipoRefeicaoId)}
          </div>
          <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>
            Escolas: {(c.escolaIds || []).map(nomeEscola).join(", ") || "—"}
          </div>
        </div>
        <Pill tone="info">Aguardando análise</Pill>
      </div>

      <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {(c.itens || []).map((id) => {
          const ins = insumo(id);
          return <ChipInsumo key={id} label={ins ? ins.nome : id} tone="match" af={ins && ins.agriculturaFamiliar} />;
        })}
      </div>

      <div style={{ marginTop: 14, borderTop: `1px solid ${COLORS.line}`, paddingTop: 14 }}>
        <Field label="Parecer (obrigatório para reprovar ou solicitar alterações)">
          <textarea style={{ ...inputStyle, minHeight: 50 }} value={parecer} onChange={(e) => setParecer(e.target.value.toUpperCase())} />
        </Field>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn onClick={() => decidir("Aprovado")}>Aprovar cardápio</Btn>
          <Btn variant="secondary" onClick={() => decidir("AlteracoesSolicitadas")}>Solicitar alterações</Btn>
          <Btn variant="danger" onClick={() => decidir("Reprovado")}>Reprovar</Btn>
        </div>
      </div>
    </Card>
  );
}

export function AprovacaoCardapios({ db, setDb, usuario }) {
  const [mostrarDecididos, setMostrarDecididos] = useState(false);
  const pendentes = db.cardapios.filter((c) => c.status === "Enviado");
  const decididos = db.cardapios.filter((c) => c.status === "Aprovado" || c.status === "Reprovado" || c.status === "AlteracoesSolicitadas");
  const nomeModalidade = (id) => db.modalidades.find((m) => m.id === id)?.nome || id;
  const nomeTipoRefeicao = (id) => db.tiposRefeicao.find((r) => r.id === id)?.nome || id;

  const toneStatus = { Aprovado: "good", Reprovado: "warn", AlteracoesSolicitadas: "gold" };
  const labelStatus = { Aprovado: "Aprovado", Reprovado: "Reprovado", AlteracoesSolicitadas: "Alterações solicitadas" };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {pendentes.length === 0 && (
          <Card><div style={{ color: COLORS.inkSoft }}>Nenhum cardápio aguardando análise no momento.</div></Card>
        )}
        {pendentes.map((c) => <CartaoCardapioAprovacao key={c.id} c={c} db={db} setDb={setDb} usuario={usuario} />)}
      </div>

      {decididos.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button
            onClick={() => setMostrarDecididos((v) => !v)}
            style={{ background: "none", border: "none", color: COLORS.primary, fontWeight: 700, fontSize: 13.5, cursor: "pointer", padding: 0, marginBottom: 12 }}
          >
            {mostrarDecididos ? "Ocultar" : "Ver"} cardápios já avaliados ({decididos.length})
          </button>
          {mostrarDecididos && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {decididos.map((c) => (
                <Card key={c.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{c.descricao}</div>
                      <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{fmtMes(c.mesReferencia)} · {nomeModalidade(c.modalidadeId)} · {nomeTipoRefeicao(c.tipoRefeicaoId)}</div>
                      {c.parecer && <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 4 }}><strong>Parecer:</strong> {c.parecer}</div>}
                    </div>
                    <Pill tone={toneStatus[c.status]}>{labelStatus[c.status]}</Pill>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Dashboard({ db }) {
  const [filtroEscola, setFiltroEscola] = useState("todas");
  const [filtroModalidade, setFiltroModalidade] = useState("todas");
  const [filtroTipoRefeicao, setFiltroTipoRefeicao] = useState("todas");
  const [filtroMes, setFiltroMes] = useState("todos");

  const mesesDisponiveis = useMemo(() => {
    const set = new Set(db.lancamentos.map((l) => mesReferenciaDe(l.data)));
    return Array.from(set).sort();
  }, [db.lancamentos]);

  const lancamentosFiltrados = useMemo(
    () =>
      db.lancamentos.filter(
        (l) =>
          (filtroEscola === "todas" || l.escolaId === filtroEscola) &&
          (filtroModalidade === "todas" || l.modalidadeId === filtroModalidade) &&
          (filtroTipoRefeicao === "todas" || l.tipoRefeicaoId === filtroTipoRefeicao) &&
          (filtroMes === "todos" || mesReferenciaDe(l.data) === filtroMes)
      ),
    [db.lancamentos, filtroEscola, filtroModalidade, filtroTipoRefeicao, filtroMes]
  );

  const total = lancamentosFiltrados.length;
  const pendentes = lancamentosFiltrados.filter((l) => l.statusPagamento === "Pendente").length;
  const conformes = lancamentosFiltrados.filter((l) => l.statusValidacao === "Conforme").length;
  const divergentes = lancamentosFiltrados.filter((l) => l.statusValidacao === "Divergente").length;
  const totalPratos = lancamentosFiltrados.reduce((s, l) => s + l.quantidade, 0);

  const nomeEscola = (id) => db.escolas.find((e) => e.id === id)?.nome || id;
  const nomeTipoRefeicao = (id) => db.tiposRefeicao.find((r) => r.id === id)?.nome || id;

  const pratosPorEscola = useMemo(() => {
    const grupos = {};
    lancamentosFiltrados.forEach((l) => { grupos[l.escolaId] = (grupos[l.escolaId] || 0) + l.quantidade; });
    return Object.entries(grupos)
      .map(([escolaId, value], i) => ({ label: nomeEscola(escolaId), value, color: CHART_PALETTE[i % CHART_PALETTE.length] }))
      .sort((a, b) => b.value - a.value);
  }, [lancamentosFiltrados, db.escolas]);

  const lancamentosPorTipo = useMemo(() => {
    const grupos = {};
    lancamentosFiltrados.forEach((l) => { grupos[l.tipoRefeicaoId] = (grupos[l.tipoRefeicaoId] || 0) + 1; });
    return Object.entries(grupos)
      .map(([id, value], i) => ({ label: nomeTipoRefeicao(id), value, color: CHART_PALETTE[i % CHART_PALETTE.length] }))
      .sort((a, b) => b.value - a.value);
  }, [lancamentosFiltrados, db.tiposRefeicao]);

  const stat = (icon, label, valor, tone) => (
    <Card style={{ flex: 1, borderTop: `4px solid ${tone || COLORS.primary}` }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.inkSoft, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: tone || COLORS.ink, marginTop: 4, fontFamily: FONT_DISPLAY }}>{valor}</div>
    </Card>
  );

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div className="filtro-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <Field label="Escola">
            <select style={inputStyle} value={filtroEscola} onChange={(e) => setFiltroEscola(e.target.value)}>
              <option value="todas">Todas</option>
              {db.escolas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </Field>
          <Field label="Modalidade">
            <select style={inputStyle} value={filtroModalidade} onChange={(e) => setFiltroModalidade(e.target.value)}>
              <option value="todas">Todas</option>
              {db.modalidades.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </Field>
          <Field label="Tipo de refeição">
            <select style={inputStyle} value={filtroTipoRefeicao} onChange={(e) => setFiltroTipoRefeicao(e.target.value)}>
              <option value="todas">Todas</option>
              {db.tiposRefeicao.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
          </Field>
          <Field label="Mês">
            <select style={inputStyle} value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
              <option value="todos">Todos</option>
              {mesesDisponiveis.map((m) => <option key={m} value={m}>{fmtMes(m)}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      <div className="stat-row" style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        {stat("🍽️", "Lançamentos", total)}
        {stat("📋", "Pendentes de análise", pendentes, pendentes > 0 ? COLORS.warn : COLORS.ink)}
        {stat("✅", "Conformes", conformes, COLORS.good)}
        {stat("🥗", "Pratos registrados", totalPratos, COLORS.accent)}
      </div>

      <div className="cadastro-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <SectionTitle icon="🧾">Validação dos lançamentos</SectionTitle>
          <DonutChart
            data={[
              { label: "Conforme", value: conformes, color: COLORS.good },
              { label: "Divergente", value: divergentes, color: COLORS.warn },
            ]}
          />
        </Card>
        <Card>
          <SectionTitle icon="🏫">Pratos servidos por escola</SectionTitle>
          <BarChartH data={pratosPorEscola} />
        </Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <SectionTitle icon="🍽️">Lançamentos por tipo de refeição</SectionTitle>
        <BarChartH data={lancamentosPorTipo} />
      </Card>

      <Card>
        <div style={{ fontSize: 14.5, color: COLORS.inkSoft }}>
          Use a aba <strong>Pendências</strong> para validar todos os lançamentos das escolas — mesmo os conformes com o cardápio dependem da sua validação final — e{" "}
          <strong>Relatório de pagamento</strong> para consolidar o valor devido por escola.
        </div>
      </Card>
    </div>
  );
}
export function Pendencias({ db, setDb, usuario }) {
  const pendentes = db.lancamentos.filter((l) => l.statusPagamento === "Pendente");
  const nomeInsumo = (id) => db.insumos.find((i) => i.id === id)?.nome || id;
  const nomeEscola = (id) => db.escolas.find((e) => e.id === id)?.nome || id;
  const nomeModalidade = (id) => db.modalidades.find((m) => m.id === id)?.nome || id;
  const nomeTipoRefeicao = (id) => db.tiposRefeicao.find((r) => r.id === id)?.nome || id;
  const nomeTurno = (id) => db.turnos.find((t) => t.id === id)?.nome || id;

  function decidir(l, decisao, parecer) {
    setDb((prev) => ({
      ...prev,
      lancamentos: prev.lancamentos.map((x) => (x.id === l.id ? { ...x, statusPagamento: decisao, parecer } : x)),
    }));
    registrarHistorico(setDb, usuario, `${decisao === "Aprovado" ? "Aprovou" : "Reprovou"} o pagamento do lançamento de ${fmtData(l.data)} (${nomeEscola(l.escolaId)}).`);
  }

  function corrigirTipoRefeicao(l, novoTipoRefeicaoId) {
    if (novoTipoRefeicaoId === l.tipoRefeicaoId) return;
    const cardapioNovo = buscarCardapioVigente(db.cardapios, {
      modalidadeId: l.modalidadeId,
      tipoRefeicaoId: novoTipoRefeicaoId,
      turnoId: l.turnoId,
      escolaId: l.escolaId,
      data: l.data,
    });
    const previstosNovo = cardapioNovo ? cardapioNovo.itens : [];
    const compNovo = compararCardapio(previstosNovo, l.itensServidos);
    setDb((prev) => ({
      ...prev,
      lancamentos: prev.lancamentos.map((x) =>
        x.id === l.id ? { ...x, tipoRefeicaoId: novoTipoRefeicaoId, statusValidacao: compNovo.conforme ? "Conforme" : "Divergente" } : x
      ),
    }));
    registrarHistorico(
      setDb,
      usuario,
      `Corrigiu o tipo de refeição do lançamento de ${fmtData(l.data)} (${nomeEscola(l.escolaId)}): ${nomeTipoRefeicao(l.tipoRefeicaoId)} → ${nomeTipoRefeicao(novoTipoRefeicaoId)}.`
    );
  }

  return (
    <div>
      <Card style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12.5 }}>
        <div style={{ fontWeight: 800, color: COLORS.inkSoft, textTransform: "uppercase", fontSize: 11.5 }}>Legenda:</div>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><ChipInsumo label="conforme o cardápio" tone="match" upper /></span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><ChipInsumo label="previsto e não servido" tone="falta" upper /></span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><ChipInsumo label="servido fora do previsto" tone="extra" upper /></span>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {pendentes.length === 0 && (
        <Card><div style={{ color: COLORS.inkSoft }}>Nenhum lançamento aguardando validação.</div></Card>
      )}
      {pendentes.map((l) => {
        const cardapio = buscarCardapioVigente(db.cardapios, {
          modalidadeId: l.modalidadeId,
          tipoRefeicaoId: l.tipoRefeicaoId,
          turnoId: l.turnoId,
          escolaId: l.escolaId,
          data: l.data,
        });
        const previstos = cardapio ? cardapio.itens : [];
        const comp = compararCardapio(previstos, l.itensServidos);
        const previstosSet = new Set(previstos);
        const servidosSet = new Set(l.itensServidos);
        return (
          <Card key={l.id}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{nomeEscola(l.escolaId)}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <Pill tone={l.statusValidacao === "Conforme" ? "good" : "warn"}>{l.statusValidacao}</Pill>
                <Pill tone="gold">Pendente</Pill>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
              <InfoBadge label="Data" value={fmtData(l.data)} color={COLORS.primary} />
              <InfoBadge label="Turno" value={nomeTurno(l.turnoId)} color="#3B6E8F" />
              <InfoBadge label="Modalidade" value={nomeModalidade(l.modalidadeId)} color={COLORS.accent} />
              <InfoBadge label="Pratos servidos" value={l.quantidade} color="#8B5FBF" />
            </div>

            <div
              style={{
                marginTop: 14, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
                background: COLORS.panelAlt, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "12px 16px",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.3 }}>
                Tipo de refeição informado pela escola
              </div>
              <select
                style={{ ...inputStyle, fontWeight: 700, flex: "1 1 260px", maxWidth: 380 }}
                value={l.tipoRefeicaoId}
                onChange={(e) => corrigirTipoRefeicao(l, e.target.value)}
              >
                {db.tiposRefeicao.map((r) => <option key={r.id} value={r.id}>{r.nome} — {fmtMoeda(r.valor)}</option>)}
              </select>
              <span style={{ fontSize: 12, color: COLORS.inkSoft, fontStyle: "italic" }}>Corrija aqui se necessário</span>
            </div>

            <div className="compare-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 6 }}>
              <div style={{ background: COLORS.primarySoft, borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.primaryDark, textTransform: "uppercase", marginBottom: 8 }}>Previsto no cardápio</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {previstos.map((id) => (
                    <ChipInsumo key={id} label={nomeInsumo(id)} tone={servidosSet.has(id) ? "match" : "falta"} af={db.insumos.find((i) => i.id === id)?.agriculturaFamiliar} />
                  ))}
                  {previstos.length === 0 && <span style={{ fontSize: 12.5, color: COLORS.inkSoft }}>Nenhum cardápio encontrado para esta combinação.</span>}
                </div>
              </div>
              <div style={{ background: COLORS.accentSoft, borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#8A5A0A", textTransform: "uppercase", marginBottom: 8 }}>Servido pela escola</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {l.itensServidos.map((id) => (
                    <ChipInsumo key={id} label={nomeInsumo(id)} tone={previstosSet.has(id) ? "match" : "extra"} af={db.insumos.find((i) => i.id === id)?.agriculturaFamiliar} />
                  ))}
                </div>
              </div>
            </div>

            {l.ocorrencia && (
              <div style={{ marginTop: 14, fontSize: 13.5, background: COLORS.bg, padding: 10, borderRadius: 8 }}>
                <strong>Ocorrência informada pela escola:</strong> {l.ocorrencia}
              </div>
            )}

            {l.foto && <img src={l.foto} alt="Foto do prato" style={{ marginTop: 10, maxHeight: 130, borderRadius: 8 }} />}

            <ParecerBox onDecidir={(decisao, texto) => decidir(l, decisao, texto)} />
          </Card>
        );
      })}
      </div>
    </div>
  );
}
export function ParecerBox({ onDecidir }) {
  const [texto, setTexto] = useState("");
  return (
    <div style={{ marginTop: 14, borderTop: `1px solid ${COLORS.line}`, paddingTop: 14 }}>
      <Field label="Parecer do nutricionista">
        <textarea style={{ ...inputStyle, minHeight: 50 }} value={texto} onChange={(e) => setTexto(e.target.value.toUpperCase())} />
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn onClick={() => onDecidir("Aprovado", texto)}>Aprovar Refeição</Btn>
        <Btn variant="danger" onClick={() => onDecidir("Reprovado", texto)}>Reprovar Refeição</Btn>
      </div>
    </div>
  );
}
export function RelatorioConsolidadoSnapshot({ f, db }) {
  const nomeEscola = (id) => db.escolas.find((e) => e.id === id)?.nome || id;
  const nomeTipoRefeicao = (id) => db.tiposRefeicao.find((r) => r.id === id)?.nome || id;

  return (
    <div>
      <div className="stat-row" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <Card style={{ flex: 1, borderTop: `4px solid ${COLORS.primary}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.inkSoft, textTransform: "uppercase" }}>Lançamentos</div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: FONT_DISPLAY }}>{f.totalLancamentos}</div>
        </Card>
        <Card style={{ flex: 1, borderTop: `4px solid ${COLORS.accent}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.inkSoft, textTransform: "uppercase" }}>Pratos servidos</div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: FONT_DISPLAY }}>{f.totalPratos}</div>
        </Card>
        <Card style={{ flex: 1, borderTop: `4px solid ${COLORS.good}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.inkSoft, textTransform: "uppercase" }}>Pratos aprovados</div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: FONT_DISPLAY }}>{f.totalPratosAprovados}</div>
        </Card>
        <Card style={{ flex: 1, borderTop: `4px solid ${COLORS.warn}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.inkSoft, textTransform: "uppercase" }}>Divergentes</div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: FONT_DISPLAY }}>{f.divergentes}</div>
        </Card>
      </div>

      <div style={{ fontSize: 13.5, color: COLORS.inkSoft, marginBottom: 16 }}>
        {f.aprovados} aprovados · {f.reprovados} reprovados · {f.naoDecididos} não decididos pelo nutricionista antes do fechamento.
      </div>

      <SectionTitle icon="📊">Valor a pagar por escola e tipo de refeição</SectionTitle>
      <div className="table-scroll">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, marginBottom: 12 }}>
          <thead>
            <tr style={{ textAlign: "left", color: COLORS.inkSoft, fontSize: 12, textTransform: "uppercase" }}>
              <th style={{ padding: 8 }}>Escola</th>
              <th style={{ padding: 8 }}>Refeição</th>
              <th style={{ padding: 8 }}>Pratos</th>
              <th style={{ padding: 8 }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {f.linhas.map((l, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${COLORS.line}` }}>
                <td style={{ padding: 8 }}>{nomeEscola(l.escolaId)}</td>
                <td style={{ padding: 8 }}>{nomeTipoRefeicao(l.tipoRefeicaoId)}</td>
                <td style={{ padding: 8 }}>{l.pratos}</td>
                <td style={{ padding: 8, fontWeight: 700 }}>{fmtMoeda(l.valor)}</td>
              </tr>
            ))}
            {f.linhas.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 12, textAlign: "center", color: COLORS.inkSoft }}>Nenhum lançamento aprovado neste mês.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <BarChartH
        data={Object.values(
          f.linhas.reduce((acc, l) => {
            acc[l.escolaId] = acc[l.escolaId] || { label: nomeEscola(l.escolaId), value: 0 };
            acc[l.escolaId].value += l.valor;
            return acc;
          }, {})
        ).map((d, i) => ({ ...d, color: CHART_PALETTE[i % CHART_PALETTE.length] }))}
        formatValue={fmtMoeda}
      />

      <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.primary }}>Total do mês: {fmtMoeda(f.valorTotal)}</div>
        <Btn variant="secondary" onClick={() => window.print()}>Imprimir / salvar em PDF</Btn>
      </div>
    </div>
  );
}
export function FechamentoMes({ db, setDb, usuario }) {
  const [mesSelecionado, setMesSelecionado] = useState("");
  const [verRelatorioId, setVerRelatorioId] = useState(null);

  const mesesComLancamentos = useMemo(() => {
    const set = new Set(db.lancamentos.map((l) => mesReferenciaDe(l.data)));
    return Array.from(set).sort();
  }, [db.lancamentos]);

  const mesesAbertos = mesesComLancamentos.filter((m) => !db.mesesFechados.includes(m));

  function escolasDoMes(mes) {
    const ids = new Set(db.lancamentos.filter((l) => mesReferenciaDe(l.data) === mes).map((l) => l.escolaId));
    return Array.from(ids);
  }

  function fecharMes() {
    if (!mesSelecionado) {
      alert("Selecione o mês a fechar.");
      return;
    }
    const ok = window.confirm(
      `Confirma o fechamento de ${fmtMes(mesSelecionado)}? A partir de agora, as escolas não conseguirão mais registrar refeições referentes a este mês, e um relatório consolidado será gerado.`
    );
    if (!ok) return;
    const snapshot = gerarSnapshotMes(db, mesSelecionado);
    setDb((prev) => ({
      ...prev,
      mesesFechados: [...prev.mesesFechados, mesSelecionado],
      fechamentos: [...prev.fechamentos, { id: "f" + Date.now(), ...snapshot, reaberto: false }],
    }));
    registrarHistorico(setDb, usuario, `Fechou o mês de ${fmtMes(mesSelecionado)}.`);
    notificar(setDb, escolasDoMes(mesSelecionado), `O mês de ${fmtMes(mesSelecionado)} foi fechado pela Secretaria. Não é mais possível lançar refeições referentes a ele.`);
    setMesSelecionado("");
  }

  function reabrirMes(f) {
    const ok = window.confirm(`Reabrir ${fmtMes(f.mes)} para lançamentos das escolas? O relatório gerado fica arquivado, marcado como reaberto.`);
    if (!ok) return;
    setDb((prev) => ({
      ...prev,
      mesesFechados: prev.mesesFechados.filter((m) => m !== f.mes),
      fechamentos: prev.fechamentos.map((x) => (x.id === f.id ? { ...x, reaberto: true, reabertoEm: agora(), reabertoPor: usuario ? usuario.nomeCompleto : "" } : x)),
    }));
    registrarHistorico(setDb, usuario, `Reabriu o mês de ${fmtMes(f.mes)}.`);
    notificar(setDb, escolasDoMes(f.mes), `O mês de ${fmtMes(f.mes)} foi reaberto pela Secretaria e voltou a aceitar lançamentos.`);
  }

  return (
    <div>
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle icon="🔒">Fechar mês</SectionTitle>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ minWidth: 220 }}>
            <Field label="Mês a fechar">
              <select style={inputStyle} value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)}>
                <option value="">Selecione</option>
                {mesesAbertos.map((m) => <option key={m} value={m}>{fmtMes(m)}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ marginBottom: 14 }}>
            <Btn variant="danger" onClick={fecharMes} disabled={mesesAbertos.length === 0}>Fechar mês</Btn>
          </div>
        </div>
        <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 6 }}>
          Ao fechar um mês, as escolas deixam de conseguir registrar refeições referentes a ele, e o sistema gera automaticamente um relatório consolidando tudo o que foi lançado no período. O relatório completo de cada mês fechado também fica disponível na aba <strong>Relatórios</strong>.
        </div>
      </Card>

      <SectionTitle icon="📁">Meses fechados</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {db.fechamentos.length === 0 && (
          <Card><div style={{ color: COLORS.inkSoft }}>Nenhum mês fechado ainda.</div></Card>
        )}
        {db.fechamentos.slice().reverse().map((f) => (
          <Card key={f.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, fontFamily: FONT_DISPLAY, color: COLORS.primaryDark }}>{fmtMes(f.mes)}</div>
                  {f.reaberto && <Pill tone="gold">Reaberto</Pill>}
                </div>
                <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>
                  Fechado em {fmtData(f.geradoEm)}
                  {f.reaberto && ` · Reaberto em ${fmtDataHora(f.reabertoEm)} por ${f.reabertoPor}`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn small variant="secondary" onClick={() => setVerRelatorioId(verRelatorioId === f.id ? null : f.id)}>
                  {verRelatorioId === f.id ? "Ocultar relatório" : "Ver relatório consolidado"}
                </Btn>
                {!f.reaberto && <Btn small variant="ghost" onClick={() => reabrirMes(f)}>Reabrir mês</Btn>}
              </div>
            </div>

            {verRelatorioId === f.id && (
              <div style={{ marginTop: 18, borderTop: `1px solid ${COLORS.line}`, paddingTop: 18 }}>
                <RelatorioConsolidadoSnapshot f={f} db={db} />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
export function Historico({ db }) {
  const [busca, setBusca] = useState("");
  const [mesFiltro, setMesFiltro] = useState("todos");

  const mesesDisponiveis = useMemo(() => {
    const set = new Set(db.historico.map((h) => mesReferenciaDe(h.data)));
    return Array.from(set).sort().reverse();
  }, [db.historico]);

  const itens = db.historico.filter((h) => {
    if (mesFiltro !== "todos" && mesReferenciaDe(h.data) !== mesFiltro) return false;
    if (busca && !(h.acao.toLowerCase().includes(busca.toLowerCase()) || h.usuario.toLowerCase().includes(busca.toLowerCase()))) return false;
    return true;
  });

  function exportar() {
    exportarCSV(
      "historico.csv",
      ["Data/hora", "Usuário", "Ação"],
      itens.map((h) => [fmtDataHora(h.data), h.usuario, h.acao])
    );
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <Btn small variant="secondary" onClick={exportar}>Exportar CSV</Btn>
        </div>
        <div className="form-fields-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Pesquisar (usuário ou ação)">
            <input style={inputStyle} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ex: cardápio, Maria, fechou..." />
          </Field>
          <Field label="Mês">
            <select style={inputStyle} value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)}>
              <option value="todos">Todos</option>
              {mesesDisponiveis.map((m) => <option key={m} value={m}>{fmtMes(m)}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {itens.map((h) => (
            <div key={h.id} style={{ padding: "10px 4px", borderBottom: `1px solid ${COLORS.line}`, fontSize: 13.5 }}>
              <div style={{ color: COLORS.ink }}>{h.acao}</div>
              <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>{h.usuario} · {fmtDataHora(h.data)}</div>
            </div>
          ))}
          {itens.length === 0 && (
            <div style={{ padding: 16, color: COLORS.inkSoft, textAlign: "center" }}>Nenhum registro encontrado.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
export function Cadastros({ db, setDb, usuario }) {
  const [sub, setSub] = useState("modalidades");
  return (
    <div>
      <Tabs
        tabs={[
          { key: "modalidades", label: "Modalidades" },
          { key: "tiposRefeicao", label: "Tipos de refeição" },
          { key: "turnos", label: "Turnos" },
          { key: "escolas", label: "Escolas" },
          { key: "meses", label: "Meses" },
          { key: "usuarios", label: "Usuários" },
        ]}
        active={sub}
        onChange={setSub}
      />
      {sub === "modalidades" && (
        <CadastroSimples
          db={db}
          setDb={setDb}
          usuario={usuario}
          chave="modalidades"
          titulo="Modalidade"
          campos={[{ key: "nome", label: "Nome da modalidade" }]}
        />
      )}
      {sub === "tiposRefeicao" && (
        <CadastroSimples
          db={db}
          setDb={setDb}
          usuario={usuario}
          chave="tiposRefeicao"
          titulo="Tipo de refeição"
          campos={[
            { key: "nome", label: "Nome do tipo de refeição" },
            { key: "valor", label: "Valor por prato", tipo: "number", moeda: true },
          ]}
        />
      )}
      {sub === "turnos" && <CadastroSimples db={db} setDb={setDb} usuario={usuario} chave="turnos" titulo="Turno" campos={[{ key: "nome", label: "Nome do turno" }]} />}
      {sub === "escolas" && (
        <CadastroSimples
          db={db}
          setDb={setDb}
          usuario={usuario}
          chave="escolas"
          titulo="Escola"
          campos={[
            { key: "nome", label: "Nome da escola" },
            { key: "codigo", label: "Código" },
          ]}
        />
      )}
      {sub === "meses" && (
        <CadastroSimples
          db={db}
          setDb={setDb}
          usuario={usuario}
          chave="meses"
          titulo="Mês"
          campos={[{ key: "valor", label: "Mês de referência", tipo: "month", mes: true }]}
        />
      )}
      {sub === "usuarios" && <CadastroUsuarios db={db} setDb={setDb} usuario={usuario} />}
    </div>
  );
}

export function CadastroSubcategorias({ db, setDb, usuario }) {
  const vazio = { nome: "", categoriaId: db.categorias[0] ? db.categorias[0].id : "" };
  const [form, setForm] = useState(vazio);
  const [editandoId, setEditandoId] = useState(null);

  const nomeCategoria = (id) => db.categorias.find((c) => c.id === id)?.nome || "—";

  function salvar() {
    if (!form.nome) {
      alert("Informe o nome da subcategoria.");
      return;
    }
    if (!form.categoriaId) {
      alert("Selecione a categoria.");
      return;
    }
    if (editandoId) {
      setDb((prev) => ({
        ...prev,
        subcategorias: prev.subcategorias.map((s) => (s.id === editandoId ? { ...s, nome: form.nome, categoriaId: form.categoriaId } : s)),
      }));
      registrarHistorico(setDb, usuario, `Editou a subcategoria: ${form.nome}.`);
      setEditandoId(null);
    } else {
      const novo = { id: "sub" + Date.now(), nome: form.nome, categoriaId: form.categoriaId };
      setDb((prev) => ({ ...prev, subcategorias: [...prev.subcategorias, novo] }));
      registrarHistorico(setDb, usuario, `Cadastrou a subcategoria: ${form.nome}.`);
    }
    setForm(vazio);
  }

  function editar(s) {
    setEditandoId(s.id);
    setForm({ nome: s.nome, categoriaId: s.categoriaId });
  }

  function excluir(s) {
    if (!window.confirm(`Excluir a subcategoria "${s.nome}"?`)) return;
    setDb((prev) => ({ ...prev, subcategorias: prev.subcategorias.filter((x) => x.id !== s.id) }));
    registrarHistorico(setDb, usuario, `Excluiu a subcategoria: ${s.nome}.`);
  }

  return (
    <div className="cadastro-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20 }}>
      <Card>
        <h3 style={{ marginTop: 0, fontSize: 15.5, fontFamily: FONT_DISPLAY, fontWeight: 600, color: COLORS.primaryDark }}>{editandoId ? "Editar subcategoria" : "Nova subcategoria"}</h3>
        {db.categorias.length === 0 && (
          <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 12 }}>Cadastre uma categoria primeiro, na aba "Categorias".</div>
        )}
        <Field label="Categoria">
          <select style={inputStyle} value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}>
            <option value="" disabled>Selecione</option>
            {db.categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Field>
        <Field label="Nome da subcategoria">
          <input style={inputStyle} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value.toUpperCase() })} />
        </Field>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={salvar}>{editandoId ? "Salvar alterações" : "Cadastrar"}</Btn>
          {editandoId && <Btn variant="ghost" onClick={() => { setEditandoId(null); setForm(vazio); }}>Cancelar</Btn>}
        </div>
      </Card>
      <Card>
        <h3 style={{ marginTop: 0, fontSize: 15.5, fontFamily: FONT_DISPLAY, fontWeight: 600, color: COLORS.primaryDark }}>Subcategorias cadastradas</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <tbody>
            {db.subcategorias.map((s) => (
              <tr key={s.id} style={{ borderTop: `1px solid ${COLORS.line}` }}>
                <td style={{ padding: 8 }}>{s.nome} — {nomeCategoria(s.categoriaId)}</td>
                <td style={{ padding: 8, textAlign: "right", whiteSpace: "nowrap" }}>
                  <Btn small variant="secondary" onClick={() => editar(s)}>Editar</Btn>{" "}
                  <Btn small variant="danger" onClick={() => excluir(s)}>Excluir</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function CadastroInsumos({ db, setDb, usuario }) {
  const vazio = { nome: "", categoriaId: "", subcategoriaId: "", agriculturaFamiliar: false };
  const [form, setForm] = useState(vazio);
  const [editandoId, setEditandoId] = useState(null);

  const nomeCategoria = (id) => db.categorias.find((c) => c.id === id)?.nome || "";
  const nomeSubcategoria = (id) => db.subcategorias.find((s) => s.id === id)?.nome || "";
  const subcategoriasFiltradas = db.subcategorias.filter((s) => !form.categoriaId || s.categoriaId === form.categoriaId);

  function salvar() {
    if (!form.nome) {
      alert("Informe o nome do insumo.");
      return;
    }
    if (editandoId) {
      setDb((prev) => ({
        ...prev,
        insumos: prev.insumos.map((i) => (i.id === editandoId ? { ...i, nome: form.nome, categoriaId: form.categoriaId || null, subcategoriaId: form.subcategoriaId || null, agriculturaFamiliar: form.agriculturaFamiliar } : i)),
      }));
      registrarHistorico(setDb, usuario, `Editou o insumo: ${form.nome}.`);
      setEditandoId(null);
    } else {
      const novo = { id: "ins" + Date.now(), nome: form.nome, categoriaId: form.categoriaId || null, subcategoriaId: form.subcategoriaId || null, agriculturaFamiliar: form.agriculturaFamiliar };
      setDb((prev) => ({ ...prev, insumos: [...prev.insumos, novo] }));
      registrarHistorico(setDb, usuario, `Cadastrou o insumo: ${form.nome}${form.agriculturaFamiliar ? " (Agricultura Familiar)" : ""}.`);
    }
    setForm(vazio);
  }

  function editar(i) {
    setEditandoId(i.id);
    setForm({ nome: i.nome, categoriaId: i.categoriaId || "", subcategoriaId: i.subcategoriaId || "", agriculturaFamiliar: !!i.agriculturaFamiliar });
  }

  function excluir(i) {
    if (!window.confirm(`Excluir o insumo "${i.nome}"?`)) return;
    setDb((prev) => ({ ...prev, insumos: prev.insumos.filter((x) => x.id !== i.id) }));
    registrarHistorico(setDb, usuario, `Excluiu o insumo: ${i.nome}.`);
  }

  return (
    <div className="cadastro-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20 }}>
      <Card>
        <h3 style={{ marginTop: 0, fontSize: 15.5, fontFamily: FONT_DISPLAY, fontWeight: 600, color: COLORS.primaryDark }}>{editandoId ? "Editar insumo" : "Novo insumo"}</h3>
        <Field label="Nome do insumo">
          <input style={inputStyle} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Categoria (opcional)">
          <select style={inputStyle} value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value, subcategoriaId: "" })}>
            <option value="">Nenhuma</option>
            {db.categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Field>
        <Field label="Subcategoria (opcional)">
          <select style={inputStyle} value={form.subcategoriaId} onChange={(e) => setForm({ ...form, subcategoriaId: e.target.value })} disabled={!form.categoriaId}>
            <option value="">Nenhuma</option>
            {subcategoriasFiltradas.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </Field>
        <label
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10,
            border: `1.5px solid ${form.agriculturaFamiliar ? COLORS.agro : COLORS.line}`,
            background: form.agriculturaFamiliar ? COLORS.agroSoft : "#fff", cursor: "pointer", marginBottom: 14,
          }}
        >
          <input type="checkbox" checked={form.agriculturaFamiliar} onChange={(e) => setForm({ ...form, agriculturaFamiliar: e.target.checked })} />
          <span style={{ fontSize: 13.5, fontWeight: 600, color: form.agriculturaFamiliar ? COLORS.agro : COLORS.ink }}>Insumo da Agricultura Familiar</span>
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={salvar}>{editandoId ? "Salvar alterações" : "Cadastrar"}</Btn>
          {editandoId && <Btn variant="ghost" onClick={() => { setEditandoId(null); setForm(vazio); }}>Cancelar</Btn>}
        </div>
      </Card>
      <Card>
        <h3 style={{ marginTop: 0, fontSize: 15.5, fontFamily: FONT_DISPLAY, fontWeight: 600, color: COLORS.primaryDark }}>Insumos cadastrados</h3>
        <div style={{ fontSize: 12, color: COLORS.agro, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS.agro, display: "inline-block" }} /> Agricultura Familiar
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <tbody>
            {db.insumos.map((i) => (
              <tr key={i.id} style={{ borderTop: `1px solid ${COLORS.line}`, background: i.agriculturaFamiliar ? COLORS.agroSoft : "transparent" }}>
                <td style={{ padding: 8 }}>
                  {i.agriculturaFamiliar && <span style={{ color: COLORS.agro, fontWeight: 800, marginRight: 4 }}>●</span>}
                  {i.nome}
                  {(i.categoriaId || i.subcategoriaId) && (
                    <span style={{ color: COLORS.inkSoft }}>
                      {" — "}{nomeCategoria(i.categoriaId)}{i.subcategoriaId ? ` / ${nomeSubcategoria(i.subcategoriaId)}` : ""}
                    </span>
                  )}
                </td>
                <td style={{ padding: 8, textAlign: "right", whiteSpace: "nowrap" }}>
                  <Btn small variant="secondary" onClick={() => editar(i)}>Editar</Btn>{" "}
                  <Btn small variant="danger" onClick={() => excluir(i)}>Excluir</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function CadastroSimples({ db, setDb, chave, titulo, campos, usuario }) {
  const vazio = {};
  campos.forEach((c) => (vazio[c.key] = ""));
  const [form, setForm] = useState(vazio);
  const [editandoId, setEditandoId] = useState(null);

  function salvar() {
    if (campos.some((c) => !form[c.key] && form[c.key] !== 0)) {
      alert("Preencha todos os campos.");
      return;
    }
    const dados = {};
    campos.forEach((c) => {
      dados[c.key] = c.moeda ? Number(form[c.key]) : form[c.key];
    });
    const rotulo = dados.nome || dados.valor || titulo;
    if (editandoId) {
      setDb((prev) => ({
        ...prev,
        [chave]: prev[chave].map((item) => (item.id === editandoId ? { ...item, ...dados } : item)),
      }));
      registrarHistorico(setDb, usuario, `Editou ${titulo.toLowerCase()}: ${rotulo}.`);
      setEditandoId(null);
    } else {
      const novo = { id: chave.slice(0, 3) + Date.now(), ...dados };
      setDb((prev) => ({ ...prev, [chave]: [...prev[chave], novo] }));
      registrarHistorico(setDb, usuario, `Cadastrou ${titulo.toLowerCase()}: ${rotulo}.`);
    }
    setForm(vazio);
  }

  function editar(item) {
    setEditandoId(item.id);
    const f = {};
    campos.forEach((c) => (f[c.key] = item[c.key]));
    setForm(f);
  }

  function excluir(item) {
    const rotulo = item.nome || item.valor || titulo;
    if (!window.confirm(`Excluir "${rotulo}"?`)) return;
    setDb((prev) => ({ ...prev, [chave]: prev[chave].filter((i) => i.id !== item.id) }));
    registrarHistorico(setDb, usuario, `Excluiu ${titulo.toLowerCase()}: ${rotulo}.`);
  }

  return (
    <div className="cadastro-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20 }}>
      <Card>
        <h3 style={{ marginTop: 0, fontSize: 15.5, fontFamily: FONT_DISPLAY, fontWeight: 600, color: COLORS.primaryDark }}>{editandoId ? `Editar ${titulo.toLowerCase()}` : `Novo ${titulo.toLowerCase()}`}</h3>
        {campos.map((c) => (
          <Field key={c.key} label={c.label}>
            {c.moeda ? (
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 14.5,
                    fontWeight: 700,
                    color: COLORS.inkSoft,
                  }}
                >
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  style={{ ...inputStyle, paddingLeft: 34 }}
                  value={form[c.key]}
                  onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                  placeholder="0,00"
                />
              </div>
            ) : (
              <input
                type={c.tipo || "text"}
                style={inputStyle}
                value={form[c.key]}
                onChange={(e) => setForm({ ...form, [c.key]: e.target.value.toUpperCase() })}
              />
            )}
          </Field>
        ))}
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={salvar}>{editandoId ? "Salvar alterações" : "Cadastrar"}</Btn>
          {editandoId && <Btn variant="ghost" onClick={() => { setEditandoId(null); setForm(vazio); }}>Cancelar</Btn>}
        </div>
      </Card>
      <Card>
        <h3 style={{ marginTop: 0, fontSize: 15.5, fontFamily: FONT_DISPLAY, fontWeight: 600, color: COLORS.primaryDark }}>{titulo}s cadastrados</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <tbody>
            {db[chave].map((item) => (
              <tr key={item.id} style={{ borderTop: `1px solid ${COLORS.line}` }}>
                <td style={{ padding: 8 }}>
                  {campos.map((c) => (c.moeda ? fmtMoeda(item[c.key]) : c.mes ? fmtMes(item[c.key]) : item[c.key])).join(" — ")}
                </td>
                <td style={{ padding: 8, textAlign: "right", whiteSpace: "nowrap" }}>
                  <Btn small variant="secondary" onClick={() => editar(item)}>Editar</Btn>{" "}
                  <Btn small variant="danger" onClick={() => excluir(item)}>Excluir</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
export function CadastroUsuarios({ db, setDb, usuario }) {
  const vazio = { nomeCompleto: "", email: "", telefone: "", localTrabalho: "", cargo: "", nivelAcesso: "escola", escolaId: db.escolas[0] ? db.escolas[0].id : "" };
  const [form, setForm] = useState(vazio);
  const [editandoId, setEditandoId] = useState(null);

  const nomeEscola = (id) => db.escolas.find((e) => e.id === id)?.nome || "—";

  function salvar() {
    if (!form.nomeCompleto || !form.email || !form.cargo) {
      alert("Preencha nome completo, e-mail e cargo.");
      return;
    }
    if (form.nivelAcesso === "escola" && !form.escolaId) {
      alert("Selecione a escola do usuário.");
      return;
    }
    if (editandoId) {
      setDb((prev) => ({
        ...prev,
        usuarios: prev.usuarios.map((u) =>
          u.id === editandoId
            ? { ...u, nomeCompleto: form.nomeCompleto, email: form.email, telefone: form.telefone, localTrabalho: form.localTrabalho, cargo: form.cargo, nivelAcesso: form.nivelAcesso, escolaId: form.nivelAcesso === "escola" ? form.escolaId : null }
            : u
        ),
      }));
      registrarHistorico(setDb, usuario, `Editou o usuário ${form.nomeCompleto}.`);
      setEditandoId(null);
    } else {
      const login = gerarLoginUsuario(form.nomeCompleto);
      const senha = gerarSenhaAleatoria();
      const novo = {
        id: "u" + Date.now(),
        nomeCompleto: form.nomeCompleto,
        login,
        senha,
        email: form.email,
        telefone: form.telefone,
        localTrabalho: form.localTrabalho,
        cargo: form.cargo,
        nivelAcesso: form.nivelAcesso,
        escolaId: form.nivelAcesso === "escola" ? form.escolaId : null,
      };
      setDb((prev) => ({ ...prev, usuarios: [...prev.usuarios, novo] }));
      registrarHistorico(setDb, usuario, `Cadastrou o usuário ${form.nomeCompleto} (${login}).`);
      alert(`Usuário criado com sucesso.\n\nLogin: ${login}\nSenha: ${senha}\n\nAnote agora — a senha não será mostrada novamente.`);
    }
    setForm(vazio);
  }

  function editar(u) {
    setEditandoId(u.id);
    setForm({
      nomeCompleto: u.nomeCompleto,
      email: u.email,
      telefone: u.telefone || "",
      localTrabalho: u.localTrabalho || "",
      cargo: u.cargo,
      nivelAcesso: u.nivelAcesso,
      escolaId: u.escolaId || (db.escolas[0] ? db.escolas[0].id : ""),
    });
  }

  function redefinirSenha(u) {
    if (!window.confirm(`Redefinir a senha de ${u.nomeCompleto}?`)) return;
    const novaSenha = gerarSenhaAleatoria();
    setDb((prev) => ({ ...prev, usuarios: prev.usuarios.map((x) => (x.id === u.id ? { ...x, senha: novaSenha } : x)) }));
    registrarHistorico(setDb, usuario, `Redefiniu a senha do usuário ${u.nomeCompleto}.`);
    alert(`Nova senha de ${u.nomeCompleto}: ${novaSenha}\n\nAnote agora — não será mostrada novamente.`);
  }

  function excluir(u) {
    if (!window.confirm(`Excluir o usuário ${u.nomeCompleto}?`)) return;
    setDb((prev) => ({ ...prev, usuarios: prev.usuarios.filter((x) => x.id !== u.id) }));
    registrarHistorico(setDb, usuario, `Excluiu o usuário ${u.nomeCompleto}.`);
  }

  return (
    <div className="cadastro-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20 }}>
      <Card>
        <h3 style={{ marginTop: 0, fontSize: 15.5, fontFamily: FONT_DISPLAY, fontWeight: 600, color: COLORS.primaryDark }}>{editandoId ? "Editar usuário" : "Novo usuário"}</h3>
        <Field label="Nome completo">
          <input style={inputStyle} value={form.nomeCompleto} onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="E-mail">
          <input type="email" style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Telefone">
          <input style={inputStyle} value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(27) 90000-0000" />
        </Field>
        <Field label="Local que trabalha">
          <input style={inputStyle} value={form.localTrabalho} onChange={(e) => setForm({ ...form, localTrabalho: e.target.value.toUpperCase() })} placeholder="Ex: EMEIEF Amarilis Fernandes Garcia" />
        </Field>
        <Field label="Cargo">
          <input style={inputStyle} value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value.toUpperCase() })} placeholder="Ex: Merendeira, Diretor, Nutricionista" />
        </Field>
        <Field label="Nível de acesso">
          <select style={inputStyle} value={form.nivelAcesso} onChange={(e) => setForm({ ...form, nivelAcesso: e.target.value })}>
            <option value="escola">Escola</option>
            <option value="nutricionista">Nutricionista / Administrador</option>
            <option value="empresa">Empresa Fornecedora</option>
          </select>
        </Field>
        {form.nivelAcesso === "escola" && (
          <Field label="Escola vinculada">
            <select style={inputStyle} value={form.escolaId} onChange={(e) => setForm({ ...form, escolaId: e.target.value })}>
              {db.escolas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </Field>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={salvar}>{editandoId ? "Salvar alterações" : "Cadastrar usuário"}</Btn>
          {editandoId && <Btn variant="ghost" onClick={() => { setEditandoId(null); setForm(vazio); }}>Cancelar</Btn>}
        </div>
      </Card>
      <Card>
        <h3 style={{ marginTop: 0, fontSize: 15.5, fontFamily: FONT_DISPLAY, fontWeight: 600, color: COLORS.primaryDark }}>Usuários cadastrados</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {db.usuarios.map((u) => (
            <div key={u.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{u.nomeCompleto}</div>
                  <div style={{ fontSize: 12, color: COLORS.inkSoft }}>
                    {u.cargo} · login: {u.login} · {u.nivelAcesso === "nutricionista" ? "Nutricionista/Administrador" : u.nivelAcesso === "admin" ? "Administrador Geral" : u.nivelAcesso === "empresa" ? "Empresa Fornecedora" : `Escola — ${nomeEscola(u.escolaId)}`}
                  </div>
                  {(u.localTrabalho || u.telefone) && (
                    <div style={{ fontSize: 12, color: COLORS.inkSoft }}>
                      {u.localTrabalho && `${u.localTrabalho}`}{u.localTrabalho && u.telefone && " · "}{u.telefone}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Btn small variant="secondary" onClick={() => editar(u)}>Editar</Btn>
                  <Btn small variant="ghost" onClick={() => redefinirSenha(u)}>Redefinir senha</Btn>
                  <Btn small variant="danger" onClick={() => excluir(u)}>Excluir</Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
export function RelatorioPagamento({ db }) {
  const [escolaFiltro, setEscolaFiltro] = useState("todas");
  const [modalidadeFiltro, setModalidadeFiltro] = useState("todas");
  const [tipoRefeicaoFiltro, setTipoRefeicaoFiltro] = useState("todas");
  const [mesFiltro, setMesFiltro] = useState("todos");
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);

  const mesesDisponiveis = useMemo(() => {
    const set = new Set(db.lancamentos.map((l) => mesReferenciaDe(l.data)));
    return Array.from(set).sort();
  }, [db.lancamentos]);

  const linhas = useMemo(() => {
    const aprovados = db.lancamentos.filter(
      (l) =>
        l.statusPagamento === "Aprovado" &&
        (escolaFiltro === "todas" || l.escolaId === escolaFiltro) &&
        (modalidadeFiltro === "todas" || l.modalidadeId === modalidadeFiltro) &&
        (tipoRefeicaoFiltro === "todas" || l.tipoRefeicaoId === tipoRefeicaoFiltro) &&
        (mesFiltro === "todos" || mesReferenciaDe(l.data) === mesFiltro)
    );
    const grupos = {};
    aprovados.forEach((l) => {
      const key = l.escolaId + "|" + l.modalidadeId + "|" + l.tipoRefeicaoId;
      if (!grupos[key]) grupos[key] = { escolaId: l.escolaId, modalidadeId: l.modalidadeId, tipoRefeicaoId: l.tipoRefeicaoId, pratos: 0 };
      grupos[key].pratos += l.quantidade;
    });
    return Object.values(grupos);
  }, [db.lancamentos, escolaFiltro, modalidadeFiltro, tipoRefeicaoFiltro, mesFiltro]);

  const nomeEscola = (id) => db.escolas.find((e) => e.id === id)?.nome || id;
  const nomeModalidade = (id) => db.modalidades.find((m) => m.id === id)?.nome || id;
  const nomeTipoRefeicao = (id) => db.tiposRefeicao.find((r) => r.id === id)?.nome || id;
  const valorTipoRefeicao = (id) => db.tiposRefeicao.find((r) => r.id === id)?.valor || 0;

  const totalGeral = linhas.reduce((s, l) => s + l.pratos * valorTipoRefeicao(l.tipoRefeicaoId), 0);

  const totalPorEscola = useMemo(() => {
    const grupos = {};
    linhas.forEach((l) => {
      const valor = l.pratos * valorTipoRefeicao(l.tipoRefeicaoId);
      grupos[l.escolaId] = (grupos[l.escolaId] || 0) + valor;
    });
    return Object.entries(grupos)
      .map(([id, value], i) => ({ label: nomeEscola(id), value, color: CHART_PALETTE[i % CHART_PALETTE.length] }))
      .sort((a, b) => b.value - a.value);
  }, [linhas, db.tiposRefeicao, db.escolas]);

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 19, fontFamily: FONT_DISPLAY, fontWeight: 600, color: COLORS.primaryDark, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>💰</span>Relatório de pagamento
          </h2>
          <Btn variant="secondary" onClick={() => setMostrarRelatorio((v) => !v)}>
            {mostrarRelatorio ? "Ocultar gráfico" : "Emitir relatório com gráfico"}
          </Btn>
        </div>

        <div className="filtro-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 4 }}>
          <Field label="Escola">
            <select style={inputStyle} value={escolaFiltro} onChange={(e) => setEscolaFiltro(e.target.value)}>
              <option value="todas">Todas</option>
              {db.escolas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </Field>
          <Field label="Modalidade">
            <select style={inputStyle} value={modalidadeFiltro} onChange={(e) => setModalidadeFiltro(e.target.value)}>
              <option value="todas">Todas</option>
              {db.modalidades.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </Field>
          <Field label="Tipo de refeição">
            <select style={inputStyle} value={tipoRefeicaoFiltro} onChange={(e) => setTipoRefeicaoFiltro(e.target.value)}>
              <option value="todas">Todas</option>
              {db.tiposRefeicao.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
          </Field>
          <Field label="Mês">
            <select style={inputStyle} value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)}>
              <option value="todos">Todos</option>
              {mesesDisponiveis.map((m) => <option key={m} value={m}>{fmtMes(m)}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      {mostrarRelatorio && (
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle icon="📊">Valor a pagar por escola</SectionTitle>
          <BarChartH data={totalPorEscola} formatValue={fmtMoeda} />
          <div style={{ marginTop: 16, textAlign: "right" }}>
            <Btn variant="secondary" onClick={() => window.print()}>Imprimir / salvar em PDF</Btn>
          </div>
        </Card>
      )}

      <Card>
        <div className="table-scroll">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ textAlign: "left", color: COLORS.inkSoft, fontSize: 12, textTransform: "uppercase" }}>
              <th style={{ padding: 8 }}>Escola</th>
              <th style={{ padding: 8 }}>Modalidade</th>
              <th style={{ padding: 8 }}>Refeição</th>
              <th style={{ padding: 8 }}>Pratos aprovados</th>
              <th style={{ padding: 8 }}>Valor/prato</th>
              <th style={{ padding: 8 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${COLORS.line}` }}>
                <td style={{ padding: 8 }}>{nomeEscola(l.escolaId)}</td>
                <td style={{ padding: 8 }}>{nomeModalidade(l.modalidadeId)}</td>
                <td style={{ padding: 8 }}>{nomeTipoRefeicao(l.tipoRefeicaoId)}</td>
                <td style={{ padding: 8 }}>{l.pratos}</td>
                <td style={{ padding: 8 }}>{fmtMoeda(valorTipoRefeicao(l.tipoRefeicaoId))}</td>
                <td style={{ padding: 8, fontWeight: 700 }}>{fmtMoeda(l.pratos * valorTipoRefeicao(l.tipoRefeicaoId))}</td>
              </tr>
            ))}
            {linhas.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 16, color: COLORS.inkSoft, textAlign: "center" }}>Nenhum lançamento aprovado ainda.</td></tr>
            )}
          </tbody>
        </table>
        </div>
        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <Btn
            small
            variant="secondary"
            onClick={() =>
              exportarCSV(
                "relatorio-pagamento.csv",
                ["Escola", "Modalidade", "Refeição", "Pratos aprovados", "Valor/prato", "Total"],
                linhas.map((l) => [nomeEscola(l.escolaId), nomeModalidade(l.modalidadeId), nomeTipoRefeicao(l.tipoRefeicaoId), l.pratos, valorTipoRefeicao(l.tipoRefeicaoId), l.pratos * valorTipoRefeicao(l.tipoRefeicaoId)])
              )
            }
          >
            Exportar CSV
          </Btn>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.primary }}>
            Total: {fmtMoeda(totalGeral)}
          </div>
        </div>
      </Card>
    </div>
  );
}
export function RelatorioLancamentos({ db }) {
  const [escolaFiltro, setEscolaFiltro] = useState("todas");
  const [modalidadeFiltro, setModalidadeFiltro] = useState("todas");
  const [tipoRefeicaoFiltro, setTipoRefeicaoFiltro] = useState("todas");
  const [statusValidacaoFiltro, setStatusValidacaoFiltro] = useState("todos");
  const [statusPagamentoFiltro, setStatusPagamentoFiltro] = useState("todos");
  const [mesFiltro, setMesFiltro] = useState("todos");

  const mesesDisponiveis = useMemo(() => {
    const set = new Set(db.lancamentos.map((l) => mesReferenciaDe(l.data)));
    return Array.from(set).sort();
  }, [db.lancamentos]);

  const nomeEscola = (id) => db.escolas.find((e) => e.id === id)?.nome || id;
  const nomeModalidade = (id) => db.modalidades.find((m) => m.id === id)?.nome || id;
  const nomeTipoRefeicao = (id) => db.tiposRefeicao.find((r) => r.id === id)?.nome || id;
  const nomeTurno = (id) => db.turnos.find((t) => t.id === id)?.nome || id;

  const linhas = useMemo(
    () =>
      db.lancamentos
        .filter(
          (l) =>
            (escolaFiltro === "todas" || l.escolaId === escolaFiltro) &&
            (modalidadeFiltro === "todas" || l.modalidadeId === modalidadeFiltro) &&
            (tipoRefeicaoFiltro === "todas" || l.tipoRefeicaoId === tipoRefeicaoFiltro) &&
            (statusValidacaoFiltro === "todos" || l.statusValidacao === statusValidacaoFiltro) &&
            (statusPagamentoFiltro === "todos" || l.statusPagamento === statusPagamentoFiltro) &&
            (mesFiltro === "todos" || mesReferenciaDe(l.data) === mesFiltro)
        )
        .sort((a, b) => (a.data < b.data ? 1 : -1)),
    [db.lancamentos, escolaFiltro, modalidadeFiltro, tipoRefeicaoFiltro, statusValidacaoFiltro, statusPagamentoFiltro, mesFiltro]
  );

  const totalPratos = linhas.reduce((s, l) => s + l.quantidade, 0);

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle icon="🧾">Relatório de lançamentos</SectionTitle>
        <div className="filtro-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <Field label="Escola">
            <select style={inputStyle} value={escolaFiltro} onChange={(e) => setEscolaFiltro(e.target.value)}>
              <option value="todas">Todas</option>
              {db.escolas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </Field>
          <Field label="Modalidade">
            <select style={inputStyle} value={modalidadeFiltro} onChange={(e) => setModalidadeFiltro(e.target.value)}>
              <option value="todas">Todas</option>
              {db.modalidades.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </Field>
          <Field label="Tipo de refeição">
            <select style={inputStyle} value={tipoRefeicaoFiltro} onChange={(e) => setTipoRefeicaoFiltro(e.target.value)}>
              <option value="todas">Todas</option>
              {db.tiposRefeicao.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
          </Field>
          <Field label="Mês">
            <select style={inputStyle} value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)}>
              <option value="todos">Todos</option>
              {mesesDisponiveis.map((m) => <option key={m} value={m}>{fmtMes(m)}</option>)}
            </select>
          </Field>
          <Field label="Cardápio seguido">
            <select style={inputStyle} value={statusValidacaoFiltro} onChange={(e) => setStatusValidacaoFiltro(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="Conforme">Conforme</option>
              <option value="Divergente">Divergente</option>
            </select>
          </Field>
          <Field label="Status de pagamento">
            <select style={inputStyle} value={statusPagamentoFiltro} onChange={(e) => setStatusPagamentoFiltro(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="Pendente">Pendente</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Reprovado">Reprovado</option>
            </select>
          </Field>
        </div>
      </Card>

      <Card>
        <div className="table-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: "left", color: COLORS.inkSoft, fontSize: 12, textTransform: "uppercase" }}>
                <th style={{ padding: 8 }}>Data</th>
                <th style={{ padding: 8 }}>Escola</th>
                <th style={{ padding: 8 }}>Turno</th>
                <th style={{ padding: 8 }}>Modalidade</th>
                <th style={{ padding: 8 }}>Refeição</th>
                <th style={{ padding: 8 }}>Pratos</th>
                <th style={{ padding: 8 }}>Cardápio</th>
                <th style={{ padding: 8 }}>Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.id} style={{ borderTop: `1px solid ${COLORS.line}` }}>
                  <td style={{ padding: 8 }}>{fmtData(l.data)}</td>
                  <td style={{ padding: 8 }}>{nomeEscola(l.escolaId)}</td>
                  <td style={{ padding: 8 }}>{nomeTurno(l.turnoId)}</td>
                  <td style={{ padding: 8 }}>{nomeModalidade(l.modalidadeId)}</td>
                  <td style={{ padding: 8 }}>{nomeTipoRefeicao(l.tipoRefeicaoId)}</td>
                  <td style={{ padding: 8 }}>{l.quantidade}</td>
                  <td style={{ padding: 8 }}><Pill tone={l.statusValidacao === "Conforme" ? "good" : "warn"}>{l.statusValidacao}</Pill></td>
                  <td style={{ padding: 8 }}><Pill tone={l.statusPagamento === "Aprovado" ? "good" : l.statusPagamento === "Reprovado" ? "warn" : "gold"}>{l.statusPagamento}</Pill></td>
                </tr>
              ))}
              {linhas.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 16, textAlign: "center", color: COLORS.inkSoft }}>Nenhum lançamento encontrado com esse filtro.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontSize: 13.5, color: COLORS.inkSoft }}>{linhas.length} lançamento(s) · {totalPratos} pratos no total</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn
              small
              variant="secondary"
              onClick={() =>
                exportarCSV(
                  "relatorio-lancamentos.csv",
                  ["Data", "Escola", "Turno", "Modalidade", "Refeição", "Pratos", "Cardápio seguido", "Status de pagamento"],
                  linhas.map((l) => [fmtData(l.data), nomeEscola(l.escolaId), nomeTurno(l.turnoId), nomeModalidade(l.modalidadeId), nomeTipoRefeicao(l.tipoRefeicaoId), l.quantidade, l.statusValidacao, l.statusPagamento])
                )
              }
            >
              Exportar CSV
            </Btn>
            <Btn small variant="secondary" onClick={() => window.print()}>Imprimir / PDF</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}
export function RelatorioDivergencias({ db }) {
  const [escolaFiltro, setEscolaFiltro] = useState("todas");
  const [mesFiltro, setMesFiltro] = useState("todos");

  const mesesDisponiveis = useMemo(() => {
    const set = new Set(db.lancamentos.map((l) => mesReferenciaDe(l.data)));
    return Array.from(set).sort();
  }, [db.lancamentos]);

  const nomeEscola = (id) => db.escolas.find((e) => e.id === id)?.nome || id;
  const nomeModalidade = (id) => db.modalidades.find((m) => m.id === id)?.nome || id;
  const nomeTipoRefeicao = (id) => db.tiposRefeicao.find((r) => r.id === id)?.nome || id;
  const nomeInsumo = (id) => db.insumos.find((i) => i.id === id)?.nome || id;

  const divergentes = useMemo(
    () =>
      db.lancamentos
        .filter(
          (l) =>
            l.statusValidacao === "Divergente" &&
            (escolaFiltro === "todas" || l.escolaId === escolaFiltro) &&
            (mesFiltro === "todos" || mesReferenciaDe(l.data) === mesFiltro)
        )
        .sort((a, b) => (a.data < b.data ? 1 : -1)),
    [db.lancamentos, escolaFiltro, mesFiltro]
  );

  const porEscola = useMemo(() => {
    const grupos = {};
    divergentes.forEach((l) => { grupos[l.escolaId] = (grupos[l.escolaId] || 0) + 1; });
    return Object.entries(grupos)
      .map(([id, value], i) => ({ label: nomeEscola(id), value, color: CHART_PALETTE[i % CHART_PALETTE.length] }))
      .sort((a, b) => b.value - a.value);
  }, [divergentes, db.escolas]);

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle icon="⚠️">Relatório de divergências</SectionTitle>
        <div className="filtro-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Escola">
            <select style={inputStyle} value={escolaFiltro} onChange={(e) => setEscolaFiltro(e.target.value)}>
              <option value="todas">Todas</option>
              {db.escolas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </Field>
          <Field label="Mês">
            <select style={inputStyle} value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)}>
              <option value="todos">Todos</option>
              {mesesDisponiveis.map((m) => <option key={m} value={m}>{fmtMes(m)}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <SectionTitle icon="🏫">Divergências por escola</SectionTitle>
        <BarChartH data={porEscola} />
      </Card>

      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {divergentes.map((l) => (
            <div key={l.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{nomeEscola(l.escolaId)}</div>
                <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{fmtData(l.data)} · {nomeModalidade(l.modalidadeId)} · {nomeTipoRefeicao(l.tipoRefeicaoId)}</div>
              </div>
              <div style={{ fontSize: 13, marginTop: 6 }}><strong>Servido:</strong> {l.itensServidos.map(nomeInsumo).join(", ")}</div>
              {l.ocorrencia && <div style={{ fontSize: 13, marginTop: 4, color: COLORS.inkSoft }}><strong>Ocorrência:</strong> {l.ocorrencia}</div>}
              <div style={{ marginTop: 6 }}><Pill tone={l.statusPagamento === "Aprovado" ? "good" : l.statusPagamento === "Reprovado" ? "warn" : "gold"}>{l.statusPagamento}</Pill></div>
            </div>
          ))}
          {divergentes.length === 0 && (
            <div style={{ color: COLORS.inkSoft, textAlign: "center", padding: 16 }}>Nenhuma divergência encontrada com esse filtro.</div>
          )}
        </div>
        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn
            small
            variant="secondary"
            onClick={() =>
              exportarCSV(
                "relatorio-divergencias.csv",
                ["Data", "Escola", "Modalidade", "Refeição", "Servido", "Ocorrência", "Status de pagamento"],
                divergentes.map((l) => [fmtData(l.data), nomeEscola(l.escolaId), nomeModalidade(l.modalidadeId), nomeTipoRefeicao(l.tipoRefeicaoId), l.itensServidos.map(nomeInsumo).join(" | "), l.ocorrencia || "", l.statusPagamento])
              )
            }
          >
            Exportar CSV
          </Btn>
          <Btn small variant="secondary" onClick={() => window.print()}>Imprimir / PDF</Btn>
        </div>
      </Card>
    </div>
  );
}
export function RelatorioCardapios({ db }) {
  const [escolaFiltro, setEscolaFiltro] = useState("todas");
  const [modalidadeFiltro, setModalidadeFiltro] = useState("todas");
  const [mesFiltro, setMesFiltro] = useState("todos");

  const nomeModalidade = (id) => db.modalidades.find((m) => m.id === id)?.nome || id;
  const nomeTipoRefeicao = (id) => db.tiposRefeicao.find((r) => r.id === id)?.nome || id;
  const nomeTurno = (id) => db.turnos.find((t) => t.id === id)?.nome || id;
  const nomeEscola = (id) => db.escolas.find((e) => e.id === id)?.nome || id;
  const nomeInsumo = (id) => db.insumos.find((i) => i.id === id)?.nome || id;

  const listaFiltrada = db.cardapios.filter(
    (c) =>
      (escolaFiltro === "todas" || (c.escolaIds || []).includes(escolaFiltro)) &&
      (modalidadeFiltro === "todas" || c.modalidadeId === modalidadeFiltro) &&
      (mesFiltro === "todos" || c.mesReferencia === mesFiltro)
  );

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle icon="📖">Relatório de cardápios</SectionTitle>
        <div className="filtro-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Field label="Escola">
            <select style={inputStyle} value={escolaFiltro} onChange={(e) => setEscolaFiltro(e.target.value)}>
              <option value="todas">Todas</option>
              {db.escolas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </Field>
          <Field label="Modalidade">
            <select style={inputStyle} value={modalidadeFiltro} onChange={(e) => setModalidadeFiltro(e.target.value)}>
              <option value="todas">Todas</option>
              {db.modalidades.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </Field>
          <Field label="Mês">
            <select style={inputStyle} value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)}>
              <option value="todos">Todos</option>
              {db.meses.map((m) => <option key={m.id} value={m.valor}>{fmtMes(m.valor)}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {listaFiltrada.map((c) => (
            <div key={c.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{c.descricao}</div>
              <div style={{ fontSize: 12.5, color: COLORS.inkSoft, margin: "4px 0" }}>
                {fmtMes(c.mesReferencia)} · toda {c.diaSemana}{c.dataReferencia ? ` (ref. ${fmtData(c.dataReferencia)})` : ""} · {nomeTurno(c.turnoId)} · {nomeModalidade(c.modalidadeId)} · {nomeTipoRefeicao(c.tipoRefeicaoId)}
              </div>
              <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 4 }}>
                <strong>Escolas:</strong> {(c.escolaIds || []).map(nomeEscola).join(", ")}
              </div>
              <div style={{ fontSize: 13 }}><strong>Insumos:</strong> {c.itens.map(nomeInsumo).join(", ")}</div>
            </div>
          ))}
          {listaFiltrada.length === 0 && (
            <div style={{ color: COLORS.inkSoft, textAlign: "center", padding: 16 }}>Nenhum cardápio encontrado com esse filtro.</div>
          )}
        </div>
        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn
            small
            variant="secondary"
            onClick={() =>
              exportarCSV(
                "relatorio-cardapios.csv",
                ["Descrição", "Mês", "Dia da semana", "Turno", "Modalidade", "Tipo de refeição", "Escolas", "Insumos"],
                listaFiltrada.map((c) => [c.descricao, fmtMes(c.mesReferencia), c.diaSemana, nomeTurno(c.turnoId), nomeModalidade(c.modalidadeId), nomeTipoRefeicao(c.tipoRefeicaoId), (c.escolaIds || []).map(nomeEscola).join(" | "), c.itens.map(nomeInsumo).join(" | ")])
              )
            }
          >
            Exportar CSV
          </Btn>
          <Btn small variant="secondary" onClick={() => window.print()}>Imprimir / PDF</Btn>
        </div>
      </Card>
    </div>
  );
}
export function RelatorioFechamentos({ db }) {
  const [verId, setVerId] = useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionTitle icon="🔒">Meses fechados</SectionTitle>
      {db.fechamentos.length === 0 && (
        <Card><div style={{ color: COLORS.inkSoft }}>Nenhum mês foi fechado ainda. Feche um mês na aba "Fechamento de mês" para gerar o relatório consolidado dele aqui.</div></Card>
      )}
      {db.fechamentos.slice().reverse().map((f) => (
        <Card key={f.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, fontFamily: FONT_DISPLAY, color: COLORS.primaryDark }}>{fmtMes(f.mes)}</div>
              <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>Fechado em {fmtData(f.geradoEm)} · Total: {fmtMoeda(f.valorTotal)}</div>
            </div>
            <Btn small variant="secondary" onClick={() => setVerId(verId === f.id ? null : f.id)}>
              {verId === f.id ? "Ocultar relatório" : "Ver relatório consolidado"}
            </Btn>
          </div>
          {verId === f.id && (
            <div style={{ marginTop: 18, borderTop: `1px solid ${COLORS.line}`, paddingTop: 18 }}>
              <RelatorioConsolidadoSnapshot f={f} db={db} />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
export const CAMPOS_LANCAMENTO = [
  { key: "escola", label: "Escola", get: (l, db) => db.escolas.find((e) => e.id === l.escolaId)?.nome || "" },
  { key: "data", label: "Data", get: (l) => fmtData(l.data) },
  { key: "turno", label: "Turno", get: (l, db) => db.turnos.find((t) => t.id === l.turnoId)?.nome || "" },
  { key: "modalidade", label: "Modalidade", get: (l, db) => db.modalidades.find((m) => m.id === l.modalidadeId)?.nome || "" },
  { key: "tipoRefeicao", label: "Tipo de refeição", get: (l, db) => db.tiposRefeicao.find((r) => r.id === l.tipoRefeicaoId)?.nome || "" },
  { key: "quantidade", label: "Quantidade de pratos", get: (l) => l.quantidade },
  { key: "insumos", label: "Insumos servidos", get: (l, db) => l.itensServidos.map((id) => db.insumos.find((i) => i.id === id)?.nome || id).join(", ") },
  { key: "statusValidacao", label: "Cardápio seguido", get: (l) => l.statusValidacao || "—" },
  { key: "statusPagamento", label: "Status de pagamento", get: (l) => l.statusPagamento || "—" },
  { key: "ocorrencia", label: "Ocorrência", get: (l) => l.ocorrencia || "—" },
];
export const AGRUPAMENTOS_PERSONALIZADO = [
  { key: "escolaId", label: "Escola" },
  { key: "modalidadeId", label: "Modalidade" },
  { key: "tipoRefeicaoId", label: "Tipo de refeição" },
  { key: "turnoId", label: "Turno" },
];
export function RelatorioPersonalizado({ db }) {
  const [colunas, setColunas] = useState(["escola", "data", "modalidade", "tipoRefeicao", "quantidade", "statusValidacao"]);
  const [escolaFiltro, setEscolaFiltro] = useState("todas");
  const [modalidadeFiltro, setModalidadeFiltro] = useState("todas");
  const [tipoRefeicaoFiltro, setTipoRefeicaoFiltro] = useState("todas");
  const [turnoFiltro, setTurnoFiltro] = useState("todas");
  const [statusValidacaoFiltro, setStatusValidacaoFiltro] = useState("todos");
  const [statusPagamentoFiltro, setStatusPagamentoFiltro] = useState("todos");
  const [mesFiltro, setMesFiltro] = useState("todos");
  const [insumoFiltro, setInsumoFiltro] = useState("todos");
  const [incluirGrafico, setIncluirGrafico] = useState(true);
  const [agruparPor, setAgruparPor] = useState("escolaId");
  const [gerado, setGerado] = useState(false);

  const mesesDisponiveis = useMemo(() => {
    const set = new Set(db.lancamentos.map((l) => mesReferenciaDe(l.data)));
    return Array.from(set).sort();
  }, [db.lancamentos]);

  function toggleColuna(key) {
    setColunas((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
    setGerado(false);
  }

  const resultado = useMemo(() => {
    if (!gerado) return null;
    const linhas = db.lancamentos.filter(
      (l) =>
        (escolaFiltro === "todas" || l.escolaId === escolaFiltro) &&
        (modalidadeFiltro === "todas" || l.modalidadeId === modalidadeFiltro) &&
        (tipoRefeicaoFiltro === "todas" || l.tipoRefeicaoId === tipoRefeicaoFiltro) &&
        (turnoFiltro === "todas" || l.turnoId === turnoFiltro) &&
        (statusValidacaoFiltro === "todos" || l.statusValidacao === statusValidacaoFiltro) &&
        (statusPagamentoFiltro === "todos" || l.statusPagamento === statusPagamentoFiltro) &&
        (mesFiltro === "todos" || mesReferenciaDe(l.data) === mesFiltro) &&
        (insumoFiltro === "todos" || l.itensServidos.includes(insumoFiltro))
    );

    let grafico = null;
    if (incluirGrafico) {
      const nomeGrupo = (id) => {
        const chaveDb = { escolaId: "escolas", modalidadeId: "modalidades", tipoRefeicaoId: "tiposRefeicao", turnoId: "turnos" }[agruparPor];
        return db[chaveDb].find((x) => x.id === id)?.nome || id;
      };
      const grupos = {};
      linhas.forEach((l) => {
        const chave = l[agruparPor];
        grupos[chave] = (grupos[chave] || 0) + l.quantidade;
      });
      grafico = Object.entries(grupos)
        .map(([id, value], i) => ({ label: nomeGrupo(id), value, color: CHART_PALETTE[i % CHART_PALETTE.length] }))
        .sort((a, b) => b.value - a.value);
    }

    return { linhas, grafico };
  }, [gerado, db, escolaFiltro, modalidadeFiltro, tipoRefeicaoFiltro, turnoFiltro, statusValidacaoFiltro, statusPagamentoFiltro, mesFiltro, insumoFiltro, incluirGrafico, agruparPor]);

  const colunasSelecionadas = CAMPOS_LANCAMENTO.filter((c) => colunas.includes(c.key));

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle icon="🧩">Relatório personalizado</SectionTitle>
        <div style={{ fontSize: 13.5, color: COLORS.inkSoft, marginBottom: 16 }}>
          Monte um relatório escolhendo os filtros, as colunas e, se quiser, um gráfico com base nos dados lançados no sistema.
        </div>

        <Field label="Colunas do relatório">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CAMPOS_LANCAMENTO.map((c) => (
              <label
                key={c.key}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9,
                  border: `1.5px solid ${colunas.includes(c.key) ? COLORS.primary : COLORS.line}`,
                  background: colunas.includes(c.key) ? COLORS.primarySoft : "#fff", cursor: "pointer", fontSize: 13.5,
                }}
              >
                <input type="checkbox" checked={colunas.includes(c.key)} onChange={() => toggleColuna(c.key)} />
                {c.label}
              </label>
            ))}
          </div>
        </Field>

        <div className="filtro-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <Field label="Escola">
            <select style={inputStyle} value={escolaFiltro} onChange={(e) => { setEscolaFiltro(e.target.value); setGerado(false); }}>
              <option value="todas">Todas</option>
              {db.escolas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </Field>
          <Field label="Modalidade">
            <select style={inputStyle} value={modalidadeFiltro} onChange={(e) => { setModalidadeFiltro(e.target.value); setGerado(false); }}>
              <option value="todas">Todas</option>
              {db.modalidades.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </Field>
          <Field label="Tipo de refeição">
            <select style={inputStyle} value={tipoRefeicaoFiltro} onChange={(e) => { setTipoRefeicaoFiltro(e.target.value); setGerado(false); }}>
              <option value="todas">Todas</option>
              {db.tiposRefeicao.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
          </Field>
          <Field label="Turno">
            <select style={inputStyle} value={turnoFiltro} onChange={(e) => { setTurnoFiltro(e.target.value); setGerado(false); }}>
              <option value="todas">Todas</option>
              {db.turnos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </Field>
          <Field label="Cardápio seguido">
            <select style={inputStyle} value={statusValidacaoFiltro} onChange={(e) => { setStatusValidacaoFiltro(e.target.value); setGerado(false); }}>
              <option value="todos">Todos</option>
              <option value="Conforme">Conforme</option>
              <option value="Divergente">Divergente</option>
            </select>
          </Field>
          <Field label="Status de pagamento">
            <select style={inputStyle} value={statusPagamentoFiltro} onChange={(e) => { setStatusPagamentoFiltro(e.target.value); setGerado(false); }}>
              <option value="todos">Todos</option>
              <option value="Pendente">Pendente</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Reprovado">Reprovado</option>
            </select>
          </Field>
          <Field label="Mês">
            <select style={inputStyle} value={mesFiltro} onChange={(e) => { setMesFiltro(e.target.value); setGerado(false); }}>
              <option value="todos">Todos</option>
              {mesesDisponiveis.map((m) => <option key={m} value={m}>{fmtMes(m)}</option>)}
            </select>
          </Field>
          <Field label="Insumo servido">
            <select style={inputStyle} value={insumoFiltro} onChange={(e) => { setInsumoFiltro(e.target.value); setGerado(false); }}>
              <option value="todos">Todos</option>
              {db.insumos.map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
            </select>
          </Field>
          <Field label="Agrupar gráfico por">
            <select style={inputStyle} value={agruparPor} onChange={(e) => { setAgruparPor(e.target.value); setGerado(false); }} disabled={!incluirGrafico}>
              {AGRUPAMENTOS_PERSONALIZADO.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
          </Field>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, marginTop: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={incluirGrafico} onChange={(e) => { setIncluirGrafico(e.target.checked); setGerado(false); }} />
          Incluir gráfico (soma de pratos por grupo selecionado)
        </label>

        <div style={{ marginTop: 16 }}>
          <Btn onClick={() => setGerado(true)} disabled={colunas.length === 0}>Gerar relatório</Btn>
        </div>
      </Card>

      {resultado && (
        <>
          {resultado.grafico && (
            <Card style={{ marginBottom: 16 }}>
              <SectionTitle icon="📊">Gráfico do relatório</SectionTitle>
              <BarChartH data={resultado.grafico} />
            </Card>
          )}
          <Card>
            <div className="table-scroll">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: COLORS.inkSoft, fontSize: 12, textTransform: "uppercase" }}>
                    {colunasSelecionadas.map((c) => <th key={c.key} style={{ padding: 8 }}>{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {resultado.linhas.map((l) => (
                    <tr key={l.id} style={{ borderTop: `1px solid ${COLORS.line}` }}>
                      {colunasSelecionadas.map((c) => <td key={c.key} style={{ padding: 8 }}>{c.get(l, db)}</td>)}
                    </tr>
                  ))}
                  {resultado.linhas.length === 0 && (
                    <tr><td colSpan={colunasSelecionadas.length} style={{ padding: 16, textAlign: "center", color: COLORS.inkSoft }}>Nenhum resultado com esses parâmetros.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ fontSize: 13.5, color: COLORS.inkSoft }}>{resultado.linhas.length} resultado(s)</div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn
                  small
                  variant="secondary"
                  onClick={() =>
                    exportarCSV(
                      "relatorio-personalizado.csv",
                      colunasSelecionadas.map((c) => c.label),
                      resultado.linhas.map((l) => colunasSelecionadas.map((c) => c.get(l, db)))
                    )
                  }
                >
                  Exportar CSV
                </Btn>
                <Btn small variant="secondary" onClick={() => window.print()}>Imprimir / PDF</Btn>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
export function Relatorios({ db }) {
  const [sub, setSub] = useState("pagamento");
  return (
    <div>
      <Tabs
        tabs={[
          { key: "pagamento", label: "Pagamento", icon: "💰" },
          { key: "lancamentos", label: "Lançamentos", icon: "🧾" },
          { key: "divergencias", label: "Divergências", icon: "⚠️" },
          { key: "cardapios", label: "Cardápios", icon: "📖" },
          { key: "fechamentos", label: "Meses fechados", icon: "🔒" },
          { key: "personalizado", label: "Personalizado", icon: "🧩" },
        ]}
        active={sub}
        onChange={setSub}
      />
      {sub === "pagamento" && <RelatorioPagamento db={db} />}
      {sub === "lancamentos" && <RelatorioLancamentos db={db} />}
      {sub === "divergencias" && <RelatorioDivergencias db={db} />}
      {sub === "cardapios" && <RelatorioCardapios db={db} />}
      {sub === "fechamentos" && <RelatorioFechamentos db={db} />}
      {sub === "personalizado" && <RelatorioPersonalizado db={db} />}
    </div>
  );
}
export function NutricionistaContent({ tab, db, setDb, usuario }) {
  return (
    <div>
      {tab === "dashboard" && <Dashboard db={db} />}
      {tab === "aprovacaoCardapios" && <AprovacaoCardapios db={db} setDb={setDb} usuario={usuario} />}
      {tab === "pendencias" && <Pendencias db={db} setDb={setDb} usuario={usuario} />}
      {tab === "cadastros" && <Cadastros db={db} setDb={setDb} usuario={usuario} />}
      {tab === "relatorios" && <Relatorios db={db} />}
      {tab === "fechamento" && <FechamentoMes db={db} setDb={setDb} usuario={usuario} />}
      {tab === "historico" && <Historico db={db} />}
    </div>
  );
}
