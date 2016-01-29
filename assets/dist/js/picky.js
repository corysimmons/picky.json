'use strict';

// Init syntax highlighter
hljs.initHighlightingOnLoad();

// Activate clipboard
new Clipboard('.btn-clipboard');

// Load example data
// $('.btn-example').click(() =>
$.ajax({
  url: './assets/dist/data/example-data.json',
  success: function success(data) {
    $('code').html(data);
    hljs.highlightBlock($('code')[0]);
  },
  dataType: 'text'
});
// )

// Hover highlight
$('.hljs-attr').on('click', function () {
  $('.hljs-attr').removeClass('is-selected');
  $(undefined).addClass('is-selected');
});
//# sourceMappingURL=picky.js.map