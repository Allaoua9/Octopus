/**
 * Created by XoX on 19/04/2016.
 */
'use strict';

const Http = require('http');
const Fs = require('fs');
const QueryString = require('querystring');
const FormData = require('form-data');


const createQrCode = function (data, size, path, callback) {

    const query = {
        data: data,
        size: size
    };

    const queryString = QueryString.stringify(query);

    const options = {
        host: 'api.qrserver.com',
        path: '/v1/create-qr-code/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': queryString.length
        }
    };

    const request = Http.request(options, (response) => {

        if (response.statusCode === 200) {
            const file = Fs.createWriteStream(path);

            response.pipe(file).on('finish', () => {

                callback(null, path);
            });
        }
        else {
            const error =  new Error('Failed to create QRCode');
            callback(error, null);
        }
    });

    request.write(queryString);
    request.end();
};

const createQrCodeBuffer = function (data, size, callback) {

    const query = {
        data: data,
        size: size
    };

    const queryString = QueryString.stringify(query);

    const options = {
        host: 'api.qrserver.com',
        path: '/v1/create-qr-code/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': queryString.length
        }
    };

    const request = Http.request(options, (response) => {

        if (response.statusCode === 200) {

            const buffers = [];

            response.on('data', (chunk) => {

                buffers.push(chunk);
            });

            response.on('end', () => {

                callback(null, Buffer.concat(buffers));
            });
        }
        else {
            const error =  new Error('Failed to create QRCode');
            callback(error, null);
        }
    });

    request.write(queryString);
    request.end();
};

const readQrCode = function (path, callback) {

    const form = new FormData();

    form.append('file', Fs.createReadStream(path));

    form.submit('http://api.qrserver.com/v1/read-qr-code/', (err, response) => {

        if (err) {
            callback(err, null);
        }
        else {
            let jsonResponse = '';
            if (response.statusCode === 200) {
                response.on('data', (chunk) => {

                    jsonResponse += chunk;
                });

                response.on('end', () => {

                    callback(null, JSON.parse(jsonResponse));
                });
            }
            else {
                callback(new Error('Failed to reach QrCode server'));
            }
        }
    });
};

const readQrCodeFromBuffer = function (data, callback) {

    const form = new FormData();

    form.append('file', data, { filename: 'qr.png', contentType: 'image/png' });

    form.submit('http://api.qrserver.com/v1/read-qr-code/', (err, response) => {

        if (err) {
            callback(err, null);
        }
        else {
            let jsonResponse = '';
            if (response.statusCode === 200) {
                response.on('data', (chunk) => {

                    jsonResponse += chunk;
                });

                response.on('end', () => {

                    callback(null, JSON.parse(jsonResponse));
                });
            }
            else {
                callback(new Error('Failed to reach QrCode server'));
            }
        }
    });
};

exports.createQrCode = createQrCode;
exports.readQrCode = readQrCode;
exports.createQrCodeBuffer = createQrCodeBuffer;
exports.readQrCodeFromBuffer = readQrCodeFromBuffer;
