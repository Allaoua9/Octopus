/**
 * Created by XoX on 31/03/2016.
 */
'use strict';

angular
    .module('EpubControllers', [
        'EpubServices'
    ])
    .controller('EpubUploadController', [ 'Epub',

        function (epub) {

            var vm = this;

            vm.uploadEpub = function (file, error) {
                vm.filename = file.name;
                if (file) {
                    epub.uploadEpub(file,
                    function (response) {

                    },
                    function (response) {

                    });
                }
            };
        }
    ]);
