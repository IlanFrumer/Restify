describe 'Restify', ()->
  
  api = {}
  $httpBackend = {}

  # load module
  beforeEach angular.mock.module('restify')

  beforeEach inject (_restify_, _$httpBackend_) ->
    $httpBackend = _$httpBackend_

    api = _restify_ '/api' , (conf)->
      conf.add('/users/:id/images/:id')

    $httpBackend.whenGET('/api').respond([1])
    $httpBackend.whenGET('/api/users').respond([1])
    $httpBackend.whenGET('/api/users/1').respond([1])
    $httpBackend.whenGET('/api/users/1/images').respond([1])

  afterEach ->
    $httpBackend.verifyNoOutstandingExpectation()
    $httpBackend.verifyNoOutstandingRequest()

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
    expect(api.users.$id(1).images.$$parent).not.toEqual(api.users.$id(1))


  it 'Should make get requests', ->
    $httpBackend.expectGET('/api')
    $httpBackend.expectGET('/api/users')
    $httpBackend.expectGET('/api/users/1')
    $httpBackend.expectGET('/api/users/1/images')
    
    api.$get()
    api.users.$get()
    api.users.$id(1).$get()
    api.users.$id(1).images.$get()

    $httpBackend.flush()

  it 'Should make get requests', ->
    $httpBackend.expectGET('/api')
    $httpBackend.expectGET('/api/users')
    $httpBackend.expectGET('/api/users/1')
    $httpBackend.expectGET('/api/users/1/images')
    
    api.$get()
    api.users.$get()
    api.users.$id(1).$get()
    api.users.$id(1).images.$get()

    $httpBackend.flush()
