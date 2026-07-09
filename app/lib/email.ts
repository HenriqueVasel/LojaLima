import { Resend } from "resend";
import { createEmailLayout } from "./emailTemplate";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Loja Lima e Lima <contato@lojalimaelima.com.br>";
const ADMIN_EMAIL = "marketinglimaelima@gmail.com";

// ================= EMAIL DE VERIFICAÇÃO =================
// ================= EMAIL DE VERIFICAÇÃO =================
export async function sendVerificationEmail(
  email: string,
  link: string
) {
  try {
    const html = createEmailLayout({
      title: "Confirme seu e-mail",
      subtitle:
        "Obrigado por criar sua conta na Loja Lima e Lima. Para ativar seu cadastro e garantir a segurança da sua conta, confirme seu endereço de e-mail clicando no botão abaixo.",

      buttonText: "CONFIRMAR E-MAIL",

      buttonLink: link,

      content: `
        <div
          style="
            margin-top:30px;
            background:#f8f8f8;
            padding:20px;
            border-radius:10px;
            color:#444;
            line-height:1.8;
            font-size:15px;
          "
        >

          <strong>Após a confirmação você poderá:</strong>

          <br><br>

          ✔ Acompanhar seus pedidos

          <br>

          ✔ Recuperar sua senha com segurança

          <br>

          ✔ Comprar mais rapidamente

          <br>

          ✔ Receber novidades e promoções

        </div>
      `,
    });

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Confirme seu e-mail",
      html,
    });

    console.log("📧 EMAIL VERIFICAÇÃO ENVIADO");
    console.log("✅ RESEND:", response);

    return {
      success: true,
      response,
      error: null,
    };

  } catch (error: any) {
    console.error("❌ ERRO AO ENVIAR EMAIL VERIFICAÇÃO:");
    console.error(error);

    return {
      success: false,
      response: null,
      error: error?.message || "Erro desconhecido",
    };
  }
}

// ================= EMAIL DE PEDIDO =================
export async function sendOrderEmail(order: any) {
  try {
    if (!order) {
      console.error("❌ Pedido inválido");
      return null;
    }

    const produtosHTML = order.orderitem
      ?.map(
        (item: any) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">
            ${item.name}
          </td>

          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:center;">
            ${item.qty}
          </td>
        </tr>
      `
      )
      .join("");

    const response = await resend.emails.send({
      from: FROM_EMAIL,

      to: [
        ADMIN_EMAIL,
        order.customerEmail,
      ],

      subject: `🛒 Pedido #${order.id.slice(0, 8)} • ${order.customerType === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}`,

      html: `
      <div style="background:#f6f6f6;padding:30px 0;">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;font-family:Arial,sans-serif;color:#333;">

          <!-- HEADER -->
          <div style="background:#000;padding:20px;text-align:center;">
            <img 
              src="https://lojalimaelima.com.br/produtos/logo.png"
              alt="Logo"
              style="max-height:60px;"
            />
          </div>

          <!-- CONTEÚDO -->
          <div style="padding:20px;">

            <h3 style="margin-top:0;">
              🧾 Pedido #${order.id.slice(0, 8)}
            </h3>

            <!-- CLIENTE -->
            <h4>👤 Dados do Cliente</h4>

            <p>
              <strong>Nome:</strong> ${order.customerName}
            </p>

            <p>
              <strong>Whats:</strong> ${order.customerWhats}
            </p>

            <p>
              <strong>Email:</strong> ${order.customerEmail}
            </p>

 <p>
  <strong>Tipo:</strong>
  ${order.customerType === "PJ" ? " Pessoa Jurídica" : " Pessoa Física"}
</p>

${
  order.customerType === "PJ"
    ? `
      <p>
        <strong>CNPJ:</strong> ${order.customerCnpj || "-"}
      </p>

      <p>
        <strong>Inscrição Estadual:</strong> ${order.customerIe || "-"}
      </p>
    `
    : `
      <p>
        <strong>CPF:</strong> ${order.customerCpf || "-"}
      </p>
    `
}

            <!-- ENDEREÇO -->
            <h4 style="margin-top:20px;">
              📍 Endereço de Entrega
            </h4>

            <p>
              ${order.street || ""}, ${order.number || ""}<br/>
              ${order.neighborhood || ""}<br/>
              ${order.city || ""} - ${order.state || ""}<br/>
              CEP: ${order.cep || ""}
            </p>

            <!-- PRODUTOS -->
            <h4 style="margin-top:20px;">
              🛒 Produtos
            </h4>

            <table 
              width="100%" 
              style="border-collapse:collapse;font-size:14px;"
            >
              <thead>
                <tr 
                  style="
                    text-align:left;
                    border-bottom:2px solid #000;
                  "
                >
                  <th style="padding:8px 0;">
                    Produto
                  </th>

                  <th 
                    style="
                      padding:8px 0;
                      text-align:center;
                    "
                  >
                    Qtd
                  </th>
                </tr>
              </thead>

              <tbody>
                ${produtosHTML}
              </tbody>
            </table>

            <!-- TOTAL -->
            <div 
              style="
                margin-top:20px;
                padding:15px;
                background:#f1f1f1;
                border-radius:8px;
                text-align:right;
              "
            >
              <span style="font-size:14px;">
                Total:
              </span>

              <br/>

              <strong style="font-size:20px;">
                R$ ${(order.totalCents / 100).toFixed(2)}
              </strong>
            </div>

          </div>

          <!-- FOOTER -->
          <div 
            style="
              background:#fafafa;
              padding:15px;
              text-align:center;
              font-size:12px;
              color:#777;
            "
          >
            <p>
              Este é um email automático.
            </p>

            <p>
              Loja Lima e Lima © ${new Date().getFullYear()}
            </p>
          </div>

        </div>
      </div>
      `,
    });

    console.log("📧 EMAIL DE PEDIDO ENVIADO");
    console.log("✅ RESPOSTA RESEND:", response);

    return response;

  } catch (error: any) {
    console.error("❌ ERRO AO ENVIAR EMAIL DE PEDIDO:");
    console.error(error);

    return null;
  }
}

// ================= RESET DE SENHA =================
export async function sendResetEmail(
  email: string,
  link: string
) {
  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Redefinição de senha",

      html: `
        <div style="font-family:Arial,sans-serif;text-align:center;padding:20px">

          <h2>
            Redefinir senha
          </h2>

          <p>
            Clique no botão abaixo para criar uma nova senha:
          </p>

          <a 
            href="${link}" 
            style="
              display:inline-block;
              padding:12px 20px;
              background:#000;
              color:#fff;
              border-radius:8px;
              text-decoration:none;
            "
          >
            Redefinir senha
          </a>

          <p 
            style="
              margin-top:20px;
              font-size:12px;
              color:#666;
            "
          >
            Esse link expira em alguns minutos.
            <br/>
            Se não funcionar:
            <br/>
            ${link}
          </p>

        </div>
      `,
    });

    console.log("📧 EMAIL RESET ENVIADO");
    console.log("✅ RESPOSTA RESEND:", response);

    return response;

  } catch (error: any) {
    console.error("❌ ERRO AO ENVIAR RESET:");
    console.error(error);

    return null;
  }
}