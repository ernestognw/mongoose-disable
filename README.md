Mongoose Disable Plugin
=========

mongoose-disable is a simple and lightweight plugin that enables document disabling in MongoDB. This code is based on [dsanel](https://github.com/dsanel) plugin [mongoose-delete](https://github.com/dsanel/mongoose-delete)

[![Build Status](https://travis-ci.org/ernestognw/mongoose-disable.svg?branch=master)](https://travis-ci.org/ernestognw/mongoose-disable)
[![Coverage Status](https://coveralls.io/repos/github/ernestognw/mongoose-disable/badge.svg?branch=master&version=new)](https://coveralls.io/github/ernestognw/mongoose-disable?branch=master)

## Inspiration
mongoose-delete is a great implementation of a soft delete mechanism that enables users to hide documents without really deleting them. This isually allows to maintain references from other documents in DB without breaking your whole application.

Although mongoose-delete is perfect for delete cases, deletion is a different state than inactive. And, for some cases, you can use deletion just to keep references working, but it can be considered as a non-recoverable state from user's perspective, which leads yout to search for intermediate states for particular reasons, such as temporary hiddens, archives, etc. This is why I decided to fork the initial implementation in order to have another flag for intermediate states between deleted and non deleted.

## Features
  - [Add __disable()__ method on document (do not override standard __remove()__ method)](#simple-usage)
  - [Add __disableById()__ static method](#simple-usage)
  - [Add __disabled__ (true-false) key on document](#simple-usage)
  - [Add __disabledAt__ key to store time of deletion](#save-time-of-deletion)
  - [Add __disabledBy__ key to record who disabled document](#who-has-disabled-the-data)
  - Restore disabled documents using __enable__ method
  - [Bulk disable and enable](#bulk-disabled-and-enable)
  - [Option to override static methods](#examples-how-to-override-one-or-multiple-methods) (__count, countDocuments, find, findOne, findOneAndUpdate, update, updateMany__)
  - [For overridden methods we have two additional methods](#method-overridden): __methodDeleted__ and __methodWithDeleted__
  - [Disable model validation on disabled](#disable-model-validation-on-disabled)
  - [Option to create index on disabled fields](#create-index-on-fields) (__disabledd__, __disableddAt__, __disableddBy__)
  - Option to disable use of `$ne` operator using `{use$neOperator: false}`. Before you start to use this option please check [#50](https://github.com/dsanel/mongoose-delete/issues/50).  

## Installation
Install using [npm](https://npmjs.org)
```
npm install mongoose-disable
```
## Usage

We can use this plugin with or without options.

### Simple usage

```javascript
const mongooseDisabled = require('mongoose-disable');

const PetSchema = new Schema({
    name: String
});

PetSchema.plugin(mongooseDisabled);

const Pet = mongoose.model('Pet', PetSchema);

const fluffy = new Pet({ name: 'Fluffy' });

fluffy.save(function () {
    // mongodb: { disabled: false, name: 'Fluffy' }

    // note: you should invoke exactly disable() method instead of standard fluffy.remove()
    fluffy.disable(function () {
        // mongodb: { disabled: true, name: 'Fluffy' }

        fluffy.enable(function () {
            // mongodb: { disabled: false, name: 'Fluffy' }
        });
    });

});

const examplePetId = mongoose.Types.ObjectId("53da93b16b4a6670076b16bf");

// INFO: Example usage of disableById static method
Pet.disableById(examplePetId, function (err, petDocument) {
    // mongodb: { disabled: true, name: 'Fluffy', _id: '53da93b1...' }
});

```


### Save time of disabling

```javascript
const mongooseDisabled = require('mongoose-disable');

const PetSchema = new Schema({
    name: String
});

PetSchema.plugin(mongooseDisabled, { disabledAt : true });

const Pet = mongoose.model('Pet', PetSchema);

const fluffy = new Pet({ name: 'Fluffy' });

fluffy.save(function () {
    // mongodb: { disabled: false, name: 'Fluffy' }

    fluffy.disable(function () {
        // mongodb: { disabled: true, name: 'Fluffy', disabledAt: ISODate("2014-08-01T10:34:53.171Z")}

        fluffy.enable(function () {
            // mongodb: { disabled: false, name: 'Fluffy' }
        });
    });

});
```


### Who has disabled the data?

```javascript
const mongooseDisabled = require('mongoose-disable');

const PetSchema = new Schema({
    name: String
});

PetSchema.plugin(mongooseDisabled, { disabledBy : true });

const Pet = mongoose.model('Pet', PetSchema);

const fluffy = new Pet({ name: 'Fluffy' });

fluffy.save(function () {
    // mongodb: { disabled: false, name: 'Fluffy' }

    const idUser = mongoose.Types.ObjectId("53da93b16b4a6670076b16bf");

    fluffy.disable(idUser, function () {
        // mongodb: { disabled: true, name: 'Fluffy', disabledBy: ObjectId("53da93b16b4a6670076b16bf")}

        fluffy.enable(function () {
            // mongodb: { disabled: false, name: 'Fluffy' }
        });
    });

});
```

### Bulk disable and enable

```javascript
const mongooseDisabled = require('mongoose-disable');

const PetSchema = new Schema({
    name: String,
    age: Number
});

PetSchema.plugin(mongooseDisabled);

const Pet = mongoose.model('Pet', PetSchema);

const idUser = mongoose.Types.ObjectId("53da93b16b4a6670076b16bf");

// Disable multiple object, callback
Pet.disable(function (err, result) { ... });
Pet.disable({age:10}, function (err, result) { ... });
Pet.disable({}, idUser, function (err, result) { ... });
Pet.disable({age:10}, idUser, function (err, result) { ... });

// Disable multiple object, promise
Pet.disable().exec(function (err, result) { ... });
Pet.disable({age:10}).exec(function (err, result) { ... });
Pet.disable({}, idUser).exec(function (err, result) { ... });
Pet.disable({age:10}, idUser).exec(function (err, result) { ... });

// Enable multiple object, callback
Pet.enable(function (err, result) { ... });
Pet.enable({age:10}, function (err, result) { ... });

// Enable multiple object, promise
Pet.enable().exec(function (err, result) { ... });
Pet.enable({age:10}).exec(function (err, result) { ... });
```

### Method overridden

We have the option to override all standard methods or only specific methods. Overridden methods will exclude deleted documents from results, documents that have ```disabled = true```. Every overridden method will have two additional methods, so we will be able to work with disabled documents.

| only not deleted documents | only disabled documents  | all documents               |
|----------------------------|-------------------------|-----------------------------|
| count()                    | countDeleted            | countWithDeleted            |
| countDocuments()           | countDocumentsDeleted   | countDocumentsWithDeleted   |
| find()                     | findDeleted             | findWithDeleted             |
| findOne()                  | findOneDeleted          | findOneWithDeleted          |
| findOneAndUpdate()         | findOneAndUpdateDeleted | findOneAndUpdateWithDeleted |
| update()                   | updateDeleted           | updateWithDeleted           |
| updateMany()               | updateManyDeleted       | updateManyWithDeleted       |

### Examples how to override one or multiple methods

```javascript
const mongooseDisabled = require('mongoose-disable');

const PetSchema = new Schema({
    name: String
});

// Override all methods
PetSchema.plugin(mongooseDisabled, { overrideMethods: 'all' });
// or 
PetSchema.plugin(mongooseDisabled, { overrideMethods: true });

// Overide only specific methods
PetSchema.plugin(mongooseDisabled, { overrideMethods: ['count', 'find', 'findOne', 'findOneAndUpdate', 'update'] });
// or
PetSchema.plugin(mongooseDisabled, { overrideMethods: ['count', 'countDocuments', 'find'] });
// or (unrecognized method names will be ignored)
PetSchema.plugin(mongooseDisabled, { overrideMethods: ['count', 'find', 'errorXyz'] });


const Pet = mongoose.model('Pet', PetSchema);

// Example of usage overridden methods

Pet.find(function (err, documents) {
  // will return only NOT DELETED documents
});

Pet.findDeleted(function (err, documents) {
  // will return only DELETED documents
});

Pet.findWithDeleted(function (err, documents) {
  // will return ALL documents
});

```

### Disable model validation on disable

```javascript
const mongooseDisabled = require('mongoose-disable');

const PetSchema = new Schema({
    name: { type: String, required: true }
});

// By default, validateBeforeDelete is set to true
PetSchema.plugin(mongooseDisabled);
// the previous line is identical to next line
PetSchema.plugin(mongooseDisabled, { validateBeforeDelete: true });

// To disable model validation on disable, set validateBeforeDelete option to false
PetSchema.plugin(mongooseDisabled, { validateBeforeDelete: false });

// NOTE: This is based on existing Mongoose validateBeforeSave option
// http://mongoosejs.com/docs/guide.html#validateBeforeSave

```

### Create index on fields

```javascript
const mongooseDisabled = require('mongoose-disable');

const PetSchema = new Schema({
    name: String
});

// Index all field related to plugin (disabled, disabledAt, disabledBy)
PetSchema.plugin(mongooseDisabled, { indexFields: 'all' });
// or 
PetSchema.plugin(mongooseDisabled, { indexFields: true });

// Index only specific fields
PetSchema.plugin(mongooseDisabled, { indexFields: ['disabled', 'disabledBy'] });
// or
PetSchema.plugin(mongooseDisabled, { indexFields: ['disabledAt'] });


```

## License

The MIT License

Copyright (c) 2020 Ernesto García https://github.com/ernestognw

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
