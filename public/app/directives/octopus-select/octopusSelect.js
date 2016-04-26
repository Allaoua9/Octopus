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
                selected: '=',
                selectAll: '='
            },
            template: '<div ng-transclude></div>',
            controller: function ($scope, $element, $attrs) {

                $scope.multiple = 'multiple' in $attrs;
                $scope.optionElements = [];
                $scope.optionCollection = [];

                if ($scope.multiple) {
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

                        if ($scope.selectedElement !== null) {
                            $scope.selectedElement.removeClass('selected');
                        }
                        if ($scope.selected !== selected) {
                            element.addClass('selected');
                            $scope.selectedElement = element;
                            $scope.selected = selected;
                        }
                        else {
                            $scope.selected = null;
                        }

                        $scope.$apply();
                    };
                }

                this.addOptionElement = function (element) {

                    $scope.optionElements.push(element);
                };

                this.addOption = function (option) {

                    $scope.optionCollection.push(option);
                };

                this.selectAll = function (value) {

                    if ($scope.multiple) {
                        if (value === true) {
                            $scope.optionElements.forEach(function (element) {

                                element.addClass('selected');
                            });

                            $scope.selected = $scope.optionCollection;
                        }
                        else {
                            $scope.optionElements.forEach(function (element) {

                                element.removeClass('selected');
                            });

                            $scope.selected = [];
                        }
                    }
                };

                $scope.$watch('selectAll', angular.bind(this, function (newValue, oldValue) {

                    if (newValue !== oldValue) {
                        this.selectAll($scope.selectAll);
                    }
                }));

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
                octopusSelectCtrl.addOptionElement(element);
                octopusSelectCtrl.addOption(scope.value);

                element.bind('click', function () {

                    octopusSelectCtrl.select(scope.value, element);
                });
            }
        };
    });