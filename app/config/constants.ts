// =====================================================================
// 定数定義
// =====================================================================

/**
 * プロジェクトの哲学的な問いかけ
 * DNAモード時に表示される
 */
export const QUESTIONS = [
    "もし、音響物理が最初から微分音だったら？",
    "自ら設計したエイリアンに侵食されることは、進化か？",
    "禁忌の暴走は、世界の真実が露呈した瞬間か？",
    "秩序あるノイズは、崩壊の予兆か、新しい美学か？",
    "『でかいポップ』は、平均律の呪縛を飲み込めるか？"
];

/**
 * ソーシャルメディアリンク
 * UIに表示されるアーティストのSNSアカウント
 */
export const SOCIAL_LINKS = [
    { name: "YouTube", url: "https://www.youtube.com/@popKpia", label: "Youtube" },
    { name: "X (Twitter)", url: "https://x.com/takt_min", label: "X(Twitter)" },
    { name: "SoundCloud", url: "https://soundcloud.com/user-376655816", label: "SoundCloud" },
    { name: "Instagram", url: "https://www.instagram.com/popkpia/", label: "Instagram" },
    { name: "Niconico", url: "https://www.nicovideo.jp/user/141136171", label: "NicoNico" },
    { name: "TikTok", url: "https://www.tiktok.com/@popkpia", label: "TikTok" },
    { name: "Contact", url: "mailto:Kpia0222@gmail.com", label: "Contact" },
];

/**
 * ライブイベント情報
 * 今後の予定されているイベント
 */
export const LIVE_EVENTS = [
    { id: "20250126", title: "27dot RELEASE LIVE", date: "2025.01.26", place: "函館ARARA" },
    { id: "202502xx", title: "DJ Event (Feb)", date: "2025.02.xx", place: "TBA" },
    { id: "202503xx", title: "DJ Event (Mar)", date: "2025.03.xx", place: "TBA" },
    { id: "202504xx", title: "DJ Event (Apr)", date: "2025.04.xx", place: "TBA" },
    { id: "202505xx", title: "DJ Event (May)", date: "2025.05.xx", place: "TBA" }
];

/**
 * アーティストプロフィール情報
 */
export const PROFILE_DATA = {
    name: "Kpia",
    ver: "26.2.0 (Reality Distortion System)",
    bio: "整理、ハック、そして逸脱。\n秩序あるノイズを構築する。",
};

export const SAMPLE_LYRICS = `
(Verse 1)
グリッドの上を歩く幽霊たち
12の階段じゃ空へは届かない
調律された嘘を吐き出して
ノイズの海で息継ぎをする

(Chorus)
Bypass the code, rewrite the stars
平均律の檻を溶かして
Alien frequencies in my veins
これはバグじゃない、進化の産声
`;

export const controlsMap = [
    { name: 'forward', keys: ['w', 'W'] },
    { name: 'backward', keys: ['s', 'S'] },
    { name: 'left', keys: ['a', 'A'] },
    { name: 'right', keys: ['d', 'D'] },
    { name: 'up', keys: ['Space'] },
    { name: 'down', keys: ['Shift'] },
    { name: 'slot1', keys: ['1'] },
    { name: 'slot2', keys: ['2'] },
    { name: 'slot3', keys: ['3'] },
    { name: 'multiverse', keys: ['m', 'M'] },
    { name: 'toggleHUD', keys: ['F1'] },
];
