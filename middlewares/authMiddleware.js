function verificarLogin(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect("/login");
  }

  next();
}

function verificarAdm(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect("/login");
  }

  const tipoUsuario = Number(req.session.usuario.tipo_usuario);

  if (tipoUsuario !== 1) {
    return res.redirect("/");
  }

  next();
}

function verificarColaborador(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect("/login");
  }

  const tipoUsuario = Number(req.session.usuario.tipo_usuario);

  if (tipoUsuario !== 1 && tipoUsuario !== 2) {
    return res.redirect("/");
  }

  next();
}

module.exports = {
  verificarLogin,
  verificarAdm,
  verificarColaborador,
};