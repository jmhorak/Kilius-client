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
        serverText = 'Oops there was an error';

    // undefined parameters should still work
    it('should generate a default error message when none is given', function() {
      comms.onLinkAddError();
      expect(comms.errorMsg()).toEqual(generic + 'Error - ' + general);

      comms.onLinkAddError({}, '', '');
      expect(comms.errorMsg()).toEqual(generic + 'Error - ' + general);
    });

    // Just exception text should still work
    it('should use the exception thrown to build an error message', function() {
      comms.onLinkAddError({}, '', exceptionText);
      expect(comms.errorMsg()).toEqual(generic + 'Error - ' + exceptionText);
    });

    // Build an error message from status text and the exception
    it('should use the text status to build an error message', function() {
      comms.onLinkAddError({}, statusText, exceptionText);
      expect(comms.errorMsg()).toEqual(generic + processStatusText + ' - ' + exceptionText);

      comms.onLinkAddError({}, statusText, '');
      expect(comms.errorMsg()).toEqual(generic + processStatusText + ' - ' + general);
    });

    // Error message returned from the server
    it('should use the error message encoded in the response', function() {
      comms.onLinkAddError({ responseText: '{ "message": "' + serverText + '" }' });
      expect(comms.errorMsg()).toEqual(serverText);

      comms.onLinkAddError({ responseText: '{ "message": "' + serverText + '" }' }, statusText, exceptionText);
      expect(comms.errorMsg()).toEqual(serverText);
    });
  });

  describe('successful response from server', function() {

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