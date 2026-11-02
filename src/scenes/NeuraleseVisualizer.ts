import * as THREE from 'three';

export class NeuraleseVisualizer extends THREE.Group {
  nodesGroup: THREE.Group;
  connectionsGroup: THREE.Group;
  swarmGroup: THREE.Group;
  nodes: THREE.Mesh[] = [];
  time = 0;
  particlePoints?: THREE.Points;

  constructor() {
    super();
    this.name = 'Neuralese & IDA Visualizer';

    this.nodesGroup = new THREE.Group();
    this.connectionsGroup = new THREE.Group();
    this.swarmGroup = new THREE.Group();

    this.buildNetwork();
    this.buildAgentSwarm();

    this.add(this.connectionsGroup);
    this.add(this.nodesGroup);
    this.add(this.swarmGroup);
  }

  buildNetwork() {
    // Multi-layer recurrent graph with glowing hubs
    const nodeCount = 28;
    const sphereGeo = new THREE.SphereGeometry(0.022, 16, 16);
    const nodePositions: THREE.Vector3[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const radius = 0.28 + (i % 3) * 0.12;
      const phi = Math.acos(-1 + (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;

      const pos = new THREE.Vector3(
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) * Math.sin(phi) * 0.7,
        radius * Math.cos(phi)
      );
      nodePositions.push(pos);

      const color = i % 2 === 0 ? 0x00f0ff : 0xbd00ff;
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });
      const node = new THREE.Mesh(sphereGeo, mat);
      node.position.copy(pos);
      this.nodesGroup.add(node);
      this.nodes.push(node);
    }

    // Connect nodes with line geometry
    const linePositions: number[] = [];
    const lineColors: number[] = [];
    const c1 = new THREE.Color(0x00f0ff);
    const c2 = new THREE.Color(0xbd00ff);

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dist = nodePositions[i].distanceTo(nodePositions[j]);
        if (dist < 0.25 || (i % 5 === 0 && j % 5 === 0)) {
          linePositions.push(
            nodePositions[i].x, nodePositions[i].y, nodePositions[i].z,
            nodePositions[j].x, nodePositions[j].y, nodePositions[j].z
          );
          lineColors.push(c1.r, c1.g, c1.b, c2.r, c2.g, c2.b);
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    this.connectionsGroup.add(lines);

    // Central core (Neuralese Recurrent Memory Core)
    const coreGeo = new THREE.DodecahedronGeometry(0.1, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00a3ff,
      emissiveIntensity: 0.8,
      wireframe: true,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    this.nodesGroup.add(core);
  }

  buildAgentSwarm() {
    // 600 particles orbiting the core to visualize 300,000 parallel copies of Agent-3/Agent-4
    const count = 350;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = 0.45 + Math.random() * 0.35;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      positions[i * 3 + 2] = r * Math.cos(phi);

      colors[i * 3] = 0.2 + Math.random() * 0.8;
      colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
      colors[i * 3 + 2] = 1.0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.012,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    this.particlePoints = new THREE.Points(geo, mat);
    this.swarmGroup.add(this.particlePoints);
  }

  update(delta: number) {
    this.time += delta;
    this.nodesGroup.rotation.y += delta * 0.4;
    this.nodesGroup.rotation.x = Math.sin(this.time * 0.3) * 0.1;
    this.connectionsGroup.rotation.y = this.nodesGroup.rotation.y;
    this.connectionsGroup.rotation.x = this.nodesGroup.rotation.x;

    this.swarmGroup.rotation.y -= delta * 0.8;

    // Pulse nodes
    const pulse = 1 + Math.sin(this.time * 6) * 0.2;
    this.nodes.forEach((n, i) => {
      if (i % 2 === 0) {
        n.scale.set(pulse, pulse, pulse);
      }
    });
  }

  dispose() {
    this.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.LineSegments) {
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
