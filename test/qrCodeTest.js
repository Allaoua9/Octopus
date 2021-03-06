/**
 * Created by XoX on 19/04/2016.
 */
'use strict';

const Lab = require('lab').script();
const Code = require('code');
const Path = require('path');
const QrCode = require('../lib/qrCode/qrCodeWrapper.js');

Lab.experiment('Testing QR code generator/reader', () => {

    const qrPath = Path.join(__dirname, '/file/qr.png');
    const data = 'Hello World !';
    let buffer;
    Lab.test('It should generate a qr code image', { timeout: 10000 }, (done) => {

        QrCode.createQrCode(data, '100x100', qrPath, (err, path) => {

            Code.expect(err).to.not.exist();
            done();
        });

    });

    Lab.test('It should read a qr code image', { timeout: 10000 }, (done) => {

        QrCode.readQrCode(qrPath, (err, result) => {

            Code.expect(err).to.not.exist();
            Code.expect(result[0].symbol[0].data).to.equal(data);
            done();
        });

    });

    Lab.test('It should generate a qr code image and return a buffer', { timeout: 10000 }, (done) => {

        QrCode.createQrCodeBuffer(data, '100x100', (err, result) => {

            Code.expect(err).to.not.exist();
            Code.expect(Buffer.isBuffer(result)).to.be.true();
            buffer = result;
            done();
        });
    });

    Lab.test('It should read qr code from buffer', { timeout: 10000 }, (done) => {

        QrCode.readQrCodeFromBuffer(buffer, (err, result) => {

            Code.expect(err).to.not.exist();
            Code.expect(result[0].symbol[0].data).to.equal(data);
            done();
        });
    });
});


exports.lab = Lab;
