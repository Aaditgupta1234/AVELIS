import { useEffect, useRef } from "react";
import * as THREE from "three";

export const Hero3DScene = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(24, width / height, 0.1, 1000);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const goldKey = new THREE.PointLight(0xC9A227, 2.8, 15);
    goldKey.position.set(5, 4, 5);
    scene.add(goldKey);

    const rimLight = new THREE.DirectionalLight(0xF8F5F0, 0.8);
    rimLight.position.set(-5, 5, 2);
    scene.add(rimLight);

    // Book Asset Group
    const bookGroup = new THREE.Group();

    // Premium Materials
    const coverMat = new THREE.MeshPhongMaterial({ 
        color: 0x0B183D, // Deep Navy
        shininess: 100,
        specular: 0x1A2E57
    });
    const pagesMat = new THREE.MeshPhongMaterial({ color: 0xF8F5F0 });
    const goldDetailMat = new THREE.MeshPhongMaterial({ color: 0xC9A227, shininess: 150 });

    // Geometries
    const coverGeom = new THREE.BoxGeometry(2.8, 4.0, 0.15);
    const pagesGeom = new THREE.BoxGeometry(2.7, 3.9, 0.5);

    const frontCover = new THREE.Mesh(coverGeom, coverMat);
    const backCover = new THREE.Mesh(coverGeom, coverMat);
    const pages = new THREE.Mesh(pagesGeom, pagesMat);

    frontCover.position.z = 0.32;
    backCover.position.z = -0.32;

    // Hinge/Spine logic
    const spineGeom = new THREE.CylinderGeometry(0.32, 0.32, 4.0, 32, 1, false, Math.PI, Math.PI);
    const spine = new THREE.Mesh(spineGeom, coverMat);
    spine.rotation.z = Math.PI / 2;
    spine.position.x = -1.4;
    spine.rotation.x = Math.PI / 2;

    const hinge = new THREE.Group();
    hinge.position.x = -1.4;
    frontCover.position.x = 1.4;
    hinge.add(frontCover);

    bookGroup.add(hinge);
    bookGroup.add(backCover);
    bookGroup.add(pages);
    bookGroup.add(spine);

    // Elegant Ribbon Bookmark
    const ribbonGeom = new THREE.BoxGeometry(0.18, 1.6, 0.01);
    const ribbon = new THREE.Mesh(ribbonGeom, goldDetailMat);
    ribbon.position.set(0.8, 1.5, 0.3);
    bookGroup.add(ribbon);

    scene.add(bookGroup);

    // Animation State
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth) - 0.5;
        mouseY = (e.clientY / window.innerHeight) - 0.5;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;
    function animate() {
        animationFrameId = requestAnimationFrame(animate);
        const time = Date.now() * 0.001;
        
        // Luxury floating rhythm
        bookGroup.position.y = Math.sin(time * 0.3) * 0.25;
        bookGroup.rotation.z = Math.sin(time * 0.15) * 0.03;
        
        // Parallax Response
        bookGroup.rotation.y = THREE.MathUtils.lerp(bookGroup.rotation.y, mouseX * 0.4, 0.04);
        bookGroup.rotation.x = THREE.MathUtils.lerp(bookGroup.rotation.x, mouseY * 0.25, 0.04);
        
        // Elegant page breathing
        hinge.rotation.y = -0.12 + Math.sin(time * 0.5) * 0.05;
        
        // Gold Light Pulse
        goldKey.intensity = 2.5 + Math.sin(time * 1.5) * 0.8;
        
        renderer.render(scene, camera);
    }

    const handleResize = () => {
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    animate();

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
        container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="threejs-container w-full h-full min-h-[400px] md:min-h-[600px]" />;
};
