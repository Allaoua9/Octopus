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

            epub.uploadEpub = function (file, success, error, evt) {

                Upload.upload({
                    url: API_ROUTES.UPLOAD_EPUB,
                    data: {
                        book: file
                    }
                }).then(success, error, evt);
            };

            epub.getEpub = function (fileID, success, error) {
                $http.get(API_ROUTES.DOWNLOAD_EPUB)
                    .then(success, error);
            };

            epub.getEpubMetaData = function (epubID, success, error) {
                epub = Restangular.one('epub', epubID);
                epub.get().then(success, error);
            };

            return epub;
        }
    ]);
