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
      element.className = element.className.replace('transparent', 'opaque');
      //$(element).removeClass('transparent').addClass('opaque');
    } else {
      element.className = element.className.replace('opaque', 'transparent');
      //$(element).removeClass('opaque').addClass('transparent');
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
  self.shortLink = content.shortLink || '';
  self.longLink = content.longLink || '';
  self.hits = content.hits ? (content.hits.length || 0) : 0;
  self.date = content.createDate || new Date();
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
      animationEndEvents = 'webkitTransitionEnd transitionend MSTransitionEnd oTransitionEnd',
      animatedLogo = new Promise(),
      animatedTable = new Promise(),
      historyFetched = new Promise();

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
  self.link = ko.observable();

  // Computed
  self.newLink = ko.computed(function() {
    var link = self.link();

    // Look to see if it at all resembles a URL
    if (/.*\..*/.test(link)) {
      // Look for a WWW protocol, if none present, use http
      if (!/^http*/.test(link)) {
       link = 'http://' + link;
      }
    }

    return link;
  });

  // Are there any links defined?
  self.hasLinks = ko.computed(function() {
    return self.links().length > 0;
  });

  // Show/hide error messages
  self.errorMsg = ko.computed({
    read: function() {
      return kilius.comms.errorMsg()
    },

    write: function(value) {
      kilius.comms.errorMsg(value);
    }
  });

  // Animations
  self.animated = {
    logo: ko.observable(false),
    table: ko.observable(false),
    links: ko.observable(false)
  }

  // Promise for when the logo finishes animating
  animatedLogo.whenDone(function() {
    var element = $('.url-input')[0];

    self.animated.table(true);
    if (element) {
      element.focus();
    }

    // Start the table animation
    historyFetched.whenDone(self.showTable);
  });

  // Promise for when the table finishes animating
  animatedTable.whenDone(function() {
    self.animated.links(true);
    self.repositionCopyLinks();
  });

  // Animation Events
  $('#main-box').bind(animationEndEvents, function(evt) {
    if (evt.target === this) {
      animatedLogo.resolve();
    }
  });

  $('.table-container').bind(animationEndEvents, function(evt) {
    if (evt.target === this) {
      animatedTable.resolve();
    }
  });

  self.showTable = function() {
    if (self.hasLinks()) {
      element = $('.table-container')[0];
      if (element) {
        element.className = element.className.replace('from-top', 'to-bottom');
      }
    }
  }

  // Operations
  /**
   * Post a link to the server
   */
  self.postLink = function() {
    kilius.comms.postNewLink(self.newLink()).then(self.addNewLink, function(msg) {
      self.errorMsg(msg);
    });
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
      var d1 = new Date(a.createDate),
          d2 = new Date(b.createDate);

      return d2 - d1;
    });

    // Populate the links list
    $.each(links, function(index, value) {
      self.links.push(new KiliusLink(value));
    });

    historyFetched.resolve();
  };

  /**
   * Add a new link to the history table
   * @param content {String} - The new shortened history link
   */
  self.addNewLink = function(content) {
    // Add the new link to the beginning of the links array
    self.links.unshift(new KiliusLink({
      shortLink: content,
      longLink: self.newLink(),
      hits: 0,
      createDate: new Date()
    }));

    // Clear existing link
    self.link('');

    // Clear the error message
    self.errorMsg('');

    self.showTable();
    self.repositionCopyLinks();
  };

  // Initialization
  // Register handler to reposition copy links whenever the window size changes
  $(window).resize(self.repositionCopyLinks);

  // Fetch the history for this user then add it to the table
  kilius.comms.getUserHistory(self.user).then(self.addUserHistoryFromJSON);

  self.animated.logo(true);
  // If animation is not supported, just immediately resolve
  if (!self.supportAnimation) {
    animatedLogo.resolve();
    animatedTable.resolve();
  }
}

function KiliusComms() {
  var self = this;

  // Observables
  self.errorMsg = ko.observable('');

  // Operations
  /**
   * Fetch the user history
   * @param user - The user to fetch
   *
   * @return Promise
   */
  self.getUserHistory = function(user) {
    var getHistory = new Promise();
    $.getJSON('/' + user + '/history', function(json) {
      getHistory.resolve(json);
    });

    return getHistory;
  };

  /**
   * Post a new link to the server
   * @param link {String} - The URL to post
   */
  self.postNewLink = function(link) {

    var newLink = new Promise();

    // AJAX call to POST new URL
    $.ajax({
      url: '/+/',
      type: 'POST',
      data: JSON.stringify({ url: link }),
      contentType: 'application/json',
      processData: false,

      /**
       * AJAX error handler
       * @param jqXHR {Object} - The jQuery AJAX object
       * @param textStatus {String} - Status string
       * @param errorThrown {String} - Error returned
       */
      error: function(jqXHR, textStatus, errorThrown) {
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
        newLink.reject(msg);


        self.errorMsg(msg);
      },

      /**
       * Callback on AJAX request success
       * @param jqXHR {Object} - jQuery AJAX object
       */
      success: function(data, textStatus, jqXHR) {
        if (jqXHR.status === 201) {
          newLink.resolve(jqXHR.getResponseHeader('Location'));
        } else {
          // Expecting a 201 response
          newLink.reject('The server did not reply to the request in the correct format');
        }
      }
    });

    return newLink;
  };

  // All AJAX communication uses JSON
  $.ajaxSetup({
    dataType: 'json'
  })
};

// Define the namespace for the project
window.kilius = {};

$(document).ready(function() {
  var browserInfo = $.browser,
      htmlRoot = $('html');

  // Defer until the UI is completely set-up
  setTimeout(function() {
    kilius.comms = new KiliusComms();
    kilius.model = new KiliusModel();
    ko.applyBindings(kilius.model);

    // Set ZeroClipboard's path
    ZeroClipboard.setMoviePath('/flash/ZeroClipboard.swf');
  }, 1);

  // Detect IE, FF, Opera, and Webkit
  if (browserInfo.msie) {
    htmlRoot.addClass('msie');

  } else if (browserInfo.mozilla) {
    htmlRoot.addClass('moz');

  } else if (browserInfo.webkit) {
    htmlRoot.addClass('webkit');

  } else if (browserInfo.opera) {
    htmlRoot.addClass('opera');
  }

});