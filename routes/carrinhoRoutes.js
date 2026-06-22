const express = require("express");
const router = express.Router();

const carrinhoController = require("../controllers/carrinhoController");

const {
  verificarLogin,
} = require("../middlewares/authMiddleware");

/* EXIBIR CARRINHO - PÚBLICO */
router.get(
  "/",
  carrinhoController.exibirCarrinho
);

/* ADICIONAR PRODUTO AO CARRINHO - PÚBLICO */
router.post(
  "/adicionar/:id",
  carrinhoController.adicionarProduto
);

/* REMOVER PRODUTO DO CARRINHO - PÚBLICO */
router.post(
  "/remover/:id",
  carrinhoController.removerProduto
);

/* LIMPAR CARRINHO - PÚBLICO */
router.post(
  "/limpar",
  carrinhoController.limparCarrinho
);

/* FINALIZAR COMPRA - SOMENTE LOGADO */
router.post(
  "/finalizar",
  verificarLogin,
  carrinhoController.finalizarCarrinho
);

module.exports = router;