import { useEffect, useRef, useState } from "react";
import { UploadOutlined } from "@ant-design/icons";
import { Upload, InputNumber, Button } from "antd";
import { createGif, getVideoTrack, highAccuracyTimer, video2Img } from "./util";
import { flushSync } from "react-dom";
import prayGif from "/src/assets/pray.gif";

const { Dragger } = Upload;

function App() {
  const [videoUrl, setVideoUrl] = useState("");
  const [gifUrl, setGifUrl] = useState("");
  const [frameNumber, setFrameNumber] = useState(15);
  const [workers, setWorkers] = useState(8);
  const [quality, setQuality] = useState(0.1);
  const [imgSize, setImgSize] = useState(1);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cancelFn = useRef<() => void>();
  const frames = useRef<
    (
      | CanvasRenderingContext2D
      | CanvasImageSource
      | WebGLRenderingContext
      | ImageData
    )[]
  >([]);
  const playSpeed = 2;

  const initVideoData = async (file: File) => {
    setGifUrl("");
    const tarck = await getVideoTrack(file);
    const { movie_duration, movie_timescale, nb_samples } = tarck;
    const frame = ~~(nb_samples / (movie_duration / movie_timescale));
    setFrameNumber(Math.max(15, frame));
  };

  const startRecording = () => {
    setLoading(true);

    const video = videoRef.current as HTMLVideoElement;
    // 采用的录制方案必须等待视频播放完毕 ∑(ﾟДﾟノ)ノ
    video.playbackRate = playSpeed;
    video.volume = 0;
    video.play();

    const { start, cancel } = highAccuracyTimer({
      callback() {
        const img = video2Img({
          video: videoRef.current!,
          width: videoRef.current!.videoWidth * imgSize,
          height: videoRef.current!.videoHeight * imgSize,
          quality,
        });
        frames.current.push(img);
      },
      time: ~~(1000 / frameNumber / playSpeed),
    });

    start();
    cancelFn.current = cancel;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden p-10">
      <header className="flex items-center mb-5">
        <Dragger
          className="block w-[30%]"
          accept="video/*"
          showUploadList={false}
          customRequest={({ file }) => {
            URL.revokeObjectURL(videoUrl);
            const playUrl = URL.createObjectURL(file as File);
            flushSync(() => {
              setVideoUrl(playUrl);
            });

            initVideoData(file as File);
          }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">
            Click or drag file to this area to upload
          </p>
        </Dragger>
        <div className="flex flex-col mx-10">
          <InputNumber
            value={frameNumber}
            className="w-115px"
            min={15}
            max={120}
            addonAfter="FPS"
            onChange={(e) => setFrameNumber(e || 1)}
          />
          <InputNumber
            value={workers}
            className="w-115px"
            min={1}
            max={120}
            addonAfter="线程"
            onChange={(e) => setWorkers(e || 1)}
          />
          <InputNumber
            value={quality}
            className="w-140px"
            min={0.1}
            max={1}
            step={0.1}
            addonAfter="图片质量"
            onChange={(e) => setQuality(e || 0.1)}
          />
          <InputNumber
            value={imgSize}
            className="w-140px"
            min={0.1}
            max={1}
            step={0.1}
            addonAfter="图片尺寸"
            onChange={(e) => setImgSize(e || 1)}
          />
        </div>

        <Button type="primary" onClick={startRecording}>
          开始录制
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            onEnded={async () => {
              cancelFn.current!();
              const gifUrl = await createGif({
                frames: frames.current,
                delay: ~~(1000 / frameNumber),
                quality,
                workers,
              });
              frames.current.length = 0;
              setGifUrl(gifUrl);
              setLoading(false);
            }}
          ></video>
        )}

        {gifUrl && <img src={gifUrl} />}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center fixed left-0 top-0 w-full h-full bg-black bg-opacity-80 backdrop-filter backdrop-blur text-white">
          <img src={prayGif} />
          <p className="my-2">少女祈祷中...</p>
          <p className="">你可能想要进度条，但很遗憾并没有</p>
        </div>
      )}
    </div>
  );
}

export default App;
