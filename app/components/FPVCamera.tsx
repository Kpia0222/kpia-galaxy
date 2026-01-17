"use client";

import React, { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";

interface FPVCameraProps {
  focusId: string | null;
  mode: string;
  activeCamSlot: number | null;
  cameraSlots: Array<{ pos: THREE.Vector3; target: THREE.Vector3; label: string }>;
  onManualMove: () => void;
  isSearchFocused?: boolean;
  onCameraUpdate?: (pos: { x: number; y: number; z: number }) => void;
  onTargetEntity?: (entityId: string | null) => void;
  refMap: React.RefObject<Map<string, THREE.Object3D>>;
}

export interface FPVCameraHandle {
  getCurrentView: () => { pos: THREE.Vector3; target: THREE.Vector3 };
}

const FPVCamera = forwardRef<FPVCameraHandle, FPVCameraProps>(
  (
    {
      focusId,
      mode,
      activeCamSlot,
      cameraSlots,
      onManualMove,
      isSearchFocused,
      onCameraUpdate,
      onTargetEntity,
      refMap
    },
    ref
  ) => {
    const { camera, gl, raycaster, scene } = useThree();
    const controlsRef = useRef<any>(null);
    const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
    const targetVec = useRef(new THREE.Vector3(0, 0, 0));
    const cameraVec = useRef(new THREE.Vector3(0, 400, 800));
    const isLockedRef = useRef(false);
    const keysPressed = useRef<Set<string>>(new Set());

    // Expose getCurrentView for camera slot saving
    useImperativeHandle(ref, () => ({
      getCurrentView: () => ({
        pos: camera.position.clone(),
        target: targetVec.current.clone()
      })
    }));

    // Keyboard event handlers
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (isSearchFocused) return;
        keysPressed.current.add(e.key.toLowerCase());
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        keysPressed.current.delete(e.key.toLowerCase());
      };

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
      };
    }, [isSearchFocused]);

    // Pointer lock state tracking
    useEffect(() => {
      const handleLockChange = () => {
        isLockedRef.current = document.pointerLockElement === gl.domElement;
      };

      document.addEventListener("pointerlockchange", handleLockChange);
      return () => document.removeEventListener("pointerlockchange", handleLockChange);
    }, [gl.domElement]);

    // Camera slot transitions
    useEffect(() => {
      if (activeCamSlot !== null && cameraSlots[activeCamSlot]) {
        const slot = cameraSlots[activeCamSlot];
        cameraVec.current.copy(slot.pos);
        targetVec.current.copy(slot.target);
      }
    }, [activeCamSlot, cameraSlots]);

    // Focus entity camera movement
    useEffect(() => {
      if (focusId && refMap.current) {
        const targetObj = refMap.current.get(focusId);
        if (targetObj) {
          const pos = new THREE.Vector3();
          targetObj.getWorldPosition(pos);

          // Set target position based on mode
          targetVec.current.copy(pos);

          if (mode === "STAR") {
            cameraVec.current.set(pos.x, pos.y + 30, pos.z + 60);
          } else if (mode === "PLANET") {
            cameraVec.current.set(pos.x, pos.y + 10, pos.z + 20);
          } else if (mode === "SATELLITE") {
            cameraVec.current.set(pos.x, pos.y + 5, pos.z + 10);
          }
        }
      }
    }, [focusId, mode, refMap]);

    // Main update loop
    useFrame((state, delta) => {
      // Tuned for comfortable space exploration
      const speed = 300 * delta; // Increased from 200 for faster movement
      const damping = 0.92; // Slightly increased from 0.9 for smoother deceleration

      // Movement input (only when pointer is locked or keyboard control)
      if (isLockedRef.current || keysPressed.current.size > 0) {
        const front = new THREE.Vector3();
        camera.getWorldDirection(front);
        front.y = 0;
        front.normalize();

        const side = new THREE.Vector3();
        side.crossVectors(front, new THREE.Vector3(0, 1, 0)).normalize();

        const moveDirection = new THREE.Vector3();

        if (keysPressed.current.has("w")) moveDirection.add(front);
        if (keysPressed.current.has("s")) moveDirection.sub(front);
        if (keysPressed.current.has("a")) moveDirection.sub(side);
        if (keysPressed.current.has("d")) moveDirection.add(side);
        if (keysPressed.current.has(" ")) moveDirection.y += 1;
        if (keysPressed.current.has("shift")) moveDirection.y -= 1;

        if (moveDirection.lengthSq() > 0) {
          onManualMove();
          velocityRef.current.add(moveDirection.multiplyScalar(speed));
        }
      }

      // Apply damping (inertia)
      velocityRef.current.multiplyScalar(damping);

      // Apply velocity to camera
      camera.position.add(velocityRef.current);

      // Smooth transition to camera slots or focus targets
      if (!isLockedRef.current && (activeCamSlot !== null || focusId)) {
        camera.position.lerp(cameraVec.current, 0.05);

        // Look at target when not in pointer lock
        if (controlsRef.current && !isLockedRef.current) {
          const direction = new THREE.Vector3().subVectors(targetVec.current, camera.position);
          const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(
            new THREE.Matrix4().lookAt(camera.position, targetVec.current, camera.up)
          );
          camera.quaternion.slerp(targetQuaternion, 0.05);
        }
      }

      // Center raycast for entity detection (when pointer locked)
      if (isLockedRef.current && onTargetEntity) {
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

        // Get all celestial bodies from refMap
        const targets: THREE.Object3D[] = [];
        if (refMap.current) {
          refMap.current.forEach((obj) => targets.push(obj));
        }

        const intersects = raycaster.intersectObjects(targets, true);

        if (intersects.length > 0) {
          // Find the entity ID from refMap
          let foundId: string | null = null;
          refMap.current?.forEach((obj, id) => {
            if (obj === intersects[0].object || obj.children.includes(intersects[0].object)) {
              foundId = id;
            }
          });
          onTargetEntity(foundId);
        } else {
          onTargetEntity(null);
        }
      }

      // Update camera position for UI
      if (onCameraUpdate) {
        onCameraUpdate({
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z
        });
      }
    });

    // Click handler for selection (when pointer locked)
    useEffect(() => {
      const handleClick = () => {
        if (!isLockedRef.current) return;

        // Trigger selection of targeted entity
        // This will be handled by parent component via onTargetEntity callback
      };

      gl.domElement.addEventListener("click", handleClick);
      return () => gl.domElement.removeEventListener("click", handleClick);
    }, [gl.domElement]);

    return (
      <>
        <PointerLockControls
          ref={controlsRef}
          selector="#canvas-wrapper"
          makeDefault
          pointerSpeed={0.5}
        />
      </>
    );
  }
);

FPVCamera.displayName = "FPVCamera";

export default FPVCamera;
