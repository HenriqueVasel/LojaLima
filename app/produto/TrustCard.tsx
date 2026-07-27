import s from "@/app/styles/TrustCard.module.css";
import {
  ShieldCheck,
  BadgeCheck,
  FileCheck,
  Award,
  Headset,
  Truck,
} from "lucide-react";

export default function TrustCard() {
  return (
    <section className={s.card}>

      <div className={s.header}>
        <ShieldCheck className={s.headerIcon} />

        <div>
          <h3>Compra 100% Segura</h3>

          <p>
            Compre com tranquilidade. Todos os pedidos possuem garantia,
            nota fiscal e suporte especializado.
          </p>
        </div>
      </div>

      <div className={s.grid}>

        <div className={s.item}>
          <BadgeCheck size={20} />
          <span>Produto Original Intelbras</span>
        </div>

        <div className={s.item}>
          <Award size={20} />
          <span>Revenda Autorizada</span>
        </div>

        <div className={s.item}>
          <FileCheck size={20} />
          <span>Nota Fiscal em todos os pedidos</span>
        </div>

        <div className={s.item}>
          <ShieldCheck size={20} />
          <span>Garantia Oficial do Fabricante</span>
        </div>

        <div className={s.item}>
          <Headset size={20} />
          <span>Atendimento Especializado</span>
        </div>

        <div className={s.item}>
          <Truck size={20} />
          <span>Envio para todo o Brasil</span>
        </div>

      </div>

    </section>
  );
}