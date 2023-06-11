<div align="center">

<img src="/images/logo.png" alt="logo" width="128"/>

</div>

<h1 align="center">Interactive Low Poly Environment</h1>

<div align="justify">

This project showcases an interactive computer graphics environment built using Three.js. The focus is on graphical rendering, modelling, and creating a visually captivating experience. The environment features procedurally generated objects, 3D models, and special animations. Explore the world with its low poly aesthetic, interact with various elements, and enjoy the dynamic animations and special effects. The project utilizes Three.js for rendering, GLSL for shaders, and glTF for 3D models, ensuring a rich and immersive experience.

## Stack

- Three.js
- GLSL
- glTF

## Project structure

```
$PROJECT_ROOT
│   # Images
├── images
│   # JavaScript files
├── js
│   # 3D models
├── obj
│   # Textures
├── textures
│   # Key scripts
└── ...
```

## Roadmap

- [x] Different scene modes
- [x] Simple empty island
- [x] Procedurally generated objects
- [x] Lake and all its features
- [x] Airplane and carousel animations
- [x] Fireflies and all their features
- [x] Campfire and all its features
- [x] Cat and dog 3D models
- [x] Basic GUI
- [x] Advanced GUI: dynamic creation of lake
- [x] Fixed and free camera modes
- [ ] Use noise perturbations to shape clouds
- [ ] Increase resolution of water surface texture
- [ ] Populate night mode skybox with shining stars
- [ ] Turn "Environment elements: in-depth review" into a table

## Highlights

  <div align="center">
    <img src="/images/environment_showcase.gif" alt="environment showcase"/>
    <br/>
    <br/>
    <img src="/images/environment_showcase.jpg" alt="environment showcase"/>
    <br/>
    <br/>
    <img src="/images/campfire.jpg" alt="campfire"/>
    <br/>
    <br/>
    <img src="/images/3D_models.jpg" alt="3D models"/>
  </div>

## Environment elements: in-depth review

The interactive low poly environment offers a rich array of captivating elements that enhance the immersive experience:

- **Static Objects**: The main island serves as the centrepiece, featuring both bottom and top terrains, along with a visually stunning lake. The lake terrain utilizes a displacementMap, adapting its colour based on visual depth. Additionally, water surfaces are meticulously designed to avoid a flat appearance.
- **Lamp Posts**: The environment is illuminated by lamp posts that come to life at night. Each lamp post consists of a spotlight to create a torch-like effect on the ground, while a pointLight brings forth the glow of a lighted bulb.
- **Procedurally Generated Objects**: These objects are meticulously crafted with attention to detail:
    - **Stones**: A main large stone serves as the focal point, complemented by up to four smaller stones arranged artistically.
    - **Grass**: The landscape is adorned with intricate grass structures, featuring a central stem surrounded by five smaller stems.
    - **Trees**: The environment boasts two types of trees: pine trees and unique blob trees. The trunks of both tree types are procedurally generated, while blob trees showcase dynamically generated leaves groups, adding a touch of randomness and natural variation.
    - **Clouds**: Experience the ethereal beauty of procedurally generated clouds. Each cloud "block" consists of four to six clouds, creating a mesmerizing and ever-changing sky.
    - **Campfire**: Witness the magic of a flickering campfire that comes to life at night. The campfire's foundation and fire are procedurally generated, ensuring that each instance is unique. Custom shader materials and flame textures contribute to the realistic fire effect, enhanced by orange and red spotlights.
    - **Fireflies Colonies**: As darkness descends, enchanting firefly colonies illuminate the environment. Custom shader materials bring these fireflies to life, utilizing Points and their UV coordinates. A spotlight strategically placed near each colony casts a soft glow, generating a captivating and randomized animation.
- **Other**: The environment incorporates various materials tailored to specific needs and computational efficiency. Basic, Lambert, and Phong materials are employed based on their characteristics, allowing for the desired low poly aesthetic and metallic appearances where needed. Proper resource disposal and window resizing are implemented to ensure optimal performance. Furthermore, the environment seamlessly adjusts its lighting based on the computer's time, providing an automatic and immersive transition between day and night.

## Getting started

1. Clone this folder
2. Start a local live server (e.g., if you have Python 3.x installed)

```sh
python -m http.server
```

3. This will serve files from the current directory at localhost under port 8000, i.e in the address bar type:

```
http://localhost:8000/
```

## Attributions

- <a href="https://www.flaticon.com/free-icons/art" title="art icons">Art icons created by Freepik - Flaticon</a>

## License

[MIT](https://github.com/1391819/interactive-low-poly-environment/blob/main/License.txt) © [Roberto Nacu](https://github.com/1391819)

</div>
