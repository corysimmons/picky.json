// Activate clipboard
const clipboard = new Clipboard('.btn-clipboard')

// Test if JSON is valid and trigger notification if it's not
const validNotification = () => {
  if ($('textarea').val() !== '') {
    try {
      $.parseJSON($('code').text())
      $('.invalid-json').fadeOut()
    } catch (err) {
      $('.invalid-json').fadeIn()
    }
  } else {
    $('.invalid-json').fadeOut()
  }
}

setInterval(validNotification, 500)

// Load example data
$('.btn-example').click(() => {
  $('#picked').val('')
  $.ajax({
    url: './assets/dist/data/example-data.json',
    success: (data) => {
      $('code').add('textarea').html(data)
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

const horizontalResize = ( offset ) => {
  $('textarea').css('width', offset + '%')
  $('.code-wrap').css('width', (100 - offset) + '%' )
}

const verticalResize = ( offset ) => {
  $('textarea').css('height', offset + '%')
  $('.code-wrap').css('height', (100 - offset) + '%' )
}

let resizing = false
$('.resize').on('mousedown touchstart', function() {

  resizing = true

})

$(document).on('mousemove touchmove', function(e) {

  if ( !resizing ) {
    return
  }

  if ( document.querySelector('body').clientWidth >= 1000 ) {
    horizontalResize( (e.pageX / document.querySelector('main').clientWidth) * 100 )
  } else {
    verticalResize( ( (e.pageY / document.querySelector('body').clientHeight) * 100 ) - 5 )
  }


}).on('mouseup touchend', function() {

  resizing = false

})

// Remove the resize styles on window change so it doesn't get wierd
$(window).on('resize', function() {
  $('textarea, .code-wrap').removeAttr('style')
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
      let re = ''
      let count = ''

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
  const textareaContents = $('textarea').val().trim()
  $('#picked').val('')

  $.ajax({
    url: textareaContents,
    type: 'GET',
    dataType: 'json',
    success: (data) => {
      $('code').html(JSON.stringify(data, null, '\t'))
      hljs.highlightBlock($('code')[0])
    },
    error: () => {
      // Send textarea code to highlight.js <code> container
      console.log(`Sorry for spamming the crap out of your console! https://github.com/corysimmons/picky.json/issues/4`)
      $('code').html($('textarea').val())
      hljs.highlightBlock($('code')[0])
    }
  })
})
