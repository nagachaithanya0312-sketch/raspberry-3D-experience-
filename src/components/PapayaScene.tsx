import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Box3,
  Color,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Path,
  PerspectiveCamera,
  Plane,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
} from "three";

const modelPath = `${import.meta.env.BASE_URL}models/papaya.glb`;
const dracoPath = `${import.meta.env.BASE_URL}site-assets/libs/draco/`;

useGLTF.setDecoderPath(dracoPath);
useGLTF.preload(modelPath, dracoPath);

interface PapayaSceneProps {
  warmLight: boolean;
  cutaway: boolean;
  onReady: () => void;
}

const papayaSeedPositions = Array.from({ length: 18 }, (_, index) => {
  const row = Math.floor(index / 6);
  const column = index % 6;
  const rowOffset = row === 1 ? 0.08 : 0;

  return [-0.58 + column * 0.22 + rowOffset, (row - 1) * 0.12, 0.075] as [number, number, number];
});

function createPapayaCutFace() {
  const face = new Shape();
  face.moveTo(-1.38, -0.03);
  face.bezierCurveTo(-1.43, 0.48, -0.9, 0.77, -0.2, 0.76);
  face.bezierCurveTo(0.55, 0.78, 1.25, 0.56, 1.42, 0.2);
  face.bezierCurveTo(1.52, -0.08, 1.28, -0.4, 0.78, -0.58);
  face.bezierCurveTo(0.06, -0.83, -0.92, -0.72, -1.32, -0.32);
  face.bezierCurveTo(-1.4, -0.23, -1.42, -0.12, -1.38, -0.03);

  const cavity = new Path();
  cavity.absellipse(-0.02, 0.01, 0.69, 0.3, 0, Math.PI * 2, true, 0);
  face.holes.push(cavity);

  return new ShapeGeometry(face, 48);
}

function createPapayaCavity() {
  const cavity = new Shape();
  cavity.absellipse(-0.02, 0.01, 0.68, 0.29, 0, Math.PI * 2, false, 0);
  return new ShapeGeometry(cavity, 48);
}

function PapayaCutaway({
  fleshColor,
  cavityColor,
  seedColor,
}: {
  fleshColor: Color;
  cavityColor: Color;
  seedColor: Color;
}) {
  const faceGeometry = useMemo(() => createPapayaCutFace(), []);
  const cavityGeometry = useMemo(() => createPapayaCavity(), []);
  const seedGeometry = useMemo(() => new SphereGeometry(1, 14, 10), []);
  const seedMaterial = useMemo(
    () => new MeshBasicMaterial({ color: seedColor, toneMapped: false }),
    [seedColor],
  );
  const seeds = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!seeds.current) return;

    const transform = new Object3D();
    papayaSeedPositions.forEach(([x, y, z], index) => {
      transform.position.set(x, y, z);
      transform.scale.set(0.075, 0.068, 0.052);
      transform.updateMatrix();
      seeds.current?.setMatrixAt(index, transform.matrix);
    });
    seeds.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group>
      <mesh geometry={faceGeometry} position={[0, 0, 0.006]}>
        <meshBasicMaterial color={fleshColor} side={2} toneMapped={false} />
      </mesh>
      <mesh geometry={cavityGeometry} position={[0, 0, 0.014]}>
        <meshBasicMaterial color={cavityColor} toneMapped={false} />
      </mesh>
      <instancedMesh ref={seeds} args={[seedGeometry, seedMaterial, papayaSeedPositions.length]} />
    </group>
  );
}

function readStudioLight(token: string) {
  const colorValue = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const values = colorValue.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (!values) return new Color();

  const lightness = Number(values[1]);
  const chroma = Number(values[2]);
  const hue = (Number(values[3]) * Math.PI) / 180;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  const red = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const green = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const blue = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);

  return new Color().setRGB(red, green, blue, SRGBColorSpace);
}

function PapayaModel({
  cutaway,
  fleshColor,
  cavityColor,
  seedColor,
  onReady,
}: {
  cutaway: boolean;
  fleshColor: Color;
  cavityColor: Color;
  seedColor: Color;
  onReady: () => void;
}) {
  const { scene } = useGLTF(modelPath, dracoPath);
  const { size } = useThree();
  const model = useMemo(() => {
    const copy = scene.clone(true);
    const clippingPlane = new Plane(new Vector3(0, 0, -1), 0);
    copy.traverse((item) => {
      if (item instanceof Mesh) {
        item.castShadow = true;
        item.receiveShadow = true;

        const materials = Array.isArray(item.material)
          ? item.material.map((material) => material.clone())
          : item.material.clone();
        const clonedMaterials = Array.isArray(materials) ? materials : [materials];
        clonedMaterials.forEach((material) => {
          material.clippingPlanes = cutaway ? [clippingPlane] : [];
          material.needsUpdate = true;
        });
        item.material = materials;
      }
    });
    return copy;
  }, [cutaway, scene]);
  const bounds = useMemo(() => new Box3().setFromObject(model), [model]);
  const center = useMemo(() => bounds.getCenter(new Vector3()), [bounds]);
  const dimensions = useMemo(() => bounds.getSize(new Vector3()), [bounds]);
  const scale = 3 / Math.max(dimensions.x, dimensions.y, dimensions.z);
  const group = useRef<Group>(null);
  const hasDrawn = useRef(false);

  useLayoutEffect(() => {
    hasDrawn.current = false;
  }, [cutaway]);

  useLayoutEffect(() => {
    if (!group.current) return;
    group.current.rotation.z = size.width / Math.max(1, size.height) < 0.9 ? Math.PI / 2 - 0.13 : 0.13;
  }, [size.height, size.width]);

  useFrame(() => {
    if (!hasDrawn.current) {
      hasDrawn.current = true;
      onReady();
    }
  });

  return (
    <group ref={group} rotation={[0, 0, 0.13]}>
      <group scale={scale} position={[-center.x * scale, -center.y * scale, -center.z * scale]}>
        <primitive object={model} />
        {cutaway ? (
          <PapayaCutaway fleshColor={fleshColor} cavityColor={cavityColor} seedColor={seedColor} />
        ) : null}
      </group>
    </group>
  );
}

function ResponsiveFraming() {
  const { camera, size } = useThree();

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const aspect = size.width / Math.max(1, size.height);
    const width = 3.45;
    const distance = width / (2 * Math.tan((camera.fov * Math.PI) / 360) * aspect);
    camera.position.set(0, 0.08, Math.max(6, distance));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.height, size.width]);

  return null;
}

export default function PapayaScene({ warmLight, cutaway, onReady }: PapayaSceneProps) {
  const [keyColor, setKeyColor] = useState<Color>(() => new Color());
  const [fillColor, setFillColor] = useState<Color>(() => new Color());
  const [bounceColor, setBounceColor] = useState<Color>(() => new Color());
  const [shadowColor, setShadowColor] = useState<Color>(() => new Color());
  const [fleshColor, setFleshColor] = useState<Color>(() => new Color());
  const [cavityColor, setCavityColor] = useState<Color>(() => new Color());
  const [seedColor, setSeedColor] = useState<Color>(() => new Color());
  const handleReady = useCallback(() => onReady(), [onReady]);

  useEffect(() => {
    setKeyColor(readStudioLight(warmLight ? "--papaya-key-light" : "--papaya-daylight"));
    setFillColor(readStudioLight("--papaya-fill-light"));
    setBounceColor(readStudioLight("--papaya-bounce-light"));
    setShadowColor(readStudioLight("--papaya-shadow"));
    setFleshColor(readStudioLight("--papaya-flesh"));
    setCavityColor(readStudioLight("--papaya-cavity"));
    setSeedColor(readStudioLight("--papaya-seed"));
  }, [warmLight]);

  return (
    <div
      className="papaya-scene"
      aria-label={`Interactive 3D ${cutaway ? "papaya cutaway" : "whole papaya"}. Drag to rotate and use pinch or scroll to zoom.`}
    >
      <Canvas
        aria-hidden="true"
        camera={{ position: [0, 0.08, 6], fov: 37 }}
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.localClippingEnabled = true;
        }}
      >
        <ResponsiveFraming />
        <ambientLight intensity={0.7} />
        <hemisphereLight args={[keyColor, fillColor, 0.75]} />
        <directionalLight
          color={keyColor}
          position={[-3.5, 5, 4]}
          intensity={warmLight ? 2.2 : 1.85}
        />
        <directionalLight color={bounceColor} position={[4, 0.5, -3]} intensity={0.8} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.83, 0]} scale={[1.05, 0.36, 1]}>
          <circleGeometry args={[1, 48]} />
          <meshBasicMaterial color={shadowColor} transparent opacity={0.23} depthWrite={false} />
        </mesh>
        <PapayaModel
          cutaway={cutaway}
          fleshColor={fleshColor}
          cavityColor={cavityColor}
          seedColor={seedColor}
          onReady={handleReady}
        />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.075}
          enablePan={false}
          minDistance={4.2}
          maxDistance={9.5}
          minPolarAngle={Math.PI * 0.2}
          maxPolarAngle={Math.PI * 0.8}
          rotateSpeed={0.72}
        />
      </Canvas>
    </div>
  );
}