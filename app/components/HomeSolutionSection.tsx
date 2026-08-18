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
              <Wrench size={15} />
              INSTALAÇÃO PROFISSIONAL
            </span>

            <h2>
              Compre seu equipamento.
              <br />
              <span>Nós instalamos para você.</span>
            </h2>

            <p>
              Conte com nossa equipe especializada para realizar
              a instalação e deixar seu projeto pronto para funcionar.
            </p>

            <div className={s.features}>

              <div>
                <BadgeCheck size={17} />
                Projeto personalizado
              </div>

              <div>
                <Wrench size={17} />
                Equipe especializada
              </div>

              <div>
                <ShieldCheck size={17} />
                Instalação profissional
              </div>

              <div>
                <BadgeCheck size={17} />
                Suporte pós-instalação
              </div>

            </div>

            <div className={s.actions}>

              <button
                className={s.button}
                onClick={() => setOpenModal(true)}
              >
                Solicitar orçamento
                <ArrowRight size={17} />
              </button>

              <span className={s.info}>
                Atendimento rápido pelo WhatsApp
              </span>

            </div>

          </div>

          <div className={s.preview}>

            <div className={s.previewOverlay} />

            <div className={s.previewContent}>
              <span>
                <ShieldCheck size={16} />
                Projeto completo
              </span>

              <strong>
                Equipamento + instalação
              </strong>

              <p>
                Segurança profissional do início ao fim.
              </p>
            </div>

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