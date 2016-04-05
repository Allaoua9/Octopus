/**
 * Created by XoX on 05/04/2016.
 */
'use strict';

angular
    .module('OctopusError', [ ])
    .directive('octopusError', function () {

        return {
            restrict: 'E',
            scope: {
                error : '=error'
            },
            templateUrl: 'app/directives/octopus-error/templates/error.html'
        }
    });