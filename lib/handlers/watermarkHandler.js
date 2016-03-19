/**
 * Created by XoX on 15/03/2016.
 */
'use strict';
const Temp = require('temp');
const Fs = require('fs');
const Path = require('path');
const ReadChunk = require('read-chunk');
const IsEpub = require('is-epub');
const Boom = require('boom');
const WatermarkEmbder = require('../watermarkEmbder.js');

/**
 *
 * @param request
 * @param reply
 * @module WatermarkHandler
 */

const embedWatermarkHandler = function (request, reply) {

    const uploadedBook = request.payload.book;
    const filename = uploadedBook.hapi.filename;
    const dirPath = Temp.path();
    Fs.mkdir(dirPath, (err) => {

        if (err) {
            reply(Boom.badImplementation('Internal ERROR'));
            console.log(err);
        }
        else {
            const bookPath = Path.join(dirPath, filename);
            const file = Fs.createWriteStream(bookPath);

            file.on('error', (err) => {

                reply(Boom.badImplementation('Internal ERROR'));
                console.log(err);
            });

            file.on('open', (fd) => {

                uploadedBook.pipe(file);

                uploadedBook.on('end', () => {

                    const buffer = ReadChunk.sync(bookPath, 0, 58);
                    if (IsEpub(buffer)) {
                        const watermark = {
                            transactionID: request.payload.transactionID,
                            authorID: request.payload.authorID
                        };
                        WatermarkEmbder.embed(bookPath, watermark, (err, newBookPath) => {

                            if (!err) {
                                const result = {
                                    success: true,
                                    filename: filename,
                                    watermarkedEPUB: newBookPath
                                };
                                reply(result);
                            }
                            else {
                                console.log('Error : ' + err);
                                reply(Boom.badImplementation('Internal ERROR'));
                            }
                        });
                    }
                    else {
                        reply(Boom.badRequest('Invalid file type : Please provide an EPUB document.'));
                    }
                });
            });
        }
    });
};

const extractWatermarkHandler = function (request, reply) {

};

exports.embedWatermarkHandler = embedWatermarkHandler;
exports.extractWatermarkHandler = extractWatermarkHandler;
