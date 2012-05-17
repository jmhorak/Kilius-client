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
      getUserHistory: function() { return true; },
      errorMsg: function() { return ''; }
    };

    spyOn(kilius.comms, 'getUserHistory');

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
    expect(model.animations.ready()).toBe(true);
    expect(model.animations.enabled()).toBeDefinedAndNotNull();
    // main
    expect(model.animations.main.play()).toBe(true);
    expect(model.animations.main.shown()).toBeDefinedAndNotNull();
    // table
    expect(model.animations.table.play()).toBe(false);
    expect(model.animations.table.shown()).toBe(false);
    // rows
    expect(model.animations.rows.play()).toBe(false);
    expect(model.animations.rows.shown()).toBe(false);

    expect(kilius.comms.getUserHistory).toHaveBeenCalledWith(model.user, model.addUserHistoryFromJSON);
  });
});

// Test the animation cues
describe('animating the app', function() {

  var model = {};

  beforeEach(function() {
    jasmine.getFixtures().set('<div id="banner"></div><div class="link-table-container"></div>');
    model = new KiliusModel();
  });

  it('should play through all the animations', function() {
    // Only run these tests if animation is supported
    expect(model.animations.main.play()).toBe(true);
    expect(model.animations.table.play()).toBe(false);
    expect(model.animations.rows.play()).toBe(false);

    // Trigger event on banner
    var evt = $.Event('transitionend');
    $('#banner').trigger(evt);

    expect(model.animations.main.play()).toBe(true);
    expect(model.animations.table.play()).toBe(true);
    expect(model.animations.rows.play()).toBe(false);

    spyOn(model, 'repositionCopyLinks');

    $('.link-table-container').trigger(evt);

    expect(model.animations.main.play()).toBe(true);
    expect(model.animations.table.play()).toBe(true);
    expect(model.animations.rows.play()).toBe(true);

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

      spyOn(kilius.comms, 'postNewLink');
      model.newLink(link);
      model.postLink();

      expect(kilius.comms.postNewLink).toHaveBeenCalledWith(link, model.addNewLink);
    });
  });

  describe('adding history links', function() {

    var links = [
      { date: new Date(2010, 8, 18) },
      { date: new Date(2011, 9, 12) },
      { date: new Date(2008, 7, 19) },
      { date: new Date(2012, 4, 15) },
      { date: new Date(2009, 11, 1) }
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

      model.newLink(postedLongLink);
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

      expect(model.newLink()).toEqual('');
      expect(model.errorMsg()).toEqual('');

      expect(model.repositionCopyLinks).toHaveBeenCalled();
    });
  });
});