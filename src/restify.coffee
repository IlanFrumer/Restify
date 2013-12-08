# hasBody = /^(POST|PUT|PATCH)$/i.test(action.method)

module = angular.module('restify', [])

module.factory 'restify', ['$http','$q', ($http, $q)->

  uriToArray = (uri)->
    _.filter(uri.split('/'),(a)-> a)

  deRestify = (object)->
    _.omit (object) , (v,k)->
      /^\$/.test(k) || ( v && v.constructor.name == "Restify")

  RestifyPromise = (promise, restifyData)->
    deffered = $q.defer()

    promise.success (data, status, headers, config)->

      # TODO: response interceptor

      data = restifyData(data)

      deffered.resolve(data)

    promise.error (data, status, headers, config)->

      # TODO: response error interceptor

      deffered.reject(data)

    deffered.promise

  class Restify

    constructor: (base, route, parent)->

      @$$url = base
      @$$route = route
      @$$parent = parent
      @$$config = {}

      for key,val of route
        if /^:/.test(key)
          $id = key.match(/^:(.+)/)[1]
          @["$#{$id}"] = (id)->
            new Restify("#{base}/#{id}", val, this)
        else
          @[key] = new Restify("#{base}/#{key}", val, this)

    $uget : (conf = {})-> @get(conf, false)

    $get : (conf = {}, toWrap = true)->

      config = 
        url: "#{@$$url}"
        method: "GET"

      unless _.isUndefined(conf.params)
        config.params = conf.params

      RestifyPromise $http(config), (data)=>

        if data._embedded?
          data = data._embedded

        unless toWrap
          return data

        if _.isArray(data)
          $id = 'id'
          $val = @$$route
          for key,val of @$$route
            if /^:/.test(key)
              $id = key.match(/^:(.+)/)[1]
              $val = val
              break
          
          data = _.map data, (elm)=>
            
            id = if elm[$id]? then "/#{elm[$id]}" else ""

            element = new Restify("#{@$$url}#{id}", $val, this)
            
            _.extend(element, elm)

          _.extend(this,data)

        else
          element = new Restify(@$$url, @$$route, this)
          _.extend(element,data)
          
    $delete : () ->
      config = 
        url: "#{@$$url}"
        method: "DELETE"

      RestifyPromise $http(config)

    $post : (data) ->
      config = 
        url: "#{@$$url}"
        data: deRestify(data||this)
        method: "PATCH"

      RestifyPromise $http(config)

    $put  : (data) ->
      config = 
        url: "#{@$$url}"
        data: deRestify(data||this)
        method: "PUT"

      RestifyPromise $http(config)

    $patch: (data) ->
      config = 
        url: "#{@$$url}"
        data: deRestify(data||this)
        method: "PATCH"

      RestifyPromise $http(config)      

    $config: (methods, config)->

      ## TODO: make headers case insensitive
      methods = [methods] if _.isString(methods)
      for method in methods
        @$$config[method] = @$$config[method] || {}
        _.merge(@$$config[method], config)
      return this

  return (baseUrl, callback)->

    baseUrl = '/' + uriToArray(baseUrl).join('/')
    base = {}

    configuerer =
      add: (route)->

        route = uriToArray(route)
      
        fetch = (base, route)->

          unless _.isEmpty(route)

            name = route[0]
            next = route.slice(1)

            base[name] = base[name] || {}

            fetch(base[name], next)

        fetch(base, route, [])

    callback(configuerer)

    return new Restify(baseUrl, base , null)
]