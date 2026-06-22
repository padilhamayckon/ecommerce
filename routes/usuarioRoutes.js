const express = require("express");
const router = express.Router();

const usuarioController = require("../controllers/usuarioController");

const {
  verificarLogin,
  verificarAdm,
} = require("../middlewares/authMiddleware");

/* LISTAR */
router.get(
  "/usuarios",
  verificarLogin,
  verificarAdm,
  usuarioController.listarUsuarios
);

/* FORM CADASTRO */
router.get(
  "/usuarios/novo",
  verificarLogin,
  verificarAdm,
  usuarioController.exibirFormulario
);

/* SALVAR */
router.post(
  "/usuarios",
  verificarLogin,
  verificarAdm,
  usuarioController.salvarUsuario
);

/* FORM EDITAR */
router.get(
  "/usuarios/editar/:id",
  verificarLogin,
  verificarAdm,
  usuarioController.exibirEdicao
);

/* ATUALIZAR */
router.post(
  "/usuarios/editar/:id",
  verificarLogin,
  verificarAdm,
  usuarioController.atualizarUsuario
);

/* EXCLUIR */
router.post(
  "/usuarios/excluir/:id",
  verificarLogin,
  verificarAdm,
  usuarioController.excluirUsuario
);

module.exports = router;