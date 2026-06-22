const express = require("express");
const router = express.Router();

const clienteController = require("../controllers/clienteController");

const {
  verificarLogin,
} = require("../middlewares/authMiddleware");

router.get(
  "/minha-conta",
  verificarLogin,
  clienteController.painel
);

router.post(
  "/minha-conta/dados",
  verificarLogin,
  clienteController.atualizarDados
);

router.post(
  "/minha-conta/senha",
  verificarLogin,
  clienteController.alterarSenha
);

router.get(
  "/minha-conta/pedidos",
  verificarLogin,
  clienteController.historicoPedidos
);

router.get(
  "/minha-conta/pedidos/:id",
  verificarLogin,
  clienteController.detalhesPedido
);

module.exports = router;