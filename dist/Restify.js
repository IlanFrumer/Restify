(function() {
  var module;

  module = angular.module('Restify', []);

  module.factory('Restify', [
    '$http', '$q', function($http, $q) {
      var Resource, RestifyPromise, deRestify, deepExtend, uriToArray;
      uriToArray = function(uri) {
        return _.filter(uri.split('/'), function(a) {
          return a;
        });
      };
      deRestify = function(object) {
        return _.omit(object, function(v, k) {
          return /^\$/.test(k) || (v && v.constructor.name === "Resource");
        });
      };
      deepExtend = function(obj1, obj2) {
        var key, result, val;
        result = angular.copy(obj1);
        for (key in obj2) {
          val = obj2[key];
          result[key] = _.isUndefined(result[key]) ? val : angular.extend(result[key], val);
        }
        return result;
      };
      RestifyPromise = function(promise, callback) {
        var deffered;
        deffered = $q.defer();
        promise.success(function(data, status, headers, config) {
          data = callback(data);
          return deffered.resolve(data);
        });
        promise.error(function(data, status, headers, config) {
          return deffered.reject(data);
        });
        return deffered.promise;
      };
      Resource = (function() {
        function Resource(base, route, parent) {
          var $id, key, val;
          this.$$url = base;
          this.$$route = route;
          this.$$parent = parent;
          this.$$config = {};
          for (key in route) {
            val = route[key];
            if (/^:/.test(key)) {
              $id = key.match(/^:(.+)/)[1];
              this["$" + $id] = function(id) {
                return new Resource("" + base + "/" + id, val, this);
              };
            } else {
              this[key] = new Resource("" + base + "/" + key, val, this);
            }
          }
        }

        Resource.prototype.$get = function(conf) {
          var config, restified,
            _this = this;
          if (conf == null) {
            conf = {};
          }
          config = {};
          restified = _.isUndefined(conf.restified) ? true : conf.restified;
          if (!_.isUndefined(conf.params)) {
            config.params = conf.params;
          }
          return RestifyPromise($http['get']("" + this.$$url, config), function(data) {
            var $id, $val, element, key, val, _ref;
            if (data._embedded != null) {
              data = data._embedded;
            }
            if (!restified) {
              return data;
            }
            if (_.isArray(data)) {
              $id = 'id';
              $val = _this.$$route;
              _ref = _this.$$route;
              for (key in _ref) {
                val = _ref[key];
                if (/^:/.test(key)) {
                  $id = key.match(/^:(.+)/)[1];
                  $val = val;
                  break;
                }
              }
              data = _.map(data, function(elm) {
                var element, id;
                id = elm[$id] != null ? "/" + elm[$id] : "";
                element = new Resource("" + _this.$$url + id, $val, _this);
                return _.extend(element, elm);
              });
              return _.extend(_this, data);
            } else {
              element = new Resource(_this.$$url, _this.$$route, _this);
              return _.extend(element, data);
            }
          });
        };

        Resource.prototype.$delete = function() {
          var config;
          config = {
            url: "" + this.$$url,
            method: "DELETE"
          };
          return RestifyPromise($http(config));
        };

        Resource.prototype.$post = function(data) {
          var config;
          config = {
            url: "" + this.$$url,
            data: deRestify(data || this),
            method: "PATCH"
          };
          return RestifyPromise($http(config));
        };

        Resource.prototype.$put = function(data) {
          var config;
          config = {
            url: "" + this.$$url,
            data: deRestify(data || this),
            method: "PUT"
          };
          return RestifyPromise($http(config));
        };

        Resource.prototype.$patch = function(data) {
          var config;
          config = {
            url: "" + this.$$url,
            data: deRestify(data || this),
            method: "PATCH"
          };
          return RestifyPromise($http(config));
        };

        Resource.prototype.$config = function(config) {
          this.$$config = deepExtend(this.$$config, config);
          return this;
        };

        return Resource;

      })();
      return function(baseUrl, callback) {
        var base, configuerer;
        baseUrl = '/' + uriToArray(baseUrl).join('/');
        base = {};
        configuerer = {
          add: function(route) {
            var fetch;
            route = uriToArray(route);
            fetch = function(base, route) {
              var name, next;
              if (!_.isEmpty(route)) {
                name = route[0];
                next = route.slice(1);
                base[name] = base[name] || {};
                return fetch(base[name], next);
              }
            };
            return fetch(base, route, []);
          }
        };
        callback(configuerer);
        return new Resource(baseUrl, base, null);
      };
    }
  ]);

}).call(this);
