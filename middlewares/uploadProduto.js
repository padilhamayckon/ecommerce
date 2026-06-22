const multer = require("multer");
const path = require("path");
const fs = require("fs");

const pastaUpload = path.join(__dirname, "../public/uploads/produtos");

/* Cria a pasta automaticamente se não existir */
if (!fs.existsSync(pastaUpload)) {
  fs.mkdirSync(pastaUpload, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, pastaUpload);
  },

  filename: function (req, file, cb) {
    const extensao = path.extname(file.originalname).toLowerCase();

    const nomeArquivo = `produto-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${extensao}`;

    cb(null, nomeArquivo);
  },
});

const fileFilter = function (req, file, cb) {
  const tiposPermitidos = ["image/jpeg", "image/jpg", "image/png"];

  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("A imagem deve ser JPG ou PNG."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // limite de 2MB
  },
});

function uploadProduto(req, res, next) {
  const uploadSingle = upload.single("imagem");

  uploadSingle(req, res, function (error) {
    if (error) {
      req.erroUpload = error.message;
    }

    next();
  });
}

module.exports = uploadProduto;