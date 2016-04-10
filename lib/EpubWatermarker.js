/**
 * Created by XoX on 16/03/2016.
 */
'use strict';
const Epub = require('./epub.js');
const CssWatermarker = require('./cssWatermark/cssWatermarker.js');


const EpubWatermarker = function () {

    this.cssWatermarker = new CssWatermarker();
};

EpubWatermarker.prototype.embedWatermark = function (epubData, watermarks, callback) {

    const cssWatermarks = watermarks.cssWatermarks;
    let watermarkedCss = '';
    let css = '';
    let watermark = null;

    const epub = new Epub(epubData);
    epub.on('error', (err) => {

        callback(err, null);
    });

    epub.on('end', () => {

        if (cssWatermarks !== undefined) {
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
                            watermark = cssWatermarks[i].watermark;
                            watermarkedCss = this.cssWatermarker.embedWatermark(css, watermark, { compress: false });
                            epub.setFile(files[i].id, watermarkedCss);
                        }
                        callback(null, epub.getEpub());
                    }
                    catch (error) {
                        callback(error, null);
                    }
                }
            });
        }
        else {
            callback(null, epubData);
        }
    });

    epub.parse();
};

EpubWatermarker.prototype.extractWatermark = function (epubData, fileIDs, callback) {

    const cssIDs = fileIDs.cssIDs;

    const epub = new Epub(epubData);

    const watermarks = {
        cssWatermarks: [],
        imageWatermarks: [],
        xhtmlWatermarks: []
    };

    epub.on('error', (err) => {

        callback(err, null);
    });
    epub.on('end', () => {

        if (cssIDs !== undefined) {
            epub.getFiles(cssIDs, (err, files) => {

                if (err) {
                    callback(err, null);
                }
                else {
                    for (let i = 0; i < files.length; ++i) {

                        watermarks.cssWatermarks.push({
                            id: files[i].id,
                            watermark: this.cssWatermarker.extractWatermark(files[i].data.toString())
                        });
                    }
                    callback(null, watermarks);
                }
            });
        }
        else {
            callback(new Error('Please specify files IDs'), null);
        }
    });

    epub.parse();
};

/*EpubWatermarker.prototype.embedWatermark = function (path, watermark, newPath, callback) {

    const epub = new Epub(path);

    epub.on('error', (err) => {

        callback(err, null);
    });

    epub.on('end', () => {

        epub.getLargestCSS( (err, cssFile) => {

            if (err) {
                callback(err);
            }
            else {
                const css = this.cssWatermarker.embedWatermark(cssFile.data.toString(), watermark.clientID, { compress: false });
                epub.setFile(cssFile.id, css);
                epub.saveEpub(newPath);
                callback(null);
            }
        });
    });

    epub.parse();
};*/

module.exports = EpubWatermarker;
