const Joi = require('joi');

const updateProfile = Joi.object({ body: Joi.object({ name: Joi.string().min(2).max(150).optional(), phone: Joi.string().optional().allow('', null), timezone: Joi.string().optional(), locale: Joi.string().optional() }) });

const updateSettings = Joi.object({ body: Joi.object().pattern(Joi.string(), Joi.any()) });

module.exports = { updateProfile, updateSettings };
