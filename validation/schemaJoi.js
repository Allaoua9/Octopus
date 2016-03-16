/**
 * Created by XoX on 13/03/2016.
 */
'use strict';

const Joi = require('joi');

exports.watermarkPayload = Joi.object({
    transactionID: Joi.string().trim().alphanum().required(),
    authorID: Joi.string().trim().alphanum().required(),
    book: Joi.object({
        hapi : Joi.object({
            filename : Joi.string().trim().required()
        }).required().unknown().allow()
    }).required().unknown().allow()
});
