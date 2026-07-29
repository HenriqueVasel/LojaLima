import Link from "next/link";
import {
  ShieldCheck,
  Wrench,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";

import s from "@/app/styles/HomeSolutionSection.module.css";

export default function HomeSolutionSection() {
  return (
    <section className={s.section}>
      <div className={s.container}>

        <div className={s.content}>

          <span className={s.badge}>
            <ShieldCheck size={18} />
            Soluções completas
          </span>

          <h2>
            Proteja o que é importante com uma solução completa.
          </h2>

          <p>
            Não vendemos apenas equipamentos. Nossa equipe desenvolve o
            projeto, realiza a instalação e oferece suporte para residências,
            empresas e indústrias.
          </p>

          <div className={s.features}>

            <div>
              <BadgeCheck size={18} />
              Projeto personalizado
            </div>

            <div>
              <Wrench size={18} />
              Instalação profissional
            </div>

            <div>
              <BadgeCheck size={18} />
              Produtos Intelbras Originais
            </div>

            <div>
              <BadgeCheck size={18} />
              Suporte especializado
            </div>

          </div>

      <div className={s.services}>
  <h3>Como podemos ajudar você hoje?</h3>

  <div className={s.servicesGrid}>

    <a
      href="https://wa.me/5547SEUNUMERO?text=Olá! Gostaria de solicitar um orçamento para instalação de câmeras."
      target="_blank"
      rel="noopener noreferrer"
      className={s.serviceCard}
    >
      📹
      <span>Instalar câmeras</span>
    </a>

    <a
      href="https://wa.me/5547SEUNUMERO?text=Olá! Gostaria de melhorar minha rede Wi-Fi."
      target="_blank"
      rel="noopener noreferrer"
      className={s.serviceCard}
    >
      📶
      <span>Melhorar meu Wi-Fi</span>
    </a>

    <a
      href="https://wa.me/5547SEUNUMERO?text=Olá! Gostaria de um sistema de controle de acesso."
      target="_blank"
      rel="noopener noreferrer"
      className={s.serviceCard}
    >
      🚪
      <span>Controle de acesso</span>
    </a>

    <a
      href="https://wa.me/5547SEUNUMERO?text=Olá! Preciso de suporte técnico."
      target="_blank"
      rel="noopener noreferrer"
      className={s.serviceCard}
    >
      🛠️
      <span>Suporte técnico</span>
    </a>

  </div>

  <a
    href="https://wa.me/5547SEUNUMERO?text=Olá! Gostaria de solicitar um projeto gratuito."
    target="_blank"
    rel="noopener noreferrer"
    className={s.button}
  >
    Não encontrou o que procura?
  </a>

</div>

        </div>

        <div className={s.preview}>

          <ShieldCheck size={70} />

          <h3>
            Seu projeto começa aqui
          </h3>

          <p>
            Em breve adicionaremos uma foto da equipe realizando instalações
            profissionais.
          </p>

        </div>

      </div>
    </section>
  );
}