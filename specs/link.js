/**
 * KiliusLink object unit tests
 */

describe('working with a KiliusLink object', function() {

  var shortLink = 'kili.us/+/1',
      content = {
        short: 'http://' + shortLink,
        long: 'https://github.com/jmhorak',
        hits: 120,
        date: new Date()
      },
      link = {};

  beforeEach(function() {
    this.addMatchers({
      isWithinTenSeconds: function(expected) {
        return Math.abs(this.actual - expected) < 10000;
      }
    });

    link = new KiliusLink(content);
  });

  it('should initialize from a constructor with provided content', function() {
    // Static data
    expect(link.shortLink).toEqual(content.short);
    expect(link.longLink).toEqual(content.long);
    expect(link.hits).toEqual(content.hits);
    expect(link.date).toEqual(content.date);
    expect(link.clip).toBeNull();

    // Observables
    expect(link.positionStale()).toBe(false);

    // Computed
    expect(link.updatePosition()).toBe(false);
    expect(link.displayShortLink()).toEqual(shortLink);
  });

  it('should initialize from a constructor without provided content', function() {
    // Static data
    var blankLink = new KiliusLink();
    expect(blankLink.shortLink).toEqual('');
    expect(blankLink.longLink).toEqual('');
    expect(blankLink.hits).toEqual(0);
    expect(blankLink.date).isWithinTenSeconds(new Date());
    expect(blankLink.clip).toBeNull();

    // Observables
    expect(blankLink.positionStale()).toBe(false);

    // Computed
    expect(blankLink.updatePosition()).toBe(false);
    expect(blankLink.displayShortLink()).toEqual('');
  });

  it('throttles updating the position', function() {
    runs(function() {
      // Should start as false
      expect(link.updatePosition()).toBe(false);

      link.positionStale(true);

      // Should still be false
      expect(link.updatePosition()).toBe(false);
    });

    // 300 ms throttle
    waits(300);

    runs(function() {
      // Should be true now
      expect(link.updatePosition()).toBe(true);
    });
  });

});
