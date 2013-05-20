/*
 *  Project: floop
 *  Description: A jQuery plugin to display a frames sequence as a browsable animation. Mainly used to simulate 3D roation in a browser.
 *  Author: Sébastien Boulanger
 *  License: Creative Commons
 *  Version: 0.5.1
 */

;(function ( $, window, document, undefined ) {
    var pluginName = "floop",
        defaults = {
            range: "0-100",
            steps: 1,
            reverse:false,
            callToAction:true,
            className:"",
            autoplay: false, // sample value : {speed:25,repeat:5,locked:true}
            onLoad:null,
            onComplete:null
        };


    function Plugin( element, options ) {
        this.element = element;
        
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
        this._dragIcon ="";
        this._statusBar = "";
        this._progressBar = "";
        this._progressValue = "";
        this._visibleImg = $(this.element);
        this._progress =0;
        this._autoplayItv = null;
        this._autoplayRepeats = 0;
        this.init();
    }

    Plugin.prototype = {
        init: function() {
            var context = this;
            if(0 === this.element.width || 0 === this.element.height){// Diffère le calcul de la taille en cas de non spécification des dimensions 
                $.ajax(this.element.src).done(function(data){
                    context._dimensions.width = context.element.width;
                    context.execFloop(context);
                });

            }else{
                this.execFloop(context);
            }
        },

        execFloop: function(context){
            this.isTouch = this.isTouchDevice();
            this._dimensions.width = this.element.width;
            this._dimensions.height = this.element.height;
            this._minPic =  parseInt(this.options.range.slice(0,1+this.options.range.indexOf("-")));
            this._maxPic =  parseInt(this.options.range.slice(1+this.options.range.indexOf("-"),this.options.range.length));
            this._numOfPics = Math.ceil(this._maxPic/this.options.steps);
            console.log(this._numOfPics);
            this.setFilename();
            this.prepareHtml(context);
            this.loadPictures(context);   
        },


        isTouchDevice: function() {
            if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
                return true;
             }else {
                return false
             }
        },


        prepareHtml: function(context){
            $(this.element).css({position:"relative",zIndex:"1"});
            this._container = $('<div class="floop_container '+this.options.className+'" style="overflow:hidden;width:'+this._dimensions.width+'px;height:'+this._dimensions.height+'px;"></div>');
            $(this.element).wrap(this._container);
            this._statusBar = $('<div style="width:'+this._dimensions.width+'px;" class="floop_status"></div>');
            $(this.element).parent().after(this._statusBar);

            this._progressValue = $('<div style="width:0%;" class="floop_progress_value"></div>');
            this._progressBar = $('<div class="floop_progress"></div>');
            this._statusBar.append(this._progressBar);
            this._progressBar.append(this._progressValue);
            this._dragIcon = $('<div style="margin-top:'+((this._dimensions.height/2)-11)+'px;margin-left:'+((this._dimensions.width/2)-15)+'px;" class="floop_drag_icon"></div>');
        },

        animateDragIcon:function(context){
            this._dragIcon.animate({marginLeft:'-=2px'}, 200,function(){
                context._dragIcon.animate({marginLeft:'+=2px'}, 200,function(){
                    context.animateDragIcon(context);
                });
            });            
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
            var sZero = "0";
            var img = "";
            var aImgs = []; 
            var file = "";
            for (var i = 0; i <= this._numOfPics; i++) {                
                sSequence = ""+(this._minPic+(i*this.options.steps));
                while(sSequence.length<this._filename.sequence.length){
                    sSequence = sZero.concat(sSequence);
                }                
                file = this._filename.path+this._filename.name+sSequence+"."+this._filename.extension;
                img = $('<img style="display:none;" />');
                img.attr('src', file).load(function() {
                    if (!this.complete || typeof this.naturalWidth == "undefined" || this.naturalWidth == 0) {
                        console.log('Something wrong happens : '+file);
                    } else {
                        aImgs.push(this);
                    }
                    
                    context.incrementLoad();
                    if(context._progress == context._numOfPics){
                        context.appendPictures(aImgs,context)
                    }else{
                      context._progress++;  
                    }
                });
            };
        },

        appendPictures: function(aImgs,context){
            this._statusBar.remove();
            for (var i = 0; i <= this._numOfPics; i++) {
                var myImg = aImgs[i];
                var sSequence = "";
                var sZero ="0";
                sSequence = ""+(this._minPic+(i*this.options.steps));
                while(sSequence.length<this._filename.sequence.length){
                    sSequence = sZero.concat(sSequence);
                }                
                file = this._filename.path+this._filename.name+sSequence+"."+this._filename.extension;                
                for (var j = 0; j <= this._numOfPics; j++) {             
                    if($(aImgs[j]).attr("src") == file){
                        if(-1 != $(aImgs[j]).attr("src").indexOf($(this.element).attr("src"))){
                            $(this.element).parent().append($(this.element));
                        }else{
                            $(this.element).parent().append(aImgs[j]);
                        }
                    }
                }
            }

            this.options.callToAction ? $(this.element).parent().before(this._dragIcon) : null;
            this.animateDragIcon(context);
            this.setControls(context);
        },

        incrementLoad: function(){ 
            this._progressValue.css("width",Math.ceil((this._progress/this._numOfPics)*100)+"%");
        },

        setControls: function(context){

            $(context.element).parent().on("mouseover",function(){
                context._dragIcon.remove();
                $(this).off("mouseover");
            });

            var prevX = 0;
            $(context.element).parent().draggable({ 
                iframeFix: true,
                grid: [900000, 900000],
                drag:function( ev, ui ){
                    
                    if((prevX > ev.originalEvent.pageX)){
                        if(0 == ev.originalEvent.pageX%3){
                            context.options.reverse ? context.displayNext(context) : context.displayPrev(context);
                        }
                    }                
                    if((prevX < ev.originalEvent.pageX)){
                        if(0 == ev.originalEvent.pageX%3){
                            context.options.reverse ? context.displayPrev(context) : context.displayNext(context);
                        }
                    }
                    prevX = ev.originalEvent.pageX; 
            }});

            $(document).on("keydown",function(evt){
                switch(evt.which){
                    case 37 :
                        context.options.reverse ? context.displayNext(context) : context.displayPrev(context);
                        context._dragIcon.remove();
                        break;
                    
                    case 39 :
                        context.options.reverse ? context.displayPrev(context) : context.displayNext(context);
                        context._dragIcon.remove();
                        break; 
                }
            });

            if(this.options.autoplay){
              this.startAutoplay(context);  
            }

        },

        startAutoplay:function(context){
           var trueSpeed = Math.ceil(1000/context.options.autoplay.speed);
           var maxFrames = (context.options.autoplay.repeat*context._numOfPics)+2*(Math.ceil(this._filename.number/this.options.steps));
           console.log(maxFrames,context._autoplayRepeats);  
            context._autoplayItv = setInterval(function(){
               if(maxFrames >= context._autoplayRepeats){
                   context.options.reverse ? context.displayPrev(context) : context.displayNext(context);
                   context._autoplayRepeats ++;                      
               }else{
                    clearInterval(context._autoplayItv);
                    context._autoplayItv = null;
               }
            },trueSpeed);       
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

    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin( this, options ));
            }
        });
    };

})( jQuery, window, document );