// app/data/contents.ts

// 1. SNS Links
export const SOCIAL_LINKS = [
  { name: "YouTube", url: "https://www.youtube.com/@popKpia", icon: "youtube" },
  { name: "X", url: "https://x.com/takt_min", icon: "twitter" },
  { name: "SoundCloud", url: "https://soundcloud.com/user-376655816", icon: "soundcloud" },
  { name: "Instagram", url: "https://www.instagram.com/popkpia/", icon: "instagram" },
  { name: "Niconico", url: "https://www.nicovideo.jp/user/141136171", icon: "video" },
  { name: "TikTok", url: "https://www.tiktok.com/@popkpia", icon: "tiktok" },
  { name: "Contact", url: "mailto:Kpia0222@gmail.com", icon: "mail" },
];

// 2. Live Information
export const LIVE_EVENTS = [
  {
    id: "20250126",
    title: "（イベント名があればここに）",
    date: "2025/1/26",
    time: "OPEN 17:30 / START 18:00",
    place: "函館ARARA",
    price: "ADV ¥2,000 / DOOR ¥2,500",
    image: "/images/live/20250126_arara.jpg", // 画像パス
    status: "upcoming", // upcoming | finished
  },
  {
    id: "202502xx",
    title: "DJ Event (Feb)",
    date: "2025/02/xx",
    status: "planning", // 情報公開待ち
  },
  {
    id: "202503xx",
    title: "DJ Event (Mar)",
    date: "2025/03/xx",
    status: "planning",
  }
];

// 3. Release Information
export const RELEASES = [
  {
    id: "27dot",
    title: "27dot",
    type: "Album",
    date: "2025/1/26 Release",
    image: "/images/release/27dot_kv.jpg", // 仮
    description: "詳細、ティザーPV、キービジュアル順次公開",
    links: [],
  }
];