import Link from "next/link";
import Image from "next/image";
import s from "@/app/styles/home.module.css";
import CategoriesSection from "@/app/components/CategoriesSection";
import HomeProducts from "@/app/components/HomeProducts";
import HomeBannerCarousel from "@/app/components/HomeBannerCarousel";
import { Suspense } from "react";
import { FaWhatsapp } from "react-icons/fa";
import TrustBar from "@/app/components/TrustBar";
import CompanyStats from "@/app/components/CompanyStats";
import CustomerReviews from "@/app/components/CustomerReviews";
import HomeSolutionSection from "@/app/components/HomeSolutionSection";






// Define o tipo de dados de um card de categoria da home
type HomeCard = {
  title: string;   // título da categoria
  desc: string;    // descrição da categoria
  href: string;    // link para onde o card leva
  tags: string[];  // tags exibidas no card
  image?: string;  // imagem opcional
};


// Tipo para produtos (não está sendo usado atualmente)
type ProductCard = {
  title: string;
  price: string;
  href: string;
  image?: string;
  badge?: string;
};


// Lista de cards de categorias exibidos na home
// esses dados alimentam os cards da seção "Principais soluções"
const CATEGORY_CARDS: HomeCard[] = [
  {
    title: "Data Center",
    desc: "Racks, energia, cabeamento e rede. Estrutura pronta para crescer.",
    href: "/categoria/data-center",
    tags: ["Infra", "Organização", "Escalável"],
    image: "/produtos/datacenterHome.avif"
  },
  {
    title: "Sistema de Segurança",
    desc: "CFTV, alarmes e controle de acesso para empresas e residências.",
    href: "/categoria/sistema-de-seguranca",
    tags: ["CFTV", "Alarmes", "Acesso"],
    image: "/produtos/sistema.avif",
  },
  {
    title: "Instalação",
    desc: "Instalação profissional, organizada,  testada e sem gambiarras.",
    href: "/instalacao",
    tags: ["Profissional", "Teste", "Organizado"],
    image: "/produtos/instalacaoHome.avif",
  },
  {
    title: "Projetos",
    desc: "Projeto técnico completo: planejamento, lista de materiais e execução.",
    href: "/projetos",
    tags: ["Projeto", "Dimensionamento", "Documentação"],
    image: "/produtos/projetosHome.avif",
  },
];


// Pequenos destaques exibidos abaixo do hero
const HIGHLIGHTS = [
  { title: "Atendimento rápido", desc: "Orçamento e orientação sem enrolação." },
  { title: "Solução completa", desc: "Equipamento, instalação e configuração." },
  { title: "Padrão profissional", desc: "Organização, identificação e acabamento." },
];




// Componente principal da página Home
export default function HomePage() { 

  return (

    // Elemento principal da página
    <main className={s.page}>

      {/* Banner superior da página */}
      <HomeBannerCarousel />

      <HomeSolutionSection />

      <section className={`${s.productsSection} shopScope`}></section>

     

    

      {/* ===== SEÇÃO DE PRODUTOS (CARROSSEL) ===== */}
      {/* 🔥 ADICIONADO shopScope AQUI */}
      <section className={`${s.productsSection} shopScope`}>
        <div className={s.productsWrapper}>

          <CategoriesSection />

        <TrustBar />
          

          
          <Suspense>
            <HomeProducts />
          </Suspense>

          <TrustBar />

          {/* QUEBRA VISUAL */}

        </div>
      </section>

      <CompanyStats />

<CustomerReviews />



  

      {/* ===== SEÇÃO DE CATEGORIAS / SOLUÇÕES ===== */}
      <section className={s.section}>
        <div className={s.container}>

          {/* Título da seção */}
          <header className={s.sectionHead}>
           <h2 className="h2">
  Soluções completas para segurança e infraestrutura
</h2>

<p className="p">
  Projetamos, instalamos e fornecemos equipamentos profissionais para residências, empresas e indústrias.
</p>
          </header>

          {/* Grid de cards */}
          <div className={s.grid4}>
            {CATEGORY_CARDS.map((c) => (
              <Link key={c.title} href={c.href} className={s.card}>

                {/* Imagem do card */}
                <div className={s.thumb}>
                  {c.image ? (
                   <Image
  src={c.image}
  alt={c.title}
  fill
  className={s.thumbImg}
  sizes="(max-width: 768px) 100vw, 25vw"
  quality={75}
/>
                  ) : (
                    <span className={s.thumbPlaceholder}>IMAGEM AQUI</span>
                  )}

                  {/* Overlay escuro da imagem */}
                  <div className={s.thumbOverlay} />
                </div>

                {/* Conteúdo do card */}
                <div className={s.cardBody}>

                  {/* Título */}
                  <h3 className={s.cardTitle}>{c.title}</h3>

                  {/* Descrição */}
                  <p className="p">{c.desc}</p>

                  {/* Tags */}
                  <div className={s.tags}>
                    {c.tags.map((t) => (
                      <span key={t} className="badge">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* CTA do card */}
                  <div className={s.cardCta}>Ver mais →</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

    

    

      

<a
  href="https://wa.me/554738423235"
  target="_blank"
  rel="noopener noreferrer"
  className="floatingWhats"
  aria-label="WhatsApp"
>
  <FaWhatsapp size={30} />
</a>

    </main>
  );
}