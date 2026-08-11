const Joi = require('joi');

const createActivity = Joi.object({
  body: Joi.object({
    slug: Joi.string().max(150).required(),
    category_id: Joi.number().integer().optional().allow(null),
    title: Joi.string().max(200).required(),
    icon: Joi.string().max(200).optional().allow(null,''),
    default_time: Joi.string().optional().allow(null,'').pattern(/^\d{2}:\d{2}:\d{2}$/),
    start_window: Joi.string().optional().allow(null,'').pattern(/^\d{2}:\d{2}:\d{2}$/),
    end_window: Joi.string().optional().allow(null,'').pattern(/^\d{2}:\d{2}:\d{2}$/),
    recurrence: Joi.any().optional().allow(null),
    points: Joi.number().integer().min(0).optional(),
    points_cap: Joi.number().integer().min(0).optional().allow(null),
    is_active: Joi.boolean().optional()
  })
});

const updateActivity = Joi.object({
  body: Joi.object({
    slug: Joi.string().max(150).optional(),
    category_id: Joi.number().integer().optional().allow(null),
    title: Joi.string().max(200).optional(),
    icon: Joi.string().max(200).optional().allow(null,''),
    default_time: Joi.string().optional().allow(null,'').pattern(/^\d{2}:\d{2}:\d{2}$/),
    start_window: Joi.string().optional().allow(null,'').pattern(/^\d{2}:\d{2}:\d{2}$/),
    end_window: Joi.string().optional().allow(null,'').pattern(/^\d{2}:\d{2}:\d{2}$/),
    recurrence: Joi.any().optional().allow(null),
    points: Joi.number().integer().min(0).optional(),
    points_cap: Joi.number().integer().min(0).optional().allow(null),
    is_active: Joi.boolean().optional()
  })
});

module.exports = { createActivity, updateActivity };
