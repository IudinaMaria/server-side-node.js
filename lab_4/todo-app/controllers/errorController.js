exports.notFound = (req, res, next) => {

    // Если это API — не рендерим HTML, пусть идёт дальше в errorHandler
    if (req.originalUrl.startsWith("/api")) {
        return next();
    }

    // Иначе HTML-страница
    res.status(404).render("404");
};
