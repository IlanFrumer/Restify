module.exports = (grunt)->

  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-watch'

  grunt.initConfig

    coffee:
      compile:
        files:
          'dist/Restify.js': 'src/Restify.coffee'

    uglify:
      dist:
        files: 
          'dist/Restify.min.js': 'dist/Restify.js'

    watch:
      coffee:
        files: 'src/Restify.coffee'
        tasks : 'coffee:compile'

      uglify:
        files: 'dist/Restify.js'
        tasks: 'uglify:dist'

  grunt.registerTask 'default', [
    'coffee:compile'
    'uglify:dist'
    'watch'
  ]