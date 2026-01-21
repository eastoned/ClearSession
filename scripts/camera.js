import * as THREE from 'three';
import CameraControls from 'camera-controls';
CameraControls.install( { THREE: THREE } );

export const cameraMain = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 2000);
export const renderer = new THREE.WebGLRenderer();
    
export const cameraControls = new CameraControls(cameraMain, renderer.domElement);
let cameraConOn = true;
export let focusPosition = new THREE.Vector3(0,0,0);
export let focusTarget = new THREE.Vector3(0,0,0);

export const CameraState = Object.freeze({
    TOPDOWN: 'TOPDOWN',
    BIRDSEYE: 'BIRDSEYE',
    FIRSTPERSON: 'FIRSTPERSON'
});

let currentCameraState = CameraState.TOPDOWN;

export function SetCameraState(camState) {
    switch(camState){
        case 'TOPDOWN':
            cameraControls.fov = 10;
            cameraMain.layers.disable(1);
            cameraMain.layers.enable(2);
            break;
        case 'BIRDSEYE':
            cameraControls.fov = 100;
            cameraMain.layers.enable(1);
            cameraMain.layers.disable(2);
            break;
        case 'FIRSTPERSON':
            cameraControls.fov = 100;
            cameraMain.layers.enable(1);
            cameraMain.layers.disable(2);
            break;
    }
    currentCameraState = camState;

    moveCamera(focusPosition.x, focusPosition.y, focusPosition.z, focusTarget.x, focusTarget.y, focusTarget.z);
}

export function toggleCameraControls() {
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

export function moveCamera(xPos = 0, yPos = 0, zPos = 0, offsetX = 0, offsetY = 0, offsetZ = 0) {
    
    focusPosition.set(xPos, yPos, zPos);
    focusTarget.set(offsetX, offsetY, offsetZ);
    
    switch(currentCameraState){
        case 'TOPDOWN':
            cameraControls.setLookAt(focusPosition.x, focusPosition.y, focusPosition.z + 250, focusTarget.x, focusTarget.y, focusTarget.z, true);
            break;
        case 'BIRDSEYE':
            cameraControls.setLookAt(focusPosition.x, focusPosition.y - 70, focusPosition.z + 50, focusTarget.x, focusTarget.y, focusTarget.z, true);
            break;
        case 'FIRSTPERSON':
            cameraControls.setLookAt(focusPosition.x + 5, focusPosition.y - 35, focusPosition.z + 8, focusTarget.x + 5, focusTarget.y + 30, focusTarget.z + 5, true);
            break;
    }
}