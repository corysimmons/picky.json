(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Highlight = factory());
}(this, function () { 'use strict';

  var babelHelpers = {};
  babelHelpers.typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
  };
  babelHelpers;

  var hasConsole = typeof console !== 'undefined';
  var hasCollapsedConsole = !!console.groupCollapsed;
  var hasRactive = typeof Ractive !== 'undefined';
  var hasWindow = typeof window !== 'undefined';

  var config = {
    debug: true,
    messages: {
      localStorage: 'Loading JSON from your previous session...'
    },
    localStorage: true,
    loading: false
  };

  var spinner = '\n  <div class="default-spinner">\n    <div class="rect1"></div>\n    <div class="rect2"></div>\n    <div class="rect3"></div>\n    <div class="rect4"></div>\n  </div>\n';

  var intro = ['Picky-highlight 0.0.2 in debug mode.'];
  var message = '\nHello, you are running Picky-highlight 0.0.2 in debug mode.\nThis will help you to identify any problems in your application.\n\'debug mode\' is a global option which will disable debug mode for each\ninstance. You can disable it when declaring a new instance. For example,\nnew Highlighter({debug: false});\nFor documentation head to the wiki:\n  https://github.com/danjford/picky-highlight/wiki\nIf you have found any bugs, create an issue for us:\n  https://github.com/danjford/picky-highlight/issues\n';

  /**
   * The welcome function gives a message to the user letting the know
   * some key things about the Highlighter.
   * @return {Void}, nothing returned
   */
  function welcome() {

    if (hasConsole && config.debug) {

      console[hasCollapsedConsole ? 'groupCollapsed' : 'log'].apply(console, intro);

      console.log(message);

      if (hasCollapsedConsole) {
        console.groupEnd(intro);
      }
    }
  }

  /*
   * The full function for extending an array of objects into a new object,
   * can be optionally deep which will recursively go through properties.
   *
   * @param {Object} dest, the new object to write to
   * @param {Array} objs, the array of objects to extend
   * @param {Boolean} deep, decides if copy should be recursive
   * @return {Object} the new written object
  */
  function fullExtend(dest, objs, deep) {
    for (var i = 0, ii = objs.length; i < ii; i++) {
      var obj = objs[i];

      if (!isObject(obj)) return;

      var objKeys = Object.keys(obj);

      for (var j = 0, jj = objKeys.length; j < jj; j++) {
        var key = objKeys[j];
        var val = obj[key];

        if (isObject(val) && deep) {
          if (!isObject(dest[key])) dest[key] = Array.isArray(val) ? [] : {};
          fullExtend(dest[key], [val], true);
        } else {
          dest[key] = val;
        }
      }
    }

    return dest;
  }

  /**
   * @param  {Object} val, the parameter to check if it is a object
   * @return {Boolean} whether or not the parameter is an object
   */
  function isObject(val) {
    return val !== null && (typeof val === 'undefined' ? 'undefined' : babelHelpers.typeof(val)) === 'object';
  }

  /**
   * On click of collapse button, collapses the array or object display and stores it in collapsed: []
   * @param  {Object} el, returns the Ractive element
   * @return {Void}, Doesn't return anything.
   */
  function collapse(el) {

    if (!this.get('collapsed')) this.set('collapsed', []);

    if (this.get('collapsed').indexOf(el.keypath) > -1) {
      this.splice('collapsed', this.get('collapsed').indexOf(el.keypath), 1);
    } else {
      this.push('collapsed', el.keypath);
    }
  }

  /**
   * Sets the currently clicked / selected value
   * @param  {String} path, the current JSON path
   * @return {Void}, doesn't return anything
   */
  function showPath(path) {

    this.set('isSelected', path.keypath);
  }

  /**
   * Removes all classes of the given className
   * @param  {String} name, the class that you want to remove
   * @return {Void}, doesn't return anything
   */
  var removeClass = function removeClass(name) {

    var elems = document.querySelectorAll(name);

    [].forEach.call(elems, function (el) {
      el.classList.remove(name.replace(/\./, ''));
    });
  };

  /**
   * Returns you the closest parent with a given className
   * @param  {HTMLElement} element, The element you want to find the parent of
   * @param  {String} name, the class name you want the found parent to have.
   * @return {HTMLElement}, The parent with the class Name of the element you want.
   */
  var closest = function closest(element, name) {

    var base = element.node;

    var recurse = function recurse(el) {

      if (el.className && el.className.indexOf(name.replace(/\./, '')) > -1) {
        return el;
      } else {
        return recurse(el.parentNode);
      }
    };

    return recurse(base);
  };

  /**
   * The Ractive mouseover / mouseleave event to show the collapsible button
   * @param  {Object} el, The Ractive representation of a node
   * @param  {Object} keypath, The hovered keypath
   * @return {Void}, returns nothing
   */
  function showCollapsible(el) {

    var target = el.original.toElement || el.original.relatedTarget;

    if (el.original.type === 'mouseover') {

      closest(el, '.parent').className += ' active-collapse';
      this.set('collapseHover', el.keypath);
    } else if (target && !target.isEqualNode(el.node) && target.className.indexOf('collapsible') === -1) {

      removeClass('.active-collapse');
      this.set('collapseHover', '');
    }
  }

  /**
   * What happens on render in the amin component i.e. retrieving from localStorage
   * @param  {Config} config, the main config object
   * @return {Void}, doesn't return anything
   */
  function onRender(config) {

    // Unless localStorage is disabled, retrieve localStorage data
    if (localStorage.highlighter && config.localStorage) {
      this.set({ loading: true, loadingMessage: config.messages.localStorage });

      this.set(JSON.parse(localStorage.getItem('highlighter')));
      this.set('loading', false);
    }
  }

  var templates = { "array": { "v": 3, "t": [{ "t": 7, "e": "span", "a": { "class": ["picky-wrap", { "t": 2, "x": { "r": ["~/isSelected", "@keypath"], "s": "_0===_1?\" is-selected\":\"\"" } }] }, "v": { "click": { "n": "showPath", "d": [{ "t": 2, "r": "@keypath" }] }, "mouseover-mouseout": { "n": "showCollapsible", "d": [{ "t": 2, "r": "@keypath" }] } }, "f": ["["] }, { "t": 8, "r": "collapse" }, " ", { "t": 4, "f": [{ "t": 8, "x": { "r": [], "s": "\"recurse\"" } }], "n": 50, "x": { "r": ["~/collapsed", "@keypath"], "s": "_0.indexOf(_1)===-1" } }, { "t": 4, "n": 51, "f": [{ "t": 7, "e": "span", "a": { "class": "ellipsis" } }], "x": { "r": ["~/collapsed", "@keypath"], "s": "_0.indexOf(_1)===-1" } }, { "t": 7, "e": "span", "a": { "class": ["picky-wrap", { "t": 2, "x": { "r": ["~/isSelected", "@keypath"], "s": "_0===_1?\" is-selected\":\"\"" } }] }, "v": { "click": { "n": "showPath", "d": [{ "t": 2, "r": "@keypath" }] }, "mouseover-mouseout": { "n": "showCollapsible", "d": [{ "t": 2, "r": "@keypath" }] } }, "f": ["]"] }, { "t": 4, "f": [","], "n": 50, "x": { "r": ["@index", "thisLength"], "s": "_0<_1-1" } }], "e": {} }, "attr": { "v": 3, "t": [{ "t": 4, "f": [{ "t": 7, "e": "span", "a": { "class": ["picky-attr", { "t": 2, "x": { "r": ["~/isSelected", "@keypath"], "s": "_0===_1?\" is-selected\":\"\"" } }] }, "v": { "click": { "n": "showPath", "d": [{ "t": 2, "r": "@keypath" }] }, "mouseover-mouseout": { "n": "showCollapsible", "d": [{ "t": 2, "r": "@keypath" }] } }, "f": ["\"", { "t": 2, "r": "@key" }, "\""] }, ":"], "n": 50, "x": { "r": ["isArray"], "s": "!_0" } }], "e": {} }, "collapse": { "v": 3, "t": [{ "t": 7, "e": "span", "a": { "class": "collapsible" }, "v": { "click": "collapse", "mouseover-mouseout": { "n": "showCollapsible", "d": [{ "t": 2, "r": "@keypath" }] } }, "f": [{ "t": 4, "f": [{ "t": 4, "f": ["+"], "n": 50, "x": { "r": ["~/collapsed", "@keypath"], "s": "_0.indexOf(_1)>-1" } }, { "t": 4, "n": 51, "f": ["-"], "x": { "r": ["~/collapsed", "@keypath"], "s": "_0.indexOf(_1)>-1" } }], "n": 50, "x": { "r": ["~/collapseHover", "@keypath"], "s": "_0===_1" } }] }], "e": {} }, "main": { "v": 3, "t": [{ "t": 7, "e": "div", "a": { "class": ["picky ", { "t": 2, "x": { "r": ["./theme"], "s": "_0||\"hljs\"" } }] }, "f": [{ "t": 4, "f": [{ "t": 7, "e": "pre", "f": [{ "t": 7, "e": "code", "f": [{ "t": 7, "e": "div", "a": { "class": "outer-bracket" }, "f": [{ "t": 4, "f": ["["], "n": 50, "x": { "r": ["./data"], "s": "Array.isArray(_0)" } }, { "t": 4, "n": 51, "f": [{ "t": 2, "x": { "r": [], "s": "\"{\"" } }], "x": { "r": ["./data"], "s": "Array.isArray(_0)" } }] }, { "t": 4, "n": 53, "f": [{ "t": 8, "x": { "r": [], "s": "\"recurse\"" } }], "r": "./data" }, { "t": 7, "e": "div", "a": { "class": "outer-bracket" }, "f": [{ "t": 4, "f": ["]"], "n": 50, "x": { "r": ["./data"], "s": "Array.isArray(_0)" } }, { "t": 4, "n": 51, "f": [{ "t": 2, "x": { "r": [], "s": "\"}\"" } }], "x": { "r": ["./data"], "s": "Array.isArray(_0)" } }] }] }] }], "n": 50, "x": { "r": ["./data", "./loading"], "s": "_0&&!_1" } }, { "t": 4, "n": 51, "f": [{ "t": 4, "n": 50, "x": { "r": ["./loading"], "s": "_0" }, "f": [{ "t": 7, "e": "div", "a": { "class": "loading-message" }, "f": [{ "t": 3, "r": "spinner" }, " ", { "t": 2, "x": { "r": ["./loadingMessage"], "s": "_0||\"Loading JSON\"" } }] }] }], "x": { "r": ["./data", "./loading"], "s": "_0&&!_1" } }] }], "e": {} }, "object": { "v": 3, "t": [{ "t": 8, "x": { "r": [], "s": "\"attr\"" } }, " ", { "t": 7, "e": "span", "a": { "class": ["picky-wrap", { "t": 2, "x": { "r": ["~/isSelected", "@keypath"], "s": "_0===_1?\" is-selected\":\"\"" } }] }, "v": { "click": { "n": "showPath", "d": [{ "t": 2, "r": "@keypath" }] }, "mouseover-mouseout": { "n": "showCollapsible", "d": [{ "t": 2, "r": "@keypath" }] } }, "f": ["{"] }, { "t": 8, "r": "collapse" }, " ", { "t": 4, "f": [{ "t": 8, "x": { "r": [], "s": "\"recurse\"" } }], "n": 50, "x": { "r": ["~/collapsed", "@keypath"], "s": "_0.indexOf(_1)===-1" } }, { "t": 4, "n": 51, "f": [{ "t": 7, "e": "span", "a": { "class": "ellipsis" } }], "x": { "r": ["~/collapsed", "@keypath"], "s": "_0.indexOf(_1)===-1" } }, { "t": 7, "e": "span", "a": { "class": ["picky-wrap", { "t": 2, "x": { "r": ["~/isSelected", "@keypath"], "s": "_0===_1?\" is-selected\":\"\"" } }] }, "v": { "click": { "n": "showPath", "d": [{ "t": 2, "r": "@keypath" }] }, "mouseover-mouseout": { "n": "showCollapsible", "d": [{ "t": 2, "r": "@keypath" }] } }, "f": ["}"] }, { "t": 4, "f": [","], "n": 50, "x": { "r": ["@index", "thisLength"], "s": "_0<_1-1" } }], "e": {} }, "recurse": { "v": 3, "t": [{ "t": 19, "f": [{ "t": 4, "f": [{ "t": 7, "e": "div", "a": { "class": "parent" }, "f": [{ "t": 4, "f": [{ "t": 4, "f": [{ "t": 7, "e": "span", "a": { "class": ["picky-attr", { "t": 2, "x": { "r": ["~/isSelected", "@keypath"], "s": "_0===_1?\" is-selected\":\"\"" } }] }, "v": { "click": { "n": "showPath", "d": [{ "t": 2, "r": "@keypath" }] }, "mouseover-mouseout": { "n": "showCollapsible", "d": [{ "t": 2, "r": "@keypath" }] } }, "f": ["\"", { "t": 2, "r": "@key" }, "\""] }, ": ", { "t": 8, "x": { "r": [], "s": "\"array\"" } }], "n": 50, "x": { "r": ["."], "s": "Array.isArray(_0)" } }, { "t": 4, "n": 51, "f": [{ "t": 8, "x": { "r": [], "s": "\"object\"" } }], "x": { "r": ["."], "s": "Array.isArray(_0)" } }], "n": 50, "x": { "r": ["."], "s": "typeof _0===\"object\"&&_0!==null" } }, { "t": 4, "n": 51, "f": [{ "t": 8, "x": { "r": [], "s": "\"attr\"" } }, " ", { "t": 7, "e": "span", "a": { "class": [{ "t": 4, "f": ["picky-string"], "n": 50, "x": { "r": ["."], "s": "typeof _0==\"string\"" } }, { "t": 4, "n": 51, "f": ["picky-number"], "x": { "r": ["."], "s": "typeof _0==\"string\"" } }, " ", { "t": 2, "x": { "r": ["~/isSelected", "@keypath"], "s": "_0===_1?\"is-selected\":\"\"" } }] }, "v": { "click": { "n": "showPath", "d": [{ "t": 2, "r": "@keypath" }] } }, "f": [{ "t": 4, "f": ["\"", { "t": 2, "r": "." }, "\""], "n": 50, "x": { "r": ["."], "s": "typeof _0==\"string\"" } }, { "t": 4, "n": 51, "f": [{ "t": 2, "x": { "r": ["."], "s": "_0==null?\"null\":_0" } }], "x": { "r": ["."], "s": "typeof _0==\"string\"" } }] }, { "t": 4, "f": [","], "n": 50, "x": { "r": ["@index", "thisLength"], "s": "_0<_1-1" } }], "x": { "r": ["."], "s": "typeof _0===\"object\"&&_0!==null" } }] }], "n": 52, "r": "context" }], "n": 53, "z": [{ "n": "context", "x": { "r": "." } }, { "n": "isArray", "x": { "x": { "r": ["."], "s": "Array.isArray(_0)" } } }, { "n": "thisLength", "x": { "x": { "r": ["./length", "."], "s": "Array.isArray(_1)?_0:Object.keys(_1).length" } } }] }], "e": {} } };

  /**
   * Creates and returns the Ractive instance of the highlighter.
   * @param  {Object} config, The configuration object inserted from initialisation
   * @return {Object}, the created Ractive object.
   */
  function createInstance(config) {

    // The default data for the Ractive object
    var data = { data: config.data || null, collapsed: [], isSelected: '', loading: config.loading };

    if (config.theme) {
      data.theme = config.theme;
    }

    if (!config.spinner) {
      data.spinner = spinner;
    }

    // The Ractive object
    var main = new Ractive({
      el: config.el || 'body',
      template: templates.main,
      partials: {
        array: templates.array,
        object: templates['object'],
        attr: templates.attr,
        recurse: templates.recurse,
        collapse: templates.collapse
      },
      onrender: function onrender() {
        onRender.call(this, config);
      },
      data: data
    });

    // Add the events to the Ractive object
    main.on({
      collapse: collapse,
      showPath: showPath,
      showCollapsible: showCollapsible
    });

    if (hasWindow && config.localStorage) {

      window.addEventListener('beforeunload', function () {

        localStorage.setItem('highlighter', JSON.stringify(main.get() || data));
      });
    }

    return main;
  }

  function Highlight(options) {

    var conf = options ? fullExtend({}, [config, options], true) : config;

    if (!hasRactive) {
      throw new Error('You must have Ractive in order to use Picky-highlighter.');
    }

    if (conf.debug === false) {
      Ractive.DEBUG = false;
    } else {
      welcome();
    }

    // Creates the Ractive instance with the config and returns it.
    return createInstance(conf);
  }

  return Highlight;

}));
//# sourceMappingURL=picky-highlight.js.map