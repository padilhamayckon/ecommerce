const Produto = require("../models/Produto");

/* OBTER QUANTIDADE DO CARRINHO */
async function obterQuantidadeCarrinho(sessionId) {
  if (!sessionId) {
    return 0;
  }

  /*
    Usa a função otimizada, se ela existir no Produto.js.
    Se ainda não existir, usa a função antiga como fallback.
  */
  if (typeof Produto.contarReservasAtivasPorSessao === "function") {
    return await Produto.contarReservasAtivasPorSessao(sessionId);
  }

  const carrinho = await Produto.listarReservasAtivasPorSessao(sessionId);

  return carrinho.reduce((total, item) => {
    return total + Number(item.quantidade);
  }, 0);
}

/* EXIBIR CATÁLOGO PÚBLICO */
async function exibirCatalogo(req, res) {
  try {
    const sessionId = req.sessionID;

    const [produtosBanco, carrinhoQuantidade] = await Promise.all([
      Produto.listarAtivos(),
      obterQuantidadeCarrinho(sessionId),
    ]);

    const produtos = produtosBanco.map((produto) => {
      const quantidade = Number(produto.quantidade) || 0;

      return {
        ...produto,
        quantidade,
        disponivel: quantidade > 0,
      };
    });

    let mensagemErro = null;
    let mensagemSucesso = null;

    if (req.query.erro === "estoque") {
      mensagemErro = "Produto indisponível ou quantidade insuficiente em estoque.";
    }

    if (req.query.sucesso === "compra") {
      mensagemSucesso = "Compra finalizada com sucesso.";
    }

    res.render("pages/catalogo", {
      titulo: "Catálogo",
      produtos,
      carrinhoQuantidade,
      mensagemErro,
      mensagemSucesso,
    });
  } catch (error) {
    console.log("Erro ao carregar catálogo:", error);
    res.redirect("/");
  }
}

/* EXIBIR DETALHES DO PRODUTO */
async function exibirDetalhesProduto(req, res) {
  try {
    const { id } = req.params;

    const produto = await Produto.buscarPorIdComDisponivel(id);

    if (!produto) {
      return res.redirect("/catalogo");
    }

    produto.quantidade = Number(produto.quantidade) || 0;
    produto.disponivel = produto.quantidade > 0;

    res.render("pages/produtoDetalhes", {
      titulo: produto.nome,
      produto,
    });
  } catch (error) {
    console.log("Erro ao carregar detalhes do produto:", error);
    res.redirect("/catalogo");
  }
}

module.exports = {
  exibirCatalogo,
  exibirDetalhesProduto,
};