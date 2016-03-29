/**
 * Created by XoX on 15/03/2016.
 */
'use strict';
const Boom = require('boom');

const Epub = require('../epub.js');
const EpubWatermarker = require('../epubWatermarker.js');
const watermarker = new EpubWatermarker();
const TempFilesMannager = require('./tempFilesManager.js').TempFilesMannager;
const tempFiles = new TempFilesMannager();

/**
 *
 * @param request
 * @param reply
 * @module WatermarkHandler
 */

const bookUploadHandler = function (request, reply) {

    const result = {
        success: null,
        filename: null,
        id: null,
        content: null
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
            /* Extracting Meta Data from EPUB file */
            result.content = epub.getMetaData();
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

const embedWatermarkHandler = function (request, reply) {

    const id = request.params.id;
    const watermarks = request.payload.watermarks;
    const result = {
        success: false,
        id: ''
    };

    tempFiles.getFile(id, (err, epubFile) => {

        if (err) {
            reply(Boom.notFound('The requested File does not exist : Please try again with a valid ID'));
        }
        else {
            watermarker.embedWatermark(epubFile, watermarks, (err, watermarkedEpubFile) => {

                if (err) {
                    reply(Boom.badImplementation('Internal Error : watermarking failed please try again.' + err.message));
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
        }
    });
};

const extractWatermarkHandler = function (request, reply) {

    const id = request.params.id;
    const fileIDs = request.payload.fileIDs;

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

    const id = request.params.id;

    tempFiles.fileExist(id, (exist, path) => {

        if (exist) {
            reply.file(path);
        }
        else {
            reply(Boom.notFound('The requested File does not exist : Please try again with a valid ID'));
        }
    });
};

exports.embedWatermarkHandler = embedWatermarkHandler;
exports.extractWatermarkHandler = extractWatermarkHandler;
exports.bookUploadHandler = bookUploadHandler;
exports.getEpubFile = getEpubFile;
