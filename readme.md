
## Install

* `bower install restify`
* `<script src="bower_components/restify/dist/resrify.min.js">`

## Dependencies

- [Angular.js](https://github.com/angular/angular.js)
- [Lodash](https://github.com/lodash/lodash)

## Example

````coffeescript
# declare resify as a dependency for your app module
app = angular.module('yourModule',['restify'])


# create a service by injecting restify and use its factory
app.factory 'API', ['restify',(resrify)->
  
  # restify gets a base url and a config callback function
  # and returns a Restified Object

  restify '/api' , (config)->

    # add your endpoints
    config.add('/users/:id/images')
    config.add('/stores/:name/branches/:id')
    config.add('/stores/:name/products/:id')
    config.add('/stores/:name/images')
]


# inject your factory and start playing

app.controller 'MyCtrl',['$scop', 'API', ($scope, API)->

  # GET /api/users
  API.users.$get().then (users)->
    $scope.users = users

  $scope.userImages (user)->
    # provided that user.id == 123
    # GET /api/users/123/images
    # the response will automatically add the images array to user.images  
    user.images.$uget()

  $scope.create (user)->
    # PUT /api/users
    $scope.users.$post(user)

  $scope.save (user)->
    # provided that user.id == 123
    # PUT /api/users/123
    user.$put()

  $scope.changePassword (user, password)->
    # provided that user.id == 123
    # PATCH /api/users/123
    user.$patch({password: password})

  $scope.remove (user)->    
    user.$delete().then ()->
      $scope.users = _.without($scope.users,user)
]

````
##### View:
````html
  <ul>
    <li ng-repeat="user in users">
      <input type="text" ng-model="user.name">
      <input type="text" ng-model="user.email">
      <button ng-click="save(user)">Save</button>
      <button ng-click="remove(user)">Remove</button>      
      <button ng-click="getImages(user)">See Images</button>
      <ul>
        <li ng-repeat="image in user.images">
            <img src="{{image.src}}" alt="{{image.alt}}">
        </li>
      </ul>
    </li>
  </ul>  
````

## Restify Class

#### Own properties
     All own properties are prefixed with $$
     All inherited methods are prefixed with $
     Owned properties are to be used internally, don't mess with them!

* **$$url**
* **$$route**
* **$$parent**
* **$$config**

#### Methods that all Restified objects inherit through the prototype chain

* **$get()**: Returns a restified response body
* **$uget()**: Returns an unrestified response body
* **$delete()**:

#### If data is provided than request is made with it
     Else, sends the object itself stripped from functions or Restified objects.

* **$post([data])**:
* **$patch([data])**:
* **$put([data])**:


## Configartion

Any restify object inherits configuration from it's parent chain and may override it

````coffeescript
## parent chain: a > b > c > d
a = api
b = api.users
c = api.$id(123)
d = api.$id(123).images

a.$config({headers: {'X-AUTH-TOKEN': 123}})
d.$get() # sends X-AUTH-TOKEN: 123

b.$config({headers: {'X-AUTH-TOKEN': 456}})
d.$get() # sends X-AUTH-TOKEN: 456

a.$get() # still sends X-AUTH-TOKEN: 123

# note: $id creates a new restified object
e = api.users # === b
f = api.users.$id(123) # !== c
````