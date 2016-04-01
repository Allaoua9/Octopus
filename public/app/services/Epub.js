/**
 * Created by XoX on 31/03/2016.
 */
'use strict';

angular
    .module('EpubServices',[
        'ngFileUpload'
    ])
    .constant('API_ROUTES', {
        UPLOAD_EPUB: '/uploadepub',
        GET_EPUB: '/getepub'
    })
    .factory('Epub', [ '$http', 'Upload', 'API_ROUTES',

        function ($http, Upload, API_ROUTES) {

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
                $http.get(API_ROUTES.GET_EPUB)
                    .then(success, error);
            };

            return epub;
        }
    ]);
