(function() {
  var module;

  module = angular.module('restify', []);

  module.factory('restify', [
    '$http', '$q', function($http, $q) {
      var Restify, RestifyPromise, deRestify, uriToArray;
      uriToArray = function(uri) {
        return _.filter(uri.split('/'), function(a) {
          return a;
        });
      };
      deRestify = function(object) {
        return _.omit(object, function(v, k) {
          return /^\$/.test(k) || (v && v.constructor.name === "Restify");
        });
      };
      RestifyPromise = function(promise, restifyData) {
        var deffered;
        deffered = $q.defer();
        promise.success(function(data, status, headers, config) {
          data = restifyData(data);
          return deffered.resolve(data);
        });
        promise.error(function(data, status, headers, config) {
          return deffered.reject(data);
        });
        return deffered.promise;
      };
      Restify = (function() {
        function Restify(base, route, parent) {
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
                return new Restify("" + base + "/" + id, val, this);
              };
            } else {
              this[key] = new Restify("" + base + "/" + key, val, this);
            }
          }
        }

        Restify.prototype.$uget = function(conf) {
          if (conf == null) {
            conf = {};
          }
          return this.get(conf, false);
        };

        Restify.prototype.$get = function(conf, toWrap) {
          var config,
            _this = this;
          if (conf == null) {
            conf = {};
          }
          if (toWrap == null) {
            toWrap = true;
          }
          config = {
            url: "" + this.$$url,
            method: "GET"
          };
          if (!_.isUndefined(conf.params)) {
            config.params = conf.params;
          }
          return RestifyPromise($http(config), function(data) {
            var $id, $val, element, key, val, _ref;
            if (data._embedded != null) {
              data = data._embedded;
            }
            if (!toWrap) {
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
                element = new Restify("" + _this.$$url + id, $val, _this);
                return _.extend(element, elm);
              });
              return _.extend(_this, data);
            } else {
              element = new Restify(_this.$$url, _this.$$route, _this);
              return _.extend(element, data);
            }
          });
        };

        Restify.prototype.$delete = function() {
          var config;
          config = {
            url: "" + this.$$url,
            method: "DELETE"
          };
          return RestifyPromise($http(config));
        };

        Restify.prototype.$post = function(data) {
          var config;
          config = {
            url: "" + this.$$url,
            data: deRestify(data || this),
            method: "PATCH"
          };
          return RestifyPromise($http(config));
        };

        Restify.prototype.$put = function(data) {
          var config;
          config = {
            url: "" + this.$$url,
            data: deRestify(data || this),
            method: "PUT"
          };
          return RestifyPromise($http(config));
        };

        Restify.prototype.$patch = function(data) {
          var config;
          config = {
            url: "" + this.$$url,
            data: deRestify(data || this),
            method: "PATCH"
          };
          return RestifyPromise($http(config));
        };

        Restify.prototype.$config = function(methods, config) {
          var method, _i, _len;
          if (_.isString(methods)) {
            methods = [methods];
          }
          for (_i = 0, _len = methods.length; _i < _len; _i++) {
            method = methods[_i];
            this.$$config[method] = this.$$config[method] || {};
            _.merge(this.$$config[method], config);
          }
          return this;
        };

        return Restify;

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
        return new Restify(baseUrl, base, null);
      };
    }
  ]);

}).call(this);
