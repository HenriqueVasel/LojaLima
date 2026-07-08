"use client";

import { useState } from "react";

export default function EspecificacoesPage() {

  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  async function importar() {

    if (!file) {
      alert("Selecione uma planilha.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {

      const formData = new FormData();

      formData.append("file", file);

      const res = await fetch(
        "/api/admin/import-specs",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Erro ao importar."
        );
      }

      setMessage(data.message);

    } catch (err: any) {

      setMessage(err.message);

    } finally {

      setLoading(false);

    }

  }

  return (

    <div
      style={{
        maxWidth: 700,
        margin: "40px auto",
        background: "#111827",
        padding: 30,
        borderRadius: 12,
        color: "#fff"
      }}
    >

      <h1
        style={{
          fontSize: 28,
          marginBottom: 10
        }}
      >
        Importar Especificações Intelbras
      </h1>

      <p
        style={{
          opacity: .7,
          marginBottom: 30
        }}
      >
        Faça upload da planilha contendo
        Peso, Altura, Largura e Comprimento.
      </p>

      <input
        type="file"
        accept=".xlsx,.xls,.xlsb,.csv"
        onChange={(e)=>{

          if(e.target.files){

            setFile(e.target.files[0]);

          }

        }}
      />

      <br/>
      <br/>

      <button

        onClick={importar}

        disabled={loading}

        style={{
          background:"#00c853",
          color:"#fff",
          border:0,
          padding:"12px 24px",
          borderRadius:8,
          cursor:"pointer",
          fontWeight:600
        }}

      >

        {

          loading

          ? "Importando..."

          : "Importar Planilha"

        }

      </button>

      {

        message && (

          <div
            style={{
              marginTop:25,
              background:"#1f2937",
              padding:15,
              borderRadius:8
            }}
          >

            {message}

          </div>

        )

      }

    </div>

  );

}