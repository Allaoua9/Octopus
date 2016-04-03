/**
 * Created by XoX on 26/03/2016.
 */
'use strict';

const Lab = require('lab').script();
const Code = require('code');
const TempFilesMannager = require('../lib/handlers/tempFilesManager.js').TempFilesMannager;

Lab.experiment('Testing Temporary files mannagement', () => {

    const tempFiles = new TempFilesMannager();
    const data = new Buffer('Hello World');
    let id = null;

    Lab.test('It should create a temporary file', (done) => {

        tempFiles.createFile(data, (err, fileID) => {

            Code.expect(err).to.not.exist();
            id = fileID;
            Code.expect(id).to.exist();
            done();
        });
    });

    Lab.test('It should retrieve the created file', (done) => {

        tempFiles.getFile(id, (err, retrivedData) => {

            Code.expect(err).to.not.exist();
            Code.expect(retrivedData.toString()).to.equal('Hello World');
            done();
        });
    });

    Lab.test('It Should remove the created file', (done) => {

        tempFiles.cleanFile(id, (err) => {

            Code.expect(err).to.not.exist();
            done();
        });
    });

    Lab.test('It should not create error when attempting to remove a not existing file', (done) => {

        tempFiles.cleanFile(id, (err) => {

            Code.expect(err).to.not.exist();
            done();
        });
    });

    Lab.test('It should automatically cleanup a created file after the life time has expired', (done) => {

        tempFiles.setLifeTime(5);
        tempFiles.createFile(data, (err, fileID) => {

            Code.expect(err).to.not.exist();
            setTimeout(() => {

                tempFiles.fileExist(fileID, (exist) => {

                    Code.expect(exist).to.be.false();
                    done();
                });
            }, 7);
        });
    });

    Lab.test('It should clean up all the temporary directory', (done) => {

        tempFiles.createFile(data, (err, fileID) => {

            Code.expect(err).to.not.exist();
            tempFiles.cleanAll(() => {

                tempFiles.fileExist(fileID, (exist) => {

                    Code.expect(exist).to.be.false();
                    done();
                });
            });

        });
    });
});




exports.lab = Lab;
