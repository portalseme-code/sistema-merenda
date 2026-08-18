import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// IMPORTANTE: troque 'sistema-refeicoes-escolares' pelo nome exato do seu
// repositório no GitHub antes de publicar no GitHub Pages.
// Ex: se o repo for github.com/sua-secretaria/refeicoes-escolares,
// o base deve ser '/refeicoes-escolares/'.
export default defineConfig({
  plugins: [react()],
  base: '/sistema-refeicoes-escolares/',
});
