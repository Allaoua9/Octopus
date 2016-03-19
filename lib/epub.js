/**
 * Created by XoX on 16/03/2016.
 */
'use strict';

const Util = require('util');
const EPub = require('epub');

const Epub = function Epub(epubfile) {

    EPub.call(this, epubfile, '', '');
};

Util.inherits(Epub, EPub);



Epub.prototype.getCSSFiles = function (callback) {

    const cssFiles = [];
    const manifest = this.manifest;
    const CssCount = this.getCssCount();

    for (const entry in manifest) {
        if (manifest.hasOwnProperty(entry)) {
            if (manifest[entry]['media-type'] === 'text/css') {
                this.getFile(manifest[entry].id, (err, data, mimeType) => {

                    if (!err) {
                        cssFiles.push({
                            id: manifest[entry].id,
                            href: manifest[entry].href,
                            'media-type': manifest[entry]['media-type'],
                            data: data
                        });

                        if ((cssFiles.length === CssCount)) {
                            callback(err, cssFiles);
                        }
                    }
                    else {
                        callback(err, null);
                    }
                });
            }
        }
    }
};

Epub.prototype.getLargestCSS = function (callback){

    this.getCSSFiles( (err, cssFiles) => {

        if (err) {
            callback(err, null);
        }
        else {
            let length = 0;
            let i = 0;
            let j;
            for ( j in cssFiles) {
                if (cssFiles.hasOwnProperty(j)) {
                    if (cssFiles[j].data.length > length) {
                        i = j;
                        length = cssFiles[j].data.length;
                    }
                }
            }
            callback(err, cssFiles[i]);
        }
    });
};

Epub.prototype.getCssCount = function () {

    let CSSCount = 0;
    const manifest = this.manifest;
    let entry;
    for (entry in manifest) {
        if (manifest.hasOwnProperty(entry)) {
            if (manifest[entry]['media-type'] === 'text/css') {
                CSSCount++;
            }
        }
    }
    return CSSCount;
};

module.exports = Epub;

