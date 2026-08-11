export type TaxonomyDefinition = {
  name: string;
  types: Record<
    string,
    {
      name: string;
      subtypes?: string[];
      lines?: string[];
    }
  >;
};

export const TAXONOMY: Record<string, TaxonomyDefinition> = {

  cftv: {
    name: "CFTV",

    types: {
      cameras: {
        name: "Câmeras",
        subtypes: [
          "IP",
          "Wi-Fi",
          "Multi-HD",
          "Analógicas",
          "Speed Dome",
        ],
        lines: [
          "VIP",
          "VIPW",
          "VHD",
          "VHDM",
        ],
      },

      dvr: {
        name: "DVR",
        subtypes: [
          "Gravadores DVR",
        ],
        lines: [
          "MHDX",
          "IMHDX",
        ],
      },

      nvr: {
        name: "NVR",
        subtypes: [
          "Gravadores NVR",
        ],
        lines: [
          "NVD",
          "INVD",
        ],
      },

      accessories: {
        name: "Acessórios CFTV",
      },

      hd: {
        name: "HDs",
      },

      storage: {
        name: "Armazenamento",
      },
    },
  },

  alarmes: {
    name: "Alarmes",

    types: {
      centrales: {
        name: "Centrais de Alarme",
        subtypes: [
          "Monitoradas",
          "Não monitoradas",
          "Convencionais",
        ],
        lines: [
          "AMT",
          "ANM",
        ],
      },

      sensors: {
        name: "Sensores",
        subtypes: [
          "Presença",
          "Magnéticos",
          "Barreira",
          "Fumaça",
          "Temperatura",
        ],
      },

      sirens: {
        name: "Sirenes",
      },

      receivers: {
        name: "Receptores",
      },

      keyboards: {
        name: "Teclados",
      },

      accessories: {
        name: "Acessórios de Alarme",
      },

      electricFence: {
        name: "Cerca Elétrica",
        subtypes: [
          "Centrais",
          "Módulos",
          "Fios",
          "Acessórios",
        ],
      },
    },
  },

  "controle-acesso": {
    name: "Controle de Acesso",

    types: {
      controllers: {
        name: "Controladores",
        subtypes: [
          "Controladores de Acesso",
          "Controladores Faciais",
        ],
      },

      readers: {
        name: "Leitores",
        subtypes: [
          "Biométricos",
          "RFID",
          "Proximidade",
        ],
      },

      credentials: {
        name: "Credenciais",
        subtypes: [
          "Cartões",
          "Chaveiros",
          "Tags",
          "RFID",
        ],
      },

      buttons: {
        name: "Botoeiras",
      },

      accessories: {
        name: "Acessórios de Controle de Acesso",
      },
    },
  },

  fechaduras: {
    name: "Fechaduras",

    types: {
      digital: {
        name: "Fechaduras Digitais",
        subtypes: [
          "Biometria",
          "Senha",
          "Cartão",
          "RFID",
        ],
      },

      electric: {
        name: "Fechaduras Elétricas",
      },

      electromagnet: {
        name: "Eletroímãs",
      },

      solenoid: {
        name: "Solenoides",
      },

      accessories: {
        name: "Acessórios de Fechaduras",
      },
    },
  },

  energia: {
    name: "Energia",

    types: {
      nobreaks: {
        name: "Nobreaks",
        lines: [
          "XNB",
          "GNB",
        ],
      },

      sources: {
        name: "Fontes",
      },

      batteries: {
        name: "Baterias",
      },

      stabilizers: {
        name: "Estabilizadores",
      },

      protection: {
        name: "Proteção Elétrica",
      },

      accessories: {
        name: "Acessórios de Energia",
      },
    },
  },

  redes: {
    name: "Redes",

    types: {
      switches: {
        name: "Switches",
        subtypes: [
          "Gerenciáveis",
          "Não Gerenciáveis",
          "PoE",
        ],
      },

      routers: {
        name: "Roteadores",
      },

      accessPoints: {
        name: "Access Points",
      },

      networkAccessories: {
        name: "Acessórios de Rede",
      },

      fiber: {
        name: "Fibra Óptica",
        subtypes: [
          "Cabos",
          "Conectores",
          "Conversores",
          "Acessórios",
        ],
      },

      racks: {
        name: "Racks",
      },
    },
  },

  cabeamento: {
    name: "Cabeamento",

    types: {
      cables: {
        name: "Cabos",
        subtypes: [
          "CAT5",
          "CAT6",
          "Coaxial",
          "Cabo de Alarme",
          "Cabo Telefônico",
        ],
      },

      connectors: {
        name: "Conectores",
        subtypes: [
          "RJ45",
          "RJ11",
          "BNC",
          "P4",
          "MC4",
        ],
      },

      patchCords: {
        name: "Patch Cords",
      },

      accessories: {
        name: "Acessórios de Cabeamento",
      },
    },
  },

  porteiros: {
    name: "Porteiros",

    types: {
      video: {
        name: "Vídeo Porteiros",
        subtypes: [
          "Kit Vídeo Porteiro",
          "Monitor",
          "Módulo Externo",
        ],
      },

      audio: {
        name: "Porteiros Eletrônicos",
      },

      intercom: {
        name: "Interfones",
      },

      accessories: {
        name: "Acessórios de Porteiros",
      },
    },
  },

  telefonia: {
    name: "Telefonia",

    types: {
      phones: {
        name: "Telefones",
        subtypes: [
          "Com Fio",
          "Sem Fio",
          "IP",
        ],
      },

      centrales: {
        name: "Centrais Telefônicas",
        lines: [
          "IMPACTA",
          "COMUNIC",
          "CP112",
          "CP4030",
        ],
      },

      accessories: {
        name: "Acessórios de Telefonia",
      },
    },
  },

  automatizadores: {
    name: "Automatizadores",

    types: {
      motors: {
        name: "Automatizadores",
        subtypes: [
          "Deslizantes",
          "Pivotantes",
          "Basculantes",
        ],
      },

      controls: {
        name: "Controles Remotos",
      },

      boards: {
        name: "Centrais e Placas",
      },

      accessories: {
        name: "Acessórios de Automatizadores",
      },
    },
  },

  antenas: {
    name: "Antenas",

    types: {
      antennas: {
        name: "Antenas",
        subtypes: [
          "TV",
          "Parabólicas",
          "Receptores",
          "LTE",
        ],
      },

      accessories: {
        name: "Acessórios de Antenas",
      },
    },
  },

  diversos: {
    name: "Diversos",

    types: {
      accessories: {
        name: "Acessórios",
      },
    },
  },
};

export function getFamilyDefinition(
  family: string
) {
  return TAXONOMY[family] || null;
}