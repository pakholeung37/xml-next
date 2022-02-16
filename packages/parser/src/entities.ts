export enum BinTrieFlags {
  HAS_VALUE = 0b1000_0000_0000_0000,
  BRANCH_LENGTH = 0b0111_1111_0000_0000,
  MULTI_BYTE = 0b0000_0000_1000_0000,
  JUMP_TABLE = 0b0000_0000_0111_1111,
}

const enum CharCodes {
  NUM = 35, // "#"
  SEMI = 59, // ";"
  ZERO = 48, // "0"
  NINE = 57, // "9"
  LOWER_A = 97, // "a"
  LOWER_F = 102, // "f"
  LOWER_X = 120, // "x"
  /** Bit that needs to be set to convert an upper case ASCII character to lower case */
  To_LOWER_BIT = 0b100000,
}

export const JUMP_OFFSET_BASE = CharCodes.ZERO - 1

export function determineBranch(
  decodeTree: Uint16Array,
  current: number,
  nodeIdx: number,
  char: number,
): number {
  if (current <= 128) {
    return char === current ? nodeIdx : -1
  }

  const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 8

  if (branchCount === 0) {
    return -1
  }

  if (branchCount === 1) {
    return char === decodeTree[nodeIdx] ? nodeIdx + 1 : -1
  }

  const jumpOffset = current & BinTrieFlags.JUMP_TABLE
  if (jumpOffset) {
    const value = char - JUMP_OFFSET_BASE - jumpOffset

    return value < 0 || value > branchCount
      ? -1
      : decodeTree[nodeIdx + value] - 1
  }

  // Binary search for the character.
  let lo = nodeIdx
  let hi = lo + branchCount - 1

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1
    const midVal = decodeTree[mid]

    if (midVal < char) {
      lo = mid + 1
    } else if (midVal > char) {
      hi = mid - 1
    } else {
      return decodeTree[mid + branchCount]
    }
  }

  return -1
}

const decodeMap = new Map([
  [0, 65533],
  [128, 8364],
  [130, 8218],
  [131, 402],
  [132, 8222],
  [133, 8230],
  [134, 8224],
  [135, 8225],
  [136, 710],
  [137, 8240],
  [138, 352],
  [139, 8249],
  [140, 338],
  [142, 381],
  [145, 8216],
  [146, 8217],
  [147, 8220],
  [148, 8221],
  [149, 8226],
  [150, 8211],
  [151, 8212],
  [152, 732],
  [153, 8482],
  [154, 353],
  [155, 8250],
  [156, 339],
  [158, 382],
  [159, 376],
])

const fromCodePoint =
  String.fromCodePoint ||
  function (codePoint: number): string {
    let output = ''

    if (codePoint > 0xffff) {
      codePoint -= 0x10000
      output += String.fromCharCode(((codePoint >>> 10) & 0x3ff) | 0xd800)
      codePoint = 0xdc00 | (codePoint & 0x3ff)
    }

    output += String.fromCharCode(codePoint)
    return output
  }

export function replaceCodePoint(codePoint: number) {
  if ((codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) {
    return 0xfffd
  }

  return decodeMap.get(codePoint) ?? codePoint
}

export function decodeCodePoint(codePoint: number): string {
  return fromCodePoint(replaceCodePoint(codePoint))
}

export const xmlDecodeTree = new Uint16Array([
  1024, 97, 103, 108, 113, 9, 23, 27, 31, 1086, 15, 0, 0, 19, 112, 59, 32768,
  38, 111, 115, 59, 32768, 39, 116, 59, 32768, 62, 116, 59, 32768, 60, 117, 111,
  116, 59, 32768, 34,
])
