module.exports = (grunt)->

  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-karma'

  grunt.loadTasks 'tasks'

  grunt.initConfig

    configure:
      options:
        version: "0.2.4"

    karma:
      options:
        configFile: 'karma.conf.coffee'

      travis:
        singleRun: true
        autoWatch: false
        browsers: ['PhantomJS']

      dev:
        autoWatch: true

    coffee:
      compile:
        options:
          sourceMap: true
        files:
          'dist/restify.js': 'src/restify.coffee'

    uglify:
      dist:
        options:
          preserveComments: 'all'
        files: 
          'dist/restify.min.js': 'dist/restify.js'

    watch:
      coffee:
        files: 'src/restify.coffee'
        tasks : 'coffee:compile'

      uglify:
        files: 'dist/restify.js'
        tasks: ['uglify:dist']

  grunt.registerTask 'default', [
    'configure'
    'coffee:compile'
    'uglify:dist'
    'watch'
  ]

  grunt.registerTask 'build', [
    'configure'
    'coffee:compile'
    'uglify:dist'
  ]  