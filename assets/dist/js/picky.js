'use strict';

// Init syntax highlighter
hljs.initHighlightingOnLoad();

// Activate clipboard
new Clipboard('.btn-clipboard');

// Load example data
$('.btn-example').click(function () {
  return $.ajax({
    url: './assets/dist/data/example-data.json',
    success: function success(data) {
      $('code').html(data);
      hljs.highlightBlock($('code')[0]);
    },
    dataType: 'text'
  });
});

// Hover highlight
$(document).on('click', 'code *', function () {
  $('code *').removeClass('is-selected');
  $(this).addClass('is-selected');
});

$('textarea').keyup(function () {
  $('code').html($('textarea').val());
  hljs.highlightBlock($('code')[0]);
});
//# sourceMappingURL=picky.js.map