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
const HtmlWatermarker = require('./htmlWatermarker/htmlWatermarker.js').HtmlWatermarker;
const TempFilesManager = require('./handlers/tempFilesManager.js').TempFilesManager;
const QrCode = require('./qrCode/qrCodeWrapper.js');
const Async = require('async');


const EpubWatermarker = function () {

    this.cssWatermarker = new CssWatermarker();
    this.tempManager = new TempFilesManager('octopus-temp-images');
    this.imageWatermarker = new ImageWatermarker();
    this.htmlWatermarker = new HtmlWatermarker();
};

EpubWatermarker.prototype.embedWatermark = function (epubData, watermarks, options, callback) {

    const cssWatermarks = watermarks.cssWatermarks;
    const imageWatermarks = watermarks.imageWatermarks;
    const xhtmlWatermarks = watermarks.xhtmlWatermarks;
    const epub = new Epub(epubData);

    options = options || { alpha: 40,  compress: true };

    const cssWatermark = ( (done) => {

        if (!Util.isNullOrUndefined(cssWatermarks)) {
            this._embedCssWatermark(epub, cssWatermarks, options.compress, done);
        }
        else {
            done(null, null);
        }
    }).bind(this);

    const imageWatermark = ((done) => {

        if (!Util.isNullOrUndefined(imageWatermarks)) {
            this._embedImageWatermark(epub, imageWatermarks, options.alpha, done);
        }
        else {
            done(null, null);
        }
    }).bind(this);

    const htmlWatermark = ((done) => {

        if (!Util.isNullOrUndefined(xhtmlWatermarks)) {
            this._embedXhtmlWatermark(epub, xhtmlWatermarks, done);
        }
        else {
            done(null, null);
        }
    }).bind(this);

    epub.on('error', (err) => {

        callback(err, null);
    });

    epub.on('end', () => {

        const tasks = [
            cssWatermark,
            imageWatermark,
            htmlWatermark
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

EpubWatermarker.prototype._embedCssWatermark = function (epub, cssWatermarks, compress, callback) {

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
                    watermarkedCss = this.cssWatermarker.embedWatermark(css, watermark, compress);
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
                    callback(new Error('Failed to insert watermark in the CSS file : ' + files[i].href + ', ' +
                        'The CSS file may contain features that are not supported yet.' ));
                    return;
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
    const createQrCode = ((createQrCallback) => {
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
    const extractImages = ((extractImagesCallback) => {

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

    const embedWatermark = ((embedCallback) => {

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
    const saveImages = ( (savedAllCallback) => {
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
        createQrCode,
        extractImages,
        embedWatermark,
        saveImages
    ];

    Async.series(tasks, (err) => {

        if (err) {
            callback(err);
        }
        else {
            callback(null, result);
        }
    });
};

EpubWatermarker.prototype._embedXhtmlWatermark = function (epub, xhtmlWatermarks, callback) {

    let watermarkData = null;
    let htmlFilesData = null;
    let watermarkedHtmlData = null;

    const createQrImage = (done) => {

        QrCode.createQrCodeBuffer(xhtmlWatermarks.watermark, '100x100', (err, data) => {

            if (err) {
                done(err);
            }
            else {
                watermarkData = data;
                done();
            }
        });
    };

    const extractHtmlFiles = (done) => {

        epub.getFiles(xhtmlWatermarks.ids, (err, files) => {

            if (err) {
                done();
            }
            else {
                htmlFilesData = files.map((elem) => {

                    return elem.data;
                });
                done();
            }

        });
    };

    const embedWatermark = ((done) => {

        this.htmlWatermarker.embedWatermark(htmlFilesData, watermarkData, (err, watermarkedData) => {

            if (err) {
                done(err);
            }
            else {
                watermarkedHtmlData = watermarkedData;
                done();
            }
        });
    }).bind(this);

    const saveHtmlFiles = (done) => {

        for (let i = 0; i < htmlFilesData.length; ++i) {
            epub.setFile(xhtmlWatermarks.ids[i], watermarkedHtmlData[i]);
        }
        done();
    };

    Async.series([
        createQrImage,
        extractHtmlFiles,
        embedWatermark,
        saveHtmlFiles
    ], callback);
};

EpubWatermarker.prototype.extractWatermark = function (epubData, fileIDs, callback) {

    const cssIDs = fileIDs.cssIDs;
    const imagesIDs = fileIDs.imagesIDs;
    const xhtmlIDs = fileIDs.xhtmlIDs;
    const epub = new Epub(epubData);

    const watermarks = {
        cssWatermarks: [],
        imageWatermarks: [],
        xhtmlWatermarks: []
    };

    const extractCssWatermarks = ((done) => {

        if (!Util.isNullOrUndefined(imagesIDs) && cssIDs.length !== 0) {
            this._extractCssWatermarks(epub, cssIDs, done);
        }
        else {
            done();
        }
    }).bind(this);

    const extractImagesWatermarks = (function (done) {

        if (!Util.isNullOrUndefined(imagesIDs) && imagesIDs.length !== 0) {
            this._extractImagesWatermarks(epub, imagesIDs, done);
        }
        else {
            done();
        }
    }).bind(this);

    const extractXhtmlWatermark = (function (done) {

        if (!Util.isNullOrUndefined(xhtmlIDs) && xhtmlIDs.length !== 0) {
            this._extractXhtmlWatermarks(epub, xhtmlIDs, done);
        }
        else {
            done();
        }
    }).bind(this);

    epub.on('error', (err) => {

        callback(err, null);
    });

    epub.on('end', () => {

        Async.parallel([
            extractCssWatermarks,
            extractImagesWatermarks,
            extractXhtmlWatermark
        ], (err, results) => {

            if (err) {
                callback(err);
            }
            else {
                watermarks.cssWatermarks = results[0];
                watermarks.imageWatermarks = results[1];
                watermarks.xhtmlWatermarks = results[2];
                callback(null, watermarks);
            }
        });
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

//TODO: Refactor these functions
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
                            watermark: 'Failed to read watermark [Server Unavailable]'
                        };
                    }
                    else {
                        decodedWatermarks[index] = {
                            error: true,
                            watermark: result[0].symbol[0].error || 'Failed to read watermark [Server Unavailable]'
                        };
                    }
                }
                else {
                    decodedWatermarks[index] = {
                        error: false,
                        watermark: result[0].symbol[0].data
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

EpubWatermarker.prototype._extractXhtmlWatermarks = function (epub, xhtmlIDs, callback) {

    let htmlFilesData = null;
    const xhtmlWatermarks = [];

    const openXhtmlFiles = (done) => {

        epub.getFiles(xhtmlIDs, (err, files) => {

            if (err) {
                done(err);
            }
            else {
                htmlFilesData = files.map((elem) => {

                    const mediaType = elem['media-type'];
                    if (mediaType === 'application/xhtml+xml' || mediaType === 'text/html' || mediaType === 'application/xhtml') {

                        //noinspection JSUnresolvedVariable
                        return elem.data;
                    }
                });
                done();
            }
        });
    };

    const extractWatermarks = ((done) => {

        this.htmlWatermarker.extractWatermark(htmlFilesData, 100, 100, (err, watermarksData) => {

            if (err) {
                done(err);
            }
            else {
                Async.forEachOf(watermarksData, (watermarkData, key, done) => {

                    QrCode.readQrCodeFromBuffer(watermarkData, (err, result) => {

                        if (err) {
                            xhtmlWatermarks[key] = {
                                error: true,
                                watermark: 'Failed to read watermark [Server Unavailable]'
                            };
                        }
                        else {
                            if (result[0].symbol[0].error) {
                                xhtmlWatermarks[key] = {
                                    error: new Error(result[0].symbol[0].error),
                                    watermark: null
                                };
                            }
                            else {
                                xhtmlWatermarks[key] = {
                                    error: null,
                                    watermark: result[0].symbol[0].data
                                };
                            }
                        }
                        done();
                    });
                }, done);
            }
        });
    }).bind(this);

    Async.series([
        openXhtmlFiles,
        extractWatermarks
    ], (err) => {

        if (err) {
            callback(err);
        }
        else {
            callback(null, xhtmlWatermarks);
        }
    });
};

module.exports = EpubWatermarker;
