# Portfólio — Tony (Decristony) · OrvionWeb

Portfólio em React + Vite com os sites conceituais da OrvionWeb para clínicas.

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
npm run preview  # serve o dist/ localmente
npm run lint
```

## Publicar na Vercel

O `vercel.json` já define o build (`npm run build` → `dist/`), o redirecionamento de
todas as rotas para o `index.html` (React Router) e o cache dos arquivos estáticos.
Basta importar a pasta `portfolio/` como projeto na Vercel, ou rodar `npx vercel` aqui.

## Estrutura

```
src/
  pages/              uma página por rota (Work em /, Project, About, Lab, Contact, NotFound)
  components/
    layout/           menu, transições de página, bolha de vidro do clique
    work/             página Projetos: vista Espacial (SpaceTunnel) e Sanfona (CardStack)
    backdrops/        fundos: tema do projeto e o ambiente animado de cada um (Ambience)
    modals/           janelas modais
  hooks/              hooks de React (tema do projeto, UI, relógio)
  lib/                funções sem React (layout da página do projeto, tema, navegação por passos)
  context/            som do site
  styles/ambience.css cenas animadas de cada projeto
  data/portfolioData.js   todo o conteúdo: projetos, textos, contatos
public/
  projects/orvion/    capas, posts (post/), recortes da transição (hero/) e páginas (page/)
  about/  fonts/  sounds/
```

## Adicionar ou editar um projeto

Tudo fica em `src/data/portfolioData.js`, na lista `rawProjects`:

- `cover`: capa do Behance em `public/projects/orvion/<slug>.jpg` (ou `null` para a capa
  genérica feita com a paleta).
- O post da página do projeto é `public/projects/orvion/post/<slug>.jpg` e o recorte da
  transição de clique é `public/projects/orvion/hero/<slug>.jpg` (topo do post, 1400×1820).
- Ambiente animado: cada projeto tem a sua cena em `src/components/backdrops/Ambience.jsx`
  (mapa `SCENE`, pelo slug) e o visual em `src/styles/ambience.css`.
- `theme`: força as cores do fundo em Projetos (`background`, `primary`, `secondary`,
  `accent`, `motif`).
