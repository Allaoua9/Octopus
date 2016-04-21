/**
 * Created by XoX on 26/03/2016.
 */
'use strict';

const Fs = require('fs');
const Path = require('path');
const Rimraf = require('rimraf');
const Mkdirp = require('mkdirp');
const TEMP_DIR = require('os').tmpdir();

const TempFilesManager = function (directory, lifeTime) {

    lifeTime = lifeTime || 600000; /* 10 minutes */
    this.lifeTime = lifeTime;
    const appTempDir = directory || 'octopus-files';
    this.tempDir = Path.join(TEMP_DIR, appTempDir);
    // Cleaning Directory before creation
    Rimraf.sync(this.tempDir);

    // Cleaning Temporary files when the process exits
    process.on('beforeExit', (() => {

        Rimraf(this.tempDir, () => {

            Console.log('Temporary files cleaned');
        });
    }).bind(this));

    process.on('exit', (() => {

        Rimraf.sync(this.tempDir);
    }).bind(this));

    process.on('uncaughtException', (() => {

        Rimraf.sync(this.tempDir);
    }).bind(this));
};

TempFilesManager.prototype.createDir = function (callback) {

    const id = Date.now().toString() + Math.random().toString();
    const tempDir = Path.join(this.tempDir, id);

    Mkdirp(tempDir, (err) => {

        if (err) {
            callback(err, null, null);
        }
        else {
            setTimeout( (fileID) => {

                this.cleanDir(fileID, () => { });
            }, this.lifeTime, id);
            callback(null, id, tempDir);
        }
    });
};

TempFilesManager.prototype.cleanDir = function (id, callback) {

    Rimraf(Path.join(this.tempDir, id), callback);
};


TempFilesManager.prototype.createFile = function (data, callback) {

    const id = Date.now().toString() + Math.random().toString();

    const tempDir = Path.join(this.tempDir, id);
    const savePath = Path.join(tempDir, id);

    Mkdirp(tempDir, (err) => {

        if (err) {
            callback(err, null, null);
        }
        else {
            Fs.writeFile(savePath, data, (err) => {

                if (err) {
                    callback(err, null, null);
                }
                else {
                    setTimeout( (fileID) => {

                        this.cleanDir(fileID, () => {});
                    }, this.lifeTime, id);
                    callback(null, id, savePath);
                }
            });
        }
    });
};

TempFilesManager.prototype.getFile = function (id, callback) {

    const path = Path.join(this.tempDir, id, id);
    Fs.readFile(path, (err, data) => {

        callback(err, data);
    });
};

TempFilesManager.prototype.fileExist = function (id, callback) {

    const path = Path.join(this.tempDir, id, id);

    Fs.access(path, Fs.F_OK, (err) => {

        if (!err) {
            callback(true, path);
        }
        else {
            callback(false, null);
        }
    });
};


TempFilesManager.prototype.setLifeTime = function (lifetime) {

    this.lifeTime = lifetime;
};

TempFilesManager.prototype.cleanAll = function (callback) {

    Rimraf(this.tempDir, callback);
};

exports.TempFilesManager = TempFilesManager;
