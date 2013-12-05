banner = """
/**
 *  <%= pkg.name %> v<%= pkg.version %>
 *  (c) 2013 <%= pkg.author %>
 *  License: <%= pkg.license %>
 */

"""

module.exports = (grunt)->

  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-banner'

  grunt.initConfig

    pkg: grunt.file.readJSON("package.json")

    coffee:
      compile:
        files:
          'dist/restify.js': 'src/restify.coffee'

    uglify:
      dist:
        files: 
          'dist/restify.min.js': 'dist/restify.js'

    usebanner:
      dist:
        options: 
          position: 'top'
          linebreak: true
          banner: banner
                 
        files:
          src: [ 'dist/restify.js' , 'dist/restify.min.js' ]

    watch:
      coffee:
        files: 'src/restify.coffee'
        tasks : 'coffee:compile'

      uglify:
        files: 'dist/restify.js'
        tasks: ['uglify:dist']

  grunt.registerTask 'default', [
    'coffee:compile'
    'uglify:dist'
    'usebanner:dist'
    'watch'
  ]