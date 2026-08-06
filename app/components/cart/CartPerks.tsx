"use client";

import { ShieldCheck, CreditCard, Headset } from "lucide-react";
import s from "@/app/styles/carinho.module.css";

const PERKS = [
  { Icon: ShieldCheck, title: "Compra 100% segura", desc: "Seus dados protegidos" },
  { Icon: CreditCard, title: "Parcele em até 12x", desc: "No cartão de crédito" },
  { Icon: Headset, title: "Suporte especializado", desc: "Atendimento via WhatsApp" },
];

export function CartPerks() {
  return (
    <div className={s.perksList}>
      {PERKS.map((perk) => (
        <div key={perk.title} className={s.perkItem}>
          <div className={s.perkIcon}>
            <perk.Icon strokeWidth={2.2} />
          </div>
          <div>
            <div className={s.perkTitle}>{perk.title}</div>
            <div className={s.perkDesc}>{perk.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}