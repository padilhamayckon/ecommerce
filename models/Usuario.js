const { DataTypes, Op } = require("sequelize");
const sequelize = require("../db");

const UsuarioModel =
  sequelize.models.Usuario ||
  sequelize.define(
    "Usuario",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      nome: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      cpf_cnpj: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      senha: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      tipo_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      criado_em: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "usuarios",
      timestamps: false,
    }
  );

/* LISTAR TODOS USUARIOS */
async function listarTodos() {
  const usuarios = await UsuarioModel.findAll({
    attributes: ["id", "nome", "email", "tipo_usuario", "criado_em"],
    order: [["id", "DESC"]],
    raw: true,
  });

  return usuarios;
}

/* BUSCAR USUARIO POR EMAIL */
async function buscarPorEmail(email) {
  const usuario = await UsuarioModel.findOne({
    attributes: [
      "id",
      "nome",
      "email",
      "cpf_cnpj",
      "senha",
      "tipo_usuario",
      "criado_em",
    ],
    where: {
      email,
    },
    raw: true,
  });

  return usuario;
}

/* BUSCAR USUARIO POR ID */
async function buscarPorId(id) {
  const usuario = await UsuarioModel.findOne({
    attributes: [
      "id",
      "nome",
      "email",
      "cpf_cnpj",
      "tipo_usuario",
      "criado_em",
    ],
    where: {
      id,
    },
    raw: true,
  });

  return usuario;
}

/* VERIFICAR SE EXISTE ADMINISTRADOR */
async function existeAdministrador() {
  const total = await UsuarioModel.count({
    where: {
      tipo_usuario: 1,
    },
  });

  return total > 0;
}

/* CRIAR ADMINISTRADOR */
async function criarAdministrador(nome, email, senha) {
  const usuario = await UsuarioModel.create({
    nome,
    email,
    senha,
    tipo_usuario: 1,
  });

  return usuario.id;
}

/* CRIAR USUARIO */
async function criarUsuario(nome, email, senha, tipo_usuario) {
  const usuario = await UsuarioModel.create({
    nome,
    email,
    senha,
    tipo_usuario,
  });

  return usuario.id;
}

/* CRIAR CLIENTE */
async function criarCliente(nome, email, cpfCnpj, senhaHash) {
  const usuario = await UsuarioModel.create({
    nome,
    email,
    cpf_cnpj: cpfCnpj,
    senha: senhaHash,
    tipo_usuario: 3,
  });

  return usuario.id;
}

/* BUSCAR USUÁRIO POR CPF/CNPJ */
async function buscarPorCpfCnpj(cpfCnpj) {
  const usuario = await UsuarioModel.findOne({
    attributes: ["id", "nome", "email", "cpf_cnpj", "senha", "tipo_usuario"],
    where: {
      cpf_cnpj: cpfCnpj,
    },
    raw: true,
  });

  return usuario;
}

/* ATUALIZAR USUARIO SEM ALTERAR SENHA */
async function atualizarUsuario(id, nome, email, tipo_usuario) {
  await UsuarioModel.update(
    {
      nome,
      email,
      tipo_usuario,
    },
    {
      where: {
        id,
      },
    }
  );
}

/* ATUALIZAR USUARIO COM NOVA SENHA */
async function atualizarUsuarioComSenha(id, nome, email, senha, tipo_usuario) {
  await UsuarioModel.update(
    {
      nome,
      email,
      senha,
      tipo_usuario,
    },
    {
      where: {
        id,
      },
    }
  );
}

/* ATUALIZAR SENHA */
async function atualizarSenha(id, senhaHash) {
  await UsuarioModel.update(
    {
      senha: senhaHash,
    },
    {
      where: {
        id,
      },
    }
  );
}

/* ATUALIZAR DADOS DO CLIENTE */
async function atualizarDadosCliente(id, nome, email, cpfCnpj) {
  await UsuarioModel.update(
    {
      nome,
      email,
      cpf_cnpj: cpfCnpj,
    },
    {
      where: {
        id,
        tipo_usuario: 3,
      },
    }
  );
}

/* EXCLUIR USUARIO */
async function excluirUsuario(id) {
  await UsuarioModel.destroy({
    where: {
      id,
    },
  });
}

/* BUSCAR EMAIL EM OUTRO USUARIO */
async function buscarEmailEmOutroUsuario(email, id) {
  const usuario = await UsuarioModel.findOne({
    attributes: ["id"],
    where: {
      email,
      id: {
        [Op.ne]: id,
      },
    },
    raw: true,
  });

  return usuario;
}

/* BUSCAR CPF/CNPJ EM OUTRO USUARIO */
async function buscarCpfCnpjEmOutroUsuario(cpfCnpj, id) {
  const usuario = await UsuarioModel.findOne({
    attributes: ["id"],
    where: {
      cpf_cnpj: cpfCnpj,
      id: {
        [Op.ne]: id,
      },
    },
    raw: true,
  });

  return usuario;
}

module.exports = {
  UsuarioModel,

  listarTodos,
  buscarPorEmail,
  buscarPorId,
  atualizarSenha,
  existeAdministrador,

  criarAdministrador,
  criarUsuario,
  criarCliente,

  atualizarUsuario,
  atualizarUsuarioComSenha,
  atualizarDadosCliente,

  excluirUsuario,

  buscarPorCpfCnpj,
  buscarEmailEmOutroUsuario,
  buscarCpfCnpjEmOutroUsuario,
};