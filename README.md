Responsive Image Varieties for Squiz Matrix
===========================================

Output image tags with variety paths depending on min/max screen width rules. The
variety name url in Squiz Matrix has a 'guessable' structure in all statuses.

This solution is based on some ideas blogged about here:
http://blog.cloudfour.com/responsive-imgs-part-2/

Create a noscript tag seems to be the best solution for storing an image to a matrix
image asset and creating a variety version of the image. The image must be set up
with varieties for this to work, if no varieties with the correct name are used then
this will generate a 404

Getting started
---------------

```html
<noscript data-url="./?a=3627" data-alt="%asset_attribute_alt:3627%">
   <img src="./?a=3627" alt="%asset_attribute_alt:3627%" />
</noscript>
```

Variety names should be configured in JSON format with minimum and maximum screen
widths to decide when a particular variety should be used. To use this script there
should be a minimum of one 'output' property.

```javascript
var outputRules = {
    output: {
        mobile: {
            width: 320 // Same as saying min 0, max 320
        },
        tablet: {
            width: [320, 768]
        }
    }
};

var varieties = new MRIV(outputRules);
```

Options
-------

You can supply optional parameters to the code to customise the behaviour,

** Customised outputter **
You can override the way this code outputs tags and replace it with something custom
per variety.

Example:
```javascript
var outputRules = {
    output: {
        mobile: {
            width: 460,
            outputter: function(elem, url, name) {
                // Output this as a background instead of an image tag
                var $tag = $('<span class="custom" style="background: url(' + url + ')">' + name + '</span>');
                $(elem).after($tag);
                return $tag;
            }
        }
    }
};
```

**Tag name**
Change the tag name to search for instead of noscript

```html
<span class="responsive-image-placeholder" data-url="./?a=1234" data-alt=""></span>
```

```javascript
var outputRules = {
    // ... output rules
    tagName: 'span.responsive-image-placeholder'
};
```

**Url attribute**
Change the url attribute we seek to create the image variety

```html
<img src="./?a=1234" alt="" data-alt="" />
```

```javascript
var outputRules = {
    // ... output rules
    tagName: 'img',
    urlAttribute: 'src'
};
```

**Allowed nodes**
Choose scope this script is allowed to search within for nodes to create image
varieties.

```javascript
var outputRules = {
    // ... output rules
    allowedNodes: 'div#content, div#header' // only tags under these 2 divs will be processed
};
```
**Remove the original node**
You can optionally remove the original node. By default this node is 'noscript' who's contents
won't be rendered to the dom, but if you wanted to transform <img> tags you could use this to 
remove the original

```javascript
var outputRules = {
    // ... output rules
    removeOriginal: true
};
```

**Respond to browser resize event**
By default when the browser is resized this script will re-run itself to find if
a new variety rule has been met. You can disable this by supplying resize: false

**Force run**
Setting force: true will re-write the created element each time the outputter is run
including on the browser resize event. Leave it to false for best performance.

**Run on instantiation**
If you don't want this to run when the code is instantiated set this to run: false. This
means you will need to manually call the run() method at the time you choose to evaluate
the tags.

**Screen width retrieval method**
You can supply a custom method to determine the screen width. By default it uses
jQuery.width() on the window object. If you need to do some custom calculations to
determine screen width you can supply a custom getWidth() function.

```javascript
var outputRules = {
    // ... output rules
    getWidth: function(){
        return $('#main-content').width() + 20;
    }
};
````
