import Link from "next/link";
import Image from "next/image";
import s from "@/app/styles/footer.module.css";

const WHATSAPP = "https://wa.me/554738423235";

const SOCIALS = {
  facebook: "https://www.facebook.com/lojalimaelima",
  instagram: "https://www.instagram.com/lojalimaelima",
  linkedin:
    "https://www.linkedin.com/company/lima-e-lima-instala%C3%A7%C3%A3o-e-manuten%C3%A7%C3%A3o/",
};

export default function Footer() {
  return (
    <footer className={s.footer}>
      <div className={s.container}>

        {/* ==================================================
            TOPO
        ================================================== */}

        <div className={s.top}>

          <div className={s.brand}>
            <div className={s.brandRow}>

              <div className={s.logoWrap}>
                <Image
                  src="/produtos/logo.png"
                  alt="Lima e Lima"
                  fill
                  sizes="48px"
                  className={s.logo}
                />
              </div>

              <div>
                <div className={s.brandTitle}>
                  Lima e Lima
                </div>

                <div className={s.brandSub}>
                  Segurança eletrônica, venda, instalação e
                  configuração de equipamentos.
                </div>
              </div>

            </div>
          </div>


          {/* REDES SOCIAIS */}

          <div className={s.socials}>

            <a
              className={s.socialBtn}
              href={SOCIALS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FacebookIcon />
            </a>

            <a
              className={s.socialBtn}
              href={SOCIALS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <InstagramIcon />
            </a>

            <a
              className={s.socialBtn}
              href={SOCIALS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <LinkedInIcon />
            </a>

          </div>

        </div>


        <div className={s.divider} />


        {/* ==================================================
            COLUNAS
        ================================================== */}

        <div className={s.grid}>

          {/* SERVIÇOS */}

          <div className={s.col}>

            <h3 className={s.colTitle}>
              SERVIÇOS
            </h3>

            <Link
              className={s.link}
              href="/categoria/data-center"
            >
              Data Center
            </Link>

            <Link
              className={s.link}
              href="/categoria/sistema-de-seguranca"
            >
              Sistema de Segurança
            </Link>

            <Link
              className={s.link}
              href="/instalacao"
            >
              Instalação
            </Link>

            <Link
              className={s.link}
              href="/projetos"
            >
              Projetos
            </Link>

          </div>


          {/* EMPRESA */}

          <div className={s.col}>

            <h3 className={s.colTitle}>
              EMPRESA
            </h3>

            <Link
              className={s.link}
              href="/quem-somos"
            >
              Quem somos
            </Link>

            <Link
              className={s.link}
              href="/politica"
            >
              Política de privacidade
            </Link>

            <Link
              className={s.link}
              href="/devolucao"
            >
              Política de devolução
            </Link>

            <Link
              className={s.link}
              href="/termos"
            >
              Termos de uso
            </Link>

            <a
              className={s.link}
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
            >
              Trabalhe conosco
            </a>

          </div>


          {/* CONTATO */}

          <div className={s.col}>

            <h3 className={s.colTitle}>
              CONTATO
            </h3>

            <div className={s.contactItem}>

              <span className={s.icon}>
                <PinIcon />
              </span>

              <span>
                Jaraguá do Sul/SC
              </span>

            </div>


            <a
              className={s.contactItemLink}
              href="tel:+554738423235"
            >

              <span className={s.icon}>
                <PhoneIcon />
              </span>

              <span>
                (47) 3842-3235
              </span>

            </a>


            <a
              className={s.contactItemLink}
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
            >

              <span className={s.icon}>
                <ChatIcon />
              </span>

              <span>
                WhatsApp
              </span>

            </a>


            <a
              className={s.contactItemLink}
              href="mailto:comercial@limaelima.net.br"
            >

              <span className={s.icon}>
                <MailIcon />
              </span>

              <span>
                comercial@limaelima.net.br
              </span>

            </a>

          </div>

        </div>


        <div className={s.divider} />


        {/* ==================================================
            ÁREA DE CONFIANÇA
        ================================================== */}

        <div className={s.trustArea}>

          {/* PAGAMENTOS */}

          <div className={s.trustBlock}>

            <div className={s.trustTitle}>
              FORMAS DE PAGAMENTO
            </div>

            <div className={s.paymentGrid}>

              <div className={s.paymentCard}>
                <Image
                  src="/produtos/boleto.png"
                  alt="Boleto"
                  width={55}
                  height={32}
                />
              </div>

              <div className={s.paymentCard}>
                <Image
                  src="/produtos/visa.png"
                  alt="Visa"
                  width={55}
                  height={32}
                />
              </div>

              <div className={s.paymentCard}>
                <Image
                  src="/produtos/mastercard.png"
                  alt="Mastercard"
                  width={55}
                  height={32}
                />
              </div>

              <div className={s.paymentCard}>
                <Image
                  src="/produtos/elo.png"
                  alt="Elo"
                  width={55}
                  height={32}
                />
              </div>

              <div className={s.paymentCard}>
                <Image
                  src="/produtos/hipercard.png"
                  alt="Hipercard"
                  width={55}
                  height={32}
                />
              </div>

            </div>

            <div className={s.trustDescription}>
              Pagamento seguro e processado de forma protegida.
            </div>

          </div>


          {/* PARCEIRO CREDENCIADO */}

          <div className={s.trustBlock}>

            <div className={s.trustTitle}>
              PARCEIRO CREDENCIADO
            </div>

            <div className={s.partnerCard}>

              <Image
                src="/produtos/intelbras-revenda-ouro.png"
                alt="Intelbras Parceiro Credenciado Revenda Ouro"
                width={180}
                height={65}
                className={s.partnerImage}
              />

            </div>

            <div className={s.trustDescription}>
              Equipamentos originais e procedência garantida.
            </div>

          </div>


          {/* COMPRA SEGURA */}

          <div className={s.trustBlock}>

            <div className={s.trustTitle}>
              COMPRA SEGURA
            </div>

            <div className={s.securityGrid}>

              <div className={s.securityCard}>

                <Image
                  src="/produtos/compra-segura.png"
                  alt="Compra segura"
                  width={110}
                  height={45}
                  className={s.securityImage}
                />

              </div>

              <div className={s.securityCard}>

                <Image
                  src="/produtos/google-safe.png"
                  alt="Google Safe Browsing"
                  width={110}
                  height={45}
                  className={s.securityImage}
                />

              </div>

            </div>

          </div>

        </div>


        <div className={s.divider} />


        {/* ==================================================
            RODAPÉ INFERIOR
        ================================================== */}

        <div className={s.bottom}>

          <div className={s.copy}>

            © {new Date().getFullYear()} Lima e Lima.
            Todos os direitos reservados.

            <span className={s.separator}>
              •
            </span>

            CNPJ: 21.279.032/0001-42

            <span className={s.separator}>
              •
            </span>

            Jaraguá do Sul – SC

          </div>


          <div className={s.bottomLinks}>

            <Link
              className={s.bottomLink}
              href="/politica"
            >
              Privacidade
            </Link>

            <span className={s.dot}>•</span>

            <Link
              className={s.bottomLink}
              href="/termos"
            >
              Termos
            </Link>

            <span className={s.dot}>•</span>

            <a
              className={s.bottomLink}
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
            >
              Suporte
            </a>

          </div>

        </div>

      </div>
    </footer>
  );
}


/* =========================================================
   ÍCONES
========================================================= */

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M14 8.5V7.4c0-1.1.7-1.4 1.3-1.4H17V3h-2.4C12.6 3 11 4.5 11 7v1.5H9V12h2v9h3v-9h2.2l.8-3.5H14Z"
        fill="currentColor"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 4.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5Zm0 2A1.5 1.5 0 1 0 13.5 12 1.5 1.5 0 0 0 12 10.5ZM18 6.8a.7.7 0 1 1-.7-.7.7.7 0 0 1 .7.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.5 6.8A2.1 2.1 0 1 1 6.5 2.6a2.1 2.1 0 0 1 0 4.2ZM3.8 21V8.6h5.4V21H3.8Zm7.6 0V8.6h5.2v1.7h.1c.7-1.2 2.1-2 3.9-2 3.6 0 4.3 2.4 4.3 5.5V21h-5.4v-6c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3V21h-4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 22s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Zm0-9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.6 10.3c1.5 3 4.1 5.6 7.1 7.1l2.4-2.4c.3-.3.8-.4 1.2-.3 1.3.4 2.6.6 4 .6.7 0 1.2.5 1.2 1.2V21c0 .7-.5 1.2-1.2 1.2C10.6 22.2 1.8 13.4 1.8 2.9c0-.7.5-1.2 1.2-1.2H7c.7 0 1.2.5 1.2 1.2 0 1.4.2 2.7.6 4 .1.4 0 .9-.3 1.2l-2.4 2.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 4h16v12H7l-3 3V4Zm3.5 6.5h9v-2h-9v2Zm0 4h6v-2h-6v2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6h16v12H4V6Zm8 6L5.5 7.5h13L12 12Zm-7 4h14V9.2l-7 5-7-5V16Z"
        fill="currentColor"
      />
    </svg>
  );
}