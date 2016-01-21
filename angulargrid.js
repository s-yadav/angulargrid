/*
    angularGrid.js v 0.5.0
    Author: Sudhanshu Yadav
    Copyright (c) 2015 Sudhanshu Yadav - ignitersworld.com , released under the MIT license.
    Demo on: http://ignitersworld.com/lab/angulargrid/demo1.html
    Documentation and download on https://github.com/s-yadav/angulargrid
*/

/* module to create pinterest like responsive masonry grid system for angular */
;(function(angular, window, undefined) {
  'use strict';
  //defaults for plugin
  var defaults = {
    gridWidth: 300, //minumum width of a grid, this may increase to take whole space of container
    gutterSize: 10, //spacing between two grid,
    gridNo: 'auto', // grid number, by default calculate auto matically
    direction: 'ltor', //direction of grid item
    refreshOnImgLoad: true, // to make a refresh on image load inside container
    cssGrid: false
  };

  var $ = angular.element;

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
    return img.complete &&
      (typeof img.naturalWidth === 'undefined' || img.naturalWidth !== 0);
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

  angular.module('angularGrid', [])
  .directive('angularGrid', ['$timeout', '$window', '$q', 'angularGridInstance',
    function($timeout, $window, $q, angularGridInstance) {
      return {
        restrict: 'A',
        scope: {
          model: '=angularGrid',
          gridWidth: '=',
          gutterSize: '=',
          refreshOnImgLoad: '=',
          direction: '=',
          cssGrid: '=',
          options: '=angularGridOptions',
          infiniteScroll: '&'
        },
        link: function(scope, element, attrs) {
          var domElm = element[0],
            win = $($window),
            agId = attrs.angularGridId,
            listElms,
            timeoutPromise,
            body = document.body,
            html = document.documentElement,
            infScrCont = document,
            infScrIsContained,
            infScrContScrollTop = 0,
            infScrContHeight = 0,
            infScrContInnerHeight = 0;

          element.addClass('angular-grid');

          //get the user input options
          var options;

          function getOptions() {
            options = {};
            Object.keys(defaults).forEach(function(key) {
              if (scope[key] != undefined) options[key] = scope[key];
            });
            options = angular.extend({}, defaults, options, scope.options);
            if (options.cssGrid) options.gutterSize = 0;
          }
          getOptions();

          //function to get column width and number of columns
          function getColWidth() {
            var contWidth = domElm.offsetWidth,
                clone; // a clone to calculate width without transition

            if (options.cssGrid) {
              clone = $(listElms[0]).clone();
              clone.css(cloneCss).addClass('ag-no-transition');
              element.append(clone);
              var width = clone[0].offsetWidth;
              clone.remove();
              return {
                no: Math.floor((contWidth + 12) / width),
                width: width
              };
            }

            var colWidth = options.gridNo == 'auto' ? options.gridWidth : Math.floor(contWidth / options.gridNo) - options.gutterSize,
              cols = options.gridNo == 'auto' ? Math.floor(contWidth / (colWidth + options.gutterSize)) : options.gridNo,
              remainingSpace = (contWidth % (colWidth + options.gutterSize)) + options.gutterSize;

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
            //claclulate width of all element
            var colInfo = getColWidth(),
                colWidth = colInfo.width,
                cols = colInfo.no,
                i;
            //initialize listRowBottom
            var lastRowBottom = [];
            for (i = 0; i < cols; i++) {
              lastRowBottom.push(0);
            }
            //if image actual width and actual height is defined update image
            //size so that it dosent cause reflow on image load
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

            clones.addClass('ag-no-transition');

            var clonesCssObj = angular.extend({}, cloneCss);
            clonesCssObj.width = colWidth + 'px';
            clones.css(clonesCssObj);
            element.append(clones);

            //For cloned element again we have to check if image loaded (IOS only)

            afterImageLoad(clones, {
              ignoreCheck: function (img) {
                return !single(img).hasClass('img-loaded');
              },
              onFullLoad: function () {
                var listElmHeights = [],
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

                  item.css(cssObj).addClass('angular-grid-item');
                }
                //set the height of container
                element.css('height', Math.max.apply(Math, lastRowBottom) + 'px');

                clones.remove();
              }
            });
          }

          //function to handle asynchronous image loading
          function handleImage() {
            var reflowPending = false;
            domToAry(listElms).forEach(function (listItem) {
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
                    $timeout(function () {
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

          //function to check for ng animation
          function ngCheckAnim() {
            var leavingElm = domToAry(listElms).filter(function(elm) {
              return single(elm).hasClass('ng-leave');
            });
            return $q(function(resolve) {
              if (!leavingElm.length) {
                resolve();
              } else {
                single(leavingElm[0]).one('webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd', function () {
                  $timeout(function () {
                    listElms = element.children();
                    resolve();
                  });
                });
              }
            });
          }

          //watch on modal key
          function watch() {
            $timeout(function () {
              listElms = element.children();
              ngCheckAnim().then(function () {
                //handle images
                handleImage();
                $timeout(function () {
                  //to handle scroll appearance
                  reflowGrids();
                  scope
                });
              });
            });
          }
          scope.$watch('model', watch, true);

          //watch option for changes
          function watchOptions() {
            getOptions();
            if (listElms) reflowGrids();
          };

          scope.$watch('options', watchOptions, true);

          Object.keys(defaults).forEach(function (key) {
            if (scope[key] != undefined) scope.$watch(key, watchOptions);
          });

          //listen window resize event and reflow grids after a timeout
          var lastDomWidth = domElm.offsetWidth;

          function windowResizeCallback() {
            var contWidth = domElm.offsetWidth;
            if (lastDomWidth == contWidth) return;
            lastDomWidth = contWidth;

            if (timeoutPromise) {
              $timeout.cancel(timeoutPromise);
            }

            timeoutPromise = $timeout(function() {
              reflowGrids();
            }, 100);
          }
          win.on('resize', windowResizeCallback);

          function scrollCallback() {
            infScrContScrollTop = infScrIsContained ? infScrCont.scrollTop:window.scrollY;
            infScrContHeight = infScrIsContained ?
              infScrCont.offsetHeight :
              Math.max(
                document.documentElement.clientHeight,
                window.innerHeight || 0);
            infScrContInnerHeight = infScrIsContained ?
              infScrCont.scrollHeight :
              Math.max(
                body.scrollHeight,
                body.offsetHeight,
                html.clientHeight,
                html.scrollHeight,
                html.offsetHeight || 0);
            if (infScrContScrollTop + 1500 >= infScrContInnerHeight - infScrContHeight) {
              infScrCont.removeEventListener('scroll', scrollCallback);
              var infiniteScrollPromise = scope.infiniteScroll();
              infiniteScrollPromise.then(function(data) {
                infScrCont.addEventListener('scroll', scrollCallback);
              });
            }
          }

          if(typeof attrs.infiniteScroll !== 'undefined') {
            if (attrs.infiniteScrollContainer) {
              var infScrConts = document.querySelectorAll(attrs.infiniteScrollContainer);
              if(infScrConts.length) {
                domToAry(infScrConts).forEach(function (item) {
                  infScrCont = single(item)[0];
                  infScrIsContained = true;
                });
              } else {
                console.error('No element exists matching the \''+
                  attrs.infiniteScrollContainer+'\' selector.');
                infScrCont = document;
                infScrIsContained = false;
              }
            } else {
              infScrCont = document;
              infScrIsContained = false;
            }
            infScrCont.addEventListener('scroll', scrollCallback);
          }

          //add instance to factory if id is assigned
          if (agId) {
            angularGridInstance[agId] = {
              refresh: function () {
                watch();
              }
            };
          }

          //destroy on refrences and events on scope destroy
          scope.$on('$destroy', function () {
            if (agId) delete angularGridInstance[agId];
            win.off('resize', windowResizeCallback);
            infScrCont.removeEventListener('scroll', scrollCallback);
          });
        }
      };
    }
  ])
  //a factory to store angulargrid instances which can be injected to controllers or directive
  .factory('angularGridInstance', function () {
    var angularGridInstance = {};
    return angularGridInstance;
  });

}(angular, window));
