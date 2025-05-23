import React, { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { TextureLoader } from 'three/src/loaders/TextureLoader';

export default function Baguette(props) {
  const { nodes, materials } = useGLTF('/BaguetteBois3.gltf');

  // Clone the original geometry to prevent modifications to the original
  const geometry = nodes.Baguette.geometry.clone();

  // Ensure the bounding box is calculated
  geometry.computeBoundingBox();

  // Get the size of the bounding box
  const size = new THREE.Vector3();
  geometry.boundingBox.getSize(size);
// Load the wood texture

// Load the wood texture
const textureLoader = new TextureLoader();
const woodTexture = textureLoader.load('/wood_texture_yellow.jpg');

const woodMaterial = new THREE.MeshStandardMaterial({
  map: woodTexture,                // la texture bois
  color: new THREE.Color(props.frameColor || '#ffffff'), // couleur par dessus la texture
  roughness: 0.8,                  // un peu rugueux pour capter lumière
  metalness: 0.1,                  // pas trop métallique
  flatShading: true,
});



  // LONGUEUR BAGUETTE
  useEffect(() => {
    // Access the vertices and move them based on the input range
    const vertices = geometry.attributes.position.array;

    for (let i = 0; i < vertices.length / 2; i += 3) {
      vertices[i] = vertices[i] + (props.LongueurBaguette - size.x) / 2; // Update X coordinate
    }
    for (let i = vertices.length / 2; i < vertices.length; i += 3) {
      vertices[i] = vertices[i] - (props.LongueurBaguette - size.x) / 2; // Update X coordinate
    }

    // Notify three.js that the geometry has been updated
    geometry.attributes.position.needsUpdate = true;

    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }, [props.LongueurBaguette, geometry.attributes.position, size.x]);

  // LARGEUR BAGUETTE
  useEffect(() => {
    const vertices = geometry.attributes.position.array;

    // Adjust position for specific points
    const indicesToAdjust = [23, 24, 25, 26, 36, 37, 38, 30, 31, 32];
    const angle = 45; // Angle en degrés
    const angleInRadians = THREE.MathUtils.degToRad(angle);
    const widthAdjustment = props.BaguetteWidth - 2;

    for (const index of indicesToAdjust) {
      const baseIndex = index * 3;
      const x = vertices[baseIndex];
      const y = vertices[baseIndex + 1];
      const z = vertices[baseIndex + 2];

      // Déplacement en fonction de l'angle et de l'épaisseur de la feuillure
      const newX = x - Math.cos(angleInRadians) * widthAdjustment;
      const newZ = z - Math.sin(angleInRadians) * widthAdjustment;

      vertices[baseIndex] = newX;
      vertices[baseIndex + 2] = newZ;
    }

    // Adjust position for specific points
    const indicesToAdjust2 = [0, 1, 2, 13, 14, 15, 16, 6, 7, 8];

    for (const index of indicesToAdjust2) {
      const baseIndex = index * 3;
      const x = vertices[baseIndex];
      const y = vertices[baseIndex + 1];
      const z = vertices[baseIndex + 2];

      // Déplacement en fonction de l'angle et de l'épaisseur de la feuillure
      const newZ = z - Math.sin(angleInRadians) * widthAdjustment;
      const newX = x + Math.cos(angleInRadians) * widthAdjustment;

      vertices[baseIndex] = newX;
      vertices[baseIndex + 2] = newZ;
    }

    // Notify three.js that the geometry has been updated
    geometry.attributes.position.needsUpdate = true;
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }, [props.BaguetteWidth, geometry.attributes.position]);

  // HAUTEUR BAGUETTE
  useEffect(() => {
    const vertices = geometry.attributes.position.array;

    // Adjust height for specific points
    const indicesToAdjust = [3, 4, 5, 6, 7, 8, 27, 28, 29, 30, 31, 32];
    const heightAdjustment = props.BaguetteHeight - 2;

    for (const index of indicesToAdjust) {
      const baseIndex = index * 3;
      vertices[baseIndex + 1] = vertices[baseIndex + 1] + heightAdjustment;
    }

    // Notify three.js that the geometry has been updated
    geometry.attributes.position.needsUpdate = true;
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    
  }, [props.BaguetteHeight, geometry.attributes.position]);

  // LARGEUR FEUILLURE
  useEffect(() => {
    const vertices = geometry.attributes.position.array;

    // Adjust position for specific points
    const indicesToAdjust = [9, 10, 11, 12, 20, 21, 22];

    const angle = 45; // Angle en degrés
    const angleInRadians = THREE.MathUtils.degToRad(angle);
    const largeurFeuillure = props.RabateWidth - 1;

    for (const index of indicesToAdjust) {
      const baseIndex = index * 3;
      const x = vertices[baseIndex];
      const y = vertices[baseIndex + 1];
      const z = vertices[baseIndex + 2];

      // Déplacement en fonction de l'angle et de l'épaisseur de la feuillure
      const newX = x + Math.cos(angleInRadians) * largeurFeuillure;
      const newZ = z - Math.sin(angleInRadians) * largeurFeuillure;

      vertices[baseIndex] = newX;
      vertices[baseIndex + 2] = newZ;
    }

    // Adjust position for specific points
    const indicesToAdjust2 = [33, 34, 35, 42, 43, 44, 45];

    for (const index of indicesToAdjust2) {
      const baseIndex = index * 3;
      const x = vertices[baseIndex];
      const y = vertices[baseIndex + 1];
      const z = vertices[baseIndex + 2];

      // Déplacement en fonction de l'angle et de l'épaisseur de la feuillure
      const newX = x - Math.cos(angleInRadians) * largeurFeuillure;
      const newZ = z - Math.sin(angleInRadians) * largeurFeuillure;

      vertices[baseIndex] = newX;
      vertices[baseIndex + 2] = newZ;
    }

    // Notify three.js that the geometry has been updated
    geometry.attributes.position.needsUpdate = true;
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

  }, [props.RabateWidth, geometry.attributes.position]);

  // HAUTEUR FEUILLURE
  useEffect(() => {
    const vertices = geometry.attributes.position.array;

    // Adjust height for specific points
    const indicesToAdjust = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 36, 37, 38, 42, 43, 44, 45, 39, 40, 41];
    const hauteurFeuillure = props.RabateHeight - 1.5;

    for (const index of indicesToAdjust) {
      const baseIndex = index * 3;
      vertices[baseIndex + 1] = vertices[baseIndex + 1] + hauteurFeuillure; // Update Y coordinate
    }

    // Notify three.js that the geometry has been updated
    geometry.attributes.position.needsUpdate = true;
    
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }, [props.RabateHeight, geometry.attributes.position]);

  return (
    <group {...props} dispose={null}>
     <mesh
    geometry={geometry}
    material={woodMaterial}
    castShadow
    receiveShadow
  />

    </group>
  );
}

useGLTF.preload('/BaguetteBois3.gltf');
