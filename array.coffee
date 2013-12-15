class Users extends Array

	constructor: ()->
		@url =  1
		@route =  1

		for i in [0..10]
			@.push i+1


users = new Users

console.log users



