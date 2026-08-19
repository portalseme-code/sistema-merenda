import { DIAS_SEMANA, MESES } from './theme.js';

export function fmtData(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
export function fmtMoeda(v) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
export function mesAtualISO() {
  return todayISO().slice(0, 7);
}
export function diaSemanaDe(iso) {
  const d = new Date(iso + "T12:00:00");
  return DIAS_SEMANA[d.getDay()];
}
export function mesReferenciaDe(iso) {
  return iso.slice(0, 7);
}
export function fmtMes(mesISO) {
  if (!mesISO) return "";
  const [y, m] = mesISO.split("-");
  return `${MESES[Number(m) - 1]}/${y}`;
}
export function agora() {
  return new Date().toISOString();
}
export function fmtDataHora(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
export function registrarHistorico(setDb, usuario, acao) {
  setDb((prev) => ({
    ...prev,
    historico: [{ id: "h" + Date.now() + Math.random().toString(36).slice(2, 6), data: agora(), usuario: usuario ? usuario.nomeCompleto : "Sistema", acao }, ...prev.historico],
  }));
}
export function notificar(setDb, destinatarios, mensagem) {
  const lista = Array.isArray(destinatarios) ? destinatarios : [destinatarios];
  setDb((prev) => ({
    ...prev,
    notificacoes: [
      ...lista.map((dest) => ({ id: "n" + Date.now() + Math.random().toString(36).slice(2, 6), data: agora(), destinatario: dest, mensagem, lida: false })),
      ...prev.notificacoes,
    ],
  }));
}
export function exportarCSV(nomeArquivo, headers, rows) {
  const linhas = [headers.join(";"), ...rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";"))];
  const conteudo = "\uFEFF" + linhas.join("\r\n");
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
export function compararCardapio(previstos, servidos) {
  const p = new Set(previstos);
  const s = new Set(servidos);
  const faltando = previstos.filter((i) => !s.has(i));
  const extras = servidos.filter((i) => !p.has(i));
  const conforme = faltando.length === 0 && extras.length === 0;
  return { conforme, faltando, extras };
}
export function gerarSnapshotMes(db, mes) {
  const lancamentosMes = db.lancamentos.filter((l) => mesReferenciaDe(l.data) === mes);
  const aprovados = lancamentosMes.filter((l) => l.statusPagamento === "Aprovado");
  const reprovados = lancamentosMes.filter((l) => l.statusPagamento === "Reprovado");
  const naoDecididos = lancamentosMes.filter((l) => l.statusPagamento === "Pendente");
  const conformes = lancamentosMes.filter((l) => l.statusValidacao === "Conforme").length;
  const divergentes = lancamentosMes.filter((l) => l.statusValidacao === "Divergente").length;
  const totalPratos = lancamentosMes.reduce((s, l) => s + l.quantidade, 0);
  const totalPratosAprovados = aprovados.reduce((s, l) => s + l.quantidade, 0);

  const grupos = {};
  aprovados.forEach((l) => {
    const key = l.escolaId + "|" + l.tipoRefeicaoId;
    if (!grupos[key]) grupos[key] = { escolaId: l.escolaId, tipoRefeicaoId: l.tipoRefeicaoId, pratos: 0 };
    grupos[key].pratos += l.quantidade;
  });
  const linhas = Object.values(grupos).map((g) => ({
    ...g,
    valor: g.pratos * (db.tiposRefeicao.find((r) => r.id === g.tipoRefeicaoId)?.valor || 0),
  }));
  const valorTotal = linhas.reduce((s, l) => s + l.valor, 0);

  return {
    mes,
    geradoEm: todayISO(),
    totalLancamentos: lancamentosMes.length,
    totalPratos,
    totalPratosAprovados,
    conformes,
    divergentes,
    aprovados: aprovados.length,
    reprovados: reprovados.length,
    naoDecididos: naoDecididos.length,
    linhas,
    valorTotal,
  };
}
export function cardapioEstaAprovado(c) {
  // Compatibilidade: cardápios cadastrados antes dessa mudança não têm
  // "status" — são considerados aprovados automaticamente, para não travar
  // cardápios que já estavam em uso.
  return !c.status || c.status === "Aprovado";
}
export function buscarCardapioVigente(cardapios, { modalidadeId, tipoRefeicaoId, turnoId, escolaId, data }) {
  const mes = mesReferenciaDe(data);
  const diaSemana = diaSemanaDe(data);
  return (
    cardapios.find(
      (c) =>
        cardapioEstaAprovado(c) &&
        c.modalidadeId === modalidadeId &&
        c.tipoRefeicaoId === tipoRefeicaoId &&
        c.turnoId === turnoId &&
        (c.escolaIds || []).includes(escolaId) &&
        c.mesReferencia === mes &&
        c.diaSemana === diaSemana
    ) || null
  );
}
export function gerarLoginUsuario(nomeCompleto) {
  const partes = nomeCompleto.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "";
  if (partes.length === 1) return partes[0].toUpperCase();
  return `${partes[0]}.${partes[partes.length - 1]}`.toUpperCase();
}
export function gerarSenhaAleatoria() {
  return Math.random().toString(36).slice(-8);
}
export const SENHA_PADRAO_SOLICITACAO = "Abc@2026";
