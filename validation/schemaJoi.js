/**
 * Created by XoX on 13/03/2016.
 */
'use strict';

const Joi = require('joi');

const clientID = Joi.number();
const ownership = Joi.string().trim().alphanum();
const book = Joi.object({
    hapi : Joi.object({
        filename : Joi.string().trim().required()
    }).required().unknown().allow()
}).unknown().allow();


exports.clientID = clientID;
exports.ownership = ownership;
exports.book = book;

exports.watermarkPayload = Joi.object({
    clientID: clientID,
    ownership: ownership,
    book: book
});
