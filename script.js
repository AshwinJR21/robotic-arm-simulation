import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls';
// import { CCDIKSolver } from 'three/examples/jsm/animation/CCDIKSolver.js';


let scene, camera, renderer, controls, arm = {}, raycaster, mouse, knife, thisarm = [];

// Initial rotation values
const initialRotations = {
    base: 0,
    shoulder: 0,
    elbow: 0, 
    wrist: 0,
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
    
    window.addEventListener('click', (event) => {
        onMouseClick(event);
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


// Raycasting to detect mouse click
function onMouseClick(event) {
    event.preventDefault();

    // Convert mouse click to normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    // Define a ground plane at y = 0 or any specific height you'd like
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // Find the intersection point of the ray with the plane
    const targetPosition = new THREE.Vector3();

    raycaster.ray.intersectPlane(plane, targetPosition);
    // Check intersection with the grid

    console.log(targetPosition);
    jacobianTransposeIK(thisarm, knife, targetPosition);
}

// Example setup: `arm` is an array of joints (THREE.Object3D) from base to end-effector
// `targetPosition` is the target point in THREE.Vector3
function jacobianTransposeIK(arm, endEffector, targetPosition, learningRate = 0.1, tolerance = 0.1, maxIterations = 10) {
    let iterations = 0;
    
    while (iterations < maxIterations) {
        // Calculate the vector from the end effector to the target position
        const toTarget = new THREE.Vector3().subVectors(targetPosition, endEffector.getWorldPosition(new THREE.Vector3()));
        
        // Stop if we are within tolerance
        if (toTarget.length() < tolerance) break;
        
        // Initialize the Jacobian matrix (3 rows for x, y, z; columns = number of joints)
        const jacobian = [];
        // Loop through each joint and compute the Jacobian column for that joint
        for (let i = 0; i < arm.length; i++) {
            //console.log(`Processing joint ${i}:`, arm[i]);
            const joint = arm[i];
            // Get the joint's current world position
            const jointPosition = joint.getWorldPosition(new THREE.Vector3());
            
            // Calculate the vector from this joint to the end effector
            const toEndEffector = new THREE.Vector3().subVectors(endEffector.getWorldPosition(new THREE.Vector3()), jointPosition);

            // Calculate the axis of rotation for this joint (assuming rotation around local Z-axis)
            const rotationAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(joint.quaternion).normalize();

            // Calculate the Jacobian column as the cross product of the rotation axis and the vector to the end effector
            const jacobianColumn = new THREE.Vector3().crossVectors(rotationAxis, toEndEffector);

            // Store the column in the Jacobian matrix
            jacobian.push(jacobianColumn);
        }

        // Apply the Jacobian transpose to approximate the necessary joint rotations
        for (let i = 0; i < arm.length - 1; i++) {
            const joint = arm[i];
            const jacobianColumn = jacobian[i];
            
            // Compute the "gradient" of movement for this joint
            const gradient = jacobianColumn.dot(toTarget) * learningRate;

            // Update the joint's rotation based on the computed gradient (assuming rotation around Z-axis)
            if(joint.name == 'base'){
                joint.rotation.z += gradient;
            }else{
                joint.rotation.y += gradient;
            }
        }

        iterations++;
    }
}
