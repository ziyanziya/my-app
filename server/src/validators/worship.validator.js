const Joi = require('joi');

const createWorship = Joi.object({
  body: Joi.object({
    title: Joi.string().max(191).required(),
    icon: Joi.string().max(100).optional().allow(null, ''),
    description: Joi.string().optional().allow(null, ''),
    status: Joi.string().valid('draft', 'published', 'archived').optional().default('published'),
    time: Joi.string().optional().allow(null, '').pattern(/^\d{2}:\d{2}:\d{2}$/),
    points: Joi.number().integer().min(0).optional().default(0),
    order: Joi.number().integer().min(0).optional().default(0),
    is_active: Joi.boolean().optional().default(true),
  }),
});

const updateWorship = Joi.object({
  body: Joi.object({
    title: Joi.string().max(191).optional(),
    icon: Joi.string().max(100).optional().allow(null, ''),
    description: Joi.string().optional().allow(null, ''),
    status: Joi.string().valid('draft', 'published', 'archived').optional(),
    time: Joi.string().optional().allow(null, '').pattern(/^\d{2}:\d{2}:\d{2}$/),
    points: Joi.number().integer().min(0).optional(),
    order: Joi.number().integer().min(0).optional(),
    is_active: Joi.boolean().optional(),
  }).min(1),
});

module.exports = { createWorship, updateWorship };
