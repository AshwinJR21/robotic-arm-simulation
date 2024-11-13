import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls';


let scene, camera, renderer, controls, arm = {}, raycaster, mouse, knife, thisarm = [], jointAngles ={};

// Initial rotation values
const initialRotations = {
    base: 0,
    shoulder: 0,
    elbow: 0, 
    wrist: 0,
};

function updateAngle(joint) {
    const angleInput = document.getElementById(`${joint}Angle`);
    jointAngles[joint] = parseFloat(angleInput.value);

    // Here, update the arm's rotation based on the angle
    // For example:
    if (joint === 'base') {
        thisarm[0].rotation.z = THREE.MathUtils.degToRad(jointAngles.base);
    } else if (joint === 'shoulder') {
        thisarm[1].rotation.y = THREE.MathUtils.degToRad(jointAngles.shoulder);
    } else if (joint === 'elbow') {
        thisarm[2].rotation.y = THREE.MathUtils.degToRad(jointAngles.elbow);
    } else if (joint === 'wrist') {
        thisarm[3].rotation.y = THREE.MathUtils.degToRad(jointAngles.wrist);
    }
}

function computeForwardKinematics() {
    // Example FK computation (simplified):
    // You would replace this with the actual FK based on the robotic arm’s configuration

    // Assume you can calculate the position of the end effector here:
    const endEffectorPosition = thisarm[3].getWorldPosition(new THREE.Vector3());

    // Display the computed position
    document.getElementById('fkResult').textContent =
        `Position: (X: ${endEffectorPosition.x.toFixed(2)}, Y: ${endEffectorPosition.y.toFixed(2)}, Z: ${endEffectorPosition.z.toFixed(2)})`;
}

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

    // Load the GLTF model
    const loader = new GLTFLoader();
    loader.load('./models/armSim.glb', function(gltf) {
        const model = gltf.scene;

        arm.base = model.getObjectByName('base');
        arm.shoulder = model.getObjectByName('shoulder');
        arm.elbow = model.getObjectByName('elbow');
        arm.wrist = model.getObjectByName('wrist');
        knife = model.getObjectByName('knife');
        thisarm = [arm.base, arm.shoulder, arm.elbow, arm.wrist];

        
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
            if (arm.base) {
                // Base rotates around the Y-axis
                arm.base.rotation.z = THREE.MathUtils.degToRad(e.target.value);
            }
        });

        document.getElementById("shoulderSlider").addEventListener("input", (e) => {
            if (arm.shoulder) {
                // Shoulder rotates around the Z-axis
                arm.shoulder.rotation.y = THREE.MathUtils.degToRad(e.target.value);
            }
        });

        document.getElementById("elbowSlider").addEventListener("input", (e) => {
            if (arm.elbow) {
                // Elbow rotates around the Z-axis
                arm.elbow.rotation.y = THREE.MathUtils.degToRad(e.target.value);
            }
        });

        document.getElementById("wristSlider").addEventListener("input", (e) => {
            if (arm.wrist) {
                // Wrist rotates around the Z-axis
                arm.wrist.rotation.y = THREE.MathUtils.degToRad(e.target.value);
            }
        });
        
    }, undefined, function(error) {
        console.error('An error happened while loading the model:', error);
    });
    
    // window.addEventListener('click', (event) => {
    //     onMouseClick(event);
    // });

    document.getElementById("computeFKButton").addEventListener("click", () => {
        updateAngle('base');
        updateAngle('shoulder');
        updateAngle('elbow');
        updateAngle('wrist');

        computeForwardKinematics();
    });

    // Reset button functionality
    document.getElementById("resetButton").addEventListener("click", () => {
        // Reset slider values and rotations
    document.getElementById("baseSlider").value = initialRotations.base;
    document.getElementById("shoulderSlider").value = initialRotations.shoulder;
    document.getElementById("elbowSlider").value = initialRotations.elbow;
    document.getElementById("wristSlider").value = initialRotations.wrist;

    if (arm.base) arm.base.rotation.z = THREE.MathUtils.degToRad(initialRotations.base);
    if (arm.shoulder) arm.shoulder.rotation.y = THREE.MathUtils.degToRad(initialRotations.shoulder);
    if (arm.elbow) arm.elbow.rotation.y = THREE.MathUtils.degToRad(initialRotations.elbow);
    if (arm.wrist) arm.wrist.rotation.y = THREE.MathUtils.degToRad(initialRotations.wrist);
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

