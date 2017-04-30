"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var Rx_1 = require('rxjs/Rx');
var core_1 = require('@angular/core');
require('rxjs/operator/toPromise');
var AngularGridDirective = (function () {
    function AngularGridDirective(el, renderer) {
        var _this = this;
        this.el = el;
        this.renderer = renderer;
        this.element = this.el.nativeElement;
        this.gridNo = 'auto';
        this.gridWidth = 300;
        this.direction = 'ltor';
        this.pageSize = 'auto';
        this.scrollContainer = 'body';
        this.infiniteScrollDistance = 100;
        this.infiniteScrollDelay = 3000;
        this.reflowCount = 0; //to keep tack of times reflowgrid been called
        this.scrollNs = {};
        this.cloneCss = {
            visibility: 'hidden',
            opacity: 0,
            top: 0,
            left: 0,
            width: ''
        };
        this.lastDomWidth = this.element.offsetWidth;
        this.reEnableInfiniteScroll = function () {
            clearTimeout(_this.scrollNs.infiniteScrollTimeout);
            _this.scrollNs.isLoading = false;
        };
    }
    AngularGridDirective.prototype.hasClass = function (ele, cls) {
        return ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
    };
    AngularGridDirective.prototype.addClass = function (ele, cls) {
        if (ele.className.indexOf(cls) == -1) {
            ele.className += ' ' + cls;
        }
    };
    AngularGridDirective.prototype.removeClass = function (ele, cls) {
        ele.className = ele.className.replace(cls, '').trim();
    };
    AngularGridDirective.prototype.removeChild = function (ele) {
        var children = Array.from(ele.children || []);
        children.forEach(function (child) {
            ele.removeChild(child);
        });
    };
    AngularGridDirective.prototype.replaceChildren = function (elm, children) {
        this.removeChild(elm);
        this.appendChild(elm, children);
    };
    AngularGridDirective.prototype.findElements = function (container, selector) {
        if (!container.length)
            container = [container];
        container = Array.from(container);
        return container.reduce(function (elems, item) {
            return elems.concat(Array.from(item.querySelectorAll(selector)));
        }, []);
    };
    AngularGridDirective.prototype.getOptions = function () {
        if (this.cssGrid)
            this.gutterSize = 0;
        if (this.pageSize == 'auto') {
            this.pageSize = window.offsetWidth >= 768 ? 2 : 3;
        }
    };
    AngularGridDirective.prototype.cloneNode = function (node) {
        if (node.length) {
            return Array.from(node).map(function (item) {
                return item.cloneNode(true);
            });
        }
        return node.cloneNode(true);
    };
    AngularGridDirective.prototype.appendChild = function (elem, nodes) {
        if (!nodes.length)
            nodes = [nodes];
        nodes = Array.from(nodes);
        var fragment = document.createDocumentFragment();
        nodes.forEach(function (node) {
            fragment.appendChild(node);
        });
        elem.appendChild(fragment);
    };
    AngularGridDirective.prototype.noop = function () {
    };
    AngularGridDirective.prototype.camelCaseToHyphenCase = function (str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    };
    AngularGridDirective.prototype.addStyle = function () {
        var headElem = document.getElementsByTagName('head')[0];
        headElem.innerHTML += "<style>\n            .ag-no-transition {\n                -webkit-transition: none !important;\n                transition: none !important;\n            }\n            .angular-grid{\n                position : relative;\n            }\n            .angular-grid > *{\n                opacity : 0\n            }\n            .angular-grid > .angular-grid-item{\n                opacity : 1\n            }\n            </style>";
    };
    AngularGridDirective.prototype.imageLoaded = function (img) {
        return img.complete && (typeof img.naturalWidth === 'undefined' || img.naturalWidth !== 0);
    };
    //function to covert domlist to array
    AngularGridDirective.prototype.domToAry = function (list) {
        return Array.prototype.slice.call(list);
    };
    AngularGridDirective.prototype.findPos = function (obj, withRespectTo) {
        withRespectTo = withRespectTo || document.body;
        var curleft = 0, curtop = 0;
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
    };
    AngularGridDirective.prototype.getScrollContainerInfo = function () {
        var container = document.querySelector(this.scrollContainer);
        var effectiveContainer = this.scrollContainer == 'body' ? window : container;
        return {
            height: effectiveContainer.offsetHeight || effectiveContainer.innerHeight,
            scrollHeight: container.scrollHeight,
            startFrom: this.findPos(this.element, container).top,
            $elm: effectiveContainer
        };
    };
    AngularGridDirective.prototype.calculatePageInfo = function (listElmPosInfo, scrollBodyHeight, colNo) {
        var _this = this;
        this.scrollNs.pageInfo = [{
                from: 0
            }];
        var elmInfo, from, to, pageSize = this.pageSize, scrollContHeight = this.scrollNs.scrollContInfo.height, pageHeight = scrollContHeight * pageSize, totalPages = Math.ceil(scrollBodyHeight / pageHeight), pageNo = 0;
        for (pageNo = 0; pageNo < totalPages; pageNo++) {
            for (var idx = 0, ln = listElmPosInfo.length; idx < ln; idx++) {
                elmInfo = listElmPosInfo[idx];
                from = pageNo ? pageHeight * pageNo : 0;
                to = pageHeight * (pageNo + 1);
                if (elmInfo.bottom < from || elmInfo.top > to) {
                    if (elmInfo.top > to)
                        break;
                }
                else {
                    if (!this.scrollNs.pageInfo[pageNo])
                        this.scrollNs.pageInfo[pageNo] = {
                            from: idx
                        };
                    this.scrollNs.pageInfo[pageNo].to = idx;
                }
            }
        }
        this.scrollNs.pageInfo = this.scrollNs.pageInfo.map(function (page, idx) {
            var fromPage = Math.max(idx - 1, 0), toPage = Math.min(idx + 1, _this.scrollNs.pageInfo.length - 1);
            return {
                from: _this.scrollNs.pageInfo[fromPage].from,
                to: _this.scrollNs.pageInfo[toPage].to
            };
        });
    };
    AngularGridDirective.prototype.refreshDomElm = function (scrollTop) {
        var filteredElm, currentPage = 0, pageSize = this.pageSize;
        this.scrollNs.lastScrollPosition = scrollTop;
        if (this.scrollNs.isBusy)
            return;
        if (scrollTop > this.scrollNs.scrollContInfo.startFrom + this.scrollNs.scrollContInfo.height * pageSize) {
            currentPage = Math.floor((scrollTop - this.scrollNs.scrollContInfo.startFrom) / (this.scrollNs.scrollContInfo.height * pageSize));
        }
        if (currentPage == this.scrollNs.lastPage)
            return;
        this.scrollNs.lastPage = currentPage;
        var curPageInfo = this.scrollNs.pageInfo[currentPage];
        if (curPageInfo) {
            filteredElm = Array.prototype.slice.call(this.listElms, curPageInfo.from, curPageInfo.to + 1);
            this.replaceChildren(this.element, filteredElm);
        }
    };
    AngularGridDirective.prototype.applyInfiniteScroll = function (scrollTop) {
        if (scrollTop === void 0) { scrollTop = undefined; }
        if (this.scrollNs.isLoading)
            return;
        var scrollHeight = this.scrollNs.scrollContInfo.scrollHeight, contHeight = this.scrollNs.scrollContInfo.height;
        if (scrollTop >= (scrollHeight - contHeight * (1 + this.infiniteScrollDistance / 100))) {
            this.scrollNs.isLoading = true;
            this.infiniteScroll();
            this.scrollNs.infiniteScrollTimeout = setTimeout(this.reEnableInfiniteScroll, this.infiniteScrollDelay);
        }
    };
    AngularGridDirective.prototype.scrollHandler = function (elm, event) {
        var scrollTop = elm.scrollTop || elm.scrollY;
        if (this.performantScroll)
            this.refreshDomElm(scrollTop);
        if (this.infiniteScroll)
            this.applyInfiniteScroll(scrollTop);
    };
    AngularGridDirective.prototype.getColWidth = function () {
        var contWidth = this.element.offsetWidth, clone; // a clone to calculate width without transition
        if (this.cssGrid) {
            clone = this.cloneNode(this.listElms[0]);
            this.element.appendChild(clone);
            var width = clone.offsetWidth;
            clone.parentNode.removeChild(clone);
            return {
                no: width ? Math.floor((contWidth + 12) / width) : 0,
                width: width
            };
        }
        var colWidth = this.gridNo == 'auto' ? this.gridWidth : Math.floor(contWidth / this.gridNo) - this.gutterSize, cols = this.gridNo == 'auto' ? Math.floor((contWidth + this.gutterSize) / (colWidth + this.gutterSize)) : this.gridNo, remainingSpace = ((contWidth + this.gutterSize) % (colWidth + this.gutterSize));
        colWidth = colWidth + Math.floor(remainingSpace / cols);
        return {
            no: cols,
            width: colWidth
        };
    };
    AngularGridDirective.prototype.afterImageLoad = function (container, options) {
        var self = this;
        var beforeLoad = options.beforeLoad || this.noop, onLoad = options.onLoad || this.noop, isLoaded = options.isLoaded || this.noop, onFullLoad = options.onFullLoad || this.noop, ignoreCheck = options.ignoreCheck || this.noop, allImg = this.findElements(container, 'img'), loadedImgPromises = [];
        this.domToAry(allImg).forEach(function (img) {
            if (!img.src)
                return;
            beforeLoad(img);
            if (!self.imageLoaded(img) && !ignoreCheck(img)) {
                var imageLoadAsObservable_1 = new Rx_1.Subject();
                loadedImgPromises.push(imageLoadAsObservable_1);
                img.onload = function () {
                    onLoad(img);
                    imageLoadAsObservable_1.next();
                };
                img.onerror = function () {
                    imageLoadAsObservable_1.next({});
                };
            }
            else {
                isLoaded(img);
            }
        });
        if (loadedImgPromises.length) {
            var count_1 = 0;
            loadedImgPromises.forEach(function (observable) {
                observable.subscribe(function () {
                    count_1 += 1;
                    if (count_1 == loadedImgPromises.length) {
                        onFullLoad();
                    }
                });
            });
        }
        else {
            setTimeout(function () {
                onFullLoad();
            }, 0);
        }
    };
    AngularGridDirective.prototype.reflowGrids = function () {
        var _this = this;
        //return if there are no elements
        if (!(this.listElms && this.listElms.length))
            return;
        this.reflowCount++;
        //claclulate width of all element
        var colInfo = this.getColWidth(), colWidth = colInfo.width, cols = colInfo.no, i;
        if (!cols)
            return;
        //initialize listRowBottom
        var lastRowBottom = [];
        for (i = 0; i < cols; i++) {
            lastRowBottom.push(0);
        }
        //if image actual width and actual height is defined update image size so that it dosent cause reflow on image load
        this.domToAry(this.listElms).forEach(function (item) {
            _this.domToAry(item.getElementsByTagName('img')).forEach(function (img) {
                //if image is already loaded don't do anything
                if (img.className.indexOf('img-loaded') > -1) {
                    img.style.height = '';
                    return;
                }
                //set the item width and no transition state so image width can be calculated properly
                _this.addClass(item, 'ag-no-transition');
                item.style.width = colWidth + 'px';
                var actualWidth = img.getAttribute('actual-width') || img.getAttribute('data-actual-width'), actualHeight = img.getAttribute('actual-height') || img.getAttribute('data-actual-height');
                if (actualWidth && actualHeight) {
                    img.style.height = (actualHeight * img.width / actualWidth) + 'px';
                }
            });
            _this.removeClass(item, 'ag-no-transition');
        });
        var clones = this.cloneNode(this.listElms);
        clones.forEach(function (clone) {
            _this.addClass(clone, 'ag-no-transition');
            _this.addClass(clone, 'ag-clone');
            for (var key in _this.cloneCss) {
                clone.style[key] = _this.cloneCss[key];
                clone.style.width = colWidth + 'px';
                _this.element.appendChild(clone);
            }
        });
        (function (reflowIndx) {
            _this.afterImageLoad(clones, {
                ignoreCheck: function (img) {
                    return (img.className.indexOf('img-loaded') > -1);
                },
                onFullLoad: function () {
                    //if its older reflow don't do any thing
                    if (reflowIndx < _this.reflowCount) {
                        clones.forEach(function (clone) {
                            if (clone.parentNode)
                                clone.parentNode.removeChild(clone);
                        });
                        return;
                    }
                    var listElmHeights = [], listElmPosInfo = [], item, i, ln;
                    //find height with clones
                    for (i = 0, ln = clones.length; i < ln; i++) {
                        listElmHeights.push(clones[i].offsetHeight);
                    }
                    //set new positions
                    for (i = 0, ln = _this.listElms.length; i < ln; i++) {
                        item = _this.listElms[i];
                        var height = listElmHeights[i], top_1 = Math.min.apply(Math, lastRowBottom), col = lastRowBottom.indexOf(top_1);
                        //update lastRowBottom value
                        lastRowBottom[col] = top_1 + height + _this.gutterSize;
                        //set top and left of list items
                        var posX = col * (colWidth + _this.gutterSize);
                        var cssObj = {
                            position: 'absolute',
                            top: top_1 + 'px'
                        };
                        if (_this.direction == 'rtol') {
                            cssObj.right = posX + 'px';
                        }
                        else {
                            cssObj.left = posX + 'px';
                        }
                        cssObj.width = colWidth + 'px';
                        //add position info of each grids
                        listElmPosInfo.push({
                            top: top_1,
                            bottom: top_1 + height
                        });
                        for (var key in cssObj) {
                            item.style[key] = cssObj[key];
                        }
                        _this.addClass(item, 'angular-grid-item');
                    }
                    //set the height of container
                    var contHeight = Math.max.apply(Math, lastRowBottom);
                    _this.element.style.height = contHeight + 'px';
                    clones.forEach(function (clone) {
                        if (clone.parentNode)
                            clone.parentNode.removeChild(clone);
                    });
                    //update the scroll container info
                    if (_this.performantScroll || _this.infiniteScroll) {
                        _this.scrollNs.scrollContInfo = _this.getScrollContainerInfo();
                    }
                    //if performantScroll is enabled calculate the page info, and reflect dom elements to reflect visible pages
                    if (_this.performantScroll) {
                        _this.scrollNs.lastPage = null;
                        _this.calculatePageInfo(listElmPosInfo, contHeight, cols);
                        _this.scrollNs.isBusy = false;
                        _this.refreshDomElm(_this.scrollNs.lastScrollPosition || 0);
                    }
                    //re enable infiniteScroll
                    _this.reEnableInfiniteScroll();
                }
            });
        })(this.reflowCount);
    };
    AngularGridDirective.prototype.handleImage = function () {
        var _this = this;
        var reflowPending = false;
        this.domToAry(this.listElms).forEach(function (listItem) {
            var allImg = listItem.getElementsByTagName('img');
            if (!allImg.length) {
                return;
            }
            //add image loading class on list item
            _this.addClass(listItem, 'img-loading');
            _this.afterImageLoad(listItem, {
                beforeLoad: function (img) {
                    //img.className += ' img-loading';
                    _this.addClass(img, 'img-loading');
                },
                isLoaded: function (img) {
                    //single(img).removeClass('img-loading').addClass('img-loaded');
                    _this.removeClass(img, 'img-loading');
                    //img.className += ' img-loaded';
                    _this.addClass(img, 'img-loaded');
                },
                onLoad: function (img) {
                    if (!reflowPending && _this.refreshOnImgLoad) {
                        reflowPending = true;
                        setTimeout(function () {
                            _this.reflowGrids();
                            reflowPending = false;
                        }, 100);
                    }
                    _this.removeClass(img, 'img-loading');
                    //img.className += ' img-loaded';
                    _this.addClass(img, 'img-loaded');
                },
                onFullLoad: function () {
                    _this.removeClass(listItem, 'img-loading');
                    //listItem.className += ' img-loaded';
                    _this.addClass(listItem, 'img-loaded');
                }
            });
        });
    };
    AngularGridDirective.prototype.getListElms = function () {
        return this.domToAry(this.element.childNodes).filter(function (elm) {
            return (elm.className && !(elm.className.indexOf('ag-clone') > -1));
        });
    };
    AngularGridDirective.prototype.watch = function () {
        var _this = this;
        this.scrollNs.isBusy = true;
        setTimeout(function () {
            var __this = _this;
            _this.listElms = _this.getListElms();
            _this.handleImage();
            setTimeout(function () {
                _this.reflowGrids();
            }, 0);
        });
    };
    AngularGridDirective.prototype.windowResizeCallback = function () {
        var _this = this;
        this.scrollNs.isBusy = true;
        var contWidth = this.element.offsetWidth;
        if (this.lastDomWidth == contWidth)
            return;
        this.lastDomWidth = contWidth;
        if (this.timeoutPromise) {
            clearTimeout(this.timeoutPromise);
        }
        this.timeoutPromise = setTimeout(function () {
            if (_this.performantScroll) {
                _this.replaceChildren(_this.element, _this.listElms);
            }
            _this.reflowGrids();
        }, 100);
        setTimeout(function () {
            _this.reflowGrids();
        }, 100);
    };
    AngularGridDirective.prototype.startRendering = function () {
        var _this = this;
        var self = this;
        this.addClass(this.element, 'angular-grid');
        this.getOptions();
        //reset removed elements
        if (this.listElms) {
            this.replaceChildren(this.element, this.listElms);
        }
        setTimeout(function () {
            var $elm = _this.getScrollContainerInfo().$elm;
            $elm.addEventListener('scroll', _this.scrollHandler.bind(_this, $elm));
        }, 0);
        this.watch();
    };
    AngularGridDirective.prototype.ngOnChanges = function () {
        var self = this;
        this.startRendering();
        window.onresize = self.windowResizeCallback.bind(self);
    };
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], AngularGridDirective.prototype, "angularGrid", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], AngularGridDirective.prototype, "gridNo", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Number)
    ], AngularGridDirective.prototype, "gridWidth", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], AngularGridDirective.prototype, "gutterSize", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], AngularGridDirective.prototype, "refreshOnImgLoad", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], AngularGridDirective.prototype, "direction", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], AngularGridDirective.prototype, "cssGrid", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], AngularGridDirective.prototype, "agId", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], AngularGridDirective.prototype, "dep_agId", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], AngularGridDirective.prototype, "pageSize", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], AngularGridDirective.prototype, "performantScroll", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], AngularGridDirective.prototype, "scrollContainer", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], AngularGridDirective.prototype, "infiniteScroll", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], AngularGridDirective.prototype, "infiniteScrollDistance", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], AngularGridDirective.prototype, "infiniteScrollDelay", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], AngularGridDirective.prototype, "angularGridId", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], AngularGridDirective.prototype, "refreshOnImageLoad", void 0);
    AngularGridDirective = __decorate([
        core_1.Directive({
            selector: '[angularGrid]'
        }), 
        __metadata('design:paramtypes', [core_1.ElementRef, core_1.Renderer])
    ], AngularGridDirective);
    return AngularGridDirective;
}());
exports.AngularGridDirective = AngularGridDirective;
//# sourceMappingURL=angularGridDirective.js.map