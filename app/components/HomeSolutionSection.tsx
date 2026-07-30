"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Wrench,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";

import s from "@/app/styles/HomeSolutionSection.module.css";
import ProjectModal from "@/app/components/ProjectModal";

export default function HomeSolutionSection() {
  const [openModal, setOpenModal] = useState(false);

  return (
    <>
      <section className={s.section}>
        <div className={s.container}>
          <div className={s.content}>
            <span className={s.badge}>
              <ShieldCheck size={18} />
              Soluções completas
            </span>

            <h2>
  Soluções completas em segurança eletrônica.
</h2>

            <p>
              Projeto, instalação e suporte especializado para residências,
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

            <button
              className={s.button}
              onClick={() => setOpenModal(true)}
            >
              Solicite um projeto gratuitamente
              <ArrowRight size={18} />
            </button>

            <span className={s.info}>
              ✓ Sem compromisso • Atendimento rápido pelo WhatsApp
            </span>
          </div>

          <div className={s.preview}>
            <ShieldCheck size={70} />

            <h3>Seu projeto começa aqui</h3>

            <p>
              Em breve adicionaremos uma foto da equipe realizando instalações
              profissionais.
            </p>
          </div>
        </div>
      </section>

      <ProjectModal
        open={openModal}
        onClose={() => setOpenModal(false)}
      />
    </>
  );
}