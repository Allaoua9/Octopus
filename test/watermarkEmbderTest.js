/**
 * Created by XoX on 16/03/2016.
 */
'use strict';

const Lab = require('lab').script();
const Code = require('code');
const Embder = require('../lib/watermarkEmbder');
const Fs = require('fs');

Lab.experiment('Testing the watermark embder', () => {

    Lab.test('Should create a watermarked epub file given a watermark and a cover epub file', (done) => {

        const path = './test/file/book/book.epub';
        const watermark = {
            transactionID: 'A3B3FEA4',
            authorID: 'A3BDE1C2'
        };
        Embder.embed(path, watermark, (err, newPath) => {

            Code.expect(err).to.not.exist();
            Fs.access(newPath, Fs.F_OK, (err) => {

                Code.expect(err).to.not.exist();
                done();
            });

        });

    });
});

exports.lab = Lab;
