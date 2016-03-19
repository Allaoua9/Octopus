/**
 * Created by XoX on 16/03/2016.
 */
'use strict';
const Epub = require('./epub.js');
const CssWatermarker = require('./cssWatermark/cssWatermarker.js');

const embed = function (path, watermark, callback) {

    const epub = new Epub(path);

    epub.on('error', (err) => {

        throw err;
    });

    epub.on('end', (err) => {

        if (!err) {
            epub.getLargestCSS( (err, cssFile) => {

                if (err) {

                    callback(err, null);
                }
                else {
                    CssWatermarker.embedWatermark(cssFile.data.toString(), 1);
                    callback(err, path);
                }
            });
        }
        else {
            console.log(err);
        }
    });

    epub.parse();
};

exports.embed = embed;
