// angulargrid 0.0.2 

//module to create wookmark and pinterest like dynamic grid with angular
angular.module('angularGrid', []).directive('angularGrid', ['$timeout', '$window',
    function ($timeout, $window) {
        //defaults for plugin
        var defaults = {
            gridWidth: 250, //minumum width of a grid, this may increase to take whole space of container 
            gutterSize: 10 //spacing between two grid
        };

        var single = (function () {
            var $elm = angular.element(window);
            return function (elm) {
                $elm[0] = elm;
                return $elm;
            }
        }());

        //function to check if image is loaded
        function imageLoaded(img) {
            return img.complete && (typeof img.naturalWidth === "undefined" || img.naturalWidth !== 0);
        }

        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var element = element,
                    domElm = element[0],
                    win = angular.element($window),
                    modalKey = attrs.angularGrid,
                    modal = scope.$eval(modalKey),
                    listElms,
                    timeoutPromise,
                    cols,
                    lastRowBottom = [], //A container to store last rows bottom values
                    colWidth;

                //get the user input options
                var options = {};
                Object.keys(defaults).forEach(function (key) {
                    options[key] = attrs[key] ? parseInt(attrs[key]) : defaults[key];
                });


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
                }


                //function to reflow grids
                function reflowGrids() {
                    //remove transition
                    listElms.addClass('no-transition');

                    //claclulate and set width of all element
                    getSetColWidth();


                    var listElmHeights = [];

                    //get all list items new height
                    for (var i = 0, ln = listElms.length; i < ln; i++) {
                        var item = listElms[i];
                        listElmHeights.push(item.offsetHeight);
                    }

                    $timeout(function () {
                        listElms.removeClass('no-transition');

                        //set new positions

                        for (var i = 0, ln = listElms.length; i < ln; i++) {
                            var item = single(listElms[i]),
                                height = listElmHeights[i],
                                top = Math.min.apply(Math, lastRowBottom),
                                col = lastRowBottom.indexOf(top);

                            //update lastRowBottom value
                            lastRowBottom[col] = top + height + options.gutterSize;

                            //set top and left of list items
                            var left = col * (colWidth + options.gutterSize);
                            console.log({
                                height: height + 'px',
                                top: top + 'px',
                                left: left + 'px'
                            });
                            item.css({
                                height: height + 'px',
                                top: top + 'px',
                                left: left + 'px'
                            });
                        }

                        //set the height of container
                        element.css('height', Math.max.apply(Math, lastRowBottom) + 'px');

                    });
                }

                //function to handle asynchronous image loading
                function handleImage() {
                    var allImgs = element.find('img');                 
                    Array.prototype.slice.call(allImgs).forEach(function(img){
                        var    $img = angular.element(img);
                        if (!imageLoaded(img)) {
                            $img.addClass('img-loading');
                            img.onload = function () {
                                if (timeoutPromise) $timeout.cancel(timeoutPromise);
                                timeoutPromise = $timeout(function () {
                                    reflowGrids();
                                }, 100);
                                $img.removeClass('img-loading');
                            }
                        }
                    });
                }

                //watch on modal key
                scope.$watch(modalKey, function () {
                    console.log('changed');
                    $timeout(function () {
                        listElms = element.children();
                        reflowGrids();
                        //handle images
                        handleImage();
                    });
                }, true);

                //listen window resize event and reflow grids after a timeout
                win.on('resize', function () {
                    if (timeoutPromise) $timeout.cancel(timeoutPromise);

                    timeoutPromise = $timeout(function () {
                        reflowGrids();
                    }, 100);
                });

            }
        }
}]);