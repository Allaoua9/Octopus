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
                path: '/epub/upload',
                config: {
                    payload : {
                        output : 'stream',
                        parse : 'true',
                        allow : 'multipart/form-data',
                        maxBytes: 20971520,
                        timeout: 300000
                    },
                    validate : {
                        payload: SchemaJOI.uploadBook
                    },
                    handler: WatermarkHandler.epubUploadHandler,
                    timeout: {
                        socket: 310000
                    }
                }
            },
            {
                method: 'GET',
                path: '/epub/{epubID}',
                handler: WatermarkHandler.epubMetaDataHandler
            },
            {
                method: 'GET',
                path: '/epub/{epubID}/filesmetadata',
                handler: WatermarkHandler.epubFilesMetaDataHandler
            },
            {
                method: 'POST',
                path : '/epub/{epubID}/watermark',
                config : {
                    validate : {
                        payload: SchemaJOI.watermarkBook
                    },
                    handler: WatermarkHandler.embedWatermarkHandler
                }
            },
            {
                method: 'GET',
                path: '/epub/{epubID}/download/{param*}',
                handler: WatermarkHandler.getEpubFile
            },
            {
                method: 'POST',
                path: '/epub/{epubID}/extractwatermark',
                config: {
                    validate: {
                        payload: SchemaJOI.extractWatermark
                    },
                    handler: WatermarkHandler.extractWatermarkHandler
                }
            },
            {
                method: 'GET',
                path: '/epub/{epubID}/item/{itemID}',
                handler: WatermarkHandler.getEpubItem
            },
            {
                method: 'GET',
                path: '/epubreader/{epubID}',
                handler: {
                    file: './views/reader/index.html'
                }
            },
            {
                method: 'GET',
                path: '/epubreader/{params*}',
                handler: {
                    directory: {
                        path: './views/reader',
                        redirectToSlash: true,
                        index: 'index.html'
                    }
                }
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
