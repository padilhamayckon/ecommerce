const bcrypt = require("bcrypt");
const Usuario = require("../models/Usuario");

const SALT_ROUNDS = 10;

const TIPO_USUARIO = {
  ADMIN: 1,
  COLABORADOR: 2,
  CLIENTE: 3,
};

function normalizarEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function limparDocumento(documento) {
  return String(documento || "").replace(/\D/g, "");
}

function montarDadosRegistro(body) {
  return {
    nome: body.nome || "",
    email: body.email || "",
    cpf_cnpj: body.cpf_cnpj || "",
  };
}

function renderLogin(res, erro = null) {
  return res.render("pages/login", {
    titulo: "Login",
    erro,
  });
}

function renderRegistro(res, erro = null, dados = {}) {
  return res.render("pages/registro", {
    titulo: "Criar conta",
    erro,
    dados,
  });
}

function obterRedirectSeguro(req, fallback) {
  const redirectDepoisLogin = req.session.redirectDepoisLogin;

  delete req.session.redirectDepoisLogin;

  if (
    redirectDepoisLogin &&
    typeof redirectDepoisLogin === "string" &&
    redirectDepoisLogin.startsWith("/") &&
    !redirectDepoisLogin.startsWith("//")
  ) {
    return redirectDepoisLogin;
  }

  return fallback;
}

function definirSessaoUsuario(req, usuario) {
  req.session.usuario = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    cpf_cnpj: usuario.cpf_cnpj || null,
    tipo_usuario: Number(usuario.tipo_usuario),
  };
}

function salvarSessao(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        return reject(error);
      }

      resolve();
    });
  });
}

function redirecionarPorTipo(req, res, tipoUsuario) {
  const tipo = Number(tipoUsuario);

  if (tipo === TIPO_USUARIO.ADMIN) {
    return res.redirect(obterRedirectSeguro(req, "/usuarios"));
  }

  if (tipo === TIPO_USUARIO.COLABORADOR) {
    return res.redirect(obterRedirectSeguro(req, "/produtos/admin"));
  }

  return res.redirect(obterRedirectSeguro(req, "/carrinho"));
}

function exibirLogin(req, res) {
  return renderLogin(res);
}

async function autenticar(req, res) {
  try {
    const email = normalizarEmail(req.body.email);
    const senha = String(req.body.senha || "");

    if (!email || !senha) {
      return renderLogin(res, "Informe e-mail e senha.");
    }

    const usuario = await Usuario.buscarPorEmail(email);

    if (!usuario) {
      return renderLogin(res, "E-mail ou senha inválidos.");
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return renderLogin(res, "E-mail ou senha inválidos.");
    }

    definirSessaoUsuario(req, usuario);

    await salvarSessao(req);

    return redirecionarPorTipo(req, res, usuario.tipo_usuario);
  } catch (error) {
    console.error("Erro ao autenticar usuário:", error);

    return renderLogin(res, "Erro ao realizar login. Tente novamente.");
  }
}

function exibirRegistro(req, res) {
  return renderRegistro(res);
}

async function registrar(req, res) {
  try {
    const nome = String(req.body.nome || "").trim();
    const email = normalizarEmail(req.body.email);
    const cpfCnpjLimpo = limparDocumento(req.body.cpf_cnpj);
    const senha = String(req.body.senha || "");
    const confirmarSenha = String(req.body.confirmar_senha || "");

    const dados = montarDadosRegistro({
      nome,
      email,
      cpf_cnpj: req.body.cpf_cnpj,
    });

    if (!nome || !email || !cpfCnpjLimpo || !senha || !confirmarSenha) {
      return renderRegistro(res, "Preencha todos os campos.", dados);
    }

    if (senha !== confirmarSenha) {
      return renderRegistro(res, "As senhas não conferem.", dados);
    }

    if (senha.length < 6) {
      return renderRegistro(res, "A senha deve ter pelo menos 6 caracteres.", dados);
    }

    if (cpfCnpjLimpo.length !== 11 && cpfCnpjLimpo.length !== 14) {
      return renderRegistro(res, "Informe um CPF ou CNPJ válido.", dados);
    }

    const emailExistente = await Usuario.buscarPorEmail(email);

    if (emailExistente) {
      return renderRegistro(res, "Este e-mail já está cadastrado.", dados);
    }

    const documentoExistente = await Usuario.buscarPorCpfCnpj(cpfCnpjLimpo);

    if (documentoExistente) {
      return renderRegistro(res, "Este CPF/CNPJ já está cadastrado.", dados);
    }

    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    /*
      Segurança:
      O tipo do usuário NÃO vem do formulário.
      O model Usuario.criarCliente deve gravar tipo_usuario = 3 diretamente no SQL.
    */
    const usuarioId = await Usuario.criarCliente(
      nome,
      email,
      cpfCnpjLimpo,
      senhaHash
    );

    definirSessaoUsuario(req, {
      id: usuarioId,
      nome,
      email,
      cpf_cnpj: cpfCnpjLimpo,
      tipo_usuario: TIPO_USUARIO.CLIENTE,
    });

    await salvarSessao(req);

    return res.redirect(obterRedirectSeguro(req, "/carrinho"));
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);

    const dados = montarDadosRegistro(req.body);

    if (error && error.code === "ER_DUP_ENTRY") {
      return renderRegistro(
        res,
        "Já existe uma conta cadastrada com esses dados.",
        dados
      );
    }

    return renderRegistro(
      res,
      "Erro ao criar conta. Tente novamente.",
      dados
    );
  }
}

function sair(req, res) {
  req.session.destroy((error) => {
    if (error) {
      console.error("Erro ao encerrar sessão:", error);
      return res.redirect("/");
    }

    res.clearCookie("connect.sid");

    return res.redirect("/");
  });
}
module.exports = {
  exibirLogin,
  autenticar,
  exibirRegistro,
  registrar,
  sair
};