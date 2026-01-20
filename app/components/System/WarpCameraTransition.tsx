"use client";

/**
 * =====================================================================
 * WarpCameraTransition - ワープカメラトランジション
 * =====================================================================
 *
 * 宇宙間ワープ時のシネマティックなカメラアニメーション
 *
 * 動作:
 * 1. FOVが 50 → 120 へ拡大（加速感）
 * 2. カメラが目標位置へ移動
 * 3. FOVが 120 → 60 へ縮小（減速感）
 *
 * アニメーション特性:
 * - 継続時間: 2秒
 * - イージング: ease-in-out cubic
 * - 完了時にonCompleteコールバックを実行
 */

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * コンポーネントのプロパティ
 */
interface WarpCameraTransitionProps {
  isWarping: boolean;                   // ワープ中かどうか
  targetPosition: THREE.Vector3 | null; // 目標位置
  onComplete: () => void;                // 完了時のコールバック
}

/**
 * ワープカメラトランジションコンポーネント
 */
export default function WarpCameraTransition({
  isWarping,
  targetPosition,
  onComplete,
}: WarpCameraTransitionProps) {
  const { camera } = useThree();

  // アニメーション状態
  const initialFov = useRef(50);                          // 開始時のFOV
  const initialPosition = useRef(new THREE.Vector3());    // 開始位置
  const progress = useRef(0);                             // 進行度 (0.0 - 1.0)
  const hasCompleted = useRef(false);                     // 完了フラグ

  // ワープ開始時の初期化
  useEffect(() => {
    if (isWarping && targetPosition) {
      initialFov.current = (camera as THREE.PerspectiveCamera).fov;
      initialPosition.current.copy(camera.position);
      progress.current = 0;
      hasCompleted.current = false;
    }
  }, [isWarping, targetPosition, camera]);

  // 毎フレームのアニメーション更新
  useFrame((state, delta) => {
    if (!isWarping || !targetPosition || hasCompleted.current) return;

    const perspCamera = camera as THREE.PerspectiveCamera;

    // 進行度を更新（2秒で完了）
    progress.current += delta * 0.5;

    // アニメーション完了チェック
    if (progress.current >= 1.0) {
      progress.current = 1.0;
      hasCompleted.current = true;

      // FOVをリセット
      perspCamera.fov = 60;
      perspCamera.updateProjectionMatrix();

      onComplete();
      return;
    }

    // イージング関数: ease-in-out cubic
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const t = easeInOutCubic(progress.current);

    // FOVアニメーション（50 → 120 → 60）
    const fovPeak = 120;
    let fov: number;
    if (t < 0.5) {
      // 前半: 拡大（50 → 120）
      fov = THREE.MathUtils.lerp(initialFov.current, fovPeak, t * 2);
    } else {
      // 後半: 縮小（120 → 60）
      fov = THREE.MathUtils.lerp(fovPeak, 60, (t - 0.5) * 2);
    }
    perspCamera.fov = fov;
    perspCamera.updateProjectionMatrix();

    // カメラ位置アニメーション（目標位置へ突進）
    camera.position.lerpVectors(initialPosition.current, targetPosition, t);
  });

  return null;
}
