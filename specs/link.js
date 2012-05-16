/**
 * KiliusLink object unit tests
 */

describe('KiliusLink tests', function() {

  var shortLink = 'kili.us/+/1',
      content = {
        short: 'http://' + shortLink,
        long: 'https://github.com/jmhorak',
        hits: 120,
        date: new Date()
      },
      link = {};

  beforeEach(function() {
    link = new KiliusLink(content);
  });

  it('initialize from a constructor', function() {
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
