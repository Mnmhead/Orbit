/*
 *Copyright Gyorgy Wyatt Muntean 2016
 */

  
/*
 * HTML5 Variables and init
 */
var PI = Math.PI;
var FRAME = 0.017;  // 1 frame every 17ms for a 60fps frame rate
var CUR_FRAME = 0;
// Initialize the canvas parameters, essentially grab the canvas dimensions
var canvas_params = initializeCanvas();
var HEIGHT = canvas_params.HEIGHT;
var WIDTH = canvas_params.WIDTH;
var CENTER = canvas_params.CENTER;


/*
 * Simulation data, variables, and init
 */
// Enumeration for accessing an array which represents a Celestial Body
var P = 
{
      RADIANS    : 0,
      ORB_RADIUS : 1,
      OBJ_RADIUS : 2,
      FREQ       : 3,
      X_POS      : 4,
      Y_POS      : 5,
      PARENT     : 6
}
// radian position, radius of orbit, radius of planet, frequency in rotations per second
// radius is in pixels
CEL_OBJS={ 
     'star':[ 0, 0, 10, 0, CENTER.x, CENTER.y, null ],
     'planet1':[ 0*PI, 200, 8, 1, null, null, 'star' ], 
     'planet2':[ 0*PI, 100, 8, 5, null, null, 'star' ],
     /*'planet3':[ 1.5*PI, 140, 7, 0.6, null, null, 'star' ],
     'planet4':[ 0.5*PI, 37, 2, 2.8, null, null, 'star' ],
     'planet5':[ 1.7*PI, 250, 13, 0.45, null, null, 'star' ],
     'planet6':[ 12*PI, 300, 7, 0.3, null, null, 'star' ],
     'satellite1':[ 0.3*PI, 20, 3, 1.5, null, null, 'planet3' ],
     'satellite2':[ 0*PI, 21, 4, 4.2, null, null, 'planet5' ],
     // 'satellite3':[ 3*PI, 60, 10, 1.3, null, null, 'planet5' ],
     'satellite4':[ 0.9*PI, 15, 2, 10, null, null, 'planet1' ]
     //'satellite5':[ 0*PI, 25, 5, 2, null, null, 'satellite3' ],
     //'satellite6':[ 0*PI, 9, 2, 3, null, null, 'satellite5' ] */
};

/*
 * Useful animation and drawing globals below
 */
// Checklist for drawing all objects in each frame of animation
var UPDATE_LIST = {};

// Fill the checklist
registerAllObjs();

// Fill and init the HTML forms
initializeObjectCreationForm();
initializeObjectConnectForm();

// We save our beautiful lines here, use the push() method to add saved lines
LINE_SAVER = [];
MAX_NUM_LINES = 5000;

ANIMATING = true;  // tracks if we are currently in an animation loop

// Stores pairs of object_keys that should be connected
CONNECTED_OBJS = [];


/*
 * The 'main' function. This callback is passed to animate ( called every frame, 17ms ).
 */
function orbit() {	
   // Clear Canvas of previous marks then re-draw anything essential
   clearCanvas();
   clearUpdateList();
   drawSavedMarks();

   for( var key in CEL_OBJS ) {
      var object = CEL_OBJS[ key ];
      
      // maybe we store color in the Object array later?
      var color = 'black';
      if( key == 'star') {
         color = 'black'
      } else if ( key.includes( 'satellite' ) ) {
         color = 'MidnightBlue'
      } else if ( key.includes( 'planet' ) ) {
         color = 'RoyalBlue'
      }
      
      drawObject( object, color );       
      updateOrbit( object );  // update radians based on frequency of rotation
     
      /*
      // code to connect child and parent 
      var parent_key = object[ P.PARENT ];
      if( parent_key != null && CUR_FRAME % 10 == 0 ) {
         if( key != 'planet5' && key != 'planet4' ) {
            connectObjects( object, CEL_OBJS[ parent_key ] );
         }
      }
      */

      drawConnections();

      if( key == 'planet1' && CUR_FRAME % 2 == 0) {
         connectObjects( object, CEL_OBJS[ 'planet2' ] );
      }
   }

   // update the environment (update all pixel positions)
   updateEnvironment();

   // recursivelty animate if we are in animation loop
   CUR_FRAME = ( CUR_FRAME + 1 ) % 60;
   if( ANIMATING ) {
      animate( orbit );
   }
}

function drawCenteredPixel( x, y ) {
   var canvas = document.getElementById( "canvas" );
   var ctx = canvas.getContext( "2d" );

   ctx.fillRect( x + CENTER.x, y + CENTER.y, 1, 1 );   
}

// Takes in a formatted Celestial Object stored in the global dictionary
function drawCenteredPlanet( x, y, planet, color ) {
   // color argument is optional
   var color = color || 'black';
   var canvas = document.getElementById( "canvas" );
   var ctx = canvas.getContext( "2d" );
   var obj_radius = planet[ P.OBJ_RADIUS ];

   ctx.beginPath();
   ctx.arc( x + CENTER.x, y + CENTER.y, obj_radius, 0, 2 * PI, false);
   ctx.fillStyle = color;
   ctx.fill();
}

// Takes in two points as parameters and draws a line from point 1 to 2.
// Color is an optional argument.
function drawLine( p1, p2, color ) {
   var color = color || 'black';
   var canvas = document.getElementById( "canvas" );
   var ctx = canvas.getContext( "2d" );

   ctx.beginPath();
   ctx.moveTo( p1.x, p1.y );
   ctx.lineTo( p2.x, p2.y );
   ctx.lineWidth = 1;  // we really just want thin lines for now
   ctx.strokeStyle = color;
   ctx.stroke();
}

// Takes in a Celestial Object and an optional color parameter
function drawObject( obj, color ) {
   var color = color || 'black'  // default color is black
   var canvas = document.getElementById( "canvas" );
   var ctx = canvas.getContext( "2d" );

   ctx.beginPath();
   ctx.arc( obj[ P.X_POS ], obj[ P.Y_POS ], obj[ P.OBJ_RADIUS ], 0, 2 * PI, false );
   ctx.fillStyle = color;
   ctx.fill();
}

// Draw all the connections between objects
function drawConnections() {
   // iterate over connections array
   for( key in CONNECTED_OBJS ) {
      var pair = CONNECTED_OBJS[ key ];
      connectObjects( pair[ 0 ], pair[ 1 ] );
   } 
}

function drawBackground() {
   var canvas = document.getElementById( "canvas" );
   var ctx = canvas.getContext( "2d" );

   var background = new Image();
   // find a better god damn image
   background.src = "/Users/wyatt/orbit/space1.jpg";

   ctx.drawImage( background, 0, 0 );
}


// Takes in a Celestial Object and calculates its pixel position
// based on its orbit information and its parent location.
function computeAbsolutePosition( object ) {
   var parent_key = object[ P.PARENT ];

   if( parent_key == null ) {
      return {
         x: object[ P.X_POS ],
         y: object[ P.Y_POS ]
      };
   } else {
      var parent_obj = CEL_OBJS[ parent_key ];
      var rads = object[ P.RADIANS ];
      var orb_radius = object[ P.ORB_RADIUS ];  
      var relative_x = orb_radius * Math.cos( rads );
      var relative_y = orb_radius * Math.sin( rads );

      return {
         x: relative_x + parent_obj[ P.X_POS ],
         y: relative_y + parent_obj[ P.Y_POS ]
      } 
   }
}

// Takes in a Celestial Object key and updates its pixel position fields. 
// The tricky part is that we must update the parent objects first. It is 
// solvable by recursion in a DFS-ish manner.
function updateAbsolutePosition( object_key ) {
   var object = CEL_OBJS[ object_key ];
   var parent_key = object[ P.PARENT ];

   if( parent_key ) {
      // recursively call in order to update parents first
      updateAbsolutePosition( parent_key );

      // Check if we have already update this object
      if( !UPDATE_LIST[ object_key ] ) {
         // Object has not been updated, so update it
         var pos = computeAbsolutePosition( object );
         object[ P.X_POS ] = pos.x;
         object[ P.Y_POS ] = pos.y;

         // Mark the object as updated in the updated list
         UPDATE_LIST[ object_key ] = true; 
      }
   } else {
      // base-case, no parents (parent_key == null)
      return;
   }
}

// Takes in a Celestial Object and updates its radians field.
// This effectively simulates the orbit of this object around
// its parent.
function updateOrbit( obj ) {
   // Update radians based on frequency of rotation
   obj[ P.RADIANS ] = ( obj[ P.RADIANS ] + obj[ P.FREQ ] * FRAME ) % ( 2 * PI );
}

// Takes in a parameter of the form { name: name, obj: Object array }
// and then adds said object to the dictionary of Celestial Objects.
function createObject( obj_struct ) {
   CEL_OBJS[ obj_struct.name ] = obj_struct.obj;
}

// Updates the entire environment, meaning we update the positions
// of all the objects. 
function updateEnvironment() {
   for( var key in CEL_OBJS ) {
      updateAbsolutePosition( key );
   }
}

// Clears the entire canvas of all marks. 
// Resets the UPDATE_LIST.
function clearCanvas() {
   var canvas = document.getElementById( "canvas" );
   var ctx = canvas.getContext( "2d" );
   var width = canvas.width;
   var height = canvas.height;

   ctx.clearRect(0, 0, width, height);
}

// Clears the update list, should be run each frame. 
// This way every object is updated each frame.
function clearUpdateList() {
   // Clears the UPDATE_LIST 
   for( var drawing in UPDATE_LIST ) {
      UPDATE_LIST[ drawing ] = false;
   }
}

function drawSavedMarks() {
   // current background image is gross...find a better one
   // drawBackground();
   for( var line in LINE_SAVER ) {
      drawLine( LINE_SAVER[ line ].p1, LINE_SAVER[ line ].p2, LINE_SAVER[ line ].color );
   }
}

// Takes in a object_key and verifies that the object exists in the CEL_OBJS collection
function objectExists( obj_key ) {
   for( key in CEL_OBJS ) { 
      if( key == obj_key ) { 
         return true;
      }   
   }   
   
   return false;
}

// Takes in the 'string' key of a Clestial Object and registers 
// the object for drawing.
function registerObject( object_key ) {
   UPDATE_LIST[ object_key ] = false;
}

// Registers all objects
function registerAllObjs() {   
   // Loop over all Celestial Objects, registering them
   for( var key in CEL_OBJS ) {
      registerObject( key );
   }
}

function saveLine( line ) {
   if( LINE_SAVER.length < MAX_NUM_LINES ) {
      LINE_SAVER.push( line );
   }
}

// Grabs information about our HTML5 Canvas and fills some global
// variables. 
function initializeCanvas() {
   var canvas = document.getElementById( "canvas" );
   return {
      HEIGHT: canvas.height,
      WIDTH: canvas.width,
      CENTER: { x: canvas.width / 2,
                y: canvas.height / 2
              }
   } 
}

// Sets up the Celestial Object creation form for the first time
function initializeObjectCreationForm() {
   for( key in CEL_OBJS ) {
      addObjectToSelect( key, 'parent_select' ); 
   }
}

// Sets up object connect form for the first time
function initializeObjectConnectForm() {
   for( key in CEL_OBJS ) {
      addObjectToSelect( key, 'connect_select1' ); 
      addObjectToSelect( key, 'connect_select2' );
   }
}

// Takes in a Celestial Object and sets its initial pixel position.
// The tricky part is that it must recursively set its parent's position.
function initializeObject( object ) {
   // Base-case. Object position is already initialized 
   if( object[ P.X_POS ] != null && object[ P.Y_POS ] != null ) {
      return;
   } else {
      var parent_key = object[ P.PARENT ];
      if( parent_key ) {
         var parent_obj = CEL_OBJS[ parent_key ];      
         initializeObject( parent_obj );

         var pos = computeAbsolutePosition( object );
         object[ P.X_POS ] = pos.x;
         object[ P.Y_POS ] = pos.y;
      }
   }
}

// Sets up the environment. Initializes each object.
function initializeEnvironment() {
   // Iterate over all Celestial Objects, setting thier X_POS and Y_POS
   // fields. If an object has a parent, then we must set the parent's
   // X and Y_POS before computing child's X and Y_POS. This is all handled
   // by the initialzeObject function.
   for( var key in CEL_OBJS ) { 
      initializeObject( CEL_OBJS[ key ] );
   }
}

// Takes in two Celestial objects as input parameters and takes
// in an integer representing how many orbits the objects should remain
// connected (orbits taken from first object)
function connectObjects( obj1, obj2 ) {
   obj1_pos = { x:obj1[ P.X_POS ], y:obj1[ P.Y_POS ] };
   obj2_pos = { x:obj2[ P.X_POS ], y:obj2[ P.Y_POS ] };
 
   // For now we generate a random color 
   // var color = getRandomColor();

   // Format a line 'struct' 
   var line = { p1:obj1_pos, p2:obj2_pos }; //, color:color};
   // Draw and save the line
   drawLine( obj1_pos, obj2_pos ); //, color );
   saveLine( line );
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Simply calls window.requestAnimationFrame with the callback
// passed in as a parameter. Just quicker to type.
function animate( callback ) {
   window.requestAnimationFrame( callback );
}


/*
 * All the simulation magic here.
 */
initializeEnvironment();
animate( orbit );


/*
 * HTML Forms and user interactions below.
 */

// Resets HTML form, clearing all text inputs and setting them to default.
// perhaps we should pass in the name of the form...
function resetForm() {
   var formElements = document.getElementById( "obj_creation" ).children;
   for( var i = 0; i < formElements.length; i++ ) {
      if( formElements[ i ].type === 'text' ) {
         formElements[ i ].value = '';
      }
   }
}

// Verifies user input for creating Celestial Objects
function consumeObjectCreationForm() {
   // Begin validating parent
   var orbit_parent = document.getElementById( "parent_select" ).value;
   var parent_exists = objectExists( orbit_parent );
   if( !parent_exists ) {
      return "Invalid Parent.";
   }
   // We have validated the parent. Grab the parent 
   var parent_obj = CEL_OBJS[ orbit_parent ]; 
  
   // Begin validating obj and orb radii 
   var orb_radius = document.getElementById( "orb_radius" ).value;
   var obj_radius = document.getElementById( "obj_radius" ).value;  
   if( orb_radius - obj_radius <= parent_obj[ P.OBJ_RADIUS ] ) {
      return "Oops, orbit radius is too small or object radius conflicts with parent.";
   }

   // Starting radians and freq must be numbers 
   var radians = document.getElementById( "radians" ).value;
   radians = + radians;  // this weird looking snytax converts string into number
   if( isNaN( radians ) ) {
      return "Starting angle must be a number (in radians).";
   } 
   // Radians modulo 2*PI
   radians = radians % 2*PI;
   var freq = document.getElementById( "freq" ).value;
   freq = + freq;
   if( isNaN( freq ) ) {
      return "Frequency must be a number.";
   } 

   // Check length of name. Then check it is not taken.
   var name = document.getElementById( "name" ).value;
   if( name.length > 21 ) {
      return "Name exceeds 21 character limit.";
   }
   for( key in CEL_OBJS ) {
      if( key == name ) {
         return "Name already exists, please choose a different one.";
      }
   }

   var newObj = [ radians, orb_radius, obj_radius, freq, null, null, orbit_parent ];
   return { name: name,
            obj: newObj
          }
}

// Takes in a object key (object name). Adds it to the select menu for object creation.
function addObjectToSelect( obj_key, select_name ) {
   var parentSelect = document.getElementById( select_name ); 
   parentSelect.options[ parentSelect.options.length ] = new Option( obj_key, obj_key );
}

// Create Button
// Function handler for clicking Celestial Object creation
document.getElementById( "create_obj" ).onclick = function () {
   formOutput = consumeObjectCreationForm();
   if( typeof formOutput === 'string' || formOutput instanceof String ) {
      // Display error message
      alert( formOutput );
   } else {
      // pass output to creation function 
      createObject( formOutput );
      addObjectToSelect( formOutput.name, 'parent_select' );
      addObjectToSelect( formOutput.name, 'connect_select1' );
      addObjectToSelect( formOutput.name, 'connect_select2' );
   } 

   resetForm();
};

// Pause/Unpasue Button
// Function handler for clicking Pause button
document.getElementById( "pause" ).onclick = function () {
   var pause_button = document.getElementById( "pause" );
   if( ANIMATING ) {
      // transition to being paused
      pause_button.value = "Unpause";
      ANIMATING = false;
   } else {
      pause_button.value = "Pause";
      ANIMATING = true;
      animate( orbit );
   }
}

// Verifies the input of a object connect form
function consumeObjectConnectForm() {
   var select1 = document.getElementById( "connect_select1" );
   var select2 = document.getElementById( "connect_select2" );  
   var obj1_key = select1.value;
   var obj2_key = select2.value;

   if( !objectExists( obj1_key ) || !objectExists( obj2_key ) ) {
      return "Object(s) did not exist. Failed to connect them."; 
   }  

   if( obj1_key == obj2_key ) {
      return "Cannot connect object to itself.";
   }

   var pair = [ CEL_OBJS[ obj1_key ], CEL_OBJS[ obj2_key ] ];
  
   return pair; 
} 

// Connect function handler that is called whenever the connect button is clicked.
// Consumes information from the two drop-down option selectors.
document.getElementById( "connect" ).onclick = function () {
   var formOutput = consumeObjectConnectForm(); 
   if( typeof formOutput === 'string' || formOutput instanceof String ) {
      // Display error message
      alert( formOutput );
   } else {
      // Add two objects in drop-down selects as a new pair in the CONNECTED_OBJS
      CONNECTED_OBJS.push( formOutput ); 
   }      
}


// IDEAS:
// 1. Implement a collision simulater that affects the speed of orbits.
// 2. spawn random objects that can collide and affect the orbit of planets.
// 3. implement an aesthetic function that can draw lines between planets orbiting
//       at differing speeds. The output should look like a cool circle pattern with 
//       little 'rays' or whatever all intersecting in a pettern in the middle of the circle
// 4. Figure out how to save lines in a data structure to be redrawn every canvas life-cycle
// 5. find a cool background
// 6. make the planets cast shadows?!
// 7. profit
// 8. Make some html buttons that allow a user to create thier own planets and stars and whatnot
