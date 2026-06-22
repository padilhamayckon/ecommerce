const express = require("express");
const router = express.Router();

const catalogoController = require("../controllers/catalogoController");

/* CATÁLOGO PÚBLICO */
router.get(
  "/catalogo",
  catalogoController.exibirCatalogo
);

/* DETALHES DO PRODUTO */
router.get(
  "/catalogo/produto/:id",
  catalogoController.exibirDetalhesProduto
);

module.exports = router;