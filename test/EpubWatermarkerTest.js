/**
 * Created by XoX on 16/03/2016.
 */
'use strict';

const Lab = require('lab').script();
const Code = require('code');
const EpubWatermarker = require('../lib/epubWatermarker.js');
const Fs = require('fs');

Lab.experiment('Testing the watermark embder: ', () => {

    Lab.test('It Should create a watermarked epub file given a watermark and a cover epub file', (done) => {

        const path = './test/file/book/book.epub';
        const watermark = {
            clientID: '123456',
            ownership: 'A3BDE1C2'
        };
        const newPath = './test/file/book/book-watermarked.epub';

        const watermarker = new EpubWatermarker();

        watermarker.embedWatermark(path, watermark, newPath, (err) => {

            Code.expect(err).to.not.exist();
            Fs.access(newPath, Fs.F_OK, (err) => {

                Code.expect(err).to.not.exist();
                done();
            });
        });
    });
});

exports.lab = Lab;
