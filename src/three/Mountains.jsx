/**
 * Mountains — the low forest ridge sitting behind the Flatirons.
 * Two faceted cones; the Flatirons read as bare red rock against them.
 */
export default function Mountains() {
  return (
    <group>
      <mesh position={[-0.5, 2.6, -6.5]} castShadow receiveShadow>
        <coneGeometry args={[6.5, 5.5, 6]} />
        <meshStandardMaterial color="#3f7d52" flatShading roughness={0.9} />
      </mesh>
      <mesh position={[6, 1.9, -6]} castShadow receiveShadow>
        <coneGeometry args={[4.5, 4, 6]} />
        <meshStandardMaterial color="#4f9a64" flatShading roughness={0.9} />
      </mesh>
    </group>
  );
}
