
/*
 * Restify v0.3.1
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
      var Restify, deRestify, restify, uriToArray;
      uriToArray = function(uri) {
        return _.filter(uri.split('/'), function(a) {
          return a;
        });
      };
      restify = function(data, wrap) {
        var $id, $route, key, newElement, val, _ref;
        newElement = null;
        if (_.isObject(data)) {
          $id = null;
          $route = this.$$route;
          _ref = this.$$route;
          for (key in _ref) {
            val = _ref[key];
            if (/^:/.test(key)) {
              $id = key.match(/^:(.+)/)[1];
              $route = val;
              break;
            }
          }
          if (_.isArray(data)) {
            newElement = new Restify(this.$$url, this.$$route, this.$$parent);
            if ($id) {
              data = _.map(data, function(item) {
                if (item[$id]) {
                  return _.extend(new Restify("" + newElement.$$url + "/" + item[$id], $route, newElement), item);
                } else {
                  return item;
                }
              });
            }
            newElement.push.apply(newElement, data);
          } else {
            if ($id && data[$id]) {
              newElement = new Restify("" + this.$$url + "/" + data[$id], this.$$route, this);
            } else {
              newElement = new Restify(this.$$url, this.$$route, this.$$parent);
            }
            newElement = _.extend(newElement, data);
          }
        } else {
          newElement = new Restify(this.$$url, this.$$route, this.$$parent);
          newElement.data = data;
        }
        return newElement;
      };
      deRestify = function(obj) {
        if (angular.isObject(obj)) {
          return _.omit(obj, function(v, k) {
            return /^\$/.test(k);
          });
        }
      };
      Restify = (function(_super) {
        __extends(Restify, _super);

        function Restify(base, route, parent) {
          var $id, key, val;
          this.$$url = base;
          this.$$route = route;
          this.$$parent = parent;
          this.$$config = {};
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
              this["$" + key] = new Restify("" + base + "/" + key, val, this);
            }
          }
        }

        Restify.prototype.$req = function(config, wrap) {
          var conf;
          if (wrap == null) {
            wrap = true;
          }
          conf = {};
          if (config.data) {
            config.data = deRestify(config.data);
          }
          config.url = this.$$url;
          angular.extend(conf, this.$$config, config);
          conf.method = conf.method || "GET";
          if (_.isEmpty(conf.params)) {
            delete conf.params;
          }
          return $http(conf).then((function(_this) {
            return function(response) {
              if (wrap) {
                response.data = restify.call(_this, response.data);
              }
              return response.data;
            };
          })(this));
        };

        Restify.prototype.$ureq = function(config) {
          return this.$req(config, false);
        };

        Restify.prototype.$uget = function(params) {
          if (params == null) {
            params = {};
          }
          return this.$ureq({
            method: 'GET',
            params: params
          });
        };

        Restify.prototype.$get = function(params) {
          if (params == null) {
            params = {};
          }
          return this.$req({
            method: 'GET',
            params: params
          });
        };

        Restify.prototype.$upost = function(data) {
          return this.$ureq({
            method: 'POST',
            data: data || this
          });
        };

        Restify.prototype.$post = function(data) {
          return this.$req({
            method: 'POST',
            data: data || this
          });
        };

        Restify.prototype.$uput = function(data) {
          return this.$ureq({
            method: 'PUT',
            data: data || this
          });
        };

        Restify.prototype.$put = function(data) {
          return this.$req({
            method: 'PUT',
            data: data || this
          });
        };

        Restify.prototype.$upatch = function(data) {
          return this.$ureq({
            method: 'PATCH',
            data: data || this
          });
        };

        Restify.prototype.$patch = function(data) {
          return this.$req({
            method: 'PATCH',
            data: data || this
          });
        };

        Restify.prototype.$udelete = function() {
          return this.$ureq({
            method: 'DELETE'
          });
        };

        Restify.prototype.$delete = function() {
          return this.$req({
            method: 'DELETE'
          });
        };

        Restify.prototype.$config = function(config) {
          return angular.extend($$config, config);
        };

        return Restify;

      })(Array);
      return function(baseUrl, callback) {
        var base, configuerer, match;
        match = baseUrl.match(/^(https?\:\/\/)?(.+)/) || [];
        baseUrl = (match[1] || '/') + uriToArray(match[2] || '').join('/');
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
        return new Restify(baseUrl, base, null);
      };
    }
  ]);

}).call(this);

//# sourceMappingURL=restify.js.map
