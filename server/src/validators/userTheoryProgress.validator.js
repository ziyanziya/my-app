const Joi = require('joi');

const saveTheoryProgress = Joi.object({
  body: Joi.object({
    worship_id: Joi.number().integer().required(),
    section_id: Joi.number().integer().required(),
    completed: Joi.boolean().optional().default(true),
    completed_at: Joi.date().iso().optional().allow(null),
  }),
});

const updateTheoryProgress = Joi.object({
  body: Joi.object({
    worship_id: Joi.number().integer().optional(),
    section_id: Joi.number().integer().optional(),
    completed: Joi.boolean().optional(),
    completed_at: Joi.date().iso().optional().allow(null),
  }).min(1),
});

module.exports = { saveTheoryProgress, updateTheoryProgress };
