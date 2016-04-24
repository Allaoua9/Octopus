/**
 * Created by XoX on 22/04/2016.
 */
'use strict';

const PNG = require('pngjs2').PNG;
const Async = require('async');

const HtmlWatermarker = function () {

};

HtmlWatermarker.prototype.embedWatermark = function (htmlFilesData, watermarkPNG, callback) {

    const image = new PNG();
    const watermarkedData = [];

    image.parse(watermarkPNG, (err) => {

        if (err) {
            callback(err);
        }
        else {
            Async.forEachOf(htmlFilesData, (htmlFileData, key, done) => {

                const imageBufferLength = (image.width * image.height);

                const watermarkedBuffers = [];
                const index = htmlFileData.indexOf('</html>');
                htmlFileData = htmlFileData.slice(0, index + 7);
                watermarkedBuffers.push(htmlFileData);

                try {
                    for (let i = 0; i < imageBufferLength; ++i) {

                        if (image.data[i * 4] >= 128) {
                            watermarkedBuffers.push(new Buffer([0x0a], 'utf8'));
                        }
                        else {
                            watermarkedBuffers.push(new Buffer([0x0b], 'utf8'));
                        }
                    }
                }
                catch (error) {
                    done(error);
                }

                watermarkedData[key] = Buffer.concat(watermarkedBuffers);
                done();
            }, (err) => {

                if (err) {
                    callback(err);
                }
                else {
                    callback(null, watermarkedData);
                }
            });
        }
    });
};

HtmlWatermarker.prototype.extractWatermark = function (htmlFilesData, width, height, callback) {

    const watermarks = [];

    Async.forEachOf(htmlFilesData, (htmlFileData, key, done) => {

        const watermarkImage = new PNG({
            width: width,
            height: height,
            colorType: 2
        });


        const watermarkBufferLength = width * height;
        const begin = htmlFileData.length - watermarkBufferLength;

        for (let i = 0; i < watermarkBufferLength; ++i) {
            if (htmlFileData[begin + i] === 0x0a) {
                watermarkImage.data[4 * i] = 0xff;
                watermarkImage.data[4 * i + 1] = 0xff;
                watermarkImage.data[4 * i + 2] = 0xff;
                watermarkImage.data[4 * i + 3] = 0xff;
            }
            else if ( htmlFileData[begin + i] === 0x0b) {
                watermarkImage.data[4 * i] = 0x00;
                watermarkImage.data[4 * i + 1] = 0x00;
                watermarkImage.data[4 * i + 2] = 0x00;
                watermarkImage.data[4 * i + 3] = 0xff;
            }
            else {
                watermarkImage.data[4 * i] = 0x80;
                watermarkImage.data[4 * i + 1] = 0x80;
                watermarkImage.data[4 * i + 2] = 0x80;
                watermarkImage.data[4 * i + 3] = 0xff;
            }
        }

        const imageBuffers = [];
        const imageStream = watermarkImage.pack();

        imageStream.on('data', (chunk) => {

            imageBuffers.push(chunk);
        });

        imageStream.on('end', () => {

            watermarks[key] = Buffer.concat(imageBuffers);
            done();
        });

    }, (err) => {

        if (err) {
            callback(err);
        }
        else {
            callback(null, watermarks);
        }
    });
};

module.exports.HtmlWatermarker = HtmlWatermarker;

