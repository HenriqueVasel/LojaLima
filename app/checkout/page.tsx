"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import s from "@/app/styles/form.module.css";

export default function CheckoutPage(){

  const router = useRouter();

  const [nome,setNome]=useState("");
  const [whats,setWhats]=useState("");
  const [email,setEmail]=useState("");
  const [cpf,setCpf] = useState("");
const [tipoPessoa, setTipoPessoa] = useState("PF");
const [cnpj, setCnpj] = useState("");
const [inscricaoEstadual, setInscricaoEstadual] = useState("");
  const [obs,setObs]=useState("");
  const [frete, setFrete] = useState<number | null>(null);
      
  const [retirada, setRetirada] = useState(false);
  // 🔥 NOVO
  const [endereco, setEndereco] = useState<any>(null);

  useEffect(() => {

    async function checkCart() {
      const res = await fetch("/api/cart", {
        credentials: "include"
      });

      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        alert("Seu carrinho está vazio");
        router.push("/carrinho");
      }
    }

    checkCart();

  }, []);

  // 🔥 FRETE
  useEffect(() => {
    const saved =
     sessionStorage.getItem("freteCents") ||
      localStorage.getItem("frete");

    if (saved) {
      setFrete(Number(saved));
    } else {
      setFrete(null);
    }
  }, []);


  useEffect(() => {

  const retiradaSalva =
    sessionStorage.getItem("retiradaLoja") === "true";

  setRetirada(retiradaSalva);

}, []);

  // 🔥 NOVO: PEGAR ENDEREÇO
  useEffect(() => {
    const cep = localStorage.getItem("cep");
    const cidade = localStorage.getItem("cidade");
    const uf = localStorage.getItem("uf");
    const logradouro = localStorage.getItem("logradouro");
    const bairro = localStorage.getItem("bairro");
    

    if (cep && cidade && uf) {
      setEndereco({
        cep,
        cidade,
        uf,
        logradouro,
        bairro
      });
    }
  }, []);

  // 🔥 AUTO USER
  useEffect(() => {

    async function loadUser() {
      try {
        const res = await fetch("/api/me", {
          credentials: "include"
        });

        if (!res.ok) return;

        const user = await res.json();

        setNome(user.name || "");
        setEmail(user.email || "");

      } catch {
        console.log("Erro ao carregar usuário");
      }
    }

    loadUser();

  }, []);

  function formatarCPF(valor:string){
    valor = valor.replace(/\D/g,"");
    valor = valor.replace(/(\d{3})(\d)/,"$1.$2");
    valor = valor.replace(/(\d{3})(\d)/,"$1.$2");
    valor = valor.replace(/(\d{3})(\d{1,2})$/,"$1-$2");
    return valor;
  }


  function formatarCNPJ(valor: string) {
  valor = valor.replace(/\D/g, "");
  valor = valor.replace(/^(\d{2})(\d)/, "$1.$2");
  valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
  valor = valor.replace(/\.(\d{3})(\d)/, ".$1/$2");
  valor = valor.replace(/(\d{4})(\d)/, "$1-$2");
  return valor;
}

  function validarCPF(cpf:string){
    cpf = cpf.replace(/\D/g,"");

    if(cpf.length !== 11) return false;
    if(/^(\d)\1+$/.test(cpf)) return false;

    let soma = 0;
    let resto;

    for(let i=1;i<=9;i++){
      soma += parseInt(cpf.substring(i-1,i))*(11-i);
    }

    resto = (soma*10)%11;
    if(resto === 10 || resto === 11) resto = 0;
    if(resto !== parseInt(cpf.substring(9,10))) return false;

    soma = 0;

    for(let i=1;i<=10;i++){
      soma += parseInt(cpf.substring(i-1,i))*(12-i);
    }

    resto = (soma*10)%11;
    if(resto === 10 || resto === 11) resto = 0;

    return resto === parseInt(cpf.substring(10,11));
  }

  function validarCNPJ(cnpj: string) {

  cnpj = cnpj.replace(/\D/g, "");

  if (cnpj.length !== 14) return false;

  if (/^(\d)\1+$/.test(cnpj)) return false;

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);

  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += Number(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  if (resultado !== Number(digitos.charAt(0))) {
    return false;
  }

  tamanho += 1;
  numeros = cnpj.substring(0, tamanho);

  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += Number(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  return resultado === Number(digitos.charAt(1));

}

  function validarEmail(email:string){
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  function validarTelefone(numero:string){
    const limpo = numero.replace(/\D/g,"");
    return limpo.length >= 10 && limpo.length <= 11;
  }



  function continuar(){



if (!retirada && !endereco) {
  alert("Calcule o frete antes de continuar");
  return;
}

    if(!nome || !whats){
      alert("Preencha nome e WhatsApp");
      return;
    }

    if(!validarTelefone(whats)){
      alert("Telefone inválido");
      return;
    }

    if(email && !validarEmail(email)){
      alert("Email inválido");
      return;
    }

  if (tipoPessoa === "PF") {

  if (!cpf) {
    alert("Informe o CPF");
    return;
  }

  const cpfLimpo = cpf.replace(/\D/g, "");

  if (cpfLimpo.length !== 11) {
    alert("CPF incompleto");
    return;
  }

  if (!validarCPF(cpf)) {
    alert("CPF inválido");
    return;
  }

} else {

  if (!cnpj) {
  alert("Informe o CNPJ");
  return;
}

const cnpjLimpo = cnpj.replace(/\D/g, "");

if (cnpjLimpo.length !== 14) {
  alert("CNPJ incompleto");
  return;
}

if (!validarCNPJ(cnpj)) {
  alert("CNPJ inválido");
  return;
}

if (!inscricaoEstadual) {
  alert("Informe a Inscrição Estadual");
  return;
}

}

    // 🔥 NOVO: PEGAR ENDEREÇO
    const cep = localStorage.getItem("cep");
    const cidade = localStorage.getItem("cidade");
    const uf = localStorage.getItem("uf");
    const logradouro = localStorage.getItem("logradouro");
    const bairro = localStorage.getItem("bairro");
    const numero = localStorage.getItem("numero");

   sessionStorage.setItem(
  "checkout_customer",
  JSON.stringify({
    nome,
    whats,
    email,

    tipoPessoa,
    cpf,
    cnpj,
    inscricaoEstadual,

    obs,

    retirada,

    freteCents: retirada
      ? 0
      : frete
      ? Number(frete)
      : 0,

    endereco: retirada
      ? null
      : {
          cep,
          cidade,
          uf,
          logradouro,
          bairro
        },

    numero: retirada
      ? ""
      : numero || "",
  })
);

    router.push("/checkout/pagamento");
  }

  return(

    <div className={s.page}>
      <div className={s.container}>

        <h1 className={s.title}>
          Checkout
        </h1>

        <div className={s.card}>

          <input
            placeholder="Nome"
            value={nome}
            onChange={(e)=>setNome(e.target.value)}
            className={s.input}
          />

          <div style={{ marginBottom: "15px" }}>

  <label style={{ marginRight: "20px" }}>
    <input
      type="radio"
      value="PF"
      checked={tipoPessoa === "PF"}
      onChange={() => setTipoPessoa("PF")}
    />
    Pessoa Física
  </label>

  <label>
    <input
      type="radio"
      value="PJ"
      checked={tipoPessoa === "PJ"}
      onChange={() => setTipoPessoa("PJ")}
    />
    Pessoa Jurídica
  </label>

</div>

          <input
            placeholder="WhatsApp"
            value={whats}
            onChange={(e)=>setWhats(e.target.value)}
            className={s.input}
          />

          <input
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className={s.input}
          />

          {tipoPessoa === "PF" ? (

  <input
    placeholder="CPF"
    value={cpf}
    onChange={(e)=>
      setCpf(formatarCPF(e.target.value))
    }
    className={s.input}
    maxLength={14}
  />

) : (

  <>
    <input
  placeholder="CNPJ"
  value={cnpj}
  onChange={(e)=>setCnpj(formatarCNPJ(e.target.value))}
  className={s.input}
  maxLength={18}
/>

    <input
      placeholder="Inscrição Estadual"
      value={inscricaoEstadual}
      onChange={(e)=>setInscricaoEstadual(e.target.value)}
      className={s.input}
    />
  </>

)}
          <textarea
            placeholder="Observações"
            value={obs}
            onChange={(e)=>setObs(e.target.value)}
            className={s.textarea}
          />

          

          

          <button
            onClick={continuar}
            className={s.button}
          >
            Continuar para pagamento
          </button>

        </div>
      </div>
    </div>

  );
}