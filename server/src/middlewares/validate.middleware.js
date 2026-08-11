const Joi = require('joi');

module.exports = (schema) => (req, res, next) => {
  const toValidate = {};
  if (schema.body) toValidate.body = req.body;
  if (schema.params) toValidate.params = req.params;
  if (schema.query) toValidate.query = req.query;

  const result = Joi.compile(schema).validate(toValidate, { abortEarly: false, allowUnknown: false });
  if (result.error) {
    const err = new Error('Validation error');
    err.status = 400;
    err.details = result.error.details.map((d) => ({ message: d.message, path: d.path }));
    return next(err);
  }

  if (result.value.body) req.body = result.value.body;
  if (result.value.params) req.params = result.value.params;
  if (result.value.query) req.query = result.value.query;

  return next();
};
