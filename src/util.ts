import MP4Box from "mp4box";
import GIF from "gif.js";

export const getVideoTrack = (file: File): Promise<Videotrack> => {
  return new Promise(async (res, rej) => {
    var mp4boxfile = MP4Box.createFile();
    mp4boxfile.onReady = function (info: any) {
      const videoTrack = info.videoTracks[0];
      res(videoTrack);
    };
    const buffer: any = await file.arrayBuffer();
    buffer.fileStart = 0;
    mp4boxfile.appendBuffer(buffer);
  });
};

export const highAccuracyTimer = ({
  callback,
  time = 0,
}: {
  callback: () => void;
  time?: number;
  maximum?: number;
}) => {
  let rafId: number = -1;
  let n = 0;
  const f = (timestamp: number) => {
    console.log(n, timestamp);
    if (timestamp - n >= time) {
      callback();
      n = timestamp;
    }

    rafId = requestAnimationFrame(f);
  };

  return {
    start() {
      n = performance.now();
      console.log(n);
      rafId = requestAnimationFrame(f);
    },

    cancel() {
      cancelAnimationFrame(rafId);
    },
  };
};

export const video2Img = ({
  video,
  width,
  height,
  quality,
}: {
  video: HTMLVideoElement;
  width: number;
  height: number;
  quality: number;
}) => {
  const canvasEl = document.createElement("canvas");
  canvasEl.width = width;
  canvasEl.height = height;
  const context = canvasEl.getContext("2d");
  context!.drawImage(video, 0, 0, width, height);
  const dataURL = canvasEl.toDataURL("image/png", quality);
  const img = new Image();
  img.src = dataURL;
  return img;
};

export const createGif = ({
  frames,
  quality,
  delay,
  workers,
}: {
  frames: (
    | CanvasRenderingContext2D
    | CanvasImageSource
    | WebGLRenderingContext
    | ImageData
  )[];
  quality: number;
  delay: number;
  workers: number;
}): Promise<string> => {
  return new Promise((res) => {
    var gif = new GIF({
      workers,
      quality,
    });

    for (const item of frames) {
      gif.addFrame(item, {
        delay,
      });
    }

    gif.on("finished", function (blob) {
      res(URL.createObjectURL(blob));
    });

    gif.render();
  });
};
