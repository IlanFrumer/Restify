describe 'Restify', ()->
  
  api = {}
  $httpBackend = {}

  # load module
  beforeEach angular.mock.module('restify')

  beforeEach inject (_restify_, _$httpBackend_) ->
    $httpBackend = _$httpBackend_

    api = _restify_ '/api' , (conf)->
      conf.add('/users/:id/images/:id')


    users = [
      id: 1
      firstname: 'ilan'
      lastname: 'frumer'
    ,
      id: 2
      firstname: 'john'
      lastname: 'doe'
    ,
      id: 3
      firstname: 'mark'
      lastname: 'twain'
    ,
      id: 4
      firstname: 'linus'
      lastname: 'torvalds'
    ]

    $httpBackend.whenGET('/api').respond([])
    $httpBackend.whenGET('/api/users').respond(users)
    $httpBackend.whenGET('/api/users/1').respond(_.find(users,(u)-> u.id == 1))
    $httpBackend.whenGET('/api/users/1/images').respond([1])

    $httpBackend.whenPOST('/api/users').respond (method, url, data, headers)-> [201, "", ""]

    for method in ['PATCH','DELETE','PUT']
      $httpBackend.when(method,'/api/users/1').respond (method, url, data, headers)-> [200, "", ""]

  it 'Should create api object properly', ->
    
    expect(api.users).toBeDefined()
    expect(api.users.$id).toBeDefined()    
    expect(api.users.$id(1).images).toBeDefined()
    expect(api.users.$id(1).images.$id).toBeDefined()

  it 'Should contain $$url', ->

    expect(api.$$url).toEqual('/api')
    expect(api.users.$$url).toEqual('/api/users')
    expect(api.users.$id(1).$$url).toEqual('/api/users/1')
    expect(api.users.$id(1).images.$$url).toEqual('/api/users/1/images')

  it 'Should contain $$parent', ->
    expect(api.$$parent).toEqual(null)
    expect(api.users.$$parent).toEqual(api)
    expect(api.users.$id(1).$$parent).toEqual(api.users)

    user = api.users.$id(1)
    expect(user.images.$$parent).toEqual(user)

  it 'Should create different object for each call' , ->
    expect(api.users.$id(1).images.$$parent).not.toBe(api.users.$id(1))


  describe '$httpBackend.flush', ->
        
    afterEach ->
      $httpBackend.flush()
      $httpBackend.verifyNoOutstandingExpectation()
      $httpBackend.verifyNoOutstandingRequest()


    it 'Should make get requests', ->
      $httpBackend.expectGET('/api')
      $httpBackend.expectGET('/api/users')
      $httpBackend.expectGET('/api/users/1')
      $httpBackend.expectGET('/api/users/1/images')
      
      api.$get()
      api.users.$get()
      api.users.$id(1).$get()
      api.users.$id(1).images.$get()

    it 'Should make post requests', ->
      $httpBackend.expectPOST('/api/users')
      api.users.$post()

    it 'Should make patch/put/delete requests', ->
      $httpBackend.expectPUT('/api/users/1')
      $httpBackend.expectDELETE('/api/users/1')
      $httpBackend.expectPATCH('/api/users/1')

      api.users.$id(1).$put()
      api.users.$id(1).$delete()
      api.users.$id(1).$patch()


    it 'Should get restified responses', ->

      api.users.$get().then (users)->
        expect(users.length).toEqual(4)
        expect(users.$$url).toEqual('/api/users')
        expect(users[0].$$url).toEqual('/api/users/1')
        expect(users[0].firstname).toEqual('ilan')
        expect(users[0].lastname).toEqual('frumer')        
        expect(users[0].images.$$url).toEqual('/api/users/1/images')

      api.users.$id(1).$get().then (user)->
        expect(user.length).toEqual(0) # should extend the object rather than pushing to it...
        expect(user.$$url).toEqual('/api/users/1')
        expect(user.id).toEqual(1)
        expect(user.firstname).toEqual('ilan')
        expect(user.lastname).toEqual('frumer')        
        expect(user.images.$$url).toEqual('/api/users/1/images')
                
    it 'Should get unrestified responses', ->

      api.users.$uget().then (users)->
        expect(users.length).toEqual(4)
        expect(users.$$url).toBeUndefined()
        expect(users[0].$$url).toBeUndefined()
        expect(users[0].firstname).toEqual('ilan')
        expect(users[0].lastname).toEqual('frumer')        
        expect(users[0].images).toBeUndefined()

      api.users.$id(1).$uget().then (user)->
        expect(user.length).toBeUndefined()
        expect(user.$$url).toBeUndefined()
        expect(user.id).toEqual(1)
        expect(user.firstname).toEqual('ilan')
        expect(user.lastname).toEqual('frumer')        
        expect(user.images).toBeUndefined()