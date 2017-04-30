    import { element } from 'protractor';
    import { Observable } from 'rxjs/Observable';
    import { Subject } from 'rxjs/Rx';
    import { Directive, ElementRef, Input, OnInit, Renderer } from '@angular/core';
    import 'rxjs/operator/toPromise';
    declare var window:any;
    declare var console:any;
    @Directive({
      selector: '[angularGrid]'
    })
    export class AngularGridDirective {
        constructor(private el: ElementRef, private renderer: Renderer) {
        }
        element = this.el.nativeElement;
        @Input() angularGrid:any;
        @Input() gridNo:any = 'auto';
        @Input() gridWidth:number = 300;
        @Input() gutterSize:any
        @Input() refreshOnImgLoad:any
        @Input() direction:any = 'ltor';
        @Input() cssGrid:any
        @Input() agId:any
        @Input() dep_agId:any;
        @Input() pageSize:any= 'auto';
        @Input() performantScroll:any
        @Input() scrollContainer:any = 'body';
        @Input() infiniteScroll:any
        @Input() infiniteScrollDistance:any = 100;
        @Input() infiniteScrollDelay:any = 3000;
        @Input() angularGridId:any;
        @Input() refreshOnImageLoad:any;
    
        private listElms:any;
        private reflowCount:number = 0; //to keep tack of times reflowgrid been called
        private timeoutPromise:any;
        private scrollNs:any = {};
        private cloneCss:any = {
            visibility: 'hidden',
            opacity: 0,
            top: 0,
            left: 0,
            width: ''
        };
        private lastDomWidth:number = this.element.offsetWidth;
    
        private hasClass(ele:any,cls:string) {
            return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
        }
        private addClass(ele:any, cls:string) {
            if(ele.className.indexOf(cls) == -1) {
                ele.className += ' ' + cls;
            }
        }
        private removeClass(ele:any,cls:string) {
            ele.className = ele.className.replace(cls,'').trim();
        }
        private removeChild(ele:any) {
          const children = Array.from(ele.children || []);
          children.forEach((child) => {
            ele.removeChild(child);
          });
        }
        private replaceChildren(elm:any, children:any) {
          this.removeChild(elm);
          this.appendChild(elm,children);
        }
        private findElements(container:any, selector:string) {
            if(!container.length) container = [container];
            container = Array.from(container);
            return container.reduce((elems:Array<any>, item:any) => {
                return elems.concat(Array.from(item.querySelectorAll(selector)));
            }, []);
        }
    
        private getOptions():void {
            if (this.cssGrid) this.gutterSize = 0;
            if (this.pageSize == 'auto') {
                this.pageSize = window.offsetWidth >= 768 ? 2 : 3;
            }
        }
        private cloneNode(node:any){
            if (node.length) {
                return Array.from(node).map((item:any) => {
                    return item.cloneNode(true);
                })
            }
            return node.cloneNode(true);
        }
        private appendChild(elem:any, nodes:any) {
            if(!nodes.length) nodes = [nodes];
            nodes = Array.from(nodes);
            const fragment = document.createDocumentFragment();
            nodes.forEach((node) => {
                fragment.appendChild(node);
            });
            elem.appendChild(fragment);
        }
        private noop() {
        }
        private camelCaseToHyphenCase(str:string) {
            return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        }
        private addStyle() {
            let headElem = document.getElementsByTagName('head')[0];
            headElem.innerHTML += `<style>
            .ag-no-transition {
                -webkit-transition: none !important;
                transition: none !important;
            }
            .angular-grid{
                position : relative;
            }
            .angular-grid > *{
                opacity : 0
            }
            .angular-grid > .angular-grid-item{
                opacity : 1
            }
            </style>`;
        }
    
        private imageLoaded(img:any) {
            return img.complete && (typeof img.naturalWidth === 'undefined' || img.naturalWidth !== 0);
        }
        //function to covert domlist to array
        private domToAry(list:any) {
            return Array.prototype.slice.call(list);
        }
        private findPos(obj:any, withRespectTo:any) {
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
        getScrollContainerInfo() {
            let container = document.querySelector(this.scrollContainer);
            let effectiveContainer = this.scrollContainer == 'body' ? window : container;
    
            return {
                height: effectiveContainer.offsetHeight || effectiveContainer.innerHeight,
                scrollHeight: container.scrollHeight,
                startFrom: this.findPos(this.element, container).top,
                $elm: effectiveContainer
            };
        }
        private calculatePageInfo(listElmPosInfo:any, scrollBodyHeight:number, colNo:number) {
            this.scrollNs.pageInfo = [{
                from: 0
            }];
    
            let elmInfo:any, from:any, to:any,
            pageSize:any = this.pageSize,
            scrollContHeight:number = this.scrollNs.scrollContInfo.height,
            pageHeight:number = scrollContHeight * pageSize,
            totalPages:number = Math.ceil(scrollBodyHeight / pageHeight),
            pageNo:number = 0;
    
            for (pageNo = 0; pageNo < totalPages; pageNo++) {
                for (let idx = 0, ln = listElmPosInfo.length; idx < ln; idx++) {
                    elmInfo = listElmPosInfo[idx];
                    from = pageNo ? pageHeight * pageNo : 0;
                    to = pageHeight * (pageNo + 1);
                    if (elmInfo.bottom < from || elmInfo.top > to) {
                        if (elmInfo.top > to) break;
                    } else {
                        if (!this.scrollNs.pageInfo[pageNo]) this.scrollNs.pageInfo[pageNo] = {
                            from: idx
                        };
                        this.scrollNs.pageInfo[pageNo].to = idx;
                    }
                }
            }
    
            this.scrollNs.pageInfo = this.scrollNs.pageInfo.map((page:number, idx:number)=> {
                var fromPage = Math.max(idx - 1, 0),
                    toPage = Math.min(idx + 1, this.scrollNs.pageInfo.length - 1);
                return {
                    from: this.scrollNs.pageInfo[fromPage].from,
                    to: this.scrollNs.pageInfo[toPage].to
                };
            });
        }
        refreshDomElm(scrollTop:any) {
            let filteredElm:any,
            currentPage = 0,
            pageSize = this.pageSize;
    
            this.scrollNs.lastScrollPosition = scrollTop;
            if (this.scrollNs.isBusy) return;
    
            if (scrollTop > this.scrollNs.scrollContInfo.startFrom + this.scrollNs.scrollContInfo.height * pageSize) {
            currentPage = Math.floor((scrollTop - this.scrollNs.scrollContInfo.startFrom) / (this.scrollNs.scrollContInfo.height * pageSize));
            }
            if (currentPage == this.scrollNs.lastPage) return;
            this.scrollNs.lastPage = currentPage;
            var curPageInfo = this.scrollNs.pageInfo[currentPage];
    
            if (curPageInfo) {
                filteredElm = Array.prototype.slice.call(this.listElms, curPageInfo.from, curPageInfo.to + 1);
                this.replaceChildren(this.element, filteredElm);
            }
        }
        private reEnableInfiniteScroll = () => {
            clearTimeout(this.scrollNs.infiniteScrollTimeout);
            this.scrollNs.isLoading = false;
        }
        private applyInfiniteScroll(scrollTop:number=undefined) {
            if (this.scrollNs.isLoading) return;
            var scrollHeight = this.scrollNs.scrollContInfo.scrollHeight,
            contHeight = this.scrollNs.scrollContInfo.height;
    
            if (scrollTop >= (scrollHeight - contHeight * (1 + this.infiniteScrollDistance / 100))) {
            this.scrollNs.isLoading = true;
            this.infiniteScroll();
                this.scrollNs.infiniteScrollTimeout = setTimeout(this.reEnableInfiniteScroll, this.infiniteScrollDelay);
            }
        }
        private scrollHandler(elm, event) {
            let scrollTop:number = elm.scrollTop || elm.scrollY;
            if (this.performantScroll) this.refreshDomElm(scrollTop);
            if (this.infiniteScroll) this.applyInfiniteScroll(scrollTop);
        }
        private getColWidth():any {
            let contWidth = this.element.offsetWidth,
            clone:any; // a clone to calculate width without transition
            if (this.cssGrid) {
                clone = this.cloneNode(this.listElms[0]);
                this.element.appendChild(clone);
                let width = clone.offsetWidth;
                clone.parentNode.removeChild(clone);
                return {
                    no: width ? Math.floor((contWidth + 12) / width) : 0,
                    width: width
                };
            }
    
            let colWidth = this.gridNo == 'auto' ? this.gridWidth : Math.floor(contWidth / this.gridNo) - this.gutterSize,
            cols = this.gridNo == 'auto' ? Math.floor((contWidth + this.gutterSize) / (colWidth + this.gutterSize)) : this.gridNo,
            remainingSpace = ((contWidth + this.gutterSize) % (colWidth + this.gutterSize));
    
            colWidth = colWidth + Math.floor(remainingSpace / cols);
    
            return {
                no: cols,
                width: colWidth
            };
        }
        afterImageLoad(container:any, options:any) {
            let self = this;
            let beforeLoad = options.beforeLoad || this.noop,
            onLoad = options.onLoad || this.noop,
            isLoaded = options.isLoaded || this.noop,
            onFullLoad = options.onFullLoad || this.noop,
            ignoreCheck = options.ignoreCheck || this.noop,
            allImg = this.findElements(container,'img'),
            loadedImgPromises:Array<any> = [];
    
            this.domToAry(allImg).forEach((img:any)=> {
                if(!img.src) return;
                beforeLoad(img);
                if (!self.imageLoaded(img) && !ignoreCheck(img)) {
                    let imageLoadAsObservable = new Subject();
                    loadedImgPromises.push(imageLoadAsObservable);
                    img.onload = ()=> {
                        onLoad(img);
                        imageLoadAsObservable.next();
                    };
                    img.onerror = ()=> {
                        imageLoadAsObservable.next({});
                    };
                } else {
                    isLoaded(img);
                }
            });
    
            if (loadedImgPromises.length) {
                let count = 0;
                loadedImgPromises.forEach((observable:Observable<any>)=> {
                    observable.subscribe(()=> {
                        count +=1;
                        if(count == loadedImgPromises.length) {
                            onFullLoad();
                        }
                    });
                })
            } else {
                setTimeout(()=> {
                    onFullLoad();
                }, 0);
            }
        }
        private reflowGrids() {
            //return if there are no elements
            if(!(this.listElms && this.listElms.length )) return;
    
            this.reflowCount++;
    
            //claclulate width of all element
            var colInfo = this.getColWidth(),
            colWidth = colInfo.width,
            cols = colInfo.no,
            i:number;
            if (!cols) return;
            //initialize listRowBottom
            let lastRowBottom: Array<number> = [];
            for (i = 0; i < cols; i++) {
                lastRowBottom.push(0);
            }
    
            //if image actual width and actual height is defined update image size so that it dosent cause reflow on image load
            this.domToAry(this.listElms).forEach((item:any)=> {
                this.domToAry(item.getElementsByTagName('img')).forEach((img:any)=> {
                    //if image is already loaded don't do anything
                    if (img.className.indexOf('img-loaded') > -1) {
                        img.style.height = '';
                        return;
                    }
                    //set the item width and no transition state so image width can be calculated properly
                    this.addClass(item, 'ag-no-transition');
                    item.style.width = colWidth + 'px';
                    var actualWidth = img.getAttribute('actual-width') || img.getAttribute('data-actual-width'),
                    actualHeight = img.getAttribute('actual-height') || img.getAttribute('data-actual-height');
                    if (actualWidth && actualHeight) {
                        img.style.height = (actualHeight * img.width / actualWidth) + 'px';
                    }
                });
                this.removeClass(item, 'ag-no-transition');
            });
    
            let clones:Array<any> = this.cloneNode(this.listElms);
    
            clones.forEach((clone:any)=> {
                this.addClass(clone, 'ag-no-transition');
                this.addClass(clone, 'ag-clone');
                for(let key in this.cloneCss) {
                    clone.style[key] = this.cloneCss[key];
                    clone.style.width = colWidth + 'px';
                    this.element.appendChild(clone);
                }
            });
    
            ((reflowIndx)=> {
                    this.afterImageLoad(clones, {
                        ignoreCheck: (img:any)=> {
                            return (img.className.indexOf('img-loaded') > -1);
                        },
                        onFullLoad: ()=> {
                        //if its older reflow don't do any thing
                            if (reflowIndx < this.reflowCount) {
                                clones.forEach((clone:any)=> {
                                    if(clone.parentNode)
                                        clone.parentNode.removeChild(clone);
                                });
                                return;
                            }
    
                            let listElmHeights:Array<any> = [],
                                listElmPosInfo:Array<any> = [],
                                item:any, i:any, ln:any;
    
    
    
                            //find height with clones
                            for (i = 0, ln = clones.length; i < ln; i++) {
                                listElmHeights.push(clones[i].offsetHeight);
                            }
    
                            //set new positions
                            for (i = 0, ln = this.listElms.length; i < ln; i++) {
                                item = this.listElms[i];
                                let height = listElmHeights[i],
                                top = Math.min.apply(Math, lastRowBottom),
                                col = lastRowBottom.indexOf(top);
    
                                //update lastRowBottom value
                                lastRowBottom[col] = top + height + this.gutterSize;
    
                                //set top and left of list items
                                var posX = col * (colWidth + this.gutterSize);
    
                                let cssObj:any = {
                                    position: 'absolute',
                                    top: top + 'px'
                                };
    
                                if (this.direction == 'rtol') {
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
                                for(let key in cssObj) {
                                    item.style[key] = cssObj[key];
                                }
                                this.addClass(item, 'angular-grid-item')
                            }
    
                            //set the height of container
                            var contHeight = Math.max.apply(Math, lastRowBottom);
                            this.element.style.height = contHeight + 'px';
    
                            clones.forEach((clone)=> {
                                if(clone.parentNode)
                                    clone.parentNode.removeChild(clone);
                            });
                            //update the scroll container info
                            if (this.performantScroll || this.infiniteScroll) {
                                this.scrollNs.scrollContInfo = this.getScrollContainerInfo();
                            }
    
                            //if performantScroll is enabled calculate the page info, and reflect dom elements to reflect visible pages
                            if (this.performantScroll) {
                                this.scrollNs.lastPage = null;
                                this.calculatePageInfo(listElmPosInfo, contHeight, cols);
                                this.scrollNs.isBusy = false;
                                this.refreshDomElm(this.scrollNs.lastScrollPosition || 0);
                            }
    
                            //re enable infiniteScroll
                            this.reEnableInfiniteScroll();
                        }
                    });
            })(this.reflowCount);
        }
        private handleImage() {
            let reflowPending = false;
            this.domToAry(this.listElms).forEach((listItem:any)=>{
                let allImg = listItem.getElementsByTagName('img');
                if (!allImg.length) {
                    return;
                }
                //add image loading class on list item
                this.addClass(listItem, 'img-loading');
    
                this.afterImageLoad(listItem, {
                    beforeLoad: (img:any)=> {
                        //img.className += ' img-loading';
                        this.addClass(img, 'img-loading');
                    },
                    isLoaded: (img:any)=> {
                        //single(img).removeClass('img-loading').addClass('img-loaded');
                        this.removeClass(img, 'img-loading');
                        //img.className += ' img-loaded';
                        this.addClass(img, 'img-loaded');
                    },
                    onLoad: (img:any)=> {
                        if (!reflowPending && this.refreshOnImgLoad) {
                            reflowPending = true;
                            setTimeout(()=> {
                                this.reflowGrids();
                                reflowPending = false;
                            },100)
                        }
                        this.removeClass(img, 'img-loading');
                        //img.className += ' img-loaded';
                        this.addClass(img, 'img-loaded');
                    },
                    onFullLoad: ()=> {
                        this.removeClass(listItem, 'img-loading');
                        //listItem.className += ' img-loaded';
                        this.addClass(listItem, 'img-loaded');
                    }
                });
            });
        }
        private getListElms() {
            return this.domToAry(this.element.childNodes).filter((elm:any)=> {
                return (elm.className && !(elm.className.indexOf('ag-clone') > -1));
            })
        }
        watch() {
            this.scrollNs.isBusy = true;
    
            setTimeout(()=> {
                const __this = this;
                this.listElms = this.getListElms();
                this.handleImage();
                setTimeout(()=> {
                  this.reflowGrids();
                }, 0);
            });
        }
        windowResizeCallback() {
            this.scrollNs.isBusy = true;
            let contWidth = this.element.offsetWidth;
            if (this.lastDomWidth == contWidth) return;
            this.lastDomWidth = contWidth;
            if (this.timeoutPromise) {
                clearTimeout(this.timeoutPromise);
            }
    
            this.timeoutPromise = setTimeout(()=> {
                if (this.performantScroll) {
                    this.replaceChildren(this.element,this.listElms);
                }
                this.reflowGrids();
            }, 100);
            setTimeout(()=> {
                this.reflowGrids();
            }, 100);
        }
        startRendering() {
            let self = this;
            this.addClass(this.element, 'angular-grid')
            this.getOptions();
    
            //reset removed elements
            if (this.listElms) {
              this.replaceChildren(this.element, this.listElms);
            }
    
            setTimeout(() => {
                const {$elm} = this.getScrollContainerInfo();
                $elm.addEventListener('scroll', this.scrollHandler.bind(this, $elm));
            }, 0);
    
            this.watch();
        }
        ngOnChanges() {
            let self = this;
    
            this.startRendering();
            window.onresize = self.windowResizeCallback.bind(self);
        }
    }
    