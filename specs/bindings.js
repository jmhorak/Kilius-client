/**
 * Custom Knockout Bindings tests
 */

describe('Knockout opacity binding', function() {

  function SimpleModel( initValue ) {
    this.myTest = ko.observable( initValue );
    this.toggle = function() {
      this.myTest(!this.myTest());
    }
  }

  beforeEach(function() {
    jasmine.getFixtures().set('<div id="fixture" data-bind="opacity: myTest()"></div>');
  });

  it('should be defined', function() {
    expect(ko.bindingHandlers.opacity).toBeDefined();
  });

  describe('initialize binding with false', function() {
    var model = new SimpleModel(false);

    beforeEach(function() {
      ko.applyBindings(model);
    })

    it('should initialize to transparent', function() {
      expect($('#fixture')).toHaveClass('transparent');
    });

    it('should toggle between transparent and opaque', function() {
      // Start transparent
      expect($('#fixture')).toHaveClass('transparent');
      // Toggle to opaque
      model.toggle();
      expect($('#fixture')).toHaveClass('opaque');
      // Toggle to transparent
      model.toggle();
      expect($('#fixture')).toHaveClass('transparent');
    });
  });

  describe('initialize binding with true', function() {
    var model = new SimpleModel(true);

    beforeEach(function() {
      ko.applyBindings(model);
    });

    it('should initialize to opaque', function() {
      expect($('#fixture')).toHaveClass('opaque');
    });

    it('should toggle between opaque and transparent', function() {
      // Start opaque
      expect($('#fixture')).toHaveClass('opaque');
      // Toggle to transparent
      model.toggle();
      expect($('#fixture')).toHaveClass('transparent');
      // Toggle to opaque
      model.toggle();
      expect($('#fixture')).toHaveClass('opaque');
    });
  });
});

describe('Knockout copy element binding', function() {
  function SimpleModel() {
    this.positionStale = ko.observable(false);
    this.shortLink = 'Short Link';
    this.clip = null;
  }

  beforeEach(function() {
    jasmine.getFixtures().set('<div id="fixture" style="height: 10px; width: 10px;" data-bind="copyElement: positionStale()"></div>');
  });

  it('should be defined', function() {
    expect(ko.bindingHandlers.copyElement).toBeDefined();
  });

  describe('initialization tests', function() {
    var model = new SimpleModel();

    it('should initialize a new ZeroClipboard object', function() {
      ko.applyBindings(model);
      expect(model.clip).not.toBeNull();
      expect(model.clip.clipText).toMatch(model.shortLink);
    });
  });

  describe('update tests', function() {
    var model = new SimpleModel();

    beforeEach(function() {
      ko.applyBindings(model);
    });

    it('should reposition itself', function() {
      spyOn(model.clip, 'reposition');
      model.positionStale(true);
      expect(model.clip.reposition).toHaveBeenCalled();
    });

    it('should clear the stale flag without reprocessing', function() {
      spyOn(ko.bindingHandlers.copyElement, 'update').andCallThrough();
      model.positionStale(true);
      expect(ko.bindingHandlers.copyElement.update.callCount).toBe(1);
    });
  })
});
