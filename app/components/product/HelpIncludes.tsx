import s from "@/app/styles/HelpIncludes.module.css";

import Link from "next/link";

import {
  Headset,
  PackageCheck,
  Check,
  MessageCircle,
} from "lucide-react";

export default function HelpIncludes() {
  return (
    <section className={s.grid}>
      {/* AJUDA */}

      <div className={s.card}>

        <div className={s.title}>

          <Headset size={28} />

          <h3>Precisa de ajuda?</h3>

        </div>

        <p className={s.description}>
          Não sabe qual equipamento escolher?
          Nossa equipe especializada pode ajudar você.
        </p>

        <Link
          href="https://wa.me/554738423235"
          target="_blank"
          className={s.button}
        >
          <MessageCircle size={20} />

          Falar no WhatsApp
        </Link>

        <div className={s.hours}>
          <strong>Atendimento</strong>

          Segunda à Sexta

          <span>08:00 às 18:00</span>
        </div>

      </div>

      {/* O QUE ACOMPANHA */}

      <div className={s.card}>

        <div className={s.title}>

          <PackageCheck size={28} />

          <h3>O que acompanha</h3>

        </div>

        <ul className={s.list}>

          <li>
            <Check size={18}/>
            Produto Original
          </li>

          <li>
            <Check size={18}/>
            Manual do Fabricante
          </li>

          <li>
            <Check size={18}/>
            Certificado de Garantia
          </li>

          <li>
            <Check size={18}/>
            Nota Fiscal
          </li>

        </ul>

      </div>

    </section>
  );
}