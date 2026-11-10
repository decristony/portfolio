import { asset } from '../lib/asset';
/*
 * ---------------------------------------------------------------------------
 * PORTFOLIO CONTENT
 * ---------------------------------------------------------------------------
 * Everything the site renders comes from this file. Projetos: sites prontos da
 * OrvionWeb. Capas do Behance ficam em /public/projects/orvion.
 * ---------------------------------------------------------------------------
 */

const ROLES = ['Direção de arte', 'Web design', 'Front-end'];
const TEAM = 'OrvionWeb · projeto conceitual';

/*
 * Sites prontos (O:/orvion/WebsitesGenerator/sites prontos).
 * cover: capa do Behance em /public/projects/orvion. Quem ainda não tem capa
 * fica com cover: null e aparece com uma capa genérica montada pela paleta.
 */
/* Imagens da página do projeto (exportadas de "sites prontos") e site no ar.
   Todos os 14 estão publicados no GitHub Pages; alguns repositórios têm outro nome. */
const REPO = {
  'raiz-fisioterapia-pilates': 'raiz-fisioterapia',
  'colo-obstetricia': 'Colo-Obstetr-cia',
  'meridiano-acupuntura': 'Meridiano-Acupuntura',
};
// post: o do Behance; sem post do Behance (Colo), o site inteiro
const assetsFor = (slug) => ({
  post: asset(`/projects/orvion/post/${slug}.webp`),
  postSmall: asset(`/projects/orvion/post/${slug}-800.webp`), // celular e minimapa
  hero: asset(`/projects/orvion/hero/${slug}.webp`),
  liveUrl: `https://decristony.github.io/${REPO[slug] ?? slug}/`,
});

const rawProjects = [
  {
    slug: 'tez-dermatologia-estetica',
    title: 'TEZ',
    category: 'Dermatologia estética · São Paulo',
    date: 'Novembro 2026',
    year: 2026,
    description:
      'Clínica de dermatologia estética nos Jardins montada como capa de revista: a palavra “pele” passa atrás da modelo e o cursor pinta as letras.',
    typography: ['Cormorant Garamond', 'Jost'],
    colors: ['#F2EBE3', '#A65F43', '#C98767', '#EBD3C6', '#2D201B'],
    cover: '/projects/orvion/tez-dermatologia-estetica.webp',
  },
  {
    slug: 'compasso-cardiologia',
    title: 'COMPASSO',
    category: 'Cardiologia · Vitória',
    date: 'Novembro 2026',
    year: 2026,
    description:
      'Uma direção de arte em que só o coração tem cor: mundo em preto e branco, vermelho reservado à vida e uma ausculta interativa guiada pelo pulso.',
    typography: ['Bodoni Moda', 'Schibsted Grotesk'],
    colors: ['#FBF8F3', '#B21E2D', '#5C0F1C', '#E8D3CB', '#1C1718'],
    cover: '/projects/orvion/compasso-cardiologia.webp',
  },
  {
    slug: 'nervura-neurologia',
    title: 'NERVURA',
    category: 'Neurologia · Campinas',
    date: 'Novembro 2026',
    year: 2026,
    description:
      'Um site que se revela como um exame. Um mapa interativo liga cada sintoma a uma região do cérebro, sem começar pelo termo técnico.',
    typography: ['Syne', 'Geist'],
    colors: ['#0B1220', '#F0A64A', '#1D2A40', '#7FB7D6', '#EEF1F5'],
    cover: '/projects/orvion/nervura-neurologia.webp',
  },
  {
    slug: 'ciranda-pediatria',
    title: 'CIRANDA',
    category: 'Pediatria · Fortaleza',
    date: 'Novembro 2026',
    year: 2026,
    description:
      'Clínica de pediatria de 0 a 12 anos. Uma régua acompanha as fases da infância e uma ferramenta com as referências da OMS aproxima os pais do crescimento do filho.',
    typography: ['Corben', 'Outfit'],
    colors: ['#FFF8EE', '#86B6E4', '#EF7A58', '#CFEBDD', '#F6C453'],
    cover: '/projects/orvion/ciranda-pediatria.webp',
  },
  {
    slug: 'clareira-psicologia',
    title: 'CLAREIRA',
    category: 'Psicologia · Salvador',
    date: 'Novembro 2026',
    year: 2026,
    description:
      'Uma marca que convida a desacelerar. A abertura usa a névoa como metáfora do primeiro passo e três perguntas ajudam a escolher o acompanhamento.',
    typography: ['Gilda Display', 'Nunito Sans'],
    colors: ['#EDF0EB', '#173634', '#A2532F', '#A7BAAC', '#E7DED0'],
    cover: '/projects/orvion/clareira-psicologia.webp',
  },
  {
    slug: 'passada-medicina-esportiva',
    title: 'PASSADA',
    category: 'Medicina do esporte · Rio de Janeiro',
    date: 'Novembro 2026',
    year: 2026,
    description:
      'Para atletas amadores que querem treinar mais e se lesionar menos: tipografia condensada, laranja de sinalização e o corpo em movimento.',
    typography: ['Big Shoulders Display', 'Barlow'],
    colors: ['#0D141F', '#FF5B1F', '#172233', '#FFB089', '#F4F2ED'],
    cover: '/projects/orvion/passada-medicina-esportiva.webp',
  },
  {
    slug: 'sereno-clinica-do-sono',
    title: 'SERENO',
    category: 'Medicina do sono · Curitiba',
    date: 'Outubro 2026',
    year: 2026,
    description:
      'Um site que dura uma noite: um relógio vai de 22:00 a 07:00 conforme a rolagem e a única luz acesa é o cursor.',
    typography: ['Instrument Serif', 'Manrope'],
    colors: ['#0A0F24', '#B7B2F5', '#F2B36B', '#F3E9CF', '#1B2452'],
    cover: '/projects/orvion/sereno-clinica-do-sono.webp',
    // noite: preto aveludado no tom da capa, com o céu estrelado também na tela Projetos
    theme: { background: '#0b0e10', primary: '#1c2327', secondary: '#151a1e', accent: '#B7B2F5' },
  },
  {
    slug: 'iris-oftalmologia',
    title: 'ÍRIS',
    category: 'Oftalmologia · Florianópolis',
    date: 'Outubro 2026',
    year: 2026,
    description:
      'Abre fora de foco, de propósito. A foto fica nítida em um segundo e um simulador mostra a tabela de letras embaçando como numa miopia.',
    typography: ['Fraunces', 'DM Sans'],
    colors: ['#F6F4EE', '#0E3B43', '#2F6FA8', '#9ED9CC', '#FF7A59'],
    cover: '/projects/orvion/iris-oftalmologia.webp',
  },
  {
    slug: 'marfim-odontologia',
    title: 'MARFIM',
    category: 'Ortodontia · Porto Alegre',
    date: 'Outubro 2026',
    year: 2026,
    description:
      'A primeira coisa que o site faz é clarear a própria foto. O título passa de contorno para letra cheia no ritmo do sorriso.',
    typography: ['Bricolage Grotesque', 'Figtree'],
    colors: ['#F4EFE6', '#0D3237', '#C4794B', '#BFD9D3', '#172021'],
    cover: '/projects/orvion/marfim-odontologia.webp',
  },
  {
    slug: 'faro-clinica-veterinaria',
    title: 'FARO',
    category: 'Veterinária 24h · Recife',
    date: 'Outubro 2026',
    year: 2026,
    description:
      'Plantão 24 horas para tutores preocupados. A foto abre em persianas e, no desktop, o cursor vira a luz do otoscópio.',
    typography: ['Young Serif', 'Rethink Sans'],
    colors: ['#F7F1E8', '#13304A', '#EE9A55', '#A9BFA8', '#F6C79D'],
    cover: '/projects/orvion/faro-clinica-veterinaria.webp',
  },
  {
    slug: 'raiz-fisioterapia-pilates',
    title: 'RAIZ',
    category: 'Fisioterapia e pilates · Belo Horizonte',
    date: 'Outubro 2026',
    year: 2026,
    description:
      'Estúdio de fisioterapia ortopédica, esportiva e pilates clínico, com avaliação completa e turmas de até 3 alunos.',
    typography: ['Archivo Expanded', 'Archivo'],
    colors: ['#F1ECE2', '#E0482B', '#6B7A2A', '#D9A21B', '#141414'],
    cover: '/projects/orvion/raiz-fisioterapia-pilates.webp',
    // preto da capa, para as raízes e o vermelho aparecerem
    theme: { background: '#111110', primary: '#2b2c22', secondary: '#1d1c19', accent: '#E0482B' },
  },
  {
    slug: 'colo-obstetricia',
    title: 'COLO',
    category: 'Obstetrícia e pré-natal · Belém',
    date: 'Novembro 2026',
    year: 2026,
    description:
      'Clínica de obstetrícia no Umarizal: pré-natal, ultrassom, preparo para o parto e pós-parto com a mesma equipe.',
    typography: ['DM Serif Display', 'Karla'],
    colors: ['#F5ECE2', '#6A3726', '#9E4529', '#E0AE63', '#2B1620'],
    cover: '/projects/orvion/colo-obstetricia.webp',
  },
  {
    slug: 'meridiano-acupuntura',
    title: 'MERIDIANO',
    category: 'Acupuntura e medicina integrativa · Brasília',
    date: 'Novembro 2026',
    year: 2026,
    description:
      'Clínica na Asa Sul com acupuntura, moxabustão, ventosaterapia, tuiná e fitoterapia.',
    typography: ['Playfair Display', 'Work Sans'],
    colors: ['#171514', '#D9772F', '#A8642A', '#D6A867', '#EFE7DA'],
    cover: '/projects/orvion/meridiano-acupuntura.webp',
  },
  {
    slug: 'timbre-otorrino-audiologia',
    title: 'TIMBRE',
    category: 'Otorrino, audiologia e voz · Natal',
    date: 'Novembro 2026',
    year: 2026,
    description:
      'Otorrinolaringologia, audiologia e fonoaudiologia em Petrópolis: audiometria, aparelho auditivo, voz, zumbido e otorrino infantil.',
    typography: ['Anybody', 'Inter Tight'],
    colors: ['#F1EFEA', '#3E95A5', '#E8572F', '#1F6672', '#0E2329'],
    cover: '/projects/orvion/timbre-otorrino-audiologia.webp',
  },
].map((project) => ({
  team: TEAM,
  roles: ROLES,
  recognition: [],
  ...project,
  cover: project.cover ? asset(project.cover) : null,
  ...assetsFor(project.slug),
}));

const projects = rawProjects.map((project, index) => ({
  ...project,
  index: index + 1,
  number: String(index + 1).padStart(2, '0'),
}));

export const portfolioData = {
  site: {
    brand: 'TD',
    name: 'Tony (Decristony)',
    role: 'Web designer e desenvolvedor front-end',
    shortRole: 'Design + código',
    location: 'Brasília, DF',
    timezone: 'America/Sao_Paulo',
    timezoneLabel: 'Brasília',
    email: 'decristony@gmail.com',
    phone: '(61) 99672-5908',
    whatsapp: 'https://wa.me/5561996725908',
    workingGlobally: 'Atendendo todo o Brasil',
    availability: 'Disponível para projetos',
    copyright: '© 2026 Tony (Decristony)',
    intro: 'Mais do que sites, crio experiências digitais que conectam e convertem.',
    // Enquanto as páginas de projeto não estão prontas, os cards não abrem.
    projectPagesEnabled: true,
  },

  labels: {
    menu: 'Menu',
    work: 'Projetos',
    about: 'Sobre',
    playground: 'Laboratório',
    contact: 'Contato',
    audioOn: 'Som ligado',
    audioOff: 'Som desligado',
    inquiries: 'Para projetos',
    selectedWork: 'Projetos',
    scroll: 'Role',
    launch: 'Lançamento',
    recognition: 'Tipografia',
    team: 'Estúdio',
    role: 'Papel',
    close: 'Fechar',
    next: 'Próximo projeto',
    previous: 'Projeto anterior',
    back: 'Voltar',
    viewProject: 'Ver projeto',
    allWork: 'Todos os projetos',
    copied: 'Copiado',
    copyEmail: 'Clique para copiar',
    credits: 'Créditos',
    coverPending: 'Capa em produção',
  },

  projects,

  about: {
    heading: 'Estratégia, design e código no mesmo lugar.',
    intro:
      'Sou Tony (Decristony), web designer e desenvolvedor front-end em Brasília, com mais de 4 anos criando soluções digitais.',
    bio: [
      'Meu trabalho une estética, performance e usabilidade. Cuido do site do primeiro esboço ao código publicado, com foco em carregamento rápido e SEO.',
      'Pela OrvionWeb, desenho sites para clínicas e profissionais de saúde, cada um com identidade própria: paleta, tipografia e uma interação que nasce da especialidade.',
      'Também dou aulas de Photoshop e uso IA e automação para que o site trabalhe pelo negócio do cliente, não só pela aparência.',
    ],
    services: [
      'Criação de websites profissionais',
      'Landing pages de alta conversão',
      'Redesign e otimização de velocidade',
      'Cardápios digitais e menus interativos',
      'Edição e tratamento de imagens',
      'Automação e integração com IA',
    ],
    experience: [
      { period: '2026 — atual', role: 'Direção de arte e web design', company: 'OrvionWeb' },
      { period: '2019 — atual', role: 'Web designer e desenvolvedor', company: 'Independente' },
      { period: 'Cursos', role: 'Instrutor de Photoshop', company: 'Edição, design e manipulação' },
    ],
    // Ferramentas no lugar de prêmios (a página Sobre mostra esta lista).
    recognition: [
      { year: 'Código', title: 'React, Next.js e Tailwind CSS' },
      { year: 'CMS', title: 'WordPress, Elementor e WooCommerce' },
      { year: 'Back-end', title: 'PHP e Java' },
      { year: 'Imagem', title: 'Photoshop avançado' },
      { year: 'Marketing', title: 'Tráfego pago, SEO e ad creatives' },
    ],
    portrait: asset('/about/tony.webp'),
  },

  contact: {
    heading: 'Vamos conversar',
    intro: 'Tem um projeto em mente? Me mande um e-mail ou chame direto no WhatsApp: (61) 99672-5908.',
    groups: [
      {
        title: 'Conversa rápida',
        links: [{ label: 'WhatsApp', url: 'https://wa.me/5561996725908' }],
      },
      {
        title: 'Projetos e processo',
        links: [
          { label: 'Behance', url: 'https://www.behance.net/decristaraujo7' },
          { label: 'GitHub', url: 'https://github.com/decristony' },
        ],
      },
      {
        title: 'Redes',
        links: [
          { label: 'Instagram', url: 'https://www.instagram.com/decristony/' },
          { label: 'LinkedIn', url: 'https://www.linkedin.com/in/decristonyaraujo/' },
        ],
      },
    ],
  },

  credits: {
    items: [
      { label: 'Design e desenvolvimento', value: 'Tony (Decristony)' },
      { label: 'Tipografia', value: 'BT Grotesk, BT Glyphius, F37 Bolton' },
      { label: 'Feito com', value: 'React, Vite, Framer Motion' },
    ],
    note: 'Os sites de clínicas são projetos conceituais da OrvionWeb: marcas fictícias, sem vínculo com clínicas reais.',
  },
};

export const getProject = (slug) =>
  portfolioData.projects.find((project) => project.slug === slug);

export const getProjectNeighbours = (slug) => {
  const index = portfolioData.projects.findIndex((project) => project.slug === slug);
  if (index === -1) return { previous: null, next: null };
  return {
    previous:
      portfolioData.projects[(index - 1 + portfolioData.projects.length) % portfolioData.projects.length],
    next: portfolioData.projects[(index + 1) % portfolioData.projects.length],
  };
};

export const padIndex = (value) => String(value).padStart(2, '0');
