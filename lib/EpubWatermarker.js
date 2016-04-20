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
const Async = require('async');


const EpubWatermarker = function () {

    this.cssWatermarker = new CssWatermarker();
    this.tempManager = new TempFilesManager('octopus-temp-images');
    this.imageWatermarker = new ImageWatermarker();
};

EpubWatermarker.prototype.embedWatermark = function (epubData, watermarks, callback) {

    let cssWatermarks = watermarks.cssWatermarks;
    const imageWatermarks = watermarks.imageWatermarks;


    const epub = new Epub(epubData);

    const cssWatermarkTask = ( (cssCallback) => {

        if (!Util.isNullOrUndefined(cssWatermarks)) {
            // Sort CSS ids and watermarks
            cssWatermarks = cssWatermarks.sort((elem1, elem2) => {

                return elem1.id.localeCompare(elem2.id);
            });
            this._embedCssWatermark(epub, cssWatermarks, cssCallback);
        }
        else {
            cssCallback(null, null);
        }
    }).bind(this);

    const imageWatermarkTask = ((imageCallback) => {

        if (!Util.isNullOrUndefined(imageWatermarks)) {
            // Sort images
            imageWatermarks.ids = imageWatermarks.ids.sort((elem1, elem2) => {

                return elem1.localeCompare(elem2);
            });
            this._embedImageWatermark(epub, imageWatermarks, 40, imageCallback);
        }
        else {
            imageCallback(null, null);
        }
    }).bind(this);

    epub.on('error', (err) => {

        callback(err, null);
    });

    epub.on('end', () => {

        const tasks = [
            cssWatermarkTask,
            imageWatermarkTask
        ];

        Async.parallel(tasks, (err, results) => {
            // When all watermarks have been executed
            if (err) {
                callback(err, null);
            }
            else {
                //console.log(results);
                callback(null, epub.getEpub(), results);
            }
        });
    });

    epub.parse();
};

EpubWatermarker.prototype._embedCssWatermark = function (epub, cssWatermarks, callback) {

    // Watermarking CSS files
    let watermarkedCss = '';
    let css = '';
    let watermark = null;
    const result = [];

    // Constructing an array of files Ids
    const filesId = cssWatermarks.map((obj) => {

        return obj.id;
    });

    // Getting files Data from the epub document
    epub.getFiles(filesId, (err, files) => {

        if (err) {
            callback(err, null);
        }
        else {
            let i;
            for (i = 0; i < files.length; ++i) {
                // Converting Css buffer into a string
                css = files[i].data.toString();
                // 0x is added to the hexadecimal watermark
                watermark = '0x' + cssWatermarks[i].watermark;
                try {
                    // Insert watermark
                    // TODO: Transform this function into an Async function
                    watermarkedCss = this.cssWatermarker.embedWatermark(css, watermark, { compress: false });
                    // if insertion succeed save the Watermarked CSS into the Epub
                    epub.setFile(files[i].id, watermarkedCss);
                    // Returned Result
                    result.push({
                        id: files[i].id,
                        watermark: watermark,
                        error: null
                    });
                }
                catch (error) {
                    result.push({
                        id: files[i].id,
                        error: new Error('Failed to insert watermark in the CSS file : ' + files[i].href )
                    });
                }
            }
            callback(null, result);
        }
    });
};

EpubWatermarker.prototype._embedImageWatermark = function (epub, imageWatermarks, alpha, callback) {

    const watermark = imageWatermarks.watermark;
    // Points to qr code image
    let watermarkImage = '';
    // array of paths that point to the extracted images
    const images = [];
    // the returned result
    let result = null;
    // generate QR Code.
    // save Qr Code image.
    const createQrCodeTask = ((createQrCallback) => {
        //Create temporary directory to save qr code image
        this.tempManager.createDir((err, id, path) => {

            if (err) {
                createQrCallback(err);
            }
            else {
                watermarkImage = Path.join(path, 'qr.png');
                // Create Qr code image
                QrCode.createQrCode(watermark, '100x100', watermarkImage, (err) => {

                    createQrCallback(err);
                });
            }
        });
    }).bind(this);

    // Extract images and save them into a temporary directory
    const extractImagesTask = ((extractImagesCallback) => {

        this.tempManager.createDir((err, id, path) => {

            if (err) {
                extractImagesCallback(err);
            }
            else {
                this.imageWatermarker.workingDir = path;

                epub.getFiles(imageWatermarks.ids, (err, files) => {

                    if (err) {
                        extractImagesCallback(err);
                    }
                    else {
                        Async.forEachOf(files, (file, key, extractedCallback) => {

                            const filename = Path.basename(file.href);
                            const savePath = Path.join(path, filename);

                            Fs.writeFile(savePath, file.data, (err) => {

                                if (err) {
                                    extractedCallback(err);
                                }
                                else {
                                    images[key] = savePath;
                                    extractedCallback(null);
                                }
                            });

                        }, extractImagesCallback);
                    }
                });
            }
        });
    }).bind(this);

    const embedWatermarkTask = ((embedCallback) => {

        this.imageWatermarker.embedWatermark(images, watermarkImage, alpha, (err, embedResult) => {

            if (err) {
                embedCallback(err);
            }
            else {
                result = embedResult;
                embedCallback(null);
            }
        });
    }).bind(this);

    // Saving images back into the Epub file.
    const saveImagesTask = ( (savedAllCallback) => {
        // Absolute path to the watermarked images
        const watermarkedImages = result.watermarkedImages;

        Async.forEachOf(watermarkedImages, (image, key, savedCallback) => {

            Fs.readFile(image, (err, data) => {

                if (err) {
                    savedCallback(err);
                }
                else {
                    epub.setFile(imageWatermarks.ids[key], data);
                    savedCallback(null);
                }
            });
        }, (err) => {

            if (err) {
                savedAllCallback(err);
            }
            else {
                result.watermarkedImages = imageWatermarks.ids.slice(0, result.watermarkedNumber);
                savedAllCallback(null, result);
            }
        });
    }).bind(this);

    const tasks = [
        createQrCodeTask,
        extractImagesTask,
        embedWatermarkTask,
        saveImagesTask
    ];

    Async.series(tasks, (err, results) => {

        if (err) {
            callback(err);
        }
        else {
            callback(null, result);
        }
    });
};

EpubWatermarker.prototype.extractWatermark = function (epubData, fileIDs, callback) {

    let cssIDs = fileIDs.cssIDs;
    let imagesIDs = fileIDs.imagesIDs;
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
                imagesIDs = imagesIDs.sort((elem1, elem2) => {

                    return elem1.localeCompare(elem2);
                });
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
            cssIDs = cssIDs.sort((elem1, elem2) => {

                return elem1.localeCompare(elem2);
            });
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

                try {
                    const extractedWatermark = {
                        id: files[i].id,
                        watermark: this.cssWatermarker.extractWatermark(files[i].data.toString())
                    };
                    cssWatermarks.push(extractedWatermark);
                }
                catch (error) {
                    cssWatermarks.push({
                        id: files[i].id,
                        watermark: '0'
                    });
                }
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

            this.imageWatermarker.extractWatermark(images, 100, 100, (err, result) => {

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

                if (err || result[0].symbol[0].error) {
                    if (err) {
                        decodedWatermarks[index] = {
                            error: true,
                            data: 'Failed to read watermark [Server Unavailable]'
                        };
                    }
                    else {
                        decodedWatermarks[index] = {
                            error: true,
                            data: result[0].symbol[0].error || 'Failed to read watermark [Server Unavailable]'
                        };
                    }
                }
                else {
                    decodedWatermarks[index] = {
                        error: false,
                        data: result[0].symbol[0].data
                    };
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
