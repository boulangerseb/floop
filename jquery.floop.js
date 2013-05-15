/*
 *  Project: floop
 *  Description: A jQuery plugin to display a frames sequence as a browsable animation. Mainly used to simulate 3D roation in a browser.
 *  Author: Sébastien Boulanger
 *  License: Creative Commons
 */

// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.


;(function ( $, window, document, undefined ) {

    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.

    // window and document are passed through as local variable rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    // Create the defaults once
    var pluginName = "floop",
        defaults = {
            range: "0-100",
            steps: 1
        };

    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;

        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        
        this.options = $.extend( {}, defaults, options);
        this._isTouch = false;
        this._defaults = defaults;
        this._name = pluginName;
        this._filename = {complete: '', path: '',extension: '',noextension: '',sequence: '',number: 0,name: ''};
        this._minPic = 0;
        this._maxPic = 0;
        this._numOfPics = 0;
        this._dimensions = {width:0,height:0};
        this._container = "";
        this._visibleImg = $(this.element);
        this._progress =0;
        this.init();
    }

    Plugin.prototype = {
        init: function() {
            // Place initialization logic here
            // You already have access to the DOM element and
            // the options via the instance, e.g. this.element
            // and this.options
            // you can add more functions like the one below and
            // call them like so: this.yourOtherFunction(this.element, this.options)
            var context = this;
            if(0 === this.element.width || 0 === this.element.height){// Diffère le calcul de la taille en cas de non spécification des dimensions 
                $.ajax(this.element.src).done(function(data){
                    context._dimensions.width = context.element.width;
                    context.execR3d(context);
                });

            }else{
                this.execR3d(context);
            }
        },

        execR3d: function(context){
            this.isTouch = this.isTouchDevice();
            this._dimensions.width = this.element.width;
            this._dimensions.height = this.element.height;
            this.prepareHtml();
            this._minPic =  parseInt(this.options.range.slice(0,1+this.options.range.indexOf("-")));
            this._maxPic =  parseInt(this.options.range.slice(1+this.options.range.indexOf("-"),this.options.range.length));
            this._numOfPics = Math.floor(this._maxPic/this.options.steps);
            this.setFilename();
            this.loadPictures(context);
            this.setControls(context);  
        },


        isTouchDevice: function() {
            if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
                return true;
             }else {
                return false
             }
        },


        prepareHtml: function(){
            $(this.element).css({position:"relative",zIndex:"1"});
            this._container = $('<div class="floop_container" style="overflow:hidden;width:'+this._dimensions.width+'px;height:'+this._dimensions.height+'px;"></div>');
            $(this.element).wrap(this._container);
        },

        setFilename: function(){
            regSequence = new RegExp("[0-9]+$");
            regFilenumber = new RegExp("^0*");
            this._filename.complete = this.element.src.slice(1+this.element.src.lastIndexOf("/"),this.element.src.length);
            this._filename.path =  this.element.src.slice(0,1+this.element.src.lastIndexOf("/"));
            this._filename.extension = this._filename.complete.slice(1+this._filename.complete.lastIndexOf("."),this._filename.complete.length);
            this._filename.noextension = this._filename.complete.slice(0,this._filename.complete.lastIndexOf("."));
            this._filename.sequence = this._filename.noextension.match(regSequence)[0];
            this._filename.number = parseInt(this._filename.sequence.replace(regFilenumber,""));
            this._filename.name = this._filename.noextension.slice(0,this._filename.noextension.lastIndexOf(this._filename.sequence));            
        },

        loadPictures: function(context){
            var sSequence = "";
            var sZero ="0";
            var img = "";
            var aImgs =[]; 
            var file = "";
            for (var i = 0; i <= this._numOfPics; i++) {                
                sSequence = ""+(i*this.options.steps);
                while(sSequence.length<this._filename.sequence.length){
                    sSequence = sZero.concat(sSequence);
                }
                file = this._filename.path+this._filename.name+sSequence+"."+this._filename.extension;
                img = '<img style="display:inline;" src="'+file+'" />';
                if (i*this.options.steps<this._filename.number)
                {
                    aImgs.push(file);
                }
                else if (i*this.options.steps>this._filename.number)
                {
                    $.ajax(file,{complete:function(data){
                        context._progress++;
                        //Avoid IE 8/9 flashing effect at first load
                        if(context._progress === (context._maxPic/context.options.steps)-1){
                            $(context.element).parent().find("img").css("display","none");
                            $(context.element).css("display","block");
                        }
                    }});
                    $(context.element).parent().append(img);
                }else{}
            };
            for (var i = aImgs.length - 1; i >= 0; i--) {

                    $.ajax(aImgs[i],{complete:function(data){
                        context._progress++;
                        //Avoid IE flashing effect at first load
                        if(context._progress === (context._maxPic/context.options.steps)-1){
                            $(context.element).parent().find("img").css("display","none");
                            $(context.element).css("display","block");
                        }                        
                    }});
                    img = '<img style="display:inline;" src="'+aImgs[i]+'" />';
                    $(context.element).parent().prepend(img);
            };

        },

        setControls: function(context){

            var prevX = 0;
            $(context.element).parent().draggable({ 
                iframeFix: true,
                grid: [ 900000, 900000 ],
                drag:function( ev, ui ){
                    if((prevX > ev.originalEvent.pageX)){
                        if(0 == ev.originalEvent.pageX%3){
                            context.displayNext(context);
                        }
                    }                
                    if((prevX < ev.originalEvent.pageX)){
                        if(0 == ev.originalEvent.pageX%3){
                            context.displayPrev(context);
                        }
                    }
                    prevX = ev.originalEvent.pageX; 
            }});



            $(document).on("keydown",function(evt){
                switch(evt.which){
                    case 37 :
                        context.displayPrev(context);
                        break;
                    
                    case 39 :
                        context.displayNext(context);
                        break; 
                }

            });
        },

        displayPrev: function(context){
            if(context._visibleImg.prev().get(0)){
                context._visibleImg.css("display","none");
                context._visibleImg.prev().css("display","block");
                context._visibleImg = context._visibleImg.prev();
            }else{
                context._visibleImg.css("display","none");
                context._visibleImg.parent().find("img:last-child").css("display","block");
                context._visibleImg = context._visibleImg.parent().find("img:last-child");
            }

        },
        displayNext: function(context){
            if(context._visibleImg.next().get(0)){
                context._visibleImg.css("display","none");
                context._visibleImg.next().css("display","block");
                context._visibleImg = context._visibleImg.next();
            }else{
                context._visibleImg.css("display","none");
                context._visibleImg.parent().find("img:first-child").css("display","block");
                context._visibleImg = context._visibleImg.parent().find("img:first-child");
            }

        }
    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin( this, options ));
            }
        });
    };

})( jQuery, window, document );