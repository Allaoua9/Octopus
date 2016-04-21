/**
 * Created by XoX on 16/03/2016.
 */
'use strict';

const Lab = require('lab').script();
const Code = require('code');
const EpubWatermarker = require('../lib/epubWatermarker.js');
const Fs = require('fs');


Lab.experiment('Testing the watermark embder: ', () => {

    const path = './test/file/book/book.epub';
    const watermarker = new EpubWatermarker();
    let watermarkedEpubData = null;

    Lab.test('It Should create a watermarked epub file given a watermark and a cover epub file', { timeout: 10000 }, (done) => {

        const watermarks = {
            cssWatermarks: [
                {
                    id: 'item30',
                    watermark: '123430'
                },
                {
                    id: 'item31',
                    watermark: '123431'
                }
            ],
            imageWatermarks: {
                ids: ['item1', 'item3', 'item4', 'item5', 'item6', 'item7', 'item8', 'item9'],
                watermark: 'Hello World !'
            }
        };

        Fs.readFile(path, (err, data) => {

            if (!err) {
                watermarker.embedWatermark(data, watermarks, null, (err, watermarkedData) => {

                    Code.expect(err).to.not.exist();
                    Code.expect(Buffer.isBuffer(watermarkedData)).to.be.true();
                    watermarkedEpubData = watermarkedData;
                    done();
                });
            }
        });
    });

    Lab.test('It should extract the watermark from the epub', { timeout: 10000 }, (done) => {

        const fileIDs = {
            cssIDs: ['item30', 'item31'],
            imagesIDs: ['item1', 'item3', 'item4', 'item5', 'item6', 'item7', 'item8', 'item9']
        };

        watermarker.extractWatermark(watermarkedEpubData, fileIDs, (err, watermarks) => {

            Code.expect(err).to.not.exist();
            Code.expect(watermarks.cssWatermarks[0].watermark).to.equal('0x123430');
            Code.expect(watermarks.cssWatermarks[1].watermark).to.equal('0x123431');
            Code.expect(watermarks.imageWatermarks[0].data).to.equal('Hello World !');
            //console.log(watermarks.imageWatermarks);
            done();
        });
    });

    Lab.test('It Should throw an error when a file Id does not exist', (done) => {

        const watermarks = {
            cssWatermarks: [
                {
                    id: 'item999',
                    watermark: '1234'
                }
            ]
        };

        Fs.readFile(path, (err, data) => {

            if (!err) {
                watermarker.embedWatermark(data, watermarks, null, (err, watermarkedData) => {

                    Code.expect(err).to.exist();
                    Code.expect(watermarkedData).to.be.null();
                    done();
                });
            }
        });
    });
});

exports.lab = Lab;
