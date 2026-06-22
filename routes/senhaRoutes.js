const express = require("express");
const router = express.Router();

const senhaController = require("../controllers/senhaController");

router.get(
  "/recuperar-senha",
  senhaController.exibirSolicitacao
);

router.post(
  "/recuperar-senha",
  senhaController.solicitarRecuperacao
);

router.get(
  "/redefinir-senha/:token",
  senhaController.exibirRedefinicao
);

router.post(
  "/redefinir-senha/:token",
  senhaController.redefinirSenha
);

module.exports = router;