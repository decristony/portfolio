const fs = require('fs');

const p = 'c:\\\\Users\\\\decri\\\\OneDrive\\\\Área de Trabalho\\\\Desing\\\\meu\\\\portfolio\\\\Portfolio\\\\index.html';
let content = fs.readFileSync(p, 'utf8');

// Title & Meta
content = content.replace(/<title>.*?<\/title>/, '<title>Tony (Decristony) — Web Designer & Desenvolvedor</title>');
// Navbar
content = content.replace(/>EC<\/a>/g, '>TD</a>');
content = content.replace(/"#about">About<\/a>/g, '"#about">Sobre</a>');
content = content.replace(/>Portfolio<\/a>/g, '>Portfólio</a>');
content = content.replace(/"#services">Services<\/a>/g, '"#services">Serviços</a>');
content = content.replace(/"#contact">Contact<\/a>/g, '"#contact">Contato</a>');
content = content.replace(/>Get in touch<\/span>/g, '>Falar comigo</span>');

// Hero
content = content.replace(/>Expert Creator<\/span>/g, '>Especialista em Performance Digital</span>');
content = content.replace(/Elwin Correo, <span/g, 'Tony (Decristony), <span');
content = content.replace(/Your Creator<\/span><\/h1>/g, 'Web Dev</span></h1>');
content = content.replace(
  />\s*Brief initial presentation of myself and my previous experiences\.\s*<\/p>/,
  '>\n      Crio sites rápidos, estratégicos e pensados para gerar resultado real.<br>\n      👉 Do design à conversão: tudo focado no crescimento do seu projeto.\n    </p>\n    <div class="mt-6 flex gap-4">\n      <a href="#services" class="inline-flex items-center gap-2 rounded-full border border-emerald-500 bg-emerald-500/10 px-6 py-2.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-all">Ver Projetos</a>\n      <a href="#contact" class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-2.5 text-sm font-medium text-neutral-200 hover:bg-white/10 transition-all">Falar comigo</a>\n    </div>'
);

// Left Panel
content = content.replace(/>Available for work<\/span>/g, '>Disponível para projetos</span>');
content = content.replace(/Hello I am <span/g, 'Olá, eu sou <span');
content = content.replace(/>Elwin\s+Correo<\/span>/g, '>Tony (Decristony)</span>');
content = content.replace(/>GHL Website, Funnel, Automation, Builder\. AI Images and Videos Creator\.<\/p>/g, '>Web designer e desenvolvedor com +4 anos de exp, atuando na criação de soluções digitais completas.</p>');
content = content.replace(/Connect with me/g, 'Falar no WhatsApp');

// Right Panel
content = content.replace(
  />I'm Elwin Correo, a dedicated GHL Builder &amp; AI Creator based in the beauty of universe\. I specialize in designing, building, creating, with seamless technical execution to craft exceptional digital experiences\.<\/p>/g,
  ">Minha base técnica em Java e PHP me permite desenvolver sistemas robustos e eficientes. Além disso, tenho uma forte atuação em design e marketing digital para criar projetos que escalam e convertem real.</p>"
);

content = content.replace(/>Product\s+Design<\/span>/g, '>WordPress & WooCommerce</span>');
content = content.replace(/>Automation<\/span>/g, '>React & Next.js</span>');
content = content.replace(/>AI\s+Image<\/span>/g, '>PHP & Java</span>');
content = content.replace(/>Ai\s+VIdeo<\/span>/g, '>Tailwind CSS</span>');
content = content.replace(/>Ads<\/span>/g, '>Photoshop (Avançado)</span>');
content = content.replace(/>Landing\s+Page<\/span>/g, '>Tráfego Pago & UX/UI</span>');

// Experience
content = content.replace(/>Artificial Intelligence<\/p>/g, '>Web Designer & Desenvolvedor</p>');
content = content.replace(/>GoHighLevel<\/p>/g, '>Instrutor de Photoshop</p>');
content = content.replace(/>Automation<\/p>\s*<p class="text-xs text-neutral-400 font-geist"><\/p>\s*<\/div>\s*<\/div>\s*<span class="text-xs text-neutral-400 font-geist">2025<\/span>/, '>Resultados / Performance</p><p class="text-xs text-neutral-400 font-geist">Carregamento < 500ms</p></div></div><span class="text-xs text-neutral-400 font-geist">Métrica</span>');
content = content.replace(/>Designer<\/p>\s*<p class="text-xs text-neutral-400 font-geist"><\/p>\s*<\/div>\s*<\/div>\s*<span class="text-xs text-neutral-400 font-geist">2023<\/span>/, '>Especialista em Ad Creatives</p><p class="text-xs text-neutral-400 font-geist">Criativos focados em ADS</p></div></div><span class="text-xs text-neutral-400 font-geist">Otimizado</span>');


// Clean up remaining empty exp desc tags for the first two
content = content.replace(/>Web Designer & Desenvolvedor<\/p>\s*<p class="text-xs text-neutral-400 font-geist"><\/p>\s*<\/div>\s*<\/div>\s*<span class="text-xs text-neutral-400 font-geist">2024<\/span>/, '>Web Designer & Desenvolvedor</p><p class="text-xs text-neutral-400 font-geist">Sites responsivos, e-commerce, padronização</p></div></div><span class="text-xs text-neutral-400 font-geist">2019–Atual</span>');

content = content.replace(/>Instrutor de Photoshop<\/p>\s*<p class="text-xs text-neutral-400 font-geist"><\/p>\s*<\/div>\s*<\/div>\s*<span class="text-xs text-neutral-400 font-geist">2024<\/span>/, '>Instrutor de Photoshop</p><p class="text-xs text-neutral-400 font-geist">Edição, design e manipulação do 0 ao Pro</p></div></div><span class="text-xs text-neutral-400 font-geist">Cursos</span>');


// Services Section
content = content.replace(/>Outputs<\/span>/g, '>Serviços RGV</span>');
content = content.replace(/Creative <span/g, 'Meus <span');
content = content.replace(/Services<\/span>\s*<\/h2>/g, 'Serviços<\/span>\s*<\/h2>');
content = content.replace(/>\s*Explore a modern set of services crafted to elevate your business and brand presence across social media and identity\.\s*<\/p>/g, '>Soluções definitivas de sites vitrine, landing pages e e-commerces, do Design à Estratégia.</p>');

content = content.replace(/>GoHighLevel<\/h3>/g, '>Criação de Websites Profissionais</h3>');
content = content.replace(/>High-performing, user-centered websites, funnels, automation, landing page that accelerate growth and feel unmistakably yours\.<\/p>/g, '>Sites modernos, responsivos e focados em conversão. Otimização de performance & SEO para alcance orgânico.</p>');

content = content.replace(/>Logo Systems<\/h3>/g, '>E-commerce com WordPress</h3>');
content = content.replace(/>\s*Distinctive, scalable identity marks with a full system of rules and assets for consistent brand expression\.\s*<\/p>/g, '>\n              Lojas completas com WooCommerce prontas para vender. Integração com IA, automação de conteúdo e bots inteligentes.\n            </p>');

content = content.replace(/>Static Ad Creative<\/h3>/g, '>Design & Publicidade Digital</h3>');
content = content.replace(/<\/h3>\s*<\/div>\s*<p class="sm:text-base text-sm text-neutral-400 font-geist mt-3" style=""><\/p>/g, '</h3>\n            </div>\n            <p class="sm:text-base text-sm text-neutral-400 font-geist mt-3" style="">Criação de artes para redes sociais, criativos para anúncios (Facebook Ads / Google Ads), Identidade Visual e edição masterizada.</p>');

content = content.replace(/>Artificial Intelligence<\/h3>/g, '>Design Systems & UX Avançado</h3>');
content = content.replace(/>Some outputs that help businesses and brand owners\.<\/p>/g, '>Padronização visual e escalabilidade para projetos grandes, economizando tempo e mantendo altíssima qualidade.</p>');

// Contact Section
content = content.replace(/>Start a project<\/h3>/g, '>Dê o próximo passo</h3>');
content = content.replace(/>Tell me about your goals and timelines\. We'll reply within 1–2 business days\.<\/p>/g, '>Quer tirar um projeto do papel ou melhorar seus resultados de vendas hoje? Estou pronto para atuar.</p>');
content = content.replace(/>elwincorreo33@gmail\.com<\/span>/g, '>(61) 99672-5908</span>');

// Footer
content = content.replace(/>Elwin Correo<\/h3>/g, '>Tony (Decristony)</h3>');
content = content.replace(/>Builder, Creator, Designer, creating exceptional digital experiences with seamless technical execution\. Based in mind\.<\/p>/g, '>Perfil Completo: design + código + marketing. Visão estratégica de negócio usando IA para ganho max de eficiência.</p>');
content = content.replace(/<h4 class="text-sm font-medium mb-3 font-geist text-white">Services<\/h4>/g, '<h4 class="text-sm font-medium mb-3 font-geist text-white">Soft/Hard Skills</h4>');
content = content.replace(/>Website Design<\/a>/g, '>FullStack Web Dev</a>');
content = content.replace(/>Funnel Design<\/a>/g, '>UI/UX Design</a>');
content = content.replace(/>Automation System<\/a>/g, '>Sistemas com IA</a>');
content = content.replace(/>AI Image and Video<\/a>/g, '>Ad Creatives</a>');

content = content.replace(/elwincorreo33@gmail\.com/g, 'decristony@gmail.com');
content = content.replace(/<a class="transition hover:text-white font-geist" href="#about">About<\/a>/, '<a class="transition hover:text-white font-geist" href="https://wa.me/5561996725908">(61) 99672-5908</a>');

content = content.replace(/© 2025 Elwin Correo\. All rights reserved\./g, '© 2026 Tony (Decristony) — Todos os direitos reservados. Design, código e estratégia no mesmo lugar 🚀');

fs.writeFileSync(p, content, 'utf8');
console.log('Update complete');
