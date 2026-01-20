import * as THREE from 'three';

// =====================================================================
// 型定義
// =====================================================================

/**
 * エンティティの種類
 * - star: 星（楽曲）
 * - planet: 惑星（楽曲のバリエーション）
 * - satellite: 衛星（さらなるバリエーション）
 * - relic: 遺物（特殊なオブジェクト）
 * - meteor: 流星（一時的なオブジェクト）
 */
export type EntityType = 'star' | 'planet' | 'satellite' | 'relic' | 'meteor';

/**
 * エンティティデータ
 * 天体オブジェクトの全ての情報を保持
 */
export interface EntityData {
    // 基本情報
    id: string;                             // 一意なID
    type: EntityType;                       // エンティティの種類
    label: string;                          // 表示名
    color: string;                          // 色（HEX形式）

    // 物理的特性
    size: number;                           // サイズ
    distance: number;                       // 中心からの距離
    speed: number;                          // 公転速度
    inclination: [number, number, number];  // 軌道傾斜角
    phase: number;                          // 初期位相

    // 階層構造
    children?: EntityData[];                // 子エンティティ（惑星、衛星）
    parent?: string;                        // 親エンティティのID

    // 音楽的特性
    centDeviation?: number;                 // 12平均律からの偏差（セント単位: -50 to +50）
    youtubeId?: string;                     // YouTube動画ID
    category?: string;                      // カテゴリー

    // メタデータ
    clicks?: number;                        // クリック数
    erosion?: number;                       // 侵食度（0.0 - 1.0）
    isForeign?: boolean;                    // 異星由来かどうか
    bio?: string;                           // 説明文
    lyrics?: string;                        // 歌詞
    qualia?: string;                        // クオリア（感覚的特性）
    universeId?: number;                    // 所属する宇宙のID
}

/**
 * 宇宙データ
 * 各マルチバースの情報
 */
export interface UniverseData {
    id: number;                             // 宇宙ID
    name: string;                           // 宇宙名
    type: "Canon" | "Xen" | "Lab" | "Unformed";  // 宇宙の種類
    pos: [number, number, number];          // 3D空間での位置
    color: string;                          // テーマカラー
    isMicrotonal: boolean;                  // 微分音宇宙かどうか
    erosion: number;                        // 侵食度
    tendency: number;                       // 傾向（秩序←→混沌）
    starCount: number;                      // 星の数
}

/**
 * カメラスロット
 * プリセットされたカメラ位置
 */
export interface CameraSlot {
    pos: THREE.Vector3;                     // カメラ位置
    target: THREE.Vector3;                  // 注視点
    label: string;                          // スロット名
}
