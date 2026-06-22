const bcrypt = require("bcrypt");
const Usuario = require("../models/Usuario");

async function listarUsuarios(req, res) {
  try {
    const usuarios = await Usuario.listarTodos();

    res.render("pages/usuarios", {
      titulo: "Usuários",
      usuarios,
      usuarioLogado: req.session.usuario,
    });
  } catch (error) {
    console.error(error);
    res.send("Erro ao listar usuários");
  }
}

function exibirFormulario(req, res) {
  res.render("pages/cadastroUsuario", {
    titulo: "Novo Usuário",
  });
}

async function salvarUsuario(req, res) {
  try {
    const { nome, email, senha, tipo_usuario } = req.body;

    if (!nome || !email || !senha || !tipo_usuario) {
      return res.render("pages/cadastroUsuario", {
        titulo: "Novo Usuário",
        erro: "Preencha todos os campos.",
      });
    }

    const usuarioExistente = await Usuario.buscarPorEmail(email);

    if (usuarioExistente) {
      return res.render("pages/cadastroUsuario", {
        titulo: "Novo Usuário",
        erro: "Este e-mail já está cadastrado.",
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    await Usuario.criarUsuario(nome, email, senhaHash, tipo_usuario);

    return res.redirect("/usuarios");
  } catch (error) {
    console.error(error);

    return res.render("pages/cadastroUsuario", {
      titulo: "Novo Usuário",
      erro: "Erro ao cadastrar usuário.",
    });
  }
}

async function exibirEdicao(req, res) {
  try {
    const { id } = req.params;

    const usuario = await Usuario.buscarPorId(id);

    if (!usuario) {
      return res.redirect("/usuarios");
    }

    res.render("pages/editarUsuario", {
      titulo: "Editar Usuário",
      usuario,
    });
  } catch (error) {
    console.error(error);
    res.send("Erro ao carregar usuário");
  }
}

async function atualizarUsuario(req, res) {
  try {
    const { id } = req.params;
    const { nome, email, senha, tipo_usuario } = req.body;

    if (!nome || !email || !tipo_usuario) {
      const usuario = await Usuario.buscarPorId(id);

      return res.render("pages/editarUsuario", {
        titulo: "Editar Usuário",
        usuario,
        erro: "Nome, e-mail e tipo são obrigatórios.",
      });
    }

    if (senha && senha.trim() !== "") {
      const senhaHash = await bcrypt.hash(senha, 10);

      await Usuario.atualizarUsuarioComSenha(
        id,
        nome,
        email,
        senhaHash,
        tipo_usuario
      );
    } else {
      await Usuario.atualizarUsuario(id, nome, email, tipo_usuario);
    }

    return res.redirect("/usuarios");
  } catch (error) {
    console.error(error);

    return res.send("Erro ao atualizar usuário");
  }
}

async function excluirUsuario(req, res) {
  try {
    const { id } = req.params;

    if (Number(req.session.usuario.id) === Number(id)) {
      return res.send("Você não pode excluir o próprio usuário logado.");
    }

    await Usuario.excluirUsuario(id);

    return res.redirect("/usuarios");
  } catch (error) {
    console.error(error);

    return res.send("Erro ao excluir usuário");
  }
}

module.exports = {
  listarUsuarios,
  exibirFormulario,
  salvarUsuario,
  exibirEdicao,
  atualizarUsuario,
  excluirUsuario,
};