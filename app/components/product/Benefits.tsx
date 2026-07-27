import s from "@/app/styles/Benefits.module.css";

import {
  ShieldCheck,
  Truck,
  Headset,
  PackageCheck,
  CreditCard,
  Star,
} from "lucide-react";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Compra Segura",
    subtitle: "Pagamento protegido",
  },
  {
    icon: Truck,
    title: "Entrega Rápida",
    subtitle: "Para todo o Brasil",
  },
  {
    icon: PackageCheck,
    title: "Produto Original",
    subtitle: "Revenda Intelbras",
  },
  {
    icon: Headset,
    title: "Suporte Técnico",
    subtitle: "Equipe especializada",
  },
  {
    icon: CreditCard,
    title: "Parcelamento",
    subtitle: "Até 3x sem juros",
  },
  {
    icon: Star,
    title: "+10.000 Clientes",
    subtitle: "Atendidos",
  },
];

export default function Benefits() {
  return (
    <section className={s.container}>
      {benefits.map((item, index) => {
        const Icon = item.icon;

        return (
          <div
            className={s.card}
            key={index}
          >
            <div className={s.icon}>
              <Icon size={30} strokeWidth={2} />
            </div>

            <div className={s.content}>
              <h4>{item.title}</h4>
              <span>{item.subtitle}</span>
            </div>
          </div>
        );
      })}
    </section>
  );
}