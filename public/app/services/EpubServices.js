/**
 * Created by XoX on 31/03/2016.
 */
'use strict';

angular
    .module('EpubServices',[
        'ngFileUpload',
        'restangular'
    ])
    .constant('API_ROUTES', {
        UPLOAD_EPUB: '/epub/upload',
        DOWNLOAD_EPUB: '/epub/download'
    })
    .factory('Epub', [ '$http', 'Upload', 'Restangular', 'API_ROUTES',

        function ($http, Upload, Restangular, API_ROUTES) {

            var epub = {};

            epub.uploadEpub = function (file, successCallback, errorCallback, evt) {

                Upload.upload({
                    url: API_ROUTES.UPLOAD_EPUB,
                    data: {
                        book: file
                    }
                }).then(successCallback, errorCallback, evt);
            };

            epub.getEpub = function (epubID, successCallback, errorCallback) {
                $http.get(API_ROUTES.DOWNLOAD_EPUB)
                    .then(successCallback, errorCallback);
            };

            epub.getEpubMetaData = function (epubID, successCallback, errorCallback) {
                var epub = Restangular.one('epub', epubID);
                epub.get().then(successCallback, errorCallback);
            };

            epub.getFilesMetaData = function (epubID, successCallback, errorCalback) {

                var metadata = Restangular.one('epub', epubID).one('filesmetadata');
                metadata.get().then(successCallback, errorCalback);
            };

            return epub;
        }
    ]);
