'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * This will get a queryParam from the passed url string
 * @param  queryParamKey  The key for the queryParam
 * @return                The value of the queryParam
 */
var getQueryParam = exports.getQueryParam = function getQueryParam(queryParamKey) {
  return context.getVariable('request.queryparam.' + queryParamKey);
};

/**
 * This will get a set of queryParams from the passed url string
 * @param  possibleQueryParams  An array containing possible queryparams
 * @return                      An object containing values for the passed in queryparams
 */
var getQueryParams = exports.getQueryParams = function getQueryParams(possibleQueryParams) {
  return possibleQueryParams.reduce(function (queryParams, possibleQueryKey) {
    return _extends({}, queryParams, _defineProperty({}, possibleQueryKey, getQueryParam(possibleQueryKey)));
  }, {});
};

/**
 * This will set a query parameter to the provided value
 * @param  key   The key of the queryparam to set
 * @param  value The value to set the queryparam to
 */
var setQueryParam = exports.setQueryParam = function setQueryParam(key, value) {
  return context.setVariable('request.queryparam.' + key, value);
};

/**
 * This will convert an object with key value pairs to query parameters
 * @param  queryParams   An object containing key value pairs to be used as query parameters
 */
var setQueryParams = exports.setQueryParams = function setQueryParams(queryParams) {
  return Object.keys(queryParams).forEach(function (key) {
    return setQueryParam(key, queryParams[key]);
  });
};

/**
 * This will validate a set of query parameters and will set a error variable in the apigee with an errorpayload variable which can be send down to the client
 * It is advised to set up a raise on error policy which will return the payload when the error variable == true
 * @param  queryParams          The keys the values to get are stored with
 * @param  settings             Object containing the settings for getting the variables
 * @param  settings.validator   The validator is an object containing functions which take a value and tests whether the value matches to required format returning true for a valid parameter and false for invalid. Or it can return a custom error message as a string. It is also possible to return mutliple error messages as an array of strings. The keys of the validator should be identical to the queryparam keys.
 * @return                      A boolean indicating whether an invalid query param was detected or not
 */
var validateQueryParams = exports.validateQueryParams = function validateQueryParams(queryParams, _ref) {
  var _ref$validator = _ref.validator;
  var validator = _ref$validator === undefined ? {} : _ref$validator;

  var error = {
    error: false,
    payload: {
      errors: []
    }
  };

  Object.keys(queryParams).forEach(function (key) {
    if (queryParams[key] !== undefined && queryParams[key] !== null && validator[key]) {
      var validatorResponse = validator[key](queryParams[key]);
      var invalidResponse = validatorResponse === false || typeof validatorResponse === 'string' && validatorResponse !== '' || Array.isArray(validatorResponse) && !validatorResponse.length;

      if (invalidResponse) {
        var errorMessage = typeof validatorResponse === 'boolean' ? '' : validatorResponse;

        error.payload.errors = !Array.isArray(errorMessage) ? [].concat(_toConsumableArray(error.payload.errors), [createErrorObject(key, queryParams[key], errorMessage)]) : [].concat(_toConsumableArray(error.payload.errors), _toConsumableArray(errorMessage.map(function (singleErrorMessage) {
          return createErrorObject(key, queryParams[key], singleErrorMessage);
        })));
      }
    }
  });

  if (error.payload.errors.length) {
    error.payload = {
      title: 'Invalid query parameter',
      message: 'One or more query parameters are invalid',
      statusCode: 400,
      errors: error.payload.errors
    };
  }

  setVariables({
    error: error.error,
    errorpayload: JSON.stringify(error.payload)
  }, {
    prefix: ''
  });

  return error.error;
};

/**
 * This will create the default error message
 * @param  key      The key of the query parameter
 * @param  value    The value of the query parameter
 * @param  message  The custom message to use
 * @return          A default error object
 */
var createErrorObject = function createErrorObject(key, value, message) {
  return {
    title: 'Invalid ' + key + ' query parameter',
    message: message === '' ? 'Invalid ' + key + ' parameter. You passed "' + value + '".' : message,
    source: key
  };
};

/**
 * This will do a simple check if the passed string is a stringified boolean or not
 * @param name	The name of the variable to check
 * @param value	The value of the variable to check
 * @return      A default error message or an empty string
 */
var validateBoolean = exports.validateBoolean = function validateBoolean(name, value) {
  return value !== 'true' && value !== 'false' ? 'Valid ' + name + ' parameters are "true" and "false". You passed "' + value + '".' : '';
};

/**
 * This will do a simple check if the passed value is one of the valid values
 * @param name	      The name of the variable to check
 * @param value	      The value of the variable to check
 * @param validValues	The options for value
 * @return            A default error message or an empty string
 */
var validateEnum = exports.validateEnum = function validateEnum(name, value, validValues) {
  return validValues.indexOf(value) !== -1 ? 'Valid ' + name + ' parameters are ' + validValues.join(', ') + '. You passed "' + value + '".' : '';
};

/**
 * This will do a simple check if the passed string of values contains one or more valid values
 * @param name	      The name of the variable to check
 * @param values	    The values of the variable to check (must be a string seperated by commas)
 * @param validValues	The options for value
 * @return            A default error message or an empty string
 */
var validateMultipleEnum = exports.validateMultipleEnum = function validateMultipleEnum(name, values, validValues) {
  return !values.split(',').every(function (value) {
    return validValues.indexOf(value) !== -1;
  }) ? 'Valid ' + name + ' parameters are ' + validValues.join(', ') + ' seperated by just a ",". You passed "' + values + '".' : '';
};

/**
 * This will store a value in the Apigee flow
 * @param  key                    The key the value should be stored in
 * @param  value                  The value to store
 * @param  settings               Object containing the settings for setting the variable
 * @param  settings.prefix        A prefix which is used to store the value with
 */
var setVariable = exports.setVariable = function setVariable(key, value, _ref2) {
  var _ref2$prefix = _ref2.prefix;
  var prefix = _ref2$prefix === undefined ? '' : _ref2$prefix;

  if (value !== undefined) {
    context.setVariable(prefix + key, value);
  }
};

/**
 * This will store a set of values in the Apigee flow
 * @param  variables              An object containing key value pairs to store
 * @param  settings               Object containing the settings for setting the variables
 * @param  settings.prefix        A prefix which is used to store the value with
 */
var setVariables = exports.setVariables = function setVariables(variables, _ref3) {
  var _ref3$prefix = _ref3.prefix;
  var prefix = _ref3$prefix === undefined ? '' : _ref3$prefix;
  return Object.keys(variables).forEach(function (key) {
    if (variables[key] !== undefined && variables[key] !== null) {
      setVariable(key, variables[key], {
        prefix: prefix
      });
    }
  });
};