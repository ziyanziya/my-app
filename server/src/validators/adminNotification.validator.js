const Joi = require('joi');

const recurrence = Joi.object({ frequency: Joi.string().valid('daily', 'weekly', 'monthly').required() });
const create = Joi.object({ body: Joi.object({
  title: Joi.string().trim().max(200).required(), body: Joi.string().trim().max(4000).required(),
  type: Joi.string().trim().max(64).default('announcement'), priority: Joi.string().valid('normal', 'high').default('normal'),
  audience_type: Joi.string().valid('all_users', 'specific_users').default('all_users'),
  audience: Joi.object({ userIds: Joi.array().items(Joi.number().integer().positive()).max(10000) }).optional(),
  data: Joi.object({ deepLink: Joi.string().pattern(/^\//).max(500) }).unknown(false).default({}),
  start_at: Joi.date().iso().optional(), end_at: Joi.date().iso().greater(Joi.ref('start_at')).optional(),
  schedule_timezone: Joi.string().max(64).default('UTC'), recurrence: recurrence.optional(),
  status: Joi.string().valid('draft', 'active', 'paused', 'scheduled').optional(), idempotency_key: Joi.string().max(128).optional(),
}) });
const transition = Joi.object({ body: Joi.object({ status: Joi.string().valid('active', 'paused', 'cancelled').required() }) });
const device = Joi.object({ body: Joi.object({ token: Joi.string().max(255).required(), platform: Joi.string().valid('ios', 'android', 'web', 'unknown').default('unknown'), installation_id: Joi.string().max(128).optional(), app_version: Joi.string().max(64).optional() }) });
module.exports = { create, transition, device };
