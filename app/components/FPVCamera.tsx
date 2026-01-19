"use client";

/**
 * =====================================================================
 * FPVCamera - 一人称視点カメラシステム
 * =====================================================================
 *
 * KPIA Portalの主要カメラコントローラー
 *
 * 機能:
 * - FPS風の自由移動（WASD + Space/Shift）
 * - マウスによる視点回転（PointerLock使用）
 * - 慣性とダンピングによる滑らかな動き
 * - エンティティフォーカス時の自動カメラ移動
 * - カメラスロットへのスムーズな遷移
 * - 画面中央のレイキャストによるエンティティ検出
 *
 * キー操作:
 * - W/A/S/D: 前後左右移動
 * - Space: 上昇
 * - Shift: 下降
 * - マウス: 視点回転（クリックでPointerLock）
 *
 * パフォーマンス:
 * - 移動速度: 10 units/秒（非常に精密な制御）
 * - ダンピング: 0.92（滑らかな減速）
 */

import React, { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";

/**
 * コンポーネントのプロパティ
 */
interface FPVCameraProps {
  focusId: string | null;                  // フォーカス中のエンティティID
  mode: string;                            // 現在のモード（UNIVERSE, STAR, PLANET等）
  activeCamSlot: number | null;            // アクティブなカメラスロット番号
  cameraSlots: Array<{                     // カメラスロット配列
    pos: THREE.Vector3;
    target: THREE.Vector3;
    label: string;
  }>;
  onManualMove: () => void;                // 手動移動時のコールバック
  isSearchFocused?: boolean;               // 検索窓がフォーカスされているか
  onCameraUpdate?: (pos: { x: number; y: number; z: number }) => void; // カメラ位置更新コールバック
  onTargetEntity?: (entityId: string | null) => void; // 画面中央のエンティティ検出コールバック
  refMap: React.RefObject<Map<string, THREE.Object3D>>; // エンティティの3Dオブジェクト参照マップ
}

/**
 * 外部から呼び出し可能なハンドル
 */
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
    const { camera, gl, raycaster } = useThree();
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
    useFrame((_state, delta) => {
      // Tuned for comfortable space exploration
      const speed = 10 * delta; // Further reduced for very controlled movement
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
          camera={camera}
          domElement={gl.domElement}
          makeDefault
          pointerSpeed={0.5}
        />
      </>
    );
  }
);

FPVCamera.displayName = "FPVCamera";

export default FPVCamera;
