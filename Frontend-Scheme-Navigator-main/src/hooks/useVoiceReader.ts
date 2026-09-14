import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/appStore';

export interface UseVoiceReaderOptions {
  defaultRate?: number;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

/**
 * Splits text into small, digestible sentence chunks (<150 chars).
 * Prevents Chrome/Edge from cutting off audio after 15 seconds.
 */
export function splitIntoSpeechChunks(text: string): string[] {
  if (!text) return [];
  const normalized = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  // Match sentences ending in ., !, ?, or Hindi danda (।)
  const rawSentences = normalized.match(/[^.!?।]+[.!?।]+|[^.!?।]+$/g) || [normalized];
  const chunks: string[] = [];

  for (const raw of rawSentences) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (trimmed.length > 150) {
      const words = trimmed.split(' ');
      let current = '';
      for (const word of words) {
        if ((current + ' ' + word).trim().length > 140 && current.length > 0) {
          chunks.push(current.trim());
          current = word;
        } else {
          current = current ? `${current} ${word}` : word;
        }
      }
      if (current.trim()) {
        chunks.push(current.trim());
      }
    } else {
      chunks.push(trimmed);
    }
  }

  return chunks;
}

/**
 * Intelligent DOM extractor: extracts clean, coherent text from the current page
 * ignoring nav, buttons, footer, scripts, and hidden utility icons.
 */
export function extractPageReadableText(): string {
  if (typeof document === 'undefined') return '';

  const main = document.querySelector('main') || document.querySelector('#root') || document.body;
  if (!main) return document.title || '';

  const selectors = 'h1, h2, h3, h4, p, [data-readable="true"]';
  const elements = Array.from(main.querySelectorAll(selectors));

  const pieces: string[] = [];
  const seen = new Set<string>();

  for (const el of elements) {
    if (
      el.closest('header') ||
      el.closest('nav') ||
      el.closest('footer') ||
      el.closest('[aria-hidden="true"]') ||
      el.closest('.no-voice-read') ||
      el.closest('button') ||
      el.classList.contains('sr-only')
    ) {
      continue;
    }

    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length < 3 || seen.has(text)) continue;

    // Filter out common button-like labels
    if (/^(click here|apply now|learn more|back|next|submit|close|cancel|reset|filter)$/i.test(text)) {
      continue;
    }

    seen.add(text);
    const punctuated = /[.!?।]$/.test(text) ? text : `${text}.`;
    pieces.push(punctuated);
  }

  if (pieces.length === 0) {
    return document.title || 'Scheme Navigator portal.';
  }

  return pieces.join(' ');
}

/**
 * Converts numbers in Odia context (e.g. 28, 3,866, 100%, 3,500+) into authentic Odia spoken words.
 * This prevents TTS engines from reading numbers in English or skipping surrounding text.
 */
export function convertOdiaNumbersToWords(text: string): string {
  if (!text) return '';

  const ones: string[] = [
    '', 'ଏକ', 'ଦୁଇ', 'ତିନି', 'ଚାରି', 'ପାଞ୍ଚ', 'ଛଅ', 'ସାତ', 'ଆଠ', 'ନଅ', 'ଦଶ',
    'ଏଗାର', 'ବାର', 'ତେର', 'ଚଉଦ', 'ପନ୍ଦର', 'ଷୋହଳ', 'ସତର', 'ଅଠର', 'ଉଣେଇଶ', 'କୋଡ଼ିଏ',
    'ଏକୋଇଶ', 'ବାଇଶ', 'ତେଇଶ', 'ଚବିଶ', 'ପଚିଶ', 'ଛବିଶ', 'ସତେଇଶ', 'ଅଠେଇଶ', 'ଅଣତିରିଶ', 'ତିରିଶ',
    'ଏକତିରିଶ', 'ବତିଶ', 'ତେତିଶ', 'ଚୌତିଶ', 'ପଇଁତିରିଶ', 'ଛତିଶ', 'ସଇଁତିରିଶ', 'ଅଠତିରିଶ', 'ଅଣଚାଳିଶ', 'ଚାଳିଶ',
    'ଏକଚାଳିଶ', 'ବିୟାଳିଶ', 'ତେୟାଳିଶ', 'ଚଉରାଳିଶ', 'ପଞ୍ଚଚାଳିଶ', 'ଛୟାଳିଶ', 'ସତଚାଳିଶ', 'ଅଠଚାଳିଶ', 'ଅଣଚାଶ', 'ପଚାଶ',
    'ଏକାବନ', 'ବାଅନ', 'ତେପନ', 'ଚଉବନ', 'ପଞ୍ଚାବନ', 'ଛପନ', 'ସତାବନ', 'ଅଠାବନ', 'ଅଣଷଠି', 'ଷାଠିଏ',
    'ଏକଷଠି', 'ବାଷଠି', 'ତେଷଠି', 'ଚୌଷଠି', 'ପଞ୍ଚଷଠି', 'ଛଷଠି', 'ସତଷଠି', 'ଅଠଷଠି', 'ଅଣସତରୀ', 'ସତୁରୀ',
    'ଏକସ୍ତରୀ', 'ବାସ୍ତରୀ', 'ତେସ୍ତରୀ', 'ଚଉସ୍ତରୀ', 'ପଞ୍ଚସ୍ତରୀ', 'ଛଅସ୍ତରୀ', 'ସତସ୍ତରୀ', 'ଅଠସ୍ତରୀ', 'ଅଣଅଶୀ', 'ଅଶୀ',
    'ଏକାଶୀ', 'ବିୟାଶୀ', 'ତେୟାଶୀ', 'ଚଉରାଶୀ', 'ପଞ୍ଚାଶୀ', 'ଛୟାଶୀ', 'ସତାଶୀ', 'ଅଠାଶୀ', 'ଅଣନବେ', 'ନବେ',
    'ଏକାନବେ', 'ବିୟାନବେ', 'ତେୟାନବେ', 'ଚଉରାନବେ', 'ପଞ୍ଚାନବେ', 'ଛୟାନବେ', 'ସତାନବେ', 'ଅଠାନବେ', 'ଅଣଶହେ', 'ଶହେ'
  ];

  function numToWords(n: number): string {
    if (isNaN(n) || n < 0) return String(n);
    if (n <= 100) return ones[n] || String(n);
    if (n < 1000) {
      const h = Math.floor(n / 100);
      const rem = n % 100;
      const hStr = h === 1 ? 'ଶହେ' : `${ones[h]} ଶହ`;
      return rem > 0 ? `${hStr} ${numToWords(rem)}` : hStr;
    }
    if (n < 100000) {
      const th = Math.floor(n / 1000);
      const rem = n % 1000;
      const thStr = `${numToWords(th)} ହଜାର`;
      return rem > 0 ? `${thStr} ${numToWords(rem)}` : thStr;
    }
    if (n < 10000000) {
      const lk = Math.floor(n / 100000);
      const rem = n % 100000;
      const lkStr = `${numToWords(lk)} ଲକ୍ଷ`;
      return rem > 0 ? `${lkStr} ${numToWords(rem)}` : lkStr;
    }
    return String(n);
  }

  // 1. Odia numerals ୦-୯ to standard 0-9
  let s = text.replace(/[\u0b66-\u0b6f]/g, (ch) => String(ch.charCodeAt(0) - 0x0b66));

  // 2. Remove commas inside numbers (e.g. 3,500 -> 3500)
  s = s.replace(/(\d+),(\d+)/g, '$1$2');

  // 3. Percentages e.g. 100% -> 100 ପ୍ରତିଶତ
  s = s.replace(/(\d+)\s*%/g, '$1 ପ୍ରତିଶତ');

  // 4. Pluses on numbers e.g. 3500+ -> 3500 ରୁ ଅଧିକ
  s = s.replace(/(\d+)\s*\+/g, '$1 ରୁ ଅଧିକ');

  // 5. Expand standalone numbers to Odia words
  s = s.replace(/\b\d+\b/g, (match) => {
    const val = parseInt(match, 10);
    if (!isNaN(val) && val <= 9999999) {
      return numToWords(val);
    }
    return match;
  });

  return s;
}

/**
 * Transliterates Odia text to Devanagari phonetics with accurate mapping for Hindi voices.
 * Handles Odia ଯ (j) vs ୟ (y), retroflex ଳ -> ल, and composite matras.
 */
export function transliterateOdiaToDevanagari(text: string): string {
  if (!text) return '';
  let res = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0x0b66 && code <= 0x0b6f) {
      res += String(code - 0x0b66);
    } else if (code === 0x0b5c) {
      res += '\u095c'; // ड़
    } else if (code === 0x0b5d) {
      res += '\u095d'; // ढ़
    } else if (code === 0x0b5f) {
      res += '\u092f'; // ୟ -> य
    } else if (code === 0x0b2f) {
      res += '\u091c'; // ଯ -> ज (Authentic Odia pronunciation of ଯ is J!)
    } else if (code === 0x0b71) {
      res += '\u0935'; // ୱ -> व
    } else if (code === 0x0b33) {
      res += '\u0932'; // ଳ (retroflex L) -> ल
    } else if (code === 0x0b47 && i + 1 < text.length && text.charCodeAt(i + 1) === 0x0b3e) {
      res += '\u094b'; // େ + ା = ୋ (ो)
      i++;
    } else if (code === 0x0b47 && i + 1 < text.length && text.charCodeAt(i + 1) === 0x0b57) {
      res += '\u094c'; // େ + ୗ = ୌ (ौ)
      i++;
    } else if (code >= 0x0b01 && code <= 0x0b75) {
      res += String.fromCharCode(code - 0x0200);
    } else {
      res += text[i];
    }
  }
  return res;
}

/**
 * Transliterates Odia text to Bengali script for Bengali voices (closest sister language).
 */
export function transliterateOdiaToBengali(text: string): string {
  if (!text) return '';
  let res = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 0x0b5c) {
      res += '\u09dc'; // ড়
    } else if (code === 0x0b5d) {
      res += '\u09dd'; // ঢ়
    } else if (code === 0x0b5f) {
      res += '\u09df'; // য়
    } else if (code === 0x0b71) {
      res += '\u09ac'; // ব
    } else if (code === 0x0b33) {
      res += '\u09b2'; // ল
    } else if (code >= 0x0b01 && code <= 0x0b70) {
      res += String.fromCharCode(code - 0x0180);
    } else {
      res += text[i];
    }
  }
  return res;
}

/**
 * Transliterates Odia text into smooth Romanized English phonetics.
 * This is the ultimate fallback when only English/Latin voices (e.g. Heera, Ravi, David, Zira)
 * are installed on the client OS. It guarantees that NO ODIA WORDS ARE DROPPED OR SKIPPED.
 */
export function transliterateOdiaToRoman(text: string): string {
  if (!text) return '';

  const vowels: Record<number, string> = {
    0x0b05: 'a', 0x0b06: 'aa', 0x0b07: 'i', 0x0b08: 'ee', 0x0b09: 'u', 0x0b0a: 'oo',
    0x0b0b: 'ri', 0x0b0f: 'e', 0x0b10: 'ai', 0x0b13: 'o', 0x0b14: 'au'
  };

  const consonants: Record<number, string> = {
    0x0b15: 'k', 0x0b16: 'kh', 0x0b17: 'g', 0x0b18: 'gh', 0x0b19: 'ng',
    0x0b1a: 'ch', 0x0b1b: 'chh', 0x0b1c: 'j', 0x0b1d: 'jh', 0x0b1e: 'ny',
    0x0b1f: 't', 0x0b20: 'th', 0x0b21: 'd', 0x0b22: 'dh', 0x0b23: 'n',
    0x0b24: 't', 0x0b25: 'th', 0x0b26: 'd', 0x0b27: 'dh', 0x0b28: 'n',
    0x0b2a: 'p', 0x0b2b: 'ph', 0x0b2c: 'b', 0x0b2d: 'bh', 0x0b2e: 'm',
    0x0b2f: 'j', 0x0b30: 'r', 0x0b32: 'l', 0x0b33: 'l', 0x0b35: 'v',
    0x0b36: 'sh', 0x0b37: 'sh', 0x0b38: 's', 0x0b39: 'h',
    0x0b5c: 'd', 0x0b5d: 'dh', 0x0b5f: 'y', 0x0b71: 'w'
  };

  const matras: Record<number, string> = {
    0x0b3e: 'aa', 0x0b3f: 'i', 0x0b40: 'ee', 0x0b41: 'u', 0x0b42: 'oo',
    0x0b43: 'ri', 0x0b47: 'e', 0x0b48: 'ai', 0x0b4b: 'o', 0x0b4c: 'au'
  };

  let out = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);

    // Composite matras: େ + ା = ୋ (o)
    if (code === 0x0b47 && i + 1 < text.length && text.charCodeAt(i + 1) === 0x0b3e) {
      out += 'o';
      i++;
      continue;
    }
    // େ + ୗ = ୌ (au)
    if (code === 0x0b47 && i + 1 < text.length && text.charCodeAt(i + 1) === 0x0b57) {
      out += 'au';
      i++;
      continue;
    }

    if (vowels[code]) {
      out += vowels[code];
    } else if (consonants[code]) {
      const cons = consonants[code];
      const nextCode = i + 1 < text.length ? text.charCodeAt(i + 1) : 0;
      if (nextCode === 0x0b4d) { // halant / virama (kills inherent vowel)
        out += cons;
        i++;
      } else if (matras[nextCode]) {
        out += cons + matras[nextCode];
        i++;
      } else if (nextCode === 0x0b47 && i + 2 < text.length && text.charCodeAt(i + 2) === 0x0b3e) {
        out += cons + 'o';
        i += 2;
      } else if (nextCode === 0x0b47 && i + 2 < text.length && text.charCodeAt(i + 2) === 0x0b57) {
        out += cons + 'au';
        i += 2;
      } else {
        // Inherent vowel 'a' in Odia
        out += cons + 'a';
      }
    } else if (code === 0x0b01 || code === 0x0b02) { // candrabindu / anusvara
      out += 'n';
    } else if (code === 0x0b03) { // visarga
      out += 'h';
    } else if (code === 0x0964 || code === 0x0b64) { // danda
      out += '.';
    } else {
      out += text[i];
    }
  }
  return out;
}

/**
 * Transliterates Punjabi Gurmukhi text to Roman phonetics for English voice fallback.
 */
export function transliteratePunjabiToRoman(text: string): string {
  if (!text) return '';
  const consonants: Record<number, string> = {
    0x0a15: 'k', 0x0a16: 'kh', 0x0a17: 'g', 0x0a18: 'gh', 0x0a19: 'ng',
    0x0a1a: 'ch', 0x0a1b: 'chh', 0x0a1c: 'j', 0x0a1d: 'jh', 0x0a1e: 'ny',
    0x0a1f: 't', 0x0a20: 'th', 0x0a21: 'd', 0x0a22: 'dh', 0x0a23: 'n',
    0x0a24: 't', 0x0a25: 'th', 0x0a26: 'd', 0x0a27: 'dh', 0x0a28: 'n',
    0x0a2a: 'p', 0x0a2b: 'ph', 0x0a2c: 'b', 0x0a2d: 'bh', 0x0a2e: 'm',
    0x0a2f: 'y', 0x0a30: 'r', 0x0a32: 'l', 0x0a33: 'l', 0x0a35: 'v',
    0x0a36: 'sh', 0x0a38: 's', 0x0a39: 'h', 0x0a5c: 'r'
  };
  const vowels: Record<number, string> = {
    0x0a05: 'a', 0x0a06: 'aa', 0x0a07: 'i', 0x0a08: 'ee', 0x0a09: 'u',
    0x0a0a: 'oo', 0x0a0f: 'e', 0x0a10: 'ai', 0x0a13: 'o', 0x0a14: 'au'
  };
  const matras: Record<number, string> = {
    0x0a3e: 'aa', 0x0a3f: 'i', 0x0a40: 'ee', 0x0a41: 'u', 0x0a42: 'oo',
    0x0a47: 'e', 0x0a48: 'ai', 0x0a4b: 'o', 0x0a4c: 'au'
  };
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0x0a66 && code <= 0x0a6f) {
      out += String(code - 0x0a66);
    } else if (vowels[code]) {
      out += vowels[code];
    } else if (consonants[code]) {
      const cons = consonants[code];
      const nextCode = i + 1 < text.length ? text.charCodeAt(i + 1) : 0;
      if (nextCode === 0x0a4d) {
        out += cons;
        i++;
      } else if (matras[nextCode]) {
        out += cons + matras[nextCode];
        i++;
      } else {
        out += cons + 'a';
      }
    } else if (code === 0x0a70 || code === 0x0a02) {
      out += 'n';
    } else if (code === 0x0a71) {
      const nextCode = i + 1 < text.length ? text.charCodeAt(i + 1) : 0;
      if (consonants[nextCode]) {
        out += consonants[nextCode];
      }
    } else {
      out += text[i];
    }
  }
  return out;
}

/**
 * Transliterates Punjabi (Gurmukhi) or Odia text to Devanagari phonetics.
 */
export function transliterateIndicToDevanagari(text: string, lang: string): string {
  if (!text) return '';
  const langPrefix = (lang || '').toLowerCase().split('-')[0];

  if (langPrefix === 'pa') {
    let res = '';
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code === 0x0a70 || code === 0x0a02) {
        res += String.fromCharCode(0x0902);
      } else if (code === 0x0a71) {
        const nextCode = text.charCodeAt(i + 1);
        if (nextCode >= 0x0a15 && nextCode <= 0x0a39) {
          res += String.fromCharCode(nextCode - 0x0100) + String.fromCharCode(0x094d);
        }
      } else if (code === 0x0a5c) {
        res += String.fromCharCode(0x095c);
      } else if (code >= 0x0a66 && code <= 0x0a6f) {
        res += String(code - 0x0a66);
      } else if (code >= 0x0a01 && code <= 0x0a75) {
        res += String.fromCharCode(code - 0x0100);
      } else {
        res += text[i];
      }
    }
    return res;
  }

  if (langPrefix === 'or') {
    return transliterateOdiaToDevanagari(text);
  }

  return text;
}

export function isNativeOdiaVoice(voice: SpeechSynthesisVoice | null | undefined): boolean {
  if (!voice) return false;
  const vl = (voice.lang || '').toLowerCase().replace('_', '-');
  const vn = (voice.name || '').toLowerCase();
  return (
    vl === 'or-in' ||
    vl === 'or' ||
    vl === 'ory-in' ||
    vl === 'ory' ||
    vl === 'ori-in' ||
    vl === 'ori' ||
    vl.startsWith('or-') ||
    vl.startsWith('ory-') ||
    vl.startsWith('ori-') ||
    vn.includes('odia') ||
    vn.includes('oriya') ||
    vn.includes('ଓଡ଼ିଆ') ||
    vn.includes('subhasini') ||
    vn.includes('sukant') ||
    vn.includes('sambalpuri') ||
    vn.includes('utkal')
  );
}

export function isNativePunjabiVoice(voice: SpeechSynthesisVoice | null | undefined): boolean {
  if (!voice) return false;
  const vl = (voice.lang || '').toLowerCase().replace('_', '-');
  const vn = (voice.name || '').toLowerCase();
  return (
    vl === 'pa-in' ||
    vl === 'pa' ||
    vl === 'pan-in' ||
    vl === 'pan' ||
    vl.startsWith('pa-') ||
    vl.startsWith('pan-') ||
    vn.includes('punjabi') ||
    vn.includes('panjabi') ||
    vn.includes('ਪੰਜਾਬੀ') ||
    vn.includes('gurmukhi') ||
    vn.includes('raavi') ||
    vn.includes('harpreet') ||
    vn.includes('gurumukhi')
  );
}

export function isHindiVoice(voice: SpeechSynthesisVoice | null | undefined): boolean {
  if (!voice) return false;
  const vl = (voice.lang || '').toLowerCase().replace('_', '-');
  const vn = (voice.name || '').toLowerCase();
  return (
    vl.startsWith('hi') ||
    vn.includes('hindi') ||
    vn.includes('हिन्दी') ||
    vn.includes('kalpana') ||
    vn.includes('hemant') ||
    vn.includes('swara') ||
    vn.includes('madhur')
  );
}

export function isBengaliVoice(voice: SpeechSynthesisVoice | null | undefined): boolean {
  if (!voice) return false;
  const vl = (voice.lang || '').toLowerCase().replace('_', '-');
  const vn = (voice.name || '').toLowerCase();
  return (
    vl.startsWith('bn') ||
    vn.includes('bengali') ||
    vn.includes('bangla') ||
    vn.includes('বাংলা') ||
    vn.includes('tanishaa') ||
    vn.includes('bashkar')
  );
}

/**
 * Prepares the appropriate pronunciation text and speech language based on target language
 * and the specific voice engine capabilities (Native, Indic fallback, or English fallback).
 */
export function prepareSpeechUtterance(
  text: string,
  targetLang: string,
  matchedVoice: SpeechSynthesisVoice | null
): { textToPronounce: string; speechLang: string } {
  if (!text) return { textToPronounce: '', speechLang: targetLang };

  const normLang = (targetLang || 'en-IN').toLowerCase().replace('_', '-');
  const targetPrefix = normLang.split('-')[0];

  // ODIA
  if (targetPrefix === 'or') {
    // 1. Expand numbers to Odia words first so they are spoken authentically
    const expanded = convertOdiaNumbersToWords(text);

    // 2. Native Odia voice (e.g. Edge Subhasini, Sukant, Android Odia)
    if (isNativeOdiaVoice(matchedVoice)) {
      return {
        textToPronounce: expanded,
        speechLang: matchedVoice?.lang || 'or-IN',
      };
    }

    // 3. Hindi voice (Google हिन्दी, Swara, Kalpana)
    if (isHindiVoice(matchedVoice)) {
      return {
        textToPronounce: transliterateOdiaToDevanagari(expanded),
        speechLang: matchedVoice?.lang || 'hi-IN',
      };
    }

    // 4. Bengali voice (closest Eastern Indic language)
    if (isBengaliVoice(matchedVoice)) {
      return {
        textToPronounce: transliterateOdiaToBengali(expanded),
        speechLang: matchedVoice?.lang || 'bn-IN',
      };
    }

    // 5. English / Latin / Default Voice Fallback (Heera, Ravi, David, Zira)
    // CRITICAL: We transliterate to Romanized Odia phonetics.
    // This ensures English TTS engines DO NOT SKIP ODIA WORDS!
    return {
      textToPronounce: transliterateOdiaToRoman(expanded),
      speechLang: matchedVoice?.lang || 'en-IN',
    };
  }

  // PUNJABI
  if (targetPrefix === 'pa') {
    if (isNativePunjabiVoice(matchedVoice)) {
      return {
        textToPronounce: text,
        speechLang: matchedVoice?.lang || 'pa-IN',
      };
    }
    if (isHindiVoice(matchedVoice)) {
      return {
        textToPronounce: transliterateIndicToDevanagari(text, 'pa'),
        speechLang: matchedVoice?.lang || 'hi-IN',
      };
    }
    return {
      textToPronounce: transliteratePunjabiToRoman(text),
      speechLang: matchedVoice?.lang || 'en-IN',
    };
  }

  // Other languages
  return {
    textToPronounce: text,
    speechLang: matchedVoice?.lang || targetLang,
  };
}

/**
 * Finds the most suitable SpeechSynthesisVoice for the target language.
 * Covers all 12 regional languages with smart fallback hierarchy.
 */
export function findBestVoice(voices: SpeechSynthesisVoice[], targetLang: string): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const normLang = targetLang.toLowerCase().replace('_', '-');
  const langPrefix = normLang.split('-')[0];

  // 1. Exact BCP-47 match (e.g. 'hi-in', 'pa-in', 'or-in', 'bn-in')
  const exact = voices.find((v) => v.lang.toLowerCase().replace('_', '-') === normLang);
  if (exact) return exact;

  // 2. Specific Odia alias matching (includes Edge Natural voices Subhasini and Sukant)
  if (langPrefix === 'or') {
    const nativeOdia = voices.find(isNativeOdiaVoice);
    if (nativeOdia) return nativeOdia;
  }

  // 3. Specific Punjabi alias matching
  if (langPrefix === 'pa') {
    const nativePunjabi = voices.find(isNativePunjabiVoice);
    if (nativePunjabi) return nativePunjabi;
  }

  // 4. Prefix match on language code (e.g. 'hi-IN' matches 'hi')
  const prefixMatch = voices.find((v) => {
    const vl = v.lang.toLowerCase().replace('_', '-');
    if (langPrefix === 'or') {
      return vl.startsWith('or-') || vl === 'or' || vl.startsWith('ory-') || vl === 'ory' || vl.startsWith('ori');
    }
    if (langPrefix === 'pa') {
      return vl.startsWith('pa-') || vl === 'pa' || vl.startsWith('pan-') || vl === 'pan';
    }
    return vl.startsWith(langPrefix + '-') || vl === langPrefix;
  });
  if (prefixMatch) return prefixMatch;

  // 5. Safe full-word or alias name matching for regional Indian languages
  const languageKeywords: Record<string, string[]> = {
    pa: ['punjabi', 'panjabi', 'ਪੰਜਾਬੀ', 'gurmukhi', 'raavi', 'harpreet', 'ananya', 'gurumukhi'],
    or: ['odia', 'oriya', 'ଓଡ଼ିଆ', 'subhasini', 'sukant', 'sambalpuri', 'utkal'],
    hi: ['hindi', 'हिन्दी', 'kalpana', 'hemant', 'swara', 'madhur'],
    bn: ['bengali', 'bangla', 'বাংলা', 'tanishaa', 'bashkar'],
    ta: ['tamil', 'தமிழ்', 'valluvar', 'pallavi'],
    te: ['telugu', 'తెలుగు', 'chitra', 'mohan', 'shruti'],
    mr: ['marathi', 'मराठी', 'aarohi', 'manohar'],
    gu: ['gujarati', 'ગુજરાતી', 'dhwani', 'niranjan'],
    kn: ['kannada', 'ಕನ್ನಡ', 'sapna', 'gagan'],
    ml: ['malayalam', 'മലയാളം', 'midhun', 'sobhana'],
    ur: ['urdu', 'اردو', 'salman', 'gul'],
    en: ['english', 'india', 'heera', 'ravi'],
  };

  const keywords = languageKeywords[langPrefix];
  if (keywords) {
    const nameMatch = voices.find((v) => {
      const vn = v.name.toLowerCase();
      return keywords.some((kw) => vn.includes(kw));
    });
    if (nameMatch) return nameMatch;
  }

  // 6. Intelligent Fallback for Odia and Punjabi when no native voice is installed on client OS:
  if (langPrefix === 'or' || langPrefix === 'pa') {
    // Priority A: Hindi voice (Google हिन्दी / Swara / Madhur / Kalpana)
    const hindiVoice = voices.find(isHindiVoice);
    if (hindiVoice) return hindiVoice;

    // Priority B: Bengali voice (closest Eastern Indic language to Odia)
    const bengaliVoice = voices.find(isBengaliVoice);
    if (bengaliVoice) return bengaliVoice;

    // Priority C: Indian English voice (Heera / Ravi / India)
    const indianEnVoice = voices.find((v) => {
      const vl = v.lang.toLowerCase().replace('_', '-');
      const vn = v.name.toLowerCase();
      return vl === 'en-in' || vn.includes('india') || vn.includes('heera') || vn.includes('ravi');
    });
    if (indianEnVoice) return indianEnVoice;

    // Priority D: default system voice
    return voices.find((v) => v.default) || voices[0] || null;
  }

  // 7. Generic English fallback for English target
  if (langPrefix === 'en') {
    const enVoice = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
    if (enVoice) return enVoice;
  }

  return voices.find((v) => v.default) || voices[0] || null;
}

export const useVoiceReader = (options: UseVoiceReaderOptions = {}) => {
  const { selectedLanguage } = useAppStore();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [rate, setRateState] = useState<number>(options.defaultRate || 1.0);
  const [progress, setProgress] = useState<number>(0);
  const [currentSentence, setCurrentSentence] = useState<string>('');
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  const chunksRef = useRef<string[]>([]);
  const indexRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const targetLangRef = useRef<string>('en-IN');
  const rateRef = useRef<number>(options.defaultRate || 1.0);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const activeLangCode = selectedLanguage?.speechCode || selectedLanguage?.code || 'en-IN';
  targetLangRef.current = activeLangCode;
  rateRef.current = rate;

  // Sync available voices on mount and voice change
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      const updateVoices = () => {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          voicesRef.current = v;
        }
      };
      updateVoices();
      window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
      window.speechSynthesis.onvoiceschanged = updateVoices;
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
        if (window.speechSynthesis.onvoiceschanged === updateVoices) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  // Chrome 15-second cutoff prevention heartbeat
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const heartbeat = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 8000);

    return () => clearInterval(heartbeat);
  }, [isPlaying, isPaused]);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      isPlayingRef.current = false;
      isPausedRef.current = false;
      activeUtteranceRef.current = null;
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('SpeechSynthesis cancel error:', e);
      }
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
      setCurrentSentence('');
      chunksRef.current = [];
      indexRef.current = 0;
      setCurrentChunkIndex(0);
      setTotalChunks(0);
    }
  }, []);

  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.pause();
        isPausedRef.current = true;
        setIsPaused(true);
      } catch (e) {
        console.warn('SpeechSynthesis pause error:', e);
      }
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
        isPausedRef.current = false;
        setIsPaused(false);
      } catch (e) {
        console.warn('SpeechSynthesis resume error:', e);
      }
    }
  }, []);

  const speakChunk = useCallback(
    (index: number) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const chunks = chunksRef.current;

      if (!isPlayingRef.current || index >= chunks.length) {
        isPlayingRef.current = false;
        isPausedRef.current = false;
        activeUtteranceRef.current = null;
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(100);
        setCurrentSentence('');
        options.onEnd?.();
        return;
      }

      indexRef.current = index;
      setCurrentChunkIndex(index);
      const text = chunks[index];
      // Display original target script (pure Odia/Punjabi) visually on screen
      setCurrentSentence(text);

      const calculatedProgress = Math.min(100, Math.round((index / chunks.length) * 100));
      setProgress(calculatedProgress);

      const liveVoices = typeof window !== 'undefined' && 'speechSynthesis' in window
        ? window.speechSynthesis.getVoices()
        : [];
      const voices = liveVoices.length > 0 ? liveVoices : voicesRef.current;
      if (liveVoices.length > 0) {
        voicesRef.current = liveVoices;
      }

      const targetLang = targetLangRef.current;
      const matched = findBestVoice(voices, targetLang);
      const { textToPronounce, speechLang } = prepareSpeechUtterance(text, targetLang, matched);

      // Resume speech synthesis if browser engine was paused
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(textToPronounce);
      utterance.lang = speechLang;
      utterance.rate = rateRef.current;
      utterance.pitch = 1.0;
      if (matched) {
        utterance.voice = matched;
      }

      // Store in ref to prevent V8 garbage collection mid-speech
      activeUtteranceRef.current = utterance;

      utterance.onend = () => {
        activeUtteranceRef.current = null;
        if (isPlayingRef.current && !isPausedRef.current) {
          // Progress to next chunk seamlessly
          speakChunk(index + 1);
        }
      };

      utterance.onerror = (err: any) => {
        activeUtteranceRef.current = null;
        // Ignore intentional cancellations
        if (err?.error === 'canceled' || err?.error === 'interrupted') {
          return;
        }
        console.warn('SpeechSynthesis chunk error, skipping to next:', err);
        if (isPlayingRef.current) {
          speakChunk(index + 1);
        }
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('speechSynthesis speak error:', e);
      }
    },
    [options]
  );

  const play = useCallback(
    (textToSpeak?: string, customLang?: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      const raw = textToSpeak || extractPageReadableText();
      if (!raw || !raw.trim()) return;

      if (customLang) {
        targetLangRef.current = customLang;
      } else {
        targetLangRef.current = activeLangCode;
      }

      const chunks = splitIntoSpeechChunks(raw);
      if (chunks.length === 0) return;

      // Cancel any ongoing previous speech once at the start
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }

      chunksRef.current = chunks;
      setTotalChunks(chunks.length);
      isPlayingRef.current = true;
      isPausedRef.current = false;
      setIsPlaying(true);
      setIsPaused(false);
      setProgress(0);

      // Short 60ms delay after initial cancel to let Chromium reset audio pipeline before starting chunk 0
      setTimeout(() => {
        if (isPlayingRef.current) {
          speakChunk(0);
        }
      }, 60);
    },
    [activeLangCode, speakChunk]
  );

  const skipNext = useCallback(() => {
    const nextIdx = indexRef.current + 1;
    if (nextIdx < chunksRef.current.length) {
      speakChunk(nextIdx);
    } else {
      stop();
    }
  }, [speakChunk, stop]);

  const skipPrevious = useCallback(() => {
    const prevIdx = Math.max(0, indexRef.current - 1);
    speakChunk(prevIdx);
  }, [speakChunk]);

  const setRate = useCallback(
    (newRate: number) => {
      setRateState(newRate);
      rateRef.current = newRate;
      if (isPlayingRef.current && !isPausedRef.current) {
        // Restart current chunk with new rate
        speakChunk(indexRef.current);
      }
    },
    [speakChunk]
  );

  // Stop synthesis if unmounted or navigating
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    isPlaying,
    isPaused,
    progress,
    rate,
    currentSentence,
    currentChunkIndex,
    totalChunks,
    activeLangCode,
    setRate,
    play,
    pause,
    resume,
    stop,
    skipNext,
    skipPrevious,
  };
};
