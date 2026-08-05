export interface AttributeRule {
  categories: string[];
  attribute: string;
  value: string;
  keywords: string[];
}

/* ======================================================
   CÂMERAS / CFTV
====================================================== */

const CAMERA_ATTRIBUTES: AttributeRule[] = [
  {
    categories: ["cameras"],
    attribute: "Resolução",
    value: "Full HD",
    keywords: ["full hd", "1080p"],
  },
  {
    categories: ["cameras"],
    attribute: "Resolução",
    value: "4MP",
    keywords: ["4mp", "4 mp"],
  },
  {
    categories: ["cameras"],
    attribute: "Resolução",
    value: "5MP",
    keywords: ["5mp", "5 mp"],
  },
  {
    categories: ["cameras"],
    attribute: "Resolução",
    value: "4K",
    keywords: ["4k", "8mp", "8 mp"],
  },
  {
    categories: ["cameras"],
    attribute: "Conectividade",
    value: "Wi-Fi",
    keywords: ["wifi", "wi-fi"],
  },
  {
    categories: ["cameras"],
    attribute: "Alimentação",
    value: "PoE",
    keywords: ["poe"],
  },
  {
    categories: ["cameras"],
    attribute: "Formato",
    value: "Bullet",
    keywords: ["bullet"],
  },
  {
    categories: ["cameras"],
    attribute: "Formato",
    value: "Dome",
    keywords: ["dome"],
  },
  {
    categories: ["cameras"],
    attribute: "Movimentação",
    value: "PTZ",
    keywords: ["ptz", "speed dome"],
  },
  {
    categories: ["cameras"],
    attribute: "Proteção",
    value: "IP66",
    keywords: ["ip66"],
  },
  {
    categories: ["cameras"],
    attribute: "Proteção",
    value: "IP67",
    keywords: ["ip67"],
  },
];

/* ======================================================
   REDES / SWITCHES / ROTEADORES
====================================================== */

const NETWORK_ATTRIBUTES: AttributeRule[] = [
  {
    categories: ["redes"],
    attribute: "Alimentação",
    value: "PoE",
    keywords: ["poe"],
  },
  {
    categories: ["redes"],
    attribute: "Velocidade",
    value: "Gigabit",
    keywords: ["gigabit", "1000 mbps", "1000mbps"],
  },
  {
    categories: ["redes"],
    attribute: "Velocidade",
    value: "Fast Ethernet",
    keywords: ["fast ethernet", "10/100"],
  },
  {
    categories: ["redes"],
    attribute: "Conectividade",
    value: "Wi-Fi",
    keywords: ["wifi", "wi-fi"],
  },
  {
    categories: ["redes"],
    attribute: "Wi-Fi",
    value: "Wi-Fi 6",
    keywords: ["wifi 6", "wi-fi 6", "802.11ax"],
  },
  {
    categories: ["redes"],
    attribute: "Gerenciamento",
    value: "Gerenciável",
    keywords: ["gerenciavel", "gerenciável", "managed"],
  },
];

/* ======================================================
   ENERGIA / NOBREAK / FONTES
====================================================== */

const ENERGY_ATTRIBUTES: AttributeRule[] = [
  {
    categories: ["energia"],
    attribute: "Potência",
    value: "600 VA",
    keywords: ["600va", "600 va"],
  },
  {
    categories: ["energia"],
    attribute: "Potência",
    value: "1200 VA",
    keywords: ["1200va", "1200 va"],
  },
  {
    categories: ["energia"],
    attribute: "Potência",
    value: "1500 VA",
    keywords: ["1500va", "1500 va"],
  },
  {
    categories: ["energia"],
    attribute: "Potência",
    value: "3000 VA",
    keywords: ["3000va", "3000 va", "3 kva", "3kva"],
  },
  {
    categories: ["energia"],
    attribute: "Tensão",
    value: "127V",
    keywords: ["127v", "127 v"],
  },
  {
    categories: ["energia"],
    attribute: "Tensão",
    value: "220V",
    keywords: ["220v", "220 v"],
  },
  {
    categories: ["energia"],
    attribute: "Tensão",
    value: "Bivolt",
    keywords: ["bivolt", "bi-volt"],
  },
  {
    categories: ["energia"],
    attribute: "Forma de onda",
    value: "Senoidal",
    keywords: ["senoidal"],
  },
];

/* ======================================================
   CONTROLE DE ACESSO
====================================================== */

const ACCESS_CONTROL_ATTRIBUTES: AttributeRule[] = [
  {
    categories: ["controle-acesso"],
    attribute: "Identificação",
    value: "Biometria",
    keywords: ["biometria", "biometrico", "biométrico", "digital"],
  },
  {
    categories: ["controle-acesso"],
    attribute: "Identificação",
    value: "Reconhecimento Facial",
    keywords: ["facial", "reconhecimento facial"],
  },
  {
    categories: ["controle-acesso"],
    attribute: "Identificação",
    value: "RFID",
    keywords: ["rfid", "proximidade"],
  },
  {
    categories: ["controle-acesso"],
    attribute: "Identificação",
    value: "Senha",
    keywords: ["senha", "teclado"],
  },
  {
    categories: ["controle-acesso"],
    attribute: "Conectividade",
    value: "Bluetooth",
    keywords: ["bluetooth"],
  },
];

/* ======================================================
   ALARMES
====================================================== */

const ALARM_ATTRIBUTES: AttributeRule[] = [
  {
    categories: ["alarmes"],
    attribute: "Conectividade",
    value: "Sem fio",
    keywords: ["sem fio", "wireless"],
  },
  {
    categories: ["alarmes"],
    attribute: "Conectividade",
    value: "Com fio",
    keywords: ["com fio", "cabeado"],
  },
  {
    categories: ["alarmes"],
    attribute: "Ambiente",
    value: "Interno",
    keywords: ["interno", "interna"],
  },
  {
    categories: ["alarmes"],
    attribute: "Ambiente",
    value: "Externo",
    keywords: ["externo", "externa"],
  },
];

/* ======================================================
   INTERFONIA
====================================================== */

const INTERCOM_ATTRIBUTES: AttributeRule[] = [
  {
    categories: ["interfonia"],
    attribute: "Tipo",
    value: "Vídeo Porteiro",
    keywords: ["videoporteiro", "video porteiro", "vídeo porteiro"],
  },
  {
    categories: ["interfonia"],
    attribute: "Tipo",
    value: "Interfone",
    keywords: ["interfone"],
  },
  {
    categories: ["interfonia"],
    attribute: "Conectividade",
    value: "Wi-Fi",
    keywords: ["wifi", "wi-fi"],
  },
];

/* ======================================================
   TODAS AS REGRAS
====================================================== */

export const ATTRIBUTE_RULES: AttributeRule[] = [
  ...CAMERA_ATTRIBUTES,
  ...NETWORK_ATTRIBUTES,
  ...ENERGY_ATTRIBUTES,
  ...ACCESS_CONTROL_ATTRIBUTES,
  ...ALARM_ATTRIBUTES,
  ...INTERCOM_ATTRIBUTES,
];