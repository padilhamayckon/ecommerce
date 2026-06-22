const db = require("../db");

/* EXPIRAR RESERVAS VENCIDAS */
async function expirarReservas() {
  await db.query(`
    UPDATE carrinho_reservas
    SET status = 'expirada'
    WHERE status = 'ativa'
    AND expiraEm <= NOW()
  `);
}

/* LISTAR TODOS OS PRODUTOS - ADMIN */
async function listarTodos() {
  const [rows] = await db.query(`
    SELECT 
      id,
      nome,
      quantidade,
      descricao,
      valor,
      imagem,
      ativo,
      createdAt,
      updatedAt
    FROM produtos
    ORDER BY id DESC
  `);

  return rows;
}

/* LISTAR APENAS PRODUTOS ATIVOS - CATÁLOGO */
async function listarAtivos() {
  await expirarReservas();

  const [rows] = await db.query(`
    SELECT 
      p.id,
      p.nome,

      GREATEST(
        p.quantidade - COALESCE(r.total_reservado, 0),
        0
      ) AS quantidade,

      p.descricao,
      p.valor,
      p.imagem,
      p.ativo

    FROM produtos p

    LEFT JOIN (
      SELECT 
        produto_id,
        SUM(quantidade) AS total_reservado
      FROM carrinho_reservas
      WHERE status = 'ativa'
      AND expiraEm > NOW()
      GROUP BY produto_id
    ) r ON r.produto_id = p.id

    WHERE p.ativo = 1
    ORDER BY p.id DESC
  `);

  return rows;
}

/* BUSCAR PRODUTO POR ID - USADO NO ADMIN */
async function buscarPorId(id) {
  const [rows] = await db.query(
    `
      SELECT 
        id,
        nome,
        quantidade,
        descricao,
        valor,
        imagem,
        ativo,
        createdAt,
        updatedAt
      FROM produtos
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  return rows[0];
}

/* BUSCAR PRODUTO ATIVO COM QUANTIDADE DISPONÍVEL - USADO NO CATÁLOGO/DETALHES */
async function buscarPorIdComDisponivel(id) {
  await expirarReservas();

  const [rows] = await db.query(
    `
      SELECT 
        p.id,
        p.nome,

        GREATEST(
          p.quantidade - COALESCE(r.total_reservado, 0),
          0
        ) AS quantidade,

        p.descricao,
        p.valor,
        p.imagem,
        p.ativo,
        p.createdAt,
        p.updatedAt

      FROM produtos p

      LEFT JOIN (
        SELECT 
          produto_id,
          SUM(quantidade) AS total_reservado
        FROM carrinho_reservas
        WHERE status = 'ativa'
        AND expiraEm > NOW()
        GROUP BY produto_id
      ) r ON r.produto_id = p.id

      WHERE p.id = ?
      AND p.ativo = 1
      LIMIT 1
    `,
    [id]
  );

  return rows[0];
}

/* CRIAR PRODUTO */
async function criarProduto(nome, quantidade, descricao, valor, imagem, ativo = 1) {
  await db.query(
    `
      INSERT INTO produtos
      (nome, quantidade, descricao, valor, imagem, ativo)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [nome, quantidade, descricao, valor, imagem, ativo]
  );
}

/* ATUALIZAR PRODUTO COM IMAGEM */
async function atualizarProduto(id, nome, quantidade, descricao, valor, imagem, ativo) {
  await db.query(
    `
      UPDATE produtos
      SET 
        nome = ?,
        quantidade = ?,
        descricao = ?,
        valor = ?,
        imagem = ?,
        ativo = ?
      WHERE id = ?
    `,
    [nome, quantidade, descricao, valor, imagem, ativo, id]
  );
}

/* ATUALIZAR PRODUTO SEM ALTERAR IMAGEM */
async function atualizarProdutoSemImagem(id, nome, quantidade, descricao, valor, ativo) {
  await db.query(
    `
      UPDATE produtos
      SET 
        nome = ?,
        quantidade = ?,
        descricao = ?,
        valor = ?,
        ativo = ?
      WHERE id = ?
    `,
    [nome, quantidade, descricao, valor, ativo, id]
  );
}

/* EXCLUIR PRODUTO */
async function excluirProduto(id) {
  await db.query(
    "DELETE FROM produtos WHERE id = ?",
    [id]
  );
}

/* RESERVAR PRODUTO NO CARRINHO */
async function reservarProduto(produtoId, sessionId, quantidade) {
  quantidade = Number(quantidade);

  if (!quantidade || quantidade < 1) {
    return {
      sucesso: false,
      mensagem: "Quantidade inválida.",
    };
  }

  await expirarReservas();

  const produto = await buscarPorIdComDisponivel(produtoId);

  if (!produto) {
    return {
      sucesso: false,
      mensagem: "Produto não encontrado.",
    };
  }

  if (Number(produto.quantidade) < quantidade) {
    return {
      sucesso: false,
      mensagem: "Quantidade indisponível em estoque.",
    };
  }

  const [reservaExistenteRows] = await db.query(
    `
      SELECT 
        id,
        quantidade
      FROM carrinho_reservas
      WHERE produto_id = ?
      AND session_id = ?
      AND status = 'ativa'
      AND expiraEm > NOW()
      LIMIT 1
    `,
    [produtoId, sessionId]
  );

  const reservaExistente = reservaExistenteRows[0];

  if (reservaExistente) {
    await db.query(
      `
        UPDATE carrinho_reservas
        SET 
          quantidade = quantidade + ?,
          expiraEm = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
        WHERE id = ?
      `,
      [quantidade, reservaExistente.id]
    );
  } else {
    await db.query(
      `
        INSERT INTO carrinho_reservas
        (
          produto_id,
          session_id,
          quantidade,
          status,
          expiraEm
        )
        VALUES (?, ?, ?, 'ativa', DATE_ADD(NOW(), INTERVAL 15 MINUTE))
      `,
      [produtoId, sessionId, quantidade]
    );
  }

  return {
    sucesso: true,
    mensagem: "Produto adicionado ao carrinho.",
  };
}

/* LISTAR PRODUTOS DO CARRINHO */
async function listarReservasAtivasPorSessao(sessionId) {
  await expirarReservas();

  const [rows] = await db.query(
    `
      SELECT 
        r.produto_id AS id,
        r.quantidade,
        r.expiraEm,

        p.nome,
        p.descricao,
        p.valor,
        p.imagem,

        (p.valor * r.quantidade) AS subtotal

      FROM carrinho_reservas r

      INNER JOIN produtos p ON p.id = r.produto_id

      WHERE r.session_id = ?
      AND r.status = 'ativa'
      AND r.expiraEm > NOW()

      ORDER BY r.createdAt DESC
    `,
    [sessionId]
  );

  return rows;
}

/* CANCELAR RESERVA DE UM PRODUTO */
async function cancelarReservaProduto(produtoId, sessionId) {
  await db.query(
    `
      UPDATE carrinho_reservas
      SET status = 'cancelada'
      WHERE produto_id = ?
      AND session_id = ?
      AND status = 'ativa'
    `,
    [produtoId, sessionId]
  );
}

/* CANCELAR TODAS AS RESERVAS DA SESSÃO */
async function cancelarReservasDaSessao(sessionId) {
  await db.query(
    `
      UPDATE carrinho_reservas
      SET status = 'cancelada'
      WHERE session_id = ?
      AND status = 'ativa'
    `,
    [sessionId]
  );
}

/* FINALIZAR CARRINHO - BAIXA ESTOQUE REAL */
async function finalizarReservasDaSessao(sessionId) {
  await expirarReservas();

  const reservas = await listarReservasAtivasPorSessao(sessionId);

  if (!reservas.length) {
    return {
      sucesso: false,
      mensagem: "Carrinho vazio.",
    };
  }

  for (const item of reservas) {
    const [resultado] = await db.query(
      `
        UPDATE produtos
        SET quantidade = quantidade - ?
        WHERE id = ?
        AND quantidade >= ?
      `,
      [item.quantidade, item.id, item.quantidade]
    );

    if (resultado.affectedRows === 0) {
      return {
        sucesso: false,
        mensagem: "Estoque insuficiente ao finalizar.",
      };
    }
  }

  await db.query(
    `
      UPDATE carrinho_reservas
      SET status = 'finalizada'
      WHERE session_id = ?
      AND status = 'ativa'
    `,
    [sessionId]
  );

  return {
    sucesso: true,
    mensagem: "Carrinho finalizado com sucesso.",
  };
}
/* CONTAR ITENS RESERVADOS NO CARRINHO DA SESSÃO */
async function contarReservasAtivasPorSessao(sessionId) {
  const [rows] = await db.query(
    `
      SELECT 
        COALESCE(SUM(quantidade), 0) AS total
      FROM carrinho_reservas
      WHERE session_id = ?
      AND status = 'ativa'
      AND expiraEm > NOW()
    `,
    [sessionId]
  );

  return Number(rows[0].total) || 0;
}

module.exports = {
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