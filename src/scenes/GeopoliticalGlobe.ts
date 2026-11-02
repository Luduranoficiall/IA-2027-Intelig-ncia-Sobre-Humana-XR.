import * as THREE from 'three';

export class GeopoliticalGlobe extends THREE.Group {
  globeMesh: THREE.Mesh;
  haloMesh: THREE.Mesh;
  markersGroup: THREE.Group;
  arcsGroup: THREE.Group;
  time = 0;

  constructor() {
    super();
    this.name = 'Geopolitical Compute Globe';

    this.markersGroup = new THREE.Group();
    this.arcsGroup = new THREE.Group();

    // Earth Sphere with wireframe land/lat-long grid
    const globeGeo = new THREE.SphereGeometry(0.32, 32, 24);
    const globeMat = new THREE.MeshStandardMaterial({
      color: 0x0a192f,
      roughness: 0.8,
      metalness: 0.2,
      wireframe: true,
      emissive: 0x0d2b45,
      emissiveIntensity: 0.4,
    });
    this.globeMesh = new THREE.Mesh(globeGeo, globeMat);

    // Subtle outer atmospheric glow
    const haloGeo = new THREE.SphereGeometry(0.35, 32, 24);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.12,
      wireframe: true,
    });
    this.haloMesh = new THREE.Mesh(haloGeo, haloMat);

    this.add(this.globeMesh);
    this.add(this.haloMesh);
    this.add(this.markersGroup);
    this.add(this.arcsGroup);

    this.setupGeopoliticalNodes();
    this.setupDataArcs();
  }

  // Convert lat/long to 3D point on globe
  latLongToVector(lat: number, lon: number, radius = 0.325): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    return new THREE.Vector3(
      -(radius * Math.sin(phi) * Math.cos(theta)),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  setupGeopoliticalNodes() {
    const nodes = [
      { name: 'OpenBrain (US West)', lat: 37.77, lon: -122.41, color: 0x00f0ff, desc: '50% Compute Target' },
      { name: 'Tianwan CDZ (China)', lat: 34.69, lon: 119.46, color: 0xff3b30, desc: '40% China Nuclear Cluster' },
      { name: 'TSMC (Taiwan)', lat: 24.81, lon: 120.96, color: 0xffcc00, desc: '80% Frontier AI Chips' },
      { name: 'Europe Summit (Geneva)', lat: 46.20, lon: 6.14, color: 0x34c759, desc: 'AI Freeze Summit' },
      { name: 'Washington D.C.', lat: 38.90, lon: -77.03, color: 0x5856d6, desc: 'NSC / Oversight Committee' },
    ];

    const pinGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.06, 8);
    pinGeo.translate(0, 0.03, 0);
    const headGeo = new THREE.SphereGeometry(0.012, 12, 12);

    nodes.forEach((n) => {
      const pos = this.latLongToVector(n.lat, n.lon);
      const nodeGroup = new THREE.Group();
      nodeGroup.position.copy(pos);
      nodeGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());

      const pinMat = new THREE.MeshStandardMaterial({ color: n.color });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      const headMat = new THREE.MeshStandardMaterial({
        color: n.color,
        emissive: n.color,
        emissiveIntensity: 0.8,
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 0.06;

      nodeGroup.add(pin, head);
      this.markersGroup.add(nodeGroup);
    });
  }

  setupDataArcs() {
    // Arc between US and China (Exfiltration vector)
    const usPos = this.latLongToVector(37.77, -122.41);
    const chinaPos = this.latLongToVector(34.69, 119.46);

    const midPoint = new THREE.Vector3()
      .addVectors(usPos, chinaPos)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(0.52); // arc elevation

    const curve = new THREE.QuadraticBezierCurve3(usPos, midPoint, chinaPos);
    const points = curve.getPoints(40);
    const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
    const arcMat = new THREE.LineBasicMaterial({
      color: 0xff3b30,
      transparent: true,
      opacity: 0.75,
    });
    const arc = new THREE.Line(arcGeo, arcMat);
    this.arcsGroup.add(arc);
  }

  update(delta: number) {
    this.time += delta;
    this.globeMesh.rotation.y += delta * 0.15;
    this.haloMesh.rotation.y += delta * 0.2;
    this.markersGroup.rotation.y = this.globeMesh.rotation.y;
    this.arcsGroup.rotation.y = this.globeMesh.rotation.y;
  }

  dispose() {
    this.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
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
