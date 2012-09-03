/**
 * Matrix Responsive Image Varieties
 */

(function($, root, undefined){

    /**
     * Constructor
     * @param {object} options          JSON options for generating the responsive image tags
     */
    function MRIV(options) {
        this.options.set(options);

        if (!options.hasOwnProperty('resize') || options.resize !== false) {
            this.bindResize();
        }//end if

        // Stored output tags
        this.outputs = [];

        // Stored last variety name (so resize doesn't trigger full dom manipulation again)
        this.lastVariety = '';

        // Run on instantiation
        if (this.options.get().run) {
            this.run();
        }//end if
    }//end constructor

    (function(p){

        /**
         * Default outputter functionality to inject a new image element to the dom
         * @param {object} elem     The original element analysed for 'responsiveness'
         * @param {string} url      Variety URL
         * @param {string} name     The name of the URL
         * @param {string} alt      The alt text of the image
         * @returns {object} Returns a jQuery collection with the new element
         */
        function defaultOutputter(elem, url, name, alt) {
            var $tag = $('<img src="' + url + '" alt="' + alt + '" class="variety variety-' + name + '" />');
            $(elem).before($tag);
            return $tag;
        }//end defaultOutputter()

        /**
         * Generate a variety url for a source url with a supplied variety name
         * @param {string} source       The source url
         * @param {string} varietyName  The name of the variety
         * @returns {string} The new variety url
         */
        function generateVarietyUrl(source, varietyName) {
            var imageExt = /\.(jpeg|gif|jpg|png)$/i;
            var extMatches = imageExt.exec(source);
            var pathReg = new RegExp("(.*)__data\/assets\/image\/[0-9]{4}/[0-9]{4}\/","i");
            var pathMatches = pathReg.exec(source);
            var isLive  = (pathMatches !== null);
            if (extMatches === null) {
                return source;
            }//end if
            var ext = extMatches[1].toLowerCase();

            // We found more than one file extension, it's probably already a variety
            if (extMatches.length > 2 && !isLive) {
                return source;
            }//end if

            // If the asset is live and contains varieties in the url it's already
            // a variety
            if (isLive && /\/varieties\//.exec(source) !== null) {
                return source;
            }//end if

            if (isLive) {
                // It's live, inject the varieties portion of the url
                return pathMatches[0] + 'varieties/' + varietyName + '.' + ext;
            } else {
                // It's not live, simply append the variety name to the source url
                // with the appropriate extension
                return source + '/' + varietyName + '.' + ext;
            }//end if

        }//end generateVarietyUrl

        // Option handling
        p.options = {

            _opt: {},

            defaults: {
                // What output are we going to generate
                output:         {},

                // What is the tag name we are looking for?
                tagName:        'noscript',

                // What is the attribute that contains the url to transform the image
                // variety for?
                urlAttribute:   'data-url',
                altAttribute:   'data-alt',

                // Where are we allowed to find nodes?
                allowedNodes:   'body',

                // Remove the original element? The run() will automatically exit if
                // there are no original elements to act upon
                removeOriginal: false,

                // Re-evaluate the code on window resize?
                resize:         true,

                // Force the outputter to run even if the variety hasn't changed from
                // a previous run?
                force:          false,

                // Run when first instantiated
                run:            true,

                // Screen width getter - can be overridden
                getWidth: function(){
                    return $(window).width();
                }
            },

            /**
             * Set options from user supplied object
             * @param {object} options      JSON
             */
            set: function(options) {
                this._opt = $.extend({}, this.defaults, options);
            },//end set()

            /**
             * Get the currently set options, or individual option
             * @param {string} (name)   single option to retrieve
             */
            get: function(name) {
                if (name === undefined || !this._opt.hasOwnProperty(name)) {
                    return this._opt;
                }//end if
                return this._opt[name];
            }//end get()

        };//end options

        /**
         * Bind a custom resize event to run mriv each time the screen is resized
         */
        var _time = null;
        p.bindResize = function(){
            var self = this;
            $(window).bind('resize.mriv',function(){
                clearTimeout(_time);
                _time = setTimeout(function(){
                    self.run.call(self);
                },200);
            });
        };//end if

        /**
         * Unbind the custom resize event
         */
        p.unbindResize = function(){
            $(window).unbind('resize.mriv');
        };//end if

        /**
         * Scans the document to find valid tags to transform
         * @returns {object} jQuery collection of tags
         */
        p.scan = function(){
            var opt = this.options.get();
            var $tags = $(opt.tagName + '[' + opt.urlAttribute + ']',opt.allowedNodes);
            return ($tags.length) ? $tags : [];
        };//end scan()

        /**
         * Iterate outputters
         * @param {function} iterator       Iterate each output type
         * @param {object} scope            Scope to run the iterator
         * @returns {array}
         */
        p.each = function(iterator, scope) {
            scope = scope === undefined ? this : scope;
            var opt   = this.options.get();
            var outputs = [];
            for (var name in opt.output) {
                if (opt.output.hasOwnProperty(name)) {
                    outputs.push(iterator.call(scope, name, opt.output[name]));
                }// end if
            }//end for
            return outputs;
        };//end each()

        /**
         * Find the right variety for the current screen width
         * @param {number} screenWidth      The width of the screen to check
         */
        p.findVariety = function(screenWidth) {
            var variety = null;
            matches = this.each(function(name, output){
                var min = 0;
                var max = 9001; // It's over 9000!
                if (output.hasOwnProperty('width')) {
                    if (output.width.hasOwnProperty('length')) {
                        min = parseFloat(output.width[0]);
                        max = (output.width.length === 2) ?
                            parseFloat(output.width[1]) : max;
                    } else {
                        min = parseFloat(output.width);
                    }//end if
                }//end if
                // Should we use this variety rule?
                if (screenWidth >= min && screenWidth <= max) {
                    return {
                        name: name,
                        output: output
                    };
                }//end if
            });

            // If we find a match return the first
            if (matches.length) {
                return matches[0];
            }//end if
            return null;
        };//end findVariety

        /**
         * The main runner
         */
        p.run = function() {

            var $tags       = this.scan(),
                opts        = this.options.get(),
                self        = this;

            var variety = this.findVariety(opts.getWidth());

            if (!opts.resize) {
                return false;
            }//end if

            // Don't run it multiple times if the variety hasn't changed
            if (this.lastVariety === variety && !opts.force) {
                return false;
            }//emd if

            this.lastVariety = variety;

            // Clean up old outputs
            jQuery.each(self.outputs, function(i,output){
                if (output) {
                    output.remove();
                }//end if
            });
            self.outputs = [];

            // Iterate tags and produce a variety image tag
            if ($tags.length) {
                $tags.each(function(){
                    var $tag = $(this);
                    var varietyOutputterFn = defaultOutputter;
                    var name = 'default';
                    var alt = $tag.attr(opts.altAttribute);
                    var url = $tag.attr(opts.urlAttribute);

                    // If we have a variety for this screen resolution
                    if (variety !== null && variety !== undefined) {
                        name = variety.name;
                        url = generateVarietyUrl(
                            $tag.attr(opts.urlAttribute),
                            name
                        );
                        if (variety.output.hasOwnProperty('outputter') &&
                            typeof(variety.output.outputter) === 'function') {
                            varietyOutputterFn = variety.output.outputter;
                        }//end if
                    }//end if

                    var $outputTag = varietyOutputterFn.call(self, $tag.get(0), url, name, alt);

                    self.outputs.push($outputTag);
                });

                if (opts.removeOriginal) {
                    $tags.remove();
                }//end if
            }//end if
        };//end run()

    })(MRIV.prototype);

    // Give a global object that can be instantiated separately
    root.MRIV = MRIV;

})(jQuery, typeof(window) !== 'undefined' ? window : this);