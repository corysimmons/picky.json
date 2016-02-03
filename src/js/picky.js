/* global Ractive, $, Clipboard */

// Adds the commas after the attributes in the JSON
Ractive.defaults.data.pickyLengthCheck = function (keypath, index) {
  const items = this.get(keypath.replace(/\.[a-z\_0-9]*$/gi, ''))
  const length = Array.isArray(items) ? items.length : Object.keys(items).length
  return index < length - 1
}

Ractive.defaults.data.inArrayCheck = function (keypath, index) {
  return !Array.isArray(this.get(keypath.replace(/\.[0-9]*$/, '')))
}

Ractive.DEBUG = false

const main = new Ractive({
  el: '.json',
  template: '#main',
  data: (localStorage.main ? JSON.parse(localStorage.getItem('main')) : { collapsed: [] })
})

const input = new Ractive({
  el: '.grab',
  template: '#grab',
  data: (localStorage.input ? JSON.parse(localStorage.getItem('input')) : {}),
  onrender: () => {
    // Activate clipboard
    const clipboard = new Clipboard('.btn-clipboard') // Stop crying Firefox!
    clipboard // stop crying StandardJS!
  }
})

$('textarea').on('keyup', function() {
  if($(this).val()) {
    main.set('data', JSON.parse($(this).val()))
  }
})

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

// Before unload, stores everything in localstorage, the input will only get stored int he local storage
// if there is both a textarea value and data in the main component
$(window).on('beforeunload', () => {
  main.set('loading', false)
  if (!main.get('collapsed') || !main.get('collapsed').length) main.set('collapsed', [])
  localStorage.setItem('main', JSON.stringify(main.get() || { collapsed: [] }))
  localStorage.setItem('input', JSON.stringify($('textarea').val().length && main.get('data') ? input.get() : {}))
  localStorage.setItem('text', $('textarea').val())
})