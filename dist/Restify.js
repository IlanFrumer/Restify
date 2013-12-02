(function() {
  var module;

  module = angular.module('Restify', []);

  module.factory('Restify', [
    '$http', '$q', function($http, $q) {
      var Resource, RestifyPromise, uriToArray;
      uriToArray = function(uri) {
        return _.filter(uri.split('/'), function(a) {
          return a;
        });
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
        function Resource(base, route) {
          var $id, key, val;
          this.$$url = base;
          this.$$route = route;
          for (key in route) {
            val = route[key];
            if (/^:/.test(key)) {
              $id = key.match(/^:(.+)/)[1];
              this["$" + $id] = function(id) {
                return new Resource("" + base + "/" + id, val);
              };
            } else {
              this[key] = new Resource("" + base + "/" + key, val);
            }
          }
        }

        Resource.prototype.$get = function() {
          var _this = this;
          return RestifyPromise($http['get']("" + this.$$url), function(data) {
            var $id, $val, element, key, val, _ref;
            if (data._embedded != null) {
              data = data._embedded;
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
                element = new Resource("" + _this.$$url + id, $val);
                return angular.extend(element, elm);
              });
              return angular.extend(_this, data);
            } else {
              element = new Resource(_this.$$url, _this.$$route);
              return angular.extend(element, data);
            }
          });
        };

        Resource.prototype.$trash = function() {
          var _this = this;
          return RestifyPromise($http['delete']("" + this.$$url), function(body) {
            _this.response = body;
            return _this;
          });
        };

        Resource.prototype.$post = function(data) {
          var _this = this;
          return RestifyPromise($http['post']("" + this.$$url, data), function(body) {
            _this.response = body;
            return _this;
          });
        };

        Resource.prototype.$save = function(data) {
          var _this = this;
          return RestifyPromise($http['put']("" + this.$$url, data), function(body) {
            _this.response = body;
            return _this;
          });
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
        return new Resource(baseUrl, base);
      };
    }
  ]);

}).call(this);
