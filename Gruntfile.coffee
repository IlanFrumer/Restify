module.exports = (grunt)->

  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-karma'

  grunt.loadTasks 'tasks'

  grunt.initConfig

    configure:
      options:
        version: "0.2.5"

    karma:
      options:
        configFile: 'karma.conf.coffee'
        autoWatch: false

      travis:
        singleRun: true
        browsers: ['PhantomJS']

      unit:
        background: true

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

      karma:
        files: 'test/restifySpec.coffee'
        tasks: ['karma:unit:run']


  grunt.registerTask 'default', [
    'configure'
    'karma:unit:start'
    'coffee:compile'
    'uglify:dist'
    'watch'
  ]

  grunt.registerTask 'build', [
    'configure'
    'karma:travis'
    'coffee:compile'
    'uglify:dist'
  ]  