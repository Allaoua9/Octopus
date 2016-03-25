/**
 * Created by XoX on 16/03/2016.
 */
'use strict';

const Lab = require('lab').script();
const Code = require('code');
const Epub = require('../lib/epub.js');

Lab.experiment('Testing the EPUB parser', () => {

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
