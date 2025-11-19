import * as kuromoji from '@patdx/kuromoji';

let tokenizer: any = null;
let isInitializing = false;

// Browser-compatible loader that uses the compressed files with proper decompression
const browserLoader: kuromoji.LoaderConfig = {
  async loadArrayBuffer(url: string): Promise<ArrayBufferLike> {
    try {
      // Use the dictionary files from the public directory
      console.log('Loading Kuromoji dictionary file:', `/kuromoji-dict/${url}`);
      const response = await fetch(`/kuromoji-dict/${url}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}, status: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // If the file is gzipped, decompress it using modern browser API
      if (url.endsWith('.gz')) {
        try {
          const decompressedStream = new DecompressionStream('gzip');
          const compressedReadableStream = new ReadableStream({
            start(controller) {
              controller.enqueue(new Uint8Array(arrayBuffer));
              controller.close();
            }
          });
          
          const decompressedResponse = new Response(
            compressedReadableStream.pipeThrough(decompressedStream)
          );
          
          return await decompressedResponse.arrayBuffer();
        } catch (decompressError) {
          console.error('Decompression failed, browser may not support DecompressionStream:', decompressError);
          throw decompressError;
        }
      }
      
      return arrayBuffer;
    } catch (error) {
      console.error(`Failed to load dictionary file: ${url}`, error);
      throw error;
    }
  },
};

// Initialize Kuromoji tokenizer
const initializeTokenizer = async (): Promise<any> => {
  if (tokenizer) {
    return tokenizer;
  }

  if (isInitializing) {
    // Wait for existing initialization to complete
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return tokenizer;
  }

  isInitializing = true;

  try {
    console.log('Initializing Kuromoji tokenizer...');
    
    // Check if DecompressionStream is available (modern browsers)
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('DecompressionStream not supported in this browser');
    }
    
    tokenizer = await new kuromoji.TokenizerBuilder({
      loader: browserLoader,
    }).build();
    
    isInitializing = false;
    console.log('Kuromoji initialized successfully');
    return tokenizer;
  } catch (error) {
    isInitializing = false;
    console.error('Failed to initialize Kuromoji:', error);
    throw error;
  }
};

// Convert kanji text to furigana using Kuromoji
export const convertKanjiToFurigana = async (text: string): Promise<string> => {
  try {
    // If text is already hiragana/katakana, return as is
    if (/^[\u3040-\u309F\u30A0-\u30FF\s]*$/.test(text)) {
      return text;
    }

    // If no kanji characters, return empty
    if (!/[\u4E00-\u9FAF]/.test(text)) {
      return '';
    }

    const tokenizer = await initializeTokenizer();
    const tokens = tokenizer.tokenize(text.trim());
    
    let furigana = '';
    
    for (const token of tokens) {
      // Use reading if available, otherwise use the surface form
      if (token.reading && token.reading !== '*') {
        // Convert katakana reading to hiragana
        const hiragana = token.reading.replace(/[\u30A1-\u30F6]/g, (match: string) => {
          return String.fromCharCode(match.charCodeAt(0) - 0x60);
        });
        furigana += hiragana;
      } else {
        furigana += token.surface_form;
      }
    }
    
    return furigana;
    
  } catch (error) {
    console.error('Kuromoji furigana conversion failed:', error);
    
    // Fallback to basic kanji mapping
    const basicMap: { [key: string]: string } = {
      '田': 'た', '中': 'なか', '山': 'やま', '佐': 'さ', '藤': 'とう',
      '木': 'き', '井': 'い', '川': 'かわ', '高': 'たか', '小': 'こ',
      '松': 'まつ', '太': 'た', '郎': 'ろう', '子': 'こ', '美': 'み',
      '花': 'か', '雄': 'お', '男': 'お', '一': 'いち', '二': 'に', '三': 'さん',
      '石': 'いし', '林': 'はやし', '森': 'もり', '池': 'いけ', '村': 'むら',
      '島': 'しま', '橋': 'はし', '本': 'もと', '原': 'はら', '野': 'の',
      '宮': 'みや', '内': 'うち', '上': 'うえ', '下': 'した', '西': 'にし',
      '東': 'ひがし', '南': 'みなみ', '北': 'きた', '大': 'おお', '和': 'わ',
      '正': 'まさ', '明': 'あき', '昭': 'あき', '平': 'へい', '成': 'なり',
      '博': 'ひろ', '弘': 'ひろ', '浩': 'ひろ', '宏': 'ひろ', '裕': 'ゆう',
      '智': 'とも', '彦': 'ひこ', '夫': 'お', '雅': 'まさ', '健': 'けん',
      '伸': 'のぶ', '誠': 'まこと', '実': 'みのる', '清': 'きよし', '武': 'たけし'
    };
    
    const result = text.split('').map(char => basicMap[char] || '').join('');
    
    // If we got a complete conversion, return it, otherwise return empty for manual input
    const hasUnknownChars = text.split('').some(char => 
      /[\u4E00-\u9FAF]/.test(char) && !basicMap[char]
    );
    
    return hasUnknownChars ? '' : result;
  }
};

export const furiganaService = {
  convertKanjiToFurigana
};
