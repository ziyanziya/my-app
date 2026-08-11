const Joi = require('joi');

const update = Joi.object({
  body: Joi.object({
    label: Joi.string().max(191).optional(),
    anchor_type: Joi.string().valid('prayer', 'event').optional(),
    anchor_key: Joi.string().max(100).optional(),
    offset_minutes: Joi.number().integer().min(-1440).max(1440).optional(),
    duration_minutes: Joi.number().integer().min(1).max(1440).optional(),
    is_active: Joi.boolean().optional(),
  }).min(1),
});

const reorder = Joi.object({
  body: Joi.array().items(Joi.object({
    id: Joi.number().integer().positive().required(),
    sort_order: Joi.number().integer().min(1).required(),
  })).min(1).required(),
});

module.exports = { update, reorder };
