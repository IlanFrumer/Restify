# hasBody = /^(POST|PUT|PATCH)$/i.test(action.method)

module = angular.module('Restify', [])

module.factory 'Restify', ['$http','$q', ($http, $q)->

  uriToArray = (uri)->
    _.filter(uri.split('/'),(a)-> a)

  deRestify = (object)->
    _.omit (object) , (v,k)->
      /^\$/.test(k) || ( v && v.constructor.name == "Resource")

  deepExtend = (obj1, obj2)->
    result = angular.copy(obj1)
    for key,val of obj2
      result[key] = if _.isUndefined(result[key]) then val else angular.extend(result[key], val)

    return result

  RestifyPromise = (promise, restifyData)->
    deffered = $q.defer()

    promise.success (data, status, headers, config)->

      data = restifyData(data)

      deffered.resolve(data)

    promise.error (data, status, headers, config)->

      deffered.reject(data)

    deffered.promise

  class Resource

    constructor: (base, route, parent)->

      @$$url = base
      @$$route = route
      @$$parent = parent
      @$$config = {}

      for key,val of route
        if /^:/.test(key)
          $id = key.match(/^:(.+)/)[1]
          @["$#{$id}"] = (id)->
            new Resource("#{base}/#{id}", val, this)
        else
          @[key] = new Resource("#{base}/#{key}", val, this)

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

            element = new Resource("#{@$$url}#{id}", $val, this)
            
            _.extend(element, elm)

          _.extend(this,data)

        else
          element = new Resource(@$$url, @$$route, this)
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

    $config: (config) ->
      @$$config = deepExtend(@$$config, config)
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

    return new Resource(baseUrl, base , null)
]
