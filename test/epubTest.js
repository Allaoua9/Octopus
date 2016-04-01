/**
 * Created by XoX on 16/03/2016.
 */
'use strict';

const Lab = require('lab').script();
const Code = require('code');
const Epub = require('../lib/epub.js');
const Fs = require('fs');

Lab.experiment('Testing the EPUB parser', () => {
    
    Lab.test('It should return a file list given an array of IDs', (done) => {

        Fs.readFile('./test/file/book/book.epub', (err, data) => {

            Code.expect(err).to.not.exist();
            const epub = new Epub(data);
            epub.on('end', () => {

                epub.getFiles([ 'item29' ,'item30', 'item31'], (err, files) => {

                    Code.expect(err).to.not.exist();
                    Code.expect(files.length).to.equal(3);
                    Code.expect(files[0].id).to.equal('item29');
                    done();
                });
            });
            epub.parse();
        });
    });

    Lab.test('It should throw error when trying to get a file that does not exist', (done) => {

        Fs.readFile('./test/file/book/book.epub', (err, data) => {

            Code.expect(err).to.not.exist();
            const epub = new Epub(data);
            epub.on('end', () => {

                epub.getFiles([ 'item55' ,'item30', 'item31'], (err, files) => {

                    Code.expect(err.message).to.equal('File not found');
                    done();
                });
            });
            epub.parse();
        });
    });

    Lab.test('It should retrieve data about Css/Image/XHTML Files', (done) => {

        Fs.readFile('./test/file/book/book.epub', (err, data) => {

            Code.expect(err).to.not.exist();
            const epub = new Epub(data);
            epub.on('end', () => {

                const metadata = epub.getFilesMetaData();
                Code.expect(metadata.cssFiles.length).to.equal(3);
                Code.expect(metadata.imageFiles.length).to.equal(28);
                Code.expect(metadata.xhtmlFiles.length).to.equal(1);
                done();
            });
            epub.parse();
        });
    });

    Lab.test('Testing Epub file modification and saving', (done) => {

        const epub = new Epub('./test/file/book/book.epub');

        epub.on('end', () => {

            epub.setFile('item30', 'Hello');
            epub.saveEpub('./test/file/book/book2.epub');
            const epub2 = new Epub('./test/file/book/book2.epub');

            epub2.on('end', () => {

                epub2.getFile('item30', (error, data) => {

                    Code.expect(error).to.not.exist();
                    Code.expect(data.toString()).to.equal('Hello');
                    done();
                });
            });

            epub2.parse();
        });

        epub.parse();

    });

    Lab.test('Testing CSS getters', (done) => {

        const epub = new Epub('./test/file/book/book.epub');
        epub.on('end', () => {

            Code.expect(epub.getCssCount()).to.equal(3);
            epub.getCSSFiles( (err, cssFiles) => {

                Code.expect(err).to.not.exist();
                Code.expect(cssFiles.length).to.equal(3);

                epub.getLargestCSS( (err, cssFile) => {

                    Code.expect(err).to.not.exist();
                    Code.expect(cssFile).to.exist();
                    let css;
                    for (css in cssFiles) {
                        Code.expect(cssFiles[css]['media-type']).to.be.equal('text/css');
                        Code.expect(cssFile.data.length).to.at.least(cssFiles[css].data.length);
                    }
                    Code.expect(cssFile.href).to.equal('19033/0.css');
                    Code.expect(cssFile['media-type']).to.equal('text/css');
                    Code.expect(cssFile.id).to.equal('item30');
                    done();
                });
            });
        });
        epub.parse();
    });
});

exports.lab = Lab;
