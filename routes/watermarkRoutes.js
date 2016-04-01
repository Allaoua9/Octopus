/**
 * Created by XoX on 13/03/2016.
 */
'use strict';
const SchemaJOI = require('../validation/schemaJOI.js');
const WatermarkHandler = require('../lib/handlers/watermarkHandler.js');

exports.register = function (server, options, next) {

    server.route(
        [
            {
                method: 'POST',
                path: '/uploadepub',
                config: {
                    payload : {
                        output : 'stream',
                        parse : 'true',
                        allow : 'multipart/form-data',
                        maxBytes: 10485760
                    },
                    validate : {
                        payload: SchemaJOI.uploadBook
                    },
                    handler: WatermarkHandler.epubUploadHandler
                }
            },
            {
                method: 'GET',
                path: '/epub/{epubID}',
                handler: WatermarkHandler.epubHandler
            },
            {
                method: 'POST',
                path : '/watermark/{epubID}',
                config : {
                    validate : {
                        payload: SchemaJOI.watermarkBook
                    },
                    handler: WatermarkHandler.embedWatermarkHandler
                }
            },
            {
                method: 'GET',
                path: '/getepub/{epubID}',
                handler: WatermarkHandler.getEpubFile
            },
            {
                method: 'POST',
                path: '/extractwatermark/{epubID}',
                config: {
                    validate: {
                        payload: SchemaJOI.extractWatermark
                    },
                    handler: WatermarkHandler.extractWatermarkHandler
                }
            },
            {
                method: 'GET',
                path: '/epub/{epubID}/{itemID}',
                handler: WatermarkHandler.getEpubItem
            },
            {
                method: 'GET',
                path: '/{param*}',
                handler: {
                    directory: {
                        path: '.',
                        redirectToSlash: true,
                        index: true
                    }
                }
            }
        ]);

    next();
};

exports.register.attributes = {
    name: 'watermark-routes'
};
