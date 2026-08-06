"use client";

import { Lock } from "lucide-react";
import s from "@/app/styles/carinho.module.css";

export function CartSecureBox() {
  return (
    <div className={s.secureBox}>
      <div className={s.secureIcon}>
        <Lock strokeWidth={2.2} />
      </div>
      <div>
        <div className={s.secureTitle}>Ambiente seguro</div>
        <div className={s.secureText}>
          Seus dados estão protegidos com criptografia SSL de 256 bits.
        </div>
      </div>
    </div>
  );
}