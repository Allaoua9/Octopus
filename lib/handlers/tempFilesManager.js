/**
 * Created by XoX on 26/03/2016.
 */
'use strict';

const Fs = require('fs');
const Path = require('path');
const Rimraf = require('rimraf');
const Mkdirp = require('mkdirp');
const TEMP_DIR = require('os').tmpdir();

const TempFilesMannager = function (lifeTime, directory) {

    lifeTime = lifeTime || 600000; /* 10 minutes */
    this.lifeTime = lifeTime;
    const appTempDir = directory || 'octopus-files';
    this.tempDir = Path.join(TEMP_DIR, appTempDir);
};

TempFilesMannager.prototype.createFile = function (data, callback) {

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

                        this.cleanFile(fileID, () => {});
                    }, this.lifeTime, id);
                    callback(null, id, savePath);
                }
            });
        }
    });
};

TempFilesMannager.prototype.getFile = function (id, callback) {

    const path = Path.join(this.tempDir, id, id);
    Fs.readFile(path, (err, data) => {

        callback(err, data);
    });
};

TempFilesMannager.prototype.fileExist = function (id, callback) {

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

TempFilesMannager.prototype.cleanFile = function (id, callback) {

    this.fileExist(id, (exist, path) => {

        if (exist) {
            Fs.unlink(path, (err) => {

                if (err) {
                    callback(err);
                }
                else {
                    callback(null);
                }
            });
        }
        else {
            callback(null);
        }
    });
};

TempFilesMannager.prototype.setLifeTime = function (lifetime) {

    this.lifeTime = lifetime;
};

TempFilesMannager.prototype.cleanAll = function () {

    Rimraf(this.tempDir, () => { });
};

exports.TempFilesMannager = TempFilesMannager;
