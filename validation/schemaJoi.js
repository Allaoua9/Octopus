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

const cssWatermark = Joi.object({
    id: Joi.string().trim(),
    watermark: Joi.number()
});

const imageWatermarks = Joi.object({
    ids: Joi.array().items(Joi.string().trim()),
    watermark: Joi.string().trim()
});

const xhtmlWatermarks = Joi.object({
    ids: Joi.array().items(Joi.string().trim()),
    watermark: Joi.string().trim()
});

const watermarks = Joi.object({
    cssWatermarks: Joi.array().items(cssWatermark).optional(),
    imageWatermarks: imageWatermarks.optional(),
    xhtmlWatermarks: xhtmlWatermarks.optional()
});

const ids = Joi.object({
    cssIDs: Joi.array().items(Joi.string().trim()).optional(),
    imagesIDs: Joi.array().items(Joi.string().trim()).optional(),
    xhtmlIDs: Joi.array().items(Joi.string().trim()).optional()
});


exports.clientID = clientID;
exports.ownership = ownership;
exports.book = book;

exports.uploadBook = Joi.object({
    book: book
});

exports.watermarkBook = Joi.object({
    watermarks: watermarks.required()
});

exports.extractWatermark = Joi.object({
    ids: ids
});

// Remove later
exports.watermarkPayload = Joi.object({
    clientID: clientID,
    ownership: ownership,
    book: book
});
