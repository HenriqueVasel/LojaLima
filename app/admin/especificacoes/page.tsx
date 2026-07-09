"use client";

import { useState } from "react";

export default function EspecificacoesPage() {

  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [senha, setSenha] = useState("");
const [liberado, setLiberado] = useState(false);

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

   setMessage(JSON.stringify(data, null, 2));

    } catch (err: any) {

      setMessage(err.message);

    } finally {

      setLoading(false);

    }

  }

 async function entrar() {

  try {

    const res = await fetch("/api/admin/login-import", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        password: senha
      })

    });

    const data = await res.json();

    if (!res.ok) {

      alert(data.error || "Senha incorreta.");

      return;

    }

    setLiberado(true);

  } catch {

    alert("Erro ao autenticar.");

  }

}

if (!liberado) {

  return (

    <div
      style={{
        maxWidth:400,
        margin:"120px auto",
        background:"#111827",
        padding:30,
        borderRadius:12,
        color:"#fff"
      }}
    >

      <h2>Área restrita</h2>

      <p
        style={{
          opacity:.7,
          marginBottom:20
        }}
      >
        Digite a senha para acessar.
      </p>

      <input
        type="password"
        value={senha}
        onChange={(e)=>setSenha(e.target.value)}
        placeholder="Senha"
        style={{
          width:"100%",
          height:45,
          borderRadius:8,
          border:"1px solid #444",
          background:"#1f2937",
          color:"#fff",
          padding:"0 12px"
        }}
      />

      <button
        onClick={entrar}
        style={{
          marginTop:20,
          width:"100%",
          height:45,
          background:"#00c853",
          border:0,
          color:"#fff",
          borderRadius:8,
          cursor:"pointer",
          fontWeight:700
        }}
      >
        Entrar
      </button>

    </div>

  );

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

           <pre
  style={{
    whiteSpace: "pre-wrap",
    fontSize: 12,
    overflow: "auto"
  }}
>
  {message}
</pre>

          </div>

        )

      }

    </div>

  );

}