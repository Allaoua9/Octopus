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

const readQrCode = function (path, callback) {

    Fs.readFile(path, (err, data) => {

        if (err) {
            callback(err, null);
        }
        else {
            readRequest(data);
        }
    });

    const readRequest = function (data) {

        const form = new FormData();

        form.append('file', Fs.createReadStream(path));

        form.submit('http://api.qrserver.com/v1/read-qr-code/', (err, response) => {

            if (err) {
                callback(err, null);
            }
            else {
                let jsonResponse = '';
                response.on('data', (chunk) => {

                    jsonResponse += chunk;
                });

                response.on('end', () => {

                    callback(null, JSON.parse(jsonResponse));
                });
            }
        });
    };


};

exports.createQrCode = createQrCode;
exports.readQrCode = readQrCode;
