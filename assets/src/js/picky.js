// Activate clipboard
const clipboard = new Clipboard('.btn-clipboard')

// Load example data
$('.btn-example').click(() => {
  $('textarea').val('')
  $.ajax({
    url: './assets/dist/data/example-data.json',
    success: (data) => {
      $('code').html(data)
      hljs.highlightBlock($('code')[0])
    },
    dataType: 'text'
  })
})

// Traverse the object and sift out the selector
// Courtesy of https://github.com/danjford
const searchObj = (searchTerm, object) => {
  let path = []
  let foundVal = ''
  let stopSearch = false

  function search (searchTerm, object) {
    let pointer
    for (var key in object) {
      if (typeof object[key] === 'object') {
        if (!stopSearch) {
          pointer = key
          search(searchTerm, object[key])
        }
      } else if (object[key].toString().indexOf(searchTerm) > -1) {
        pointer = key
        foundVal = object[key]
        stopSearch = true
      }
      if (stopSearch) break
    }
    if (stopSearch) {
      path.push(isNaN(pointer) ? pointer : `[${pointer}]`)
    }
  }
  search(searchTerm, object)
  return {
    value: foundVal,
    path: path.reverse().join('.').replace(/\.\[/g, '[').replace(/\.$/, '')
  }
}

$(document).on('click', '.hljs-string, .hljs-number', function() {
  // Click highlight
  $('code *').removeClass('is-selected')
  $(this).addClass('is-selected')

  // Add 133713371337 to value (for searching, needs to be a number so non-string values don't wet the bed)
  // Place JSON with 133713371337 in hidden element
  // Remove 133713371337 from viewable JSON
  const selected = $(this).text()
  // If it's a double quoted string, add 133713371337 to the end, inside of the quotes
  $(this).text(selected.replace(/"(.*)"/, '"$1133713371337"'))
  // If it's anything else (e.g. numbers), add 133713371337 to the end of it
  if (!$(this).text().match(/133713371337/)) {
    $(this).text(`${selected}133713371337`)
  }
  // Move <code> contents to hidden .parse-field div
  $('.parse-field').text($('code').text())
  // Remove 133713371337 from the selected text so people don't see what we just did
  $(this).text( $(this).text().replace(/133713371337/, '') )

  // Find selector and display in disabled input field
  const foundVal = searchObj('133713371337', $.parseJSON($('.parse-field').text()))
  $('#picked').val(foundVal.path)
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
