    import * as THREE from 'three';
    import 'three-hex-tiling';
    export const vertexColorMat = new THREE.MeshBasicMaterial({vertexColors: true});
    export const brightMat = new THREE.MeshToonMaterial();
    export const dotMaterial = new THREE.MeshBasicMaterial({color:0xffff00, transparent: true, opacity: 0.3});
    export const yellow = new THREE.MeshBasicMaterial({color:0xffff00});
    export let color = 0xffff00;


    export function togglePalette(paletteOn){

        if(paletteOn){
            
            roadMat.uniforms.u_customTexture.value = road_tex;
            roadMat.uniforms.u_color.value = new THREE.Color(0x000000);
            crackMat.uniforms.u_color.value = new THREE.Color(0xff0000);
            dashedShapeMaterial.uniforms.dashColor.value = new THREE.Color(0xffff88);
            yellow.color.set(0xffff00);
            dotMaterial.color.set(0xffff00);
            distanceSignMaterial.uniforms.nearColor.value = new THREE.Color(0x01735C);
            groundMat.map = grass_tex;
        } else {
            roadMat.uniforms.u_customTexture.value = null;
            roadMat.uniforms.u_color.value = new THREE.Color(0x888888);
            crackMat.uniforms.u_color.value = new THREE.Color(0x000000);
            dashedShapeMaterial.uniforms.dashColor.value = new THREE.Color(0xffffff);
            yellow.color.set(0xffffff);
            dotMaterial.color.set(0xffffff);
            distanceSignMaterial.uniforms.nearColor.value = new THREE.Color(0x4aaa5c);
            groundMat.map = null;
        }
        groundMat.needsUpdate = true;
    }

    const grass_tex = new THREE.TextureLoader().load("assets/textures/grass.jpg");
    const road_tex = new THREE.TextureLoader().load("assets/textures/asphalt.jpg");
    const crack_tex = new THREE.TextureLoader().load("assets/textures/cracks.png");

    grass_tex.wrapS = THREE.RepeatWrapping;
    grass_tex.wrapT = THREE.RepeatWrapping;
    grass_tex.repeat.set(800, 800);
    
    export const groundMat = new THREE.MeshStandardMaterial({
            map: grass_tex,
            hexTiling: {
                patchScale: 3,
                useContrastCorrectedBlending: true,
                lookupSkipThreshold: 0.01,
                textureSampleCoefficientExponent: 8,
            }
    });

    const road_uniforms = {
        u_customTexture: {value: road_tex},
        u_color: {value: new THREE.Color(0xffffff)},
        u_scaling: {value: 2.5}
    };

    const c_uniforms = {
        u_customTexture: {value: crack_tex},
        u_color: {value: new THREE.Color(0xff0000)},
        u_scaling: {value: 0.5}
    };

    export const roadMat = new THREE.ShaderMaterial( {
        uniforms: road_uniforms,
        fragmentShader: fragmentShader(),
        vertexShader: vertexShader(),
    });

    export const crackMat = new THREE.ShaderMaterial( {
        uniforms: c_uniforms,
        fragmentShader: fragmentShader(),
        vertexShader: vertexShader(),
        transparent: true, // allow alpha blending
        depthWrite: false, // prevents depth buffer from overwriting transparent pixels
        blending: THREE.AdditiveBlending
    });

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
        uniform vec3 u_color;
        uniform float u_scaling;
        varying vec3 vUv;

        void main() {
            vec2 UV = vec2(fract(vUv.x*u_scaling), fract(vUv.y*u_scaling));
            vec4 texColor = texture2D(u_customTexture, UV); 
            gl_FragColor = vec4(u_color, 1.0) + texColor;
        }
    `
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

    function simpleVertexShader() {
    return `
    varying vec2 vUv;

    void main() {
        vUv = uv;
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewPosition; 
    }
  `
    }
    
    function dashedFragmentShader(){
        return ` 
      varying vec2 vUv;
      uniform vec3 dashColor;

      void main() {
        float val = step(0.5, fract(vUv.y/8.0));
        if(val < 0.5) discard;
        gl_FragColor = vec4(dashColor, 1.0);
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
        float dist = distance(cameraPosition, vWorldPosition) - 30.0;
        float t = clamp(dist / maxDistance, 0.0, 1.0);
        gl_FragColor = vec4(nearColor, t);
        }
    `
    }

    export const dashedShapeMaterial = new THREE.ShaderMaterial({
        uniforms: {
            dashColor: { value: new THREE.Color(0xffffff) }
        },
        vertexShader: simpleVertexShader(),
        fragmentShader: dashedFragmentShader(),
        transparent: true,
        depthWrite: false, // prevents depth buffer from overwriting transparent pixels
        blending: THREE.NormalBlending
    });

    export const distanceSignMaterial = new THREE.ShaderMaterial({
    uniforms: {
        nearColor: { value: new THREE.Color(0x01735C) },
        maxDistance: { value: 10.0 }
    },
    vertexShader: worldPositionVertexShader(),
    fragmentShader: distanceAlphaFragmentShader(),
        transparent: true, // allow alpha blending
        depthTest: true, // prevents depth buffer from overwriting transparent pixels
        blending: THREE.NormalBlending
    });

    export const distanceWhiteMaterial = new THREE.ShaderMaterial({
    uniforms: {
        nearColor: { value: new THREE.Color(0xffffff) },
        maxDistance: { value: 10.0 }
    },
    vertexShader: worldPositionVertexShader(),
    fragmentShader: distanceAlphaFragmentShader(),
        transparent: true,
        depthTest: false,
        blending: THREE.NormalBlending
    });

    export const distanceGreyMaterial = new THREE.MeshStandardMaterial({
        color: 0x47617c
    });