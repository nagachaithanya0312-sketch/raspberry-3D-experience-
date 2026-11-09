import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box3, Color, Group, Vector3 } from "three";

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
  const context = document.createElement("canvas").getContext("2d");
  if (!context || !colorValue) return new Color("#ffffff");
  context.fillStyle = colorValue;
  return new Color(context.fillStyle);
}

function PapayaModel({ onReady }: { onReady: () => void }) {
  const { scene } = useGLTF(modelPath, dracoPath);
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
  const scale = 3.65 / Math.max(dimensions.x, dimensions.y, dimensions.z);
  const group = useRef<Group>(null);
  const hasDrawn = useRef(false);

  useFrame(() => {
    if (!hasDrawn.current) {
      hasDrawn.current = true;
      onReady();
    }
  });

  return (
    <group ref={group} rotation={[0, 0, Math.PI / 2 - 0.13]}>
      <group scale={scale} position={[-center.x * scale, -center.y * scale, -center.z * scale]}>
        <primitive object={model} />
      </group>
    </group>
  );
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
        shadows
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <ambientLight intensity={1.25} />
        <hemisphereLight args={[keyColor, fillColor, 1.45]} />
        <directionalLight
          color={keyColor}
          position={[-3.5, 5, 4]}
          intensity={warmLight ? 3.1 : 2.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
          shadow-bias={-0.0002}
        />
        <directionalLight color={bounceColor} position={[4, 0.5, -3]} intensity={1.1} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <shadowMaterial color={shadowColor} transparent opacity={0.19} />
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