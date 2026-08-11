const Joi = require('joi');

const createContent = Joi.object({
  params: Joi.object({ activityId: Joi.number().integer().required() }),
  body: Joi.object({
    locale: Joi.string().max(10).optional().default('ar'),
    title: Joi.string().max(255).optional().allow(null,''),
    body: Joi.string().optional().allow(null,''),
    is_default: Joi.boolean().optional(),
    version: Joi.number().integer().min(1).optional().default(1)
  })
});

const updateContent = Joi.object({
  params: Joi.object({ id: Joi.number().integer().required() }),
  body: Joi.object({
    locale: Joi.string().max(10).optional(),
    title: Joi.string().max(255).optional().allow(null,''),
    body: Joi.string().optional().allow(null,''),
    is_default: Joi.boolean().optional(),
    version: Joi.number().integer().min(1).optional()
  })
});

module.exports = { createContent, updateContent };
