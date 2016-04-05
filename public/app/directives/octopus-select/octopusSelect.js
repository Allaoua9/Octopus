/**
 * Created by XoX on 04/04/2016.
 */

'use strict';

angular
    .module('OctopusSelect', [ ])
    .directive('octopusSelect', function () {

        return {
            restrict: 'E',
            transclude: true,
            scope: {
                selected: '='
            },
            template: '<div ng-transclude></div>',
            controller: function ($scope, $element, $attrs) {

                $scope.multiple = 'multiple' in $attrs;

                if ($scope.multiple) {
                    $scope.selectedElement = [];
                    this.select = function (selected, element) {

                        var index = $scope.selected.indexOf(selected);
                        if (index !== -1) {
                            $scope.selected.splice(index, 1);
                            element.removeClass('selected');
                        }
                        else {
                            $scope.selected.push(selected);
                            element.addClass('selected');
                        }
                        $scope.$apply();
                    };
                }
                else {
                    $scope.selectedElement = null;
                    this.select = function (selected, element) {

                        if ($scope.selectedElement) {
                            $scope.selectedElement.removeClass('selected');
                        }
                        element.addClass('selected');
                        $scope.selectedElement = element;

                        $scope.selected = selected;
                        $scope.$apply();
                    };
                }

                return this;
            },
            controllerAs: 'octopusSelectCtrl'
        }
    })
    .directive('octopusOption', function () {

        return {
            restrict: 'E',
            transclude: true,
            require: '^^octopusSelect',
            scope: {
                value: '='
            },
            template: '<div class="octopus-option-wrapper" ng-transclude></div>',
            link: function (scope, element, attr, octopusSelectCtrl) {

                scope.octopusSelectCtrl = octopusSelectCtrl;
                element.bind('click', function () {

                    octopusSelectCtrl.select(scope.value, element);
                });
            }
        };
    });