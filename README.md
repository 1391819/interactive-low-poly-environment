<div align="center">
  <img src="/images/logo.png" alt="logo" width="128">
</div>

# Interactive Low Poly Environment

<div align="justify">

## About

An interactive computer graphics environment built using Three.js. The design is mainly focused on graphical rendering and modelling (i.e., basic rendering elements and 3D models) as well as interactions, animations and special effects.

## Environment elements: in-depth review

-   <strong>Static objects</strong>
    -   <strong>Main island</strong> (bottom, top and lake terrain)
        -   Lake terrain
            -   Plane geometry with displacementMap (acts as top face of grass box)
            -   green or brown, based on the visual depth of the lake
    -   <strong>Water</strong>
        -   Plane geometry with displacementMap and proper material settings so that the water surface does not look entirely flat when not animated
    -   <strong>Lamp posts</strong> (lamp posts light can be turned on only at night)
        -   two light sources are used (one spotlight for a proper “torch” effect on the ground and a pointLight to give a lighted bulb effect) for each lamp post
-   <strong>Procedurally generated objects</strong>
    -   Each geometry’s deformation process is randomised up to the smallest detail
    -   <strong>Stones</strong>: one main big stone, zero to four smaller stones around the big one.
    -   <strong>Grass</strong>: one main big stem, five smaller stems around the big one.
    -   <strong>Trees</strong> (pine and blob trees)
        -   each trunk is procedurally generated, regardless of the tree type
        -   leaves groups are procedurally generated for blob trees only
        -   blob trees have higher chances of being spawned
    -   <strong>Clouds</strong>: each cloud “block” contains between 4 and 6 clouds.
    -   <strong>Campfire</strong> (fire can be turned on only at night, and it’s procedurally generated too so both the campfire’s foundation and fire will not ever be the same ones)
        -   custom shaderMaterial plus flame textures (see references, personally edited)
        -   fire light achieved using two spotlights (orange and red); randomised animation
    -   <strong>Fireflies colonies</strong> (only at night)
        -   custom shaderMaterial (no textures, achieved using Points and their UV coordinates)
        -   fireflies light achieved using a spotlight (lighting the area around each colony) rather than setting a light for each firefly (point); randomised animation
-   <strong>Other</strong>
    -   Proper usage of materials based on needs and computational cost
        -   Basic: used for things that don’t need any shadow (e.g., hidden island’s top face)
        -   Lambert: used for things such as clouds, house and tree leaves which don’t require the flatShading option (the latter is used to achieve that low poly look)
        -   Phong: most computationally expensive material, used for things that require the flatShading option (i.e., trees’ trunks, campfire’s tree branches) as well as metallic looking objects (i.e., carousel, airplane)
    -   Proper disposal of resources (i.e., meshes, geometries, materials) whenever a new procedurally generated object/set of objects is requested
    -   Handled window resizing
    -   Easy to declare the number of procedurally generated objects that should be spawned (not available in the user interface, code only)
    -   Usage of boundary boxes to avoid overlapping among procedurally generated objects
    -   Automatic daylight setting based on computer’s time

## Stack

-   <a href="https://threejs.org/">Three.js</a> - A cross-browser JavaScript library and API used to create and display animated 3D computer graphics in a web browser using WebGL
-   <a href="https://pandaqitutorials.com/Games/9-three-js-complete-glsl-tutorial">GLSL</a> - A high-level shading language with a syntax based on the C programming language
-   <a href="https://github.com/KhronosGroup/glTF">glTF</a> - A royalty-free specification for the efficient transmission and loading of 3D scenes and models by applications

## Project structure

<code>$PROJECT_ROOT
│   # Images
├── images
│   # JavaScript files
├── js
│   # 3D models
├── obj
│   # Textures
├── textures
│   # Key scripts
└── ...</code>

## Roadmap

-   [x] Different scene modes
-   [x] Simple empty island
-   [x] Procedurally generated objects
-   [x] Lake and all its features
-   [x] Airplane and carousel animations
-   [x] Fireflies and all their features
-   [x] Campfire and all its features
-   [x] Cat and dog 3D models
-   [x] Basic GUI
-   [x] Advanced GUI: dynamic creation of lake
-   [x] Fixed and free camera modes
-   [ ] Use noise perturbations to shape clouds
-   [ ] Increase resolution of water surface texture
-   [ ] Populate night mode skybox with shining stars
-   [ ] Turn "Environment elements: in-depth review" into a table

## Getting started

1.  Clone this folder
2.  Start a local live server (e.g., if you have Python 3.x installed)

    <code>sh
    python -m http.server</code>

3.  This will serve files from the current directory at localhost under port 8000, i.e in the address bar type:

    <code><http://localhost:8000/></code>

## Highlights

  <div align="center"><img src="/images/environment_showcase.gif" alt="environment showcase">
    <br>
    <br>
    <img src="/images/environment_showcase.jpg" alt="environment showcase">
    <br>
    <br>
    <img src="/images/campfire.jpg" alt="campfire">
    <br>
    <br>
    <img src="/images/3D_models.jpg" alt="3D models"></div><h2 id="license">License</h2><p><a href="https://github.com/1391819/MA-seek/blob/main/License.txt">MIT</a> © <a href="https://github.com/1391819">Roberto Nacu</a></p><h2 id="attributions">Attributions</h2><ul>
  <li><a href="https://www.flaticon.com/free-icons/art" title="art icons">Art icons created by Freepik - Flaticon</a></li>
</ul><p>
</p></div>
