// angulargrid 0.0.1 

//module to create wookmark and pinterest like dynamic grid with angular
angular.module('angularGrid').directive('angularGrid', ['$timeout', 
    function ($timeout) {
        //defaults for plugin
        var defaults = {
                            gridWidth: 250, //minumum width of a grid, this may increase to take whole space of container 
                            gutterSize: 10 //spacing between two grid
                        };

        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var $element = $(element[0]),
                    win = $(window),
                    modalKey = attrs.wookmark,
                    modal = scope[modalKey],
                    listElms,
                    timeoutPromise,
                    cols,
                    lastRowBottom = [], //A container to store last rows bottom values
                    colWidth;

                //get the user input options
                var options = {};
                defaults.keys().forEach(key){
                    options[key] = attrs[key]
                }

                options = angular.extend(userOptions,defaults);


                //function to get column width and number of columns
                function getSetColWidth() {
                    var contWidth = $element.width();

                    console.log(contWidth);

                    cols = Math.floor(contWidth / (options.gridWidth + options.spacing));

                    var remainingSpace = (contWidth % (options.gridWidth + options.spacing)) + options.spacing;

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
                    listElms.each(function () {
                        var $this = $.single(this),
                            height;
                        //if element has expanded class caculate height by its clone
                        if ($this.hasClass('expanded')) {
                            var clone = $this.clone();
 //remove form element before finding height                          
                            clone.removeClass('expanded').find('.note-update-form').remove();
                            clone.find('.note-wrap').removeClass('hide');
                            height = clone.insertAfter($this).height();
                            clone.remove();
                        } else {
                            height = $.single(this).height();
                        }
                        listElmHeights.push(height);
                    });

                    $timeout(function () {
                        listElms.removeClass('no-transition');

                        //set new positions

                        listElms.each(function (idx) {
                            var height = listElmHeights[idx],
                                top = Math.min.apply(Math, lastRowBottom),
                                col = lastRowBottom.indexOf(top);

                            //update lastRowBottom value
                            lastRowBottom[col] = top + height + options.spacing;

                            //set top and left of list items
                            var left = col * (colWidth + options.spacing);
                            $.single(this).css({
                                height: height + 'px',
                                top: top + 'px',
                                left: left + 'px'
                            });

                        });

                        //set the height of container
                        $element.height(Math.max.apply(Math, lastRowBottom));

                    });
                }

                //watch on modal key
                scope.$watch(modalKey, function () {
                    
                    if (scope.closingView) return;
                    $timeout(function () {
                        listElms = $element.find('li');
                        reflowGrids();
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