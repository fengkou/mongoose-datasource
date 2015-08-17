
"use strict";

(function (module) {

  /**
   *
   * @param ds
   * @returns {{getDb: Function, getDs: Function}}
   */
  function dataSource(ds, mongoose) {
    var dataSources = Object.keys(ds);
    if (!dataSources.length) {
      return {
        getDb: function () {
          throw new Error('datasource is not defined');
        },
        getDs: function () {
          throw new Error('datasource is not defined');
        }
      };
    }

    /**
     *
     * @param str
     * @returns {string}
     */
    var upFirst = function (str) {
      return str.substr(0, 1).toUpperCase() + str.substring(1);
    };

    /**
     * mongoose connection
     * @param conf
     */
    var conn = function (conf) {
      var conns = {};
      this.id = Date.now();
      var connection = null;
      var _this = this;
      var create = function () {
        connection = mongoose.createConnection(_this.url, _this.options);
      };
      this.url = conf.url;
      this.sid = conf.sid;
      this.options = conf.options;
      this.dbs = [];
      this.defaultDb = null;
      for (var i in conf.dbs) {
        var _db = conf.dbs[i];
        if (_db.default) {
          this.defaultDb = _db.name;
        }
        this.dbs.push(_db.name);
      }

      this.use = function (db_name) {
        if (!db_name) {
          db_name = this.defaultDb;
        }
        if (conns[db_name]) {
          return conns[db_name];
        } else {
          if (!connection) {
            create();
          }
          var _conn = connection.useDb(db_name);
          conns[db_name] = _conn;
          return _conn;
        }
      };

      for (var i in this.dbs) {
        (function (_this, _ds) {
          _this['get' + upFirst(_ds)] = _this['use' + upFirst(_ds)] = function () {
            return _this.use(_ds);
          };
        })(this, this.dbs[i]);
      }
    };

    /**
     * datasource instance
     */
    var Instance = new (function (ds) {
      var instance = {};
      var defaultDs = null;
      var _this = this;
      dataSources.forEach(function (_ds) {
        var conf = ds[_ds];
        if (conf.default) {
          defaultDs = _ds;
        }
        _this['get' + upFirst(_ds)] = _this['use' + upFirst(_ds)] = function () {
          return this.get(_ds);
        };
      });
      if (!defaultDs) {
        defaultDs = dataSources[0];
      }
      this.get = function (dsName) {
        if (!dsName) {
          dsName = defaultDs;
        }
        if (instance[dsName]) {
          return instance[dsName];
        }
        var conf = ds[dsName];
        var ins = new conn(conf);
        instance[dsName] = ins;
        return ins;
      }
    })(ds);

    /**
     * return
     * @type {{getDb: Function, getDs: Function}}
     */
    var rt = {
      getDb: function (ds, db) {
        return Instance.get(ds).use(db);
      },
      getDs: function (ds) {
        return Instance.get(ds);
      }
    };
    dataSources.forEach(function (ds) {
      rt['get' + upFirst(ds)] = rt['use' + upFirst(ds)] = function () {
        return this.getDs(ds);
      }
    });

    return rt;
  }

  /**
   *
   * @type {dataSource}
   */
  module.exports = dataSource;
})(module);