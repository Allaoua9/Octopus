/**
 * Created by XoX on 22/04/2016.
 */
'use strict';

const PNG = require('pngjs').PNG;
const Async = require('async');
const Xmldom = require('xmldom');
const _ = require('lodash');

const TEXT_NODE = 3;

const HtmlWatermarker = function () {

};

HtmlWatermarker.prototype.embedWatermark = function (htmlFilesData, watermarkPNG, callback) {

    let textList = [];
    const parsedDocuments = [];
    const domParser = new Xmldom.DOMParser();
    // Generate a list of all html files text
    for (let i = 0; i < htmlFilesData.length; ++i) {
        parsedDocuments[i] = domParser.parseFromString(htmlFilesData[i], 'text/html');
        textList = _.concat(textList, this._createTextList(parsedDocuments[i]));
    }
    // Encode watermark image
    this._encodeImage(watermarkPNG, (err, encodedWatermark) => {

        if (err) {
            callback(err);
        }
        else {
            // Insert watermark image
            this._embedWatermarkIntoTextElements(textList, encodedWatermark, (err) => {

                if (err) {
                    callback(err);
                }
                else {
                    const serializer = new Xmldom.XMLSerializer();
                    const watermarkedHtmlFilesData = [];

                    for (let i = 0; i < parsedDocuments.length; ++i) {
                        const meta = parsedDocuments[i].createElement('meta');
                        meta.setAttribute('http-equiv', 'Content-Type');
                        meta.setAttribute('content', 'text/htmlcharset=utf-8');
                        console.log(parsedDocuments[i].getElementsByTagName('head')[0].appendChild(meta));
                        watermarkedHtmlFilesData[i] = serializer.serializeToString(parsedDocuments[i]);
                    }
                    callback(null, watermarkedHtmlFilesData);
                }
            });
        }
    });

};

HtmlWatermarker.prototype._embedWatermarkIntoTextElements = function (textList, encodedWatermark, callback) {

    let data = null;
    let k = 0;
    let buf1 = null;
    let buf2 = null;
    //let inserted = false;
    for (let i = 0; i < textList.length; ++i) {
        data = new Buffer(textList[i].data);
        for (let j = 0; j < data.length; ++j) {
            if (data[j] === 0x20) {
                buf1 = data.slice(0, j);
                buf2 = data.slice(j, data.length);

                data = Buffer.concat([buf1, encodedWatermark[k], buf2]);
                j = j + encodedWatermark[k].length;

                k = k + 1;
                if (k >= encodedWatermark.length) {
                    k = 0;
                }
            }
        }
        textList[i].data = data.toString();
    }

    callback(null);
};

HtmlWatermarker.prototype._encodeImage = function (imageData, callback) {

    const image = new PNG();
    const encodedImageBuffers = [];

    image.parse(imageData, (err) => {

        if (err) {
            callback(err);
        }
        else {
            const imageBufferLength = (image.width * image.height);
            for (let i = 0; i < imageBufferLength; ++i) {

                if (image.data[i * 4] >= 128) {
                    encodedImageBuffers.push(new Buffer([0xe2, 0x80, 0x8b], 'utf8'));
                }
                else {
                    encodedImageBuffers.push(new Buffer([0xe2, 0x80, 0x8c], 'utf8'));
                }
            }

            callback(null, encodedImageBuffers);
        }
    });
};

HtmlWatermarker.prototype.extractWatermark = function (htmlFilesData, width, height, callback) {

    let textList = [];
    const parsedDocuments = [];
    const domParser = new Xmldom.DOMParser();
    // Generate a list of all html files text
    for (let i = 0; i < htmlFilesData.length; ++i) {
        parsedDocuments[i] = domParser.parseFromString(htmlFilesData[i], 'text/html');
        textList = _.concat(textList, this._createTextList(parsedDocuments[i]));
    }

    this._extractWatermarkFromTextElements(textList, width, height, (err, encodedWatermarks) => {

        if (err) {
            callback(err);
        }
        else {
            this._decodeImages(encodedWatermarks, width, height, (err, watermarks) => {

                if (err) {
                    callback(err);
                }
                else {
                    callback(null, watermarks);
                }
            });
        }
    });
};

HtmlWatermarker.prototype._extractWatermarkFromTextElements = function (textList, width, height, callback) {

    let data = null;
    let j = 0;
    const encodedWatermarks = [];
    const encodedWatermarkLength = width * height;
    let encodedWatermark = [];
    //let inserted = false;
    for (let i = 0; i < textList.length; ++i) {
        data = new Buffer(textList[i].data);
        j = 0;
        while (j + 3 < data.length) {
            if ( (data[j] === 0xe2) && (data[j + 1] === 0x80) ) {
                if (data[j + 2] === 0x8b) {
                    encodedWatermark.push(1);
                    j = j + 3;
                }
                else if (data[j + 2] === 0x8c){
                    encodedWatermark.push(0);
                    j = j + 3;
                }
                else {
                    j = j + 1;
                }
                if (encodedWatermark.length === encodedWatermarkLength) {
                    encodedWatermarks.push(encodedWatermark);
                    encodedWatermark = [];
                }
            }
            else {
                j = j + 1;
            }
        }
    }

    callback(null, encodedWatermarks);
};

HtmlWatermarker.prototype._decodeImages = function (encodedWatermarks, width, height, callback) {

    const watermarks = [];

    Async.forEachOf(encodedWatermarks, (encodedWatermark, key, done) => {

        const watermarkImage = new PNG({
            width: width,
            height: height,
            colorType: 2
        });

        for (let i = 0; i < encodedWatermark.length; ++i) {
            if (encodedWatermark[i] === 1) {
                watermarkImage.data[4 * i] = 0xff;
                watermarkImage.data[4 * i + 1] = 0xff;
                watermarkImage.data[4 * i + 2] = 0xff;
                watermarkImage.data[4 * i + 3] = 0xff;
            }
            else if (encodedWatermark[i] === 0) {
                watermarkImage.data[4 * i] = 0x00;
                watermarkImage.data[4 * i + 1] = 0x00;
                watermarkImage.data[4 * i + 2] = 0x00;
                watermarkImage.data[4 * i + 3] = 0xff;
            }
        }

        const imageBuffers = [];
        const imageStream = watermarkImage.pack();

        imageStream.on('data', (chunk) => {

            imageBuffers.push(chunk);
        });

        imageStream.on('end', () => {

            watermarks[key] = Buffer.concat(imageBuffers);
            done();
        });

    }, (err) => {

        if (err) {
            callback(err);
        }
        else {
            callback(null, watermarks);
        }
    });
};

HtmlWatermarker.prototype._createTextList = function (doc) {

    let textList = [];
    let extractedTextList = [];

    const body = doc.documentElement.getElementsByTagName('body');

    for (let i = 0; i < body.length; ++i) {
        extractedTextList = this._getTextListFromElement(body[i]);
        textList = _.concat(textList, extractedTextList);
    }

    return textList;
};

HtmlWatermarker.prototype._getTextListFromElement = function (element) {

    let list = [];
    let extractedList = [];
    if (element.nodeType === TEXT_NODE) {
        list = _.concat(list, element);
    }
    else {

        for (let i = 0; i < element.childNodes.length; ++i) {
            extractedList = this._getTextListFromElement(element.childNodes[i]);
            list = _.concat(list, extractedList);
        }
    }
    return list;
};

/*const domParser = new Xmldom.DOMParser();
 const serializer = new Xmldom.XMLSerializer();

 const doc = domParser.parseFromString(htmlFile, 'text/html');
 const text = doc.documentElement.getElementsByTagName('p')[0].childNodes[0] ;
 const buf = new Buffer(text.data);
 console.log(buf);
 const buf2 = new Buffer([0xe2, 0x80, 0x8b]);

 const buf3 = Buffer.concat([buf, buf2]);

 text.data = buf3.toString();
 //console.log(doc.documentElement.getElementsByTagName('p')[0].childNodes[0].data);
 return serializer.serializeToString(doc);*/



/*
const domParser = new Xmldom.DOMParser();

const doc = domParser.parseFromString(htmlFile, 'text/html');
const text = doc.documentElement.getElementsByTagName('p')[0].childNodes[0] ;
const buf = new Buffer(text.data);
console.log(buf);
*/



/*HtmlWatermarker.prototype.embedWatermark = function (htmlFilesData, watermarkPNG, callback) {

    const image = new PNG();
    const watermarkedData = [];

    image.parse(watermarkPNG, (err) => {

        if (err) {
            callback(err);
        }
        else {
            Async.forEachOf(htmlFilesData, (htmlFileData, key, done) => {

                const imageBufferLength = (image.width * image.height);

                const watermarkedBuffers = [];
                const index = htmlFileData.indexOf('</html>');
                htmlFileData = htmlFileData.slice(0, index + 7);
                watermarkedBuffers.push(htmlFileData);

                try {
                    for (let i = 0; i < imageBufferLength; ++i) {

                        if (image.data[i * 4] >= 128) {
                            watermarkedBuffers.push(new Buffer([0x11], 'utf8'));
                        }
                        else {
                            watermarkedBuffers.push(new Buffer([0x13], 'utf8'));
                        }
                    }
                }
                catch (error) {
                    done(error);
                }

                watermarkedData[key] = Buffer.concat(watermarkedBuffers);
                done();
            }, (err) => {

                if (err) {
                    callback(err);
                }
                else {
                    callback(null, watermarkedData);
                }
            });
        }
    });
};*/
/*
HtmlWatermarker.prototype.extractWatermark = function (htmlFilesData, width, height, callback) {

    const watermarks = [];

    Async.forEachOf(htmlFilesData, (htmlFileData, key, done) => {

        const watermarkImage = new PNG({
            width: width,
            height: height,
            colorType: 2
        });


        const watermarkBufferLength = width * height;
        const begin = htmlFileData.length - watermarkBufferLength;

        for (let i = 0; i < watermarkBufferLength; ++i) {
            if (htmlFileData[begin + i] === 0x11) {
                watermarkImage.data[4 * i] = 0xff;
                watermarkImage.data[4 * i + 1] = 0xff;
                watermarkImage.data[4 * i + 2] = 0xff;
                watermarkImage.data[4 * i + 3] = 0xff;
            }
            else if ( htmlFileData[begin + i] === 0x13) {
                watermarkImage.data[4 * i] = 0x00;
                watermarkImage.data[4 * i + 1] = 0x00;
                watermarkImage.data[4 * i + 2] = 0x00;
                watermarkImage.data[4 * i + 3] = 0xff;
            }
            else {
                watermarkImage.data[4 * i] = 0x80;
                watermarkImage.data[4 * i + 1] = 0x80;
                watermarkImage.data[4 * i + 2] = 0x80;
                watermarkImage.data[4 * i + 3] = 0xff;
            }
        }

        const imageBuffers = [];
        const imageStream = watermarkImage.pack();

        imageStream.on('data', (chunk) => {

            imageBuffers.push(chunk);
        });

        imageStream.on('end', () => {

            watermarks[key] = Buffer.concat(imageBuffers);
            done();
        });

    }, (err) => {

        if (err) {
            callback(err);
        }
        else {
            callback(null, watermarks);
        }
    });
};*/

module.exports.HtmlWatermarker = HtmlWatermarker;

