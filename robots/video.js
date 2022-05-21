const state = require('./state.js')
const gm = require('gm').subClass({ 'imageMagick': true })
const fs = require('fs')

const spawn = require("child_process").spawn;
const path = require("path");
const rootPath = path.resolve(__dirname, "..");
const videoshow = require("videoshow");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;
let ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);


async function robot() {
	const content = state.load()

	await convertAllImages(content)
	await createAllSentencesImages(content)
	await createYouTubeThumbnail();
	await renderVideo(content);

	state.save(content)

	async function convertAllImages(content) {
		for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
			// for (let imageIndex = 0; imageIndex < content.sentences[sentenceIndex].images.length; imageIndex++) {
			console.dir(content.sentences[sentenceIndex].images, null, { deep: null })
			const inputFile = `./content/${sentenceIndex}-original.png`
			const outputFile = `./content/${sentenceIndex}-converted.png`
			// const inputFile = `./content/${sentenceIndex}-${imageIndex}-original.png`
			// const outputFile = `./content/${sentenceIndex}-${imageIndex}-converted.png`
			if (fs.existsSync(inputFile)) {
				await convertImage(inputFile, outputFile)
			}
			// }
		}
	}

	async function convertImage(inputFile, outputFile) {
		return new Promise((resolve, reject) => {
			const width = 1920
			const height = 1080

			gm()
				.in(inputFile)
				.out('(')
				.out('-clone')
				.out('0')
				.out('-background', 'white')
				.out('-blur', '0x9')
				.out('-resize', `${width}x${height}^`)
				.out(')')
				.out('(')
				.out('-clone')
				.out('0')
				.out('-background', 'white')
				.out('-resize', `${width}x${height}`)
				.out(')')
				.out('-delete', '0')
				.out('-gravity', 'center')
				.out('-compose', 'over')
				.out('-composite')
				.out('-extent', `${width}x${height}`)
				.write(outputFile, (error) => {
					if (error) {
						return reject(error)
					}

					console.log(`> Image converted: ${inputFile}`)
					resolve()
				})
		})
	}

	async function createAllSentencesImages(content) {
		for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
			for (let imageIndex = 0; imageIndex < content.sentences[sentenceIndex].images.length; imageIndex++) {
				await createSentenceImage(sentenceIndex, content.sentences[sentenceIndex].text)
			}
		}
	}
	async function createSentenceImage(sentenceIndex, sentenceText) {
		return new Promise((resolve, reject) => {
			const outputFile = `./content/${sentenceIndex}-sentence.png`

			const templateSettings = {
				0: {
					size: '1920x400',
					gravity: 'center'
				},
				1: {
					size: '1920x1080',
					gravity: 'center'
				},
				2: {
					size: '800x1080',
					gravity: 'west'
				},
				3: {
					size: '1920x400',
					gravity: 'center'
				},
				4: {
					size: '1920x1080',
					gravity: 'center'
				},
				5: {
					size: '800x1080',
					gravity: 'west'
				},
				6: {
					size: '1920x400',
					gravity: 'center'
				}
			}

			gm()
				.out('-size', templateSettings[sentenceIndex].size)
				.out('-gravity', templateSettings[sentenceIndex].gravity)
				.out('-background', 'transparent')
				.out('-fill', 'white')
				.out('-kerning', '-1')
				.out(`caption:${sentenceText}`)
				.write(outputFile, (error) => {
					if(error){
						return reject(error)
					}
				})
				console.log(`> Sentence created: ${outputFile}`)
				resolve()
		})
	}
	async function createYouTubeThumbnail() {
		return new Promise((resolve, reject) => {
			gm()
				.in('./content/0-converted.png')
				.write('./content/youtube-thumbnail.jpg', (error) => {
					if(error){
						return reject(error)
					}
				})
				console.log(`> Creating YouTube thumbnail`)
				resolve()
		})
	}

	async function renderVideoWithNode(content) {
		let images = [];
	
		for (
		  let sentenceIndex = 0;
		  sentenceIndex < content.sentences.length;
		  sentenceIndex++
		) {
		  images.push({
			path: `./content/${sentenceIndex}-converted.png`,
			caption: content.sentences[sentenceIndex].text
		  });
		}
	
		const videoOptions = {
		  fps: 25,
		  loop: 5, // seconds
		  transition: true,
		  transitionDuration: 1, // seconds
		  videoBitrate: 1024,
		  videoCodec: "libx264",
		  size: "640x?",
		  audioBitrate: "128k",
		  audioChannels: 2,
		  format: "mp4",
		  pixelFormat: "yuv420p",
		  useSubRipSubtitles: false, // Use ASS/SSA subtitles instead
		  subtitleStyle: {
			Fontname: "Verdana",
			Fontsize: "26",
			PrimaryColour: "11861244",
			SecondaryColour: "11861244",
			TertiaryColour: "11861244",
			BackColour: "-2147483640",
			Bold: "2",
			Italic: "0",
			BorderStyle: "2",
			Outline: "2",
			Shadow: "3",
			Alignment: "1", // left, middle, right
			MarginL: "40",
			MarginR: "60",
			MarginV: "40"
		  }
		};
	
		videoshow(images, videoOptions)
		  // .audio("song.mp3")
		  .save("./content/video.mp4")
		  .on("start", function(command) {
			console.log("ffmpeg process started:", command);
		  })
		  .on("error", function(err, stdout, stderr) {
			console.error("Error:", err);
			console.error("ffmpeg stderr:", stderr);
		  })
		  .on("end", function(output) {
			console.error("Video created in:", output);
		  });
	  }
	
	  async function renderVideo(content) {
		  await renderVideoWithNode(content);
	  }
}

module.exports = robot