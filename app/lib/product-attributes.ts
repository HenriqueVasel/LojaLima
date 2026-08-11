function normalize(text: string = "") {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^\w\s./-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type ExtractedAttributes = Record<
  string,
  string | number | boolean
>;

export function extractProductAttributes(
  name: string,
  description?: string | null
): ExtractedAttributes {

  const text = normalize(
    `${name} ${description || ""}`
  );

  const attributes: ExtractedAttributes = {};

  /*
  |--------------------------------------------------------------------------
  | CANAIS
  |--------------------------------------------------------------------------
  */

  const channels = text.match(
    /\b(4|8|16|32|64|128|256)\s*(?:CANAIS|CH|CHS)\b/
  );

  if (channels?.[1]) {
    attributes.canais = Number(channels[1]);
  }

  /*
  |--------------------------------------------------------------------------
  | TENSÃO
  |--------------------------------------------------------------------------
  */

  const voltage = text.match(
    /\b(12V|24V|110V|120V|127V|220V|230V|240V)\b/
  );

  if (voltage?.[1]) {
    attributes.tensao = voltage[1];
  }

  /*
  |--------------------------------------------------------------------------
  | RESOLUÇÃO
  |--------------------------------------------------------------------------
  */

  const resolution = text.match(
    /\b(1MP|2MP|3MP|4MP|5MP|6MP|8MP|10MP|12MP)\b/
  );

  if (resolution?.[1]) {
    attributes.resolucao = resolution[1];
  }

  /*
  |--------------------------------------------------------------------------
  | WI-FI
  |--------------------------------------------------------------------------
  */

  if (
    text.includes("WI-FI") ||
    text.includes("WIFI")
  ) {
    attributes.wifi = true;
  }

  /*
  |--------------------------------------------------------------------------
  | POE
  |--------------------------------------------------------------------------
  */

  if (
    /\bPOE\b/.test(text) ||
    text.includes("802.3AF") ||
    text.includes("802.3AT")
  ) {
    attributes.poe = true;
  }

  /*
  |--------------------------------------------------------------------------
  | RFID
  |--------------------------------------------------------------------------
  */

  if (
    text.includes("RFID") ||
    text.includes("MIFARE")
  ) {
    attributes.rfid = true;
  }

  /*
  |--------------------------------------------------------------------------
  | BIOMETRIA
  |--------------------------------------------------------------------------
  */

  if (
    text.includes("BIOMETRIA") ||
    text.includes("BIOMETRICO") ||
    text.includes("BIOMETRICA")
  ) {
    attributes.biometria = true;
  }

  /*
  |--------------------------------------------------------------------------
  | GERENCIÁVEL
  |--------------------------------------------------------------------------
  */

  if (
    text.includes("GERENCIAVEL") ||
    text.includes("GERENCIÁVEL")
  ) {
    attributes.gerenciavel = true;
  }

  if (
    text.includes("NAO GERENCIAVEL") ||
    text.includes("NÃO GERENCIÁVEL")
  ) {
    attributes.gerenciavel = false;
  }

  /*
  |--------------------------------------------------------------------------
  | VELOCIDADE DE REDE
  |--------------------------------------------------------------------------
  */

  const speed = text.match(
    /\b(10\/100|10\/100\/1000|100\/1000|1000MBPS|2\.5GBPS|10GBPS)\b/
  );

  if (speed?.[1]) {
    attributes.velocidade = speed[1];
  }

  /*
  |--------------------------------------------------------------------------
  | PORTAS
  |--------------------------------------------------------------------------
  */

  const ports = text.match(
    /\b(4|5|8|10|16|24|26|48)\s*(?:PORTAS|PORTAS RJ45|PORTS)\b/
  );

  if (ports?.[1]) {
    attributes.portas = Number(ports[1]);
  }

  /*
  |--------------------------------------------------------------------------
  | CAPACIDADE DE NOBREAK
  |--------------------------------------------------------------------------
  */

  const va = text.match(
    /\b(\d+(?:\.\d+)?)\s*VA\b/
  );

  if (va?.[1]) {
    attributes.capacidade_va =
      Number(va[1]);
  }

  /*
  |--------------------------------------------------------------------------
  | CAPACIDADE HD
  |--------------------------------------------------------------------------
  */

  const storage = text.match(
    /\b(\d+(?:\.\d+)?)\s*(TB|GB)\b/
  );

  if (
    storage?.[1] &&
    storage?.[2]
  ) {

    attributes.capacidade_armazenamento =
      `${storage[1]}${storage[2]}`;
  }

  return attributes;
}