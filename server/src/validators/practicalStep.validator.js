const Joi = require('joi');

const createStep = Joi.object({
  body: Joi.object({
    worship_id: Joi.number().integer().required(),
    title: Joi.string().max(255).required(),
    description: Joi.string().optional().allow(null, ''),
    required_days: Joi.number().integer().min(0).optional().default(0),
    reward_points: Joi.number().integer().min(0).optional().default(0),
    order_index: Joi.number().integer().min(0).optional().default(0),
  }),
});

const updateStep = Joi.object({
  body: Joi.object({
    worship_id: Joi.number().integer().optional(),
    title: Joi.string().max(255).optional(),
    description: Joi.string().optional().allow(null, ''),
    required_days: Joi.number().integer().min(0).optional(),
    reward_points: Joi.number().integer().min(0).optional(),
    order_index: Joi.number().integer().min(0).optional(),
  }).min(1),
});

const reorderSteps = Joi.object({
  body: Joi.array().items(
    Joi.object({
      id: Joi.number().integer().required(),
      order_index: Joi.number().integer().min(0).required(),
    }),
  ).min(1).required(),
});

module.exports = { createStep, updateStep, reorderSteps };
