const { DataTypes, Op } = require("sequelize");
const sequelize = require("../db");

/* =========================
   MODELS USADOS NESTE ARQUIVO
========================= */

const PedidoModel =
  sequelize.models.Pedido ||
  sequelize.define(
    "Pedido",
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

      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },

      criado_em: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "pedidos",
      timestamps: false,
    }
  );

const PedidoItemModel =
  sequelize.models.PedidoItem ||
  sequelize.define(
    "PedidoItem",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      pedido_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      produto_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      nome_produto: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      quantidade: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      valor_unitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      tableName: "pedido_itens",
      timestamps: false,
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

      session_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      produto_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      quantidade: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },

      expiraEm: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "expiraEm",
      },
    },
    {
      tableName: "carrinho_reservas",
      timestamps: false,
    }
  );

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

      valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      quantidade: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "produtos",
      timestamps: false,
    }
  );

/* =========================
   RELACIONAMENTOS
========================= */

if (!CarrinhoReservaModel.associations.produto) {
  CarrinhoReservaModel.belongsTo(ProdutoModel, {
    foreignKey: "produto_id",
    as: "produto",
  });
}

if (!PedidoModel.associations.itens) {
  PedidoModel.hasMany(PedidoItemModel, {
    foreignKey: "pedido_id",
    as: "itens",
  });
}

if (!PedidoItemModel.associations.pedido) {
  PedidoItemModel.belongsTo(PedidoModel, {
    foreignKey: "pedido_id",
    as: "pedido",
  });
}

/* =========================
   FINALIZAR COMPRA
========================= */

async function finalizarCompra(sessionId, usuarioId) {
  const transaction = await sequelize.transaction();

  try {
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
          attributes: ["id", "nome", "valor", "quantidade"],
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

    let total = 0;

    for (const reserva of reservas) {
      const produto = reserva.produto;

      const estoqueAtual = Number(produto.quantidade);
      const quantidadeReservada = Number(reserva.quantidade);
      const valorProduto = Number(produto.valor);

      if (estoqueAtual < quantidadeReservada) {
        await transaction.rollback();

        return {
          sucesso: false,
          mensagem: `Estoque insuficiente para o produto ${produto.nome}.`,
        };
      }

      total += valorProduto * quantidadeReservada;
    }

    const pedido = await PedidoModel.create(
      {
        usuario_id: usuarioId,
        total,
        status: "finalizado",
      },
      {
        transaction,
      }
    );

    const pedidoId = pedido.id;

    for (const reserva of reservas) {
      const produto = reserva.produto;

      const quantidade = Number(reserva.quantidade);
      const valorUnitario = Number(produto.valor);
      const subtotal = valorUnitario * quantidade;

      await PedidoItemModel.create(
        {
          pedido_id: pedidoId,
          produto_id: reserva.produto_id,
          nome_produto: produto.nome,
          quantidade,
          valor_unitario: valorUnitario,
          subtotal,
        },
        {
          transaction,
        }
      );

      await ProdutoModel.decrement("quantidade", {
        by: quantidade,
        where: {
          id: reserva.produto_id,
          quantidade: {
            [Op.gte]: quantidade,
          },
        },
        transaction,
      });
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
      pedidoId,
      mensagem: "Compra finalizada com sucesso.",
    };
  } catch (error) {
    await transaction.rollback();

    console.log("Erro ao finalizar compra:", error);

    return {
      sucesso: false,
      mensagem: "Erro ao finalizar compra.",
    };
  }
}

/* =========================
   LISTAR PEDIDOS DO CLIENTE
========================= */

async function listarPorUsuario(usuarioId) {
  const pedidos = await PedidoModel.findAll({
    attributes: ["id", "total", "status", "criado_em"],
    where: {
      usuario_id: usuarioId,
    },
    order: [["criado_em", "DESC"]],
    raw: true,
  });

  return pedidos;
}

/* =========================
   BUSCAR PEDIDO DO CLIENTE
========================= */

async function buscarPedidoDoUsuario(pedidoId, usuarioId) {
  const pedido = await PedidoModel.findOne({
    attributes: ["id", "usuario_id", "total", "status", "criado_em"],
    where: {
      id: pedidoId,
      usuario_id: usuarioId,
    },
    raw: true,
  });

  return pedido;
}

/* =========================
   LISTAR ITENS DO PEDIDO
========================= */

async function listarItensDoPedido(pedidoId) {
  const itens = await PedidoItemModel.findAll({
    attributes: [
      "id",
      "produto_id",
      "nome_produto",
      "quantidade",
      "valor_unitario",
      "subtotal",
    ],
    where: {
      pedido_id: pedidoId,
    },
    order: [["id", "ASC"]],
    raw: true,
  });

  return itens;
}

module.exports = {
  PedidoModel,
  PedidoItemModel,
  CarrinhoReservaModel,

  finalizarCompra,
  listarPorUsuario,
  buscarPedidoDoUsuario,
  listarItensDoPedido,
};