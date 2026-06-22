const db = require("../db");

/* INVALIDAR TOKENS ANTIGOS DO USUÁRIO */
async function invalidarTokensDoUsuario(usuarioId) {
  await db.query(
    `
      UPDATE recuperacao_senhas
      SET usado = 1
      WHERE usuario_id = ?
      AND usado = 0
    `,
    [usuarioId]
  );
}

/* CRIAR TOKEN DE RECUPERAÇÃO */
async function criar(usuarioId, tokenHash) {
  await db.query(
    `
      INSERT INTO recuperacao_senhas
      (
        usuario_id,
        token_hash,
        usado,
        expira_em
      )
      VALUES (?, ?, 0, DATE_ADD(NOW(), INTERVAL 30 MINUTE))
    `,
    [usuarioId, tokenHash]
  );
}

/* BUSCAR TOKEN VÁLIDO */
async function buscarTokenValido(tokenHash) {
  const [rows] = await db.query(
    `
      SELECT 
        id,
        usuario_id,
        token_hash,
        usado,
        expira_em
      FROM recuperacao_senhas
      WHERE token_hash = ?
      AND usado = 0
      AND expira_em > NOW()
      LIMIT 1
    `,
    [tokenHash]
  );

  return rows[0];
}

/* MARCAR TOKEN COMO USADO */
async function marcarComoUsado(id) {
  await db.query(
    `
      UPDATE recuperacao_senhas
      SET usado = 1
      WHERE id = ?
    `,
    [id]
  );
}

module.exports = {
  invalidarTokensDoUsuario,
  criar,
  buscarTokenValido,
  marcarComoUsado,
};