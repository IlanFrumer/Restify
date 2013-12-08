(function() {
  var module;

  module = angular.module('restify', []);

  module.factory('restify', [
    '$http', '$q', function($http, $q) {
      var Restify, RestifyPromise, configFactory, deRestify, uriToArray;
      uriToArray = function(uri) {
        return _.filter(uri.split('/'), function(a) {
          return a;
        });
      };
      deRestify = function(obj) {
        return _.omit(obj, function(v, k) {
          return /^\$/.test(k) || (v && v.constructor.name === "Restify");
        });
      };
      configFactory = function(method, data) {
        var config, reqI, resI, tree, _this;
        config = {};
        config.url = this.$$url;
        config.method = method;
        if (!angular.isUndefined(data)) {
          config.data = angular.toJson(deRestify(data));
        }
        tree = [];
        _this = this;
        while (_this) {
          tree.push(_this);
          _this = _this.$$parent;
        }
        config.headers = _.reduceRight(tree, (function(headers, obj) {
          return _.defaults(headers, obj.$$headers || {});
        }), {});
        if (reqI = _.find(tree, '$$requestInterceptor')) {
          config.transformRequest = reqI.$$requestInterceptor;
        }
        if (resI = _.find(tree, '$$responseInterceptor')) {
          config.transformResponse = resI.$$responseInterceptor;
        }
        return config;
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
          for (key in route) {
            val = route[key];
            if (base === "/") {
              base = "";
            }
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
          config = configFactory.call(this, 'GET');
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
          config = configFactory.call(this, 'DELETE');
          return RestifyPromise($http(config));
        };

        Restify.prototype.$post = function(data) {
          var config;
          config = configFactory.call(this, 'POST', data || this);
          return RestifyPromise($http(config));
        };

        Restify.prototype.$put = function(data) {
          var config;
          config = configFactory.call(this, 'PUT', data || this);
          return RestifyPromise($http(config));
        };

        Restify.prototype.$patch = function(data) {
          var config;
          config = configFactory.call(this, 'PATCH', data || this);
          return RestifyPromise($http(config));
        };

        Restify.prototype.$setHeaders = function(headers) {
          var key, val;
          if (angular.isUndefined(this.$$headers)) {
            this.$$headers = {};
          }
          for (key in headers) {
            val = headers[key];
            this.$$headers[key.toUpperCase()] = val;
          }
          return this;
        };

        Restify.prototype.$setResponseInterceptor = function(callback) {
          this.$$responseInterceptor = callback;
          return this;
        };

        Restify.prototype.$setRequestInterceptor = function(callback) {
          this.$$requestInterceptor = callback;
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
        return new Restify(baseUrl, base, void 0);
      };
    }
  ]);

}).call(this);
