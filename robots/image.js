const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const state = require('./state.js')
const imageDownlader = require('image-downloader')
const gm = require('gm').subClass({ 'imageMagick': true })
const fs = require('fs')

const googleSearchCredentials = require('../credentials/google-search.json')


async function robot() {
	const content = state.load()

	await fetchImagesOfAllSentences(content)
	await downloadAllImages(content)
	await convertAllImages(content)
	await createAllSentencesImages(content)
	await createYouTubeThumbnail();
	
	state.save(content)

	async function fetchImagesOfAllSentences(content) {
		for (const sentence of content.sentences) {
			const query = `${content.searchTerm} ${sentence.keywords[0]}`
			console.log(query);
			sentence.images = await fecthGoogleAndReturnImagesLinks(query)

			sentence.googleSearchQuery = query
		}
	}

	async function fecthGoogleAndReturnImagesLinks(query) {
		const response = await customSearch.cse.list({
			auth: googleSearchCredentials.apikey,
			cx: googleSearchCredentials.searchEngineID,
			q: query,
			searchType: 'image',
			num: 2
		})
		// console.dir(response, { depth: null })

		const imagesUrl = response.data.items.map((item) => {
			return item.link
		})

		return imagesUrl
	}

	async function downloadAllImages(content) {
		content.downloadedImages = []
		for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
			const images = content.sentences[sentenceIndex].images

			for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
				const imageUrl = images[imageIndex]

				try {
					if (content.downloadedImages.includes(imageUrl)) {
						throw new Error('Imagem já foi baixada')
					}

					await downloadAndSave(imageUrl, `${sentenceIndex}-original.png`)
					// await downloadAndSave(imageUrl, `${sentenceIndex}-${imageIndex}-original.png`)
					content.downloadedImages.push(imageUrl)
					console.log(`> [${sentenceIndex}][${imageIndex}] Baixou imagem com sucesso: ${imageUrl}`)
				} catch (error) {
					console.log(`> [${sentenceIndex}][${imageIndex}] Erro ao baixar (${imageUrl}): ${error}`)
				}
			}
		}
	}

	async function downloadAndSave(url, fileName) {
		return imageDownlader.image({
			url: url,
			dest: `../../content/${fileName}`
		})
	}

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
}

module.exports = robot