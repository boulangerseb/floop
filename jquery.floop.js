/*
 *  Project: floop
 *  Description: A jQuery plugin to display a frames sequence as a browsable animation. Mainly used to simulate 3D roation in a browser.
 *  Author: Sébastien Boulanger
 *  License: Creative Commons
 *  Version: 0.5.2
 */

;(function ( $, window, document, undefined ) {
    var pluginName = "floop",
        defaults = {
            range: "0-100",
            steps: 1,
            reverse:false,
            callToAction:true,
            className:"",
            autoplay: {speed:25,repeat:"infinity",locked:true}, // sample value : {speed:25,repeat:5,locked:true}
            onLoad:null,
            onComplete:null
        };


    function Plugin( element, options ) {
        this.element = $(element);  
        this.options = $.extend( {}, defaults, options);
        this.truc = "blah";
        this._defaults = defaults;
        this._name = pluginName;
        this.filename = {complete: '', path: '',extension: '',noextension: '',sequence: '',number: 0,name: ''};
        this.minPic = 0;
        this.maxPic = 0;
        this.numOfPics = 0;
        this.dimensions = {width:0,height:0};
        //jQuery HTML elements
        this.jmlContainer = "";
        this.jmlImages = "";
        this.jmlDragIcon ="";
        this.jmlStatusBar = "";
        this.jmlProgressBar = "";
        this.jmlProgressValue = "";
        this.progress =0;
        this.autoplayItv = null;
        this.autoplayRepeats = 0;
        this.locked = false;
        this.init();
    }

    Plugin.prototype = {
        init: function() {
            this.execFloop();
        },

        execFloop: function(){
            this.dimensions.width = this.element.get(0).width;
            this.dimensions.height = this.element.get(0).height;
            this.minPic =  parseInt(this.options.range.slice(0,1+this.options.range.indexOf("-")));
            this.maxPic =  parseInt(this.options.range.slice(1+this.options.range.indexOf("-"),this.options.range.length));
            this.numOfPics = Math.ceil(this.maxPic/this.options.steps);
            this.setFilename();
            this.prepareHtml();
            this.bindTriggers();
            this.loadPictures();  
        },


        prepareHtml: function(){
            this.element.css({position:"relative",zIndex:"1"});
            this.jmlContainer = $('<div class="floop_container '+this.options.className+'" style="overflow:hidden;width:'+this.dimensions.width+'px;height:'+this.dimensions.height+'px;"></div>');
            this.jmlImages = $('<div class="floop_images" style="overflow:hidden;width:'+this.dimensions.width+'px;height:'+this.dimensions.height+'px;"></div>');
          
            this.element.wrap(this.jmlImages);
            this.jmlImages = $(this.element.parent());
            this.jmlImages.wrap(this.jmlContainer);
            this.jmlContainer = $(this.jmlImages.parent());
            this.jmlStatusBar = $('<div style="width:'+this.dimensions.width+'px;" class="floop_status"></div>');
            this.jmlImages.after(this.jmlStatusBar);

            this.jmlProgressValue = $('<div style="width:0%;" class="floop_progress_value"></div>');
            this.jmlProgressBar = $('<div class="floop_progress"></div>');
            this.jmlStatusBar.append(this.jmlProgressBar);
            this.jmlProgressBar.append(this.jmlProgressValue);
            this.jmlDragIcon = $('<div style="margin-top:'+((this.dimensions.height/2)-11)+'px;margin-left:'+((this.dimensions.width/2)-15)+'px;" class="floop_drag_icon"></div>');    
        },

        bindTriggers:function(){
            this.element.bind("play",$.proxy(function(){
                this.startAutoplay();
            }),this);

            this.element.bind("stop",$.proxy(function(){
                this.startAutoplay();
            }),this);

            this.element.bind("next",$.proxy(function(){
                this.startAutoplay();
            }),this);

            this.element.bind("prev",$.proxy(function(){
                this.startAutoplay();
            }),this);
        },

        animateDragIcon:function(){
            this.jmlDragIcon.animate({marginLeft:'-=2px'}, 200).animate({marginLeft:'+=2px'},200,$.proxy(
                function(){
                    this.animateDragIcon();
                },this
            ));      
        },

        setFilename: function(){
            regSequence = new RegExp("[0-9]+$");
            regFilenumber = new RegExp("^0*");
            this.filename.complete = this.element.attr("src").slice(1+this.element.attr("src").lastIndexOf("/"),this.element.attr("src").length);
            this.filename.path =  this.element.attr("src").slice(0,1+this.element.attr("src").lastIndexOf("/"));
            this.filename.extension = this.filename.complete.slice(1+this.filename.complete.lastIndexOf("."),this.filename.complete.length);
            this.filename.noextension = this.filename.complete.slice(0,this.filename.complete.lastIndexOf("."));
            this.filename.sequence = this.filename.noextension.match(regSequence)[0];
            this.filename.number = parseInt(this.filename.sequence.replace(regFilenumber,""));
            this.filename.number = (this.filename.number) ? this.filename.number : 0;
            this.filename.name = this.filename.noextension.slice(0,this.filename.noextension.lastIndexOf(this.filename.sequence));            
        },

        loadPictures: function(){
            var sSequence = "";
            var sZero = "0";
            var img = "";
            var aImgs = []; 
            var file = "";
            for (var i = 0; i <= this.numOfPics; i++) {                
                sSequence = ""+(this.minPic+(i*this.options.steps));
                while(sSequence.length<this.filename.sequence.length){
                    sSequence = sZero.concat(sSequence);
                }                
                file = this.filename.path+this.filename.name+sSequence+"."+this.filename.extension;
                img = $('<img style="display:none;" />');
                img.attr('src', file).on("load", $.proxy(
                    function(ev) {
                        aImgs.push(ev.currentTarget);
                        this.progress++;  
                        this.incrementLoad();
                        if(this.progress === (this.numOfPics)){
                            this.appendPictures(aImgs)
                        }
                    },this
                ));

            };
        },

        appendPictures: function(aImgs){

            this.jmlStatusBar.remove();
            for (var i = 0; i <= this.numOfPics; i++) {
                var myImg = aImgs[i];
                var sSequence = "";
                var sZero ="0";
                sSequence = ""+(this.minPic+(i*this.options.steps));
                while(sSequence.length<this.filename.sequence.length){
                    sSequence = sZero.concat(sSequence);
                }                
                file = this.filename.path+this.filename.name+sSequence+"."+this.filename.extension;                
                for (var j = 0; j <= this.numOfPics; j++) {             
                    if($(aImgs[j]).attr("src") === file){
                        if(-1 != $(aImgs[j]).attr("src").indexOf(this.element.attr("src"))){
                            this.jmlImages.append(this.element);
                        }else{
                            this.jmlImages.append(aImgs[j]);
                        }
                    }
                }
            }
            this.options.callToAction ? this.jmlImages.before(this.jmlDragIcon) : null;
            this.animateDragIcon();
            this.setControls();
        },

        incrementLoad: function(){ 
            this.jmlProgressValue.css("width",Math.ceil((this.progress/this.numOfPics)*100)+"%");
        },

        setControls: function(){
            this.jmlImages.on("mouseover",$.proxy(function(ev){
                this.jmlDragIcon.remove();
                $(ev.currentTarget).off("mouseover");
            },this));

            var prevX = 0;
            this.jmlImages.draggable({ 
                iframeFix: true,
                grid: [999999,999999],
                drag:$.proxy(function( ev, ui ){
                    if(!this.options.autoplay.locked){this.stopAutoplay();}

                    if((prevX > ev.originalEvent.pageX)){
                        if(0 === ev.originalEvent.pageX%3){
                            this.options.reverse ? this.displayNext() : this.displayPrev();
                        }
                    }                
                    if((prevX < ev.originalEvent.pageX)){
                        if(0 === ev.originalEvent.pageX%3){
                            this.options.reverse ? this.displayPrev() : this.displayNext();
                        }
                    }
                    prevX = ev.originalEvent.pageX; 
            },this)});
            if(this.options.autoplay){
              this.startAutoplay();  
            }
        },

        startAutoplay:function(){   
           if(this.options.autoplay.locked){
             this.locked="true";
           }
           this.options.autoplay.speed = (this.options.autoplay.speed) ? this.options.autoplay.speed : 25;
           this.options.autoplay.repeat = (this.options.autoplay.repeat) ? this.options.autoplay.repeat : 1;
           var trueSpeed = Math.ceil(1000/this.options.autoplay.speed);
           var maxFrames = 0;
           if("infinity" !== this.options.autoplay.repeat){
             maxFrames = (this.options.autoplay.repeat*this.numOfPics)+(Math.ceil(this.filename.number/this.options.steps));
             
           } 
           //console.log(maxFrames,context.o._autoplayRepeats);
            this.autoplayItv = setInterval($.proxy(function(){
               if("infinity" === this.options.autoplay.repeat || maxFrames >= this.autoplayRepeats){
                   this.autoplayRepeats ++; 
                   this.options.reverse ? this.displayPrev(true) : this.displayNext(true);                                        
               }else{
                   this.stopAutoplay();
               }
            },this),trueSpeed);       
        },
        stopAutoplay:function(){
            this.autoplayRepeats = 0;
            clearInterval(this.autoplayItv);
            this.autoplayItv = null;
            this.locked=false;
        },
        displayPrev: function(force){
            if(force || !this.locked){
                if(this.element.prev().get(0)){
                    this.element.css("display","none");
                    this.element.prev().css("display","block");
                    this.element = this.element.prev();
                }else{
                    this.element.css("display","none");
                    this.jmlImages.find("img:last-child").css("display","block");
                    this.element = this.jmlImages.find("img:last-child");
                }
            }
        },
        displayNext: function(force){
            if(force || !this.locked){
                if(this.element.next().get(0)){
                    this.element.css("display","none");
                    this.element.next().css("display","block");
                    this.element = this.element.next();
                }else{
                    this.element.css("display","none");
                    this.jmlImages.find("img:first-child").css("display","block");
                    this.element = this.jmlImages.find("img:first-child");
                }
            }
        }
    };

    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin( this, options ));
            }
        });
    };

})( jQuery, window, document );