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

}

module.exports = robot