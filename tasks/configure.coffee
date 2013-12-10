
banner = (version)->
  """
  ###
   * Restify v#{version}
   * (c) 2013 Ilan Frumer
   * License: MIT
  ###
  """

module.exports = (grunt) ->

  grunt.registerTask 'configure', 'Write configuration to files', ()->

    pkg   = grunt.file.readJSON('package.json')
    bower = grunt.file.readJSON('bower.json')

    src   = grunt.file.read('src/restify.coffee')

    version = this.options().version || pkg.version

    bower.version = version
    pkg.version = version   

    src = src.replace /^###[^#]+###/, banner(version)

    grunt.file.write 'package.json', JSON.stringify(pkg,null,2)
    grunt.file.write 'bower.json', JSON.stringify(bower,null,2)
    grunt.file.write 'src/restify.coffee', src

