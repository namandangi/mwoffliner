#!/usr/bin/env node
"use strict";

/************************************/
/* MODULE VARIABLE SECTION **********/
/************************************/

var fs = require( 'fs' );
var async = require( 'async' );
var pathParser = require( 'path' );
var homeDirExpander = require( 'expand-home-dir' );
var countryLanguage = require( 'country-language' );
var yargs = require('yargs');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

/************************************/
/* COMMAND LINE PARSING *************/
/************************************/

var argv = yargs.usage('Given a directory, create for each selection list file belonging to it, the corresponding ZIM file against Wikipedia: $0'
	   + '\nExample: node wpselectionsoffliner.js --directory=/tmp/wikiproject/ [--tmpDirectory=/tmp/] --outputDirectory=[/var/zim2index]')
    .require([ 'directory' ])
    .options( ['verbose', 'tmpDirectory', 'outputDirectory'] )
    .describe( 'tmpDirectory', 'Directory where files are temporary stored')
    .describe( 'outputDirectory', 'Directory to write the ZIM files')
    .describe( 'verbose', 'Print debug information to the stdout' )
    .strict()
    .argv;

/* Check if opt. binaries are available */
var optBinaries = [ 'mv --version' ];
optBinaries.forEach( function( cmd ) {
    exec(cmd + ' 2>&1 > /dev/null', function( error, stdout, stderr ) {
	if ( error ) {
	    console.error( 'Failed to find binary "' + cmd.split(' ')[0] + '": (' + error + ')' );
	    process.exit( 1 );
	}
    });
});

/************************************/
/* CUSTOM VARIABLE SECTION **********/
/************************************/

var directory = homeDirExpander( argv.directory );
var outputDirectory = argv.outputDirectory ? homeDirExpander( argv.outputDirectory ) + '/' : directory;
var tmpDirectory = argv.tmpDirectory ? homeDirExpander( argv.tmpDirectory ) + '/' : 'static/';
var verbose = argv.verbose;
var selections = new Array();

/************************************/
/* MAIN *****************************/
/************************************/

async.series(
    [
	function( finished ) { init( finished ) },
	function( finished ) { loadSelections( finished ) },
	function( finished ) { dump( finished ) }
    ],
    function( error ) {
	if ( error ) {
	    console.error( 'Unable to dump correctly all mediawikis (' + error + ')' );
	} else {
	    console.log( 'All mediawikis dump successfuly' );
	}
    }
);

/************************************/
/* FUNCTIONS ************************/
/************************************/

function init( finished ) {
    async.series(
	[
	    function( finished ) {
		fs.mkdir( outputDirectory, undefined, function() {
		    fs.exists( outputDirectory, function ( exists ) {
			if ( exists && fs.lstatSync( outputDirectory ).isDirectory() ) {
			    finished();
			} else {
			    finished( 'Unable to create directory \'' + outputDirectory + '\'' );
			}
		    });
		});
	    },
	    function( finished ) {
		fs.mkdir( tmpDirectory, undefined, function() {
		    fs.exists( tmpDirectory, function ( exists ) {
			if ( exists && fs.lstatSync( tmpDirectory ).isDirectory() ) {
			    finished();
			} else {
			    finished( 'Unable to create directory \'' + tmpDirectory + '\'' );
			}
		    });
		});
	    },
	],
	function( error ) {
	    if ( error ) {
		console.error( error );
		process.exit( 1  );
	    } else {
		finished();
	    }
	}
    );
}

function dump( finished ) {
    async.eachSeries(
	selections,
	function ( language, finished ) {
	    printLog( 'Dumping selection for language "' + language + '"' );
	    
	    var parsoidUrl = 'http://parsoid-lb.eqiad.wikimedia.org/' + language + 'wiki/';
	    var mwUrl = 'http://' + language + '.wikipedia.org/';
	    var articleList = directory + language;
	    var selectionName = pathParser.basename( directory );

	    executeTransparently( 'node',
				  [ './mwoffliner.js', '--mwUrl=' + mwUrl, '--parsoidUrl=' + parsoidUrl,
				    '--outputDirectory=' + tmpDirectory, verbose ? '--verbose' : '',
				    '--articleList=' + articleList, 
				    '--filenamePrefix=wikipedia_' + language + '_' + selectionName
				  ],
				  function( executionError ) {
				      if ( executionError ) {
					  console.error( executionError );
					  process.exit( 1 );
				      } else {
					  var cmd = 'mv ' + tmpDirectory + '*.zim "' + outputDirectory + '"'; 
					  console.log( 'Moving ZIM files (' + cmd + ')' );
					  exec( cmd, function( executionError, stdout, stderr ) {
					      if ( executionError ) {
						  finished( executionError );
					      } else {
						  finished();
					      }
					  });
				      }
				  });
	},
	function( error ) {
	    finished( error );
	}
    )
}

function loadSelections( finished ) {
    fs.readdir( directory, function( error, list ) {
	selections = list;
	setTimeout( finished, 0 );
    });
}

function executeTransparently( command, args, callback, nostdout, nostderr ) {
    console.log( 'Executing command: ' + command + ' ' + args.join( ' ' ) ); 

    try {
        var proc = spawn( command, args );

	if ( !nostdout ) {
            proc.stdout.on( 'data', function ( data ) {
		console.log( String( data ).replace(/[\n\r]/g, '') );
            });
	}

        if ( !nostderr ) {
            proc.stderr.on( 'data', function ( data ) {
		console.error( String( data ).replace(/[\n\r]/g, '') );
            });
	}

        proc.on( 'close', function ( code ) {
            callback( code !== 0 ? 'Error by executing ' + command : undefined );
	});
    } catch ( error ) {
	callback( 'Error by executing ' + command );
    }
}

function printLog( msg ) {
    if ( verbose ) {
	console.info( msg );
    }
}