/**
 * Created by XoX on 15/03/2016.
 */
'use strict';
const Temp = require('temp');
const Fs = require('fs');
const Path = require('path');
const Boom = require('boom');

const EpubWatermarker = require('../epubWatermarker.js');
const watermarker = new EpubWatermarker();

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
            const newBookPath = Path.join(dirPath, 'watermarked-' + filename);
            const file = Fs.createWriteStream(bookPath);

            file.on('error', (err) => {

                reply(Boom.badImplementation('Internal ERROR'));
                console.log(err);
            });

            file.on('open', () => {

                uploadedBook.pipe(file);

                uploadedBook.on('end', () => {

                    const watermark = {
                        clientID: parseInt(request.payload.clientID, 10),
                        authorID: request.payload.authorID
                    };

                    watermarker.embedWatermark(bookPath, watermark, newBookPath, (err) => {

                        if (!err) {
                            const result = {
                                success: true,
                                filename: filename,
                                watermarkedEPUB: newBookPath
                            };
                            reply(result);
                        }
                        else {
                            console.log(err);
                            reply(Boom.badRequest(err.message));
                        }
                    });
                });
            });
        }
    });
};

const extractWatermarkHandler = function (request, reply) {

};

exports.embedWatermarkHandler = embedWatermarkHandler;
exports.extractWatermarkHandler = extractWatermarkHandler;
