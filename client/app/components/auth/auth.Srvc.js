(function () {
  angular
    .module('app')
    .factory('Auth', Auth);

  Auth.$inject = ['$location', '$rootScope', '$http', 'User', '$cookieStore', '$q'];

  function Auth($location, $rootScope, $http, User, $cookieStore, $q) {
    var currentUser = {};

    if ($cookieStore.get('token')) {
      currentUser = User.get();
    }

    return {
      login: function (user, callback) {
        var cb = callback || angular.noop
        var deferred = $q.defer()
        $http.post('/auth/local', {
          email: user.email,
          password: user.password
        }).
        success(function(data) {
          $cookieStore.put('token', data.token);
          $cookieStore.put('authTokenCookie', user.email)
          currentUser = User.get()
          deferred.resolve(data)
          return cb()
        }).
        error(function(err) {
          this.logout()
          deferred.reject(err)
          return cb(err)
        }.bind(this))

        return deferred.promise
      },

      /**
       * Delete access token and user info
       */
      logout: function () {
        $cookieStore.remove('token')
        $cookieStore.remove('authTokenCookie')
        currentUser = {}
      },

      /* new user
       */
      createUser: function (user, callback) {
        var cb = callback || angular.noop
        return User.save(user,
          function(data) {
            $cookieStore.put('token', data.token)
            currentUser = User.get()
            return cb(user)
          },
          function(err) {
            this.logout()
            return cb(err)
          }.bind(this)).$promise
      },

      /**
       * Change password
       */
      changePassword: function(oldPassword, newPassword, callback) {
        var cb = callback || angular.noop

        return User.changePassword({
          id: currentUser._id
        }, {
          oldPassword: oldPassword,
          newPassword: newPassword
        }, function(user) {
          return cb(user)
        }, function(err) {
          return cb(err)
        }).$promise
      },

      getCurrentUser: function() {
        return currentUser
      },

      isLoggedIn: function() {
        return currentUser.hasOwnProperty('role')
      },

      isLoggedInAsync: function(cb) {
        if (currentUser.hasOwnProperty('$promise')) {
          currentUser.$promise.then(function() {
            cb(true)
          }).catch(function() {
            cb(false)
          })
        } else if (currentUser.hasOwnProperty('role')) {
          cb(true)
        } else {
          cb(false)
        }
      },

      isAdmin: function() {
        return currentUser.role === 'admin'
      },

      getToken: function() {
        return $cookieStore.get('token')
      },

      getUserEmail: function() {
        return currentUser.email
      }
    }
  }
})()