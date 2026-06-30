require("dotenv").config();

const express = require("express");
const { engine } = require("express-handlebars");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");

const sequelize = require("./db");
const Usuario = require("./models/Usuario");

const paginaRoutes = require("./routes/paginaRoutes");
const authRoutes = require("./routes/authRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const produtoRoutes = require("./routes/produtoRoutes");
const catalogoRoutes = require("./routes/catalogoRoutes");
const carrinhoRoutes = require("./routes/carrinhoRoutes");
const senhaRoutes = require("./routes/senhaRoutes");
const clienteRoutes = require("./routes/clienteRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

/* SEGURANÇA BÁSICA */
app.disable("x-powered-by");

/*
  Necessário em algumas hospedagens que usam proxy/reverse proxy.
  Ajuda principalmente se depois você usar cookie secure: true.
*/
app.set("trust proxy", 1);

/* HANDLEBARS */
app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views/layouts"),
    partialsDir: path.join(__dirname, "views/partials"),
    helpers: {
      tipoUsuario: function (tipo) {
        tipo = Number(tipo);

        if (tipo === 1) return "Adm";
        if (tipo === 2) return "Colaborador";
        if (tipo === 3) return "Cliente";

        return "Desconhecido";
      },

      ifCond: function (v1, v2, options) {
        return v1 == v2 ? options.fn(this) : options.inverse(this);
      },

      eq: function (v1, v2) {
        return v1 == v2;
      },
    },
  })
);

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

/* ARQUIVOS ESTÁTICOS */
app.use(express.static(path.join(__dirname, "public")));

/* BODY PARSER */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* SESSION */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "chave_secreta_do_sistema",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 2,
    },
  })
);

/* VARIÁVEIS GLOBAIS PARA AS VIEWS */
app.use((req, res, next) => {
  const usuario = req.session.usuario || null;
  const tipoUsuario = usuario ? Number(usuario.tipo_usuario) : null;

  res.locals.usuario = usuario;
  res.locals.usuarioLogado = usuario;

  res.locals.isAdmin = tipoUsuario === 1;
  res.locals.isColaborador = tipoUsuario === 2;
  res.locals.isCliente = tipoUsuario === 3;

  res.locals.podeGerenciarProdutos =
    tipoUsuario === 1 || tipoUsuario === 2;

  next();
});

/* ROTAS */
app.use("/", paginaRoutes);
app.use("/", authRoutes);
app.use("/", usuarioRoutes);
app.use("/", catalogoRoutes);
app.use("/", produtoRoutes);
app.use("/carrinho", carrinhoRoutes);
app.use("/", senhaRoutes);
app.use("/", clienteRoutes);

/* ROTA 404 */
app.use((req, res) => {
  res.status(404).render("pages/404", {
    titulo: "Página não encontrada",
  });
});

/* CRIA ADMIN NO PRIMEIRO ACESSO */
async function criarAdminInicial() {
  try {
    const existeAdmin = await Usuario.existeAdministrador();

    if (!existeAdmin) {
      const senhaHash = await bcrypt.hash("123456", 10);

      await Usuario.criarAdministrador(
        "Administrador",
        "admin@email.com",
        senhaHash
      );

      console.log("Administrador inicial criado");
      console.log("Email: admin@email.com");
      console.log("Senha: 123456");
    }
  } catch (error) {
    console.error("Erro ao criar administrador:", error);
  }
}

/* INICIA SISTEMA */
async function iniciarServidor() {
  try {
    await sequelize.authenticate();

    console.log("Conectado ao banco com Sequelize.");

    /*
      Não use sync({ force: true }) em produção.
      Se suas tabelas já existem, não precisa sincronizar aqui.
    */

    await criarAdminInicial();

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar servidor:", error);
    process.exit(1);
  }
}

iniciarServidor();