const Joi = require('joi');

const lightScopeEnum = ['prayer', 'wheel', 'activity', 'achievement', 'event', 'manual', 'system'];

const createRule = Joi.object({
  body: Joi.object({
    slug: Joi.string().max(100).required(),
    name: Joi.string().max(191).required(),
    description: Joi.string().optional().allow(null, ''),
    source_scope: Joi.string().valid(...lightScopeEnum).required(),
    source_key: Joi.string().max(100).optional().allow(null, ''),
    base_amount: Joi.number().precision(2).min(0).required(),
    multiplier: Joi.number().precision(4).min(0).default(1),
    max_amount: Joi.number().precision(2).min(0).optional().allow(null),
    daily_limit: Joi.number().integer().min(0).optional().allow(null),
    cooldown_minutes: Joi.number().integer().min(0).optional().allow(null),
    repeatable: Joi.boolean().optional().default(true),
    is_active: Joi.boolean().optional().default(true),
    config: Joi.any().optional().allow(null),
  }),
});

const updateRule = Joi.object({
  body: Joi.object({
    slug: Joi.string().max(100).optional(),
    name: Joi.string().max(191).optional(),
    description: Joi.string().optional().allow(null, ''),
    source_scope: Joi.string().valid(...lightScopeEnum).optional(),
    source_key: Joi.string().max(100).optional().allow(null, ''),
    base_amount: Joi.number().precision(2).min(0).optional(),
    multiplier: Joi.number().precision(4).min(0).optional(),
    max_amount: Joi.number().precision(2).min(0).optional().allow(null),
    daily_limit: Joi.number().integer().min(0).optional().allow(null),
    cooldown_minutes: Joi.number().integer().min(0).optional().allow(null),
    repeatable: Joi.boolean().optional(),
    is_active: Joi.boolean().optional(),
    config: Joi.any().optional().allow(null),
  }),
});

const awardUserLight = Joi.object({
  body: Joi.object({
    rule_id: Joi.number().integer().positive().optional(),
    source_scope: Joi.string().valid(...lightScopeEnum).optional(),
    source_key: Joi.string().max(100).optional().allow(null, ''),
    amount: Joi.number().precision(2).positive().optional(),
    external_reference: Joi.string().max(191).optional().allow(null, ''),
    idempotency_key: Joi.string().max(100).optional().allow(null, ''),
    metadata: Joi.any().optional().allow(null),
    reason: Joi.string().max(255).optional().allow(null, ''),
  }).or('rule_id', 'amount'),
});

const spendUserLight = Joi.object({
  body: Joi.object({
    amount: Joi.number().precision(2).positive().required(),
    source_scope: Joi.string().valid(...lightScopeEnum).optional().default('manual'),
    source_key: Joi.string().max(100).optional().allow(null, ''),
    external_reference: Joi.string().max(191).optional().allow(null, ''),
    idempotency_key: Joi.string().max(100).optional().allow(null, ''),
    metadata: Joi.any().optional().allow(null),
    reason: Joi.string().max(255).optional().allow(null, ''),
  }),
});

module.exports = { createRule, updateRule, awardUserLight, spendUserLight };
