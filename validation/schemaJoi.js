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
    id: Joi.string().trim().alphanum(),
    watermark: Joi.number()
});

const imageWatermark = Joi.object({
    id: Joi.string().trim().alphanum(),
    watermark: Joi.string()
});

const xhtmlWatermark = Joi.object({
    id: Joi.string().trim().alphanum(),
    watermark: Joi.string()
});

const watermarks = Joi.object({
    cssWatermarks: Joi.array().items(cssWatermark).optional(),
    imageWatermarks: Joi.array().items(imageWatermark).optional(),
    xhtmlWatermarks: Joi.array().items(xhtmlWatermark).optional()
});

const fileIDs = Joi.object({
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
    fileIDs: fileIDs
});

exports.watermarkPayload = Joi.object({
    clientID: clientID,
    ownership: ownership,
    book: book
});
