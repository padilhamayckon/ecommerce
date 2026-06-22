const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

router.get("/login", authController.exibirLogin);
router.post("/login", authController.autenticar);

router.get("/registrar", authController.exibirRegistro);
router.post("/registrar", authController.registrar);

router.get("/sair", authController.sair);
router.get("/logout", authController.sair);

module.exports = router;