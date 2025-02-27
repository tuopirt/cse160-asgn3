// ColoredPoints.js
// Vertex shader program
var VSHADER_SOURCE = `
    precision mediump float;
    attribute vec4 a_Position;
    attribute vec2 a_UV;
    varying vec2 v_UV;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    void main() {
       gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
       //gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
       v_UV = a_UV;
    }`

// Fragment shader program
var FSHADER_SOURCE =`
    precision mediump float;
    varying vec2 v_UV;
    uniform vec4 u_FragColor;
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1; //more textures added later on
    uniform sampler2D u_Sampler2;
    uniform sampler2D u_Sampler3;
    uniform int u_whichTexture;
    void main() {

      if (u_whichTexture == -2) {
        gl_FragColor = u_FragColor;                 //use color
      } else if (u_whichTexture == -1) {
        gl_FragColor = vec4(v_UV, 1.0, 1.0);                 //use uv debug color
      } else if (u_whichTexture == 0) {
        gl_FragColor = texture2D(u_Sampler0, v_UV);                 //use texture               DUP       //sky
      } else if (u_whichTexture == 1) {
        gl_FragColor = texture2D(u_Sampler1, v_UV);         //ground
      }else if (u_whichTexture == 2) {
        gl_FragColor = texture2D(u_Sampler2, v_UV);         //wall
      }else if (u_whichTexture == 3) {
        gl_FragColor = texture2D(u_Sampler3, v_UV);         //diamond
      }else {
        gl_FragColor = vec4(1, 0.2, 0.2, 1);                 //error redish
      }

    }`



//globals
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;           // dup    //sky
let u_whichTexture;

let u_Sampler1; //ground
let u_Sampler2; //wall
let u_Sampler3; //diamond

var g_camera = new Camera();


//start webGL
function setupWebGL() {
    // Get the canvas element and WebGL rendering context
    canvas = document.getElementById('example');

    //changing this so it doesnt lag
    //gl = getWebGLContext(canvas);
    gl = canvas.getContext('webgl', { preserveDrawingBuffer: true});
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    gl.enable(gl.DEPTH_TEST);
    
}

//Initialize shaders
function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return false;
    }

    // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return false;
    }

    // Get the storage location of a_UV
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
        console.log('Failed to get the storage location of a_UV');
        return false;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return false;
    }


    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return false;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return false;
    }

    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log('Failed to get the storage location of u_ViewMatrix');
        return false;
    }

    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
        console.log('Failed to get the storage location of u_ProjectionMatrix');
        return false;
    }

      // Get the storage location of u_Sampler      //dup this for more
    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler0) {
      console.log('Failed to get the storage location of u_Sampler0');
      return false;
    }

    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture) {
      console.log('Failed to get the storage location of u_whichTexture');
      return false;
    }

    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler1) {
      console.log('Failed to get the storage location of u_Sampler1');
      return false;
    }

    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
    if (!u_Sampler2) {
      console.log('Failed to get the storage location of u_Sampler2');
      return false;
    }

    u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
    if (!u_Sampler3) {
      console.log('Failed to get the storage location of u_Sampler3');
      return false;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}


let g_moveleg = 0;
let g_legAng = 0;
let g_anime = 0;
let g_globalAng = 0;
let g_yellowAnime = false;


//passes for HTML
function forHTML(){
  //moves leg
  document.getElementById('moveLegSlide').addEventListener('mousemove', function() { g_moveleg = this.value; RenderShapes(); });
  
  //camera
  document.getElementById('angSlide').addEventListener('mousemove', function() { g_globalAng = this.value; RenderShapes(); });

  //animate
  document.getElementById('animeOn').onclick = function() {g_anime = true};
  document.getElementById('animeOff').onclick = function() {g_anime = false};

}

//start diff textures
function initTextures() {
  // Create the image object
  var image = new Image();
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }
  // Register the event handler to be called when image loading is completed
  image.onload = function(){ sendTextureToTEXTURE0(image); };
  // Tell the browser to load an Image
  image.src = 'sky.jpg';

  //add more texture later TEXTURE1 instead of TEXTURE0
  //image.onload = function(){ sendTextureToTEXTURE1(image); };
  // src
  //image.src = 'sky.jpg';

  var image1 = new Image();
  if (!image1) {
    console.log('Failed to create the image object');
    return false;
  }
  image1.onload = function(){ sendTextureToTEXTURE1(image1); };
  image1.src = 'grass2.png';


  var image2 = new Image();
  if (!image2) {
    console.log('Failed to create the image object');
    return false;
  }
  image2.onload = function(){ sendTextureToTEXTURE2(image2); };
  //image2.src = 'stone.jpg';
  image2.src = 'stone.jpg';



  var image3 = new Image();
  if (!image3) {
    console.log('Failed to create the image object');
    return false;
  }
  image3.onload = function(){ sendTextureToTEXTURE3(image3); };
  image3.src = 'diamond.png';




  return true;
}



//dup this for more textures later
function sendTextureToTEXTURE0(image) {
  // Create a texture object
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image Y coordinate
  // Activate texture unit0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameter
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  // Set the image to texture
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler0, 0);
  
  console.log("finished loading Texture0");
}



function sendTextureToTEXTURE1(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  //change gl.TEXTUREx
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  //change u_Samplerx, x
  gl.uniform1i(u_Sampler1, 1);

  console.log("finished loading Texture1");
}

function sendTextureToTEXTURE2(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  //change gl.TEXTUREx
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  //change u_Samplerx, x
  gl.uniform1i(u_Sampler2, 2);

  console.log("finished loading Texture2");
}


function sendTextureToTEXTURE3(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  //change gl.TEXTUREx
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  //change u_Samplerx, x
  gl.uniform1i(u_Sampler3, 3);

  console.log("finished loading Texture3");
}


let LOCK = false;

// main
function main() {
    //startups
    setupWebGL();

    connectVariablesToGLSL();

    forHTML();

    document.onkeydown = keydown;

    initTextures();

    //Mousem move
    mouseMove();

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
    requestAnimationFrame(tick);
  }


  //mouse move camera
  function mouseMove() {
    //click to use/unuse
    canvas.onclick = function() {
      if (!LOCK) {
          canvas.requestPointerLock();
      } else {
          document.exitPointerLock();
      }
    };
    document.addEventListener("pointerlockchange", function () {
      LOCK = document.pointerLockElement === canvas;
    });

    //not locked
    document.addEventListener("mousemove", function (event) {
      if (LOCK) {
          g_camera.mouseLook(event.movementX, event.movementY);
          RenderShapes();
      }
    });
  }




  var g_startTime = performance.now()/1000.0;
  var g_seconds = performance.now()/1000.0-g_startTime;
  function tick(){
    g_seconds = performance.now()/1000.0-g_startTime;

    updateAnimeAng();

    RenderShapes();

    requestAnimationFrame(tick);
  }
  

  let leg1ang = 30;
  let leg2ang = 0;
  let leg3ang = -30;
  let leg4ang = -30;
  let leg5ang = 0;
  let leg6ang = 30;

  let legsang1 = 0;
  let legsang2 = 0;
  let legsang3 = 0;
  //animating our creature
  function updateAnimeAng() {
    if (g_anime){
      leg1ang = (12*Math.sin(2.1*g_seconds))+30;
      leg2ang = (7*Math.sin(g_seconds+2));
      leg3ang = (8*Math.sin(2*g_seconds+1))-32;

      leg4ang = (12*Math.sin(2.1*g_seconds+2))-30;
      leg5ang = (7*Math.sin(g_seconds));
      leg6ang = (8*Math.sin(2*g_seconds+1))+32;

      legsang1 = (4*Math.sin(3*g_seconds))+2;
      legsang2 = (4*Math.sin(3*g_seconds+2));
      legsang3 = (4*Math.sin(3*g_seconds+1))-2;
    }
  }




  var g_eye = [0,0,3];
  var g_at = [0,0,-100];
  var g_up = [0,1,0];


  //read key inputs
  function keydown(ev){
    if (ev.keyCode==68) { //right
      //g_eye[0] += 0.2;
      g_camera.right();
    } else if (ev.keyCode==65) { //left
      //g_eye[0] -= 0.2;
      g_camera.left();
    } else if (ev.keyCode==83) { //back
      //g_eye[2] += 0.2;
      g_camera.backward();
    } else if (ev.keyCode==87) { //for
      //g_eye[2] -= 0.2;
      //console.log("pre",g_camera.at.elements);
      g_camera.forward();
    

    } else if (ev.keyCode==32) { //up
      g_camera.upward();
    } else if (ev.keyCode==16) { //down
      console.log(
        g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2],  
        g_camera.at.elements[0],  g_camera.at.elements[1],  g_camera.at.elements[2],
        g_camera.up.elements[0],  g_camera.up.elements[1],  g_camera.up.elements[2]
      );
      g_camera.downward();


    } else if (ev.keyCode==69) { //pan right
      console.log("panRight");
      g_camera.panRight();
    } else if (ev.keyCode==81) { //pan left
      console.log("panLeft");
      g_camera.panLeft();
    }




    RenderShapes();
    //console.log(ev.keyCode);
  }


  

  // var g_map =[
  //   [1,1,1,1,1,1,1,1],
  //   [1,0,0,0,0,0,0,1],
  //   [1,0,0,0,0,0,0,1],
  //   [1,0,0,1,1,0,0,1],
  //   [1,0,0,0,0,0,0,1],
  //   [1,0,0,0,0,0,0,1],
  //   [1,0,0,0,1,0,0,1],
  //   [1,0,0,0,0,0,0,1],
  // ];
  // function drawMap() {  //1 = wall
    
  //   for (x=0;x<8;x++){
  //     for (y=0;y<8;y++){
  //       if (g_map[x][y]==1){
  //         var wall = new Cube();
  //         wall.textureNum = 2;
  //         wall.color = [1.0,1.0,1.0,1.0];
  //         wall.matrix.translate(x-4,-0.75,y-4);
  //         wall.renderfast();
  //       }
  //     }
  //   }
  // }

  var g_map = [
    [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
    [0,0,0,4,0,0,0,4,0,0,0,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,0,4],
    [0,0,0,4,4,0,4,4,0,4,4,0,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,4],
    [4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,4],
    [4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4],
    [4,0,0,0,0,0,4,0,0,0,0,0,4,0,0,0,0,0,4,0,0,0,0,0,4,0,0,0,0,0,0,4],
    [4,4,0,4,4,0,4,4,0,4,4,0,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,4],
    [4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,4],
    [4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4],
    [4,0,0,0,0,0,4,0,0,0,0,0,4,0,0,0,0,0,4,0,0,0,0,0,4,0,0,0,0,0,0,4],
    [4,4,0,4,4,0,4,4,0,4,4,0,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,4],
    [4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,4],
    [4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4],
    [4,0,0,0,0,0,4,0,0,0,0,0,4,0,0,0,0,0,4,0,0,0,0,0,4,0,0,0,0,0,0,4],
    [4,4,0,4,4,0,4,4,0,4,4,0,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,4],
    [4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,4],
    [4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,4,4,0,0,0],
    [4,0,0,0,0,0,4,0,0,0,0,0,4,0,0,0,0,0,4,0,0,0,0,0,4,0,0,0,0,0,0,0],
    [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4]
  ];

  function drawMap() {
    for (x = 0; x < g_map.length; x++) {
      for (y = 0; y < g_map[x].length; y++) {
        let height = g_map[x][y];
        if (height > 0) {
        //if(g_map[x][y] > 0){
          for (h = 0; h < height; h++) { // Stack cube
            var wall = new Cube();
            wall.textureNum = 2;
            wall.color = [1.0, 1.0, 1.0, 1.0];
            wall.matrix.translate(0,-0.75,0);
            wall.matrix.scale(0.4,0.4,0.4);
            wall.matrix.translate(x - 16, h, y - 16);
            wall.renderfast();
          }
        }
      }
    }
  }

  //renders our point
  function RenderShapes(){
    //projection Matrix (this is like the video setting)
    var projMat = new Matrix4();
    projMat.setPerspective(60, canvas.width/canvas.height, 0.1, 100); //(degree, aspect ratio, nearplane)
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

    //view Matrix (this is like the camera)
    var viewMat = new Matrix4();
    //viewMat.setLookAt(0,0,1, 0,0,-100, 0,1,0); //(eye, at, up) (where we are (x,y,z)(-L+R,+U-D,+B-F), where we looking at (origin in this case), up (y? cam ang?))
    //viewMat.setLookAt(g_eye[0],g_eye[1],g_eye[2], g_at[0],g_at[1],g_at[2], g_up[0],g_up[1],g_up[2]);
    viewMat.setLookAt(
      g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2],  
      g_camera.at.elements[0],  g_camera.at.elements[1],  g_camera.at.elements[2],
      g_camera.up.elements[0],  g_camera.up.elements[1],  g_camera.up.elements[2]);
    // viewMat.setLookAt(
    //   g_camera.eye.x, g_camera.eye.y, g_camera.eye.z,
    //   g_camera.at.x, g_camera.at.y, g_camera.at.z,
    //   g_camera.up.x, g_camera.up.y, g_camera.up.z);


    // console.log(g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2], 
    //             g_camera.at.elements[0], g_camera.at.elements[1], g_camera.at.elements[2], 
    //             g_camera.up.elements[0], g_camera.up.elements[1], g_camera.up.elements[2]
    // );

    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

    //global rotation
    var globalRotMat = new Matrix4().rotate(g_globalAng,0,1,0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawMap();

    //ground
    var floor = new Cube();
    floor.color = [1.0,0.0,0.0,1.0];
    //set this
    floor.textureNum = 1;
    floor.matrix.translate(0,-0.75,0.0);
    floor.matrix.scale(25,0.1,25);
    floor.matrix.translate(-0.5,0,-0.5);
    floor.renderfast();

    //sky
    var sky = new Cube();
    sky.color = [1.0,0.0,0.0,1.0];
    //set this
    sky.textureNum = 0;
    sky.matrix.scale(50,50,50);
    sky.matrix.translate(-0.5,-0.5,-0.5);
    sky.renderfast();

    //treasure
    var tre = new Cube();
    tre.textureNum = 3;
    tre.matrix.translate(-6.1,-0.7,-8.2);
    tre.renderfast();














    // //head
    // var head = new Cube();
    
    // //head.color = [0.23529411764705882, 0.2, 0.17254901960784313, 1.0];
    // head.color = [0.36470588235294116, 0.17254901960784313, 0.058823529411764705,1.0];
    // //x y z:-for+back

    // //SET WHICH TEXTURE
    // head.textureNum = 0;
    // head.matrix.translate(-0.2,-0.4,-0.65);
    // head.matrix.scale(0.4,0.4,0.4);
    // head.render();

    // //body
    // var body = new Cube();
    // body.color = [0.2784313725490196, 0.10588235294117647, 0.10980392156862745,1.0];
    // body.matrix.translate(-0.145,-0.35,-0.25);
    // body.matrix.scale(0.29,0.295,0.3);
    // body.render();

    // //torsol
    // var tor = new Cube();
    // tor.color = [0.23137254901960785, 0.1450980392156863, 0.10588235294117647,1.0];
    // tor.matrix.translate(-0.24,-0.4,0.05);
    // tor.matrix.scale(0.48,0.4,0.65);
    // tor.render();

    // //left side legs
    // var leg1 = new Cube();
    // leg1.color = [0.3215686274509804, 0.13333333333333333, 0.027450980392156862,1.0];
    // leg1.matrix.translate(0.17,-0.28,-0.15);
    // leg1.matrix.rotate(15,0,0,1);
    // //leg1.matrix.rotate(30,0,1,0);
    // leg1.matrix.rotate(leg1ang,0,1,0);
    // leg1.matrix.rotate(g_moveleg,0,0,1);
    // var leg1pos = new Matrix4(leg1.matrix);
    // leg1.matrix.scale(0.3,0.1,0.1);
    // leg1.render();
    // //small
    // var leg1smal = new Cube();
    // leg1smal.color = [0.5058823529411764, 0.23921568627450981, 0.11372549019607843,1.0];
    // leg1smal.matrix = leg1pos;
    // leg1smal.matrix.translate(0.25,-0.36,0.015);
    // leg1smal.matrix.scale(0.07,0.4,0.07);
    // leg1smal.matrix.rotate(legsang1,0,0,1);
    // leg1smal.render();
    

    // var leg2 = new Cube();
    // leg2.color = [0.3215686274509804, 0.13333333333333333, 0.027450980392156862,1.0];
    // leg2.matrix.translate(0.1,-0.28,-0.15);
    // leg2.matrix.rotate(15,0,0,1);
    // //leg2.matrix.rotate(0,0,1,0);
    // leg2.matrix.rotate(leg2ang,0,1,0);
    // leg2.matrix.rotate(g_moveleg,0,0,1);
    // var leg2pos = new Matrix4(leg2.matrix);
    // leg2.matrix.scale(0.3,0.1,0.1);
    // leg2.render();
    // //small
    // var leg2smal = new Cube();
    // leg2smal.color = [0.5058823529411764, 0.23921568627450981, 0.11372549019607843,1.0];
    // leg2smal.matrix = leg2pos;
    // leg2smal.matrix.translate(0.25,-0.36,0.015);
    // leg2smal.matrix.scale(0.07,0.4,0.07);
    // leg2smal.matrix.rotate(legsang2,0,0,1);
    // leg2smal.render();


    // var leg3 = new Cube();
    // leg3.color = [0.3215686274509804, 0.13333333333333333, 0.027450980392156862,1.0];
    // leg3.matrix.translate(0.1,-0.28,-0.15);
    // leg3.matrix.rotate(15,0,0,1);
    // //leg3.matrix.rotate(-30,0,1,0);
    // leg3.matrix.rotate(leg3ang,0,1,0);
    // leg3.matrix.rotate(g_moveleg,0,0,1);
    // var leg3pos = new Matrix4(leg3.matrix);
    // leg3.matrix.scale(0.3,0.1,0.1);
    // leg3.render();
    // //small
    // var leg3smal = new Cube();
    // leg3smal.color = [0.5058823529411764, 0.23921568627450981, 0.11372549019607843,1.0];
    // leg3smal.matrix = leg3pos;
    // leg3smal.matrix.translate(0.25,-0.36,0.015);
    // leg3smal.matrix.scale(0.07,0.4,0.07);
    // leg3smal.matrix.rotate(legsang3,0,0,1);
    // leg3smal.render();



    // //right side legs
    // var leg4 = new Cube();
    // leg4.color = [0.3215686274509804, 0.13333333333333333, 0.027450980392156862,1.0];
    // leg4.matrix.translate(-0.12,-0.17,-0.15);
    // leg4.matrix.rotate(165,0,0,1);
    // //leg4.matrix.rotate(-30,0,1,0);
    // leg4.matrix.rotate(leg4ang,0,1,0);
    // leg4.matrix.rotate(-g_moveleg,0,0,1);
    // var leg4pos = new Matrix4(leg4.matrix);
    // leg4.matrix.scale(0.3,0.1,0.1);
    // leg4.render();
    // // small
    // var leg4smal = new Cube();
    // leg4smal.color = [0.5058823529411764, 0.23921568627450981, 0.11372549019607843,1.0];
    // leg4smal.matrix = leg4pos;
    // leg4smal.matrix.translate(0.25,0.05,0.015);
    // leg4smal.matrix.scale(0.07,0.4,0.07);
    // leg4smal.matrix.rotate(legsang2,0,0,1);
    // leg4smal.render();


    // var leg5 = new Cube();
    // leg5.color = [0.3215686274509804, 0.13333333333333333, 0.027450980392156862,1.0];
    // leg5.matrix.translate(-0.12,-0.17,-0.15);
    // leg5.matrix.rotate(165,0,0,1);
    // //leg5.matrix.rotate(0,0,1,0);
    // leg5.matrix.rotate(leg5ang,0,1,0);
    // leg5.matrix.rotate(-g_moveleg,0,0,1);
    // var leg5pos = new Matrix4(leg5.matrix);
    // leg5.matrix.scale(0.3,0.1,0.1);
    // leg5.render();
    // // small
    // var leg5smal = new Cube();
    // leg5smal.color = [0.5058823529411764, 0.23921568627450981, 0.11372549019607843,1.0];
    // leg5smal.matrix = leg5pos;
    // leg5smal.matrix.translate(0.25,0.05,0.015);
    // leg5smal.matrix.scale(0.07,0.4,0.07);
    // leg5smal.matrix.rotate(legsang3,0,0,1);
    // leg5smal.render();


    // var leg6 = new Cube();
    // leg6.color = [0.3215686274509804, 0.13333333333333333, 0.027450980392156862,1.0];
    // leg6.matrix.translate(-0.12,-0.17,-0.15);
    // leg6.matrix.rotate(165,0,0,1);
    // //leg6.matrix.rotate(30,0,1,0);
    // leg6.matrix.rotate(leg6ang,0,1,0);
    // leg6.matrix.rotate(-g_moveleg,0,0,1);
    // var leg6pos = new Matrix4(leg6.matrix);
    // leg6.matrix.scale(0.3,0.1,0.1);
    // leg6.render();
    // // small
    // var leg6smal = new Cube();
    // leg6smal.color = [0.5058823529411764, 0.23921568627450981, 0.11372549019607843,1.0];
    // leg6smal.matrix = leg6pos;
    // leg6smal.matrix.translate(0.25,0.05,0.015);
    // leg6smal.matrix.scale(0.07,0.4,0.07);
    // leg6smal.matrix.rotate(legsang1,0,0,1);
    // leg6smal.render();

  }
  





  //convert hex code to our color code
  function HextoColor() {
    var hexInput = document.getElementById("hexInput").value.trim();
    // Convert hex to RGB
    var r = parseInt(hexInput.slice(1, 3), 16) / 255;
    var g = parseInt(hexInput.slice(3, 5), 16) / 255;
    var b = parseInt(hexInput.slice(5, 7), 16) / 255;

    // Update our global var
    g_selectedColor = [r, g, b, 1.0];
    console.log(r,g,b);
  } 






  
 //on click command
 function click(ev) {
  [x, y] = CoordtoGL(ev)  

  //call which class based on selected pens
  let point;
  if ( g_selectedType == POINT) {
    point = new Point();
  } else if ( g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else {
    point = new Circle();
    //new setting for circle
    point.segments = g_segmentSize;
  }

  //setting position, color, size setting for our current point
  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;

  //add to list
  g_shapesList.push(point);

  RenderShapes(); //render the point
}
  
  
//getting the coord
function CoordtoGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  return([x, y])
}


//References:
// GPT for calcualting mouse move camera