import styles from "@/app/styles/kits.module.css";
import Link from "next/link";

const kits = [
  {
    id: 1,
    slug: "kit-alarme-residencial-completo",
    title: "Kit Alarme Residencial Completo",
    subtitle: "Proteção completa para sua casa ou empresa",
    image: "/produtos/kit-alarme.jpg",
    pricePix: "R$ 799,00",
    priceInstallment: "R$ 841,00",
    items: [
      "Central de alarme",
      "4 sensores sem fio",
      "Sirene",
      "Bateria",
      "10 metros de cabo",
      "Itens selecionados conforme disponibilidade",
    ],
  },

  {
    id: 2,
    slug: "kit-controle-de-acesso-facial",
    title: "Kit Controle de Acesso Facial",
    subtitle: "Mais segurança e praticidade para sua entrada",
    image: "/produtos/kit-facial.jpg",
    pricePix: "R$ 1.320,67",
    priceInstallment: "R$ 1.390,18",
    items: [
      "Controlador de acesso facial",
      "Botoeira sem fio",
      "Fonte de alimentação",
      "10 metros de cabo de rede",
      "2 conectores RJ45",
      "Itens selecionados conforme disponibilidade",
    ],
  },

  {
    id: 3,
    slug: "kit-2-cameras-analogicas-fullhd",
    title: "Kit 2 Câmeras Analógicas Full HD",
    subtitle:
      "Sistema completo de monitoramento para sua residência ou empresa",
    image: "/produtos/kit1.jpg",
    pricePix: "R$ 1.823,81",
    priceInstallment: "R$ 1.823,81",
    items: [
      "2x Câmeras Intelbras VHL 1120 B G2",
      "1x DVR MHDX 1204-C — 4 canais",
      "1x HD WD Purple 1 TB",
      "1x Fonte EF 1205S — 12,8V 5A",
      "Cabos e conectores não inclusos",
      "Instalação não inclusa",
    ],
  },

  {
    id: 4,
    slug: "kit-4-cameras-analogicas-fullhd-novo",
    title: "Kit 4 Câmeras Analógicas Full HD",
    subtitle:
      "Sistema completo de monitoramento com excelente custo-benefício",
    image: "/produtos/kit2.jpg",
    pricePix: "R$ 2.057,87",
    priceInstallment: "R$ 2.057,87",
    items: [
      "4x Câmeras Intelbras VHL 1120 B G2",
      "1x DVR MHDX 1204-C — 4 canais",
      "1x HD WD Purple 1 TB",
      "1x Fonte EF 1205S — 12,8V 5A",
      "Cabos e conectores não inclusos",
      "Instalação não inclusa",
    ],
  },

  {
    id: 5,
    slug: "kit-8-cameras-analogicas-fullhd",
    title: "Kit 8 Câmeras Analógicas Full HD",
    subtitle:
      "Monitoramento completo para áreas maiores e empresas",
    image: "/produtos/kit3.jpg",
    pricePix: "R$ 2.730,17",
    priceInstallment: "R$ 2.730,17",
    items: [
      "8x Câmeras Intelbras VHL 1120 B G2",
      "1x DVR MHDX 1208-C — 8 canais",
      "1x HD WD Purple 1 TB",
      "1x Fonte EF 1205S — 12,8V 5A",
      "Cabos e conectores não inclusos",
      "Instalação não inclusa",
    ],
  },
];

export default function KitsPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>SOLUÇÕES COMPLETAS</span>

          <h1>Kits de Segurança</h1>

          <p>
            Encontre soluções completas para proteger sua casa ou empresa.
            Selecionamos os equipamentos ideais para você.
          </p>
        </div>
      </section>

      <section className={styles.container}>
        <div className={styles.heading}>
          <span>KITS PROMOCIONAIS</span>

          <h2>Escolha a solução ideal para você</h2>

          <p>
            Kits completos com equipamentos selecionados para facilitar sua
            compra e entregar mais segurança.
          </p>
        </div>

        <div className={styles.grid}>
          {kits.map((kit) => (
            <article className={styles.card} key={kit.id}>
              <div className={styles.imageContainer}>
                <img
  src={kit.image}
  alt={kit.title}
  className={
    kit.id === 1 || kit.id === 2
      ? styles.imageWide
      : styles.image
  }
/>

                <span className={styles.offer}>
                  KIT PROMOCIONAL
                </span>
              </div>

              <div className={styles.content}>
                <h3>{kit.title}</h3>

                <p className={styles.subtitle}>
                  {kit.subtitle}
                </p>

                <div className={styles.items}>
                  <h4>Este kit inclui:</h4>

                  <ul>
                    {kit.items.map((item) => (
                      <li key={item}>
                        ✓ {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={styles.priceBox}>
                  <span>À vista no PIX</span>

                  <strong>
                    {kit.pricePix}
                  </strong>

                  <small>
                    ou {kit.priceInstallment} parcelado
                  </small>
                </div>

                <Link
  href={`/produto/${kit.slug}`}
  className={styles.button}
>
  VER KIT COMPLETO
</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}