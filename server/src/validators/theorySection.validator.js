const Joi = require('joi');

const createSection = Joi.object({
  body: Joi.object({
    worship_id: Joi.number().integer().required(),
    title: Joi.string().max(255).required(),
    content: Joi.string().required(),
    order_index: Joi.number().integer().min(0).optional().default(0),
    reward_points: Joi.number().integer().min(0).optional().default(0),
    status: Joi.string().valid('draft', 'published', 'archived').optional().default('draft'),
  }),
});

const updateSection = Joi.object({
  body: Joi.object({
    worship_id: Joi.number().integer().optional(),
    title: Joi.string().max(255).optional(),
    content: Joi.string().optional(),
    order_index: Joi.number().integer().min(0).optional(),
    reward_points: Joi.number().integer().min(0).optional(),
    status: Joi.string().valid('draft', 'published', 'archived').optional(),
  }).min(1),
});

const reorderSections = Joi.object({
  body: Joi.array().items(
    Joi.object({
      id: Joi.number().integer().required(),
      order_index: Joi.number().integer().min(0).required(),
    }),
  ).min(1).required(),
});

module.exports = { createSection, updateSection, reorderSections };
