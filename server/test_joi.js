const Joi = require('joi');
const reorder = Joi.object({
  body: Joi.array().items(Joi.object({
    id: Joi.number().integer().positive().required(),
    sort_order: Joi.number().integer().min(1).required(),
  })).min(1).required(),
});
const data = [{"id":1,"sort_order":10},{"id":20,"sort_order":20}];
console.log(reorder.validate({ body: data }));
