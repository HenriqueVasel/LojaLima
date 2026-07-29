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

          <Link
            href="/contato"
            className={s.button}
          >
            Solicite um projeto gratuitamente
            <ArrowRight size={18}/>
          </Link>

          <span className={s.info}>
            ✓ Sem compromisso • Atendimento rápido pelo WhatsApp
          </span>

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