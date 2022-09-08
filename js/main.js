// TODO - FUTURE WORK
// 		ADD CHANING COLORS OVER TIME TO CAROUSEL
//      ADD CAMPFIRE PARTICLES LIFE TIME (custom shader - increase/decrease alpha value to create fade out effect)
//      ADD CAMPFIRE PARTICLES RECYCLING IF LIFETIME IS IMPLEMENTED
// 		ADD BOUNDINGBOXES FOR GRASS AND STONES WITH REST OF OBJECTS, RIGHT NOW IT'S ONLY INTERNAL
// 		 	(e.g., stone vs stone -> not allowed, grass vs grass -> not allowed, grass vs stone -> allowed)
// 		ADD CHANGING FIREFLIES COLOR TO GUI
// 			https://stackoverflow.com/questions/60879998/three-js-fragment-shader-with-ambient-light-intensity
// 		ADD FOG ENABLE FEATURE TO GUI
//		ADD STONE FENCE/PATH? AT THE ENTRANCE OF THE HOUSE AREA
// 	    ADD SECOND DIRECTIONAL LIGHT AND SIMULATE REAL TIME SHADOWS
// 		ADD MORE RANDOMISATION IN CLOUDS ANIMATION
// 		MAKE A BIG CONTAINER FOR ALL GROUND OBJECTS IN THE FOREST
// 		MAKE CAROUSEL FERRIES SOFT OBJECTS
// 		GROUP MATERIALS UNDER PREPARED SECTION
// 		ADD FOG CUSTOM SHADER?
// 			https://www.youtube.com/watch?v=k1zGz55EqfU&ab_channel=SimonDev
// 		REPLACE CAMPFIRE LIGHT WITH AREA LIGHT?
// 		ADD SNOW
// 		CHANGE ORBIT CONTROL TO BE MORE USER FRIENDLY
// 		ADD "APP SETTINGS" IN GUI (e.g., lower shadow resolutions, etc...)
// 		ADD POSTPROCESSING EFFECT?
// 		ADD OTHER OBJECTS: Rollercoaster, Fountain, Stone path, Flowers
// 		ADD AUDIO OR SHORT ANIMATION ON CLICK TO CAT AND PUG

// ########################################################################################################

// CUSTOM SHADER MATERIALS

// Resources - TO IGNORE
// https://stackoverflow.com/questions/50965644/glsl-shader-to-boost-the-color/50968125#50968125
// https://stackoverflow.com/questions/60879998/three-js-fragment-shader-with-ambient-light-intensity
// https://stackoverflow.com/questions/53879537/increase-the-intensity-of-texture-in-shader-code-opengl
// https://www.youtube.com/watch?v=C8Cuwq1eqDw&t=86s&ab_channel=SimonDev
// https://www.youtube.com/watch?v=OFqENgtqRAY&ab_channel=SimonDev

// ##########################################

// FIREFLIES

// https://threejs.org/examples/#webgl_buffergeometry_custom_attributes_particles
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_buffergeometry_custom_attributes_particles.html

// Vertex shader
const FIREFLIES_VS = `

//varying vec3 v_Normal; // for debugging, visualise normals of an object

uniform float uPixelRatio; // viewing setting
uniform float uSize; // size of fireflies
attribute float aScale; // attribute of firefly geometry, used to randomise scaling
uniform float uTime; // animating particles

attribute float rFade; // attribute, used to randomise fading
varying float fFade; // passing it to the fragment shader using the varying keyword

void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    // Animating the fireflies
    // 1) sin: up and down
    // 2) .x * 100: to offset the value
    // 3) aScale: small fireflies will move less
    // 4) 0.8: reduce general amplitutde
    modelPosition.y += sin(uTime + modelPosition.x * 0.10) * aScale * 0.8;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    //gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionPosition;
    gl_PointSize = uSize * uPixelRatio * aScale; // controlling the size of the particles
    gl_PointSize *= (100.0 / - viewPosition.z);

    fFade = rFade;
}
`;

// Fragment shader
const FIREFLIES_FS = `

//varying vec3 v_Normal; // for debugging, visualise normals of an object
varying float fFade; // used to randomise fading

void main()
{
	// Draw shiny point at the center of each point
	// calculate the distance between the center of the point (vec2(0.5)) and the UV coordinates
	float distanceToCenter = distance(gl_PointCoord, vec2(0.5));

	// Shininess strength
	//float strength = 0.05 / distanceToCenter;
	float strength = 0.01 / distanceToCenter - fFade;

	// color of the points
	vec3 pointColor = vec3(1.0, 1.0, 0.8);	// Yellowish color

	//gl_FragColor = vec4(v_Normal, 1.0);	// visualise normals of an object
    //gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);	// Show red square at points coords
    //gl_FragColor = vec4(gl_PointCoord, 1.0, 1.0);	// Show the UV coordinates of the points

    // View UV pattern
    //gl_FragColor = vec4(1.0, 1.0, 1.0, distanceToCenter);	// Use distanceToCenter as the alpha value

    // Doing this will still show the edges of the point, not only the shiny point in the middle
    // This is because the strength gets very low with distance but never reaches 0
    // To fix this we subtract a small value but big enough to make sure that the result
    // goes below 0.0 before reaching the edges
    gl_FragColor = vec4(pointColor, strength);
}
`;

// ##########################################

// CAMPFIRE

// Vertex shader
const FIRE_VS = `

uniform float uPixelRatio; // viewing setting
uniform float uSize; // size of fireflies
attribute float aScale; // attribute of firefly geometry, used to randomise scaling
attribute vec3 colour; // retrieving the random colour attribute
varying vec4 vColour; // pass colour from vertex shader to fragment shader using the varying keyword
uniform float uTime; // uniform, continuously increasing, used for animating particles

void main()
{
	vec4 modelPosition = modelMatrix * vec4(position, 1.0);

	modelPosition.y += sin(uTime + modelPosition.x * 100.0)/aScale * 0.5;
	modelPosition.x += sin(uTime + modelPosition.y)/aScale * 0.2;
	modelPosition.z += sin(uTime + modelPosition.x)/aScale * 0.2;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;
    gl_PointSize = uSize * uPixelRatio * aScale; // controlling the size of the particles
    gl_PointSize *= (100.0 / - viewPosition.z);

    vColour = vec4(colour, 0.8); // transforming vec3 generated colour to vec4

}
`;

// Fragment shader
const FIRE_FS = `

uniform sampler2D pointTexture; // retrieving the point texture
varying vec4 vColour; // retrieving the random colour attribute

void main()
{
	// applying the texture to each XYZ point (gl_PointCoord)
	vec4 outTexture = texture2D(pointTexture, gl_PointCoord);

	// discarding fragments for which the alpha is low
	// https://coderedirect.com/questions/583475/three-js-custom-shader-and-png-texture-with-transparency
	if (outTexture.a < 0.5) discard;

	// Sample the texture + multiply the texture colour by the particles colour
	gl_FragColor = outTexture * vColour;

}
`;

// ########################################################################################################

// COLORS

// Resources - TO IGNORE
// https://i.pinimg.com/736x/fb/04/54/fb0454de8dcbc0a4d08e6807cbc9413b.jpg
// https://i.pinimg.com/originals/e2/6c/f1/e26cf1e0645046e7208b4b0c37ece4f3.png
// https://colorcodes.io/stone-color-codes/
// https://i.pinimg.com/736x/ef/b1/48/efb148eb2876a44ac38ab4c19b54fa53.jpg
// https://www.schemecolor.com/wp-content/themes/colorsite/include/cc5.php?color0=e0380a&color1=f48416&color2=f3cb21&color3=f6e221&color4=f8f558&pn=Bright%20Fire

// ##########################################

const colors = {
  green: 0x6c932e, // 0x59ac27, 0x6c932e, 0xA5C23A, 0x31772f
  darkMetal: 0x72636a,
  lightMetal: 0xdcbbb4,
  brownBrick: 0xffdba9,
  wood: 0xa76e17,
  brick: 0xd6b48e,
  roof: 0x783031,
  fog: 0xfdfcf7, // 0x80b6dc
  redBrick: 0x6e1e29,
  water: 0x52a5c1, // 0x1E6E63, 0x13463F, 0x007577, 0x13463F, 0x6EB7AE, 0x09846F, 0x2F6468
  glass: 0x86a3ac,
  dirt: 0x9b7653, // 0x4F3C2A, 0x9B7653
  pineGreen: 0x31772f, // 0x132408, 0x0A4920, 0x0D5B28, 0x21400F, 0x0A4920, 0x307853
  pineWood: 0x7e563b,
  fenceWood: 0xa58b57, // 0x543a27, 0xbca880
  blobWood: 0xa8734e,
  rockGrey: 0x716f6b,
  chimneyGrey: 0x5a564c, // 0x2D2B26
  benchGrey: 0x716f6b,
  grassGreen: 0x396e19, // 0x2e4a1e, 0x478A1F
  fireRed: 0xe0380a,
  fireOrange: 0xf48416,
  fireDarkYellow: 0xf3cb21,
  white: 0xfdfcf7,
  black: 0x424242,
  carouselPastel: 0x8094bd,
};

const airplaneColors = [
  0xff0000, // Red
  0xff6d0c, // Orange
  0x00f981, // Green
  0x0d5668, // Dark water blue
  0xe8375d, // Pink
];

const treeLeavesColors = [
  0x6a241a, // Kenyan Copper
  0xe1ac46, // Urobilin
  0x982912, // Dark Pastel Red
];

// ########################################################################################################

// Material Resources - TO IGNORE
// http://stemkoski.github.io/Three.js/Color-Explorer.html
// https://github.com/mrdoob/three.js/tree/dev/examples/textures
// https://threejs.org/docs/#api/en/textures/CubeTexture

// ########################################################################################################

// LIGHT PARAMETERS

// sunrise, midday, sunset, midnight

const lightParams = {
  sunrise: {
    hemisphereLight: {
      intensity: 0.6,
    },
    ambientLight: {
      intensity: 0.3,
    },
    sunLight: {
      intensity: 0.75,
      position: [630, 760, -110],
      color: 0xffba87,
    },
  },

  midday: {
    hemisphereLight: {
      intensity: 0.65,
    },
    ambientLight: {
      intensity: 0.3,
    },
    sunLight: {
      intensity: 0.55,
      position: [-280, 695, 350],
      color: 0xffe1a3,
    },
  },

  sunset: {
    hemisphereLight: {
      intensity: 0.6,
    },
    ambientLight: {
      intensity: 0.3,
    },
    sunLight: {
      intensity: 0.75,
      position: [-290, 760, 900],
      color: 0xffba87,
    },
  },

  midnight: {
    hemisphereLight: {
      intensity: 0.08,
    },
    ambientLight: {
      intensity: 0.08,
    },
    sunLight: {
      intensity: 0.05,
      position: [-420, 800, 370],
      color: 0xeeeeee,
    },
  },
};

// ########################################################################################################

// GENERAL SETTINGS AND SCENE INITIALISATION

// Resources - TO IGNORE
// https://stackoverflow.com/questions/37200019/how-to-get-elements-clientx-and-clienty-of-an-element
// https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.2
// https://stackoverflow.com/questions/58430277/three-js-antialiasing-rendering-fxaa
// https://stackoverflow.com/questions/69962432/when-do-we-need-to-use-renderer-outputencoding-three-srgbencoding
// https://discourse.threejs.org/t/what-aa-method-does-antialias-true-use/15146
// https://github.com/mrdoob/three.js/blob/master/examples/js/controls/OrbitControls.js

// ##########################################

// Display settings
let W = window.innerWidth;
let H = window.innerHeight;

// Create the scene
let scene = new THREE.Scene();
// enable fog
//scene.fog = new THREE.Fog(colors.fog, 250, 1100);

// ##########################################

// Create the camera

// camera settings
let aspectRatio = W / H;
const fieldOfView = 50;
const nearPlane = 1;
const farPlane = 1000;
// perspective projection (Vertical FOV, Aspect Ratio, Near/Front Clipping Plane,
//                              Back Clipping Plane)
let camera = new THREE.PerspectiveCamera(
  fieldOfView,
  aspectRatio,
  nearPlane,
  farPlane
);
// camera position relative to the scene
camera.position.set(0, 100, 300);
camera.lookAt(0, 0, 0);
//camera.position.set(0, 50, 100); // for debugging
camera.rotation.set(-0.2, 0, 0);
// "fixed camera" view
// mouse cursor 2D coordinates, XY
const pointer = {
  x: 0, // -1..1
  y: 0,
};
let easing = 0.03; // easing of the movement
// on mouse move, calculate pointer.x and pointer.y using
// clientX and clientY (position of cursor based on browser window)
document.addEventListener("mousemove", ({ clientX, clientY }) => {
  pointer.x = -1 + (clientX / W) * 2;
  pointer.y = 1 - (clientY / H) * 2;
});

// ##########################################

// Create the renderer

// renderer settings
const container = document.getElementById("scene");
const canvas = container.querySelector("canvas");
var renderer = new THREE.WebGLRenderer({
  canvas, // connecting to the canvas
  antialias: true, // MSAA
  alpha: true,
  // prioritise rendering performance over power consumption on multiple GPUs systems,
  // "bad" on mobile devices, power consumption
  //powerPreference: 'high-performance',
});
// render at the resolution of the device/use the full resolution of the display
renderer.setPixelRatio(window.devicePixelRatio);
// size of the 2D projection
renderer.setSize(W, H);
// improving textures colors
// convert the final color value from linear to sRGB color space
//renderer.outputEncoding = THREE.sRGBEncoding;

// handling resizing

window.addEventListener(
  "resize",
  () => {
    W = window.innerWidth;
    H = window.innerHeight;

    renderer.setSize(W, H);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  },
  false
);

// ##########################################

// Shadowing settings

renderer.shadowMap.enabled = true;
// renderer.shadowMap.renderReverseSided = true
//renderer.shadowMap.type = THREE.PCFShadowMap;
// The shadowing for this kind of scene was really problematic.
// PCFSoftShadowMap created what are known as artifacts whenever
// an excessive zoom was used (e.g., zooming on the house's roof support)
// while using PCFShadowMap and a custom radius left the shadows look "blocky"
// and a higher shadow map was needed. I ended up using PCFSoftShadowMap, regardless
// of the artifacts, and played around with the shadow bias (just decreased by a small
// amount since I didn't want to encounter another shadowing problem - "peter-panning")
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ##########################################

// Create OrbitControls

var orbitControlsEnabled = false; // fixed view at the start
var controls;

// ########################################################################################################

// 3D OBJECTS AND SCENE CREATION - SETTINGS AND FUNCTIONS

// Resources - TO IGNORE

// ##########################################

// Boundaries

// NOTE:
// 		 This vars are used a lot across the entire project to place things.
// 		 The intention behind this is to make everything "flexible" in a
// 		 possible future work (e.g., add controls in GUI to let the user
// 		 control the size of different things - forest, terrain, etc -
// 		 and the number of objects to be spawned).

// terrain
var terrainDimension = 400;
var terrainBoundary = 10; // Min distance from border of terrain to objects
var terrainSpaceNegative = -terrainDimension / 2 + terrainBoundary;
var terrainSpacePositive = terrainDimension / 2 - terrainBoundary;
// home
var internalBoundary = 25; // space between forest and home space
var homeBoundaryNegative = -110;
var homeBoundaryPositive = 110;
var homeBoundaryPositiveWBoundaries = homeBoundaryPositive - internalBoundary;
var homeBoundaryNegativeWBoundaries = homeBoundaryNegative + internalBoundary;
// sky - clouds spawning space
var skyBoundaryNegative = -300;
var skyBoundaryPositive = 300;
// open space in the forest, entrance of the home area
var entranceNegative = -30;
var entrancePositive = 30;
// size of the fence door
var fenceDoorSize = 7; // smaller is bigger
// forest - trees, stones, grass, fireflies spawning space
var forestBoundaryNegative = terrainSpaceNegative;
var forestBoundaryPositive = terrainSpacePositive;

// ##########################################

// Number of objects to be spawned

// NOTE:
//		 Due to the implementation of boundary boxes to prevent objects spawning
// 		 in the same place, the number of objects declared here will be 99% of
//     the times higher than the actual amount of objects that have been spawned.

// number of stones
var numStones = 45;
// number of clouds
var numClouds = 100;
// number of trees
var numTrees = 65;
// number of firefly colonies
var numFireflyColonies = 2;
// number of grass to be spawned
var numGrass = 100;

// ##########################################

// Textures (optimisation, we load everything only once!)
const loader = new THREE.TextureLoader();
const gltfLoader = new THREE.GLTFLoader();

// "static" water - "fluid" (we load it before lake terrain - just to avoid
// letting the user see the map without the water)
// FUTURE WORK: ADD ALPHAMAP + ENVMAP?
//const waterTexture = loader.load("/textures/watertexture.png");
//const waterSpecularMap = loader.load("/textures/waterspecular.png");
const waterDisplacementMap = loader.load("/textures/waterdisplacementmap.png");
//const waterDisplacementMap = loader.load("/textures/waterbumpmap.png");
// repeat texture horizontally and vertically (+ other textures too)
//waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;
//waterTexture.repeat.set(1, 1); // 5 horizontal repetitions, 1 vertical one
//waterTexture.offset.set(0, 1);
// water texture settings
waterDisplacementMap.wrapS = waterDisplacementMap.wrapT = THREE.RepeatWrapping;
waterDisplacementMap.repeat.set(5, 10); // 1 horizontal repetition, 5 vertical ones
waterDisplacementMap.offset.set(0.5, 0.5); // offset from horizontal, vertical

// lake terrain
// black = low, white = higher areas, will push it up
const lakeDisplacementMap = loader.load(
  "/textures/laketerraindisplacementmap.png"
);

// "Cube" flame texture
// https://www.planetminecraft.com/texture-pack/isometric-moon-cube/download/file/12709547/
const flameTexture = loader.load("textures/flame.png");

// ##########################################

// Helper functions

function randomRangeFloorInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function probability(n) {
  return !!n && Math.random() <= n;
}

// Spawn objects within terrain boundaries
function objectPlacer(groundType) {
  var pos;

  // Home
  if (groundType == "home") {
    // Add things within the home environment --
  }

  // Sky
  if (groundType == "sky") {
    pos = randomRangeFloorInclusive(skyBoundaryNegative, skyBoundaryPositive);
  }

  // Stones, rocks, trees
  if (groundType == "forest") {
    pos = randomRangeFloorInclusive(
      forestBoundaryNegative,
      forestBoundaryPositive
    );
  }

  return pos;
}

// objects positioning helper
function positioningHelper(coordX, coordZ) {
  var ok = false;

  // Back side
  if (coordZ < homeBoundaryNegativeWBoundaries - internalBoundary / 2)
    ok = true;

  // Left side
  if (coordX < homeBoundaryNegativeWBoundaries - internalBoundary / 2)
    ok = true;

  // Right side
  if (coordX > homeBoundaryPositiveWBoundaries + internalBoundary / 2)
    ok = true;

  // Front side + entrance space
  if (coordZ > homeBoundaryPositiveWBoundaries + internalBoundary / 2) {
    if (coordX < entranceNegative || coordX > entrancePositive) ok = true;
  }

  return ok;
}

// Change the lighting settings of the scene based on dayTime
function changeLights(dayTime) {
  // changing hemisphere light intensity
  hemisphereLight.intensity = lightParams[dayTime].hemisphereLight.intensity;
  // changing ambient light intensity
  ambientLight.intensity = lightParams[dayTime].ambientLight.intensity;

  // changing directional light intensity and color
  sunLight.intensity = lightParams[dayTime].sunLight.intensity;
  sunLight.color.setHex(lightParams[dayTime].sunLight.color);

  // if timelapse mode isn't selected in the GUI,
  // directly move the sunlight to the position set in lightParams
  if (!automaticDayLight)
    sunLight.position.set(...lightParams[dayTime].sunLight.position);

  // changing background based on daytime
  container.className = "scene " + dayTime;
  //console.log(container.className); // for debugging
}

// Update view from fixed to unlocked and viceversa, position reset
function updateCameraView() {
  if (!orbitControlsEnabled) {
    // Add mouse/camera controls
    // resetting mouse pointers
    pointer.x = 0;
    pointer.y = 0;
    // and resetting scene rotation
    scene.rotation.x = 0;
    scene.rotation.y = 0;

    controls = new THREE.OrbitControls(camera, canvas); // creating orbit controls
    controls.enableDamping = true; // stabiliser, sense of weight
    controls.dampingFactor = 1; // strength of inertia
    controls.screenSpacePanning = true; // camera pans in screen space
    //controls.target.set(0, 0, 0); // camera always looking at (0, 0, 0)
    controls.update();
    orbitControlsEnabled = true;
  } else {
    controls.dispose();
    //controls.enabled = false; // disabling orbit controls
    // resetting mouse pointers
    pointer.x = 0;
    pointer.y = 0;
    camera.position.set(0, 100, 300); // resetting camera position
    camera.lookAt(0, 0, 0); // look at (0, 0, 0), center of the scene
    orbitControlsEnabled = false;
  }
}

// TODO: MAKE MIDDLE PART MORE IRREGULAR
// TODO: SWAP MIN AND MAX POSITION. MORE JS LIKE
// Perform trees' trunk and campfire logs deformation
// Works only if the cylinder segmentation is:
// radialSegments = 8;
// heightSegmnents = 4
// THREE.CylinderGeometry(radiusTop, radiusBottom, height, 8, 4);
// fullDeformation = whether we want the entire trunk deformation or not
// if false, the trunk will be deformed only at the top and bottom sides (top, bottom)
// if true, the trunk will be deformed entirely (top, bottom, middle)
function getDeformedCylinder(
  geom,
  noise_max,
  noise_min,
  full_deformation = false,
  type = "default-trunk"
) {
  // Get vertices' positions (local coordinates)
  var positionAttribute = geom.getAttribute("position");
  // https://threejs.org/docs/#api/en/math/Vector3
  const objVertex = new THREE.Vector3(); // 3D vector to catch position of each vertex
  //console.log(positionAttribute.count)	// 79 vertices

  // Random noise array
  var noise = Array.from({ length: 17 }, () =>
    randomRange(noise_min, noise_max)
  );

  // Used in branches only
  // to perform tip deformation
  // one value could be used instead of 2
  // we use two to add more randomness -> natural look (top and bot side will look different)
  // the reason why we don't use the noise array is cause we want really small values
  var randomBranchTipTOP = randomRange(-0.05, 0.1);
  var randomBranchTipBOTTOM = randomRange(-0.05, 0.1);
  //console.log(randomBranchTipTOP, randomBranchTipBOTTOM)

  // Go through all vertices
  for (
    let vertexIndex = 0;
    vertexIndex < positionAttribute.count;
    vertexIndex++
  ) {
    // Accessing each vertex position
    objVertex.fromBufferAttribute(positionAttribute, vertexIndex);

    var xPos = objVertex.x;
    var yPos = objVertex.y;
    var zPos = objVertex.z;
    //console.log(vertexIndex, xPos, yPos, zPos);

    // IF NO FULL DEFORMATION,
    // MODIFY ONLY TOP AND BOTTOM SEGMENTS OF THE CYLINDER

    //if(full_deformation) {

    // bottom side
    // First vertices that connects the "round" shape together, we do not modify it
    if (vertexIndex == 44 || vertexIndex == 78) {
      //if(xPos == -2.4492937051703357e-16 && yPos == -3 && zPos == 1) {
    }

    if (vertexIndex == 42 || vertexIndex == 76) {
      //if(xPos == -1 && yPos == -3 && zPos == -1.8369701465288538e-16) {
      xPos += noise[1];
      //yPos += noise[1];
      zPos += noise[1];
    }

    if (vertexIndex == 40 || vertexIndex == 74) {
      //if(xPos == 1.2246468525851679e-16 && yPos == -3 && zPos == -1) {
      xPos += noise[2];
      //yPos += noise[2];
      zPos += noise[2];
    }

    if (vertexIndex == 38 || vertexIndex == 72) {
      //if(xPos == 1 && yPos == -3 && zPos == 6.123234262925839e-17) {
      xPos += noise[3];
      //yPos += noise[3];
      zPos += noise[3];
    }

    if (vertexIndex == 39 || vertexIndex == 73) {
      //if(xPos == 0.7071067690849304 && yPos == -3 && zPos == -0.7071067690849304) {
      xPos += noise[4];
      //yPos += noise[4];
      zPos += noise[4];
    }

    if (vertexIndex == 43 || vertexIndex == 77) {
      //if(xPos == -0.7071067690849304 && yPos == -3 && zPos == 0.7071067690849304) {
      xPos += noise[5];
      //yPos += noise[5];
      zPos += noise[5];
    }

    if (vertexIndex == 37 || vertexIndex == 71) {
      //if(xPos == 0.7071067690849304 && yPos == -3 && zPos == 0.7071067690849304) {
      xPos += noise[6];
      //yPos += noise[6];
      zPos += noise[6];
    }

    if (vertexIndex == 41 || vertexIndex == 75) {
      //if(xPos == -0.7071067690849304 && yPos == -3 && zPos == -0.7071067690849304) {
      xPos += noise[7];
      //yPos += noise[7];
      zPos += noise[7];
    }

    // Last vertices that connectes the "round" shape together, we do not modify it
    if (vertexIndex == 36 || vertexIndex == 70) {
      //if(xPos == 0 && yPos == -3 && zPos == 1) {
    }

    // top side
    // First vertices that connects the "round" shape together, we do not modify it
    if (vertexIndex == 8 || vertexIndex == 61) {
      //if(xPos == -2.4492937051703357e-16 && yPos == 3 && zPos == 1) {
    }

    if (vertexIndex == 6 || vertexIndex == 59) {
      //if(xPos == -1 && yPos == 3 && zPos == -1.8369701465288538e-16) {
      xPos += noise[8];
      yPos += noise[8];
      zPos += noise[8];
    }

    if (vertexIndex == 4 || vertexIndex == 57) {
      //if(xPos == 1.2246468525851679e-16 && yPos == 3 && zPos == -1) {
      xPos += noise[9];
      yPos += noise[9];
      zPos += noise[9];
    }

    if (vertexIndex == 2 || vertexIndex == 55) {
      //if(xPos == 1 && yPos == 3 && zPos == 6.123234262925839e-17) {
      xPos += noise[10];
      yPos += noise[10];
      zPos += noise[10];
    }

    if (vertexIndex == 5 || vertexIndex == 58) {
      //if(xPos == -0.7071067690849304 && yPos == 3 && zPos == -0.7071067690849304) {
      xPos += noise[11];
      yPos += noise[11];
      zPos += noise[11];
    }

    if (vertexIndex == 3 || vertexIndex == 56) {
      //if(xPos == 0.7071067690849304 && yPos == 3 && zPos == -0.7071067690849304) {
      xPos += noise[12];
      yPos += noise[12];
      zPos += noise[12];
    }

    if (vertexIndex == 7 || vertexIndex == 60) {
      //if(xPos == -0.7071067690849304 && yPos == 3 && zPos == 0.7071067690849304) {
      xPos += noise[13];
      yPos += noise[13];
      zPos += noise[13];
    }

    if (vertexIndex == 1 || vertexIndex == 54) {
      //if(xPos == 0.7071067690849304 && yPos == 3 && zPos == 0.7071067690849304) {
      xPos += noise[14];
      yPos += noise[14];
      zPos += noise[14];
    }

    // Last vertices that connectes the "round" shape together, we do not modify it
    if (vertexIndex == 0 || vertexIndex == 53) {
      //if(xPos == 0 && yPos == 3 && zPos == 1) {
    }

    //}

    // IF FULL DEFORMATION
    // MODIFY ALL 4 SEGMENTS OF THE CYLINDER

    // Main trunk appearance (middle vertices)
    if (full_deformation) {
      // middle part (y = 0) ++++++++++++++++++++++++++++++++++++++++++++
      if (vertexIndex == 26) {
        //if(xPos == -2.4492937051703357e-16 && yPos == 0 && zPos == 1) {
        xPos += noise[15];
        yPos += noise[15];
        zPos += noise[15];
      }

      if (vertexIndex == 24) {
        //if(xPos == -1 && yPos == 0 && zPos == -1.8369701465288538e-16) {
        xPos += noise[15];
        yPos += noise[15];
        zPos += noise[15];
      }

      if (vertexIndex == 22) {
        //if(xPos == 1.2246468525851679e-16 && yPos == 0 && zPos == -1) {
        xPos += noise[15];
        yPos += noise[15];
        zPos += noise[15];
      }

      if (vertexIndex == 20) {
        //if(xPos == 1 && yPos == 0 && zPos == 6.123234262925839e-17) {
        xPos += noise[15];
        yPos += noise[15];
        zPos += noise[15];
      }

      if (vertexIndex == 23) {
        //if(xPos == -0.7071067690849304 && yPos == 0 && zPos == -0.7071067690849304) {
        xPos += noise[15];
        yPos += noise[15];
        zPos += noise[15];
      }

      if (vertexIndex == 21) {
        //if(xPos == 0.7071067690849304 && yPos == 0 && zPos == -0.7071067690849304) {
        xPos += noise[15];
        yPos += noise[15];
        zPos += noise[15];
      }

      if (vertexIndex == 25) {
        //if(xPos == -0.7071067690849304 && yPos == 0 && zPos == 0.7071067690849304) {
        xPos += noise[15];
        yPos += noise[15];
        zPos += noise[15];
      }

      if (vertexIndex == 19) {
        //if(xPos == 0.7071067690849304 && yPos == 0 && zPos == 0.7071067690849304) {
        xPos += noise[15];
        yPos += noise[15];
        zPos += noise[15];
      }

      if (vertexIndex == 18) {
        //if(xPos == 0 && yPos == 0 && zPos == 1) {
        xPos += noise[15];
        yPos += noise[15];
        zPos += noise[15];
      }

      // top middle part (y = 1.5) ++++++++++++++++++++++++++++++++++++++++++++
      if (vertexIndex == 9) {
        //if(xPos == 0 && yPos == 1.5 && zPos == 1) {
        xPos += noise[16];
        yPos += noise[16];
        zPos += noise[16];
      }

      if (vertexIndex == 14) {
        //if(xPos == -0.7071067690849304 && yPos == 1.5 && zPos == -0.7071067690849304) {
        xPos += noise[16];
        yPos += noise[16];
        zPos += noise[16];
      }

      if (vertexIndex == 12) {
        //if(xPos == 0.7071067690849304 && yPos == 1.5 && zPos == -0.7071067690849304) {
        xPos += noise[16];
        yPos += noise[16];
        zPos += noise[16];
      }

      if (vertexIndex == 16) {
        //if(xPos == -0.7071067690849304 && yPos == 1.5 && zPos == 0.7071067690849304) {
        xPos += noise[16];
        yPos += noise[16];
        zPos += noise[16];
      }

      if (vertexIndex == 10) {
        //if(xPos == 0.7071067690849304 && yPos == 1.5 && zPos == 0.7071067690849304) {
        xPos += noise[16];
        yPos += noise[16];
        zPos += noise[16];
      }

      if (vertexIndex == 11) {
        //if(xPos == 1 && yPos == 1.5 && zPos == 6.123234262925839e-17) {
        xPos += noise[16];
        yPos += noise[16];
        zPos += noise[16];
      }

      if (vertexIndex == 13) {
        //if(xPos == 1.2246468525851679e-16 && yPos == 1.5 && zPos == -1) {
        xPos += noise[16];
        yPos += noise[16];
        zPos += noise[16];
      }

      if (vertexIndex == 15) {
        //if(xPos == -1 && yPos == 1.5 && zPos == -1.8369701465288538e-16) {
        xPos += noise[16];
        yPos += noise[16];
        zPos += noise[16];
      }

      if (vertexIndex == 17) {
        //if(xPos == -2.4492937051703357e-16 && yPos == 1.5 && zPos == 1) {
        xPos += noise[16];
        yPos += noise[16];
        zPos += noise[16];
      }

      // bottom middle part (y = -1.5) ++++++++++++++++++++++++++++++++++++++++++++
      if (vertexIndex == 27) {
        //if(xPos == 0 && yPos == -1.5 && zPos == 1) {
        xPos += noise[0];
        yPos += noise[0];
        zPos += noise[0];
      }

      if (vertexIndex == 30) {
        //if(xPos == 0.7071067690849304 && yPos == -1.5 && zPos == -0.7071067690849304) {
        xPos += noise[0];
        yPos += noise[0];
        zPos += noise[0];
      }

      if (vertexIndex == 34) {
        //if(xPos == -0.7071067690849304 && yPos == -1.5 && zPos == 0.7071067690849304) {
        xPos += noise[0];
        yPos += noise[0];
        zPos += noise[0];
      }

      if (vertexIndex == 32) {
        //if(xPos == -0.7071067690849304 && yPos == -1.5 && zPos == -0.7071067690849304) {
        xPos += noise[0];
        yPos += noise[0];
        zPos += noise[0];
      }

      if (vertexIndex == 28) {
        //if(xPos == 0.7071067690849304 && yPos == -1.5 && zPos == 0.7071067690849304) {
        xPos += noise[0];
        yPos += noise[0];
        zPos += noise[0];
      }

      if (vertexIndex == 29) {
        //if(xPos == 1 && yPos == -1.5 && zPos == 6.123234262925839e-17) {
        xPos += noise[0];
        yPos += noise[0];
        zPos += noise[0];
      }

      if (vertexIndex == 31) {
        //if(xPos == 1.2246468525851679e-16 && yPos == -1.5 && zPos == -1) {
        xPos += noise[0];
        yPos += noise[0];
        zPos += noise[0];
      }

      if (vertexIndex == 33) {
        //if(xPos == -1 && yPos == -1.5 && zPos == -1.8369701465288538e-16) {
        xPos += noise[0];
        yPos += noise[0];
        zPos += noise[0];
      }

      if (vertexIndex == 35) {
        //if(xPos == -2.4492937051703357e-16 && yPos == -1.5 && zPos == 1) {
        xPos += noise[0];
        yPos += noise[0];
        zPos += noise[0];
      }
    }
    /*
        else {

	        // middle part (y = 0) ++++++++++++++++++++++++++++++++++++++++++++
	        if(vertexIndex == 26) {
	        //if(xPos == -2.4492937051703357e-16 && yPos == 0 && zPos == 1) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 24) {
	        //if(xPos == -1 && yPos == 0 && zPos == -1.8369701465288538e-16) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 22) {
	        //if(xPos == 1.2246468525851679e-16 && yPos == 0 && zPos == -1) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 20) {
	        //if(xPos == 1 && yPos == 0 && zPos == 6.123234262925839e-17) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 23) {
	        //if(xPos == -0.7071067690849304 && yPos == 0 && zPos == -0.7071067690849304) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 21) {
	        //if(xPos == 0.7071067690849304 && yPos == 0 && zPos == -0.7071067690849304) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 25) {
	        //if(xPos == -0.7071067690849304 && yPos == 0 && zPos == 0.7071067690849304) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 19) {
	        //if(xPos == 0.7071067690849304 && yPos == 0 && zPos == 0.7071067690849304) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 18) {
	        //if(xPos == 0 && yPos == 0 && zPos == 1) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }



	        // top middle part (y = 1.5) ++++++++++++++++++++++++++++++++++++++++++++
	        if(vertexIndex == 9) {
	        //if(xPos == 0 && yPos == 1.5 && zPos == 1) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 14) {
	        //if(xPos == -0.7071067690849304 && yPos == 1.5 && zPos == -0.7071067690849304) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 12) {
	        //if(xPos == 0.7071067690849304 && yPos == 1.5 && zPos == -0.7071067690849304) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 16) {
	        //if(xPos == -0.7071067690849304 && yPos == 1.5 && zPos == 0.7071067690849304) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 10) {
	        //if(xPos == 0.7071067690849304 && yPos == 1.5 && zPos == 0.7071067690849304) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 11) {
	        //if(xPos == 1 && yPos == 1.5 && zPos == 6.123234262925839e-17) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 13) {
	        //if(xPos == 1.2246468525851679e-16 && yPos == 1.5 && zPos == -1) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 15) {
	        //if(xPos == -1 && yPos == 1.5 && zPos == -1.8369701465288538e-16) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 17) {
	        //if(xPos == -2.4492937051703357e-16 && yPos == 1.5 && zPos == 1) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }



	        // bottom middle part (y = -1.5) ++++++++++++++++++++++++++++++++++++++++++++
	        if(vertexIndex == 27) {
	        //if(xPos == 0 && yPos == -1.5 && zPos == 1) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 30) {
	        //if(xPos == 0.7071067690849304 && yPos == -1.5 && zPos == -0.7071067690849304) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 34) {
	        //if(xPos == -0.7071067690849304 && yPos == -1.5 && zPos == 0.7071067690849304) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 32) {
	        //if(xPos == -0.7071067690849304 && yPos == -1.5 && zPos == -0.7071067690849304) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 28) {
	        //if(xPos == 0.7071067690849304 && yPos == -1.5 && zPos == 0.7071067690849304) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 29) {
	        //if(xPos == 1 && yPos == -1.5 && zPos == 6.123234262925839e-17) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 31) {
	        //if(xPos == 1.2246468525851679e-16 && yPos == -1.5 && zPos == -1) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 33) {
	        //if(xPos == -1 && yPos == -1.5 && zPos == -1.8369701465288538e-16) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }

	        if(vertexIndex == 35) {
	        //if(xPos == -2.4492937051703357e-16 && yPos == -1.5 && zPos == 1) {
		        xPos += noise[15];
		        yPos += noise[15];
		        zPos += noise[15];
	        }


    	}*/

    // No reason to modify upper, lower faces, can't be seen in tree trunks
    // we modify the vertices only when needed! saving computational power
    // wherever we can!
    // for the branches, top and bottom faces are visible too
    // we can modify them however we want
    // doing this will show the polys on the bottom and top faces of the cylinder more
    if (type == "branch") {
      // Top face
      if (
        vertexIndex == 45 ||
        vertexIndex == 46 ||
        vertexIndex == 47 ||
        vertexIndex == 48 ||
        vertexIndex == 49 ||
        vertexIndex == 50 ||
        vertexIndex == 51 ||
        vertexIndex == 52
      ) {
        //if(xPos == 0 && yPos == 3 && zPos == 0) {
        xPos += noise[15];
        yPos += randomBranchTipTOP;
        zPos += noise[15];
      }

      // Bottom face
      if (
        vertexIndex == 62 ||
        vertexIndex == 63 ||
        vertexIndex == 64 ||
        vertexIndex == 65 ||
        vertexIndex == 66 ||
        vertexIndex == 67 ||
        vertexIndex == 68 ||
        vertexIndex == 69
      ) {
        //if(xPos == 0 && yPos == -3 && zPos == 0) {
        xPos += noise[16];
        yPos -= randomBranchTipBOTTOM;
        zPos += noise[16];
      }

      // Moreover, we modify the bottom segmnent Y position too
      // no need to do this in trees since that part can't be seen
      // and it would also create problems with the positioning alignment on the ground

      // bottom side
      // First vertices that connects the "round" shape together, we do not modify it
      if (vertexIndex == 44 || vertexIndex == 78) {
        //if(xPos == -2.4492937051703357e-16 && yPos == -3 && zPos == 1) {
      }

      if (vertexIndex == 42 || vertexIndex == 76) {
        //if(xPos == -1 && yPos == -3 && zPos == -1.8369701465288538e-16) {
        //xPos += noise[1];
        yPos += noise[1];
        //zPos += noise[1];
      }

      if (vertexIndex == 40 || vertexIndex == 74) {
        //if(xPos == 1.2246468525851679e-16 && yPos == -3 && zPos == -1) {
        //xPos += noise[2];
        yPos += noise[2];
        //zPos += noise[2];
      }

      if (vertexIndex == 38 || vertexIndex == 72) {
        //if(xPos == 1 && yPos == -3 && zPos == 6.123234262925839e-17) {
        //xPos += noise[3];
        yPos += noise[3];
        //zPos += noise[3];
      }

      if (vertexIndex == 39 || vertexIndex == 73) {
        //if(xPos == 0.7071067690849304 && yPos == -3 && zPos == -0.7071067690849304) {
        //xPos += noise[4];
        yPos += noise[4];
        //zPos += noise[4];
      }

      if (vertexIndex == 43 || vertexIndex == 77) {
        //if(xPos == -0.7071067690849304 && yPos == -3 && zPos == 0.7071067690849304) {
        //xPos += noise[5];
        yPos += noise[5];
        //zPos += noise[5];
      }

      if (vertexIndex == 37 || vertexIndex == 71) {
        //if(xPos == 0.7071067690849304 && yPos == -3 && zPos == 0.7071067690849304) {
        //xPos += noise[6];
        yPos += noise[6];
        //zPos += noise[6];
      }

      if (vertexIndex == 41 || vertexIndex == 75) {
        //if(xPos == -0.7071067690849304 && yPos == -3 && zPos == -0.7071067690849304) {
        //xPos += noise[7];
        yPos += noise[7];
        //zPos += noise[7];
      }

      // Last vertices that connectes the "round" shape together, we do not modify it
      if (vertexIndex == 36 || vertexIndex == 70) {
        //if(xPos == 0 && yPos == -3 && zPos == 1) {
      }
    }

    // Set the new vertex position
    geom.attributes.position.setXYZ(vertexIndex, xPos, yPos, zPos);
  }

  // Update vertices positions
  geom.attributes.position.needsUpdate = true;

  // Updating the normal vectors (recompute)
  geom.computeVertexNormals();

  // Returning the modified geometry
  return geom;
}

// NOT USED RIGHT NOW; TESTING ONLY
// STONE PATH/FENCE CREATION?
// Perform box deformation
// Works only if the box segmentation:
// widthSegments = 1;
// heightSegments = 4;
// depthSegments = 1;
// THREE.BoxGeometry(width, height, depth, 1, 4, 1);
function getDeformedBox(geom, noise_max, noise_min) {
  // Get vertices' positions (local coordinates)
  // Access .attributes.mainStoneGeom array
  var positionAttribute = geom.getAttribute("position");
  // https://threejs.org/docs/#api/en/math/Vector3
  const objVertex = new THREE.Vector3(); // 3D vector to catch position of each vertex
  //console.log(positionAttribute.count)	// 79 vertices

  var noise = Array.from({ length: 20 }, () =>
    randomRange(noise_min, noise_max)
  );

  // Go through all vertices
  for (
    let vertexIndex = 0;
    vertexIndex < positionAttribute.count;
    vertexIndex++
  ) {
    // Accessing each vertex position
    objVertex.fromBufferAttribute(positionAttribute, vertexIndex);

    var xPos = objVertex.x;
    var yPos = objVertex.y;
    var zPos = objVertex.z;

    // Roots

    if (vertexIndex == 8 || vertexIndex == 25 || vertexIndex == 37) {
      //if(xPos == 0.5 && yPos == -3 && zPos == 0.5) {	// bottom-right
      xPos += noise[0];
      zPos += noise[0];
    }

    if (vertexIndex == 18 || vertexIndex == 26 || vertexIndex == 47) {
      //if(xPos == -0.5 && yPos == -3 && zPos == -0.5) {	// top-left
      xPos += noise[1];
      zPos += noise[1];
    }

    if (vertexIndex == 19 || vertexIndex == 24 || vertexIndex == 36) {
      //if(xPos == -0.5 && yPos == -3 && zPos == 0.5) {	// bottom-left
      xPos += noise[2];
      zPos += noise[2];
    }

    if (vertexIndex == 9 || vertexIndex == 27 || vertexIndex == 46) {
      //if(xPos == 0.5 && yPos == -3 && zPos == -0.5) {	// top-right
      xPos += noise[3];
      zPos += noise[3];
    }

    // Base

    if (vertexIndex == 4 || vertexIndex == 33) {
      //if(xPos == 0.5 && yPos == 0 && zPos == 0.5) {
      xPos += noise[4];
      yPos += noise[4];
      zPos += noise[4];
    }

    if (vertexIndex == 15 || vertexIndex == 32) {
      //if(xPos == -0.5 && yPos == 0 && zPos == 0.5) {
      xPos += noise[5];
      yPos += noise[5];
      zPos += noise[5];
    }

    if (vertexIndex == 5 || vertexIndex == 42) {
      //if(xPos == 0.5 && yPos == 0 && zPos == -0.5) {
      xPos += noise[6];
      yPos += noise[6];
      zPos += noise[6];
    }

    if (vertexIndex == 14 || vertexIndex == 43) {
      //if(xPos == -0.5 && yPos == -0 && zPos == -0.5) {
      xPos += noise[7];
      yPos += noise[7];
      zPos += noise[7];
    }

    // Middle 1

    if (vertexIndex == 6 || vertexIndex == 35) {
      //if(xPos == 0.5 && yPos == -1.5 && zPos == 0.5) {
      xPos += noise[8];
      yPos += noise[8];
      zPos += noise[8];
    }

    if (vertexIndex == 16 || vertexIndex == 45) {
      //if(xPos == -0.5 && yPos == -1.5 && zPos == -0.5) {
      xPos += noise[9];
      yPos += noise[9];
      zPos += noise[9];
    }

    if (vertexIndex == 17 || vertexIndex == 34) {
      //if(xPos == -0.5 && yPos == -1.5 && zPos == 0.5) {
      xPos += noise[10];
      yPos += noise[10];
      zPos += noise[10];
    }

    if (vertexIndex == 7 || vertexIndex == 44) {
      //if(xPos == 0.5 && yPos == -1.5 && zPos == -0.5) {
      xPos += noise[11];
      yPos += noise[11];
      zPos += noise[11];
    }

    // Middle 2

    if (vertexIndex == 2 || vertexIndex == 31) {
      //if(xPos == 0.5 && yPos == 1.5 && zPos == 0.5) {
      xPos += noise[12];
      yPos += noise[12];
      zPos += noise[12];
    }

    if (vertexIndex == 13 || vertexIndex == 30) {
      //if(xPos == -0.5 && yPos == 1.5 && zPos == 0.5) {
      xPos += noise[13];
      yPos += noise[13];
      zPos += noise[13];
    }

    if (vertexIndex == 3 || vertexIndex == 40) {
      //if(xPos == 0.5 && yPos == 1.5 && zPos == -0.5) {
      xPos += noise[14];
      yPos += noise[14];
      zPos += noise[14];
    }

    if (vertexIndex == 12 || vertexIndex == 41) {
      //if(xPos == -0.5 && yPos == 1.5 && zPos == -0.5) {
      xPos += noise[15];
      yPos += noise[15];
      zPos += noise[15];
    }

    // Top

    if (vertexIndex == 0 || vertexIndex == 23 || vertexIndex == 29) {
      //if(xPos == 0.5 && yPos == 3 && zPos == 0.5) {
      xPos += noise[16];
      zPos += noise[16];
    }

    if (vertexIndex == 11 || vertexIndex == 22 || vertexIndex == 28) {
      //if(xPos == -0.5 && yPos == 3 && zPos == 0.5) {
      xPos += noise[17];
      zPos += noise[17];
    }

    if (vertexIndex == 1 || vertexIndex == 21 || vertexIndex == 38) {
      //if(xPos == 0.5 && yPos == 3 && zPos == -0.5) {
      xPos += noise[18];
      zPos += noise[18];
    }

    if (vertexIndex == 10 || vertexIndex == 20 || vertexIndex == 39) {
      //if(xPos == -0.5 && yPos == 3 && zPos == -0.5) {
      xPos += noise[19];
      zPos += noise[19];
    }

    // Set the new vertex position
    geom.attributes.position.setXYZ(vertexIndex, xPos, yPos, zPos);
  }

  // Update vertices positions
  geom.attributes.position.needsUpdate = true;

  // Updating the normal vectors (recompute)
  geom.computeVertexNormals();

  // Returning the modified geometry
  return geom;
}

// Perform grass box deformation
// Works only if the box segmentation:
// widthSegments = 1;
// heightSegments = 4;
// depthSegments = 1;
// THREE.BoxGeometry(width, height, depth, 1, 4, 1);
function grassDeformation(geom) {
  // Get vertices' positions (local coordinates)
  // Access .attributes.mainStoneGeom array
  var positionAttribute = geom.getAttribute("position");
  // https://threejs.org/docs/#api/en/math/Vector3
  const objVertex = new THREE.Vector3(); // 3D vector to catch position of each vertex
  //console.log(positionAttribute.count)	// 79 vertices

  var randomTopStem = randomRange(-2.4, 2.4);
  var randomBaseStemLength = randomRange(-0.5, 0.5);
  var randomMiddleStemLength = randomRange(1, 1.5);
  var randomTopStemLength = randomRange(2, 2.5);

  //console.log(randomTopStem, randomBaseStemLength)

  // Go through all vertices
  for (
    let vertexIndex = 0;
    vertexIndex < positionAttribute.count;
    vertexIndex++
  ) {
    // Accessing each vertex position
    objVertex.fromBufferAttribute(positionAttribute, vertexIndex);

    var xPos = objVertex.x;
    var yPos = objVertex.y;
    var zPos = objVertex.z;

    // Roots

    if (vertexIndex == 8 || vertexIndex == 25 || vertexIndex == 37) {
      //if(xPos == 0.5 && yPos == -3 && zPos == 0.5) {	// bottom-right
    }

    if (vertexIndex == 18 || vertexIndex == 26 || vertexIndex == 47) {
      //if(xPos == -0.5 && yPos == -3 && zPos == -0.5) {	// top-left
    }

    if (vertexIndex == 19 || vertexIndex == 24 || vertexIndex == 36) {
      //if(xPos == -0.5 && yPos == -3 && zPos == 0.5) {	// bottom-left
    }

    if (vertexIndex == 9 || vertexIndex == 27 || vertexIndex == 46) {
      //if(xPos == 0.5 && yPos == -3 && zPos == -0.5) {	// top-right
    }

    // Middle 1
    // bottom right
    if (vertexIndex == 6 || vertexIndex == 35) {
      //if(xPos == 0.5 && yPos == -1.5 && zPos == 0.5) {
      xPos += 0.1;
      zPos = randomTopStem + 1.5;
      yPos += randomBaseStemLength;
    }

    // bottom left
    if (vertexIndex == 17 || vertexIndex == 34) {
      //if(xPos == -0.5 && yPos == -1.5 && zPos == 0.5) {
      xPos += 0.7;
      zPos = randomTopStem + 1.5;
      yPos += randomBaseStemLength;
    }

    // top right
    if (vertexIndex == 7 || vertexIndex == 44) {
      //if(xPos == 0.5 && yPos == -1.5 && zPos == -0.5) {
      xPos += 0.2;
      zPos = randomTopStem - 1.5;
      yPos += randomBaseStemLength;
    }

    // top left
    if (vertexIndex == 16 || vertexIndex == 45) {
      //if(xPos == -0.5 && yPos == -1.5 && zPos == -0.5) {
      xPos += 0.9;
      zPos = randomTopStem - 1.5;
      yPos += randomBaseStemLength;
    }

    // Middle 2
    // bottom right
    if (vertexIndex == 4 || vertexIndex == 33) {
      //if(xPos == 0.5 && yPos == 0 && zPos == 0.5) {
      xPos -= 1.2;
      zPos = randomTopStem + 1;
      yPos += randomMiddleStemLength;
    }

    // bottom left
    if (vertexIndex == 15 || vertexIndex == 32) {
      //if(xPos == -0.5 && yPos == 0 && zPos == 0.5) {
      xPos += 1;
      zPos = randomTopStem + 1;
      yPos += randomMiddleStemLength;
    }

    // top right
    if (vertexIndex == 5 || vertexIndex == 42) {
      //if(xPos == 0.5 && yPos == 0 && zPos == -0.5) {
      xPos -= 0.8;
      zPos = randomTopStem - 1;
      yPos += randomMiddleStemLength;
    }

    // top left
    if (vertexIndex == 14 || vertexIndex == 43) {
      //if(xPos == -0.5 && yPos == -0 && zPos == -0.5) {
      xPos += 1.4;
      zPos = randomTopStem - 1;
      yPos += randomMiddleStemLength;
    }

    // Middle 3

    // bottom right
    if (vertexIndex == 2 || vertexIndex == 31) {
      //if(xPos == 0.5 && yPos == 1.5 && zPos == 0.5) {
      xPos -= 5.2;
      zPos = randomTopStem + 0.5;
      yPos += randomTopStemLength;
    }

    // bottom left
    if (vertexIndex == 13 || vertexIndex == 30) {
      //if(xPos == -0.5 && yPos == 1.5 && zPos == 0.5) {
      xPos -= 1;
      zPos = randomTopStem + 0.5;
      yPos += randomTopStemLength;
    }

    // top right
    if (vertexIndex == 3 || vertexIndex == 40) {
      //if(xPos == 0.5 && yPos == 1.5 && zPos == -0.5) {
      xPos -= 4.6;
      zPos = randomTopStem - 0.5;
      yPos += randomTopStemLength;
    }

    // top left
    if (vertexIndex == 12 || vertexIndex == 41) {
      //if(xPos == -0.5 && yPos == 1.5 && zPos == -0.5) {
      xPos -= 0.5;
      zPos = randomTopStem - 0.5;
      yPos += randomTopStemLength;
    }

    // Top
    // bottom right
    if (vertexIndex == 0 || vertexIndex == 23 || vertexIndex == 29) {
      //if(xPos == 0.5 && yPos == 3 && zPos == 0.5) {
      xPos = randomTopStem;
      zPos = randomTopStem;
      yPos += randomTopStemLength - 1;
    }

    // bottom left
    if (vertexIndex == 11 || vertexIndex == 22 || vertexIndex == 28) {
      //if(xPos == -0.5 && yPos == 3 && zPos == 0.5) {
      xPos = randomTopStem;
      zPos = randomTopStem;
      yPos += randomTopStemLength - 1;
    }

    // top right
    if (vertexIndex == 1 || vertexIndex == 21 || vertexIndex == 38) {
      //if(xPos == 0.5 && yPos == 3 && zPos == -0.5) {
      xPos = randomTopStem;
      zPos = randomTopStem;
      yPos += randomTopStemLength - 1;
    }

    // top left
    if (vertexIndex == 10 || vertexIndex == 20 || vertexIndex == 39) {
      //if(xPos == -0.5 && yPos == 3 && zPos == -0.5) {
      xPos = randomTopStem;
      zPos = randomTopStem;
      yPos += randomTopStemLength - 1;
    }

    // Set the new vertex position
    geom.attributes.position.setXYZ(vertexIndex, xPos, yPos, zPos);
  }

  // Update vertices positions
  geom.attributes.position.needsUpdate = true;

  // Updating the normal vectors (recompute)
  geom.computeVertexNormals();

  // Returning the modified geometry
  return geom;
}

// Perform box deformation - used for fence logs
// Works only if the box segmentation:
// widthSegments = 1;
// heightSegments = 1;
// depthSegments = 1;
// THREE.BoxGeometry(width, height, depth, 1, 1, 1);
function deformLog(geom, type = "not_used") {
  // Get vertices' positions (local coordinates)
  var positionAttribute = geom.getAttribute("position");

  if (type == "sideL") {
    //if(randFenceType == 0) {
    var yPlus = 0.2;
    var yMinus = -0.1;

    // bottom right
    positionAttribute.setY(0, positionAttribute.getY(0) + yPlus);
    positionAttribute.setY(11, positionAttribute.getY(11) + yPlus);
    positionAttribute.setY(17, positionAttribute.getY(17) + yPlus);

    // bottom left
    positionAttribute.setY(5, positionAttribute.getY(5) + yMinus);
    positionAttribute.setY(10, positionAttribute.getY(10) + yMinus);
    positionAttribute.setY(16, positionAttribute.getY(16) + yMinus);

    // top right
    positionAttribute.setY(1, positionAttribute.getY(1) + yPlus);
    positionAttribute.setY(9, positionAttribute.getY(9) + yPlus);
    positionAttribute.setY(20, positionAttribute.getY(20) + yPlus);

    // top left
    positionAttribute.setY(4, positionAttribute.getY(4) + yMinus);
    positionAttribute.setY(8, positionAttribute.getY(8) + yMinus);
    positionAttribute.setY(21, positionAttribute.getY(21) + yMinus);
  } else if (type == "sideR") {
    //else if(randFenceType == 1) {

    var yPlus = -0.1;
    var yMinus = 0.2;

    // bottom right
    positionAttribute.setY(0, positionAttribute.getY(0) + yPlus);
    positionAttribute.setY(11, positionAttribute.getY(11) + yPlus);
    positionAttribute.setY(17, positionAttribute.getY(17) + yPlus);

    // bottom left
    positionAttribute.setY(5, positionAttribute.getY(5) + yMinus);
    positionAttribute.setY(10, positionAttribute.getY(10) + yMinus);
    positionAttribute.setY(16, positionAttribute.getY(16) + yMinus);

    // top right
    positionAttribute.setY(1, positionAttribute.getY(1) + yPlus);
    positionAttribute.setY(9, positionAttribute.getY(9) + yPlus);
    positionAttribute.setY(20, positionAttribute.getY(20) + yPlus);

    // top left
    positionAttribute.setY(4, positionAttribute.getY(4) + yMinus);
    positionAttribute.setY(8, positionAttribute.getY(8) + yMinus);
    positionAttribute.setY(21, positionAttribute.getY(21) + yMinus);
  } else if (type == "sideML") {
    //else if(randFenceType == 2) {

    var yPlus = 0.6;
    var yMinus = 0.3;

    // bottom right
    positionAttribute.setY(0, positionAttribute.getY(0) + yPlus);
    positionAttribute.setY(11, positionAttribute.getY(11) + yPlus);
    positionAttribute.setY(17, positionAttribute.getY(17) + yPlus);

    // bottom left
    positionAttribute.setY(5, positionAttribute.getY(5) + yMinus);
    positionAttribute.setY(10, positionAttribute.getY(10) + yMinus);
    positionAttribute.setY(16, positionAttribute.getY(16) + yMinus);

    // top right
    positionAttribute.setY(1, positionAttribute.getY(1) + yPlus);
    positionAttribute.setY(9, positionAttribute.getY(9) + yPlus);
    positionAttribute.setY(20, positionAttribute.getY(20) + yPlus);

    // top left
    positionAttribute.setY(4, positionAttribute.getY(4) + yMinus);
    positionAttribute.setY(8, positionAttribute.getY(8) + yMinus);
    positionAttribute.setY(21, positionAttribute.getY(21) + yMinus);
  } else if (type == "sideMR") {
    //else if(randFenceType == 3) {

    var yPlus = 0.3;
    var yMinus = 0.6;

    // bottom right
    positionAttribute.setY(0, positionAttribute.getY(0) + yPlus);
    positionAttribute.setY(11, positionAttribute.getY(11) + yPlus);
    positionAttribute.setY(17, positionAttribute.getY(17) + yPlus);

    // bottom left
    positionAttribute.setY(5, positionAttribute.getY(5) + yMinus);
    positionAttribute.setY(10, positionAttribute.getY(10) + yMinus);
    positionAttribute.setY(16, positionAttribute.getY(16) + yMinus);

    // top right
    positionAttribute.setY(1, positionAttribute.getY(1) + yPlus);
    positionAttribute.setY(9, positionAttribute.getY(9) + yPlus);
    positionAttribute.setY(20, positionAttribute.getY(20) + yPlus);

    // top left
    positionAttribute.setY(4, positionAttribute.getY(4) + yMinus);
    positionAttribute.setY(8, positionAttribute.getY(8) + yMinus);
    positionAttribute.setY(21, positionAttribute.getY(21) + yMinus);
  } else if (type == "lampPost") {
    //Lamp post - vertical lamp deformation

    var yPlus = 0.1;
    var yMinus = -0.1;

    // bottom right ++
    positionAttribute.setXYZ(
      0,
      positionAttribute.getX(0) + yMinus,
      positionAttribute.getY(0),
      positionAttribute.getZ(0) + yMinus
    );
    positionAttribute.setXYZ(
      11,
      positionAttribute.getX(11) + yMinus,
      positionAttribute.getY(11),
      positionAttribute.getZ(11) + yMinus
    );
    positionAttribute.setXYZ(
      17,
      positionAttribute.getX(17) + yMinus,
      positionAttribute.getY(17),
      positionAttribute.getZ(17) + yMinus
    );

    // bottom left -+
    positionAttribute.setXYZ(
      5,
      positionAttribute.getX(5) + yPlus,
      positionAttribute.getY(5),
      positionAttribute.getZ(5) + yMinus
    );
    positionAttribute.setXYZ(
      10,
      positionAttribute.getX(10) + yPlus,
      positionAttribute.getY(10),
      positionAttribute.getZ(10) + yMinus
    );
    positionAttribute.setXYZ(
      16,
      positionAttribute.getX(16) + yPlus,
      positionAttribute.getY(16),
      positionAttribute.getZ(16) + yMinus
    );

    // top right +-
    positionAttribute.setXYZ(
      1,
      positionAttribute.getX(1) + yMinus,
      positionAttribute.getY(1),
      positionAttribute.getZ(1) + yPlus
    );
    positionAttribute.setXYZ(
      9,
      positionAttribute.getX(9) + yMinus,
      positionAttribute.getY(9),
      positionAttribute.getZ(9) + yPlus
    );
    positionAttribute.setXYZ(
      20,
      positionAttribute.getX(20) + yMinus,
      positionAttribute.getY(20),
      positionAttribute.getZ(20) + yPlus
    );

    // top left --
    positionAttribute.setXYZ(
      4,
      positionAttribute.getX(4) + yPlus,
      positionAttribute.getY(4),
      positionAttribute.getZ(4) + yPlus
    );
    positionAttribute.setXYZ(
      8,
      positionAttribute.getX(8) + yPlus,
      positionAttribute.getY(8),
      positionAttribute.getZ(8) + yPlus
    );
    positionAttribute.setXYZ(
      21,
      positionAttribute.getX(21) + yPlus,
      positionAttribute.getY(21),
      positionAttribute.getZ(21) + yPlus
    );
  }

  /*
    // Go through all vertices
    for (let vertexIndex = 0; vertexIndex < positionAttribute.count; vertexIndex++) {

        // Accessing each vertex position
        objVertex.fromBufferAttribute (positionAttribute, vertexIndex);

        var xPos = objVertex.x;
        var yPos = objVertex.y;
        var zPos = objVertex.z;

        // top side
        if(vertexIndex == 0 || vertexIndex == 11 || vertexIndex == 17) {
        //if(xPos == 0.5 && yPos == 2.5 && zPos == 0.25){	// bottom right corner

        }

        if(vertexIndex == 5 || vertexIndex == 10 || vertexIndex == 16) {
        //if(xPos == -0.5 && yPos == 2.5 && zPos == 0.25){	// bottom left corner

        }

        if(vertexIndex == 1 || vertexIndex == 9 || vertexIndex == 20) {
        //if(xPos == 0.5 && yPos == 2.5 && zPos == -0.25){	// top right corner

        }

        if(vertexIndex == 4 || vertexIndex == 8 || vertexIndex == 21) {
        //if(xPos == -0.5 && yPos == 2.5 && zPos == -0.25){	// top left corner

        }


   		// bottom side
        if(vertexIndex == 2 || vertexIndex == 13 || vertexIndex == 19) {
        //if(xPos == 0.5 && yPos == -2.5 && zPos == 0.25){	// bottom right corner

        }

        if(vertexIndex == 6 || vertexIndex == 14 || vertexIndex == 23) {
        //if(xPos == -0.5 && yPos == -2.5 && zPos == -0.25){	// top left corner

        }

        if(vertexIndex == 7 || vertexIndex == 12 || vertexIndex == 18) {
        //if(xPos == -0.5 && yPos == -2.5 && zPos == 0.25){	// bottom left corner

        }

        if(vertexIndex == 3 || vertexIndex == 15 || vertexIndex == 22) {
        //if(xPos == 0.5 && yPos == -2.5 && zPos == -0.25){	// top right corner

        }

        // Set the new vertex position
        geom.attributes.position.setXYZ(vertexIndex, xPos, yPos, zPos);

    }

    */

  // Update vertices positions
  geom.attributes.position.needsUpdate = true;

  // Updating the normal vectors (recompute)
  geom.computeVertexNormals();
}

// Perform Icosahedron deformation (flatten + deformation, used for rocks)
function getFlatIcosahedron(geom, noise_max, noise_min) {
  // Get vertices' positions (local coordinates)
  // Access .attributes.mainStoneGeom array
  var positionAttribute = geom.getAttribute("position");
  // https://threejs.org/docs/#api/en/math/Vector3
  const objVertex = new THREE.Vector3(); // 3D vector to catch position of each vertex
  //console.log(positionAttribute.count)	// 79 vertices

  var noise = Array.from({ length: 12 }, () =>
    randomRange(noise_min, noise_max)
  );

  // Go through all vertices
  for (
    let vertexIndex = 0;
    vertexIndex < positionAttribute.count;
    vertexIndex++
  ) {
    // Accessing each vertex position
    objVertex.fromBufferAttribute(positionAttribute, vertexIndex);

    // TODO: DECIDE IF YOU WANT TO KEEP XYZ = 0 WHERE IT WAS ALREADY 0

    var xPos = objVertex.x;
    var yPos = objVertex.y;
    var zPos = objVertex.z;

    if (
      vertexIndex == 2 ||
      vertexIndex == 5 ||
      vertexIndex == 8 ||
      vertexIndex == 11 ||
      vertexIndex == 14
    ) {
      //if(xPos == -2.6286556720733643 && yPos == 4.253253936767578 && zPos == 0) {

      xPos += noise[8];
      yPos += noise[8];
      zPos += noise[8];
    }

    if (
      vertexIndex == 4 ||
      vertexIndex == 6 ||
      vertexIndex == 17 ||
      vertexIndex == 27 ||
      vertexIndex == 58
    ) {
      //if(xPos == 2.6286556720733643 && yPos == 4.253253936767578 && zPos == 0) {

      xPos += noise[9];
      yPos += noise[9];
      //zPos += noise[9];
    }

    if (
      vertexIndex == 1 ||
      vertexIndex == 3 ||
      vertexIndex == 15 ||
      vertexIndex == 20 ||
      vertexIndex == 46
    ) {
      //if(xPos == 0 && yPos == 2.6286556720733643 && zPos == 4.253253936767578) {

      //xPos += noise[4];
      yPos += noise[4];
      zPos += noise[4];
    }

    // 7, 9, 24, 29, 55
    if (
      vertexIndex == 7 ||
      vertexIndex == 9 ||
      vertexIndex == 24 ||
      vertexIndex == 29 ||
      vertexIndex == 55
    ) {
      //if(xPos == 0 && yPos == 2.6286556720733643 && zPos == -4.253253936767578) {

      //xPos += noise[5];
      yPos += noise[5];
      zPos += noise[5];
    }

    // 0, 13, 18, 23, 49
    if (
      vertexIndex == 0 ||
      vertexIndex == 13 ||
      vertexIndex == 18 ||
      vertexIndex == 23 ||
      vertexIndex == 49
    ) {
      //if(xPos == -4.253253936767578 && yPos == 0 && zPos == 2.6286556720733643) {

      xPos += noise[0];
      //yPos += noise[0];
      zPos += noise[0];
    }

    // 16, 30, 43, 45, 59
    if (
      vertexIndex == 16 ||
      vertexIndex == 30 ||
      vertexIndex == 43 ||
      vertexIndex == 45 ||
      vertexIndex == 59
    ) {
      //if(xPos == 4.253253936767578 && yPos == 0 && zPos == 2.6286556720733643) {

      xPos += noise[1];
      //yPos += noise[1];
      zPos += noise[1];
    }

    // 10, 12, 21, 26, 52
    if (
      vertexIndex == 10 ||
      vertexIndex == 12 ||
      vertexIndex == 21 ||
      vertexIndex == 26 ||
      vertexIndex == 52
    ) {
      //if(xPos == -4.253253936767578 && yPos == 0 && zPos == -2.6286556720733643) {

      xPos += noise[2];
      //yPos += noise[2];
      zPos += noise[2];
    }

    // 28, 40, 42, 56, 57
    if (
      vertexIndex == 28 ||
      vertexIndex == 40 ||
      vertexIndex == 42 ||
      vertexIndex == 56 ||
      vertexIndex == 57
    ) {
      //if(xPos == 4.253253936767578 && yPos == 0 && zPos == -2.6286556720733643) {

      xPos += noise[3];
      //yPos += noise[3];
      zPos += noise[3];
    }

    // 25, 37, 39, 53, 54
    if (
      vertexIndex == 25 ||
      vertexIndex == 37 ||
      vertexIndex == 39 ||
      vertexIndex == 53 ||
      vertexIndex == 54
    ) {
      //if(xPos == 0 && yPos == -2.6286556720733643 && zPos == -4.253253936767578) {

      //xPos += noise[6];
      //yPos += noise[6];
      zPos += noise[6];
      yPos = 0;
    }

    // 19, 31, 33, 47, 48
    if (
      vertexIndex == 19 ||
      vertexIndex == 31 ||
      vertexIndex == 33 ||
      vertexIndex == 47 ||
      vertexIndex == 48
    ) {
      //if(xPos == 0 && yPos == -2.6286556720733643 && zPos == 4.253253936767578) {

      //xPos += noise[7];
      //yPos += noise[7];
      zPos += noise[7];
      yPos = 0;
    }

    // 22, 34, 36, 50, 51
    if (
      vertexIndex == 22 ||
      vertexIndex == 34 ||
      vertexIndex == 36 ||
      vertexIndex == 50 ||
      vertexIndex == 51
    ) {
      //if(xPos == -2.6286556720733643 && yPos == -4.253253936767578 && zPos == 0) {

      xPos += noise[10];
      //yPos += noise[10];
      //zPos += noise[10];
      yPos = 0;
    }

    // 32, 35, 38, 41, 44
    if (
      vertexIndex == 32 ||
      vertexIndex == 35 ||
      vertexIndex == 38 ||
      vertexIndex == 41 ||
      vertexIndex == 44
    ) {
      //if(xPos == 2.6286556720733643 && yPos == -4.253253936767578 && zPos == 0) {

      xPos += noise[11];
      //yPos += noise[11];
      //zPos += noise[11];
      yPos = 0;
    }

    // Set the new vertex position
    geom.attributes.position.setXYZ(vertexIndex, xPos, yPos, zPos);
  }

  // Update vertices positions
  geom.attributes.position.needsUpdate = true;

  // Updating the normal vectors (recompute)
  geom.computeVertexNormals();

  // Returning the modified geometry
  return geom;
}

// Perform Icosahedron deformation (NO flatten, deformation ONLY, used for tree bushes)
function getDeformedIcosahedron(geom, noise_max, noise_min) {
  // Get vertices' positions (local coordinates)
  // Access .attributes.mainStoneGeom array
  var positionAttribute = geom.getAttribute("position");
  // https://threejs.org/docs/#api/en/math/Vector3
  const objVertex = new THREE.Vector3(); // 3D vector to catch position of each vertex
  //console.log(positionAttribute.count)	// 79 vertices

  var noise = Array.from({ length: 12 }, () =>
    randomRange(noise_min, noise_max)
  );

  // Go through all vertices
  for (
    let vertexIndex = 0;
    vertexIndex < positionAttribute.count;
    vertexIndex++
  ) {
    // Accessing each vertex position
    objVertex.fromBufferAttribute(positionAttribute, vertexIndex);

    var xPos = objVertex.x;
    var yPos = objVertex.y;
    var zPos = objVertex.z;

    if (
      vertexIndex == 2 ||
      vertexIndex == 5 ||
      vertexIndex == 8 ||
      vertexIndex == 11 ||
      vertexIndex == 14
    ) {
      //if(xPos == -2.6286556720733643 && yPos == 4.253253936767578 && zPos == 0) {

      xPos += noise[8];
      yPos += noise[8];
      zPos += noise[8];
    }

    if (
      vertexIndex == 4 ||
      vertexIndex == 6 ||
      vertexIndex == 17 ||
      vertexIndex == 27 ||
      vertexIndex == 58
    ) {
      //if(xPos == 2.6286556720733643 && yPos == 4.253253936767578 && zPos == 0) {

      xPos += noise[9];
      yPos += noise[9];
      zPos += noise[9];
    }

    if (
      vertexIndex == 1 ||
      vertexIndex == 3 ||
      vertexIndex == 15 ||
      vertexIndex == 20 ||
      vertexIndex == 46
    ) {
      //if(xPos == 0 && yPos == 2.6286556720733643 && zPos == 4.253253936767578) {

      xPos += noise[4];
      yPos += noise[4];
      zPos += noise[4];
    }

    // 7, 9, 24, 29, 55
    if (
      vertexIndex == 7 ||
      vertexIndex == 9 ||
      vertexIndex == 24 ||
      vertexIndex == 29 ||
      vertexIndex == 55
    ) {
      //if(xPos == 0 && yPos == 2.6286556720733643 && zPos == -4.253253936767578) {

      xPos += noise[5];
      yPos += noise[5];
      zPos += noise[5];
    }

    // 0, 13, 18, 23, 49
    if (
      vertexIndex == 0 ||
      vertexIndex == 13 ||
      vertexIndex == 18 ||
      vertexIndex == 23 ||
      vertexIndex == 49
    ) {
      //if(xPos == -4.253253936767578 && yPos == 0 && zPos == 2.6286556720733643) {

      xPos += noise[0];
      yPos += noise[0];
      zPos += noise[0];
    }

    // 16, 30, 43, 45, 59
    if (
      vertexIndex == 16 ||
      vertexIndex == 30 ||
      vertexIndex == 43 ||
      vertexIndex == 45 ||
      vertexIndex == 59
    ) {
      //if(xPos == 4.253253936767578 && yPos == 0 && zPos == 2.6286556720733643) {

      xPos += noise[1];
      yPos += noise[1];
      zPos += noise[1];
    }

    // 10, 12, 21, 26, 52
    if (
      vertexIndex == 10 ||
      vertexIndex == 12 ||
      vertexIndex == 21 ||
      vertexIndex == 26 ||
      vertexIndex == 52
    ) {
      //if(xPos == -4.253253936767578 && yPos == 0 && zPos == -2.6286556720733643) {

      xPos += noise[2];
      yPos += noise[2];
      zPos += noise[2];
    }

    // 28, 40, 42, 56, 57
    if (
      vertexIndex == 28 ||
      vertexIndex == 40 ||
      vertexIndex == 42 ||
      vertexIndex == 56 ||
      vertexIndex == 57
    ) {
      //if(xPos == 4.253253936767578 && yPos == 0 && zPos == -2.6286556720733643) {

      xPos += noise[3];
      yPos += noise[3];
      zPos += noise[3];
    }

    // 25, 37, 39, 53, 54
    if (
      vertexIndex == 25 ||
      vertexIndex == 37 ||
      vertexIndex == 39 ||
      vertexIndex == 53 ||
      vertexIndex == 54
    ) {
      //if(xPos == 0 && yPos == -2.6286556720733643 && zPos == -4.253253936767578) {

      xPos += noise[6];
      yPos += noise[6];
      zPos += noise[6];
    }

    // 19, 31, 33, 47, 48
    if (
      vertexIndex == 19 ||
      vertexIndex == 31 ||
      vertexIndex == 33 ||
      vertexIndex == 47 ||
      vertexIndex == 48
    ) {
      //if(xPos == 0 && yPos == -2.6286556720733643 && zPos == 4.253253936767578) {

      xPos += noise[7];
      yPos += noise[7];
      zPos += noise[7];
    }

    // 22, 34, 36, 50, 51
    if (
      vertexIndex == 22 ||
      vertexIndex == 34 ||
      vertexIndex == 36 ||
      vertexIndex == 50 ||
      vertexIndex == 51
    ) {
      //if(xPos == -2.6286556720733643 && yPos == -4.253253936767578 && zPos == 0) {

      xPos += noise[10];
      yPos += noise[10];
      zPos += noise[10];
    }

    // 32, 35, 38, 41, 44
    if (
      vertexIndex == 32 ||
      vertexIndex == 35 ||
      vertexIndex == 38 ||
      vertexIndex == 41 ||
      vertexIndex == 44
    ) {
      //if(xPos == 2.6286556720733643 && yPos == -4.253253936767578 && zPos == 0) {

      xPos += noise[11];
      yPos += noise[11];
      zPos += noise[11];
    }

    // Set the new vertex position
    geom.attributes.position.setXYZ(vertexIndex, xPos, yPos, zPos);
  }

  // Update vertices positions
  geom.attributes.position.needsUpdate = true;

  // Updating the normal vectors (recompute)
  geom.computeVertexNormals();

  // Returning the modified geometry
  return geom;
}

// https://www.youtube.com/watch?v=5yhDb9dzJ58&t=464s&ab_channel=ThinMatrix
// Perform lake water plane deformation - waves
// (geometry, waving cycle, scaling value, offset)
function wave_effect(geometry, cycle, height, frmOffset) {
  // Get vertices' positions (local coordinates)
  var positionAttribute = geometry.getAttribute("position");

  // https://threejs.org/docs/#api/en/math/Vector3
  const objVertex = new THREE.Vector3(); // 3D vector to catch position of each vertex

  // Get the width of the geometry (plane)
  // Used to control the amount of "waving" cycles in the geometry
  const width = geometry.parameters.width;

  // Go through all vertices
  for (
    let vertexIndex = 0;
    vertexIndex < positionAttribute.count;
    vertexIndex++
  ) {
    // Accessing each vertex position
    objVertex.fromBufferAttribute(positionAttribute, vertexIndex);

    // WAVING CYCLE - X wide AND Y wide
    // We add our frame offset for animating the wave
    // Changing the x value
    // Calculates a different zPos over time
    // There is no real way to explain what I did here, I played around with every possible
    // value trying to find something that looked as natural as possible and not repetitive
    const xPos =
      (((objVertex.x + objVertex.y * objVertex.x + frmOffset) * cycle) /
        width) *
      (2 * Math.PI) *
      ((objVertex.x * 0.8 + objVertex.y) % 1.5);
    const yPos =
      (((objVertex.y * objVertex.x + objVertex.y * objVertex.x + frmOffset) *
        cycle) /
        width) *
      (2 * Math.PI) *
      (objVertex.x % 0.8);

    // Compute z-pos using Sine function
    // height: magnitude (SCALING VALUE)
    var zPos = Math.sin(yPos) + Math.cos(xPos) * height * 0.5;

    // Update the z-pos using the new value
    geometry.attributes.position.setXYZ(
      vertexIndex,
      objVertex.x,
      objVertex.y,
      zPos
    );
  }

  // Update vertices positions
  geometry.attributes.position.needsUpdate = true;

  // Updating the normal vectors (recompute)
  geometry.computeVertexNormals();
}

// Class used to track resources (e.g., materials, textures, geometries)
// used when we need to dispose of certain things (e.g., new generation)
// we use it by calling the track function with every geometry, texture
// and material we create and that can be regenerated
// Used in conjunction with renderer.info to check for memory leaks
// https://threejs.org/docs/#api/en/renderers/WebGLRenderer.info
class ResourceTracker {
  constructor() {
    this.resources = new Set();
    this.singleObjectResources = new Set();
  }
  track(resource) {
    if (resource.dispose || resource instanceof THREE.Object3D) {
      this.resources.add(resource);
      this.singleObjectResources.add(resource);
    }
    return resource;
  }
  untrack(resource) {
    this.resources.delete(resource);
  }
  dispose() {
    for (const resource of this.resources) {
      //if (resource instanceof THREE.Object3D) {
      //  if (resource.parent) {
      //    resource.parent.remove(resource);
      //  }
      //}
      if (resource.dispose) {
        resource.dispose();
      }
    }
    this.resources.clear();
  }
  // Dispose of bad positioned things
  disposeLast() {
    for (const singleObjectResource of this.singleObjectResources) {
      for (const resource of this.resources) {
        if (resource === singleObjectResource) {
          if (resource.dispose) {
            resource.dispose();
          }

          if (singleObjectResource.dispose) {
            singleObjectResource.dispose();
          }
        }
      }
    }
    this.singleObjectResources.clear();
  }
}

// stone ground resource tracker
const stoneResTracker = new ResourceTracker();
const stoneTrack = stoneResTracker.track.bind(stoneResTracker); // bound function

// sky resource tracker
const cloudResTracker = new ResourceTracker();
const cloudTrack = cloudResTracker.track.bind(cloudResTracker); // bound function

// tree ground resource tracker
const treeResTracker = new ResourceTracker();
const treeTrack = treeResTracker.track.bind(treeResTracker); // bound function

// grass ground resource tracker
const grassResTracker = new ResourceTracker();
const grassTrack = grassResTracker.track.bind(grassResTracker); // bound function

// fireflies resource tracker
const fireflyResTracker = new ResourceTracker();
const fireflyTrack = fireflyResTracker.track.bind(fireflyResTracker); // bound function

// fireflies resource tracker
const campfireResTracker = new ResourceTracker();
const campfireTrack = campfireResTracker.track.bind(campfireResTracker); // bound function

// ########################################################################################################

// 3D OBJECTS AND SCENE CREATION - IMPLEMENTATION

// Resources - TO IGNORE
// https://stackoverflow.com/questions/49956422/what-is-difference-between-boxbuffergeometry-vs-boxgeometry-in-three-js

// NOTE:
//		 Where possible, the BufferGeometry implementation of primitive classes
// 		 are used directly to improve performance.

// ##########################################

// Terrain

// Resources - TO IGNORE
// https://creatives.in.ua/wp-content/uploads/2018/11/Three.js-Cookbook.pdf
// https://github.com/josdirksen/threejs-cookbook/blob/master/02-geometries-meshes/02.06-create-terrain-from-heightmap.html
// https://stackoverflow.com/questions/46412059/smooth-terrain-from-height-map-three-js
// https://stackoverflow.com/questions/53349222/draw-irregular-water-in-3d-scene-using-three-js
// https://www.youtube.com/watch?v=2AQLMZwQpDo&ab_channel=DesignCourse
// http://danni-three.blogspot.com/2013/09/threejs-heightmaps.html
// https://www.reddit.com/r/threejs/comments/coq66b/meshphongmaterial_displacementmap_normalmap/
// https://codepen.io/kuxazoso/pen/GVYMda?editors=0010
// https://www.youtube.com/watch?v=2AQLMZwQpDo&t=1160s&ab_channel=DesignCourse
// https://stackoverflow.com/questions/15994944/transparent-objects-in-threejs
// "Renderable objects having material.transparent = false (opaque objects) are rendered before
// objects having material.transparent = true (transparent objects)."
// https://stackoverflow.com/questions/8763603/transparent-textures-behaviour-in-webgl
// https://stackoverflow.com/questions/28543574/three-js-transparent-objects-rendering-in-wrong-order-depending-on-camera-angle
// https://stackoverflow.com/questions/15046449/water-mirrored-surface-in-webgl-using-threejs
// https://martinrenou.github.io/threejs-water/
// https://blender.stackexchange.com/questions/53860/low-poly-water-effect

// dirt terrain - bottom box
var geoDirtTerrain = new THREE.BoxGeometry(
  terrainDimension,
  25,
  terrainDimension,
  1,
  1,
  1
);
// material array (we want to avoid having to compute shadows on the top side)
// we leave them on on the rest of the box
var allMatDirtTerrain = [];
var matDirtTerrain = new THREE.MeshLambertMaterial({
  color: colors.dirt,
  wireframe: false, // for debugging
});
// MeshBasicMaterial -> not affected by lights
var matDirtTerrainNoShadow = new THREE.MeshBasicMaterial({
  //color: colors.dirt,
  transparent: true,
  opacity: 0,
  wireframe: false, // for debugging
});
allMatDirtTerrain.push(matDirtTerrain); // right side
allMatDirtTerrain.push(matDirtTerrain); // left side
allMatDirtTerrain.push(matDirtTerrainNoShadow); // top side
allMatDirtTerrain.push(matDirtTerrain); // bottom side
allMatDirtTerrain.push(matDirtTerrain); // front side
allMatDirtTerrain.push(matDirtTerrain); // back side
var dirtTerrain = new THREE.Mesh(geoDirtTerrain, allMatDirtTerrain);
dirtTerrain.rotation.y = Math.PI / 4;
dirtTerrain.receiveShadow = true;
scene.add(dirtTerrain);

// grass terrain - top box (container)
// var used to place all the objects on top of the terrain
const terrainHeight = 20 + 0.001; // +0.01 to avoid Y flickering for all placed objects in the scene
// container box
// we create a box and hide the top face, in order to make space for the lake terrain
// other options, create 6 different planes
var geoTerrain = new THREE.BoxGeometry(
  terrainDimension + 10,
  terrainHeight,
  terrainDimension + 10,
  1,
  1,
  1
);
var matTerrain = new THREE.MeshLambertMaterial({
  color: colors.green,
  wireframe: false, // for debugging
});
// MeshBasicMaterial -> not affected by lights
var matTerrainInvisible = new THREE.MeshBasicMaterial({
  //color: colors.green,
  transparent: true,
  opacity: 0,
  wireframe: false, // for debugging
  // disabling depthWrite in order for the transparent water to be seen
  // renderer renders opaque objects first, transparent after
  // opaque in order, then transparent in order
  // no depthwrite -> prevent the depth buffer from being written
  // https://stackoverflow.com/questions/37647853/three-js-depthwrite-vs-depthtest-for-transparent-canvas-texture-map-on-three-p
  depthWrite: false,
});
// material array (we want to make only the top side of the box invisible)
var allMatTerrain = [];
allMatTerrain.push(matTerrain); // right side
allMatTerrain.push(matTerrain); // left side
allMatTerrain.push(matTerrainInvisible); // top side
allMatTerrain.push(matTerrain); // bottom side
allMatTerrain.push(matTerrain); // front side
allMatTerrain.push(matTerrain); // back side
var terrain = new THREE.Mesh(geoTerrain, allMatTerrain);
// the connection part between the green box and the dirt box is hidden so no
// need to avoid Y flickering
// could be stil done on low specs machines, to keep the GPU happy
terrain.position.y = 12.5 + terrainHeight / 2; //+ 0.001;
terrain.castShadow = true;
terrain.receiveShadow = true;
// add grass terrain to dirt terrain
dirtTerrain.add(terrain);

// grass terrain - top surface - lake
// plane with displacement map/height map (64x64 PNG)
// max depth of the lake
const lakeDepth = 19;
var geoLakeTerrain = new THREE.PlaneGeometry(
  terrainDimension + 10,
  terrainDimension + 10,
  128,
  128
);
var matLakeTerrain = new THREE.MeshPhongMaterial({
  //color: colors.green,
  flatShading: true,
  displacementMap: lakeDisplacementMap,
  displacementScale: lakeDepth, // max depth of the lake
  vertexColors: true, // used to give each vertex different colours (make the lake brown)
  shininess: 0,
  specular: 0x000000,
  wireframe: false, // for debugging
});
// No need to update vertices position since with displacementMap, the fundamental geometry
// isn't actually altered.
// https://stackoverflow.com/questions/47531390/three-js-wrong-normals-and-faces-after-using-meshphongmaterial-displacementmap

// TODO: FIND A NICER WAY OF IMPLEMENTING THIS SECTION (really static right now)
// Adding some naturalness, change color based on lake depth
// green to brown shades (workaround vertices not being modified)
const geoLakeTerrainVerts = geoLakeTerrain.attributes.position;
// creating color attribute
geoLakeTerrain.setAttribute(
  "color",
  new THREE.BufferAttribute(new Float32Array(geoLakeTerrainVerts.count * 3), 3)
);
const tempColor = new THREE.Color();
const geoLakeTerrainColor = geoLakeTerrain.attributes.color;
for (let i = 0; i < geoLakeTerrainVerts.count; i++) {
  // console.log(geoLakeTerrainVerts.getZ(i)) // for debugging
  // console.log(geoLakeTerrainVerts.getY(i)) // for debugging
  // lake terrain is brown
  if (
    geoLakeTerrainVerts.getY(i) >= -70 &&
    geoLakeTerrainVerts.getY(i) <= 70 &&
    geoLakeTerrainVerts.getX(i) >= -70 &&
    geoLakeTerrainVerts.getX(i) <= -35
  ) {
    tempColor.set(colors.dirt);
    geoLakeTerrainColor.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
  } else if (
    geoLakeTerrainVerts.getY(i) >= 30 &&
    geoLakeTerrainVerts.getY(i) <= 70 &&
    geoLakeTerrainVerts.getX(i) >= -70 &&
    geoLakeTerrainVerts.getX(i) <= -25
  ) {
    tempColor.set(colors.dirt);
    geoLakeTerrainColor.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
  } else if (
    geoLakeTerrainVerts.getY(i) >= 40 &&
    geoLakeTerrainVerts.getY(i) <= 70 &&
    geoLakeTerrainVerts.getX(i) >= -70 &&
    geoLakeTerrainVerts.getX(i) <= -2
  ) {
    tempColor.set(colors.dirt);
    geoLakeTerrainColor.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
  } else {
    // rest of the terrain is green
    tempColor.set(colors.green);
    geoLakeTerrainColor.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
  }
}
var lakeTerrain = new THREE.Mesh(geoLakeTerrain, matLakeTerrain);
// placing the lowest point possible of the height map at the top side of the grass box (container)
// we remove the Y flickering value added to terrain box, so any internal parts are hidden
lakeTerrain.position.y = -lakeDepth + terrainHeight / 2 - 0.001;
lakeTerrain.castShadow = true; // cast shadows mainly for the lake "zone"
lakeTerrain.receiveShadow = true;
lakeTerrain.rotation.x = -Math.PI / 2;
// add lake terrain to grass terrain so we can move it around as one object
terrain.add(lakeTerrain);

// lake - water
// water level, max 11 - min 3
var waterLevel = 12; // lower is less water
var geoLakeWater = new THREE.PlaneGeometry(
  homeBoundaryPositive / 2 + 30,
  homeBoundaryPositive * 2,
  16,
  16
);
// TODO: USE SHADER MATERIAL
// a lot of things can be implemented and improved by coding custom vertex/fragment
// e.g. water murkiness at different depths, reflection
// MeshPhysicalMaterial could be used too, especially due to its clearcoat property
// MeshStandardMaterial as well. However, they are both more computationally expensive
// than MeshPhongMaterial, and their best "performance" is achieved when using an envMap
// which I didn't really make.
var matLakeWater = new THREE.MeshPhongMaterial({
  color: colors.water,
  flatShading: true,
  //map: waterTexture,	// not a big fan of textures in this project's style
  // adding displacement map, even when the lake is not animated, it will still
  // have "bumps" (displacemetMap + flatshading)
  displacementMap: waterDisplacementMap,
  displacementScale: 8,
  //specularMap: waterSpecularMap,
  specular: 0xf2efe8, //0x337374, 0xaaaaaa, 0x99C8C9, 0x4E4E4E, 0x337374
  shininess: 500,
  opacity: 0.8,
  transparent: true,
  wireframe: false,
});
var lakeWater = new THREE.Mesh(geoLakeWater, matLakeWater);
// for now, the water mesh doesn't cast shadow inside the lake (personal preference), no real reason to
// TODO: CREATE A CUSTOMDEPTHMATERIAL?
// https://github.com/mrdoob/three.js/issues/10600
// https://stackoverflow.com/questions/43848330/three-js-shadows-cast-by-partially-transparent-mesh
//lakeWater.castShadow = true;
lakeWater.receiveShadow = true;
lakeWater.position.x = homeBoundaryNegative + homeBoundaryPositive / 2 + 20;
lakeWater.position.z = waterLevel; // we don't modify Y anymore, but Z
// since lakeWater is added to lakeTerrain which has already a -Math.PI/2 rotation
lakeTerrain.add(lakeWater);

// Wave animation settings
var animateWater = true;
var waveRatio = 5; // offset ratio

// ##########################################

// Animals

// Cat obj
const catURL = "obj/Cat.gltf";
gltfLoader.load(catURL, (gltf) => {
  const root = gltf.scene;

  root.scale.set(1.2, 1.2, 1.2);
  root.position.y = terrainHeight / 2;
  root.rotation.y = -Math.PI / 2;
  root.position.x = 5;
  root.position.z = 40;

  // setting shadow on each child mesh
  root.traverse(function (node) {
    if (node.isMesh) {
      node.material.shadowSide = THREE.BackSide;
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });

  terrain.add(root);
});

// Pug obj
const pugURL = "obj/Pug.gltf";
gltfLoader.load(pugURL, (gltf) => {
  const root = gltf.scene;

  root.scale.set(1.5, 1.5, 1.5);
  root.position.y = terrainHeight / 2;
  root.rotation.y = -Math.PI / 3;
  root.position.x = -5;
  root.position.z = 40;

  // setting shadow on each child mesh
  root.traverse(function (node) {
    if (node.isMesh) {
      node.material.shadowSide = THREE.BackSide;
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });

  terrain.add(root);
});

// ##########################################

// Stones

Stone = function () {
  // Create an empty container that will hold the different parts of the stone
  this.mesh = campfireTrack(stoneTrack(new THREE.Object3D()));

  var mainStoneType;

  minMainStoneSize = 1;
  maxMainStoneSize = 2;

  // 1 big stone - random size
  var mainStoneSize = randomRange(minMainStoneSize, maxMainStoneSize);
  // console.log(mainStoneSize) // for debugging

  var mainStoneGeom = campfireTrack(
    stoneTrack(new THREE.IcosahedronGeometry(mainStoneSize))
  );

  var noise_min;
  var noise_max;

  if (mainStoneSize >= 2.5) {
    //mainStoneType = "big"; // for debugging
    noise_min = 0.7;
    noise_max = 0.8;
  } else if (mainStoneSize >= 1.5) {
    //mainStoneType = "medium"; // for debugging
    noise_min = 0.5;
    noise_max = 0.7;
  } else {
    //mainStoneType = "small"; // for debugging
    noise_min = 0.4;
    noise_max = 0.7;
  }

  // Perform deformation
  getFlatIcosahedron(mainStoneGeom, noise_max, noise_min);

  // create a material for all stones (white - temporary; change to grey)
  var mat = campfireTrack(
    stoneTrack(
      new THREE.MeshPhongMaterial({
        color: colors.rockGrey,
        //map: stoneTexture,
        flatShading: true,
        shininess: 0,
        specular: 0x000000,
        wireframe: false,
      })
    )
  );

  // Creating main stone
  var mainStoneMesh = campfireTrack(
    stoneTrack(new THREE.Mesh(mainStoneGeom, mat))
  );

  // set the Y position and rotation (X and Z = 0, CENTER)
  mainStoneMesh.position.y = 0.001;
  mainStoneMesh.rotation.y = randomRange(0, 2 * Math.PI);
  // allow main stone to cast and to receive shadows
  mainStoneMesh.castShadow = true;
  mainStoneMesh.receiveShadow = true;
  // add the main stone to the container we first created
  this.mesh.add(mainStoneMesh);

  // 0 - 4 side smaller stones - amount and sizes
  var nSideStones = randomRangeFloorInclusive(0, 4); // Number of side stones
  //console.log("Number of stones: ", nSideStones); // for debugging

  var minSideStoneSize = 0.1;
  var maxSideStoneSize = 0.5;

  var sideStoneType;

  //console.log(mainStoneType) // for debugging
  //console.log(mainStoneSize) // for debugging

  // Create small stones geometries (N * randomised sizes)
  if (nSideStones != 0) {
    var sideStoneSize = Array.from({ length: nSideStones }, () =>
      randomRange(minSideStoneSize, maxSideStoneSize)
    );

    var sideStoneGeom = [];

    for (let i = 0; i < nSideStones; i++) {
      var tempGeom = campfireTrack(
        stoneTrack(new THREE.IcosahedronGeometry(sideStoneSize[i]))
      );

      // Deformation noise
      var noise_min;
      var noise_max;

      if (sideStoneSize[i] >= 1) {
        noise_min = 0.3;
        noise_max = 0.4;
      } else if (sideStoneSize[i] >= 0.5) {
        noise_min = 0.1;
        noise_max = 0.2;
      } else {
        noise_min = 0;
        noise_max = 0.1;
      }

      // Perform deformation
      getFlatIcosahedron(tempGeom, noise_max, noise_min);

      sideStoneGeom.push(tempGeom);
    }

    // Distance paramaters for side stones from main stone
    var minDistance = -3;
    var maxDistance = 3;

    for (let i = 0; i < nSideStones; i++) {
      // main stone posXY = (0, 0)

      // create the mesh by cloning the geometry
      var sideStoneMesh = campfireTrack(
        stoneTrack(new THREE.Mesh(sideStoneGeom[i], mat))
      );

      // Set the sidestones around the mainstone
      sideStoneMesh.position.x = randomRangeFloorInclusive(
        minDistance,
        maxDistance
      );
      sideStoneMesh.position.y = 0.001;
      sideStoneMesh.position.z = randomRangeFloorInclusive(
        minDistance,
        maxDistance
      );

      sideStoneMesh.rotation.y = randomRange(0, 2 * Math.PI);

      // allow each cube to cast and to receive shadows
      sideStoneMesh.castShadow = true;
      sideStoneMesh.receiveShadow = true;

      // add the cube to the container we first created
      this.mesh.add(sideStoneMesh);
    }
  }
};

// STONEGROUND
// Define a StoneGround Object
StoneGround = function () {
  // Create an empty container
  this.mesh = new THREE.Object3D();

  // Choose a number of stones to be scattered in the sky
  this.nStones = numStones;

  // Positioning checker
  // Used to avoid stones overlapping
  var allBoundingBoxes = [];

  // create the stones
  for (var i = 0; i < this.nStones; i++) {
    // Positioning checker
    // Used to avoid tree overlapping
    var box3 = new THREE.Box3();
    var size = new THREE.Vector3();

    var s = new Stone();

    do {
      //s.mesh.position.y = 5;
      s.mesh.position.x = objectPlacer("forest");
      //console.log(s.mesh.position.x); // for debugging

      // for a better result, we position the stones
      // at random depths inside of the scene
      s.mesh.position.z = objectPlacer("forest");
      //console.log(s.mesh.position.z); // for debugging
    } while (!positioningHelper(s.mesh.position.x, s.mesh.position.z));

    // Avoid overlapping using boundary box
    // https://stackoverflow.com/questions/41459512/from-boundingboxhelper-to-boxhelper
    //var sBoundingBox = new THREE.BoxHelper(s.mesh, 0xff0000);
    //box3.setFromObject(sBoundingBox);
    //console.log(i, box3);

    // Creating bounding box
    box3.setFromObject(s.mesh);
    // adding it to the rest of bounding boxes
    //box3.getSize(size);
    allBoundingBoxes.push(box3);

    var intersectionFound = false;

    for (let i = 0; i < allBoundingBoxes.length - 1; i++) {
      var interesected = box3.intersectsBox(allBoundingBoxes[i]);
      //console.log(i, interesected, allBoundingBoxes.length, allBoundingBoxes.length - 1, allBoundingBoxes[i]);
      if (interesected) intersectionFound = true;
    }

    if (!intersectionFound) {
      // do not forget to add the mesh of each stone in the scene
      this.mesh.add(s.mesh);
      //this.mesh.add(sBoundingBox);
    } else {
      // remove geometry and material
      stoneResTracker.disposeLast();
      s.mesh = undefined;
      allBoundingBoxes.pop();
    }
  }
};

var stoneGround = new StoneGround();
stoneGround.mesh.position.y += terrainHeight / 2;
terrain.add(stoneGround.mesh);

/*
// TO IGNORE - for debugging (memory leaks, etc..)
var stonesEnabled = true;
function enableStones() {

	if(stonesEnabled == false) {
		stoneGround = new StoneGround();
		stoneGround.mesh.position.y = terrainHeight/2;
		terrain.add(stoneGround.mesh);
		stonesEnabled = true;
	}
	else {
		terrain.remove(stoneGround.mesh);
		//stoneGround.mesh.material.dispose();
		//stoneGround.mesh.material.dispose();
		stoneGround.mesh = undefined;
		stonesEnabled = false;
	}
}
*/

// Generate new stones
function generateStones() {
  if (stoneGround != null) {
    // security check
    // Removing existing mesh
    terrain.remove(stoneGround.mesh);
    stoneResTracker.dispose();
    stoneGround.mesh = undefined;

    // Creating new one
    stoneGround = new StoneGround();
    stoneGround.mesh.position.y = terrainHeight / 2;
    terrain.add(stoneGround.mesh);
  }
}

// ##########################################

// Clouds

Cloud = function () {
  // Create an empty container that will hold the different parts of the cloud
  this.mesh = cloudTrack(new THREE.Object3D());

  // create a cube geometry;
  // this shape will be duplicated to create the cloud
  var geom = cloudTrack(new THREE.BoxGeometry(20, 20, 20));

  // create a material; a simple white material will do the trick
  var mat = cloudTrack(
    new THREE.MeshLambertMaterial({
      color: colors.white,
      transparent: true,
      opacity: randomRange(0.6, 0.9), // random opacity, opaque or clear clouds
      wireframe: false,
    })
  );

  // randomise the number of clouds in each "block"
  var nBlocs = randomRangeFloorInclusive(4, 6);

  for (var i = 0; i < nBlocs; i++) {
    // create the mesh by cloning the geometry
    var m = cloudTrack(new THREE.Mesh(geom, mat));

    // set the position and the rotation of each cube randomly
    m.position.x = i * 15;
    m.position.y = randomRange(0, 10);
    m.position.z = randomRange(0, 10);
    m.rotation.z = randomRange(0, 2 * Math.PI);
    m.rotation.y = randomRange(0, 2 * Math.PI);

    // set the size of the cube randomly
    var s = randomRange(0.1, 0.9);
    m.scale.set(s, s, s);

    // clouds cast shadows but they don't receive shadows from other clouds?
    // from a computer graphics perspective they do?
    m.castShadow = true;
    m.receiveShadow = true;

    // add the cube to the container we first created
    this.mesh.add(m);
  }
};

// SKY
// Define a Sky Object
Sky = function () {
  // Create an empty container
  this.mesh = cloudTrack(new THREE.Object3D());

  // Choose a number of clouds to be scattered in the sky
  this.nClouds = numClouds;

  // randomising rotation
  var stepAngle = (Math.PI * 2) / this.nClouds;

  // create the clouds
  for (var i = 0; i < this.nClouds; i++) {
    var c = new Cloud();

    // set the rotation and the position of each cloud
    var a = stepAngle * i; // final angle of the cloud
    c.mesh.position.y = randomRangeFloorInclusive(0, 30);
    c.mesh.position.x = objectPlacer("sky");
    // console.log(c.mesh.position.x); // for debugging
    // for a better result, we position the clouds
    // at random depths inside of the scene
    c.mesh.position.z = objectPlacer("sky");
    // console.log(c.mesh.position.z); // for debugging
    c.mesh.rotation.y = a + Math.PI / 2;

    // we also set a random scale for each cloud of cubes
    var s = randomRange(0.4, 1);
    c.mesh.scale.set(s, s, s);

    // add the mesh of each cloud in the scene
    this.mesh.add(c.mesh);
  }
};

// Now we instantiate the sky
var sky = new Sky();
sky.mesh.position.y = 150;
terrain.add(sky.mesh);

/*
// TO IGNORE - for debugging (memory leaks, etc..)

var skyEnabled = true;
function enableSky() {

	if(sky == null || skyEnabled == false) {
		sky = new Sky();
		sky.mesh.position.y = 150;
		terrain.add(sky.mesh);
		skyEnabled = true;
	}
	else {
		terrain.remove(sky.mesh);
		//sky.mesh.material.dispose();
		//sky.mesh.material.dispose();
		sky.mesh = undefined;
		skyEnabled = false;
	}
}
*/

// Generating new clouds
function generateSky() {
  if (sky != null) {
    // security check
    // Removing existing mesh
    terrain.remove(sky.mesh);
    cloudResTracker.dispose();
    sky.mesh = undefined;

    // Creating new one
    sky = new Sky();
    sky.mesh.position.y = 150;
    terrain.add(sky.mesh);
  }
}

// ##########################################

// TODO: ADD LIGHTS ON WINDOWS AND SIDES (change intensity based on daytime!)

// Airplane

AirPlane = function () {
  const randomAirplaneColor =
    airplaneColors[randomRangeFloorInclusive(0, airplaneColors.length - 1)];
  //console.log(randomAirplaneColor) // for debugging

  this.mesh = new THREE.Object3D();

  // Create the main frame
  var geomMainFrame = new THREE.BoxGeometry(80, 50, 60, 1, 1, 1);
  var matMainFrame = new THREE.MeshPhongMaterial({
    color: randomAirplaneColor,
    shininess: 180,
    specular: 0x121212,
    wireframe: false,
  });

  // Get vertices' positions (local coordinates)
  // Access .attributes.position array
  var positionAttribute = geomMainFrame.getAttribute("position");

  // https://threejs.org/docs/#api/en/math/Vector3
  const objVertex = new THREE.Vector3(); // 3D vector to catch position of each vertex

  // Go through all vertices
  for (
    let vertexIndex = 0;
    vertexIndex < positionAttribute.count;
    vertexIndex++
  ) {
    // Accessing each vertex position
    objVertex.fromBufferAttribute(positionAttribute, vertexIndex);

    var yPos = objVertex.y;
    var zPos = objVertex.z;

    // Modifying back vertices of main frame (another geometry could be used instead of
    // doing this)
    if (vertexIndex == 4 || vertexIndex == 21 || vertexIndex == 8) {
      yPos -= 20;
      zPos += 20;
    }

    if (vertexIndex == 5 || vertexIndex == 16 || vertexIndex == 10) {
      yPos -= 20;
      zPos -= 20;
    }

    if (vertexIndex == 6 || vertexIndex == 23 || vertexIndex == 14) {
      yPos += 20;
      zPos += 20;
    }

    if (vertexIndex == 7 || vertexIndex == 18 || vertexIndex == 12) {
      yPos += 20;
      zPos -= 20;
    }

    // Set the new vertex position
    geomMainFrame.attributes.position.setXYZ(
      vertexIndex,
      objVertex.x,
      yPos,
      zPos
    );
  }

  // Update vertices positions
  geomMainFrame.attributes.position.needsUpdate = true;

  // Updating the normal vectors (recompute)
  geomMainFrame.computeVertexNormals();

  var mainFrame = new THREE.Mesh(geomMainFrame, matMainFrame);
  mainFrame.castShadow = true;
  mainFrame.receiveShadow = true;
  this.mesh.add(mainFrame);

  // Create the engine
  var geomEngine = new THREE.BoxGeometry(20, 50, 60, 1, 1, 1);
  var matEngine = new THREE.MeshPhongMaterial({
    color: colors.lightMetal,
    shininess: 180,
    specular: 0x121212,
    wireframe: false,
  });

  var engine = new THREE.Mesh(geomEngine, matEngine);
  engine.position.x = 50;
  engine.castShadow = true;
  engine.receiveShadow = true;
  this.mesh.add(engine);

  // Create the tail
  var geomTailPlane = new THREE.BoxGeometry(20, 15, 5, 1, 1, 1);
  var tailPlane = new THREE.Mesh(geomTailPlane, matMainFrame);
  tailPlane.position.set(-45, 10, 0);
  tailPlane.castShadow = true;
  tailPlane.receiveShadow = true;
  this.mesh.add(tailPlane);

  // Create the wing
  var geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
  var sideWing = new THREE.Mesh(geomSideWing, matMainFrame);
  sideWing.castShadow = true;
  sideWing.receiveShadow = true;
  this.mesh.add(sideWing);

  // propeller
  var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
  this.propeller = new THREE.Mesh(geomPropeller, matEngine);
  this.propeller.castShadow = true;
  this.propeller.receiveShadow = true;

  // blades
  var geomBlade = new THREE.BoxGeometry(1, 70, 20, 1, 1, 1);
  var matBlade = new THREE.MeshPhongMaterial({
    color: colors.darkMetal,
    flatShading: true,
    shininess: 180,
    specular: 0x121212,
    wireframe: false,
  });
  var blade = new THREE.Mesh(geomBlade, matBlade);
  blade.position.set(8, 0, 0);
  blade.castShadow = true;
  blade.receiveShadow = true;
  this.propeller.add(blade);
  this.propeller.position.set(60, 0, 0);
  this.mesh.add(this.propeller);
};

// Now we instantiate the airplane
var airplane = new AirPlane();
airplane.mesh.scale.set(0.3, 0.21, 0.21);
terrain.add(airplane.mesh);

/*
// TO IGNORE - for debugging (memory leaks, etc..)
var airplaneEnabled = false;
function enablePlane() {

	if(airplane == null || airplaneEnabled == false) {
		airplane = new AirPlane();
		airplane.mesh.scale.set(0.3, .21, .21);
		//airplane.mesh.position.y = -10.55;
		//airplane.mesh.rotation.y = - Math.PI / 4;
		terrain.add(airplane.mesh);
		airplaneEnabled = true;
	}
	else {
		terrain.remove(airplane.mesh);
		//airplane.mesh.material.dispose();
		//airplane.mesh.material.dispose();
		airplane.mesh = undefined;
		airplaneEnabled = false;
	}
}
enablePlane();
*/

// Plane animation
// Creating plane path
// Specifying 4 points (start, 2 control points, and end)
// Create a curve that tries its best to pass through all the points
// and be as smooth as possible
var planePath = new THREE.CubicBezierCurve3(
  new THREE.Vector3(-300, 100, 0),
  new THREE.Vector3(0, 100, -450),
  new THREE.Vector3(450, 100, 0),
  new THREE.Vector3(0, 100, 300)
);

// for debugging - visualisation
//var pointsc = planePath.getPoints(100); // Sample 100 points from the created curve
//var geometryc = new THREE.BufferGeometry().setFromPoints(pointsc);
//var materialc = new THREE.LineBasicMaterial({ color: 0xff0000 });
//var splineObject = new THREE.Line(geometryc, materialc);
//terrain.add(splineObject);

function animatePlane(u) {
  // https://threejs.org/docs/#api/en/extras/core/Curve
  // http://cs.wellesley.edu/~cs307/lectures/15.shtml
  // https://stackoverflow.com/questions/11179327/orient-objects-rotation-to-a-spline-point-tangent-in-three-js

  //console.log(planePath.getLength())
  //console.log(planePath.getLengths())

  // Following path
  // Returns a vector for a given position on the curve according to the arc length.
  var planePosition = planePath.getPoint(u);
  // Updating plane position
  airplane.mesh.position.set(planePosition.x, planePosition.y, planePosition.z);

  // Orientation
  // Returns tangent at a point which is equidistant to the ends of the curve
  var planeOrientation = planePath.getTangent(u).normalize();
  airplane.mesh.lookAt(planeOrientation);

  // Rotate the propeller
  if (u != 0) airplane.propeller.rotation.x += delta * airplanePropellerSpeed;
}

// ##########################################

// Trees (pine and blob)

pineTree = function () {
  this.mesh = treeTrack(new THREE.Object3D());

  // RANDOMISE RADIUSES, FIGURE OUT BEST NOISE
  // RANDOMISE TREES HEIGHTS -> WILL NEED TO PROPERLY FIX LEAVES POSITIONS AND SCALING
  var trunkHeight = 7;
  var trunkRadiusTop = randomRange(0.5, 0.6);
  var trunkRadiusBottom = randomRange(0.8, 1.3);

  // Create trunk
  var geomTrunk = treeTrack(
    new THREE.CylinderGeometry(
      trunkRadiusTop,
      trunkRadiusBottom,
      trunkHeight,
      8,
      4,
      false
    )
  );
  var matTrunk = treeTrack(
    new THREE.MeshPhongMaterial({
      color: colors.pineWood,
      flatShading: true,
      shininess: 0,
      specular: 0x000000,
      wireframe: false,
    })
  );

  // TODO: DECIDE NOISE BASED ON RADIUSES
  //var noise_min = -0.25;	// for full defor false
  //var noise_max = 0.25;	// for full defor false

  // Deformation noise
  var noise_min = -0.45;
  var noise_max = 0.45;

  // Deform trunk
  getDeformedCylinder(geomTrunk, noise_max, noise_min, false);

  this.trunk = treeTrack(new THREE.Mesh(geomTrunk, matTrunk));
  //this.trunk.castShadow = true; // should be on, but given the light sources we can have it off
  this.trunk.receiveShadow = true;

  // TODO: RANDOMISE POSITIONS

  // Create leaves
  var nLayers = 4; // Leaves layers
  var layersPos = [1.3, 2.7, 4, 5];
  var layersScaling = [1, 0.75, 0.6, 0.5];

  //const leavesGroup = new THREE.Group();

  for (let i = 0; i < nLayers; i++) {
    var geomLeavesLayer = treeTrack(new THREE.ConeGeometry(4, trunkHeight));
    var matLeavesLayer = treeTrack(
      new THREE.MeshPhongMaterial({
        color: colors.pineGreen,
        //map: pineTexture,
        flatShading: true,
        shininess: 0,
        specular: 0x000000,
        wireframe: false,
      })
    );

    // TODO: MAKE LEAVES DEFORMATION

    var leavesLayer = treeTrack(
      new THREE.Mesh(geomLeavesLayer, matLeavesLayer)
    );
    leavesLayer.scale.set(layersScaling[i], layersScaling[i], layersScaling[i]);
    leavesLayer.position.y = layersPos[i];
    leavesLayer.rotation.y = randomRangeFloorInclusive(0, Math.PI);
    leavesLayer.castShadow = true;
    leavesLayer.receiveShadow = true;
    //leavesGroup.add(leavesLayer);
    this.trunk.add(leavesLayer);
  }

  //this.trunk.add(leavesGroup);

  // ADD SCALING RANDOMISATION
  var s = randomRange(0.8, 2);
  this.trunk.scale.set(s, s, s);
  this.trunk.position.y = (trunkHeight / 2) * s;

  this.mesh.add(this.trunk);
};

blobTree = function () {
  this.mesh = treeTrack(new THREE.Object3D());

  var trunkHeight = 6;
  //var trunkRadiusTop = 1;
  //var trunkRadiusBottom = 1.5;
  var trunkRadiusTop = randomRange(0.5, 0.6);
  var trunkRadiusBottom = randomRange(1, 1.7);

  // Create trunk
  var geomTrunk = treeTrack(
    new THREE.CylinderGeometry(
      trunkRadiusTop,
      trunkRadiusBottom,
      trunkHeight,
      8,
      4,
      true
    )
  );
  var matTrunk = treeTrack(
    new THREE.MeshPhongMaterial({
      color: colors.blobWood,
      flatShading: true,
      shininess: 0,
      specular: 0x000000,
      wireframe: false,
    })
  );

  // Deformation noise
  var noise_min = -0.25; // for full defor true
  var noise_max = 0.25; // for full defor true

  // Deform trunk
  getDeformedCylinder(geomTrunk, noise_max, noise_min, true);

  this.trunk = treeTrack(new THREE.Mesh(geomTrunk, matTrunk));
  this.trunk.castShadow = true;
  this.trunk.receiveShadow = true;

  // Create leaves
  var nLeaves = randomRangeFloorInclusive(4, 8);
  //console.log(nLeaves) // for debugging

  // Leaves random color
  var randTreeLeavesColor = randomRangeFloorInclusive(0, 2);

  var matLeaves = treeTrack(
    new THREE.MeshLambertMaterial({
      color: treeLeavesColors[randTreeLeavesColor],
      //flatShading: true,
      wireframe: false,
    })
  );

  for (let i = 0; i < nLeaves; i++) {
    minLeavesBushSize = 3;
    maxLeavesBushSize = 5;

    // 1 big bush
    var leavesBushSize = randomRange(minLeavesBushSize, maxLeavesBushSize);
    // console.log(leavesBushSize)

    // Deformation noise
    var noise_min = 1;
    var noise_max = 2;

    var geomLeaves = treeTrack(new THREE.IcosahedronGeometry(leavesBushSize));
    getDeformedIcosahedron(geomLeaves, noise_max, noise_min);

    var leaves = treeTrack(new THREE.Mesh(geomLeaves, matLeaves));
    //leaves.position.x = 20;
    leaves.position.y = trunkHeight / 2;
    //leaves.position.z = 20;
    leaves.rotation.y = randomRange(0, 2 * Math.PI);

    leaves.castShadow = true;
    leaves.receiveShadow = true;

    this.trunk.add(leaves);
  }

  // ADD SCALING RANDOMISATION
  var s = randomRange(0.8, 1.2);
  this.trunk.scale.set(s, s, s);
  this.trunk.position.y = (trunkHeight / 2) * s;
  this.mesh.add(this.trunk);
};

thinTree = function () {
  // EXTRA: ADD ANOTHER TYPE OF TREE

  this.mesh = new THREE.Object3D();

  // Create trunk
  // Create leaves
};

// Moved from firefly section, to avoid tree overlapping with firefly colonies at night
var fireflyColonies;
fireflyColoniesEnabled = false;

// TREEGROUND
// Define a TreeGround Object
TreeGround = function () {
  // Create an empty container
  this.mesh = treeTrack(new THREE.Object3D());

  // Choose a number of trees to be scattered
  this.nTrees = numTrees;

  // Positioning checker
  // Used to avoid tree overlapping and firefly overlapping when enabled
  if (fireflyColoniesEnabled) {
    // https://stackoverflow.com/questions/597588/how-do-you-clone-an-array-of-objects-in-javascript
    //console.log(fireflyColonies.allBoundingBoxesFirefliesOnly)
    this.allBoundingBoxes = JSON.parse(
      JSON.stringify(fireflyColonies.allBoundingBoxesFirefliesOnly)
    );
  } else {
    this.allBoundingBoxes = [];
  }

  // create the stones
  for (var i = 0; i < this.nTrees; i++) {
    // Positioning checker
    // Used to avoid tree overlapping
    var box3 = new THREE.Box3();
    var size = new THREE.Vector3();

    // Randomise picked tree
    var s;

    // 40% chance true
    var probable = probability(0.4);
    //console.log(probable)

    if (probable) s = new pineTree();
    // true, pine tree
    else s = new blobTree(); // false, blob tree

    // Find proper position within the boundaries
    do {
      //s.mesh.position.y = 5;
      s.mesh.position.x = objectPlacer("forest");
      //console.log(s.mesh.position.x); // for debugging

      // for a better result, we position the stones
      // at random depths inside of the scene
      s.mesh.position.z = objectPlacer("forest");
      //console.log(s.mesh.position.z); // for debugging
    } while (!positioningHelper(s.mesh.position.x, s.mesh.position.z));

    // Avoid overlapping using boundary box
    // https://stackoverflow.com/questions/41459512/from-boundingboxhelper-to-boxhelper
    //var sBoundingBox = new THREE.BoxHelper(s.mesh, 0xff0000);
    //box3.setFromObject(sBoundingBox);
    //console.log(i, box3);

    // Creating bounding box
    box3.setFromObject(s.mesh);
    // adding it to the rest of bounding boxes
    //box3.getSize(size);
    this.allBoundingBoxes.push(box3);

    var intersectionFound = false;

    for (let i = 0; i < this.allBoundingBoxes.length - 1; i++) {
      var interesected = box3.intersectsBox(this.allBoundingBoxes[i]);
      //console.log(i, interesected, allBoundingBoxes.length, allBoundingBoxes.length - 1, allBoundingBoxes[i]);
      if (interesected) intersectionFound = true;
    }

    if (!intersectionFound) {
      // do not forget to add the mesh of each stone in the scene
      this.mesh.add(s.mesh);
      //this.mesh.add(sBoundingBox);
    } else {
      // remove geometry and material
      treeResTracker.disposeLast();
      s.mesh = undefined;
      this.allBoundingBoxes.pop();
    }
  }
};

var treeGround = new TreeGround();
treeGround.mesh.position.y += terrainHeight / 2;
terrain.add(treeGround.mesh);
var treesEnabled = true;

// TO IGNORE - for debugging (memory leaks, etc..)
function enableTrees() {
  if (treesEnabled == false) {
    treeGround = new TreeGround();
    treeGround.mesh.position.y = terrainHeight / 2;
    terrain.add(treeGround.mesh);
    treesEnabled = true;
  } else {
    terrain.remove(treeGround.mesh);
    treeGround.mesh = undefined;
    treesEnabled = false;
  }
}

// Copy of function above - used in dat GUI
function generateTrees() {
  if (treeGround != null) {
    // security check
    // Removing existing mesh
    terrain.remove(treeGround.mesh);
    treeResTracker.dispose();
    treeGround.mesh = undefined;

    // Creating new one
    treeGround = new TreeGround();
    treeGround.mesh.position.y = terrainHeight / 2;
    terrain.add(treeGround.mesh);
  }
}

// ##########################################

// Fence

Fence = function () {
  // Create an empty container that will hold the different parts of the stone
  this.mesh = new THREE.Object3D();

  // width of the back support (width of the fence)
  this.width = 10;

  // create back logs group
  this.backSupport = new THREE.Group();

  // create a geometry for the back logs
  var geoBackLog = new THREE.BoxGeometry(this.width, 0.5, 0.2);

  // ADD TEXTURE TO WOOD
  // create a material for all fence wood
  var mat = new THREE.MeshPhongMaterial({
    color: colors.fenceWood,
    shininess: 60,
    //specular: 0x0F0F0F,
    wireframe: false,
  });

  /*	// Use this material to avoid objects overlapping flickering problem
	var overMat = new THREE.MeshPhongMaterial({
		color: colors.fenceWood,
		//map: woodTexture
		flatShading: true,
		//shininess: 40, default 30
		specular: 0x050505,
		wireframe: false
	});

	overMat.polygonOffset = true;
	overMat.polygonOffsetFactor = -100;
	*/

  // create bottom back log
  var bottomBackLog = new THREE.Mesh(geoBackLog, mat);
  bottomBackLog.castShadow = true;
  bottomBackLog.receiveShadow = true;
  bottomBackLog.position.y = -0.8;
  //bottomBackLog.rotation.z = randomRange(-0.05, 0.05);
  //console.log(bottomBackLog.rotation.z)
  this.backSupport.add(bottomBackLog);

  // create top back log
  var topBackLog = new THREE.Mesh(geoBackLog, mat);
  topBackLog.castShadow = true;
  topBackLog.receiveShadow = true;
  topBackLog.position.y = 0.8;
  //topBackLog.rotation.z = randomRange(-0.05, 0.05);
  //console.log(topBackLog.rotation.z)
  this.backSupport.add(topBackLog);

  // height of the front logs (height of the fence)
  this.height = 4;
  var widthSingleLog = 1;
  var depth = 0.5;

  // create front logs group
  this.frontSupport = new THREE.Group();

  // left log
  var geoLeftFrontLog = new THREE.BoxGeometry(
    widthSingleLog,
    this.height,
    depth
  );
  //deformLog(geoLeftFrontLog);
  deformLog(geoLeftFrontLog, "sideL");

  var leftFrontLog = new THREE.Mesh(geoLeftFrontLog, mat);
  leftFrontLog.castShadow = true;
  leftFrontLog.receiveShadow = true;
  leftFrontLog.position.x = -this.width / 2 + widthSingleLog / 2 + 2;
  this.frontSupport.add(leftFrontLog);

  // middle left log
  var geoMiddleLeftFrontLog = new THREE.BoxGeometry(
    widthSingleLog,
    this.height,
    depth
  );
  //deformLog(geoMiddleLeftFrontLog);
  deformLog(geoMiddleLeftFrontLog, "sideML");

  var middleLeftFrontLog = new THREE.Mesh(geoMiddleLeftFrontLog, mat);
  middleLeftFrontLog.castShadow = true;
  middleLeftFrontLog.receiveShadow = true;
  middleLeftFrontLog.position.x = -this.width / 2 + widthSingleLog / 2 + 2 + 2;
  //((-this.width/2 + widthSingleLog/2) + (this.width/2 - widthSingleLog/2 - 1.5))/2 - 1.2;
  this.frontSupport.add(middleLeftFrontLog);

  // middle right log
  var geoMiddleRightFrontLog = new THREE.BoxGeometry(
    widthSingleLog,
    this.height,
    depth
  );
  //deformLog(geoMiddleRightFrontLog);
  deformLog(geoMiddleRightFrontLog, "sideMR");

  var middleRightFrontLog = new THREE.Mesh(geoMiddleRightFrontLog, mat);
  middleRightFrontLog.castShadow = true;
  middleRightFrontLog.receiveShadow = true;
  middleRightFrontLog.position.x = this.width / 2 + widthSingleLog / 2 - 2 - 2;
  //((-this.width/2 + widthSingleLog/2) + (this.width/2 - widthSingleLog/2 - 1.5))/2 + 1.2;
  this.frontSupport.add(middleRightFrontLog);

  // right log
  var geoRightFrontLog = new THREE.BoxGeometry(
    widthSingleLog,
    this.height,
    depth
  );
  //deformLog(geoRightFrontLog);
  deformLog(geoRightFrontLog, "sideR");

  var rightFrontLog = new THREE.Mesh(geoRightFrontLog, mat);
  rightFrontLog.castShadow = true;
  rightFrontLog.receiveShadow = true;
  rightFrontLog.position.x = this.width / 2 + widthSingleLog / 2 - 2;
  //this.width/2 - widthSingleLog/2 - 1.5;
  this.frontSupport.add(rightFrontLog);

  //this.mesh.add(this.leftFrontLog);

  //this.backSupport.position.y = -0.1;

  // add the main stone to the container we first created
  this.mesh.add(this.backSupport);
  this.mesh.add(this.frontSupport);
};

// https://stackoverflow.com/questions/17265735/light-coming-out-of-a-lamp-model-in-three-js

// Lamp posts - part of fence
LampPost = function () {
  this.mesh = new THREE.Object3D();

  this.height = 15;

  this.base = new THREE.Group();

  const geoBaseVertical = new THREE.BoxGeometry(1.5, this.height, 1.5);
  const geoBaseHorizontal = new THREE.BoxGeometry(1, this.height / 2 + 1, 1);
  const geoBaseAngle = new THREE.BoxGeometry(0.5, 3.5, 0.5);

  const matWood = new THREE.MeshPhongMaterial({
    color: colors.fenceWood,
    shininess: 60,
    specular: 0x0f0f0f,
    wireframe: false,
  });

  deformLog(geoBaseVertical, "lampPost");
  //deformLog(geoBaseHorizontal, "lampPost");

  // base
  const baseVertical = new THREE.Mesh(geoBaseVertical, matWood);
  baseVertical.castShadow = true;
  baseVertical.receiveShadow = true;

  const baseHorizontal = new THREE.Mesh(geoBaseHorizontal, matWood);
  baseHorizontal.position.set(0, this.height / 2 - 1, 2.2);
  baseHorizontal.rotation.x = -Math.PI / 2;
  baseHorizontal.castShadow = true;
  baseHorizontal.receiveShadow = true;

  const baseAngle = new THREE.Mesh(geoBaseAngle, matWood);
  baseAngle.position.set(0, this.height / 2 - 2.2, 1.5);
  baseAngle.rotation.x = Math.PI / 4;
  baseAngle.castShadow = true;
  baseAngle.receiveShadow = true;

  this.base.add(baseVertical);
  this.base.add(baseHorizontal);
  this.base.add(baseAngle);

  // lamp
  const geoLamp = new THREE.CylinderGeometry(0.4, 1, 1, 4, 1);
  const matLamp = new THREE.MeshPhongMaterial({
    color: colors.darkMetal,
    flatShading: true,
    shininess: 200,
    specular: 0xf2efe8,
    wireframe: false,
  });
  this.lamp = new THREE.Mesh(geoLamp, matLamp);
  this.lamp.castShadow = true;
  this.lamp.receiveShadow = true;
  this.lamp.position.set(0, this.height / 2 - 1 - 1, this.height / 2 - 1 - 0.5);
  this.lamp.rotation.y = Math.PI / 4;

  // light source
  // we use two light sources
  // spotlight for a proper "torch" effect on the ground
  // pointlight to give the lighted bulb effect
  this.spotLight = new THREE.SpotLight(colors.white);
  this.spotLight.intensity = 2;
  this.spotLight.distance = 20;
  this.spotLight.penumbra = 0.5;
  this.spotLight.decay = 2;
  this.spotLight.position.set(0, -1, 0);
  this.spotLight.target.position.set(0, -1000, 0);
  this.spotLight.castShadow = true;
  this.spotLight.shadow.mapSize.width = 1024;
  this.spotLight.shadow.mapSize.height = 1024;
  this.spotLight.visible = false; // light off at first
  this.lamp.add(this.spotLight);
  this.lamp.add(this.spotLight.target);

  this.pointLight = new THREE.PointLight(colors.white, 2, 2.5, 2);
  //this.pointLight.shadow.normalBias = -0.01;
  this.pointLight.position.set(0, -1.5, 0);
  this.pointLight.shadow.mapSize.width = 1024;
  this.pointLight.shadow.mapSize.height = 1024;
  this.pointLight.visible = false; // light off at first
  this.lamp.add(this.pointLight);

  //const helper = new THREE.PointLightHelper(this.pointLight);
  //scene.add(helper)
  //const helper2 = new THREE.SpotLightHelper(this.spotLight);
  //scene.add(helper2)

  this.mesh.add(this.base);
  this.mesh.add(this.lamp);
};

InternalFence = function () {
  // Create an empty container
  this.mesh = new THREE.Object3D();

  // Object groups indicating side of the internal space
  this.top = new THREE.Group();
  this.bottom = new THREE.Group();
  this.left = new THREE.Group();
  this.right = new THREE.Group();

  this.doorLeft = new THREE.Group();
  this.doorRight = new THREE.Group();

  this.doorXPos;
  this.doorXNeg;

  var doorLeftCreated = false;
  var doorRightCreated = false;

  // all fences
  for (let i = 0; i <= 5; i++) {
    // Each side has homeBoundary/10 fences (fence size: 10)
    var nFenceParts =
      (homeBoundaryPositiveWBoundaries - homeBoundaryNegativeWBoundaries) / 10;

    for (
      let k = nFenceParts / 2 - nFenceParts + 0.5;
      k < nFenceParts / 2 + 0.5;
      k++
    ) {
      var doorSize = fenceDoorSize; // smaller is bigger

      var doorSpaceLeft = nFenceParts / 2 - nFenceParts + 0.5 + doorSize;
      var doorSpaceRight = -(nFenceParts / 2 - nFenceParts + 0.5) - doorSize;
      //console.log("doorSpaceLeft", doorSpaceLeft)
      //console.log("doorSpaceRight", doorSpaceRight)
      //console.log(((nFenceParts/2)-nFenceParts) + 0.5)

      this.doorXPos = doorSpaceRight * 10;
      this.doorXNeg = doorSpaceLeft * 10;

      // Creating subfences (part of 1 full fence side)
      var fence = new Fence();
      fence.mesh.position.x = k * 10;
      fence.mesh.position.y += fence.height / 2;

      if (i == 0) {
        // top fence

        this.top.add(fence.mesh);
      } else if (i == 1) {
        // bottom fence

        if (k < doorSpaceLeft) {
          fence.mesh.rotation.y = Math.PI;
          //console.log(fence.mesh.position.x)
          this.bottom.add(fence.mesh);
        }

        if (k > doorSpaceRight) {
          this.bottom.add(fence.mesh);
          //console.log(fence.mesh.position.x)
        }
      } else if (i == 2) {
        // left fence

        fence.mesh.position.x = 0;
        fence.mesh.position.z = k * 10;
        fence.mesh.rotation.y = Math.PI / 2;
        this.left.add(fence.mesh);
      } else if (i == 3) {
        // right fence
        fence.mesh.position.x = 0;
        fence.mesh.position.z = k * 10;
        fence.mesh.rotation.y = Math.PI / 2;
        this.right.add(fence.mesh);
      } else if (i == 4 && !doorLeftCreated) {
        // door left fence
        fence.mesh.position.z = -k * 10;
        fence.mesh.position.x = doorSpaceLeft * fence.width - fence.width / 2;
        fence.mesh.rotation.y = Math.PI / 2;
        this.doorLeft.add(fence.mesh);
        doorLeftCreated = true;
      } else if (i == 5 && !doorRightCreated) {
        // door right fence
        fence.mesh.position.z = -k * 10;
        fence.mesh.position.x = doorSpaceRight * fence.width + fence.width / 2;
        fence.mesh.rotation.y = Math.PI / 2;
        this.doorRight.add(fence.mesh);
        doorRightCreated = true;
      }
    }
  }

  // Add door on bottom fence
  this.top.position.z = homeBoundaryNegativeWBoundaries;
  this.bottom.position.z = homeBoundaryPositiveWBoundaries - 0.2;
  this.left.position.x = homeBoundaryNegativeWBoundaries;
  this.left.position.z -= 0.1;
  this.right.position.x = homeBoundaryPositiveWBoundaries;
  this.right.position.z -= 0.1;
  this.doorLeft.position.z -= 0.1;
  this.doorRight.position.z -= 0.1;
  this.mesh.add(this.top);
  this.mesh.add(this.bottom);
  this.mesh.add(this.left);
  this.mesh.add(this.right);
  this.mesh.add(this.doorLeft);
  this.mesh.add(this.doorRight);

  // lamp post left
  this.lampPostLeft = new LampPost();
  this.lampPostLeft.mesh.position.y = this.lampPostLeft.height / 2;
  this.lampPostLeft.mesh.position.z = homeBoundaryPositiveWBoundaries;
  this.lampPostLeft.mesh.position.x = this.doorXNeg - 5;
  this.mesh.add(this.lampPostLeft.mesh);

  // lamp post right
  this.lampPostRight = new LampPost();
  this.lampPostRight.mesh.position.y = this.lampPostLeft.height / 2;
  this.lampPostRight.mesh.position.z = homeBoundaryPositiveWBoundaries;
  this.lampPostRight.mesh.position.x = this.doorXPos + 5;
  this.mesh.add(this.lampPostRight.mesh);
};

var internalFence = new InternalFence();
internalFence.mesh.position.y += terrainHeight / 2;
terrain.add(internalFence.mesh);
var fenceEnabled = true;

function enableFence() {
  if (fenceEnabled == false) {
    internalFence = new InternalFence();
    internalFence.mesh.position.y += terrainHeight / 2;
    terrain.add(internalFence.mesh);
    fenceEnabled = true;
  } else {
    terrain.remove(internalFence.mesh);
    internalFence.mesh = undefined;
    fenceEnabled = false;
  }

  turnLights();
}

// TODO MOVE THIS FUNCTION INSIDE CHANGE LIGHTS
var lampPostOn = false;
function turnLights() {
  // Enable lights on/off only if it's midnight and
  // if the fence is enabled -> DONE, LAMPOST ARE PART OF FENCE

  if (currDayTime == "midnight" && lampPostOn == false) {
    internalFence.lampPostLeft.spotLight.visible = true; // light on
    internalFence.lampPostLeft.pointLight.visible = true; // light on
    internalFence.lampPostRight.spotLight.visible = true; // light on
    internalFence.lampPostRight.pointLight.visible = true; // light on
    lampPostOn = true;
  } else {
    internalFence.lampPostLeft.spotLight.visible = false; // light on
    internalFence.lampPostLeft.pointLight.visible = false; // light on
    internalFence.lampPostRight.spotLight.visible = false; // light on
    internalFence.lampPostRight.pointLight.visible = false; // light on
    lampPostOn = false;
  }
}

// ##########################################

// Fireflies

FireflyColony = function () {
  this.mesh = fireflyTrack(new THREE.Object3D());

  this.nFireflies = randomRangeFloorInclusive(15, 30);

  const geoFirefly = fireflyTrack(new THREE.BufferGeometry());

  // random positions of each particle
  const positionArray = new Float32Array(this.nFireflies * 3);

  // random scaling for each particle (natural look - organic)
  const scaleArray = new Float32Array(this.nFireflies); // we need 1 value per vertex

  // random fading for each particle
  const fadeArray = new Float32Array(this.nFireflies); // we need 1 value per vertex

  for (let i = 0; i < this.nFireflies; i++) {
    // Generating positions
    positionArray[i * 3 + 0] = randomRange(0, randomRangeFloorInclusive(-7, 7));
    positionArray[i * 3 + 1] = randomRange(0, randomRangeFloorInclusive(0, 3));
    positionArray[i * 3 + 2] = randomRange(0, randomRangeFloorInclusive(-7, 7));

    // Generating organic scaling
    scaleArray[i] = randomRange(0.1, 0.7);

    // Generating random fading
    fadeArray[i] = randomRange(0.03, 0.1);
    //* (0.09 - 0.02) + 0.02;	// Default would be 0.1
    //console.log(fadeArray[i]);
  }

  geoFirefly.setAttribute(
    "position",
    new THREE.BufferAttribute(positionArray, 3)
  );
  geoFirefly.setAttribute("aScale", new THREE.BufferAttribute(scaleArray, 1));
  geoFirefly.setAttribute("rFade", new THREE.BufferAttribute(fadeArray, 1));

  // https://threejs.org/examples/#webgl_materials_blending
  this.matFirefly = fireflyTrack(
    new THREE.ShaderMaterial({
      transparent: true,
      //blending: THREE.AdditiveBlending,	// Make points shinier, made from light
      depthWrite: false, // Avoiding clipping issues
      uniforms: {
        // Fixing pixel problems
        // Sending the pixel ratio of the screen as a uniform
        // We can't use renderer.getPixel
        uPixelRatio: {
          value: renderer.getPixelRatio(),
        },
        uSize: {
          value: 200, // size of the points
        },
        uTime: {
          // used to animate the fireflies
          value: 0,
        },
      },
      vertexShader: FIREFLIES_VS,
      fragmentShader: FIREFLIES_FS,
    })
  );

  const firefly = fireflyTrack(new THREE.Points(geoFirefly, this.matFirefly));

  // random position of fireflies
  fireflyYPos = randomRangeFloorInclusive(4, 8);
  firefly.position.y = fireflyYPos;
  this.mesh.add(firefly);

  // creating proper lighting settings
  // if fireflies are near the ground, more intense lighting
  // if fireflies are farther away from the ground, less intense lighting
  if (fireflyYPos > 6) {
    // Add light sources of fireflies
    var randomIntensity = randomRange(0.1, 0.2);
    //console.log(randomIntensity)
  } else if (fireflyYPos <= 6) {
    // Add light sources of fireflies
    var randomIntensity = randomRange(0.2, 0.3);
    //console.log(randomIntensity)
  }

  // If we were to add a light to each single particle, we would use pointlights
  // However, since we just want to light the "general" area of where the fireflies are
  // we use a spotlight
  // https://www.linyang.work/firefly
  //var firefliesLight = new THREE.SpotLight(colors.white, randomIntensity);
  var firefliesLight = new THREE.SpotLight(0xffff80, randomIntensity);
  // Casting shadows when fireflies are near other objects
  firefliesLight.castShadow = true;
  firefliesLight.shadow.mapSize.width = 1980;
  firefliesLight.shadow.mapSize.height = 1980;
  firefliesLight.shadow.radius = 10;
  //firefliesLight.shadow.camera.near = 1;
  //firefliesLight.shadow.camera.far = 50;
  //firefliesLight.shadow.camera.fov = 30;

  // not used
  //firefliesLight.distance = randomRangeFloorInclusive(20, 35);
  //firefliesLight.angle = Math.PI/4;
  //firefliesLight.target.position.set(0, 0, 0);

  firefliesLight.decay = 2;

  // moving light up or down, based on position of fireflies
  if (fireflyYPos > 6) {
    firefliesLight.position.set(0, 12, 0);
    firefliesLight.penumbra = 1;
  } else if (fireflyYPos <= 6) {
    firefliesLight.position.set(0, 10, 0);
    firefliesLight.penumbra = 0.5;
  }

  //const helper = new THREE.SpotLightHelper(firefliesLight);
  //scene.add(helper);

  this.mesh.add(firefliesLight);
  this.mesh.add(firefliesLight.target);
};

// We could have a single container for all fireflies colonies if we don't want to animate them
FirefliesColonies = function () {
  // Create an empty container
  this.mesh = fireflyTrack(new THREE.Object3D());

  this.nFirefliesColonies = numFireflyColonies;

  // Array used to store the material of each firefly colony
  // this is done in order to access each material and animate the colony
  this.fireflyColoniesMaterials = [];

  // Positioning checker
  // Used to avoid overlapping with trees (rocks and grass can be ignored since they are short)
  this.allBoundingBoxes = treeGround.allBoundingBoxes;
  // and another one, taken in consideration when spawning new trees at night,
  // to avoid overlapping with fireflies
  // no need to check overlapping between fireflies colonies
  // nothing bad would happen
  this.allBoundingBoxesFirefliesOnly = [];

  // create the stones
  for (var i = 0; i < this.nFirefliesColonies; i++) {
    // Positioning checker
    // Used to avoid overlapping with trees
    var box3 = new THREE.Box3();
    var size = new THREE.Vector3();

    var s = new FireflyColony();

    this.fireflyColoniesMaterials.push(s.matFirefly);

    do {
      //s.mesh.position.y = 5;
      s.mesh.position.x = objectPlacer("forest");
      //console.log(s.mesh.position.x); // for debugging

      // for a better result, we position the stones
      // at random depths inside of the scene
      s.mesh.position.z = objectPlacer("forest");
      //console.log(s.mesh.position.z); // for debugging
    } while (!positioningHelper(s.mesh.position.x, s.mesh.position.z));

    // Avoid overlapping using boundary box
    // https://stackoverflow.com/questions/41459512/from-boundingboxhelper-to-boxhelper
    //var sBoundingBox = new THREE.BoxHelper(s.mesh, 0xff0000);
    //box3.setFromObject(sBoundingBox);
    //console.log(i, box3);

    // Creating bounding box
    box3.setFromObject(s.mesh);
    // adding it to the rest of bounding boxes
    //box3.getSize(size);
    this.allBoundingBoxes.push(box3);

    var intersectionFound = false;

    for (let i = 0; i < this.allBoundingBoxes.length - 1; i++) {
      var interesected = box3.intersectsBox(this.allBoundingBoxes[i]);
      //console.log(i, interesected, allBoundingBoxes.length, allBoundingBoxes.length - 1, allBoundingBoxes[i]);
      if (interesected) intersectionFound = true;
    }

    if (!intersectionFound) {
      // do not forget to add the mesh of each stone in the scene
      this.mesh.add(s.mesh);
      //this.mesh.add(sBoundingBox);
      // adding the valid firefly position only to the firefly boundary box array
      // used in treeground, to avoid overlapping with fireflies when generating new trees
      this.allBoundingBoxesFirefliesOnly.push(box3);
    } else {
      fireflyResTracker.disposeLast();
      s.mesh = undefined;
      this.allBoundingBoxes.pop();
    }
  }
};

function updateFireflies() {
  if (currDayTime == "midnight" && fireflyColoniesEnabled == false) {
    fireflyColonies = new FirefliesColonies();
    // moved inside fireflies to compute lighting positions
    fireflyColonies.mesh.position.y += terrainHeight / 2;
    terrain.add(fireflyColonies.mesh);
    fireflyColoniesEnabled = true;
  } else {
    if (fireflyColoniesEnabled == true) {
      terrain.remove(fireflyColonies.mesh);
      fireflyResTracker.dispose();
      fireflyColonies.mesh = undefined;
      fireflyColoniesEnabled = false;
    }
  }
}

// Copy of function above - used in dat GUI
function generateFireflies() {
  if (currDayTime == "midnight" && fireflyColoniesEnabled == true) {
    if (fireflyColonies != null) {
      // security check
      // Removing existing mesh
      terrain.remove(fireflyColonies.mesh);
      fireflyResTracker.dispose();
      fireflyColonies.mesh = undefined;

      // Creating new one
      fireflyColonies = new FirefliesColonies();
      // moved inside fireflies to compute lighting positions
      fireflyColonies.mesh.position.y += terrainHeight / 2;
      terrain.add(fireflyColonies.mesh);
    }
  }
}

// ##########################################

// Grass

Grass = function () {
  // Create an empty container that will hold the different parts of object
  this.mesh = new THREE.Object3D();

  this.totHeight = 20;

  // middle stem
  var geoMainStem = grassTrack(
    new THREE.BoxGeometry(5, this.totHeight, 5, 1, 4, 1)
  );
  grassDeformation(geoMainStem);
  var matGrass = grassTrack(
    new THREE.MeshPhongMaterial({
      color: colors.grassGreen,
      flatShading: true,
      shininess: 0,
      specular: 0x000000,
      wireframe: false,
    })
  );
  var mainStem = grassTrack(new THREE.Mesh(geoMainStem, matGrass));
  mainStem.castShadow = true;
  mainStem.receiveShadow = true;
  mainStem.rotation.y = randomRange(-Math.PI / 2, Math.PI / 2);

  // side stems around the main stem
  this.sideStems = new THREE.Group();

  for (let i = 0; i < 5; i++) {
    var randomSideStemHeight =
      this.totHeight + randomRangeFloorInclusive(-6, -2);
    //console.log(randomSideStemHeight) // for debugging

    var geoSideStem = grassTrack(
      new THREE.BoxGeometry(5, randomSideStemHeight, 5, 1, 4, 1)
    );
    grassDeformation(geoSideStem);

    var sideStem = new THREE.Mesh(geoSideStem, matGrass);
    sideStem.castShadow = true;
    sideStem.receiveShadow = true;
    sideStem.position.x = 7 * Math.cos((i * (2 * Math.PI)) / 5);
    sideStem.position.z = 7 * Math.sin((i * (2 * Math.PI)) / 5);
    sideStem.position.y = (randomSideStemHeight - this.totHeight) / 2;
    sideStem.rotation.y = randomRange(-Math.PI / 2, Math.PI / 2);

    // set the size of the grass randomly
    var s = randomRange(0.8, 1);
    sideStem.scale.set(s, 1, s);

    this.sideStems.add(sideStem);
  }

  // Add everything to the container we first created
  this.mesh.add(mainStem);
  this.mesh.add(this.sideStems);
};

GrassGround = function () {
  // Create an empty container
  this.mesh = grassTrack(new THREE.Object3D());

  // Choose a number of grass to be spanwed
  this.nGrass = numGrass;

  // Positioning checker
  // Used to avoid tree overlapping
  var allBoundingBoxes = [];

  // create the grass
  for (var i = 0; i < this.nGrass; i++) {
    // Positioning checker
    // Used to avoid tree overlapping
    var box3 = new THREE.Box3();
    var size = new THREE.Vector3();

    var g = new Grass();

    do {
      //s.mesh.position.y = 5;
      g.mesh.position.x = objectPlacer("forest");
      //console.log(s.mesh.position.x); // for debugging

      // for a better result, we position the stones
      // at random depths inside of the scene
      g.mesh.position.z = objectPlacer("forest");
      //console.log(s.mesh.position.z); // for debugging
    } while (!positioningHelper(g.mesh.position.x, g.mesh.position.z));

    // we also set a random scale for each grass
    //var s = randomRange(0, 1);
    //c.mesh.scale.set(s, s, s);

    var s = randomRange(0.05, 0.15);
    g.mesh.scale.set(s, s, s);
    g.mesh.position.y = (g.totHeight * s) / 2;

    // Avoid overlapping using boundary box
    // https://stackoverflow.com/questions/41459512/from-boundingboxhelper-to-boxhelper
    //var gBoundingBox = new THREE.BoxHelper(g.mesh, 0x00ff00);
    //box3.setFromObject(gBoundingBox);
    //console.log(i, box3);

    // Creating bounding box
    box3.setFromObject(g.mesh);
    // adding it to the rest of bounding boxes
    //box3.getSize(size);
    allBoundingBoxes.push(box3);

    var intersectionFound = false;

    for (let i = 0; i < allBoundingBoxes.length - 1; i++) {
      var interesected = box3.intersectsBox(allBoundingBoxes[i]);
      //console.log(i, interesected, allBoundingBoxes.length, allBoundingBoxes.length - 1, allBoundingBoxes[i]);
      if (interesected) intersectionFound = true;
    }

    if (!intersectionFound) {
      // do not forget to add the mesh of each grass to the main mesh
      this.mesh.add(g.mesh);
      //this.mesh.add(gBoundingBox);
    } else {
      grassResTracker.disposeLast();
      g.mesh = undefined;
      allBoundingBoxes.pop();
    }
  }
};

var grassGround = new GrassGround();
grassGround.mesh.position.y += terrainHeight / 2;
terrain.add(grassGround.mesh);
var grassEnabled = true;

// TO IGNORE - for debugging (memory leaks, etc..)
function enableGrass() {
  if (grassEnabled == false) {
    grassGround = new GrassGround();
    grassGround.mesh.position.y += terrainHeight / 2;
    terrain.add(grassGround.mesh);
    grassEnabled = true;
  } else {
    terrain.remove(grassGround.mesh);
    //grassGround.mesh.material.dispose();
    //grassGround.mesh.material.dispose();
    grassGround.mesh = undefined;
    grassEnabled = false;
  }
}

// Copy of function above - used in dat GUI
function generateGrass() {
  if (grassGround != null) {
    // security check
    // Removing existing mesh
    terrain.remove(grassGround.mesh);
    grassResTracker.dispose();
    grassGround.mesh = undefined;

    // Creating new one
    grassGround = new GrassGround();
    grassGround.mesh.position.y = terrainHeight / 2;
    terrain.add(grassGround.mesh);
  }
}

// ##########################################

// House

House = function () {
  // Create an empty container that will hold the different parts of object
  this.mesh = new THREE.Object3D();

  const totWidth = 140;
  this.totHeight = 50;
  const totDepth = 140;

  // first floor
  var geoFirstFloor = new THREE.BoxGeometry(totWidth, this.totHeight, totDepth);
  var matFirstFloor = new THREE.MeshLambertMaterial({
    color: colors.brownBrick,
    wireframe: false,
  });
  var firstFloor = new THREE.Mesh(geoFirstFloor, matFirstFloor);
  firstFloor.position.set(0, this.totHeight / 2, 0);
  firstFloor.castShadow = true;
  firstFloor.receiveShadow = true;

  // basement
  var geoBasement = new THREE.BoxGeometry(
    totWidth + 10,
    this.totHeight / 10,
    totDepth + 10
  );
  var matBasement = new THREE.MeshLambertMaterial({
    color: colors.rockGrey,
    wireframe: false,
  });
  var basement = new THREE.Mesh(geoBasement, matBasement);
  basement.position.set(0, this.totHeight / 20, 0);
  basement.castShadow = true;
  basement.receiveShadow = true;

  // roof
  // roof support (drainer - metal)
  var geoRoof = new THREE.CylinderGeometry(
    totWidth - 40,
    totWidth - 35,
    5,
    4,
    1
  );
  var matRoof = new THREE.MeshPhongMaterial({
    color: colors.darkMetal,
    flatShading: true,
    shininess: 100,
    //specular: 0x121212,
    wireframe: false,
  });
  var roof = new THREE.Mesh(geoRoof, matRoof);
  roof.position.y -= 2.5;
  roof.castShadow = true;
  roof.receiveShadow = true;

  roof.position.set(0, this.totHeight, 0);
  roof.rotation.y += Math.PI / 4;

  // roof cover
  const geoRoofCover = new THREE.CylinderGeometry(50, 100, 40, 4, 1);
  const matRoofCover = new THREE.MeshPhongMaterial({
    color: colors.redBrick,
    flatShading: true,
    shininess: 0,
    specular: 0x000000,
    wireframe: false,
  });
  const roofCover = new THREE.Mesh(geoRoofCover, matRoofCover);
  roofCover.castShadow = true;
  roofCover.receiveShadow = true;
  roofCover.position.y += 20;
  roof.add(roofCover);

  // door
  const doorShape = new THREE.Shape();
  doorShape.moveTo(15, -15);
  doorShape.lineTo(15, 15);
  for (let i = 0; i < 8; i++) {
    doorShape.lineTo(
      15 * Math.cos((i * Math.PI) / 8),
      10 * Math.sin((i * Math.PI) / 8) + 15
    );
  }
  doorShape.lineTo(-15, -15);
  doorShape.moveTo(-15, 15);

  // Extrude settings door
  const extrudeSettingsDoor = {
    steps: 2,
    depth: 2,
    bevelEnabled: false,
  };

  const geoDoor = new THREE.ExtrudeGeometry(doorShape, extrudeSettingsDoor);
  const matDoor = new THREE.MeshPhongMaterial({
    color: colors.pineWood,
    shininess: 60,
    specular: 0x0f0f0f,
    wireframe: false,
  });
  const door = new THREE.Mesh(geoDoor, matDoor);
  door.castShadow = true;
  door.receiveShadow = true;
  door.position.set(70, 15, -25);
  door.rotation.y = Math.PI / 2;

  // window
  const houseWindow = new THREE.Group();

  const windowShape = new THREE.Shape();
  windowShape.moveTo(0, 0);
  windowShape.absarc(0, 0, 14, 0, Math.PI * 2);

  const holePath = new THREE.Path();
  holePath.moveTo(0, 0);
  holePath.absarc(0, 0, 11, 0, Math.PI * 2);
  windowShape.holes.push(holePath);

  // Extrude settings window
  const extrudeSettingsWindow = {
    steps: 1,
    depth: 2,
    bevelEnabled: false,
  };

  const geoWindow = new THREE.ExtrudeGeometry(
    windowShape,
    extrudeSettingsWindow
  );
  const matWindow = new THREE.MeshPhongMaterial({
    color: colors.pineWood,
    shininess: 60,
    specular: 0x0f0f0f,
    wireframe: false,
  });
  const meshWindow = new THREE.Mesh(geoWindow, matWindow);
  meshWindow.scale.x = 1.15;
  meshWindow.receiveShadow = true;
  meshWindow.castShadow = true;
  houseWindow.add(meshWindow);

  // window frame
  const geoHorizontalFrame = new THREE.BoxGeometry(1, 27, 2);
  const horizontalFrame = new THREE.Mesh(geoHorizontalFrame, matWindow);
  horizontalFrame.castShadow = true;
  horizontalFrame.receiveShadow = true;
  const geoVerticalFrame = new THREE.BoxGeometry(27, 1, 2);
  const verticalFrame = new THREE.Mesh(geoVerticalFrame, matWindow);
  verticalFrame.castShadow = true;
  verticalFrame.receiveShadow = true;

  // window glass
  const geoGlass = new THREE.CircleGeometry(13, 32);
  const matGlass = new THREE.MeshPhongMaterial({
    color: colors.glass,
    specular: 0xf2efe8,
    transparent: true,
    opacity: 0.4,
    shininess: 100,
    //reflectivity: 0.5,
    wireframe: false,
  });
  /*
	const matGlass = new THREE.MeshPhysicalMaterial({
		color: colors.glass,
		// TODO: ADD ENVMAP
		clearcoat: 0.15,
		//clearcoatRoughness: 0,
		reflectivity: 1,
		transparent: false,
		opacity: 1,
		transmission: 1,
		metalness: 0,
		roughness: 0,

		//metalness: 0,
		//roughness: 0,
		//thickness: 0.5,
		//exposure: 1,
		//transmission: 1,
		//specularIntensity: 1,
		//specularColor: 0x0F0F0F,
		//side: THREE.DoubleSide,
		wireframe: false
	});
	*/

  const glass = new THREE.Mesh(geoGlass, matGlass);
  glass.position.z += 0.5;

  houseWindow.add(horizontalFrame);
  houseWindow.add(verticalFrame);
  houseWindow.add(glass);
  houseWindow.position.set(70, 25, 35);
  houseWindow.rotation.y = Math.PI / 2;

  // chimney
  const spline = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 10),
    new THREE.Vector3(0, 30, 20),
  ]);

  const pipeShape = new THREE.Shape();
  pipeShape.moveTo(0, 0);
  //pipeShape.moveTo(5*Math.cos(0), 5*Math.sin(0));
  /*
	// Tube shaped
	for (let i = 1; i < 16; i++) {
		pipeShape.lineTo(
			5 * Math.cos(i * (2 * Math.PI) / 16),
			5 * Math.sin(i * (2 * Math.PI) / 16)
		);
	};
	*/
  pipeShape.lineTo(15, 0);
  pipeShape.lineTo(15, 15);
  pipeShape.lineTo(0, 15);

  // Extrude settings chimney
  const extrudeSettingsChimney = {
    curveSegments: 8,
    steps: 8,
    bevelEnabled: false,
    extrudePath: spline,
  };

  const geoChimney = new THREE.ExtrudeGeometry(
    pipeShape,
    extrudeSettingsChimney
  );
  const matChimney = new THREE.MeshLambertMaterial({
    color: colors.chimneyGrey,
    wireframe: false,
  });
  const chimney = new THREE.Mesh(geoChimney, matChimney);
  chimney.position.set(0, 80, 30);
  chimney.castShadow = true;
  chimney.receiveShadow = true;

  // Add everything to the container we first created
  this.mesh.add(firstFloor);
  this.mesh.add(basement);
  this.mesh.add(roof);
  this.mesh.add(door);
  this.mesh.add(houseWindow);
  this.mesh.add(chimney);
};

var home = new House();
home.mesh.position.x =
  (homeBoundaryPositiveWBoundaries - internalBoundary / 2) / 2 +
  internalBoundary / 2;
home.mesh.position.y = terrainHeight / 2;
home.mesh.position.z =
  (homeBoundaryNegativeWBoundaries + internalBoundary / 2) / 2 -
  internalBoundary / 2;
home.mesh.scale.set(0.21, 0.21, 0.21);
home.mesh.rotation.y = -Math.PI / 4 - Math.PI / 2;
terrain.add(home.mesh);

// ##########################################

// Bench

Bench = function () {
  // Create an empty container that will hold the different parts of object
  this.mesh = new THREE.Object3D();

  this.height = 3 + 12;
  this.width = 20 + 1;

  const sideGroup = new THREE.Group();
  const seatGroup = new THREE.Group();

  const matSide = new THREE.MeshLambertMaterial({
    color: colors.benchGrey,
    wireframe: false,
  });
  const matSeat = new THREE.MeshPhongMaterial({
    // shiny - treated - wood
    color: colors.fenceWood,
    shininess: 90,
    specular: 0x121212,
    wireframe: false,
  });

  // sides

  // side Left
  const sideLeft = new THREE.Group();
  var geoSide = new THREE.BoxGeometry(1, 3, 10);
  var side = new THREE.Mesh(geoSide, matSide);
  side.castShadow = true;
  side.receiveShadow = true;
  sideLeft.add(side);
  // side legs
  const sideLegs = new THREE.Group();
  // side leg left
  var geoSideLeg = new THREE.BoxGeometry(1, 6, 3);
  var sideLegL = new THREE.Mesh(geoSideLeg, matSide);
  sideLegL.position.z = -5 + 1.5;
  sideLegL.position.y = -1.5 - 3;
  sideLegL.castShadow = true;
  sideLegL.receiveShadow = true;
  sideLegs.add(sideLegL);
  // side leg right
  var sideLegR = new THREE.Mesh(geoSideLeg, matSide);
  sideLegR.position.z = 5 - 1.5;
  sideLegR.position.y = -1.5 - 3;
  sideLegR.castShadow = true;
  sideLegR.receiveShadow = true;
  sideLegs.add(sideLegR);
  sideLeft.add(sideLegs);

  // side right
  const sideRight = sideLeft.clone();
  sideLeft.position.x = -10;
  sideRight.position.x = 10;
  sideGroup.add(sideLeft);
  sideGroup.add(sideRight);

  // seat

  for (let i = -2; i <= 2; i++) {
    const geoSeatLog = new THREE.BoxGeometry(19, 0.5, 1.5);
    const seatLog = new THREE.Mesh(geoSeatLog, matSeat);
    seatLog.position.z = i * 1.9;
    seatLog.castShadow = true;
    seatLog.receiveShadow = true;
    seatGroup.add(seatLog);
  }

  // Add everything to the container we first created
  this.mesh.add(sideGroup);
  this.mesh.add(seatGroup);

  // Resize the mesh?
  this.mesh.scale.set(0.3, 0.35, 0.3);

  this.mesh.position.y = (this.height * 0.35) / 2;
};

var benchesEnabled = false;
// Benches (6 total, bottom side and right side - 3 and 3)
var benchBottom1;
var benchBottom2;
var benchBottom3;
var benchRight1;
var benchRight2;
var benchRight3;

// Manage benches
function enableBenches() {
  if (benchesEnabled == false) {
    // bottom-side
    // Adding first bench
    benchBottom1 = new Bench();
    benchBottom1.mesh.position.x =
      (homeBoundaryPositiveWBoundaries - internalBoundary / 2) / 2 +
      benchBottom1.width +
      10;
    benchBottom1.mesh.position.z =
      homeBoundaryPositiveWBoundaries -
      internalBoundary / 2 +
      benchBottom1.width / 2 -
      3;
    benchBottom1.mesh.position.y += terrainHeight / 2;
    terrain.add(benchBottom1.mesh);

    // Adding second bench
    benchBottom2 = new Bench();
    benchBottom2.mesh.position.x =
      (homeBoundaryPositiveWBoundaries - internalBoundary / 2) / 2 + 10;
    benchBottom2.mesh.position.z =
      homeBoundaryPositiveWBoundaries -
      internalBoundary / 2 +
      benchBottom2.width / 2 -
      3;
    benchBottom2.mesh.position.y += terrainHeight / 2;
    terrain.add(benchBottom2.mesh);

    // Adding second bench
    benchBottom3 = new Bench();
    benchBottom3.mesh.position.x =
      (homeBoundaryPositiveWBoundaries - internalBoundary / 2) / 2 +
      benchBottom3.width / 2 +
      10;
    benchBottom3.mesh.position.z =
      homeBoundaryPositiveWBoundaries -
      internalBoundary / 2 +
      benchBottom3.width / 2 -
      3;
    benchBottom3.mesh.position.y += terrainHeight / 2;
    terrain.add(benchBottom3.mesh);

    // right-side
    // Adding first bench
    benchRight1 = new Bench();
    benchRight1.mesh.position.x =
      homeBoundaryPositiveWBoundaries -
      internalBoundary / 2 +
      benchRight1.width / 2 -
      3;
    benchRight1.mesh.position.z =
      (homeBoundaryPositiveWBoundaries - internalBoundary / 2) / 2 +
      benchRight1.width +
      10;
    benchRight1.mesh.position.y += terrainHeight / 2;
    benchRight1.mesh.rotation.y += Math.PI / 2;
    terrain.add(benchRight1.mesh);

    // Adding second bench
    benchRight2 = new Bench();
    benchRight2.mesh.position.x =
      homeBoundaryPositiveWBoundaries -
      internalBoundary / 2 +
      benchRight2.width / 2 -
      3;
    benchRight2.mesh.position.z =
      (homeBoundaryPositiveWBoundaries - internalBoundary / 2) / 2 + 10;
    benchRight2.mesh.position.y += terrainHeight / 2;
    benchRight2.mesh.rotation.y += Math.PI / 2;
    terrain.add(benchRight2.mesh);

    // Adding second bench
    benchRight3 = new Bench();
    benchRight3.mesh.position.x =
      homeBoundaryPositiveWBoundaries -
      internalBoundary / 2 +
      benchRight3.width / 2 -
      3;
    benchRight3.mesh.position.z =
      (homeBoundaryPositiveWBoundaries - internalBoundary / 2) / 2 +
      benchRight3.width / 2 +
      10;
    benchRight3.mesh.position.y += terrainHeight / 2;
    benchRight3.mesh.rotation.y += Math.PI / 2;
    terrain.add(benchRight3.mesh);

    benchesEnabled = true;
  } else {
    terrain.remove(benchBottom1.mesh);
    //benchBottom1.mesh.material.dispose();
    //benchBottom1.mesh.material.dispose();
    benchBottom1.mesh = undefined;

    terrain.remove(benchBottom2.mesh);
    //benchBottom2.mesh.material.dispose();
    //benchBottom2.mesh.material.dispose();
    benchBottom2.mesh = undefined;

    terrain.remove(benchBottom3.mesh);
    //benchBottom3.mesh.material.dispose();
    //benchBottom3.mesh.material.dispose();
    benchBottom3.mesh = undefined;

    terrain.remove(benchRight1.mesh);
    //benchRight1.mesh.material.dispose();
    //benchRight1.mesh.material.dispose();
    benchRight1.mesh = undefined;

    terrain.remove(benchRight2.mesh);
    //benchRight2.mesh.material.dispose();
    //benchRight2.mesh.material.dispose();
    benchRight2.mesh = undefined;

    terrain.remove(benchRight3.mesh);
    //benchRight3.mesh.material.dispose();
    //benchRight3.mesh.material.dispose();
    benchRight3.mesh = undefined;

    benchesEnabled = false;
  }
}

enableBenches();

// ##########################################

// https://threejs.org/examples/?q=particle#physics_ammo_rope

// Carousel

Carousel = function () {
  // Create an empty container that will hold the different parts of object
  this.mesh = new THREE.Object3D();

  // everything is metal
  // rug
  const geoRug = new THREE.CylinderGeometry(22, 22, 1, 10);
  // material array
  // https://stackoverflow.com/questions/8315546/texturing-a-cylinder-in-three-js
  const matRugArray = []; // side, top, bottom
  const matRugTopBottom = new THREE.MeshPhongMaterial({
    color: colors.lightMetal, //0xF6F6EB
    shininess: 100,
    //specular: 0x121212,
    wireframe: false,
  });
  const matRugSide = new THREE.MeshPhongMaterial({
    color: colors.carouselPastel,
    flatShading: true,
    shininess: 100,
    //specular: 0x121212,
    wireframe: false,
  });
  matRugArray.push(matRugSide);
  matRugArray.push(matRugTopBottom);
  matRugArray.push(matRugTopBottom);
  const rug = new THREE.Mesh(geoRug, matRugArray);
  rug.castShadow = true;
  rug.receiveShadow = true;

  // base
  const geoBase = new THREE.CylinderGeometry(10, 10, 3, 12);
  // + material array
  const base = new THREE.Mesh(geoBase, matRugArray);
  base.position.y += 2;
  base.castShadow = true;
  base.receiveShadow = true;

  // main log - all metal
  const mainLogGroup = new THREE.Group();
  // base
  const geoMainLog = new THREE.BoxGeometry(1, 25, 1);
  const mainLog = new THREE.Mesh(geoMainLog, matRugSide);
  mainLog.position.y += 16;
  mainLog.castShadow = true;
  mainLog.receiveShadow = true;
  mainLogGroup.add(mainLog);

  // engine
  const geoEngine = new THREE.BoxGeometry(3, 2.5, 3);
  const matEngine = new THREE.MeshPhongMaterial({
    color: colors.lightMetal, //0xF6F6EB
    shininess: 120,
    specular: 0x121212,
    wireframe: false,
  });
  const engine = new THREE.Mesh(geoEngine, matEngine);
  engine.position.y += 23;
  engine.castShadow = true;
  engine.receiveShadow = true;
  //mainLogGroup.add(engine);

  // top stopper
  const geoStopper = new THREE.CylinderGeometry(2, 2, 1, 5);
  // material array
  // https://stackoverflow.com/questions/8315546/texturing-a-cylinder-in-three-js
  const matStopperArray = []; // side, top, bottom
  const matStopperTopBottom = new THREE.MeshPhongMaterial({
    color: colors.carouselPastel, //colors.darkMetal,
    shininess: 160,
    specular: 0x121212,
    wireframe: false,
  });
  const matStopperSide = new THREE.MeshPhongMaterial({
    color: colors.lightMetal, //0xF6F6EB
    flatShading: true,
    shininess: 160,
    specular: 0x121212,
    wireframe: false,
  });
  matStopperArray.push(matStopperSide);
  matStopperArray.push(matStopperTopBottom);
  matStopperArray.push(matStopperTopBottom);
  const stopper = new THREE.Mesh(geoStopper, matStopperArray);
  stopper.position.y += 29;
  stopper.castShadow = true;
  stopper.receiveShadow = true;
  mainLogGroup.add(stopper);

  // arms
  this.armsGroup = new THREE.Group();
  this.armsGroup.add(engine);

  const matArm = new THREE.MeshPhongMaterial({
    color: colors.lightMetal, //0xF6F6EB
    shininess: 150,
    specular: 0x121212,
    wireframe: false,
  });

  const armsParams = [
    { x: 0, yRotation: Math.PI / 2, z: 0, size: 30 },
    { x: 0, yRotation: Math.PI / 6, z: 0, size: 30 },
    { x: 0, yRotation: -Math.PI / 6, z: 0, size: 30 },
  ];

  for (let i = 0; i < armsParams.length; i++) {
    const geoArm = new THREE.BoxGeometry(armsParams[i].size, 1, 1);
    const arm = new THREE.Mesh(geoArm, matArm);
    arm.castShadow = true;
    arm.receiveShadow = true;

    arm.position.y += 23;
    arm.position.x = armsParams[i].x;
    arm.position.z = armsParams[i].z;
    arm.rotation.y = armsParams[i].yRotation;

    this.armsGroup.add(arm);
  }

  // ropes
  const ropesGroup = new THREE.Group();
  const matRope = new THREE.LineBasicMaterial({
    //color: colors.lightMetal,
    //linewidth: 0.5
  });

  // Fixing line not responding to light problem
  // https://stackoverflow.com/questions/16308730/three-js-lines-with-different-materials-and-directional-light-intensity
  matRope.color.setRGB(sunLight.intensity / 100, sunLight.intensity / 100, 0);

  const ropePositions = [
    new THREE.Vector3(0, 0, -4),
    //new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 10, 0),
  ];

  //http://malekocpm.weebly.com/uploads/2/4/0/9/24090123/1418210995.png
  const ropeParams = [
    { x: -0.2, yRotation: (7 * Math.PI) / 4, z: -14 },
    { x: 0.2, yRotation: (3 * Math.PI) / 4, z: 14 },
    { x: -12, yRotation: Math.PI / 6, z: -6.6 },
    { x: -12, yRotation: Math.PI / 6, z: 7.2 },
    { x: 12, yRotation: (7 * Math.PI) / 6, z: 6.6 },
    { x: 12, yRotation: (7 * Math.PI) / 6, z: -7.2 },
  ];

  for (let i = 0; i < ropeParams.length; i++) {
    const geoRope = new THREE.BufferGeometry().setFromPoints(ropePositions);
    const rope = new THREE.Line(geoRope, matRope);
    rope.position.y = 13;
    rope.position.z = ropeParams[i].z;
    rope.position.x = ropeParams[i].x;
    rope.rotation.y = ropeParams[i].yRotation;
    rope.castShadow = true;
    //rope.receiveShadow = true;

    //rope.position.x = 14 * Math.cos(i * (2 * Math.PI) / 6);
    //rope.position.z = 14 * Math.sin(i * (2 * Math.PI) / 6);

    ropesGroup.add(rope);
  }

  this.armsGroup.add(ropesGroup);

  // ferry
  const ferry = new THREE.Group();

  // bottom part
  // iron frame
  const geoFrame = new THREE.CylinderGeometry(18.5, 18.5, 20, 6, 1, true);
  //const geoFrame = new THREE.SphereGeometry(20, 6, 10, 0, Math.PI*2, Math.PI/2, Math.PI/2);
  //let geoFrameVerts = geoFrame.attributes.position.array;
  //for(let i = 0; i < geoFrameVerts.length; i+=3) {
  //	if(geoFrameVerts[i+1] > 0)	geoFrameVerts[i+1] = 0;
  //}
  // Update vertices positions
  //geoFrame.attributes.position.needsUpdate = true;
  // Updating the normal vectors (recompute)
  //geoFrame.computeVertexNormals();
  const matFrame = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
    // avoiding shadow artifacts
    //
    shadowSide: THREE.BackSide,
    color: colors.lightMetal,
    flatShading: true,
    shininess: 110,
    specular: 0x121212,
    wireframe: false,
  });
  const frame = new THREE.Mesh(geoFrame, matFrame);
  frame.castShadow = true;
  frame.receiveShadow = true;
  frame.position.y = 2;
  // iron frame bottom closing side
  const geoFrameClosing = new THREE.CircleGeometry(18.5, 6);
  const matFrameClosing = new THREE.MeshPhongMaterial({
    color: colors.lightMetal, //0xF6F6EB
    //side: THREE.DoubleSide, // or double rotation
    shininess: 110,
    specular: 0x121212,
    wireframe: false,
  });
  const frameClosing = new THREE.Mesh(geoFrameClosing, matFrameClosing);
  frameClosing.castShadow = true;
  //frameClosing.receiveShadow = true;
  frameClosing.position.y = -10;
  frameClosing.rotation.x = (-3 * Math.PI) / 2;
  frameClosing.rotation.z = Math.PI / 2;
  frame.add(frameClosing);

  // inner seat
  const geoSeat = new THREE.CircleGeometry(18.5, 6);
  const matSeat = new THREE.MeshPhongMaterial({
    color: colors.darkMetal,
    shininess: 110,
    specular: 0x121212,
    wireframe: false,
  });
  const seat = new THREE.Mesh(geoSeat, matSeat);
  //seat.castShadow = true;
  seat.receiveShadow = true;
  seat.position.y = 6;
  seat.rotation.x = -Math.PI / 2;
  seat.rotation.z = Math.PI / 2;
  ferry.add(seat);
  ferry.add(frame);
  //ferry.position.y = 20;
  //ferry.scale.set(1, 1.2, 1);

  // connecting log
  const geoLog = new THREE.BoxGeometry(2, 13, 2);
  const log = new THREE.Mesh(geoLog, matSeat);
  log.castShadow = true;
  log.receiveShadow = true;
  log.position.y = 12.5;
  ferry.add(log);

  // cover
  const geoCover = new THREE.CylinderGeometry(1, 22, 10, 4);

  // color "gradient" based on vertices pos
  // https://stackoverflow.com/questions/11252592/how-to-change-face-color-in-three-js
  // https://www.reddit.com/r/threejs/comments/qam2w6/why_is_geometryfaces_or_other_props_undefined/
  // https://discourse.threejs.org/t/coloring-a-face-in-buffer-geometry-is-not-visible-at-certain-angles/15526
  // https://threejs.org/examples/webgl_geometry_colors
  const geoCoverVerts = geoCover.attributes.position;
  geoCover.setAttribute(
    "color",
    new THREE.BufferAttribute(new Float32Array(geoCoverVerts.count * 3), 3)
  );
  const tempColor = new THREE.Color();
  const geoCoverColor = geoCover.attributes.color;
  for (let i = 0; i < geoCoverVerts.count; i++) {
    var H = 0.61;
    var S = 0.31;
    var L = geoCoverVerts.getY(i) / 10 + 1; // 0.5 to 1.5, 1.5 = 1, 1 is max in HSL
    //console.log(H) // for debugging
    //console.log(S) // for debugging
    //console.log(L) // for debugging

    // https://www.w3schools.com/colors/colors_hsl.asp
    tempColor.setHSL(H, S, L);
    geoCoverColor.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
  }
  //const matCoverTextureSide = loader.load("/textures/carouselcovertexture.png");
  //matCoverTextureSide.wrapS = matCoverTextureSide.wrapT = THREE.RepeatWrapping;
  //matCoverTextureSide.repeat.set(2, 2); // 1 horizontal repetition, 5 vertical ones
  //matCoverTextureSide.offset.set(0.5, 0.5); // offset from horizontal, vertical
  const matCover = new THREE.MeshPhongMaterial({
    color: colors.white, //colors.carouselPastel,
    vertexColors: true,
    //map: matCoverTextureSide,
    flatShading: true,
    shininess: 120,
    specular: 0x121212,
    wireframe: false,
  });

  const cover = new THREE.Mesh(geoCover, matCover);
  cover.castShadow = true;
  cover.receiveShadow = true;
  cover.position.y = 24;

  ferry.add(cover);

  // Initial Y position of all ferries
  ferry.position.y = 8;

  // Scaling of all ferries
  ferry.scale.set(0.2, 0.2, 0.2);

  const ferriesGroup = new THREE.Group();

  const ferriesPositions = [
    { x: -2.4, yRotation: randomRange(0, Math.PI), z: 16.6 },
    { x: 2.4, yRotation: randomRange(0, Math.PI), z: -16.6 },
    { x: -13.8, yRotation: randomRange(0, Math.PI), z: -9.8 },
    { x: -13.8, yRotation: randomRange(0, Math.PI), z: 4 },
    { x: 13.8, yRotation: randomRange(0, Math.PI), z: 9.8 },
    { x: 13.8, yRotation: randomRange(0, Math.PI), z: -4 },

    //{x: -0.2, yRotation: -Math.PI/2, z: -14},
    //{x: 0.2, yRotation: Math.PI/2, z: 14},
    //{x: -12, yRotation: Math.PI/6, z: -6.8},
    //{x: -12, yRotation: Math.PI/6, z: 7.2},
    //{x: 12, yRotation: 5*Math.PI/6, z: 6.6},
    //{x: 12, yRotation: 5*Math.PI/6, z: -7.2},
  ];

  // create a total of 6 ferries
  for (let i = 0; i < ferriesPositions.length; i++) {
    const ferryMesh = ferry.clone();
    ferryMesh.position.x = ferriesPositions[i].x;
    ferryMesh.position.z = ferriesPositions[i].z;
    ferryMesh.rotation.y = ferriesPositions[i].yRotation;

    ferriesGroup.add(ferryMesh);
  }

  this.armsGroup.add(ferriesGroup); // move this to animate

  // Add everything to the container we first created
  this.mesh.add(rug);
  this.mesh.add(base);
  this.mesh.add(mainLogGroup);
  this.mesh.add(this.armsGroup);
  this.mesh.position.y += 0.5;
};

// ##########################################

// Campfire

Campfire = function () {
  // Create an empty container that will hold the different parts of object
  this.mesh = campfireTrack(new THREE.Object3D());

  this.stoneRadius = 12;
  this.logsRadius = 5;

  // stones
  // we reuse the Stone objects we created
  this.stones = campfireTrack(new THREE.Group());

  for (let i = 0; i < 40; i++) {
    var stone = new Stone();

    // place the stones in a circular way
    stone.mesh.position.x =
      this.stoneRadius * Math.cos((i * (2 * Math.PI)) / 40);
    stone.mesh.position.z =
      this.stoneRadius * Math.sin((i * (2 * Math.PI)) / 40);

    // not needed since the rotation of the stones is randomised in the Stone obj
    //stone.mesh.lookAt(0, 0, 0);
    this.stones.add(stone.mesh);
  }

  // logs
  this.logs = campfireTrack(new THREE.Group());

  var matBranch = campfireTrack(
    new THREE.MeshPhongMaterial({
      color: colors.pineWood,
      flatShading: true,
      shininess: 0,
      specular: 0x000000,
      wireframe: false,
    })
  );

  // Create 10 logs
  for (let i = 0; i < 10; i++) {
    // Randomising log sizes
    var branchHeight = randomRange(4, 6);
    var branchRadiusTop = randomRange(0.5, 0.6);
    var branchRadiusBottom = randomRange(0.5, 0.6);

    // we could create a half cylinder and rotate the log
    // but it wouldn't look as natural (half logs)
    var geoBranch = campfireTrack(
      new THREE.CylinderGeometry(
        branchRadiusTop,
        branchRadiusBottom,
        branchHeight,
        8,
        4,
        false
      )
    );

    // We use the deformation method used to deform the tree's trunks
    // Deformation noise
    // we use a very small noise value since the logs are small
    // no need to overdo it
    var noise_min = -0.15;
    var noise_max = 0.15;

    // Deform branch
    getDeformedCylinder(geoBranch, noise_max, noise_min, true, "branch");

    var log = campfireTrack(new THREE.Mesh(geoBranch, matBranch));
    log.castShadow = true;
    log.receiveShadow = true;

    // place the logs in a circular way
    log.position.x = this.logsRadius * Math.cos((i * (2 * Math.PI)) / 10);
    log.position.z = this.logsRadius * Math.sin((i * (2 * Math.PI)) / 10);

    // Make them face the center
    // This is a nice workaround to make the "lateral" faces of a cylinder face the ground
    // making them look towards the bottom of the scene
    log.lookAt(0, -1000, 0);

    /*

		// we need to rotate each log (cylinder) by 90 degress
		//log.rotation.x = Math.PI/2;

	    // Get vertices' positions (local coordinates)
	    // Access .attributes.mainStoneGeom array
	    var positionAttribute = geoBranch.getAttribute("position");
	    // 45 top vertex
	    // 62 bottom vertex
		//console.log(positionAttribute.getX(45))
		//console.log(positionAttribute.getX(62))

		*/

    // We place the logs at the closest point possible to the ground
    // max branch radius
    log.position.y += 0.6;

    this.logs.add(log);
  }

  // fire - TODO: FIX RENDER ORDER; PUT BEFORE LAKE WATER SO WATER DOESNT STAY ON TOP
  this.fire = campfireTrack(new THREE.Group());

  const geoFlame = campfireTrack(new THREE.BufferGeometry());
  const flamesCount = 50; // number of flames

  // position array XYZ for each flame particle
  const positionArray = new Float32Array(flamesCount * 3);
  // random scaling for each particle (natural look - organic)
  const scaleArray = new Float32Array(flamesCount); // we need 1 value per vertex
  // random color for each particle
  const colourArray = new Float32Array(flamesCount * 3); //*3 since we use RGB

  for (let i = 0; i < flamesCount; i++) {
    positionArray[i * 3 + 1] = randomRange(0, 8);

    // adjusting possible x/z values based on layer type
    // 0 - 2
    // base layer
    // big cubes

    // red range colour Math.random() * 0.25;
    if (positionArray[i * 3 + 1] > 0 && positionArray[i * 3 + 1] <= 2) {
      positionArray[i * 3 + 0] = randomRange(-3, 3);
      positionArray[i * 3 + 2] = randomRange(-3, 3);

      // Generating organic scaling
      scaleArray[i] = randomRange(1, 1.2);

      // Generating random color (R, G, B) - some shades are left out, but it's acceptable
      colourArray[i * 3 + 0] = 1;
      colourArray[i * 3 + 1] = randomRange(0, 0.25);
      colourArray[i * 3 + 2] = 0;
    }
    // 2 - 4
    // first layer
    // medium cubes
    // orange yellow range colour Math.random() * (0.75 - 0.5) + 0.5;
    else if (positionArray[i * 3 + 1] > 2 && positionArray[i * 3 + 1] <= 4) {
      positionArray[i * 3 + 0] = randomRange(-2, 2);
      positionArray[i * 3 + 2] = randomRange(-2, 2);

      // Generating organic scaling
      scaleArray[i] = randomRange(0.6, 1);

      // Generating random color (R, G, B)
      colourArray[i * 3 + 0] = 1;
      colourArray[i * 3 + 1] = randomRange(0.25, 0.5);
      colourArray[i * 3 + 2] = 0;
    }
    // 4 - 6
    // second layer
    // small cubes
    // red orange range colour Math.random() * (0.5 - 0.25) + 0.25;
    else if (positionArray[i * 3 + 1] > 4 && positionArray[i * 3 + 1] <= 6) {
      positionArray[i * 3 + 0] = randomRange(-1, 1);
      positionArray[i * 3 + 2] = randomRange(-1, 1);

      // Generating organic scaling
      scaleArray[i] = randomRange(0.4, 0.6);

      // Generating random color (R, G, B)
      colourArray[i * 3 + 0] = 1;
      colourArray[i * 3 + 1] = randomRange(0.5, 0.75);
      colourArray[i * 3 + 2] = 0;
    }
    // 6 - 8
    // top layer
    // extra small cubes
    // yellow range colour Math.random() * (1 - 0.75) + 0.75;
    else if (positionArray[i * 3 + 1] > 6 && positionArray[i * 3 + 1] <= 8) {
      positionArray[i * 3 + 0] = randomRange(-0.5, 0.5);
      positionArray[i * 3 + 2] = randomRange(-0.5, 0.5);

      // Generating organic scaling
      scaleArray[i] = randomRange(0.1, 0.4);

      // Generating random color (R, G, B)
      colourArray[i * 3 + 0] = 1;
      colourArray[i * 3 + 1] = randomRange(0.75, 1);
      colourArray[i * 3 + 2] = 0;
    }
  }

  // Setting the attributes of the geometry
  // positioning, scaling and colour of each particle
  geoFlame.setAttribute(
    "position",
    new THREE.BufferAttribute(positionArray, 3)
  );
  geoFlame.setAttribute("aScale", new THREE.BufferAttribute(scaleArray, 1));
  geoFlame.setAttribute("colour", new THREE.BufferAttribute(colourArray, 3));
  geoFlame.attributes.position.needsUpdate = true;

  this.matFlame = campfireTrack(
    new THREE.ShaderMaterial({
      transparent: true,
      //vertexColors: true,
      //depthTest: false, // ??
      blending: THREE.AdditiveBlending, // Make points shinier, made from light
      depthWrite: false, // Avoiding clipping issues
      uniforms: {
        pointTexture: {
          value: flameTexture,
        },
        // Fixing pixel problems
        // Sending the pixel ratio of the screen as a uniform
        // We can't use renderer.getPixel
        uPixelRatio: {
          value: renderer.getPixelRatio(),
        },
        uSize: {
          value: 90, // size of the points
        },
        uTime: {
          value: 0,
        },
      },
      vertexShader: FIRE_VS,
      fragmentShader: FIRE_FS,
    })
  );

  const flames = campfireTrack(new THREE.Points(geoFlame, this.matFlame));
  flames.position.y += 0.5;
  this.fire.add(flames);

  // light - TODO: CHANGE OVER TIME
  // ENABLE POINTLIGHT
  // light source
  // we use two light sources
  // spotlight for a proper "torch" effect on the ground x 2
  this.spotLight1 = campfireTrack(new THREE.SpotLight(colors.fireOrange));
  this.spotLight1.intensity = 1;
  this.spotLight1.angle = Math.PI / 4;
  this.spotLight1.distance = 70;
  this.spotLight1.penumbra = 1;
  this.spotLight1.decay = 2;
  this.spotLight1.position.set(0, 40, 0);
  this.spotLight1.target.position.set(0, -1000, 0);
  this.spotLight1.castShadow = true;
  this.spotLight1.shadow.mapSize.width = 1024;
  this.spotLight1.shadow.mapSize.height = 1024;
  //this.spotLight1.shadow.radius = 10;
  //this.spotLight1.visible = false; // light off at first
  this.fire.add(this.spotLight1);
  this.fire.add(this.spotLight1.target);

  this.spotLight2 = campfireTrack(new THREE.SpotLight(colors.fireRed));
  this.spotLight2.intensity = 2;
  this.spotLight2.angle = Math.PI / 4;
  this.spotLight2.distance = 80;
  this.spotLight2.penumbra = 1;
  this.spotLight2.decay = 2;
  this.spotLight2.position.set(0, 30, 0);
  this.spotLight2.target.position.set(0, -1000, 0);
  this.spotLight2.castShadow = true;
  this.spotLight2.shadow.mapSize.width = 1024;
  this.spotLight2.shadow.mapSize.height = 1024;
  //this.spotLight2.shadow.radius = 4;
  //this.spotLight2.visible = false; // light off at first
  this.fire.add(this.spotLight2);
  this.fire.add(this.spotLight2.target);

  this.pointLight = campfireTrack(
    new THREE.PointLight(colors.fireDarkYellow, 1, 5, 2)
  );
  //this.pointLight.shadow.normalBias = -0.01;
  this.pointLight.position.set(0, 6, 0);
  this.pointLight.castShadow = true;
  this.pointLight.shadow.mapSize.width = 1024;
  this.pointLight.shadow.mapSize.height = 1024;
  //this.pointLight.shadow.radius = 4;
  //this.pointLight.visible = false; // light off at first
  //this.fire.add(this.pointLight);

  // setting the fire off at first
  this.fire.visible = false;

  //const helper = new THREE.SpotLightHelper(this.spotLight1);
  //scene.add(helper)
  //const helper2 = new THREE.SpotLightHelper(this.spotLight2);
  //scene.add(helper2)
  //const helper3 = new THREE.PointLightHelper(this.pointLight);
  //scene.add(helper3)

  // Add everything to the container we first created
  this.mesh.add(this.stones);
  this.mesh.add(this.logs);
  this.mesh.add(this.fire);
};

var campfire = campfireTrack(new Campfire());
campfire.mesh.position.y += terrainHeight / 2;
terrain.add(campfire.mesh);
var campfireEnabled = true;

// TO IGNORE - for debugging (memory leaks, etc..)
function enableCampfire() {
  if (campfireEnabled == false) {
    campfire = new Campfire();
    campfire.mesh.position.y += terrainHeight / 2;
    terrain.add(campfire.mesh);
    campfireEnabled = true;
  } else {
    terrain.remove(campfire.mesh);
    //campfire.mesh.material.dispose();
    //campfire.mesh.material.dispose();
    campfire.mesh = undefined;
    campfireEnabled = false;
  }

  turnCampFireOn();
}

// Copy of function above - used in dat GUI
function generateCampfire() {
  if (campfire != null) {
    // security check
    // Removing existing mesh
    terrain.remove(campfire.mesh);
    campfireResTracker.dispose();
    campfire.mesh = undefined;

    // Creating new one
    campfire = new Campfire();
    campfire.mesh.position.y = terrainHeight / 2;
    terrain.add(campfire.mesh);

    // Resetting campfire on, controls problem
    campfireOn = false;
    turnCampFireOn();
  }
}

var campfireOn = false;
function turnCampFireOn() {
  // Enable lights on/off only if it's midnight and
  // if the campfire is enabled

  if (currDayTime == "midnight" && campfireOn == false) {
    campfire.fire.visible = true; // fire on
    campfireOn = true;
  } else {
    campfire.fire.visible = false; // fire off
    campfireOn = false;
  }
}

// ##########################################

// Spacing memos - FOR DEBUGGING, IGNORE

//leftPart.position.x = homeBoundaryNegativeWBoundaries + internalBoundary/2;
//rightPart.position.x = homeBoundaryPositiveWBoundaries - internalBoundary/2;
//topPart.position.z = homeBoundaryNegativeWBoundaries + internalBoundary/2;
//bottomPart.position.z = homeBoundaryPositiveWBoundaries - internalBoundary/2;
//bottomDoorLeft.position.z = homeBoundaryPositiveWBoundaries;
//bottomDoorLeft.position.x = internalFence.doorXNeg - 5
//bottomDoorRight.position.z = homeBoundaryPositiveWBoundaries;
//bottomDoorRight.position.x = internalFence.doorXPos + 5;

// ########################################################################################################

// Lightning and shadowing

// Resources - TO IGNORE
// 		 https://www.youtube.com/watch?v=T6PhV4Hz0u4&ab_channel=SimonDev
// 		 https://blog.cjgammon.com/threejs-lights-cameras/
// 		 https://threejs.org/examples/#webgl_lights_spotlight
// 		 	Spot lights are expensive! Computed 6 times compared to point lights!
// 		 https://stackoverflow.com/questions/48938170/three-js-odd-striped-shadows
// 		 https://stackoverflow.com/questions/29253464/threejs-weird-stripes-shadow/42978647
// 		 	Self-shadowing artifacts and "peter-panning" effect -> shadow.bias
// 			It's all about finding the perfect tradeoff between "peter-panning" and
// 			self-shadowing artifacts.

// Notes
// 		 If shadowMap.type is set to PCFSoftShadowMap, radius has no effect
// 		 Spot lights are expensive! (computed 6 times compared to point lights)

// ##########################################

// Lights creation

const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
let sunLight = new THREE.DirectionalLight(0xffffff, 0.75);

sunLight.position.set(-280, 695, 350);
sunLight.target.position.set(0, 0, 0);

scene.add(hemisphereLight);
scene.add(ambientLight);
scene.add(sunLight);
scene.add(sunLight.target);

// ##########################################

// Shadow quality and shadow mapping configuration

sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 4096; //8192, 6144, 4096, 2048, 1024
sunLight.shadow.mapSize.height = 4096; //8192, 6144, 4096, 2048, 1024
// We make the near and far planes as tight as possible
sunLight.shadow.camera.near = 380;
sunLight.shadow.camera.far = 1450;
//sunLight.shadow.camera.fov = 75;
//sunLight.shadow.camera.zoom = 2;
//sunLight.shadow.radius = 2.0;
// "Size" of the sunLight
// 		We don't need to "contain" all the clouds
// 		even if some are left out, the ones casting shadows on the
// 		terrain are still doing it (e.g., we don't care about "useless" clouds)
// 		This is possible since clouds don't receive shadows, just a small detail
// 		in case we'd want clouds to receive shadows too, this section must
// 		be revised
sunLight.shadow.camera.left = skyBoundaryNegative;
sunLight.shadow.camera.right = skyBoundaryPositive;
sunLight.shadow.camera.top = skyBoundaryPositive;
sunLight.shadow.camera.bottom = skyBoundaryNegative;
// a parameter you can tweak if there are artifacts
sunLight.shadow.bias = -0.0001;

// ##########################################

// Automatic lightning management

// vars used to automatically set the daytime
const time = new Date();
let hours = +time.getHours();
var currDayTime;

// daylight breakpoints
// 4-8 sunrise, 8-17 midday, 17-20 sunset, 20-4 midnight
const breakpoints = [4, 8, 17, 20];

if (hours >= breakpoints[0] && hours < breakpoints[1]) {
  changeLights("sunrise"); // change lights settings
  currDayTime = "sunrise";
  updateFireflies(); // despawn fireflies
  turnLights(); // turn all lights off
  turnCampFireOn(); // turn campfire off
} else if (hours >= breakpoints[1] && hours < breakpoints[2]) {
  changeLights("midday"); // change lights settings
  currDayTime = "midday";
  updateFireflies(); // despawn fireflies
  turnLights(); // turn all lights off
  turnCampFireOn(); // turn campfire off
} else if (hours >= breakpoints[2] && hours < breakpoints[3]) {
  changeLights("sunset"); // change lights settings
  currDayTime = "sunset";
  updateFireflies(); // despawn fireflies
  turnLights(); // turn all lights off
  turnCampFireOn(); // turn campfire off
} else {
  changeLights("midnight"); // change lights settings
  currDayTime = "midnight";
  updateFireflies(); // spawn fireflies
  turnLights(); // turn all lights on
  turnCampFireOn(); // turn campfire on
}

// ########################################################################################################

// Stays here, after light initialisation, to fix rope lighting problems at night
// Was shining at night due to the Line material, changed to be black, based on the
// sunlight intensity.
var carousel = new Carousel();
carousel.mesh.position.y += terrainHeight / 2;
carousel.mesh.position.x =
  (homeBoundaryPositiveWBoundaries + internalBoundary / 2) / 2;
carousel.mesh.position.z =
  (homeBoundaryPositiveWBoundaries + internalBoundary / 2) / 2;
terrain.add(carousel.mesh);

// ########################################################################################################

// Helpers - FOR DEBUGGING, TO IGNORE

//var axes = new THREE.AxesHelper(30);
//terrain.add(axes);
//var sunLightHelper = new THREE.CameraHelper(sunLight.shadow.camera);
//terrain.add(sunLightHelper);

/*

// ##########################################

// Create event listeners - FOR DEBUGGING, TO IGNORE

//https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
window.addEventListener("keydown", function(event) {

	// sunrise, midday, sunset, midnight
	switch(event.code) {

	    case "Digit0":

	    	if(enableAutomaticDayLight)	enableAutomaticDayLight = false;
	    	else 						enableAutomaticDayLight = true;
			break;

		case "Digit1":
      		changeLights("sunrise");
      		currDayTime = "sunrise";
      		updateFireflies();
      		turnLights();
      		turnCampFireOn();
    		// console.log(sunLight.position.x); // for debugging
    		// console.log(sunLight.position.y); // for debugging
    		// console.log(sunLight.position.z); // for debugging
      		break;

	    case "Digit2":
			changeLights("midday");
			currDayTime = "midday";
			updateFireflies();
			turnLights();
			turnCampFireOn();
    		// console.log(sunLight.position.x); // for debugging
    		// console.log(sunLight.position.y); // for debugging
    		// console.log(sunLight.position.z); // for debugging
			break;

	    case "Digit3":
			changeLights("sunset");
			currDayTime = "sunset";
			updateFireflies();
			turnLights();
			turnCampFireOn();
    		// console.log(sunLight.position.x); // for debugging
    		// console.log(sunLight.position.y); // for debugging
    		// console.log(sunLight.position.z); // for debugging
			break;

	    case "Digit4":
			changeLights("midnight");
			currDayTime = "midnight";

			if(!fireflyColoniesEnabled) updateFireflies();
    		// console.log(sunLight.position.x); // for debugging
    		// console.log(sunLight.position.y); // for debugging
    		// console.log(sunLight.position.z); // for debugging
    		lampPostOn = false;
    		turnLights();
    		campfireOn = false;
    		turnCampFireOn();
			break;

	    case "Digit5":
	    	enableSky();
			break;

	    case "Digit6":
	    	enablePlane();
			break;

	    case "Digit7":
	    	enableStones();
			break;

	    case "Digit8":
	    	enableTrees();
			break;

		case "Digit9":
			enableFence();
			break;

		case "KeyQ":
			updateFireflies();
			break;

		case "KeyW":
			turnLights();
			break;

		case "KeyG":
			enableGrass();
			break;

		case "KeyB":
			enableBenches();
			break;

		case "KeyF":
			turnCampFireOn();
			break;

		case "KeyC":
			enableCampfire();
			break;
	}

  //refresh();

  // Consume the event so it doesn't get handled twice
  //event.preventDefault();
}, true);
*/

// ########################################################################################################

// GUI

var gui = new dat.GUI({
  width: 300,
});

// Daytime GUI
const daytimeGUI = gui.addFolder("Daytime");
let daytimeParams = {
  sunrise: () => {
    changeLights("sunrise");
    currDayTime = "sunrise";
    updateFireflies();
    turnLights();
    turnCampFireOn();
  },
  midday: () => {
    changeLights("midday");
    currDayTime = "midday";
    updateFireflies();
    turnLights();
    turnCampFireOn();
  },
  sunset: () => {
    changeLights("sunset");
    currDayTime = "sunset";
    updateFireflies();
    turnLights();
    turnCampFireOn();
  },
  midnight: () => {
    changeLights("midnight");
    currDayTime = "midnight";
    if (!fireflyColoniesEnabled) updateFireflies();
    lampPostOn = false;
    turnLights();
    campfireOn = false;
    turnCampFireOn();
  },
  timelapse: false,
};
daytimeGUI.add(daytimeParams, "sunrise");
daytimeGUI.add(daytimeParams, "midday");
daytimeGUI.add(daytimeParams, "sunset");
daytimeGUI.add(daytimeParams, "midnight");
var timelapse = daytimeGUI.add(daytimeParams, "timelapse");
timelapse.onChange(function () {
  if (enableAutomaticDayLight) enableAutomaticDayLight = false;
  else enableAutomaticDayLight = true;
});
//daytimeGUI.open();

// Terrain generation GUI
const terrainGenerationGUI = gui.addFolder("Procedural generation");
let terrainGenerationParams = {
  grass: () => {
    // grass
    generateGrass();
  },
  stones: () => {
    // stones
    generateStones();
  },
  trees: () => {
    // trees
    generateTrees();
  },
  forest: () => {
    // entire forest
    generateGrass();
    generateStones();
    generateTrees();
  },
  clouds: () => {
    // sky
    generateSky();
  },
  fireflies: () => {
    // fireflies
    generateFireflies();
  },
  campfire: () => {
    // campfire
    generateCampfire();
  },
};
terrainGenerationGUI.add(terrainGenerationParams, "grass").name("Grass");
terrainGenerationGUI.add(terrainGenerationParams, "stones").name("Stones");
terrainGenerationGUI.add(terrainGenerationParams, "trees").name("Trees");
terrainGenerationGUI.add(terrainGenerationParams, "forest").name("Forest");
terrainGenerationGUI.add(terrainGenerationParams, "clouds").name("Clouds");
terrainGenerationGUI
  .add(terrainGenerationParams, "fireflies")
  .name("Fireflies - midnight only");
terrainGenerationGUI.add(terrainGenerationParams, "campfire").name("Campfire");
//terrainGenerationGUI.open();

// Midnight options (lights)
const midnightGUI = gui.addFolder(
  "Midnight ONLY - lights and effects switches"
);
let midnightParams = {
  flames: () => {
    // campfire flames
    turnCampFireOn();
  },
  lampPost: () => {
    // lamp posts light
    turnLights();
  },
};
midnightGUI.add(midnightParams, "flames").name("Campfire flames");
midnightGUI.add(midnightParams, "lampPost").name("Lamp posts");
//midnightGUI.open();

// Basic animations
// TODO: Other animations could be controlled (e.g., fireflies?)
const animationsGUI = gui.addFolder("Simple animations");
let animationsParams = {
  carousel: true,
  airplane: true,
};
var carouselAnimation = animationsGUI
  .add(animationsParams, "carousel")
  .name("Carousel");
carouselAnimation.onChange(function () {
  if (carouselAnimation) carouselAnimation = false;
  else carouselAnimation = true;
});
var airplaneAnimation = animationsGUI
  .add(animationsParams, "airplane")
  .name("Airplane");
airplaneAnimation.onChange(function () {
  if (airplaneAnimation) airplaneAnimation = false;
  else airplaneAnimation = true;
});

// Water options
const waterGUI = gui.addFolder("Water");
let waterParams = {
  animateWater: true,
};
var animateWater = waterGUI
  .add(waterParams, "animateWater")
  .name("Water animation");
animateWater.onChange(function () {
  if (animateWater) animateWater = false;
  else animateWater = true;
});
waterGUI.add(lakeWater.position, "z", 9, 12).step(0.5).name("Water level");
waterGUI
  .add(lakeWater.material, "opacity", 0.65, 1)
  .step(0.05)
  .name("Water opacity");

// Camera option - TODO: CHANGE TO A CHECKBOX
let cameraParams = {
  freeCamera: () => {
    updateCameraView();
  },
};
gui.add(cameraParams, "freeCamera").name("Enable free camera");

// ########################################################################################################

// Rendering

// TODO: CLEAN ANIMATION FUNCTION
// Right now this section can be considered an actual mess since I put a major focus
// on the rest of the things. We use things such as delta and elapsed time
// (https://threejs.org/docs/#api/en/core/Clock) to update the animation of some objects
// (e.g., clouds, "sun", plane, etc...).

// Draw the scene from the given camera to an image frame-by-frame
// 3D Movement - global variable used to count the current number of frame
// Used for periodic movements!
var iFrame = 0;

// Animation settings
var clock = new THREE.Clock();
var speed = 40; //.01; 	// sunlight speed, for timelapse mode only
var cloudsSpeed = 0.003; // cloud speed
var airplanePropellerSpeed = 45;
var delta = 0;

// Automatic daylight (sunrise, midday, sunset, midnight)
var enableAutomaticDayLight = false;
var automaticDayLight = false;

// Plane animation
var planeFrame = 0;

// Checking performance
//var stats = new Stats();
//stats.showPanel(0); // 0 fps, 1 ms, 2 mb
//document.body.appendChild(stats.dom);

function animate() {
  //stats.begin(); // for debugging

  // Increase iFrame var
  iFrame++;

  delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  // Clouds animation
  sky.mesh.rotation.y += cloudsSpeed * delta;

  // Timelapse mode - sunlight animation and cloud's speedup
  if (enableAutomaticDayLight) {
    // increasing clouds speed
    cloudsSpeed = 0.2;

    if (currDayTime == "sunrise") {
      // console.log("It's sunrise")   				// for debugging
      // position(630, 760, -110)      				// for debugging

      if (sunLight.position.x >= -280) sunLight.position.x -= speed * delta;
      if (sunLight.position.y >= 695) sunLight.position.y -= speed * delta;
      if (sunLight.position.z <= 350) sunLight.position.z += speed * delta;

      if (
        sunLight.position.x <= -280 &&
        sunLight.position.y <= 695 &&
        sunLight.position.z >= 350
      ) {
        // console.log(sunLight.position.x);      	// for debugging
        // console.log(sunLight.position.y);      	// for debugging
        // console.log(sunLight.position.z);      	// for debugging
        // console.log("I've reached midday");    	// for debugging
        changeLights("midday");
        currDayTime = "midday";
        updateFireflies();
        turnLights();
        turnCampFireOn();
      }
    } else if (currDayTime == "midday") {
      // console.log("It's midday") 					// for debugging
      // position(-280, 695, 350) 					// for debugging

      if (sunLight.position.x >= -290) sunLight.position.x -= speed * delta;
      if (sunLight.position.y <= 760) sunLight.position.y += speed * delta;
      if (sunLight.position.z <= 900) sunLight.position.z += speed * delta;

      if (
        sunLight.position.x <= -290 &&
        sunLight.position.y >= 760 &&
        sunLight.position.z >= 900
      ) {
        // console.log(sunLight.position.x); 		// for debugging
        // console.log(sunLight.position.y); 		// for debugging
        // console.log(sunLight.position.z); 		// for debugging
        // console.log("I've reached sunset"); 		// for debugging
        changeLights("sunset");
        currDayTime = "sunset";
        updateFireflies();
        turnLights();
        turnCampFireOn();
      }
    } else if (currDayTime == "sunset") {
      // console.log("It's sunset") 					// for debugging
      // position(-290, 760, 900) 					// for debugging

      if (sunLight.position.x >= -420) sunLight.position.x -= speed * delta;
      if (sunLight.position.y <= 800) sunLight.position.y += speed * delta;
      if (sunLight.position.z >= 370) sunLight.position.z -= speed * delta;

      if (
        sunLight.position.x <= -420 &&
        sunLight.position.y >= 800 &&
        sunLight.position.z <= 370
      ) {
        // console.log(sunLight.position.x); 		// for debugging
        // console.log(sunLight.position.y); 		// for debugging
        // console.log(sunLight.position.z); 		// for debugging
        // console.log("I've reached midnight"); 	// for debugging
        changeLights("midnight");
        currDayTime = "midnight";
        updateFireflies();
        lampPostOn = false;
        turnLights();
        turnCampFireOn();
      }
    } else {
      // console.log("It's midnight") 				// for debugging
      // position(-420, 800, 370) 					// for debugging

      if (sunLight.position.x <= 630) sunLight.position.x += speed * delta;
      if (sunLight.position.y >= 760) sunLight.position.y -= speed * delta;
      if (sunLight.position.z >= -110) sunLight.position.z -= speed * delta;

      if (
        sunLight.position.x >= 630 &&
        sunLight.position.y <= 760 &&
        sunLight.position.z <= -110
      ) {
        // console.log(sunLight.position.x); 		// for debugging
        // console.log(sunLight.position.y); 		// for debugging
        // console.log(sunLight.position.z); 		// for debugging
        // console.log("I've reached sunrise"); 	// for debugging
        changeLights("sunrise");
        currDayTime = "sunrise";
        updateFireflies();
        turnLights();
        turnCampFireOn();
      }
    }
  } else {
    // turn cloud's speed back to normal if timelapse mode is turned off
    cloudsSpeed = 0.003;
  }

  // Carousel animation
  if (carouselAnimation) {
    carousel.armsGroup.rotation.y += Math.sin(delta * 2);
    carousel.armsGroup.position.y += Math.sin(elapsedTime) / 40;
  }

  // Fireflies animation
  if (fireflyColonies != null) {
    for (let i = 0; i < fireflyColonies.fireflyColoniesMaterials.length; i++) {
      fireflyColonies.fireflyColoniesMaterials[
        i
      ].uniforms.uTime.value = elapsedTime;
    }
  }

  if (campfire != null) {
    campfire.matFlame.uniforms.uTime.value = elapsedTime;
  }

  // required since controls.enableDamping is set to true
  if (orbitControlsEnabled) {
    //scene.rotation.x = 0; // for debugging
    //scene.rotation.y = 0; // for debugging
    controls.update();
  } else {
    // TODO: FIX VALUES
    //https://duckduckgo.com/?q=radian+angle+pi&iax=images&ia=images&iai=https%3A%2F%2Fk12.libretexts.org%2F%40api%2Fdeki%2Ffiles%2F14729%2Ff-d_d216430ac319ba00de1731d8b2ece54642ee3d44456d7f8c7c85fe38%25252BIMAGE_TINY%25252BIMAGE_TINY.jpg%3Frevision%3D1
    // https://pretagteam.com/question/how-to-switch-threejs-camera-controls-from-first-person-to-orbit-and-back
    // TODO: IMPORTANT: CREATE SECOND SCENE FOR OBJECTS, ONE FOR VIEW
    // ANIMATED OBJECTS JUMP UP AND DOWN WHEN THE CAMERA MOVES RIGHT NOW
    scene.rotation.x +=
      (-pointer.y * ((Math.PI / 24) * 0.5) - scene.rotation.x) * easing;
    scene.rotation.y +=
      (pointer.x * ((Math.PI / 12) * 0.5) - scene.rotation.y) * easing;
  }

  // Simple wave animation

  //console.log(frmOffset)

  if (animateWater) {
    // Var used to "shift" the XY-axis
    // making the wave loop long, very long
    frmOffset = (elapsedTime % iFrame) * waveRatio * 10;

    // Calling wave deformation function
    // (geometry, waving cycle, scaling value)
    wave_effect(geoLakeWater, 2, 1, frmOffset / waveRatio);
  } else {
    // water rests
    // Calling wave deformation function
    // (geometry, waving cycle, scaling value)
    wave_effect(geoLakeWater, 0, 0, 0);
  }

  // Simple plane animation
  // Defining the timestep (u), to control the speed of the animation
  // Every 1s = 60 frames (animate() called 60 times)
  var steps = 500; // Smaller is faster, 1000 frames to complete the animation
  var u = planeFrame / steps;
  // Once u > 1, an animation cycle has ended, rendering has been stopped, saving resources
  // We can restart it if we want
  if (u > 1) {
    planeFrame = 0; // Reset frame
    //	requestAnimationFrame(animate); // Callback function (sequence)
  }
  if (airplaneAnimation) animatePlane(u);
  else {
    // if animation stopped
    // reset frame count
    planeFrame = 0;
    // replace airplane at the start
    animatePlane(0);
  }

  planeFrame++;

  // Render everything into our image
  renderer.render(scene, camera);

  //stats.end(); // for debugging

  // Callback function (sequence)
  requestAnimationFrame(animate);
}
animate();
