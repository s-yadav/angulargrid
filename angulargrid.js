/*
    angularGrid.js v 0.1.2
    Author: Sudhanshu Yadav
    Copyright (c) 2015 Sudhanshu Yadav - ignitersworld.com , released under the MIT license.
    Demo on: http://ignitersworld.com/lab/angulargrid/demo1.html
    Documentation and download on https://github.com/s-yadav/angulargrid 
*/

/* module to create pinterest like responsive masonry grid system for angular */
;(function (angular, window, undefined) {
    //defaults for plugin
    var defaults = {
        gridWidth: 300, //minumum width of a grid, this may increase to take whole space of container 
        gutterSize: 10, //spacing between two grid,
        refreshOnImgLoad: true // to make a refresh on image load inside container
    };

    var single = (function () {
        var $elm = angular.element(window);
        return function (elm) {
            $elm[0] = elm;
            return $elm;
        };
    }());

    //function to check if image is loaded
    function imageLoaded(img) {
        return img.complete && (typeof img.naturalWidth === "undefined" || img.naturalWidth !== 0);
    }

    //function to covert domlist to array
    function domToAry(list) {
        return Array.prototype.slice.call(list);
    }

    //add required css
    angular.element(document.head).append('<style>' +
        '.ag-no-transition{' +
        '-webkit-transition: none !important;' +
        'transition: none !important; visibility:hidden; opacity:0;' +
        '}' + '</style>');

    angular.module('angularGrid', []).directive('angularGrid', ['$timeout', '$window', '$q', 'angularGridInstance',
    function ($timeout, $window, $q, angularGridInstance) {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
                    var domElm = element[0],
                        win = angular.element($window),
                        agId = attrs.angularGridId,
                        modalKey = attrs.angularGrid,
                        listElms,
                        timeoutPromise,
                        cols,
                        lastRowBottom = [], //A container to store last rows bottom values
                        colWidth;

                    //get the user input options
                    var options = {
                        gridWidth: attrs.gridWidth ? parseInt(attrs.gridWidth) : defaults.gridWidth,
                        gutterSize: attrs.gutterSize ? parseInt(attrs.gutterSize) : defaults.gutterSize,
                        refreshOnImgLoad: attrs.refreshOnImgLoad == "false" ? false : true
                    };


                    //function to get column width and number of columns
                    function getSetColWidth() {
                        var contWidth = domElm.offsetWidth;

                        cols = Math.floor(contWidth / (options.gridWidth + options.gutterSize));

                        var remainingSpace = (contWidth % (options.gridWidth + options.gutterSize)) + options.gutterSize;

                        colWidth = options.gridWidth + Math.floor(remainingSpace / cols);

                        //set width of each list
                        listElms.css({
                            width: colWidth + 'px',
                            height: 'auto'
                        });

                        //initialize listRowBottom
                        lastRowBottom.length = 0;
                        for (var i = 0; i < cols; i++) {
                            lastRowBottom.push(0);
                        }

                        return colWidth;
                    }


                    //function to reflow grids
                    function reflowGrids() {
                        //remove transition

                        //claclulate and set width of all element
                        var colWidth = getSetColWidth(),
                            i, ln;

                        //if image actual width and actual height is defined update image size so that it dosent cause reflow on image load
                        domToAry(listElms.find('img')).forEach(function (img) {
                            var $img = angular.element(img);

                            //if image is already loaded don't do anything
                            if ($img.hasClass('img-loaded')) {
                                $img.css('height', '');
                                return;
                            }

                            var actualWidth = $img.attr('actual-width') || $img.attr('data-actual-width'),
                                actualHeight = $img.attr('actual-height') || $img.attr('data-actual-height'),
                                curWidth;

                            if (actualWidth && actualHeight) {
                                curWidth = img.width;
                                height = actualHeight * curWidth / actualWidth;
                                $img.css('height', height + 'px');
                            }
                        });

                        var listElmHeights = [];

                        //get all list items new height
                        var item, $item, clone;
                        for (i = 0, ln = listElms.length; i < ln; i++) {
                            item = listElms[i];
                            $item = single(item);

                            //create clone of item to calculate proper height
                            clone = $item.clone();
                            clone.addClass('ag-no-transition');
                            clone.css('width', colWidth + 'px');
                            $item.after(clone);

                            listElmHeights.push(clone[0].offsetHeight);
                            clone.remove();
                        }

                        //set new positions

                        for (i = 0, ln = listElms.length; i < ln; i++) {
                            item = single(listElms[i]);
                            var height = listElmHeights[i],
                                top = Math.min.apply(Math, lastRowBottom),
                                col = lastRowBottom.indexOf(top);

                            //update lastRowBottom value
                            lastRowBottom[col] = top + height + options.gutterSize;

                            //set top and left of list items
                            var left = col * (colWidth + options.gutterSize);

                            item.css({
                                top: top + 'px',
                                left: left + 'px'
                            });
                        }


                        //set the height of container
                        element.css('height', Math.max.apply(Math, lastRowBottom) + 'px');
                    }

                    //function to handle asynchronous image loading
                    function handleImage() {
                        var reflowPending = false;
                        domToAry(listElms).forEach(function (listItem) {
                            var $listItem = angular.element(listItem),
                                allImg = $listItem.find('img'),
                                loadedImgPromises = [];

                            if (!allImg.length) return;

                            //add image loading class on list item
                            $listItem.addClass('img-loading');

                            domToAry(allImg).forEach(function (img) {
                                var $img = angular.element(img);
                                if (!imageLoaded(img)) {
                                    loadedImgPromises.push($q(function (resolve, reject) {
                                        $img.addClass('img-loading');
                                        img.onload = function () {
                                            if (!reflowPending && options.refreshOnImgLoad) {
                                                reflowPending = true;
                                                $timeout(function () {
                                                    reflowGrids();
                                                    reflowPending = false;
                                                }, 100);
                                            }
                                            $img.removeClass('img-loading').addClass('img-loaded');
                                            resolve();
                                        };
                                        img.onerror = reject;
                                    }));
                                } else {
                                    $img.addClass('img-loaded');
                                }
                            });

                            if (loadedImgPromises.length) {
                                $q.all(loadedImgPromises).then(function () {
                                    $listItem.removeClass('img-loading').addClass('img-loaded');
                                }, function () {
                                    $listItem.removeClass('img-loading').addClass('img-loaded');
                                });
                            } else {
                                $listItem.removeClass('img-loading').addClass('img-loaded');
                            }
                        });

                    }

                    //watch on modal key
                    scope.$watch(modalKey, function () {
                        $timeout(function () {
                            listElms = element.children();
                            reflowGrids();
                            //handle images
                            handleImage();

                            $timeout(function () {
                                //add class to element
                                element.addClass('angular-grid');

                                //to handle scroll appearance
                                reflowGrids();
                            });
                        });
                    }, true);

                    //listen window resize event and reflow grids after a timeout
                    win.on('resize', function () {

                        if (timeoutPromise) $timeout.cancel(timeoutPromise);

                        timeoutPromise = $timeout(function () {
                            reflowGrids();
                        }, 100);
                    });

                    //add instance to factory if id is assigned
                    if (agId) angularGridInstance[agId] = {
                        refresh: reflowGrids
                    };
                }
            };
}])
    //a factory to store angulargrid instances which can be injected to controllers or directive
    .factory('angularGridInstance', function () {

        var angularGridInstance = {};

        return angularGridInstance;

    });
}(angular, window));