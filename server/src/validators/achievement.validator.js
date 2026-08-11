const Joi = require('joi');

const createAchievement = Joi.object({
  body: Joi.object({
    slug: Joi.string().max(150).required(),
    title: Joi.string().max(200).required(),
    description: Joi.string().optional().allow(null,''),
    criteria: Joi.any().required(),
    points_reward: Joi.number().integer().min(0).optional().default(0),
    badge_icon: Joi.string().optional().allow(null,''),
    is_active: Joi.boolean().optional().default(true)
  })
});

const updateAchievement = Joi.object({
  body: Joi.object({
    title: Joi.string().max(200).optional(),
    description: Joi.string().optional().allow(null,''),
    criteria: Joi.any().optional(),
    points_reward: Joi.number().integer().min(0).optional(),
    badge_icon: Joi.string().optional().allow(null,''),
    is_active: Joi.boolean().optional()
  })
});

module.exports = { createAchievement, updateAchievement };
