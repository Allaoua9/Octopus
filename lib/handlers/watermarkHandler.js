/**
 * Created by XoX on 15/03/2016.
 */
'use strict';
const Boom = require('boom');
const Epub = require('../epub.js');
const EpubWatermarker = require('../epubWatermarker.js');
const watermarker = new EpubWatermarker();
const TempFilesManager = require('./tempFilesManager.js').TempFilesManager;
const tempFiles = new TempFilesManager();

/* Cleaning Temporary files when exiting */
process.on('exit', () => {

    tempFiles.cleanAll((err) => {

        console.log(err);
    });
});

/*process.on('SIGINT', () => {

    tempFiles.cleanAll((err) => {

        console.log(err);
    });
});*/

process.on('uncaughtException', () => {

    tempFiles.cleanAll((err) => {

        console.log(err);
    });
});

/**
 *
 * @param request
 * @param reply
 * @module WatermarkHandler
 */

const epubUploadHandler = function (request, reply) {

    const result = {
        success: null,
        filename: null,
        id: null
    };

    const uploadedBook = request.payload.book;
    const buffers = [];
    let buffer = null;

    result.filename = uploadedBook.hapi.filename;
    /* Reading uploadedBook into a Buffer*/
    uploadedBook.on('data', (data) => {

        buffers.push(data);
    });

    uploadedBook.on('end', () => {
        /*Uploaded Book Buffer*/
        buffer = Buffer.concat(buffers);
        /* Intialising Epub File*/
        const epub = new Epub(buffer);
        epub.on('end', () => {

            /* Saving Epub file in a temporary location*/
            tempFiles.createFile(buffer, (err, id) => {

                if (err) {
                    reply(Boom.badImplementation('Internal Error while uploading file : Please Try Again'));
                }
                else {
                    result.success = true;
                    result.id = id;
                    reply(result);
                }
            });
        });

        epub.on('error', (err) => {

            reply(Boom.badRequest('Cant open Epub file : ' + err.message));
        });

        epub.parse();
    });
};

const epubMetaDataHandler = function (request, reply) {

    const epubID = request.params.epubID;
    let epub = null;
    const metadata = {};

    tempFiles.getFile(epubID, (err, data) => {

        if (err) {
            reply(Boom.notFound('The requested File does not exist : Please try again with a valid ID'));
        }
        else {
            epub = new Epub(data);

            epub.on('end', () => {

                metadata.id = epubID;
                const imageID = epub.getCoverImageID();
                if (imageID !== null) {
                    metadata.image = '/epub/' + epubID + '/item/' + imageID;
                }
                else {
                    metadata.image = null;
                }
                metadata.author = epub.metadata.creator;
                metadata.title = epub.metadata.title;
                metadata.language = epub.metadata.language;
                metadata.subject = epub.metadata.subject;
                metadata.date = (new Date(epub.metadata.date));
                metadata.description = epub.metadata.description;

                reply(metadata);
            });

            epub.on('error', (err) => {

                reply(Boom.badData('Cannot open the requested File : please try again.', err));
            });

            epub.parse();
        }
    });
};

const epubFilesMetaDataHandler = function (request, reply) {

    const epubID = request.params.epubID;
    let epub = null;
    const result = {
        id: epubID,
        metadata: null
    };

    tempFiles.getFile(epubID, (err, data) => {

        if (err) {
            reply(Boom.notFound('The requested File does not exist : Please try again with a valid ID'));
        }
        else {
            epub = new Epub(data);

            epub.on('end', () => {

                result.metadata = epub.getFilesMetaData();
                reply(result);
            });

            epub.on('error', (err) => {

                reply(Boom.badData('Cannot open the requested File : please try again.', err));
            });

            epub.parse();
        }
    });
};

const embedWatermarkHandler = function (request, reply) {

    const id = request.params.epubID;
    const watermarks = request.payload.watermarks;
    const result = {
        success: false,
        id: ''
    };

    // Read epub file
    tempFiles.getFile(id, (err, epubFile) => {

        if (err) {
            reply(Boom.notFound('The requested File does not exist : Please try again with a valid ID'));
        }
        else {
            embedWatermark(epubFile);
        }
    });

    // Embed watermark
    const embedWatermark = function (epubFile) {

        watermarker.embedWatermark(epubFile, watermarks, (err, watermarkedEpubFile) => {

            if (err) {
                reply(Boom.badRequest('Watermarking failed because : ' + err.message));
            }
            else {
                tempFiles.createFile(watermarkedEpubFile, (err, watermarkedEpubID) => {

                    if (err) {
                        reply(Boom.badImplementation('Internal Error : file saving failed please try again.' + err.message));
                    }
                    else {
                        result.success = true;
                        result.id = watermarkedEpubID;
                        reply(result);
                    }
                });
            }
        });
    };
};

const extractWatermarkHandler = function (request, reply) {

    const id = request.params.epubID;
    const fileIDs = request.payload.ids;

    tempFiles.getFile(id, (err, epubData) => {

        if (err) {
            reply(Boom.notFound('The requested File does not exist : Please try again with a valid ID'));
        }
        else {
            watermarker.extractWatermark(epubData, fileIDs, (err, watermarks) => {

                if (err) {
                    reply(Boom.badRequest('Extracting watermark failed : ' + err));
                }
                else {
                    reply(watermarks);
                }
            });
        }
    });

};

const getEpubFile = function (request, reply) {

    const id = request.params.epubID;

    tempFiles.fileExist(id, (exist, path) => {

        if (exist) {
            reply.file(path);
        }
        else {
            reply(Boom.notFound('The requested File does not exist : Please try again with a valid ID'));
        }
    });
};

const getEpubItem = function (request, reply) {

    const epubID = request.params.epubID;
    const itemID = request.params.itemID;
    let epub = null;

    tempFiles.getFile(epubID, (err, data) => {

        if (err) {
            reply(Boom.notFound('The requested File does not exist : Please try again with a valid ID'));
        }
        else {
            epub = new Epub(data);
            epub.on('error', (err) => {

                reply(Boom.badData('Cannot open the requested File : please try again.', err));
            });

            epub.on('end', () => {

                epub.getFile(itemID, (err, itemData) => {

                    if (err) {
                        reply(Boom.notFound('The requested item does not exist : Please try again with a valid ID'));
                    }
                    else {
                        tempFiles.createFile(itemData, (err, id, path) => {

                            if (err) {
                                reply(Boom.badImplementation('Internal Error while uploading file : Please Try Again'));
                            }
                            else {
                                reply.file(path);
                            }
                        });
                    }
                });
            });

            epub.parse();
        }
    });

};

exports.embedWatermarkHandler = embedWatermarkHandler;
exports.extractWatermarkHandler = extractWatermarkHandler;
exports.epubUploadHandler = epubUploadHandler;
exports.getEpubFile = getEpubFile;
exports.epubMetaDataHandler = epubMetaDataHandler;
exports.getEpubItem = getEpubItem;
exports.epubFilesMetaDataHandler = epubFilesMetaDataHandler;
