/**
 * @private
 * iOS version of viewport.
 */
Ext.define('Ext.viewport.Ios', {
    extend: 'Ext.viewport.Default',

    isFullscreen: function () {
        return this.isHomeScreen();
    },

    isHomeScreen: function () {
        return window.navigator.standalone === true;
    },

    constructor: function () {
        this.callParent(arguments);

        if (this.getAutoMaximize() && !this.isFullscreen()) {
            this.addWindowListener('touchstart', Ext.Function.bind(this.onTouchStart, this));
        }
    },

    maximize: function () {
        if (this.isFullscreen()) {
            return this.callParent();
        }

        var stretchHeights = this.stretchHeights,
            orientation = this.getOrientation(),
            currentHeight = this.getWindowHeight(),
            height = stretchHeights[orientation];

        if (window.scrollY > 0) {
            this.scrollToTop();

            if (!height) {
                stretchHeights[orientation] = height = this.getWindowHeight();
            }

            this.setHeight(height);
            this.fireMaximizeEvent();
        }
        else {
            if (!height) {
                height = this.getScreenHeight();
            }

            this.setHeight(height);

            this.waitUntil(function () {
                this.scrollToTop();
                return currentHeight !== this.getWindowHeight();
            }, function () {
                if (!stretchHeights[orientation]) {
                    height = stretchHeights[orientation] = this.getWindowHeight();
                    this.setHeight(height);
                }

                this.fireMaximizeEvent();
            }, function () {
                //<debug error>
                Ext.Logger.error("Timeout waiting for window.innerHeight to change", this);
                //</debug>
                height = stretchHeights[orientation] = this.getWindowHeight();
                this.setHeight(height);
                this.fireMaximizeEvent();
            }, 50, 1000);
        }
    },

    getScreenHeight: function () {
        var orientation = this.getOrientation();
        return window.screen[orientation === this.PORTRAIT ? 'height' : 'width'];
    },

    onElementFocus: function () {
        if (this.getAutoMaximize() && !this.isFullscreen()) {
            clearTimeout(this.scrollToTopTimer);
        }

        this.callParent(arguments);
    },

    onElementBlur: function () {
        if (this.getAutoMaximize() && !this.isFullscreen()) {
            this.scrollToTopTimer = setTimeout(this.scrollToTop, 500);
        }

        this.callParent(arguments);
    },

    onTouchStart: function () {
        if (this.focusedElement === null) {
            this.scrollToTop();
        }
    },

    scrollToTop: function () {
        window.scrollTo(0, 0);
    }

}, function () {
    if (!Ext.os.is.iOS) {
        return;
    }

    if (Ext.os.version.lt('3.2')) {
        this.override({
            constructor: function () {
                var stretchHeights = this.stretchHeights = {};

                stretchHeights[this.PORTRAIT] = 416;
                stretchHeights[this.LANDSCAPE] = 268;

                return this.callOverridden(arguments);
            }
        });
    }

    if (Ext.os.version.lt('5')) {
        this.override({
            fieldMaskClsTest: '-field-mask',

            doPreventZooming: function (e) {
                var target = e.target;

                if (target && target.nodeType === 1 && !this.isInputRegex.test(target.tagName) &&
                    target.className.indexOf(this.fieldMaskClsTest) == -1) {
                    e.preventDefault();
                }
            }
        });
    }

    if (Ext.os.is.iPad) {
        this.override({
            isFullscreen: function () {
                return true;
            }
        });
    }

    if (Ext.os.version.gtEq('7') && Ext.os.version.lt('8')) {
        // iPad or Homescreen or UIWebView
        if (Ext.os.deviceType === 'Tablet' || !Ext.browser.is.Safari || window.navigator.standalone) {
            this.override({
                constructor: function () {
                    var stretchHeights = {},
                        stretchWidths = {},
                        orientation = this.determineOrientation(),
                        screenHeight = window.screen.height,
                        screenWidth = window.screen.width,
                        menuHeight = orientation === this.PORTRAIT
                            ? screenHeight - window.innerHeight
                            : screenWidth - window.innerHeight;

                    stretchHeights[this.PORTRAIT] = screenHeight - menuHeight;
                    stretchHeights[this.LANDSCAPE] = screenWidth - menuHeight;

                    stretchWidths[this.PORTRAIT] = screenWidth;
                    stretchWidths[this.LANDSCAPE] = screenHeight;

                    this.stretchHeights = stretchHeights;
                    this.stretchWidths = stretchWidths;

                    this.callOverridden(arguments);

                    this.on('ready', this.setViewportSizeToAbsolute, this);
                    this.on('orientationchange', this.setViewportSizeToAbsolute, this);
                },

                getWindowHeight: function () {
                    var orientation = this.getOrientation();
                    return this.stretchHeights[orientation];
                },

                getWindowWidth: function () {
                    var orientation = this.getOrientation();
                    return this.stretchWidths[orientation];
                },

                setViewportSizeToAbsolute: function () {
                    this.setWidth(this.getWindowWidth());
                    this.setHeight(this.getWindowHeight());
                }
            });
        }

        // iPad Only
        if (Ext.os.deviceType === 'Tablet') {
            this.override({
                constructor: function () {
                    this.callOverridden(arguments);

                    window.addEventListener('scroll', function () {
                        if (window.scrollX !== 0) {
                            window.scrollTo(0, window.scrollY);
                        }
                    }, false);
                },

                setViewportSizeToAbsolute: function () {
                    window.scrollTo(0, 0);

                    this.callOverridden(arguments);
                },

                onElementBlur: function () {
                    this.callOverridden(arguments);
                    if (window.scrollY !== 0) {
                        window.scrollTo(0, 0);
                    }
                }
            });
        }
    }
});
