/**
 * Created by XoX on 05/04/2016.
 */
'use strict';

angular
    .module('OctopusLoading', [ ])
    .directive('octopusLoading', function () {

        return {
            restrict: 'E',
            scope: {
                load: '='
            },
            templateUrl: 'app/directives/octopus-loading/templates/loading.html'
        }
    });
