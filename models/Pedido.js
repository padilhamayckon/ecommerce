const db = require("../db");

/* FINALIZAR COMPRA COM BASE NAS RESERVAS DO CARRINHO */
async function finalizarCompra(sessionId, usuarioId) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(`
      UPDATE carrinho_reservas
      SET status = 'expirada'
      WHERE status = 'ativa'
      AND expiraEm <= NOW()
    `);

    const [itens] = await connection.query(
      `
        SELECT 
          r.produto_id,
          r.quantidade,
          p.nome,
          p.valor,
          p.quantidade AS estoque_atual
        FROM carrinho_reservas r
        INNER JOIN produtos p ON p.id = r.produto_id
        WHERE r.session_id = ?
        AND r.status = 'ativa'
        AND r.expiraEm > NOW()
        FOR UPDATE
      `,
      [sessionId]
    );

    if (!itens.length) {
      await connection.rollback();

      return {
        sucesso: false,
        mensagem: "Carrinho vazio.",
      };
    }

    let total = 0;

    for (const item of itens) {
      if (Number(item.estoque_atual) < Number(item.quantidade)) {
        await connection.rollback();

        return {
          sucesso: false,
          mensagem: `Estoque insuficiente para o produto ${item.nome}.`,
        };
      }

      total += Number(item.valor) * Number(item.quantidade);
    }

    const [pedidoResultado] = await connection.query(
      `
        INSERT INTO pedidos
        (
          usuario_id,
          total,
          status
        )
        VALUES (?, ?, 'finalizado')
      `,
      [usuarioId, total]
    );

    const pedidoId = pedidoResultado.insertId;

    for (const item of itens) {
      const subtotal = Number(item.valor) * Number(item.quantidade);

      await connection.query(
        `
          INSERT INTO pedido_itens
          (
            pedido_id,
            produto_id,
            nome_produto,
            quantidade,
            valor_unitario,
            subtotal
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          pedidoId,
          item.produto_id,
          item.nome,
          item.quantidade,
          item.valor,
          subtotal,
        ]
      );

      await connection.query(
        `
          UPDATE produtos
          SET quantidade = quantidade - ?
          WHERE id = ?
          AND quantidade >= ?
        `,
        [
          item.quantidade,
          item.produto_id,
          item.quantidade,
        ]
      );
    }

    await connection.query(
      `
        UPDATE carrinho_reservas
        SET status = 'finalizada'
        WHERE session_id = ?
        AND status = 'ativa'
      `,
      [sessionId]
    );

    await connection.commit();

    return {
      sucesso: true,
      pedidoId,
      mensagem: "Compra finalizada com sucesso.",
    };
  } catch (error) {
    await connection.rollback();

    console.log("Erro ao finalizar compra:", error);

    return {
      sucesso: false,
      mensagem: "Erro ao finalizar compra.",
    };
  } finally {
    connection.release();
  }
}

/* LISTAR PEDIDOS DO CLIENTE */
async function listarPorUsuario(usuarioId) {
  const [rows] = await db.query(
    `
      SELECT 
        id,
        total,
        status,
        criado_em
      FROM pedidos
      WHERE usuario_id = ?
      ORDER BY criado_em DESC
    `,
    [usuarioId]
  );

  return rows;
}

/* BUSCAR PEDIDO DO CLIENTE */
async function buscarPedidoDoUsuario(pedidoId, usuarioId) {
  const [rows] = await db.query(
    `
      SELECT 
        id,
        usuario_id,
        total,
        status,
        criado_em
      FROM pedidos
      WHERE id = ?
      AND usuario_id = ?
      LIMIT 1
    `,
    [pedidoId, usuarioId]
  );

  return rows[0];
}

/* LISTAR ITENS DO PEDIDO */
async function listarItensDoPedido(pedidoId) {
  const [rows] = await db.query(
    `
      SELECT 
        id,
        produto_id,
        nome_produto,
        quantidade,
        valor_unitario,
        subtotal
      FROM pedido_itens
      WHERE pedido_id = ?
      ORDER BY id ASC
    `,
    [pedidoId]
  );

  return rows;
}

module.exports = {
  finalizarCompra,
  listarPorUsuario,
  buscarPedidoDoUsuario,
  listarItensDoPedido,
};