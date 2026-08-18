# Sistema de Refeições Escolares · SEME

Projeto React (Vite) migrado do protótipo. Estrutura:

```
src/
  theme.js                 → cores, fontes, paleta de gráficos
  utils.js                 → formatação de datas/moeda, regras de negócio (comparação de cardápio, histórico, notificações, CSV)
  mockData.js               → dados de exemplo (SEED) — hoje é a "base de dados" em memória, será substituído pela integração com Google Sheets
  App.jsx                   → componente raiz (login, roteamento entre Nutricionista/Escola)
  main.jsx                  → ponto de entrada do React
  components/
    ui.jsx                  → componentes visuais reutilizáveis (Card, Botões, Tabs, gráficos, ícones...)
    AppShell.jsx             → barra superior, menu lateral, cabeçalho de página
    TelaLogin.jsx
    EscolaApp.jsx            → telas do acesso Escola (lançamento, histórico)
    NutricionistaApp.jsx     → telas do acesso Nutricionista (painel, pendências, cadastros, relatórios, fechamento, histórico)
```

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Gerando a versão de produção

```bash
npm run build
```

Gera a pasta `dist/` pronta para publicar.

## Publicando no GitHub Pages (automático)

O projeto já vem com um arquivo (`.github/workflows/deploy.yml`) que builda e publica o site automaticamente toda vez que você enviar código para a branch `main` — não precisa rodar `npm run deploy` na mão depois do envio inicial.

1. Crie um repositório novo no GitHub (ex: `refeicoes-escolares`).
2. Em `vite.config.js`, ajuste a propriedade `base` para `'/nome-do-seu-repositorio/'` (o nome exato do repositório, com as mesmas maiúsculas/minúsculas).
3. Suba este projeto para o repositório:
   ```bash
   git init
   git add .
   git commit -m "Primeira versão do sistema"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPO.git
   git push -u origin main
   ```
4. No GitHub, vá em **Settings → Pages**. No campo **Source**, troque de "Deploy from a branch" para **"GitHub Actions"**.
5. Vá na aba **Actions** do repositório — deve aparecer uma execução chamada "Publicar no GitHub Pages" já rodando sozinha (disparada pelo passo 3). Espera terminar (ícone verde ✓).
6. O link do site aparece em **Settings → Pages**, no topo, algo como `https://seu-usuario.github.io/nome-do-repo/`.

Depois disso, qualquer novo `git push` na branch `main` publica a versão nova automaticamente — sem precisar rodar nada no terminal além do `git push`.

## Backend real (Google Sheets + Apps Script) — já ligado

O frontend já está preparado para conversar com o backend: veja `src/api.js`.
O código do backend está em `backend-apps-script/Code.gs`.

### Passo a passo para ativar

1. **Crie uma planilha nova no Google Sheets** (pode ficar em branco — as abas
   são criadas automaticamente pelo script). Copie o ID dela: é o trecho da
   URL entre `/d/` e `/edit`.
   Ex: `docs.google.com/spreadsheets/d/AQUI-ESTÁ-O-ID/edit` → copie "AQUI-ESTÁ-O-ID".

2. **Abra o projeto do Apps Script que você já tem** (o mesmo do link que
   termina em `/exec`) e cole todo o conteúdo de `backend-apps-script/Code.gs`
   nele, substituindo o que já existir.

3. No topo do arquivo colado, troque:
   ```js
   const SPREADSHEET_ID = 'COLE_AQUI_O_ID_DA_SUA_PLANILHA';
   ```
   pelo ID que você copiou no passo 1.

4. Selecione a função `configurarPlanilha` no menu de funções do editor e
   clique em **Executar**. Na primeira vez ele vai pedir autorização — permita.
   Isso cria as 13 abas necessárias na sua planilha.

5. Vá em **Implantar → Gerenciar implantações**, clique no ícone de lápis
   (editar) na implantação existente, em "Versão" escolha **Nova versão** e
   clique em **Implantar**. Isso é o que faz o código novo valer para o
   link que você já tem (o `/exec`).

6. Confira em `src/api.js` se a constante `API_URL` está com a URL certa —
   ela já vem preenchida com a URL que você me passou, então normalmente não
   precisa mexer aqui.

7. Gere a nova versão do site e publique de novo:
   ```bash
   npm run build
   npm run deploy
   ```

A partir daí, tudo que for cadastrado ou lançado no sistema passa a ser
salvo de verdade na planilha — e volta a aparecer mesmo depois de fechar o
navegador ou trocar de dispositivo.

### Como funciona por baixo dos panos

- Cada aba da planilha guarda os registros daquela categoria em duas colunas:
  `id` e `dados` (um JSON com o registro completo). Isso evita ter que achatar
  listas e objetos aninhados (como os itens de um cardápio) em várias colunas.
- Ao abrir o sistema, o frontend busca (`GET`) o estado inteiro salvo na
  planilha.
- Sempre que algo muda no sistema, o frontend manda (`POST`) o estado inteiro
  de volta para o backend, que regrava as abas. É uma abordagem simples e
  confiável para o volume de dados de uma rede municipal — se um dia isso
  crescer muito, dá para evoluir para gravações mais granulares (só o que
  mudou), mas não é necessário agora.

