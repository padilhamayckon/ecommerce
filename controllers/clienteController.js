const bcrypt = require("bcrypt");

const Usuario = require("../models/Usuario");
const Pedido = require("../models/Pedido");

const SALT_ROUNDS = 10;

function limparDocumento(documento) {
  return String(documento || "").replace(/\D/g, "");
}

function normalizarEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/* PAINEL */
async function painel(req, res) {
  try {
    const usuario = await Usuario.buscarPorId(req.session.usuario.id);
    const pedidos = await Pedido.listarPorUsuario(req.session.usuario.id);

    res.render("pages/minhaConta", {
      titulo: "Minha conta",
      usuario,
      pedidos,
    });
  } catch (error) {
    console.log("Erro ao carregar minha conta:", error);
    res.redirect("/");
  }
}

/* ATUALIZAR DADOS */
async function atualizarDados(req, res) {
  try {
    const usuarioId = req.session.usuario.id;

    const nome = String(req.body.nome || "").trim();
    const email = normalizarEmail(req.body.email);
    const cpfCnpj = limparDocumento(req.body.cpf_cnpj);

    const usuario = {
      id: usuarioId,
      nome,
      email,
      cpf_cnpj: req.body.cpf_cnpj,
    };

    if (!nome || !email || !cpfCnpj) {
      return res.render("pages/minhaConta", {
        titulo: "Minha conta",
        usuario,
        pedidos: await Pedido.listarPorUsuario(usuarioId),
        erroDados: "Preencha todos os campos.",
      });
    }

    if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
      return res.render("pages/minhaConta", {
        titulo: "Minha conta",
        usuario,
        pedidos: await Pedido.listarPorUsuario(usuarioId),
        erroDados: "Informe um CPF ou CNPJ válido.",
      });
    }

    const emailExistente = await Usuario.buscarEmailEmOutroUsuario(email, usuarioId);

    if (emailExistente) {
      return res.render("pages/minhaConta", {
        titulo: "Minha conta",
        usuario,
        pedidos: await Pedido.listarPorUsuario(usuarioId),
        erroDados: "Este e-mail já está em uso.",
      });
    }

    const documentoExistente = await Usuario.buscarCpfCnpjEmOutroUsuario(cpfCnpj, usuarioId);

    if (documentoExistente) {
      return res.render("pages/minhaConta", {
        titulo: "Minha conta",
        usuario,
        pedidos: await Pedido.listarPorUsuario(usuarioId),
        erroDados: "Este CPF/CNPJ já está em uso.",
      });
    }

    await Usuario.atualizarDadosCliente(
      usuarioId,
      nome,
      email,
      cpfCnpj
    );

    req.session.usuario.nome = nome;
    req.session.usuario.email = email;
    req.session.usuario.cpf_cnpj = cpfCnpj;

    res.redirect("/minha-conta?sucesso=dados");
  } catch (error) {
    console.log("Erro ao atualizar dados:", error);
    res.redirect("/minha-conta?erro=dados");
  }
}

/* ALTERAR SENHA */
async function alterarSenha(req, res) {
  try {
    const usuarioId = req.session.usuario.id;

    const {
      senha_atual,
      nova_senha,
      confirmar_nova_senha,
    } = req.body;

    const usuario = await Usuario.buscarPorEmail(req.session.usuario.email);
    const pedidos = await Pedido.listarPorUsuario(usuarioId);

    if (!senha_atual || !nova_senha || !confirmar_nova_senha) {
      return res.render("pages/minhaConta", {
        titulo: "Minha conta",
        usuario,
        pedidos,
        erroSenha: "Preencha todos os campos de senha.",
      });
    }

    const senhaAtualValida = await bcrypt.compare(
      senha_atual,
      usuario.senha
    );

    if (!senhaAtualValida) {
      return res.render("pages/minhaConta", {
        titulo: "Minha conta",
        usuario,
        pedidos,
        erroSenha: "Senha atual incorreta.",
      });
    }

    if (nova_senha !== confirmar_nova_senha) {
      return res.render("pages/minhaConta", {
        titulo: "Minha conta",
        usuario,
        pedidos,
        erroSenha: "As novas senhas não conferem.",
      });
    }

    if (nova_senha.length < 6) {
      return res.render("pages/minhaConta", {
        titulo: "Minha conta",
        usuario,
        pedidos,
        erroSenha: "A nova senha deve ter pelo menos 6 caracteres.",
      });
    }

    const senhaHash = await bcrypt.hash(nova_senha, SALT_ROUNDS);

    await Usuario.atualizarSenha(usuarioId, senhaHash);

    res.redirect("/minha-conta?sucesso=senha");
  } catch (error) {
    console.log("Erro ao alterar senha:", error);
    res.redirect("/minha-conta?erro=senha");
  }
}

/* HISTÓRICO DE PEDIDOS */
async function historicoPedidos(req, res) {
  try {
    const pedidos = await Pedido.listarPorUsuario(req.session.usuario.id);

    res.render("pages/meusPedidos", {
      titulo: "Meus pedidos",
      pedidos,
    });
  } catch (error) {
    console.log("Erro ao carregar pedidos:", error);
    res.redirect("/minha-conta");
  }
}

/* DETALHES DO PEDIDO */
async function detalhesPedido(req, res) {
  try {
    const { id } = req.params;
    const usuarioId = req.session.usuario.id;

    const pedido = await Pedido.buscarPedidoDoUsuario(id, usuarioId);

    if (!pedido) {
      return res.redirect("/minha-conta/pedidos");
    }

    const itens = await Pedido.listarItensDoPedido(id);

    res.render("pages/pedidoDetalhes", {
      titulo: `Pedido #${pedido.id}`,
      pedido,
      itens,
    });
  } catch (error) {
    console.log("Erro ao carregar detalhes do pedido:", error);
    res.redirect("/minha-conta/pedidos");
  }
}

module.exports = {
  painel,
  atualizarDados,
  alterarSenha,
  historicoPedidos,
  detalhesPedido,
};