/*
 *  Project: floop
 *  Description: A jQuery plugin to display a frames sequence as a browsable animation. Mainly used to simulate 3D roation in a browser.
 *  Author: Sébastien Boulanger
 *  License: Creative Commons
 *  Version: 0.5.3
 */
;
(function ($, window, document, undefined) {

        var pluginName = "floop",
            defaults = {
                //SETTINGS
                range: "0-100",
                width: 0,
                height: 0,
                steps: 1,
                reverse: false,
                callToAction: true,
                className: "",
                autoplay: {
                }, // sample value : {speed:25,repeat:5,locked:true}
                //CALLBACKS
                onBegin: function () {},
                onProgress: function () {},
                onComplete: function () {},
                onNext: function () {},
                onPrev: function () {},
                onStart: function () {},
                onStop: function () {}
            },
            //EVENTS     
            event_begin = "floop_begin",
            event_progress = "floop_progress",
            event_complete = "floop_complete",
            event_next = "floop_next",
            event_prev = "floop_prev",
            event_start = "floop_start",
            event_stop = "floop_stop",
            //PUBLIC METHOD          
            publicMethod = "";


        function Plugin(element, options) {

            this.element = $(element);
            this.options = $.extend({}, defaults, options);
            this._defaults = defaults;
            this._name = pluginName;
            this.filename = {
                complete: '',
                path: '',
                extension: '',
                noextension: '',
                sequence: '',
                number: 0,
                name: ''
            };
            this.minPic = 0;
            this.maxPic = 0;
            this.numOfPics = 0;
            this.dimensions = {
                width: 0,
                height: 0
            };
            //jQuery HTML elements
            this.$Container = "";
            this.$Images = "";
            this.$DragIcon = "";
            this.$StatusBar = "";
            this.$ProgressBar = "";
            this.$ProgressValue = "";
            this.progress = 0;
            this.autoplayItv = null;
            this.autoplayRepeats = 0;
            this.locked = false;
            this.init();
        }

        Plugin.prototype = {

            trigger: function (event, callback) {

                $(document).trigger(event);
                if ($.isFunction(callback)) {
                    callback.call(this);
                }
            },

            init: function () {

                this.trigger(event_begin, this.options.onBegin);
                this.execFloop();
                publicMethod.elements.push(this);
            },

            execFloop: function () {

                this.dimensions.width = (0 === this.options.width) ? parseInt(this.element.get(0).width) : parseInt(this.options.width);
                this.dimensions.height = (0 === this.options.height) ? parseInt(this.element.get(0).height) : parseInt(this.options.height);

                this.minPic = parseInt(this.options.range.slice(0, 1 + this.options.range.indexOf("-")));
                this.maxPic = parseInt(this.options.range.slice(1 + this.options.range.indexOf("-"), this.options.range.length));
                this.numOfPics = Math.ceil(this.maxPic / this.options.steps);
                this.setFilename();
                this.prepareHtml();
                this.loadPictures();
            },


            prepareHtml: function () {

                this.element.css({
                        position: "relative",
                        zIndex: "1"
                    });
                this.$Container = $('<div class="floop_container ' + this.options.className + '" style="overflow:hidden;width:' + this.dimensions.width + 'px;height:' + this.dimensions.height + 'px;"></div>');
                this.$Images = $('<div class="floop_images" style="overflow:hidden;width:' + this.dimensions.width + 'px;height:' + this.dimensions.height + 'px;"></div>');

                this.element.wrap(this.$Images);
                this.$Images = $(this.element.parent());
                this.$Images.wrap(this.$Container);
                this.$Container = $(this.$Images.parent());
                this.$StatusBar = $('<div style="width:' + this.dimensions.width + 'px;" class="floop_status"></div>');
                this.$Images.after(this.$StatusBar);

                this.$ProgressValue = $('<div style="width:0%;" class="floop_progress_value"></div>');
                this.$ProgressBar = $('<div class="floop_progress"></div>');
                this.$StatusBar.append(this.$ProgressBar);
                this.$ProgressBar.append(this.$ProgressValue);
                this.$DragIcon = $('<div style="margin-top:' + ((this.dimensions.height / 2) - 11) + 'px;margin-left:' + ((this.dimensions.width / 2) - 15) + 'px;" class="floop_drag_icon"></div>');
            },

            animateDragIcon: function () {

                this.$DragIcon.animate({
                        marginLeft: '-=2px'
                    }, 200).animate({
                        marginLeft: '+=2px'
                    }, 200, $.proxy(function () {

                            this.animateDragIcon();
                        }, this));
            },

            setFilename: function () {

                //This wait for a filename with this kind of structure : filename00015.jpg
                //In a next version, I'll work on an easy solution to specify a custom filename structure.
                regSequence = new RegExp("[0-9]+$");
                regFilenumber = new RegExp("^0*");
                this.filename.complete = this.element.attr("src").slice(1 + this.element.attr("src").lastIndexOf("/"), this.element.attr("src").length);
                this.filename.path = this.element.attr("src").slice(0, 1 + this.element.attr("src").lastIndexOf("/"));
                this.filename.extension = this.filename.complete.slice(1 + this.filename.complete.lastIndexOf("."), this.filename.complete.length);
                this.filename.noextension = this.filename.complete.slice(0, this.filename.complete.lastIndexOf("."));
                this.filename.sequence = this.filename.noextension.match(regSequence)[0];
                this.filename.number = parseInt(this.filename.sequence.replace(regFilenumber, ""));
                this.filename.number = (this.filename.number) ? this.filename.number : 0;
                this.filename.name = this.filename.noextension.slice(0, this.filename.noextension.lastIndexOf(this.filename.sequence));
            },

            loadPictures: function () {

                var sSequence = "";
                var sZero = "0";
                var img = "";
                var aImgs = [];
                var file = "";
                for (var i = 0; i <= this.numOfPics; i++) {
                    sSequence = "" + (this.minPic + (i * this.options.steps));
                    while (sSequence.length < this.filename.sequence.length) {
                        sSequence = sZero.concat(sSequence);
                    }
                    file = this.filename.path + this.filename.name + sSequence + "." + this.filename.extension;
                    img = $('<img style="display:none;" />');
                    img.attr('src', file).on("load", $.proxy(function (ev) {
                                aImgs.push(ev.currentTarget);
                                this.progress++;
                                this.incrementLoad();
                                this.trigger(event_progress, this.options.onProgress);
                                if (this.progress === (this.numOfPics)) {
                                    this.appendPictures(aImgs)
                                }
                            }, this));
                };
            },

            appendPictures: function (aImgs) {

                this.$StatusBar.remove();
                for (var i = 0; i <= this.numOfPics; i++) {
                    var myImg = aImgs[i];
                    var sSequence = "";
                    var sZero = "0";
                    sSequence = "" + (this.minPic + (i * this.options.steps));
                    while (sSequence.length < this.filename.sequence.length) {
                        sSequence = sZero.concat(sSequence);
                    }
                    file = this.filename.path + this.filename.name + sSequence + "." + this.filename.extension;
                    for (var j = 0; j <= this.numOfPics; j++) {
                        if ($(aImgs[j]).attr("src") === file) {
                            if (-1 != $(aImgs[j]).attr("src").indexOf(this.element.attr("src"))) {
                                this.$Images.append(this.element);
                            } else {
                                this.$Images.append(aImgs[j]);
                            }
                        }
                    }
                }
                this.options.callToAction ? this.$Images.before(this.$DragIcon) : null;
                this.animateDragIcon();
                this.setControls();
            },

            incrementLoad: function () {

                this.$ProgressValue.css("width", Math.ceil((this.progress / this.numOfPics) * 100) + "%");
            },

            setControls: function () {

                this.$Images.on("mouseover", $.proxy(function (ev) {
                            this.$DragIcon.remove();
                            $(ev.currentTarget).off("mouseover");
                        }, this));

                var prevX = 0;
                this.$Images.draggable({
                        iframeFix: true,
                        grid: [999999, 999999],
                        drag: $.proxy(function (ev, ui) {
                                if (!this.options.autoplay.locked) {
                                    this.stopAutoplay();
                                }
                                if ((prevX > ev.originalEvent.pageX)) {
                                    if (0 === ev.originalEvent.pageX % 3) {
                                        this.options.reverse ? this.displayNext() : this.displayPrev();
                                    }
                                }
                                if ((prevX < ev.originalEvent.pageX)) {
                                    if (0 === ev.originalEvent.pageX % 3) {
                                        this.options.reverse ? this.displayPrev() : this.displayNext();
                                    }
                                }
                                prevX = ev.originalEvent.pageX;
                            }, this)
                    });
                if (this.options.autoplay) {
                    this.startAutoplay();
                }
                this.trigger(event_complete, this.options.onComplete);
            },

            startAutoplay: function () {

                this.trigger(event_start, this.options.onStart);
                if (this.options.autoplay.locked) {
                    this.locked = "true";
                }
                this.options.autoplay.speed = (this.options.autoplay.speed) ? this.options.autoplay.speed : 25;
                this.options.autoplay.repeat = (this.options.autoplay.repeat) ? this.options.autoplay.repeat : 0;
                var trueSpeed = Math.ceil(1000 / this.options.autoplay.speed);
                var maxFrames = 0;
                if ("infinity" !== this.options.autoplay.repeat) {
                    maxFrames = (this.options.autoplay.repeat * this.numOfPics);

                }
                this.autoplayItv = setInterval($.proxy(function () {
                            if ("infinity" === this.options.autoplay.repeat || maxFrames > this.autoplayRepeats) {
                                this.autoplayRepeats++;
                                this.options.reverse ? this.displayPrev(true) : this.displayNext(true);
                            } else {
                                this.stopAutoplay();
                            }
                        }, this), trueSpeed);
            },

            stopAutoplay: function () {

                this.autoplayRepeats = 0;
                clearInterval(this.autoplayItv);
                this.autoplayItv = null;
                this.locked = false;
                this.trigger(event_stop, this.options.onStop);
            },

            displayPrev: function (force) {

                if (force || !this.locked) {
                    this.trigger(event_prev, this.options.onPrev);
                    if (this.element.prev().get(0)) {
                        this.element.css("display", "none");
                        this.element.prev().css("display", "block");
                        this.element = this.element.prev();
                    } else {
                        this.element.css("display", "none");
                        this.$Images.find("img:last-child").css("display", "block");
                        this.element = this.$Images.find("img:last-child");
                    }
                }
            },

            displayNext: function (force) {

                if (force || !this.locked) {
                    this.trigger(event_next, this.options.onNext);
                    if (this.element.next().get(0)) {
                        this.element.css("display", "none");
                        this.element.next().css("display", "block");
                        this.element = this.element.next();
                    } else {
                        this.element.css("display", "none");
                        this.$Images.find("img:first-child").css("display", "block");
                        this.element = this.$Images.find("img:first-child");
                    }
                }
            }
        };
        //PUBLIC FUNCTIONS. USAGE : $.floop(".myFloopSelector").next()
        publicMethod = $.fn[pluginName] = $[pluginName] = function (options) {

            var $this = this;
            options = options || {};
            return $this;
        };

        publicMethod.elements = [];

        publicMethod.getElement = function (selector) {

            var $element = $(selector),
                iElements = this.elements.length,
                i = 0;
            for (i; i < iElements; i++) {
                if (this.elements[i].element.parent().get(0) === $element.parent().get(0)) {
                    return this.elements[i];
                }
            }
        };

        publicMethod.next = function (selector) {

            var pg = this.getElement(selector);
            pg.displayNext()
        };

        publicMethod.prev = function (selector) {

            var pg = this.getElement(selector);
            pg.displayPrev()
        };

        publicMethod.play = function (selector) {

            var pg = this.getElement(selector);
            pg.startAutoplay()
        };

        publicMethod.stop = function (selector) {

            var pg = this.getElement(selector);
            pg.stopAutoplay()
        };

        $.fn[pluginName] = function (options) {

            return this.each(function () {

                    if (!$.data(this, "plugin_" + pluginName)) {
                        $.data(this, "plugin_" + pluginName, new Plugin(this, options));
                    }
                });
        };
    })(jQuery, window, document);