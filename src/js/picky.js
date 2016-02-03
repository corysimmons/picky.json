/* global Ractive, $, Clipboard */

Ractive.DEBUG = false

const expression = /^[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi
const urlRegex = new RegExp(expression)

const main = new Ractive({
  el: '.json',
  template: templates.main,
  partials: {
    array: templates.array,
    object: templates['object'],
    attr: templates.attr,
    recurse: templates.recurse
  },
  onrender : function() {

    if (localStorage.main) {
      this.set({loading: true, loadingMessage: 'Loading JSON from your previous session...'})

      // Show the loading bar at least once
      setTimeout(() => {
        this.set(JSON.parse(localStorage.getItem('main')))
      }, 750)

    }

  },
  data: { data: null, collapsed: [], pickyIsSelected: '' }
})

const input = new Ractive({
  el: '.grab',
  template: templates.grab,
  data: (localStorage.input ? JSON.parse(localStorage.getItem('input')) : {}),
  onrender: () => {
    const clipboard = new Clipboard('.btn-clipboard') // Stop crying Firefox!
    clipboard // stop crying StandardJS!
  }
})

if (localStorage.text) {
  $('textarea').val(localStorage.getItem('text'))
}

const formatSelected = (path) => {
  return path.replace(/\[/g, '.').replace(/\]\.?/g, '.').replace(/\.$/, '')
}

const unformatSelected = (path) => {
  return path.replace(/\.?([0-9]+)\.?/g, '[$1].') // Wraps number keys in brackets
    .replace(/([a-z0-9]+\-+[a-z0-9]+)\.?/g, '["$1"].') // Moves keys with dashes into square brackets
    .replace(/\]\.\[/g, '][') // replace full stops where two brackets are next to eachother
    .replace(/\.$/, '') // Gets rid of trailing full stop
    .replace(/(\[[0-9]*$)/, '$1]') // Adds the bracket to the end if needed
    .replace(/(^[0-9]*\])/, '[$1') // adds the bracket to the beginning if needed
}

main.on('showPath', function (el, path) {
  this.set('pickyIsSelected', path)
  input.set('path', unformatSelected(path.replace(/^data./, '')))
})

main.on('collapse', function (el) {
  if ( !this.get('collapsed') ) this.set('collapsed', [])

  if (this.get('collapsed').indexOf(el.keypath) > -1) {
    this.splice('collapsed', this.get('collapsed').indexOf(el.keypath), 1)
  } else {
    this.push('collapsed', el.keypath)
  }

})

input.on('highlight', function (el, value) {
  main.set('pickyIsSelected', 'data.' + formatSelected(value))
})

// Test if JSON is valid and trigger notification if it's not
const validNotification = () => {
  if ($('textarea').val() !== '' && !$('textarea').val().match(urlRegex)) {
    try {
      $.parseJSON($('textarea').val())
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
      $('textarea').val('https://maps.googleapis.com/maps/api/geocode/json?address=San%20Francisco')
      main.set('pickyIsSelected', '')
      main.set({
        data: JSON.parse(data)
      })
    },
    dataType: 'text'
  })
})

// Resize panels
const resizer = (offset, field, max) => {
  if (100 - offset > max && offset > max) {
    $('textarea').css(field, offset + '%')
    $('.code-wrap').css(field, (100 - offset) + '%')
  }
}

let resizing = false
$('.resize').on('mousedown touchstart', () => {
  resizing = true
})

$(document).on('mousemove touchmove', (e) => {
  if (!resizing) {
    return
  }
  if (document.querySelector('body').clientWidth >= 1000) {
    resizer((e.pageX / document.querySelector('main').clientWidth) * 100, 'width', 10)
  } else {
    resizer((((e.originalEvent.pageY || e.originalEvent.touches[0].pageY) / document.querySelector('body').clientHeight) * 100) - 5, 'height', 20)
    return false
  }
}).on('mouseup touchend', () => {
  resizing = false
})

// Remove the resize styles on window change so it doesn't get wierd
$(window).on('resize', () =>
  $('textarea, .code-wrap').removeAttr('style')
)

// If a user is typing text into the textarea which is
// a largely different length then what we have already
// it's a good chance that it's a large JSON object that
// we'll need to debounce
let previousVal = $('textarea').val()
let textTimeout = ''
const debounceText = ($this, timeout) => {

  textTimeout = setTimeout(() => {

    try {
      main.set({
        data: JSON.parse($this.val())
      })
    } catch (error) {
      if (!$this.val().length) {
        main.set({data: ''})
      }
    }

    previousVal = $this.val()
    main.set('loading', false)

  }, timeout)

}

// If the user is typing a URL, debouncing is added to wait for
// the user to finish typing
let requestTimeout = ''
const debounceRequest = (contents, timeout) => {
  requestTimeout = setTimeout(() => {

    if (!$('textarea').val().length) return

    if (!$('textarea').val().match(urlRegex)) {
      main.set({data: ''})
      return
    }

    $.ajax({
      url: contents,
      type: 'GET',
      dataType: 'json',
      success: (data) => {
        main.set({
          data: typeof data === 'object' ? data : JSON.parse(data)
        })
      },
      error: () => {
        // Send textarea code to highlight.js <code> container
        console.log(`Sorry for spamming the 💩 out of your console! https://github.com/corysimmons/picky.json/issues/4`)
        main.set($('textarea').val())
      }
    }).always(() => {
      main.set('loading', false)
    })

  }, timeout)
}

// Test the input to see if it's a JSON url
// If it is, populate <code> with that data
// If it's not, populate <code> with whatever is in <textarea>
$('textarea').on('keyup', function() {
  let text = $('textarea').val().trim()

  if (text === previousVal) return

  clearTimeout(requestTimeout)
  if (text.match(urlRegex)) {
    main.set('loading', true)
    main.set('loadingMessage', 'Loading JSON from URL...')
    debounceRequest(text, 2000)
  } else {

    if ( $(this).val().length - previousVal.length > 500 || $(this).val().length - previousVal.length < -500) {
      main.set('loading', true)
      main.set('loadingMessage', 'Loading large JSON changes...')
      debounceText($(this), 2000)
    } else {
      debounceText($(this), 0)
    }

  }

  previousVal = text

}).on('keydown', function(e) {


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
        count = -selected.match(re) ? selected.match(re).length : ''
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

  clearTimeout(requestTimeout)

})

// Before unload, stores everything in localstorage, the input will only get stored int he local storage
// if there is both a textarea value and data in the main component
$(window).on('beforeunload', () => {
  main.set('loading', false)
  if (!main.get('collapsed') || !main.get('collapsed').length) main.set('collapsed', [])
  localStorage.setItem('main', JSON.stringify(main.get() || { collapsed: [] }))
  localStorage.setItem('input', JSON.stringify($('textarea').val().length && main.get('data') ? input.get() : {}))
  localStorage.setItem('text', $('textarea').val())
})

$(document).on('mouseenter', '.hljs-wrap, .hljs-attr, .collapsible', function() {
  $(this).closest('.parent').addClass('active-collapse')
}).on('mouseout', '.hljs-wrap, .hljs-attr, .collapsible', () => {
  $('.active-collapse').removeClass('active-collapse')
})