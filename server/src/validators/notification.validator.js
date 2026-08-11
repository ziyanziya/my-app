const Joi = require('joi');

const createNotification = Joi.object({
  body: Joi.object({
    title: Joi.string().max(200).required(),
    body: Joi.string().required(),
    activity_id: Joi.number().integer().optional(),
    send_to_user_id: Joi.number().integer().optional(),
    send_to_token: Joi.string().optional(),
    send_to_topic: Joi.string().optional(),
    schedule_at: Joi.date().iso().optional(),
    when: Joi.string().valid('before','start','after','immediate').optional().default('immediate'),
    offset_minutes: Joi.number().integer().optional().default(0)
  })
});

module.exports = { createNotification };
