// Init syntax highlighter
hljs.initHighlightingOnLoad()

// Activate clipboard
new Clipboard('.btn-clipboard')

// Load example data
// $('.btn-example').click(() =>
  $.ajax({
    url: './assets/dist/data/example-data.json',
    success: (data) => {
      $('code').html(data)
      hljs.highlightBlock($('code')[0])
    },
    dataType: 'text'
  })
// )

// Hover highlight
$(document).on('click', '.hljs-attr', function() {
  $('.hljs-attr').removeClass('is-selected')
  $(this).addClass('is-selected')
})
