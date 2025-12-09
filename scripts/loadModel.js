import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { vertexColorMat } from './materials.js';
//models
const loader = new GLTFLoader();
//draws a model to the scene given name and position, with optional interactive, scale, and group inputs
export function loadModel(modelName, x, y, z, scale = 3, scene, group)
{

    loader.load('assets/models/' + modelName + '.glb', function(gltf) {
    const modelOriginal = gltf.scene;
    
    modelOriginal.scale.set(scale, scale, scale);
    modelOriginal.position.set(x,y,z);

    modelOriginal.traverse((mod) => {
        //mod.layers.set(5);
    if (mod.isMesh) {
      // Replace the material with MeshBasicMaterial for unlit effect
      mod.material = vertexColorMat;
    }
    
  });

    if(group){
        group.add(modelOriginal);
    }else{
        scene.add(modelOriginal);
    }    

}, undefined, function ( error ) {

  console.error( error );

} );
}