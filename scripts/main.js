import * as THREE from 'three';
import { loadModel } from './loadModel.js';
import {roadMat, dashedShapeMaterial, groundMat, dotMaterial, yellow, togglePalette } from './materials.js';
import {drawSign, drawQuad, drawRoad, drawSphere, drawTriangleSign, loadSign } from './shapes.js';
import { renderer, cameraMain, cameraControls, toggleCameraControls, SetCameraState, CameraState, focusPosition, focusTarget} from './camera.js';
import {MathUtils} from 'three';
import { interactionManager, toggleScenePerspective, toggled } from './interaction.js';

import {Text} from 'troika-three-text';
import Papa from 'papaparse';
import data from '/maps/data3.json' with { type: 'json' };

window.onload = () => loadScene();



function loadScene() {

    //scene setup
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    

    const color = 0xa0bff0;  // blue
    const hereText = new Text();
    scene.background = new THREE.Color(color);

    const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
    directionalLight.castShadow = true;
    directionalLight.target.position.x = 20;
    directionalLight.target.position.y = 20;
    directionalLight.target.position.z = -20;
    //scene.add(directionalLight);
    //scene.add(directionalLight.target);
    const light = new THREE.AmbientLight(0xffffff); // soft white light
    scene.add( light );

    const planeGeo = new THREE.PlaneGeometry();
    const ground = new THREE.Mesh(planeGeo, groundMat);
    ground.name = "ground";
    ground.scale.x = 5000;
    ground.scale.y = 5000;
    scene.add(ground);

    const nodePos = {};
    let sources = {};

    const obj = data;
    var dataID; //gets icon information from csv file
    let modelPaths = {};

    focusPosition.set(0,0,0);
    focusTarget.set(0,0,0);

    function getTimeDifference(dest){
        let timeMul = obj.nodes.find(item => item.key === dest);
        let expireTime;
        
        expireTime = timeMul.attributes.content.date.quantity;
        
        switch(timeMul.attributes.content.date.timespan){
            case "day(s)":
                expireTime *= 1;
            break;
            case "month(s)":
                expireTime *= 30;
            break;
            case "year(s)":
                expireTime *= 365;
            break;
        }

        let days = expireTime;
        return days;
    }    

    function drawTimeline() {
        let startingGroup = new THREE.Group();
        
        startingGroup.name = "hello";
        hereText.color = 0xFFFF00;
        hereText.fontSize = 4;
        hereText.font = 'assets/fonts/Highwaygothicd-KV5Dp.otf';
        hereText.text = "You are here.";
        hereText.anchorX = 'right';
        hereText.anchorY = 'middle';
        hereText.sync();
        hereText.position.x = -14;
        hereText.position.z = 1;
        hereText.layers.set(2);
        startingGroup.add(hereText);
        
        
        drawQuad(-14, -0.25, 12, 0.5, yellow, startingGroup, 1, 2);
        drawSphere(0, 0, 0, 3, scene, yellow, true);
        scene.add(startingGroup);
        let level = getTimeDifference(obj.edges[0].source)*3;
        loadSign(obj.edges[0].source, dataID, obj, nodePos, scene, 0, level/2);
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

                //draws distance between single node
                if(!(dest in nodePos))  {
                    //draw with time difference
                    nodePos[dest] = new THREE.Vector2(level + getTimeDifference(dest)*3, 0);
                    sources[dest] = 0;
                }
                
                level += 1;
                
            }   else    {
                sources[src] += 1;
                if(!(dest in nodePos))  {
                    //draws spaced shape
                    nodePos[dest] = new THREE.Vector2(nodePos[src].x + getTimeDifference(dest)*3, (sources[src]-1.5) * 900);
                }
                
            }
            drawRoad(src, dest, sources[src], childCount, nodePos, scene, roadMat, dataID, obj);
        }


        //draw spheres at positions
        for (const [key, value] of Object.entries(nodePos)) {
            
            if(key in modelPaths)
            {
                //draws all models to scene
                loadModel(modelPaths[key], nodePos[key].y + 35, nodePos[key].x - 3, 8.7, 5, scene);
                
            }

            //loadSign(key, dataID, obj, nodePos, scene);
            drawSphere(value.y, value.x, 0, 3, scene);
            
        }
    }

    //Read matching 3D models to data key
    Papa.parse('assets/data/iconData.csv', {
        header: true,
        download: true,
        dynamicTyping: true,
        complete: function(results) {

            dataID = results.data;
            
            for(let i = 0; i < dataID.length; i++){
                modelPaths[dataID[i].id.toString()] = dataID[i].icon.toString();
            }

            drawTimeline();
        }
    });


    // #region UI interactions

    var pal_swap = document.getElementById("ColorSwap");

    if(pal_swap.addEventListener){
            pal_swap.addEventListener("click", () => { SwapPalette(); });
    }

    let paletteChange = true;

    function SwapPalette(){
        paletteChange = !paletteChange;
        if(paletteChange){
            scene.background = new THREE.Color(color);
            hereText.color = 0xFFFF00;
        }else{
            scene.background = new THREE.Color(color);
            hereText.color = 0xFFFFFF;
        }
        togglePalette(paletteChange);
    }

    var top_element = document.getElementById("TopButton");
    var mid_element = document.getElementById("MidButton");
    var low_element = document.getElementById("LowButton");

    top_element.addEventListener("click", () => { SetCameraView(CameraState.TOPDOWN) });
    mid_element.addEventListener("click", () => { SetCameraView(CameraState.BIRDSEYE) });
    low_element.addEventListener("click", () => { SetCameraView(CameraState.FIRSTPERSON) });

    var show_model = document.getElementById("ShowModel");

    let modelDebug = false;
    cameraMain.layers.disable(5);
    cameraMain.layers.disable(3)

    function SetCameraView(view){
        SetCameraState(view);

        if(view == CameraState.TOPDOWN){
            toggleScenePerspective(false, scene);
        } else {
            toggleScenePerspective(true, scene);
        }
    }

    var cameraCon = document.getElementById("CC");

    if(cameraCon.addEventListener)
            cameraCon.addEventListener("click", toggleCameraControls);

    // #endregion

    SetCameraState(CameraState.TOPDOWN);
    toggleCameraControls();
    togglePalette(true);

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        if(toggled){
            //rotate objects while in toggle view
            scene.children.forEach(object => {
            
                if (object instanceof THREE.Object3D) {
                    if(object.name == "Scene"){
                            let time = Date.now() * 0.001;
                            //object.rotation.y = -time * .25;
                        }
                    }
                    
            });
        }

        const delta = clock.getDelta();
        const hasControlsUpdated = cameraControls.update(delta);
        interactionManager.update();

        render();
    }

    window.addEventListener('resize', function () {
    cameraMain.aspect = window.innerWidth / window.innerHeight;
    cameraMain.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    });

    function render() {
        renderer.render(scene, cameraMain);
    }

    animate();
}