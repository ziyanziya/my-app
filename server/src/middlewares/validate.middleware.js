const Joi = require('joi');

module.exports = (schema) => (req, res, next) => {
  const keys = schema.describe().keys || {};
  const toValidate = {};
  if (keys.body) toValidate.body = req.body;
  if (keys.params) toValidate.params = req.params;
  if (keys.query) toValidate.query = req.query;

  const result = Joi.compile(schema).validate(toValidate, { abortEarly: false, allowUnknown: false });
  if (result.error) {
    const errDetails = result.error.details.map((d) => ({ message: d.message, path: d.path }));
    console.error('Validation error:', JSON.stringify(errDetails, null, 2), 'Body:', JSON.stringify(req.body));
    const err = new Error('Validation error');
    err.status = 400;
    err.details = errDetails;
    return next(err);
  }

  if (result.value.body) req.body = result.value.body;
  if (result.value.params) req.params = result.value.params;
  if (result.value.query) req.query = result.value.query;

  return next();
};
