const crypto = require("crypto");
const bcrypt = require("bcrypt");

const Usuario = require("../models/Usuario");
const RecuperacaoSenha = require("../models/RecuperacaoSenha");

const {
  enviarEmailRecuperacaoSenha,
} = require("../services/emailService");

const SALT_ROUNDS = 10;

function gerarToken() {
  return crypto.randomBytes(32).toString("hex");
}

function gerarHashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function exibirSolicitacao(req, res) {
  res.render("pages/recuperarSenha", {
    titulo: "Recuperar senha",
  });
}

async function solicitarRecuperacao(req, res) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.render("pages/recuperarSenha", {
        titulo: "Recuperar senha",
        erro: "Informe seu e-mail.",
      });
    }

    const usuario = await Usuario.buscarPorEmail(email);

    /*
      Segurança:
      A resposta é genérica para não revelar se o e-mail existe.
    */
    const mensagemSucesso =
      "Se o e-mail estiver cadastrado, enviaremos as instruções para redefinir sua senha.";

    if (!usuario) {
      return res.render("pages/recuperarSenha", {
        titulo: "Recuperar senha",
        sucesso: mensagemSucesso,
      });
    }

    const token = gerarToken();
    const tokenHash = gerarHashToken(token);

    await RecuperacaoSenha.invalidarTokensDoUsuario(usuario.id);
    await RecuperacaoSenha.criar(usuario.id, tokenHash);

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const link = `${appUrl}/redefinir-senha/${token}`;

    await enviarEmailRecuperacaoSenha({
      nome: usuario.nome,
      email: usuario.email,
      link,
    });

    return res.render("pages/recuperarSenha", {
      titulo: "Recuperar senha",
      sucesso: mensagemSucesso,
    });
  } catch (error) {
    console.error("Erro ao solicitar recuperação de senha:", error);

    return res.render("pages/recuperarSenha", {
      titulo: "Recuperar senha",
      erro: "Erro ao solicitar recuperação de senha. Tente novamente.",
    });
  }
}

async function exibirRedefinicao(req, res) {
  try {
    const { token } = req.params;
    const tokenHash = gerarHashToken(token);

    const recuperacao = await RecuperacaoSenha.buscarTokenValido(tokenHash);

    if (!recuperacao) {
      return res.render("pages/redefinirSenha", {
        titulo: "Redefinir senha",
        erro: "Link inválido ou expirado.",
        tokenInvalido: true,
      });
    }

    return res.render("pages/redefinirSenha", {
      titulo: "Redefinir senha",
      token,
    });
  } catch (error) {
    console.error("Erro ao abrir redefinição de senha:", error);

    return res.render("pages/redefinirSenha", {
      titulo: "Redefinir senha",
      erro: "Erro ao abrir redefinição de senha.",
      tokenInvalido: true,
    });
  }
}

async function redefinirSenha(req, res) {
  try {
    const { token } = req.params;
    const { senha, confirmar_senha } = req.body;

    if (!senha || !confirmar_senha) {
      return res.render("pages/redefinirSenha", {
        titulo: "Redefinir senha",
        token,
        erro: "Preencha todos os campos.",
      });
    }

    if (senha !== confirmar_senha) {
      return res.render("pages/redefinirSenha", {
        titulo: "Redefinir senha",
        token,
        erro: "As senhas não conferem.",
      });
    }

    if (senha.length < 6) {
      return res.render("pages/redefinirSenha", {
        titulo: "Redefinir senha",
        token,
        erro: "A senha deve ter pelo menos 6 caracteres.",
      });
    }

    const tokenHash = gerarHashToken(token);

    const recuperacao = await RecuperacaoSenha.buscarTokenValido(tokenHash);

    if (!recuperacao) {
      return res.render("pages/redefinirSenha", {
        titulo: "Redefinir senha",
        erro: "Link inválido ou expirado.",
        tokenInvalido: true,
      });
    }

    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    await Usuario.atualizarSenha(recuperacao.usuario_id, senhaHash);

    await RecuperacaoSenha.marcarComoUsado(recuperacao.id);

    return res.render("pages/login", {
      titulo: "Login",
      sucesso: "Senha redefinida com sucesso. Faça login novamente.",
    });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);

    return res.render("pages/redefinirSenha", {
      titulo: "Redefinir senha",
      token: req.params.token,
      erro: "Erro ao redefinir senha. Tente novamente.",
    });
  }
}

module.exports = {
  exibirSolicitacao,
  solicitarRecuperacao,
  exibirRedefinicao,
  redefinirSenha,
};