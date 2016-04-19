/**
 * Created by XoX on 16/03/2016.
 */
'use strict';
const Epub = require('./epub.js');
const Util = require('util');
const Fs = require('fs');
const Path = require('path');
const CssWatermarker = require('./cssWatermark/cssWatermarker.js');
const ImageWatermarker = require('./imageWatermarker/imageWatermarker.js');
const TempFilesManager = require('./handlers/tempFilesManager.js').TempFilesManager;
const QrCode = require('./qrCode/qrCodeWrapper.js');



const EpubWatermarker = function () {

    this.cssWatermarker = new CssWatermarker();
    this.tempManager = new TempFilesManager('octopus-temp-images');
    this.imageWatermarker = new ImageWatermarker();
};

EpubWatermarker.prototype.embedWatermark = function (epubData, watermarks, callback) {

    const cssWatermarks = watermarks.cssWatermarks;
    const imageWatermarks = watermarks.imageWatermarks;

    const epub = new Epub(epubData);

    const watermarkImages = (function (err) {

        if (err) {
            callback(err, null);
        }
        else if (!Util.isNullOrUndefined(imageWatermarks)) {
            this._embedImageWatermark(epub, imageWatermarks, watermarkXhtml);
        }
        else {
            watermarkXhtml(null);
        }
    }).bind(this);

    const watermarkXhtml = function (err) {

        callback(err, epub.getEpub());
    };

    epub.on('error', (err) => {

        callback(err, null);
    });

    epub.on('end', () => {

        if (!Util.isNullOrUndefined(cssWatermarks)) {
            this._embedCssWatermark(epub, cssWatermarks, watermarkImages);
        }
        else {
            watermarkImages(null);
        }
    });

    epub.parse();
};

EpubWatermarker.prototype._embedCssWatermark = function (epub, cssWatermarks, callback) {

    // Watermarking CSS files
    let watermarkedCss = '';
    let css = '';
    let watermark = null;

    const filesId = cssWatermarks.map((obj) => {

        return obj.id;
    });

    epub.getFiles(filesId, (err, files) => {

        if (err) {
            callback(err, null);
        }
        else {
            try {
                for (let i = 0; i < files.length; ++i) {
                    css = files[i].data.toString();
                    watermark = '0x' + cssWatermarks[i].watermark;
                    watermarkedCss = this.cssWatermarker.embedWatermark(css, watermark, { compress: false });
                    epub.setFile(files[i].id, watermarkedCss);
                }
                callback(null);
            }
            catch (error) {
                callback(error);
            }
        }
    });
};

EpubWatermarker.prototype._embedImageWatermark = function (epub, imageWatermarks, callback) {

    const watermark = imageWatermarks.watermark;
    let watermarkImage = '';
    const alpha = 40;

    // generate QR Code.
    // save Qr Code image.
    this.tempManager.createDir((err, id, path) => {

        if (err) {
            callback(err);
        }
        else {
            watermarkImage = Path.join(path, 'qr.png');
            // Create Qr code image
            QrCode.createQrCode(watermark, '70x70', watermarkImage, (err) => {

                if (err) {
                    callback(err);
                }
                else {

                    // Extract images and save them into a temporary directory
                    this._saveTempImages(epub, imageWatermarks.ids, (err, images) => {

                        if (err) {
                            callback(err);
                        }
                        else {
                            this.imageWatermarker.embedWatermark(images, watermarkImage, alpha, saveImages);
                        }
                    });
                }
            });
        }
    });

    // Saving images back into the Epub file.
    const saveImages = (function (err, result) {

        if (err) {
            callback(err);
        }
        else {
            const watermarkedImages = result.watermarkedImages;
            let savedNumber = 0;
            for (let i = 0; i < watermarkedImages.length; ++i) {
                ((index) => {

                    Fs.readFile(watermarkedImages[index], (err, data) => {

                        if (err) {
                            callback(err);
                        }
                        else {
                            epub.setFile(imageWatermarks.ids[index], data);
                            savedNumber = savedNumber + 1;
                            if (savedNumber === watermarkedImages.length) {
                                callback(null);
                            }
                        }
                    });
                })(i);
            }
        }
    }).bind(this);
};

EpubWatermarker.prototype.extractWatermark = function (epubData, fileIDs, callback) {

    const cssIDs = fileIDs.cssIDs;
    const imagesIDs = fileIDs.imagesIDs;
    const epub = new Epub(epubData);

    const watermarks = {
        cssWatermarks: [],
        imageWatermarks: [],
        xhtmlWatermarks: []
    };

    const extractImagesWatermarks = (function (err, cssWatermarks) {

        if (err) {
            callback(err, null);
        }
        else {
            watermarks.cssWatermarks = cssWatermarks;
            if (!Util.isNullOrUndefined(imagesIDs) && imagesIDs.length !== 0) {
                this._extractImagesWatermarks(epub, imagesIDs, extractXhtmlWatermark);
            }
            else {
                extractXhtmlWatermark(null, null);
            }
        }
    }).bind(this);

    const extractXhtmlWatermark = function (err, imageWatermarks) {

        if (err) {
            callback(err);
        }
        else {
            watermarks.imageWatermarks = imageWatermarks;
            callback(null, watermarks);
        }
    };

    epub.on('error', (err) => {

        callback(err, null);
    });
    epub.on('end', () => {

        if (!Util.isNullOrUndefined(cssIDs) && cssIDs.length !== 0) {
            this._extractCssWatermarks(epub, cssIDs, extractImagesWatermarks);
        }
        else {
            extractImagesWatermarks(null, null);
        }
    });

    epub.parse();
};

EpubWatermarker.prototype._extractCssWatermarks = function (epub, cssIDs, callback) {

    const cssWatermarks = [];

    epub.getFiles(cssIDs, (err, files) => {

        if (err) {
            callback(err, null);
        }
        else {
            for (let i = 0; i < files.length; ++i) {

                cssWatermarks.push({
                    id: files[i].id,
                    watermark: this.cssWatermarker.extractWatermark(files[i].data.toString())
                });
            }
            callback(null, cssWatermarks);
        }
    });
};

EpubWatermarker.prototype._extractImagesWatermarks = function (epub, imageIDs, callback) {

    this._saveTempImages(epub, imageIDs, (err, images) => {

        if (err) {
            callback(err);
        }
        else {
            this.imageWatermarker.extractWatermark(images, 70, 70, (err, result) => {

                if (err) {
                    callback(err);
                }
                else {
                    decodeWatermarks(result.watermarks);
                }
            });
        }
    });

    const decodeWatermarks = (function (watermarks) {

        const decodedWatermarks = [];
        let decodedNumber = 0;
        watermarks.forEach((elem, index) => {

            QrCode.readQrCode(elem, (err, result) => {

                if (err) {
                    decodedWatermarks[index] = 'Failed to read watermark';
                }
                else {
                    decodedWatermarks[index] = result[0].symbol[0].data;
                }
                decodedNumber = decodedNumber + 1;
                if (decodedNumber === watermarks.length) {
                    callback(null, decodedWatermarks);
                }
            });
        });
    }).bind(this);
};

EpubWatermarker.prototype._saveTempImages = function (epub, ids, callback) {

    const images = [];
    this.tempManager.createDir((err, id, path) => {

        if (err) {
            callback(err);
        }
        else {
            this.imageWatermarker.workingDir = path;

            epub.getFiles(ids, (err, files) => {

                if (err) {
                    callback(err);
                }
                else {
                    for (let i = 0; i < files.length; ++i) {

                        const filename = Path.basename(files[i].href);
                        const savePath = Path.join(path, filename);

                        ((file, data, index) => {

                            Fs.writeFile(file, data, (err) => {

                                if (err) {
                                    callback(err);
                                }
                                else {
                                    images[index] = file;
                                    const size = images.filter((value) => {

                                        return value !== undefined;
                                    }).length;

                                    if (size === files.length) {
                                        callback(null, images);
                                    }
                                }
                            });
                        })(savePath, files[i].data, i);
                    }
                }
            });
        }
    });
};

module.exports = EpubWatermarker;
