const mongoose = require('mongoose');
const { Schema, Model } = mongoose;

/**
 * This code is taken from official mongoose repository
 * https://github.com/Automattic/mongoose/blob/master/lib/query.js#L3847-L3873
 */
/* istanbul ignore next */
const parseUpdateArguments = (conditions, doc, options, callback) => {
  if ('function' === typeof options) {
    // .update(conditions, doc, callback)
    callback = options;
    options = null;
  } else if ('function' === typeof doc) {
    // .update(doc, callback);
    callback = doc;
    doc = conditions;
    conditions = {};
    options = null;
  } else if ('function' === typeof conditions) {
    // .update(callback)
    callback = conditions;
    conditions = undefined;
    doc = undefined;
    options = undefined;
  } else if (typeof conditions === 'object' && !doc && !options && !callback) {
    // .update(doc)
    doc = conditions;
    conditions = undefined;
    options = undefined;
    callback = undefined;
  }

  const args = [];

  if (conditions) args.push(conditions);
  if (doc) args.push(doc);
  if (options) args.push(options);
  if (callback) args.push(callback);

  return args;
};

const parseIndexFields = options => {
  const indexFields = {
    disabled: false,
    disabledAt: false,
    disabledBy: false
  };

  if (!options.indexFields) {
    return indexFields;
  }

  if (
    (typeof options.indexFields === 'string' || options.indexFields instanceof String) &&
    options.indexFields === 'all'
  ) {
    indexFields.disabled = true;
    indexFields.disabledAt = true;
    indexFields.disabledBy = true;
  }

  if (typeof options.indexFields === 'boolean' && options.indexFields === true) {
    indexFields.disabled = true;
    indexFields.disabledAt = true;
    indexFields.disabledBy = true;
  }

  if (Array.isArray(options.indexFields)) {
    indexFields.disabled = options.indexFields.indexOf('disabled') > -1;
    indexFields.disabledAt = options.indexFields.indexOf('disabledAt') > -1;
    indexFields.disabledBy = options.indexFields.indexOf('disabledBy') > -1;
  }

  return indexFields;
};

const createSchemaObject = (typeKey, typeValue, options) => {
  options[typeKey] = typeValue;
  return options;
};

module.exports = (schema, options) => {
  options = options || {};
  const indexFields = parseIndexFields(options);

  const typeKey = schema.options.typeKey;
  const mongooseMajorVersion = +mongoose.version[0]; // 4, 5...
  const mainUpdateMethod = mongooseMajorVersion < 5 ? 'update' : 'updateMany';
  schema.add({
    disabled: createSchemaObject(typeKey, Boolean, {
      default: false,
      index: indexFields.disabled
    })
  });

  if (options.disabledAt === true) {
    schema.add({
      disabledAt: createSchemaObject(typeKey, Date, {
        index: indexFields.disabledAt
      })
    });
  }

  if (options.disabledBy === true) {
    schema.add({
      disabledBy: createSchemaObject(typeKey, options.disabledByType || Schema.Types.ObjectId, {
        index: indexFields.disabledBy
      })
    });
  }

  let use$neOperator = true;
  if (options.use$neOperator !== undefined && typeof options.use$neOperator === 'boolean') {
    use$neOperator = options.use$neOperator;
  }

  schema.pre('save', function preSave(next) {
    if (!this.disabled) {
      this.disabled = false;
    }
    next();
  });

  if (options.overrideMethods) {
    const overrideItems = options.overrideMethods;
    const overridableMethods = [
      'count',
      'countDocuments',
      'find',
      'findOne',
      'findOneAndUpdate',
      'update',
      'updateMany'
    ];
    let finalList = [];

    if (
      (typeof overrideItems === 'string' || overrideItems instanceof String) &&
      overrideItems === 'all'
    ) {
      finalList = overridableMethods;
    }

    if (typeof overrideItems === 'boolean' && overrideItems === true) {
      finalList = overridableMethods;
    }

    if (Array.isArray(overrideItems)) {
      overrideItems.forEach(method => {
        if (overridableMethods.indexOf(method) > -1) {
          finalList.push(method);
        }
      });
    }

    finalList.forEach(method => {
      if (['count', 'countDocuments', 'find', 'findOne'].indexOf(method) > -1) {
        const modelMethodName = method;

        // countDocuments do not exist in Mongoose v4
        /* istanbul ignore next */
        if (
          mongooseMajorVersion < 5 &&
          method === 'countDocuments' &&
          typeof Model.countDocuments !== 'function'
        ) {
          modelMethodName = 'count';
        }

        schema.statics[method] = function newStaticMethod() {
          if (use$neOperator) {
            return Model[modelMethodName]
              .apply(this, arguments)
              .where('disabled')
              .ne(true);
          }

          return Model[modelMethodName].apply(this, arguments).where({ disabled: false });
        };
        schema.statics[method + 'Disabled'] = function newStaticDisabledMethod() {
          if (use$neOperator) {
            return Model[modelMethodName]
              .apply(this, arguments)
              .where('disabled')
              .ne(false);
          }
          return Model[modelMethodName].apply(this, arguments).where({ disabled: true });
        };
        schema.statics[method + 'WithDisabled'] = function newStaticWithDisabledMethod() {
          return Model[modelMethodName].apply(this, arguments);
        };
      } else {
        schema.statics[method] = function newStaticMethod() {
          const args = parseUpdateArguments.apply(undefined, arguments);

          if (use$neOperator) {
            args[0].disabled = { $ne: true };
          } else {
            args[0].disabled = false;
          }

          return Model[method].apply(this, args);
        };

        schema.statics[method + 'Disabled'] = function newStaticDisabledMethod() {
          const args = parseUpdateArguments.apply(undefined, arguments);

          if (use$neOperator) {
            args[0].disabled = { $ne: false };
          } else {
            args[0].disabled = true;
          }

          return Model[method].apply(this, args);
        };

        schema.statics[method + 'WithDisabled'] = function newStaticWithDisabledMethod() {
          return Model[method].apply(this, arguments);
        };
      }
    });
  }

  schema.methods.disable = function disable(disabledBy, cb) {
    if (typeof disabledBy === 'function') {
      cb = disabledBy;
      disabledBy = null;
    }

    this.disabled = true;

    if (schema.path('disabledAt')) {
      this.disabledAt = new Date();
    }

    if (schema.path('disabledBy')) {
      this.disabledBy = disabledBy;
    }

    if (options.validateBeforeDisable === false) {
      return this.save({ validateBeforeSave: false }, cb);
    }

    return this.save(cb);
  };

  schema.statics.disable = function disable(conditions, disabledBy, callback) {
    if (typeof disabledBy === 'function') {
      callback = disabledBy;
      disabledBy = null;
    } else if (typeof conditions === 'function') {
      callback = conditions;
      conditions = {};
      disabledBy = null;
    }

    const doc = {
      disabled: true
    };

    if (schema.path('disabledAt')) {
      doc.disabledAt = new Date();
    }

    if (schema.path('disabledBy')) {
      doc.disabledBy = disabledBy;
    }

    if (this.updateWithDisabled) {
      return this.updateWithDisabled(conditions, doc, { multi: true }, callback);
    }
    return this[mainUpdateMethod](conditions, doc, { multi: true }, callback);
  };

  schema.statics.disableById = function disabledById(id, disabledBy, callback) {
    if (arguments.length === 0 || typeof id === 'function') {
      const msg = 'First argument is mandatory and must not be a function.';
      throw new TypeError(msg);
    }

    const conditions = {
      _id: id
    };

    return this.disable(conditions, disabledBy, callback);
  };

  schema.methods.enable = function enable(callback) {
    this.disabled = false;
    this.disabledAt = undefined;
    this.disabledBy = undefined;
    return this.save(callback);
  };

  schema.statics.enable = function enable(conditions, callback) {
    if (typeof conditions === 'function') {
      callback = conditions;
      conditions = {};
    }

    const doc = {
      disabled: false,
      disabledAt: undefined,
      disabledBy: undefined
    };

    if (this.updateWithDisabled) {
      return this.updateWithDisabled(conditions, doc, { multi: true }, callback);
    }
    return this[mainUpdateMethod](conditions, doc, { multi: true }, callback);
  };
};
