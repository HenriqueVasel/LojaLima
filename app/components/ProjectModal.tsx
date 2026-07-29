"use client";

import {
  Camera,
  Wifi,
  ShieldCheck,
  Wrench,
  MessageCircle,
  X,
} from "lucide-react";

import s from "@/app/styles/ProjectModal.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PHONE = "5547999999999"; // coloque o número da empresa

export default function ProjectModal({ open, onClose }: Props) {
  if (!open) return null;

  const whatsapp = (message: string) =>
    `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <button className={s.close} onClick={onClose}>
          <X size={22} />
        </button>

        <span className={s.badge}>Projeto Gratuito</span>

        <h2>Como podemos ajudar você?</h2>

        <p>
          Escolha uma opção abaixo para iniciar o atendimento pelo WhatsApp.
        </p>

        <div className={s.grid}>
          <a
            href={whatsapp(
              "Olá! Gostaria de solicitar um orçamento para instalação de câmeras."
            )}
            target="_blank"
            rel="noopener noreferrer"
            className={s.card}
          >
            <Camera size={26} />

            <div>
              <strong>Instalação de Câmeras</strong>
              <span>CFTV residencial e empresarial</span>
            </div>
          </a>

          <a
            href={whatsapp(
              "Olá! Gostaria de melhorar minha rede Wi-Fi."
            )}
            target="_blank"
            rel="noopener noreferrer"
            className={s.card}
          >
            <Wifi size={26} />

            <div>
              <strong>Rede Wi-Fi</strong>
              <span>Mais cobertura e velocidade</span>
            </div>
          </a>

          <a
            href={whatsapp(
              "Olá! Gostaria de um orçamento para controle de acesso."
            )}
            target="_blank"
            rel="noopener noreferrer"
            className={s.card}
          >
            <ShieldCheck size={26} />

            <div>
              <strong>Controle de Acesso</strong>
              <span>Residências e empresas</span>
            </div>
          </a>

          <a
            href={whatsapp(
              "Olá! Preciso de suporte técnico."
            )}
            target="_blank"
            rel="noopener noreferrer"
            className={s.card}
          >
            <Wrench size={26} />

            <div>
              <strong>Suporte Técnico</strong>
              <span>Estamos prontos para ajudar</span>
            </div>
          </a>
        </div>

        <a
          href={whatsapp(
            "Olá! Gostaria de falar com um especialista para entender qual solução é ideal para mim."
          )}
          target="_blank"
          rel="noopener noreferrer"
          className={s.specialist}
        >
          <MessageCircle size={20} />
          Falar com um especialista
        </a>
      </div>
    </div>
  );
}