const should = require('chai').should();
const expect = require('chai').expect;
const mongoose = require('mongoose');
const { Schema } = mongoose;

const mongooseDisable = require('../');

before(done => {
  mongoose.connect(process.env.MONGOOSE_TEST_URI || 'mongodb://localhost/test', {
    useNewUrlParser: true
  });
  if (+mongoose.version[0] >= 5) {
    mongoose.set('useCreateIndex', true);
    mongoose.set('useFindAndModify', false);
  }
  done();
});

after(done => {
  mongoose.disconnect();
  done();
});

describe('mongooseDisable disable method without callback function', () => {
  const Test1Schema = new Schema({ name: String }, { collection: 'mongooseDisable_test0' });
  Test1Schema.plugin(mongooseDisable);
  const Test0 = mongoose.model('Test0', Test1Schema);

  before(done => {
    const puffy = new Test0({ name: 'Puffy' });

    puffy.save(() => {
      done();
    });
  });

  after(done => {
    mongoose.connection.db.dropCollection('mongooseDisable_test0', () => {
      done();
    });
  });

  it('disable() -> should return a thenable (Promise)', done => {
    Test0.findOne({ name: 'Puffy' }, (err, puffy) => {
      should.not.exist(err);

      expect(puffy.disable()).to.have.property('then');
      done();
    });
  });
});

describe('mongooseDisable plugin without options', () => {
  const Test1Schema = new Schema({ name: String }, { collection: 'mongooseDisable_test1' });
  Test1Schema.plugin(mongooseDisable);
  const Test1 = mongoose.model('Test1', Test1Schema);
  const puffy1 = new Test1({ name: 'Puffy1' });
  const puffy2 = new Test1({ name: 'Puffy2' });

  before(done => {
    puffy1.save(() => {
      puffy2.save(() => {
        done();
      });
    });
  });

  after(done => {
    mongoose.connection.db.dropCollection('mongooseDisable_test1', () => {
      done();
    });
  });

  it('disable() -> should set disabled:true', done => {
    Test1.findOne({ name: 'Puffy1' }, (error, puffy) => {
      should.not.exist(error);

      puffy.disable((err, success) => {
        if (err) {
          throw err;
        }
        success.disabled.should.equal(true);
        done();
      });
    });
  });

  it("disable() -> should not save 'disabledAt' value", done => {
    Test1.findOne({ name: 'Puffy1' }, (error, puffy) => {
      should.not.exist(error);

      puffy.disable((err, success) => {
        if (err) {
          throw err;
        }
        should.not.exist(success.disabledAt);
        done();
      });
    });
  });

  it("disableById() -> should set disabled:true and not save 'disabledAt'", done => {
    Test1.disableById(puffy2._id, (error, documents) => {
      should.not.exist(error);
      documents.ok.should.equal(1);
      documents.n.should.equal(1);

      Test1.findOne({ name: 'Puffy2' }, (err, doc) => {
        should.not.exist(err);
        doc.disabled.should.equal(true);
        should.not.exist(doc.disabledAt);
        done();
      });
    });
  });

  it('disableById() -> should throws exception: first argument error', done => {
    const errMessage = 'First argument is mandatory and must not be a function.';
    expect(Test1.disableById).to.throw(errMessage);
    expect(() => {
      Test1.disableById(() => {});
    }).to.throw(errMessage);
    done();
  });

  it('restore() -> should set disabled:false', done => {
    Test1.findOne({ name: 'Puffy1' }, (error, puffy) => {
      should.not.exist(error);

      puffy.enable((err, success) => {
        if (err) {
          throw err;
        }
        success.disabled.should.equal(false);
        done();
      });
    });
  });
});

describe('mongooseDisable plugin without options, using option: typeKey', () => {
  const Test1Schema = new Schema(
    { name: String },
    { collection: 'mongooseDisable_test1', typeKey: '$type' }
  );
  Test1Schema.plugin(mongooseDisable);
  const Test1 = mongoose.model('Test1a', Test1Schema);
  const puffy1 = new Test1({ name: 'Puffy1' });
  const puffy2 = new Test1({ name: 'Puffy2' });

  before(done => {
    puffy1.save(() => {
      puffy2.save(() => {
        done();
      });
    });
  });

  after(done => {
    mongoose.connection.db.dropCollection('mongooseDisable_test1', () => {
      done();
    });
  });

  it('disable() -> should set disabled:true', done => {
    Test1.findOne({ name: 'Puffy1' }, (error, puffy) => {
      should.not.exist(error);

      puffy.disable((err, success) => {
        if (err) {
          throw err;
        }
        success.disabled.should.equal(true);
        done();
      });
    });
  });

  it("disable() -> should not save 'disabledAt' value", done => {
    Test1.findOne({ name: 'Puffy1' }, (error, puffy) => {
      should.not.exist(error);

      puffy.disable((err, success) => {
        if (err) {
          throw err;
        }
        should.not.exist(success.disabledAt);
        done();
      });
    });
  });

  it("disableById() -> should set disabled:true and not save 'disabledAt'", done => {
    Test1.disableById(puffy2._id, (error, documents) => {
      should.not.exist(error);
      documents.ok.should.equal(1);
      documents.n.should.equal(1);

      Test1.findOne({ name: 'Puffy2' }, (err, doc) => {
        should.not.exist(err);
        doc.disabled.should.equal(true);
        should.not.exist(doc.disabledAt);
        done();
      });
    });
  });

  it('restore() -> should set disabled:false', done => {
    Test1.findOne({ name: 'Puffy1' }, (error, puffy) => {
      should.not.exist(error);

      puffy.enable((err, success) => {
        if (err) {
          throw err;
        }
        success.disabled.should.equal(false);
        done();
      });
    });
  });
});

describe('mongooseDisable with options: { disabledAt : true }', () => {
  const Test2Schema = new Schema({ name: String }, { collection: 'mongooseDisable_test2' });
  Test2Schema.plugin(mongooseDisable, { disabledAt: true });
  const Test2 = mongoose.model('Test2', Test2Schema);
  const puffy1 = new Test2({ name: 'Puffy1' });
  const puffy2 = new Test2({ name: 'Puffy2' });

  before(done => {
    puffy1.save(() => {
      puffy2.save(() => {
        done();
      });
    });
  });

  after(done => {
    mongoose.connection.db.dropCollection('mongooseDisable_test2', () => {
      done();
    });
  });

  it("disable() -> should save 'disabledAt' key", done => {
    Test2.findOne({ name: 'Puffy1' }, (error, puffy) => {
      should.not.exist(error);

      puffy.disable((err, success) => {
        if (err) {
          throw err;
        }
        should.exist(success.disabledAt);
        done();
      });
    });
  });

  it("disableById() -> should save 'disabledAt' key", done => {
    Test2.disableById(puffy2._id, (error, documents) => {
      should.not.exist(error);
      documents.ok.should.equal(1);
      documents.n.should.equal(1);

      Test2.findOne({ name: 'Puffy2' }, (err, doc) => {
        should.not.exist(err);
        doc.disabled.should.equal(true);
        should.exist(doc.disabledAt);
        done();
      });
    });
  });

  it('restore() -> should set disabled:false and disable disabledAt key', done => {
    Test2.findOne({ name: 'Puffy1' }, (error, puffy) => {
      should.not.exist(error);

      puffy.enable((err, success) => {
        if (err) {
          throw err;
        }
        success.disabled.should.equal(false);
        should.not.exist(success.disabledAt);
        done();
      });
    });
  });
});

describe('mongooseDisable with options: { disabledAt : true }, using option: typeKey', () => {
  const Test2Schema = new Schema(
    { name: String },
    { collection: 'mongooseDisable_test2', typeKey: '$type' }
  );
  Test2Schema.plugin(mongooseDisable, { disabledAt: true });
  const Test2 = mongoose.model('Test2a', Test2Schema);
  const puffy1 = new Test2({ name: 'Puffy1' });
  const puffy2 = new Test2({ name: 'Puffy2' });

  before(done => {
    puffy1.save(() => {
      puffy2.save(() => {
        done();
      });
    });
  });

  after(done => {
    mongoose.connection.db.dropCollection('mongooseDisable_test2', () => {
      done();
    });
  });

  it("disable() -> should save 'disabledAt' key", done => {
    Test2.findOne({ name: 'Puffy1' }, (error, puffy) => {
      should.not.exist(error);

      puffy.disable((err, success) => {
        if (err) {
          throw err;
        }
        should.exist(success.disabledAt);
        done();
      });
    });
  });

  it("disableById() -> should save 'disabledAt' key", done => {
    Test2.disableById(puffy2._id, (error, documents) => {
      should.not.exist(error);
      documents.ok.should.equal(1);
      documents.n.should.equal(1);

      Test2.findOne({ name: 'Puffy2' }, (err, doc) => {
        should.not.exist(err);
        doc.disabled.should.equal(true);
        should.exist(doc.disabledAt);
        done();
      });
    });
  });

  it('restore() -> should set disabled:false and disable disabledAt key', done => {
    Test2.findOne({ name: 'Puffy1' }, (error, puffy) => {
      should.not.exist(error);

      puffy.enable((err, success) => {
        if (err) {
          throw err;
        }
        success.disabled.should.equal(false);
        should.not.exist(success.disabledAt);
        done();
      });
    });
  });
});

describe('mongooseDisable with options: { disabledBy : true }', () => {
  const Test3Schema = new Schema({ name: String }, { collection: 'mongooseDisable_test3' });
  Test3Schema.plugin(mongooseDisable, { disabledBy: true });
  const Test3 = mongoose.model('Test3', Test3Schema);
  const puffy1 = new Test3({ name: 'Puffy1' });
  const puffy2 = new Test3({ name: 'Puffy2' });

  before(done => {
    puffy1.save(() => {
      puffy2.save(() => {
        done();
      });
    });
  });

  after(done => {
    mongoose.connection.db.dropCollection('mongooseDisable_test3', () => {
      done();
    });
  });

  const id = mongoose.Types.ObjectId('53da93b16b4a6670076b16bf');

  it("disable() -> should save 'disabledBy' key", done => {
    Test3.findOne({ name: 'Puffy1' }, (error, puffy) => {
      should.not.exist(error);

      puffy.disable(id, (err, success) => {
        should.not.exist(err);

        success.disabledBy.should.equal(id);
        done();
      });
    });
  });

  it('disableById() -> should save `disabledBy` key', done => {
    Test3.disableById(puffy2._id, id, (error, documents) => {
      should.not.exist(error);
      documents.ok.should.equal(1);
      documents.n.should.equal(1);

      Test3.findOne({ name: 'Puffy2' }, (err, doc) => {
        should.not.exist(err);
        doc.disabled.should.equal(true);
        doc.disabledBy.toString().should.equal(id.toString());
        done();
      });
    });
  });

  it('restore() -> should set disabled:false and disable `disabledBy` key', done => {
    Test3.findOne({ name: 'Puffy1' }, (error, puffy) => {
      should.not.exist(error);

      puffy.enable((err, success) => {
        if (err) {
          throw err;
        }
        success.disabled.should.equal(false);
        should.not.exist(success.disabledBy);
        done();
      });
    });
  });
});

describe('mongooseDisable with options: { disabledBy : true }, using option: typeKey', () => {
  const Test3Schema = new Schema(
    { name: String },
    { collection: 'mongooseDisable_test3', typeKey: '$type' }
  );
  Test3Schema.plugin(mongooseDisable, { disabledBy: true });
  const Test3 = mongoose.model('Test3a', Test3Schema);
  const puffy1 = new Test3({ name: 'Puffy1' });
  const puffy2 = new Test3({ name: 'Puffy2' });

  before(done => {
    puffy1.save(() => {
      puffy2.save(() => {
        done();
      });
    });
  });

  after(done => {
    mongoose.connection.db.dropCollection('mongooseDisable_test3', () => {
      done();
    });
  });

  const id = mongoose.Types.ObjectId('53da93b16b4a6670076b16bf');

  it('disable() -> should save `disabledBy` key', done => {
    Test3.findOne({ name: 'Puffy1' }, (error, puffy) => {
      should.not.exist(error);

      puffy.disable(id, (err, success) => {
        should.not.exist(err);

        success.disabledBy.should.equal(id);
        done();
      });
    });
  });

  it('disableById() -> should save disabledBy key', done => {
    Test3.disableById(puffy2._id, id, (error, documents) => {
      should.not.exist(error);
      documents.ok.should.equal(1);
      documents.n.should.equal(1);

      Test3.findOne({ name: 'Puffy2' }, (err, doc) => {
        should.not.exist(err);
        doc.disabled.should.equal(true);
        doc.disabledBy.toString().should.equal(id.toString());
        done();
      });
    });
  });

  it('restore() -> should set disabled:false and disable disabledBy key', done => {
    Test3.findOne({ name: 'Puffy1' }, (error, puffy) => {
      should.not.exist(error);

      puffy.enable((err, success) => {
        if (err) {
          throw err;
        }
        success.disabled.should.equal(false);
        should.not.exist(success.disabledBy);
        done();
      });
    });
  });
});

describe('mongooseDisable with options: { disabledBy : true, disabledByType: String }', () => {
  const TestSchema = new Schema({ name: String }, { collection: 'mongooseDisable_test' });
  TestSchema.plugin(mongooseDisable, {
    disabledBy: true,
    disabledByType: String
  });
  const Test = mongoose.model('TestdisabledByType', TestSchema);
  const puffy1 = new Test({ name: 'Puffy1' });
  const puffy2 = new Test({ name: 'Puffy2' });

  before(done => {
    puffy1.save(() => {
      puffy2.save(() => {
        done();
      });
    });
  });

  after(done => {
    mongoose.connection.db.dropCollection('mongooseDisable_test', () => {
      done();
    });
  });

  const id = 'custom_user_id_12345678';

  it('disable() -> should save disabledBy key', done => {
    Test.findOne({ name: 'Puffy1' }, (error, puffy) => {
      should.not.exist(error);

      puffy.disable(id, (err, success) => {
        should.not.exist(err);

        success.disabledBy.should.equal(id);
        done();
      });
    });
  });

  it('disableById() -> should save disabledBy key', done => {
    Test.disableById(puffy2._id, id, (error, documents) => {
      should.not.exist(error);
      documents.ok.should.equal(1);
      documents.n.should.equal(1);

      Test.findOne({ name: 'Puffy2' }, (err, doc) => {
        should.not.exist(err);
        doc.disabled.should.equal(true);
        doc.disabledBy.should.equal(id);
        done();
      });
    });
  });

  it('restore() -> should set disabled:false and disable disabledBy key', done => {
    Test.findOne({ name: 'Puffy1' }, (error, puffy) => {
      should.not.exist(error);

      puffy.enable((err, success) => {
        if (err) {
          throw err;
        }
        success.disabled.should.equal(false);
        should.not.exist(success.disabledBy);
        done();
      });
    });
  });
});

describe('check not overridden static methods', () => {
  const TestSchema = new Schema({ name: String }, { collection: 'mongooseDisable_test' });
  TestSchema.plugin(mongooseDisable);
  const TestModel = mongoose.model('Test4', TestSchema);

  beforeEach(done => {
    TestModel.create(
      [
        { name: 'Obi-Wan Kenobi', disabled: true },
        { name: 'Darth Vader' },
        { name: 'Luke Skywalker' }
      ],
      done
    );
  });

  afterEach(done => {
    mongoose.connection.db.dropCollection('mongooseDisable_test', done);
  });

  it('count() -> should return 3 documents', done => {
    TestModel.count((err, count) => {
      should.not.exist(err);

      count.should.equal(3);
      done();
    });
  });

  it('countDocuments() -> should return 3 documents', done => {
    // INFO: countDocuments is added in mongoose 5.x
    if (typeof TestModel.countDocuments === 'function') {
      TestModel.countDocuments((err, count) => {
        should.not.exist(err);

        count.should.equal(3);
        done();
      });
    } else {
      done();
    }
  });

  it('find() -> should return 3 documents', done => {
    TestModel.find((err, documents) => {
      should.not.exist(err);

      documents.length.should.equal(3);
      done();
    });
  });

  it('findOne() -> should return 1 disabled document', done => {
    TestModel.findOne({ name: 'Obi-Wan Kenobi' }, (err, doc) => {
      should.not.exist(err);

      expect(doc).to.not.equal(null);
      doc.disabled.should.equal(true);
      done();
    });
  });

  it('findOneAndUpdate() -> should find and update disabled document', done => {
    TestModel.findOneAndUpdate(
      { name: 'Obi-Wan Kenobi' },
      { name: 'Obi-Wan Kenobi Test' },
      { new: true },
      (err, doc) => {
        should.not.exist(err);

        expect(doc).to.not.equal(null);
        doc.name.should.equal('Obi-Wan Kenobi Test');
        done();
      }
    );
  });

  it('update() -> should update disabled document', done => {
    TestModel.update({ name: 'Obi-Wan Kenobi' }, { name: 'Obi-Wan Kenobi Test' }, (err, doc) => {
      should.not.exist(err);

      doc.ok.should.equal(1);
      doc.n.should.equal(1);
      done();
    });
  });

  it('updateMany() -> should update disabled document', done => {
    TestModel.updateMany(
      { name: 'Obi-Wan Kenobi' },
      { name: 'Obi-Wan Kenobi Test' },
      (err, doc) => {
        should.not.exist(err);

        doc.ok.should.equal(1);
        doc.n.should.equal(1);
        done();
      }
    );
  });
});

describe("check overridden static methods: { overrideMethods: 'all' }", () => {
  const TestSchema = new Schema({ name: String }, { collection: 'mongooseDisable_test' });
  TestSchema.plugin(mongooseDisable, { overrideMethods: 'all' });
  const TestModel = mongoose.model('Test5', TestSchema);

  beforeEach(done => {
    TestModel.create(
      [
        { name: 'Obi-Wan Kenobi', disabled: true },
        { name: 'Darth Vader' },
        { name: 'Luke Skywalker', disabled: true }
      ],
      done
    );
  });

  afterEach(done => {
    mongoose.connection.db.dropCollection('mongooseDisable_test', done);
  });

  it('count() -> should return 1 documents', done => {
    TestModel.count((err, count) => {
      should.not.exist(err);

      count.should.equal(1);
      done();
    });
  });

  it('countDocuments() -> should return 1 documents', done => {
    TestModel.countDocuments((err, count) => {
      should.not.exist(err);

      count.should.equal(1);
      done();
    });
  });

  it('countDisabled() -> should return 2 disabled documents', done => {
    TestModel.countDisabled((err, count) => {
      should.not.exist(err);

      count.should.equal(2);
      done();
    });
  });

  it('countDocumentsDisabled() -> should return 2 disabled documents', done => {
    TestModel.countDocumentsDisabled((err, count) => {
      should.not.exist(err);

      count.should.equal(2);
      done();
    });
  });

  it('countWithDisabled() -> should return 3 documents', done => {
    TestModel.countWithDisabled((err, count) => {
      should.not.exist(err);

      count.should.equal(3);
      done();
    });
  });

  it('countDocumentsWithDisabled() -> should return 3 documents', done => {
    TestModel.countDocumentsWithDisabled((err, count) => {
      should.not.exist(err);

      count.should.equal(3);
      done();
    });
  });

  it('find() -> should return 1 documents', done => {
    TestModel.find((err, documents) => {
      should.not.exist(err);

      documents.length.should.equal(1);
      done();
    });
  });

  it('findDisabled() -> should return 2 documents', done => {
    TestModel.findDisabled((err, documents) => {
      should.not.exist(err);

      documents.length.should.equal(2);
      done();
    });
  });

  it('findWithDisabled() -> should return 3 documents', done => {
    TestModel.findWithDisabled((err, documents) => {
      should.not.exist(err);

      documents.length.should.equal(3);
      done();
    });
  });

  it('findOne() -> should not return 1 disabled document', done => {
    TestModel.findOne({ name: 'Obi-Wan Kenobi' }, (err, doc) => {
      should.not.exist(err);

      expect(doc).to.equal(null);
      done();
    });
  });

  it('findOneDisabled() -> should return 1 disabled document', done => {
    TestModel.findOneDisabled({ name: 'Obi-Wan Kenobi' }, (err, doc) => {
      should.not.exist(err);

      expect(doc).to.not.equal(null);
      done();
    });
  });

  it('findOneWithDisabled() -> should return 1 disabled document', done => {
    TestModel.findOneWithDisabled({ name: 'Obi-Wan Kenobi' }, (err, doc) => {
      should.not.exist(err);

      expect(doc).to.not.equal(null);
      done();
    });
  });

  it('findOneWithDisabled() -> should return 1 not disabled document', done => {
    TestModel.findOneWithDisabled({ name: 'Darth Vader' }, (err, doc) => {
      should.not.exist(err);

      expect(doc).to.not.equal(null);
      done();
    });
  });

  it('findOneAndUpdate() -> should not find and update disabled document', done => {
    TestModel.findOneAndUpdate(
      { name: 'Obi-Wan Kenobi' },
      { name: 'Obi-Wan Kenobi Test' },
      { new: true },
      (err, doc) => {
        should.not.exist(err);

        expect(doc).to.equal(null);
        done();
      }
    );
  });

  it('findOneAndUpdateDisabled() -> should find and update disabled document', done => {
    TestModel.findOneAndUpdateDisabled(
      { name: 'Obi-Wan Kenobi' },
      { name: 'Obi-Wan Kenobi Test' },
      { new: true },
      (err, doc) => {
        should.not.exist(err);

        expect(doc).to.not.equal(null);
        done();
      }
    );
  });

  it('findOneAndUpdateWithDisabled() -> should find and update disabled document', done => {
    TestModel.findOneAndUpdateWithDisabled(
      { name: 'Obi-Wan Kenobi' },
      { name: 'Obi-Wan Kenobi Test' },
      { new: true },
      (err, doc) => {
        should.not.exist(err);

        expect(doc).to.not.equal(null);
        done();
      }
    );
  });

  it('findOneAndUpdateWithDisabled() -> should find and update not disabled document', done => {
    TestModel.findOneAndUpdateWithDisabled(
      { name: 'Darth Vader' },
      { name: 'Darth Vader Test' },
      { new: true },
      (err, doc) => {
        should.not.exist(err);

        expect(doc).to.not.equal(null);
        done();
      }
    );
  });

  it('update(conditions, update, options, callback) -> should not update disabled documents', done => {
    TestModel.update({}, { name: 'Luke Skywalker Test' }, { multi: true }, (err, doc) => {
      should.not.exist(err);

      doc.ok.should.equal(1);
      doc.n.should.equal(1);
      done();
    });
  });

  it('updateMany(conditions, update, options, callback) -> should not update disabled documents', done => {
    TestModel.updateMany({}, { name: 'Luke Skywalker Test' }, { multi: true }, (err, doc) => {
      should.not.exist(err);

      doc.ok.should.equal(1);
      doc.n.should.equal(1);
      done();
    });
  });

  it('update(conditions, update, options) -> should not update disabled documents', done => {
    TestModel.update({}, { name: 'Luke Skywalker Test' }, { multi: true }).exec((err, doc) => {
      should.not.exist(err);

      doc.ok.should.equal(1);
      doc.n.should.equal(1);
      done();
    });
  });

  it('updateMany(conditions, update, options) -> should not update disabled documents', done => {
    TestModel.updateMany({}, { name: 'Luke Skywalker Test' }, { multi: true }).exec((err, doc) => {
      should.not.exist(err);

      doc.ok.should.equal(1);
      doc.n.should.equal(1);
      done();
    });
  });

  it('update(conditions, update, callback) -> should not update disabled documents', done => {
    TestModel.update({}, { name: 'Luke Skywalker Test' }, (err, doc) => {
      should.not.exist(err);

      doc.ok.should.equal(1);
      doc.n.should.equal(1);
      done();
    });
  });

  it('updateMany(conditions, update, callback) -> should not update disabled documents', done => {
    TestModel.updateMany({}, { name: 'Luke Skywalker Test' }, (err, doc) => {
      should.not.exist(err);

      doc.ok.should.equal(1);
      doc.n.should.equal(1);
      done();
    });
  });

  it('update(conditions, update) -> should not update disabled documents', done => {
    TestModel.update({}, { name: 'Luke Skywalker Test' }).exec((err, doc) => {
      should.not.exist(err);

      doc.ok.should.equal(1);
      doc.n.should.equal(1);
      done();
    });
  });

  it('updateMany(conditions, update) -> should not update disabled documents', done => {
    TestModel.updateMany({}, { name: 'Luke Skywalker Test' }).exec((err, doc) => {
      should.not.exist(err);

      doc.ok.should.equal(1);
      doc.n.should.equal(1);
      done();
    });
  });

  it('updateDisabled() -> should update disabled document', done => {
    TestModel.updateDisabled({}, { name: 'Test 123' }, { multi: true }, (err, doc) => {
      should.not.exist(err);

      doc.ok.should.equal(1);
      doc.n.should.equal(2);
      done();
    });
  });

  it('updateManyDisabled() -> should update disabled document', done => {
    TestModel.updateManyDisabled({}, { name: 'Test 123' }, { multi: true }, (err, doc) => {
      should.not.exist(err);

      doc.ok.should.equal(1);
      doc.n.should.equal(2);
      done();
    });
  });

  it('updateWithDisabled() -> should update all document', done => {
    TestModel.updateWithDisabled({}, { name: 'Test 654' }, { multi: true }, (err, doc) => {
      should.not.exist(err);

      doc.ok.should.equal(1);
      doc.n.should.equal(3);
      done();
    });
  });

  it('updateManyWithDisabled() -> should update all document', done => {
    TestModel.updateManyWithDisabled({}, { name: 'Test 654' }, { multi: true }, (err, doc) => {
      should.not.exist(err);

      doc.ok.should.equal(1);
      doc.n.should.equal(3);
      done();
    });
  });
});

describe('check the existence of override static methods: { overrideMethods: true }', () => {
  const TestSchema = new Schema({ name: String }, { collection: 'mongooseDisable_test' });
  TestSchema.plugin(mongooseDisable, { overrideMethods: true });
  const TestModel = mongoose.model('Test6', TestSchema);

  it('count() -> method should exist', done => {
    expect(TestModel.count).to.not.equal(undefined);
    done();
  });

  it('countDisabled() -> method should exist', done => {
    expect(TestModel.countDisabled).to.not.equal(undefined);
    done();
  });

  it('countWithDisabled() -> method should exist', done => {
    expect(TestModel.countWithDisabled).to.not.equal(undefined);
    done();
  });

  it('countDocuments() -> method should exist', done => {
    expect(TestModel.countDocuments).to.not.equal(undefined);
    done();
  });

  it('countDocumentsDisabled() -> method should exist', done => {
    expect(TestModel.countDocumentsDisabled).to.not.equal(undefined);
    done();
  });

  it('countDocumentsWithDisabled() -> method should exist', done => {
    expect(TestModel.countDocumentsWithDisabled).to.not.equal(undefined);
    done();
  });

  it('find() -> method should exist', done => {
    expect(TestModel.find).to.not.equal(undefined);
    done();
  });

  it('findDisabled() -> method should exist', done => {
    expect(TestModel.findDisabled).to.not.equal(undefined);
    done();
  });

  it('findWithDisabled() -> method should exist', done => {
    expect(TestModel.findWithDisabled).to.not.equal(undefined);
    done();
  });

  it('findOne() -> method should exist', done => {
    expect(TestModel.findOne).to.not.equal(undefined);
    done();
  });

  it('findOneDisabled() -> method should exist', done => {
    expect(TestModel.findOneDisabled).to.not.equal(undefined);
    done();
  });

  it('findOneWithDisabled() -> method should exist', done => {
    expect(TestModel.findOneWithDisabled).to.not.equal(undefined);
    done();
  });

  it('findOneAndUpdate() -> method should exist', done => {
    expect(TestModel.findOneAndUpdate).to.not.equal(undefined);
    done();
  });

  it('findOneAndUpdateDisabled() -> method should exist', done => {
    expect(TestModel.findOneAndUpdateDisabled).to.not.equal(undefined);
    done();
  });

  it('findOneAndUpdateWithDisabled() -> method should exist', done => {
    expect(TestModel.findOneAndUpdateWithDisabled).to.not.equal(undefined);
    done();
  });

  it('update() -> method should exist', done => {
    expect(TestModel.update).to.not.equal(undefined);
    done();
  });

  it('updateDisabled() -> method should exist', done => {
    expect(TestModel.updateDisabled).to.not.equal(undefined);
    done();
  });

  it('updateWithDisabled() -> method should exist', done => {
    expect(TestModel.updateWithDisabled).to.not.equal(undefined);
    done();
  });
});

describe("check the existence of override static methods: { overrideMethods: ['testError', 'count', 'countDocuments', 'find', 'findOne', 'findOneAndUpdate', 'update'] }", () => {
  const TestSchema = new Schema({ name: String }, { collection: 'mongooseDisable_test' });
  TestSchema.plugin(mongooseDisable, {
    overrideMethods: [
      'testError',
      'count',
      'countDocuments',
      'find',
      'findOne',
      'findOneAndUpdate',
      'update'
    ]
  });
  const TestModel = mongoose.model('Test7', TestSchema);

  it('testError() -> method should not exist', done => {
    expect(TestModel.testError).to.equal(undefined);
    done();
  });

  it('count() -> method should exist', done => {
    expect(TestModel.count).to.not.equal(undefined);
    done();
  });

  it('countDisabled() -> method should exist', done => {
    expect(TestModel.countDisabled).to.not.equal(undefined);
    done();
  });

  it('countWithDisabled() -> method should exist', done => {
    expect(TestModel.countWithDisabled).to.not.equal(undefined);
    done();
  });

  it('countDocuments() -> method should exist', done => {
    expect(TestModel.countDocuments).to.not.equal(undefined);
    done();
  });

  it('countDocumentsDisabled() -> method should exist', done => {
    expect(TestModel.countDocumentsDisabled).to.not.equal(undefined);
    done();
  });

  it('countDocumentsWithDisabled() -> method should exist', done => {
    expect(TestModel.countDocumentsWithDisabled).to.not.equal(undefined);
    done();
  });

  it('find() -> method should exist', done => {
    expect(TestModel.find).to.not.equal(undefined);
    done();
  });

  it('findDisabled() -> method should exist', done => {
    expect(TestModel.findDisabled).to.not.equal(undefined);
    done();
  });

  it('findWithDisabled() -> method should exist', done => {
    expect(TestModel.findWithDisabled).to.not.equal(undefined);
    done();
  });

  it('findOne() -> method should exist', done => {
    expect(TestModel.findOne).to.not.equal(undefined);
    done();
  });

  it('findOneDisabled() -> method should exist', done => {
    expect(TestModel.findOneDisabled).to.not.equal(undefined);
    done();
  });

  it('findOneWithDisabled() -> method should exist', done => {
    expect(TestModel.findOneWithDisabled).to.not.equal(undefined);
    done();
  });

  it('findOneAndUpdate() -> method should exist', done => {
    expect(TestModel.findOneAndUpdate).to.not.equal(undefined);
    done();
  });

  it('findOneAndUpdateDisabled() -> method should exist', done => {
    expect(TestModel.findOneAndUpdateDisabled).to.not.equal(undefined);
    done();
  });

  it('findOneAndUpdateWithDisabled() -> method should exist', done => {
    expect(TestModel.findOneAndUpdateWithDisabled).to.not.equal(undefined);
    done();
  });

  it('update() -> method should exist', done => {
    expect(TestModel.update).to.not.equal(undefined);
    done();
  });

  it('updateDisabled() -> method should exist', done => {
    expect(TestModel.updateDisabled).to.not.equal(undefined);
    done();
  });

  it('updateWithDisabled() -> method should exist', done => {
    expect(TestModel.updateWithDisabled).to.not.equal(undefined);
    done();
  });
});

describe("check the existence of override static methods: { overrideMethods: ['count', 'find'] }", () => {
  const TestSchema = new Schema({ name: String }, { collection: 'mongooseDisable_test' });
  TestSchema.plugin(mongooseDisable, {
    overrideMethods: ['count', 'countDocuments', 'find']
  });
  const TestModel = mongoose.model('Test8', TestSchema);

  it('testError() -> method should not exist', done => {
    expect(TestModel.testError).to.equal(undefined);
    done();
  });

  it('count() -> method should exist', done => {
    expect(TestModel.count).to.not.equal(undefined);
    done();
  });

  it('countDisabled() -> method should exist', done => {
    expect(TestModel.countDisabled).to.not.equal(undefined);
    done();
  });

  it('countWithDisabled() -> method should exist', done => {
    expect(TestModel.countWithDisabled).to.not.equal(undefined);
    done();
  });

  it('countDocuments() -> method should exist', done => {
    expect(TestModel.countDocuments).to.not.equal(undefined);
    done();
  });

  it('countDocumentsDisabled() -> method should exist', done => {
    expect(TestModel.countDocumentsDisabled).to.not.equal(undefined);
    done();
  });

  it('countDocumentsWithDisabled() -> method should exist', done => {
    expect(TestModel.countDocumentsWithDisabled).to.not.equal(undefined);
    done();
  });

  it('find() -> method should exist', done => {
    expect(TestModel.find).to.not.equal(undefined);
    done();
  });

  it('findDisabled() -> method should exist', done => {
    expect(TestModel.findDisabled).to.not.equal(undefined);
    done();
  });

  it('findWithDisabled() -> method should exist', done => {
    expect(TestModel.findWithDisabled).to.not.equal(undefined);
    done();
  });

  it('findOne() -> method should exist', done => {
    expect(TestModel.findOne).to.not.equal(undefined);
    done();
  });

  it('findOneDisabled() -> method should exist', done => {
    expect(TestModel.findOneDisabled).to.equal(undefined);
    done();
  });

  it('findOneWithDisabled() -> method should exist', done => {
    expect(TestModel.findOneWithDisabled).to.equal(undefined);
    done();
  });

  it('findOneAndUpdate() -> method should exist', done => {
    expect(TestModel.findOneAndUpdate).to.not.equal(undefined);
    done();
  });

  it('findOneAndUpdateDisabled() -> method should exist', done => {
    expect(TestModel.findOneAndUpdateDisabled).to.equal(undefined);
    done();
  });

  it('findOneAndUpdateWithDisabled() -> method should exist', done => {
    expect(TestModel.findOneAndUpdateWithDisabled).to.equal(undefined);
    done();
  });

  it('update() -> method should exist', done => {
    expect(TestModel.update).to.not.equal(undefined);
    done();
  });

  it('updateDisabled() -> method should exist', done => {
    expect(TestModel.updateDisabled).to.equal(undefined);
    done();
  });

  it('updateWithDisabled() -> method should exist', done => {
    expect(TestModel.updateWithDisabled).to.equal(undefined);
    done();
  });
});

describe('disable multiple documents', () => {
  const TestSchema = new Schema(
    { name: String, side: Number },
    { collection: 'mongooseDisable_test' }
  );
  TestSchema.plugin(mongooseDisable, {
    overrideMethods: 'all',
    disabledAt: true,
    disabledBy: true
  });
  const TestModel = mongoose.model('Test14', TestSchema);

  beforeEach(done => {
    TestModel.create(
      [
        { name: 'Obi-Wan Kenobi', side: 0 },
        { name: 'Darth Vader', side: 1 },
        { name: 'Luke Skywalker', side: 0 }
      ],
      done
    );
  });

  afterEach(done => {
    mongoose.connection.db.dropCollection('mongooseDisable_test', done);
  });

  it('disable(cb) -> disable multiple documents', done => {
    TestModel.disable((err, documents) => {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(3);

      done();
    });
  });

  it('disable(query, cb) -> disable multiple documents with conditions', done => {
    TestModel.disable({ side: 0 }, (err, documents) => {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(2);

      done();
    });
  });

  it('disable(query, disabledBy, cb) -> disable multiple documents with conditions and user ID', done => {
    const userId = mongoose.Types.ObjectId('53da93b16b4a6670076b16bf');

    TestModel.disable({ side: 1 }, userId, (err, documents) => {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(1);

      done();
    });
  });

  it('disable().exec() -> disable all documents', done => {
    TestModel.disable().exec((err, documents) => {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(3);

      done();
    });
  });

  it('disable(query).exec() -> disable multiple documents with conditions', done => {
    TestModel.disable({ side: 0 }).exec((err, documents) => {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(2);

      done();
    });
  });

  it('disable(query, disabledBy).exec() -> disable multiple documents with conditions and user ID', done => {
    const userId = mongoose.Types.ObjectId('53da93b16b4a6670076b16bf');

    TestModel.disable({ side: 1 }, userId).exec((err, documents) => {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(1);

      done();
    });
  });

  it('disable({}, disabledBy).exec() -> disable all documents passing user ID', done => {
    const userId = mongoose.Types.ObjectId('53da93b16b4a6670076b16bf');

    TestModel.disable({}, userId).exec((err, documents) => {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(3);

      done();
    });
  });
});

describe('disable multiple documents (no plugin options)', () => {
  const TestSchema = new Schema(
    { name: String, side: Number },
    { collection: 'mongooseDisable_test' }
  );
  TestSchema.plugin(mongooseDisable);
  const TestModel = mongoose.model('Test13', TestSchema);

  beforeEach(done => {
    TestModel.create(
      [
        { name: 'Obi-Wan Kenobi', side: 0 },
        { name: 'Darth Vader', side: 1 },
        { name: 'Luke Skywalker', side: 0 }
      ],
      done
    );
  });

  afterEach(done => {
    mongoose.connection.db.dropCollection('mongooseDisable_test', done);
  });

  it('disable(cb) -> disable multiple documents', done => {
    TestModel.disable((err, documents) => {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(3);

      done();
    });
  });
});

describe('restore multiple documents', () => {
  const TestSchema = new Schema(
    { name: String, side: Number },
    { collection: 'mongoose_restore_test' }
  );
  TestSchema.plugin(mongooseDisable, {
    overrideMethods: 'all',
    disabledAt: true,
    disabledBy: true
  });
  const TestModel = mongoose.model('Test15', TestSchema);

  beforeEach(done => {
    TestModel.create(
      [
        { name: 'Obi-Wan Kenobi', side: 0 },
        { name: 'Darth Vader', side: 1, disabled: true },
        { name: 'Luke Skywalker', side: 0 }
      ],
      done
    );
  });

  afterEach(done => {
    mongoose.connection.db.dropCollection('mongoose_restore_test', done);
  });

  it('restore(cb) -> restore all documents', done => {
    TestModel.enable((err, documents) => {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(3);

      done();
    });
  });

  it('restore(query, cb) -> restore multiple documents with conditions', done => {
    TestModel.enable({ side: 0 }, (err, documents) => {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(2);

      done();
    });
  });

  it('restore().exec() -> restore all documents', done => {
    TestModel.enable().exec((err, documents) => {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(3);

      done();
    });
  });

  it('restore(query).exec() -> restore multiple documents with conditions', done => {
    TestModel.enable({ side: 0 }).exec((err, documents) => {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(2);

      done();
    });
  });
});

describe('restore multiple documents (no plugin options)', () => {
  const TestSchema = new Schema(
    { name: String, side: Number },
    { collection: 'mongoose_restore_test' }
  );
  TestSchema.plugin(mongooseDisable);
  const TestModel = mongoose.model('Test16', TestSchema);

  beforeEach(done => {
    TestModel.create(
      [
        { name: 'Obi-Wan Kenobi', side: 0 },
        { name: 'Darth Vader', side: 1, disabled: true },
        { name: 'Luke Skywalker', side: 0 }
      ],
      done
    );
  });

  afterEach(done => {
    mongoose.connection.db.dropCollection('mongoose_restore_test', done);
  });

  it('restore(cb) -> restore all documents', done => {
    TestModel.enable((err, documents) => {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(3);

      done();
    });
  });
});

describe('model validation on disable (default): { validateBeforeDisable: true }', () => {
  const TestSchema = new Schema(
    {
      name: { type: String, required: true }
    },
    { collection: 'mongoose_restore_test' }
  );
  TestSchema.plugin(mongooseDisable);
  const TestModel = mongoose.model('Test17', TestSchema);

  beforeEach(done => {
    TestModel.create([{ name: 'Luke Skywalker' }], done);
  });

  afterEach(done => {
    mongoose.connection.db.dropCollection('mongoose_restore_test', done);
  });

  it('disable() -> should raise ValidationError error', done => {
    TestModel.findOne({ name: 'Luke Skywalker' }, (error, luke) => {
      should.not.exist(error);
      luke.name = '';

      luke.disable(err => {
        expect(err).to.not.equal(undefined);
        expect(err.name).to.not.equal(undefined);
        err.name.should.equal('ValidationError');
        done();
      });
    });
  });

  it('disable() -> should not raise ValidationError error', done => {
    TestModel.findOne({ name: 'Luke Skywalker' }, (error, luke) => {
      should.not.exist(error);
      luke.name = 'Test Name';

      luke.disable(err => {
        should.not.exist(err);
        done();
      });
    });
  });
});

describe('model validation on disable: { validateBeforeDisable: false }', () => {
  const TestSchema = new Schema(
    {
      name: { type: String, required: true }
    },
    { collection: 'mongoose_restore_test' }
  );
  TestSchema.plugin(mongooseDisable, { validateBeforeDisable: false });
  const TestModel = mongoose.model('Test18', TestSchema);

  beforeEach(done => {
    TestModel.create([{ name: 'Luke Skywalker' }], done);
  });

  afterEach(done => {
    mongoose.connection.db.dropCollection('mongoose_restore_test', done);
  });

  it('disable() -> should not raise ValidationError error', done => {
    TestModel.findOne({ name: 'Luke Skywalker' }, (error, luke) => {
      should.not.exist(error);
      luke.name = '';

      luke.disable(err => {
        should.not.exist(err);
        done();
      });
    });
  });

  it('disable() -> should not raise ValidationError error', done => {
    TestModel.findOne({ name: 'Luke Skywalker' }, (error, luke) => {
      should.not.exist(error);
      luke.name = 'Test Name';

      luke.disable(err => {
        should.not.exist(err);
        done();
      });
    });
  });
});

describe('mongooseDisable indexFields options', () => {
  it('all fields must have index: { indexFields: true }', done => {
    const TestSchema = new Schema(
      { name: String },
      { collection: 'mongooseDisable_test_indexFields' }
    );
    TestSchema.plugin(mongooseDisable, {
      indexFields: true,
      disabledAt: true,
      disabledBy: true
    });
    const Test0 = mongoose.model('Test0_indexFields', TestSchema);

    expect(Test0.schema.paths.disabled._index).to.equal(true);
    expect(Test0.schema.paths.disabledAt._index).to.equal(true);
    expect(Test0.schema.paths.disabledBy._index).to.equal(true);
    done();
  });

  it("all fields must have index: { indexFields: 'all' }", done => {
    const TestSchema = new Schema(
      { name: String },
      { collection: 'mongooseDisable_test_indexFields' }
    );
    TestSchema.plugin(mongooseDisable, {
      indexFields: 'all',
      disabledAt: true,
      disabledBy: true
    });
    const Test0 = mongoose.model('Test1_indexFields', TestSchema);

    expect(Test0.schema.paths.disabled._index).to.equal(true);
    expect(Test0.schema.paths.disabledAt._index).to.equal(true);
    expect(Test0.schema.paths.disabledBy._index).to.equal(true);
    done();
  });

  it("only 'disabled' field must have index: { indexFields: ['disabled'] }", done => {
    const TestSchema = new Schema(
      { name: String },
      { collection: 'mongooseDisable_test_indexFields' }
    );
    TestSchema.plugin(mongooseDisable, {
      indexFields: ['disabled'],
      disabledAt: true,
      disabledBy: true
    });
    const Test0 = mongoose.model('Test2_indexFields', TestSchema);

    expect(Test0.schema.paths.disabled._index).to.equal(true);
    done();
  });

  it("only 'disabledAt' and 'disabledBy' fields must have index: { indexFields: ['disabledAt', 'disabledBy'] }", done => {
    const TestSchema = new Schema(
      { name: String },
      { collection: 'mongooseDisable_test_indexFields' }
    );
    TestSchema.plugin(mongooseDisable, {
      indexFields: ['disabledAt', 'disabledBy'],
      disabledAt: true,
      disabledBy: true
    });
    const Test0 = mongoose.model('Test3_indexFields', TestSchema);

    expect(Test0.schema.paths.disabled._index).to.equal(false);
    expect(Test0.schema.paths.disabledAt._index).to.equal(true);
    expect(Test0.schema.paths.disabledBy._index).to.equal(true);
    done();
  });
});

describe('check usage of $ne operator', () => {
  const TestRawSchema = new Schema(
    { name: String, disabled: Boolean },
    { collection: 'mongooseDisable_test_ne' }
  );
  const TestRawModel = mongoose.model('TestNeRaw', TestRawSchema);

  const TestSchema = new Schema({ name: String }, { collection: 'mongooseDisable_test_ne' });
  TestSchema.plugin(mongooseDisable, {
    overrideMethods: 'all',
    use$neOperator: false
  });
  const TestModel = mongoose.model('Test55', TestSchema);

  before(done => {
    TestRawModel.create(
      [{ name: 'One' }, { name: 'Two', disabled: true }, { name: 'Three', disabled: false }],
      done
    );
  });

  after(done => {
    mongoose.connection.db.dropCollection('mongooseDisable_test_ne', done);
  });

  it('count() -> should return 1 documents', done => {
    TestModel.count((err, count) => {
      should.not.exist(err);

      count.should.equal(1);
      done();
    });
  });

  it('countDisabled() -> should return 1 disabled documents', done => {
    TestModel.countDisabled((err, count) => {
      should.not.exist(err);

      count.should.equal(1);
      done();
    });
  });

  it('find() -> should return 1 documents', done => {
    TestModel.find((err, documents) => {
      should.not.exist(err);

      documents.length.should.equal(1);
      done();
    });
  });

  it('findDisabled() -> should return 1 documents', done => {
    TestModel.findDisabled((err, documents) => {
      should.not.exist(err);

      documents.length.should.equal(1);
      done();
    });
  });
});
