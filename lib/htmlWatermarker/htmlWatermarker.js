/**
 * Created by XoX on 22/04/2016.
 */
'use strict';

const Lwip = require('lwip');
const QrCode = require('../qrCode/qrCodeWrapper');
const Fs = require('fs');

const HtmlWatermarker = function () {

};

HtmlWatermarker.prototype.embedWatermark = function (htmlFiles, watermark, callback) {


};

HtmlWatermarker.prototype.extractWatermark = function (htmlFiles, callback) {


};

HtmlWatermarker.prototype._imageToPixelArray = function (image) {


};
/*(() => {

    console.log('Hello');
    Fs.readFile('./qr.png', (err, data) => {

        console.log('Qr Code generated');
        if (!err) {
            Lwip.open(data, 'png', (err, image) => {

                if (!err) {
                    console.log(image.getPixel(50, 50));
                }
                else {
                    console.log(err);
                }
            });
        }
        else {
            console.log(err);
        }
    });
})();*/


module.exports.HtmlWatermarker = HtmlWatermarker;

