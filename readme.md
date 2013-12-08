
# [Restify](https://github.com/IlanFrumer/Restify)
Restful factory for AngularJS.

### Install

- `bower install restify`
- `<script src="bower_components/restify/dist/resrify.min.js">`

### Dependencies

- [Angular.js](https://github.com/angular/angular.js)
- [Lodash](https://github.com/lodash/lodash)

### Example

```coffee
# declare resify as a dependency of your application module
app = angular.module('yourModule',['restify'])

# create a service by injecting restify and using its factory function
# note: you should probably create one service for the whole api
#       and then pass it all over the place

app.factory 'API', ['restify',(resrify)->
  
  # restify 
  # gets a base url and a configuration block
  # returns a Restified Object

  restify '/api' , (config)->

    # add your endpoints
    config.add('/users/:id/images')
    config.add('/stores/:name/branches/:id')
    config.add('/stores/:name/products/:id')
    config.add('/stores/:name/images')
]


# inject your service and start playing

app.controller 'MyCtrl',['$scope', 'API', ($scope, API)->

  # GET /api/users
  API.users.$get().then (users)->
    $scope.users = users

  $scope.userImages (user)->
    # provided that user.id == 123
    # GET /api/users/123/images
    # it will automatically be added to user.images after the response
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

```
##### View:
```html
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

### Restify Class

#### Own properties
     All own properties are prefixed with $$     
     Owned properties are ment to be used internally, don't mess with them!

* **$$url**
* **$$route**
* **$$parent**
* **$$headers**
* **$$requestInterceptor**
* **$$responseInterceptor**

#### All Restified objects inherits those methods through the prototype chain
     All inherited methods are prefixed with $

#### If data is provided than request is made with it
     Else, sends the object itself stripped from functions or Restified objects.

* **$get()**: getting the response and restifing it
* **$uget()**: getting the response without restifing it
* **$delete()**

##### if data is not provided then this object is sent , stripped from functions or Restified objects.

* **$post([data])** 
* **$patch([data])**
* **$put([data])**

##### configuration methods

* **$setHeaders(headers)**
* **$setResponseInterceptor(callback)**
* **$setRequestInterceptor(callback)**

### Configartion

All restified object inherits configuration from it's parent chain and may override it

````coffee
# parent chain: api > users > user

users = api.users
user = users.$id(123)

api.$setHeaders({'X-AUTH-TOKEN': 123})
user.$get() # sends X-AUTH-TOKEN: 123

users.$setHeaders({'X-AUTH-TOKEN': 456})
user.$get() # sends X-AUTH-TOKEN: 456

api.$get() # still sends X-AUTH-TOKEN: 123

# note: $id creates a new restified object
sameUser = users.$id(123)
sameUser === user # false !!!
````