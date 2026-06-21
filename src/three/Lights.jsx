/**
 * Lights — one hemisphere fill + one shadow-casting key light.
 * Colors come from the active sky theme so lighting matches the background.
 */
export default function Lights({ theme }) {
  return (
    <>
      <hemisphereLight args={[theme.hemiSky, theme.hemiGround, 0.5]} />
      <directionalLight
        color={theme.light}
        intensity={1.1}
        position={[-14, 22, 12]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-camera-near={1}
        shadow-camera-far={70}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
      />
    </>
  );
}
