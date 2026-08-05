"use client";

import s from "@/app/styles/carinho.module.css";

export function CartSecureBox() {
  return (
    <div className={s.secureBox}>
      <span className={s.secureIcon}>🔒</span>
      <div>
        <div className={s.secureTitle}>Ambiente seguro</div>
        <div className={s.secureText}>
          Seus dados estão protegidos com criptografia SSL de 256 bits.
        </div>
      </div>
    </div>
  );
}