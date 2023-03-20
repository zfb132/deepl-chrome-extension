import axios, { AxiosInstance } from 'axios'
import qs from 'query-string'

import { APIRegions, TranslateResult } from './types'

class Client {
  axios: AxiosInstance

  constructor(private apiToken: string, private region: APIRegions) {
    // set api token
    this.axios = axios.create({
      baseURL: this.getAPI(this.apiToken),
    })
    this.axios.interceptors.response.use(
      function (response) {
        return response
      },
      function (error) {
        if (error.response) {
          const { data, status } = error.response

          if (data?.message) {
            error.message = `${data.message} (${status})`
          }
        }
        return Promise.reject(error)
      },
    )
  }

  async translate(text: string, targetLang: string): Promise<TranslateResult> {
    switch (this.region) {
      case 'deeplx':
        return this.translateDeeplX(text, targetLang)
      case 'custom':
        return this.translateCustom(text, targetLang)
      default:
    }
    return this.axios
      .post(
        '',
        qs.stringify({
          target_lang: targetLang,
          split_sentences: '1',
          preserve_formatting: '0',
          text: text,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            Authorization: `DeepL-Auth-Key ${this.apiToken}`,
          },
          responseType: 'json',
        },
      )
      .then((res) => res.data)
  }

  private getAPI(token: string): string {
    switch (this.region) {
      case 'free':
        return 'https://api-free.deepl.com/v2/translate/'
      case 'deeplx':
        return 'https://www2.deepl.com/jsonrpc'
      case 'custom':
        return token
      default:
        return 'https://api.deepl.com/v2/translate/'
    }
  }

  private translateCustom(
    text: string,
    targetLang: string,
  ): Promise<TranslateResult> {
    return this.axios
      .post(
        '',
        JSON.stringify({
          target_lang: targetLang,
          // split_sentences: '1',
          // preserve_formatting: '0',
          text: text,
        }),
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          responseType: 'json',
        },
      )
      .then(function (response) {
        if (response.hasOwnProperty('translations')) {
          return response.data
        }
        const result = {
          translations: [
            {
              // most custom deeplx api does not return detected_source_language
              detected_source_language: 'EN',
              text: response.data.data,
            },
          ],
        }
        return result
      })
  }

  private translateDeeplX(
    text: string,
    targetLang: string,
  ): Promise<TranslateResult> {
    const id = 1000 * (Math.floor(Math.random() * 99999) + 8300000) + 1
    let ICounts = 0
    let ts = Date.now()
    for (let i = 0; i < text.length; i++) {
      if (text[i] == 'i') {
        ICounts++
      }
    }
    if (ICounts != 0) {
      ICounts++
      ts = ts - (ts % ICounts) + ICounts
    }
    let reqBody = JSON.stringify({
      jsonrpc: '2.0',
      method: 'LMT_handle_texts',
      id: id,
      params: {
        texts: [
          {
            text: text,
            requestAlternatives: 3,
          },
        ],
        splitting: 'newlines',
        lang: {
          target_lang: targetLang,
        },
        timestamp: ts,
        commonJobParams: {
          wasSpoken: false,
          transcribe_as: '',
        },
      },
    })
    if ((id + 5) % 29 == 0 || (id + 3) % 13 == 0) {
      reqBody = reqBody.replace('"method":"', '"method" : "')
    } else {
      reqBody = reqBody.replace('"method":"', '"method": "')
    }
    return this.axios
      .post('', reqBody, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Accept: '*/*',
          'x-app-os-name': 'iOS',
          'x-app-os-version': '16.3.0',
          'Accept-Language': 'en-US,en;q=0.9',
          //"Accept-Encoding": "gzip, deflate, br",
          'x-app-device': 'iPhone13,2',
          //"User-Agent": "DeepL-iOS/2.6.0 iOS 16.3.0 (iPhone13,2)",
          'x-app-build': '353933',
          'x-app-version': '2.6',
          //"Connection": "keep-alive",
        },
        responseType: 'json',
      })
      .then(function (response) {
        // check if 'translations' is in response
        if (response.hasOwnProperty('translations')) {
          return response.data
        }
        const lang = response.data.result.lang
        const translatedText = response.data.result.texts[0].text
        const result = {
          translations: [
            {
              detected_source_language: lang,
              text: translatedText,
            },
          ],
        }
        return result
      })
  }
}

export default Client
