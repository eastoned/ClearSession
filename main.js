import * as THREE from 'three';
import {MathUtils} from 'three';
import { MeshLineGeometry, MeshLineMaterial, raycast } from 'meshline';
import JEASINGS, { JEasing, Linear } from 'jeasings';
import {Text} from 'troika-three-text';
import {preloadFont} from 'troika-three-text'
import { InteractionManager } from 'three.interactive';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import CameraControls from 'camera-controls';
import Papa from 'papaparse';
import 'three-hex-tiling';
import { UVsDebug } from 'three/addons/utils/UVsDebug.js';

CameraControls.install( { THREE: THREE } );

const camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const interactionManager = new InteractionManager(
  renderer,
  camera,
  renderer.domElement
);

//models
const loader = new GLTFLoader();

//draws a model to the scene given name and position, with optional interactive, scale, and group inputs
function loadModel(modelName, x, y, z, highlightable = true, scale = 3, group)
{

    loader.load('/models/' + modelName + '.glb', function(gltf) {
    const modelOriginal = gltf.scene;
    
    modelOriginal.scale.set(scale, scale, scale);
    modelOriginal.position.set(x,y,z);
    modelOriginal.traverse((mod) => {
        //mod.layers.set(5);
    if (mod.isMesh) {
      // Replace the material with MeshBasicMaterial for unlit effect
      mod.material = new THREE.MeshToonMaterial({
        vertexColors: true, // Retain the texture if it exists
      });
    }
  });

   
  if(highlightable){
    modelOriginal.addEventListener('mouseover', (event) => {
                event.target.scale.set(3 + 1, 3 + 1, 3 + 1);
            });

            modelOriginal.addEventListener('mouseout', (event) => {
                event.target.scale.set(3, 3, 3);
            });

            modelOriginal.addEventListener('click', (event) => {
                moveCam(x, y, 0, 0, -50, 30);
            });

        interactionManager.add(modelOriginal);
    }

    if(group){
        group.add(modelOriginal);
    }else{
        scene.add(modelOriginal);
    }    

}, undefined, function ( error ) {

  console.error( error );

} );
}

const grass_tex = new THREE.TextureLoader().load(
    "textures/grass.jpg"
);

grass_tex.wrapS = THREE.RepeatWrapping;
grass_tex.wrapT = THREE.RepeatWrapping;

grass_tex.repeat.set(800, 800);

const road_tex = new THREE.TextureLoader().load(
    "textures/asphalt.jpg"
);

const scene = new THREE.Scene();
const color = 0x8888ff;  // blue
let near = 250;
let far = 500;
scene.background = new THREE.Color(color);
scene.fog = new THREE.Fog(color, near, far);

const clock = new THREE.Clock();
const cameraControls = new CameraControls(camera, renderer.domElement);

const directionalLight = new THREE.DirectionalLight( 0xffffff, 3 );
directionalLight.castShadow = true;
directionalLight.target.position.x = 20;
directionalLight.target.position.y = 20;
directionalLight.target.position.z = -20;
scene.add(directionalLight);
scene.add(directionalLight.target);

const sphereGeo = new THREE.SphereGeometry();

const planeGeo = new THREE.PlaneGeometry();

const dotMaterial = new THREE.MeshBasicMaterial({color:0xffffff, transparent: true, opacity: 0.3});

var dataID; //gets icon information from csv file
let modelPaths = {};

import data from '/data/data3.json' assert { type: 'json' };

const obj = data;
cameraControls.setLookAt(0, 0, 250, 0, 0, 0);

const groundMat = new THREE.MeshStandardMaterial({
    map: grass_tex,
    hexTiling: {
        patchScale: 3,
        useContrastCorrectedBlending: true,
        lookupSkipThreshold: 0.01,
        textureSampleCoefficientExponent: 8,
    }
});

const uniforms = {
    u_customTexture: {value: road_tex}
};

const roadMat = new THREE.ShaderMaterial( {
    uniforms: uniforms,
	fragmentShader: fragmentShader(),
    vertexShader: vertexShader()
})

function vertexShader() {
  return `
    varying vec3 vUv; 

    void main() {
      vUv = position * vec3(.1, .1, 1); 

      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewPosition; 
    }
  `
}

function fragmentShader(){
      return `
      uniform sampler2D u_customTexture;
      varying vec3 vUv;

      void main() {
        vec2 UV = vec2(fract(vUv.x), fract(vUv.y));
        vec4 texColor = texture2D(u_customTexture, UV); 
        gl_FragColor = texColor;
      }
  `
}

const ground = new THREE.Mesh(planeGeo, groundMat);

ground.name = "ground";
ground.scale.x = 3000;
ground.scale.y = 5000;
scene.add(ground);


function drawSphere(x = 0, y = 0, z = 0, size = 20, mat = dotMaterial)
{
    const sphereObj = new THREE.Mesh(sphereGeo, mat);
    sphereObj.name = "sphere";
    sphereObj.scale.set(size, size, 1);
    sphereObj.position.set(x,y,z);
    scene.add(sphereObj);

    sphereObj.addEventListener('mouseover', (event) => {
            event.target.scale.set(size + 1, size + 1, 1);
        });

        sphereObj.addEventListener('mouseout', (event) => {
            event.target.scale.set(size, size, 1);
        });

        sphereObj.addEventListener('click', (event) => {
            moveCam(x, y, 0, 0, -50, 20);
        });

    interactionManager.add(sphereObj);
}

const nodePos = {};
let sources = {};

function getTimeDifference(src, dest){
    let timeStart = obj.nodes.find(item => item.key === src);
    let timeMul = obj.nodes.find(item => item.key === dest);
    let expireTime = new Date(timeMul.attributes.content.date.timestamp);
    let days = (expireTime - new Date(timeStart.attributes.content.date.timestamp)) / (1000 * 60 * 60 * 24);
    return days;
}

function drawSign(curveSize, xPos, yPos, width, height, mat, group, amount, offset){
    const shape = new THREE.Shape();

    shape.moveTo(curveSize, 0);

    shape.lineTo(curveSize + width, 0);
    shape.bezierCurveTo(curveSize + width + amount, 0, curveSize + width + curveSize, curveSize - amount, curveSize + width + curveSize, curveSize);

    shape.lineTo(curveSize + width + curveSize, curveSize + height);
    shape.bezierCurveTo(curveSize + width + curveSize, curveSize + height + amount, curveSize + width + amount, curveSize + height + curveSize, curveSize + width, curveSize + height + curveSize);
    
    shape.lineTo(curveSize, curveSize + height + curveSize);
    shape.bezierCurveTo(curveSize - amount, curveSize + height + curveSize, 0, curveSize + height + amount, 0, height + curveSize);
    
    shape.lineTo(0, curveSize);
    shape.bezierCurveTo(0, curveSize - amount, curveSize - amount, 0, curveSize, 0);

    const extrudeSettings = {
        steps: 0,
        depth: 0,
        bevelEnabled: false,
        bevelThickness: 0,
        bevelSize: 0,
        bevelOffset: 0,
        bevelSegments: 0,
        UVGenerator: uvGenerator,
    };

    const signGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings); 
    
    const signMesh = new THREE.Mesh(signGeo, mat);
    signMesh.position.x = xPos;
    signMesh.position.y = yPos;
    signMesh.position.z = offset;
    group.add(signMesh);
}

function drawQuad(xPos, yPos, width, height, mat, group, offset){
    const shape = new THREE.Shape();
    //bottom left
    
    shape.moveTo(xPos, yPos);
    shape.lineTo(xPos + width, yPos);
    shape.lineTo(xPos + width, yPos + height);
    shape.lineTo(xPos, yPos + height);

    const extrudeSettings = {
        steps: 0,
        depth: 0,
        bevelEnabled: false,
        bevelThickness: 0,
        bevelSize: 0,
        bevelOffset: 0,
        bevelSegments: 0,
        UVGenerator: uvGenerator,
    };

    const quadGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings); 
    
    const quadMesh = new THREE.Mesh(quadGeo, mat);
    quadMesh.position.z = offset;
    group.add(quadMesh);
}

function worldPositionVertexShader() {
  return `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `
}

function distanceAlphaFragmentShader()
{
    return  `
    uniform vec3 nearColor;
    uniform vec3 farColor;
    uniform float maxDistance;
    varying vec3 vWorldPosition;

    void main() {
      float dist = distance(cameraPosition, vWorldPosition) - 35.0;
      float t = clamp(dist / maxDistance, 0.0, 1.0);
      gl_FragColor = vec4(nearColor, t);
    }
  `
}

const distanceSignMaterial = new THREE.ShaderMaterial({
  uniforms: {
    nearColor: { value: new THREE.Color(0x01735C) },
    maxDistance: { value: 10.0 }
  },
  vertexShader: worldPositionVertexShader(),
  fragmentShader: distanceAlphaFragmentShader(),
    transparent: true, // allow alpha blending
    depthWrite: false, // prevents depth buffer from overwriting transparent pixels
    blending: THREE.NormalBlending
});

const distanceWhiteMaterial = new THREE.ShaderMaterial({
  uniforms: {
    nearColor: { value: new THREE.Color(0xffffff) },
    maxDistance: { value: 10.0 }
  },
  vertexShader: worldPositionVertexShader(),
  fragmentShader: distanceAlphaFragmentShader(),
    transparent: true, // allow alpha blending
    depthWrite: false, // prevents depth buffer from overwriting transparent pixels
    blending: THREE.NormalBlending
});

const distanceGreyMaterial = new THREE.ShaderMaterial({
  uniforms: {
    nearColor: { value: new THREE.Color(0xaaaaaa) },
    maxDistance: { value: 10.0 }
  },
  vertexShader: worldPositionVertexShader(),
  fragmentShader: distanceAlphaFragmentShader(),
    transparent: true, // allow alpha blending
    depthWrite: false, // prevents depth buffer from overwriting transparent pixels
    blending: THREE.NormalBlending
});

function loadSign(key){
    let name = dataID.find(item => item.id === key);
    let date = obj.nodes.find(item => item.key === key);

    let count = date.attributes.content.date.quantity;
    let span = date.attributes.content.date.timespan;

    const timeSpan = count.toString() + " " + span.toString();

    const nameLength = name.nameEn.length;

    const width = Math.max(nameLength, timeSpan.length);

    let signGroup = new THREE.Group();
    const signMat = new THREE.MeshToonMaterial({color:0x01735C});
    const white = new THREE.MeshToonMaterial({color:0xffffff});

    drawSign(2, 0, 0-1, 50, 14, distanceSignMaterial, signGroup, 1, -.1);
    drawSign(2, 1, 1-1, 48, 12, distanceWhiteMaterial, signGroup, 2, 0);
    drawSign(2, 1.5, 1.5-1, 47, 11, distanceSignMaterial, signGroup, 2, 0.1);

    //draw sign legs
    const legMat = new THREE.MeshToonMaterial({color:0xaaaaaa});
    drawQuad(8, -15, 2, 14, distanceGreyMaterial, signGroup, -0.2);
    drawQuad(43, -15, 2, 14, distanceGreyMaterial, signGroup, -0.2);
    
    signGroup.name = "Sign" + name.nameEn;

    const myText = new Text();
    
            
    myText.fontSize = 4;
    myText.font = '/fonts/Highwaygothicd-KV5Dp.otf';
    myText.text = name.nameEn + "\n" + timeSpan;
    myText.material = distanceWhiteMaterial;
    
    //myText.color = 0xFFFFFF;
    myText.anchorX = 'middle';
    myText.anchorY = 'middle';
    myText.position.x = 3;
    myText.position.y = 8;
    myText.rotation.z = Math.PI/180;
    myText.position.z = 1.2;
    signGroup.add(myText);
    signGroup.position.x = nodePos[key].y + 8;
    signGroup.position.y = nodePos[key].x;
    signGroup.position.z = 8;
    scene.add(signGroup);
    
    
    myText.sync();
}

const lineMat = new THREE.MeshBasicMaterial({map:road_tex});

var uvGenerator =  {
    generateTopUV:  function(geometry, vertices, idxA, idxB, idxC) {
                        var ax, ay, bx, by, cx, cy;

            return([
                new THREE.Vector2(0, 0),
                new THREE.Vector2(1, 0),
                new THREE.Vector2(1, 1),
                new THREE.Vector2(0, 1),
            ]);
    },
    generateSideWallUV: function(geometry, vertices, idxA, idxB, idxC, idxD) {
        return([
            new THREE.Vector2(0, 0),
            new THREE.Vector2(1, 0),
            new THREE.Vector2(1, 1),
            new THREE.Vector2(0, 1),
        ]);
}
}

function drawRoad(start, end, sourceCount, childCount){

    const shape = new THREE.Shape();

    const extrudeSettings = {
        steps: 0,
        depth: 0,
        bevelEnabled: false,
        bevelThickness: 0,
        bevelSize: 0,
        bevelOffset: 0,
        bevelSegments: 0,
        UVGenerator: uvGenerator,
    };

    if(childCount < 2){
        //bottom left
        shape.moveTo(nodePos[start].y-12, nodePos[start].x);

        //bottom right
        shape.lineTo(nodePos[start].y+12, nodePos[start].x);

        //top right
        shape.lineTo(nodePos[end].y+12, nodePos[end].x);

        //top left
        shape.lineTo(nodePos[end].y-12, nodePos[end].x);

        const centerStripe = new THREE.Shape();

        centerStripe.moveTo(nodePos[start].y-0.5, nodePos[start].x);
        //bottom right
        centerStripe.lineTo(nodePos[start].y+0.5, nodePos[start].x);
        //top right
        centerStripe.lineTo(nodePos[end].y+0.5, nodePos[end].x);
        //top left
        centerStripe.lineTo(nodePos[end].y-0.5, nodePos[end].x);
        const yellow = new THREE.MeshToonMaterial({color:0xffff00});

        const centerStripeGeo = new THREE.ExtrudeGeometry(centerStripe, extrudeSettings);
        const centerStripeMesh = new THREE.Mesh(centerStripeGeo, yellow);
        centerStripeMesh.position.z = 0.65;

        scene.add(centerStripeMesh);


    }else{
        //bottom left
        shape.moveTo(nodePos[start].y-12 + sourceCount*24 - 36, nodePos[start].x+15);

        //bottom right
        shape.lineTo(nodePos[start].y+12 + sourceCount*24 - 36, nodePos[start].x+15);

        //top right
        shape.lineTo(nodePos[end].y+12, nodePos[end].x);

        //top left
        shape.lineTo(nodePos[end].y-12, nodePos[end].x);

        const fillerShape = new THREE.Shape();

        fillerShape.moveTo(nodePos[start].y-12 + sourceCount*24 - 36, nodePos[start].x+15);

        //fillerShape.lineTo(nodePos[start].y, nodePos[start].x + 20);

        fillerShape.lineTo(nodePos[start].y+12 + sourceCount*24 - 36, nodePos[start].x+15);

        //fillerShape.lineTo(nodePos[start].y, nodePos[start].x+15);

        //bottom left
        fillerShape.moveTo(nodePos[start].y + 6 + sourceCount * 12 - 18, nodePos[start].x);

        //bottom right
        fillerShape.lineTo(nodePos[start].y - 6 + sourceCount * 12 - 18, nodePos[start].x);

        const fillerGeo = new THREE.ExtrudeGeometry(fillerShape, extrudeSettings);
        const fillMat = new THREE.MeshBasicMaterial({color:0xff0000});
        const fillerMesh = new THREE.Mesh(fillerGeo, roadMat);
        fillerMesh.position.z = 0.5;

        scene.add(fillerMesh);

        const centerStripe = new THREE.Shape();

        centerStripe.moveTo(nodePos[start].y-0.5, nodePos[start].x);
        //bottom right
        centerStripe.lineTo(nodePos[start].y+0.5, nodePos[start].x);
        centerStripe.lineTo(nodePos[start].y+0.5 + (nodePos[end].y-0.5)/2, nodePos[start].x+15);
        //top right
        centerStripe.lineTo(nodePos[end].y+0.5, nodePos[end].x);
        //top left
        centerStripe.lineTo(nodePos[end].y-0.5, nodePos[end].x);
        centerStripe.lineTo(nodePos[start].y-0.5 + (nodePos[end].y-0.5)/2, nodePos[start].x+15);
        const yellow = new THREE.MeshToonMaterial({color:0xffff00});

        const centerStripeGeo = new THREE.ExtrudeGeometry(centerStripe, extrudeSettings);
        const centerStripeMesh = new THREE.Mesh(centerStripeGeo, yellow);
        centerStripeMesh.position.z = 0.65;

        scene.add(centerStripeMesh);
    }

    const lineGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const lineMesh = new THREE.Mesh(lineGeo, roadMat);
    lineMesh.position.z = 0.5;

    scene.add(lineMesh);
}

function drawTimeline() {
    let level = 0;

    for(let i = 0; i < obj.edges.length; i++) {
        
        const src = obj.edges[i].source;
        const dest = obj.edges[i].target;

        let childCount = 0;
        for(let x = 0; x < obj.edges.length; x++) {
            if(src == obj.edges[x].source){
                childCount += 1;
            }
        }


        if(!(src in nodePos)) {
            nodePos[src] = new THREE.Vector2(level, 0);
            sources[src] = 1;

            if(!(dest in nodePos))  {
                
                nodePos[dest] = new THREE.Vector2(level + getTimeDifference(src, dest)/5, 0);
                sources[dest] = 0;
            }
            
            level += 1;
            
        }   else    {
            sources[src] += 1;
            if(!(dest in nodePos))  {

                nodePos[dest] = new THREE.Vector2(nodePos[src].x + getTimeDifference(src, dest)/4, sources[src]/childCount * 100 - 75);
            }
            
        }
        console.log(sources[src] + " : " + childCount);
        
        drawRoad(src, dest, sources[src], childCount);
    }


    //draw spheres at positions
    for (const [key, value] of Object.entries(nodePos)) {
        
        let name = dataID.find(item => item.id === key);
        
        if(key in modelPaths)
        {
            //draws all models to scene
            loadModel(modelPaths[key], nodePos[key].y, nodePos[key].x, 6, false, 3);
            
        }

        loadSign(key);

        drawSphere(value.y, value.x, .5, 5);
        
    }
}

//only draw timeline if we can retrieve the csv data
Papa.parse('/data/ID_Data.csv', {
  header: true,
  download: true,
  dynamicTyping: true,
  complete: function(results) {
    //console.log(results);
    dataID = results.data;
    //console.log(dataID);
    
    for(let i = 0; i < dataID.length; i++){
        modelPaths[dataID[i].id.toString()] = dataID[i].icon.toString();
    }
    drawTimeline();
  }
});

var toggled = false;

function moveCam(xPos, yPos, zPos, offsetX = 0, offsetY = 0, offsetZ = 70) {
    cameraControls.setLookAt(xPos + offsetX, yPos + offsetY+15, zPos+offsetZ + 5, xPos, yPos, 0, true);
    //camera.layers.enable(5);
    lineMat.linewidth = 10;
    toggled = true;
    //toggleCam();
    rotateText();
    //scene.fog = new THREE.Fog(color, 50, 200);
}

function toggleCam() {
    console.log("toggle");

    if(!toggled) {
            //scene.fog = new THREE.Fog(color, 0, 10);
    }else{
        cameraControls.setLookAt(0, 0, 250, 0, 0, 0, true);
        camera.layers.disable(5);
        lineMat.linewidth = 2;
        toggled = false;
        rotateText();
            //scene.fog = new THREE.Fog(color, near, far);

    }
}

function rotateText(){
    let counter = 0;
    scene.children.forEach(object => {
        
        
        if (object instanceof THREE.Object3D) {
            //console.log(object.name);
            //
            if(toggled){
                //3d model would have scene name
                if(object.name == "Scene"){
                    object.rotation.x = 90 * Math.PI/180;
                    object.rotation.y = -135 * Math.PI/180;
                    //object.rotation.z = 45 * Math.PI/180;
                }
            }
            else{
                if(object.name == "Scene"){
                    object.rotation.x = 0 * Math.PI/180;
                    object.rotation.y = 0 * Math.PI/180;
                }
                 
            }
            
        }

        if(object instanceof THREE.Group){
            console.log(object.name);
            if(object.name == "Scene") return;
            if(toggled){
                object.rotation.x = 90 * Math.PI/180;
                object.scale.set(0.6,0.6,0.6);
            }else{
                object.rotation.x = 0 * Math.PI/180;
                object.scale.set(1,1,1);
            }
        }
    });
}


//#region html input debugging

var el = document.getElementById("ToggleButton");

if(el.addEventListener)
        el.addEventListener("click", toggleCam);
else if(el.attachEvent)
    el.attachEvent('onclick', toggleCam);

var cameraCon = document.getElementById("CC");

if(cameraCon.addEventListener)
        cameraCon.addEventListener("click", toggleCameraControls);

//togglable debug camera controls
let cameraConOn = true;
toggleCameraControls();

function toggleCameraControls() {
    cameraConOn = !cameraConOn;

    if(!cameraConOn){
        cameraControls.mouseButtons.left = CameraControls.ACTION.NONE;
        cameraControls.mouseButtons.middle = CameraControls.ACTION.NONE;
        cameraControls.mouseButtons.right = CameraControls.ACTION.NONE;
        cameraControls.mouseButtons.wheel = CameraControls.ACTION.NONE;
    }else{
        cameraControls.mouseButtons.left = CameraControls.ACTION.ROTATE;
        cameraControls.mouseButtons.middle = CameraControls.ACTION.TRUCK;
        cameraControls.mouseButtons.right = CameraControls.ACTION.TRUCK;
        cameraControls.mouseButtons.wheel = CameraControls.ACTION.DOLLY;
    }
}
//#endregion

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const hasControlsUpdated = cameraControls.update(delta);
    interactionManager.update();
    JEASINGS.update();

    render();
}

window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function render() {
    renderer.render(scene, camera);
}

animate();