/**
 * Comms unit tests
 */

describe('communicating with the server', function() {

  var comms = {};

  beforeEach(function() {
    comms = new KiliusComms();
  });

  describe('AJAX and server errors', function() {

    var generic = 'The Kili.us server reported a problem: ',
        general = 'General Error',
        exceptionText = 'Exception text',
        statusText = 'some status text',
        processStatusText = 'Some status text',
        serverText = 'Oops there was an error',
        jqXHR,
        textStatus,
        errorThrown,
        spy,
        notCalled;

    beforeEach(function() {
      spyOn($, 'ajax').andCallFake(function(arg) {
        return arg.error(jqXHR, textStatus, errorThrown);
      });

      spy = jasmine.createSpy();
      notCalled = jasmine.createSpy();
    });

    it('should generate a default error message with undefined parameters', function() {
      comms.postNewLink().then(notCalled, spy);

      expect(spy).toHaveBeenCalledWith(generic + 'Error - ' + general);
      expect(notCalled).not.toHaveBeenCalled();
    });

    it('should generate a default error message when none is given', function() {
      jqXHR = {};
      textStatus = '';
      errorThrown = '';

      comms.postNewLink().then(notCalled, spy);

      expect(spy).toHaveBeenCalledWith(generic + 'Error - ' + general);
      expect(notCalled).not.toHaveBeenCalled();
    });

    // Just exception text should still work
    it('should use the exception thrown to build an error message', function() {
      jqXHR = {};
      textStatus = '';
      errorThrown = exceptionText;

      comms.postNewLink().then(notCalled, spy);

      expect(spy).toHaveBeenCalledWith(generic + 'Error - ' + exceptionText);
      expect(notCalled).not.toHaveBeenCalled();
    });

    it('should use the text status to build an error message', function() {
      jqXHR = {};
      textStatus = statusText;
      errorThrown = '';

      comms.postNewLink().then(notCalled, spy);

      expect(spy).toHaveBeenCalledWith(generic + processStatusText + ' - ' + general);
      expect(notCalled).not.toHaveBeenCalled();
    });

    // Build an error message from status text and the exception
    it('should use the text status with the exception text to build an error message', function() {
      jqXHR = {};
      textStatus = statusText;
      errorThrown = exceptionText;

      comms.postNewLink().then(notCalled, spy);

      expect(spy).toHaveBeenCalledWith(generic + processStatusText + ' - ' + exceptionText);
      expect(notCalled).not.toHaveBeenCalled();
    });

    // Error message returned from the server
    it('should use the error message encoded in the response', function() {
      jqXHR = { responseText: '{ "message": "' + serverText + '" }' };
      textStatus = '';
      errorThrown = '';

      comms.postNewLink().then(notCalled, spy);

      expect(spy).toHaveBeenCalledWith(serverText);
      expect(notCalled).not.toHaveBeenCalled();
    });

    it('should use the error message encoded in the response over all other text', function() {
      jqXHR = { responseText: '{ "message": "' + serverText + '" }' };
      textStatus = statusText;
      errorThrown = exceptionText;

      comms.postNewLink().then(notCalled, spy);

      expect(spy).toHaveBeenCalledWith(serverText);
      expect(notCalled).not.toHaveBeenCalled();
    });
  });

  xdescribe('successful response from server', function() {

    var cb = null;

    beforeEach(function() {
      cb = jasmine.createSpy('callback');
    });

    // Only accepts status code 201
    it('should show an error if the response status is not 201', function() {
      comms.onLinkAddSuccess({ status: 200 }, cb);
      expect(comms.errorMsg()).toEqual('The server did not reply to the request in the correct format');
      expect(cb).not.toHaveBeenCalled();
    });

    // Location from the response header should be passed to the callback
    it('should pass the new location to the callback', function() {
      comms.onLinkAddSuccess({ status: 201, getResponseHeader: function(x) { return 'abc'; }}, cb);
      expect(comms.errorMsg()).toEqual('');
      expect(cb).toHaveBeenCalledWith('abc');
    });
  });
});