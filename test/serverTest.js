/**
 * Created by XoX on 13/03/2016.
 */
'use strict';

const Lab = require('lab').script();
const Code = require('code');
const server = require('../server.js').server;
const Fs = require('fs');
const FormData = require('form-data');
const StreamToPromise = require('stream-to-promise');

Lab.experiment('Testing the server and the routes', () => {

    let watermarkedEpubId;
    let epubId;

    Lab.test('Server should be started', (done) => {

        Code.expect(server.info.started).to.not.equal(0);
        Code.expect(server.info.port).to.equal(8888);
        Code.expect(server.info.protocol).to.equal('http');
        done();
    });

    Lab.test('It Should upload Epub file and save it in a temporary folder and return the epub identifier to the user', (done) => {

        const fileStream = Fs.createReadStream('./test/file/book/book.epub');
        /* Creating a FormData object*/
        const form = new FormData();
        form.append('book', fileStream);

        StreamToPromise(form).then((payload) => {

            const options = {
                method: 'POST',
                url: '/uploadepub',
                headers : form.getHeaders(),
                payload : payload
            };

            server.inject(options, (response) => {

                Code.expect(response.result.success).to.equal(true);
                Code.expect(response.result.id).to.exist();
                epubId = response.result.id;
                /*Code.expect(response.result.filename).to.equal('book.epub');
                Code.expect(response.result.content.cssFiles.length).to.equal(3);
                Code.expect(response.result.content.imageFiles.length).to.equal(28);
                Code.expect(response.result.content.xhtmlFiles.length).to.equal(1);*/
                done();
            });
        });
    });

    Lab.test('It should get metadata about the epub file', (done) => {

        const options = {
            method: 'GET',
            url: '/epub/' + epubId
        };

        server.inject(options, (response) => {

            Code.expect(response.result.id).to.equal(epubId);
            Code.expect(response.result.image).to.equal('/getItem/item1');
            Code.expect(response.result.title).to.equal('Alice\'s Adventures in Wonderland');
            Code.expect(response.result.author).to.equal('Lewis Carroll');
            Code.expect(response.result.language).to.equal('en');
            Code.expect(response.result.data).to.equal('2006-08-12');
            Code.expect(response.result.subject).to.equal('Fantasy');
            done();
        });
    });

    Lab.test('It Should get an item from the epub file', (done) => {

        const options = {
            method: 'GET',
            url: '/epub/' + epubId + '/' + 'item1'
        };

        server.inject(options, (response) => {

            Code.expect(response.statusCode).to.equal(200);
            done();
        });

    });

    Lab.test('It Should respond with 404 not found', (done) => {

        const options = {
            method: 'GET',
            url: '/epub/' + epubId + '/' + 'item999'
        };

        server.inject(options, (response) => {

            Code.expect(response.statusCode).to.equal(404);
            done();
        });

    });

    Lab.test('Testing /watermark route handler with valid input', (done) => {

        const fileStream = Fs.createReadStream('./test/file/book/book.epub');
        /* Creating a FormData object*/
        let options = null;
        const form = new FormData();
        form.append('book', fileStream);

        StreamToPromise(form).then((payload) => {

            options = {
                method: 'POST',
                url: '/uploadepub',
                headers : form.getHeaders(),
                payload : payload
            };

            server.inject(options, (uploadResponse) => {

                const epubID = uploadResponse.result.id;
                options = {
                    method: 'POST',
                    url: '/watermark/' + epubID.toString(),
                    payload : {
                        watermarks: {
                            cssWatermarks: [
                                {
                                    id: 'item30',
                                    watermark: 1234
                                }
                            ]
                        }
                    }
                };
                server.inject(options, (watermarkResponse) => {

                    Code.expect(watermarkResponse.result.success).to.equal(true);
                    Code.expect(watermarkResponse.result.id).to.exist();
                    watermarkedEpubId = watermarkResponse.result.id;
                    done();
                });
            });
        });

    });

    Lab.test('Testing /extractwatermark route handler', (done) => {

        const options = {
            method: 'POST',
            url: '/extractwatermark/' + watermarkedEpubId,
            payload: {
                fileIDs : {
                    cssIDs: [ 'item30' ]
                }
            }
        };

        server.inject(options, (watermarkResponse) => {

            Code.expect(watermarkResponse.result.cssWatermarks[0].id).to.equal('item30');
            Code.expect(watermarkResponse.result.cssWatermarks[0].watermark).to.equal(1234);
            done();
        });
    });

    /*Lab.test('Testing /watermark route with invalid input', (done) => {

        const fileStream = Fs.createReadStream('./test/file/book/book.epub');
        /!* Creating a FormData object*!/
        const form = new FormData();
        form.append('clientID', 'alert()');
        form.append('ownership', 'A2');
        form.append('book', fileStream);

        /!* Converting the FormData into a Promise *!/
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
        /!* Creating a FormData object*!/
        const form = new FormData();
        form.append('clientID', '1234');
        form.append('ownership', 'A2');
        form.append('book', fileStream);

        /!* Converting the FormData into a Payload *!/
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
                Code.expect(response.result.message).to.equal('Invalid EPUB file');
                done();
            });
        });
    });*/
});

exports.lab = Lab;
