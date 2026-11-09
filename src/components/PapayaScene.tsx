import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box3, Color, Group, PerspectiveCamera, SRGBColorSpace, Vector3 } from "three";

const modelPath = `${import.meta.env.BASE_URL}models/papaya.glb`;
const dracoPath = `${import.meta.env.BASE_URL}site-assets/libs/draco/`;

useGLTF.setDecoderPath(dracoPath);
useGLTF.preload(modelPath, dracoPath);

interface PapayaSceneProps {
  warmLight: boolean;
  onReady: () => void;
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

function PapayaModel({ onReady }: { onReady: () => void }) {
  const { scene } = useGLTF(modelPath, dracoPath);
  const { size } = useThree();
  const model = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((item) => {
      if ("isMesh" in item && item.isMesh) {
        item.castShadow = true;
        item.receiveShadow = true;
      }
    });
    return copy;
  }, [scene]);
  const bounds = useMemo(() => new Box3().setFromObject(model), [model]);
  const center = useMemo(() => bounds.getCenter(new Vector3()), [bounds]);
  const dimensions = useMemo(() => bounds.getSize(new Vector3()), [bounds]);
  const scale = 3 / Math.max(dimensions.x, dimensions.y, dimensions.z);
  const group = useRef<Group>(null);
  const hasDrawn = useRef(false);

  useLayoutEffect(() => {
    if (!group.current) return;
    group.current.rotation.z = size.width / Math.max(1, size.height) < 0.78 ? Math.PI / 2 - 0.13 : 0.13;
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

export default function PapayaScene({ warmLight, onReady }: PapayaSceneProps) {
  const [keyColor, setKeyColor] = useState<Color>(() => new Color());
  const [fillColor, setFillColor] = useState<Color>(() => new Color());
  const [bounceColor, setBounceColor] = useState<Color>(() => new Color());
  const [shadowColor, setShadowColor] = useState<Color>(() => new Color());
  const handleReady = useCallback(() => onReady(), [onReady]);

  useEffect(() => {
    setKeyColor(readStudioLight(warmLight ? "--papaya-key-light" : "--papaya-daylight"));
    setFillColor(readStudioLight("--papaya-fill-light"));
    setBounceColor(readStudioLight("--papaya-bounce-light"));
    setShadowColor(readStudioLight("--papaya-shadow"));
  }, [warmLight]);

  return (
    <div className="papaya-scene" aria-label="Interactive 3D papaya. Drag to rotate and use pinch or scroll to zoom.">
      <Canvas
        aria-hidden="true"
        camera={{ position: [0, 0.08, 6], fov: 37 }}
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
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
        <PapayaModel onReady={handleReady} />
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