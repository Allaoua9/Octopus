/**
 * Created by XoX on 13/03/2016.
 */
'use strict';
const SchemaJOI = require('../validation/schemaJOI.js');
const WatermarkHandler = require('../lib/handlers/watermarkHandler.js');

exports.register = function (server, options, next) {

    server.route([
        {
            method: 'POST',
            path : '/watermark',
            config : {
                payload : {
                    output : 'stream',
                    parse : 'true',
                    allow : 'multipart/form-data',
                    maxBytes: 10485760
                },
                validate : {
                    payload: SchemaJOI.watermarkPayload
                },
                handler: WatermarkHandler.embedWatermarkHandler
            }
        }
    ]);

    next();
};

exports.register.attributes = {
    name: 'watermark-routes'
};
