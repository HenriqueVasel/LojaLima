"use client";

import { useSearchParams } from "next/navigation";
import ProductGrid from "@/app/components/ProductGrid";
import ProductsCarousel from "@/app/components/ProductsCarousel";
import StoreToolbar from "@/app/components/StoreToolbar";
import StoreSidebar from "@/app/components/StoreSidebar";
import WhatsAppSection from "@/app/components/WhatsAppSection";
import HomeKitBanner from "@/app/components/HomeKitSection";
import HomeBreakSection from "@/app/components/HomeBreakSection";
import styles from "@/app/styles/loja.module.css";

export default function HomeProducts() {

  const params = useSearchParams();
  const query = new URLSearchParams(params).toString();

 const search = params.get("q");
const category = params.get("category");
const brand = params.get("brand");

const isResults = search || category || brand;
  return (
    <>
      {/* RESULTADOS */}
      {isResults && (
  <div className={styles.storeLayout}>

    <StoreSidebar />

    <div className={styles.storeContent}>

      <StoreToolbar />

      <ProductGrid
       title={
  search
    ? `Resultados para: ${search}`
    : brand
      ? `Marca: ${brand}`
      : `Categoria: ${category}`
}
        endpoint={`/api/products?${query}`}
        key={query}
        itemsPerRow={4}
        insertEvery={2}
        insertComponent={<WhatsAppSection />}
      />

    </div>

  </div>
)}

      {/* HOME */}
      {!isResults && (
        <>

      


        {/* CAMERAS WIFI */}
          <div className="homeSection">
            <ProductsCarousel
              title="Câmeras Wi-Fi"
              endpoint="/api/products/store?category=cameras-wifi&limit=10"
            />
          </div>

         

          {/* CFTV */}
          <div className="homeSection">
            <ProductsCarousel
              title="Câmeras e Gravadores"
              endpoint="/api/products/store?category=cftv&limit=10"
            />
          </div>

          <div className="homeSection">
  <HomeBreakSection />
</div>



          {/* FECHADURAS */}
          <div className="homeSection">
            <ProductsCarousel
              title="Fechaduras Inteligentes"
              endpoint="/api/products/store?category=fechaduras&limit=10"
            />
          </div>

          {/* 🔥 KIT PROMOCIONAL */}
{/* 
<div className="homeSection">
  <HomeKitBanner />
</div>
*/}

          
      

          {/* CONTROLE ACESSO */}
          <div className="homeSection">
            <ProductsCarousel
              title="Controle de Acesso"
              endpoint="/api/products/store?category=controle-de-acesso&limit=10"
            />
          </div>

              <div className="homeSection alt">
            <WhatsAppSection />
          </div>

          {/* AUTOMATIZADORES */}
          {/* CASA INTELIGENTE */}
<div className="homeSection">
  <ProductsCarousel
    title="Casa Inteligente"
    endpoint="/api/products/store?search=smart-home&limit=10"
  />
</div>
          

          {/* ALARMES */}
          <div className="homeSection">
            <ProductsCarousel
              title="Alarmes"
              endpoint="/api/products/store?category=alarmes&limit=10"
            />
          </div>

      
        </>
      )}
    </>
  );
}