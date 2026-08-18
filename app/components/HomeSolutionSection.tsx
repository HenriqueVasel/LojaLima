"use client";

import Image from "next/image";
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

          {/* =========================
              CONTEÚDO
          ========================= */}

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

            {/* BENEFÍCIOS */}

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

            {/* CTA */}

           <div className={s.actions}>

  <div className={s.freeQuote}>
    <strong>Solicite seu orçamento gratuitamente</strong>
    <span>Sem compromisso e sem custo para solicitar.</span>
  </div>

  <div className={s.actionRow}>
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

          </div>


          {/* =========================
              FOTO DA INSTALAÇÃO
          ========================= */}

          <div className={s.preview}>

            <Image
              src="/produtos/instalacao-profissional.webp"
              alt="Técnico realizando instalação profissional de câmera de segurança"
              fill
              className={s.previewImage}
              sizes="(max-width: 900px) 100vw, 40vw"
            />

          </div>

        </div>
      </section>


      {/* MODAL DE ORÇAMENTO */}

      <ProjectModal
        open={openModal}
        onClose={() => setOpenModal(false)}
      />
    </>
  );
}