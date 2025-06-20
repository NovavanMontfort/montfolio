import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/Addons.js';
import { AnimationMixer } from 'three';

gsap.registerPlugin(ScrollTrigger);

class Skull {
    constructor({ element } = {}) {
        this.$element = element;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.skull = null;
        this.group = null;
        this.mixer = null;
        this.action = null;
        this.clock = new THREE.Clock();
        this.duration = 0;

        this.state = {
            progress: 0,
            targetRotationY: 0,
            targetRotationX: 0,
        };

        this.loadModel({
            onComplete: ({ model, texture, animations }) => {
                this.setupScene(model, texture, animations);
                this.setupScrollAnimations();
            },
        });
    }

    loadModel({ onComplete }) {
        const gltfLoader = new GLTFLoader();
        const rgbeLoader = new RGBELoader();

        rgbeLoader.load('/studio_small_09_1k.hdr', (texture) => {
            gltfLoader.load('/skull2.glb', (gltf) => {
                onComplete({
                    model: gltf.scene,
                    texture,
                    animations: gltf.animations,
                });
            });
        });
    }

    setupScene(model, texture, animations) {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.$element.clientWidth, this.$element.clientHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.75;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.$element.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.scene.environment = texture;
        this.scene.fog = new THREE.Fog(0x242424, 25, 40);

        this.camera = new THREE.PerspectiveCamera(60, this.$element.clientWidth / this.$element.clientHeight, 0.1, 2000);
        this.camera.position.set(0, 0, 25);

        this.group = new THREE.Group();
        this.skull = model;
        this.group.add(this.skull);
        this.scene.add(this.group);

        if (animations && animations.length > 0) {
            this.mixer = new AnimationMixer(this.skull);
            this.action = this.mixer.clipAction(animations[0]);
            this.action.paused = true;
            this.action.play();
            this.duration = animations[0].duration;
        }

        window.addEventListener('resize', this.handleResize);
        window.addEventListener('mousemove', this.handleMouseMove);
        gsap.ticker.add(this.handleTick);

        this.scrub(1.0); // Start at end position
    }

    setupScrollAnimations() {
        const fovRad = (this.camera.fov * Math.PI) / 180;
        const distance = this.camera.position.z;
        const viewportHeight = 2 * Math.tan(fovRad / 2) * distance;
        const yOffset = viewportHeight * 0.5;

        this.timelineSkull = gsap.timeline({
            paused: true,
            onUpdate: () => this.scrub(this.state.progress),
        });

        this.timelineSkull.to(this.state, { progress: 0.5, duration: 2.5, ease: 'none' }, 0.0);
        // this.timelineSkull.to(this.skull.position, { y: yOffset, duration: 5, ease: 'none' }, 0.0);
        this.timelineSkull.to(this.skull.rotation, { y: 2 * Math.PI, duration: 5, ease: 'none' }, 0.0);
        this.timelineSkull.to(this.skull.position, { z: -50, duration: 4, ease: 'none' }, 1.0);

        ScrollTrigger.create({
            trigger: document.querySelector("[data-section='landing']"),
            start: 'top top',
            end: 'bottom top',
            onUpdate: (self) => this.timelineSkull.progress(self.progress),
        });

        ScrollTrigger.create({
            trigger: document.querySelector("[data-section='footer']"),
            start: 'top bottom',
            end: 'top top',
            onUpdate: (self) => this.timelineSkull.progress(1.0 - self.progress),
        });
    }

    handleMouseMove = (event) => {
        const rect = this.$element.getBoundingClientRect();
        const mouseX = (event.clientX - rect.left) / rect.width;
        const mouseY = (event.clientY - rect.top) / rect.height;
        this.state.targetRotationY = (mouseX - 0.5) * 1.6;
        this.state.targetRotationX = (mouseY - 0.5) * 1.6;
    };

    handleTick = (time) => {
        if (this.mixer) this.mixer.update(this.clock.getDelta());

        this.group.rotation.y += (this.state.targetRotationY - this.group.rotation.y) * 0.1;
        this.group.rotation.x += (this.state.targetRotationX - this.group.rotation.x) * 0.1;

        this.camera.position.x = Math.sin(time * 0.3) * 0.5;
        this.camera.position.y = Math.sin(time * 0.5) * 0.24;
        this.camera.position.z = 25 + Math.sin(time * 0.15) * 2;
        this.camera.rotation.z = Math.sin(time * 0.25) * 0.1;

        this.renderer.render(this.scene, this.camera);
    };

    handleResize = () => {
        const width = this.$element.clientWidth;
        const height = this.$element.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    };

    scrub(progress) {
        if (!this.action || !this.duration) return;
        this.action.paused = true;
        this.action.time = progress * this.duration;
        this.action.play();
        this.mixer.update(0); // immediate update
    }

    destroy() {
        gsap.ticker.remove(this.handleTick);
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('mousemove', this.handleMouseMove);
        this.renderer.dispose();
    }
}

export default Skull;
