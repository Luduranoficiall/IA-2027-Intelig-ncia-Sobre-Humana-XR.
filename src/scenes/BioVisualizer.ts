import * as THREE from 'three';

export class BioVisualizer extends THREE.Group {
  dnaGroup: THREE.Group;
  capsidGroup: THREE.Group;
  nucleotides: THREE.Mesh[] = [];
  spikes: THREE.Mesh[] = [];
  time = 0;
  activeRiskIndex = 0;

  constructor() {
    super();
    this.name = 'Bioscience Visualizer';

    this.dnaGroup = new THREE.Group();
    this.capsidGroup = new THREE.Group();

    this.buildDNA();
    this.buildCapsid();

    this.add(this.dnaGroup);
    this.add(this.capsidGroup);

    // Initial position in central stage
    this.position.set(0, 0, 0);
  }

  buildDNA() {
    const pairCount = 36;
    const radius = 0.18;
    const heightSpan = 0.9;
    const turns = 2.5;

    const baseColors = [0x00e5ff, 0xff1744, 0x00e676, 0xffea00]; // A, T, G, C
    const sphereGeo = new THREE.SphereGeometry(0.018, 16, 16);
    const cylinderGeo = new THREE.CylinderGeometry(0.006, 0.006, 1, 12);

    for (let i = 0; i < pairCount; i++) {
      const t = i / pairCount;
      const angle = t * Math.PI * 2 * turns;
      const y = (t - 0.5) * heightSpan;

      const x1 = Math.cos(angle) * radius;
      const z1 = Math.sin(angle) * radius;
      const x2 = Math.cos(angle + Math.PI) * radius;
      const z2 = Math.sin(angle + Math.PI) * radius;

      // Backbone strand 1
      const mat1 = new THREE.MeshStandardMaterial({
        color: baseColors[i % 4],
        roughness: 0.2,
        metalness: 0.8,
        emissive: baseColors[i % 4],
        emissiveIntensity: 0.3,
      });
      const node1 = new THREE.Mesh(sphereGeo, mat1);
      node1.position.set(x1, y, z1);
      this.dnaGroup.add(node1);
      this.nucleotides.push(node1);

      // Backbone strand 2
      const mat2 = new THREE.MeshStandardMaterial({
        color: baseColors[(i + 2) % 4],
        roughness: 0.2,
        metalness: 0.8,
        emissive: baseColors[(i + 2) % 4],
        emissiveIntensity: 0.3,
      });
      const node2 = new THREE.Mesh(sphereGeo, mat2);
      node2.position.set(x2, y, z2);
      this.dnaGroup.add(node2);
      this.nucleotides.push(node2);

      // Connecting hydrogen bond rung
      const rungMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.75,
        roughness: 0.5,
      });
      const rung = new THREE.Mesh(cylinderGeo, rungMat);
      rung.scale.set(1, radius * 2, 1);
      rung.position.set(0, y, 0);
      rung.rotation.z = Math.PI / 2;
      rung.rotation.y = -angle;
      this.dnaGroup.add(rung);
    }
  }

  buildCapsid() {
    // A wireframe icosahedral capsid shell surrounding viral RNA/DNA
    const capsidGeo = new THREE.IcosahedronGeometry(0.38, 1);
    const capsidMat = new THREE.MeshStandardMaterial({
      color: 0xff3d71,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      emissive: 0xff3d71,
      emissiveIntensity: 0.2,
    });
    const shell = new THREE.Mesh(capsidGeo, capsidMat);
    this.capsidGroup.add(shell);

    // Surface glycoprotein spikes
    const spikeGeo = new THREE.ConeGeometry(0.015, 0.08, 8);
    spikeGeo.translate(0, 0.04, 0);
    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xff5500,
      emissiveIntensity: 0.4,
      roughness: 0.3,
    });

    const posAttr = capsidGeo.attributes.position;
    const vertex = new THREE.Vector3();
    for (let i = 0; i < posAttr.count; i += 3) {
      vertex.fromBufferAttribute(posAttr, i);
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.copy(vertex);
      spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vertex.clone().normalize());
      this.capsidGroup.add(spike);
      this.spikes.push(spike);
    }
  }

  update(delta: number) {
    this.time += delta;
    this.dnaGroup.rotation.y += delta * 0.8;
    this.capsidGroup.rotation.y -= delta * 0.4;
    this.capsidGroup.rotation.x = Math.sin(this.time * 0.5) * 0.15;

    // Pulse risk nodes
    const pulse = 1 + Math.sin(this.time * 4) * 0.25;
    this.spikes.forEach((spike, idx) => {
      if (idx % 3 === 0) {
        spike.scale.set(pulse, pulse, pulse);
      }
    });
  }

  dispose() {
    this.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}
