const { DataTypes, Op } = require("sequelize");
const sequelize = require("../db");

const RecuperacaoSenhaModel =
  sequelize.models.RecuperacaoSenha ||
  sequelize.define(
    "RecuperacaoSenha",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      token_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      usado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      expira_em: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "recuperacao_senhas",
      timestamps: false,
    }
  );

/* INVALIDAR TOKENS ANTIGOS DO USUÁRIO */
async function invalidarTokensDoUsuario(usuarioId) {
  await RecuperacaoSenhaModel.update(
    {
      usado: true,
    },
    {
      where: {
        usuario_id: usuarioId,
        usado: false,
      },
    }
  );
}

/* CRIAR TOKEN DE RECUPERAÇÃO */
async function criar(usuarioId, tokenHash) {
  const expiraEm = new Date(Date.now() + 30 * 60 * 1000);

  const recuperacao = await RecuperacaoSenhaModel.create({
    usuario_id: usuarioId,
    token_hash: tokenHash,
    usado: false,
    expira_em: expiraEm,
  });

  return recuperacao.id;
}

/* BUSCAR TOKEN VÁLIDO */
async function buscarTokenValido(tokenHash) {
  const token = await RecuperacaoSenhaModel.findOne({
    attributes: ["id", "usuario_id", "token_hash", "usado", "expira_em"],
    where: {
      token_hash: tokenHash,
      usado: false,
      expira_em: {
        [Op.gt]: new Date(),
      },
    },
    raw: true,
  });

  return token;
}

/* MARCAR TOKEN COMO USADO */
async function marcarComoUsado(id) {
  await RecuperacaoSenhaModel.update(
    {
      usado: true,
    },
    {
      where: {
        id,
      },
    }
  );
}

module.exports = {
  RecuperacaoSenhaModel,

  invalidarTokensDoUsuario,
  criar,
  buscarTokenValido,
  marcarComoUsado,
};