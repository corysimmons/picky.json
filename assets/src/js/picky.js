// /* global $, Clipboard, hljs */

// Adds the commas after the attributes in the JSON
Ractive.defaults.data.pickyLengthCheck = function(keypath, index) {
  const items = this.get(keypath.replace(/\.[a-z\_0-9]*$/gi, ''))
  const length = Array.isArray(items) ? items.length : Object.keys(items).length
  return index < length - 1
}

const main = new Ractive({
  el: '#outlet',
  template: '#recurse'
})

const input = new Ractive({
  el: '.grab',
  template: '#grab',
  onrender: () => {
    // Activate clipboard
    const clipboard = new Clipboard('.btn-clipboard') // Stop crying Firefox!
    clipboard // stop crying StandardJS!
  }
})

main.on('showPath', function(el, path) {
  this.set('pickyIsSelected', path);
  input.set('path', path)
})

input.on('highlight', function(el, value) {
  main.set('pickyIsSelected', value);
})

// Test if JSON is valid and trigger notification if it's not
const validNotification = () => {
  if ($('textarea').val() !== '') {
    try {
      $.parseJSON(JSON.stringify(main.get()))
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
    url: 'https://maps.googleapis.com/maps/api/geocode/json?address=San%20Francisco',
    success: (data) => {
      $('textarea').text('https://maps.googleapis.com/maps/api/geocode/json?address=San%20Francisco')
      main.set('pickyIsSelected', '');
      main.set(JSON.parse(data))
    },
    dataType: 'text'
  })
})

// Resize panels
const horizontalResize = (offset) => {
  $('textarea').css('width', offset + '%')
  $('.code-wrap').css('width', (100 - offset) + '%')
}

const verticalResize = (offset) => {
  $('textarea').css('height', offset + '%')
  $('.code-wrap').css('height', (100 - offset) + '%')
}

let resizing = false
$('.resize').on('mousedown touchstart', () =>
  resizing = true
)

$(document).on('mousemove touchmove', (e) => {
  if (!resizing) {
    return
  }
  if (document.querySelector('body').clientWidth >= 1000) {
    horizontalResize((e.pageX / document.querySelector('main').clientWidth) * 100)
  } else {
    verticalResize((((e.originalEvent.pageY || e.originalEvent.touches[0].pageY) / document.querySelector('body').clientHeight) * 100) - 5)
    return false
  }
}).on('mouseup touchend', () =>
  resizing = false
)

// Remove the resize styles on window change so it doesn't get wierd
$(window).on('resize', () =>
  $('textarea, .code-wrap').removeAttr('style')
)

$('textarea').on('keydown', (e) => {
  if (e.which === 9) {
    e.preventDefault()
  }
}).on('keyup', function() {
  try {
    main.set(JSON.parse($(this).val()))
  } catch (error) {
    if (!$(this).val().length) {
      main.reset()
    }
  }
})

let timeout = '';
const debounceRequest = (contents, timeout) => {
  timeout = setTimeout(() => {

    $.ajax({
      url: contents,
      type: 'GET',
      dataType: 'json',
      success: (data) => {
        main.set(data)
      },
      error: () => {
        // Send textarea code to highlight.js <code> container
        console.log(`Sorry for spamming the 💩 out of your console! https://github.com/corysimmons/picky.json/issues/4`)
        main.set($('textarea').val())
      }
    })

  }, timeout)
}

// Test the input to see if it's a JSON url
// If it is, populate <code> with that data
// If it's not, populate <code> with whatever is in <textarea>
$('textarea').keyup(() => {
  const expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi
  const regex = new RegExp(expression)
  let url = $('textarea').val().trim()

  clearTimeout(timeout)
  if (url.match(regex)) {
    debounceRequest(url, 1000)
  }

  $('#picked').val('')

})