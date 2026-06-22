const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ENVIO GENÉRICO */
async function enviarEmail({ para, assunto, html, replyTo }) {
  const resultado = await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || "Sistema"}" <${process.env.EMAIL_USER}>`,
    to: para,
    replyTo,
    subject: assunto,
    html,
  });

  console.log("E-mail enviado:", resultado.messageId);

  return resultado;
}

/* E-MAIL DE CONTATO */
async function enviarEmailContato({ nome, email, telefone, mensagem }) {
  return enviarEmail({
    para: process.env.EMAIL_TO,
    replyTo: email,
    assunto: `Novo contato de ${nome}`,
    html: `
      <h2>Novo contato recebido pelo site</h2>

      <p><strong>Nome:</strong> ${nome}</p>
      <p><strong>E-mail:</strong> ${email}</p>
      <p><strong>Telefone:</strong> ${telefone || "Não informado"}</p>

      <h3>Mensagem:</h3>
      <p>${mensagem || "Nenhuma mensagem informada."}</p>
    `,
  });
}

/* E-MAIL DE RECUPERAÇÃO DE SENHA */
async function enviarEmailRecuperacaoSenha({ nome, email, link }) {
  return enviarEmail({
    para: email,
    assunto: "Recuperação de senha",
    html: `
      <h2>Recuperação de senha</h2>

      <p>Olá, ${nome}.</p>

      <p>Recebemos uma solicitação para redefinir sua senha.</p>

      <p>
        <a href="${link}" target="_blank">
          Clique aqui para criar uma nova senha
        </a>
      </p>

      <p>Este link expira em 30 minutos.</p>

      <p>Se você não solicitou essa recuperação, ignore este e-mail.</p>
    `,
  });
}

module.exports = {
  enviarEmail,
  enviarEmailContato,
  enviarEmailRecuperacaoSenha,
};