export function notFound(req, res, next) {
  res.status(404).render('404');
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(500).send('Internal Server Error');
}
