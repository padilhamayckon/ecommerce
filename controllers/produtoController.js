const Produto = require("../models/Produto");

/* EXIBIR TELA DE GERENCIAR PRODUTOS */
async function exibirAdmin(req, res) {
  try {
    const produtos = await Produto.listarTodos();

    res.render("pages/produtosAdmin", {
      titulo: "Gerenciar Produtos",
      produtos,
    });
  } catch (error) {
    console.log("Erro ao carregar produtos:", error);
    res.redirect("/");
  }
}

/* EXIBIR FORMULÁRIO DE NOVO PRODUTO */
function exibirFormularioNovo(req, res) {
  res.render("pages/produtoNovo", {
    titulo: "Novo Produto",
  });
}

/* CADASTRAR PRODUTO */
async function cadastrarProduto(req, res) {
  try {
    const { nome, quantidade, descricao, valor, ativo } = req.body;

    if (req.erroUpload) {
      return res.render("pages/produtoNovo", {
        titulo: "Novo Produto",
        erro: req.erroUpload,
        dados: req.body,
      });
    }

    if (!req.file) {
      return res.render("pages/produtoNovo", {
        titulo: "Novo Produto",
        erro: "Selecione uma imagem JPG ou PNG para o produto.",
        dados: req.body,
      });
    }

    const imagem = `uploads/produtos/${req.file.filename}`;

    await Produto.criarProduto(
      nome,
      quantidade,
      descricao,
      valor,
      imagem,
      ativo ? 1 : 0
    );

    res.redirect("/produtos/admin");
  } catch (error) {
    console.log("Erro ao cadastrar produto:", error);
    res.redirect("/produtos/admin");
  }
}

/* EXIBIR FORMULÁRIO DE EDITAR PRODUTO */
async function exibirFormularioEditar(req, res) {
  try {
    const { id } = req.params;

    const produto = await Produto.buscarPorId(id);

    if (!produto) {
      return res.redirect("/produtos/admin");
    }

    res.render("pages/produtoEditar", {
      titulo: "Editar Produto",
      produto,
    });
  } catch (error) {
    console.log("Erro ao carregar produto:", error);
    res.redirect("/produtos/admin");
  }
}

/* ATUALIZAR PRODUTO */
async function atualizarProduto(req, res) {
  try {
    const { id } = req.params;
    const { nome, quantidade, descricao, valor, ativo } = req.body;

    if (req.erroUpload) {
      return res.redirect(`/produtos/editar/${id}`);
    }

    if (req.file) {
      const imagem = `uploads/produtos/${req.file.filename}`;

      await Produto.atualizarProduto(
        id,
        nome,
        quantidade,
        descricao,
        valor,
        imagem,
        ativo ? 1 : 0
      );
    } else {
      await Produto.atualizarProdutoSemImagem(
        id,
        nome,
        quantidade,
        descricao,
        valor,
        ativo ? 1 : 0
      );
    }

    res.redirect("/produtos/admin");
  } catch (error) {
    console.log("Erro ao atualizar produto:", error);
    res.redirect("/produtos/admin");
  }
}

/* EXCLUIR PRODUTO */
async function excluirProduto(req, res) {
  try {
    const { id } = req.params;

    await Produto.excluirProduto(id);

    res.redirect("/produtos/admin");
  } catch (error) {
    console.log("Erro ao excluir produto:", error);
    res.redirect("/produtos/admin");
  }
}

module.exports = {
  exibirAdmin,
  exibirFormularioNovo,
  cadastrarProduto,
  exibirFormularioEditar,
  atualizarProduto,
  excluirProduto,
};