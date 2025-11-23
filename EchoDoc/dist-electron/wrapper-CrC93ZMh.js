import Ze from "events";
import ht from "https";
import Qe from "http";
import ct from "net";
import ut from "tls";
import we from "crypto";
import se from "stream";
import dt from "url";
import _t from "zlib";
import { r as mt, a as pt, g as gt } from "./main-z0vDQMnQ.js";
import yt from "buffer";
var te = { exports: {} }, de, Ae;
function V() {
  if (Ae) return de;
  Ae = 1;
  const P = ["nodebuffer", "arraybuffer", "fragments"], T = typeof Blob < "u";
  return T && P.push("blob"), de = {
    BINARY_TYPES: P,
    EMPTY_BUFFER: Buffer.alloc(0),
    GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
    hasBlob: T,
    kForOnEventAttribute: Symbol("kIsForOnEventAttribute"),
    kListener: Symbol("kListener"),
    kStatusCode: Symbol("status-code"),
    kWebSocket: Symbol("websocket"),
    NOOP: () => {
    }
  }, de;
}
var Fe;
function oe() {
  if (Fe) return te.exports;
  Fe = 1;
  const { EMPTY_BUFFER: P } = V(), T = Buffer[Symbol.species];
  function M(l, a) {
    if (l.length === 0) return P;
    if (l.length === 1) return l[0];
    const _ = Buffer.allocUnsafe(a);
    let h = 0;
    for (let C = 0; C < l.length; C++) {
      const c = l[C];
      _.set(c, h), h += c.length;
    }
    return h < a ? new T(_.buffer, _.byteOffset, h) : _;
  }
  function B(l, a, _, h, C) {
    for (let c = 0; c < C; c++)
      _[h + c] = l[c] ^ a[c & 3];
  }
  function b(l, a) {
    for (let _ = 0; _ < l.length; _++)
      l[_] ^= a[_ & 3];
  }
  function d(l) {
    return l.length === l.buffer.byteLength ? l.buffer : l.buffer.slice(l.byteOffset, l.byteOffset + l.length);
  }
  function n(l) {
    if (n.readOnly = !0, Buffer.isBuffer(l)) return l;
    let a;
    return l instanceof ArrayBuffer ? a = new T(l) : ArrayBuffer.isView(l) ? a = new T(l.buffer, l.byteOffset, l.byteLength) : (a = Buffer.from(l), n.readOnly = !1), a;
  }
  if (te.exports = {
    concat: M,
    mask: B,
    toArrayBuffer: d,
    toBuffer: n,
    unmask: b
  }, !process.env.WS_NO_BUFFER_UTIL)
    try {
      const l = mt;
      te.exports.mask = function(a, _, h, C, c) {
        c < 48 ? B(a, _, h, C, c) : l.mask(a, _, h, C, c);
      }, te.exports.unmask = function(a, _) {
        a.length < 32 ? b(a, _) : l.unmask(a, _);
      };
    } catch {
    }
  return te.exports;
}
var _e, $e;
function Et() {
  if ($e) return _e;
  $e = 1;
  const P = Symbol("kDone"), T = Symbol("kRun");
  class M {
    /**
     * Creates a new `Limiter`.
     *
     * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
     *     to run concurrently
     */
    constructor(b) {
      this[P] = () => {
        this.pending--, this[T]();
      }, this.concurrency = b || 1 / 0, this.jobs = [], this.pending = 0;
    }
    /**
     * Adds a job to the queue.
     *
     * @param {Function} job The job to run
     * @public
     */
    add(b) {
      this.jobs.push(b), this[T]();
    }
    /**
     * Removes a job from the queue and runs it if possible.
     *
     * @private
     */
    [T]() {
      if (this.pending !== this.concurrency && this.jobs.length) {
        const b = this.jobs.shift();
        this.pending++, b(this[P]);
      }
    }
  }
  return _e = M, _e;
}
var me, We;
function ae() {
  if (We) return me;
  We = 1;
  const P = _t, T = oe(), M = Et(), { kStatusCode: B } = V(), b = Buffer[Symbol.species], d = Buffer.from([0, 0, 255, 255]), n = Symbol("permessage-deflate"), l = Symbol("total-length"), a = Symbol("callback"), _ = Symbol("buffers"), h = Symbol("error");
  let C;
  class c {
    /**
     * Creates a PerMessageDeflate instance.
     *
     * @param {Object} [options] Configuration options
     * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
     *     for, or request, a custom client window size
     * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
     *     acknowledge disabling of client context takeover
     * @param {Number} [options.concurrencyLimit=10] The number of concurrent
     *     calls to zlib
     * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
     *     use of a custom server window size
     * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
     *     disabling of server context takeover
     * @param {Number} [options.threshold=1024] Size (in bytes) below which
     *     messages should not be compressed if context takeover is disabled
     * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
     *     deflate
     * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
     *     inflate
     * @param {Boolean} [isServer=false] Create the instance in either server or
     *     client mode
     * @param {Number} [maxPayload=0] The maximum allowed message length
     */
    constructor(m, f, E) {
      if (this._maxPayload = E | 0, this._options = m || {}, this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024, this._isServer = !!f, this._deflate = null, this._inflate = null, this.params = null, !C) {
        const u = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
        C = new M(u);
      }
    }
    /**
     * @type {String}
     */
    static get extensionName() {
      return "permessage-deflate";
    }
    /**
     * Create an extension negotiation offer.
     *
     * @return {Object} Extension parameters
     * @public
     */
    offer() {
      const m = {};
      return this._options.serverNoContextTakeover && (m.server_no_context_takeover = !0), this._options.clientNoContextTakeover && (m.client_no_context_takeover = !0), this._options.serverMaxWindowBits && (m.server_max_window_bits = this._options.serverMaxWindowBits), this._options.clientMaxWindowBits ? m.client_max_window_bits = this._options.clientMaxWindowBits : this._options.clientMaxWindowBits == null && (m.client_max_window_bits = !0), m;
    }
    /**
     * Accept an extension negotiation offer/response.
     *
     * @param {Array} configurations The extension negotiation offers/reponse
     * @return {Object} Accepted configuration
     * @public
     */
    accept(m) {
      return m = this.normalizeParams(m), this.params = this._isServer ? this.acceptAsServer(m) : this.acceptAsClient(m), this.params;
    }
    /**
     * Releases all resources used by the extension.
     *
     * @public
     */
    cleanup() {
      if (this._inflate && (this._inflate.close(), this._inflate = null), this._deflate) {
        const m = this._deflate[a];
        this._deflate.close(), this._deflate = null, m && m(
          new Error(
            "The deflate stream was closed while data was being processed"
          )
        );
      }
    }
    /**
     *  Accept an extension negotiation offer.
     *
     * @param {Array} offers The extension negotiation offers
     * @return {Object} Accepted configuration
     * @private
     */
    acceptAsServer(m) {
      const f = this._options, E = m.find((u) => !(f.serverNoContextTakeover === !1 && u.server_no_context_takeover || u.server_max_window_bits && (f.serverMaxWindowBits === !1 || typeof f.serverMaxWindowBits == "number" && f.serverMaxWindowBits > u.server_max_window_bits) || typeof f.clientMaxWindowBits == "number" && !u.client_max_window_bits));
      if (!E)
        throw new Error("None of the extension offers can be accepted");
      return f.serverNoContextTakeover && (E.server_no_context_takeover = !0), f.clientNoContextTakeover && (E.client_no_context_takeover = !0), typeof f.serverMaxWindowBits == "number" && (E.server_max_window_bits = f.serverMaxWindowBits), typeof f.clientMaxWindowBits == "number" ? E.client_max_window_bits = f.clientMaxWindowBits : (E.client_max_window_bits === !0 || f.clientMaxWindowBits === !1) && delete E.client_max_window_bits, E;
    }
    /**
     * Accept the extension negotiation response.
     *
     * @param {Array} response The extension negotiation response
     * @return {Object} Accepted configuration
     * @private
     */
    acceptAsClient(m) {
      const f = m[0];
      if (this._options.clientNoContextTakeover === !1 && f.client_no_context_takeover)
        throw new Error('Unexpected parameter "client_no_context_takeover"');
      if (!f.client_max_window_bits)
        typeof this._options.clientMaxWindowBits == "number" && (f.client_max_window_bits = this._options.clientMaxWindowBits);
      else if (this._options.clientMaxWindowBits === !1 || typeof this._options.clientMaxWindowBits == "number" && f.client_max_window_bits > this._options.clientMaxWindowBits)
        throw new Error(
          'Unexpected or invalid parameter "client_max_window_bits"'
        );
      return f;
    }
    /**
     * Normalize parameters.
     *
     * @param {Array} configurations The extension negotiation offers/reponse
     * @return {Array} The offers/response with normalized parameters
     * @private
     */
    normalizeParams(m) {
      return m.forEach((f) => {
        Object.keys(f).forEach((E) => {
          let u = f[E];
          if (u.length > 1)
            throw new Error(`Parameter "${E}" must have only a single value`);
          if (u = u[0], E === "client_max_window_bits") {
            if (u !== !0) {
              const e = +u;
              if (!Number.isInteger(e) || e < 8 || e > 15)
                throw new TypeError(
                  `Invalid value for parameter "${E}": ${u}`
                );
              u = e;
            } else if (!this._isServer)
              throw new TypeError(
                `Invalid value for parameter "${E}": ${u}`
              );
          } else if (E === "server_max_window_bits") {
            const e = +u;
            if (!Number.isInteger(e) || e < 8 || e > 15)
              throw new TypeError(
                `Invalid value for parameter "${E}": ${u}`
              );
            u = e;
          } else if (E === "client_no_context_takeover" || E === "server_no_context_takeover") {
            if (u !== !0)
              throw new TypeError(
                `Invalid value for parameter "${E}": ${u}`
              );
          } else
            throw new Error(`Unknown parameter "${E}"`);
          f[E] = u;
        });
      }), m;
    }
    /**
     * Decompress data. Concurrency limited.
     *
     * @param {Buffer} data Compressed data
     * @param {Boolean} fin Specifies whether or not this is the last fragment
     * @param {Function} callback Callback
     * @public
     */
    decompress(m, f, E) {
      C.add((u) => {
        this._decompress(m, f, (e, t) => {
          u(), E(e, t);
        });
      });
    }
    /**
     * Compress data. Concurrency limited.
     *
     * @param {(Buffer|String)} data Data to compress
     * @param {Boolean} fin Specifies whether or not this is the last fragment
     * @param {Function} callback Callback
     * @public
     */
    compress(m, f, E) {
      C.add((u) => {
        this._compress(m, f, (e, t) => {
          u(), E(e, t);
        });
      });
    }
    /**
     * Decompress data.
     *
     * @param {Buffer} data Compressed data
     * @param {Boolean} fin Specifies whether or not this is the last fragment
     * @param {Function} callback Callback
     * @private
     */
    _decompress(m, f, E) {
      const u = this._isServer ? "client" : "server";
      if (!this._inflate) {
        const e = `${u}_max_window_bits`, t = typeof this.params[e] != "number" ? P.Z_DEFAULT_WINDOWBITS : this.params[e];
        this._inflate = P.createInflateRaw({
          ...this._options.zlibInflateOptions,
          windowBits: t
        }), this._inflate[n] = this, this._inflate[l] = 0, this._inflate[_] = [], this._inflate.on("error", x), this._inflate.on("data", k);
      }
      this._inflate[a] = E, this._inflate.write(m), f && this._inflate.write(d), this._inflate.flush(() => {
        const e = this._inflate[h];
        if (e) {
          this._inflate.close(), this._inflate = null, E(e);
          return;
        }
        const t = T.concat(
          this._inflate[_],
          this._inflate[l]
        );
        this._inflate._readableState.endEmitted ? (this._inflate.close(), this._inflate = null) : (this._inflate[l] = 0, this._inflate[_] = [], f && this.params[`${u}_no_context_takeover`] && this._inflate.reset()), E(null, t);
      });
    }
    /**
     * Compress data.
     *
     * @param {(Buffer|String)} data Data to compress
     * @param {Boolean} fin Specifies whether or not this is the last fragment
     * @param {Function} callback Callback
     * @private
     */
    _compress(m, f, E) {
      const u = this._isServer ? "server" : "client";
      if (!this._deflate) {
        const e = `${u}_max_window_bits`, t = typeof this.params[e] != "number" ? P.Z_DEFAULT_WINDOWBITS : this.params[e];
        this._deflate = P.createDeflateRaw({
          ...this._options.zlibDeflateOptions,
          windowBits: t
        }), this._deflate[l] = 0, this._deflate[_] = [], this._deflate.on("data", w);
      }
      this._deflate[a] = E, this._deflate.write(m), this._deflate.flush(P.Z_SYNC_FLUSH, () => {
        if (!this._deflate)
          return;
        let e = T.concat(
          this._deflate[_],
          this._deflate[l]
        );
        f && (e = new b(e.buffer, e.byteOffset, e.length - 4)), this._deflate[a] = null, this._deflate[l] = 0, this._deflate[_] = [], f && this.params[`${u}_no_context_takeover`] && this._deflate.reset(), E(null, e);
      });
    }
  }
  me = c;
  function w(O) {
    this[_].push(O), this[l] += O.length;
  }
  function k(O) {
    if (this[l] += O.length, this[n]._maxPayload < 1 || this[l] <= this[n]._maxPayload) {
      this[_].push(O);
      return;
    }
    this[h] = new RangeError("Max payload size exceeded"), this[h].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH", this[h][B] = 1009, this.removeListener("data", k), this.reset();
  }
  function x(O) {
    if (this[n]._inflate = null, this[h]) {
      this[a](this[h]);
      return;
    }
    O[B] = 1007, this[a](O);
  }
  return me;
}
var re = { exports: {} }, Ge;
function ie() {
  if (Ge) return re.exports;
  Ge = 1;
  const { isUtf8: P } = yt, { hasBlob: T } = V(), M = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    // 0 - 15
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    // 16 - 31
    0,
    1,
    0,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    1,
    0,
    // 32 - 47
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    // 48 - 63
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    // 64 - 79
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    1,
    1,
    // 80 - 95
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    // 96 - 111
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    1,
    0,
    1,
    0
    // 112 - 127
  ];
  function B(n) {
    return n >= 1e3 && n <= 1014 && n !== 1004 && n !== 1005 && n !== 1006 || n >= 3e3 && n <= 4999;
  }
  function b(n) {
    const l = n.length;
    let a = 0;
    for (; a < l; )
      if ((n[a] & 128) === 0)
        a++;
      else if ((n[a] & 224) === 192) {
        if (a + 1 === l || (n[a + 1] & 192) !== 128 || (n[a] & 254) === 192)
          return !1;
        a += 2;
      } else if ((n[a] & 240) === 224) {
        if (a + 2 >= l || (n[a + 1] & 192) !== 128 || (n[a + 2] & 192) !== 128 || n[a] === 224 && (n[a + 1] & 224) === 128 || // Overlong
        n[a] === 237 && (n[a + 1] & 224) === 160)
          return !1;
        a += 3;
      } else if ((n[a] & 248) === 240) {
        if (a + 3 >= l || (n[a + 1] & 192) !== 128 || (n[a + 2] & 192) !== 128 || (n[a + 3] & 192) !== 128 || n[a] === 240 && (n[a + 1] & 240) === 128 || // Overlong
        n[a] === 244 && n[a + 1] > 143 || n[a] > 244)
          return !1;
        a += 4;
      } else
        return !1;
    return !0;
  }
  function d(n) {
    return T && typeof n == "object" && typeof n.arrayBuffer == "function" && typeof n.type == "string" && typeof n.stream == "function" && (n[Symbol.toStringTag] === "Blob" || n[Symbol.toStringTag] === "File");
  }
  if (re.exports = {
    isBlob: d,
    isValidStatusCode: B,
    isValidUTF8: b,
    tokenChars: M
  }, P)
    re.exports.isValidUTF8 = function(n) {
      return n.length < 24 ? b(n) : P(n);
    };
  else if (!process.env.WS_NO_UTF_8_VALIDATE)
    try {
      const n = pt;
      re.exports.isValidUTF8 = function(l) {
        return l.length < 32 ? b(l) : n(l);
      };
    } catch {
    }
  return re.exports;
}
var pe, je;
function Je() {
  if (je) return pe;
  je = 1;
  const { Writable: P } = se, T = ae(), {
    BINARY_TYPES: M,
    EMPTY_BUFFER: B,
    kStatusCode: b,
    kWebSocket: d
  } = V(), { concat: n, toArrayBuffer: l, unmask: a } = oe(), { isValidStatusCode: _, isValidUTF8: h } = ie(), C = Buffer[Symbol.species], c = 0, w = 1, k = 2, x = 3, O = 4, m = 5, f = 6;
  class E extends P {
    /**
     * Creates a Receiver instance.
     *
     * @param {Object} [options] Options object
     * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
     *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
     *     multiple times in the same tick
     * @param {String} [options.binaryType=nodebuffer] The type for binary data
     * @param {Object} [options.extensions] An object containing the negotiated
     *     extensions
     * @param {Boolean} [options.isServer=false] Specifies whether to operate in
     *     client or server mode
     * @param {Number} [options.maxPayload=0] The maximum allowed message length
     * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
     *     not to skip UTF-8 validation for text and close messages
     */
    constructor(e = {}) {
      super(), this._allowSynchronousEvents = e.allowSynchronousEvents !== void 0 ? e.allowSynchronousEvents : !0, this._binaryType = e.binaryType || M[0], this._extensions = e.extensions || {}, this._isServer = !!e.isServer, this._maxPayload = e.maxPayload | 0, this._skipUTF8Validation = !!e.skipUTF8Validation, this[d] = void 0, this._bufferedBytes = 0, this._buffers = [], this._compressed = !1, this._payloadLength = 0, this._mask = void 0, this._fragmented = 0, this._masked = !1, this._fin = !1, this._opcode = 0, this._totalPayloadLength = 0, this._messageLength = 0, this._fragments = [], this._errored = !1, this._loop = !1, this._state = c;
    }
    /**
     * Implements `Writable.prototype._write()`.
     *
     * @param {Buffer} chunk The chunk of data to write
     * @param {String} encoding The character encoding of `chunk`
     * @param {Function} cb Callback
     * @private
     */
    _write(e, t, i) {
      if (this._opcode === 8 && this._state == c) return i();
      this._bufferedBytes += e.length, this._buffers.push(e), this.startLoop(i);
    }
    /**
     * Consumes `n` bytes from the buffered data.
     *
     * @param {Number} n The number of bytes to consume
     * @return {Buffer} The consumed bytes
     * @private
     */
    consume(e) {
      if (this._bufferedBytes -= e, e === this._buffers[0].length) return this._buffers.shift();
      if (e < this._buffers[0].length) {
        const i = this._buffers[0];
        return this._buffers[0] = new C(
          i.buffer,
          i.byteOffset + e,
          i.length - e
        ), new C(i.buffer, i.byteOffset, e);
      }
      const t = Buffer.allocUnsafe(e);
      do {
        const i = this._buffers[0], s = t.length - e;
        e >= i.length ? t.set(this._buffers.shift(), s) : (t.set(new Uint8Array(i.buffer, i.byteOffset, e), s), this._buffers[0] = new C(
          i.buffer,
          i.byteOffset + e,
          i.length - e
        )), e -= i.length;
      } while (e > 0);
      return t;
    }
    /**
     * Starts the parsing loop.
     *
     * @param {Function} cb Callback
     * @private
     */
    startLoop(e) {
      this._loop = !0;
      do
        switch (this._state) {
          case c:
            this.getInfo(e);
            break;
          case w:
            this.getPayloadLength16(e);
            break;
          case k:
            this.getPayloadLength64(e);
            break;
          case x:
            this.getMask();
            break;
          case O:
            this.getData(e);
            break;
          case m:
          case f:
            this._loop = !1;
            return;
        }
      while (this._loop);
      this._errored || e();
    }
    /**
     * Reads the first two bytes of a frame.
     *
     * @param {Function} cb Callback
     * @private
     */
    getInfo(e) {
      if (this._bufferedBytes < 2) {
        this._loop = !1;
        return;
      }
      const t = this.consume(2);
      if ((t[0] & 48) !== 0) {
        const s = this.createError(
          RangeError,
          "RSV2 and RSV3 must be clear",
          !0,
          1002,
          "WS_ERR_UNEXPECTED_RSV_2_3"
        );
        e(s);
        return;
      }
      const i = (t[0] & 64) === 64;
      if (i && !this._extensions[T.extensionName]) {
        const s = this.createError(
          RangeError,
          "RSV1 must be clear",
          !0,
          1002,
          "WS_ERR_UNEXPECTED_RSV_1"
        );
        e(s);
        return;
      }
      if (this._fin = (t[0] & 128) === 128, this._opcode = t[0] & 15, this._payloadLength = t[1] & 127, this._opcode === 0) {
        if (i) {
          const s = this.createError(
            RangeError,
            "RSV1 must be clear",
            !0,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          e(s);
          return;
        }
        if (!this._fragmented) {
          const s = this.createError(
            RangeError,
            "invalid opcode 0",
            !0,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          e(s);
          return;
        }
        this._opcode = this._fragmented;
      } else if (this._opcode === 1 || this._opcode === 2) {
        if (this._fragmented) {
          const s = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            !0,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          e(s);
          return;
        }
        this._compressed = i;
      } else if (this._opcode > 7 && this._opcode < 11) {
        if (!this._fin) {
          const s = this.createError(
            RangeError,
            "FIN must be set",
            !0,
            1002,
            "WS_ERR_EXPECTED_FIN"
          );
          e(s);
          return;
        }
        if (i) {
          const s = this.createError(
            RangeError,
            "RSV1 must be clear",
            !0,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          e(s);
          return;
        }
        if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
          const s = this.createError(
            RangeError,
            `invalid payload length ${this._payloadLength}`,
            !0,
            1002,
            "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
          );
          e(s);
          return;
        }
      } else {
        const s = this.createError(
          RangeError,
          `invalid opcode ${this._opcode}`,
          !0,
          1002,
          "WS_ERR_INVALID_OPCODE"
        );
        e(s);
        return;
      }
      if (!this._fin && !this._fragmented && (this._fragmented = this._opcode), this._masked = (t[1] & 128) === 128, this._isServer) {
        if (!this._masked) {
          const s = this.createError(
            RangeError,
            "MASK must be set",
            !0,
            1002,
            "WS_ERR_EXPECTED_MASK"
          );
          e(s);
          return;
        }
      } else if (this._masked) {
        const s = this.createError(
          RangeError,
          "MASK must be clear",
          !0,
          1002,
          "WS_ERR_UNEXPECTED_MASK"
        );
        e(s);
        return;
      }
      this._payloadLength === 126 ? this._state = w : this._payloadLength === 127 ? this._state = k : this.haveLength(e);
    }
    /**
     * Gets extended payload length (7+16).
     *
     * @param {Function} cb Callback
     * @private
     */
    getPayloadLength16(e) {
      if (this._bufferedBytes < 2) {
        this._loop = !1;
        return;
      }
      this._payloadLength = this.consume(2).readUInt16BE(0), this.haveLength(e);
    }
    /**
     * Gets extended payload length (7+64).
     *
     * @param {Function} cb Callback
     * @private
     */
    getPayloadLength64(e) {
      if (this._bufferedBytes < 8) {
        this._loop = !1;
        return;
      }
      const t = this.consume(8), i = t.readUInt32BE(0);
      if (i > Math.pow(2, 21) - 1) {
        const s = this.createError(
          RangeError,
          "Unsupported WebSocket frame: payload length > 2^53 - 1",
          !1,
          1009,
          "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
        );
        e(s);
        return;
      }
      this._payloadLength = i * Math.pow(2, 32) + t.readUInt32BE(4), this.haveLength(e);
    }
    /**
     * Payload length has been read.
     *
     * @param {Function} cb Callback
     * @private
     */
    haveLength(e) {
      if (this._payloadLength && this._opcode < 8 && (this._totalPayloadLength += this._payloadLength, this._totalPayloadLength > this._maxPayload && this._maxPayload > 0)) {
        const t = this.createError(
          RangeError,
          "Max payload size exceeded",
          !1,
          1009,
          "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
        );
        e(t);
        return;
      }
      this._masked ? this._state = x : this._state = O;
    }
    /**
     * Reads mask bytes.
     *
     * @private
     */
    getMask() {
      if (this._bufferedBytes < 4) {
        this._loop = !1;
        return;
      }
      this._mask = this.consume(4), this._state = O;
    }
    /**
     * Reads data bytes.
     *
     * @param {Function} cb Callback
     * @private
     */
    getData(e) {
      let t = B;
      if (this._payloadLength) {
        if (this._bufferedBytes < this._payloadLength) {
          this._loop = !1;
          return;
        }
        t = this.consume(this._payloadLength), this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0 && a(t, this._mask);
      }
      if (this._opcode > 7) {
        this.controlMessage(t, e);
        return;
      }
      if (this._compressed) {
        this._state = m, this.decompress(t, e);
        return;
      }
      t.length && (this._messageLength = this._totalPayloadLength, this._fragments.push(t)), this.dataMessage(e);
    }
    /**
     * Decompresses data.
     *
     * @param {Buffer} data Compressed data
     * @param {Function} cb Callback
     * @private
     */
    decompress(e, t) {
      this._extensions[T.extensionName].decompress(e, this._fin, (s, p) => {
        if (s) return t(s);
        if (p.length) {
          if (this._messageLength += p.length, this._messageLength > this._maxPayload && this._maxPayload > 0) {
            const y = this.createError(
              RangeError,
              "Max payload size exceeded",
              !1,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            t(y);
            return;
          }
          this._fragments.push(p);
        }
        this.dataMessage(t), this._state === c && this.startLoop(t);
      });
    }
    /**
     * Handles a data message.
     *
     * @param {Function} cb Callback
     * @private
     */
    dataMessage(e) {
      if (!this._fin) {
        this._state = c;
        return;
      }
      const t = this._messageLength, i = this._fragments;
      if (this._totalPayloadLength = 0, this._messageLength = 0, this._fragmented = 0, this._fragments = [], this._opcode === 2) {
        let s;
        this._binaryType === "nodebuffer" ? s = n(i, t) : this._binaryType === "arraybuffer" ? s = l(n(i, t)) : this._binaryType === "blob" ? s = new Blob(i) : s = i, this._allowSynchronousEvents ? (this.emit("message", s, !0), this._state = c) : (this._state = f, setImmediate(() => {
          this.emit("message", s, !0), this._state = c, this.startLoop(e);
        }));
      } else {
        const s = n(i, t);
        if (!this._skipUTF8Validation && !h(s)) {
          const p = this.createError(
            Error,
            "invalid UTF-8 sequence",
            !0,
            1007,
            "WS_ERR_INVALID_UTF8"
          );
          e(p);
          return;
        }
        this._state === m || this._allowSynchronousEvents ? (this.emit("message", s, !1), this._state = c) : (this._state = f, setImmediate(() => {
          this.emit("message", s, !1), this._state = c, this.startLoop(e);
        }));
      }
    }
    /**
     * Handles a control message.
     *
     * @param {Buffer} data Data to handle
     * @return {(Error|RangeError|undefined)} A possible error
     * @private
     */
    controlMessage(e, t) {
      if (this._opcode === 8) {
        if (e.length === 0)
          this._loop = !1, this.emit("conclude", 1005, B), this.end();
        else {
          const i = e.readUInt16BE(0);
          if (!_(i)) {
            const p = this.createError(
              RangeError,
              `invalid status code ${i}`,
              !0,
              1002,
              "WS_ERR_INVALID_CLOSE_CODE"
            );
            t(p);
            return;
          }
          const s = new C(
            e.buffer,
            e.byteOffset + 2,
            e.length - 2
          );
          if (!this._skipUTF8Validation && !h(s)) {
            const p = this.createError(
              Error,
              "invalid UTF-8 sequence",
              !0,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            t(p);
            return;
          }
          this._loop = !1, this.emit("conclude", i, s), this.end();
        }
        this._state = c;
        return;
      }
      this._allowSynchronousEvents ? (this.emit(this._opcode === 9 ? "ping" : "pong", e), this._state = c) : (this._state = f, setImmediate(() => {
        this.emit(this._opcode === 9 ? "ping" : "pong", e), this._state = c, this.startLoop(t);
      }));
    }
    /**
     * Builds an error object.
     *
     * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
     * @param {String} message The error message
     * @param {Boolean} prefix Specifies whether or not to add a default prefix to
     *     `message`
     * @param {Number} statusCode The status code
     * @param {String} errorCode The exposed error code
     * @return {(Error|RangeError)} The error
     * @private
     */
    createError(e, t, i, s, p) {
      this._loop = !1, this._errored = !0;
      const y = new e(
        i ? `Invalid WebSocket frame: ${t}` : t
      );
      return Error.captureStackTrace(y, this.createError), y.code = p, y[b] = s, y;
    }
  }
  return pe = E, pe;
}
var ge, Ve;
function et() {
  if (Ve) return ge;
  Ve = 1;
  const { Duplex: P } = se, { randomFillSync: T } = we, M = ae(), { EMPTY_BUFFER: B, kWebSocket: b, NOOP: d } = V(), { isBlob: n, isValidStatusCode: l } = ie(), { mask: a, toBuffer: _ } = oe(), h = Symbol("kByteLength"), C = Buffer.alloc(4), c = 8 * 1024;
  let w, k = c;
  const x = 0, O = 1, m = 2;
  class f {
    /**
     * Creates a Sender instance.
     *
     * @param {Duplex} socket The connection socket
     * @param {Object} [extensions] An object containing the negotiated extensions
     * @param {Function} [generateMask] The function used to generate the masking
     *     key
     */
    constructor(t, i, s) {
      this._extensions = i || {}, s && (this._generateMask = s, this._maskBuffer = Buffer.alloc(4)), this._socket = t, this._firstFragment = !0, this._compress = !1, this._bufferedBytes = 0, this._queue = [], this._state = x, this.onerror = d, this[b] = void 0;
    }
    /**
     * Frames a piece of data according to the HyBi WebSocket protocol.
     *
     * @param {(Buffer|String)} data The data to frame
     * @param {Object} options Options object
     * @param {Boolean} [options.fin=false] Specifies whether or not to set the
     *     FIN bit
     * @param {Function} [options.generateMask] The function used to generate the
     *     masking key
     * @param {Boolean} [options.mask=false] Specifies whether or not to mask
     *     `data`
     * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
     *     key
     * @param {Number} options.opcode The opcode
     * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
     *     modified
     * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
     *     RSV1 bit
     * @return {(Buffer|String)[]} The framed data
     * @public
     */
    static frame(t, i) {
      let s, p = !1, y = 2, R = !1;
      i.mask && (s = i.maskBuffer || C, i.generateMask ? i.generateMask(s) : (k === c && (w === void 0 && (w = Buffer.alloc(c)), T(w, 0, c), k = 0), s[0] = w[k++], s[1] = w[k++], s[2] = w[k++], s[3] = w[k++]), R = (s[0] | s[1] | s[2] | s[3]) === 0, y = 6);
      let U;
      typeof t == "string" ? (!i.mask || R) && i[h] !== void 0 ? U = i[h] : (t = Buffer.from(t), U = t.length) : (U = t.length, p = i.mask && i.readOnly && !R);
      let A = U;
      U >= 65536 ? (y += 8, A = 127) : U > 125 && (y += 2, A = 126);
      const N = Buffer.allocUnsafe(p ? U + y : y);
      return N[0] = i.fin ? i.opcode | 128 : i.opcode, i.rsv1 && (N[0] |= 64), N[1] = A, A === 126 ? N.writeUInt16BE(U, 2) : A === 127 && (N[2] = N[3] = 0, N.writeUIntBE(U, 4, 6)), i.mask ? (N[1] |= 128, N[y - 4] = s[0], N[y - 3] = s[1], N[y - 2] = s[2], N[y - 1] = s[3], R ? [N, t] : p ? (a(t, s, N, y, U), [N]) : (a(t, s, t, 0, U), [N, t])) : [N, t];
    }
    /**
     * Sends a close message to the other peer.
     *
     * @param {Number} [code] The status code component of the body
     * @param {(String|Buffer)} [data] The message component of the body
     * @param {Boolean} [mask=false] Specifies whether or not to mask the message
     * @param {Function} [cb] Callback
     * @public
     */
    close(t, i, s, p) {
      let y;
      if (t === void 0)
        y = B;
      else {
        if (typeof t != "number" || !l(t))
          throw new TypeError("First argument must be a valid error code number");
        if (i === void 0 || !i.length)
          y = Buffer.allocUnsafe(2), y.writeUInt16BE(t, 0);
        else {
          const U = Buffer.byteLength(i);
          if (U > 123)
            throw new RangeError("The message must not be greater than 123 bytes");
          y = Buffer.allocUnsafe(2 + U), y.writeUInt16BE(t, 0), typeof i == "string" ? y.write(i, 2) : y.set(i, 2);
        }
      }
      const R = {
        [h]: y.length,
        fin: !0,
        generateMask: this._generateMask,
        mask: s,
        maskBuffer: this._maskBuffer,
        opcode: 8,
        readOnly: !1,
        rsv1: !1
      };
      this._state !== x ? this.enqueue([this.dispatch, y, !1, R, p]) : this.sendFrame(f.frame(y, R), p);
    }
    /**
     * Sends a ping message to the other peer.
     *
     * @param {*} data The message to send
     * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
     * @param {Function} [cb] Callback
     * @public
     */
    ping(t, i, s) {
      let p, y;
      if (typeof t == "string" ? (p = Buffer.byteLength(t), y = !1) : n(t) ? (p = t.size, y = !1) : (t = _(t), p = t.length, y = _.readOnly), p > 125)
        throw new RangeError("The data size must not be greater than 125 bytes");
      const R = {
        [h]: p,
        fin: !0,
        generateMask: this._generateMask,
        mask: i,
        maskBuffer: this._maskBuffer,
        opcode: 9,
        readOnly: y,
        rsv1: !1
      };
      n(t) ? this._state !== x ? this.enqueue([this.getBlobData, t, !1, R, s]) : this.getBlobData(t, !1, R, s) : this._state !== x ? this.enqueue([this.dispatch, t, !1, R, s]) : this.sendFrame(f.frame(t, R), s);
    }
    /**
     * Sends a pong message to the other peer.
     *
     * @param {*} data The message to send
     * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
     * @param {Function} [cb] Callback
     * @public
     */
    pong(t, i, s) {
      let p, y;
      if (typeof t == "string" ? (p = Buffer.byteLength(t), y = !1) : n(t) ? (p = t.size, y = !1) : (t = _(t), p = t.length, y = _.readOnly), p > 125)
        throw new RangeError("The data size must not be greater than 125 bytes");
      const R = {
        [h]: p,
        fin: !0,
        generateMask: this._generateMask,
        mask: i,
        maskBuffer: this._maskBuffer,
        opcode: 10,
        readOnly: y,
        rsv1: !1
      };
      n(t) ? this._state !== x ? this.enqueue([this.getBlobData, t, !1, R, s]) : this.getBlobData(t, !1, R, s) : this._state !== x ? this.enqueue([this.dispatch, t, !1, R, s]) : this.sendFrame(f.frame(t, R), s);
    }
    /**
     * Sends a data message to the other peer.
     *
     * @param {*} data The message to send
     * @param {Object} options Options object
     * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
     *     or text
     * @param {Boolean} [options.compress=false] Specifies whether or not to
     *     compress `data`
     * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
     *     last one
     * @param {Boolean} [options.mask=false] Specifies whether or not to mask
     *     `data`
     * @param {Function} [cb] Callback
     * @public
     */
    send(t, i, s) {
      const p = this._extensions[M.extensionName];
      let y = i.binary ? 2 : 1, R = i.compress, U, A;
      typeof t == "string" ? (U = Buffer.byteLength(t), A = !1) : n(t) ? (U = t.size, A = !1) : (t = _(t), U = t.length, A = _.readOnly), this._firstFragment ? (this._firstFragment = !1, R && p && p.params[p._isServer ? "server_no_context_takeover" : "client_no_context_takeover"] && (R = U >= p._threshold), this._compress = R) : (R = !1, y = 0), i.fin && (this._firstFragment = !0);
      const N = {
        [h]: U,
        fin: i.fin,
        generateMask: this._generateMask,
        mask: i.mask,
        maskBuffer: this._maskBuffer,
        opcode: y,
        readOnly: A,
        rsv1: R
      };
      n(t) ? this._state !== x ? this.enqueue([this.getBlobData, t, this._compress, N, s]) : this.getBlobData(t, this._compress, N, s) : this._state !== x ? this.enqueue([this.dispatch, t, this._compress, N, s]) : this.dispatch(t, this._compress, N, s);
    }
    /**
     * Gets the contents of a blob as binary data.
     *
     * @param {Blob} blob The blob
     * @param {Boolean} [compress=false] Specifies whether or not to compress
     *     the data
     * @param {Object} options Options object
     * @param {Boolean} [options.fin=false] Specifies whether or not to set the
     *     FIN bit
     * @param {Function} [options.generateMask] The function used to generate the
     *     masking key
     * @param {Boolean} [options.mask=false] Specifies whether or not to mask
     *     `data`
     * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
     *     key
     * @param {Number} options.opcode The opcode
     * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
     *     modified
     * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
     *     RSV1 bit
     * @param {Function} [cb] Callback
     * @private
     */
    getBlobData(t, i, s, p) {
      this._bufferedBytes += s[h], this._state = m, t.arrayBuffer().then((y) => {
        if (this._socket.destroyed) {
          const U = new Error(
            "The socket was closed while the blob was being read"
          );
          process.nextTick(E, this, U, p);
          return;
        }
        this._bufferedBytes -= s[h];
        const R = _(y);
        i ? this.dispatch(R, i, s, p) : (this._state = x, this.sendFrame(f.frame(R, s), p), this.dequeue());
      }).catch((y) => {
        process.nextTick(u, this, y, p);
      });
    }
    /**
     * Dispatches a message.
     *
     * @param {(Buffer|String)} data The message to send
     * @param {Boolean} [compress=false] Specifies whether or not to compress
     *     `data`
     * @param {Object} options Options object
     * @param {Boolean} [options.fin=false] Specifies whether or not to set the
     *     FIN bit
     * @param {Function} [options.generateMask] The function used to generate the
     *     masking key
     * @param {Boolean} [options.mask=false] Specifies whether or not to mask
     *     `data`
     * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
     *     key
     * @param {Number} options.opcode The opcode
     * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
     *     modified
     * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
     *     RSV1 bit
     * @param {Function} [cb] Callback
     * @private
     */
    dispatch(t, i, s, p) {
      if (!i) {
        this.sendFrame(f.frame(t, s), p);
        return;
      }
      const y = this._extensions[M.extensionName];
      this._bufferedBytes += s[h], this._state = O, y.compress(t, s.fin, (R, U) => {
        if (this._socket.destroyed) {
          const A = new Error(
            "The socket was closed while data was being compressed"
          );
          E(this, A, p);
          return;
        }
        this._bufferedBytes -= s[h], this._state = x, s.readOnly = !1, this.sendFrame(f.frame(U, s), p), this.dequeue();
      });
    }
    /**
     * Executes queued send operations.
     *
     * @private
     */
    dequeue() {
      for (; this._state === x && this._queue.length; ) {
        const t = this._queue.shift();
        this._bufferedBytes -= t[3][h], Reflect.apply(t[0], this, t.slice(1));
      }
    }
    /**
     * Enqueues a send operation.
     *
     * @param {Array} params Send operation parameters.
     * @private
     */
    enqueue(t) {
      this._bufferedBytes += t[3][h], this._queue.push(t);
    }
    /**
     * Sends a frame.
     *
     * @param {(Buffer | String)[]} list The frame to send
     * @param {Function} [cb] Callback
     * @private
     */
    sendFrame(t, i) {
      t.length === 2 ? (this._socket.cork(), this._socket.write(t[0]), this._socket.write(t[1], i), this._socket.uncork()) : this._socket.write(t[0], i);
    }
  }
  ge = f;
  function E(e, t, i) {
    typeof i == "function" && i(t);
    for (let s = 0; s < e._queue.length; s++) {
      const p = e._queue[s], y = p[p.length - 1];
      typeof y == "function" && y(t);
    }
  }
  function u(e, t, i) {
    E(e, t, i), e.onerror(t);
  }
  return ge;
}
var ye, qe;
function St() {
  if (qe) return ye;
  qe = 1;
  const { kForOnEventAttribute: P, kListener: T } = V(), M = Symbol("kCode"), B = Symbol("kData"), b = Symbol("kError"), d = Symbol("kMessage"), n = Symbol("kReason"), l = Symbol("kTarget"), a = Symbol("kType"), _ = Symbol("kWasClean");
  class h {
    /**
     * Create a new `Event`.
     *
     * @param {String} type The name of the event
     * @throws {TypeError} If the `type` argument is not specified
     */
    constructor(m) {
      this[l] = null, this[a] = m;
    }
    /**
     * @type {*}
     */
    get target() {
      return this[l];
    }
    /**
     * @type {String}
     */
    get type() {
      return this[a];
    }
  }
  Object.defineProperty(h.prototype, "target", { enumerable: !0 }), Object.defineProperty(h.prototype, "type", { enumerable: !0 });
  class C extends h {
    /**
     * Create a new `CloseEvent`.
     *
     * @param {String} type The name of the event
     * @param {Object} [options] A dictionary object that allows for setting
     *     attributes via object members of the same name
     * @param {Number} [options.code=0] The status code explaining why the
     *     connection was closed
     * @param {String} [options.reason=''] A human-readable string explaining why
     *     the connection was closed
     * @param {Boolean} [options.wasClean=false] Indicates whether or not the
     *     connection was cleanly closed
     */
    constructor(m, f = {}) {
      super(m), this[M] = f.code === void 0 ? 0 : f.code, this[n] = f.reason === void 0 ? "" : f.reason, this[_] = f.wasClean === void 0 ? !1 : f.wasClean;
    }
    /**
     * @type {Number}
     */
    get code() {
      return this[M];
    }
    /**
     * @type {String}
     */
    get reason() {
      return this[n];
    }
    /**
     * @type {Boolean}
     */
    get wasClean() {
      return this[_];
    }
  }
  Object.defineProperty(C.prototype, "code", { enumerable: !0 }), Object.defineProperty(C.prototype, "reason", { enumerable: !0 }), Object.defineProperty(C.prototype, "wasClean", { enumerable: !0 });
  class c extends h {
    /**
     * Create a new `ErrorEvent`.
     *
     * @param {String} type The name of the event
     * @param {Object} [options] A dictionary object that allows for setting
     *     attributes via object members of the same name
     * @param {*} [options.error=null] The error that generated this event
     * @param {String} [options.message=''] The error message
     */
    constructor(m, f = {}) {
      super(m), this[b] = f.error === void 0 ? null : f.error, this[d] = f.message === void 0 ? "" : f.message;
    }
    /**
     * @type {*}
     */
    get error() {
      return this[b];
    }
    /**
     * @type {String}
     */
    get message() {
      return this[d];
    }
  }
  Object.defineProperty(c.prototype, "error", { enumerable: !0 }), Object.defineProperty(c.prototype, "message", { enumerable: !0 });
  class w extends h {
    /**
     * Create a new `MessageEvent`.
     *
     * @param {String} type The name of the event
     * @param {Object} [options] A dictionary object that allows for setting
     *     attributes via object members of the same name
     * @param {*} [options.data=null] The message content
     */
    constructor(m, f = {}) {
      super(m), this[B] = f.data === void 0 ? null : f.data;
    }
    /**
     * @type {*}
     */
    get data() {
      return this[B];
    }
  }
  Object.defineProperty(w.prototype, "data", { enumerable: !0 }), ye = {
    CloseEvent: C,
    ErrorEvent: c,
    Event: h,
    EventTarget: {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(O, m, f = {}) {
        for (const u of this.listeners(O))
          if (!f[P] && u[T] === m && !u[P])
            return;
        let E;
        if (O === "message")
          E = function(e, t) {
            const i = new w("message", {
              data: t ? e : e.toString()
            });
            i[l] = this, x(m, this, i);
          };
        else if (O === "close")
          E = function(e, t) {
            const i = new C("close", {
              code: e,
              reason: t.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            i[l] = this, x(m, this, i);
          };
        else if (O === "error")
          E = function(e) {
            const t = new c("error", {
              error: e,
              message: e.message
            });
            t[l] = this, x(m, this, t);
          };
        else if (O === "open")
          E = function() {
            const e = new h("open");
            e[l] = this, x(m, this, e);
          };
        else
          return;
        E[P] = !!f[P], E[T] = m, f.once ? this.once(O, E) : this.on(O, E);
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(O, m) {
        for (const f of this.listeners(O))
          if (f[T] === m && !f[P]) {
            this.removeListener(O, f);
            break;
          }
      }
    },
    MessageEvent: w
  };
  function x(O, m, f) {
    typeof O == "object" && O.handleEvent ? O.handleEvent.call(O, f) : O.call(m, f);
  }
  return ye;
}
var Ee, ze;
function tt() {
  if (ze) return Ee;
  ze = 1;
  const { tokenChars: P } = ie();
  function T(b, d, n) {
    b[d] === void 0 ? b[d] = [n] : b[d].push(n);
  }
  function M(b) {
    const d = /* @__PURE__ */ Object.create(null);
    let n = /* @__PURE__ */ Object.create(null), l = !1, a = !1, _ = !1, h, C, c = -1, w = -1, k = -1, x = 0;
    for (; x < b.length; x++)
      if (w = b.charCodeAt(x), h === void 0)
        if (k === -1 && P[w] === 1)
          c === -1 && (c = x);
        else if (x !== 0 && (w === 32 || w === 9))
          k === -1 && c !== -1 && (k = x);
        else if (w === 59 || w === 44) {
          if (c === -1)
            throw new SyntaxError(`Unexpected character at index ${x}`);
          k === -1 && (k = x);
          const m = b.slice(c, k);
          w === 44 ? (T(d, m, n), n = /* @__PURE__ */ Object.create(null)) : h = m, c = k = -1;
        } else
          throw new SyntaxError(`Unexpected character at index ${x}`);
      else if (C === void 0)
        if (k === -1 && P[w] === 1)
          c === -1 && (c = x);
        else if (w === 32 || w === 9)
          k === -1 && c !== -1 && (k = x);
        else if (w === 59 || w === 44) {
          if (c === -1)
            throw new SyntaxError(`Unexpected character at index ${x}`);
          k === -1 && (k = x), T(n, b.slice(c, k), !0), w === 44 && (T(d, h, n), n = /* @__PURE__ */ Object.create(null), h = void 0), c = k = -1;
        } else if (w === 61 && c !== -1 && k === -1)
          C = b.slice(c, x), c = k = -1;
        else
          throw new SyntaxError(`Unexpected character at index ${x}`);
      else if (a) {
        if (P[w] !== 1)
          throw new SyntaxError(`Unexpected character at index ${x}`);
        c === -1 ? c = x : l || (l = !0), a = !1;
      } else if (_)
        if (P[w] === 1)
          c === -1 && (c = x);
        else if (w === 34 && c !== -1)
          _ = !1, k = x;
        else if (w === 92)
          a = !0;
        else
          throw new SyntaxError(`Unexpected character at index ${x}`);
      else if (w === 34 && b.charCodeAt(x - 1) === 61)
        _ = !0;
      else if (k === -1 && P[w] === 1)
        c === -1 && (c = x);
      else if (c !== -1 && (w === 32 || w === 9))
        k === -1 && (k = x);
      else if (w === 59 || w === 44) {
        if (c === -1)
          throw new SyntaxError(`Unexpected character at index ${x}`);
        k === -1 && (k = x);
        let m = b.slice(c, k);
        l && (m = m.replace(/\\/g, ""), l = !1), T(n, C, m), w === 44 && (T(d, h, n), n = /* @__PURE__ */ Object.create(null), h = void 0), C = void 0, c = k = -1;
      } else
        throw new SyntaxError(`Unexpected character at index ${x}`);
    if (c === -1 || _ || w === 32 || w === 9)
      throw new SyntaxError("Unexpected end of input");
    k === -1 && (k = x);
    const O = b.slice(c, k);
    return h === void 0 ? T(d, O, n) : (C === void 0 ? T(n, O, !0) : l ? T(n, C, O.replace(/\\/g, "")) : T(n, C, O), T(d, h, n)), d;
  }
  function B(b) {
    return Object.keys(b).map((d) => {
      let n = b[d];
      return Array.isArray(n) || (n = [n]), n.map((l) => [d].concat(
        Object.keys(l).map((a) => {
          let _ = l[a];
          return Array.isArray(_) || (_ = [_]), _.map((h) => h === !0 ? a : `${a}=${h}`).join("; ");
        })
      ).join("; ")).join(", ");
    }).join(", ");
  }
  return Ee = { format: B, parse: M }, Ee;
}
var Se, He;
function Oe() {
  if (He) return Se;
  He = 1;
  const P = Ze, T = ht, M = Qe, B = ct, b = ut, { randomBytes: d, createHash: n } = we, { Duplex: l, Readable: a } = se, { URL: _ } = dt, h = ae(), C = Je(), c = et(), { isBlob: w } = ie(), {
    BINARY_TYPES: k,
    EMPTY_BUFFER: x,
    GUID: O,
    kForOnEventAttribute: m,
    kListener: f,
    kStatusCode: E,
    kWebSocket: u,
    NOOP: e
  } = V(), {
    EventTarget: { addEventListener: t, removeEventListener: i }
  } = St(), { format: s, parse: p } = tt(), { toBuffer: y } = oe(), R = 30 * 1e3, U = Symbol("kAborted"), A = [8, 13], N = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"], G = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
  class v extends P {
    /**
     * Create a new `WebSocket`.
     *
     * @param {(String|URL)} address The URL to which to connect
     * @param {(String|String[])} [protocols] The subprotocols
     * @param {Object} [options] Connection options
     */
    constructor(o, S, L) {
      super(), this._binaryType = k[0], this._closeCode = 1006, this._closeFrameReceived = !1, this._closeFrameSent = !1, this._closeMessage = x, this._closeTimer = null, this._errorEmitted = !1, this._extensions = {}, this._paused = !1, this._protocol = "", this._readyState = v.CONNECTING, this._receiver = null, this._sender = null, this._socket = null, o !== null ? (this._bufferedAmount = 0, this._isServer = !1, this._redirects = 0, S === void 0 ? S = [] : Array.isArray(S) || (typeof S == "object" && S !== null ? (L = S, S = []) : S = [S]), j(this, o, S, L)) : (this._autoPong = L.autoPong, this._isServer = !0);
    }
    /**
     * For historical reasons, the custom "nodebuffer" type is used by the default
     * instead of "blob".
     *
     * @type {String}
     */
    get binaryType() {
      return this._binaryType;
    }
    set binaryType(o) {
      k.includes(o) && (this._binaryType = o, this._receiver && (this._receiver._binaryType = o));
    }
    /**
     * @type {Number}
     */
    get bufferedAmount() {
      return this._socket ? this._socket._writableState.length + this._sender._bufferedBytes : this._bufferedAmount;
    }
    /**
     * @type {String}
     */
    get extensions() {
      return Object.keys(this._extensions).join();
    }
    /**
     * @type {Boolean}
     */
    get isPaused() {
      return this._paused;
    }
    /**
     * @type {Function}
     */
    /* istanbul ignore next */
    get onclose() {
      return null;
    }
    /**
     * @type {Function}
     */
    /* istanbul ignore next */
    get onerror() {
      return null;
    }
    /**
     * @type {Function}
     */
    /* istanbul ignore next */
    get onopen() {
      return null;
    }
    /**
     * @type {Function}
     */
    /* istanbul ignore next */
    get onmessage() {
      return null;
    }
    /**
     * @type {String}
     */
    get protocol() {
      return this._protocol;
    }
    /**
     * @type {Number}
     */
    get readyState() {
      return this._readyState;
    }
    /**
     * @type {String}
     */
    get url() {
      return this._url;
    }
    /**
     * Set up the socket and the internal resources.
     *
     * @param {Duplex} socket The network socket between the server and client
     * @param {Buffer} head The first packet of the upgraded stream
     * @param {Object} options Options object
     * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
     *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
     *     multiple times in the same tick
     * @param {Function} [options.generateMask] The function used to generate the
     *     masking key
     * @param {Number} [options.maxPayload=0] The maximum allowed message size
     * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
     *     not to skip UTF-8 validation for text and close messages
     * @private
     */
    setSocket(o, S, L) {
      const g = new C({
        allowSynchronousEvents: L.allowSynchronousEvents,
        binaryType: this.binaryType,
        extensions: this._extensions,
        isServer: this._isServer,
        maxPayload: L.maxPayload,
        skipUTF8Validation: L.skipUTF8Validation
      }), I = new c(o, this._extensions, L.generateMask);
      this._receiver = g, this._sender = I, this._socket = o, g[u] = this, I[u] = this, o[u] = this, g.on("conclude", rt), g.on("drain", st), g.on("error", it), g.on("message", nt), g.on("ping", ot), g.on("pong", at), I.onerror = ft, o.setTimeout && o.setTimeout(0), o.setNoDelay && o.setNoDelay(), S.length > 0 && o.unshift(S), o.on("close", Le), o.on("data", ne), o.on("end", Ne), o.on("error", Pe), this._readyState = v.OPEN, this.emit("open");
    }
    /**
     * Emit the `'close'` event.
     *
     * @private
     */
    emitClose() {
      if (!this._socket) {
        this._readyState = v.CLOSED, this.emit("close", this._closeCode, this._closeMessage);
        return;
      }
      this._extensions[h.extensionName] && this._extensions[h.extensionName].cleanup(), this._receiver.removeAllListeners(), this._readyState = v.CLOSED, this.emit("close", this._closeCode, this._closeMessage);
    }
    /**
     * Start a closing handshake.
     *
     *          +----------+   +-----------+   +----------+
     *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
     *    |     +----------+   +-----------+   +----------+     |
     *          +----------+   +-----------+         |
     * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
     *          +----------+   +-----------+   |
     *    |           |                        |   +---+        |
     *                +------------------------+-->|fin| - - - -
     *    |         +---+                      |   +---+
     *     - - - - -|fin|<---------------------+
     *              +---+
     *
     * @param {Number} [code] Status code explaining why the connection is closing
     * @param {(String|Buffer)} [data] The reason why the connection is
     *     closing
     * @public
     */
    close(o, S) {
      if (this.readyState !== v.CLOSED) {
        if (this.readyState === v.CONNECTING) {
          W(this, this._req, "WebSocket was closed before the connection was established");
          return;
        }
        if (this.readyState === v.CLOSING) {
          this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted) && this._socket.end();
          return;
        }
        this._readyState = v.CLOSING, this._sender.close(o, S, !this._isServer, (L) => {
          L || (this._closeFrameSent = !0, (this._closeFrameReceived || this._receiver._writableState.errorEmitted) && this._socket.end());
        }), ke(this);
      }
    }
    /**
     * Pause the socket.
     *
     * @public
     */
    pause() {
      this.readyState === v.CONNECTING || this.readyState === v.CLOSED || (this._paused = !0, this._socket.pause());
    }
    /**
     * Send a ping.
     *
     * @param {*} [data] The data to send
     * @param {Boolean} [mask] Indicates whether or not to mask `data`
     * @param {Function} [cb] Callback which is executed when the ping is sent
     * @public
     */
    ping(o, S, L) {
      if (this.readyState === v.CONNECTING)
        throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
      if (typeof o == "function" ? (L = o, o = S = void 0) : typeof S == "function" && (L = S, S = void 0), typeof o == "number" && (o = o.toString()), this.readyState !== v.OPEN) {
        he(this, o, L);
        return;
      }
      S === void 0 && (S = !this._isServer), this._sender.ping(o || x, S, L);
    }
    /**
     * Send a pong.
     *
     * @param {*} [data] The data to send
     * @param {Boolean} [mask] Indicates whether or not to mask `data`
     * @param {Function} [cb] Callback which is executed when the pong is sent
     * @public
     */
    pong(o, S, L) {
      if (this.readyState === v.CONNECTING)
        throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
      if (typeof o == "function" ? (L = o, o = S = void 0) : typeof S == "function" && (L = S, S = void 0), typeof o == "number" && (o = o.toString()), this.readyState !== v.OPEN) {
        he(this, o, L);
        return;
      }
      S === void 0 && (S = !this._isServer), this._sender.pong(o || x, S, L);
    }
    /**
     * Resume the socket.
     *
     * @public
     */
    resume() {
      this.readyState === v.CONNECTING || this.readyState === v.CLOSED || (this._paused = !1, this._receiver._writableState.needDrain || this._socket.resume());
    }
    /**
     * Send a data message.
     *
     * @param {*} data The message to send
     * @param {Object} [options] Options object
     * @param {Boolean} [options.binary] Specifies whether `data` is binary or
     *     text
     * @param {Boolean} [options.compress] Specifies whether or not to compress
     *     `data`
     * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
     *     last one
     * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
     * @param {Function} [cb] Callback which is executed when data is written out
     * @public
     */
    send(o, S, L) {
      if (this.readyState === v.CONNECTING)
        throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
      if (typeof S == "function" && (L = S, S = {}), typeof o == "number" && (o = o.toString()), this.readyState !== v.OPEN) {
        he(this, o, L);
        return;
      }
      const g = {
        binary: typeof o != "string",
        mask: !this._isServer,
        compress: !0,
        fin: !0,
        ...S
      };
      this._extensions[h.extensionName] || (g.compress = !1), this._sender.send(o || x, g, L);
    }
    /**
     * Forcibly close the connection.
     *
     * @public
     */
    terminate() {
      if (this.readyState !== v.CLOSED) {
        if (this.readyState === v.CONNECTING) {
          W(this, this._req, "WebSocket was closed before the connection was established");
          return;
        }
        this._socket && (this._readyState = v.CLOSING, this._socket.destroy());
      }
    }
  }
  Object.defineProperty(v, "CONNECTING", {
    enumerable: !0,
    value: N.indexOf("CONNECTING")
  }), Object.defineProperty(v.prototype, "CONNECTING", {
    enumerable: !0,
    value: N.indexOf("CONNECTING")
  }), Object.defineProperty(v, "OPEN", {
    enumerable: !0,
    value: N.indexOf("OPEN")
  }), Object.defineProperty(v.prototype, "OPEN", {
    enumerable: !0,
    value: N.indexOf("OPEN")
  }), Object.defineProperty(v, "CLOSING", {
    enumerable: !0,
    value: N.indexOf("CLOSING")
  }), Object.defineProperty(v.prototype, "CLOSING", {
    enumerable: !0,
    value: N.indexOf("CLOSING")
  }), Object.defineProperty(v, "CLOSED", {
    enumerable: !0,
    value: N.indexOf("CLOSED")
  }), Object.defineProperty(v.prototype, "CLOSED", {
    enumerable: !0,
    value: N.indexOf("CLOSED")
  }), [
    "binaryType",
    "bufferedAmount",
    "extensions",
    "isPaused",
    "protocol",
    "readyState",
    "url"
  ].forEach((r) => {
    Object.defineProperty(v.prototype, r, { enumerable: !0 });
  }), ["open", "error", "close", "message"].forEach((r) => {
    Object.defineProperty(v.prototype, `on${r}`, {
      enumerable: !0,
      get() {
        for (const o of this.listeners(r))
          if (o[m]) return o[f];
        return null;
      },
      set(o) {
        for (const S of this.listeners(r))
          if (S[m]) {
            this.removeListener(r, S);
            break;
          }
        typeof o == "function" && this.addEventListener(r, o, {
          [m]: !0
        });
      }
    });
  }), v.prototype.addEventListener = t, v.prototype.removeEventListener = i, Se = v;
  function j(r, o, S, L) {
    const g = {
      allowSynchronousEvents: !0,
      autoPong: !0,
      protocolVersion: A[1],
      maxPayload: 104857600,
      skipUTF8Validation: !1,
      perMessageDeflate: !0,
      followRedirects: !1,
      maxRedirects: 10,
      ...L,
      socketPath: void 0,
      hostname: void 0,
      protocol: void 0,
      timeout: void 0,
      method: "GET",
      host: void 0,
      path: void 0,
      port: void 0
    };
    if (r._autoPong = g.autoPong, !A.includes(g.protocolVersion))
      throw new RangeError(
        `Unsupported protocol version: ${g.protocolVersion} (supported versions: ${A.join(", ")})`
      );
    let I;
    if (o instanceof _)
      I = o;
    else
      try {
        I = new _(o);
      } catch {
        throw new SyntaxError(`Invalid URL: ${o}`);
      }
    I.protocol === "http:" ? I.protocol = "ws:" : I.protocol === "https:" && (I.protocol = "wss:"), r._url = I.href;
    const z = I.protocol === "wss:", H = I.protocol === "ws+unix:";
    let X;
    if (I.protocol !== "ws:" && !z && !H ? X = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"` : H && !I.pathname ? X = "The URL's pathname is empty" : I.hash && (X = "The URL contains a fragment identifier"), X) {
      const D = new SyntaxError(X);
      if (r._redirects === 0)
        throw D;
      q(r, D);
      return;
    }
    const Re = z ? 443 : 80, Be = d(16).toString("base64"), Ue = z ? T.request : M.request, Z = /* @__PURE__ */ new Set();
    let Q;
    if (g.createConnection = g.createConnection || (z ? le : fe), g.defaultPort = g.defaultPort || Re, g.port = I.port || Re, g.host = I.hostname.startsWith("[") ? I.hostname.slice(1, -1) : I.hostname, g.headers = {
      ...g.headers,
      "Sec-WebSocket-Version": g.protocolVersion,
      "Sec-WebSocket-Key": Be,
      Connection: "Upgrade",
      Upgrade: "websocket"
    }, g.path = I.pathname + I.search, g.timeout = g.handshakeTimeout, g.perMessageDeflate && (Q = new h(
      g.perMessageDeflate !== !0 ? g.perMessageDeflate : {},
      !1,
      g.maxPayload
    ), g.headers["Sec-WebSocket-Extensions"] = s({
      [h.extensionName]: Q.offer()
    })), S.length) {
      for (const D of S) {
        if (typeof D != "string" || !G.test(D) || Z.has(D))
          throw new SyntaxError(
            "An invalid or duplicated subprotocol was specified"
          );
        Z.add(D);
      }
      g.headers["Sec-WebSocket-Protocol"] = S.join(",");
    }
    if (g.origin && (g.protocolVersion < 13 ? g.headers["Sec-WebSocket-Origin"] = g.origin : g.headers.Origin = g.origin), (I.username || I.password) && (g.auth = `${I.username}:${I.password}`), H) {
      const D = g.path.split(":");
      g.socketPath = D[0], g.path = D[1];
    }
    let F;
    if (g.followRedirects) {
      if (r._redirects === 0) {
        r._originalIpc = H, r._originalSecure = z, r._originalHostOrSocketPath = H ? g.socketPath : I.host;
        const D = L && L.headers;
        if (L = { ...L, headers: {} }, D)
          for (const [$, Y] of Object.entries(D))
            L.headers[$.toLowerCase()] = Y;
      } else if (r.listenerCount("redirect") === 0) {
        const D = H ? r._originalIpc ? g.socketPath === r._originalHostOrSocketPath : !1 : r._originalIpc ? !1 : I.host === r._originalHostOrSocketPath;
        (!D || r._originalSecure && !z) && (delete g.headers.authorization, delete g.headers.cookie, D || delete g.headers.host, g.auth = void 0);
      }
      g.auth && !L.headers.authorization && (L.headers.authorization = "Basic " + Buffer.from(g.auth).toString("base64")), F = r._req = Ue(g), r._redirects && r.emit("redirect", r.url, F);
    } else
      F = r._req = Ue(g);
    g.timeout && F.on("timeout", () => {
      W(r, F, "Opening handshake has timed out");
    }), F.on("error", (D) => {
      F === null || F[U] || (F = r._req = null, q(r, D));
    }), F.on("response", (D) => {
      const $ = D.headers.location, Y = D.statusCode;
      if ($ && g.followRedirects && Y >= 300 && Y < 400) {
        if (++r._redirects > g.maxRedirects) {
          W(r, F, "Maximum redirects exceeded");
          return;
        }
        F.abort();
        let J;
        try {
          J = new _($, o);
        } catch {
          const K = new SyntaxError(`Invalid URL: ${$}`);
          q(r, K);
          return;
        }
        j(r, J, S, L);
      } else r.emit("unexpected-response", F, D) || W(
        r,
        F,
        `Unexpected server response: ${D.statusCode}`
      );
    }), F.on("upgrade", (D, $, Y) => {
      if (r.emit("upgrade", D), r.readyState !== v.CONNECTING) return;
      F = r._req = null;
      const J = D.headers.upgrade;
      if (J === void 0 || J.toLowerCase() !== "websocket") {
        W(r, $, "Invalid Upgrade header");
        return;
      }
      const De = n("sha1").update(Be + O).digest("base64");
      if (D.headers["sec-websocket-accept"] !== De) {
        W(r, $, "Invalid Sec-WebSocket-Accept header");
        return;
      }
      const K = D.headers["sec-websocket-protocol"];
      let ee;
      if (K !== void 0 ? Z.size ? Z.has(K) || (ee = "Server sent an invalid subprotocol") : ee = "Server sent a subprotocol but none was requested" : Z.size && (ee = "Server sent no subprotocol"), ee) {
        W(r, $, ee);
        return;
      }
      K && (r._protocol = K);
      const Ie = D.headers["sec-websocket-extensions"];
      if (Ie !== void 0) {
        if (!Q) {
          W(r, $, "Server sent a Sec-WebSocket-Extensions header but no extension was requested");
          return;
        }
        let ce;
        try {
          ce = p(Ie);
        } catch {
          W(r, $, "Invalid Sec-WebSocket-Extensions header");
          return;
        }
        const Me = Object.keys(ce);
        if (Me.length !== 1 || Me[0] !== h.extensionName) {
          W(r, $, "Server indicated an extension that was not requested");
          return;
        }
        try {
          Q.accept(ce[h.extensionName]);
        } catch {
          W(r, $, "Invalid Sec-WebSocket-Extensions header");
          return;
        }
        r._extensions[h.extensionName] = Q;
      }
      r.setSocket($, Y, {
        allowSynchronousEvents: g.allowSynchronousEvents,
        generateMask: g.generateMask,
        maxPayload: g.maxPayload,
        skipUTF8Validation: g.skipUTF8Validation
      });
    }), g.finishRequest ? g.finishRequest(F, r) : F.end();
  }
  function q(r, o) {
    r._readyState = v.CLOSING, r._errorEmitted = !0, r.emit("error", o), r.emitClose();
  }
  function fe(r) {
    return r.path = r.socketPath, B.connect(r);
  }
  function le(r) {
    return r.path = void 0, !r.servername && r.servername !== "" && (r.servername = B.isIP(r.host) ? "" : r.host), b.connect(r);
  }
  function W(r, o, S) {
    r._readyState = v.CLOSING;
    const L = new Error(S);
    Error.captureStackTrace(L, W), o.setHeader ? (o[U] = !0, o.abort(), o.socket && !o.socket.destroyed && o.socket.destroy(), process.nextTick(q, r, L)) : (o.destroy(L), o.once("error", r.emit.bind(r, "error")), o.once("close", r.emitClose.bind(r)));
  }
  function he(r, o, S) {
    if (o) {
      const L = w(o) ? o.size : y(o).length;
      r._socket ? r._sender._bufferedBytes += L : r._bufferedAmount += L;
    }
    if (S) {
      const L = new Error(
        `WebSocket is not open: readyState ${r.readyState} (${N[r.readyState]})`
      );
      process.nextTick(S, L);
    }
  }
  function rt(r, o) {
    const S = this[u];
    S._closeFrameReceived = !0, S._closeMessage = o, S._closeCode = r, S._socket[u] !== void 0 && (S._socket.removeListener("data", ne), process.nextTick(Ce, S._socket), r === 1005 ? S.close() : S.close(r, o));
  }
  function st() {
    const r = this[u];
    r.isPaused || r._socket.resume();
  }
  function it(r) {
    const o = this[u];
    o._socket[u] !== void 0 && (o._socket.removeListener("data", ne), process.nextTick(Ce, o._socket), o.close(r[E])), o._errorEmitted || (o._errorEmitted = !0, o.emit("error", r));
  }
  function Te() {
    this[u].emitClose();
  }
  function nt(r, o) {
    this[u].emit("message", r, o);
  }
  function ot(r) {
    const o = this[u];
    o._autoPong && o.pong(r, !this._isServer, e), o.emit("ping", r);
  }
  function at(r) {
    this[u].emit("pong", r);
  }
  function Ce(r) {
    r.resume();
  }
  function ft(r) {
    const o = this[u];
    o.readyState !== v.CLOSED && (o.readyState === v.OPEN && (o._readyState = v.CLOSING, ke(o)), this._socket.end(), o._errorEmitted || (o._errorEmitted = !0, o.emit("error", r)));
  }
  function ke(r) {
    r._closeTimer = setTimeout(
      r._socket.destroy.bind(r._socket),
      R
    );
  }
  function Le() {
    const r = this[u];
    this.removeListener("close", Le), this.removeListener("data", ne), this.removeListener("end", Ne), r._readyState = v.CLOSING;
    let o;
    !this._readableState.endEmitted && !r._closeFrameReceived && !r._receiver._writableState.errorEmitted && (o = r._socket.read()) !== null && r._receiver.write(o), r._receiver.end(), this[u] = void 0, clearTimeout(r._closeTimer), r._receiver._writableState.finished || r._receiver._writableState.errorEmitted ? r.emitClose() : (r._receiver.on("error", Te), r._receiver.on("finish", Te));
  }
  function ne(r) {
    this[u]._receiver.write(r) || this.pause();
  }
  function Ne() {
    const r = this[u];
    r._readyState = v.CLOSING, r._receiver.end(), this.end();
  }
  function Pe() {
    const r = this[u];
    this.removeListener("error", Pe), this.on("error", e), r && (r._readyState = v.CLOSING, this.destroy());
  }
  return Se;
}
var ve, Ye;
function vt() {
  if (Ye) return ve;
  Ye = 1, Oe();
  const { Duplex: P } = se;
  function T(d) {
    d.emit("close");
  }
  function M() {
    !this.destroyed && this._writableState.finished && this.destroy();
  }
  function B(d) {
    this.removeListener("error", B), this.destroy(), this.listenerCount("error") === 0 && this.emit("error", d);
  }
  function b(d, n) {
    let l = !0;
    const a = new P({
      ...n,
      autoDestroy: !1,
      emitClose: !1,
      objectMode: !1,
      writableObjectMode: !1
    });
    return d.on("message", function(h, C) {
      const c = !C && a._readableState.objectMode ? h.toString() : h;
      a.push(c) || d.pause();
    }), d.once("error", function(h) {
      a.destroyed || (l = !1, a.destroy(h));
    }), d.once("close", function() {
      a.destroyed || a.push(null);
    }), a._destroy = function(_, h) {
      if (d.readyState === d.CLOSED) {
        h(_), process.nextTick(T, a);
        return;
      }
      let C = !1;
      d.once("error", function(w) {
        C = !0, h(w);
      }), d.once("close", function() {
        C || h(_), process.nextTick(T, a);
      }), l && d.terminate();
    }, a._final = function(_) {
      if (d.readyState === d.CONNECTING) {
        d.once("open", function() {
          a._final(_);
        });
        return;
      }
      d._socket !== null && (d._socket._writableState.finished ? (_(), a._readableState.endEmitted && a.destroy()) : (d._socket.once("finish", function() {
        _();
      }), d.close()));
    }, a._read = function() {
      d.isPaused && d.resume();
    }, a._write = function(_, h, C) {
      if (d.readyState === d.CONNECTING) {
        d.once("open", function() {
          a._write(_, h, C);
        });
        return;
      }
      d.send(_, C);
    }, a.on("end", M), a.on("error", B), a;
  }
  return ve = b, ve;
}
vt();
Je();
et();
var xt = Oe();
const It = /* @__PURE__ */ gt(xt);
var xe, Ke;
function bt() {
  if (Ke) return xe;
  Ke = 1;
  const { tokenChars: P } = ie();
  function T(M) {
    const B = /* @__PURE__ */ new Set();
    let b = -1, d = -1, n = 0;
    for (n; n < M.length; n++) {
      const a = M.charCodeAt(n);
      if (d === -1 && P[a] === 1)
        b === -1 && (b = n);
      else if (n !== 0 && (a === 32 || a === 9))
        d === -1 && b !== -1 && (d = n);
      else if (a === 44) {
        if (b === -1)
          throw new SyntaxError(`Unexpected character at index ${n}`);
        d === -1 && (d = n);
        const _ = M.slice(b, d);
        if (B.has(_))
          throw new SyntaxError(`The "${_}" subprotocol is duplicated`);
        B.add(_), b = d = -1;
      } else
        throw new SyntaxError(`Unexpected character at index ${n}`);
    }
    if (b === -1 || d !== -1)
      throw new SyntaxError("Unexpected end of input");
    const l = M.slice(b, n);
    if (B.has(l))
      throw new SyntaxError(`The "${l}" subprotocol is duplicated`);
    return B.add(l), B;
  }
  return xe = { parse: T }, xe;
}
var be, Xe;
function wt() {
  if (Xe) return be;
  Xe = 1;
  const P = Ze, T = Qe, { Duplex: M } = se, { createHash: B } = we, b = tt(), d = ae(), n = bt(), l = Oe(), { GUID: a, kWebSocket: _ } = V(), h = /^[+/0-9A-Za-z]{22}==$/, C = 0, c = 1, w = 2;
  class k extends P {
    /**
     * Create a `WebSocketServer` instance.
     *
     * @param {Object} options Configuration options
     * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
     *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
     *     multiple times in the same tick
     * @param {Boolean} [options.autoPong=true] Specifies whether or not to
     *     automatically send a pong in response to a ping
     * @param {Number} [options.backlog=511] The maximum length of the queue of
     *     pending connections
     * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
     *     track clients
     * @param {Function} [options.handleProtocols] A hook to handle protocols
     * @param {String} [options.host] The hostname where to bind the server
     * @param {Number} [options.maxPayload=104857600] The maximum allowed message
     *     size
     * @param {Boolean} [options.noServer=false] Enable no server mode
     * @param {String} [options.path] Accept only connections matching this path
     * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
     *     permessage-deflate
     * @param {Number} [options.port] The port where to bind the server
     * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
     *     server to use
     * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
     *     not to skip UTF-8 validation for text and close messages
     * @param {Function} [options.verifyClient] A hook to reject connections
     * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
     *     class to use. It must be the `WebSocket` class or class that extends it
     * @param {Function} [callback] A listener for the `listening` event
     */
    constructor(e, t) {
      if (super(), e = {
        allowSynchronousEvents: !0,
        autoPong: !0,
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: !1,
        perMessageDeflate: !1,
        handleProtocols: null,
        clientTracking: !0,
        verifyClient: null,
        noServer: !1,
        backlog: null,
        // use default (511 as implemented in net.js)
        server: null,
        host: null,
        path: null,
        port: null,
        WebSocket: l,
        ...e
      }, e.port == null && !e.server && !e.noServer || e.port != null && (e.server || e.noServer) || e.server && e.noServer)
        throw new TypeError(
          'One and only one of the "port", "server", or "noServer" options must be specified'
        );
      if (e.port != null ? (this._server = T.createServer((i, s) => {
        const p = T.STATUS_CODES[426];
        s.writeHead(426, {
          "Content-Length": p.length,
          "Content-Type": "text/plain"
        }), s.end(p);
      }), this._server.listen(
        e.port,
        e.host,
        e.backlog,
        t
      )) : e.server && (this._server = e.server), this._server) {
        const i = this.emit.bind(this, "connection");
        this._removeListeners = x(this._server, {
          listening: this.emit.bind(this, "listening"),
          error: this.emit.bind(this, "error"),
          upgrade: (s, p, y) => {
            this.handleUpgrade(s, p, y, i);
          }
        });
      }
      e.perMessageDeflate === !0 && (e.perMessageDeflate = {}), e.clientTracking && (this.clients = /* @__PURE__ */ new Set(), this._shouldEmitClose = !1), this.options = e, this._state = C;
    }
    /**
     * Returns the bound address, the address family name, and port of the server
     * as reported by the operating system if listening on an IP socket.
     * If the server is listening on a pipe or UNIX domain socket, the name is
     * returned as a string.
     *
     * @return {(Object|String|null)} The address of the server
     * @public
     */
    address() {
      if (this.options.noServer)
        throw new Error('The server is operating in "noServer" mode');
      return this._server ? this._server.address() : null;
    }
    /**
     * Stop the server from accepting new connections and emit the `'close'` event
     * when all existing connections are closed.
     *
     * @param {Function} [cb] A one-time listener for the `'close'` event
     * @public
     */
    close(e) {
      if (this._state === w) {
        e && this.once("close", () => {
          e(new Error("The server is not running"));
        }), process.nextTick(O, this);
        return;
      }
      if (e && this.once("close", e), this._state !== c)
        if (this._state = c, this.options.noServer || this.options.server)
          this._server && (this._removeListeners(), this._removeListeners = this._server = null), this.clients ? this.clients.size ? this._shouldEmitClose = !0 : process.nextTick(O, this) : process.nextTick(O, this);
        else {
          const t = this._server;
          this._removeListeners(), this._removeListeners = this._server = null, t.close(() => {
            O(this);
          });
        }
    }
    /**
     * See if a given request should be handled by this server instance.
     *
     * @param {http.IncomingMessage} req Request object to inspect
     * @return {Boolean} `true` if the request is valid, else `false`
     * @public
     */
    shouldHandle(e) {
      if (this.options.path) {
        const t = e.url.indexOf("?");
        if ((t !== -1 ? e.url.slice(0, t) : e.url) !== this.options.path) return !1;
      }
      return !0;
    }
    /**
     * Handle a HTTP Upgrade request.
     *
     * @param {http.IncomingMessage} req The request object
     * @param {Duplex} socket The network socket between the server and client
     * @param {Buffer} head The first packet of the upgraded stream
     * @param {Function} cb Callback
     * @public
     */
    handleUpgrade(e, t, i, s) {
      t.on("error", m);
      const p = e.headers["sec-websocket-key"], y = e.headers.upgrade, R = +e.headers["sec-websocket-version"];
      if (e.method !== "GET") {
        E(this, e, t, 405, "Invalid HTTP method");
        return;
      }
      if (y === void 0 || y.toLowerCase() !== "websocket") {
        E(this, e, t, 400, "Invalid Upgrade header");
        return;
      }
      if (p === void 0 || !h.test(p)) {
        E(this, e, t, 400, "Missing or invalid Sec-WebSocket-Key header");
        return;
      }
      if (R !== 13 && R !== 8) {
        E(this, e, t, 400, "Missing or invalid Sec-WebSocket-Version header", {
          "Sec-WebSocket-Version": "13, 8"
        });
        return;
      }
      if (!this.shouldHandle(e)) {
        f(t, 400);
        return;
      }
      const U = e.headers["sec-websocket-protocol"];
      let A = /* @__PURE__ */ new Set();
      if (U !== void 0)
        try {
          A = n.parse(U);
        } catch {
          E(this, e, t, 400, "Invalid Sec-WebSocket-Protocol header");
          return;
        }
      const N = e.headers["sec-websocket-extensions"], G = {};
      if (this.options.perMessageDeflate && N !== void 0) {
        const v = new d(
          this.options.perMessageDeflate,
          !0,
          this.options.maxPayload
        );
        try {
          const j = b.parse(N);
          j[d.extensionName] && (v.accept(j[d.extensionName]), G[d.extensionName] = v);
        } catch {
          E(this, e, t, 400, "Invalid or unacceptable Sec-WebSocket-Extensions header");
          return;
        }
      }
      if (this.options.verifyClient) {
        const v = {
          origin: e.headers[`${R === 8 ? "sec-websocket-origin" : "origin"}`],
          secure: !!(e.socket.authorized || e.socket.encrypted),
          req: e
        };
        if (this.options.verifyClient.length === 2) {
          this.options.verifyClient(v, (j, q, fe, le) => {
            if (!j)
              return f(t, q || 401, fe, le);
            this.completeUpgrade(
              G,
              p,
              A,
              e,
              t,
              i,
              s
            );
          });
          return;
        }
        if (!this.options.verifyClient(v)) return f(t, 401);
      }
      this.completeUpgrade(G, p, A, e, t, i, s);
    }
    /**
     * Upgrade the connection to WebSocket.
     *
     * @param {Object} extensions The accepted extensions
     * @param {String} key The value of the `Sec-WebSocket-Key` header
     * @param {Set} protocols The subprotocols
     * @param {http.IncomingMessage} req The request object
     * @param {Duplex} socket The network socket between the server and client
     * @param {Buffer} head The first packet of the upgraded stream
     * @param {Function} cb Callback
     * @throws {Error} If called more than once with the same socket
     * @private
     */
    completeUpgrade(e, t, i, s, p, y, R) {
      if (!p.readable || !p.writable) return p.destroy();
      if (p[_])
        throw new Error(
          "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
        );
      if (this._state > C) return f(p, 503);
      const A = [
        "HTTP/1.1 101 Switching Protocols",
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Accept: ${B("sha1").update(t + a).digest("base64")}`
      ], N = new this.options.WebSocket(null, void 0, this.options);
      if (i.size) {
        const G = this.options.handleProtocols ? this.options.handleProtocols(i, s) : i.values().next().value;
        G && (A.push(`Sec-WebSocket-Protocol: ${G}`), N._protocol = G);
      }
      if (e[d.extensionName]) {
        const G = e[d.extensionName].params, v = b.format({
          [d.extensionName]: [G]
        });
        A.push(`Sec-WebSocket-Extensions: ${v}`), N._extensions = e;
      }
      this.emit("headers", A, s), p.write(A.concat(`\r
`).join(`\r
`)), p.removeListener("error", m), N.setSocket(p, y, {
        allowSynchronousEvents: this.options.allowSynchronousEvents,
        maxPayload: this.options.maxPayload,
        skipUTF8Validation: this.options.skipUTF8Validation
      }), this.clients && (this.clients.add(N), N.on("close", () => {
        this.clients.delete(N), this._shouldEmitClose && !this.clients.size && process.nextTick(O, this);
      })), R(N, s);
    }
  }
  be = k;
  function x(u, e) {
    for (const t of Object.keys(e)) u.on(t, e[t]);
    return function() {
      for (const i of Object.keys(e))
        u.removeListener(i, e[i]);
    };
  }
  function O(u) {
    u._state = w, u.emit("close");
  }
  function m() {
    this.destroy();
  }
  function f(u, e, t, i) {
    t = t || T.STATUS_CODES[e], i = {
      Connection: "close",
      "Content-Type": "text/html",
      "Content-Length": Buffer.byteLength(t),
      ...i
    }, u.once("finish", u.destroy), u.end(
      `HTTP/1.1 ${e} ${T.STATUS_CODES[e]}\r
` + Object.keys(i).map((s) => `${s}: ${i[s]}`).join(`\r
`) + `\r
\r
` + t
    );
  }
  function E(u, e, t, i, s, p) {
    if (u.listenerCount("wsClientError")) {
      const y = new Error(s);
      Error.captureStackTrace(y, E), u.emit("wsClientError", y, t, e);
    } else
      f(t, i, s, p);
  }
  return be;
}
wt();
export {
  It as WebSocket,
  It as default
};
