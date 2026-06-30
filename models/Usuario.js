const db = require("../db");

/* LISTAR TODOS USUARIOS */
async function listarTodos() {
  const [rows] = await db.query(`
    SELECT id, nome, email, tipo_usuario, criado_em
    FROM usuarios
    ORDER BY id DESC
  `);

  return rows;
}

/* BUSCAR USUARIO POR EMAIL */
async function buscarPorEmail(email) {
  const [rows] = await db.query(
    "SELECT * FROM usuarios WHERE email = ? LIMIT 1",
    [email]
  );

  return rows[0];
}

/* BUSCAR USUARIO POR ID */
async function buscarPorId(id) {
  const [rows] = await db.query(
    "SELECT * FROM usuarios WHERE id = ? LIMIT 1",
    [id]
  );

  return rows[0];
}

async function existeAdministrador() {
  const { rows } = await db.query(
    "SELECT * FROM usuarios WHERE tipo_usuario = 1 LIMIT 1"
  );

  return rows.length > 0;
}

/* CRIAR ADMINISTRADOR */
async function criarAdministrador(nome, email, senha) {
  await db.query(
    `
      INSERT INTO usuarios
      (nome, email, senha, tipo_usuario)
      VALUES (?, ?, ?, 1)
    `,
    [nome, email, senha]
  );
}

/* CRIAR USUARIO */
async function criarUsuario(nome, email, senha, tipo_usuario) {
  await db.query(
    `
      INSERT INTO usuarios
      (nome, email, senha, tipo_usuario)
      VALUES (?, ?, ?, ?)
    `,
    [nome, email, senha, tipo_usuario]
  );
}

/* ATUALIZAR USUARIO SEM ALTERAR SENHA */
async function atualizarUsuario(id, nome, email, tipo_usuario) {
  await db.query(
    `
      UPDATE usuarios
      SET nome = ?, email = ?, tipo_usuario = ?
      WHERE id = ?
    `,
    [nome, email, tipo_usuario, id]
  );
}

/* ATUALIZAR USUARIO COM NOVA SENHA */
async function atualizarUsuarioComSenha(id, nome, email, senha, tipo_usuario) {
  await db.query(
    `
      UPDATE usuarios
      SET nome = ?, email = ?, senha = ?, tipo_usuario = ?
      WHERE id = ?
    `,
    [nome, email, senha, tipo_usuario, id]
  );
}

/* EXCLUIR USUARIO */
async function excluirUsuario(id) {
  await db.query(
    "DELETE FROM usuarios WHERE id = ?",
    [id]
  );
}
async function criarCliente(nome, email, cpfCnpj, senhaHash) {
  const [resultado] = await db.query(
    `
      INSERT INTO usuarios
      (
        nome,
        email,
        cpf_cnpj,
        senha,
        tipo_usuario
      )
      VALUES (?, ?, ?, ?, 3)
    `,
    [nome, email, cpfCnpj, senhaHash]
  );

  return resultado.insertId;
}

/* BUSCAR USUÁRIO POR E-MAIL */
async function buscarPorEmail(email) {
  const [rows] = await db.query(
    `
      SELECT 
        id,
        nome,
        email,
        cpf_cnpj,
        senha,
        tipo_usuario
      FROM usuarios
      WHERE email = ?
      LIMIT 1
    `,
    [email]
  );

  return rows[0];
}

/* BUSCAR USUÁRIO POR CPF/CNPJ */
async function buscarPorCpfCnpj(cpfCnpj) {
  const [rows] = await db.query(
    `
      SELECT 
        id,
        nome,
        email,
        cpf_cnpj,
        senha,
        tipo_usuario
      FROM usuarios
      WHERE cpf_cnpj = ?
      LIMIT 1
    `,
    [cpfCnpj]
  );

  return rows[0];
}

/* CRIAR CLIENTE */
async function criarCliente(nome, email, cpfCnpj, senhaHash) {
  const [resultado] = await db.query(
    `
      INSERT INTO usuarios
      (
        nome,
        email,
        cpf_cnpj,
        senha,
        tipo_usuario
      )
      VALUES (?, ?, ?, ?, 3)
    `,
    [nome, email, cpfCnpj, senhaHash]
  );

  return resultado.insertId;
}

async function atualizarSenha(id, senhaHash) {
  await db.query(
    `
      UPDATE usuarios
      SET senha = ?
      WHERE id = ?
    `,
    [senhaHash, id]
  );
}
async function buscarPorId(id) {
  const [rows] = await db.query(
    `
      SELECT 
        id,
        nome,
        email,
        cpf_cnpj,
        tipo_usuario
      FROM usuarios
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  return rows[0];
}

async function atualizarDadosCliente(id, nome, email, cpfCnpj) {
  await db.query(
    `
      UPDATE usuarios
      SET 
        nome = ?,
        email = ?,
        cpf_cnpj = ?
      WHERE id = ?
      AND tipo_usuario = 3
    `,
    [nome, email, cpfCnpj, id]
  );
}

async function buscarEmailEmOutroUsuario(email, id) {
  const [rows] = await db.query(
    `
      SELECT id
      FROM usuarios
      WHERE email = ?
      AND id <> ?
      LIMIT 1
    `,
    [email, id]
  );

  return rows[0];
}

async function buscarCpfCnpjEmOutroUsuario(cpfCnpj, id) {
  const [rows] = await db.query(
    `
      SELECT id
      FROM usuarios
      WHERE cpf_cnpj = ?
      AND id <> ?
      LIMIT 1
    `,
    [cpfCnpj, id]
  );

  return rows[0];
}

async function atualizarSenha(id, senhaHash) {
  await db.query(
    `
      UPDATE usuarios
      SET senha = ?
      WHERE id = ?
    `,
    [senhaHash, id]
  );
}


module.exports = {
  listarTodos,
  buscarPorEmail,
  buscarPorId,
  atualizarSenha,
  existeAdministrador,
  criarAdministrador,
  criarUsuario,
  atualizarUsuario,
  atualizarUsuarioComSenha,
  excluirUsuario,
  buscarPorEmail,
  buscarPorCpfCnpj,
  criarCliente,
  atualizarDadosCliente,
  buscarEmailEmOutroUsuario,
  buscarCpfCnpjEmOutroUsuario,
  atualizarSenha,
};