/**
 * Created by XoX on 16/03/2016.
 */
'use strict';
const Epub = require('./epub.js');
const CssWatermarker = require('./cssWatermark/cssWatermarker.js');


const EpubWatermarker = function () {

    this.cssWatermarker = new CssWatermarker();
};


EpubWatermarker.prototype.embedWatermark = function (path, watermark, newPath, callback) {

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
};

module.exports = EpubWatermarker;
