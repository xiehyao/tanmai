/**
 * SSE 流式响应 UTF-8 解码（与 alumni-link 一致，真机无 TextDecoder 时兜底）
 */
function utf8BytesToString(arr) {
  const u8 = arr instanceof Uint8Array ? arr : new Uint8Array(arr)
  if (u8.length === 0) return ''
  try {
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8').decode(u8)
    }
  } catch (e) {}
  const BATCH = 8192
  let out = ''
  for (let i = 0; i < u8.length; i += BATCH) {
    const slice = u8.subarray(i, Math.min(i + BATCH, u8.length))
    const arrCopy = Array.from(slice)
    out += decodeURIComponent(escape(String.fromCharCode.apply(null, arrCopy)))
  }
  return out
}

function getUtf8SafeDecodeLength(u8) {
  const n = u8.length
  if (n === 0) return 0
  let i = n - 1
  const b = u8[i]
  if ((b & 0x80) === 0) return n
  if ((b & 0xC0) === 0x80) {
    while (i > 0 && (u8[i] & 0xC0) === 0x80) i--
    const start = u8[i]
    const need = (start & 0xE0) === 0xC0 ? 2 : (start & 0xF0) === 0xE0 ? 3 : (start & 0xF8) === 0xF0 ? 4 : 1
    return (n - i >= need) ? n : i
  }
  return n - 1
}

module.exports = {
  utf8BytesToString,
  getUtf8SafeDecodeLength
}
