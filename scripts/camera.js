import * as THREE from 'three';
import CameraControls from 'camera-controls';
CameraControls.install( { THREE: THREE } );

export const cameraMain = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 10000);
export const renderer = new THREE.WebGLRenderer();
    
export const cameraControls = new CameraControls(cameraMain, renderer.domElement);
let cameraConOn = true;
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

export function moveCam(xPos, yPos, zPos, offsetX = 0, offsetY = 0, offsetZ = 70) {
        
        cameraControls.setLookAt(xPos + offsetX + 5, yPos + offsetY, zPos + offsetZ-10, xPos + 5, yPos, 6, true);
        //rotateText(true);
    }