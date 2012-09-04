// Avoid `console` errors in browsers that lack a console.
if (!(window.console && console.log)) {
    (function() {
        var noop = function() {};
        var methods = ['assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error', 'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'markTimeline', 'profile', 'profileEnd', 'markTimeline', 'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn'];
        var length = methods.length;
        var console = window.console = {};
        while (length--) {
            console[methods[length]] = noop;
        }
    }());
}

// Place any jQuery/helper plugins in here.

/*
   Author: Jeff Horak
   Created: 5/2/12
   Description: kili.us implementation using Knockout.js
 */

/**
 * Opacity binding, makes something opaque or transparent
 * @type {Object}
 */
ko.bindingHandlers.opacity = {
  /**
   * Initialize the element
   * @param element
   * @param valueAccessor
   */
  init: function(element, valueAccessor) {
    if (valueAccessor()) {
      $(element).addClass('opaque');
    } else {
      $(element).addClass('transparent');
    }
  },

  /**
   * Based on the value, switch between opaque and transparent
   * @param element
   * @param valueAccessor
   */
  update: function(element, valueAccessor) {
    if (valueAccessor()) {
      $(element).removeClass('transparent').addClass('opaque');
    } else {
      $(element).removeClass('opaque').addClass('transparent');
    }
  }
};

/**
 * Flash copy binding
 * @type {Object}
 */
ko.bindingHandlers.copyElement = {
  /**
   * Initialize the flash copy clipboard
   * @param element
   * @param valueAccessor
   * @param allBindings
   * @param viewModel
   */
  init: function(element, valueAccessor, allBindings, viewModel) {
    viewModel.clip = new ZeroClipboard.Client();
    viewModel.clip.setText(viewModel.shortLink);
    viewModel.clip.setHandCursor(true);
    viewModel.clip.setCSSEffects(true);
  },

  /**
   * Update the position of the flash element
   * @param element
   * @param valueAccessor
   * @param allBindings
   * @param viewModel
   */
  update: function(element, valueAccessor, allBindings, viewModel) {
    if (valueAccessor()) {

      if (!viewModel.clip.domElement) {
        viewModel.clip.glue(element);
      }

      viewModel.clip.reposition();
      viewModel.positionStale(false);
    }
  }
}

/**
 * Constructor for a shortened link
 * @param content
 * @constructor
 */
function KiliusLink(content) {
  var self = this;

  content = content || {};

  // Static content
  self.shortLink = content.short || '';
  self.longLink = content.long || '';
  self.hits = content.hits || 0;
  self.date = content.date || new Date();
  self.clip = null;

  // Observables
  self.positionStale = ko.observable(false);

  // Computed
  self.updatePosition = ko.computed(function() {
    return self.positionStale();
  }).extend({ throttle: 300 });

  self.displayShortLink = ko.computed(function() {
    var link = self.shortLink;
    return link.substring(link.indexOf('kili'));
  });
}

/**
 * The view model for the application
 * @constructor
 */
function KiliusModel() {
  var self = this,
      animationEndEvents = 'webkitTransitionEnd transitionend MSTransitionEnd oTransitionEnd';

  // Static
  self.user = 'k'; // TODO: Use a real user
  // Does the client support animations and flash?
  self.supportAnimation = $('html').hasClass('cssanimations');
  self.supportFlash = (function() {
    var mimeType = navigator.mimeTypes['application/x-shockwave-flash'];
    if (mimeType) {
      return !!mimeType.enabledPlugin;
    }

    return false;
  })();

  // Observables
  self.links = ko.observableArray([]);
  self.newLink = ko.observable();

  // Computed
  self.errorMsg = ko.computed({
    read: function() {
      return kilius.comms.errorMsg()
    },

    write: function(value) {
      kilius.comms.errorMsg(value);
    }
  });

  // Animations
  self.animations = {
    ready: ko.observable(true),
    main:  { play: ko.observable(true) },
    table: { play: ko.observable(false) }
  };

  // Computed animation properties
  self.animations.enabled = ko.computed(function() {
    return self.supportAnimation && self.animations.ready();
  });

  self.animations.main.shown = ko.computed(function() {
    return !self.supportAnimation || self.animations.main.play();
  });

  self.animations.table.shown = ko.computed(function() {
    return !self.supportAnimation || self.animations.table.play();
  });

  self.playTableAnimation = function() {
    if (self.links().length > 0 && !self.animations.table.shown()) {
      self.animations.table.play(true);
    }
  }

  // Operations
  /**
   * Post a link to the server
   */
  self.postLink = function() {
    kilius.comms.postNewLink(self.newLink(), self.addNewLink);
  };

  /**
   * Reposition the Copy flash links onscreen
   */
  self.repositionCopyLinks = function() {
    $.each(self.links(), function(index, value) {
      value.positionStale(true);
    });
  };

  /**
   * Adds several links from the provided JSON
   * @param json {Object} Historical links for this user
   */
  self.addUserHistoryFromJSON = function(json) {
    var links = json.history || [];

    // Ensure the links list is sorted by date
    links.sort(function(a, b) {
      return b.date - a.date;
    });

    // Populate the links list
    $.each(links, function(index, value) {
      self.links.push(new KiliusLink(value));
    });

    self.playTableAnimation();
  };

  /**
   * Add a new link to the history table
   * @param content {String} - The new shortened history link
   */
  self.addNewLink = function(content) {
    // Add the new link to the beginning of the links array
    self.links.unshift(new KiliusLink({
      short: content,
      long: self.newLink(),
      hits: 0,
      date: new Date()
    }));

    // Clear existing link
    self.newLink('');

    // Clear the error message
    self.errorMsg('');

    self.playTableAnimation();
    self.repositionCopyLinks();
  };

  // Initialization

  // Animation Events
  $('#mainBox').bind(animationEndEvents, function(evt) {
    if (evt.target === this) {
      self.playTableAnimation();
      $('#bigK').addClass('softenDark');
    }
  });

  // Register handler to reposition copy links whenever the window size changes
  $(window).resize(self.repositionCopyLinks);

  // Fetch the history for this user
  kilius.comms.getUserHistory(self.user, self.addUserHistoryFromJSON);
}

function KiliusComms() {
  var self = this;

  // Observables
  self.errorMsg = ko.observable('');

  // Operations
  /**
   * Fetch the user history
   * @param user - The user to fetch
   * @param callback - Callback function
   */
  self.getUserHistory = function(user, callback) {
    $.getJSON('/' + user + '/history', callback);
  };

  /**
   * Post a new link to the server
   * @param link {String} - The URL to post
   * @param callback {function} - Success callback
   */
  self.postNewLink = function(link, callback) {
    // AJAX call to POST new URL
    $.ajax({
      url: '/+/',
      type: 'POST',
      data: JSON.stringify({ url: link }),
      contentType: 'application/json',
      processData: false,

      error: self.onLinkAddError,

      success: function(data, textStatus, jqXHR) {
        self.onLinkAddSuccess(jqXHR, callback);
      }
    });
  };

  /**
   * AJAX error handler
   * @param jqXHR {Object} - The jQuery AJAX object
   * @param textStatus {String} - Status string
   * @param errorThrown {String} - Error returned
   */
  self.onLinkAddError = function(jqXHR, textStatus, errorThrown) {
    // Check if there is a message in the response text
    var msg = null;

    try {
      msg = JSON.parse(jqXHR.responseText);
      msg = msg.message;
    } catch (e) {
      msg = null;
    }

    // No message, create one
    if (!msg) {
      msg = ['The Kili.us server reported a problem: ',
              textStatus ? textStatus[0].toUpperCase() + textStatus.slice(1) : 'Error',
              ' - ',
              errorThrown ? errorThrown : 'General Error'].join('');
    }

    // Set the error message
    self.errorMsg(msg);
  };

  /**
   * Callback on AJAX request success
   * @param jqXHR {Object} - jQuery AJAX object
   * @param callback {Function} - Supplied callback function
   */
  self.onLinkAddSuccess = function(jqXHR, callback) {
    if (jqXHR.status === 201) {
      callback(jqXHR.getResponseHeader('Location'));
    } else {
      // Expecting a 201 response
      self.errorMsg('The server did not reply to the request in the correct format');
    }
  };

  // All AJAX communication uses JSON
  $.ajaxSetup({
    dataType: 'json'
  })
};

// Define the namespace for the project
window.kilius = {};

$(document).ready(function() {
  // Defer until the UI is completely set-up
  setTimeout(function() {
    kilius.comms = new KiliusComms();
    kilius.model = new KiliusModel();
    ko.applyBindings(kilius.model);

    // Set ZeroClipboard's path
    ZeroClipboard.setMoviePath('/flash/ZeroClipboard.swf');
  }, 1);
});