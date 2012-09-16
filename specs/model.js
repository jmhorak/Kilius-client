/**
 *  Model unit tests
 */

describe('creating the model', function() {

  beforeEach(function() {
    this.addMatchers({
      toBeDefinedAndNotNull: function() {
        return this.actual !== undefined && this.actual !== null;
      }
    });
  });

  // Initialize the model from the constructor, check initial state
  it('should initialize from a constructor', function() {
    kilius.comms = {
      getUserHistory: function() { return new Promise(); },
      errorMsg: function() { return ''; }
    };

    spyOn(kilius.comms, 'getUserHistory').andReturn( new Promise() );

    var model = new KiliusModel();

    // Static data
    expect(model.user).toEqual('k');
    expect(model.supportAnimation).toBeDefinedAndNotNull();
    expect(model.supportFlash).toBeDefinedAndNotNull();

    // Observable
    expect(model.links()).toEqual([]);
    expect(model.newLink()).not.toBeDefined();

    // Computed
    expect(model.errorMsg()).toEqual('');

    // Animations
    // Logo
    expect(model.animated.logo()).toBe(true);
    // table
    expect(model.animated.table()).toBe(false);
    // links
    expect(model.animated.links()).toBe(false);

    expect(kilius.comms.getUserHistory).toHaveBeenCalledWith(model.user);
  });
});

// Test the animation cues
describe('animating the app', function() {

  var model = {};

  beforeEach(function() {
    jasmine.getFixtures().set('<div id="mainBox"></div><div class="table-container"></div>');
    model = new KiliusModel();
  });

  it('should play through all the animations', function() {
    // Only run these tests if animation is supported
    expect(model.animated.logo()).toBe(true);
    expect(model.animated.table()).toBe(false);
    expect(model.animated.links()).toBe(false);

    // Trigger event on banner
    var evt = $.Event('transitionend');
    $('#mainBox').trigger(evt);

    expect(model.animated.logo()).toBe(true);
    expect(model.animated.table()).toBe(true);
    expect(model.animated.links()).toBe(false);

    spyOn(model, 'repositionCopyLinks');

    // Create a new event
    evt = $.Event('transitionend');
    $('.table-container').trigger(evt);

    expect(model.animated.logo()).toBe(true);
    expect(model.animated.table()).toBe(true);
    expect(model.animated.links()).toBe(true);

    expect(model.repositionCopyLinks).toHaveBeenCalled();
  });
});

// Test each model operation
describe('model operations', function() {

  var model = {};

  beforeEach(function() {
    kilius.comms = new KiliusComms();
    model = new KiliusModel();
  });

  // Posting a new link
  describe('posting a new link', function() {

    it('should call the comms layer to post a link', function() {
      var link = 'https://github.com/jmhorak';

      spyOn(kilius.comms, 'postNewLink').andReturn(new Promise());
      model.link(link);
      model.postLink();

      expect(kilius.comms.postNewLink).toHaveBeenCalledWith(link);
    });

    it('should add the http protocol before submitting to the server', function() {
      var link = 'github.com/jmhorak';

      spyOn(kilius.comms, 'postNewLink').andReturn(new Promise());
      model.link(link);
      model.postLink();

      expect(kilius.comms.postNewLink).toHaveBeenCalledWith('http://' + link);
    });
  });

  describe('adding history links', function() {

    var links = [
      { createDate: new Date(2010, 8, 18) },
      { createDate: new Date(2011, 9, 12) },
      { createDate: new Date(2008, 7, 19) },
      { createDate: new Date(2012, 4, 15) },
      { createDate: new Date(2009, 11, 1) }
    ];

    beforeEach(function() {
      this.addMatchers({
        isWithinTenSeconds: function(expected) {
          return Math.abs(this.actual - expected) < 10000;
        }
      });

      model.addUserHistoryFromJSON({ history: links });
    });

    it('should add history links sorted by date', function() {
      var sortedLinks = model.links(),
          idx = 0;

      // Expect all the links to be in the list
      expect(model.links().length).toEqual(links.length);

      // Expecting the links to be sorted by year
      for (; idx < sortedLinks.length; idx++) {
        expect(sortedLinks[idx].date.getFullYear()).toEqual(2012 - idx);
      }
    });

    it('should update the position stale value of each link', function() {
      var sortedLinks = model.links(),
          idx = 0;

      model.repositionCopyLinks();

      // Expecting the position stale attribute to be set on each
      for (; idx < sortedLinks.length; idx++) {
        expect(sortedLinks[idx].positionStale()).toBe(true);
      }
    });

    it('should process newly posted links', function() {
      var postedShortLink = 'http://kili.us/+/234',
          postedLongLink = 'https://github.com/jmhorak';

      model.link(postedLongLink);
      model.errorMsg('This is an error');

      spyOn(model, 'repositionCopyLinks');
      expect(model.links().length).toBe(links.length);

      model.addNewLink(postedShortLink);

      // Expect the number of links to be one greater
      expect(model.links().length).toBe(links.length + 1);

      addedLink = model.links()[0];
      expect(addedLink.shortLink).toEqual(postedShortLink);
      expect(addedLink.longLink).toEqual(postedLongLink);
      expect(addedLink.hits).toEqual(0);
      expect(addedLink.date).isWithinTenSeconds(new Date());

      expect(model.link()).toEqual('');
      expect(model.errorMsg()).toEqual('');

      expect(model.repositionCopyLinks).toHaveBeenCalled();
    });
  });
});