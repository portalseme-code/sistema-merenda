// Comunicação com o backend (Google Apps Script + Google Sheets).
//
// IMPORTANTE: troque a URL abaixo pela URL do SEU projeto do Apps Script
// (Implantar → Gerenciar implantações → copiar o link que termina em /exec).
export const API_URL = 'https://script.google.com/macros/s/AKfycbyCXrRLT98VTjhN9OO1C_5_BlE7gJuDqRp9KHvKtIKLgXLSDjLAEi6focJqpTsL4yi4/exec';

/** Busca o estado completo do sistema salvo na planilha. */
export async function carregarDb() {
  const resp = await fetch(API_URL, { method: 'GET' });
  if (!resp.ok) throw new Error('Falha ao carregar dados do servidor.');
  return resp.json();
}

/**
 * Salva o estado completo do sistema na planilha.
 * Usa Content-Type text/plain de propósito: evita que o navegador dispare
 * uma requisição de "preflight" (OPTIONS) que o Apps Script não sabe responder.
 */
export async function salvarDb(db) {
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(db),
    });
  } catch (err) {
    console.error('Falha ao salvar dados no servidor:', err);
  }
}
