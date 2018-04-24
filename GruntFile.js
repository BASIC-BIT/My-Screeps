module.exports = function (grunt) {
  require('time-grunt')(grunt);
  require('load-grunt-tasks')(grunt);

  // Pull defaults (including username and password) from .screeps.json
  const config = require('./.screeps.json');

  // Allow grunt options to override default configuration
  const branch = grunt.option('branch') || config.branch;
  const email = grunt.option('email') || config.email;
  const password = grunt.option('password') || config.password;
  const ptr = grunt.option('ptr') ? true : config.ptr;
  const privateDirectory = grunt.option('private_directory') || config.private_directory;


  const currentDate = new Date();
  grunt.log.subhead(`Task Start: ${currentDate.toLocaleString()}`);
  grunt.log.writeln(`Branch: ${branch}`);

  // Load needed tasks
  grunt.loadNpmTasks('grunt-screeps');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-file-append');
  grunt.loadNpmTasks('grunt-jsbeautifier');
  // grunt.loadNpmTasks("grunt-rsync");
  // grunt.loadNpmTasks("grunt-sync");
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig({

    // Push all files in the dist folder to screeps. What is in the dist folder
    // and gets sent will depend on the tasks used.
    screeps: {
      options: {
        email,
        password,
        branch,
        ptr,
      },
      dist: {
        src: ['src/*.js'],
      },
    },

    watch: {
      scripts: {
        files: ['src/*.js'],
        tasks: ['default'],
        options: {
          debounceDelay: 2000,
          spawn: false,
        },
      },
    },

    // Copy all source files into the dist folder, flattening the folder
    // structure by converting path delimiters to underscores
    copy: {
      // Pushes the game code to the dist folder so it can be modified before
      // being send to the screeps server.
      screeps: {
        files: [{
          expand: true,
          src: 'src/*',
          dest: 'dist/',
          filter: 'isFile',
          rename: (dest, src) => dest + src.replace(/\//g, '_'),
        }],
      },
      private: {
        files: [{
          expand: true,
          cwd: 'src/',
          src: '**',
          dest: privateDirectory,
          filter: 'isFile',
          rename: (dest, src) => dest + src.replace(/\//g, '_'),
        }],
      },
    },

    // Add version variable using current timestamp.
    file_append: {
      versioning: {
        files: [
          {
            append: `\nglobal.SCRIPT_VERSION = ${currentDate.getTime()}\n`,
            input: 'src/version.js',
          },
        ],
      },
    },


    // Remove all files from the dist folder.
    clean: {
      dist: ['dist'],
    },


    // Apply code styling
    jsbeautifier: {
      modify: {
        src: ['src/**/*.js'],
        options: {
          config: '.jsbeautifyrc',
        },
      },
      verify: {
        src: ['src/**/*.js'],
        options: {
          mode: 'VERIFY_ONLY',
          config: '.jsbeautifyrc',
        },
      },
    },

    eslint: {
      target: ['src/**.js'],
    },
  });

  // Combine the above into a default task
  grunt.registerTask('public', ['eslint', 'screeps']);
  grunt.registerTask('default', ['eslint', 'copy:private']);
  grunt.registerTask('dev', ['watch']);
  grunt.registerTask('test', ['jsbeautifier:verify']);
  grunt.registerTask('pretty', ['jsbeautifier:modify']);
  grunt.registerTask('lint', ['eslint']);
};
