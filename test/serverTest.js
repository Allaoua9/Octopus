/**
 * Created by XoX on 13/03/2016.
 */
'use strict';

const Lab = require('lab').script();
const Code = require('code');
const server = require('../index.js').server;
const Fs = require('fs');
const FormData = require('form-data');
const StreamToPromise = require('stream-to-promise');

Lab.experiment('Testing the server and the routes', () => {

    Lab.test('Server should be started', (done) => {

        Code.expect(server.info.started).to.be.not.equal(0);
        Code.expect(server.info.port).to.equal(8888);
        Code.expect(server.info.protocol).to.equal('http');
        done();
    });

    Lab.test('Testing /watermark route handler with valid input', (done) => {

        const fileStream = Fs.createReadStream('./test/file/book/book1.epub');
        /* Creating a FormData object*/
        const form = new FormData();
        form.append('transactionID', 'A3DF2E');
        form.append('authorID', 'A7DF1B');
        form.append('book', fileStream);

        /* Converting the FormData into a Promise */
        StreamToPromise(form).then((payload) => {

            const options = {
                method: 'POST',
                url: '/watermark',
                headers : form.getHeaders(),
                payload : payload
            };

            server.inject(options, (response) => {

                Code.expect(response.result.success).to.be.equal(true);
                Code.expect(response.result.filename).to.be.equal('book1.epub');
                done();
            });
        });
    });

    Lab.test('Testing /watermark route with invalid input', (done) => {

        const fileStream = Fs.createReadStream('./test/file/book/book.epub');
        /* Creating a FormData object*/
        const form = new FormData();
        form.append('transactionID', 'alert()');
        form.append('authorID', 'A2');
        form.append('book', fileStream);

        /* Converting the FormData into a Promise */
        StreamToPromise(form).then((payload) => {

            const options = {
                method: 'POST',
                url: '/watermark',
                headers : form.getHeaders(),
                payload : payload
            };

            server.inject(options, (response) => {

                Code.expect(response.result.error).to.exist();
                done();
            });
        });
    });

    Lab.test('Testing /watermark route with invalid epub file', (done) => {

        const fileStream = Fs.createReadStream('./test/file/book/invalidFile');
        /* Creating a FormData object*/
        const form = new FormData();
        form.append('transactionID', 'A2E1');
        form.append('authorID', 'A2');
        form.append('book', fileStream);

        /* Converting the FormData into a Payload */
        StreamToPromise(form).then((payload) => {

            const options = {
                method: 'POST',
                url: '/watermark',
                headers : form.getHeaders(),
                payload : payload
            };

            server.inject(options, (response) => {

                Code.expect(response.result.error).to.exist();
                Code.expect(response.result.statusCode).to.equal(400);
                Code.expect(response.result.message).to.equal('Invalid file type : Please provide an EPUB document.');
                done();
            });
        });
    });
});

exports.lab = Lab;
