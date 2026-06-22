const { enviarEmailContato } = require('../services/emailService');

exports.home = (req, res) => {
  res.render('pages/home', {
    titulo: 'Home'
  });
};

/* ROTA ANTIGA DE PRODUTOS */
/* Redireciona para o novo catálogo público */
exports.produtos = (req, res) => {
  res.redirect('/catalogo');
};

exports.contato = (req, res) => {
  res.render('pages/contato', {
    titulo: 'Contato'
  });
};

exports.salvarContato = async (req, res) => {
  const { nome, email, telefone, mensagem } = req.body;

  try {
    await enviarEmailContato({
      nome,
      email,
      telefone,
      mensagem
    });

    res.render('pages/contato', {
      titulo: 'Contato',
      sucesso: 'Mensagem enviada com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);

    res.render('pages/contato', {
      titulo: 'Contato',
      erro: 'Erro ao enviar a mensagem. Tente novamente.'
    });
  }
};