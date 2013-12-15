/*
 * Restify v0.2.5
 * (c) 2013 Ilan Frumer
 * License: MIT
*/


(function() {
  var module, original,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module = angular.module('restify', []);

  original = {};

  module.config([
    '$httpProvider', function($httpProvider) {
      original.transformRequest = $httpProvider.defaults.transformRequest[0];
      return original.transformResponse = $httpProvider.defaults.transformResponse[0];
    }
  ]);

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
          return /^\$/.test(k) || (v && v instanceof Restify);
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
        reqI = _.find(tree, '$$requestInterceptor');
        resI = _.find(tree, '$$responseInterceptor');
        config.transformRequest = function(config) {
          config = original.transformRequest(config);
          if (!angular.isUndefined(reqI)) {
            config = reqI.$$requestInterceptor(config);
          }
          return config || $q.when(config);
        };
        config.transformResponse = function(data, headers) {
          data = original.transformResponse(data, headers);
          if (!angular.isUndefined(resI)) {
            data = resI.$$responseInterceptor(data, headers);
          }
          return data || $q.when(data);
        };
        config.headers = _.reduceRight(tree, (function(headers, obj) {
          return _.defaults(headers, obj.$$headers || {});
        }), {});
        return config;
      };
      RestifyPromise = function(promise, restifyData) {
        var deffered;
        deffered = $q.defer();
        promise.success(function(data, status, headers, config) {
          if (!angular.isUndefined(restifyData)) {
            data = restifyData(data);
          }
          return deffered.resolve(data);
        });
        promise.error(function(data, status, headers, config) {
          return deffered.reject(data);
        });
        return deffered.promise;
      };
      Restify = (function(_super) {
        __extends(Restify, _super);

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

        Restify.prototype.$uget = function(params) {
          if (params == null) {
            params = {};
          }
          return this.$get(params, false);
        };

        Restify.prototype.$get = function(params, toWrap) {
          var config,
            _this = this;
          if (params == null) {
            params = {};
          }
          if (toWrap == null) {
            toWrap = true;
          }
          config = configFactory.call(this, 'GET');
          if (!_.isEmpty(params)) {
            config.params = params;
          }
          return RestifyPromise($http(config), function(data) {
            var $id, $val, key, newElement, val, _ref;
            if (!toWrap) {
              return data;
            }
            newElement = new Restify(_this.$$url, _this.$$route, _this.$$parent);
            if (_.isArray(data)) {
              $id = void 0;
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
              if (!angular.isUndefined($id)) {
                data = _.map(data, function(elm) {
                  if (angular.isUndefined(elm[$id])) {
                    return elm;
                  } else {
                    return _.extend(new Restify("" + newElement.$$url + "/" + elm[$id], $val, newElement), elm);
                  }
                });
              }
              newElement.push.apply(newElement, data);
            } else {
              newElement = _.extend(newElement, data);
            }
            return newElement;
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

      })(Array);
      return function(baseUrl, callback) {
        var base, configuerer;
        baseUrl = '/' + uriToArray(baseUrl).join('/');
        base = {};
        configuerer = {
          add: function(route) {
            var mergeRoutes;
            route = uriToArray(route);
            mergeRoutes = function(base, route) {
              var name, next;
              if (!_.isEmpty(route)) {
                name = route[0];
                next = route.slice(1);
                base[name] = base[name] || {};
                return mergeRoutes(base[name], next);
              }
            };
            return mergeRoutes(base, route, []);
          }
        };
        callback(configuerer);
        return new Restify(baseUrl, base, void 0);
      };
    }
  ]);

}).call(this);

/*
//@ sourceMappingURL=restify.js.map
*/