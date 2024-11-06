import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls';


let scene, camera, renderer, controls, armbones = {}, raycaster, mouse;

// Initial rotation values
const initialRotations = {
    base: 0,
    shoulder: -90,
    elbow: 156, 
    wrist: 20,
};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize scene
    scene = new THREE.Scene();

    // Camera setup
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(2, 2, 5);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xffffff, 1);
    document.body.appendChild(renderer.domElement);

    // Light setup
    const light = new THREE.DirectionalLight(0xffffff, 10);
    light.position.set(5, 5, 5).normalize();
    scene.add(light);

    // OrbitControls setup (for model rotation and zoom)
    controls = new OrbitControls(camera, renderer.domElement);

    // Initialize mouse and raycaster for detecting clicks
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Load the GLTF model
    const loader = new GLTFLoader();
    loader.load('./models/roboticArm.glb', function(gltf) {
        const model = gltf.scene;

        armbones.basebone = model.getObjectByName('baseBone');
        armbones.shoulderbone = model.getObjectByName('shoulderBone');
        armbones.elbowbone = model.getObjectByName('elbowBone');
        armbones.wristbone = model.getObjectByName('wristBone');
        
        model.scale.set(0.01, 0.01, 0.01);  // Adjust scale if necessary
        scene.add(model);

        // Add AxesHelper to show the coordinate system at the base
        const axesHelper = new THREE.AxesHelper(5); // Adjust size as needed
        scene.add(axesHelper)

        const gridHelper = new THREE.GridHelper(10, 20);
        scene.add(gridHelper);

        const gridHelper2 = new THREE.GridHelper(10, 20);
        gridHelper2.rotation.z = Math.PI / 2;
        scene.add(gridHelper2);

        // Link sliders to each part
        document.getElementById("baseSlider").addEventListener("input", (e) => {
            if (armbones.basebone) {
                // Base rotates around the Y-axis
                armbones.basebone.rotation.y = THREE.MathUtils.degToRad(e.target.value);
            }
        });

        document.getElementById("shoulderSlider").addEventListener("input", (e) => {
            if (armbones.shoulderbone) {
                // Shoulder rotates around the Z-axis
                armbones.shoulderbone.rotation.z = THREE.MathUtils.degToRad(e.target.value);
            }
        });

        document.getElementById("elbowSlider").addEventListener("input", (e) => {
            if (armbones.elbowbone) {
                // Elbow rotates around the Z-axis
                armbones.elbowbone.rotation.z = THREE.MathUtils.degToRad(e.target.value);
            }
        });

        document.getElementById("wristSlider").addEventListener("input", (e) => {
            if (armbones.wristbone) {
                // Wrist rotates around the Z-axis
                armbones.wristbone.rotation.z = THREE.MathUtils.degToRad(e.target.value);
            }
        });
        
    }, undefined, function(error) {
        console.error('An error happened while loading the model:', error);
    });

    // Mouse click event to set target position
    window.addEventListener('click', onMouseClick);

    // Reset button functionality
    document.getElementById("resetButton").addEventListener("click", () => {
        // Reset slider values and rotations
    document.getElementById("baseSlider").value = initialRotations.base;
    document.getElementById("shoulderSlider").value = initialRotations.shoulder;
    document.getElementById("elbowSlider").value = initialRotations.elbow;
    document.getElementById("wristSlider").value = initialRotations.wrist;

    if (armbones.basebone) armbones.basebone.rotation.y = THREE.MathUtils.degToRad(initialRotations.base);
    if (armbones.shoulderbone) armbones.shoulderbone.rotation.z = THREE.MathUtils.degToRad(initialRotations.shoulder);
    if (armbones.elbowbone) armbones.elbowbone.rotation.z = THREE.MathUtils.degToRad(initialRotations.elbow);
    if (armbones.wristbone) armbones.wristbone.rotation.z = THREE.MathUtils.degToRad(initialRotations.wrist);
    });

    // Handle window resizing
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
});

// Raycasting to detect mouse click
function onMouseClick(event) {
    event.preventDefault();

    // Convert mouse click to normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Check intersection with the grid
    const intersects = raycaster.intersectObject(scene, true);
    if (intersects.length > 0) {
        const point = intersects[0].point;
        
        // Set the target position for the robotic arm
        console.log(point)

        // Call IK solver to move arm towards target
        //solveIK(target);
    }
}