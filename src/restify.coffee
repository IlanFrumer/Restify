###
 * Restify v0.2.4
 * (c) 2013 Ilan Frumer
 * License: MIT
###

module = angular.module('restify', [])

original = {}

module.config ['$httpProvider', ($httpProvider)->
  original.transformRequest  = $httpProvider.defaults.transformRequest[0]
  original.transformResponse = $httpProvider.defaults.transformResponse[0]
]

module.factory 'restify', ['$http','$q', ($http, $q)->

  ## helpers

  uriToArray = (uri)->
    _.filter(uri.split('/'),(a)-> a)

  deRestify = (obj)->  
    _.omit (obj) , (v,k)->
      /^\$/.test(k) || ( v && v instanceof Restify)

  ## configuration factory

  configFactory  = (method, data)->
    config = {}
    config.url = @$$url
    config.method = method
    config.data = angular.toJson(deRestify(data)) unless angular.isUndefined(data)

    # create parent tree
    tree = [] ; _this = this
    while _this
      tree.push(_this)
      _this = _this.$$parent

    reqI = _.find(tree,'$$requestInterceptor')
    resI = _.find(tree,'$$responseInterceptor')

    config.transformRequest = (config)->
      
      config = original.transformRequest(config)
      config = reqI.$$requestInterceptor(config) unless angular.isUndefined(reqI)

      return config || $q.when(config)

    config.transformResponse = (data, headers)->

      data = original.transformResponse(data, headers)
      data = resI.$$responseInterceptor(data,headers) unless angular.isUndefined(resI)

      return data || $q.when(data)

    config.headers = _.reduceRight tree, ((headers, obj)-> _.defaults(headers, obj.$$headers || {})),{}

    return config

  ## promise wrapper
  
  RestifyPromise = (promise, restifyData)->
    deffered = $q.defer()

    promise.success (data, status, headers, config)->

      data = restifyData(data) unless angular.isUndefined(restifyData)

      deffered.resolve(data)

    promise.error (data, status, headers, config)->

      deffered.reject(data)

    deffered.promise

  ## class

  class Restify

    constructor: (base, route, parent)->

      @$$url = base
      @$$route = route
      @$$parent = parent

      for key,val of route
        base = "" if base == "/"
        if /^:/.test(key)
          $id = key.match(/^:(.+)/)[1]
          @["$#{$id}"] = (id)->
            new Restify("#{base}/#{id}", val, this)
        else
          @[key] = new Restify("#{base}/#{key}", val, this)

    $uget : (params = {})-> @get(params, false)

    $get : (params = {}, toWrap = true)->

      config = configFactory.call(this,'GET')
      config.params = params unless _.isEmpty(params)

      RestifyPromise $http(config), (data)=>
        
        unless toWrap
          return data

        newElement = new Restify(@$$url,@$$route,@$$parent)

        if _.isArray(data)

          $id = undefined
          $val = @$$route
          
          for key,val of @$$route
            if /^:/.test(key)
              $id = key.match(/^:(.+)/)[1]
              $val = val
              break

          unless angular.isUndefined($id)

            data = _.map data, (elm)->

              if angular.isUndefined(elm[$id])
                return elm
              else
                return _.extend(new Restify("#{newElement.$$url}/#{elm[$id]}", $val, newElement), elm)

        _.extend(newElement,data)

    $delete : () ->
      config = configFactory.call(this,'DELETE')
      RestifyPromise $http(config)

    $post : (data) ->
      config = configFactory.call(this,'POST',data || this)
      RestifyPromise $http(config)

    $put  : (data) ->
      config = configFactory.call(this,'PUT',data || this)
      RestifyPromise $http(config)

    $patch: (data) ->
      config = configFactory.call(this,'PATCH',data || this)
      RestifyPromise $http(config)      

    $setHeaders: (headers)->
      @$$headers = {} if angular.isUndefined(@$$headers)

      for key,val of headers        
        @$$headers[key.toUpperCase()] = val

      return this

    $setResponseInterceptor: (callback)->
      @$$responseInterceptor = callback
      return this

    $setRequestInterceptor: (callback)->
      @$$requestInterceptor = callback
      return this

  ## factory

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

    return new Restify(baseUrl, base , undefined)
]