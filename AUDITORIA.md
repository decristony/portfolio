# Auditoria pré-produção — 11/11/2026

Branch `pente-fino/2026-11-11`, sem commit. Comparação entre o build do commit `0b332a0` (antes) e o desta branch (depois), medidos **na mesma hora e na mesma máquina**.

## Veredito
**Pronto com ressalvas.**
- A abertura agora vem primeiro e o site carrega por trás dela.
- Sobre e Projeto ficaram bem mais rápidos.
- Celular fraco rebaixa os efeitos sozinho, e o console está limpo.
- A ressalva: a home ainda gasta ~4 s de JavaScript no celular, durante a abertura (ver Pendente 1).

## Notas por área (0–10)
| Área | Antes | Depois | Comentário curto |
|---|---|---|---|
| Abertura e ordem de carregamento | 3 | 8 | O Work aparecia 2,4 s antes da abertura no celular; agora nunca. Falta aliviar o JS que roda por trás. |
| Render e efeitos | 4 | 7 | Níveis de aparelho com rebaixamento automático na troca de projeto. O túnel 3D continua pesado no nível baixo. |
| Responsivo e layout | 7 | 8 | Sem rolagem lateral de 375 a 1440 px; hover não gruda no toque; `dvh`; foco preso no menu. |
| Build e assets | 6 | 7 | three.js só no primeiro clique; sons sob demanda. Imagens de post seguem pesadas. |
| Bugs, sincronia e qualidade | 7 | 8 | ~518 avisos de áudio → 20; SEO 100; capas corrigidas para o GitHub Pages. 35 durações de animação diferentes. |

## Números (Lighthouse mobile + medição quadro a quadro)
Lighthouse: mobile simulado (CPU 4×, 4G lenta), melhor de 2 execuções. Medição quadro a quadro: `medir.mjs` no Chrome headless, CPU 4× na abertura e 6× na troca de projeto, sem GPU (o FPS serve para comparar, não é absoluto).

| Métrica | Antes | Depois |
|---|---|---|
| Performance (home / projeto / sobre) | 45 / 58 / 63 | 49 / 73 / 86 |
| Abertura aparece (`medir.mjs`, celular) | 4,2 s | **0,94 s** |
| Work aparece antes da abertura? | **Sim**, por 2,4 s (169 quadros) | **Não** (0 quadros) |
| Site pronto por trás da abertura | — | 4,2 s (a bolha abre aos ~17 s) |
| FCP da home (Lighthouse) | 0,91 s (era o Work vazando) | 1,39 s (a abertura) |
| Speed Index da home | 3,8 s | 2,5 s |
| LCP (home / projeto / sobre) | 7,2 / 5,3 / 4,5 s | 5,5 / 4,6 / 3,2 s |
| TBT (home / projeto / sobre) | 3,9 s / 787 / 733 ms | 4,1 s / 400 / 327 ms |
| CLS | 0,001 | 0,001 |
| Acessibilidade / Boas práticas / SEO | 100 / 100 / 91 | 100 / 100 / 100 |
| Peso transferido (home / projeto / sobre) | 1.853 / 841 / 520 KB | 1.855 / 658 / 337 KB |
| JS inicial (gzip) | 145 KB | 153 KB (+5 KB: o `intro.js` agora conta como inicial; ele já era baixado de qualquer jeito) |
| Maior chunk (gzip) | three.js 191 KB, baixado em toda página | igual, mas só no primeiro clique em projeto |
| Peso de public/ | 11,9 MB | 11,9 MB |
| FPS na troca — Sanfona (alto / baixo / automático) | 10,8 | 12,1 / **43** / 38,6 |
| FPS na troca — Espacial (alto / baixo / automático) | 6,5 | 5,9 / 17,8 / 9,3 |
| Quadros > 50 ms durante a abertura | 11 | 17 (o site agora monta por trás dela) |

Como ler os números:
- O FCP da home "piorou" porque, antes, o primeiro conteúdo da tela era o Work aparecendo antes da hora.
- No modo automático, o site começa no nível alto e desce sozinho depois das primeiras trocas. Na medição, desceu para o nível baixo nos dois modos.
- O TBT da home oscila entre 3,9 e 4,8 s nas duas versões. Não mudou.

## Segunda rodada (mesmo dia)
| Métrica | Depois da 1ª rodada | Agora |
|---|---|---|
| Performance da home | 49 | **65** |
| LCP da home | 5,5 s | **3,5 s** |
| TBT da home | 4,1 s | **1,3 s** |
| Peso no carregamento da home | 1.855 KB | **588 KB** (o túnel baixa depois da abertura) |
| Bloqueio da página durante a abertura (`medir.mjs`) | 3,6 s | **0,97 s** |
| Quadros > 50 ms durante a abertura | 17 | 10 |
| FPS no nível baixo, abrindo na Sanfona | 43 | 48,6 |

- [x] P1 **Túnel 3D só depois da abertura.**
  - Durante a abertura, a Sanfona-ponte segura a tela e as animações do site ficam paradas (`html.intro-on #root *`).
  - O túnel monta quando a bolha termina (`useIntroDone`), e no nível baixo só monta se a vista for Espacial.
  - Arquivos: `src/pages/Work.jsx`, `src/lib/intro.js`, `public/intro/intro.js` (`waiters`), `src/index.css`.
- [x] P1 **Nível baixo começa na Sanfona** quando não há vista salva; o Espacial continua no botão. — `src/pages/Work.jsx` (`readView`)
- [x] P1 **Acabamento das capas.**
  - Túnel: cantos arredondados (14px, como na Sanfona) e borda suavizada no shader, com `fwidth`. Assim a borda não serrilha nem mostra a linha de pixel com o antialias desligado.
  - Sanfona: a capa recorta o próprio canto, e o card com imagem não tem mais o fundo e o fio interno que escapavam em volta dela.
  - Arquivos: `src/components/work/SpaceTunnel.jsx`, `src/index.css`.
- [x] P1 **Rebaixamento automático mais cuidadoso.** A primeira troca de projeto é ignorada como aquecimento, e a medição não roda no `npm run dev`, que é lento por natureza e rebaixava um PC forte por engano (provável origem da borda serrilhada). — `src/lib/perfTier.js`

## O que foi corrigido (1ª rodada)
**Abertura primeiro (novo)**
- [x] P1 A abertura vem no próprio HTML.
  - O que mudou: um script inline decide antes do primeiro quadro se a abertura aparece, e o primeiro quadro já é a página escura. O `intro.js` carrega com `defer`, antes do bundle, e começa a abertura sem esperar o React.
  - Arquivos: `index.html`, `public/intro/intro.js` (fim do arquivo).
  - Efeito: o Work vazava 2,4 s antes da abertura; agora não vaza mais. A abertura aparece aos 0,94 s em vez de 4,2 s.
- [x] P1 A abertura espera o site.
  - O que mudou: antes da bolha abrir, ela espera o sinal de "site pronto" (fontes carregadas e primeira capa decodificada), com teto de 6 s. Também marca `site-montado` e `site-pronto` na linha do tempo do navegador. O caminho antigo continua como reserva, e o StrictMode não reinicia a abertura.
  - Arquivos: `src/components/layout/Loader.jsx`, `public/intro/intro.js` (opções `ready`, `readyTimeout`, `onReveal`).
- [x] P1 Rebaixamento automático na troca de projeto.
  - O problema: a medição com a página parada não pegava o celular fraco, porque o peso só aparece na troca.
  - O que mudou: as duas primeiras trocas são medidas. Abaixo de 40 fps, o site desce um nível, e pode descer de novo nas duas seguintes. Nível forçado com `?perf=` não é mexido.
  - Arquivos: `src/lib/perfTier.js` (`noteTransition`), `src/pages/Work.jsx`.
  - Efeito: Sanfona no automático foi de 13,7 para 38,6 fps.

**Desempenho e efeitos**
- [x] P0 Sistema de níveis de aparelho (`alto` / `medio` / `baixo`).
  - Detecção por núcleos, memória, toque, economia de dados e reduced-motion.
  - Teste para forçar um nível: `?perf=baixo|medio|alto`.
  - O nível alto continua com o mesmo visual.
  - Arquivos: `src/lib/perfTier.js`, `src/main.jsx`.
- [x] P0 Vidro por nível: blur de 10 px no médio; painel sólido com fio de luz no baixo. — `src/index.css`, bloco "Níveis de aparelho"
- [x] P1 Fundo, cenas e grão parados no médio e no baixo. — `src/index.css`
- [x] P1 Canvas de pulso e estrelas: `dpr` limitado por nível, loop parado com a aba oculta e quadro parado no baixo. — `PulseBackdrop.jsx`, `StarsBackdrop.jsx`
- [x] P1 Túnel 3D por nível: no baixo, dpr 1, sem desfoque de profundidade e com malha 12×12. — `SpaceTunnel.jsx`
- [x] P1 Rastro do cursor desligado no nível baixo; lente de vidro líquido do Lab só no nível alto. — `App.jsx`, `CursorTrail.jsx`, `Lab.jsx`
- [x] P1 three.js (191 KB) e o contexto WebGL só no primeiro clique em projeto, não mais em toda página. — `GlassReveal.jsx` — Sobre: 520 → 337 KB; Projeto: 841 → 658 KB.

**Layout, acessibilidade e qualidade**
- [x] P1 Menu do celular: o foco fica preso dentro dele e volta ao botão ao fechar. — `MenuOverlay.jsx`
- [x] P1 18 regras de `:hover` dentro de `@media (hover: hover)`, para não grudar depois do toque. — `src/index.css`
- [x] P2 `100vh` → `100svh`/`100dvh` com fallback na página de projeto. Os fundos fixos ficaram em `100vh` de propósito. — `src/index.css`
- [x] P2 `fetchpriority` nas imagens que definem o LCP. — `Project.jsx`, `CardStack.jsx`
- [x] P2 Alt da foto do Sobre em português. — `About.jsx`
- [x] P2 ~518 avisos de áudio por visita → 20. — `public/intro/intro.js`
- [x] P2 Sons da interface só baixam com o som ligado. — `SoundContext.jsx`
- [x] P2 `robots.txt` criado. — SEO 91 → 100
- [x] P2 Rewrite da Vercel cobre `intro/`, `og.jpg` e `robots.txt`. — `vercel.json`
- [x] P2 Capas passam por `asset()`, o que corrige os caminhos no GitHub Pages. — `src/data/portfolioData.js`
- [x] P2 Prefixo `-webkit-backdrop-filter` no modal, para o Safari. — `src/index.css`
- [x] P2 Limite do aviso de chunk subiu para 800 KB. Só tira o aviso, não economiza peso: o único chunk acima é o three.js, que é sob demanda. — `vite.config.js`

## Pendente (precisa da sua decisão)
- [x] ~~P1 JS da home no celular~~: feito na 2ª rodada (TBT 4,1 → 1,3 s).
- [x] ~~P1 Túnel 3D em celular fraco~~: feito na 2ª rodada (o nível baixo abre na Sanfona).
- [ ] P2 Carregar as texturas do túnel aos poucos (a capa em foco e as 3 seguintes), para o túnel ficar pronto mais cedo depois da abertura.
- [ ] P1 **12 imagens de post acima de 250 KB** (de 281 a 644 KB). Recomprimir em WebP com qualidade ~80 e no máximo 1800 px reduz bastante o peso, mas mexe na qualidade, que é escolha sua.
- [ ] P2 **Domínio final**, para preencher `og:image` (com URL absoluta), `og:url` e `canonical`.
- [ ] P2 `viewport-fit=cover` + área segura do iPhone; `apple-touch-icon` 180×180.
- [ ] P2 Animações que mexem em propriedades caras: `case-beam-line` anima `top`, `grid-drift`/`grain-shift` animam `background-position`, `blur-in` anima `filter`. Trocar por `transform`/`opacity` mantém o visual com custo bem menor.
- [ ] P2 35 durações de animação diferentes (de 120 ms a 2,6 s): juntar em 4 ou 5 tokens deixa as trocas mais sincronizadas.
- [ ] P2 Atualizar o `@react-three/fiber` tira o aviso "THREE.Clock deprecated". É troca de dependência.
- [ ] P2 14 avisos do oxlint, todos já existiam antes.

## Checklist de produção
- [x] `npm run build` sem erros (o aviso de chunk foi silenciado de propósito; ver acima)
- [x] Abertura é o primeiro quadro na primeira visita; o Work só aparece pela revelação (0 quadros vazados com CPU 4× + 4G lenta)
- [ ] Abertura fluida com CPU 6× enquanto o site carrega por trás: com CPU 4× teve 17 quadros acima de 50 ms (Pendente 1)
- [x] Console sem erros (Lighthouse, 3 rotas, e navegador em 5173/4173)
- [x] Sem rolagem lateral em 375, 768, 1280 e 1440 px (home, sobre, projeto)
- [x] Nível baixo testado e fluido na Sanfona (43 fps); no Espacial ainda não (Pendente 2)
- [x] `prefers-reduced-motion` respeitado (a abertura some na hora e os fundos ficam parados)
- [ ] Imagens com dimensões: 5 `<img>` ainda sem `width`/`height`, mas o CLS medido é 0,001
- [ ] Rotas diretas e F5 funcionam: testado só no `vite preview`, falta confirmar na Vercel
- [ ] Título, descrição, OG e favicon: falta o domínio para o OG absoluto
- [x] Foco visível e teclado no menu (o modal de contato não foi testado por teclado)
- [x] Nenhum console.log nem arquivo órfão grande em public/ (as variantes `-800.webp` são usadas pelo código)

Medições brutas: `.pente-fino/` (Lighthouse em `lh/`, quadro a quadro em `medir/`, telas em `depois/telas/`).
