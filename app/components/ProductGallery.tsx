"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import s from "@/app/styles/product.module.css";

export default function ProductGallery({
  images,
  name,
  sku,
}: any) {
 const extras = sku
  ? Array.from({ length: 10 }, (_, i) => ({
      url: `/produtos/${sku}-${i + 1}.jpg`,
    }))
  : [];

const [allImages, setAllImages] = useState(images || []);

useEffect(() => {
  async function loadImages() {
    const validExtras = [];

    for (const img of extras) {
      try {
        const res = await fetch(img.url, {
          method: "HEAD",
        });

        if (res.ok) {
          validExtras.push(img);
        }
      } catch {}
    }

    setAllImages([
      ...(images || []),
      ...validExtras,
    ]);
  }

  loadImages();
}, [sku, images]);

const [selected, setSelected] = useState(

  
  images?.[0]?.url ||
  "/produtos/placeholder.jpg"
);

const [zoom, setZoom] = useState(false);

const [position, setPosition] = useState({
  x: 50,
  y: 50,
});

useEffect(() => {
  if (allImages.length > 0) {
    setSelected(allImages[0].url);
  }
}, [allImages]);


function handleZoom(
  e: React.MouseEvent<HTMLDivElement>
) {
  const { left, top, width, height } =
    e.currentTarget.getBoundingClientRect();

  const x = ((e.clientX - left) / width) * 100;
  const y = ((e.clientY - top) / height) * 100;

  setPosition({
    x,
    y,
  });
}

  return (
    <div className={s.galleryWrapper}>
      {/* MINIATURAS */}
      <div className={s.galleryThumbs}>
       {allImages?.map((img: any) => (
          <div
            key={img.url}
            onClick={() => setSelected(img.url)}
            style={{
              width: 80,
              height: 80,
              position: "relative",
              borderRadius: 12,
              overflow: "hidden",
              cursor: "pointer",
              background: "#fff",
              border:
                selected === img.url
                  ? "2px solid #22c55e"
                  : "1px solid rgba(0,0,0,0.1)",
            }}
          >
            <Image
              src={img.url}
              alt={name}
              fill
              style={{
                objectFit: "contain",
              }}
            />
          </div>
        ))}
      </div>

      {/* IMAGEM PRINCIPAL */}
     <div
  className={s.mainImage}
  onMouseMove={handleZoom}
  onMouseEnter={() => setZoom(true)}
  onMouseLeave={() => setZoom(false)}
>


<Image
  src={selected}
  alt={name}
  width={1000}
height={1000}
  priority
  className={s.mainPhoto}
  style={{
    transform: zoom
      ? "scale(2)"
      : "scale(1)",

    transformOrigin: `${position.x}% ${position.y}%`,
  }}
/>
</div>
    </div>
  );
}