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
          'dist/Restify.js': 'src/Restify.coffee'

    uglify:
      dist:
        files: 
          'dist/Restify.min.js': 'dist/Restify.js'

    usebanner:
      dist:
        options: 
          position: 'top'
          linebreak: true
          banner: banner
                 
        files:
          src: [ 'dist/Restify.js' , 'dist/Restify.min.js' ]

    watch:
      coffee:
        files: 'src/Restify.coffee'
        tasks : 'coffee:compile'

      uglify:
        files: 'dist/Restify.js'
        tasks: ['uglify:dist']

  grunt.registerTask 'default', [
    'coffee:compile'
    'uglify:dist'
    'usebanner:dist'
    'watch'
  ]