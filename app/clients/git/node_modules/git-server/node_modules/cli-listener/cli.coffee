
###
	This is the CLI interface for your NodeJS apps
	
	
###



# Get required packages:
{EventEmitter}	= require 'events'
modules =
	readline	: require 'readline'
	async		: require 'async'



# Class definition:
class CLI extends EventEmitter



	###
		Constructor function for CLI Object:
		@param {String} interface The string you want the prompt to say:
		@param {String} welcome The welcome message to say to the user
		@param {Object} triggers A object of `trigger:action()`
	###
	constructor: ( @interface = 'my-app', @welcome = 'Welcome to CLI!', @triggers = {} )->
		@clear()
		# Setup the CLI input
		@cli = modules.readline.createInterface process.stdin, process.stdout, null
		# Welcome this awesome user:
		console.log @welcome
		# Set the prompt:
		@cli.setPrompt "#{@interface}> " 
		# setup event listeners
		@listenForTriggers()
		# open the promt
		@cli.on 'line', @onLine
		@resetInput()
	
		@question = @cli.question.bind(@cli)
	
	
	
	
	###
		Ask the Command line a question(s)
		@param {Object} questions Object of questions and their text
			eg: { 'username':'What is the username?' }
	###
	ask: ( questions = {}, callback = null, tasks = {} )=>
		# Go through each question in the object:
		for key,value of questions
			# Create a contextual closure
			( (key,value,question)->
				tasks[key] = ( cb )=>
					question value, (r)->cb(null,r)
			)( key, value, @cli.question.bind(@cli) )
		# Run the async.series on this list
		modules.async.series tasks, callback
	
	
	
	###
		Add events to list for
		@param {Object} triggers Triggers to add the listeners for
	###
	listenForTriggers: ( triggers = @triggers )=>
		for trigger,action of triggers
			# Add listener for each trigger, that results in action()
			@on trigger, action
		@on 'clear', =>
			# when we enter `clear` clear the pages content
			@clear()
			@resetInput()
		@on 'help', =>
			# List out the possible commands
			@listTriggers()
			@resetInput()
	
	
	
	
	# List the possible commands they can run:
	listTriggers: ()=>
		console.log 'Possible Commands: '
		for key,value of @triggers
			console.log '', key
	
	
	
	# Write a message using readline module
	write: (message,command)=>
		@cli.write message, command
	
	
	
	# Reset the prompt:
	resetInput: ()=>
		@cli.prompt()
	
		
	
	
	###
		When we hit ENTER on the keyboard
		@param {String} line Content of the line we jsut entered:
	###
	onLine: ( line )=>
		# Trim and spaces
		line = line.trim()
		# See if we have any listeners on this:
		if @listeners(line).length > 0
			# if so call it
			@emit line, @resetInput
		else
			# Otherwise just reset the prompt
			@cli.prompt() 


	
	# Clear the console:
	clear: ()=>
		process.stdout.write '\u001B[2J\u001B[0;0f'




module.exports = CLI