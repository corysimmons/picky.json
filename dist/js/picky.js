'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

// Expression for detecting of text input is a URL, then compile the regexp
var expression = /^[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
var urlRegex = new RegExp(expression);

// Initialise the main template with default data, then onrender retrieve from localStorage giving us a
// native 'Application Shell' like experience
var main = new Highlight({
  el: '#json',
  debug: false
});

// Initialise the input template with localStorage data
var input = new Ractive({
  el: '.grab',
  template: templates.grab,
  data: localStorage.input ? JSON.parse(localStorage.getItem('input')) : {},
  onrender: function onrender() {
    var clipboard = new Clipboard('.btn-clipboard'); // Stop crying Firefox!
    clipboard; // stop crying StandardJS!
  }
});

// Initialise the Warning template in a Ractive template
var warning = new Ractive({
  el: '.error-container',
  template: templates.error,
  data: { error: null }
});

// If a value was previously in textarea, put it back!
if (localStorage.text) {
  $('textarea').val(localStorage.getItem('text'));
}

// Format the path so that Ractive understands it
var formatSelected = function formatSelected(path) {
  return path.replace(/[\"]/g, '').replace(/[\[\]]/g, '.').replace(/\.{2}/g, '.').replace(/^\./, '').replace(/\.$/, '');
};

// Format the JSON path so that it is valid for JS
var unformatSelected = function unformatSelected(path) {

  var keypath = '';
  var splitPath = path.split('.');

  for (var i = 0; i < splitPath.length; i++) {

    keypath += (splitPath[i].match(/(\d|\W)/g) ? '["' + splitPath[i] + '"]' : splitPath[i]) + '.';
  }

  return keypath.replace(/\.\[/g, '[').replace(/\]\.\[/g, '][') // replace full stops where two brackets are next to eachother
  .replace(/\.$/, ''); // Gets rid of trailing full stop
};

// Triggered by a click event, gets us the clicked path name
main.on('showPath', function (oldVal, newVal) {
  if (newVal) input.set('path', unformatSelected(newVal.replace(/^data./, '')));
});

// Keup event from the grab.handlebars input, highlights the typed value
input.on('highlight', function (el, value) {
  main.set('isSelected', 'data.' + formatSelected(value).replace(/^\./, ''));
});

// Load example data
$('.btn-example').click(function () {
  $('#picked').val('');
  $.ajax({
    url: 'https://maps.googleapis.com/maps/api/geocode/json?address=San%20Francisco',
    success: function success(data) {
      $('textarea').val('https://maps.googleapis.com/maps/api/geocode/json?address=San%20Francisco');
      main.set('isSelected', '');
      warning.set({ 'error': null });
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

// On mousedown / touchstart show that we are in 'resizing mode'
var resizing = false;
$('.resize').on('mousedown touchstart', function () {
  resizing = true;
});

// On mousemove or touchmove i.e. dragging the resizer either horiz or vert depending on breakpoint i.e. 1000
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

// Remove the resize styles on window change so it doesn't get weird
$(window).on('resize', function () {
  return $('textarea, .code-wrap').removeAttr('style');
});

// Checks to see if the selected picky value is in the data, if not it will will remove the highlighting
// and value from the input.
var resetPickySelected = function resetPickySelected() {
  if (!input.get('path')) return;

  var path = formatSelected(input.get('path')).replace(/^\./, '');
  var checkMain = main.get('data.' + path);

  if (typeof checkMain === 'undefined') {
    main.set('isSelected', '');
    input.set('path', '');
  }
};

// If a user is typing text into the textarea which is
// a largely different length then what we have already
// it's a good chance that it's a large JSON object that
// we'll need to debounce
var previousVal = '';
var textTimeout = '';
var debounceText = function debounceText($this, timeout) {
  textTimeout = setTimeout(function () {
    try {
      main.set({
        data: JSON.parse($this.val()),
        loading: false
      }).then(function () {
        warning.set('error', null);
      });
    } catch (error) {
      if (!$this.val().length) {
        main.set({ data: '', loading: false });
        warning.set({ 'error': null });
        return;
      }

      if (!$('textarea').val().match(urlRegex)) warning.set('error.invalidJSON', true);
    }

    previousVal = $this.val();
    main.set('loading', false);
    resetPickySelected();
  }, timeout);
};

// If the user is typing a URL, debouncing is added to wait for
// the user to finish typing
var requestTimeout = '';
var debounceRequest = function debounceRequest(contents, timeout) {
  requestTimeout = setTimeout(function () {
    if (!$('textarea').val().length) {
      main.set('loading', false);
      return;
    }

    if (!$('textarea').val().match(urlRegex)) {
      main.set({ data: '', loading: false });
      return;
    }

    $.ajax({
      url: contents,
      type: 'GET',
      dataType: 'json',
      success: function success(data) {
        main.set({
          data: (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object' ? data : JSON.parse(data),
          loading: false
        });
        warning.set({ 'error': null });
      },
      error: function error(e) {
        main.set({ data: '', loading: false });
        warning.set('error.code', e.status);
      }
    }).always(function () {
      main.set('loading', false);
      resetPickySelected();
    });
  }, timeout);
};

function keyupEvent(message) {
  var text = $('textarea').val().trim();

  if (text === previousVal) return;

  clearTimeout(requestTimeout);
  clearTimeout(textTimeout);
  if (text.match(urlRegex)) {
    main.set('loading', true);
    main.set('loadingMessage', 'Loading JSON from URL...');
    debounceRequest(text, 2000);
  } else {
    if ($(this).val().length - previousVal.length > 500 || $(this).val().length - previousVal.length < -500) {
      main.set('loading', true);
      main.set('loadingMessage', message || 'Loading large JSON changes...');
      debounceText($(this), 2000);
    } else {
      debounceText($(this), 0);
    }
  }

  previousVal = text;
}

// Test the input to see if it's a JSON url
// If it is, populate <code> with that data
// If it's not, populate <code> with whatever is in <textarea>
$('textarea').on('keyup change', function (e) {
  if (e.type === 'change') {
    main.set('loading', true);
    keyupEvent.call(this, 'Loading data from extension...');
  } else {
    keyupEvent.call(this);
  }
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
  clearTimeout(textTimeout);
  main.set('loading', false);
});

// Before unload, stores everything in localstorage, the input will only get stored int he local storage
// if there is both a textarea value and data in the main component
$(window).on('beforeunload', function () {
  localStorage.setItem('input', JSON.stringify($('textarea').val().length && main.get('data') ? input.get() : {}));
  localStorage.setItem('text', $('textarea').val());
});

//# sourceMappingURL=picky.js.map