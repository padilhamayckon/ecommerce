const express = require("express");
const router = express.Router();

const produtoController = require("../controllers/produtoController");
const uploadProduto = require("../middlewares/uploadProduto");

const {
  verificarLogin,
  verificarColaborador,
} = require("../middlewares/authMiddleware");

/* GERENCIAR PRODUTOS */
router.get(
  "/produtos/admin",
  verificarLogin,
  verificarColaborador,
  produtoController.exibirAdmin
);

/* FORMULÁRIO NOVO PRODUTO */
router.get(
  "/produtos/novo",
  verificarLogin,
  verificarColaborador,
  produtoController.exibirFormularioNovo
);

/* CADASTRAR PRODUTO */
router.post(
  "/produtos/novo",
  verificarLogin,
  verificarColaborador,
  uploadProduto,
  produtoController.cadastrarProduto
);

/* FORMULÁRIO EDITAR PRODUTO */
router.get(
  "/produtos/editar/:id",
  verificarLogin,
  verificarColaborador,
  produtoController.exibirFormularioEditar
);

/* ATUALIZAR PRODUTO */
router.post(
  "/produtos/editar/:id",
  verificarLogin,
  verificarColaborador,
  uploadProduto,
  produtoController.atualizarProduto
);

/* EXCLUIR PRODUTO */
router.post(
  "/produtos/excluir/:id",
  verificarLogin,
  verificarColaborador,
  produtoController.excluirProduto
);

module.exports = router;