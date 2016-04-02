/**
 * Created by XoX on 31/03/2016.
 */
'use strict';

angular
    .module('EpubControllers', [
        'EpubServices'
    ])
    .controller('EpubUploadController', [ '$location', 'Epub',

        function ($location, epub) {

            var vm = this;
            vm.error = null;
            vm.load = {};
            vm.load.loading = false;
            vm.load.progress = 0;

            vm.uploadEpub = function (file, error) {

                if (file) {

                    epub.uploadEpub(file,
                    function (response) {
                        vm.load.progress = false;
                        $location.path('/epub/' + response.data.id);
                    },
                    function (response) {
                        vm.error = response.data;
                    },
                    function (evt) {
                        vm.load.loading = true;
                        vm.load.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                    });
                }
                else {
                    switch (error[0].$error){
                        case 'maxSize':
                            vm.error = {
                                statusCode: 400,
                                error: 'Bad request',
                                message: 'File size must not exceed 10 Mb'
                            };
                            break;
                    }
                }
            };
        }
    ])
    .controller('EpubController', ['$routeParams', 'Epub',

        function ($routeParams, epubService) {

            var vm = this;

            vm.epub = {};
            vm.epub.id = $routeParams.epubID;
            vm.error = null;

            epubService.getEpubMetaData(vm.epub.id,
                function (epub) {
                    vm.epub = epub;
                    if (epub.image) {
                        vm.epub.image = '/epub/' + epub.id + '/item/' + epub.image;
                    }
                },
                function (error) {
                    vm.error = error;
                }
            );
        }
    ]);
