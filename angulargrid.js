/*
    angularGrid.js v 0.6.5
    Author: Sudhanshu Yadav
    Copyright (c) 2015-2016 Sudhanshu Yadav - ignitersworld.com , released under the MIT license.
    Demo on: http://ignitersworld.com/lab/angulargrid/
    Documentation and download on https://github.com/s-yadav/angulargrid
*/

/* module to create pinterest like responsive masonry grid system for angular */

;(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    // CommonJS
    module.exports = factory(require('angular'), root);
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['angular'], function (angular) {
        return factory(angular, root);
    });
  } else {
    // Global Variables
    factory(root.angular, root);
  }
}(this, function (angular, window, undefined) {
  "use strict";

  //defaults for plugin
  var defaults = {
    gridWidth: 300, //minumum width of a grid, this may increase to take whole space of container
    gutterSize: 10, //spacing between two grid,
    gridNo: 'auto', // grid number, by default calculate auto matically
    direction: 'ltor', //direction of grid item
    refreshOnImgLoad: true, // to make a refresh on image load inside container
    cssGrid: false,
    performantScroll: false,
    pageSize: 'auto', //decide based on screen size
    scrollContainer: 'body',
    infiniteScrollDelay: 3000,
    infiniteScrollDistance: 100,
  };

  var $ = angular.element;
  var camelCaseToHyphenCase = function(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  };

  //css for the clones
  var cloneCss = {
    visibility: 'hidden',
    opacity: 0,
    top: 0,
    left: 0,
    width: ''
  };

  var single = (function() {
    var $elm = $(window);
    return function(elm) {
      $elm[0] = elm;
      return $elm;
    };
  }());

  //function to check if image is loaded
  function imageLoaded(img) {
    return img.complete && (typeof img.naturalWidth === 'undefined' || img.naturalWidth !== 0);
  }

  //function to covert domlist to array
  function domToAry(list) {
    return Array.prototype.slice.call(list);
  }

  //add required css
  $(document.head).append('<style>' +
    '.ag-no-transition{' +
    '-webkit-transition: none !important;' +
    'transition: none !important;' +
    '} ' +
    '.angular-grid{position : relative;} ' +
    '.angular-grid > *{opacity : 0} ' +
    '.angular-grid > .angular-grid-item{opacity : 1}' + '</style>');

  return angular.module('angularGrid', [])
    .directive('angularGrid', ['$timeout', '$window', '$q', 'angularGridInstance',
      function($timeout, $window, $q, angularGridInstance) {
        return {
          restrict: 'A',
          scope: {
            model: '=angularGrid',
            /** deprecated options ***/
            dep_gridWidth: '=gridWidth',
            dep_gutterSize: '=gutterSize',
            dep_refreshOnImgLoad: '=refreshOnImgLoad',
            dep_direction: '=direction',
            dep_cssGrid: '=cssGrid',
            dep_options: '=angularGridOptions',
            dep_gridNo: '=gridNo',
            dep_agId: '@angularGridId',
            /** deprecated options end***/

            gridNo: '=agGridNo',
            gridWidth: '=agGridWidth',
            gutterSize: '=agGutterSize',
            refreshOnImgLoad: '=agRefreshOnImgLoad',
            direction: '=agDirection',
            cssGrid: '=agCssGrid',
            options: '=agOptions',
            agId: '@',
            pageSize: '=agPageSize',
            performantScroll: '=agPerformantScroll',
            scrollContainer: '@agScrollContainer',
            infiniteScroll: '&agInfiniteScroll',
            infiniteScrollDistance: '=agInfiniteScrollDistance',
            infiniteScrollDelay: '=agInfiniteScrollDelay'
          },
          link: function(scope, element, attrs) {
            var domElm = element[0],
              win = $($window),
              agId = scope.agId || scope.dep_agId, // angularGridId is deprecated
              listElms,
              reflowCount = 0, //to keep tack of times reflowgrid been called
              timeoutPromise;

            element.addClass('angular-grid');



            //get the user input options
            var options;

            //check deprecated options
            ['gridWidth', 'gutterSize', 'refreshOnImgLoad', 'direction', 'options', 'cssGrid','gridNo', 'agId'].forEach(function(key) {
              var depKey = camelCaseToHyphenCase(key);
              var correctKey = 'ag-' + camelCaseToHyphenCase(key);
              if (key == 'options') depKey = "angular-grid-options";
              if (key == 'agId') {
                depKey = "angular-grid-id";
                correctKey = "ag-id";
              }
              if (scope['dep_' + key] !== undefined) {
                if (console && console.warn) console.warn(depKey + ' is deprecated. Use ' + correctKey + ' instead in template.');
              }
            });

            function getOptions() {
              options = {};
              Object.keys(defaults).forEach(function(key) {
                if (scope[key] !== undefined) {
                  options[key] = scope[key];
                } else if (scope['dep_' + key] !== undefined) {
                  options[key] = scope['dep_' + key];
                }
              });
              options = angular.extend({}, defaults, options, scope.options || scope.dep_options);
              if (options.cssGrid) options.gutterSize = 0;
              if (options.pageSize == 'auto') {
                options.pageSize = window.offsetWidth >= 768 ? 2 : 3;
              }
            }

            getOptions();


            /********
            code to allow performant scroll
            *****/
            var scrollNs = {}; //namespace for performantScroll

            function findPos(obj, withRespectTo) {
              withRespectTo = withRespectTo || document.body;
              var curleft = 0,
                curtop = 0;
              if (obj.offsetParent) {
                do {
                  curleft += obj.offsetLeft;
                  curtop += obj.offsetTop;
                  obj = obj.offsetParent;
                } while (obj && obj != withRespectTo);
              }
              return {
                left: curleft,
                top: curtop
              };
            }

            function getScrollContainerInfo() {
              var container = $(document.querySelector(options.scrollContainer)),
                contElm = container[0];

              var $elm = options.scrollContainer === 'body' ? win : container;

              return {
                height: $elm[0].innerHeight || $elm[0].offsetHeight,
                scrollHeight: contElm.scrollHeight,
                startFrom: findPos(domElm, contElm).top,
                $elm: $elm
              };
            }


            //this method check what all elements should be present on dom at specific page
            function calculatePageInfo(listElmPosInfo, scrollBodyHeight, colNo) {

              scrollNs.pageInfo = [{
                from: 0
              }];

              var elmInfo, from, to,
                pageSize = options.pageSize,
                scrollContHeight = scrollNs.scrollContInfo.height,
                pageHeight = scrollContHeight * pageSize,
                totalPages = Math.ceil(scrollBodyHeight / pageHeight),
                pageNo = 0;


              for (pageNo = 0; pageNo < totalPages; pageNo++) {
                for (var idx = 0, ln = listElmPosInfo.length; idx < ln; idx++) {
                  elmInfo = listElmPosInfo[idx];
                  from = pageNo ? pageHeight * pageNo : 0;
                  to = pageHeight * (pageNo + 1);

                  if (elmInfo.bottom < from || elmInfo.top > to) {
                    if (elmInfo.top > to) break;
                  } else {
                    if (!scrollNs.pageInfo[pageNo]) scrollNs.pageInfo[pageNo] = {
                      from: idx
                    };
                    scrollNs.pageInfo[pageNo].to = idx;
                  }
                }
              }

              scrollNs.pageInfo = scrollNs.pageInfo.map(function(page, idx) {
                var fromPage = Math.max(idx - 1, 0),
                  toPage = Math.min(idx + 1, scrollNs.pageInfo.length - 1);
                return {
                  from: scrollNs.pageInfo[fromPage].from,
                  to: scrollNs.pageInfo[toPage].to
                };
              });
            }

            //unbind/bind watchers
            function bindWatchersOnVisible(visibleELm) {
              var itemData, $item, i, ln;
              //unbind watchers from all element
              for (i = 0, ln = listElms.length; i < ln; i++) {
                $item = single(listElms[i]);
                itemData = $item.data();
                if (itemData.$scope) {
                  $item.data('_agOldWatchers', itemData.$scope.$$watchers);
                  itemData.$scope.$$watchers = [];
                }
              }

              //bind watchers on all visible element
              for (i = 0, ln = visibleELm.length; i < ln; i++) {
                itemData = single(visibleELm[i]).data();
                if (itemData.$scope) {
                  itemData.$scope.$$watchers = itemData._agOldWatchers || [];
                  //trigger digest on each child scope
                  itemData.$scope.$digest();
                }
              }
            }

            function refreshDomElm(scrollTop) {
              scrollNs.lastScrollPosition = scrollTop;
              var filteredElm;
              if (scrollNs.isBusy) return;
              var currentPage = 0,
                pageSize = options.pageSize;

              if (scrollTop > scrollNs.scrollContInfo.startFrom + scrollNs.scrollContInfo.height * pageSize) {
                currentPage = Math.floor((scrollTop - scrollNs.scrollContInfo.startFrom) / (scrollNs.scrollContInfo.height * pageSize));
              }
              if (currentPage == scrollNs.lastPage) return;
              scrollNs.lastPage = currentPage;
              var curPageInfo = scrollNs.pageInfo[currentPage];

              if (curPageInfo) {
                element.children().detach();
                filteredElm = Array.prototype.slice.call(listElms, curPageInfo.from, curPageInfo.to + 1);
                bindWatchersOnVisible(filteredElm);
                element.append(filteredElm);
              }
            }


            /********
            code to allow performant scroll end
            *****/

            /***** code for infiniteScroll start ******/
            function reEnableInfiniteScroll() {
              clearTimeout(scrollNs.infiniteScrollTimeout);
              scrollNs.isLoading = false;
            }

            function infiniteScroll(scrollTop) {
              if (scrollNs.isLoading || !scope.model.length) return;
              var scrollHeight = scrollNs.scrollContInfo.scrollHeight,
                contHeight = scrollNs.scrollContInfo.height;

              if (scrollTop >= (scrollHeight - contHeight * (1 + options.infiniteScrollDistance / 100))) {
                scrollNs.isLoading = true;
                scope.infiniteScroll();
                scrollNs.infiniteScrollTimeout = setTimeout(reEnableInfiniteScroll, options.infiniteScrollDelay);
              }
            }
            /***** code for infiniteScroll end ******/

            //scroll event on scroll container element to refresh dom depending on scroll positions
            function scrollHandler() {
              var scrollTop = this.scrollTop || this.scrollY;
              if (options.performantScroll) refreshDomElm(scrollTop);
              if (scope.infiniteScroll) infiniteScroll(scrollTop);
            }

            setTimeout(function() {
              scrollNs.scrollContInfo = getScrollContainerInfo();
              scrollNs.scrollContInfo.$elm.on('scroll', scrollHandler);
            }, 0);

            //function to get column width and number of columns
            function getColWidth() {

              var contWidth = domElm.offsetWidth,
                clone; // a clone to calculate width without transition

              if (options.cssGrid) {
                clone = $(listElms[0]).clone();
                clone.css(cloneCss).addClass('ag-no-transition ag-clone');

                element.append(clone);

                var width = clone[0].offsetWidth;
                clone.remove();

                return {
                  no: width ? Math.floor((contWidth + 12) / width) : 0,
                  width: width
                };
              }

              var colWidth = options.gridNo == 'auto' ? options.gridWidth : Math.floor(contWidth / options.gridNo) - options.gutterSize,
                cols = options.gridNo == 'auto' ? Math.floor((contWidth + options.gutterSize) / (colWidth + options.gutterSize)) : options.gridNo,
                remainingSpace = ((contWidth + options.gutterSize) % (colWidth + options.gutterSize));

              colWidth = colWidth + Math.floor(remainingSpace / cols);

              return {
                no: cols,
                width: colWidth
              };
            }

            //method check for image loaded inside a container and trigger callback
            function afterImageLoad(container, options) {
              var beforeLoad = options.beforeLoad || angular.noop,
                onLoad = options.onLoad || angular.noop,
                isLoaded = options.isLoaded || angular.noop,
                onFullLoad = options.onFullLoad || angular.noop,
                ignoreCheck = options.ignoreCheck || angular.noop,
                allImg = container.find('img'),
                loadedImgPromises = [];

              domToAry(allImg).forEach(function(img) {
                if(!img.src) return;
                beforeLoad(img);
                if (!imageLoaded(img) && !ignoreCheck(img)) {
                  loadedImgPromises.push($q(function(resolve, reject) {
                    img.onload = function() {
                      onLoad(img);
                      resolve();
                    };
                    img.onerror = reject;
                  }));
                } else {
                  isLoaded(img);
                }
              });

              if (loadedImgPromises.length) {
                $q.all(loadedImgPromises).then(onFullLoad, onFullLoad);
              } else {
                setTimeout(function() {
                  onFullLoad();
                }, 0);
              }
            }


            //function to reflow grids
            function reflowGrids() {
              //return if there are no elements
              if(!(listElms && listElms.length )) return;

              reflowCount++;

              //claclulate width of all element
              var colInfo = getColWidth(),
                colWidth = colInfo.width,
                cols = colInfo.no,
                i;

              if (!cols) return;

              //initialize listRowBottom
              var lastRowBottom = [];
              for (i = 0; i < cols; i++) {
                lastRowBottom.push(0);
              }

              //if image actual width and actual height is defined update image size so that it dosent cause reflow on image load
              domToAry(listElms).forEach(function(item) {
                var $item = single(item);

                domToAry($item.find('img')).forEach(function(img) {
                  var $img = $(img);
                  //if image is already loaded don't do anything
                  if ($img.hasClass('img-loaded')) {
                    $img.css('height', '');
                    return;
                  }

                  //set the item width and no transition state so image width can be calculated properly
                  $item.addClass('ag-no-transition');
                  $item.css('width', colWidth + 'px');

                  var actualWidth = $img.attr('actual-width') || $img.attr('data-actual-width'),
                    actualHeight = $img.attr('actual-height') || $img.attr('data-actual-height');

                  if (actualWidth && actualHeight) {
                    $img.css('height', (actualHeight * img.width / actualWidth) + 'px');
                  }

                });
                $item.removeClass('ag-no-transition');
              });

              //get all list items new height
              var clones = listElms.clone();

              clones.addClass('ag-no-transition ag-clone');

              var clonesCssObj = angular.extend({}, cloneCss);
              clonesCssObj.width = colWidth + 'px';
              clones.css(clonesCssObj);
              element.append(clones);

              //For cloned element again we have to check if image loaded (IOS only)

              (function(reflowIndx) {
                afterImageLoad(clones, {
                  ignoreCheck: function(img) {
                    return !single(img).hasClass('img-loaded');
                  },
                  onFullLoad: function() {
                    //if its older reflow don't do any thing
                    if (reflowIndx < reflowCount) {
                      clones.remove();
                      return;
                    }

                    var listElmHeights = [],
                      listElmPosInfo = [],
                      item, i, ln;



                    //find height with clones
                    for (i = 0, ln = clones.length; i < ln; i++) {
                      listElmHeights.push(clones[i].offsetHeight);
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
                      var posX = col * (colWidth + options.gutterSize);

                      var cssObj = {
                        position: 'absolute',
                        top: top + 'px'
                      };

                      if (options.direction == 'rtol') {
                        cssObj.right = posX + 'px';
                      } else {
                        cssObj.left = posX + 'px';
                      }

                      cssObj.width = colWidth + 'px';

                      //add position info of each grids
                      listElmPosInfo.push({
                        top: top,
                        bottom: top + height
                      });

                      item.css(cssObj).addClass('angular-grid-item');
                    }

                    //set the height of container
                    var contHeight = Math.max.apply(Math, lastRowBottom);
                    element.css('height', contHeight + 'px');

                    clones.remove();

                    //update the scroll container info
                    if (options.performantScroll || scope.infiniteScroll) {
                      scrollNs.scrollContInfo = getScrollContainerInfo();
                    }

                    //if performantScroll is enabled calculate the page info, and reflect dom elements to reflect visible pages
                    if (options.performantScroll) {
                      scrollNs.lastPage = null;
                      calculatePageInfo(listElmPosInfo, contHeight, cols);
                      scrollNs.isBusy = false;
                      refreshDomElm(scrollNs.lastScrollPosition || 0);
                    }

                    //re enable infiniteScroll
                    reEnableInfiniteScroll();
                  }
                });
              }(reflowCount));

            }


            //function to handle asynchronous image loading
            function handleImage() {
              var reflowPending = false;
              domToAry(listElms).forEach(function(listItem) {
                var $listItem = $(listItem),
                  allImg = $listItem.find('img');

                if (!allImg.length) {
                  return;
                }

                //add image loading class on list item
                $listItem.addClass('img-loading');

                afterImageLoad($listItem, {
                  beforeLoad: function(img) {
                    single(img).addClass('img-loading');
                  },
                  isLoaded: function(img) {
                    single(img).removeClass('img-loading').addClass('img-loaded');
                  },
                  onLoad: function(img) {
                    if (!reflowPending && options.refreshOnImgLoad) {
                      reflowPending = true;
                      $timeout(function() {
                        reflowGrids();
                        reflowPending = false;
                      }, 100);
                    }
                    single(img).removeClass('img-loading').addClass('img-loaded');
                  },
                  onFullLoad: function() {
                    $listItem.removeClass('img-loading').addClass('img-loaded');
                  }
                });
              });

            }

            //function to get list elements excluding clones
            function getListElms() {
              return $(domToAry(element.children()).filter(function(elm) {
                return !single(elm).hasClass('ag-clone');
              }));
            }

            //function to check for ng animation
            function ngCheckAnim() {
              var leavingElm = domToAry(listElms).filter(function(elm) {
                return single(elm).hasClass('ng-leave');
              });
              return $q(function(resolve) {
                if (!leavingElm.length) {
                  resolve();
                } else {
                  single(leavingElm[0]).one('webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd', function() {
                    $timeout(function() {
                      listElms = getListElms();
                      resolve();
                    });
                  });
                }
              });
            }

            //watch on modal key

            function watch() {
              scrollNs.isBusy = true;
              $timeout(function() {
                listElms = getListElms();
                ngCheckAnim().then(function() {
                  //handle images
                  handleImage();
                  $timeout(function() {
                    //to handle scroll appearance
                    reflowGrids();
                  });
                });
              });
            }

            scope.$watch('model', watch, true);


            //watch option for changes
            function watchOptions() {
              getOptions();
              if (listElms) reflowGrids();
            }

            scope.$watch('options', watchOptions, true);

            Object.keys(defaults).forEach(function(key) {
              if (scope[key] !== undefined) scope.$watch(key, watchOptions);
            });

            //listen window resize event and reflow grids after a timeout
            var lastDomWidth = domElm.offsetWidth;

            function windowResizeCallback() {
              scrollNs.isBusy = true;
              var contWidth = domElm.offsetWidth;
              if (lastDomWidth == contWidth) return;
              lastDomWidth = contWidth;


              if (timeoutPromise) {
                $timeout.cancel(timeoutPromise);
              }

              timeoutPromise = $timeout(function() {
                //caclulate container info
                if (options.performantScroll) {
                  element.children().detach();
                  element.append(listElms);
                }

                reflowGrids();
              }, 100);
            }
            win.on('resize', windowResizeCallback);

            //add instance to factory if id is assigned
            if (agId) {
              angularGridInstance[agId] = {
                refresh: function() {
                  watch();
                },
                handleScroll: function(scrollTop) {
                  if (options.performantScroll) refreshDomElm(scrollTop);
                  if (scope.infiniteScroll) infiniteScroll(scrollTop);
                }
              };
            }

            //destroy on refrences and events on scope destroy
            scope.$on('$destroy', function() {
              if (agId) delete angularGridInstance[agId];
              win.off('resize', windowResizeCallback);
              clearTimeout(scrollNs.infiniteScrollTimeout);
              if (scrollNs.scrollContInfo) scrollNs.scrollContInfo.$elm.off('scroll', scrollHandler);
            });
          }
        };
      }
    ])
    //a factory to store angulargrid instances which can be injected to controllers or directive
    .factory('angularGridInstance', function() {

      var angularGridInstance = {};

      return angularGridInstance;

    })
    .name;

}));
