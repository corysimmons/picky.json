// Activate clipboard
const clipboard = new Clipboard('.btn-clipboard')

// Load example data
$('.btn-example').click(() =>
  $.ajax({
    url: './assets/dist/data/example-data.json',
    success: (data) => {
      $('code').html(data)
      hljs.highlightBlock($('code')[0])
    },
    dataType: 'text'
  })
)

// Hover highlight
$(document).on('click', 'code *', function() {
  $('code *').removeClass('is-selected')
  $(this).addClass('is-selected')
})

$('textarea').keydown(function(e) {
  // Allow insertion of tabs - http://stackoverflow.com/a/28483558/175825
  if (e.which === 9) {
    e.preventDefault()
    if (this.value) {
      const val = this.value
      const start = this.selectionStart
      const end = this.selectionEnd
      const selected = val.substring(start, end)
      let re, count

      if (e.shiftKey) {
        re = /^\t/gm
        count = -selected.match(re).length
        this.value = val.substring(0, start) + selected.replace(re, '') + val.substring(end)
      } else {
        re = /^/gm
        count = selected.match(re).length
        this.value = val.substring(0, start) + selected.replace(re, '\t') + val.substring(end)
      }
      if (start === end) {
        this.selectionStart = end + count
      } else {
        this.selectionStart = start
      }
      this.selectionEnd = end + count
    }
  }
})

$('textarea').keyup(function() {
  // Send textarea code to highlight.js <code> container
  $('code').html($('textarea').val())
  hljs.highlightBlock($('code')[0])
})
