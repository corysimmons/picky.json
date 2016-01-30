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
      } else if (object[key].toString().indexOf(searchTerm.toString()) > -1) {
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

  // Find selector and display in disabled input field
  const foundVal = searchObj($(this).text().replace(/[\"]/g, ''), $.parseJSON($('code').text()))
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
