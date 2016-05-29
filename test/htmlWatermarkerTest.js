/**
 * Created by XoX on 23/04/2016.
 */

'use strict';

const Lab = require('lab').script();
const Code = require('code');
const Path = require('path');
const Fs = require('fs');
const Async = require('async');
const QrCode = require('../lib/qrCode/qrCodeWrapper.js');
const HtmlWatermarker = require('../lib/htmlWatermarker/htmlWatermarker.js').HtmlWatermarker;

Lab.experiment('Testing watermark insertion and extraction in html files', () => {

    const htmlFiles = [
        Path.join( __dirname, 'file/html/originals/1.htm'),
        Path.join( __dirname, 'file/html/originals/2.htm'),
        Path.join( __dirname, 'file/html/originals/ch02.html')
    ];

    const watermarkedHtmlFiles = [
        Path.join( __dirname, 'file/html/1.htm'),
        Path.join( __dirname, 'file/html/2.htm'),
        Path.join( __dirname, 'file/html/ch02.html')
    ];

    // the watermark text
    const watermark = 'Hello world !';
    // the watermark Qr Code Image
    let watermarkImageData = null;
    // Array of Html files that are going to be watermarked
    const htmlFilesData = [];
    // Array of watermarked Html Files
    let watermarkedHtmlData;
    // extracted watermarks
    let extractedWatermarksData = null;

    const watermarker = new HtmlWatermarker();

    Lab.before({ timeout : 10000 },(done) => {

        // opening Html files.
        const openHtmlFiles = function (done) {

            Async.forEachOf(htmlFiles, (file, key, fileRead) => {

                Fs.readFile(file, (err, data) => {

                    if (err) {
                        fileRead(err);
                    }
                    else {
                        htmlFilesData[key] = data.toString();
                        fileRead(null);
                    }
                });
            }, done);
        };

        // Creating Qr Code image
        const openImage = function (done) {

            QrCode.createQrCodeBuffer(watermark, '100x100', (err, data) => {

                Code.expect(err).to.not.exist();
                watermarkImageData = data;
                done();
            });
        };

        Async.parallel([
            openHtmlFiles,
            openImage
        ], (err) => {

            Code.expect(err).to.not.exist();
            done();
        });

    });

    Lab.test('It should encode an image into utf-8 buffers', (done) => {

        watermarker._encodeImage(watermarkImageData, (err, buffers) => {

            Code.expect(err).to.not.exist();
            Code.expect(buffers.length).to.equal(10000);
            done();
        });
    });

    Lab.test('It should embed a watermark image in an html file', (done) => {

        watermarker.embedWatermark(htmlFilesData, watermarkImageData, (err, watermarkedData) => {

            Code.expect(err).to.not.exist();
            Code.expect(watermarkedData.length).to.equal(3);
            watermarkedHtmlData = watermarkedData;
            done();
        });
    });

    Lab.test('It should extract a watermark image from html files', { timeout : 10000 }, (done) => {

        watermarker.extractWatermark(watermarkedHtmlData, 100, 100, (err, watermarks) => {

            Code.expect(err).to.not.exist();
            QrCode.readQrCodeFromBuffer(watermarks[0], (err, result) => {

                Code.expect(err).to.not.exist();
                Code.expect(result[0].symbol[0].data).to.equal(watermark);
                extractedWatermarksData = watermarks;
                done();
            });
        });
    });

    Lab.after((done) => {

        const saveWatermarkedHtml = (done) => {

            Async.forEachOfSeries(watermarkedHtmlData, (htmlFileData, key, done) => {

                Fs.writeFile(watermarkedHtmlFiles[key], htmlFileData, (err) => {

                    Code.expect(err).to.not.exist();
                    done();
                });
            }, done);
        };

        const saveWatermarks = (done) => {

            Async.forEachOfSeries(extractedWatermarksData, (data, key, done) => {

                Fs.writeFile(Path.join(__dirname, '/file/html/watermark' + key + '.png'), data, (err) => {

                    Code.expect(err).to.not.exist();
                    done();
                });
            }, done);
        };

        Async.series([
            saveWatermarkedHtml,
            saveWatermarks
        ], (err) => {

            Code.expect(err).to.not.exist();
            done();
        });
    });


});



exports.lab = Lab;
