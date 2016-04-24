/**
 * Created by XoX on 17/04/2016.
 */
'use strict';

const Lab = require('lab').script();
const Code = require('code');
const Path = require('path');

const ImageWatermarker = require('../lib/imageWatermarker/imageWatermarker.js');

Lab.experiment('Testing the Image watermarker', () => {

    const watermarker = new ImageWatermarker(Path.join(__dirname, 'file/images'));

    const images = [
        '1.jpg',
        '2.jpg',
        '3.jpg'
    ];

    Lab.test('It should embed a watermark into images', (done) => {

        Code.expect(watermarker.workingDir).to.equal(Path.join(__dirname, 'file/images'));

        const watermark = 'qr.png';

        watermarker.embedWatermark(images, watermark, 30, (err, result) => {

            Code.expect(err).to.not.exist();
            Code.expect(result.success).to.equal(true);
            Code.expect(result.watermarkHeight).to.equal(70);
            Code.expect(result.watermarkWidth).to.equal(70);
            Code.expect(result.watermarkedImages.length).to.equal(3);
            Code.expect(result.watermarkedImages[0]).to.equal(images[0]);
            Code.expect(result.watermarkRedundancy).to.equal(1);

            done();
        });
    });

    Lab.test('It should extract a watermark from images', (done) => {

        watermarker.extractWatermark(images, 70, 70, (err, result) => {

            Code.expect(err).to.not.exist();
            Code.expect(result.success).to.equal(true);
            Code.expect(result.watermarks.length).to.equal(1);
            Code.expect(result.watermarks[0]).to.equal(Path.join(watermarker.workingDir, 'watermark0.png'));

            done();
        });
    });
});

exports.lab = Lab;
