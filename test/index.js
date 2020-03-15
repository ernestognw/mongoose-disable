var should = require("chai").should(),
  expect = require("chai").expect,
  mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var mongooseDisable = require("../");

before(function(done) {
  mongoose.connect(
    process.env.MONGOOSE_TEST_URI || "mongodb://localhost/test",
    { useNewUrlParser: true }
  );
  if (+mongoose.version[0] >= 5) {
    mongoose.set("useCreateIndex", true);
    mongoose.set("useFindAndModify", false);
  }
  done();
});

after(function(done) {
  mongoose.disconnect();
  done();
});

describe("mongooseDisable disable method without callback function", function() {
  var Test1Schema = new Schema(
    { name: String },
    { collection: "mongooseDisable_test0" }
  );
  Test1Schema.plugin(mongooseDisable);
  var Test0 = mongoose.model("Test0", Test1Schema);

  before(function(done) {
    var puffy = new Test0({ name: "Puffy" });

    puffy.save(function() {
      done();
    });
  });

  after(function(done) {
    mongoose.connection.db.dropCollection("mongooseDisable_test0", function() {
      done();
    });
  });

  it("disable() -> should return a thenable (Promise)", function(done) {
    Test0.findOne({ name: "Puffy" }, function(err, puffy) {
      should.not.exist(err);

      expect(puffy.disable()).to.have.property("then");
      done();
    });
  });
});

describe("mongooseDisable plugin without options", function() {
  var Test1Schema = new Schema(
    { name: String },
    { collection: "mongooseDisable_test1" }
  );
  Test1Schema.plugin(mongooseDisable);
  var Test1 = mongoose.model("Test1", Test1Schema);
  var puffy1 = new Test1({ name: "Puffy1" });
  var puffy2 = new Test1({ name: "Puffy2" });

  before(function(done) {
    puffy1.save(function() {
      puffy2.save(function() {
        done();
      });
    });
  });

  after(function(done) {
    mongoose.connection.db.dropCollection("mongooseDisable_test1", function() {
      done();
    });
  });

  it("disable() -> should set disabled:true", function(done) {
    Test1.findOne({ name: "Puffy1" }, function(err, puffy) {
      should.not.exist(err);

      puffy.disable(function(err, success) {
        if (err) {
          throw err;
        }
        success.disabled.should.equal(true);
        done();
      });
    });
  });

  it("disable() -> should not save 'disabledAt' value", function(done) {
    Test1.findOne({ name: "Puffy1" }, function(err, puffy) {
      should.not.exist(err);

      puffy.disable(function(err, success) {
        if (err) {
          throw err;
        }
        should.not.exist(success.disabledAt);
        done();
      });
    });
  });

  it("disableById() -> should set disabled:true and not save 'disabledAt'", function(done) {
    Test1.disableById(puffy2._id, function(err, documents) {
      should.not.exist(err);
      documents.ok.should.equal(1);
      documents.n.should.equal(1);

      Test1.findOne({ name: "Puffy2" }, function(err, doc) {
        should.not.exist(err);
        doc.disabled.should.equal(true);
        should.not.exist(doc.disabledAt);
        done();
      });
    });
  });

  it("disableById() -> should throws exception: first argument error", function(done) {
    var errMessage = "First argument is mandatory and must not be a function.";
    expect(Test1.disableById).to.throw(errMessage);
    expect(() => {
      Test1.disableById(() => {});
    }).to.throw(errMessage);
    done();
  });

  it("restore() -> should set disabled:false", function(done) {
    Test1.findOne({ name: "Puffy1" }, function(err, puffy) {
      should.not.exist(err);

      puffy.enable(function(err, success) {
        if (err) {
          throw err;
        }
        success.disabled.should.equal(false);
        done();
      });
    });
  });
});

describe("mongooseDisable plugin without options, using option: typeKey", function() {
  var Test1Schema = new Schema(
    { name: String },
    { collection: "mongooseDisable_test1", typeKey: "$type" }
  );
  Test1Schema.plugin(mongooseDisable);
  var Test1 = mongoose.model("Test1a", Test1Schema);
  var puffy1 = new Test1({ name: "Puffy1" });
  var puffy2 = new Test1({ name: "Puffy2" });

  before(function(done) {
    puffy1.save(function() {
      puffy2.save(function() {
        done();
      });
    });
  });

  after(function(done) {
    mongoose.connection.db.dropCollection("mongooseDisable_test1", function() {
      done();
    });
  });

  it("disable() -> should set disabled:true", function(done) {
    Test1.findOne({ name: "Puffy1" }, function(err, puffy) {
      should.not.exist(err);

      puffy.disable(function(err, success) {
        if (err) {
          throw err;
        }
        success.disabled.should.equal(true);
        done();
      });
    });
  });

  it("disable() -> should not save 'disabledAt' value", function(done) {
    Test1.findOne({ name: "Puffy1" }, function(err, puffy) {
      should.not.exist(err);

      puffy.disable(function(err, success) {
        if (err) {
          throw err;
        }
        should.not.exist(success.disabledAt);
        done();
      });
    });
  });

  it("disableById() -> should set disabled:true and not save 'disabledAt'", function(done) {
    Test1.disableById(puffy2._id, function(err, documents) {
      should.not.exist(err);
      documents.ok.should.equal(1);
      documents.n.should.equal(1);

      Test1.findOne({ name: "Puffy2" }, function(err, doc) {
        should.not.exist(err);
        doc.disabled.should.equal(true);
        should.not.exist(doc.disabledAt);
        done();
      });
    });
  });

  it("restore() -> should set disabled:false", function(done) {
    Test1.findOne({ name: "Puffy1" }, function(err, puffy) {
      should.not.exist(err);

      puffy.enable(function(err, success) {
        if (err) {
          throw err;
        }
        success.disabled.should.equal(false);
        done();
      });
    });
  });
});

describe("mongooseDisable with options: { disabledAt : true }", function() {
  var Test2Schema = new Schema(
    { name: String },
    { collection: "mongooseDisable_test2" }
  );
  Test2Schema.plugin(mongooseDisable, { disabledAt: true });
  var Test2 = mongoose.model("Test2", Test2Schema);
  var puffy1 = new Test2({ name: "Puffy1" });
  var puffy2 = new Test2({ name: "Puffy2" });

  before(function(done) {
    puffy1.save(function() {
      puffy2.save(function() {
        done();
      });
    });
  });

  after(function(done) {
    mongoose.connection.db.dropCollection("mongooseDisable_test2", function() {
      done();
    });
  });

  it("disable() -> should save 'disabledAt' key", function(done) {
    Test2.findOne({ name: "Puffy1" }, function(err, puffy) {
      should.not.exist(err);

      puffy.disable(function(err, success) {
        if (err) {
          throw err;
        }
        should.exist(success.disabledAt);
        done();
      });
    });
  });

  it("disableById() -> should save 'disabledAt' key", function(done) {
    Test2.disableById(puffy2._id, function(err, documents) {
      should.not.exist(err);
      documents.ok.should.equal(1);
      documents.n.should.equal(1);

      Test2.findOne({ name: "Puffy2" }, function(err, doc) {
        should.not.exist(err);
        doc.disabled.should.equal(true);
        should.exist(doc.disabledAt);
        done();
      });
    });
  });

  it("restore() -> should set disabled:false and disable disabledAt key", function(done) {
    Test2.findOne({ name: "Puffy1" }, function(err, puffy) {
      should.not.exist(err);

      puffy.enable(function(err, success) {
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

describe("mongooseDisable with options: { disabledAt : true }, using option: typeKey", function() {
  var Test2Schema = new Schema(
    { name: String },
    { collection: "mongooseDisable_test2", typeKey: "$type" }
  );
  Test2Schema.plugin(mongooseDisable, { disabledAt: true });
  var Test2 = mongoose.model("Test2a", Test2Schema);
  var puffy1 = new Test2({ name: "Puffy1" });
  var puffy2 = new Test2({ name: "Puffy2" });

  before(function(done) {
    puffy1.save(function() {
      puffy2.save(function() {
        done();
      });
    });
  });

  after(function(done) {
    mongoose.connection.db.dropCollection("mongooseDisable_test2", function() {
      done();
    });
  });

  it("disable() -> should save 'disabledAt' key", function(done) {
    Test2.findOne({ name: "Puffy1" }, function(err, puffy) {
      should.not.exist(err);

      puffy.disable(function(err, success) {
        if (err) {
          throw err;
        }
        should.exist(success.disabledAt);
        done();
      });
    });
  });

  it("disableById() -> should save 'disabledAt' key", function(done) {
    Test2.disableById(puffy2._id, function(err, documents) {
      should.not.exist(err);
      documents.ok.should.equal(1);
      documents.n.should.equal(1);

      Test2.findOne({ name: "Puffy2" }, function(err, doc) {
        should.not.exist(err);
        doc.disabled.should.equal(true);
        should.exist(doc.disabledAt);
        done();
      });
    });
  });

  it("restore() -> should set disabled:false and disable disabledAt key", function(done) {
    Test2.findOne({ name: "Puffy1" }, function(err, puffy) {
      should.not.exist(err);

      puffy.enable(function(err, success) {
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

describe("mongooseDisable with options: { disabledBy : true }", function() {
  var Test3Schema = new Schema(
    { name: String },
    { collection: "mongooseDisable_test3" }
  );
  Test3Schema.plugin(mongooseDisable, { disabledBy: true });
  var Test3 = mongoose.model("Test3", Test3Schema);
  var puffy1 = new Test3({ name: "Puffy1" });
  var puffy2 = new Test3({ name: "Puffy2" });

  before(function(done) {
    puffy1.save(function() {
      puffy2.save(function() {
        done();
      });
    });
  });

  after(function(done) {
    mongoose.connection.db.dropCollection("mongooseDisable_test3", function() {
      done();
    });
  });

  var id = mongoose.Types.ObjectId("53da93b16b4a6670076b16bf");

  it("disable() -> should save 'disabledBy' key", function(done) {
    Test3.findOne({ name: "Puffy1" }, function(err, puffy) {
      should.not.exist(err);

      puffy.disable(id, function(err, success) {
        should.not.exist(err);

        success.disabledBy.should.equal(id);
        done();
      });
    });
  });

  it("disableById() -> should save `disabledBy` key", function(done) {
    Test3.disableById(puffy2._id, id, function(err, documents) {
      should.not.exist(err);
      documents.ok.should.equal(1);
      documents.n.should.equal(1);

      Test3.findOne({ name: "Puffy2" }, function(err, doc) {
        should.not.exist(err);
        doc.disabled.should.equal(true);
        doc.disabledBy.toString().should.equal(id.toString());
        done();
      });
    });
  });

  it("restore() -> should set disabled:false and disable `disabledBy` key", function(done) {
    Test3.findOne({ name: "Puffy1" }, function(err, puffy) {
      should.not.exist(err);

      puffy.enable(function(err, success) {
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

describe("mongooseDisable with options: { disabledBy : true }, using option: typeKey", function() {
  var Test3Schema = new Schema(
    { name: String },
    { collection: "mongooseDisable_test3", typeKey: "$type" }
  );
  Test3Schema.plugin(mongooseDisable, { disabledBy: true });
  var Test3 = mongoose.model("Test3a", Test3Schema);
  var puffy1 = new Test3({ name: "Puffy1" });
  var puffy2 = new Test3({ name: "Puffy2" });

  before(function(done) {
    puffy1.save(function() {
      puffy2.save(function() {
        done();
      });
    });
  });

  after(function(done) {
    mongoose.connection.db.dropCollection("mongooseDisable_test3", function() {
      done();
    });
  });

  var id = mongoose.Types.ObjectId("53da93b16b4a6670076b16bf");

  it("disable() -> should save `disabledBy` key", function(done) {
    Test3.findOne({ name: "Puffy1" }, function(err, puffy) {
      should.not.exist(err);

      puffy.disable(id, function(err, success) {
        should.not.exist(err);

        success.disabledBy.should.equal(id);
        done();
      });
    });
  });

  it("disableById() -> should save disabledBy key", function(done) {
    Test3.disableById(puffy2._id, id, function(err, documents) {
      should.not.exist(err);
      documents.ok.should.equal(1);
      documents.n.should.equal(1);

      Test3.findOne({ name: "Puffy2" }, function(err, doc) {
        should.not.exist(err);
        doc.disabled.should.equal(true);
        doc.disabledBy.toString().should.equal(id.toString());
        done();
      });
    });
  });

  it("restore() -> should set disabled:false and disable disabledBy key", function(done) {
    Test3.findOne({ name: "Puffy1" }, function(err, puffy) {
      should.not.exist(err);

      puffy.enable(function(err, success) {
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

describe("mongooseDisable with options: { disabledBy : true, disabledByType: String }", function() {
  var TestSchema = new Schema(
    { name: String },
    { collection: "mongooseDisable_test" }
  );
  TestSchema.plugin(mongooseDisable, {
    disabledBy: true,
    disabledByType: String
  });
  var Test = mongoose.model("TestdisabledByType", TestSchema);
  var puffy1 = new Test({ name: "Puffy1" });
  var puffy2 = new Test({ name: "Puffy2" });

  before(function(done) {
    puffy1.save(function() {
      puffy2.save(function() {
        done();
      });
    });
  });

  after(function(done) {
    mongoose.connection.db.dropCollection("mongooseDisable_test", function() {
      done();
    });
  });

  var id = "custom_user_id_12345678";

  it("disable() -> should save disabledBy key", function(done) {
    Test.findOne({ name: "Puffy1" }, function(err, puffy) {
      should.not.exist(err);

      puffy.disable(id, function(err, success) {
        should.not.exist(err);

        success.disabledBy.should.equal(id);
        done();
      });
    });
  });

  it("disableById() -> should save disabledBy key", function(done) {
    Test.disableById(puffy2._id, id, function(err, documents) {
      should.not.exist(err);
      documents.ok.should.equal(1);
      documents.n.should.equal(1);

      Test.findOne({ name: "Puffy2" }, function(err, doc) {
        should.not.exist(err);
        doc.disabled.should.equal(true);
        doc.disabledBy.should.equal(id);
        done();
      });
    });
  });

  it("restore() -> should set disabled:false and disable disabledBy key", function(done) {
    Test.findOne({ name: "Puffy1" }, function(err, puffy) {
      should.not.exist(err);

      puffy.enable(function(err, success) {
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

describe("check not overridden static methods", function() {
  var TestSchema = new Schema(
    { name: String },
    { collection: "mongooseDisable_test" }
  );
  TestSchema.plugin(mongooseDisable);
  var TestModel = mongoose.model("Test4", TestSchema);

  beforeEach(function(done) {
    TestModel.create(
      [
        { name: "Obi-Wan Kenobi", disabled: true },
        { name: "Darth Vader" },
        { name: "Luke Skywalker" }
      ],
      done
    );
  });

  afterEach(function(done) {
    mongoose.connection.db.dropCollection("mongooseDisable_test", done);
  });

  it("count() -> should return 3 documents", function(done) {
    TestModel.count(function(err, count) {
      should.not.exist(err);

      count.should.equal(3);
      done();
    });
  });

  it("countDocuments() -> should return 3 documents", function(done) {
    // INFO: countDocuments is added in mongoose 5.x
    if (typeof TestModel.countDocuments === "function") {
      TestModel.countDocuments(function(err, count) {
        should.not.exist(err);

        count.should.equal(3);
        done();
      });
    } else {
      done();
    }
  });

  it("find() -> should return 3 documents", function(done) {
    TestModel.find(function(err, documents) {
      should.not.exist(err);

      documents.length.should.equal(3);
      done();
    });
  });

  it("findOne() -> should return 1 disabled document", function(done) {
    TestModel.findOne({ name: "Obi-Wan Kenobi" }, function(err, doc) {
      should.not.exist(err);

      expect(doc).not.to.be.null;
      doc.disabled.should.equal(true);
      done();
    });
  });

  it("findOneAndUpdate() -> should find and update disabled document", function(done) {
    TestModel.findOneAndUpdate(
      { name: "Obi-Wan Kenobi" },
      { name: "Obi-Wan Kenobi Test" },
      { new: true },
      function(err, doc) {
        should.not.exist(err);

        expect(doc).not.to.be.null;
        doc.name.should.equal("Obi-Wan Kenobi Test");
        done();
      }
    );
  });

  it("update() -> should update disabled document", function(done) {
    TestModel.update(
      { name: "Obi-Wan Kenobi" },
      { name: "Obi-Wan Kenobi Test" },
      function(err, doc) {
        should.not.exist(err);

        doc.ok.should.equal(1);
        doc.n.should.equal(1);
        done();
      }
    );
  });

  it("updateMany() -> should update disabled document", function(done) {
    TestModel.updateMany(
      { name: "Obi-Wan Kenobi" },
      { name: "Obi-Wan Kenobi Test" },
      function(err, doc) {
        should.not.exist(err);

        doc.ok.should.equal(1);
        doc.n.should.equal(1);
        done();
      }
    );
  });
});

describe("check overridden static methods: { overrideMethods: 'all' }", function() {
  var TestSchema = new Schema(
    { name: String },
    { collection: "mongooseDisable_test" }
  );
  TestSchema.plugin(mongooseDisable, { overrideMethods: "all" });
  var TestModel = mongoose.model("Test5", TestSchema);

  beforeEach(function(done) {
    TestModel.create(
      [
        { name: "Obi-Wan Kenobi", disabled: true },
        { name: "Darth Vader" },
        { name: "Luke Skywalker", disabled: true }
      ],
      done
    );
  });

  afterEach(function(done) {
    mongoose.connection.db.dropCollection("mongooseDisable_test", done);
  });

  it("count() -> should return 1 documents", function(done) {
    TestModel.count(function(err, count) {
      should.not.exist(err);

      count.should.equal(1);
      done();
    });
  });

  it("countDocuments() -> should return 1 documents", function(done) {
    TestModel.countDocuments(function(err, count) {
      should.not.exist(err);

      count.should.equal(1);
      done();
    });
  });

  it("countDisabled() -> should return 2 disabled documents", function(done) {
    TestModel.countDisabled(function(err, count) {
      should.not.exist(err);

      count.should.equal(2);
      done();
    });
  });

  it("countDocumentsDisabled() -> should return 2 disabled documents", function(done) {
    TestModel.countDocumentsDisabled(function(err, count) {
      should.not.exist(err);

      count.should.equal(2);
      done();
    });
  });

  it("countWithDisabled() -> should return 3 documents", function(done) {
    TestModel.countWithDisabled(function(err, count) {
      should.not.exist(err);

      count.should.equal(3);
      done();
    });
  });

  it("countDocumentsWithDisabled() -> should return 3 documents", function(done) {
    TestModel.countDocumentsWithDisabled(function(err, count) {
      should.not.exist(err);

      count.should.equal(3);
      done();
    });
  });

  it("find() -> should return 1 documents", function(done) {
    TestModel.find(function(err, documents) {
      should.not.exist(err);

      documents.length.should.equal(1);
      done();
    });
  });

  it("findDisabled() -> should return 2 documents", function(done) {
    TestModel.findDisabled(function(err, documents) {
      should.not.exist(err);

      documents.length.should.equal(2);
      done();
    });
  });

  it("findWithDisabled() -> should return 3 documents", function(done) {
    TestModel.findWithDisabled(function(err, documents) {
      should.not.exist(err);

      documents.length.should.equal(3);
      done();
    });
  });

  it("findOne() -> should not return 1 disabled document", function(done) {
    TestModel.findOne({ name: "Obi-Wan Kenobi" }, function(err, doc) {
      should.not.exist(err);

      expect(doc).to.be.null;
      done();
    });
  });

  it("findOneDisabled() -> should return 1 disabled document", function(done) {
    TestModel.findOneDisabled({ name: "Obi-Wan Kenobi" }, function(err, doc) {
      should.not.exist(err);

      expect(doc).not.to.be.null;
      done();
    });
  });

  it("findOneWithDisabled() -> should return 1 disabled document", function(done) {
    TestModel.findOneWithDisabled({ name: "Obi-Wan Kenobi" }, function(
      err,
      doc
    ) {
      should.not.exist(err);

      expect(doc).not.to.be.null;
      done();
    });
  });

  it("findOneWithDisabled() -> should return 1 not disabled document", function(done) {
    TestModel.findOneWithDisabled({ name: "Darth Vader" }, function(err, doc) {
      should.not.exist(err);

      expect(doc).not.to.be.null;
      done();
    });
  });

  it("findOneAndUpdate() -> should not find and update disabled document", function(done) {
    TestModel.findOneAndUpdate(
      { name: "Obi-Wan Kenobi" },
      { name: "Obi-Wan Kenobi Test" },
      { new: true },
      function(err, doc) {
        should.not.exist(err);

        expect(doc).to.be.null;
        done();
      }
    );
  });

  it("findOneAndUpdateDisabled() -> should find and update disabled document", function(done) {
    TestModel.findOneAndUpdateDisabled(
      { name: "Obi-Wan Kenobi" },
      { name: "Obi-Wan Kenobi Test" },
      { new: true },
      function(err, doc) {
        should.not.exist(err);

        expect(doc).not.to.be.null;
        done();
      }
    );
  });

  it("findOneAndUpdateWithDisabled() -> should find and update disabled document", function(done) {
    TestModel.findOneAndUpdateWithDisabled(
      { name: "Obi-Wan Kenobi" },
      { name: "Obi-Wan Kenobi Test" },
      { new: true },
      function(err, doc) {
        should.not.exist(err);

        expect(doc).not.to.be.null;
        done();
      }
    );
  });

  it("findOneAndUpdateWithDisabled() -> should find and update not disabled document", function(done) {
    TestModel.findOneAndUpdateWithDisabled(
      { name: "Darth Vader" },
      { name: "Darth Vader Test" },
      { new: true },
      function(err, doc) {
        should.not.exist(err);

        expect(doc).not.to.be.null;
        done();
      }
    );
  });

  it("update(conditions, update, options, callback) -> should not update disabled documents", function(done) {
    TestModel.update(
      {},
      { name: "Luke Skywalker Test" },
      { multi: true },
      function(err, doc) {
        should.not.exist(err);

        doc.ok.should.equal(1);
        doc.n.should.equal(1);
        done();
      }
    );
  });

  it("updateMany(conditions, update, options, callback) -> should not update disabled documents", function(done) {
    TestModel.updateMany(
      {},
      { name: "Luke Skywalker Test" },
      { multi: true },
      function(err, doc) {
        should.not.exist(err);

        doc.ok.should.equal(1);
        doc.n.should.equal(1);
        done();
      }
    );
  });

  it("update(conditions, update, options) -> should not update disabled documents", function(done) {
    TestModel.update({}, { name: "Luke Skywalker Test" }, { multi: true }).exec(
      function(err, doc) {
        should.not.exist(err);

        doc.ok.should.equal(1);
        doc.n.should.equal(1);
        done();
      }
    );
  });

  it("updateMany(conditions, update, options) -> should not update disabled documents", function(done) {
    TestModel.updateMany(
      {},
      { name: "Luke Skywalker Test" },
      { multi: true }
    ).exec(function(err, doc) {
      should.not.exist(err);

      doc.ok.should.equal(1);
      doc.n.should.equal(1);
      done();
    });
  });

  it("update(conditions, update, callback) -> should not update disabled documents", function(done) {
    TestModel.update({}, { name: "Luke Skywalker Test" }, function(err, doc) {
      should.not.exist(err);

      doc.ok.should.equal(1);
      doc.n.should.equal(1);
      done();
    });
  });

  it("updateMany(conditions, update, callback) -> should not update disabled documents", function(done) {
    TestModel.updateMany({}, { name: "Luke Skywalker Test" }, function(
      err,
      doc
    ) {
      should.not.exist(err);

      doc.ok.should.equal(1);
      doc.n.should.equal(1);
      done();
    });
  });

  it("update(conditions, update) -> should not update disabled documents", function(done) {
    TestModel.update({}, { name: "Luke Skywalker Test" }).exec(function(
      err,
      doc
    ) {
      should.not.exist(err);

      doc.ok.should.equal(1);
      doc.n.should.equal(1);
      done();
    });
  });

  it("updateMany(conditions, update) -> should not update disabled documents", function(done) {
    TestModel.updateMany({}, { name: "Luke Skywalker Test" }).exec(function(
      err,
      doc
    ) {
      should.not.exist(err);

      doc.ok.should.equal(1);
      doc.n.should.equal(1);
      done();
    });
  });

  it("updateDisabled() -> should update disabled document", function(done) {
    TestModel.updateDisabled(
      {},
      { name: "Test 123" },
      { multi: true },
      function(err, doc) {
        should.not.exist(err);

        doc.ok.should.equal(1);
        doc.n.should.equal(2);
        done();
      }
    );
  });

  it("updateManyDisabled() -> should update disabled document", function(done) {
    TestModel.updateManyDisabled(
      {},
      { name: "Test 123" },
      { multi: true },
      function(err, doc) {
        should.not.exist(err);

        doc.ok.should.equal(1);
        doc.n.should.equal(2);
        done();
      }
    );
  });

  it("updateWithDisabled() -> should update all document", function(done) {
    TestModel.updateWithDisabled(
      {},
      { name: "Test 654" },
      { multi: true },
      function(err, doc) {
        should.not.exist(err);

        doc.ok.should.equal(1);
        doc.n.should.equal(3);
        done();
      }
    );
  });

  it("updateManyWithDisabled() -> should update all document", function(done) {
    TestModel.updateManyWithDisabled(
      {},
      { name: "Test 654" },
      { multi: true },
      function(err, doc) {
        should.not.exist(err);

        doc.ok.should.equal(1);
        doc.n.should.equal(3);
        done();
      }
    );
  });
});

describe("check the existence of override static methods: { overrideMethods: true }", function() {
  var TestSchema = new Schema(
    { name: String },
    { collection: "mongooseDisable_test" }
  );
  TestSchema.plugin(mongooseDisable, { overrideMethods: true });
  var TestModel = mongoose.model("Test6", TestSchema);

  it("count() -> method should exist", function(done) {
    expect(TestModel.count).to.exist;
    done();
  });

  it("countDisabled() -> method should exist", function(done) {
    expect(TestModel.countDisabled).to.exist;
    done();
  });

  it("countWithDisabled() -> method should exist", function(done) {
    expect(TestModel.countWithDisabled).to.exist;
    done();
  });

  it("countDocuments() -> method should exist", function(done) {
    expect(TestModel.countDocuments).to.exist;
    done();
  });

  it("countDocumentsDisabled() -> method should exist", function(done) {
    expect(TestModel.countDocumentsDisabled).to.exist;
    done();
  });

  it("countDocumentsWithDisabled() -> method should exist", function(done) {
    expect(TestModel.countDocumentsWithDisabled).to.exist;
    done();
  });

  it("find() -> method should exist", function(done) {
    expect(TestModel.find).to.exist;
    done();
  });

  it("findDisabled() -> method should exist", function(done) {
    expect(TestModel.findDisabled).to.exist;
    done();
  });

  it("findWithDisabled() -> method should exist", function(done) {
    expect(TestModel.findWithDisabled).to.exist;
    done();
  });

  it("findOne() -> method should exist", function(done) {
    expect(TestModel.findOne).to.exist;
    done();
  });

  it("findOneDisabled() -> method should exist", function(done) {
    expect(TestModel.findOneDisabled).to.exist;
    done();
  });

  it("findOneWithDisabled() -> method should exist", function(done) {
    expect(TestModel.findOneWithDisabled).to.exist;
    done();
  });

  it("findOneAndUpdate() -> method should exist", function(done) {
    expect(TestModel.findOneAndUpdate).to.exist;
    done();
  });

  it("findOneAndUpdateDisabled() -> method should exist", function(done) {
    expect(TestModel.findOneAndUpdateDisabled).to.exist;
    done();
  });

  it("findOneAndUpdateWithDisabled() -> method should exist", function(done) {
    expect(TestModel.findOneAndUpdateWithDisabled).to.exist;
    done();
  });

  it("update() -> method should exist", function(done) {
    expect(TestModel.update).to.exist;
    done();
  });

  it("updateDisabled() -> method should exist", function(done) {
    expect(TestModel.updateDisabled).to.exist;
    done();
  });

  it("updateWithDisabled() -> method should exist", function(done) {
    expect(TestModel.updateWithDisabled).to.exist;
    done();
  });
});

describe("check the existence of override static methods: { overrideMethods: ['testError', 'count', 'countDocuments', 'find', 'findOne', 'findOneAndUpdate', 'update'] }", function() {
  var TestSchema = new Schema(
    { name: String },
    { collection: "mongooseDisable_test" }
  );
  TestSchema.plugin(mongooseDisable, {
    overrideMethods: [
      "testError",
      "count",
      "countDocuments",
      "find",
      "findOne",
      "findOneAndUpdate",
      "update"
    ]
  });
  var TestModel = mongoose.model("Test7", TestSchema);

  it("testError() -> method should not exist", function(done) {
    expect(TestModel.testError).to.not.exist;
    done();
  });

  it("count() -> method should exist", function(done) {
    expect(TestModel.count).to.exist;
    done();
  });

  it("countDisabled() -> method should exist", function(done) {
    expect(TestModel.countDisabled).to.exist;
    done();
  });

  it("countWithDisabled() -> method should exist", function(done) {
    expect(TestModel.countWithDisabled).to.exist;
    done();
  });

  it("countDocuments() -> method should exist", function(done) {
    expect(TestModel.countDocuments).to.exist;
    done();
  });

  it("countDocumentsDisabled() -> method should exist", function(done) {
    expect(TestModel.countDocumentsDisabled).to.exist;
    done();
  });

  it("countDocumentsWithDisabled() -> method should exist", function(done) {
    expect(TestModel.countDocumentsWithDisabled).to.exist;
    done();
  });

  it("find() -> method should exist", function(done) {
    expect(TestModel.find).to.exist;
    done();
  });

  it("findDisabled() -> method should exist", function(done) {
    expect(TestModel.findDisabled).to.exist;
    done();
  });

  it("findWithDisabled() -> method should exist", function(done) {
    expect(TestModel.findWithDisabled).to.exist;
    done();
  });

  it("findOne() -> method should exist", function(done) {
    expect(TestModel.findOne).to.exist;
    done();
  });

  it("findOneDisabled() -> method should exist", function(done) {
    expect(TestModel.findOneDisabled).to.exist;
    done();
  });

  it("findOneWithDisabled() -> method should exist", function(done) {
    expect(TestModel.findOneWithDisabled).to.exist;
    done();
  });

  it("findOneAndUpdate() -> method should exist", function(done) {
    expect(TestModel.findOneAndUpdate).to.exist;
    done();
  });

  it("findOneAndUpdateDisabled() -> method should exist", function(done) {
    expect(TestModel.findOneAndUpdateDisabled).to.exist;
    done();
  });

  it("findOneAndUpdateWithDisabled() -> method should exist", function(done) {
    expect(TestModel.findOneAndUpdateWithDisabled).to.exist;
    done();
  });

  it("update() -> method should exist", function(done) {
    expect(TestModel.update).to.exist;
    done();
  });

  it("updateDisabled() -> method should exist", function(done) {
    expect(TestModel.updateDisabled).to.exist;
    done();
  });

  it("updateWithDisabled() -> method should exist", function(done) {
    expect(TestModel.updateWithDisabled).to.exist;
    done();
  });
});

describe("check the existence of override static methods: { overrideMethods: ['count', 'find'] }", function() {
  var TestSchema = new Schema(
    { name: String },
    { collection: "mongooseDisable_test" }
  );
  TestSchema.plugin(mongooseDisable, {
    overrideMethods: ["count", "countDocuments", "find"]
  });
  var TestModel = mongoose.model("Test8", TestSchema);

  it("testError() -> method should not exist", function(done) {
    expect(TestModel.testError).to.not.exist;
    done();
  });

  it("count() -> method should exist", function(done) {
    expect(TestModel.count).to.exist;
    done();
  });

  it("countDisabled() -> method should exist", function(done) {
    expect(TestModel.countDisabled).to.exist;
    done();
  });

  it("countWithDisabled() -> method should exist", function(done) {
    expect(TestModel.countWithDisabled).to.exist;
    done();
  });

  it("countDocuments() -> method should exist", function(done) {
    expect(TestModel.countDocuments).to.exist;
    done();
  });

  it("countDocumentsDisabled() -> method should exist", function(done) {
    expect(TestModel.countDocumentsDisabled).to.exist;
    done();
  });

  it("countDocumentsWithDisabled() -> method should exist", function(done) {
    expect(TestModel.countDocumentsWithDisabled).to.exist;
    done();
  });

  it("find() -> method should exist", function(done) {
    expect(TestModel.find).to.exist;
    done();
  });

  it("findDisabled() -> method should exist", function(done) {
    expect(TestModel.findDisabled).to.exist;
    done();
  });

  it("findWithDisabled() -> method should exist", function(done) {
    expect(TestModel.findWithDisabled).to.exist;
    done();
  });

  it("findOne() -> method should exist", function(done) {
    expect(TestModel.findOne).to.exist;
    done();
  });

  it("findOneDisabled() -> method should exist", function(done) {
    expect(TestModel.findOneDisabled).to.not.exist;
    done();
  });

  it("findOneWithDisabled() -> method should exist", function(done) {
    expect(TestModel.findOneWithDisabled).to.not.exist;
    done();
  });

  it("findOneAndUpdate() -> method should exist", function(done) {
    expect(TestModel.findOneAndUpdate).to.exist;
    done();
  });

  it("findOneAndUpdateDisabled() -> method should exist", function(done) {
    expect(TestModel.findOneAndUpdateDisabled).to.not.exist;
    done();
  });

  it("findOneAndUpdateWithDisabled() -> method should exist", function(done) {
    expect(TestModel.findOneAndUpdateWithDisabled).to.not.exist;
    done();
  });

  it("update() -> method should exist", function(done) {
    expect(TestModel.update).to.exist;
    done();
  });

  it("updateDisabled() -> method should exist", function(done) {
    expect(TestModel.updateDisabled).to.not.exist;
    done();
  });

  it("updateWithDisabled() -> method should exist", function(done) {
    expect(TestModel.updateWithDisabled).to.not.exist;
    done();
  });
});

describe("disable multiple documents", function() {
  var TestSchema = new Schema(
    { name: String, side: Number },
    { collection: "mongooseDisable_test" }
  );
  TestSchema.plugin(mongooseDisable, {
    overrideMethods: "all",
    disabledAt: true,
    disabledBy: true
  });
  var TestModel = mongoose.model("Test14", TestSchema);

  beforeEach(function(done) {
    TestModel.create(
      [
        { name: "Obi-Wan Kenobi", side: 0 },
        { name: "Darth Vader", side: 1 },
        { name: "Luke Skywalker", side: 0 }
      ],
      done
    );
  });

  afterEach(function(done) {
    mongoose.connection.db.dropCollection("mongooseDisable_test", done);
  });

  it("disable(cb) -> disable multiple documents", function(done) {
    TestModel.disable(function(err, documents) {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(3);

      done();
    });
  });

  it("disable(query, cb) -> disable multiple documents with conditions", function(done) {
    TestModel.disable({ side: 0 }, function(err, documents) {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(2);

      done();
    });
  });

  it("disable(query, disabledBy, cb) -> disable multiple documents with conditions and user ID", function(done) {
    var userId = mongoose.Types.ObjectId("53da93b16b4a6670076b16bf");

    TestModel.disable({ side: 1 }, userId, function(err, documents) {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(1);

      done();
    });
  });

  it("disable().exec() -> disable all documents", function(done) {
    TestModel.disable().exec(function(err, documents) {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(3);

      done();
    });
  });

  it("disable(query).exec() -> disable multiple documents with conditions", function(done) {
    TestModel.disable({ side: 0 }).exec(function(err, documents) {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(2);

      done();
    });
  });

  it("disable(query, disabledBy).exec() -> disable multiple documents with conditions and user ID", function(done) {
    var userId = mongoose.Types.ObjectId("53da93b16b4a6670076b16bf");

    TestModel.disable({ side: 1 }, userId).exec(function(err, documents) {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(1);

      done();
    });
  });

  it("disable({}, disabledBy).exec() -> disable all documents passing user ID", function(done) {
    var userId = mongoose.Types.ObjectId("53da93b16b4a6670076b16bf");

    TestModel.disable({}, userId).exec(function(err, documents) {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(3);

      done();
    });
  });
});

describe("disable multiple documents (no plugin options)", function() {
  var TestSchema = new Schema(
    { name: String, side: Number },
    { collection: "mongooseDisable_test" }
  );
  TestSchema.plugin(mongooseDisable);
  var TestModel = mongoose.model("Test13", TestSchema);

  beforeEach(function(done) {
    TestModel.create(
      [
        { name: "Obi-Wan Kenobi", side: 0 },
        { name: "Darth Vader", side: 1 },
        { name: "Luke Skywalker", side: 0 }
      ],
      done
    );
  });

  afterEach(function(done) {
    mongoose.connection.db.dropCollection("mongooseDisable_test", done);
  });

  it("disable(cb) -> disable multiple documents", function(done) {
    TestModel.disable(function(err, documents) {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(3);

      done();
    });
  });
});

describe("restore multiple documents", function() {
  var TestSchema = new Schema(
    { name: String, side: Number },
    { collection: "mongoose_restore_test" }
  );
  TestSchema.plugin(mongooseDisable, {
    overrideMethods: "all",
    disabledAt: true,
    disabledBy: true
  });
  var TestModel = mongoose.model("Test15", TestSchema);

  beforeEach(function(done) {
    TestModel.create(
      [
        { name: "Obi-Wan Kenobi", side: 0 },
        { name: "Darth Vader", side: 1, disabled: true },
        { name: "Luke Skywalker", side: 0 }
      ],
      done
    );
  });

  afterEach(function(done) {
    mongoose.connection.db.dropCollection("mongoose_restore_test", done);
  });

  it("restore(cb) -> restore all documents", function(done) {
    TestModel.enable(function(err, documents) {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(3);

      done();
    });
  });

  it("restore(query, cb) -> restore multiple documents with conditions", function(done) {
    TestModel.enable({ side: 0 }, function(err, documents) {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(2);

      done();
    });
  });

  it("restore().exec() -> restore all documents", function(done) {
    TestModel.enable().exec(function(err, documents) {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(3);

      done();
    });
  });

  it("restore(query).exec() -> restore multiple documents with conditions", function(done) {
    TestModel.enable({ side: 0 }).exec(function(err, documents) {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(2);

      done();
    });
  });
});

describe("restore multiple documents (no plugin options)", function() {
  var TestSchema = new Schema(
    { name: String, side: Number },
    { collection: "mongoose_restore_test" }
  );
  TestSchema.plugin(mongooseDisable);
  var TestModel = mongoose.model("Test16", TestSchema);

  beforeEach(function(done) {
    TestModel.create(
      [
        { name: "Obi-Wan Kenobi", side: 0 },
        { name: "Darth Vader", side: 1, disabled: true },
        { name: "Luke Skywalker", side: 0 }
      ],
      done
    );
  });

  afterEach(function(done) {
    mongoose.connection.db.dropCollection("mongoose_restore_test", done);
  });

  it("restore(cb) -> restore all documents", function(done) {
    TestModel.enable(function(err, documents) {
      should.not.exist(err);

      documents.ok.should.equal(1);
      documents.n.should.equal(3);

      done();
    });
  });
});

describe("model validation on disable (default): { validateBeforeDisable: true }", function() {
  var TestSchema = new Schema(
    {
      name: { type: String, required: true }
    },
    { collection: "mongoose_restore_test" }
  );
  TestSchema.plugin(mongooseDisable);
  var TestModel = mongoose.model("Test17", TestSchema);

  beforeEach(function(done) {
    TestModel.create([{ name: "Luke Skywalker" }], done);
  });

  afterEach(function(done) {
    mongoose.connection.db.dropCollection("mongoose_restore_test", done);
  });

  it("disable() -> should raise ValidationError error", function(done) {
    TestModel.findOne({ name: "Luke Skywalker" }, function(err, luke) {
      should.not.exist(err);
      luke.name = "";

      luke.disable(function(err) {
        err.should.exist;
        err.name.should.exist;
        err.name.should.equal("ValidationError");
        done();
      });
    });
  });

  it("disable() -> should not raise ValidationError error", function(done) {
    TestModel.findOne({ name: "Luke Skywalker" }, function(err, luke) {
      should.not.exist(err);
      luke.name = "Test Name";

      luke.disable(function(err) {
        should.not.exist(err);
        done();
      });
    });
  });
});

describe("model validation on disable: { validateBeforeDisable: false }", function() {
  var TestSchema = new Schema(
    {
      name: { type: String, required: true }
    },
    { collection: "mongoose_restore_test" }
  );
  TestSchema.plugin(mongooseDisable, { validateBeforeDisable: false });
  var TestModel = mongoose.model("Test18", TestSchema);

  beforeEach(function(done) {
    TestModel.create([{ name: "Luke Skywalker" }], done);
  });

  afterEach(function(done) {
    mongoose.connection.db.dropCollection("mongoose_restore_test", done);
  });

  it("disable() -> should not raise ValidationError error", function(done) {
    TestModel.findOne({ name: "Luke Skywalker" }, function(err, luke) {
      should.not.exist(err);
      luke.name = "";

      luke.disable(function(err) {
        should.not.exist(err);
        done();
      });
    });
  });

  it("disable() -> should not raise ValidationError error", function(done) {
    TestModel.findOne({ name: "Luke Skywalker" }, function(err, luke) {
      should.not.exist(err);
      luke.name = "Test Name";

      luke.disable(function(err) {
        should.not.exist(err);
        done();
      });
    });
  });
});

describe("mongooseDisable indexFields options", function() {
  it("all fields must have index: { indexFields: true }", function(done) {
    var TestSchema = new Schema(
      { name: String },
      { collection: "mongooseDisable_test_indexFields" }
    );
    TestSchema.plugin(mongooseDisable, {
      indexFields: true,
      disabledAt: true,
      disabledBy: true
    });
    var Test0 = mongoose.model("Test0_indexFields", TestSchema);

    expect(Test0.schema.paths.disabled._index).to.be.true;
    expect(Test0.schema.paths.disabledAt._index).to.be.true;
    expect(Test0.schema.paths.disabledBy._index).to.be.true;
    done();
  });

  it("all fields must have index: { indexFields: 'all' }", function(done) {
    var TestSchema = new Schema(
      { name: String },
      { collection: "mongooseDisable_test_indexFields" }
    );
    TestSchema.plugin(mongooseDisable, {
      indexFields: "all",
      disabledAt: true,
      disabledBy: true
    });
    var Test0 = mongoose.model("Test1_indexFields", TestSchema);

    expect(Test0.schema.paths.disabled._index).to.be.true;
    expect(Test0.schema.paths.disabledAt._index).to.be.true;
    expect(Test0.schema.paths.disabledBy._index).to.be.true;
    done();
  });

  it("only 'disabled' field must have index: { indexFields: ['disabled'] }", function(done) {
    var TestSchema = new Schema(
      { name: String },
      { collection: "mongooseDisable_test_indexFields" }
    );
    TestSchema.plugin(mongooseDisable, {
      indexFields: ["disabled"],
      disabledAt: true,
      disabledBy: true
    });
    var Test0 = mongoose.model("Test2_indexFields", TestSchema);

    expect(Test0.schema.paths.disabled._index).to.be.true;
    done();
  });

  it("only 'disabledAt' and 'disabledBy' fields must have index: { indexFields: ['disabledAt', 'disabledBy'] }", function(done) {
    var TestSchema = new Schema(
      { name: String },
      { collection: "mongooseDisable_test_indexFields" }
    );
    TestSchema.plugin(mongooseDisable, {
      indexFields: ["disabledAt", "disabledBy"],
      disabledAt: true,
      disabledBy: true
    });
    var Test0 = mongoose.model("Test3_indexFields", TestSchema);

    expect(Test0.schema.paths.disabled._index).to.be.false;
    expect(Test0.schema.paths.disabledAt._index).to.be.true;
    expect(Test0.schema.paths.disabledBy._index).to.be.true;
    done();
  });
});

describe("check usage of $ne operator", function() {
  var TestRawSchema = new Schema(
    { name: String, disabled: Boolean },
    { collection: "mongooseDisable_test_ne" }
  );
  var TestRawModel = mongoose.model("TestNeRaw", TestRawSchema);

  var TestSchema = new Schema(
    { name: String },
    { collection: "mongooseDisable_test_ne" }
  );
  TestSchema.plugin(mongooseDisable, {
    overrideMethods: "all",
    use$neOperator: false
  });
  var TestModel = mongoose.model("Test55", TestSchema);

  before(function(done) {
    TestRawModel.create(
      [
        { name: "One" },
        { name: "Two", disabled: true },
        { name: "Three", disabled: false }
      ],
      done
    );
  });

  after(function(done) {
    mongoose.connection.db.dropCollection("mongooseDisable_test_ne", done);
  });

  it("count() -> should return 1 documents", function(done) {
    TestModel.count(function(err, count) {
      should.not.exist(err);

      count.should.equal(1);
      done();
    });
  });

  it("countDisabled() -> should return 1 disabled documents", function(done) {
    TestModel.countDisabled(function(err, count) {
      should.not.exist(err);

      count.should.equal(1);
      done();
    });
  });

  it("find() -> should return 1 documents", function(done) {
    TestModel.find(function(err, documents) {
      should.not.exist(err);

      documents.length.should.equal(1);
      done();
    });
  });

  it("findDisabled() -> should return 1 documents", function(done) {
    TestModel.findDisabled(function(err, documents) {
      should.not.exist(err);

      documents.length.should.equal(1);
      done();
    });
  });
});
