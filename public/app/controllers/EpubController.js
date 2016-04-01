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
            vm.filename= '';
            vm.error = null;

            vm.uploadEpub = function (file, error) {

                vm.filename = file.name;
                if (file) {
                    epub.uploadEpub(file,
                    function (response) {
                        $location.path('/epub/' + response.data.id);
                    },
                    function (response) {
                        vm.error = response.data;
                    });
                }
                else {
                    vm.error = error;
                }
            };
        }
    ])
    .controller('EpubController', ['$routeParams', 'Epub',

        function ($routeParams, epubService) {

            var vm = this;

            vm.epub = {};
            vm.epub.id = $routeParams.epubID;
            vm.epub.image = '../images/no-image.png';
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
