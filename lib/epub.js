/**
 * Created by XoX on 16/03/2016.
 */
'use strict';

const Util = require('util');
const EPub = require('epub');
const Fs = require('fs');
const JSZip = require('jszip');

const ZipFile = function (data) {

    this.jsZip = new JSZip(data);
    this.names = Object.keys(this.jsZip.files);
    this.count = this.names.length;
};

ZipFile.prototype.readFile = function (name, callback) {

    try {
        const data = this.jsZip.file(name).asNodeBuffer();
        callback(null, data);
    }
    catch (error) {
        callback(error, null);
    }
};

ZipFile.prototype.writeFile = function (name, data) {

    try {
        this.jsZip.file(name, data);
    }
    catch (error) {
        throw error;
    }
};

ZipFile.prototype.saveFileSync = function (filename) {

    try {
        const data = this.jsZip.generate({ type: 'nodeBuffer' });
        Fs.writeFileSync(filename, data);
    }
    catch (error) {
        throw error;
    }
};

const Epub = function Epub(epubfile) {

    EPub.call(this, epubfile, '', '');
};

Util.inherits(Epub, EPub);

Epub.prototype.open = function () {

    if (typeof this.filename === 'string') {
        Fs.readFile(this.filename, (err, data) => {

            if (!err) {
                this.openEpubBuffer(data);
            }
            else {
                this.emit('error', new Error('Missing file'));
            }
        });
    }
    else if (Buffer.isBuffer(this.filename)) {
        this.openEpubBuffer(this.filename);
    }
    else {
        this.emit('error', new Error('Invalid File Type'));
    }
};

Epub.prototype.openEpubBuffer = function (data) {

    try {
        this.zip = new ZipFile(data);
    }
    catch (error) {
        this.emit('error', new Error('Invalid EPUB file'));
        return;
    }

    if (!this.zip.names || !this.zip.names.length) {
        this.emit('error', new Error('No files in archive'));
        return;
    }

    this.checkMimeType();
};

Epub.prototype.setFile = function (file_id, data) {

    this.zip.writeFile(this.manifest[file_id].href, data);
};

Epub.prototype.saveEpub = function (filename) {

    filename = filename || this.filename;
    this.zip.saveFileSync(filename);
};

Epub.prototype.getEpub = function () {

    return this.zip.jsZip.generate({ type: 'nodeBuffer' });
};

Epub.prototype.getFiles = function (files_id, callback) {

    const manifest = this.manifest;
    const files = [];
    let i = 0;
    const getNextFile = (err, data) => {

        if (err) {
            callback(err, null);
        }
        else {
            files.push({
                id: files_id[i],
                href: manifest[files_id[i]].href,
                'media-type': manifest[files_id[i]]['media-type'],
                data: data
            });
            if (files.length === files_id.length) {
                callback(null, files);
            }
            else {
                i = i + 1;
                this.getFile(files_id[i], getNextFile);
            }
        }
    };

    if (i < files_id.length) {

        this.getFile(files_id[i], getNextFile);
    }
    else {
        callback(null, files);
    }
};

Epub.prototype.getCSSFiles = function (callback) {

    const cssFiles = [];
    const manifest = this.manifest;
    const CssCount = this.getCssCount();

    for (const entry in manifest) {
        if (manifest.hasOwnProperty(entry)) {
            if (manifest[entry]['media-type'] === 'text/css') {
                this.getFile(manifest[entry].id, (err, data) => {

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

Epub.prototype.getFilesMetaData = function () {

    const metadata = {
        cssFiles: [],
        imageFiles: [],
        xhtmlFiles: []
    };
    const manifest = this.manifest;

    let entry;
    for (entry in manifest) {
        if (manifest.hasOwnProperty(entry) && manifest[entry].hasOwnProperty('media-type')) {
            if (manifest[entry]['media-type'] === 'text/css') {
                metadata.cssFiles.push(manifest[entry]);
            }
            else if (manifest[entry]['media-type'] === 'image/jpeg' || manifest[entry]['media-type'] === 'image/png') {
                metadata.imageFiles.push(manifest[entry]);
            }
            else if (manifest[entry]['media-type'] === 'application/xhtml+xml') {
                metadata.xhtmlFiles.push(manifest[entry]);
            }
        }
    }

    return metadata;
};

Epub.prototype.getCoverImageID = function () {

    let entry;
    const manifest = this.manifest;
    for (entry in manifest) {
        if (manifest.hasOwnProperty(entry) && manifest[entry].hasOwnProperty('media-type')) {
            if ( (manifest[entry]['media-type'] === 'image/jpeg' || manifest[entry]['media-type'] === 'image/png')
                && ( entry.match('.*cover.*') || manifest[entry].href.match('.*cover.*'))) {
                return manifest[entry].id;
            }
        }
    }
    return null;
};

module.exports = Epub;

