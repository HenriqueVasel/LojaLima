"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import s from "@/app/styles/ProductFAQ.module.css";

const questions = [
  {
    question: "O produto é original?",
    answer:
      "Sim. Todos os produtos comercializados pela Lima e Lima são originais e possuem garantia oficial do fabricante.",
  },
  {
    question: "Acompanha nota fiscal?",
    answer:
      "Sim. Todos os pedidos são enviados com nota fiscal.",
  },
  {
    question: "Tem garantia?",
    answer:
      "Sim. A garantia segue a política oficial do fabricante.",
  },
  {
    question: "Enviam para todo o Brasil?",
    answer:
      "Sim. Realizamos envios para todo o território nacional.",
  },
  {
    question: "Posso retirar na loja?",
    answer:
      "Sim, quando disponível no checkout.",
  },
  {
    question: "Possuem suporte técnico?",
    answer:
      "Nossa equipe está pronta para ajudar antes e após sua compra.",
  },
];

export default function ProductFAQ() {

  const [open, setOpen] = useState<number | null>(0);

  return (

    <div className={s.card}>

      <h3>Perguntas Frequentes</h3>

      {questions.map((item, index) => (

        <div
          key={index}
          className={s.item}
        >

          <button
            onClick={() =>
              setOpen(open === index ? null : index)
            }
          >

            {item.question}

            <ChevronDown
              className={
                open === index
                  ? s.rotate
                  : ""
              }
            />

          </button>

          {open === index && (
            <p>{item.answer}</p>
          )}

        </div>

      ))}

    </div>

  );

}