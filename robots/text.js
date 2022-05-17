const wiki = require('wikijs').default
const sbd = require('sbd')
const fs = require('fs');
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

const watsonApiKey = require('../credentials/watson-nlu.json').apikey
const nlu = new NaturalLanguageUnderstandingV1({
    authenticator: new IamAuthenticator({ apikey: watsonApiKey }),
    version: '2018-04-05',
    serviceUrl: 'https://api.us-south.natural-language-understanding.watson.cloud.ibm.com'
});




async function robot(content) {
    await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSentences(content)
    limitMaximumSentences(content)
    await fetchKeywordOfAllSentences(content)
}


async function fetchContentFromWikipedia(content) {
    await wiki({ apiUrl: 'https://pt.wikipedia.org/w/api.php' }).page(content.searchTerm).then(async (page) => {

        await page.content().then(async (texts) => {
            const mergedTexts = await mergeTexts(texts)
            content.sourceContentOriginal = mergedTexts
        })

        function mergeTexts(texts) {
            let mergedTexts = '';
            texts.forEach((text) => {
                mergedTexts += text.content + '\n'
            })
            return mergedTexts
        }
    })
}

function sanitizeContent(content) {
    const text = content.sourceContentOriginal;
    const withoutBreakLines = text.split('\n');
    const withouBlankLines = withoutBreakLines.filter((line) => {
        return line.length > 0
    }).join(' ')
    const withouDateInParenthesis = withouBlankLines.replace(/\(?\([^()]*\)|[^()]*\)/gm, '')

    content.sourceContentSanitized = withouDateInParenthesis
}

function breakContentIntoSentences(content) {
    content.sentences = []
    const sentences = sbd.sentences(content.sourceContentSanitized)
    sentences.forEach((sentence) => {
        content.sentences.push({
            text: sentence,
            keywords: [],
            images: []
        })
    })
}

function limitMaximumSentences(content) {
    content.sentences = content.sentences.slice(0, content.maximunSentences)
}

async function fetchKeywordOfAllSentences(content){
    for (const sentence of content.sentences){
        sentence.keyword = await fetchWatsonAndReturnKeywords(sentence.text)
    }
}

async function fetchWatsonAndReturnKeywords(sentence) {
    return new Promise((resolve, reject) => {
        nlu.analyze(
            {
                text: sentence,
                features: {
                    keywords: {}
                }
            })
            .then(response => {
                const keywords = response.result.keywords.map((keyword) => {
                    return keyword.text
                })
                resolve(keywords)
            })
            .catch(err => {
                reject(err)
            });
    })
}


module.exports = robot