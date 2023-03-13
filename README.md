## 使用注意

该工具**性能差、极其差、相当差**，请不要用于录制非表情包视频，因为无法控制体积  
想要缩小文件体积请直接调节 FPS 和尺寸参数

## 为什么要做这么蛋疼的事情

我想很多人看到标题就已经不屑一顾，为什么要把视频转成图片，并且还选了 gif 这么一个古老的格式  
那么就容我先解释下前因后果

### 现代网站更喜欢用视频取代动图

gif 这个格式过于老旧，支持的色彩数少、文件体积大、不支持 alpha 通道  
相比之下视频格式就完胜，并且还有多种编码方式可选  
可能有人会提到 webp 等更高级的图片格式，但实际上它们在播放动画这一功能上还是弱于视频  
动态 WebP 的原理与 GIF 和 APNG 原理类似，每一帧记录变化区域的坐标、长宽、播放延时等用于还原并播放  
但是视频压缩还存在 I 帧、P 帧和 B 帧等杀器，相比之下文件体积可以更小

### Webp 的兼容性较差

对的你没看错，兼容性差  
尽管在浏览器上你到处都看得到 webp 但它在其他地方仍然是一个兼容性很差的东西

- windows 图片查看器并不能查看
- 国内的各种网站以及社交工具并不认为 webp 是图片而是文件，也就是需要作为附件才能分享给他人，但是附件上传通常只开放给高级用户的

### 视频相较于图片拥有更强的监管措施

这一点不知道该不该说，图片天生就容于分享~~截屏、翻转、打码~~等等各种逃避方案  
但是视频就很惨，通常会验证一次 md5 如果不符合监管措施就会被 ban 掉

由于以上原因所以我选择了将视频转换为 gif 格式 ~~以便于我把色图分享给朋友~~

## 如何做到

在书写本文时还没有正式开始写代码(新建文件夹)，仅仅有一些思路  
事实上已经存在很多工具可以做到这件事,它们都会借助 FFmpeg 来完成  
也有很多网站提供类似服务，但毫无疑问都是收费的，因为他们采用的方案是用一个服务器去跑 FFmpeg

尽管 FFmpeg 在 web 上可以通过 wasm 引用,，但我认为它过于笨重了，我希望只使用 JS 和浏览器提供的 API 来完成该工具  
但我并不知道一开始需要做什么，那么就从结果开始反推吧

### 如何通过 js 生成 gif

这里就利用[gif.js](https://github.com/jnordberg/gif.js)

```js
var gif = new GIF({
  workers: 2,
  quality: 10,
});

// add an image element
gif.addFrame(imageElement);

// or a canvas element
gif.addFrame(canvasElement, { delay: 200 });

// or copy the pixels from a canvas context
gif.addFrame(ctx, { copy: true });

gif.on("finished", function (blob) {
  window.open(URL.createObjectURL(blob));
});

gif.render();
```

示例代码很简洁，我仅仅需要提供一些 image 以及 gif 相关参数即可

### 如何从视频中拿到每一帧

起初我觉得浏览器大概会为 video 元素提供某种 API，比如切换每一帧的事件  
比较贴近我这个需求的是[durationchange 事件](https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLMediaElement/timeupdate_event)，但是经过测试它的执行次数为每秒 4 次  
完全不符合需求(⊙﹏⊙)....只能想其他方案了

1. 通过 requestAnimationFrame 去抓当前播放的画面
2. ~~解析视频文件直接拿到每一帧数据~~

方案 1 看上去挺简单的，也不需要考虑视频格式只要 video 里能放出来就行，但是需要知道视频的元数据也就是帧数和帧率  
方案 2 就相当麻烦了，要把视频文件给解包拿到其中的视频内容才行，但我并没有接触过相关知识直接放弃

### 获取视频元数据

因为采用了 requestAnimationFrame 对画面进行录制就需要知道视频播放帧率，也就是我需要知道每秒要采集多少次画面  
查阅了相关文章后发现了一个工具[mp4box](https://github.com/gpac/mp4box.js),因为有 js 版本所以直接拿来用  
浏览器其实提供了[相关 API](https://developer.mozilla.org/en-US/docs/Web/API/VideoTrack)，但是这个兼容性压根没法用就是了

```json
{
  // 时长
  "movie_duration": 2280,
  // 帧数
  "nb_samples": 48,
  // 分辨率
  "video": { "width": 1920, "height": 1080 }
}
```

拿到这些基本参数就可以开始录制了

> [Web 视频播放的那些事儿](https://zhuanlan.zhihu.com/p/126673473)  
> [使用 JS 获取视频 Codec](https://zhuanlan.zhihu.com/p/73126513?utm_id=0)

### 怎么录

代码都给你了还要怎么样
