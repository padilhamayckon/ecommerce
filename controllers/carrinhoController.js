const Produto = require("../models/Produto");
const Pedido = require("../models/Pedido");

/* ADICIONAR PRODUTO AO CARRINHO */
async function adicionarProduto(req, res) {
  try {
    const { id } = req.params;

    let quantidade = Number(req.body.quantidade) || 1;

    if (quantidade < 1) {
      quantidade = 1;
    }

    /*
      Importante:
      Isso força o express-session a salvar a sessão mesmo sem login.
      Sem isso, o req.sessionID pode mudar entre uma requisição e outra.
    */
    req.session.carrinhoAtivo = true;

    const sessionId = req.sessionID;

    const resultado = await Produto.reservarProduto(
      id,
      sessionId,
      quantidade
    );

    if (!resultado.sucesso) {
      console.log("Não foi possível adicionar ao carrinho:", resultado.mensagem);

      return res.redirect("/catalogo?erro=estoque");
    }

    res.redirect("/carrinho");
  } catch (error) {
    console.log("Erro ao adicionar produto ao carrinho:", error);

    res.redirect("/catalogo?erro=estoque");
  }
}

/* EXIBIR CARRINHO */
async function exibirCarrinho(req, res) {
  try {
    const sessionId = req.sessionID;

    const carrinho = await Produto.listarReservasAtivasPorSessao(sessionId);

    const total = carrinho.reduce((soma, item) => {
      return soma + Number(item.valor) * Number(item.quantidade);
    }, 0);

    res.render("pages/carrinho", {
      titulo: "Carrinho",
      carrinho,
      total: total.toFixed(2),
    });
  } catch (error) {
    console.log("Erro ao exibir carrinho:", error);

    res.render("pages/carrinho", {
      titulo: "Carrinho",
      carrinho: [],
      total: "0.00",
    });
  }
}

/* REMOVER PRODUTO DO CARRINHO */
async function removerProduto(req, res) {
  try {
    const { id } = req.params;
    const sessionId = req.sessionID;

    await Produto.cancelarReservaProduto(id, sessionId);

    res.redirect("/carrinho");
  } catch (error) {
    console.log("Erro ao remover produto do carrinho:", error);
    res.redirect("/carrinho");
  }
}

/* LIMPAR CARRINHO */
async function limparCarrinho(req, res) {
  try {
    const sessionId = req.sessionID;

    await Produto.cancelarReservasDaSessao(sessionId);

    res.redirect("/carrinho");
  } catch (error) {
    console.log("Erro ao limpar carrinho:", error);
    res.redirect("/carrinho");
  }
}

/* FINALIZAR CARRINHO */
async function finalizarCarrinho(req, res) {
  try {
    const sessionId = req.sessionID;

    const resultado = await Produto.finalizarReservasDaSessao(sessionId);

    if (!resultado.sucesso) {
      console.log("Erro ao finalizar carrinho:", resultado.mensagem);
      return res.redirect("/carrinho");
    }

    res.redirect("/catalogo");
  } catch (error) {
    console.log("Erro ao finalizar carrinho:", error);
    res.redirect("/carrinho");
  }
}
async function finalizarCarrinho(req, res) {
  try {
    const sessionId = req.sessionID;
    const usuarioId = req.session.usuario.id;

    const resultado = await Pedido.finalizarCompra(sessionId, usuarioId);

    if (!resultado.sucesso) {
      console.log("Erro ao finalizar carrinho:", resultado.mensagem);

      return res.redirect("/carrinho?erro=finalizar");
    }

    return res.redirect(`/minha-conta/pedidos/${resultado.pedidoId}`);
  } catch (error) {
    console.log("Erro ao finalizar carrinho:", error);

    return res.redirect("/carrinho?erro=finalizar");
  }
}

module.exports = {
    adicionarProduto,
  exibirCarrinho,
  removerProduto,
  limparCarrinho,
  finalizarCarrinho,
};