module.exports = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    const err = new Error('Forbidden');
    err.status = 403;
    return next(err);
  }
  return next();
};
