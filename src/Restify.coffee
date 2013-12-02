# hasBody = /^(POST|PUT|PATCH)$/i.test(action.method)

module = angular.module('Restify', [])

module.factory 'Restify', ['$http','$q', ($http, $q)->

  uriToArray = (uri)->
    _.filter(uri.split('/'),(a)-> a)

  deRestify = (object)->
    _.omit (object) , (v,k)->
      /^\$/.test(k) || ( v && v.constructor.name == "Resource")

  RestifyPromise = (promise, callback)->
    deffered = $q.defer()

    promise.success (data, status, headers, config)->

      data = callback(data)

      deffered.resolve(data)

    promise.error (data, status, headers, config)->

      deffered.reject(data)

    deffered.promise

  class Resource

    constructor: (base, route)->

      @$$url = base
      @$$route = route

      for key,val of route
        if /^:/.test(key)
          $id = key.match(/^:(.+)/)[1]
          @["$#{$id}"] = (id)->
            new Resource("#{base}/#{id}", val)

        else
          @[key] = new Resource("#{base}/#{key}", val)

    $get : (restified = true)->
      RestifyPromise $http['get']("#{@$$url}"), (data)=>

        if data._embedded?
          data = data._embedded

        unless restified
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

            element = new Resource("#{@$$url}#{id}", $val)
            
            _.extend(element, elm)

          _.extend(this,data)

        else
          element = new Resource(@$$url, @$$route)          
          _.extend(element,data)
          

    $trash : () ->
      RestifyPromise $http['delete']("#{@$$url}"), (body)=>
        this.response = body
        return this

    $post : (data) ->
      RestifyPromise $http['post']("#{@$$url}", deRestify(data)), (body)=>
        this.response = body
        return this

    $save  : (data) ->      
      RestifyPromise $http['put']("#{@$$url}", deRestify(data || this)), (body)=>
        this.response = body
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

    return new Resource(baseUrl, base)
]

# app.factory 'API', (Restify)->

#   Restify '/api' , (configuerer)->
#     configuerer.add('/stores/:identifier/branches/:id')
#     configuerer.add('/stores/:identifier/images/:id')
#     configuerer.add('/users/:id')
