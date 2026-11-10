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

## Publicar

- **GitHub Pages** (https://decristony.github.io/portfolio/): automático a cada envio para a
  `main`, pelo workflow `.github/workflows/pages.yml` (build com `VITE_BASE=/portfolio/`).
- **Vercel**: o `vercel.json` já define o build, as rotas do React Router e o cache.

Os caminhos de `public/` passam por `src/lib/asset.js`, que soma a base do site.

## Abertura e som

A abertura (primeira visita da sessão) e o som (digitação e lo-fi de Projetos) ficam em
`public/intro/intro.js` e `intro.css`, sem build. A prévia `preview/abertura.html` usa os
mesmos arquivos: dá para ver a abertura com dois cliques, sem rodar o site.

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

- `cover`: capa em `public/projects/orvion/<slug>.webp` (ou `null` para a capa genérica
  feita com a paleta).
- Post da página do projeto: `post/<slug>.webp` (1400 px) e `post/<slug>-800.webp` (celular e
  minimapa). Recorte da transição de clique: `hero/<slug>.webp` (topo do post, 1400×1820).
- Imagens em WebP (qualidade 82–84): mesma aparência, cerca de metade do peso do JPG.
- Ambiente animado: cada projeto tem a sua cena em `src/components/backdrops/Ambience.jsx`
  (mapa `SCENE`, pelo slug) e o visual em `src/styles/ambience.css`.
- `theme`: força as cores do fundo em Projetos (`background`, `primary`, `secondary`,
  `accent`, `motif`).
