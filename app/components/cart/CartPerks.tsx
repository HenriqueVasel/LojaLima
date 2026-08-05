"use client";

import s from "@/app/styles/carinho.module.css";

const PERKS = [
  { icon: "🛡️", title: "Compra 100% segura", desc: "Seus dados protegidos" },
  { icon: "💳", title: "Parcele em até 12x", desc: "No cartão de crédito" },
  { icon: "🎧", title: "Suporte especializado", desc: "Atendimento via WhatsApp" },
];

export function CartPerks() {
  return (
    <div className={s.perksList}>
      {PERKS.map((perk) => (
        <div key={perk.title} className={s.perkItem}>
          <div className={s.perkIcon}>{perk.icon}</div>
          <div>
            <div className={s.perkTitle}>{perk.title}</div>
            <div className={s.perkDesc}>{perk.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}