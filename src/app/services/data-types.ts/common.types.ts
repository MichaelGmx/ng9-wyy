// 轮播图
export type Banner = {
  targetId: number;
  url: string;
  imageUrl: string;
};

// 热门
export type HotTag = {
  id: number;
  name: string;
  position: number;
};

// 歌手
export type Singer = {
  id: number;
  name: string;
  picUrl: string;
  albumSize: number;
};

// 歌曲
export type Song = {
  id: number;
  name: string;
  url: string;
  ar: Singer[];  // 歌手列表
  al: { id: number; name: string; picUrl: string };  // 歌曲专辑
  dt: number; // 时长
};

// 播放地址
export type SongUrl = {
  id: number;
  url: string;
};

// 歌单
export type SongSheet = {
  id: number;
  name: string;
  playCount: number;
  picUrl: string;
  tracks: Song[];
};
