/**
 * @file
 *
 * Defines the {@link Point} class.
 *
 * @module point
 */

import {
  isBoolean, isLinearGradientColor, isNullOrUndefined, isString,
  isValidTime, objectHasProperty
} from './utils';

const pointOptions = ['id', 'time', 'labelText', 'color', 'editable'];

const invalidOptions = [
  'update', 'isVisible', 'peaks'
];

function setDefaultPointOptions(options, peaksOptions) {
  if (isNullOrUndefined(options.labelText)) {
    options.labelText = '';
  }

  if (isNullOrUndefined(options.editable)) {
    options.editable = false;
  }

  if (isNullOrUndefined(options.color)) {
    options.color = peaksOptions.pointMarkerColor;
  }
}

function validatePointOptions(options, updating) {
  const context = updating ? 'update()' : 'add()';

  if (!updating || (updating && objectHasProperty(options, 'time'))) {
    if (!isValidTime(options.time)) {
      // eslint-disable-next-line max-len
      throw new TypeError('peaks.points.' + context + ': time should be a numeric value');
    }
  }

  if (options.time < 0) {
    // eslint-disable-next-line max-len
    throw new RangeError('peaks.points.' + context + ': time should not be negative');
  }

  if (objectHasProperty(options, 'labelText') && !isString(options.labelText)) {
    throw new TypeError('peaks.points.' + context + ': labelText must be a string');
  }

  if (objectHasProperty(options, 'editable') && !isBoolean(options.editable)) {
    throw new TypeError('peaks.points.' + context + ': editable must be true or false');
  }

  if (objectHasProperty(options, 'color') &&
    !isString(options.color) &&
    !isLinearGradientColor(options.color)) {
    // eslint-disable-next-line max-len
    throw new TypeError('peaks.points.' + context + ': color must be a string or a valid linear gradient object');
  }

  invalidOptions.forEach(function(name) {
    if (objectHasProperty(options, name)) {
      throw new Error('peaks.points.' + context + ': invalid option name: ' + name);
    }
  });

  pointOptions.forEach(function(name) {
    if (objectHasProperty(options, '_' + name)) {
      throw new Error('peaks.points.' + context + ': invalid option name: _' + name);
    }
  });
}

/**
 * A point is a single instant of time, with associated label and color.
 *
 * @class
 * @alias Point
 *
 * @param {Peaks} peaks A reference to the Peaks instance.
 * @param {String} id A unique identifier for the point.
 * @param {Number} time Point time, in seconds.
 * @param {String} labelText Point label text.
 * @param {String} color Point marker color.
 * @param {Boolean} editable If <code>true</code> the segment start and
 *   end times can be adjusted via the user interface.
 * @param {*} data Optional application specific data.
 */

function Point(options) {
  this._peaks = options.peaks;
  this._setUserData(options);
}

Point.prototype._setUserData = function(options) {
  for (const key in options) {
    if (objectHasProperty(options, key)) {
      if (pointOptions.indexOf(key) === -1) {
        this[key] = options[key];
      }
      else {
        this['_' + key] = options[key];
      }
    }
  }
};

Object.defineProperties(Point.prototype, {
  id: {
    enumerable: true,
    get: function() {
      return this._id;
    }
  },
  time: {
    enumerable: true,
    get: function() {
      return this._time;
    }
  },
  labelText: {
    get: function() {
      return this._labelText;
    }
  },
  color: {
    enumerable: true,
    get: function() {
      return this._color;
    }
  },
  editable: {
    enumerable: true,
    get: function() {
      return this._editable;
    }
  }
});

Point.prototype.update = function(options) {
  if (objectHasProperty(options, 'id')) {
    throw new Error('peaks.points.update(): id cannot be updated');
  }

  validatePointOptions(options, true);

  this._setUserData(options);

  this._peaks.emit('points.update', this, options);
};

/**
 * Returns <code>true</code> if the point lies with in a given time range.
 *
 * @param {Number} startTime The start of the time region, in seconds.
 * @param {Number} endTime The end of the time region, in seconds.
 * @returns {Boolean}
 */

Point.prototype.isVisible = function(startTime, endTime) {
  return this.time >= startTime && this.time < endTime;
};

Point.prototype._setTime = function(time) {
  this._time = time;
};

export { Point, setDefaultPointOptions, validatePointOptions };
