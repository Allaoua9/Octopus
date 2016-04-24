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
        Path.join( __dirname, 'file/html/originals/2.htm')
    ];

    const watermarkedHtmlFiles = [
        Path.join( __dirname, 'file/html/1.htm'),
        Path.join( __dirname, 'file/html/2.htm')
    ];

    const watermark = 'Hello world !';
    let watermarkData = null;
    const htmlFilesData = [];
    let watermarkedHtmlData;
    let watermarksData = null;

    const watermarker = new HtmlWatermarker();

    Lab.before({ timeout : 10000 },(done) => {

        const openHtmlFiles = function (done) {

            Async.forEachOf(htmlFiles, (file, key, fileRead) => {

                Fs.readFile(file, (err, data) => {

                    if (err) {
                        fileRead(err);
                    }
                    else {
                        htmlFilesData[key] = data;
                        fileRead(null);
                    }
                });
            }, done);
        };

        const openImage = function (done) {

            QrCode.createQrCodeBuffer(watermark, '100x100', (err, data) => {

                Code.expect(err).to.not.exist();
                watermarkData = data;
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

    Lab.test('It should embed a watermark image in an html file', (done) => {

        watermarker.embedWatermark(htmlFilesData, watermarkData, (err, watermarkedHtml) => {

            Code.expect(err).to.not.exist();
            Code.expect(watermarkedHtml.length).to.equal(2);
            watermarkedHtmlData = watermarkedHtml;
            done();
        });
    });

    Lab.test('It should extract a watermark image from html files', (done) => {

        watermarker.extractWatermark(watermarkedHtmlData, 100, 100, (err, watermarks) => {

            Code.expect(err).to.not.exist();
            QrCode.readQrCodeFromBuffer(watermarks[0], (err, result) => {

                Code.expect(err).to.not.exist();
                Code.expect(result[0].symbol[0].data).to.equal(watermark);
                watermarksData = watermarks;
                done();
            });
        });
    });

    Lab.after((done) => {

        const saveWatermarkedHtml = (done) => {

            Async.forEachOf(watermarkedHtmlData, (htmlFileData, key, done) => {

                Fs.writeFile(watermarkedHtmlFiles[key], htmlFileData, (err) => {

                    Code.expect(err).to.not.exist();
                    done();
                });
            }, done);
        };

        const saveWatermarks = (done) => {

            Async.forEachOf(watermarksData, (data, key, done) => {

                Fs.writeFile(Path.join(__dirname, '/file/html/watermark' + key + '.png'), data, (err) => {

                    Code.expect(err).to.not.exist();
                    done();
                });
            }, done);
        };

        Async.parallel([
            saveWatermarkedHtml,
            saveWatermarks
        ], (err) => {

            Code.expect(err).to.not.exist();
            done();
        });
    });
});



exports.lab = Lab;
