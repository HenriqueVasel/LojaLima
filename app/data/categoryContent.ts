import styles from "@/app/styles/category.module.css";

export type InfoCard = {
  title: string;
  desc: string;
  tags?: string[];
  image?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type CategoryContent = {
  title: string;
  subtitle: string;
  intro: string;

  // Estrutura visual da categoria
  bannerImage?: string;
  introImage?: string;

  cards: InfoCard[];
};

// WhatsApp
const WHATSAPP = "https://wa.me/554738423235";

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  // =========================================================
  // DATA CENTER
  // /categoria/data-center
  // =========================================================
  "data-center": {
    title: "Data Center",

    subtitle: "Infraestrutura crítica para empresas e projetos",

    intro:
      "Soluções completas para implantação ou expansão de Data Centers, incluindo racks, energia e nobreaks, cabeamento estruturado (passivo e ativo), comunicação, segurança eletrônica e controle de acesso. Realizamos o dimensionamento conforme a demanda do projeto e entregamos uma estrutura organizada, segura e preparada para crescimento.",

    bannerImage: "/produtos/bannerDatacenter.png",

    introImage: "/produtos/herodatacenter.png",

    cards: [
      {
        title: "Racks",
        desc:
          "Soluções para racks de piso ou parede, com organização, ventilação e segurança dos equipamentos.",
        tags: ["Estrutura", "Organização"],
        image: "/produtos/datacentercard.png",
        ctaLabel: "Mais informações",
        ctaHref: WHATSAPP,
      },

      {
        title: "Energia e Nobreaks",
        desc:
          "Proteção contra quedas e surtos, com nobreaks dimensionados por carga e autonomia.",
        tags: ["Proteção", "Continuidade", "Segurança"],
        image: "/produtos/energiaenobreak.jpeg",
        ctaLabel: "Mais informações",
        ctaHref: WHATSAPP,
      },

      {
        title: "Passivos",
        desc:
          "Cabeamento estruturado, cordões ópticos, patch cords, patch panels, além de rotulação e identificação dos pontos.",
        tags: ["Rede", "Estruturado", "Padronização", "Organização"],
        image: "/produtos/passivos.PNG",
        ctaLabel: "Mais informações",
        ctaHref: WHATSAPP,
      },

      {
        title: "Ativos",
        desc:
          "Switches, roteadores e gateways, com suporte a PoE e equipamentos gerenciáveis nas camadas L2 e L3.",
        tags: ["Performance", "Gerenciável", "PoE"],
        image: "/produtos/ativoscard.png",
        ctaLabel: "Mais informações",
        ctaHref: WHATSAPP,
      },

      {
        title: "Comunicação",
        desc:
          "Soluções em telefonia comercial e empresarial, interfonia condominial e sistemas de imagem.",
        tags: ["Padrão", "Manutenção", "Imagem", "Comunicação"],
        image: "/produtos/comunicacao.png",
        ctaLabel: "Mais informações",
        ctaHref: WHATSAPP,
      },

      {
        title: "Segurança Eletrônica",
        desc:
          "Sistemas de câmeras de segurança e alarmes de intrusão com IA embarcada.",
        tags: [
          "Proteção",
          "Gravadores",
          "Boas práticas",
          "Câmeras",
          "Alarme",
        ],
        image: "/produtos/segurancaele.jpeg",
        ctaLabel: "Mais informações",
        ctaHref: WHATSAPP,
      },

      {
        title: "Controle de Acesso",
        desc:
          "Soluções de controle de acesso para ambientes críticos, com biometria facial, biometria digital, tags ou senhas.",
        tags: [
          "Acesso",
          "Controle",
          "Registro",
          "Gerenciamento",
        ],
        image: "/produtos/controleacesso.png",
        ctaLabel: "Mais informações",
        ctaHref: WHATSAPP,
      },

      {
        title: "Instalação e Manutenção",
        desc:
          "Serviços de instalação e manutenção preventiva e corretiva, seguindo normas técnicas e boas práticas do setor.",
        tags: [
          "Suporte",
          "Preventiva",
          "Expansão",
          "Corretiva",
          "Organização",
        ],
        image: "/produtos/InstalaManutencao.png",
        ctaLabel: "Mais informações",
        ctaHref: WHATSAPP,
      },
    ],
  },

  // =========================================================
  // SISTEMA DE SEGURANÇA
  // /categoria/sistema-de-seguranca
  // =========================================================
  "sistema-de-seguranca": {
    title: "Sistema de Segurança",

    subtitle: "Monitoramento, alarmes e controle de acesso",

    intro:
      "Soluções para ambientes residenciais, comerciais e empresariais, incluindo câmeras CFTV, alarmes, controle de acesso, câmeras com inteligência artificial embarcada e comunicação condominial. Oferecemos uma solução completa e personalizada, desenvolvida de acordo com as necessidades de cada cliente, com foco em qualidade, segurança e alto desempenho.",

    bannerImage: "/produtos/bannerseguranca.png",

    introImage: "/produtos/herosistema.jpeg",

    cards: [
      {
        title: "Câmeras (CFTV)",
        desc:
          "Câmeras internas e externas, IP ou analógicas.",
        tags: [
          "CFTV",
          "Dia/Noite",
          "Externa/Interna",
        ],
        image: "/produtos/card1.jpeg",
        ctaLabel: "Mais informações",
        ctaHref: WHATSAPP,
      },

      {
        title: "Gravadores (DVR/NVR)",
        desc:
          "Gestão de imagens e armazenamento conforme a necessidade do projeto.",
        tags: [
          "DVR",
          "NVR",
          "Armazenamento",
        ],
        image: "/produtos/card2.jpeg",
        ctaLabel: "Mais informações",
        ctaHref: WHATSAPP,
      },

      {
        title: "Alarmes",
        desc:
          "Centrais, sensores e alertas para proteção contra intrusão.",
        tags: [
          "Intrusão",
          "Sensores",
          "Alertas",
        ],
        image: "/produtos/card3.jpeg",
        ctaLabel: "Mais informações",
        ctaHref: WHATSAPP,
      },

      {
        title: "Controle de Acesso",
        desc:
          "Soluções com reconhecimento facial, biometria digital, senhas e tags.",
        tags: [
          "Facial",
          "Biometria",
          "Tags",
        ],
        image: "/produtos/card4.jpeg",
        ctaLabel: "Mais informações",
        ctaHref: WHATSAPP,
      },

      {
        title: "Câmeras com IA",
        desc:
          "Detecção de pessoas, veículos e alertas inteligentes com inteligência artificial embarcada.",
        tags: [
          "IA",
          "Alertas",
          "Inteligente",
        ],
        image: "/produtos/card5.jpeg",
        ctaLabel: "Mais informações",
        ctaHref: WHATSAPP,
      },

      {
        title: "Perimetral e Barreiras",
        desc:
          "Sensores e sistemas de proteção para áreas externas e perímetros.",
        tags: [
          "Perímetro",
          "Prevenção",
          "Externo",
          "Segurança",
        ],
        image: "/produtos/card6.jpeg",
        ctaLabel: "Mais informações",
        ctaHref: WHATSAPP,
      },

      {
        title: "Interfonia / Vídeo Porteiro",
        desc:
          "Liberação de acesso com imagem e áudio, trazendo mais controle e praticidade.",
        tags: [
          "Entrada",
          "Praticidade",
          "Controle",
          "Comunicação",
        ],
        image: "/produtos/card7.jpeg",
        ctaLabel: "Mais informações",
        ctaHref: WHATSAPP,
      },

      {
        title: "Instalação e Configuração",
        desc:
          "Instalação organizada, com configuração completa e acesso remoto via aplicativo.",
        tags: [
          "Suporte",
          "Expansão",
          "Preventiva",
          "Corretiva",
        ],
        image: "/produtos/card8.png",
        ctaLabel: "Mais informações",
        ctaHref: WHATSAPP,
      },
    ],
  },
};