const Joi = require('joi');

const register = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(150).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    phone: Joi.string().optional().allow('', null),
    timezone: Joi.string().optional().default('UTC'),
    locale: Joi.string().optional().default('ar'),
  }),
});

const login = Joi.object({
  body: Joi.object({
    identifier: Joi.string().required(),
    password: Joi.string().required(),
  }),
});

const refresh = Joi.object({ body: Joi.object({ refreshToken: Joi.string().required() }) });
const forgot = Joi.object({ body: Joi.object({ email: Joi.string().email().required() }) });
const reset = Joi.object({ body: Joi.object({ token: Joi.string().required(), newPassword: Joi.string().min(8).required() }) });

module.exports = { register, login, refresh, forgot, reset };
