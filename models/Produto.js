const { DataTypes, Op } = require("sequelize");
const sequelize = require("../db");

/* =========================
   MODELS
========================= */

const ProdutoModel =
  sequelize.models.Produto ||
  sequelize.define(
    "Produto",
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

      quantidade: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      descricao: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      imagem: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      /*
        PostgreSQL usa BOOLEAN real.
        MySQL aceita BOOLEAN como TINYINT(1).
      */
      ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: "produtos",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

const CarrinhoReservaModel =
  sequelize.models.CarrinhoReserva ||
  sequelize.define(
    "CarrinhoReserva",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      produto_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      session_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      quantidade: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "ativa",
      },

      /*
        No JavaScript usamos expiraEm.
        No PostgreSQL a coluna real é expira_em.
      */
      expiraEm: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "expira_em",
      },
    },
    {
      tableName: "carrinho_reservas",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

/* Evita erro caso a associação já tenha sido criada em outro arquivo */
if (!CarrinhoReservaModel.associations.produto) {
  CarrinhoReservaModel.belongsTo(ProdutoModel, {
    foreignKey: "produto_id",
    as: "produto",
  });
}

/* =========================
   FUNÇÕES AUXILIARES
========================= */

function dataExpiracaoCarrinho() {
  return new Date(Date.now() + 15 * 60 * 1000);
}

function normalizarAtivo(valor) {
  if (valor === true) return true;
  if (valor === false) return false;

  if (valor === 1) return true;
  if (valor === 0) return false;

  if (valor === "1") return true;
  if (valor === "0") return false;

  if (valor === "true") return true;
  if (valor === "false") return false;

  if (valor === "on") return true;

  return false;
}

async function totalReservadoProduto(produtoId, transaction = null) {
  const total = await CarrinhoReservaModel.sum("quantidade", {
    where: {
      produto_id: produtoId,
      status: "ativa",
      expiraEm: {
        [Op.gt]: new Date(),
      },
    },
    transaction,
  });

  return Number(total) || 0;
}

/* EXPIRAR RESERVAS VENCIDAS */
async function expirarReservas(transaction = null) {
  await CarrinhoReservaModel.update(
    {
      status: "expirada",
    },
    {
      where: {
        status: "ativa",
        expiraEm: {
          [Op.lte]: new Date(),
        },
      },
      transaction,
    }
  );
}

/* =========================
   PRODUTOS
========================= */

/* LISTAR TODOS OS PRODUTOS - ADMIN */
async function listarTodos() {
  const produtos = await ProdutoModel.findAll({
    attributes: [
      "id",
      "nome",
      "quantidade",
      "descricao",
      "valor",
      "imagem",
      "ativo",
      "createdAt",
      "updatedAt",
    ],
    order: [["id", "DESC"]],
    raw: true,
  });

  return produtos;
}

/* LISTAR APENAS PRODUTOS ATIVOS - CATÁLOGO */
async function listarAtivos() {
  await expirarReservas();

  const produtos = await ProdutoModel.findAll({
    attributes: [
      "id",
      "nome",
      "quantidade",
      "descricao",
      "valor",
      "imagem",
      "ativo",
    ],
    where: {
      ativo: true,
    },
    order: [["id", "DESC"]],
    raw: true,
  });

  const reservas = await CarrinhoReservaModel.findAll({
    attributes: [
      "produto_id",
      [sequelize.fn("SUM", sequelize.col("quantidade")), "total_reservado"],
    ],
    where: {
      status: "ativa",
      expiraEm: {
        [Op.gt]: new Date(),
      },
    },
    group: ["produto_id"],
    raw: true,
  });

  const mapaReservas = {};

  for (const reserva of reservas) {
    mapaReservas[reserva.produto_id] = Number(reserva.total_reservado) || 0;
  }

  return produtos.map((produto) => {
    const totalReservado = mapaReservas[produto.id] || 0;

    return {
      ...produto,
      quantidade: Math.max(Number(produto.quantidade) - totalReservado, 0),
    };
  });
}

/* BUSCAR PRODUTO POR ID - USADO NO ADMIN */
async function buscarPorId(id) {
  const produto = await ProdutoModel.findOne({
    attributes: [
      "id",
      "nome",
      "quantidade",
      "descricao",
      "valor",
      "imagem",
      "ativo",
      "createdAt",
      "updatedAt",
    ],
    where: {
      id,
    },
    raw: true,
  });

  return produto;
}

/* BUSCAR PRODUTO ATIVO COM QUANTIDADE DISPONÍVEL - USADO NO CATÁLOGO/DETALHES */
async function buscarPorIdComDisponivel(id) {
  await expirarReservas();

  const produto = await ProdutoModel.findOne({
    attributes: [
      "id",
      "nome",
      "quantidade",
      "descricao",
      "valor",
      "imagem",
      "ativo",
      "createdAt",
      "updatedAt",
    ],
    where: {
      id,
      ativo: true,
    },
    raw: true,
  });

  if (!produto) {
    return undefined;
  }

  const totalReservado = await totalReservadoProduto(id);

  return {
    ...produto,
    quantidade: Math.max(Number(produto.quantidade) - totalReservado, 0),
  };
}

/* CRIAR PRODUTO */
async function criarProduto(nome, quantidade, descricao, valor, imagem, ativo = true) {
  const produto = await ProdutoModel.create({
    nome,
    quantidade,
    descricao,
    valor,
    imagem,
    ativo: normalizarAtivo(ativo),
  });

  return produto.id;
}

/* ATUALIZAR PRODUTO COM IMAGEM */
async function atualizarProduto(id, nome, quantidade, descricao, valor, imagem, ativo) {
  await ProdutoModel.update(
    {
      nome,
      quantidade,
      descricao,
      valor,
      imagem,
      ativo: normalizarAtivo(ativo),
    },
    {
      where: {
        id,
      },
    }
  );
}

/* ATUALIZAR PRODUTO SEM ALTERAR IMAGEM */
async function atualizarProdutoSemImagem(id, nome, quantidade, descricao, valor, ativo) {
  await ProdutoModel.update(
    {
      nome,
      quantidade,
      descricao,
      valor,
      ativo: normalizarAtivo(ativo),
    },
    {
      where: {
        id,
      },
    }
  );
}

/* EXCLUIR PRODUTO */
async function excluirProduto(id) {
  await ProdutoModel.destroy({
    where: {
      id,
    },
  });
}

/* =========================
   CARRINHO / RESERVAS
========================= */

/* RESERVAR PRODUTO NO CARRINHO */
async function reservarProduto(produtoId, sessionId, quantidade) {
  quantidade = Number(quantidade);

  if (!quantidade || quantidade < 1) {
    return {
      sucesso: false,
      mensagem: "Quantidade inválida.",
    };
  }

  const transaction = await sequelize.transaction();

  try {
    await expirarReservas(transaction);

    const produto = await ProdutoModel.findOne({
      where: {
        id: produtoId,
        ativo: true,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!produto) {
      await transaction.rollback();

      return {
        sucesso: false,
        mensagem: "Produto não encontrado.",
      };
    }

    const totalReservado = await totalReservadoProduto(produtoId, transaction);

    const quantidadeDisponivel = Math.max(
      Number(produto.quantidade) - totalReservado,
      0
    );

    if (quantidadeDisponivel < quantidade) {
      await transaction.rollback();

      return {
        sucesso: false,
        mensagem: "Quantidade indisponível em estoque.",
      };
    }

    const reservaExistente = await CarrinhoReservaModel.findOne({
      where: {
        produto_id: produtoId,
        session_id: sessionId,
        status: "ativa",
        expiraEm: {
          [Op.gt]: new Date(),
        },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (reservaExistente) {
      reservaExistente.quantidade =
        Number(reservaExistente.quantidade) + quantidade;

      reservaExistente.expiraEm = dataExpiracaoCarrinho();

      await reservaExistente.save({
        transaction,
      });
    } else {
      await CarrinhoReservaModel.create(
        {
          produto_id: produtoId,
          session_id: sessionId,
          quantidade,
          status: "ativa",
          expiraEm: dataExpiracaoCarrinho(),
        },
        {
          transaction,
        }
      );
    }

    await transaction.commit();

    return {
      sucesso: true,
      mensagem: "Produto adicionado ao carrinho.",
    };
  } catch (error) {
    await transaction.rollback();

    console.log("Erro ao reservar produto:", error);

    return {
      sucesso: false,
      mensagem: "Erro ao adicionar produto ao carrinho.",
    };
  }
}

/* LISTAR PRODUTOS DO CARRINHO */
async function listarReservasAtivasPorSessao(sessionId) {
  await expirarReservas();

  const reservas = await CarrinhoReservaModel.findAll({
    where: {
      session_id: sessionId,
      status: "ativa",
      expiraEm: {
        [Op.gt]: new Date(),
      },
    },
    include: [
      {
        model: ProdutoModel,
        as: "produto",
        attributes: ["nome", "descricao", "valor", "imagem"],
        required: true,
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return reservas.map((reserva) => {
    const produto = reserva.produto;

    const valor = Number(produto.valor);
    const quantidade = Number(reserva.quantidade);

    return {
      id: reserva.produto_id,
      quantidade,
      expiraEm: reserva.expiraEm,

      nome: produto.nome,
      descricao: produto.descricao,
      valor: produto.valor,
      imagem: produto.imagem,

      subtotal: valor * quantidade,
    };
  });
}

/* CANCELAR RESERVA DE UM PRODUTO */
async function cancelarReservaProduto(produtoId, sessionId) {
  await CarrinhoReservaModel.update(
    {
      status: "cancelada",
    },
    {
      where: {
        produto_id: produtoId,
        session_id: sessionId,
        status: "ativa",
      },
    }
  );
}

/* CANCELAR TODAS AS RESERVAS DA SESSÃO */
async function cancelarReservasDaSessao(sessionId) {
  await CarrinhoReservaModel.update(
    {
      status: "cancelada",
    },
    {
      where: {
        session_id: sessionId,
        status: "ativa",
      },
    }
  );
}

/* FINALIZAR CARRINHO - BAIXA ESTOQUE REAL */
async function finalizarReservasDaSessao(sessionId) {
  const transaction = await sequelize.transaction();

  try {
    await expirarReservas(transaction);

    const reservas = await CarrinhoReservaModel.findAll({
      where: {
        session_id: sessionId,
        status: "ativa",
        expiraEm: {
          [Op.gt]: new Date(),
        },
      },
      include: [
        {
          model: ProdutoModel,
          as: "produto",
          required: true,
        },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!reservas.length) {
      await transaction.rollback();

      return {
        sucesso: false,
        mensagem: "Carrinho vazio.",
      };
    }

    for (const reserva of reservas) {
      const quantidade = Number(reserva.quantidade);

      const [afetados] = await ProdutoModel.update(
        {
          quantidade: sequelize.literal(`quantidade - ${quantidade}`),
        },
        {
          where: {
            id: reserva.produto_id,
            quantidade: {
              [Op.gte]: quantidade,
            },
          },
          transaction,
        }
      );

      if (afetados === 0) {
        await transaction.rollback();

        return {
          sucesso: false,
          mensagem: "Estoque insuficiente ao finalizar.",
        };
      }
    }

    await CarrinhoReservaModel.update(
      {
        status: "finalizada",
      },
      {
        where: {
          session_id: sessionId,
          status: "ativa",
        },
        transaction,
      }
    );

    await transaction.commit();

    return {
      sucesso: true,
      mensagem: "Carrinho finalizado com sucesso.",
    };
  } catch (error) {
    await transaction.rollback();

    console.log("Erro ao finalizar reservas da sessão:", error);

    return {
      sucesso: false,
      mensagem: "Erro ao finalizar carrinho.",
    };
  }
}

/* CONTAR ITENS RESERVADOS NO CARRINHO DA SESSÃO */
async function contarReservasAtivasPorSessao(sessionId) {
  await expirarReservas();

  const total = await CarrinhoReservaModel.sum("quantidade", {
    where: {
      session_id: sessionId,
      status: "ativa",
      expiraEm: {
        [Op.gt]: new Date(),
      },
    },
  });

  return Number(total) || 0;
}

module.exports = {
  ProdutoModel,
  CarrinhoReservaModel,

  listarTodos,
  listarAtivos,
  buscarPorId,
  buscarPorIdComDisponivel,
  criarProduto,
  atualizarProduto,
  atualizarProdutoSemImagem,
  excluirProduto,

  expirarReservas,
  reservarProduto,
  listarReservasAtivasPorSessao,
  cancelarReservaProduto,
  cancelarReservasDaSessao,
  finalizarReservasDaSessao,
  contarReservasAtivasPorSessao,
};