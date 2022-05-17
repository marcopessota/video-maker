const wiki = require('wikijs').default
const sbd = require('sbd')

async function robot(content) {
    await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSentences(content)
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
    const sentences =  sbd.sentences(content.sourceContentSanitized)
    sentences.forEach( (sentence) => {
         content.sentences.push({
            text: sentence,
            keywords: [],
            images: []
        })
    })
}



module.exports = robot