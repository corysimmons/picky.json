'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

/* global Ractive, $, Clipboard */

Ractive.DEBUG = false;

var expression = /^[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
var urlRegex = new RegExp(expression);

var main = new Ractive({
  el: '.json',
  template: templates.main,
  partials: {
    array: templates.array,
    object: templates['object'],
    attr: templates.attr,
    recurse: templates.recurse
  },
  onrender: function onrender() {
    var _this = this;

    if (localStorage.main) {
      this.set({ loading: true, loadingMessage: 'Loading JSON from your previous session...' });

      // Show the loading bar at least once
      setTimeout(function () {
        _this.set(JSON.parse(localStorage.getItem('main')));
      }, 750);
    }
  },
  data: { data: null, collapsed: [], pickyIsSelected: '' }
});

var input = new Ractive({
  el: '.grab',
  template: templates.grab,
  data: localStorage.input ? JSON.parse(localStorage.getItem('input')) : {},
  onrender: function onrender() {
    var clipboard = new Clipboard('.btn-clipboard'); // Stop crying Firefox!
    clipboard; // stop crying StandardJS!
  }
});

if (localStorage.text) {
  $('textarea').val(localStorage.getItem('text'));
}

var formatSelected = function formatSelected(path) {
  return path.replace(/\[/g, '.').replace(/\]\.?/g, '.').replace(/\.$/, '');
};

var unformatSelected = function unformatSelected(path) {
  return path.replace(/\.?([0-9]+)\.?/g, '[$1].') // Wraps number keys in brackets
  .replace(/([a-z0-9]+\-+[a-z0-9]+)\.?/g, '["$1"].') // Moves keys with dashes into square brackets
  .replace(/\]\.\[/g, '][') // replace full stops where two brackets are next to eachother
  .replace(/\.$/, '') // Gets rid of trailing full stop
  .replace(/(\[[0-9]*$)/, '$1]') // Adds the bracket to the end if needed
  .replace(/(^[0-9]*\])/, '[$1'); // adds the bracket to the beginning if needed
};

main.on('showPath', function (el, path) {
  this.set('pickyIsSelected', path);
  input.set('path', unformatSelected(path.replace(/^data./, '')));
});

main.on('collapse', function (el) {
  if (!this.get('collapsed')) this.set('collapsed', []);

  if (this.get('collapsed').indexOf(el.keypath) > -1) {
    this.splice('collapsed', this.get('collapsed').indexOf(el.keypath), 1);
  } else {
    this.push('collapsed', el.keypath);
  }
});

input.on('highlight', function (el, value) {
  main.set('pickyIsSelected', 'data.' + formatSelected(value));
});

// Test if JSON is valid and trigger notification if it's not
var validNotification = function validNotification() {
  if ($('textarea').val() !== '' && !$('textarea').val().match(urlRegex)) {
    try {
      $.parseJSON($('textarea').val());
      $('.invalid-json').fadeOut();
    } catch (err) {
      $('.invalid-json').fadeIn();
    }
  } else {
    $('.invalid-json').fadeOut();
  }
};

setInterval(validNotification, 500);

// Load example data
$('.btn-example').click(function () {
  $('#picked').val('');
  $.ajax({
    url: 'https://maps.googleapis.com/maps/api/geocode/json?address=San%20Francisco',
    success: function success(data) {
      $('textarea').val('https://maps.googleapis.com/maps/api/geocode/json?address=San%20Francisco');
      main.set('pickyIsSelected', '');
      main.set({
        data: JSON.parse(data)
      });
    },
    dataType: 'text'
  });
});

// Resize panels
var resizer = function resizer(offset, field, max) {
  if (100 - offset > max && offset > max) {
    $('textarea').css(field, offset + '%');
    $('.code-wrap').css(field, 100 - offset + '%');
  }
};

var resizing = false;
$('.resize').on('mousedown touchstart', function () {
  resizing = true;
});

$(document).on('mousemove touchmove', function (e) {
  if (!resizing) {
    return;
  }
  if (document.querySelector('body').clientWidth >= 1000) {
    resizer(e.pageX / document.querySelector('main').clientWidth * 100, 'width', 10);
  } else {
    resizer((e.originalEvent.pageY || e.originalEvent.touches[0].pageY) / document.querySelector('body').clientHeight * 100 - 5, 'height', 20);
    return false;
  }
}).on('mouseup touchend', function () {
  resizing = false;
});

// Remove the resize styles on window change so it doesn't get wierd
$(window).on('resize', function () {
  return $('textarea, .code-wrap').removeAttr('style');
});

// If a user is typing text into the textarea which is
// a largely different length then what we have already
// it's a good chance that it's a large JSON object that
// we'll need to debounce
var previousVal = $('textarea').val();
var textTimeout = '';
var debounceText = function debounceText($this, timeout) {

  textTimeout = setTimeout(function () {

    try {
      main.set({
        data: JSON.parse($this.val())
      });
    } catch (error) {
      if (!$this.val().length) {
        main.set({ data: '' });
      }
    }

    previousVal = $this.val();
    main.set('loading', false);
  }, timeout);
};

// If the user is typing a URL, debouncing is added to wait for
// the user to finish typing
var requestTimeout = '';
var debounceRequest = function debounceRequest(contents, timeout) {
  requestTimeout = setTimeout(function () {

    if (!$('textarea').val().length) return;

    if (!$('textarea').val().match(urlRegex)) {
      main.set({ data: '' });
      return;
    }

    $.ajax({
      url: contents,
      type: 'GET',
      dataType: 'json',
      success: function success(data) {
        main.set({
          data: (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object' ? data : JSON.parse(data)
        });
      },
      error: function error() {
        // Send textarea code to highlight.js <code> container
        console.log('Sorry for spamming the 💩 out of your console! https://github.com/corysimmons/picky.json/issues/4');
        main.set($('textarea').val());
      }
    }).always(function () {
      main.set('loading', false);
    });
  }, timeout);
};

var resetPickySelected = function resetPickySelected() {
  input.set('path', '');
  main.set('pickyIsSelected', '');
};

// Test the input to see if it's a JSON url
// If it is, populate <code> with that data
// If it's not, populate <code> with whatever is in <textarea>
$('textarea').on('keyup', function () {
  var text = $('textarea').val().trim();

  if (text === previousVal) return;

  resetPickySelected();

  clearTimeout(requestTimeout);
  if (text.match(urlRegex)) {
    main.set('loading', true);
    main.set('loadingMessage', 'Loading JSON from URL...');
    debounceRequest(text, 2000);
  } else {

    if ($(this).val().length - previousVal.length > 500 || $(this).val().length - previousVal.length < -500) {
      main.set('loading', true);
      main.set('loadingMessage', 'Loading large JSON changes...');
      debounceText($(this), 2000);
    } else {
      debounceText($(this), 0);
    }
  }

  previousVal = text;
}).on('keydown', function (e) {

  if (e.which === 9) {
    e.preventDefault();
    if (this.value) {
      var val = this.value;
      var start = this.selectionStart;
      var end = this.selectionEnd;
      var selected = val.substring(start, end);
      var re = '';
      var count = '';

      if (e.shiftKey) {
        re = /^\t/gm;
        count = -selected.match(re) ? selected.match(re).length : '';
        this.value = val.substring(0, start) + selected.replace(re, '') + val.substring(end);
      } else {
        re = /^/gm;
        count = selected.match(re).length;
        this.value = val.substring(0, start) + selected.replace(re, '\t') + val.substring(end);
      }
      if (start === end) {
        this.selectionStart = end + count;
      } else {
        this.selectionStart = start;
      }
      this.selectionEnd = end + count;
    }
  }

  clearTimeout(requestTimeout);
});

// Before unload, stores everything in localstorage, the input will only get stored int he local storage
// if there is both a textarea value and data in the main component
$(window).on('beforeunload', function () {
  main.set('loading', false);
  if (!main.get('collapsed') || !main.get('collapsed').length) main.set('collapsed', []);
  localStorage.setItem('main', JSON.stringify(main.get() || { collapsed: [] }));
  localStorage.setItem('input', JSON.stringify($('textarea').val().length && main.get('data') ? input.get() : {}));
  localStorage.setItem('text', $('textarea').val());
});

$(document).on('mouseenter', '.hljs-wrap, .hljs-attr, .collapsible', function () {
  $(this).closest('.parent').addClass('active-collapse');
}).on('mouseout', '.hljs-wrap, .hljs-attr, .collapsible', function () {
  $('.active-collapse').removeClass('active-collapse');
});

//# sourceMappingURL=picky.js.map