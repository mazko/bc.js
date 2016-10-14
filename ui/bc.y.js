var Module;
if (!Module)
    Module = (typeof Module !== "undefined" ? Module : null) || {};
var moduleOverrides = {};
for (var key in Module) {
    if (Module.hasOwnProperty(key)) {
        moduleOverrides[key] = Module[key];
    }
}
var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
if (Module["ENVIRONMENT"]) {
    if (Module["ENVIRONMENT"] === "WEB") {
        ENVIRONMENT_IS_WEB = true;
    } else if (Module["ENVIRONMENT"] === "WORKER") {
        ENVIRONMENT_IS_WORKER = true;
    } else if (Module["ENVIRONMENT"] === "NODE") {
        ENVIRONMENT_IS_NODE = true;
    } else if (Module["ENVIRONMENT"] === "SHELL") {
        ENVIRONMENT_IS_SHELL = true;
    } else {
        throw new Error("The provided Module['ENVIRONMENT'] value is not valid. It must be one of: WEB|WORKER|NODE|SHELL.");
    }
} else {
    ENVIRONMENT_IS_WEB = typeof window === "object";
    ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
    ENVIRONMENT_IS_NODE = typeof process === "object" && typeof require === "function" && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
    ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
}
if (ENVIRONMENT_IS_NODE) {
    if (!Module["print"])
        Module["print"] = console.log;
    if (!Module["printErr"])
        Module["printErr"] = console.warn;
    var nodeFS;
    var nodePath;
    Module["read"] = function read(filename, binary) {
        if (!nodeFS)
            nodeFS = require("fs");
        if (!nodePath)
            nodePath = require("path");
        filename = nodePath["normalize"](filename);
        var ret = nodeFS["readFileSync"](filename);
        if (!ret && filename != nodePath["resolve"](filename)) {
            filename = path.join(__dirname, "..", "src", filename);
            ret = nodeFS["readFileSync"](filename);
        }
        if (ret && !binary)
            ret = ret.toString();
        return ret;
    };
    Module["readBinary"] = function readBinary(filename) {
        var ret = Module["read"](filename, true);
        if (!ret.buffer) {
            ret = new Uint8Array(ret);
        }
        assert(ret.buffer);
        return ret;
    };
    Module["load"] = function load(f) {
        globalEval(read(f));
    };
    if (!Module["thisProgram"]) {
        if (process["argv"].length > 1) {
            Module["thisProgram"] = process["argv"][1].replace(/\\/g, "/");
        } else {
            Module["thisProgram"] = "unknown-program";
        }
    }
    Module["arguments"] = process["argv"].slice(2);
    if (typeof module !== "undefined") {
        module["exports"] = Module;
    }
    process["on"]("uncaughtException", function (ex) {
        if (!(ex instanceof ExitStatus)) {
            throw ex;
        }
    });
    Module["inspect"] = function () {
        return "[Emscripten Module object]";
    };
} else if (ENVIRONMENT_IS_SHELL) {
    if (!Module["print"])
        Module["print"] = print;
    if (typeof printErr != "undefined")
        Module["printErr"] = printErr;
    if (typeof read != "undefined") {
        Module["read"] = read;
    } else {
        Module["read"] = function read() {
            throw "no read() available (jsc?)";
        };
    }
    Module["readBinary"] = function readBinary(f) {
        if (typeof readbuffer === "function") {
            return new Uint8Array(readbuffer(f));
        }
        var data = read(f, "binary");
        assert(typeof data === "object");
        return data;
    };
    if (typeof scriptArgs != "undefined") {
        Module["arguments"] = scriptArgs;
    } else if (typeof arguments != "undefined") {
        Module["arguments"] = arguments;
    }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    Module["read"] = function read(url) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.send(null);
        return xhr.responseText;
    };
    Module["readAsync"] = function readAsync(url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function xhr_onload() {
            if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                onload(xhr.response);
            } else {
                onerror();
            }
        };
        xhr.onerror = onerror;
        xhr.send(null);
    };
    if (typeof arguments != "undefined") {
        Module["arguments"] = arguments;
    }
    if (typeof console !== "undefined") {
        if (!Module["print"])
            Module["print"] = function print(x) {
                console.log(x);
            };
        if (!Module["printErr"])
            Module["printErr"] = function printErr(x) {
                console.warn(x);
            };
    } else {
        var TRY_USE_DUMP = false;
        if (!Module["print"])
            Module["print"] = TRY_USE_DUMP && typeof dump !== "undefined" ? function (x) {
                dump(x);
            } : function (x) {
            };
    }
    if (ENVIRONMENT_IS_WORKER) {
        Module["load"] = importScripts;
    }
    if (typeof Module["setWindowTitle"] === "undefined") {
        Module["setWindowTitle"] = function (title) {
            document.title = title;
        };
    }
} else {
    throw "Unknown runtime environment. Where are we?";
}
function globalEval(x) {
    eval.call(null, x);
}
if (!Module["load"] && Module["read"]) {
    Module["load"] = function load(f) {
        globalEval(Module["read"](f));
    };
}
if (!Module["print"]) {
    Module["print"] = function () {
    };
}
if (!Module["printErr"]) {
    Module["printErr"] = Module["print"];
}
if (!Module["arguments"]) {
    Module["arguments"] = [];
}
if (!Module["thisProgram"]) {
    Module["thisProgram"] = "./this.program";
}
Module.print = Module["print"];
Module.printErr = Module["printErr"];
Module["preRun"] = [];
Module["postRun"] = [];
for (var key in moduleOverrides) {
    if (moduleOverrides.hasOwnProperty(key)) {
        Module[key] = moduleOverrides[key];
    }
}
moduleOverrides = undefined;
var Runtime = {
    setTempRet0: function (value) {
        tempRet0 = value;
    },
    getTempRet0: function () {
        return tempRet0;
    },
    stackSave: function () {
        return STACKTOP;
    },
    stackRestore: function (stackTop) {
        STACKTOP = stackTop;
    },
    getNativeTypeSize: function (type) {
        switch (type) {
        case "i1":
        case "i8":
            return 1;
        case "i16":
            return 2;
        case "i32":
            return 4;
        case "i64":
            return 8;
        case "float":
            return 4;
        case "double":
            return 8;
        default: {
                if (type[type.length - 1] === "*") {
                    return Runtime.QUANTUM_SIZE;
                } else if (type[0] === "i") {
                    var bits = parseInt(type.substr(1));
                    assert(bits % 8 === 0);
                    return bits / 8;
                } else {
                    return 0;
                }
            }
        }
    },
    getNativeFieldSize: function (type) {
        return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
    },
    STACK_ALIGN: 16,
    prepVararg: function (ptr, type) {
        if (type === "double" || type === "i64") {
            if (ptr & 7) {
                assert((ptr & 7) === 4);
                ptr += 4;
            }
        } else {
            assert((ptr & 3) === 0);
        }
        return ptr;
    },
    getAlignSize: function (type, size, vararg) {
        if (!vararg && (type == "i64" || type == "double"))
            return 8;
        if (!type)
            return Math.min(size, 8);
        return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
    },
    dynCall: function (sig, ptr, args) {
        if (args && args.length) {
            if (!args.splice)
                args = Array.prototype.slice.call(args);
            args.splice(0, 0, ptr);
            return Module["dynCall_" + sig].apply(null, args);
        } else {
            return Module["dynCall_" + sig].call(null, ptr);
        }
    },
    functionPointers: [],
    addFunction: function (func) {
        for (var i = 0; i < Runtime.functionPointers.length; i++) {
            if (!Runtime.functionPointers[i]) {
                Runtime.functionPointers[i] = func;
                return 2 * (1 + i);
            }
        }
        throw "Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.";
    },
    removeFunction: function (index) {
        Runtime.functionPointers[(index - 2) / 2] = null;
    },
    warnOnce: function (text) {
        if (!Runtime.warnOnce.shown)
            Runtime.warnOnce.shown = {};
        if (!Runtime.warnOnce.shown[text]) {
            Runtime.warnOnce.shown[text] = 1;
            Module.printErr(text);
        }
    },
    funcWrappers: {},
    getFuncWrapper: function (func, sig) {
        assert(sig);
        if (!Runtime.funcWrappers[sig]) {
            Runtime.funcWrappers[sig] = {};
        }
        var sigCache = Runtime.funcWrappers[sig];
        if (!sigCache[func]) {
            sigCache[func] = function dynCall_wrapper() {
                return Runtime.dynCall(sig, func, arguments);
            };
        }
        return sigCache[func];
    },
    getCompilerSetting: function (name) {
        throw "You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work";
    },
    stackAlloc: function (size) {
        var ret = STACKTOP;
        STACKTOP = STACKTOP + size | 0;
        STACKTOP = STACKTOP + 15 & -16;
        return ret;
    },
    staticAlloc: function (size) {
        var ret = STATICTOP;
        STATICTOP = STATICTOP + size | 0;
        STATICTOP = STATICTOP + 15 & -16;
        return ret;
    },
    dynamicAlloc: function (size) {
        var ret = DYNAMICTOP;
        DYNAMICTOP = DYNAMICTOP + size | 0;
        DYNAMICTOP = DYNAMICTOP + 15 & -16;
        if (DYNAMICTOP >= TOTAL_MEMORY) {
            var success = enlargeMemory();
            if (!success) {
                DYNAMICTOP = ret;
                return 0;
            }
        }
        return ret;
    },
    alignMemory: function (size, quantum) {
        var ret = size = Math.ceil(size / (quantum ? quantum : 16)) * (quantum ? quantum : 16);
        return ret;
    },
    makeBigInt: function (low, high, unsigned) {
        var ret = unsigned ? +(low >>> 0) + +(high >>> 0) * +4294967296 : +(low >>> 0) + +(high | 0) * +4294967296;
        return ret;
    },
    GLOBAL_BASE: 8,
    QUANTUM_SIZE: 4,
    __dummy__: 0
};
Module["Runtime"] = Runtime;
var ABORT = false;
var EXITSTATUS = 0;
function assert(condition, text) {
    if (!condition) {
        abort("Assertion failed: " + text);
    }
}
function getCFunc(ident) {
    var func = Module["_" + ident];
    if (!func) {
        try {
            func = eval("_" + ident);
        } catch (e) {
        }
    }
    assert(func, "Cannot call unknown function " + ident + " (perhaps LLVM optimizations or closure removed it?)");
    return func;
}
var cwrap, ccall;
(function () {
    var JSfuncs = {
        "stackSave": function () {
            Runtime.stackSave();
        },
        "stackRestore": function () {
            Runtime.stackRestore();
        },
        "arrayToC": function (arr) {
            var ret = Runtime.stackAlloc(arr.length);
            writeArrayToMemory(arr, ret);
            return ret;
        },
        "stringToC": function (str) {
            var ret = 0;
            if (str !== null && str !== undefined && str !== 0) {
                ret = Runtime.stackAlloc((str.length << 2) + 1);
                writeStringToMemory(str, ret);
            }
            return ret;
        }
    };
    var toC = {
        "string": JSfuncs["stringToC"],
        "array": JSfuncs["arrayToC"]
    };
    ccall = function ccallFunc(ident, returnType, argTypes, args, opts) {
        var func = getCFunc(ident);
        var cArgs = [];
        var stack = 0;
        if (args) {
            for (var i = 0; i < args.length; i++) {
                var converter = toC[argTypes[i]];
                if (converter) {
                    if (stack === 0)
                        stack = Runtime.stackSave();
                    cArgs[i] = converter(args[i]);
                } else {
                    cArgs[i] = args[i];
                }
            }
        }
        var ret = func.apply(null, cArgs);
        if (returnType === "string")
            ret = Pointer_stringify(ret);
        if (stack !== 0) {
            if (opts && opts.async) {
                EmterpreterAsync.asyncFinalizers.push(function () {
                    Runtime.stackRestore(stack);
                });
                return;
            }
            Runtime.stackRestore(stack);
        }
        return ret;
    };
    var sourceRegex = /^function\s*[a-zA-Z$_0-9]*\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;
    function parseJSFunc(jsfunc) {
        var parsed = jsfunc.toString().match(sourceRegex).slice(1);
        return {
            arguments: parsed[0],
            body: parsed[1],
            returnValue: parsed[2]
        };
    }
    var JSsource = null;
    function ensureJSsource() {
        if (!JSsource) {
            JSsource = {};
            for (var fun in JSfuncs) {
                if (JSfuncs.hasOwnProperty(fun)) {
                    JSsource[fun] = parseJSFunc(JSfuncs[fun]);
                }
            }
        }
    }
    cwrap = function cwrap(ident, returnType, argTypes) {
        argTypes = argTypes || [];
        var cfunc = getCFunc(ident);
        var numericArgs = argTypes.every(function (type) {
            return type === "number";
        });
        var numericRet = returnType !== "string";
        if (numericRet && numericArgs) {
            return cfunc;
        }
        var argNames = argTypes.map(function (x, i) {
            return "$" + i;
        });
        var funcstr = "(function(" + argNames.join(",") + ") {";
        var nargs = argTypes.length;
        if (!numericArgs) {
            ensureJSsource();
            funcstr += "var stack = " + JSsource["stackSave"].body + ";";
            for (var i = 0; i < nargs; i++) {
                var arg = argNames[i], type = argTypes[i];
                if (type === "number")
                    continue;
                var convertCode = JSsource[type + "ToC"];
                funcstr += "var " + convertCode.arguments + " = " + arg + ";";
                funcstr += convertCode.body + ";";
                funcstr += arg + "=(" + convertCode.returnValue + ");";
            }
        }
        var cfuncname = parseJSFunc(function () {
            return cfunc;
        }).returnValue;
        funcstr += "var ret = " + cfuncname + "(" + argNames.join(",") + ");";
        if (!numericRet) {
            var strgfy = parseJSFunc(function () {
                return Pointer_stringify;
            }).returnValue;
            funcstr += "ret = " + strgfy + "(ret);";
        }
        if (!numericArgs) {
            ensureJSsource();
            funcstr += JSsource["stackRestore"].body.replace("()", "(stack)") + ";";
        }
        funcstr += "return ret})";
        return eval(funcstr);
    };
}());
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;
function setValue(ptr, value, type, noSafe) {
    type = type || "i8";
    if (type.charAt(type.length - 1) === "*")
        type = "i32";
    switch (type) {
    case "i1":
        HEAP8[ptr >> 0] = value;
        break;
    case "i8":
        HEAP8[ptr >> 0] = value;
        break;
    case "i16":
        HEAP16[ptr >> 1] = value;
        break;
    case "i32":
        HEAP32[ptr >> 2] = value;
        break;
    case "i64":
        tempI64 = [
            value >>> 0,
            (tempDouble = value, +Math_abs(tempDouble) >= +1 ? tempDouble > +0 ? (Math_min(+Math_floor(tempDouble / +4294967296), +4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / +4294967296) >>> 0 : 0)
        ], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
        break;
    case "float":
        HEAPF32[ptr >> 2] = value;
        break;
    case "double":
        HEAPF64[ptr >> 3] = value;
        break;
    default:
        abort("invalid type for setValue: " + type);
    }
}
Module["setValue"] = setValue;
function getValue(ptr, type, noSafe) {
    type = type || "i8";
    if (type.charAt(type.length - 1) === "*")
        type = "i32";
    switch (type) {
    case "i1":
        return HEAP8[ptr >> 0];
    case "i8":
        return HEAP8[ptr >> 0];
    case "i16":
        return HEAP16[ptr >> 1];
    case "i32":
        return HEAP32[ptr >> 2];
    case "i64":
        return HEAP32[ptr >> 2];
    case "float":
        return HEAPF32[ptr >> 2];
    case "double":
        return HEAPF64[ptr >> 3];
    default:
        abort("invalid type for setValue: " + type);
    }
    return null;
}
Module["getValue"] = getValue;
var ALLOC_NORMAL = 0;
var ALLOC_STACK = 1;
var ALLOC_STATIC = 2;
var ALLOC_DYNAMIC = 3;
var ALLOC_NONE = 4;
Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
Module["ALLOC_STACK"] = ALLOC_STACK;
Module["ALLOC_STATIC"] = ALLOC_STATIC;
Module["ALLOC_DYNAMIC"] = ALLOC_DYNAMIC;
Module["ALLOC_NONE"] = ALLOC_NONE;
function allocate(slab, types, allocator, ptr) {
    var zeroinit, size;
    if (typeof slab === "number") {
        zeroinit = true;
        size = slab;
    } else {
        zeroinit = false;
        size = slab.length;
    }
    var singleType = typeof types === "string" ? types : null;
    var ret;
    if (allocator == ALLOC_NONE) {
        ret = ptr;
    } else {
        ret = [
            typeof _malloc === "function" ? _malloc : Runtime.staticAlloc,
            Runtime.stackAlloc,
            Runtime.staticAlloc,
            Runtime.dynamicAlloc
        ][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
    }
    if (zeroinit) {
        var ptr = ret, stop;
        assert((ret & 3) == 0);
        stop = ret + (size & ~3);
        for (; ptr < stop; ptr += 4) {
            HEAP32[ptr >> 2] = 0;
        }
        stop = ret + size;
        while (ptr < stop) {
            HEAP8[ptr++ >> 0] = 0;
        }
        return ret;
    }
    if (singleType === "i8") {
        if (slab.subarray || slab.slice) {
            HEAPU8.set(slab, ret);
        } else {
            HEAPU8.set(new Uint8Array(slab), ret);
        }
        return ret;
    }
    var i = 0, type, typeSize, previousType;
    while (i < size) {
        var curr = slab[i];
        if (typeof curr === "function") {
            curr = Runtime.getFunctionIndex(curr);
        }
        type = singleType || types[i];
        if (type === 0) {
            i++;
            continue;
        }
        if (type == "i64")
            type = "i32";
        setValue(ret + i, curr, type);
        if (previousType !== type) {
            typeSize = Runtime.getNativeTypeSize(type);
            previousType = type;
        }
        i += typeSize;
    }
    return ret;
}
Module["allocate"] = allocate;
function getMemory(size) {
    if (!staticSealed)
        return Runtime.staticAlloc(size);
    if (typeof _sbrk !== "undefined" && !_sbrk.called || !runtimeInitialized)
        return Runtime.dynamicAlloc(size);
    return _malloc(size);
}
Module["getMemory"] = getMemory;
function Pointer_stringify(ptr, length) {
    if (length === 0 || !ptr)
        return "";
    var hasUtf = 0;
    var t;
    var i = 0;
    while (1) {
        t = HEAPU8[ptr + i >> 0];
        hasUtf |= t;
        if (t == 0 && !length)
            break;
        i++;
        if (length && i == length)
            break;
    }
    if (!length)
        length = i;
    var ret = "";
    if (hasUtf < 128) {
        var MAX_CHUNK = 1024;
        var curr;
        while (length > 0) {
            curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
            ret = ret ? ret + curr : curr;
            ptr += MAX_CHUNK;
            length -= MAX_CHUNK;
        }
        return ret;
    }
    return Module["UTF8ToString"](ptr);
}
Module["Pointer_stringify"] = Pointer_stringify;
function AsciiToString(ptr) {
    var str = "";
    while (1) {
        var ch = HEAP8[ptr++ >> 0];
        if (!ch)
            return str;
        str += String.fromCharCode(ch);
    }
}
Module["AsciiToString"] = AsciiToString;
function stringToAscii(str, outPtr) {
    return writeAsciiToMemory(str, outPtr, false);
}
Module["stringToAscii"] = stringToAscii;
function UTF8ArrayToString(u8Array, idx) {
    var u0, u1, u2, u3, u4, u5;
    var str = "";
    while (1) {
        u0 = u8Array[idx++];
        if (!u0)
            return str;
        if (!(u0 & 128)) {
            str += String.fromCharCode(u0);
            continue;
        }
        u1 = u8Array[idx++] & 63;
        if ((u0 & 224) == 192) {
            str += String.fromCharCode((u0 & 31) << 6 | u1);
            continue;
        }
        u2 = u8Array[idx++] & 63;
        if ((u0 & 240) == 224) {
            u0 = (u0 & 15) << 12 | u1 << 6 | u2;
        } else {
            u3 = u8Array[idx++] & 63;
            if ((u0 & 248) == 240) {
                u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u3;
            } else {
                u4 = u8Array[idx++] & 63;
                if ((u0 & 252) == 248) {
                    u0 = (u0 & 3) << 24 | u1 << 18 | u2 << 12 | u3 << 6 | u4;
                } else {
                    u5 = u8Array[idx++] & 63;
                    u0 = (u0 & 1) << 30 | u1 << 24 | u2 << 18 | u3 << 12 | u4 << 6 | u5;
                }
            }
        }
        if (u0 < 65536) {
            str += String.fromCharCode(u0);
        } else {
            var ch = u0 - 65536;
            str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
        }
    }
}
Module["UTF8ArrayToString"] = UTF8ArrayToString;
function UTF8ToString(ptr) {
    return UTF8ArrayToString(HEAPU8, ptr);
}
Module["UTF8ToString"] = UTF8ToString;
function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
    if (!(maxBytesToWrite > 0))
        return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343)
            u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
        if (u <= 127) {
            if (outIdx >= endIdx)
                break;
            outU8Array[outIdx++] = u;
        } else if (u <= 2047) {
            if (outIdx + 1 >= endIdx)
                break;
            outU8Array[outIdx++] = 192 | u >> 6;
            outU8Array[outIdx++] = 128 | u & 63;
        } else if (u <= 65535) {
            if (outIdx + 2 >= endIdx)
                break;
            outU8Array[outIdx++] = 224 | u >> 12;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63;
        } else if (u <= 2097151) {
            if (outIdx + 3 >= endIdx)
                break;
            outU8Array[outIdx++] = 240 | u >> 18;
            outU8Array[outIdx++] = 128 | u >> 12 & 63;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63;
        } else if (u <= 67108863) {
            if (outIdx + 4 >= endIdx)
                break;
            outU8Array[outIdx++] = 248 | u >> 24;
            outU8Array[outIdx++] = 128 | u >> 18 & 63;
            outU8Array[outIdx++] = 128 | u >> 12 & 63;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63;
        } else {
            if (outIdx + 5 >= endIdx)
                break;
            outU8Array[outIdx++] = 252 | u >> 30;
            outU8Array[outIdx++] = 128 | u >> 24 & 63;
            outU8Array[outIdx++] = 128 | u >> 18 & 63;
            outU8Array[outIdx++] = 128 | u >> 12 & 63;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63;
        }
    }
    outU8Array[outIdx] = 0;
    return outIdx - startIdx;
}
Module["stringToUTF8Array"] = stringToUTF8Array;
function stringToUTF8(str, outPtr, maxBytesToWrite) {
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}
Module["stringToUTF8"] = stringToUTF8;
function lengthBytesUTF8(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343)
            u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
        if (u <= 127) {
            ++len;
        } else if (u <= 2047) {
            len += 2;
        } else if (u <= 65535) {
            len += 3;
        } else if (u <= 2097151) {
            len += 4;
        } else if (u <= 67108863) {
            len += 5;
        } else {
            len += 6;
        }
    }
    return len;
}
Module["lengthBytesUTF8"] = lengthBytesUTF8;
function demangle(func) {
    var hasLibcxxabi = !!Module["___cxa_demangle"];
    if (hasLibcxxabi) {
        try {
            var buf = _malloc(func.length);
            writeStringToMemory(func.substr(1), buf);
            var status = _malloc(4);
            var ret = Module["___cxa_demangle"](buf, 0, 0, status);
            if (getValue(status, "i32") === 0 && ret) {
                return Pointer_stringify(ret);
            }
        } catch (e) {
            return func;
        } finally {
            if (buf)
                _free(buf);
            if (status)
                _free(status);
            if (ret)
                _free(ret);
        }
    }
    Runtime.warnOnce("warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling");
    return func;
}
function demangleAll(text) {
    return text.replace(/__Z[\w\d_]+/g, function (x) {
        var y = demangle(x);
        return x === y ? x : x + " [" + y + "]";
    });
}
function jsStackTrace() {
    var err = new Error();
    if (!err.stack) {
        try {
            throw new Error(0);
        } catch (e) {
            err = e;
        }
        if (!err.stack) {
            return "(no stack trace available)";
        }
    }
    return err.stack.toString();
}
function stackTrace() {
    return demangleAll(jsStackTrace());
}
Module["stackTrace"] = stackTrace;
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
    if (x % 4096 > 0) {
        x += 4096 - x % 4096;
    }
    return x;
}
var HEAP;
var buffer;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
function updateGlobalBufferViews() {
    Module["HEAP8"] = HEAP8 = new Int8Array(buffer);
    Module["HEAP16"] = HEAP16 = new Int16Array(buffer);
    Module["HEAP32"] = HEAP32 = new Int32Array(buffer);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(buffer);
    Module["HEAPU16"] = HEAPU16 = new Uint16Array(buffer);
    Module["HEAPU32"] = HEAPU32 = new Uint32Array(buffer);
    Module["HEAPF32"] = HEAPF32 = new Float32Array(buffer);
    Module["HEAPF64"] = HEAPF64 = new Float64Array(buffer);
}
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false;
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0;
var DYNAMIC_BASE = 0, DYNAMICTOP = 0;
function abortOnCannotGrowMemory() {
    abort("Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value " + TOTAL_MEMORY + ", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which adjusts the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ");
}
function enlargeMemory() {
    abortOnCannotGrowMemory();
}
var TOTAL_STACK = Module["TOTAL_STACK"] || 5242880;
var TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 16777216;
var totalMemory = 64 * 1024;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2 * TOTAL_STACK) {
    if (totalMemory < 16 * 1024 * 1024) {
        totalMemory *= 2;
    } else {
        totalMemory += 16 * 1024 * 1024;
    }
}
if (totalMemory !== TOTAL_MEMORY) {
    TOTAL_MEMORY = totalMemory;
}
if (Module["buffer"]) {
    buffer = Module["buffer"];
} else {
    buffer = new ArrayBuffer(TOTAL_MEMORY);
}
updateGlobalBufferViews();
HEAP32[0] = 255;
if (HEAPU8[0] !== 255 || HEAPU8[3] !== 0)
    throw "Typed arrays 2 must be run on a little-endian system";
Module["HEAP"] = HEAP;
Module["buffer"] = buffer;
Module["HEAP8"] = HEAP8;
Module["HEAP16"] = HEAP16;
Module["HEAP32"] = HEAP32;
Module["HEAPU8"] = HEAPU8;
Module["HEAPU16"] = HEAPU16;
Module["HEAPU32"] = HEAPU32;
Module["HEAPF32"] = HEAPF32;
Module["HEAPF64"] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
    while (callbacks.length > 0) {
        var callback = callbacks.shift();
        if (typeof callback == "function") {
            callback();
            continue;
        }
        var func = callback.func;
        if (typeof func === "number") {
            if (callback.arg === undefined) {
                Runtime.dynCall("v", func);
            } else {
                Runtime.dynCall("vi", func, [callback.arg]);
            }
        } else {
            func(callback.arg === undefined ? null : callback.arg);
        }
    }
}
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;
function preRun() {
    if (Module["preRun"]) {
        if (typeof Module["preRun"] == "function")
            Module["preRun"] = [Module["preRun"]];
        while (Module["preRun"].length) {
            addOnPreRun(Module["preRun"].shift());
        }
    }
    callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
    if (runtimeInitialized)
        return;
    runtimeInitialized = true;
    callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
    callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
    callRuntimeCallbacks(__ATEXIT__);
    runtimeExited = true;
}
function postRun() {
    if (Module["postRun"]) {
        if (typeof Module["postRun"] == "function")
            Module["postRun"] = [Module["postRun"]];
        while (Module["postRun"].length) {
            addOnPostRun(Module["postRun"].shift());
        }
    }
    callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb);
}
Module["addOnPreRun"] = addOnPreRun;
function addOnInit(cb) {
    __ATINIT__.unshift(cb);
}
Module["addOnInit"] = addOnInit;
function addOnPreMain(cb) {
    __ATMAIN__.unshift(cb);
}
Module["addOnPreMain"] = addOnPreMain;
function addOnExit(cb) {
    __ATEXIT__.unshift(cb);
}
Module["addOnExit"] = addOnExit;
function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb);
}
Module["addOnPostRun"] = addOnPostRun;
function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull)
        u8array.length = numBytesWritten;
    return u8array;
}
Module["intArrayFromString"] = intArrayFromString;
function intArrayToString(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
        var chr = array[i];
        if (chr > 255) {
            chr &= 255;
        }
        ret.push(String.fromCharCode(chr));
    }
    return ret.join("");
}
Module["intArrayToString"] = intArrayToString;
function writeStringToMemory(string, buffer, dontAddNull) {
    var array = intArrayFromString(string, dontAddNull);
    var i = 0;
    while (i < array.length) {
        var chr = array[i];
        HEAP8[buffer + i >> 0] = chr;
        i = i + 1;
    }
}
Module["writeStringToMemory"] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
    for (var i = 0; i < array.length; i++) {
        HEAP8[buffer++ >> 0] = array[i];
    }
}
Module["writeArrayToMemory"] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
    for (var i = 0; i < str.length; ++i) {
        HEAP8[buffer++ >> 0] = str.charCodeAt(i);
    }
    if (!dontAddNull)
        HEAP8[buffer >> 0] = 0;
}
Module["writeAsciiToMemory"] = writeAsciiToMemory;
if (!Math["imul"] || Math["imul"](4294967295, 5) !== -5)
    Math["imul"] = function imul(a, b) {
        var ah = a >>> 16;
        var al = a & 65535;
        var bh = b >>> 16;
        var bl = b & 65535;
        return al * bl + (ah * bl + al * bh << 16) | 0;
    };
Math.imul = Math["imul"];
if (!Math["clz32"])
    Math["clz32"] = function (x) {
        x = x >>> 0;
        for (var i = 0; i < 32; i++) {
            if (x & 1 << 31 - i)
                return i;
        }
        return 32;
    };
Math.clz32 = Math["clz32"];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
var Math_clz32 = Math.clz32;
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
function getUniqueRunDependency(id) {
    return id;
}
function addRunDependency(id) {
    runDependencies++;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies);
    }
}
Module["addRunDependency"] = addRunDependency;
function removeRunDependency(id) {
    runDependencies--;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies);
    }
    if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null;
        }
        if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback();
        }
    }
}
Module["removeRunDependency"] = removeRunDependency;
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};
var ASM_CONSTS = [];
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 24208;
__ATINIT__.push();
allocate([
    197,
    39,
    0,
    0,
    0,
    0,
    0,
    0,
    152,
    83,
    0,
    0,
    1,
    0,
    0,
    0,
    205,
    39,
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
    104,
    0,
    0,
    0,
    210,
    39,
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
    105,
    0,
    0,
    0,
    222,
    39,
    0,
    0,
    0,
    0,
    0,
    0,
    156,
    83,
    0,
    0,
    1,
    0,
    0,
    0,
    230,
    39,
    0,
    0,
    0,
    0,
    0,
    0,
    168,
    83,
    0,
    0,
    1,
    0,
    0,
    0,
    236,
    39,
    0,
    0,
    0,
    0,
    0,
    0,
    164,
    83,
    0,
    0,
    1,
    0,
    0,
    0,
    245,
    39,
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
    118,
    0,
    0,
    0,
    253,
    39,
    0,
    0,
    0,
    0,
    0,
    0,
    160,
    83,
    0,
    0,
    1,
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
    0,
    0,
    0,
    255,
    255,
    255,
    255,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    2,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    2,
    0,
    0,
    0,
    4,
    0,
    0,
    0,
    5,
    0,
    0,
    0,
    6,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    7,
    0,
    0,
    0,
    8,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    9,
    0,
    0,
    0,
    10,
    0,
    0,
    0,
    11,
    0,
    0,
    0,
    12,
    0,
    0,
    0,
    13,
    0,
    0,
    0,
    14,
    0,
    0,
    0,
    15,
    0,
    0,
    0,
    16,
    0,
    0,
    0,
    17,
    0,
    0,
    0,
    17,
    0,
    0,
    0,
    17,
    0,
    0,
    0,
    17,
    0,
    0,
    0,
    17,
    0,
    0,
    0,
    17,
    0,
    0,
    0,
    17,
    0,
    0,
    0,
    17,
    0,
    0,
    0,
    17,
    0,
    0,
    0,
    17,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    18,
    0,
    0,
    0,
    19,
    0,
    0,
    0,
    20,
    0,
    0,
    0,
    21,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    22,
    0,
    0,
    0,
    22,
    0,
    0,
    0,
    22,
    0,
    0,
    0,
    22,
    0,
    0,
    0,
    22,
    0,
    0,
    0,
    22,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    23,
    0,
    0,
    0,
    24,
    0,
    0,
    0,
    25,
    0,
    0,
    0,
    26,
    0,
    0,
    0,
    27,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    28,
    0,
    0,
    0,
    29,
    0,
    0,
    0,
    30,
    0,
    0,
    0,
    31,
    0,
    0,
    0,
    32,
    0,
    0,
    0,
    33,
    0,
    0,
    0,
    34,
    0,
    0,
    0,
    35,
    0,
    0,
    0,
    36,
    0,
    0,
    0,
    37,
    0,
    0,
    0,
    38,
    0,
    0,
    0,
    39,
    0,
    0,
    0,
    40,
    0,
    0,
    0,
    41,
    0,
    0,
    0,
    42,
    0,
    0,
    0,
    43,
    0,
    0,
    0,
    44,
    0,
    0,
    0,
    45,
    0,
    0,
    0,
    46,
    0,
    0,
    0,
    47,
    0,
    0,
    0,
    48,
    0,
    0,
    0,
    49,
    0,
    0,
    0,
    50,
    0,
    0,
    0,
    37,
    0,
    0,
    0,
    51,
    0,
    0,
    0,
    37,
    0,
    0,
    0,
    52,
    0,
    0,
    0,
    53,
    0,
    0,
    0,
    54,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    2,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    237,
    58,
    0,
    0,
    250,
    58,
    0,
    0,
    60,
    59,
    0,
    0,
    122,
    59,
    0,
    0,
    185,
    59,
    0,
    0,
    249,
    59,
    0,
    0,
    57,
    60,
    0,
    0,
    119,
    60,
    0,
    0,
    158,
    60,
    0,
    0,
    220,
    60,
    0,
    0,
    27,
    61,
    0,
    0,
    90,
    61,
    0,
    0,
    155,
    61,
    0,
    0,
    220,
    61,
    0,
    0,
    32,
    62,
    0,
    0,
    38,
    62,
    0,
    0,
    100,
    62,
    0,
    0,
    162,
    62,
    0,
    0,
    225,
    62,
    0,
    0,
    33,
    63,
    0,
    0,
    95,
    63,
    0,
    0,
    157,
    63,
    0,
    0,
    169,
    63,
    0,
    0,
    233,
    63,
    0,
    0,
    39,
    64,
    0,
    0,
    48,
    64,
    0,
    0,
    110,
    64,
    0,
    0,
    172,
    64,
    0,
    0,
    236,
    64,
    0,
    0,
    44,
    65,
    0,
    0,
    107,
    65,
    0,
    0,
    170,
    65,
    0,
    0,
    234,
    65,
    0,
    0,
    63,
    66,
    0,
    0,
    127,
    66,
    0,
    0,
    189,
    66,
    0,
    0,
    253,
    66,
    0,
    0,
    61,
    67,
    0,
    0,
    104,
    67,
    0,
    0,
    169,
    67,
    0,
    0,
    232,
    67,
    0,
    0,
    38,
    68,
    0,
    0,
    100,
    68,
    0,
    0,
    165,
    68,
    0,
    0,
    229,
    68,
    0,
    0,
    35,
    69,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    2,
    0,
    0,
    192,
    3,
    0,
    0,
    192,
    4,
    0,
    0,
    192,
    5,
    0,
    0,
    192,
    6,
    0,
    0,
    192,
    7,
    0,
    0,
    192,
    8,
    0,
    0,
    192,
    9,
    0,
    0,
    192,
    10,
    0,
    0,
    192,
    11,
    0,
    0,
    192,
    12,
    0,
    0,
    192,
    13,
    0,
    0,
    192,
    14,
    0,
    0,
    192,
    15,
    0,
    0,
    192,
    16,
    0,
    0,
    192,
    17,
    0,
    0,
    192,
    18,
    0,
    0,
    192,
    19,
    0,
    0,
    192,
    20,
    0,
    0,
    192,
    21,
    0,
    0,
    192,
    22,
    0,
    0,
    192,
    23,
    0,
    0,
    192,
    24,
    0,
    0,
    192,
    25,
    0,
    0,
    192,
    26,
    0,
    0,
    192,
    27,
    0,
    0,
    192,
    28,
    0,
    0,
    192,
    29,
    0,
    0,
    192,
    30,
    0,
    0,
    192,
    31,
    0,
    0,
    192,
    0,
    0,
    0,
    179,
    1,
    0,
    0,
    195,
    2,
    0,
    0,
    195,
    3,
    0,
    0,
    195,
    4,
    0,
    0,
    195,
    5,
    0,
    0,
    195,
    6,
    0,
    0,
    195,
    7,
    0,
    0,
    195,
    8,
    0,
    0,
    195,
    9,
    0,
    0,
    195,
    10,
    0,
    0,
    195,
    11,
    0,
    0,
    195,
    12,
    0,
    0,
    195,
    13,
    0,
    0,
    211,
    14,
    0,
    0,
    195,
    15,
    0,
    0,
    195,
    0,
    0,
    12,
    187,
    1,
    0,
    12,
    195,
    2,
    0,
    12,
    195,
    3,
    0,
    12,
    195,
    4,
    0,
    12,
    211,
    8,
    7,
    0,
    0,
    5,
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
    1,
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
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    2,
    0,
    0,
    0,
    126,
    86,
    0,
    0,
    0,
    4,
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
    1,
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
    10,
    255,
    255,
    255,
    255,
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
    8,
    7,
    0,
    0,
    128,
    7,
    0,
    0,
    9,
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
    1,
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
    0,
    0,
    0,
    3,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    2,
    0,
    0,
    0,
    134,
    90,
    0,
    0,
    0,
    4,
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
    255,
    255,
    255,
    255,
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
    244,
    7,
    0,
    0,
    5,
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
    1,
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
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    4,
    0,
    0,
    0,
    2,
    0,
    0,
    0,
    142,
    94,
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
    2,
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
    255,
    255,
    255,
    255,
    255,
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
    0,
    0,
    0,
    0,
    5,
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
    0,
    0,
    0,
    0,
    0,
    0,
    255,
    255,
    255,
    255,
    255,
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
    0,
    0,
    0,
    0,
    45,
    244,
    81,
    88,
    207,
    140,
    177,
    192,
    70,
    246,
    181,
    203,
    41,
    49,
    3,
    199,
    4,
    91,
    112,
    48,
    180,
    93,
    253,
    32,
    120,
    127,
    139,
    154,
    216,
    89,
    41,
    80,
    104,
    72,
    137,
    171,
    167,
    86,
    3,
    108,
    255,
    183,
    205,
    136,
    63,
    212,
    119,
    180,
    43,
    165,
    163,
    112,
    241,
    186,
    228,
    168,
    252,
    65,
    131,
    253,
    217,
    111,
    225,
    138,
    122,
    47,
    45,
    116,
    150,
    7,
    31,
    13,
    9,
    94,
    3,
    118,
    44,
    112,
    247,
    64,
    165,
    44,
    167,
    111,
    87,
    65,
    168,
    170,
    116,
    223,
    160,
    88,
    100,
    3,
    74,
    199,
    196,
    60,
    83,
    174,
    175,
    95,
    24,
    4,
    21,
    177,
    227,
    109,
    40,
    134,
    171,
    12,
    164,
    191,
    67,
    240,
    233,
    80,
    129,
    57,
    87,
    22,
    82,
    55,
    3,
    0,
    0,
    0,
    112,
    255,
    188,
    0,
    112,
    255,
    136,
    1,
    83,
    2,
    112,
    255,
    220,
    255,
    112,
    255,
    228,
    1,
    225,
    255,
    112,
    255,
    112,
    255,
    224,
    255,
    83,
    2,
    112,
    255,
    245,
    255,
    112,
    255,
    246,
    255,
    249,
    255,
    112,
    255,
    112,
    255,
    250,
    255,
    251,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    83,
    2,
    83,
    2,
    222,
    0,
    112,
    255,
    2,
    0,
    112,
    255,
    112,
    255,
    112,
    255,
    164,
    2,
    14,
    0,
    112,
    255,
    112,
    255,
    131,
    0,
    109,
    2,
    83,
    2,
    229,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    54,
    0,
    83,
    2,
    112,
    255,
    164,
    2,
    20,
    0,
    83,
    2,
    21,
    0,
    83,
    2,
    83,
    2,
    13,
    0,
    37,
    0,
    57,
    2,
    112,
    255,
    169,
    1,
    23,
    2,
    1,
    0,
    112,
    255,
    112,
    255,
    62,
    1,
    112,
    255,
    112,
    255,
    83,
    2,
    83,
    2,
    83,
    2,
    83,
    2,
    83,
    2,
    83,
    2,
    83,
    2,
    112,
    255,
    112,
    255,
    233,
    255,
    41,
    0,
    36,
    0,
    164,
    2,
    39,
    0,
    43,
    0,
    180,
    1,
    83,
    2,
    189,
    1,
    83,
    2,
    229,
    1,
    238,
    1,
    112,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    40,
    0,
    164,
    2,
    112,
    255,
    14,
    1,
    23,
    2,
    112,
    255,
    112,
    255,
    83,
    2,
    83,
    2,
    234,
    255,
    51,
    0,
    51,
    0,
    4,
    0,
    4,
    0,
    4,
    0,
    4,
    0,
    83,
    2,
    105,
    0,
    112,
    255,
    135,
    2,
    112,
    255,
    23,
    0,
    112,
    255,
    53,
    0,
    164,
    2,
    112,
    255,
    164,
    2,
    112,
    255,
    112,
    255,
    57,
    2,
    112,
    255,
    112,
    255,
    131,
    0,
    123,
    0,
    234,
    255,
    112,
    255,
    236,
    255,
    164,
    2,
    45,
    0,
    91,
    0,
    94,
    0,
    57,
    0,
    55,
    0,
    112,
    255,
    102,
    0,
    60,
    0,
    112,
    255,
    96,
    1,
    56,
    0,
    58,
    0,
    65,
    0,
    102,
    0,
    24,
    0,
    83,
    2,
    112,
    255,
    23,
    2,
    102,
    0,
    112,
    255,
    112,
    255,
    67,
    0,
    68,
    0,
    69,
    0,
    70,
    0,
    115,
    0,
    116,
    0,
    81,
    0,
    109,
    0,
    23,
    2,
    112,
    255,
    112,
    255,
    132,
    0,
    86,
    0,
    88,
    0,
    89,
    0,
    112,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    7,
    0,
    112,
    255,
    92,
    0,
    97,
    0,
    83,
    2,
    102,
    0,
    112,
    255,
    23,
    0,
    112,
    255,
    112,
    255,
    112,
    255,
    99,
    0,
    23,
    2,
    12,
    0,
    222,
    0,
    112,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    9,
    0,
    102,
    0,
    112,
    255,
    23,
    2,
    112,
    255,
    3,
    0,
    1,
    0,
    4,
    0,
    146,
    0,
    3,
    0,
    3,
    0,
    37,
    0,
    148,
    0,
    151,
    0,
    45,
    0,
    3,
    0,
    13,
    0,
    3,
    0,
    45,
    0,
    50,
    0,
    3,
    0,
    38,
    0,
    39,
    0,
    40,
    0,
    41,
    0,
    42,
    0,
    43,
    0,
    45,
    0,
    50,
    0,
    10,
    0,
    45,
    0,
    12,
    0,
    50,
    0,
    30,
    0,
    31,
    0,
    50,
    0,
    8,
    0,
    8,
    0,
    26,
    0,
    45,
    0,
    45,
    0,
    179,
    0,
    178,
    0,
    45,
    0,
    45,
    0,
    45,
    0,
    43,
    0,
    44,
    0,
    4,
    0,
    5,
    0,
    44,
    0,
    44,
    0,
    43,
    0,
    50,
    0,
    48,
    0,
    11,
    0,
    194,
    0,
    54,
    0,
    44,
    0,
    56,
    0,
    57,
    0,
    44,
    0,
    48,
    0,
    60,
    0,
    46,
    0,
    63,
    0,
    49,
    0,
    8,
    0,
    40,
    0,
    40,
    0,
    45,
    0,
    45,
    0,
    67,
    0,
    70,
    0,
    71,
    0,
    72,
    0,
    73,
    0,
    74,
    0,
    75,
    0,
    76,
    0,
    52,
    0,
    52,
    0,
    38,
    0,
    39,
    0,
    40,
    0,
    41,
    0,
    42,
    0,
    43,
    0,
    46,
    0,
    86,
    0,
    49,
    0,
    88,
    0,
    46,
    0,
    45,
    0,
    49,
    0,
    51,
    0,
    40,
    0,
    41,
    0,
    42,
    0,
    43,
    0,
    50,
    0,
    99,
    0,
    44,
    0,
    98,
    0,
    8,
    0,
    102,
    0,
    103,
    0,
    8,
    0,
    46,
    0,
    49,
    0,
    3,
    0,
    46,
    0,
    51,
    0,
    50,
    0,
    111,
    0,
    112,
    0,
    6,
    0,
    114,
    0,
    8,
    0,
    9,
    0,
    50,
    0,
    47,
    0,
    12,
    0,
    51,
    0,
    51,
    0,
    50,
    0,
    16,
    0,
    124,
    0,
    8,
    0,
    8,
    0,
    44,
    0,
    21,
    0,
    4,
    0,
    23,
    0,
    24,
    0,
    25,
    0,
    22,
    0,
    27,
    0,
    28,
    0,
    11,
    0,
    3,
    0,
    31,
    0,
    51,
    0,
    50,
    0,
    50,
    0,
    142,
    0,
    36,
    0,
    11,
    0,
    51,
    0,
    39,
    0,
    46,
    0,
    148,
    0,
    150,
    0,
    51,
    0,
    188,
    0,
    45,
    0,
    124,
    0,
    181,
    0,
    8,
    0,
    255,
    255,
    255,
    255,
    51,
    0,
    255,
    255,
    255,
    255,
    162,
    0,
    255,
    255,
    38,
    0,
    39,
    0,
    40,
    0,
    41,
    0,
    42,
    0,
    43,
    0,
    255,
    255,
    255,
    255,
    38,
    0,
    39,
    0,
    40,
    0,
    41,
    0,
    42,
    0,
    43,
    0,
    255,
    255,
    178,
    0,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    186,
    0,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    0,
    0,
    1,
    0,
    255,
    255,
    3,
    0,
    255,
    255,
    196,
    0,
    6,
    0,
    7,
    0,
    8,
    0,
    9,
    0,
    255,
    255,
    255,
    255,
    12,
    0,
    13,
    0,
    14,
    0,
    15,
    0,
    16,
    0,
    17,
    0,
    18,
    0,
    19,
    0,
    20,
    0,
    21,
    0,
    255,
    255,
    23,
    0,
    24,
    0,
    25,
    0,
    255,
    255,
    27,
    0,
    28,
    0,
    29,
    0,
    30,
    0,
    31,
    0,
    32,
    0,
    33,
    0,
    34,
    0,
    1,
    0,
    36,
    0,
    3,
    0,
    255,
    255,
    39,
    0,
    6,
    0,
    7,
    0,
    8,
    0,
    9,
    0,
    44,
    0,
    45,
    0,
    12,
    0,
    47,
    0,
    14,
    0,
    15,
    0,
    16,
    0,
    17,
    0,
    18,
    0,
    19,
    0,
    20,
    0,
    21,
    0,
    255,
    255,
    23,
    0,
    24,
    0,
    25,
    0,
    255,
    255,
    27,
    0,
    28,
    0,
    29,
    0,
    30,
    0,
    31,
    0,
    32,
    0,
    33,
    0,
    34,
    0,
    255,
    255,
    36,
    0,
    255,
    255,
    255,
    255,
    39,
    0,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    44,
    0,
    45,
    0,
    255,
    255,
    47,
    0,
    48,
    0,
    1,
    0,
    255,
    255,
    3,
    0,
    255,
    255,
    255,
    255,
    6,
    0,
    7,
    0,
    8,
    0,
    9,
    0,
    255,
    255,
    255,
    255,
    12,
    0,
    255,
    255,
    14,
    0,
    15,
    0,
    16,
    0,
    17,
    0,
    18,
    0,
    19,
    0,
    20,
    0,
    21,
    0,
    255,
    255,
    23,
    0,
    24,
    0,
    25,
    0,
    255,
    255,
    27,
    0,
    28,
    0,
    29,
    0,
    30,
    0,
    31,
    0,
    32,
    0,
    33,
    0,
    34,
    0,
    255,
    255,
    36,
    0,
    255,
    255,
    255,
    255,
    39,
    0,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    44,
    0,
    45,
    0,
    255,
    255,
    47,
    0,
    48,
    0,
    1,
    0,
    255,
    255,
    3,
    0,
    255,
    255,
    255,
    255,
    6,
    0,
    7,
    0,
    8,
    0,
    9,
    0,
    255,
    255,
    255,
    255,
    12,
    0,
    255,
    255,
    14,
    0,
    15,
    0,
    16,
    0,
    17,
    0,
    18,
    0,
    19,
    0,
    20,
    0,
    21,
    0,
    255,
    255,
    23,
    0,
    24,
    0,
    25,
    0,
    255,
    255,
    27,
    0,
    28,
    0,
    29,
    0,
    30,
    0,
    31,
    0,
    32,
    0,
    33,
    0,
    34,
    0,
    255,
    255,
    36,
    0,
    255,
    255,
    255,
    255,
    39,
    0,
    6,
    0,
    255,
    255,
    8,
    0,
    9,
    0,
    44,
    0,
    45,
    0,
    12,
    0,
    47,
    0,
    255,
    255,
    255,
    255,
    16,
    0,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    21,
    0,
    255,
    255,
    23,
    0,
    24,
    0,
    25,
    0,
    255,
    255,
    27,
    0,
    28,
    0,
    255,
    255,
    255,
    255,
    31,
    0,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    36,
    0,
    255,
    255,
    255,
    255,
    39,
    0,
    255,
    255,
    255,
    255,
    255,
    255,
    3,
    0,
    255,
    255,
    45,
    0,
    6,
    0,
    7,
    0,
    8,
    0,
    9,
    0,
    255,
    255,
    51,
    0,
    12,
    0,
    255,
    255,
    14,
    0,
    15,
    0,
    16,
    0,
    17,
    0,
    18,
    0,
    19,
    0,
    20,
    0,
    21,
    0,
    255,
    255,
    23,
    0,
    24,
    0,
    25,
    0,
    255,
    255,
    27,
    0,
    28,
    0,
    29,
    0,
    30,
    0,
    31,
    0,
    32,
    0,
    33,
    0,
    34,
    0,
    255,
    255,
    36,
    0,
    4,
    0,
    5,
    0,
    39,
    0,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    11,
    0,
    45,
    0,
    255,
    255,
    47,
    0,
    4,
    0,
    5,
    0,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    11,
    0,
    255,
    255,
    4,
    0,
    5,
    0,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    11,
    0,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    38,
    0,
    39,
    0,
    40,
    0,
    41,
    0,
    42,
    0,
    43,
    0,
    255,
    255,
    255,
    255,
    46,
    0,
    255,
    255,
    255,
    255,
    38,
    0,
    39,
    0,
    40,
    0,
    41,
    0,
    42,
    0,
    43,
    0,
    255,
    255,
    255,
    255,
    46,
    0,
    38,
    0,
    39,
    0,
    40,
    0,
    41,
    0,
    42,
    0,
    43,
    0,
    4,
    0,
    5,
    0,
    46,
    0,
    8,
    0,
    255,
    255,
    255,
    255,
    255,
    255,
    11,
    0,
    255,
    255,
    4,
    0,
    5,
    0,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    11,
    0,
    255,
    255,
    23,
    0,
    24,
    0,
    25,
    0,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    31,
    0,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    36,
    0,
    255,
    255,
    255,
    255,
    38,
    0,
    39,
    0,
    40,
    0,
    41,
    0,
    42,
    0,
    43,
    0,
    255,
    255,
    255,
    255,
    46,
    0,
    38,
    0,
    39,
    0,
    40,
    0,
    41,
    0,
    42,
    0,
    43,
    0,
    255,
    255,
    255,
    255,
    46,
    0,
    6,
    0,
    7,
    0,
    8,
    0,
    9,
    0,
    255,
    255,
    255,
    255,
    12,
    0,
    255,
    255,
    14,
    0,
    15,
    0,
    16,
    0,
    17,
    0,
    18,
    0,
    19,
    0,
    20,
    0,
    21,
    0,
    255,
    255,
    23,
    0,
    24,
    0,
    25,
    0,
    255,
    255,
    27,
    0,
    28,
    0,
    29,
    0,
    30,
    0,
    31,
    0,
    32,
    0,
    33,
    0,
    34,
    0,
    255,
    255,
    36,
    0,
    255,
    255,
    255,
    255,
    39,
    0,
    6,
    0,
    7,
    0,
    8,
    0,
    9,
    0,
    255,
    255,
    45,
    0,
    12,
    0,
    47,
    0,
    255,
    255,
    255,
    255,
    16,
    0,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    21,
    0,
    255,
    255,
    23,
    0,
    24,
    0,
    25,
    0,
    255,
    255,
    27,
    0,
    28,
    0,
    255,
    255,
    255,
    255,
    31,
    0,
    6,
    0,
    255,
    255,
    8,
    0,
    9,
    0,
    36,
    0,
    255,
    255,
    12,
    0,
    39,
    0,
    255,
    255,
    255,
    255,
    16,
    0,
    255,
    255,
    255,
    255,
    45,
    0,
    255,
    255,
    21,
    0,
    255,
    255,
    23,
    0,
    24,
    0,
    25,
    0,
    255,
    255,
    27,
    0,
    28,
    0,
    255,
    255,
    255,
    255,
    31,
    0,
    6,
    0,
    255,
    255,
    8,
    0,
    9,
    0,
    36,
    0,
    255,
    255,
    12,
    0,
    39,
    0,
    255,
    255,
    255,
    255,
    16,
    0,
    255,
    255,
    255,
    255,
    45,
    0,
    255,
    255,
    21,
    0,
    255,
    255,
    23,
    0,
    24,
    0,
    25,
    0,
    255,
    255,
    27,
    0,
    28,
    0,
    255,
    255,
    255,
    255,
    31,
    0,
    6,
    0,
    255,
    255,
    8,
    0,
    9,
    0,
    36,
    0,
    255,
    255,
    12,
    0,
    39,
    0,
    255,
    255,
    255,
    255,
    16,
    0,
    255,
    255,
    255,
    255,
    45,
    0,
    255,
    255,
    21,
    0,
    255,
    255,
    23,
    0,
    24,
    0,
    25,
    0,
    255,
    255,
    27,
    0,
    28,
    0,
    255,
    255,
    255,
    255,
    31,
    0,
    255,
    255,
    4,
    0,
    5,
    0,
    255,
    255,
    36,
    0,
    255,
    255,
    255,
    255,
    39,
    0,
    11,
    0,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    45,
    0,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    38,
    0,
    39,
    0,
    40,
    0,
    41,
    0,
    42,
    0,
    43,
    0,
    41,
    0,
    35,
    0,
    42,
    0,
    156,
    0,
    98,
    0,
    66,
    0,
    48,
    0,
    160,
    0,
    162,
    0,
    43,
    0,
    180,
    0,
    52,
    0,
    98,
    0,
    50,
    0,
    44,
    0,
    191,
    0,
    71,
    0,
    72,
    0,
    73,
    0,
    74,
    0,
    75,
    0,
    76,
    0,
    43,
    0,
    44,
    0,
    77,
    0,
    43,
    0,
    78,
    0,
    112,
    0,
    61,
    0,
    62,
    0,
    142,
    0,
    133,
    0,
    157,
    0,
    181,
    0,
    54,
    0,
    56,
    0,
    186,
    0,
    185,
    0,
    57,
    0,
    58,
    0,
    59,
    0,
    82,
    0,
    83,
    0,
    68,
    0,
    69,
    0,
    99,
    0,
    67,
    0,
    76,
    0,
    85,
    0,
    100,
    0,
    70,
    0,
    196,
    0,
    87,
    0,
    99,
    0,
    89,
    0,
    90,
    0,
    192,
    0,
    195,
    0,
    96,
    0,
    91,
    0,
    41,
    0,
    147,
    0,
    84,
    0,
    134,
    0,
    158,
    0,
    86,
    0,
    88,
    0,
    101,
    0,
    104,
    0,
    105,
    0,
    106,
    0,
    107,
    0,
    108,
    0,
    109,
    0,
    110,
    0,
    135,
    0,
    159,
    0,
    71,
    0,
    72,
    0,
    73,
    0,
    74,
    0,
    75,
    0,
    76,
    0,
    92,
    0,
    119,
    0,
    114,
    0,
    121,
    0,
    113,
    0,
    116,
    0,
    124,
    0,
    115,
    0,
    73,
    0,
    74,
    0,
    75,
    0,
    76,
    0,
    143,
    0,
    126,
    0,
    138,
    0,
    125,
    0,
    144,
    0,
    127,
    0,
    128,
    0,
    145,
    0,
    146,
    0,
    147,
    0,
    149,
    0,
    151,
    0,
    153,
    0,
    154,
    0,
    129,
    0,
    83,
    0,
    4,
    0,
    132,
    0,
    6,
    0,
    7,
    0,
    155,
    0,
    165,
    0,
    8,
    0,
    163,
    0,
    164,
    0,
    166,
    0,
    12,
    0,
    96,
    0,
    167,
    0,
    168,
    0,
    169,
    0,
    17,
    0,
    68,
    0,
    18,
    0,
    19,
    0,
    20,
    0,
    170,
    0,
    21,
    0,
    22,
    0,
    70,
    0,
    173,
    0,
    25,
    0,
    175,
    0,
    176,
    0,
    177,
    0,
    83,
    0,
    29,
    0,
    70,
    0,
    183,
    0,
    30,
    0,
    189,
    0,
    119,
    0,
    161,
    0,
    184,
    0,
    193,
    0,
    31,
    0,
    141,
    0,
    187,
    0,
    47,
    0,
    0,
    0,
    0,
    0,
    130,
    0,
    0,
    0,
    0,
    0,
    172,
    0,
    0,
    0,
    71,
    0,
    72,
    0,
    73,
    0,
    74,
    0,
    75,
    0,
    76,
    0,
    0,
    0,
    0,
    0,
    71,
    0,
    72,
    0,
    73,
    0,
    74,
    0,
    75,
    0,
    76,
    0,
    0,
    0,
    119,
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
    190,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    2,
    0,
    3,
    0,
    0,
    0,
    247,
    255,
    0,
    0,
    197,
    0,
    4,
    0,
    5,
    0,
    6,
    0,
    7,
    0,
    0,
    0,
    0,
    0,
    8,
    0,
    9,
    0,
    10,
    0,
    11,
    0,
    12,
    0,
    13,
    0,
    14,
    0,
    15,
    0,
    16,
    0,
    17,
    0,
    0,
    0,
    18,
    0,
    19,
    0,
    20,
    0,
    0,
    0,
    21,
    0,
    22,
    0,
    23,
    0,
    24,
    0,
    25,
    0,
    26,
    0,
    27,
    0,
    28,
    0,
    63,
    0,
    29,
    0,
    243,
    255,
    0,
    0,
    30,
    0,
    4,
    0,
    5,
    0,
    6,
    0,
    7,
    0,
    247,
    255,
    31,
    0,
    8,
    0,
    32,
    0,
    10,
    0,
    11,
    0,
    12,
    0,
    13,
    0,
    14,
    0,
    15,
    0,
    16,
    0,
    17,
    0,
    0,
    0,
    18,
    0,
    19,
    0,
    20,
    0,
    0,
    0,
    21,
    0,
    22,
    0,
    23,
    0,
    24,
    0,
    25,
    0,
    26,
    0,
    27,
    0,
    28,
    0,
    0,
    0,
    29,
    0,
    0,
    0,
    0,
    0,
    30,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    243,
    255,
    31,
    0,
    0,
    0,
    32,
    0,
    243,
    255,
    63,
    0,
    0,
    0,
    241,
    255,
    0,
    0,
    0,
    0,
    4,
    0,
    5,
    0,
    6,
    0,
    7,
    0,
    0,
    0,
    0,
    0,
    8,
    0,
    0,
    0,
    10,
    0,
    11,
    0,
    12,
    0,
    13,
    0,
    14,
    0,
    15,
    0,
    16,
    0,
    17,
    0,
    0,
    0,
    18,
    0,
    19,
    0,
    20,
    0,
    0,
    0,
    21,
    0,
    22,
    0,
    23,
    0,
    24,
    0,
    25,
    0,
    26,
    0,
    27,
    0,
    28,
    0,
    0,
    0,
    29,
    0,
    0,
    0,
    0,
    0,
    30,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    241,
    255,
    31,
    0,
    0,
    0,
    32,
    0,
    241,
    255,
    63,
    0,
    0,
    0,
    244,
    255,
    0,
    0,
    0,
    0,
    4,
    0,
    5,
    0,
    6,
    0,
    7,
    0,
    0,
    0,
    0,
    0,
    8,
    0,
    0,
    0,
    10,
    0,
    11,
    0,
    12,
    0,
    13,
    0,
    14,
    0,
    15,
    0,
    16,
    0,
    17,
    0,
    0,
    0,
    18,
    0,
    19,
    0,
    20,
    0,
    0,
    0,
    21,
    0,
    22,
    0,
    23,
    0,
    24,
    0,
    25,
    0,
    26,
    0,
    27,
    0,
    28,
    0,
    0,
    0,
    29,
    0,
    0,
    0,
    0,
    0,
    30,
    0,
    4,
    0,
    0,
    0,
    6,
    0,
    7,
    0,
    244,
    255,
    31,
    0,
    8,
    0,
    32,
    0,
    0,
    0,
    0,
    0,
    12,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    17,
    0,
    0,
    0,
    18,
    0,
    19,
    0,
    20,
    0,
    0,
    0,
    21,
    0,
    22,
    0,
    0,
    0,
    0,
    0,
    25,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    29,
    0,
    0,
    0,
    0,
    0,
    30,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    40,
    0,
    0,
    0,
    31,
    0,
    4,
    0,
    5,
    0,
    6,
    0,
    7,
    0,
    0,
    0,
    152,
    0,
    8,
    0,
    0,
    0,
    10,
    0,
    11,
    0,
    12,
    0,
    13,
    0,
    14,
    0,
    15,
    0,
    16,
    0,
    17,
    0,
    0,
    0,
    18,
    0,
    19,
    0,
    20,
    0,
    0,
    0,
    21,
    0,
    22,
    0,
    23,
    0,
    24,
    0,
    25,
    0,
    26,
    0,
    27,
    0,
    28,
    0,
    0,
    0,
    29,
    0,
    68,
    0,
    69,
    0,
    30,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    70,
    0,
    31,
    0,
    0,
    0,
    32,
    0,
    68,
    0,
    69,
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
    70,
    0,
    0,
    0,
    68,
    0,
    69,
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
    70,
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
    71,
    0,
    72,
    0,
    73,
    0,
    74,
    0,
    75,
    0,
    76,
    0,
    0,
    0,
    0,
    0,
    97,
    0,
    0,
    0,
    0,
    0,
    71,
    0,
    72,
    0,
    73,
    0,
    74,
    0,
    75,
    0,
    76,
    0,
    0,
    0,
    0,
    0,
    117,
    0,
    71,
    0,
    72,
    0,
    73,
    0,
    74,
    0,
    75,
    0,
    76,
    0,
    68,
    0,
    69,
    0,
    120,
    0,
    45,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    70,
    0,
    0,
    0,
    68,
    0,
    69,
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
    70,
    0,
    0,
    0,
    46,
    0,
    19,
    0,
    20,
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
    25,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    29,
    0,
    0,
    0,
    0,
    0,
    71,
    0,
    72,
    0,
    73,
    0,
    74,
    0,
    75,
    0,
    76,
    0,
    0,
    0,
    0,
    0,
    122,
    0,
    71,
    0,
    72,
    0,
    73,
    0,
    74,
    0,
    75,
    0,
    76,
    0,
    0,
    0,
    0,
    0,
    123,
    0,
    4,
    0,
    5,
    0,
    6,
    0,
    7,
    0,
    0,
    0,
    0,
    0,
    8,
    0,
    0,
    0,
    10,
    0,
    11,
    0,
    12,
    0,
    13,
    0,
    14,
    0,
    15,
    0,
    16,
    0,
    17,
    0,
    0,
    0,
    18,
    0,
    19,
    0,
    20,
    0,
    0,
    0,
    21,
    0,
    22,
    0,
    23,
    0,
    24,
    0,
    25,
    0,
    26,
    0,
    27,
    0,
    28,
    0,
    0,
    0,
    29,
    0,
    0,
    0,
    0,
    0,
    30,
    0,
    4,
    0,
    93,
    0,
    6,
    0,
    7,
    0,
    0,
    0,
    31,
    0,
    8,
    0,
    32,
    0,
    0,
    0,
    0,
    0,
    12,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    17,
    0,
    0,
    0,
    18,
    0,
    19,
    0,
    20,
    0,
    0,
    0,
    21,
    0,
    22,
    0,
    0,
    0,
    0,
    0,
    25,
    0,
    4,
    0,
    0,
    0,
    6,
    0,
    7,
    0,
    29,
    0,
    0,
    0,
    8,
    0,
    30,
    0,
    0,
    0,
    0,
    0,
    12,
    0,
    0,
    0,
    0,
    0,
    31,
    0,
    0,
    0,
    17,
    0,
    0,
    0,
    18,
    0,
    19,
    0,
    20,
    0,
    0,
    0,
    21,
    0,
    22,
    0,
    0,
    0,
    0,
    0,
    25,
    0,
    4,
    0,
    0,
    0,
    79,
    0,
    7,
    0,
    29,
    0,
    0,
    0,
    8,
    0,
    30,
    0,
    0,
    0,
    0,
    0,
    12,
    0,
    0,
    0,
    0,
    0,
    31,
    0,
    0,
    0,
    17,
    0,
    0,
    0,
    18,
    0,
    19,
    0,
    20,
    0,
    0,
    0,
    21,
    0,
    22,
    0,
    0,
    0,
    0,
    0,
    25,
    0,
    4,
    0,
    0,
    0,
    131,
    0,
    7,
    0,
    29,
    0,
    0,
    0,
    8,
    0,
    30,
    0,
    0,
    0,
    0,
    0,
    12,
    0,
    0,
    0,
    0,
    0,
    31,
    0,
    0,
    0,
    17,
    0,
    0,
    0,
    18,
    0,
    19,
    0,
    20,
    0,
    0,
    0,
    21,
    0,
    22,
    0,
    0,
    0,
    0,
    0,
    25,
    0,
    0,
    0,
    68,
    0,
    69,
    0,
    0,
    0,
    29,
    0,
    0,
    0,
    0,
    0,
    30,
    0,
    70,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    31,
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
    71,
    0,
    72,
    0,
    73,
    0,
    74,
    0,
    75,
    0,
    76,
    0,
    112,
    255,
    112,
    255,
    112,
    255,
    113,
    255,
    112,
    255,
    217,
    255,
    0,
    0,
    253,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    27,
    0,
    112,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    227,
    255,
    112,
    255,
    112,
    255,
    115,
    255,
    112,
    255,
    254,
    255,
    112,
    255,
    112,
    255,
    112,
    255,
    145,
    0,
    112,
    255,
    255,
    255,
    1,
    0,
    33,
    0,
    150,
    0,
    34,
    0,
    64,
    0,
    65,
    0,
    36,
    0,
    53,
    0,
    148,
    0,
    178,
    0,
    194,
    0,
    139,
    0,
    55,
    0,
    140,
    0,
    60,
    0,
    94,
    0,
    95,
    0,
    171,
    0,
    179,
    0,
    37,
    0,
    188,
    0,
    49,
    0,
    136,
    0,
    182,
    0,
    137,
    0,
    80,
    0,
    81,
    0,
    118,
    0,
    51,
    0,
    38,
    0,
    111,
    0,
    102,
    0,
    103,
    0,
    39,
    0,
    174,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    2,
    0,
    2,
    0,
    47,
    0,
    45,
    0,
    40,
    0,
    38,
    0,
    32,
    0,
    45,
    0,
    1,
    0,
    33,
    0,
    33,
    0,
    29,
    0,
    33,
    0,
    29,
    0,
    29,
    0,
    28,
    0,
    33,
    0,
    44,
    0,
    36,
    0,
    34,
    0,
    36,
    0,
    45,
    0,
    29,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    45,
    0,
    2,
    0,
    2,
    0,
    3,
    0,
    2,
    0,
    2,
    0,
    1,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    40,
    0,
    36,
    0,
    0,
    0,
    43,
    0,
    34,
    0,
    30,
    0,
    37,
    0,
    44,
    0,
    0,
    0,
    41,
    0,
    44,
    0,
    44,
    0,
    0,
    0,
    35,
    0,
    39,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    10,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    31,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    44,
    0,
    0,
    0,
    0,
    0,
    44,
    0,
    0,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    9,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    16,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    17,
    0,
    20,
    0,
    42,
    0,
    42,
    0,
    21,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    6,
    0,
    42,
    0,
    18,
    0,
    42,
    0,
    42,
    0,
    12,
    0,
    22,
    0,
    42,
    0,
    42,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    5,
    0,
    42,
    0,
    42,
    0,
    42,
    0,
    14,
    0,
    42,
    0,
    42,
    0,
    15,
    0,
    26,
    0,
    42,
    0,
    42,
    0,
    13,
    0,
    42,
    0,
    11,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    42,
    0,
    4,
    0,
    42,
    0,
    7,
    0,
    27,
    0,
    19,
    0,
    8,
    0,
    42,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    42,
    0,
    23,
    0,
    42,
    0,
    2,
    0,
    2,
    0,
    2,
    0,
    25,
    0,
    24,
    0,
    2,
    0,
    2,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    54,
    0,
    0,
    0,
    41,
    2,
    42,
    2,
    38,
    2,
    42,
    2,
    19,
    2,
    33,
    2,
    42,
    2,
    17,
    2,
    28,
    2,
    42,
    2,
    15,
    2,
    97,
    0,
    96,
    0,
    96,
    0,
    101,
    0,
    107,
    0,
    14,
    2,
    116,
    0,
    13,
    2,
    29,
    2,
    11,
    2,
    238,
    1,
    240,
    1,
    242,
    1,
    251,
    1,
    243,
    1,
    239,
    1,
    0,
    0,
    83,
    0,
    104,
    0,
    107,
    0,
    251,
    1,
    234,
    1,
    230,
    1,
    106,
    0,
    96,
    0,
    235,
    1,
    113,
    0,
    223,
    1,
    0,
    0,
    17,
    2,
    42,
    2,
    254,
    1,
    141,
    0,
    0,
    0,
    253,
    1,
    8,
    2,
    0,
    0,
    251,
    1,
    133,
    0,
    135,
    0,
    130,
    0,
    139,
    0,
    141,
    0,
    250,
    1,
    150,
    0,
    249,
    1,
    9,
    2,
    247,
    1,
    160,
    0,
    123,
    0,
    125,
    0,
    137,
    0,
    112,
    0,
    130,
    0,
    218,
    1,
    184,
    0,
    185,
    0,
    187,
    0,
    188,
    0,
    134,
    0,
    217,
    1,
    193,
    0,
    183,
    0,
    132,
    0,
    194,
    0,
    211,
    1,
    5,
    2,
    42,
    2,
    1,
    2,
    42,
    2,
    42,
    2,
    42,
    2,
    42,
    2,
    221,
    0,
    2,
    2,
    42,
    2,
    222,
    0,
    232,
    0,
    1,
    2,
    42,
    2,
    42,
    2,
    0,
    0,
    212,
    1,
    226,
    1,
    216,
    1,
    223,
    1,
    209,
    1,
    209,
    1,
    214,
    1,
    206,
    1,
    223,
    1,
    0,
    0,
    204,
    1,
    208,
    1,
    208,
    1,
    219,
    1,
    210,
    1,
    209,
    1,
    203,
    1,
    206,
    0,
    215,
    1,
    197,
    1,
    205,
    1,
    195,
    1,
    203,
    1,
    42,
    2,
    0,
    0,
    236,
    1,
    0,
    0,
    178,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    233,
    0,
    234,
    1,
    0,
    0,
    241,
    0,
    244,
    0,
    233,
    1,
    0,
    0,
    187,
    1,
    67,
    0,
    192,
    0,
    189,
    0,
    219,
    0,
    138,
    0,
    203,
    0,
    221,
    0,
    180,
    0,
    234,
    0,
    186,
    1,
    224,
    0,
    223,
    0,
    233,
    0,
    246,
    0,
    239,
    0,
    240,
    0,
    236,
    0,
    250,
    0,
    251,
    0,
    235,
    0,
    253,
    0,
    245,
    0,
    255,
    0,
    0,
    0,
    22,
    1,
    230,
    1,
    31,
    1,
    32,
    1,
    229,
    1,
    189,
    1,
    202,
    1,
    182,
    1,
    192,
    1,
    195,
    1,
    0,
    0,
    179,
    1,
    178,
    1,
    178,
    1,
    176,
    1,
    188,
    1,
    185,
    1,
    174,
    1,
    178,
    1,
    171,
    1,
    186,
    1,
    185,
    1,
    167,
    1,
    175,
    1,
    166,
    1,
    181,
    1,
    166,
    1,
    171,
    1,
    35,
    1,
    206,
    1,
    41,
    1,
    205,
    1,
    244,
    0,
    12,
    1,
    3,
    1,
    25,
    1,
    30,
    1,
    159,
    1,
    19,
    1,
    21,
    1,
    24,
    1,
    27,
    1,
    37,
    1,
    28,
    1,
    31,
    1,
    39,
    1,
    34,
    1,
    52,
    1,
    53,
    1,
    158,
    1,
    47,
    1,
    41,
    1,
    59,
    1,
    46,
    1,
    54,
    1,
    0,
    0,
    167,
    1,
    168,
    1,
    162,
    1,
    0,
    0,
    0,
    0,
    160,
    1,
    169,
    1,
    0,
    0,
    153,
    1,
    152,
    1,
    166,
    1,
    150,
    1,
    0,
    0,
    154,
    1,
    0,
    0,
    150,
    1,
    162,
    1,
    0,
    0,
    0,
    0,
    165,
    1,
    160,
    1,
    143,
    1,
    58,
    1,
    56,
    1,
    57,
    1,
    142,
    1,
    141,
    1,
    55,
    1,
    67,
    1,
    140,
    1,
    61,
    1,
    63,
    1,
    80,
    1,
    66,
    1,
    139,
    1,
    74,
    1,
    138,
    1,
    72,
    1,
    86,
    1,
    137,
    1,
    136,
    1,
    91,
    1,
    89,
    1,
    0,
    0,
    142,
    1,
    150,
    1,
    136,
    1,
    0,
    0,
    145,
    1,
    133,
    1,
    0,
    0,
    0,
    0,
    138,
    1,
    136,
    1,
    0,
    0,
    135,
    1,
    0,
    0,
    127,
    1,
    82,
    1,
    92,
    1,
    81,
    1,
    126,
    1,
    90,
    1,
    85,
    1,
    125,
    1,
    124,
    1,
    87,
    1,
    95,
    1,
    123,
    1,
    100,
    1,
    122,
    1,
    117,
    1,
    0,
    0,
    108,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    111,
    1,
    109,
    1,
    108,
    1,
    94,
    1,
    107,
    1,
    106,
    1,
    105,
    1,
    103,
    1,
    99,
    1,
    118,
    1,
    0,
    0,
    81,
    1,
    112,
    1,
    237,
    0,
    101,
    1,
    0,
    0,
    0,
    0,
    168,
    0,
    127,
    0,
    42,
    2,
    160,
    1,
    122,
    0,
    163,
    1,
    166,
    1,
    0,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    3,
    0,
    16,
    0,
    17,
    0,
    33,
    0,
    19,
    0,
    18,
    0,
    138,
    0,
    138,
    0,
    17,
    0,
    16,
    0,
    18,
    0,
    33,
    0,
    18,
    0,
    19,
    0,
    20,
    0,
    22,
    0,
    20,
    0,
    61,
    1,
    40,
    0,
    22,
    0,
    22,
    0,
    20,
    0,
    22,
    0,
    20,
    0,
    22,
    0,
    34,
    0,
    39,
    0,
    35,
    0,
    22,
    0,
    34,
    0,
    39,
    0,
    35,
    0,
    40,
    0,
    42,
    0,
    22,
    0,
    35,
    0,
    48,
    0,
    54,
    0,
    48,
    0,
    56,
    0,
    42,
    0,
    55,
    0,
    57,
    0,
    68,
    0,
    56,
    0,
    54,
    0,
    56,
    0,
    55,
    0,
    58,
    0,
    60,
    0,
    58,
    0,
    57,
    0,
    68,
    0,
    60,
    0,
    60,
    0,
    58,
    0,
    60,
    0,
    58,
    0,
    60,
    0,
    66,
    0,
    65,
    0,
    67,
    0,
    60,
    0,
    65,
    0,
    69,
    0,
    66,
    0,
    79,
    0,
    58,
    1,
    60,
    0,
    64,
    0,
    69,
    0,
    75,
    0,
    79,
    0,
    125,
    0,
    75,
    0,
    125,
    0,
    142,
    0,
    67,
    0,
    142,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    71,
    0,
    78,
    0,
    72,
    0,
    73,
    0,
    57,
    1,
    74,
    0,
    72,
    0,
    73,
    0,
    71,
    0,
    77,
    0,
    80,
    0,
    73,
    0,
    139,
    0,
    77,
    0,
    145,
    0,
    78,
    0,
    145,
    0,
    80,
    0,
    140,
    0,
    78,
    0,
    71,
    0,
    72,
    0,
    115,
    0,
    73,
    0,
    74,
    0,
    140,
    0,
    89,
    0,
    92,
    0,
    139,
    0,
    77,
    0,
    80,
    0,
    89,
    0,
    92,
    0,
    89,
    0,
    92,
    0,
    93,
    0,
    143,
    0,
    93,
    0,
    130,
    0,
    143,
    0,
    141,
    0,
    115,
    0,
    93,
    0,
    130,
    0,
    93,
    0,
    130,
    0,
    133,
    0,
    134,
    0,
    144,
    0,
    134,
    0,
    146,
    0,
    133,
    0,
    149,
    0,
    133,
    0,
    134,
    0,
    141,
    0,
    134,
    0,
    144,
    0,
    148,
    0,
    149,
    0,
    148,
    0,
    150,
    0,
    151,
    0,
    152,
    0,
    153,
    0,
    154,
    0,
    155,
    0,
    156,
    0,
    157,
    0,
    150,
    0,
    146,
    0,
    157,
    0,
    154,
    0,
    53,
    1,
    194,
    0,
    152,
    0,
    153,
    0,
    158,
    0,
    159,
    0,
    160,
    0,
    194,
    0,
    159,
    0,
    151,
    0,
    162,
    0,
    195,
    0,
    155,
    0,
    155,
    0,
    156,
    0,
    162,
    0,
    158,
    0,
    162,
    0,
    160,
    0,
    164,
    0,
    165,
    0,
    196,
    0,
    196,
    0,
    190,
    0,
    164,
    0,
    165,
    0,
    164,
    0,
    165,
    0,
    190,
    0,
    192,
    0,
    190,
    0,
    195,
    0,
    197,
    0,
    198,
    0,
    192,
    0,
    205,
    0,
    192,
    0,
    200,
    0,
    200,
    0,
    201,
    0,
    201,
    0,
    202,
    0,
    204,
    0,
    202,
    0,
    197,
    0,
    203,
    0,
    203,
    0,
    205,
    0,
    206,
    0,
    198,
    0,
    206,
    0,
    207,
    0,
    208,
    0,
    208,
    0,
    209,
    0,
    210,
    0,
    204,
    0,
    212,
    0,
    207,
    0,
    213,
    0,
    213,
    0,
    214,
    0,
    215,
    0,
    241,
    0,
    216,
    0,
    215,
    0,
    212,
    0,
    240,
    0,
    245,
    0,
    242,
    0,
    246,
    0,
    209,
    0,
    210,
    0,
    216,
    0,
    245,
    0,
    241,
    0,
    242,
    0,
    240,
    0,
    214,
    0,
    248,
    0,
    248,
    0,
    249,
    0,
    249,
    0,
    250,
    0,
    251,
    0,
    251,
    0,
    246,
    0,
    253,
    0,
    255,
    0,
    0,
    1,
    3,
    1,
    255,
    0,
    4,
    1,
    253,
    0,
    20,
    1,
    21,
    1,
    24,
    1,
    22,
    1,
    28,
    1,
    250,
    0,
    22,
    1,
    20,
    1,
    25,
    1,
    51,
    1,
    25,
    1,
    0,
    1,
    28,
    1,
    29,
    1,
    4,
    1,
    24,
    1,
    3,
    1,
    21,
    1,
    31,
    1,
    43,
    1,
    29,
    1,
    52,
    1,
    43,
    1,
    48,
    1,
    48,
    1,
    31,
    1,
    54,
    1,
    49,
    1,
    47,
    1,
    54,
    1,
    46,
    1,
    45,
    1,
    44,
    1,
    42,
    1,
    41,
    1,
    40,
    1,
    35,
    1,
    52,
    1,
    60,
    1,
    60,
    1,
    60,
    1,
    62,
    1,
    33,
    1,
    62,
    1,
    63,
    1,
    63,
    1,
    63,
    1,
    32,
    1,
    30,
    1,
    27,
    1,
    26,
    1,
    23,
    1,
    19,
    1,
    17,
    1,
    15,
    1,
    14,
    1,
    11,
    1,
    10,
    1,
    8,
    1,
    7,
    1,
    6,
    1,
    2,
    1,
    1,
    1,
    254,
    0,
    252,
    0,
    247,
    0,
    244,
    0,
    243,
    0,
    239,
    0,
    238,
    0,
    237,
    0,
    234,
    0,
    233,
    0,
    231,
    0,
    229,
    0,
    228,
    0,
    227,
    0,
    226,
    0,
    224,
    0,
    223,
    0,
    220,
    0,
    219,
    0,
    218,
    0,
    211,
    0,
    199,
    0,
    193,
    0,
    191,
    0,
    189,
    0,
    188,
    0,
    187,
    0,
    186,
    0,
    185,
    0,
    184,
    0,
    183,
    0,
    182,
    0,
    181,
    0,
    180,
    0,
    179,
    0,
    178,
    0,
    177,
    0,
    176,
    0,
    175,
    0,
    174,
    0,
    173,
    0,
    171,
    0,
    170,
    0,
    169,
    0,
    168,
    0,
    167,
    0,
    166,
    0,
    163,
    0,
    147,
    0,
    137,
    0,
    135,
    0,
    131,
    0,
    123,
    0,
    120,
    0,
    119,
    0,
    118,
    0,
    117,
    0,
    116,
    0,
    114,
    0,
    113,
    0,
    112,
    0,
    111,
    0,
    110,
    0,
    109,
    0,
    108,
    0,
    106,
    0,
    105,
    0,
    104,
    0,
    103,
    0,
    102,
    0,
    101,
    0,
    100,
    0,
    99,
    0,
    98,
    0,
    94,
    0,
    90,
    0,
    84,
    0,
    82,
    0,
    81,
    0,
    76,
    0,
    70,
    0,
    63,
    0,
    62,
    0,
    61,
    0,
    59,
    0,
    53,
    0,
    51,
    0,
    50,
    0,
    47,
    0,
    45,
    0,
    43,
    0,
    41,
    0,
    38,
    0,
    37,
    0,
    36,
    0,
    31,
    0,
    30,
    0,
    29,
    0,
    28,
    0,
    27,
    0,
    26,
    0,
    25,
    0,
    24,
    0,
    23,
    0,
    21,
    0,
    15,
    0,
    13,
    0,
    12,
    0,
    10,
    0,
    9,
    0,
    7,
    0,
    5,
    0,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    0,
    0,
    59,
    1,
    1,
    0,
    59,
    1,
    3,
    0,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    60,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    59,
    1,
    62,
    1,
    62,
    1,
    59,
    1,
    62,
    1,
    63,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    62,
    1,
    59,
    1,
    59,
    1,
    60,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    59,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    63,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    62,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    62,
    1,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    61,
    1,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    64,
    0,
    61,
    1,
    61,
    1,
    61,
    1,
    64,
    0,
    64,
    0,
    64,
    0,
    61,
    1,
    61,
    1,
    64,
    0,
    64,
    0,
    0,
    0,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    0,
    0,
    6,
    0,
    7,
    0,
    8,
    0,
    9,
    0,
    10,
    0,
    11,
    0,
    12,
    0,
    13,
    0,
    14,
    0,
    14,
    0,
    15,
    0,
    16,
    0,
    14,
    0,
    17,
    0,
    18,
    0,
    19,
    0,
    20,
    0,
    14,
    0,
    21,
    0,
    22,
    0,
    23,
    0,
    20,
    0,
    14,
    0,
    24,
    0,
    14,
    0,
    25,
    0,
    6,
    0,
    26,
    0,
    27,
    0,
    28,
    0,
    29,
    0,
    30,
    0,
    31,
    0,
    32,
    0,
    33,
    0,
    34,
    0,
    32,
    0,
    32,
    0,
    35,
    0,
    32,
    0,
    32,
    0,
    36,
    0,
    37,
    0,
    38,
    0,
    39,
    0,
    40,
    0,
    32,
    0,
    32,
    0,
    41,
    0,
    42,
    0,
    32,
    0,
    14,
    0,
    43,
    0,
    14,
    0,
    44,
    0,
    45,
    0,
    46,
    0,
    47,
    0,
    48,
    0,
    49,
    0,
    50,
    0,
    51,
    0,
    52,
    0,
    52,
    0,
    53,
    0,
    54,
    0,
    52,
    0,
    55,
    0,
    56,
    0,
    57,
    0,
    58,
    0,
    52,
    0,
    59,
    0,
    60,
    0,
    61,
    0,
    58,
    0,
    52,
    0,
    62,
    0,
    52,
    0,
    63,
    0,
    44,
    0,
    64,
    0,
    65,
    0,
    66,
    0,
    67,
    0,
    68,
    0,
    69,
    0,
    70,
    0,
    71,
    0,
    72,
    0,
    70,
    0,
    70,
    0,
    73,
    0,
    70,
    0,
    70,
    0,
    74,
    0,
    75,
    0,
    76,
    0,
    77,
    0,
    78,
    0,
    70,
    0,
    70,
    0,
    79,
    0,
    80,
    0,
    70,
    0,
    52,
    0,
    81,
    0,
    52,
    0,
    88,
    0,
    88,
    0,
    104,
    0,
    91,
    0,
    89,
    0,
    194,
    0,
    137,
    0,
    86,
    0,
    86,
    0,
    89,
    0,
    105,
    0,
    90,
    0,
    86,
    0,
    92,
    0,
    95,
    0,
    93,
    0,
    97,
    0,
    116,
    0,
    95,
    0,
    95,
    0,
    93,
    0,
    95,
    0,
    94,
    0,
    95,
    0,
    106,
    0,
    114,
    0,
    108,
    0,
    83,
    0,
    107,
    0,
    115,
    0,
    109,
    0,
    117,
    0,
    119,
    0,
    95,
    0,
    110,
    0,
    84,
    0,
    129,
    0,
    126,
    0,
    130,
    0,
    120,
    0,
    129,
    0,
    132,
    0,
    142,
    0,
    130,
    0,
    127,
    0,
    131,
    0,
    127,
    0,
    133,
    0,
    136,
    0,
    134,
    0,
    127,
    0,
    137,
    0,
    136,
    0,
    136,
    0,
    134,
    0,
    136,
    0,
    135,
    0,
    136,
    0,
    140,
    0,
    139,
    0,
    141,
    0,
    124,
    0,
    137,
    0,
    143,
    0,
    137,
    0,
    158,
    0,
    137,
    0,
    136,
    0,
    137,
    0,
    137,
    0,
    152,
    0,
    137,
    0,
    84,
    0,
    137,
    0,
    126,
    0,
    198,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    138,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    144,
    0,
    156,
    0,
    146,
    0,
    148,
    0,
    137,
    0,
    151,
    0,
    147,
    0,
    149,
    0,
    145,
    0,
    154,
    0,
    159,
    0,
    150,
    0,
    195,
    0,
    155,
    0,
    201,
    0,
    157,
    0,
    137,
    0,
    160,
    0,
    196,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    183,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    162,
    0,
    165,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    162,
    0,
    165,
    0,
    163,
    0,
    166,
    0,
    92,
    0,
    199,
    0,
    93,
    0,
    190,
    0,
    137,
    0,
    197,
    0,
    184,
    0,
    93,
    0,
    190,
    0,
    94,
    0,
    191,
    0,
    192,
    0,
    133,
    0,
    200,
    0,
    134,
    0,
    202,
    0,
    192,
    0,
    204,
    0,
    193,
    0,
    134,
    0,
    137,
    0,
    135,
    0,
    137,
    0,
    203,
    0,
    137,
    0,
    137,
    0,
    205,
    0,
    206,
    0,
    207,
    0,
    208,
    0,
    209,
    0,
    210,
    0,
    212,
    0,
    213,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    239,
    0,
    137,
    0,
    137,
    0,
    214,
    0,
    215,
    0,
    216,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    162,
    0,
    240,
    0,
    211,
    0,
    137,
    0,
    137,
    0,
    162,
    0,
    137,
    0,
    163,
    0,
    137,
    0,
    89,
    0,
    165,
    0,
    241,
    0,
    137,
    0,
    190,
    0,
    89,
    0,
    165,
    0,
    90,
    0,
    166,
    0,
    190,
    0,
    192,
    0,
    191,
    0,
    137,
    0,
    242,
    0,
    243,
    0,
    192,
    0,
    249,
    0,
    193,
    0,
    244,
    0,
    137,
    0,
    245,
    0,
    137,
    0,
    246,
    0,
    248,
    0,
    137,
    0,
    137,
    0,
    247,
    0,
    137,
    0,
    137,
    0,
    250,
    0,
    137,
    0,
    137,
    0,
    251,
    0,
    252,
    0,
    137,
    0,
    253,
    0,
    254,
    0,
    137,
    0,
    0,
    1,
    137,
    0,
    1,
    1,
    137,
    0,
    2,
    1,
    3,
    1,
    20,
    1,
    4,
    1,
    137,
    0,
    137,
    0,
    19,
    1,
    22,
    1,
    21,
    1,
    23,
    1,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    24,
    1,
    137,
    0,
    25,
    1,
    137,
    0,
    26,
    1,
    27,
    1,
    137,
    0,
    137,
    0,
    28,
    1,
    29,
    1,
    30,
    1,
    31,
    1,
    137,
    0,
    32,
    1,
    137,
    0,
    41,
    1,
    42,
    1,
    44,
    1,
    43,
    1,
    46,
    1,
    137,
    0,
    137,
    0,
    137,
    0,
    45,
    1,
    56,
    1,
    137,
    0,
    137,
    0,
    137,
    0,
    47,
    1,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    48,
    1,
    137,
    0,
    137,
    0,
    57,
    1,
    53,
    1,
    54,
    1,
    137,
    0,
    137,
    0,
    137,
    0,
    55,
    1,
    137,
    0,
    58,
    1,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    52,
    1,
    51,
    1,
    50,
    1,
    137,
    0,
    84,
    0,
    84,
    0,
    84,
    0,
    122,
    0,
    49,
    1,
    122,
    0,
    125,
    0,
    125,
    0,
    125,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    40,
    1,
    39,
    1,
    38,
    1,
    37,
    1,
    36,
    1,
    35,
    1,
    34,
    1,
    33,
    1,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    137,
    0,
    18,
    1,
    17,
    1,
    16,
    1,
    15,
    1,
    14,
    1,
    13,
    1,
    12,
    1,
    11,
    1,
    10,
    1,
    9,
    1,
    8,
    1,
    7,
    1,
    6,
    1,
    5,
    1,
    255,
    0,
    137,
    0,
    165,
    0,
    162,
    0,
    238,
    0,
    237,
    0,
    236,
    0,
    235,
    0,
    234,
    0,
    233,
    0,
    232,
    0,
    231,
    0,
    230,
    0,
    229,
    0,
    228,
    0,
    227,
    0,
    226,
    0,
    225,
    0,
    224,
    0,
    223,
    0,
    222,
    0,
    221,
    0,
    220,
    0,
    219,
    0,
    218,
    0,
    217,
    0,
    165,
    0,
    162,
    0,
    137,
    0,
    137,
    0,
    93,
    0,
    164,
    0,
    123,
    0,
    189,
    0,
    188,
    0,
    187,
    0,
    186,
    0,
    185,
    0,
    182,
    0,
    181,
    0,
    180,
    0,
    179,
    0,
    178,
    0,
    177,
    0,
    176,
    0,
    175,
    0,
    174,
    0,
    173,
    0,
    172,
    0,
    171,
    0,
    170,
    0,
    169,
    0,
    168,
    0,
    167,
    0,
    93,
    0,
    164,
    0,
    85,
    0,
    82,
    0,
    161,
    0,
    153,
    0,
    137,
    0,
    127,
    0,
    96,
    0,
    124,
    0,
    124,
    0,
    127,
    0,
    128,
    0,
    127,
    0,
    124,
    0,
    123,
    0,
    121,
    0,
    118,
    0,
    113,
    0,
    112,
    0,
    111,
    0,
    103,
    0,
    102,
    0,
    101,
    0,
    100,
    0,
    99,
    0,
    98,
    0,
    86,
    0,
    96,
    0,
    83,
    0,
    83,
    0,
    86,
    0,
    87,
    0,
    86,
    0,
    85,
    0,
    83,
    0,
    82,
    0,
    59,
    1,
    5,
    0,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    59,
    1,
    66,
    67,
    95,
    69,
    78,
    86,
    95,
    65,
    82,
    71,
    83,
    0,
    99,
    104,
    105,
    108,
    113,
    115,
    119,
    118,
    0,
    99,
    111,
    109,
    112,
    105,
    108,
    101,
    0,
    104,
    101,
    108,
    112,
    0,
    105,
    110,
    116,
    101,
    114,
    97,
    99,
    116,
    105,
    118,
    101,
    0,
    109,
    97,
    116,
    104,
    108,
    105,
    98,
    0,
    113,
    117,
    105,
    101,
    116,
    0,
    115,
    116,
    97,
    110,
    100,
    97,
    114,
    100,
    0,
    118,
    101,
    114,
    115,
    105,
    111,
    110,
    0,
    119,
    97,
    114,
    110,
    0,
    117,
    115,
    97,
    103,
    101,
    58
], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
allocate([
    32,
    37,
    115,
    32,
    91,
    111,
    112,
    116,
    105,
    111,
    110,
    115,
    93,
    32,
    91,
    102,
    105,
    108,
    101,
    32,
    46,
    46,
    46,
    93,
    10,
    37,
    115,
    37,
    115,
    37,
    115,
    37,
    115,
    37,
    115,
    37,
    115,
    37,
    115,
    0,
    32,
    32,
    45,
    104,
    32,
    32,
    45,
    45,
    104,
    101,
    108,
    112,
    32,
    32,
    32,
    32,
    32,
    32,
    32,
    32,
    32,
    112,
    114,
    105,
    110,
    116,
    32,
    116,
    104,
    105,
    115,
    32,
    117,
    115,
    97,
    103,
    101,
    32,
    97,
    110,
    100,
    32,
    101,
    120,
    105,
    116,
    10,
    0,
    32,
    32,
    45,
    105,
    32,
    32,
    45,
    45,
    105,
    110,
    116,
    101,
    114,
    97,
    99,
    116,
    105,
    118,
    101,
    32,
    32,
    102,
    111,
    114,
    99,
    101,
    32,
    105,
    110,
    116,
    101,
    114,
    97,
    99,
    116,
    105,
    118,
    101,
    32,
    109,
    111,
    100,
    101,
    10,
    0,
    32,
    32,
    45,
    108,
    32,
    32,
    45,
    45,
    109,
    97,
    116,
    104,
    108,
    105,
    98,
    32,
    32,
    32,
    32,
    32,
    32,
    117,
    115,
    101,
    32,
    116,
    104,
    101,
    32,
    112,
    114,
    101,
    100,
    101,
    102,
    105,
    110,
    101,
    100,
    32,
    109,
    97,
    116,
    104,
    32,
    114,
    111,
    117,
    116,
    105,
    110,
    101,
    115,
    10,
    0,
    32,
    32,
    45,
    113,
    32,
    32,
    45,
    45,
    113,
    117,
    105,
    101,
    116,
    32,
    32,
    32,
    32,
    32,
    32,
    32,
    32,
    100,
    111,
    110,
    39,
    116,
    32,
    112,
    114,
    105,
    110,
    116,
    32,
    105,
    110,
    105,
    116,
    105,
    97,
    108,
    32,
    98,
    97,
    110,
    110,
    101,
    114,
    10,
    0,
    32,
    32,
    45,
    115,
    32,
    32,
    45,
    45,
    115,
    116,
    97,
    110,
    100,
    97,
    114,
    100,
    32,
    32,
    32,
    32,
    32,
    110,
    111,
    110,
    45,
    115,
    116,
    97,
    110,
    100,
    97,
    114,
    100,
    32,
    98,
    99,
    32,
    99,
    111,
    110,
    115,
    116,
    114,
    117,
    99,
    116,
    115,
    32,
    97,
    114,
    101,
    32,
    101,
    114,
    114,
    111,
    114,
    115,
    10,
    0,
    32,
    32,
    45,
    119,
    32,
    32,
    45,
    45,
    119,
    97,
    114,
    110,
    32,
    32,
    32,
    32,
    32,
    32,
    32,
    32,
    32,
    119,
    97,
    114,
    110,
    32,
    97,
    98,
    111,
    117,
    116,
    32,
    110,
    111,
    110,
    45,
    115,
    116,
    97,
    110,
    100,
    97,
    114,
    100,
    32,
    98,
    99,
    32,
    99,
    111,
    110,
    115,
    116,
    114,
    117,
    99,
    116,
    115,
    10,
    0,
    32,
    32,
    45,
    118,
    32,
    32,
    45,
    45,
    118,
    101,
    114,
    115,
    105,
    111,
    110,
    32,
    32,
    32,
    32,
    32,
    32,
    112,
    114,
    105,
    110,
    116,
    32,
    118,
    101,
    114,
    115,
    105,
    111,
    110,
    32,
    105,
    110,
    102,
    111,
    114,
    109,
    97,
    116,
    105,
    111,
    110,
    32,
    97,
    110,
    100,
    32,
    101,
    120,
    105,
    116,
    10,
    0,
    80,
    79,
    83,
    73,
    88,
    76,
    89,
    95,
    67,
    79,
    82,
    82,
    69,
    67,
    84,
    0,
    66,
    67,
    95,
    76,
    73,
    78,
    69,
    95,
    76,
    69,
    78,
    71,
    84,
    72,
    0,
    10,
    40,
    105,
    110,
    116,
    101,
    114,
    114,
    117,
    112,
    116,
    41,
    32,
    69,
    120,
    105,
    116,
    105,
    110,
    103,
    32,
    98,
    99,
    46,
    10,
    0,
    101,
    0,
    108,
    0,
    115,
    0,
    97,
    0,
    99,
    0,
    106,
    0,
    114,
    0,
    70,
    105,
    108,
    101,
    32,
    37,
    115,
    32,
    105,
    115,
    32,
    117,
    110,
    97,
    118,
    97,
    105,
    108,
    97,
    98,
    108,
    101,
    46,
    10,
    0,
    0,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    42,
    52,
    2,
    45,
    46,
    40,
    38,
    49,
    39,
    2,
    41,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    44,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    50,
    2,
    51,
    43,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    47,
    2,
    48,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31,
    32,
    33,
    34,
    35,
    36,
    37,
    2,
    0,
    1,
    0,
    0,
    24,
    103,
    93,
    0,
    52,
    25,
    27,
    0,
    75,
    30,
    0,
    37,
    0,
    107,
    105,
    106,
    0,
    0,
    21,
    28,
    109,
    26,
    41,
    22,
    108,
    0,
    0,
    0,
    3,
    0,
    10,
    19,
    5,
    23,
    92,
    6,
    20,
    83,
    67,
    0,
    103,
    107,
    96,
    53,
    0,
    0,
    29,
    76,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    91,
    0,
    0,
    0,
    14,
    4,
    0,
    79,
    81,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    77,
    97,
    103,
    0,
    68,
    69,
    0,
    0,
    0,
    73,
    0,
    0,
    0,
    0,
    101,
    102,
    45,
    42,
    43,
    46,
    94,
    0,
    17,
    40,
    11,
    0,
    0,
    84,
    85,
    86,
    87,
    88,
    89,
    90,
    0,
    0,
    95,
    0,
    104,
    54,
    98,
    0,
    74,
    35,
    38,
    99,
    100,
    0,
    16,
    18,
    80,
    82,
    78,
    70,
    103,
    71,
    59,
    0,
    0,
    0,
    55,
    31,
    7,
    0,
    44,
    0,
    0,
    0,
    0,
    7,
    0,
    73,
    8,
    0,
    7,
    72,
    60,
    0,
    0,
    0,
    63,
    0,
    0,
    0,
    47,
    0,
    61,
    62,
    110,
    0,
    0,
    0,
    32,
    48,
    36,
    39,
    111,
    56,
    64,
    0,
    0,
    73,
    7,
    112,
    0,
    50,
    65,
    66,
    0,
    0,
    0,
    0,
    33,
    49,
    57,
    58,
    0,
    7,
    51,
    0,
    34,
    0,
    2,
    0,
    2,
    2,
    1,
    2,
    0,
    1,
    0,
    1,
    3,
    2,
    0,
    1,
    2,
    3,
    2,
    3,
    1,
    2,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    2,
    0,
    0,
    0,
    0,
    14,
    0,
    8,
    0,
    0,
    8,
    3,
    0,
    3,
    1,
    3,
    1,
    1,
    0,
    0,
    4,
    0,
    13,
    0,
    1,
    0,
    1,
    0,
    3,
    3,
    1,
    3,
    4,
    4,
    3,
    5,
    6,
    6,
    0,
    1,
    1,
    3,
    3,
    5,
    0,
    1,
    0,
    1,
    0,
    4,
    0,
    4,
    0,
    4,
    2,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    2,
    1,
    1,
    3,
    4,
    2,
    2,
    4,
    4,
    4,
    3,
    3,
    1,
    4,
    1,
    1,
    1,
    1,
    1,
    0,
    1,
    2,
    110,
    101,
    119,
    108,
    105,
    110,
    101,
    32,
    110,
    111,
    116,
    32,
    97,
    108,
    108,
    111,
    119,
    101,
    100,
    0,
    99,
    111,
    109,
    112,
    97,
    114,
    105,
    115,
    111,
    110,
    32,
    105,
    110,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    0,
    87,
    0,
    112,
    0,
    119,
    0,
    66,
    114,
    101,
    97,
    107,
    32,
    111,
    117,
    116,
    115,
    105,
    100,
    101,
    32,
    97,
    32,
    102,
    111,
    114,
    47,
    119,
    104,
    105,
    108,
    101,
    0,
    74,
    37,
    49,
    100,
    58,
    0,
    67,
    111,
    110,
    116,
    105,
    110,
    117,
    101,
    32,
    115,
    116,
    97,
    116,
    101,
    109,
    101,
    110,
    116,
    0,
    67,
    111,
    110,
    116,
    105,
    110,
    117,
    101,
    32,
    111,
    117,
    116,
    115,
    105,
    100,
    101,
    32,
    97,
    32,
    102,
    111,
    114,
    0,
    104,
    0,
    82,
    0,
    67,
    111,
    109,
    112,
    97,
    114,
    105,
    115,
    111,
    110,
    32,
    105,
    110,
    32,
    102,
    105,
    114,
    115,
    116,
    32,
    102,
    111,
    114,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    0,
    102,
    105,
    114,
    115,
    116,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    105,
    115,
    32,
    118,
    111,
    105,
    100,
    0,
    78,
    37,
    49,
    100,
    58,
    0,
    115,
    101,
    99,
    111,
    110,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    105,
    115,
    32,
    118,
    111,
    105,
    100,
    0,
    49,
    0,
    66,
    37,
    49,
    100,
    58,
    74,
    37,
    49,
    100,
    58,
    0,
    67,
    111,
    109,
    112,
    97,
    114,
    105,
    115,
    111,
    110,
    32,
    105,
    110,
    32,
    116,
    104,
    105,
    114,
    100,
    32,
    102,
    111,
    114,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    0,
    116,
    104,
    105,
    114,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    105,
    115,
    32,
    118,
    111,
    105,
    100,
    0,
    74,
    37,
    49,
    100,
    58,
    78,
    37,
    49,
    100,
    58,
    0,
    112,
    74,
    37,
    49,
    100,
    58,
    78,
    37,
    49,
    100,
    58,
    0,
    118,
    111,
    105,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    0,
    90,
    37,
    49,
    100,
    58,
    0,
    112,
    114,
    105,
    110,
    116,
    32,
    115,
    116,
    97,
    116,
    101,
    109,
    101,
    110,
    116,
    0,
    79,
    0,
    118,
    111,
    105,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    105,
    110,
    32,
    112,
    114,
    105,
    110,
    116,
    0,
    80,
    0,
    101,
    108,
    115,
    101,
    32,
    99,
    108,
    97,
    117,
    115,
    101,
    32,
    105,
    110,
    32,
    105,
    102,
    32,
    115,
    116,
    97,
    116,
    101,
    109,
    101,
    110,
    116,
    0,
    74,
    37,
    100,
    58,
    78,
    37,
    49,
    100,
    58,
    0,
    70,
    37,
    100,
    44,
    37,
    115,
    46,
    37,
    115,
    91,
    0,
    48,
    82,
    93,
    0,
    118,
    111,
    105,
    100,
    32,
    102,
    117,
    110,
    99,
    116,
    105,
    111,
    110,
    115,
    0,
    67,
    97,
    108,
    108,
    32,
    98,
    121,
    32,
    118,
    97,
    114,
    105,
    97,
    98,
    108,
    101,
    32,
    97,
    114,
    114,
    97,
    121,
    115,
    0,
    99,
    111,
    109,
    112,
    97,
    114,
    105,
    115,
    111,
    110,
    32,
    105,
    110,
    32,
    97,
    114,
    103,
    117,
    109,
    101,
    110,
    116,
    0,
    118,
    111,
    105,
    100,
    32,
    97,
    114,
    103,
    117,
    109,
    101,
    110,
    116,
    0,
    75,
    37,
    100,
    58,
    0,
    77,
    105,
    115,
    115,
    105,
    110,
    103,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    105,
    110,
    32,
    102,
    111,
    114,
    32,
    115,
    116,
    97,
    116,
    101,
    109,
    101,
    110,
    116,
    0,
    48,
    0,
    82,
    101,
    116,
    117,
    114,
    110,
    32,
    111,
    117,
    116,
    115,
    105,
    100,
    101,
    32,
    111,
    102,
    32,
    97,
    32,
    102,
    117,
    110,
    99,
    116,
    105,
    111,
    110,
    46,
    0,
    99,
    111,
    109,
    112,
    97,
    114,
    105,
    115,
    111,
    110,
    32,
    105,
    110,
    32,
    114,
    101,
    116,
    117,
    114,
    110,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    105,
    111,
    110,
    0,
    114,
    101,
    116,
    117,
    114,
    110,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    114,
    101,
    113,
    117,
    105,
    114,
    101,
    115,
    32,
    112,
    97,
    114,
    101,
    110,
    116,
    104,
    101,
    115,
    105,
    115,
    0,
    114,
    101,
    116,
    117,
    114,
    110,
    32,
    114,
    101,
    113,
    117,
    105,
    114,
    101,
    115,
    32,
    110,
    111,
    110,
    45,
    118,
    111,
    105,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    0,
    82,
    101,
    116,
    117,
    114,
    110,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    105,
    110,
    32,
    97,
    32,
    118,
    111,
    105,
    100,
    32,
    102,
    117,
    110,
    99,
    116,
    105,
    111,
    110,
    46,
    0,
    68,
    76,
    37,
    100,
    58,
    0,
    108,
    37,
    100,
    58,
    0,
    99,
    111,
    109,
    112,
    97,
    114,
    105,
    115,
    111,
    110,
    32,
    105,
    110,
    32,
    97,
    115,
    115,
    105,
    103,
    110,
    109,
    101,
    110,
    116,
    0,
    65,
    115,
    115,
    105,
    103,
    110,
    109,
    101,
    110,
    116,
    32,
    111,
    102,
    32,
    97,
    32,
    118,
    111,
    105,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    0,
    37,
    99,
    0,
    83,
    37,
    100,
    58,
    0,
    115,
    37,
    100,
    58,
    0,
    38,
    38,
    32,
    111,
    112,
    101,
    114,
    97,
    116,
    111,
    114,
    0,
    68,
    90,
    37,
    100,
    58,
    112,
    0,
    118,
    111,
    105,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    119,
    105,
    116,
    104,
    32,
    38,
    38,
    0,
    68,
    90,
    37,
    100,
    58,
    112,
    49,
    78,
    37,
    100,
    58,
    0,
    124,
    124,
    32,
    111,
    112,
    101,
    114,
    97,
    116,
    111,
    114,
    0,
    66,
    37,
    100,
    58,
    0,
    118,
    111,
    105,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    119,
    105,
    116,
    104,
    32,
    124,
    124,
    0,
    66,
    37,
    100,
    58,
    48,
    74,
    37,
    100,
    58,
    78,
    37,
    100,
    58,
    49,
    78,
    37,
    100,
    58,
    0,
    118,
    111,
    105,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    119,
    105,
    116,
    104,
    32,
    33,
    0,
    33,
    32,
    111,
    112,
    101,
    114,
    97,
    116,
    111,
    114,
    0,
    33,
    0,
    118,
    111,
    105,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    119,
    105,
    116,
    104,
    32,
    99,
    111,
    109,
    112,
    97,
    114,
    105,
    115,
    111,
    110,
    0,
    61,
    0,
    35,
    0,
    123,
    0,
    60,
    0,
    125,
    0,
    62,
    0,
    118,
    111,
    105,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    119,
    105,
    116,
    104,
    32,
    43,
    0,
    43,
    0,
    118,
    111,
    105,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    119,
    105,
    116,
    104,
    32,
    45,
    0,
    45,
    0,
    118,
    111,
    105,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    119,
    105,
    116,
    104,
    32,
    42,
    0,
    42,
    0,
    118,
    111,
    105,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    119,
    105,
    116,
    104,
    32,
    47,
    0,
    47,
    0,
    118,
    111,
    105,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    119,
    105,
    116,
    104,
    32,
    37,
    0,
    37,
    0,
    118,
    111,
    105,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    119,
    105,
    116,
    104,
    32,
    94,
    0,
    94,
    0,
    118,
    111,
    105,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    119,
    105,
    116,
    104,
    32,
    117,
    110,
    97,
    114,
    121,
    32,
    45,
    0,
    110,
    0,
    76,
    37,
    100,
    58,
    0,
    75,
    0,
    58,
    0,
    118,
    111,
    105,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    105,
    110,
    32,
    112,
    97,
    114,
    101,
    110,
    116,
    104,
    101,
    115,
    105,
    115,
    0,
    67,
    37,
    100,
    44,
    37,
    115,
    58,
    0,
    67,
    37,
    100,
    58,
    0,
    68,
    65,
    37,
    100,
    58,
    76,
    37,
    100,
    58,
    0,
    68,
    77,
    37,
    100,
    58,
    76,
    37,
    100,
    58,
    0,
    105,
    37,
    100,
    58,
    108,
    37,
    100,
    58,
    0,
    100,
    37,
    100,
    58,
    108,
    37,
    100,
    58,
    0,
    68,
    76,
    37,
    100,
    58,
    120,
    0,
    65,
    37,
    100,
    58,
    0,
    77,
    37,
    100,
    58,
    0,
    105,
    37,
    100,
    58,
    0,
    100,
    37,
    100,
    58,
    0,
    118,
    111,
    105,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    105,
    110,
    32,
    108,
    101,
    110,
    103,
    116,
    104,
    40,
    41,
    0,
    99,
    76,
    0,
    118,
    111,
    105,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    105,
    110,
    32,
    115,
    113,
    114,
    116,
    40,
    41,
    0,
    99,
    82,
    0,
    118,
    111,
    105,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    105,
    110,
    32,
    115,
    99,
    97,
    108,
    101,
    40,
    41,
    0,
    99,
    83,
    0,
    114,
    101,
    97,
    100,
    32,
    102,
    117,
    110,
    99,
    116,
    105,
    111,
    110,
    0,
    99,
    73,
    0,
    114,
    97,
    110,
    100,
    111,
    109,
    32,
    102,
    117,
    110,
    99,
    116,
    105,
    111,
    110,
    0,
    99,
    88,
    0,
    118,
    111,
    105,
    100,
    32,
    101,
    120,
    112,
    114,
    101,
    115,
    115,
    105,
    111,
    110,
    32,
    97,
    115,
    32,
    115,
    117,
    98,
    115,
    99,
    114,
    105,
    112,
    116,
    0,
    99,
    111,
    109,
    112,
    97,
    114,
    105,
    115,
    111,
    110,
    32,
    105,
    110,
    32,
    115,
    117,
    98,
    115,
    99,
    114,
    105,
    112,
    116,
    0,
    72,
    105,
    115,
    116,
    111,
    114,
    121,
    32,
    118,
    97,
    114,
    105,
    97,
    98,
    108,
    101,
    0,
    76,
    97,
    115,
    116,
    32,
    118,
    97,
    114,
    105,
    97,
    98,
    108,
    101,
    0,
    69,
    110,
    100,
    32,
    111,
    102,
    32,
    108,
    105,
    110,
    101,
    32,
    114,
    101,
    113,
    117,
    105,
    114,
    101,
    100,
    0,
    84,
    111,
    111,
    32,
    109,
    97,
    110,
    121,
    32,
    101,
    110,
    100,
    32,
    111,
    102,
    32,
    108,
    105,
    110,
    101,
    115,
    0,
    0,
    53,
    54,
    54,
    55,
    55,
    55,
    56,
    56,
    57,
    57,
    57,
    57,
    58,
    58,
    58,
    58,
    58,
    58,
    59,
    59,
    60,
    60,
    60,
    60,
    60,
    60,
    60,
    60,
    60,
    61,
    62,
    63,
    64,
    60,
    65,
    60,
    66,
    67,
    60,
    60,
    68,
    60,
    69,
    69,
    70,
    70,
    71,
    72,
    71,
    74,
    73,
    75,
    75,
    76,
    76,
    77,
    77,
    77,
    78,
    78,
    78,
    78,
    78,
    78,
    78,
    78,
    79,
    79,
    80,
    80,
    80,
    80,
    81,
    81,
    82,
    82,
    84,
    83,
    85,
    83,
    86,
    83,
    83,
    83,
    83,
    83,
    83,
    83,
    83,
    83,
    83,
    83,
    83,
    83,
    83,
    83,
    83,
    83,
    83,
    83,
    83,
    83,
    87,
    87,
    87,
    87,
    87,
    87,
    87,
    88,
    88,
    88,
    115,
    121,
    110,
    116,
    97,
    120,
    32,
    101,
    114,
    114,
    111,
    114,
    0,
    69,
    114,
    114,
    111,
    114,
    58,
    32,
    100,
    105,
    115,
    99,
    97,
    114,
    100,
    105,
    110,
    103,
    0,
    68,
    101,
    108,
    101,
    116,
    105,
    110,
    103,
    0,
    0,
    54,
    0,
    1,
    6,
    7,
    8,
    9,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    23,
    24,
    25,
    27,
    28,
    29,
    30,
    31,
    32,
    33,
    34,
    36,
    39,
    45,
    47,
    55,
    57,
    59,
    60,
    73,
    83,
    87,
    3,
    60,
    83,
    45,
    50,
    8,
    23,
    87,
    37,
    75,
    45,
    82,
    83,
    61,
    45,
    66,
    45,
    45,
    45,
    45,
    68,
    83,
    83,
    1,
    58,
    59,
    3,
    44,
    4,
    5,
    11,
    38,
    39,
    40,
    41,
    42,
    43,
    10,
    12,
    8,
    79,
    80,
    83,
    83,
    8,
    83,
    45,
    83,
    45,
    83,
    83,
    46,
    46,
    7,
    69,
    70,
    83,
    46,
    3,
    44,
    48,
    59,
    85,
    86,
    83,
    83,
    83,
    83,
    83,
    83,
    83,
    84,
    50,
    46,
    49,
    51,
    45,
    46,
    81,
    83,
    46,
    83,
    46,
    46,
    49,
    59,
    60,
    83,
    83,
    83,
    51,
    8,
    83,
    8,
    40,
    52,
    76,
    78,
    44,
    65,
    67,
    69,
    50,
    50,
    8,
    8,
    46,
    49,
    62,
    3,
    56,
    46,
    51,
    51,
    50,
    50,
    56,
    8,
    40,
    52,
    81,
    60,
    56,
    51,
    51,
    47,
    50,
    8,
    8,
    44,
    22,
    71,
    60,
    3,
    88,
    51,
    50,
    50,
    63,
    72,
    3,
    26,
    77,
    51,
    51,
    81,
    56,
    78,
    74,
    46,
    60,
    3,
    44,
    58,
    64,
    48,
    56,
    60,
    69,
    114,
    114,
    111,
    114,
    58,
    32,
    112,
    111,
    112,
    112,
    105,
    110,
    103,
    0,
    109,
    101,
    109,
    111,
    114,
    121,
    32,
    101,
    120,
    104,
    97,
    117,
    115,
    116,
    101,
    100,
    0,
    67,
    108,
    101,
    97,
    110,
    117,
    112,
    58,
    32,
    100,
    105,
    115,
    99,
    97,
    114,
    100,
    105,
    110,
    103,
    32,
    108,
    111,
    111,
    107,
    97,
    104,
    101,
    97,
    100,
    0,
    67,
    108,
    101,
    97,
    110,
    117,
    112,
    58,
    32,
    112,
    111,
    112,
    112,
    105,
    110,
    103,
    0,
    111,
    117,
    116,
    32,
    111,
    102,
    32,
    100,
    121,
    110,
    97,
    109,
    105,
    99,
    32,
    109,
    101,
    109,
    111,
    114,
    121,
    32,
    105,
    110,
    32,
    121,
    121,
    95,
    99,
    114,
    101,
    97,
    116,
    101,
    95,
    98,
    117,
    102,
    102,
    101,
    114,
    40,
    41,
    0,
    37,
    115,
    10,
    0,
    105,
    108,
    108,
    101,
    103,
    97,
    108,
    32,
    99,
    104,
    97,
    114,
    97,
    99,
    116,
    101,
    114,
    58,
    32,
    35,
    0,
    102,
    97,
    116,
    97,
    108,
    32,
    102,
    108,
    101,
    120,
    32,
    115,
    99,
    97,
    110,
    110,
    101,
    114,
    32,
    105,
    110,
    116,
    101,
    114,
    110,
    97,
    108,
    32,
    101,
    114,
    114,
    111,
    114,
    45,
    45,
    101,
    110,
    100,
    32,
    111,
    102,
    32,
    98,
    117,
    102,
    102,
    101,
    114,
    32,
    109,
    105,
    115,
    115,
    101,
    100,
    0,
    102,
    97,
    116,
    97,
    108,
    32,
    101,
    114,
    114,
    111,
    114,
    32,
    45,
    32,
    115,
    99,
    97,
    110,
    110,
    101,
    114,
    32,
    105,
    110,
    112,
    117,
    116,
    32,
    98,
    117,
    102,
    102,
    101,
    114,
    32,
    111,
    118,
    101,
    114,
    102,
    108,
    111,
    119,
    0,
    114,
    101,
    97,
    100,
    40,
    41,
    32,
    105,
    110,
    32,
    102,
    108,
    101,
    120,
    32,
    115,
    99,
    97,
    110,
    110,
    101,
    114,
    32,
    102,
    97,
    105,
    108,
    101,
    100,
    0,
    69,
    79,
    70,
    32,
    101,
    110,
    99,
    111,
    117,
    110,
    116,
    101,
    114,
    101,
    100,
    32,
    105,
    110,
    32,
    97,
    32,
    99,
    111,
    109,
    109,
    101,
    110,
    116,
    46,
    10,
    0,
    78,
    85,
    76,
    32,
    99,
    104,
    97,
    114,
    97,
    99,
    116,
    101,
    114,
    32,
    105,
    110,
    32,
    115,
    116,
    114,
    105,
    110,
    103,
    46,
    0,
    105,
    108,
    108,
    101,
    103,
    97,
    108,
    32,
    99,
    104,
    97,
    114,
    97,
    99,
    116,
    101,
    114,
    58,
    32,
    94,
    37,
    99,
    0,
    105,
    108,
    108,
    101,
    103,
    97,
    108,
    32,
    99,
    104,
    97,
    114,
    97,
    99,
    116,
    101,
    114,
    58,
    32,
    92,
    37,
    48,
    51,
    111,
    0,
    105,
    108,
    108,
    101,
    103,
    97,
    108,
    32,
    99,
    104,
    97,
    114,
    97,
    99,
    116,
    101,
    114,
    58,
    32,
    37,
    115,
    0,
    102,
    97,
    116,
    97,
    108,
    32,
    102,
    108,
    101,
    120,
    32,
    115,
    99,
    97,
    110,
    110,
    101,
    114,
    32,
    105,
    110,
    116,
    101,
    114,
    110,
    97,
    108,
    32,
    101,
    114,
    114,
    111,
    114,
    45,
    45,
    110,
    111,
    32,
    97,
    99,
    116,
    105,
    111,
    110,
    32,
    102,
    111,
    117,
    110,
    100,
    0,
    70,
    117,
    110,
    99,
    116,
    105,
    111,
    110,
    32,
    37,
    115,
    32,
    110,
    111,
    116,
    32,
    100,
    101,
    102,
    105,
    110,
    101,
    100,
    46,
    0,
    82,
    101,
    116,
    117,
    114,
    110,
    32,
    102,
    114,
    111,
    109,
    32,
    109,
    97,
    105,
    110,
    32,
    112,
    114,
    111,
    103,
    114,
    97,
    109,
    46,
    0,
    83,
    113,
    117,
    97,
    114,
    101,
    32,
    114,
    111,
    111,
    116,
    32,
    111,
    102,
    32,
    97,
    32,
    110,
    101,
    103,
    97,
    116,
    105,
    118,
    101,
    32,
    110,
    117,
    109,
    98,
    101,
    114,
    0,
    68,
    105,
    118,
    105,
    100,
    101,
    32,
    98,
    121,
    32,
    122,
    101,
    114,
    111,
    0,
    77,
    111,
    100,
    117,
    108,
    111,
    32,
    98,
    121,
    32,
    122,
    101,
    114,
    111,
    0,
    100,
    105,
    118,
    105,
    100,
    101,
    32,
    98,
    121,
    32,
    122,
    101,
    114,
    111,
    0,
    98,
    97,
    100,
    32,
    105,
    110,
    115,
    116,
    114,
    117,
    99,
    116,
    105,
    111,
    110,
    58,
    32,
    105,
    110,
    115,
    116,
    61,
    37,
    99,
    0,
    10,
    105,
    110,
    116,
    101,
    114,
    114,
    117,
    112,
    116,
    101,
    100,
    32,
    101,
    120,
    101,
    99,
    117,
    116,
    105,
    111,
    110,
    46,
    10,
    0,
    80,
    114,
    111,
    103,
    114,
    97,
    109,
    32,
    116,
    111,
    111,
    32,
    98,
    105,
    103,
    46,
    10,
    0,
    40,
    109,
    97,
    105,
    110,
    41,
    0,
    102,
    117,
    110,
    99,
    116,
    105,
    111,
    110,
    32,
    115,
    116,
    97,
    99,
    107,
    32,
    117,
    110,
    100,
    101,
    114,
    102,
    108,
    111,
    119,
    44,
    32,
    99,
    111,
    110,
    116,
    97,
    99,
    116,
    32,
    109,
    97,
    105,
    110,
    116,
    97,
    105,
    110,
    101,
    114,
    46,
    0,
    83,
    116,
    97,
    99,
    107,
    32,
    101,
    114,
    114,
    111,
    114,
    46,
    0,
    110,
    101,
    103,
    97,
    116,
    105,
    118,
    101,
    32,
    105,
    98,
    97,
    115,
    101,
    44,
    32,
    115,
    101,
    116,
    32,
    116,
    111,
    32,
    50,
    0,
    110,
    101,
    103,
    97,
    116,
    105,
    118,
    101,
    32,
    111,
    98,
    97,
    115,
    101,
    44,
    32,
    115,
    101,
    116,
    32,
    116,
    111,
    32,
    50,
    0,
    110,
    101,
    103,
    97,
    116,
    105,
    118,
    101,
    32,
    115,
    99,
    97,
    108,
    101,
    44,
    32,
    115,
    101,
    116,
    32,
    116,
    111,
    32,
    48,
    0,
    105,
    98,
    97,
    115,
    101,
    32,
    116,
    111,
    111,
    32,
    115,
    109,
    97,
    108,
    108,
    44,
    32,
    115,
    101,
    116,
    32,
    116,
    111,
    32,
    50,
    0,
    105,
    98,
    97,
    115,
    101,
    32,
    116,
    111,
    111,
    32,
    108,
    97,
    114,
    103,
    101,
    44,
    32,
    115,
    101,
    116,
    32,
    116,
    111,
    32,
    49,
    54,
    0,
    111,
    98,
    97,
    115,
    101,
    32,
    116,
    111,
    111,
    32,
    115,
    109,
    97,
    108,
    108,
    44,
    32,
    115,
    101,
    116,
    32,
    116,
    111,
    32,
    50,
    0,
    111,
    98,
    97,
    115,
    101,
    32,
    116,
    111,
    111,
    32,
    108,
    97,
    114,
    103,
    101,
    44,
    32,
    115,
    101,
    116,
    32,
    116,
    111,
    32,
    37,
    100,
    0,
    115,
    99,
    97,
    108,
    101,
    32,
    116,
    111,
    111,
    32,
    108,
    97,
    114,
    103,
    101,
    44,
    32,
    115,
    101,
    116,
    32,
    116,
    111,
    32,
    37,
    100,
    0,
    65,
    114,
    114,
    97,
    121,
    32,
    37,
    115,
    32,
    115,
    117,
    98,
    115,
    99,
    114,
    105,
    112,
    116,
    32,
    111,
    117,
    116,
    32,
    111,
    102,
    32,
    98,
    111,
    117,
    110,
    100,
    115,
    46,
    0,
    105,
    98,
    97,
    115,
    101,
    32,
    116,
    111,
    111,
    32,
    115,
    109,
    97,
    108,
    108,
    32,
    105,
    110,
    32,
    45,
    45,
    0,
    111,
    98,
    97,
    115,
    101,
    32,
    116,
    111,
    111,
    32,
    115,
    109,
    97,
    108,
    108,
    32,
    105,
    110,
    32,
    45,
    45,
    0,
    115,
    99,
    97,
    108,
    101,
    32,
    99,
    97,
    110,
    32,
    110,
    111,
    116,
    32,
    98,
    101,
    32,
    110,
    101,
    103,
    97,
    116,
    105,
    118,
    101,
    32,
    105,
    110,
    32,
    45,
    45,
    32,
    0,
    105,
    98,
    97,
    115,
    101,
    32,
    116,
    111,
    111,
    32,
    98,
    105,
    103,
    32,
    105,
    110,
    32,
    43,
    43,
    0,
    111,
    98,
    97,
    115,
    101,
    32,
    116,
    111,
    111,
    32,
    98,
    105,
    103,
    32,
    105,
    110,
    32,
    43,
    43,
    0,
    83,
    99,
    97,
    108,
    101,
    32,
    116,
    111,
    111,
    32,
    98,
    105,
    103,
    32,
    105,
    110,
    32,
    43,
    43,
    0,
    80,
    97,
    114,
    97,
    109,
    101,
    116,
    101,
    114,
    32,
    116,
    121,
    112,
    101,
    32,
    109,
    105,
    115,
    109,
    97,
    116,
    99,
    104,
    32,
    112,
    97,
    114,
    97,
    109,
    101,
    116,
    101,
    114,
    32,
    37,
    115,
    46,
    0,
    80,
    97,
    114,
    97,
    109,
    101,
    116,
    101,
    114,
    32,
    116,
    121,
    112,
    101,
    32,
    109,
    105,
    115,
    109,
    97,
    116,
    99,
    104,
    44,
    32,
    112,
    97,
    114,
    97,
    109,
    101,
    116,
    101,
    114,
    32,
    37,
    115,
    46,
    0,
    80,
    97,
    114,
    97,
    109,
    101,
    116,
    101,
    114,
    32,
    110,
    117,
    109,
    98,
    101,
    114,
    32,
    109,
    105,
    115,
    109,
    97,
    116,
    99,
    104,
    0,
    70,
    97,
    116,
    97,
    108,
    32,
    101,
    114,
    114,
    111,
    114,
    58,
    32,
    79,
    117,
    116,
    32,
    111,
    102,
    32,
    109,
    101,
    109,
    111,
    114,
    121,
    32,
    102,
    111,
    114,
    32,
    109,
    97,
    108,
    108,
    111,
    99,
    46,
    10,
    0,
    42,
    37,
    100,
    44,
    0,
    42,
    37,
    100,
    0,
    37,
    100,
    44,
    0,
    37,
    100,
    0,
    100,
    117,
    112,
    108,
    105,
    99,
    97,
    116,
    101,
    32,
    112,
    97,
    114,
    97,
    109,
    101,
    116,
    101,
    114,
    32,
    110,
    97,
    109,
    101,
    115,
    0,
    40,
    115,
    116,
    97,
    110,
    100,
    97,
    114,
    100,
    95,
    105,
    110,
    41,
    0,
    37,
    115,
    32,
    37,
    100,
    58,
    32,
    0,
    86,
    97,
    114,
    105,
    97,
    98,
    108,
    101,
    32,
    97,
    114,
    114,
    97,
    121,
    32,
    112,
    97,
    114,
    97,
    109,
    101,
    116,
    101,
    114,
    0,
    37,
    115,
    32,
    37,
    100,
    58,
    32,
    69,
    114,
    114,
    111,
    114,
    58,
    32,
    0,
    37,
    115,
    32,
    37,
    100,
    58,
    32,
    40,
    87,
    97,
    114,
    110,
    105,
    110,
    103,
    41,
    32,
    0,
    100,
    117,
    112,
    108,
    105,
    99,
    97,
    116,
    101,
    32,
    97,
    117,
    116,
    111,
    32,
    118,
    97,
    114,
    105,
    97,
    98,
    108,
    101,
    32,
    110,
    97,
    109,
    101,
    115,
    0,
    42,
    32,
    110,
    111,
    116,
    32,
    97,
    108,
    108,
    111,
    119,
    101,
    100,
    32,
    104,
    101,
    114,
    101,
    0,
    118,
    97,
    114,
    105,
    97,
    98,
    108,
    101,
    32,
    105,
    110,
    32,
    98,
    111,
    116,
    104,
    32,
    112,
    97,
    114,
    97,
    109,
    101,
    116,
    101,
    114,
    32,
    97,
    110,
    100,
    32,
    97,
    117,
    116,
    111,
    32,
    108,
    105,
    115,
    116,
    115,
    0,
    64,
    105,
    0,
    37,
    115,
    0,
    64,
    114,
    10,
    0,
    109,
    117,
    108,
    116,
    105,
    112,
    108,
    101,
    32,
    108,
    101,
    116,
    116,
    101,
    114,
    32,
    110,
    97,
    109,
    101,
    32,
    45,
    32,
    37,
    115,
    0,
    84,
    111,
    111,
    32,
    109,
    97,
    110,
    121,
    32,
    97,
    114,
    114,
    97,
    121,
    32,
    118,
    97,
    114,
    105,
    97,
    98,
    108,
    101,
    115,
    0,
    84,
    111,
    111,
    32,
    109,
    97,
    110,
    121,
    32,
    102,
    117,
    110,
    99,
    116,
    105,
    111,
    110,
    115,
    0,
    84,
    111,
    111,
    32,
    109,
    97,
    110,
    121,
    32,
    118,
    97,
    114,
    105,
    97,
    98,
    108,
    101,
    115,
    0,
    69,
    110,
    100,
    32,
    111,
    102,
    32,
    117,
    116,
    105,
    108,
    46,
    99,
    47,
    108,
    111,
    111,
    107,
    117,
    112,
    40,
    41,
    32,
    114,
    101,
    97,
    99,
    104,
    101,
    100,
    46,
    32,
    32,
    80,
    108,
    101,
    97,
    115,
    101,
    32,
    114,
    101,
    112,
    111,
    114,
    116,
    32,
    116,
    104,
    105,
    115,
    32,
    98,
    117,
    103,
    46,
    0,
    66,
    67,
    95,
    66,
    65,
    83,
    69,
    95,
    77,
    65,
    88,
    32,
    32,
    32,
    32,
    32,
    61,
    32,
    37,
    100,
    10,
    0,
    66,
    67,
    95,
    68,
    73,
    77,
    95,
    77,
    65,
    88,
    32,
    32,
    32,
    32,
    32,
    32,
    61,
    32,
    37,
    108,
    100,
    10,
    0,
    66,
    67,
    95,
    83,
    67,
    65,
    76,
    69,
    95,
    77,
    65,
    88,
    32,
    32,
    32,
    32,
    61,
    32,
    37,
    100,
    10,
    0,
    66,
    67,
    95,
    83,
    84,
    82,
    73,
    78,
    71,
    95,
    77,
    65,
    88,
    32,
    32,
    32,
    61,
    32,
    37,
    100,
    10,
    0,
    77,
    65,
    88,
    32,
    69,
    120,
    112,
    111,
    110,
    101,
    110,
    116,
    32,
    32,
    32,
    32,
    61,
    32,
    37,
    108,
    100,
    10,
    0,
    78,
    117,
    109,
    98,
    101,
    114,
    32,
    111,
    102,
    32,
    118,
    97,
    114,
    115,
    32,
    32,
    61,
    32,
    37,
    108,
    100,
    10,
    0,
    82,
    117,
    110,
    116,
    105,
    109,
    101,
    32,
    101,
    114,
    114,
    111,
    114,
    32,
    40,
    102,
    117,
    110,
    99,
    61,
    37,
    115,
    44,
    32,
    97,
    100,
    114,
    61,
    37,
    100,
    41,
    58,
    32,
    0,
    82,
    117,
    110,
    116,
    105,
    109,
    101,
    32,
    119,
    97,
    114,
    110,
    105,
    110,
    103,
    32,
    40,
    102,
    117,
    110,
    99,
    61,
    37,
    115,
    44,
    32,
    97,
    100,
    114,
    61,
    37,
    100,
    41,
    58,
    32,
    0,
    64,
    105,
    75,
    50,
    48,
    58,
    115,
    50,
    58,
    112,
    64,
    114,
    0,
    64,
    105,
    70,
    49,
    44,
    53,
    46,
    54,
    44,
    55,
    44,
    56,
    44,
    57,
    44,
    49,
    48,
    44,
    49,
    49,
    44,
    49,
    50,
    44,
    49,
    51,
    44,
    49,
    52,
    44,
    49,
    53,
    91,
    108,
    48,
    58,
    75,
    65,
    58,
    35,
    90,
    49,
    58,
    108,
    48,
    58,
    115,
    55,
    58,
    112,
    75,
    65,
    58,
    115,
    48,
    58,
    112,
    108,
    53,
    58,
    67,
    49,
    44,
    48,
    58,
    0,
    115,
    49,
    52,
    58,
    112,
    108,
    55,
    58,
    115,
    48,
    58,
    112,
    108,
    49,
    52,
    58,
    82,
    78,
    49,
    58,
    108,
    53,
    58,
    48,
    60,
    90,
    50,
    58,
    49,
    115,
    49,
    50,
    58,
    112,
    108,
    53,
    58,
    110,
    115,
    53,
    58,
    112,
    78,
    50,
    58,
    108,
    50,
    58,
    115,
    49,
    53,
    58,
    112,
    75,
    54,
    58,
    108,
    49,
    53,
    58,
    43,
    0,
    75,
    46,
    52,
    52,
    58,
    108,
    53,
    58,
    42,
    43,
    115,
    49,
    51,
    58,
    112,
    108,
    53,
    58,
    99,
    83,
    49,
    43,
    115,
    50,
    58,
    112,
    78,
    51,
    58,
    108,
    53,
    58,
    49,
    62,
    90,
    52,
    58,
    108,
    49,
    48,
    58,
    49,
    43,
    115,
    49,
    48,
    58,
    112,
    108,
    53,
    58,
    75,
    50,
    58,
    47,
    115,
    53,
    58,
    112,
    108,
    50,
    58,
    0,
    49,
    43,
    115,
    50,
    58,
    112,
    74,
    51,
    58,
    78,
    52,
    58,
    108,
    49,
    51,
    58,
    115,
    50,
    58,
    112,
    49,
    108,
    53,
    58,
    43,
    115,
    49,
    52,
    58,
    112,
    108,
    53,
    58,
    115,
    54,
    58,
    112,
    49,
    115,
    56,
    58,
    112,
    75,
    50,
    58,
    115,
    49,
    49,
    58,
    112,
    78,
    54,
    58,
    49,
    66,
    55,
    58,
    74,
    53,
    58,
    78,
    56,
    58,
    0,
    108,
    49,
    49,
    58,
    105,
    49,
    49,
    58,
    112,
    74,
    54,
    58,
    78,
    55,
    58,
    108,
    54,
    58,
    108,
    53,
    58,
    42,
    115,
    54,
    58,
    108,
    56,
    58,
    108,
    49,
    49,
    58,
    42,
    115,
    56,
    58,
    47,
    115,
    57,
    58,
    112,
    108,
    57,
    58,
    48,
    61,
    90,
    57,
    58,
    108,
    49,
    48,
    58,
    48,
    62,
    90,
    49,
    48,
    58,
    78,
    49,
    49,
    58,
    0,
    108,
    49,
    48,
    58,
    100,
    49,
    48,
    58,
    90,
    49,
    50,
    58,
    108,
    49,
    52,
    58,
    108,
    49,
    52,
    58,
    42,
    115,
    49,
    52,
    58,
    112,
    74,
    49,
    49,
    58,
    78,
    49,
    50,
    58,
    78,
    49,
    48,
    58,
    108,
    49,
    53,
    58,
    115,
    50,
    58,
    112,
    108,
    49,
    50,
    58,
    90,
    49,
    51,
    58,
    49,
    108,
    49,
    52,
    58,
    47,
    82,
    0,
    78,
    49,
    51,
    58,
    108,
    49,
    52,
    58,
    49,
    47,
    82,
    78,
    57,
    58,
    108,
    49,
    52,
    58,
    108,
    57,
    58,
    43,
    115,
    49,
    52,
    58,
    112,
    74,
    56,
    58,
    78,
    53,
    58,
    48,
    82,
    93,
    64,
    114,
    0,
    64,
    105,
    70,
    50,
    44,
    53,
    46,
    55,
    44,
    57,
    44,
    49,
    48,
    44,
    49,
    49,
    44,
    49,
    50,
    44,
    49,
    51,
    44,
    49,
    52,
    44,
    49,
    53,
    91,
    108,
    48,
    58,
    75,
    65,
    58,
    35,
    90,
    49,
    58,
    108,
    48,
    58,
    115,
    55,
    58,
    112,
    75,
    65,
    58,
    115,
    48,
    58,
    112,
    108,
    53,
    58,
    67,
    50,
    44,
    48,
    58,
    0,
    115,
    49,
    52,
    58,
    112,
    108,
    55,
    58,
    115,
    48,
    58,
    112,
    108,
    49,
    52,
    58,
    82,
    78,
    49,
    58,
    108,
    53,
    58,
    48,
    123,
    90,
    50,
    58,
    49,
    75,
    49,
    48,
    58,
    108,
    50,
    58,
    94,
    45,
    49,
    47,
    82,
    78,
    50,
    58,
    108,
    50,
    58,
    115,
    49,
    53,
    58,
    112,
    75,
    54,
    58,
    108,
    50,
    58,
    43,
    115,
    50,
    58,
    0,
    112,
    75,
    50,
    58,
    115,
    49,
    48,
    58,
    112,
    48,
    115,
    49,
    49,
    58,
    112,
    78,
    51,
    58,
    108,
    53,
    58,
    75,
    50,
    58,
    125,
    90,
    52,
    58,
    108,
    49,
    48,
    58,
    75,
    50,
    58,
    42,
    115,
    49,
    48,
    58,
    112,
    108,
    53,
    58,
    99,
    82,
    115,
    53,
    58,
    112,
    74,
    51,
    58,
    78,
    52,
    58,
    78,
    53,
    58,
    108,
    53,
    58,
    0,
    75,
    46,
    53,
    58,
    123,
    90,
    54,
    58,
    108,
    49,
    48,
    58,
    75,
    50,
    58,
    42,
    115,
    49,
    48,
    58,
    112,
    108,
    53,
    58,
    99,
    82,
    115,
    53,
    58,
    112,
    74,
    53,
    58,
    78,
    54,
    58,
    108,
    53,
    58,
    49,
    45,
    108,
    53,
    58,
    49,
    43,
    47,
    115,
    49,
    51,
    58,
    115,
    49,
    52,
    58,
    112,
    108,
    49,
    51,
    58,
    108,
    49,
    51,
    58,
    0,
    42,
    115,
    49,
    50,
    58,
    112,
    75,
    51,
    58,
    115,
    49,
    49,
    58,
    112,
    78,
    56,
    58,
    49,
    66,
    57,
    58,
    74,
    55,
    58,
    78,
    49,
    48,
    58,
    108,
    49,
    49,
    58,
    75,
    50,
    58,
    43,
    115,
    49,
    49,
    58,
    112,
    74,
    56,
    58,
    78,
    57,
    58,
    108,
    49,
    51,
    58,
    108,
    49,
    50,
    58,
    42,
    115,
    49,
    51,
    58,
    108,
    49,
    49,
    58,
    0,
    47,
    115,
    57,
    58,
    112,
    108,
    57,
    58,
    48,
    61,
    90,
    49,
    49,
    58,
    108,
    49,
    48,
    58,
    108,
    49,
    52,
    58,
    42,
    115,
    49,
    52,
    58,
    112,
    108,
    49,
    53,
    58,
    115,
    50,
    58,
    112,
    108,
    49,
    52,
    58,
    49,
    47,
    82,
    78,
    49,
    49,
    58,
    108,
    49,
    52,
    58,
    108,
    57,
    58,
    43,
    115,
    49,
    52,
    58,
    112,
    74,
    49,
    48,
    58,
    78,
    55,
    58,
    0,
    48,
    82,
    93,
    64,
    114,
    0,
    64,
    105,
    70,
    51,
    44,
    53,
    46,
    55,
    44,
    57,
    44,
    49,
    49,
    44,
    49,
    50,
    44,
    49,
    51,
    44,
    49,
    54,
    44,
    49,
    52,
    44,
    49,
    53,
    91,
    108,
    48,
    58,
    75,
    65,
    58,
    35,
    90,
    49,
    58,
    108,
    48,
    58,
    115,
    55,
    58,
    112,
    75,
    65,
    58,
    115,
    48,
    58,
    112,
    108,
    53,
    58,
    67,
    51,
    44,
    48,
    58,
    0,
    115,
    49,
    52,
    58,
    112,
    108,
    55,
    58,
    115,
    48,
    58,
    112,
    108,
    49,
    52,
    58,
    82,
    78,
    49,
    58,
    108,
    50,
    58,
    115,
    49,
    53,
    58,
    112,
    75,
    49,
    46,
    49,
    58,
    108,
    49,
    53,
    58,
    42,
    75,
    50,
    58,
    43,
    115,
    50,
    58,
    112,
    49,
    67,
    52,
    44,
    48,
    58,
    115,
    49,
    52,
    58,
    112,
    108,
    53,
    58,
    48,
    0,
    60,
    90,
    50,
    58,
    49,
    115,
    49,
    50,
    58,
    112,
    108,
    53,
    58,
    110,
    115,
    53,
    58,
    112,
    78,
    50,
    58,
    48,
    115,
    50,
    58,
    112,
    108,
    53,
    58,
    108,
    49,
    52,
    58,
    47,
    75,
    50,
    58,
    43,
    75,
    52,
    58,
    47,
    115,
    49,
    51,
    58,
    112,
    108,
    53,
    58,
    75,
    52,
    58,
    108,
    49,
    51,
    58,
    42,
    108,
    49,
    52,
    58,
    0,
    42,
    45,
    115,
    53,
    58,
    112,
    108,
    49,
    51,
    58,
    75,
    50,
    58,
    37,
    90,
    51,
    58,
    108,
    53,
    58,
    110,
    115,
    53,
    58,
    112,
    78,
    51,
    58,
    108,
    49,
    53,
    58,
    75,
    50,
    58,
    43,
    115,
    50,
    58,
    112,
    108,
    53,
    58,
    115,
    57,
    58,
    115,
    49,
    52,
    58,
    112,
    108,
    53,
    58,
    110,
    108,
    53,
    58,
    42,
    115,
    49,
    54,
    58,
    0,
    112,
    75,
    51,
    58,
    115,
    49,
    49,
    58,
    112,
    78,
    53,
    58,
    49,
    66,
    54,
    58,
    74,
    52,
    58,
    78,
    55,
    58,
    108,
    49,
    49,
    58,
    75,
    50,
    58,
    43,
    115,
    49,
    49,
    58,
    112,
    74,
    53,
    58,
    78,
    54,
    58,
    108,
    57,
    58,
    108,
    49,
    54,
    58,
    108,
    49,
    49,
    58,
    108,
    49,
    49,
    58,
    49,
    45,
    42,
    47,
    42,
    0,
    115,
    57,
    58,
    112,
    108,
    57,
    58,
    48,
    61,
    90,
    56,
    58,
    108,
    49,
    53,
    58,
    115,
    50,
    58,
    112,
    108,
    49,
    50,
    58,
    90,
    57,
    58,
    108,
    49,
    52,
    58,
    110,
    49,
    47,
    82,
    78,
    57,
    58,
    108,
    49,
    52,
    58,
    49,
    47,
    82,
    78,
    56,
    58,
    108,
    49,
    52,
    58,
    108,
    57,
    58,
    43,
    115,
    49,
    52,
    58,
    112,
    0,
    74,
    55,
    58,
    78,
    52,
    58,
    48,
    82,
    93,
    64,
    114,
    0,
    64,
    105,
    70,
    53,
    44,
    53,
    46,
    55,
    44,
    49,
    52,
    44,
    49,
    53,
    91,
    108,
    48,
    58,
    75,
    65,
    58,
    35,
    90,
    49,
    58,
    108,
    48,
    58,
    115,
    55,
    58,
    112,
    75,
    65,
    58,
    115,
    48,
    58,
    112,
    108,
    53,
    58,
    67,
    53,
    44,
    48,
    58,
    115,
    49,
    52,
    58,
    112,
    108,
    55,
    58,
    115,
    48,
    58,
    112,
    108,
    49,
    52,
    58,
    0,
    82,
    78,
    49,
    58,
    108,
    50,
    58,
    115,
    49,
    53,
    58,
    112,
    108,
    50,
    58,
    75,
    49,
    46,
    50,
    58,
    42,
    115,
    50,
    58,
    112,
    108,
    53,
    58,
    49,
    67,
    52,
    44,
    48,
    58,
    75,
    50,
    58,
    42,
    43,
    67,
    51,
    44,
    48,
    58,
    115,
    49,
    52,
    58,
    112,
    108,
    49,
    53,
    58,
    115,
    50,
    58,
    112,
    108,
    49,
    52,
    58,
    0,
    49,
    47,
    82,
    48,
    82,
    93,
    64,
    114,
    0,
    64,
    105,
    70,
    52,
    44,
    53,
    46,
    54,
    44,
    55,
    44,
    57,
    44,
    49,
    48,
    44,
    49,
    49,
    44,
    49,
    50,
    44,
    49,
    51,
    44,
    49,
    54,
    44,
    49,
    52,
    44,
    49,
    53,
    91,
    108,
    48,
    58,
    75,
    65,
    58,
    35,
    90,
    49,
    58,
    108,
    48,
    58,
    115,
    55,
    58,
    112,
    75,
    65,
    58,
    115,
    48,
    58,
    112,
    108,
    53,
    58,
    0,
    67,
    52,
    44,
    48,
    58,
    115,
    49,
    52,
    58,
    112,
    108,
    55,
    58,
    115,
    48,
    58,
    112,
    108,
    49,
    52,
    58,
    82,
    78,
    49,
    58,
    49,
    115,
    49,
    50,
    58,
    112,
    108,
    53,
    58,
    48,
    60,
    90,
    50,
    58,
    49,
    110,
    115,
    49,
    50,
    58,
    112,
    108,
    53,
    58,
    110,
    115,
    53,
    58,
    112,
    78,
    50,
    58,
    108,
    53,
    58,
    49,
    0,
    61,
    90,
    51,
    58,
    108,
    50,
    58,
    75,
    50,
    53,
    58,
    123,
    90,
    52,
    58,
    75,
    46,
    55,
    56,
    53,
    51,
    57,
    56,
    49,
    54,
    51,
    51,
    57,
    55,
    52,
    52,
    56,
    51,
    48,
    57,
    54,
    49,
    53,
    54,
    54,
    48,
    56,
    58,
    108,
    49,
    50,
    58,
    47,
    82,
    78,
    52,
    58,
    108,
    50,
    58,
    75,
    52,
    48,
    58,
    123,
    90,
    53,
    58,
    0,
    75,
    46,
    55,
    56,
    53,
    51,
    57,
    56,
    49,
    54,
    51,
    51,
    57,
    55,
    52,
    52,
    56,
    51,
    48,
    57,
    54,
    49,
    53,
    54,
    54,
    48,
    56,
    52,
    53,
    56,
    49,
    57,
    56,
    55,
    53,
    55,
    50,
    49,
    48,
    52,
    57,
    50,
    58,
    108,
    49,
    50,
    58,
    47,
    82,
    78,
    53,
    58,
    108,
    50,
    58,
    75,
    54,
    48,
    58,
    123,
    90,
    54,
    58,
    0,
    75,
    46,
    55,
    56,
    53,
    51,
    57,
    56,
    49,
    54,
    51,
    51,
    57,
    55,
    52,
    52,
    56,
    51,
    48,
    57,
    54,
    49,
    53,
    54,
    54,
    48,
    56,
    52,
    53,
    56,
    49,
    57,
    56,
    55,
    53,
    55,
    50,
    49,
    48,
    52,
    57,
    50,
    57,
    50,
    51,
    52,
    57,
    56,
    52,
    51,
    55,
    55,
    54,
    52,
    53,
    53,
    50,
    52,
    51,
    55,
    51,
    54,
    0,
    58,
    108,
    49,
    50,
    58,
    47,
    82,
    78,
    54,
    58,
    78,
    51,
    58,
    108,
    53,
    58,
    75,
    46,
    50,
    58,
    61,
    90,
    55,
    58,
    108,
    50,
    58,
    75,
    50,
    53,
    58,
    123,
    90,
    56,
    58,
    75,
    46,
    49,
    57,
    55,
    51,
    57,
    53,
    53,
    53,
    57,
    56,
    52,
    57,
    56,
    56,
    48,
    55,
    53,
    56,
    51,
    55,
    48,
    48,
    52,
    57,
    55,
    0,
    58,
    108,
    49,
    50,
    58,
    47,
    82,
    78,
    56,
    58,
    108,
    50,
    58,
    75,
    52,
    48,
    58,
    123,
    90,
    57,
    58,
    75,
    46,
    49,
    57,
    55,
    51,
    57,
    53,
    53,
    53,
    57,
    56,
    52,
    57,
    56,
    56,
    48,
    55,
    53,
    56,
    51,
    55,
    48,
    48,
    52,
    57,
    55,
    54,
    53,
    49,
    57,
    52,
    55,
    57,
    48,
    50,
    57,
    51,
    52,
    52,
    55,
    53,
    0,
    58,
    108,
    49,
    50,
    58,
    47,
    82,
    78,
    57,
    58,
    108,
    50,
    58,
    75,
    54,
    48,
    58,
    123,
    90,
    49,
    48,
    58,
    75,
    46,
    49,
    57,
    55,
    51,
    57,
    53,
    53,
    53,
    57,
    56,
    52,
    57,
    56,
    56,
    48,
    55,
    53,
    56,
    51,
    55,
    48,
    48,
    52,
    57,
    55,
    54,
    53,
    49,
    57,
    52,
    55,
    57,
    48,
    50,
    57,
    51,
    52,
    52,
    55,
    53,
    56,
    53,
    49,
    48,
    51,
    55,
    56,
    55,
    56,
    53,
    50,
    49,
    48,
    49,
    53,
    49,
    55,
    54,
    56,
    56,
    0,
    58,
    108,
    49,
    50,
    58,
    47,
    82,
    78,
    49,
    48,
    58,
    78,
    55,
    58,
    108,
    50,
    58,
    115,
    49,
    53,
    58,
    112,
    108,
    53,
    58,
    75,
    46,
    50,
    58,
    62,
    90,
    49,
    49,
    58,
    108,
    49,
    53,
    58,
    75,
    53,
    58,
    43,
    115,
    50,
    58,
    112,
    75,
    46,
    50,
    58,
    67,
    52,
    44,
    48,
    58,
    115,
    54,
    58,
    112,
    78,
    49,
    49,
    58,
    0,
    108,
    49,
    53,
    58,
    75,
    51,
    58,
    43,
    115,
    50,
    58,
    112,
    78,
    49,
    50,
    58,
    108,
    53,
    58,
    75,
    46,
    50,
    58,
    62,
    90,
    49,
    51,
    58,
    108,
    49,
    48,
    58,
    49,
    43,
    115,
    49,
    48,
    58,
    112,
    108,
    53,
    58,
    75,
    46,
    50,
    58,
    45,
    49,
    108,
    53,
    58,
    75,
    46,
    50,
    58,
    42,
    43,
    47,
    115,
    53,
    58,
    0,
    112,
    74,
    49,
    50,
    58,
    78,
    49,
    51,
    58,
    108,
    53,
    58,
    115,
    49,
    51,
    58,
    115,
    49,
    52,
    58,
    112,
    108,
    53,
    58,
    110,
    108,
    53,
    58,
    42,
    115,
    49,
    54,
    58,
    112,
    75,
    51,
    58,
    115,
    49,
    49,
    58,
    112,
    78,
    49,
    53,
    58,
    49,
    66,
    49,
    54,
    58,
    74,
    49,
    52,
    58,
    78,
    49,
    55,
    58,
    108,
    49,
    49,
    58,
    0,
    75,
    50,
    58,
    43,
    115,
    49,
    49,
    58,
    112,
    74,
    49,
    53,
    58,
    78,
    49,
    54,
    58,
    108,
    49,
    51,
    58,
    108,
    49,
    54,
    58,
    42,
    115,
    49,
    51,
    58,
    108,
    49,
    49,
    58,
    47,
    115,
    57,
    58,
    112,
    108,
    57,
    58,
    48,
    61,
    90,
    49,
    56,
    58,
    108,
    49,
    53,
    58,
    115,
    50,
    58,
    112,
    108,
    49,
    48,
    58,
    108,
    54,
    58,
    0,
    42,
    108,
    49,
    52,
    58,
    43,
    108,
    49,
    50,
    58,
    47,
    82,
    78,
    49,
    56,
    58,
    108,
    49,
    52,
    58,
    108,
    57,
    58,
    43,
    115,
    49,
    52,
    58,
    112,
    74,
    49,
    55,
    58,
    78,
    49,
    52,
    58,
    48,
    82,
    93,
    64,
    114,
    0,
    64,
    105,
    70,
    54,
    44,
    49,
    51,
    44,
    53,
    46,
    54,
    44,
    55,
    44,
    56,
    44,
    57,
    44,
    49,
    48,
    44,
    49,
    49,
    44,
    49,
    50,
    44,
    49,
    54,
    44,
    49,
    52,
    44,
    49,
    53,
    91,
    108,
    48,
    58,
    75,
    65,
    58,
    35,
    90,
    49,
    58,
    108,
    48,
    58,
    115,
    55,
    58,
    112,
    75,
    65,
    58,
    115,
    48,
    58,
    112,
    108,
    49,
    51,
    58,
    0,
    108,
    53,
    58,
    67,
    54,
    44,
    48,
    48,
    58,
    115,
    49,
    52,
    58,
    112,
    108,
    55,
    58,
    115,
    48,
    58,
    112,
    108,
    49,
    52,
    58,
    82,
    78,
    49,
    58,
    108,
    50,
    58,
    115,
    49,
    53,
    58,
    112,
    48,
    115,
    50,
    58,
    112,
    108,
    49,
    51,
    58,
    49,
    47,
    115,
    49,
    51,
    58,
    112,
    108,
    49,
    51,
    58,
    48,
    60,
    90,
    50,
    58,
    0,
    108,
    49,
    51,
    58,
    110,
    115,
    49,
    51,
    58,
    112,
    108,
    49,
    51,
    58,
    75,
    50,
    58,
    37,
    49,
    61,
    90,
    51,
    58,
    49,
    115,
    49,
    50,
    58,
    112,
    78,
    51,
    58,
    78,
    50,
    58,
    49,
    115,
    49,
    48,
    58,
    112,
    75,
    50,
    58,
    115,
    49,
    49,
    58,
    112,
    78,
    53,
    58,
    108,
    49,
    49,
    58,
    108,
    49,
    51,
    58,
    123,
    0,
    66,
    54,
    58,
    74,
    52,
    58,
    78,
    55,
    58,
    108,
    49,
    49,
    58,
    105,
    49,
    49,
    58,
    112,
    74,
    53,
    58,
    78,
    54,
    58,
    108,
    49,
    48,
    58,
    108,
    49,
    49,
    58,
    42,
    115,
    49,
    48,
    58,
    112,
    74,
    55,
    58,
    78,
    52,
    58,
    75,
    49,
    46,
    53,
    58,
    108,
    49,
    53,
    58,
    42,
    115,
    50,
    58,
    112,
    108,
    53,
    58,
    0,
    108,
    49,
    51,
    58,
    94,
    75,
    50,
    58,
    108,
    49,
    51,
    58,
    94,
    47,
    108,
    49,
    48,
    58,
    47,
    115,
    49,
    48,
    58,
    112,
    49,
    115,
    57,
    58,
    115,
    49,
    52,
    58,
    112,
    108,
    53,
    58,
    110,
    108,
    53,
    58,
    42,
    75,
    52,
    58,
    47,
    115,
    49,
    54,
    58,
    112,
    75,
    49,
    46,
    53,
    58,
    108,
    49,
    53,
    58,
    42,
    108,
    49,
    48,
    58,
    0,
    99,
    76,
    43,
    108,
    49,
    48,
    58,
    99,
    83,
    45,
    115,
    50,
    58,
    112,
    49,
    115,
    49,
    49,
    58,
    112,
    78,
    57,
    58,
    49,
    66,
    49,
    48,
    58,
    74,
    56,
    58,
    78,
    49,
    49,
    58,
    108,
    49,
    49,
    58,
    105,
    49,
    49,
    58,
    112,
    74,
    57,
    58,
    78,
    49,
    48,
    58,
    108,
    57,
    58,
    108,
    49,
    54,
    58,
    42,
    108,
    49,
    49,
    58,
    0,
    47,
    108,
    49,
    51,
    58,
    108,
    49,
    49,
    58,
    43,
    47,
    115,
    57,
    58,
    112,
    108,
    57,
    58,
    48,
    61,
    90,
    49,
    50,
    58,
    108,
    49,
    53,
    58,
    115,
    50,
    58,
    112,
    108,
    49,
    50,
    58,
    90,
    49,
    51,
    58,
    108,
    49,
    48,
    58,
    110,
    108,
    49,
    52,
    58,
    42,
    49,
    47,
    82,
    78,
    49,
    51,
    58,
    108,
    49,
    48,
    58,
    0,
    108,
    49,
    52,
    58,
    42,
    49,
    47,
    82,
    78,
    49,
    50,
    58,
    108,
    49,
    52,
    58,
    108,
    57,
    58,
    43,
    115,
    49,
    52,
    58,
    112,
    74,
    49,
    49,
    58,
    78,
    56,
    58,
    48,
    82,
    93,
    64,
    114,
    0,
    84,
    104,
    105,
    115,
    32,
    105,
    115,
    32,
    102,
    114,
    101,
    101,
    32,
    115,
    111,
    102,
    116,
    119,
    97,
    114,
    101,
    32,
    119,
    105,
    116,
    104,
    32,
    65,
    66,
    83,
    79,
    76,
    85,
    84,
    69,
    76,
    89,
    32,
    78,
    79,
    32,
    87,
    65,
    82,
    82,
    65,
    78,
    84,
    89,
    46,
    10,
    0,
    70,
    111,
    114,
    32,
    100,
    101,
    116,
    97,
    105,
    108,
    115,
    32,
    116,
    121,
    112,
    101,
    32,
    96,
    119,
    97,
    114,
    114,
    97,
    110,
    116,
    121,
    39,
    46,
    32,
    10,
    0,
    37,
    115,
    32,
    37,
    115,
    10,
    37,
    115,
    10,
    0,
    98,
    99,
    0,
    49,
    46,
    48,
    54,
    46,
    57,
    53,
    0,
    67,
    111,
    112,
    121,
    114,
    105,
    103,
    104,
    116,
    32,
    49,
    57,
    57,
    49,
    45,
    49,
    57,
    57,
    52,
    44,
    32,
    49,
    57,
    57,
    55,
    44,
    32,
    49,
    57,
    57,
    56,
    44,
    32,
    50,
    48,
    48,
    48,
    44,
    32,
    50,
    48,
    48,
    52,
    44,
    32,
    50,
    48,
    48,
    54,
    32,
    70,
    114,
    101,
    101,
    32,
    83,
    111,
    102,
    116,
    119,
    97,
    114,
    101,
    32,
    70,
    111,
    117,
    110,
    100,
    97,
    116,
    105,
    111,
    110,
    44,
    32,
    73,
    110,
    99,
    46,
    0,
    10,
    37,
    115,
    0,
    10,
    32,
    32,
    32,
    32,
    84,
    104,
    105,
    115,
    32,
    112,
    114,
    111,
    103,
    114,
    97,
    109,
    32,
    105,
    115,
    32,
    102,
    114,
    101,
    101,
    32,
    115,
    111,
    102,
    116,
    119,
    97,
    114,
    101,
    59,
    32,
    121,
    111,
    117,
    32,
    99,
    97,
    110,
    32,
    114,
    101,
    100,
    105,
    115,
    116,
    114,
    105,
    98,
    117,
    116,
    101,
    32,
    105,
    116,
    32,
    97,
    110,
    100,
    47,
    111,
    114,
    32,
    109,
    111,
    100,
    105,
    102,
    121,
    10,
    32,
    32,
    32,
    32,
    105,
    116,
    32,
    117,
    110,
    100,
    101,
    114,
    32,
    116,
    104,
    101,
    32,
    116,
    101,
    114,
    109,
    115,
    32,
    111,
    102,
    32,
    116,
    104,
    101,
    32,
    71,
    78,
    85,
    32,
    71,
    101,
    110,
    101,
    114,
    97,
    108,
    32,
    80,
    117,
    98,
    108,
    105,
    99,
    32,
    76,
    105,
    99,
    101,
    110,
    115,
    101,
    32,
    97,
    115,
    32,
    112,
    117,
    98,
    108,
    105,
    115,
    104,
    101,
    100,
    32,
    98,
    121,
    10,
    32,
    32,
    32,
    32,
    116,
    104,
    101,
    32,
    70,
    114,
    101,
    101,
    32,
    83,
    111,
    102,
    116,
    119,
    97,
    114,
    101,
    32,
    70,
    111,
    117,
    110,
    100,
    97,
    116,
    105,
    111,
    110,
    59,
    32,
    101,
    105,
    116,
    104,
    101,
    114,
    32,
    118,
    101,
    114,
    115,
    105,
    111,
    110,
    32,
    50,
    32,
    111,
    102,
    32,
    116,
    104,
    101,
    32,
    76,
    105,
    99,
    101,
    110,
    115,
    101,
    32,
    44,
    32,
    111,
    114,
    10,
    32,
    32,
    32,
    32,
    40,
    97,
    116,
    32,
    121,
    111,
    117,
    114,
    32,
    111,
    112,
    116,
    105,
    111,
    110,
    41,
    32,
    97,
    110,
    121,
    32,
    108,
    97,
    116,
    101,
    114,
    32,
    118,
    101,
    114,
    115,
    105,
    111,
    110,
    46,
    10,
    10,
    32,
    32,
    32,
    32,
    84,
    104,
    105,
    115,
    32,
    112,
    114,
    111,
    103,
    114,
    97,
    109,
    32,
    105,
    115,
    32,
    100,
    105,
    115,
    116,
    114,
    105,
    98,
    117,
    116,
    101,
    100,
    32,
    105,
    110,
    32,
    116,
    104,
    101,
    32,
    104,
    111,
    112,
    101,
    32,
    116,
    104,
    97,
    116,
    32,
    105,
    116,
    32,
    119,
    105,
    108,
    108,
    32,
    98,
    101,
    32,
    117,
    115,
    101,
    102,
    117,
    108,
    44,
    10,
    32,
    32,
    32,
    32,
    98,
    117,
    116,
    32,
    87,
    73,
    84,
    72,
    79,
    85,
    84,
    32,
    65,
    78,
    89,
    32,
    87,
    65,
    82,
    82,
    65,
    78,
    84,
    89,
    59,
    32,
    119,
    105,
    116,
    104,
    111,
    117,
    116,
    32,
    101,
    118,
    101,
    110,
    32,
    116,
    104,
    101,
    32,
    105,
    109,
    112,
    108,
    105,
    101,
    100,
    32,
    119,
    97,
    114,
    114,
    97,
    110,
    116,
    121,
    32,
    111,
    102,
    10,
    32,
    32,
    32,
    32,
    77,
    69,
    82,
    67,
    72,
    65,
    78,
    84,
    65,
    66,
    73,
    76,
    73,
    84,
    89,
    32,
    111,
    114,
    32,
    70,
    73,
    84,
    78,
    69,
    83,
    83,
    32,
    70,
    79,
    82,
    32,
    65,
    32,
    80,
    65,
    82,
    84,
    73,
    67,
    85,
    76,
    65,
    82,
    32,
    80,
    85,
    82,
    80,
    79,
    83,
    69,
    46,
    32,
    32,
    83,
    101,
    101,
    32,
    116,
    104,
    101,
    10,
    32,
    32,
    32,
    32,
    71,
    78,
    85,
    32,
    71,
    101,
    110,
    101,
    114,
    97,
    108,
    32,
    80,
    117,
    98,
    108,
    105,
    99,
    32,
    76,
    105,
    99,
    101,
    110,
    115,
    101,
    32,
    102,
    111,
    114,
    32,
    109,
    111,
    114,
    101,
    32,
    100,
    101,
    116,
    97,
    105,
    108,
    115,
    46,
    10,
    10,
    32,
    32,
    32,
    32,
    89,
    111,
    117,
    32,
    115,
    104,
    111,
    117,
    108,
    100,
    32,
    104,
    97,
    118,
    101,
    32,
    114,
    101,
    99,
    101,
    105,
    118,
    101,
    100,
    32,
    97,
    32,
    99,
    111,
    112,
    121,
    32,
    111,
    102,
    32,
    116,
    104,
    101,
    32,
    71,
    78,
    85,
    32,
    71,
    101,
    110,
    101,
    114,
    97,
    108,
    32,
    80,
    117,
    98,
    108,
    105,
    99,
    32,
    76,
    105,
    99,
    101,
    110,
    115,
    101,
    10,
    32,
    32,
    32,
    32,
    97,
    108,
    111,
    110,
    103,
    32,
    119,
    105,
    116,
    104,
    32,
    116,
    104,
    105,
    115,
    32,
    112,
    114,
    111,
    103,
    114,
    97,
    109,
    46,
    32,
    73,
    102,
    32,
    110,
    111,
    116,
    44,
    32,
    119,
    114,
    105,
    116,
    101,
    32,
    116,
    111,
    10,
    10,
    32,
    32,
    32,
    32,
    32,
    32,
    32,
    84,
    104,
    101,
    32,
    70,
    114,
    101,
    101,
    32,
    83,
    111,
    102,
    116,
    119,
    97,
    114,
    101,
    32,
    70,
    111,
    117,
    110,
    100,
    97,
    116,
    105,
    111,
    110,
    44,
    32,
    73,
    110,
    99,
    46,
    10,
    32,
    32,
    32,
    32,
    32,
    32,
    32,
    53,
    49,
    32,
    70,
    114,
    97,
    110,
    107,
    108,
    105,
    110,
    32,
    83,
    116,
    114,
    101,
    101,
    116,
    44,
    32,
    70,
    105,
    102,
    116,
    104,
    32,
    70,
    108,
    111,
    111,
    114,
    10,
    32,
    32,
    32,
    32,
    32,
    32,
    32,
    66,
    111,
    115,
    116,
    111,
    110,
    44,
    32,
    77,
    65,
    32,
    48,
    50,
    49,
    49,
    48,
    45,
    49,
    51,
    48,
    49,
    32,
    32,
    85,
    83,
    65,
    10,
    10,
    0,
    97,
    99,
    99,
    117,
    109,
    45,
    62,
    110,
    95,
    108,
    101,
    110,
    43,
    97,
    99,
    99,
    117,
    109,
    45,
    62,
    110,
    95,
    115,
    99,
    97,
    108,
    101,
    32,
    62,
    61,
    32,
    115,
    104,
    105,
    102,
    116,
    43,
    99,
    111,
    117,
    110,
    116,
    0,
    110,
    117,
    109,
    98,
    101,
    114,
    46,
    99,
    0,
    95,
    98,
    99,
    95,
    115,
    104,
    105,
    102,
    116,
    95,
    97,
    100,
    100,
    115,
    117,
    98,
    0,
    110,
    111,
    110,
    45,
    122,
    101,
    114,
    111,
    32,
    115,
    99,
    97,
    108,
    101,
    32,
    105,
    110,
    32,
    101,
    120,
    112,
    111,
    110,
    101,
    110,
    116,
    0,
    101,
    120,
    112,
    111,
    110,
    101,
    110,
    116,
    32,
    116,
    111,
    111,
    32,
    108,
    97,
    114,
    103,
    101,
    32,
    105,
    110,
    32,
    114,
    97,
    105,
    115,
    101,
    0,
    37,
    108,
    100,
    0,
    48,
    49,
    50,
    51,
    52,
    53,
    54,
    55,
    56,
    57,
    65,
    66,
    67,
    68,
    69,
    70,
    0,
    17,
    0,
    10,
    0,
    17,
    17,
    17,
    0,
    0,
    0,
    0,
    5,
    0,
    0,
    0,
    0,
    0,
    0,
    9,
    0,
    0,
    0,
    0,
    11,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    17,
    0,
    15,
    10,
    17,
    17,
    17,
    3,
    10,
    7,
    0,
    1,
    19,
    9,
    11,
    11,
    0,
    0,
    9,
    6,
    11,
    0,
    0,
    11,
    0,
    6,
    17,
    0,
    0,
    0,
    17,
    17,
    17,
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
    11,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    17,
    0,
    10,
    10,
    17,
    17,
    17,
    0,
    10,
    0,
    0,
    2,
    0,
    9,
    11,
    0,
    0,
    0,
    9,
    0,
    11,
    0,
    0,
    11,
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
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    12,
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
    12,
    0,
    0,
    0,
    0,
    12,
    0,
    0,
    0,
    0,
    9,
    12,
    0,
    0,
    0,
    0,
    0,
    12,
    0,
    0,
    12,
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
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    14,
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
    13,
    0,
    0,
    0,
    4,
    13,
    0,
    0,
    0,
    0,
    9,
    14,
    0,
    0,
    0,
    0,
    0,
    14,
    0,
    0,
    14,
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
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    16,
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
    15,
    0,
    0,
    0,
    0,
    15,
    0,
    0,
    0,
    0,
    9,
    16,
    0,
    0,
    0,
    0,
    0,
    16,
    0,
    0,
    16,
    0,
    0,
    18,
    0,
    0,
    0,
    18,
    18,
    18,
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
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    18,
    0,
    0,
    0,
    18,
    18,
    18,
    0,
    0,
    0,
    0,
    0,
    0,
    9,
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
    0,
    0,
    0,
    11,
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
    10,
    0,
    0,
    0,
    0,
    10,
    0,
    0,
    0,
    0,
    9,
    11,
    0,
    0,
    0,
    0,
    0,
    11,
    0,
    0,
    11,
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
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    12,
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
    12,
    0,
    0,
    0,
    0,
    12,
    0,
    0,
    0,
    0,
    9,
    12,
    0,
    0,
    0,
    0,
    0,
    12,
    0,
    0,
    12,
    0,
    0,
    48,
    49,
    50,
    51,
    52,
    53,
    54,
    55,
    56,
    57,
    65,
    66,
    67,
    68,
    69,
    70,
    45,
    43,
    32,
    32,
    32,
    48,
    88,
    48,
    120,
    0,
    84,
    33,
    34,
    25,
    13,
    1,
    2,
    3,
    17,
    75,
    28,
    12,
    16,
    4,
    11,
    29,
    18,
    30,
    39,
    104,
    110,
    111,
    112,
    113,
    98,
    32,
    5,
    6,
    15,
    19,
    20,
    21,
    26,
    8,
    22,
    7,
    40,
    36,
    23,
    24,
    9,
    10,
    14,
    27,
    31,
    37,
    35,
    131,
    130,
    125,
    38,
    42,
    43,
    60,
    61,
    62,
    63,
    67,
    71,
    74,
    77,
    88,
    89,
    90,
    91,
    92,
    93,
    94,
    95,
    96,
    97,
    99,
    100,
    101,
    102,
    103,
    105,
    106,
    107,
    108,
    114,
    115,
    116,
    121,
    122,
    123,
    124,
    0,
    73,
    108,
    108,
    101,
    103,
    97,
    108,
    32,
    98,
    121,
    116,
    101,
    32,
    115,
    101,
    113,
    117,
    101,
    110,
    99,
    101,
    0,
    68,
    111,
    109,
    97,
    105,
    110,
    32,
    101,
    114,
    114,
    111,
    114,
    0,
    82,
    101,
    115,
    117,
    108,
    116,
    32,
    110,
    111,
    116,
    32,
    114,
    101,
    112,
    114,
    101,
    115,
    101,
    110,
    116,
    97,
    98,
    108,
    101,
    0,
    78,
    111,
    116,
    32,
    97,
    32,
    116,
    116,
    121,
    0,
    80,
    101,
    114,
    109,
    105,
    115,
    115,
    105,
    111,
    110,
    32,
    100,
    101,
    110,
    105,
    101,
    100,
    0,
    79,
    112,
    101,
    114,
    97,
    116,
    105,
    111,
    110,
    32,
    110,
    111,
    116,
    32,
    112,
    101,
    114,
    109,
    105,
    116,
    116,
    101,
    100,
    0,
    78,
    111,
    32,
    115,
    117,
    99,
    104,
    32,
    102,
    105,
    108,
    101,
    32,
    111,
    114,
    32,
    100,
    105,
    114,
    101,
    99,
    116,
    111,
    114,
    121,
    0,
    78,
    111,
    32,
    115,
    117,
    99,
    104,
    32,
    112,
    114,
    111,
    99,
    101,
    115,
    115,
    0,
    70,
    105,
    108,
    101,
    32,
    101,
    120,
    105,
    115,
    116,
    115,
    0,
    86,
    97,
    108,
    117,
    101,
    32,
    116,
    111,
    111,
    32,
    108,
    97,
    114,
    103,
    101,
    32,
    102,
    111,
    114,
    32,
    100,
    97,
    116,
    97,
    32,
    116,
    121,
    112,
    101,
    0,
    78,
    111,
    32,
    115,
    112,
    97,
    99,
    101,
    32,
    108,
    101,
    102,
    116,
    32,
    111,
    110,
    32,
    100,
    101,
    118,
    105,
    99,
    101,
    0,
    79,
    117,
    116,
    32,
    111,
    102,
    32,
    109,
    101,
    109,
    111,
    114,
    121,
    0,
    82,
    101,
    115,
    111,
    117,
    114,
    99,
    101,
    32,
    98,
    117,
    115,
    121,
    0,
    73,
    110,
    116,
    101,
    114,
    114,
    117,
    112,
    116,
    101,
    100,
    32,
    115,
    121,
    115,
    116,
    101,
    109,
    32,
    99,
    97,
    108,
    108,
    0,
    82,
    101,
    115,
    111,
    117,
    114,
    99,
    101,
    32,
    116,
    101,
    109,
    112,
    111,
    114,
    97,
    114,
    105,
    108,
    121,
    32,
    117,
    110,
    97,
    118,
    97,
    105,
    108,
    97,
    98,
    108,
    101,
    0,
    73,
    110,
    118,
    97,
    108,
    105,
    100,
    32,
    115,
    101,
    101,
    107,
    0,
    67,
    114,
    111,
    115,
    115,
    45,
    100,
    101,
    118,
    105,
    99,
    101,
    32,
    108,
    105,
    110,
    107,
    0,
    82,
    101,
    97,
    100,
    45,
    111,
    110,
    108,
    121,
    32,
    102,
    105,
    108,
    101,
    32,
    115,
    121,
    115,
    116,
    101,
    109,
    0,
    68,
    105,
    114,
    101,
    99,
    116,
    111,
    114,
    121,
    32,
    110,
    111,
    116,
    32,
    101,
    109,
    112,
    116,
    121,
    0,
    67,
    111,
    110,
    110,
    101,
    99,
    116,
    105,
    111,
    110,
    32,
    114,
    101,
    115,
    101,
    116,
    32,
    98,
    121,
    32,
    112,
    101,
    101,
    114,
    0,
    79,
    112,
    101,
    114,
    97,
    116,
    105,
    111,
    110,
    32,
    116,
    105,
    109,
    101,
    100,
    32,
    111,
    117,
    116,
    0,
    67,
    111,
    110,
    110,
    101,
    99,
    116,
    105,
    111,
    110,
    32,
    114,
    101,
    102,
    117,
    115,
    101,
    100,
    0,
    72,
    111,
    115,
    116,
    32,
    105,
    115,
    32,
    100,
    111,
    119,
    110,
    0,
    72,
    111,
    115,
    116,
    32,
    105,
    115,
    32,
    117,
    110,
    114,
    101,
    97,
    99,
    104,
    97,
    98,
    108,
    101,
    0,
    65,
    100,
    100,
    114,
    101,
    115,
    115,
    32,
    105,
    110,
    32,
    117,
    115,
    101,
    0,
    66,
    114,
    111,
    107,
    101,
    110,
    32,
    112,
    105,
    112,
    101,
    0,
    73,
    47,
    79,
    32,
    101,
    114,
    114,
    111,
    114,
    0,
    78,
    111,
    32,
    115,
    117,
    99,
    104,
    32,
    100,
    101,
    118,
    105,
    99,
    101,
    32,
    111,
    114,
    32,
    97,
    100,
    100,
    114,
    101,
    115,
    115,
    0,
    66,
    108,
    111,
    99,
    107,
    32,
    100,
    101,
    118,
    105,
    99,
    101,
    32,
    114,
    101,
    113,
    117,
    105,
    114,
    101,
    100,
    0,
    78,
    111,
    32,
    115,
    117,
    99,
    104,
    32,
    100,
    101,
    118,
    105,
    99,
    101,
    0,
    78,
    111,
    116,
    32,
    97,
    32,
    100,
    105,
    114,
    101,
    99,
    116,
    111,
    114,
    121,
    0,
    73,
    115,
    32,
    97,
    32,
    100,
    105,
    114,
    101,
    99,
    116,
    111,
    114,
    121,
    0,
    84,
    101,
    120,
    116,
    32,
    102,
    105,
    108,
    101,
    32,
    98,
    117,
    115,
    121,
    0,
    69,
    120,
    101,
    99,
    32,
    102,
    111,
    114,
    109,
    97,
    116,
    32,
    101,
    114,
    114,
    111,
    114,
    0,
    73,
    110,
    118,
    97,
    108,
    105,
    100,
    32,
    97,
    114,
    103,
    117,
    109,
    101,
    110,
    116,
    0,
    65,
    114,
    103,
    117,
    109,
    101,
    110,
    116,
    32,
    108,
    105,
    115,
    116,
    32,
    116,
    111,
    111,
    32,
    108,
    111,
    110,
    103,
    0,
    83,
    121,
    109,
    98,
    111,
    108,
    105,
    99,
    32,
    108,
    105,
    110,
    107,
    32,
    108,
    111,
    111,
    112,
    0,
    70,
    105,
    108,
    101,
    110,
    97,
    109,
    101,
    32,
    116,
    111,
    111,
    32,
    108,
    111,
    110,
    103,
    0,
    84,
    111,
    111,
    32,
    109,
    97,
    110,
    121,
    32,
    111,
    112,
    101,
    110,
    32,
    102,
    105,
    108,
    101,
    115,
    32,
    105,
    110,
    32,
    115,
    121,
    115,
    116,
    101,
    109,
    0,
    78,
    111,
    32,
    102,
    105,
    108,
    101,
    32,
    100,
    101,
    115,
    99,
    114,
    105,
    112,
    116,
    111,
    114,
    115,
    32,
    97,
    118,
    97,
    105,
    108,
    97,
    98,
    108,
    101,
    0,
    66,
    97,
    100,
    32,
    102,
    105,
    108,
    101,
    32,
    100,
    101,
    115,
    99,
    114,
    105,
    112,
    116,
    111,
    114,
    0,
    78,
    111,
    32,
    99,
    104,
    105,
    108,
    100,
    32,
    112,
    114,
    111,
    99,
    101,
    115,
    115,
    0,
    66,
    97,
    100,
    32,
    97,
    100,
    100,
    114,
    101,
    115,
    115,
    0,
    70,
    105,
    108,
    101,
    32,
    116,
    111,
    111,
    32,
    108,
    97,
    114,
    103,
    101,
    0,
    84,
    111,
    111,
    32,
    109,
    97,
    110,
    121,
    32,
    108,
    105,
    110,
    107,
    115,
    0,
    78,
    111,
    32,
    108,
    111,
    99,
    107,
    115,
    32,
    97,
    118,
    97,
    105,
    108,
    97,
    98,
    108,
    101,
    0,
    82,
    101,
    115,
    111,
    117,
    114,
    99,
    101,
    32,
    100,
    101,
    97,
    100,
    108,
    111,
    99,
    107,
    32,
    119,
    111,
    117,
    108,
    100,
    32,
    111,
    99,
    99,
    117,
    114,
    0,
    83,
    116,
    97,
    116,
    101,
    32,
    110,
    111,
    116,
    32,
    114,
    101,
    99,
    111,
    118,
    101,
    114,
    97,
    98,
    108,
    101,
    0,
    80,
    114,
    101,
    118,
    105,
    111,
    117,
    115,
    32,
    111,
    119,
    110,
    101,
    114,
    32,
    100,
    105,
    101,
    100,
    0,
    79,
    112,
    101,
    114,
    97,
    116,
    105,
    111,
    110,
    32,
    99,
    97,
    110,
    99,
    101,
    108,
    101,
    100,
    0,
    70,
    117,
    110,
    99,
    116,
    105,
    111,
    110,
    32,
    110,
    111,
    116,
    32,
    105,
    109,
    112,
    108,
    101,
    109,
    101,
    110,
    116,
    101,
    100,
    0,
    78,
    111,
    32,
    109,
    101,
    115,
    115,
    97,
    103,
    101,
    32,
    111,
    102,
    32,
    100,
    101,
    115,
    105,
    114,
    101,
    100,
    32,
    116,
    121,
    112,
    101,
    0,
    73,
    100,
    101,
    110,
    116,
    105,
    102,
    105,
    101,
    114,
    32,
    114,
    101,
    109,
    111,
    118,
    101,
    100,
    0,
    68,
    101,
    118,
    105,
    99,
    101,
    32,
    110,
    111,
    116,
    32,
    97,
    32,
    115,
    116,
    114,
    101,
    97,
    109,
    0,
    78,
    111,
    32,
    100,
    97,
    116,
    97,
    32,
    97,
    118,
    97,
    105,
    108,
    97,
    98,
    108,
    101,
    0,
    68,
    101,
    118,
    105,
    99,
    101,
    32,
    116,
    105,
    109,
    101,
    111,
    117,
    116,
    0,
    79,
    117,
    116,
    32,
    111,
    102
], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE + 10240);
allocate([
    32,
    115,
    116,
    114,
    101,
    97,
    109,
    115,
    32,
    114,
    101,
    115,
    111,
    117,
    114,
    99,
    101,
    115,
    0,
    76,
    105,
    110,
    107,
    32,
    104,
    97,
    115,
    32,
    98,
    101,
    101,
    110,
    32,
    115,
    101,
    118,
    101,
    114,
    101,
    100,
    0,
    80,
    114,
    111,
    116,
    111,
    99,
    111,
    108,
    32,
    101,
    114,
    114,
    111,
    114,
    0,
    66,
    97,
    100,
    32,
    109,
    101,
    115,
    115,
    97,
    103,
    101,
    0,
    70,
    105,
    108,
    101,
    32,
    100,
    101,
    115,
    99,
    114,
    105,
    112,
    116,
    111,
    114,
    32,
    105,
    110,
    32,
    98,
    97,
    100,
    32,
    115,
    116,
    97,
    116,
    101,
    0,
    78,
    111,
    116,
    32,
    97,
    32,
    115,
    111,
    99,
    107,
    101,
    116,
    0,
    68,
    101,
    115,
    116,
    105,
    110,
    97,
    116,
    105,
    111,
    110,
    32,
    97,
    100,
    100,
    114,
    101,
    115,
    115,
    32,
    114,
    101,
    113,
    117,
    105,
    114,
    101,
    100,
    0,
    77,
    101,
    115,
    115,
    97,
    103,
    101,
    32,
    116,
    111,
    111,
    32,
    108,
    97,
    114,
    103,
    101,
    0,
    80,
    114,
    111,
    116,
    111,
    99,
    111,
    108,
    32,
    119,
    114,
    111,
    110,
    103,
    32,
    116,
    121,
    112,
    101,
    32,
    102,
    111,
    114,
    32,
    115,
    111,
    99,
    107,
    101,
    116,
    0,
    80,
    114,
    111,
    116,
    111,
    99,
    111,
    108,
    32,
    110,
    111,
    116,
    32,
    97,
    118,
    97,
    105,
    108,
    97,
    98,
    108,
    101,
    0,
    80,
    114,
    111,
    116,
    111,
    99,
    111,
    108,
    32,
    110,
    111,
    116,
    32,
    115,
    117,
    112,
    112,
    111,
    114,
    116,
    101,
    100,
    0,
    83,
    111,
    99,
    107,
    101,
    116,
    32,
    116,
    121,
    112,
    101,
    32,
    110,
    111,
    116,
    32,
    115,
    117,
    112,
    112,
    111,
    114,
    116,
    101,
    100,
    0,
    78,
    111,
    116,
    32,
    115,
    117,
    112,
    112,
    111,
    114,
    116,
    101,
    100,
    0,
    80,
    114,
    111,
    116,
    111,
    99,
    111,
    108,
    32,
    102,
    97,
    109,
    105,
    108,
    121,
    32,
    110,
    111,
    116,
    32,
    115,
    117,
    112,
    112,
    111,
    114,
    116,
    101,
    100,
    0,
    65,
    100,
    100,
    114,
    101,
    115,
    115,
    32,
    102,
    97,
    109,
    105,
    108,
    121,
    32,
    110,
    111,
    116,
    32,
    115,
    117,
    112,
    112,
    111,
    114,
    116,
    101,
    100,
    32,
    98,
    121,
    32,
    112,
    114,
    111,
    116,
    111,
    99,
    111,
    108,
    0,
    65,
    100,
    100,
    114,
    101,
    115,
    115,
    32,
    110,
    111,
    116,
    32,
    97,
    118,
    97,
    105,
    108,
    97,
    98,
    108,
    101,
    0,
    78,
    101,
    116,
    119,
    111,
    114,
    107,
    32,
    105,
    115,
    32,
    100,
    111,
    119,
    110,
    0,
    78,
    101,
    116,
    119,
    111,
    114,
    107,
    32,
    117,
    110,
    114,
    101,
    97,
    99,
    104,
    97,
    98,
    108,
    101,
    0,
    67,
    111,
    110,
    110,
    101,
    99,
    116,
    105,
    111,
    110,
    32,
    114,
    101,
    115,
    101,
    116,
    32,
    98,
    121,
    32,
    110,
    101,
    116,
    119,
    111,
    114,
    107,
    0,
    67,
    111,
    110,
    110,
    101,
    99,
    116,
    105,
    111,
    110,
    32,
    97,
    98,
    111,
    114,
    116,
    101,
    100,
    0,
    78,
    111,
    32,
    98,
    117,
    102,
    102,
    101,
    114,
    32,
    115,
    112,
    97,
    99,
    101,
    32,
    97,
    118,
    97,
    105,
    108,
    97,
    98,
    108,
    101,
    0,
    83,
    111,
    99,
    107,
    101,
    116,
    32,
    105,
    115,
    32,
    99,
    111,
    110,
    110,
    101,
    99,
    116,
    101,
    100,
    0,
    83,
    111,
    99,
    107,
    101,
    116,
    32,
    110,
    111,
    116,
    32,
    99,
    111,
    110,
    110,
    101,
    99,
    116,
    101,
    100,
    0,
    67,
    97,
    110,
    110,
    111,
    116,
    32,
    115,
    101,
    110,
    100,
    32,
    97,
    102,
    116,
    101,
    114,
    32,
    115,
    111,
    99,
    107,
    101,
    116,
    32,
    115,
    104,
    117,
    116,
    100,
    111,
    119,
    110,
    0,
    79,
    112,
    101,
    114,
    97,
    116,
    105,
    111,
    110,
    32,
    97,
    108,
    114,
    101,
    97,
    100,
    121,
    32,
    105,
    110,
    32,
    112,
    114,
    111,
    103,
    114,
    101,
    115,
    115,
    0,
    79,
    112,
    101,
    114,
    97,
    116,
    105,
    111,
    110,
    32,
    105,
    110,
    32,
    112,
    114,
    111,
    103,
    114,
    101,
    115,
    115,
    0,
    83,
    116,
    97,
    108,
    101,
    32,
    102,
    105,
    108,
    101,
    32,
    104,
    97,
    110,
    100,
    108,
    101,
    0,
    82,
    101,
    109,
    111,
    116,
    101,
    32,
    73,
    47,
    79,
    32,
    101,
    114,
    114,
    111,
    114,
    0,
    81,
    117,
    111,
    116,
    97,
    32,
    101,
    120,
    99,
    101,
    101,
    100,
    101,
    100,
    0,
    78,
    111,
    32,
    109,
    101,
    100,
    105,
    117,
    109,
    32,
    102,
    111,
    117,
    110,
    100,
    0,
    87,
    114,
    111,
    110,
    103,
    32,
    109,
    101,
    100,
    105,
    117,
    109,
    32,
    116,
    121,
    112,
    101,
    0,
    78,
    111,
    32,
    101,
    114,
    114,
    111,
    114,
    32,
    105,
    110,
    102,
    111,
    114,
    109,
    97,
    116,
    105,
    111,
    110,
    0,
    0,
    40,
    110,
    117,
    108,
    108,
    41,
    0,
    45,
    48,
    88,
    43,
    48,
    88,
    32,
    48,
    88,
    45,
    48,
    120,
    43,
    48,
    120,
    32,
    48,
    120,
    0,
    105,
    110,
    102,
    0,
    73,
    78,
    70,
    0,
    110,
    97,
    110,
    0,
    78,
    65,
    78,
    0,
    46,
    0,
    58,
    32,
    105,
    108,
    108,
    101,
    103,
    97,
    108,
    32,
    111,
    112,
    116,
    105,
    111,
    110,
    58,
    32,
    0,
    10,
    0,
    58,
    32,
    111,
    112,
    116,
    105,
    111,
    110,
    32,
    114,
    101,
    113,
    117,
    105,
    114,
    101,
    115,
    32,
    97,
    110,
    32,
    97,
    114,
    103,
    117,
    109,
    101,
    110,
    116,
    58,
    32,
    0,
    114,
    119,
    97,
    0
], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE + 20480);
var tempDoublePtr = STATICTOP;
STATICTOP += 16;
function ___setErrNo(value) {
    if (Module["___errno_location"])
        HEAP32[Module["___errno_location"]() >> 2] = value;
    return value;
}
var ERRNO_CODES = {
    EPERM: 1,
    ENOENT: 2,
    ESRCH: 3,
    EINTR: 4,
    EIO: 5,
    ENXIO: 6,
    E2BIG: 7,
    ENOEXEC: 8,
    EBADF: 9,
    ECHILD: 10,
    EAGAIN: 11,
    EWOULDBLOCK: 11,
    ENOMEM: 12,
    EACCES: 13,
    EFAULT: 14,
    ENOTBLK: 15,
    EBUSY: 16,
    EEXIST: 17,
    EXDEV: 18,
    ENODEV: 19,
    ENOTDIR: 20,
    EISDIR: 21,
    EINVAL: 22,
    ENFILE: 23,
    EMFILE: 24,
    ENOTTY: 25,
    ETXTBSY: 26,
    EFBIG: 27,
    ENOSPC: 28,
    ESPIPE: 29,
    EROFS: 30,
    EMLINK: 31,
    EPIPE: 32,
    EDOM: 33,
    ERANGE: 34,
    ENOMSG: 42,
    EIDRM: 43,
    ECHRNG: 44,
    EL2NSYNC: 45,
    EL3HLT: 46,
    EL3RST: 47,
    ELNRNG: 48,
    EUNATCH: 49,
    ENOCSI: 50,
    EL2HLT: 51,
    EDEADLK: 35,
    ENOLCK: 37,
    EBADE: 52,
    EBADR: 53,
    EXFULL: 54,
    ENOANO: 55,
    EBADRQC: 56,
    EBADSLT: 57,
    EDEADLOCK: 35,
    EBFONT: 59,
    ENOSTR: 60,
    ENODATA: 61,
    ETIME: 62,
    ENOSR: 63,
    ENONET: 64,
    ENOPKG: 65,
    EREMOTE: 66,
    ENOLINK: 67,
    EADV: 68,
    ESRMNT: 69,
    ECOMM: 70,
    EPROTO: 71,
    EMULTIHOP: 72,
    EDOTDOT: 73,
    EBADMSG: 74,
    ENOTUNIQ: 76,
    EBADFD: 77,
    EREMCHG: 78,
    ELIBACC: 79,
    ELIBBAD: 80,
    ELIBSCN: 81,
    ELIBMAX: 82,
    ELIBEXEC: 83,
    ENOSYS: 38,
    ENOTEMPTY: 39,
    ENAMETOOLONG: 36,
    ELOOP: 40,
    EOPNOTSUPP: 95,
    EPFNOSUPPORT: 96,
    ECONNRESET: 104,
    ENOBUFS: 105,
    EAFNOSUPPORT: 97,
    EPROTOTYPE: 91,
    ENOTSOCK: 88,
    ENOPROTOOPT: 92,
    ESHUTDOWN: 108,
    ECONNREFUSED: 111,
    EADDRINUSE: 98,
    ECONNABORTED: 103,
    ENETUNREACH: 101,
    ENETDOWN: 100,
    ETIMEDOUT: 110,
    EHOSTDOWN: 112,
    EHOSTUNREACH: 113,
    EINPROGRESS: 115,
    EALREADY: 114,
    EDESTADDRREQ: 89,
    EMSGSIZE: 90,
    EPROTONOSUPPORT: 93,
    ESOCKTNOSUPPORT: 94,
    EADDRNOTAVAIL: 99,
    ENETRESET: 102,
    EISCONN: 106,
    ENOTCONN: 107,
    ETOOMANYREFS: 109,
    EUSERS: 87,
    EDQUOT: 122,
    ESTALE: 116,
    ENOTSUP: 95,
    ENOMEDIUM: 123,
    EILSEQ: 84,
    EOVERFLOW: 75,
    ECANCELED: 125,
    ENOTRECOVERABLE: 131,
    EOWNERDEAD: 130,
    ESTRPIPE: 86
};
function _sysconf(name) {
    switch (name) {
    case 30:
        return PAGE_SIZE;
    case 85:
        return totalMemory / PAGE_SIZE;
    case 132:
    case 133:
    case 12:
    case 137:
    case 138:
    case 15:
    case 235:
    case 16:
    case 17:
    case 18:
    case 19:
    case 20:
    case 149:
    case 13:
    case 10:
    case 236:
    case 153:
    case 9:
    case 21:
    case 22:
    case 159:
    case 154:
    case 14:
    case 77:
    case 78:
    case 139:
    case 80:
    case 81:
    case 82:
    case 68:
    case 67:
    case 164:
    case 11:
    case 29:
    case 47:
    case 48:
    case 95:
    case 52:
    case 51:
    case 46:
        return 200809;
    case 79:
        return 0;
    case 27:
    case 246:
    case 127:
    case 128:
    case 23:
    case 24:
    case 160:
    case 161:
    case 181:
    case 182:
    case 242:
    case 183:
    case 184:
    case 243:
    case 244:
    case 245:
    case 165:
    case 178:
    case 179:
    case 49:
    case 50:
    case 168:
    case 169:
    case 175:
    case 170:
    case 171:
    case 172:
    case 97:
    case 76:
    case 32:
    case 173:
    case 35:
        return -1;
    case 176:
    case 177:
    case 7:
    case 155:
    case 8:
    case 157:
    case 125:
    case 126:
    case 92:
    case 93:
    case 129:
    case 130:
    case 131:
    case 94:
    case 91:
        return 1;
    case 74:
    case 60:
    case 69:
    case 70:
    case 4:
        return 1024;
    case 31:
    case 42:
    case 72:
        return 32;
    case 87:
    case 26:
    case 33:
        return 2147483647;
    case 34:
    case 1:
        return 47839;
    case 38:
    case 36:
        return 99;
    case 43:
    case 37:
        return 2048;
    case 0:
        return 2097152;
    case 3:
        return 65536;
    case 28:
        return 32768;
    case 44:
        return 32767;
    case 75:
        return 16384;
    case 39:
        return 1e3;
    case 89:
        return 700;
    case 71:
        return 256;
    case 40:
        return 255;
    case 2:
        return 100;
    case 180:
        return 64;
    case 25:
        return 20;
    case 5:
        return 16;
    case 6:
        return 6;
    case 73:
        return 4;
    case 84: {
            if (typeof navigator === "object")
                return navigator["hardwareConcurrency"] || 1;
            return 1;
        }
    }
    ___setErrNo(ERRNO_CODES.EINVAL);
    return -1;
}
Module["_i64Subtract"] = _i64Subtract;
function ___assert_fail(condition, filename, line, func) {
    ABORT = true;
    throw "Assertion failed: " + Pointer_stringify(condition) + ", at: " + [
        filename ? Pointer_stringify(filename) : "unknown filename",
        line,
        func ? Pointer_stringify(func) : "unknown function"
    ] + " at " + stackTrace();
}
Module["_memset"] = _memset;
function _pthread_cleanup_push(routine, arg) {
    __ATEXIT__.push(function () {
        Runtime.dynCall("vi", routine, [arg]);
    });
    _pthread_cleanup_push.level = __ATEXIT__.length;
}
Module["_bitshift64Lshr"] = _bitshift64Lshr;
var _environ = STATICTOP;
STATICTOP += 16;
function ___buildEnvironment(env) {
    var MAX_ENV_VALUES = 64;
    var TOTAL_ENV_SIZE = 1024;
    var poolPtr;
    var envPtr;
    if (!___buildEnvironment.called) {
        ___buildEnvironment.called = true;
        ENV["USER"] = ENV["LOGNAME"] = "web_user";
        ENV["PATH"] = "/";
        ENV["PWD"] = "/";
        ENV["HOME"] = "/home/web_user";
        ENV["LANG"] = "C";
        ENV["_"] = Module["thisProgram"];
        poolPtr = allocate(TOTAL_ENV_SIZE, "i8", ALLOC_STATIC);
        envPtr = allocate(MAX_ENV_VALUES * 4, "i8*", ALLOC_STATIC);
        HEAP32[envPtr >> 2] = poolPtr;
        HEAP32[_environ >> 2] = envPtr;
    } else {
        envPtr = HEAP32[_environ >> 2];
        poolPtr = HEAP32[envPtr >> 2];
    }
    var strings = [];
    var totalSize = 0;
    for (var key in env) {
        if (typeof env[key] === "string") {
            var line = key + "=" + env[key];
            strings.push(line);
            totalSize += line.length;
        }
    }
    if (totalSize > TOTAL_ENV_SIZE) {
        throw new Error("Environment size exceeded TOTAL_ENV_SIZE!");
    }
    var ptrSize = 4;
    for (var i = 0; i < strings.length; i++) {
        var line = strings[i];
        writeAsciiToMemory(line, poolPtr);
        HEAP32[envPtr + i * ptrSize >> 2] = poolPtr;
        poolPtr += line.length + 1;
    }
    HEAP32[envPtr + strings.length * ptrSize >> 2] = 0;
}
var ENV = {};
function _getenv(name) {
    if (name === 0)
        return 0;
    name = Pointer_stringify(name);
    if (!ENV.hasOwnProperty(name))
        return 0;
    if (_getenv.ret)
        _free(_getenv.ret);
    _getenv.ret = allocate(intArrayFromString(ENV[name]), "i8", ALLOC_NORMAL);
    return _getenv.ret;
}
Module["_bitshift64Shl"] = _bitshift64Shl;
function _pthread_cleanup_pop() {
    assert(_pthread_cleanup_push.level == __ATEXIT__.length, "cannot pop if something else added meanwhile!");
    __ATEXIT__.pop();
    _pthread_cleanup_push.level = __ATEXIT__.length;
}
function _abort() {
    Module["abort"]();
}
var ERRNO_MESSAGES = {
    0: "Success",
    1: "Not super-user",
    2: "No such file or directory",
    3: "No such process",
    4: "Interrupted system call",
    5: "I/O error",
    6: "No such device or address",
    7: "Arg list too long",
    8: "Exec format error",
    9: "Bad file number",
    10: "No children",
    11: "No more processes",
    12: "Not enough core",
    13: "Permission denied",
    14: "Bad address",
    15: "Block device required",
    16: "Mount device busy",
    17: "File exists",
    18: "Cross-device link",
    19: "No such device",
    20: "Not a directory",
    21: "Is a directory",
    22: "Invalid argument",
    23: "Too many open files in system",
    24: "Too many open files",
    25: "Not a typewriter",
    26: "Text file busy",
    27: "File too large",
    28: "No space left on device",
    29: "Illegal seek",
    30: "Read only file system",
    31: "Too many links",
    32: "Broken pipe",
    33: "Math arg out of domain of func",
    34: "Math result not representable",
    35: "File locking deadlock error",
    36: "File or path name too long",
    37: "No record locks available",
    38: "Function not implemented",
    39: "Directory not empty",
    40: "Too many symbolic links",
    42: "No message of desired type",
    43: "Identifier removed",
    44: "Channel number out of range",
    45: "Level 2 not synchronized",
    46: "Level 3 halted",
    47: "Level 3 reset",
    48: "Link number out of range",
    49: "Protocol driver not attached",
    50: "No CSI structure available",
    51: "Level 2 halted",
    52: "Invalid exchange",
    53: "Invalid request descriptor",
    54: "Exchange full",
    55: "No anode",
    56: "Invalid request code",
    57: "Invalid slot",
    59: "Bad font file fmt",
    60: "Device not a stream",
    61: "No data (for no delay io)",
    62: "Timer expired",
    63: "Out of streams resources",
    64: "Machine is not on the network",
    65: "Package not installed",
    66: "The object is remote",
    67: "The link has been severed",
    68: "Advertise error",
    69: "Srmount error",
    70: "Communication error on send",
    71: "Protocol error",
    72: "Multihop attempted",
    73: "Cross mount point (not really error)",
    74: "Trying to read unreadable message",
    75: "Value too large for defined data type",
    76: "Given log. name not unique",
    77: "f.d. invalid for this operation",
    78: "Remote address changed",
    79: "Can   access a needed shared lib",
    80: "Accessing a corrupted shared lib",
    81: ".lib section in a.out corrupted",
    82: "Attempting to link in too many libs",
    83: "Attempting to exec a shared library",
    84: "Illegal byte sequence",
    86: "Streams pipe error",
    87: "Too many users",
    88: "Socket operation on non-socket",
    89: "Destination address required",
    90: "Message too long",
    91: "Protocol wrong type for socket",
    92: "Protocol not available",
    93: "Unknown protocol",
    94: "Socket type not supported",
    95: "Not supported",
    96: "Protocol family not supported",
    97: "Address family not supported by protocol family",
    98: "Address already in use",
    99: "Address not available",
    100: "Network interface is not configured",
    101: "Network is unreachable",
    102: "Connection reset by network",
    103: "Connection aborted",
    104: "Connection reset by peer",
    105: "No buffer space available",
    106: "Socket is already connected",
    107: "Socket is not connected",
    108: "Can't send after socket shutdown",
    109: "Too many references",
    110: "Connection timed out",
    111: "Connection refused",
    112: "Host is down",
    113: "Host is unreachable",
    114: "Socket already connected",
    115: "Connection already in progress",
    116: "Stale file handle",
    122: "Quota exceeded",
    123: "No medium (in tape drive)",
    125: "Operation canceled",
    130: "Previous owner died",
    131: "State not recoverable"
};
var PATH = {
    splitPath: function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
    },
    normalizeArray: function (parts, allowAboveRoot) {
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
            var last = parts[i];
            if (last === ".") {
                parts.splice(i, 1);
            } else if (last === "..") {
                parts.splice(i, 1);
                up++;
            } else if (up) {
                parts.splice(i, 1);
                up--;
            }
        }
        if (allowAboveRoot) {
            for (; up--; up) {
                parts.unshift("..");
            }
        }
        return parts;
    },
    normalize: function (path) {
        var isAbsolute = path.charAt(0) === "/", trailingSlash = path.substr(-1) === "/";
        path = PATH.normalizeArray(path.split("/").filter(function (p) {
            return !!p;
        }), !isAbsolute).join("/");
        if (!path && !isAbsolute) {
            path = ".";
        }
        if (path && trailingSlash) {
            path += "/";
        }
        return (isAbsolute ? "/" : "") + path;
    },
    dirname: function (path) {
        var result = PATH.splitPath(path), root = result[0], dir = result[1];
        if (!root && !dir) {
            return ".";
        }
        if (dir) {
            dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
    },
    basename: function (path) {
        if (path === "/")
            return "/";
        var lastSlash = path.lastIndexOf("/");
        if (lastSlash === -1)
            return path;
        return path.substr(lastSlash + 1);
    },
    extname: function (path) {
        return PATH.splitPath(path)[3];
    },
    join: function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join("/"));
    },
    join2: function (l, r) {
        return PATH.normalize(l + "/" + r);
    },
    resolve: function () {
        var resolvedPath = "", resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path = i >= 0 ? arguments[i] : FS.cwd();
            if (typeof path !== "string") {
                throw new TypeError("Arguments to path.resolve must be strings");
            } else if (!path) {
                return "";
            }
            resolvedPath = path + "/" + resolvedPath;
            resolvedAbsolute = path.charAt(0) === "/";
        }
        resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(function (p) {
            return !!p;
        }), !resolvedAbsolute).join("/");
        return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
    },
    relative: function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
                if (arr[start] !== "")
                    break;
            }
            var end = arr.length - 1;
            for (; end >= 0; end--) {
                if (arr[end] !== "")
                    break;
            }
            if (start > end)
                return [];
            return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split("/"));
        var toParts = trim(to.split("/"));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
            if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break;
            }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push("..");
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join("/");
    }
};
var TTY = {
    ttys: [],
    init: function () {
    },
    shutdown: function () {
    },
    register: function (dev, ops) {
        TTY.ttys[dev] = {
            input: [],
            output: [],
            ops: ops
        };
        FS.registerDevice(dev, TTY.stream_ops);
    },
    stream_ops: {
        open: function (stream) {
            var tty = TTY.ttys[stream.node.rdev];
            if (!tty) {
                throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
            }
            stream.tty = tty;
            stream.seekable = false;
        },
        close: function (stream) {
            stream.tty.ops.flush(stream.tty);
        },
        flush: function (stream) {
            stream.tty.ops.flush(stream.tty);
        },
        read: function (stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.get_char) {
                throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
            }
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
                var result;
                try {
                    result = stream.tty.ops.get_char(stream.tty);
                } catch (e) {
                    throw new FS.ErrnoError(ERRNO_CODES.EIO);
                }
                if (result === undefined && bytesRead === 0) {
                    throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
                }
                if (result === null || result === undefined)
                    break;
                bytesRead++;
                buffer[offset + i] = result;
            }
            if (bytesRead) {
                stream.node.timestamp = Date.now();
            }
            return bytesRead;
        },
        write: function (stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.put_char) {
                throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
            }
            for (var i = 0; i < length; i++) {
                try {
                    stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
                } catch (e) {
                    throw new FS.ErrnoError(ERRNO_CODES.EIO);
                }
            }
            if (length) {
                stream.node.timestamp = Date.now();
            }
            return i;
        }
    },
    default_tty_ops: {
        get_char: function (tty) {
            if (!tty.input.length) {
                var result = null;
                if (ENVIRONMENT_IS_NODE) {
                    var BUFSIZE = 256;
                    var buf = new Buffer(BUFSIZE);
                    var bytesRead = 0;
                    var fd = process.stdin.fd;
                    var usingDevice = false;
                    try {
                        fd = fs.openSync("/dev/stdin", "r");
                        usingDevice = true;
                    } catch (e) {
                    }
                    bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null);
                    if (usingDevice) {
                        fs.closeSync(fd);
                    }
                    if (bytesRead > 0) {
                        result = buf.slice(0, bytesRead).toString("utf-8");
                    } else {
                        result = null;
                    }
                } else if (typeof window != "undefined" && typeof window.prompt == "function") {
                    result = window.prompt("Input: ");
                    if (result !== null) {
                        result += "\n";
                    }
                } else if (typeof readline == "function") {
                    result = readline();
                    if (result !== null) {
                        result += "\n";
                    }
                }
                if (!result) {
                    return null;
                }
                tty.input = intArrayFromString(result, true);
            }
            return tty.input.shift();
        },
        put_char: function (tty, val) {
            if (val === null || val === 10) {
                Module["print"](UTF8ArrayToString(tty.output, 0));
                tty.output = [];
            } else {
                if (val != 0)
                    tty.output.push(val);
            }
        },
        flush: function (tty) {
            if (tty.output && tty.output.length > 0) {
                Module["print"](UTF8ArrayToString(tty.output, 0));
                tty.output = [];
            }
        }
    },
    default_tty1_ops: {
        put_char: function (tty, val) {
            if (val === null || val === 10) {
                Module["printErr"](UTF8ArrayToString(tty.output, 0));
                tty.output = [];
            } else {
                if (val != 0)
                    tty.output.push(val);
            }
        },
        flush: function (tty) {
            if (tty.output && tty.output.length > 0) {
                Module["printErr"](UTF8ArrayToString(tty.output, 0));
                tty.output = [];
            }
        }
    }
};
var MEMFS = {
    ops_table: null,
    mount: function (mount) {
        return MEMFS.createNode(null, "/", 16384 | 511, 0);
    },
    createNode: function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
            MEMFS.ops_table = {
                dir: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        lookup: MEMFS.node_ops.lookup,
                        mknod: MEMFS.node_ops.mknod,
                        rename: MEMFS.node_ops.rename,
                        unlink: MEMFS.node_ops.unlink,
                        rmdir: MEMFS.node_ops.rmdir,
                        readdir: MEMFS.node_ops.readdir,
                        symlink: MEMFS.node_ops.symlink
                    },
                    stream: { llseek: MEMFS.stream_ops.llseek }
                },
                file: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: {
                        llseek: MEMFS.stream_ops.llseek,
                        read: MEMFS.stream_ops.read,
                        write: MEMFS.stream_ops.write,
                        allocate: MEMFS.stream_ops.allocate,
                        mmap: MEMFS.stream_ops.mmap,
                        msync: MEMFS.stream_ops.msync
                    }
                },
                link: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        readlink: MEMFS.node_ops.readlink
                    },
                    stream: {}
                },
                chrdev: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: FS.chrdev_stream_ops
                }
            };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
            node.node_ops = MEMFS.ops_table.dir.node;
            node.stream_ops = MEMFS.ops_table.dir.stream;
            node.contents = {};
        } else if (FS.isFile(node.mode)) {
            node.node_ops = MEMFS.ops_table.file.node;
            node.stream_ops = MEMFS.ops_table.file.stream;
            node.usedBytes = 0;
            node.contents = null;
        } else if (FS.isLink(node.mode)) {
            node.node_ops = MEMFS.ops_table.link.node;
            node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
            node.node_ops = MEMFS.ops_table.chrdev.node;
            node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        if (parent) {
            parent.contents[name] = node;
        }
        return node;
    },
    getFileDataAsRegularArray: function (node) {
        if (node.contents && node.contents.subarray) {
            var arr = [];
            for (var i = 0; i < node.usedBytes; ++i)
                arr.push(node.contents[i]);
            return arr;
        }
        return node.contents;
    },
    getFileDataAsTypedArray: function (node) {
        if (!node.contents)
            return new Uint8Array();
        if (node.contents.subarray)
            return node.contents.subarray(0, node.usedBytes);
        return new Uint8Array(node.contents);
    },
    expandFileStorage: function (node, newCapacity) {
        if (node.contents && node.contents.subarray && newCapacity > node.contents.length) {
            node.contents = MEMFS.getFileDataAsRegularArray(node);
            node.usedBytes = node.contents.length;
        }
        if (!node.contents || node.contents.subarray) {
            var prevCapacity = node.contents ? node.contents.buffer.byteLength : 0;
            if (prevCapacity >= newCapacity)
                return;
            var CAPACITY_DOUBLING_MAX = 1024 * 1024;
            newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) | 0);
            if (prevCapacity != 0)
                newCapacity = Math.max(newCapacity, 256);
            var oldContents = node.contents;
            node.contents = new Uint8Array(newCapacity);
            if (node.usedBytes > 0)
                node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
            return;
        }
        if (!node.contents && newCapacity > 0)
            node.contents = [];
        while (node.contents.length < newCapacity)
            node.contents.push(0);
    },
    resizeFileStorage: function (node, newSize) {
        if (node.usedBytes == newSize)
            return;
        if (newSize == 0) {
            node.contents = null;
            node.usedBytes = 0;
            return;
        }
        if (!node.contents || node.contents.subarray) {
            var oldContents = node.contents;
            node.contents = new Uint8Array(new ArrayBuffer(newSize));
            if (oldContents) {
                node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
            }
            node.usedBytes = newSize;
            return;
        }
        if (!node.contents)
            node.contents = [];
        if (node.contents.length > newSize)
            node.contents.length = newSize;
        else
            while (node.contents.length < newSize)
                node.contents.push(0);
        node.usedBytes = newSize;
    },
    node_ops: {
        getattr: function (node) {
            var attr = {};
            attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
            attr.ino = node.id;
            attr.mode = node.mode;
            attr.nlink = 1;
            attr.uid = 0;
            attr.gid = 0;
            attr.rdev = node.rdev;
            if (FS.isDir(node.mode)) {
                attr.size = 4096;
            } else if (FS.isFile(node.mode)) {
                attr.size = node.usedBytes;
            } else if (FS.isLink(node.mode)) {
                attr.size = node.link.length;
            } else {
                attr.size = 0;
            }
            attr.atime = new Date(node.timestamp);
            attr.mtime = new Date(node.timestamp);
            attr.ctime = new Date(node.timestamp);
            attr.blksize = 4096;
            attr.blocks = Math.ceil(attr.size / attr.blksize);
            return attr;
        },
        setattr: function (node, attr) {
            if (attr.mode !== undefined) {
                node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp;
            }
            if (attr.size !== undefined) {
                MEMFS.resizeFileStorage(node, attr.size);
            }
        },
        lookup: function (parent, name) {
            throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },
        mknod: function (parent, name, mode, dev) {
            return MEMFS.createNode(parent, name, mode, dev);
        },
        rename: function (old_node, new_dir, new_name) {
            if (FS.isDir(old_node.mode)) {
                var new_node;
                try {
                    new_node = FS.lookupNode(new_dir, new_name);
                } catch (e) {
                }
                if (new_node) {
                    for (var i in new_node.contents) {
                        throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
                    }
                }
            }
            delete old_node.parent.contents[old_node.name];
            old_node.name = new_name;
            new_dir.contents[new_name] = old_node;
            old_node.parent = new_dir;
        },
        unlink: function (parent, name) {
            delete parent.contents[name];
        },
        rmdir: function (parent, name) {
            var node = FS.lookupNode(parent, name);
            for (var i in node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
            }
            delete parent.contents[name];
        },
        readdir: function (node) {
            var entries = [
                ".",
                ".."
            ];
            for (var key in node.contents) {
                if (!node.contents.hasOwnProperty(key)) {
                    continue;
                }
                entries.push(key);
            }
            return entries;
        },
        symlink: function (parent, newname, oldpath) {
            var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
            node.link = oldpath;
            return node;
        },
        readlink: function (node) {
            if (!FS.isLink(node.mode)) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
            }
            return node.link;
        }
    },
    stream_ops: {
        read: function (stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= stream.node.usedBytes)
                return 0;
            var size = Math.min(stream.node.usedBytes - position, length);
            assert(size >= 0);
            if (size > 8 && contents.subarray) {
                buffer.set(contents.subarray(position, position + size), offset);
            } else {
                for (var i = 0; i < size; i++)
                    buffer[offset + i] = contents[position + i];
            }
            return size;
        },
        write: function (stream, buffer, offset, length, position, canOwn) {
            if (!length)
                return 0;
            var node = stream.node;
            node.timestamp = Date.now();
            if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                if (canOwn) {
                    node.contents = buffer.subarray(offset, offset + length);
                    node.usedBytes = length;
                    return length;
                } else if (node.usedBytes === 0 && position === 0) {
                    node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
                    node.usedBytes = length;
                    return length;
                } else if (position + length <= node.usedBytes) {
                    node.contents.set(buffer.subarray(offset, offset + length), position);
                    return length;
                }
            }
            MEMFS.expandFileStorage(node, position + length);
            if (node.contents.subarray && buffer.subarray)
                node.contents.set(buffer.subarray(offset, offset + length), position);
            else {
                for (var i = 0; i < length; i++) {
                    node.contents[position + i] = buffer[offset + i];
                }
            }
            node.usedBytes = Math.max(node.usedBytes, position + length);
            return length;
        },
        llseek: function (stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position;
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.usedBytes;
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
            }
            return position;
        },
        allocate: function (stream, offset, length) {
            MEMFS.expandFileStorage(stream.node, offset + length);
            stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },
        mmap: function (stream, buffer, offset, length, position, prot, flags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
            }
            var ptr;
            var allocated;
            var contents = stream.node.contents;
            if (!(flags & 2) && (contents.buffer === buffer || contents.buffer === buffer.buffer)) {
                allocated = false;
                ptr = contents.byteOffset;
            } else {
                if (position > 0 || position + length < stream.node.usedBytes) {
                    if (contents.subarray) {
                        contents = contents.subarray(position, position + length);
                    } else {
                        contents = Array.prototype.slice.call(contents, position, position + length);
                    }
                }
                allocated = true;
                ptr = _malloc(length);
                if (!ptr) {
                    throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
                }
                buffer.set(contents, ptr);
            }
            return {
                ptr: ptr,
                allocated: allocated
            };
        },
        msync: function (stream, buffer, offset, length, mmapFlags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
            }
            if (mmapFlags & 2) {
                return 0;
            }
            var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
            return 0;
        }
    }
};
var IDBFS = {
    dbs: {},
    indexedDB: function () {
        if (typeof indexedDB !== "undefined")
            return indexedDB;
        var ret = null;
        if (typeof window === "object")
            ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, "IDBFS used, but indexedDB not supported");
        return ret;
    },
    DB_VERSION: 21,
    DB_STORE_NAME: "FILE_DATA",
    mount: function (mount) {
        return MEMFS.mount.apply(null, arguments);
    },
    syncfs: function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function (err, local) {
            if (err)
                return callback(err);
            IDBFS.getRemoteSet(mount, function (err, remote) {
                if (err)
                    return callback(err);
                var src = populate ? remote : local;
                var dst = populate ? local : remote;
                IDBFS.reconcile(src, dst, callback);
            });
        });
    },
    getDB: function (name, callback) {
        var db = IDBFS.dbs[name];
        if (db) {
            return callback(null, db);
        }
        var req;
        try {
            req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
            return callback(e);
        }
        req.onupgradeneeded = function (e) {
            var db = e.target.result;
            var transaction = e.target.transaction;
            var fileStore;
            if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
                fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
            } else {
                fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
            }
            if (!fileStore.indexNames.contains("timestamp")) {
                fileStore.createIndex("timestamp", "timestamp", { unique: false });
            }
        };
        req.onsuccess = function () {
            db = req.result;
            IDBFS.dbs[name] = db;
            callback(null, db);
        };
        req.onerror = function (e) {
            callback(this.error);
            e.preventDefault();
        };
    },
    getLocalSet: function (mount, callback) {
        var entries = {};
        function isRealDir(p) {
            return p !== "." && p !== "..";
        }
        function toAbsolute(root) {
            return function (p) {
                return PATH.join2(root, p);
            };
        }
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
        while (check.length) {
            var path = check.pop();
            var stat;
            try {
                stat = FS.stat(path);
            } catch (e) {
                return callback(e);
            }
            if (FS.isDir(stat.mode)) {
                check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
            }
            entries[path] = { timestamp: stat.mtime };
        }
        return callback(null, {
            type: "local",
            entries: entries
        });
    },
    getRemoteSet: function (mount, callback) {
        var entries = {};
        IDBFS.getDB(mount.mountpoint, function (err, db) {
            if (err)
                return callback(err);
            var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readonly");
            transaction.onerror = function (e) {
                callback(this.error);
                e.preventDefault();
            };
            var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
            var index = store.index("timestamp");
            index.openKeyCursor().onsuccess = function (event) {
                var cursor = event.target.result;
                if (!cursor) {
                    return callback(null, {
                        type: "remote",
                        db: db,
                        entries: entries
                    });
                }
                entries[cursor.primaryKey] = { timestamp: cursor.key };
                cursor.continue();
            };
        });
    },
    loadLocalEntry: function (path, callback) {
        var stat, node;
        try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
        } catch (e) {
            return callback(e);
        }
        if (FS.isDir(stat.mode)) {
            return callback(null, {
                timestamp: stat.mtime,
                mode: stat.mode
            });
        } else if (FS.isFile(stat.mode)) {
            node.contents = MEMFS.getFileDataAsTypedArray(node);
            return callback(null, {
                timestamp: stat.mtime,
                mode: stat.mode,
                contents: node.contents
            });
        } else {
            return callback(new Error("node type not supported"));
        }
    },
    storeLocalEntry: function (path, entry, callback) {
        try {
            if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
            } else if (FS.isFile(entry.mode)) {
                FS.writeFile(path, entry.contents, {
                    encoding: "binary",
                    canOwn: true
                });
            } else {
                return callback(new Error("node type not supported"));
            }
            FS.chmod(path, entry.mode);
            FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
            return callback(e);
        }
        callback(null);
    },
    removeLocalEntry: function (path, callback) {
        try {
            var lookup = FS.lookupPath(path);
            var stat = FS.stat(path);
            if (FS.isDir(stat.mode)) {
                FS.rmdir(path);
            } else if (FS.isFile(stat.mode)) {
                FS.unlink(path);
            }
        } catch (e) {
            return callback(e);
        }
        callback(null);
    },
    loadRemoteEntry: function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function (event) {
            callback(null, event.target.result);
        };
        req.onerror = function (e) {
            callback(this.error);
            e.preventDefault();
        };
    },
    storeRemoteEntry: function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function () {
            callback(null);
        };
        req.onerror = function (e) {
            callback(this.error);
            e.preventDefault();
        };
    },
    removeRemoteEntry: function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function () {
            callback(null);
        };
        req.onerror = function (e) {
            callback(this.error);
            e.preventDefault();
        };
    },
    reconcile: function (src, dst, callback) {
        var total = 0;
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
            var e = src.entries[key];
            var e2 = dst.entries[key];
            if (!e2 || e.timestamp > e2.timestamp) {
                create.push(key);
                total++;
            }
        });
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
            var e = dst.entries[key];
            var e2 = src.entries[key];
            if (!e2) {
                remove.push(key);
                total++;
            }
        });
        if (!total) {
            return callback(null);
        }
        var completed = 0;
        var db = src.type === "remote" ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readwrite");
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        function done(err) {
            if (err) {
                if (!done.errored) {
                    done.errored = true;
                    return callback(err);
                }
                return;
            }
            if (++completed >= total) {
                return callback(null);
            }
        }
        transaction.onerror = function (e) {
            done(this.error);
            e.preventDefault();
        };
        create.sort().forEach(function (path) {
            if (dst.type === "local") {
                IDBFS.loadRemoteEntry(store, path, function (err, entry) {
                    if (err)
                        return done(err);
                    IDBFS.storeLocalEntry(path, entry, done);
                });
            } else {
                IDBFS.loadLocalEntry(path, function (err, entry) {
                    if (err)
                        return done(err);
                    IDBFS.storeRemoteEntry(store, path, entry, done);
                });
            }
        });
        remove.sort().reverse().forEach(function (path) {
            if (dst.type === "local") {
                IDBFS.removeLocalEntry(path, done);
            } else {
                IDBFS.removeRemoteEntry(store, path, done);
            }
        });
    }
};
var NODEFS = {
    isWindows: false,
    staticInit: function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
    },
    mount: function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, "/", NODEFS.getMode(mount.opts.root), 0);
    },
    createNode: function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
    },
    getMode: function (path) {
        var stat;
        try {
            stat = fs.lstatSync(path);
            if (NODEFS.isWindows) {
                stat.mode = stat.mode | (stat.mode & 146) >> 1;
            }
        } catch (e) {
            if (!e.code)
                throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
    },
    realPath: function (node) {
        var parts = [];
        while (node.parent !== node) {
            parts.push(node.name);
            node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
    },
    flagsToPermissionStringMap: {
        0: "r",
        1: "r+",
        2: "r+",
        64: "r",
        65: "r+",
        66: "r+",
        129: "rx+",
        193: "rx+",
        514: "w+",
        577: "w",
        578: "w+",
        705: "wx",
        706: "wx+",
        1024: "a",
        1025: "a",
        1026: "a+",
        1089: "a",
        1090: "a+",
        1153: "ax",
        1154: "ax+",
        1217: "ax",
        1218: "ax+",
        4096: "rs",
        4098: "rs+"
    },
    flagsToPermissionString: function (flags) {
        flags &= ~32768;
        flags &= ~524288;
        if (flags in NODEFS.flagsToPermissionStringMap) {
            return NODEFS.flagsToPermissionStringMap[flags];
        } else {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
    },
    node_ops: {
        getattr: function (node) {
            var path = NODEFS.realPath(node);
            var stat;
            try {
                stat = fs.lstatSync(path);
            } catch (e) {
                if (!e.code)
                    throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
            if (NODEFS.isWindows && !stat.blksize) {
                stat.blksize = 4096;
            }
            if (NODEFS.isWindows && !stat.blocks) {
                stat.blocks = (stat.size + stat.blksize - 1) / stat.blksize | 0;
            }
            return {
                dev: stat.dev,
                ino: stat.ino,
                mode: stat.mode,
                nlink: stat.nlink,
                uid: stat.uid,
                gid: stat.gid,
                rdev: stat.rdev,
                size: stat.size,
                atime: stat.atime,
                mtime: stat.mtime,
                ctime: stat.ctime,
                blksize: stat.blksize,
                blocks: stat.blocks
            };
        },
        setattr: function (node, attr) {
            var path = NODEFS.realPath(node);
            try {
                if (attr.mode !== undefined) {
                    fs.chmodSync(path, attr.mode);
                    node.mode = attr.mode;
                }
                if (attr.timestamp !== undefined) {
                    var date = new Date(attr.timestamp);
                    fs.utimesSync(path, date, date);
                }
                if (attr.size !== undefined) {
                    fs.truncateSync(path, attr.size);
                }
            } catch (e) {
                if (!e.code)
                    throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
        },
        lookup: function (parent, name) {
            var path = PATH.join2(NODEFS.realPath(parent), name);
            var mode = NODEFS.getMode(path);
            return NODEFS.createNode(parent, name, mode);
        },
        mknod: function (parent, name, mode, dev) {
            var node = NODEFS.createNode(parent, name, mode, dev);
            var path = NODEFS.realPath(node);
            try {
                if (FS.isDir(node.mode)) {
                    fs.mkdirSync(path, node.mode);
                } else {
                    fs.writeFileSync(path, "", { mode: node.mode });
                }
            } catch (e) {
                if (!e.code)
                    throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
            return node;
        },
        rename: function (oldNode, newDir, newName) {
            var oldPath = NODEFS.realPath(oldNode);
            var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
            try {
                fs.renameSync(oldPath, newPath);
            } catch (e) {
                if (!e.code)
                    throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
        },
        unlink: function (parent, name) {
            var path = PATH.join2(NODEFS.realPath(parent), name);
            try {
                fs.unlinkSync(path);
            } catch (e) {
                if (!e.code)
                    throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
        },
        rmdir: function (parent, name) {
            var path = PATH.join2(NODEFS.realPath(parent), name);
            try {
                fs.rmdirSync(path);
            } catch (e) {
                if (!e.code)
                    throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
        },
        readdir: function (node) {
            var path = NODEFS.realPath(node);
            try {
                return fs.readdirSync(path);
            } catch (e) {
                if (!e.code)
                    throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
        },
        symlink: function (parent, newName, oldPath) {
            var newPath = PATH.join2(NODEFS.realPath(parent), newName);
            try {
                fs.symlinkSync(oldPath, newPath);
            } catch (e) {
                if (!e.code)
                    throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
        },
        readlink: function (node) {
            var path = NODEFS.realPath(node);
            try {
                path = fs.readlinkSync(path);
                path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
                return path;
            } catch (e) {
                if (!e.code)
                    throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
        }
    },
    stream_ops: {
        open: function (stream) {
            var path = NODEFS.realPath(stream.node);
            try {
                if (FS.isFile(stream.node.mode)) {
                    stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
                }
            } catch (e) {
                if (!e.code)
                    throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
        },
        close: function (stream) {
            try {
                if (FS.isFile(stream.node.mode) && stream.nfd) {
                    fs.closeSync(stream.nfd);
                }
            } catch (e) {
                if (!e.code)
                    throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
        },
        read: function (stream, buffer, offset, length, position) {
            if (length === 0)
                return 0;
            var nbuffer = new Buffer(length);
            var res;
            try {
                res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
            } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
            if (res > 0) {
                for (var i = 0; i < res; i++) {
                    buffer[offset + i] = nbuffer[i];
                }
            }
            return res;
        },
        write: function (stream, buffer, offset, length, position) {
            var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
            var res;
            try {
                res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
            } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
            return res;
        },
        llseek: function (stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position;
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    try {
                        var stat = fs.fstatSync(stream.nfd);
                        position += stat.size;
                    } catch (e) {
                        throw new FS.ErrnoError(ERRNO_CODES[e.code]);
                    }
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
            }
            return position;
        }
    }
};
var WORKERFS = {
    DIR_MODE: 16895,
    FILE_MODE: 33279,
    reader: null,
    mount: function (mount) {
        assert(ENVIRONMENT_IS_WORKER);
        if (!WORKERFS.reader)
            WORKERFS.reader = new FileReaderSync();
        var root = WORKERFS.createNode(null, "/", WORKERFS.DIR_MODE, 0);
        var createdParents = {};
        function ensureParent(path) {
            var parts = path.split("/");
            var parent = root;
            for (var i = 0; i < parts.length - 1; i++) {
                var curr = parts.slice(0, i + 1).join("/");
                if (!createdParents[curr]) {
                    createdParents[curr] = WORKERFS.createNode(parent, curr, WORKERFS.DIR_MODE, 0);
                }
                parent = createdParents[curr];
            }
            return parent;
        }
        function base(path) {
            var parts = path.split("/");
            return parts[parts.length - 1];
        }
        Array.prototype.forEach.call(mount.opts["files"] || [], function (file) {
            WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate);
        });
        (mount.opts["blobs"] || []).forEach(function (obj) {
            WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"]);
        });
        (mount.opts["packages"] || []).forEach(function (pack) {
            pack["metadata"].files.forEach(function (file) {
                var name = file.filename.substr(1);
                WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack["blob"].slice(file.start, file.end));
            });
        });
        return root;
    },
    createNode: function (parent, name, mode, dev, contents, mtime) {
        var node = FS.createNode(parent, name, mode);
        node.mode = mode;
        node.node_ops = WORKERFS.node_ops;
        node.stream_ops = WORKERFS.stream_ops;
        node.timestamp = (mtime || new Date()).getTime();
        assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
        if (mode === WORKERFS.FILE_MODE) {
            node.size = contents.size;
            node.contents = contents;
        } else {
            node.size = 4096;
            node.contents = {};
        }
        if (parent) {
            parent.contents[name] = node;
        }
        return node;
    },
    node_ops: {
        getattr: function (node) {
            return {
                dev: 1,
                ino: undefined,
                mode: node.mode,
                nlink: 1,
                uid: 0,
                gid: 0,
                rdev: undefined,
                size: node.size,
                atime: new Date(node.timestamp),
                mtime: new Date(node.timestamp),
                ctime: new Date(node.timestamp),
                blksize: 4096,
                blocks: Math.ceil(node.size / 4096)
            };
        },
        setattr: function (node, attr) {
            if (attr.mode !== undefined) {
                node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp;
            }
        },
        lookup: function (parent, name) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        },
        mknod: function (parent, name, mode, dev) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },
        rename: function (oldNode, newDir, newName) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },
        unlink: function (parent, name) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },
        rmdir: function (parent, name) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },
        readdir: function (node) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },
        symlink: function (parent, newName, oldPath) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },
        readlink: function (node) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
    },
    stream_ops: {
        read: function (stream, buffer, offset, length, position) {
            if (position >= stream.node.size)
                return 0;
            var chunk = stream.node.contents.slice(position, position + length);
            var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
            buffer.set(new Uint8Array(ab), offset);
            return chunk.size;
        },
        write: function (stream, buffer, offset, length, position) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
        },
        llseek: function (stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position;
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.size;
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
            }
            return position;
        }
    }
};
STATICTOP += 16;
STATICTOP += 16;
STATICTOP += 16;
var FS = {
    root: null,
    mounts: [],
    devices: [null],
    streams: [],
    nextInode: 1,
    nameTable: null,
    currentPath: "/",
    initialized: false,
    ignorePermissions: true,
    trackingDelegate: {},
    tracking: {
        openFlags: {
            READ: 1,
            WRITE: 2
        }
    },
    ErrnoError: null,
    genericErrors: {},
    filesystems: null,
    syncFSRequests: 0,
    handleFSError: function (e) {
        if (!(e instanceof FS.ErrnoError))
            throw e + " : " + stackTrace();
        return ___setErrNo(e.errno);
    },
    lookupPath: function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
        if (!path)
            return {
                path: "",
                node: null
            };
        var defaults = {
            follow_mount: true,
            recurse_count: 0
        };
        for (var key in defaults) {
            if (opts[key] === undefined) {
                opts[key] = defaults[key];
            }
        }
        if (opts.recurse_count > 8) {
            throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        var parts = PATH.normalizeArray(path.split("/").filter(function (p) {
            return !!p;
        }), false);
        var current = FS.root;
        var current_path = "/";
        for (var i = 0; i < parts.length; i++) {
            var islast = i === parts.length - 1;
            if (islast && opts.parent) {
                break;
            }
            current = FS.lookupNode(current, parts[i]);
            current_path = PATH.join2(current_path, parts[i]);
            if (FS.isMountpoint(current)) {
                if (!islast || islast && opts.follow_mount) {
                    current = current.mounted.root;
                }
            }
            if (!islast || opts.follow) {
                var count = 0;
                while (FS.isLink(current.mode)) {
                    var link = FS.readlink(current_path);
                    current_path = PATH.resolve(PATH.dirname(current_path), link);
                    var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
                    current = lookup.node;
                    if (count++ > 40) {
                        throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
                    }
                }
            }
        }
        return {
            path: current_path,
            node: current
        };
    },
    getPath: function (node) {
        var path;
        while (true) {
            if (FS.isRoot(node)) {
                var mount = node.mount.mountpoint;
                if (!path)
                    return mount;
                return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path;
            }
            path = path ? node.name + "/" + path : node.name;
            node = node.parent;
        }
    },
    hashName: function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = (hash << 5) - hash + name.charCodeAt(i) | 0;
        }
        return (parentid + hash >>> 0) % FS.nameTable.length;
    },
    hashAddNode: function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
    },
    hashRemoveNode: function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
            FS.nameTable[hash] = node.name_next;
        } else {
            var current = FS.nameTable[hash];
            while (current) {
                if (current.name_next === node) {
                    current.name_next = node.name_next;
                    break;
                }
                current = current.name_next;
            }
        }
    },
    lookupNode: function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
            throw new FS.ErrnoError(err, parent);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
            var nodeName = node.name;
            if (node.parent.id === parent.id && nodeName === name) {
                return node;
            }
        }
        return FS.lookup(parent, name);
    },
    createNode: function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
            FS.FSNode = function (parent, name, mode, rdev) {
                if (!parent) {
                    parent = this;
                }
                this.parent = parent;
                this.mount = parent.mount;
                this.mounted = null;
                this.id = FS.nextInode++;
                this.name = name;
                this.mode = mode;
                this.node_ops = {};
                this.stream_ops = {};
                this.rdev = rdev;
            };
            FS.FSNode.prototype = {};
            var readMode = 292 | 73;
            var writeMode = 146;
            Object.defineProperties(FS.FSNode.prototype, {
                read: {
                    get: function () {
                        return (this.mode & readMode) === readMode;
                    },
                    set: function (val) {
                        val ? this.mode |= readMode : this.mode &= ~readMode;
                    }
                },
                write: {
                    get: function () {
                        return (this.mode & writeMode) === writeMode;
                    },
                    set: function (val) {
                        val ? this.mode |= writeMode : this.mode &= ~writeMode;
                    }
                },
                isFolder: {
                    get: function () {
                        return FS.isDir(this.mode);
                    }
                },
                isDevice: {
                    get: function () {
                        return FS.isChrdev(this.mode);
                    }
                }
            });
        }
        var node = new FS.FSNode(parent, name, mode, rdev);
        FS.hashAddNode(node);
        return node;
    },
    destroyNode: function (node) {
        FS.hashRemoveNode(node);
    },
    isRoot: function (node) {
        return node === node.parent;
    },
    isMountpoint: function (node) {
        return !!node.mounted;
    },
    isFile: function (mode) {
        return (mode & 61440) === 32768;
    },
    isDir: function (mode) {
        return (mode & 61440) === 16384;
    },
    isLink: function (mode) {
        return (mode & 61440) === 40960;
    },
    isChrdev: function (mode) {
        return (mode & 61440) === 8192;
    },
    isBlkdev: function (mode) {
        return (mode & 61440) === 24576;
    },
    isFIFO: function (mode) {
        return (mode & 61440) === 4096;
    },
    isSocket: function (mode) {
        return (mode & 49152) === 49152;
    },
    flagModes: {
        "r": 0,
        "rs": 1052672,
        "r+": 2,
        "w": 577,
        "wx": 705,
        "xw": 705,
        "w+": 578,
        "wx+": 706,
        "xw+": 706,
        "a": 1089,
        "ax": 1217,
        "xa": 1217,
        "a+": 1090,
        "ax+": 1218,
        "xa+": 1218
    },
    modeStringToFlags: function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === "undefined") {
            throw new Error("Unknown file open mode: " + str);
        }
        return flags;
    },
    flagsToPermissionString: function (flag) {
        var perms = [
            "r",
            "w",
            "rw"
        ][flag & 3];
        if (flag & 512) {
            perms += "w";
        }
        return perms;
    },
    nodePermissions: function (node, perms) {
        if (FS.ignorePermissions) {
            return 0;
        }
        if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
            return ERRNO_CODES.EACCES;
        } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
            return ERRNO_CODES.EACCES;
        } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
            return ERRNO_CODES.EACCES;
        }
        return 0;
    },
    mayLookup: function (dir) {
        var err = FS.nodePermissions(dir, "x");
        if (err)
            return err;
        if (!dir.node_ops.lookup)
            return ERRNO_CODES.EACCES;
        return 0;
    },
    mayCreate: function (dir, name) {
        try {
            var node = FS.lookupNode(dir, name);
            return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, "wx");
    },
    mayDelete: function (dir, name, isdir) {
        var node;
        try {
            node = FS.lookupNode(dir, name);
        } catch (e) {
            return e.errno;
        }
        var err = FS.nodePermissions(dir, "wx");
        if (err) {
            return err;
        }
        if (isdir) {
            if (!FS.isDir(node.mode)) {
                return ERRNO_CODES.ENOTDIR;
            }
            if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                return ERRNO_CODES.EBUSY;
            }
        } else {
            if (FS.isDir(node.mode)) {
                return ERRNO_CODES.EISDIR;
            }
        }
        return 0;
    },
    mayOpen: function (node, flags) {
        if (!node) {
            return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
            return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
            if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
                return ERRNO_CODES.EISDIR;
            }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
    },
    MAX_OPEN_FDS: 4096,
    nextfd: function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
            if (!FS.streams[fd]) {
                return fd;
            }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
    },
    getStream: function (fd) {
        return FS.streams[fd];
    },
    createStream: function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
            FS.FSStream = function () {
            };
            FS.FSStream.prototype = {};
            Object.defineProperties(FS.FSStream.prototype, {
                object: {
                    get: function () {
                        return this.node;
                    },
                    set: function (val) {
                        this.node = val;
                    }
                },
                isRead: {
                    get: function () {
                        return (this.flags & 2097155) !== 1;
                    }
                },
                isWrite: {
                    get: function () {
                        return (this.flags & 2097155) !== 0;
                    }
                },
                isAppend: {
                    get: function () {
                        return this.flags & 1024;
                    }
                }
            });
        }
        var newStream = new FS.FSStream();
        for (var p in stream) {
            newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
    },
    closeStream: function (fd) {
        FS.streams[fd] = null;
    },
    chrdev_stream_ops: {
        open: function (stream) {
            var device = FS.getDevice(stream.node.rdev);
            stream.stream_ops = device.stream_ops;
            if (stream.stream_ops.open) {
                stream.stream_ops.open(stream);
            }
        },
        llseek: function () {
            throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
    },
    major: function (dev) {
        return dev >> 8;
    },
    minor: function (dev) {
        return dev & 255;
    },
    makedev: function (ma, mi) {
        return ma << 8 | mi;
    },
    registerDevice: function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
    },
    getDevice: function (dev) {
        return FS.devices[dev];
    },
    getMounts: function (mount) {
        var mounts = [];
        var check = [mount];
        while (check.length) {
            var m = check.pop();
            mounts.push(m);
            check.push.apply(check, m.mounts);
        }
        return mounts;
    },
    syncfs: function (populate, callback) {
        if (typeof populate === "function") {
            callback = populate;
            populate = false;
        }
        FS.syncFSRequests++;
        if (FS.syncFSRequests > 1) {
            console.log("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work");
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
        function doCallback(err) {
            assert(FS.syncFSRequests > 0);
            FS.syncFSRequests--;
            return callback(err);
        }
        function done(err) {
            if (err) {
                if (!done.errored) {
                    done.errored = true;
                    return doCallback(err);
                }
                return;
            }
            if (++completed >= mounts.length) {
                doCallback(null);
            }
        }
        mounts.forEach(function (mount) {
            if (!mount.type.syncfs) {
                return done(null);
            }
            mount.type.syncfs(mount, populate, done);
        });
    },
    mount: function (type, opts, mountpoint) {
        var root = mountpoint === "/";
        var pseudo = !mountpoint;
        var node;
        if (root && FS.root) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
            var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
            mountpoint = lookup.path;
            node = lookup.node;
            if (FS.isMountpoint(node)) {
                throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
            }
            if (!FS.isDir(node.mode)) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
            }
        }
        var mount = {
            type: type,
            opts: opts,
            mountpoint: mountpoint,
            mounts: []
        };
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if (root) {
            FS.root = mountRoot;
        } else if (node) {
            node.mounted = mount;
            if (node.mount) {
                node.mount.mounts.push(mount);
            }
        }
        return mountRoot;
    },
    unmount: function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
        if (!FS.isMountpoint(lookup.node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach(function (hash) {
            var current = FS.nameTable[hash];
            while (current) {
                var next = current.name_next;
                if (mounts.indexOf(current.mount) !== -1) {
                    FS.destroyNode(current);
                }
                current = next;
            }
        });
        node.mounted = null;
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
    },
    lookup: function (parent, name) {
        return parent.node_ops.lookup(parent, name);
    },
    mknod: function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === "." || name === "..") {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.mayCreate(parent, name);
        if (err) {
            throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
    },
    create: function (path, mode) {
        mode = mode !== undefined ? mode : 438;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
    },
    mkdir: function (path, mode) {
        mode = mode !== undefined ? mode : 511;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
    },
    mkdev: function (path, mode, dev) {
        if (typeof dev === "undefined") {
            dev = mode;
            mode = 438;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
    },
    symlink: function (oldpath, newpath) {
        if (!PATH.resolve(oldpath)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
            throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
    },
    rename: function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        var lookup, old_dir, new_dir;
        try {
            lookup = FS.lookupPath(old_path, { parent: true });
            old_dir = lookup.node;
            lookup = FS.lookupPath(new_path, { parent: true });
            new_dir = lookup.node;
        } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        if (!old_dir || !new_dir)
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        if (old_dir.mount !== new_dir.mount) {
            throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        var old_node = FS.lookupNode(old_dir, old_name);
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        var new_node;
        try {
            new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
        }
        if (old_node === new_node) {
            return;
        }
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
            throw new FS.ErrnoError(err);
        }
        err = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
        if (err) {
            throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        if (new_dir !== old_dir) {
            err = FS.nodePermissions(old_dir, "w");
            if (err) {
                throw new FS.ErrnoError(err);
            }
        }
        try {
            if (FS.trackingDelegate["willMovePath"]) {
                FS.trackingDelegate["willMovePath"](old_path, new_path);
            }
        } catch (e) {
            console.log("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
        }
        FS.hashRemoveNode(old_node);
        try {
            old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
            throw e;
        } finally {
            FS.hashAddNode(old_node);
        }
        try {
            if (FS.trackingDelegate["onMovePath"])
                FS.trackingDelegate["onMovePath"](old_path, new_path);
        } catch (e) {
            console.log("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
        }
    },
    rmdir: function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
            throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path);
            }
        } catch (e) {
            console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"])
                FS.trackingDelegate["onDeletePath"](path);
        } catch (e) {
            console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
        }
    },
    readdir: function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
    },
    unlink: function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
            if (err === ERRNO_CODES.EISDIR)
                err = ERRNO_CODES.EPERM;
            throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path);
            }
        } catch (e) {
            console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"])
                FS.trackingDelegate["onDeletePath"](path);
        } catch (e) {
            console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
        }
    },
    readlink: function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!link.node_ops.readlink) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return PATH.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
    },
    stat: function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!node.node_ops.getattr) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
    },
    lstat: function (path) {
        return FS.stat(path, true);
    },
    chmod: function (path, mode, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, { follow: !dontFollow });
            node = lookup.node;
        } else {
            node = path;
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
            mode: mode & 4095 | node.mode & ~4095,
            timestamp: Date.now()
        });
    },
    lchmod: function (path, mode) {
        FS.chmod(path, mode, true);
    },
    fchmod: function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
    },
    chown: function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, { follow: !dontFollow });
            node = lookup.node;
        } else {
            node = path;
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, { timestamp: Date.now() });
    },
    lchown: function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
    },
    fchown: function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
    },
    truncate: function (path, len) {
        if (len < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, { follow: true });
            node = lookup.node;
        } else {
            node = path;
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, "w");
        if (err) {
            throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
            size: len,
            timestamp: Date.now()
        });
    },
    ftruncate: function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
    },
    utime: function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, { timestamp: Math.max(atime, mtime) });
    },
    open: function (path, flags, mode, fd_start, fd_end) {
        if (path === "") {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === "undefined" ? 438 : mode;
        if (flags & 64) {
            mode = mode & 4095 | 32768;
        } else {
            mode = 0;
        }
        var node;
        if (typeof path === "object") {
            node = path;
        } else {
            path = PATH.normalize(path);
            try {
                var lookup = FS.lookupPath(path, { follow: !(flags & 131072) });
                node = lookup.node;
            } catch (e) {
            }
        }
        var created = false;
        if (flags & 64) {
            if (node) {
                if (flags & 128) {
                    throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
                }
            } else {
                node = FS.mknod(path, mode, 0);
                created = true;
            }
        }
        if (!node) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (FS.isChrdev(node.mode)) {
            flags &= ~512;
        }
        if (flags & 65536 && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        if (!created) {
            var err = FS.mayOpen(node, flags);
            if (err) {
                throw new FS.ErrnoError(err);
            }
        }
        if (flags & 512) {
            FS.truncate(node, 0);
        }
        flags &= ~(128 | 512);
        var stream = FS.createStream({
            node: node,
            path: FS.getPath(node),
            flags: flags,
            seekable: true,
            position: 0,
            stream_ops: node.stream_ops,
            ungotten: [],
            error: false
        }, fd_start, fd_end);
        if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
        }
        if (Module["logReadFiles"] && !(flags & 1)) {
            if (!FS.readFiles)
                FS.readFiles = {};
            if (!(path in FS.readFiles)) {
                FS.readFiles[path] = 1;
                Module["printErr"]("read file: " + path);
            }
        }
        try {
            if (FS.trackingDelegate["onOpenFile"]) {
                var trackingFlags = 0;
                if ((flags & 2097155) !== 1) {
                    trackingFlags |= FS.tracking.openFlags.READ;
                }
                if ((flags & 2097155) !== 0) {
                    trackingFlags |= FS.tracking.openFlags.WRITE;
                }
                FS.trackingDelegate["onOpenFile"](path, trackingFlags);
            }
        } catch (e) {
            console.log("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message);
        }
        return stream;
    },
    close: function (stream) {
        if (stream.getdents)
            stream.getdents = null;
        try {
            if (stream.stream_ops.close) {
                stream.stream_ops.close(stream);
            }
        } catch (e) {
            throw e;
        } finally {
            FS.closeStream(stream.fd);
        }
    },
    llseek: function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
            throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
    },
    read: function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === "undefined") {
            position = stream.position;
            seeking = false;
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking)
            stream.position += bytesRead;
        return bytesRead;
    },
    write: function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if (stream.flags & 1024) {
            FS.llseek(stream, 0, 2);
        }
        var seeking = true;
        if (typeof position === "undefined") {
            position = stream.position;
            seeking = false;
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking)
            stream.position += bytesWritten;
        try {
            if (stream.path && FS.trackingDelegate["onWriteToFile"])
                FS.trackingDelegate["onWriteToFile"](stream.path);
        } catch (e) {
            console.log("FS.trackingDelegate['onWriteToFile']('" + path + "') threw an exception: " + e.message);
        }
        return bytesWritten;
    },
    allocate: function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
    },
    mmap: function (stream, buffer, offset, length, position, prot, flags) {
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
    },
    msync: function (stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
            return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
    },
    munmap: function (stream) {
        return 0;
    },
    ioctl: function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
    },
    readFile: function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || "r";
        opts.encoding = opts.encoding || "binary";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
            throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === "utf8") {
            ret = UTF8ArrayToString(buf, 0);
        } else if (opts.encoding === "binary") {
            ret = buf;
        }
        FS.close(stream);
        return ret;
    },
    writeFile: function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || "w";
        opts.encoding = opts.encoding || "utf8";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
            throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === "utf8") {
            var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
            var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
            FS.write(stream, buf, 0, actualNumBytes, 0, opts.canOwn);
        } else if (opts.encoding === "binary") {
            FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
    },
    cwd: function () {
        return FS.currentPath;
    },
    chdir: function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, "x");
        if (err) {
            throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
    },
    createDefaultDirectories: function () {
        FS.mkdir("/tmp");
        FS.mkdir("/home");
        FS.mkdir("/home/web_user");
    },
    createDefaultDevices: function () {
        FS.mkdir("/dev");
        FS.registerDevice(FS.makedev(1, 3), {
            read: function () {
                return 0;
            },
            write: function (stream, buffer, offset, length, pos) {
                return length;
            }
        });
        FS.mkdev("/dev/null", FS.makedev(1, 3));
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev("/dev/tty", FS.makedev(5, 0));
        FS.mkdev("/dev/tty1", FS.makedev(6, 0));
        var random_device;
        if (typeof crypto !== "undefined") {
            var randomBuffer = new Uint8Array(1);
            random_device = function () {
                crypto.getRandomValues(randomBuffer);
                return randomBuffer[0];
            };
        } else if (ENVIRONMENT_IS_NODE) {
            random_device = function () {
                return require("crypto").randomBytes(1)[0];
            };
        } else {
            random_device = function () {
                return Math.random() * 256 | 0;
            };
        }
        FS.createDevice("/dev", "random", random_device);
        FS.createDevice("/dev", "urandom", random_device);
        FS.mkdir("/dev/shm");
        FS.mkdir("/dev/shm/tmp");
    },
    createSpecialDirectories: function () {
        FS.mkdir("/proc");
        FS.mkdir("/proc/self");
        FS.mkdir("/proc/self/fd");
        FS.mount({
            mount: function () {
                var node = FS.createNode("/proc/self", "fd", 16384 | 511, 73);
                node.node_ops = {
                    lookup: function (parent, name) {
                        var fd = +name;
                        var stream = FS.getStream(fd);
                        if (!stream)
                            throw new FS.ErrnoError(ERRNO_CODES.EBADF);
                        var ret = {
                            parent: null,
                            mount: { mountpoint: "fake" },
                            node_ops: {
                                readlink: function () {
                                    return stream.path;
                                }
                            }
                        };
                        ret.parent = ret;
                        return ret;
                    }
                };
                return node;
            }
        }, {}, "/proc/self/fd");
    },
    createStandardStreams: function () {
        if (Module["stdin"]) {
            FS.createDevice("/dev", "stdin", Module["stdin"]);
        } else {
            FS.symlink("/dev/tty", "/dev/stdin");
        }
        if (Module["stdout"]) {
            FS.createDevice("/dev", "stdout", null, Module["stdout"]);
        } else {
            FS.symlink("/dev/tty", "/dev/stdout");
        }
        if (Module["stderr"]) {
            FS.createDevice("/dev", "stderr", null, Module["stderr"]);
        } else {
            FS.symlink("/dev/tty1", "/dev/stderr");
        }
        var stdin = FS.open("/dev/stdin", "r");
        assert(stdin.fd === 0, "invalid handle for stdin (" + stdin.fd + ")");
        var stdout = FS.open("/dev/stdout", "w");
        assert(stdout.fd === 1, "invalid handle for stdout (" + stdout.fd + ")");
        var stderr = FS.open("/dev/stderr", "w");
        assert(stderr.fd === 2, "invalid handle for stderr (" + stderr.fd + ")");
    },
    ensureErrnoError: function () {
        if (FS.ErrnoError)
            return;
        FS.ErrnoError = function ErrnoError(errno, node) {
            this.node = node;
            this.setErrno = function (errno) {
                this.errno = errno;
                for (var key in ERRNO_CODES) {
                    if (ERRNO_CODES[key] === errno) {
                        this.code = key;
                        break;
                    }
                }
            };
            this.setErrno(errno);
            this.message = ERRNO_MESSAGES[errno];
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        [ERRNO_CODES.ENOENT].forEach(function (code) {
            FS.genericErrors[code] = new FS.ErrnoError(code);
            FS.genericErrors[code].stack = "<generic error, no stack>";
        });
    },
    staticInit: function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.mount(MEMFS, {}, "/");
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
        FS.filesystems = {
            "MEMFS": MEMFS,
            "IDBFS": IDBFS,
            "NODEFS": NODEFS,
            "WORKERFS": WORKERFS
        };
    },
    init: function (input, output, error) {
        assert(!FS.init.initialized, "FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)");
        FS.init.initialized = true;
        FS.ensureErrnoError();
        Module["stdin"] = input || Module["stdin"];
        Module["stdout"] = output || Module["stdout"];
        Module["stderr"] = error || Module["stderr"];
        FS.createStandardStreams();
    },
    quit: function () {
        FS.init.initialized = false;
        var fflush = Module["_fflush"];
        if (fflush)
            fflush(0);
        for (var i = 0; i < FS.streams.length; i++) {
            var stream = FS.streams[i];
            if (!stream) {
                continue;
            }
            FS.close(stream);
        }
    },
    getMode: function (canRead, canWrite) {
        var mode = 0;
        if (canRead)
            mode |= 292 | 73;
        if (canWrite)
            mode |= 146;
        return mode;
    },
    joinPath: function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == "/")
            path = path.substr(1);
        return path;
    },
    absolutePath: function (relative, base) {
        return PATH.resolve(base, relative);
    },
    standardizePath: function (path) {
        return PATH.normalize(path);
    },
    findObject: function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
            return ret.object;
        } else {
            ___setErrNo(ret.error);
            return null;
        }
    },
    analyzePath: function (path, dontResolveLastLink) {
        try {
            var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
            path = lookup.path;
        } catch (e) {
        }
        var ret = {
            isRoot: false,
            exists: false,
            error: 0,
            name: null,
            path: null,
            object: null,
            parentExists: false,
            parentPath: null,
            parentObject: null
        };
        try {
            var lookup = FS.lookupPath(path, { parent: true });
            ret.parentExists = true;
            ret.parentPath = lookup.path;
            ret.parentObject = lookup.node;
            ret.name = PATH.basename(path);
            lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
            ret.exists = true;
            ret.path = lookup.path;
            ret.object = lookup.node;
            ret.name = lookup.node.name;
            ret.isRoot = lookup.path === "/";
        } catch (e) {
            ret.error = e.errno;
        }
        return ret;
    },
    createFolder: function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
    },
    createPath: function (parent, path, canRead, canWrite) {
        parent = typeof parent === "string" ? parent : FS.getPath(parent);
        var parts = path.split("/").reverse();
        while (parts.length) {
            var part = parts.pop();
            if (!part)
                continue;
            var current = PATH.join2(parent, part);
            try {
                FS.mkdir(current);
            } catch (e) {
            }
            parent = current;
        }
        return current;
    },
    createFile: function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
    },
    createDataFile: function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
            if (typeof data === "string") {
                var arr = new Array(data.length);
                for (var i = 0, len = data.length; i < len; ++i)
                    arr[i] = data.charCodeAt(i);
                data = arr;
            }
            FS.chmod(node, mode | 146);
            var stream = FS.open(node, "w");
            FS.write(stream, data, 0, data.length, 0, canOwn);
            FS.close(stream);
            FS.chmod(node, mode);
        }
        return node;
    },
    createDevice: function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major)
            FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        FS.registerDevice(dev, {
            open: function (stream) {
                stream.seekable = false;
            },
            close: function (stream) {
                if (output && output.buffer && output.buffer.length) {
                    output(10);
                }
            },
            read: function (stream, buffer, offset, length, pos) {
                var bytesRead = 0;
                for (var i = 0; i < length; i++) {
                    var result;
                    try {
                        result = input();
                    } catch (e) {
                        throw new FS.ErrnoError(ERRNO_CODES.EIO);
                    }
                    if (result === undefined && bytesRead === 0) {
                        throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
                    }
                    if (result === null || result === undefined)
                        break;
                    bytesRead++;
                    buffer[offset + i] = result;
                }
                if (bytesRead) {
                    stream.node.timestamp = Date.now();
                }
                return bytesRead;
            },
            write: function (stream, buffer, offset, length, pos) {
                for (var i = 0; i < length; i++) {
                    try {
                        output(buffer[offset + i]);
                    } catch (e) {
                        throw new FS.ErrnoError(ERRNO_CODES.EIO);
                    }
                }
                if (length) {
                    stream.node.timestamp = Date.now();
                }
                return i;
            }
        });
        return FS.mkdev(path, mode, dev);
    },
    createLink: function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
    },
    forceLoadFile: function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents)
            return true;
        var success = true;
        if (typeof XMLHttpRequest !== "undefined") {
            throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module["read"]) {
            try {
                obj.contents = intArrayFromString(Module["read"](obj.url), true);
                obj.usedBytes = obj.contents.length;
            } catch (e) {
                success = false;
            }
        } else {
            throw new Error("Cannot load without read() or XMLHttpRequest.");
        }
        if (!success)
            ___setErrNo(ERRNO_CODES.EIO);
        return success;
    },
    createLazyFile: function (parent, name, url, canRead, canWrite) {
        function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = [];
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length - 1 || idx < 0) {
                return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = idx / this.chunkSize | 0;
            return this.getter(chunkNum)[chunkOffset];
        };
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
        };
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            var xhr = new XMLHttpRequest();
            xhr.open("HEAD", url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304))
                throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
            var chunkSize = 1024 * 1024;
            if (!hasByteServing)
                chunkSize = datalength;
            var doXHR = function (from, to) {
                if (from > to)
                    throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength - 1)
                    throw new Error("only " + datalength + " bytes available! programmer error!");
                var xhr = new XMLHttpRequest();
                xhr.open("GET", url, false);
                if (datalength !== chunkSize)
                    xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                if (typeof Uint8Array != "undefined")
                    xhr.responseType = "arraybuffer";
                if (xhr.overrideMimeType) {
                    xhr.overrideMimeType("text/plain; charset=x-user-defined");
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304))
                    throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                    return new Uint8Array(xhr.response || []);
                } else {
                    return intArrayFromString(xhr.responseText || "", true);
                }
            };
            var lazyArray = this;
            lazyArray.setDataGetter(function (chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum + 1) * chunkSize - 1;
                end = Math.min(end, datalength - 1);
                if (typeof lazyArray.chunks[chunkNum] === "undefined") {
                    lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof lazyArray.chunks[chunkNum] === "undefined")
                    throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
            });
            if (usesGzip || !datalength) {
                chunkSize = datalength = 1;
                datalength = this.getter(0).length;
                chunkSize = datalength;
                console.log("LazyFiles on gzip forces download of the whole file when length is accessed");
            }
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
        };
        if (typeof XMLHttpRequest !== "undefined") {
            if (!ENVIRONMENT_IS_WORKER)
                throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
            var lazyArray = new LazyUint8Array();
            Object.defineProperties(lazyArray, {
                length: {
                    get: function () {
                        if (!this.lengthKnown) {
                            this.cacheLength();
                        }
                        return this._length;
                    }
                },
                chunkSize: {
                    get: function () {
                        if (!this.lengthKnown) {
                            this.cacheLength();
                        }
                        return this._chunkSize;
                    }
                }
            });
            var properties = {
                isDevice: false,
                contents: lazyArray
            };
        } else {
            var properties = {
                isDevice: false,
                url: url
            };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        if (properties.contents) {
            node.contents = properties.contents;
        } else if (properties.url) {
            node.contents = null;
            node.url = properties.url;
        }
        Object.defineProperties(node, {
            usedBytes: {
                get: function () {
                    return this.contents.length;
                }
            }
        });
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function (key) {
            var fn = node.stream_ops[key];
            stream_ops[key] = function forceLoadLazyFile() {
                if (!FS.forceLoadFile(node)) {
                    throw new FS.ErrnoError(ERRNO_CODES.EIO);
                }
                return fn.apply(null, arguments);
            };
        });
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
            if (!FS.forceLoadFile(node)) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            var contents = stream.node.contents;
            if (position >= contents.length)
                return 0;
            var size = Math.min(contents.length - position, length);
            assert(size >= 0);
            if (contents.slice) {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents[position + i];
                }
            } else {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents.get(position + i);
                }
            }
            return size;
        };
        node.stream_ops = stream_ops;
        return node;
    },
    createPreloadedFile: function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init();
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency("cp " + fullname);
        function processData(byteArray) {
            function finish(byteArray) {
                if (preFinish)
                    preFinish();
                if (!dontCreateFile) {
                    FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
                }
                if (onload)
                    onload();
                removeRunDependency(dep);
            }
            var handled = false;
            Module["preloadPlugins"].forEach(function (plugin) {
                if (handled)
                    return;
                if (plugin["canHandle"](fullname)) {
                    plugin["handle"](byteArray, fullname, finish, function () {
                        if (onerror)
                            onerror();
                        removeRunDependency(dep);
                    });
                    handled = true;
                }
            });
            if (!handled)
                finish(byteArray);
        }
        addRunDependency(dep);
        if (typeof url == "string") {
            Browser.asyncLoad(url, function (byteArray) {
                processData(byteArray);
            }, onerror);
        } else {
            processData(url);
        }
    },
    indexedDB: function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    },
    DB_NAME: function () {
        return "EM_FS_" + window.location.pathname;
    },
    DB_VERSION: 20,
    DB_STORE_NAME: "FILE_DATA",
    saveFilesToDB: function (paths, onload, onerror) {
        onload = onload || function () {
        };
        onerror = onerror || function () {
        };
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
            return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
            console.log("creating db");
            var db = openRequest.result;
            db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0, fail = 0, total = paths.length;
            function finish() {
                if (fail == 0)
                    onload();
                else
                    onerror();
            }
            paths.forEach(function (path) {
                var putRequest = files.put(FS.analyzePath(path).object.contents, path);
                putRequest.onsuccess = function putRequest_onsuccess() {
                    ok++;
                    if (ok + fail == total)
                        finish();
                };
                putRequest.onerror = function putRequest_onerror() {
                    fail++;
                    if (ok + fail == total)
                        finish();
                };
            });
            transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
    },
    loadFilesFromDB: function (paths, onload, onerror) {
        onload = onload || function () {
        };
        onerror = onerror || function () {
        };
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
            return onerror(e);
        }
        openRequest.onupgradeneeded = onerror;
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            try {
                var transaction = db.transaction([FS.DB_STORE_NAME], "readonly");
            } catch (e) {
                onerror(e);
                return;
            }
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0, fail = 0, total = paths.length;
            function finish() {
                if (fail == 0)
                    onload();
                else
                    onerror();
            }
            paths.forEach(function (path) {
                var getRequest = files.get(path);
                getRequest.onsuccess = function getRequest_onsuccess() {
                    if (FS.analyzePath(path).exists) {
                        FS.unlink(path);
                    }
                    FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
                    ok++;
                    if (ok + fail == total)
                        finish();
                };
                getRequest.onerror = function getRequest_onerror() {
                    fail++;
                    if (ok + fail == total)
                        finish();
                };
            });
            transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
    }
};
var SYSCALLS = {
    DEFAULT_POLLMASK: 5,
    mappings: {},
    umask: 511,
    calculateAt: function (dirfd, path) {
        if (path[0] !== "/") {
            var dir;
            if (dirfd === -100) {
                dir = FS.cwd();
            } else {
                var dirstream = FS.getStream(dirfd);
                if (!dirstream)
                    throw new FS.ErrnoError(ERRNO_CODES.EBADF);
                dir = dirstream.path;
            }
            path = PATH.join2(dir, path);
        }
        return path;
    },
    doStat: function (func, path, buf) {
        try {
            var stat = func(path);
        } catch (e) {
            if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                return -ERRNO_CODES.ENOTDIR;
            }
            throw e;
        }
        HEAP32[buf >> 2] = stat.dev;
        HEAP32[buf + 4 >> 2] = 0;
        HEAP32[buf + 8 >> 2] = stat.ino;
        HEAP32[buf + 12 >> 2] = stat.mode;
        HEAP32[buf + 16 >> 2] = stat.nlink;
        HEAP32[buf + 20 >> 2] = stat.uid;
        HEAP32[buf + 24 >> 2] = stat.gid;
        HEAP32[buf + 28 >> 2] = stat.rdev;
        HEAP32[buf + 32 >> 2] = 0;
        HEAP32[buf + 36 >> 2] = stat.size;
        HEAP32[buf + 40 >> 2] = 4096;
        HEAP32[buf + 44 >> 2] = stat.blocks;
        HEAP32[buf + 48 >> 2] = stat.atime.getTime() / 1e3 | 0;
        HEAP32[buf + 52 >> 2] = 0;
        HEAP32[buf + 56 >> 2] = stat.mtime.getTime() / 1e3 | 0;
        HEAP32[buf + 60 >> 2] = 0;
        HEAP32[buf + 64 >> 2] = stat.ctime.getTime() / 1e3 | 0;
        HEAP32[buf + 68 >> 2] = 0;
        HEAP32[buf + 72 >> 2] = stat.ino;
        return 0;
    },
    doMsync: function (addr, stream, len, flags) {
        var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
        FS.msync(stream, buffer, 0, len, flags);
    },
    doMkdir: function (path, mode) {
        path = PATH.normalize(path);
        if (path[path.length - 1] === "/")
            path = path.substr(0, path.length - 1);
        FS.mkdir(path, mode, 0);
        return 0;
    },
    doMknod: function (path, mode, dev) {
        switch (mode & 61440) {
        case 32768:
        case 8192:
        case 24576:
        case 4096:
        case 49152:
            break;
        default:
            return -ERRNO_CODES.EINVAL;
        }
        FS.mknod(path, mode, dev);
        return 0;
    },
    doReadlink: function (path, buf, bufsize) {
        if (bufsize <= 0)
            return -ERRNO_CODES.EINVAL;
        var ret = FS.readlink(path);
        ret = ret.slice(0, Math.max(0, bufsize));
        writeStringToMemory(ret, buf, true);
        return ret.length;
    },
    doAccess: function (path, amode) {
        if (amode & ~7) {
            return -ERRNO_CODES.EINVAL;
        }
        var node;
        var lookup = FS.lookupPath(path, { follow: true });
        node = lookup.node;
        var perms = "";
        if (amode & 4)
            perms += "r";
        if (amode & 2)
            perms += "w";
        if (amode & 1)
            perms += "x";
        if (perms && FS.nodePermissions(node, perms)) {
            return -ERRNO_CODES.EACCES;
        }
        return 0;
    },
    doDup: function (path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest)
            FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
    },
    doReadv: function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[iov + i * 8 >> 2];
            var len = HEAP32[iov + (i * 8 + 4) >> 2];
            var curr = FS.read(stream, HEAP8, ptr, len, offset);
            if (curr < 0)
                return -1;
            ret += curr;
            if (curr < len)
                break;
        }
        return ret;
    },
    doWritev: function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[iov + i * 8 >> 2];
            var len = HEAP32[iov + (i * 8 + 4) >> 2];
            var curr = FS.write(stream, HEAP8, ptr, len, offset);
            if (curr < 0)
                return -1;
            ret += curr;
        }
        return ret;
    },
    varargs: 0,
    get: function (varargs) {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
        return ret;
    },
    getStr: function () {
        var ret = Pointer_stringify(SYSCALLS.get());
        return ret;
    },
    getStreamFromFD: function () {
        var stream = FS.getStream(SYSCALLS.get());
        if (!stream)
            throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        return stream;
    },
    getSocketFromFD: function () {
        var socket = SOCKFS.getSocket(SYSCALLS.get());
        if (!socket)
            throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        return socket;
    },
    getSocketAddress: function (allowNull) {
        var addrp = SYSCALLS.get(), addrlen = SYSCALLS.get();
        if (allowNull && addrp === 0)
            return null;
        var info = __read_sockaddr(addrp, addrlen);
        if (info.errno)
            throw new FS.ErrnoError(info.errno);
        info.addr = DNS.lookup_addr(info.addr) || info.addr;
        return info;
    },
    get64: function () {
        var low = SYSCALLS.get(), high = SYSCALLS.get();
        if (low >= 0)
            assert(high === 0);
        else
            assert(high === -1);
        return low;
    },
    getZero: function () {
        assert(SYSCALLS.get() === 0);
    }
};
function ___syscall3(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(), buf = SYSCALLS.get(), count = SYSCALLS.get();
        return FS.read(stream, HEAP8, buf, count);
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno;
    }
}
function ___syscall5(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var pathname = SYSCALLS.getStr(), flags = SYSCALLS.get(), mode = SYSCALLS.get();
        var stream = FS.open(pathname, flags, mode);
        return stream.fd;
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno;
    }
}
function ___lock() {
}
function ___unlock() {
}
function ___syscall6(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD();
        FS.close(stream);
        return 0;
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno;
    }
}
Module["_i64Add"] = _i64Add;
function _sbrk(bytes) {
    var self = _sbrk;
    if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP);
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function () {
            abort("cannot dynamically allocate, sbrk now has control");
        };
    }
    var ret = DYNAMICTOP;
    if (bytes != 0) {
        var success = self.alloc(bytes);
        if (!success)
            return -1 >>> 0;
    }
    return ret;
}
var __sigalrm_handler = 0;
function _signal(sig, func) {
    if (sig == 14) {
        __sigalrm_handler = func;
    } else {
    }
    return 0;
}
function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
    return dest;
}
Module["_memcpy"] = _memcpy;
function ___syscall4(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(), buf = SYSCALLS.get(), count = SYSCALLS.get();
        return FS.write(stream, HEAP8, buf, count);
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno;
    }
}
function __exit(status) {
    Module["exit"](status);
}
function _exit(status) {
    __exit(status);
}
function _time(ptr) {
    var ret = Date.now() / 1e3 | 0;
    if (ptr) {
        HEAP32[ptr >> 2] = ret;
    }
    return ret;
}
function _pthread_self() {
    return 0;
}
function ___syscall140(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
        var offset = offset_low;
        assert(offset_high === 0);
        FS.llseek(stream, offset, whence);
        HEAP32[result >> 2] = stream.position;
        if (stream.getdents && offset === 0 && whence === 0)
            stream.getdents = null;
        return 0;
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno;
    }
}
function ___syscall146(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
        return SYSCALLS.doWritev(stream, iov, iovcnt);
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno;
    }
}
function ___syscall54(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(), op = SYSCALLS.get();
        switch (op) {
        case 21505: {
                if (!stream.tty)
                    return -ERRNO_CODES.ENOTTY;
                return 0;
            }
            ;
        case 21506: {
                if (!stream.tty)
                    return -ERRNO_CODES.ENOTTY;
                return 0;
            }
            ;
        case 21519: {
                if (!stream.tty)
                    return -ERRNO_CODES.ENOTTY;
                var argp = SYSCALLS.get();
                HEAP32[argp >> 2] = 0;
                return 0;
            }
            ;
        case 21520: {
                if (!stream.tty)
                    return -ERRNO_CODES.ENOTTY;
                return -ERRNO_CODES.EINVAL;
            }
            ;
        case 21531: {
                var argp = SYSCALLS.get();
                return FS.ioctl(stream, op, argp);
            }
            ;
        default:
            abort("bad ioctl syscall " + op);
        }
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno;
    }
}
function ___syscall221(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(), cmd = SYSCALLS.get();
        switch (cmd) {
        case 0: {
                var arg = SYSCALLS.get();
                if (arg < 0) {
                    return -ERRNO_CODES.EINVAL;
                }
                var newStream;
                newStream = FS.open(stream.path, stream.flags, 0, arg);
                return newStream.fd;
            }
            ;
        case 1:
        case 2:
            return 0;
        case 3:
            return stream.flags;
        case 4: {
                var arg = SYSCALLS.get();
                stream.flags |= arg;
                return 0;
            }
            ;
        case 12:
        case 12: {
                var arg = SYSCALLS.get();
                var offset = 0;
                HEAP16[arg + offset >> 1] = 2;
                return 0;
            }
            ;
        case 13:
        case 14:
        case 13:
        case 14:
            return 0;
        case 16:
        case 8:
            return -ERRNO_CODES.EINVAL;
        case 9:
            ___setErrNo(ERRNO_CODES.EINVAL);
            return -1;
        default: {
                return -ERRNO_CODES.EINVAL;
            }
        }
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno;
    }
}
function ___syscall145(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
        return SYSCALLS.doReadv(stream, iov, iovcnt);
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
            abort(e);
        return -e.errno;
    }
}
___buildEnvironment(ENV);
FS.staticInit();
__ATINIT__.unshift(function () {
    if (!Module["noFSInit"] && !FS.init.initialized)
        FS.init();
});
__ATMAIN__.push(function () {
    FS.ignorePermissions = false;
});
__ATEXIT__.push(function () {
    FS.quit();
});
Module["FS_createFolder"] = FS.createFolder;
Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_createLazyFile"] = FS.createLazyFile;
Module["FS_createLink"] = FS.createLink;
Module["FS_createDevice"] = FS.createDevice;
Module["FS_unlink"] = FS.unlink;
__ATINIT__.unshift(function () {
    TTY.init();
});
__ATEXIT__.push(function () {
    TTY.shutdown();
});
if (ENVIRONMENT_IS_NODE) {
    var fs = require("fs");
    var NODEJS_PATH = require("path");
    NODEFS.staticInit();
}
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true;
STACK_MAX = STACK_BASE + TOTAL_STACK;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
var cttz_i8 = allocate([
    8,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    3,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    4,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    3,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    5,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    3,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    4,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    3,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    6,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    3,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    4,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    3,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    5,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    3,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    4,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    3,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    7,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    3,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    4,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    3,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    5,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    3,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    4,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    3,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    6,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    3,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    4,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    3,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    5,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    3,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    4,
    0,
    1,
    0,
    2,
    0,
    1,
    0,
    3,
    0,
    1,
    0,
    2,
    0,
    1,
    0
], "i8", ALLOC_DYNAMIC);
function invoke_i(index) {
    try {
        return Module["dynCall_i"](index);
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp")
            throw e;
        asm["setThrew"](1, 0);
    }
}
function invoke_ii(index, a1) {
    try {
        return Module["dynCall_ii"](index, a1);
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp")
            throw e;
        asm["setThrew"](1, 0);
    }
}
function invoke_iiii(index, a1, a2, a3) {
    try {
        return Module["dynCall_iiii"](index, a1, a2, a3);
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp")
            throw e;
        asm["setThrew"](1, 0);
    }
}
function invoke_vi(index, a1) {
    try {
        Module["dynCall_vi"](index, a1);
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp")
            throw e;
        asm["setThrew"](1, 0);
    }
}
Module.asmGlobalArg = {
    "Math": Math,
    "Int8Array": Int8Array,
    "Int16Array": Int16Array,
    "Int32Array": Int32Array,
    "Uint8Array": Uint8Array,
    "Uint16Array": Uint16Array,
    "Uint32Array": Uint32Array,
    "Float32Array": Float32Array,
    "Float64Array": Float64Array,
    "NaN": NaN,
    "Infinity": Infinity
};
Module.asmLibraryArg = {
    "abort": abort,
    "assert": assert,
    "invoke_i": invoke_i,
    "invoke_ii": invoke_ii,
    "invoke_iiii": invoke_iiii,
    "invoke_vi": invoke_vi,
    "_pthread_cleanup_pop": _pthread_cleanup_pop,
    "___syscall221": ___syscall221,
    "___syscall6": ___syscall6,
    "_pthread_cleanup_push": _pthread_cleanup_push,
    "___assert_fail": ___assert_fail,
    "___buildEnvironment": ___buildEnvironment,
    "_signal": _signal,
    "___setErrNo": ___setErrNo,
    "_sbrk": _sbrk,
    "_emscripten_memcpy_big": _emscripten_memcpy_big,
    "__exit": __exit,
    "_pthread_self": _pthread_self,
    "_getenv": _getenv,
    "___syscall54": ___syscall54,
    "___unlock": ___unlock,
    "___syscall3": ___syscall3,
    "_sysconf": _sysconf,
    "___lock": ___lock,
    "_abort": _abort,
    "___syscall5": ___syscall5,
    "___syscall4": ___syscall4,
    "_time": _time,
    "___syscall140": ___syscall140,
    "_exit": _exit,
    "___syscall145": ___syscall145,
    "___syscall146": ___syscall146,
    "STACKTOP": STACKTOP,
    "STACK_MAX": STACK_MAX,
    "tempDoublePtr": tempDoublePtr,
    "ABORT": ABORT,
    "cttz_i8": cttz_i8
};
var asm = function (global, env, buffer) {
    "use asm";
    var a = new global.Int8Array(buffer);
    var b = new global.Int16Array(buffer);
    var c = new global.Int32Array(buffer);
    var d = new global.Uint8Array(buffer);
    var e = new global.Uint16Array(buffer);
    var f = new global.Uint32Array(buffer);
    var g = new global.Float32Array(buffer);
    var h = new global.Float64Array(buffer);
    var i = env.STACKTOP | 0;
    var j = env.STACK_MAX | 0;
    var k = env.tempDoublePtr | 0;
    var l = env.ABORT | 0;
    var m = env.cttz_i8 | 0;
    var n = 0;
    var o = 0;
    var p = 0;
    var q = 0;
    var r = global.NaN, s = global.Infinity;
    var t = 0, u = 0, v = 0, w = 0, x = 0.0, y = 0, z = 0, A = 0, B = 0.0;
    var C = 0;
    var D = 0;
    var E = 0;
    var F = 0;
    var G = 0;
    var H = 0;
    var I = 0;
    var J = 0;
    var K = 0;
    var L = 0;
    var M = global.Math.floor;
    var N = global.Math.abs;
    var O = global.Math.sqrt;
    var P = global.Math.pow;
    var Q = global.Math.cos;
    var R = global.Math.sin;
    var S = global.Math.tan;
    var T = global.Math.acos;
    var U = global.Math.asin;
    var V = global.Math.atan;
    var W = global.Math.atan2;
    var X = global.Math.exp;
    var Y = global.Math.log;
    var Z = global.Math.ceil;
    var _ = global.Math.imul;
    var $ = global.Math.min;
    var aa = global.Math.clz32;
    var ba = env.abort;
    var ca = env.assert;
    var da = env.invoke_i;
    var ea = env.invoke_ii;
    var fa = env.invoke_iiii;
    var ga = env.invoke_vi;
    var ha = env._pthread_cleanup_pop;
    var ia = env.___syscall221;
    var ja = env.___syscall6;
    var ka = env._pthread_cleanup_push;
    var la = env.___assert_fail;
    var ma = env.___buildEnvironment;
    var na = env._signal;
    var oa = env.___setErrNo;
    var pa = env._sbrk;
    var qa = env._emscripten_memcpy_big;
    var ra = env.__exit;
    var sa = env._pthread_self;
    var ta = env._getenv;
    var ua = env.___syscall54;
    var va = env.___unlock;
    function* wa() {
        return yield* Module.yld_api.___syscall3.apply(null, arguments);
    }
    var xa = env._sysconf;
    var ya = env.___lock;
    var za = env._abort;
    var Aa = env.___syscall5;
    var Ba = env.___syscall4;
    var Ca = env._time;
    var Da = env.___syscall140;
    var Ea = env._exit;
    function* Fa() {
        return yield* Module.yld_api.___syscall145.apply(null, arguments);
    }
    var Ga = env.___syscall146;
    var Ha = 0.0;
    function Ma(a) {
        a = a | 0;
        var b = 0;
        b = i;
        i = i + a | 0;
        i = i + 15 & -16;
        return b | 0;
    }
    function Na() {
        return i | 0;
    }
    function Oa(a) {
        a = a | 0;
        i = a;
    }
    function Pa(a, b) {
        a = a | 0;
        b = b | 0;
        i = a;
        j = b;
    }
    function Qa(a, b) {
        a = a | 0;
        b = b | 0;
        if (!n) {
            n = a;
            o = b;
        }
    }
    function Ra(b) {
        b = b | 0;
        a[k >> 0] = a[b >> 0];
        a[k + 1 >> 0] = a[b + 1 >> 0];
        a[k + 2 >> 0] = a[b + 2 >> 0];
        a[k + 3 >> 0] = a[b + 3 >> 0];
    }
    function Sa(b) {
        b = b | 0;
        a[k >> 0] = a[b >> 0];
        a[k + 1 >> 0] = a[b + 1 >> 0];
        a[k + 2 >> 0] = a[b + 2 >> 0];
        a[k + 3 >> 0] = a[b + 3 >> 0];
        a[k + 4 >> 0] = a[b + 4 >> 0];
        a[k + 5 >> 0] = a[b + 5 >> 0];
        a[k + 6 >> 0] = a[b + 6 >> 0];
        a[k + 7 >> 0] = a[b + 7 >> 0];
    }
    function Ta(a) {
        a = a | 0;
        C = a;
    }
    function Ua() {
        return C | 0;
    }
    function* Va(b, e) {
        b = b | 0;
        e = e | 0;
        var f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0;
        m = i;
        i = i + 144 | 0;
        l = m;
        f = m + 136 | 0;
        g = m + 132 | 0;
        k = m + 128 | 0;
        j = m + 8 | 0;
        h = m + 4 | 0;
        c[m + 140 >> 2] = 0;
        c[f >> 2] = b;
        c[g >> 2] = e;
        if (pe(0) | 0 ? pe(1) | 0 : 0)
            a[22129] = 1;
        ge(c[449] | 0, 0, 1, 0) | 0;
        c[k >> 2] = ta(10160) | 0;
        if (c[k >> 2] | 0) {
            c[h >> 2] = 1;
            c[j >> 2] = 10160;
            while (1) {
                if (!(d[c[k >> 2] >> 0] | 0))
                    break;
                b = c[k >> 2] | 0;
                if ((d[c[k >> 2] >> 0] | 0) == 32) {
                    c[k >> 2] = b + 1;
                    continue;
                }
                m = c[h >> 2] | 0;
                c[h >> 2] = m + 1;
                c[j + (m << 2) >> 2] = b;
                while (1) {
                    if ((d[c[k >> 2] >> 0] | 0) != 32)
                        e = (d[c[k >> 2] >> 0] | 0) != 0;
                    else
                        e = 0;
                    b = c[k >> 2] | 0;
                    if (!e)
                        break;
                    c[k >> 2] = b + 1;
                }
                if (!(d[b >> 0] | 0))
                    continue;
                a[c[k >> 2] >> 0] = 0;
                c[k >> 2] = (c[k >> 2] | 0) + 1;
            }
            yield* Wa(c[h >> 2] | 0, j);
        }
        yield* Wa(c[f >> 2] | 0, c[g >> 2] | 0);
        if (ta(10662) | 0)
            c[5353] = 1;
        c[k >> 2] = ta(10678) | 0;
        if (c[k >> 2] | 0) {
            m = qe(c[k >> 2] | 0) | 0;
            c[5379] = m;
            c[5379] = (c[5379] | 0) < 3 & (c[5379] | 0) != 0 ? 70 : m;
        } else
            c[5379] = 70;
        yield* Db();
        yb();
        if (a[22129] | 0)
            na(2, 1) | 0;
        vc();
        yield* oc();
        a[22131] = 0;
        a[22124] = 1;
        if (!((yield* Za()) | 0))
            Ea(1);
        (yield* $a()) | 0;
        if (!(c[5350] | 0))
            Ea(0);
        (yield* he(21260, l)) | 0;
        Ea(0);
        return 0;
    }
    function* Wa(b, d) {
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0, g = 0, h = 0, j = 0, k = 0;
        k = i;
        i = i + 32 | 0;
        g = k + 16 | 0;
        h = k + 12 | 0;
        f = k + 8 | 0;
        e = k + 4 | 0;
        j = k;
        c[g >> 2] = b;
        c[h >> 2] = d;
        c[397] = 0;
        a:
            while (1) {
                c[f >> 2] = Vd(c[g >> 2] | 0, c[h >> 2] | 0, 10172, 8, e) | 0;
                if ((c[f >> 2] | 0) == -1) {
                    b = 13;
                    break;
                }
                switch (c[f >> 2] | 0) {
                case 0:
                    continue a;
                case 104: {
                        b = 5;
                        break a;
                    }
                case 118: {
                        b = 10;
                        break a;
                    }
                case 99: {
                        c[5350] = 1;
                        continue a;
                    }
                case 105: {
                        a[22129] = 1;
                        continue a;
                    }
                case 108: {
                        c[5351] = 1;
                        continue a;
                    }
                case 113: {
                        c[5354] = 1;
                        continue a;
                    }
                case 115: {
                        c[5353] = 1;
                        continue a;
                    }
                case 119: {
                        c[5352] = 1;
                        continue a;
                    }
                default: {
                        b = 12;
                        break a;
                    }
                }
            }
        if ((b | 0) == 5) {
            yield* Xa(c[c[h >> 2] >> 2] | 0);
            Ea(0);
        } else if ((b | 0) == 10) {
            yield* Bc();
            Ea(0);
        } else if ((b | 0) == 12) {
            yield* Xa(c[c[h >> 2] >> 2] | 0);
            Ea(1);
        } else if ((b | 0) == 13) {
            while (1) {
                if ((c[397] | 0) >= (c[g >> 2] | 0))
                    break;
                c[j >> 2] = (yield* dc(8)) | 0;
                c[c[j >> 2] >> 2] = c[(c[h >> 2] | 0) + (c[397] << 2) >> 2];
                c[(c[j >> 2] | 0) + 4 >> 2] = 0;
                b = c[j >> 2] | 0;
                if (!(c[5325] | 0))
                    c[5355] = b;
                else
                    c[(c[5325] | 0) + 4 >> 2] = b;
                c[5325] = c[j >> 2];
                c[397] = (c[397] | 0) + 1;
                b = 13;
            }
            i = k;
            return;
        }
    }
    function* Xa(a) {
        a = a | 0;
        var b = 0, d = 0, e = 0;
        b = i;
        i = i + 48 | 0;
        d = b;
        e = b + 32 | 0;
        c[e >> 2] = a;
        c[d >> 2] = c[e >> 2];
        c[d + 4 >> 2] = 10288;
        c[d + 8 >> 2] = 10336;
        c[d + 12 >> 2] = 10381;
        c[d + 16 >> 2] = 10436;
        c[d + 20 >> 2] = 10485;
        c[d + 24 >> 2] = 10545;
        c[d + 28 >> 2] = 10605;
        (yield* he(10242, d)) | 0;
        i = b;
        return;
    }
    function* Ya(a) {
        a = a | 0;
        var b = 0;
        b = i;
        i = i + 16 | 0;
        c[b >> 2] = a;
        Ud(1, 10693, 26) | 0;
        Ea(0);
    }
    function* Za() {
        var b = 0, e = 0, f = 0, g = 0, h = 0, j = 0, k = 0;
        k = i;
        i = i + 32 | 0;
        j = k;
        b = k + 16 | 0;
        f = k + 12 | 0;
        g = k + 8 | 0;
        e = k + 4 | 0;
        h = k + 20 | 0;
        c[5380] = 1;
        if (a[22131] | 0) {
            c[b >> 2] = 0;
            j = c[b >> 2] | 0;
            i = k;
            return j | 0;
        }
        a:
            do
                if (c[5351] | 0 ? d[22124] | 0 : 0) {
                    a[h >> 0] = (yield* wc(10719, 2)) | 0;
                    a[h >> 0] = (yield* wc(10721, 2)) | 0;
                    a[h >> 0] = (yield* wc(10723, 2)) | 0;
                    a[h >> 0] = (yield* wc(10725, 2)) | 0;
                    a[h >> 0] = (yield* wc(10727, 2)) | 0;
                    a[h >> 0] = (yield* wc(10729, 2)) | 0;
                    c[e >> 2] = 1400;
                    while (1) {
                        if (!(c[c[e >> 2] >> 2] | 0))
                            break a;
                        yield* Cb(c[c[e >> 2] >> 2] | 0);
                        c[e >> 2] = (c[e >> 2] | 0) + 4;
                    }
                }
            while (0);
        if (!(c[5355] | 0)) {
            yield* _a(c[479] | 0);
            a[22131] = 1;
            c[b >> 2] = 1;
            j = c[b >> 2] | 0;
            i = k;
            return j | 0;
        }
        c[f >> 2] = Xd(c[c[5355] >> 2] | 0, 10731) | 0;
        if (!(c[f >> 2] | 0)) {
            h = c[508] | 0;
            c[j >> 2] = c[c[5355] >> 2];
            (yield* _d(h, 10733, j)) | 0;
            Ea(1);
        }
        yield* _a(c[f >> 2] | 0);
        c[g >> 2] = c[5355];
        c[5361] = c[c[g >> 2] >> 2];
        c[5355] = c[(c[g >> 2] | 0) + 4 >> 2];
        se(c[g >> 2] | 0);
        c[b >> 2] = 1;
        j = c[b >> 2] | 0;
        i = k;
        return j | 0;
    }
    function* _a(b) {
        b = b | 0;
        var d = 0, e = 0;
        e = i;
        i = i + 16 | 0;
        d = e;
        c[d >> 2] = b;
        if (!(a[22124] | 0))
            (yield* xd(c[5329] | 0)) | 0;
        c[5329] = c[d >> 2];
        a[22124] = 0;
        i = e;
        return;
    }
    function* $a() {
        var e = 0, f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, U = 0, V = 0, W = 0, X = 0, Y = 0, Z = 0, _ = 0, $ = 0, aa = 0, ba = 0, ca = 0, da = 0, ea = 0, fa = 0, ga = 0, ha = 0, ia = 0, ja = 0, ka = 0, la = 0, ma = 0, na = 0, oa = 0, pa = 0, qa = 0, ra = 0, sa = 0, ta = 0, ua = 0, va = 0, wa = 0, xa = 0, ya = 0, za = 0, Aa = 0, Ba = 0, Ca = 0, Da = 0, Fa = 0, Ga = 0, Ha = 0, Ia = 0, Ja = 0, Ka = 0, La = 0, Ma = 0, Na = 0, Oa = 0, Pa = 0, Qa = 0, Ra = 0, Sa = 0, Ta = 0, Ua = 0, Va = 0, Wa = 0, Xa = 0, Ya = 0, Za = 0, _a = 0, $a = 0, cb = 0, db = 0, eb = 0, fb = 0, gb = 0, hb = 0, ib = 0, jb = 0, kb = 0, lb = 0, mb = 0, nb = 0, ob = 0, pb = 0, qb = 0, rb = 0, sb = 0, tb = 0, ub = 0, vb = 0, wb = 0, xb = 0, yb = 0, zb = 0, Ab = 0, Bb = 0, Cb = 0, Db = 0, Eb = 0;
        Eb = i;
        i = i + 2128 | 0;
        Ka = Eb + 816 | 0;
        Ja = Eb + 808 | 0;
        Ia = Eb + 800 | 0;
        Ha = Eb + 792 | 0;
        Ga = Eb + 784 | 0;
        Fa = Eb + 776 | 0;
        Da = Eb + 768 | 0;
        Ca = Eb + 760 | 0;
        Ba = Eb + 752 | 0;
        za = Eb + 744 | 0;
        ya = Eb + 736 | 0;
        xa = Eb + 728 | 0;
        wa = Eb + 720 | 0;
        va = Eb + 712 | 0;
        ua = Eb + 704 | 0;
        ta = Eb + 696 | 0;
        sa = Eb + 688 | 0;
        ra = Eb + 680 | 0;
        qa = Eb + 672 | 0;
        pa = Eb + 664 | 0;
        na = Eb + 656 | 0;
        ma = Eb + 648 | 0;
        la = Eb + 640 | 0;
        ka = Eb + 632 | 0;
        ja = Eb + 624 | 0;
        ha = Eb + 616 | 0;
        ga = Eb + 608 | 0;
        fa = Eb + 600 | 0;
        ea = Eb + 592 | 0;
        da = Eb + 584 | 0;
        ca = Eb + 576 | 0;
        ba = Eb + 568 | 0;
        aa = Eb + 560 | 0;
        $ = Eb + 552 | 0;
        Z = Eb + 544 | 0;
        Y = Eb + 536 | 0;
        X = Eb + 528 | 0;
        W = Eb + 520 | 0;
        V = Eb + 504 | 0;
        U = Eb + 496 | 0;
        T = Eb + 488 | 0;
        S = Eb + 480 | 0;
        Q = Eb + 472 | 0;
        P = Eb + 464 | 0;
        O = Eb + 456 | 0;
        N = Eb + 448 | 0;
        M = Eb + 440 | 0;
        L = Eb + 432 | 0;
        K = Eb + 424 | 0;
        I = Eb + 416 | 0;
        H = Eb + 408 | 0;
        G = Eb + 400 | 0;
        F = Eb + 392 | 0;
        E = Eb + 384 | 0;
        D = Eb + 376 | 0;
        C = Eb + 368 | 0;
        B = Eb + 360 | 0;
        A = Eb + 352 | 0;
        y = Eb + 344 | 0;
        x = Eb + 336 | 0;
        w = Eb + 328 | 0;
        v = Eb + 320 | 0;
        u = Eb + 312 | 0;
        t = Eb + 304 | 0;
        s = Eb + 296 | 0;
        r = Eb + 288 | 0;
        q = Eb + 280 | 0;
        kb = Eb + 272 | 0;
        jb = Eb + 264 | 0;
        ib = Eb + 256 | 0;
        hb = Eb + 248 | 0;
        gb = Eb + 232 | 0;
        fb = Eb + 224 | 0;
        eb = Eb + 216 | 0;
        db = Eb + 208 | 0;
        cb = Eb + 200 | 0;
        $a = Eb + 192 | 0;
        _a = Eb + 184 | 0;
        Za = Eb + 176 | 0;
        Ya = Eb + 168 | 0;
        Xa = Eb + 160 | 0;
        Wa = Eb + 152 | 0;
        Va = Eb + 144 | 0;
        Ua = Eb + 136 | 0;
        Ta = Eb + 128 | 0;
        Sa = Eb + 120 | 0;
        Ra = Eb + 112 | 0;
        Qa = Eb + 104 | 0;
        Pa = Eb + 96 | 0;
        Oa = Eb + 88 | 0;
        Na = Eb + 80 | 0;
        Ma = Eb + 72 | 0;
        La = Eb + 64 | 0;
        Aa = Eb + 56 | 0;
        oa = Eb + 48 | 0;
        ia = Eb + 40 | 0;
        _ = Eb + 32 | 0;
        R = Eb + 24 | 0;
        J = Eb + 16 | 0;
        z = Eb + 8 | 0;
        p = Eb;
        yb = Eb + 1712 | 0;
        nb = Eb + 1708 | 0;
        rb = Eb + 1704 | 0;
        lb = Eb + 1700 | 0;
        zb = Eb + 1696 | 0;
        vb = Eb + 1720 | 0;
        tb = Eb + 1692 | 0;
        wb = Eb + 1688 | 0;
        Bb = Eb + 880 | 0;
        Cb = Eb + 876 | 0;
        xb = Eb + 872 | 0;
        Ab = Eb + 868 | 0;
        mb = Eb + 864 | 0;
        sb = Eb + 860 | 0;
        ub = Eb + 856 | 0;
        qb = Eb + 852 | 0;
        ob = Eb + 848 | 0;
        pb = Eb + 844 | 0;
        m = Eb + 840 | 0;
        j = Eb + 836 | 0;
        o = Eb + 832 | 0;
        l = Eb + 828 | 0;
        k = Eb + 824 | 0;
        n = Eb + 820 | 0;
        c[zb >> 2] = 0;
        c[tb >> 2] = vb;
        c[Bb >> 2] = Eb + 888;
        c[xb >> 2] = 200;
        c[yb >> 2] = 0;
        c[lb >> 2] = 0;
        c[5326] = 0;
        c[5327] = -2;
        c[wb >> 2] = c[tb >> 2];
        c[Cb >> 2] = c[Bb >> 2];
        a:
            while (1) {
                b[c[wb >> 2] >> 1] = c[yb >> 2];
                if (((c[tb >> 2] | 0) + (c[xb >> 2] << 1) + -2 | 0) >>> 0 <= (c[wb >> 2] | 0) >>> 0) {
                    c[sb >> 2] = (((c[wb >> 2] | 0) - (c[tb >> 2] | 0) | 0) / 2 | 0) + 1;
                    if (1e4 <= (c[xb >> 2] | 0) >>> 0) {
                        Db = 286;
                        break;
                    }
                    h = c[xb >> 2] << 1;
                    c[xb >> 2] = h;
                    c[xb >> 2] = 1e4 < (c[xb >> 2] | 0) >>> 0 ? 1e4 : h;
                    c[ub >> 2] = c[tb >> 2];
                    c[qb >> 2] = re(((c[xb >> 2] | 0) * 6 | 0) + 3 | 0) | 0;
                    if (!(c[qb >> 2] | 0)) {
                        Db = 286;
                        break;
                    }
                    Ce(c[qb >> 2] | 0, c[tb >> 2] | 0, c[sb >> 2] << 1 | 0) | 0;
                    c[tb >> 2] = c[qb >> 2];
                    c[ob >> 2] = (c[xb >> 2] << 1) + 3;
                    c[qb >> 2] = (c[qb >> 2] | 0) + ((((c[ob >> 2] | 0) >>> 0) / 4 | 0) << 2);
                    Ce(c[qb >> 2] | 0, c[Bb >> 2] | 0, c[sb >> 2] << 2 | 0) | 0;
                    c[Bb >> 2] = c[qb >> 2];
                    c[pb >> 2] = (c[xb >> 2] << 2) + 3;
                    c[qb >> 2] = (c[qb >> 2] | 0) + ((((c[pb >> 2] | 0) >>> 0) / 4 | 0) << 2);
                    if ((c[ub >> 2] | 0) != (vb | 0))
                        se(c[ub >> 2] | 0);
                    c[wb >> 2] = (c[tb >> 2] | 0) + (c[sb >> 2] << 1) + -2;
                    c[Cb >> 2] = (c[Bb >> 2] | 0) + (c[sb >> 2] << 2) + -4;
                    if (((c[tb >> 2] | 0) + (c[xb >> 2] << 1) + -2 | 0) >>> 0 <= (c[wb >> 2] | 0) >>> 0) {
                        Db = 285;
                        break;
                    }
                }
                c[nb >> 2] = b[2392 + (c[yb >> 2] << 1) >> 1];
                do
                    if ((c[nb >> 2] | 0) != -144) {
                        if ((c[5327] | 0) == -2)
                            c[5327] = (yield* bb()) | 0;
                        if ((c[5327] | 0) <= 0) {
                            c[zb >> 2] = 0;
                            c[5327] = 0;
                        } else {
                            if ((c[5327] | 0) >>> 0 <= 292)
                                e = d[10758 + (c[5327] | 0) >> 0] | 0;
                            else
                                e = 2;
                            c[zb >> 2] = e;
                        }
                        c[nb >> 2] = (c[nb >> 2] | 0) + (c[zb >> 2] | 0);
                        if (!((c[nb >> 2] | 0) < 0 | 719 < (c[nb >> 2] | 0)) ? (b[2788 + (c[nb >> 2] << 1) >> 1] | 0) == (c[zb >> 2] | 0) : 0) {
                            c[nb >> 2] = b[4228 + (c[nb >> 2] << 1) >> 1];
                            e = c[nb >> 2] | 0;
                            if ((c[nb >> 2] | 0) <= 0) {
                                if ((e | 0) == 0 | (c[nb >> 2] | 0) == -16) {
                                    Db = 269;
                                    break;
                                }
                                c[nb >> 2] = 0 - (c[nb >> 2] | 0);
                                Db = 29;
                                break;
                            }
                            if ((e | 0) == 2) {
                                Db = 284;
                                break a;
                            }
                            if (c[5327] | 0)
                                c[5327] = -2;
                            h = (c[Cb >> 2] | 0) + 4 | 0;
                            c[Cb >> 2] = h;
                            c[h >> 2] = c[5328];
                            if (c[lb >> 2] | 0)
                                c[lb >> 2] = (c[lb >> 2] | 0) + -1;
                            c[yb >> 2] = c[nb >> 2];
                        } else
                            Db = 28;
                    } else
                        Db = 28;
                while (0);
                if ((Db | 0) == 28) {
                    c[nb >> 2] = d[11051 + (c[yb >> 2] | 0) >> 0];
                    if (!(c[nb >> 2] | 0))
                        Db = 269;
                    else
                        Db = 29;
                }
                do
                    if ((Db | 0) == 29) {
                        Db = 0;
                        c[mb >> 2] = d[11249 + (c[nb >> 2] | 0) >> 0];
                        c[Ab >> 2] = c[(c[Cb >> 2] | 0) + (1 - (c[mb >> 2] | 0) << 2) >> 2];
                        b:
                            do
                                switch (c[nb >> 2] | 0) {
                                case 27: {
                                        Db = 53;
                                        break a;
                                    }
                                case 2: {
                                        c[Ab >> 2] = 0;
                                        if (!((d[22129] | 0) == 0 | (c[5354] | 0) != 0)) {
                                            yield* Bc();
                                            yield* Ac();
                                        }
                                        break;
                                    }
                                case 4: {
                                        yield* qc();
                                        break;
                                    }
                                case 5: {
                                        yield* qc();
                                        break;
                                    }
                                case 6: {
                                        c[lb >> 2] = 0;
                                        yield* oc();
                                        break;
                                    }
                                case 8: {
                                        yield* mc(11362, p);
                                        break;
                                    }
                                case 9: {
                                        c[Ab >> 2] = 0;
                                        break;
                                    }
                                case 13: {
                                        c[Ab >> 2] = 0;
                                        break;
                                    }
                                case 20: {
                                        c[Ab >> 2] = c[c[Cb >> 2] >> 2];
                                        break;
                                    }
                                case 21: {
                                        yield* Cc(22125);
                                        break;
                                    }
                                case 22: {
                                        yield* xc();
                                        break;
                                    }
                                case 23: {
                                        if (c[c[Cb >> 2] >> 2] & 2 | 0)
                                            yield* mc(11382, z);
                                        if (c[c[Cb >> 2] >> 2] & 1 | 0) {
                                            yield* pc(11407);
                                            break b;
                                        } else {
                                            yield* pc(11409);
                                            break b;
                                        }
                                    }
                                case 24: {
                                        c[Ab >> 2] = 0;
                                        yield* pc(11411);
                                        yield* pc(c[c[Cb >> 2] >> 2] | 0);
                                        se(c[c[Cb >> 2] >> 2] | 0);
                                        break;
                                    }
                                case 25:
                                    if (!(c[5356] | 0)) {
                                        yield* lc(11413, J);
                                        break b;
                                    } else {
                                        h = c[5348] | 0;
                                        c[R >> 2] = c[5356];
                                        (yield* $d(h, 11439, R)) | 0;
                                        yield* pc(c[5348] | 0);
                                        break b;
                                    }
                                case 26: {
                                        yield* mc(11445, _);
                                        if (!(c[5358] | 0)) {
                                            yield* lc(11464, ia);
                                            break b;
                                        } else {
                                            h = c[5348] | 0;
                                            c[oa >> 2] = c[5358];
                                            (yield* $d(h, 11439, oa)) | 0;
                                            yield* pc(c[5348] | 0);
                                            break b;
                                        }
                                    }
                                case 28: {
                                        yield* pc(11487);
                                        break;
                                    }
                                case 29: {
                                        yield* pc(11489);
                                        break;
                                    }
                                case 30: {
                                        c[c[Cb >> 2] >> 2] = c[5356];
                                        h = c[5359] | 0;
                                        c[5359] = h + 1;
                                        c[5356] = h;
                                        break;
                                    }
                                case 31: {
                                        if (c[(c[Cb >> 2] | 0) + -4 >> 2] & 2 | 0)
                                            yield* mc(11491, Aa);
                                        if (c[(c[Cb >> 2] | 0) + -4 >> 2] & 8 | 0)
                                            yield* lc(11526, La);
                                        if (!(c[(c[Cb >> 2] | 0) + -4 >> 2] & 16))
                                            yield* pc(11409);
                                        h = c[5359] | 0;
                                        c[5359] = h + 1;
                                        c[(c[Cb >> 2] | 0) + -4 >> 2] = h;
                                        h = c[5348] | 0;
                                        c[Ma >> 2] = c[(c[Cb >> 2] | 0) + -4 >> 2];
                                        (yield* $d(h, 11551, Ma)) | 0;
                                        yield* pc(c[5348] | 0);
                                        break;
                                    }
                                case 32: {
                                        if (c[(c[Cb >> 2] | 0) + -4 >> 2] & 8 | 0)
                                            yield* lc(11557, Na);
                                        if (c[(c[Cb >> 2] | 0) + -4 >> 2] & 16 | 0)
                                            yield* pc(11583);
                                        h = c[5359] | 0;
                                        c[5359] = h + 1;
                                        c[(c[Cb >> 2] | 0) + -4 >> 2] = h;
                                        h = c[5348] | 0;
                                        g = c[5356] | 0;
                                        c[Oa >> 2] = c[(c[Cb >> 2] | 0) + -4 >> 2];
                                        c[Oa + 4 >> 2] = g;
                                        (yield* $d(h, 11585, Oa)) | 0;
                                        yield* pc(c[5348] | 0);
                                        c[Ab >> 2] = c[5358];
                                        h = c[5359] | 0;
                                        c[5359] = h + 1;
                                        c[5358] = h;
                                        h = c[5348] | 0;
                                        c[Pa >> 2] = c[5358];
                                        (yield* $d(h, 11551, Pa)) | 0;
                                        yield* pc(c[5348] | 0);
                                        break;
                                    }
                                case 33: {
                                        if (c[(c[Cb >> 2] | 0) + -4 >> 2] & 2 | 0)
                                            yield* mc(11596, Qa);
                                        if (c[(c[Cb >> 2] | 0) + -4 >> 2] & 8 | 0)
                                            yield* lc(11631, Ra);
                                        e = c[5348] | 0;
                                        f = c[(c[Cb >> 2] | 0) + -28 >> 2] | 0;
                                        g = c[(c[Cb >> 2] | 0) + -16 >> 2] | 0;
                                        if (c[(c[Cb >> 2] | 0) + -4 >> 2] & 16 | 0) {
                                            c[Sa >> 2] = f;
                                            c[Sa + 4 >> 2] = g;
                                            (yield* $d(e, 11656, Sa)) | 0;
                                        } else {
                                            c[Ta >> 2] = f;
                                            c[Ta + 4 >> 2] = g;
                                            (yield* $d(e, 11667, Ta)) | 0;
                                        }
                                        yield* pc(c[5348] | 0);
                                        break;
                                    }
                                case 34: {
                                        h = c[5348] | 0;
                                        g = c[5356] | 0;
                                        c[Ua >> 2] = c[5358];
                                        c[Ua + 4 >> 2] = g;
                                        (yield* $d(h, 11656, Ua)) | 0;
                                        yield* pc(c[5348] | 0);
                                        c[5356] = c[(c[Cb >> 2] | 0) + -52 >> 2];
                                        c[5358] = c[(c[Cb >> 2] | 0) + -20 >> 2];
                                        break;
                                    }
                                case 35: {
                                        if (c[(c[Cb >> 2] | 0) + -4 >> 2] & 8 | 0)
                                            yield* lc(11679, Va);
                                        c[(c[Cb >> 2] | 0) + -4 >> 2] = c[5357];
                                        h = c[5359] | 0;
                                        c[5359] = h + 1;
                                        c[5357] = h;
                                        h = c[5348] | 0;
                                        c[Wa >> 2] = c[5357];
                                        (yield* $d(h, 11695, Wa)) | 0;
                                        yield* pc(c[5348] | 0);
                                        break;
                                    }
                                case 36: {
                                        h = c[5348] | 0;
                                        c[Xa >> 2] = c[5357];
                                        (yield* $d(h, 11551, Xa)) | 0;
                                        yield* pc(c[5348] | 0);
                                        c[5357] = c[(c[Cb >> 2] | 0) + -20 >> 2];
                                        break;
                                    }
                                case 37: {
                                        h = c[5359] | 0;
                                        c[5359] = h + 1;
                                        c[c[Cb >> 2] >> 2] = h;
                                        h = c[5348] | 0;
                                        c[Ya >> 2] = c[c[Cb >> 2] >> 2];
                                        (yield* $d(h, 11551, Ya)) | 0;
                                        yield* pc(c[5348] | 0);
                                        break;
                                    }
                                case 38: {
                                        if (c[c[Cb >> 2] >> 2] & 8 | 0)
                                            yield* lc(11679, Za);
                                        c[c[Cb >> 2] >> 2] = c[5356];
                                        h = c[5359] | 0;
                                        c[5359] = h + 1;
                                        c[5356] = h;
                                        h = c[5348] | 0;
                                        c[_a >> 2] = c[5356];
                                        (yield* $d(h, 11695, _a)) | 0;
                                        yield* pc(c[5348] | 0);
                                        break;
                                    }
                                case 39: {
                                        h = c[5348] | 0;
                                        g = c[5356] | 0;
                                        c[$a >> 2] = c[(c[Cb >> 2] | 0) + -28 >> 2];
                                        c[$a + 4 >> 2] = g;
                                        (yield* $d(h, 11656, $a)) | 0;
                                        yield* pc(c[5348] | 0);
                                        c[5356] = c[(c[Cb >> 2] | 0) + -16 >> 2];
                                        break;
                                    }
                                case 40: {
                                        c[Ab >> 2] = 0;
                                        break;
                                    }
                                case 41: {
                                        yield* mc(11701, cb);
                                        break;
                                    }
                                case 45: {
                                        yield* pc(11717);
                                        yield* pc(c[c[Cb >> 2] >> 2] | 0);
                                        se(c[c[Cb >> 2] >> 2] | 0);
                                        break;
                                    }
                                case 46: {
                                        if (c[c[Cb >> 2] >> 2] & 8 | 0)
                                            yield* lc(11719, db);
                                        yield* pc(11744);
                                        break;
                                    }
                                case 48: {
                                        yield* mc(11746, eb);
                                        h = c[5359] | 0;
                                        c[5359] = h + 1;
                                        c[c[Cb >> 2] >> 2] = h;
                                        h = c[5348] | 0;
                                        g = c[5357] | 0;
                                        c[fb >> 2] = c[c[Cb >> 2] >> 2];
                                        c[fb + 4 >> 2] = g;
                                        (yield* $d(h, 11774, fb)) | 0;
                                        yield* pc(c[5348] | 0);
                                        c[5357] = c[c[Cb >> 2] >> 2];
                                        break;
                                    }
                                case 50: {
                                        yield* kc(c[(c[Cb >> 2] | 0) + -20 >> 2] | 0, c[c[Cb >> 2] >> 2] | 0);
                                        c[m >> 2] = (yield* gc(c[(c[Cb >> 2] | 0) + -20 >> 2] | 0)) | 0;
                                        c[j >> 2] = (yield* gc(c[c[Cb >> 2] >> 2] | 0)) | 0;
                                        yield* nc(30 + (pd(c[m >> 2] | 0) | 0) + (pd(c[j >> 2] | 0) | 0) | 0);
                                        c[38] = (yield* wc(c[(c[Cb >> 2] | 0) + -28 >> 2] | 0, 3)) | 0;
                                        h = c[5348] | 0;
                                        f = c[m >> 2] | 0;
                                        g = c[j >> 2] | 0;
                                        c[gb >> 2] = c[38];
                                        c[gb + 4 >> 2] = f;
                                        c[gb + 8 >> 2] = g;
                                        (yield* $d(h, 11784, gb)) | 0;
                                        yield* pc(c[5348] | 0);
                                        a[(c[5362] | 0) + ((c[38] | 0) * 28 | 0) + 1 >> 0] = c[(c[Cb >> 2] | 0) + -32 >> 2];
                                        jc(c[(c[Cb >> 2] | 0) + -20 >> 2] | 0);
                                        jc(c[c[Cb >> 2] >> 2] | 0);
                                        c[(c[Cb >> 2] | 0) + -36 >> 2] = c[5359];
                                        c[5359] = 1;
                                        break;
                                    }
                                case 51: {
                                        yield* pc(11795);
                                        c[5359] = c[(c[Cb >> 2] | 0) + -48 >> 2];
                                        c[38] = -1;
                                        break;
                                    }
                                case 52: {
                                        c[Ab >> 2] = 0;
                                        break;
                                    }
                                case 53: {
                                        c[Ab >> 2] = 1;
                                        yield* mc(11799, hb);
                                        break;
                                    }
                                case 54: {
                                        c[Ab >> 2] = 0;
                                        break;
                                    }
                                case 56: {
                                        c[Ab >> 2] = 0;
                                        break;
                                    }
                                case 57: {
                                        c[Ab >> 2] = c[(c[Cb >> 2] | 0) + -4 >> 2];
                                        break;
                                    }
                                case 58: {
                                        c[Ab >> 2] = c[(c[Cb >> 2] | 0) + -4 >> 2];
                                        break;
                                    }
                                case 59: {
                                        c[Ab >> 2] = (yield* fc(0, (yield* wc(c[c[Cb >> 2] >> 2] | 0, 0)) | 0, 0)) | 0;
                                        break;
                                    }
                                case 60: {
                                        c[Ab >> 2] = (yield* fc(0, (yield* wc(c[(c[Cb >> 2] | 0) + -8 >> 2] | 0, 1)) | 0, 0)) | 0;
                                        break;
                                    }
                                case 61: {
                                        c[Ab >> 2] = (yield* fc(0, (yield* wc(c[(c[Cb >> 2] | 0) + -8 >> 2] | 0, 1)) | 0, 1)) | 0;
                                        yield* mc(11814, ib);
                                        break;
                                    }
                                case 62: {
                                        c[Ab >> 2] = (yield* fc(0, (yield* wc(c[(c[Cb >> 2] | 0) + -8 >> 2] | 0, 1)) | 0, 1)) | 0;
                                        yield* mc(11814, jb);
                                        break;
                                    }
                                case 63: {
                                        c[Ab >> 2] = (yield* fc(c[(c[Cb >> 2] | 0) + -8 >> 2] | 0, (yield* wc(c[c[Cb >> 2] >> 2] | 0, 0)) | 0, 0)) | 0;
                                        break;
                                    }
                                case 64: {
                                        c[Ab >> 2] = (yield* fc(c[(c[Cb >> 2] | 0) + -16 >> 2] | 0, (yield* wc(c[(c[Cb >> 2] | 0) + -8 >> 2] | 0, 1)) | 0, 0)) | 0;
                                        break;
                                    }
                                case 65: {
                                        c[Ab >> 2] = (yield* fc(c[(c[Cb >> 2] | 0) + -20 >> 2] | 0, (yield* wc(c[(c[Cb >> 2] | 0) + -8 >> 2] | 0, 1)) | 0, 1)) | 0;
                                        yield* mc(11814, kb);
                                        break;
                                    }
                                case 66: {
                                        c[Ab >> 2] = (yield* fc(c[(c[Cb >> 2] | 0) + -20 >> 2] | 0, (yield* wc(c[(c[Cb >> 2] | 0) + -8 >> 2] | 0, 1)) | 0, 1)) | 0;
                                        yield* mc(11814, q);
                                        break;
                                    }
                                case 67: {
                                        c[Ab >> 2] = 0;
                                        break;
                                    }
                                case 69: {
                                        if (c[c[Cb >> 2] >> 2] & 2 | 0)
                                            yield* mc(11838, r);
                                        if (c[c[Cb >> 2] >> 2] & 8 | 0)
                                            yield* lc(11861, s);
                                        c[Ab >> 2] = (yield* fc(0, 0, 0)) | 0;
                                        break;
                                    }
                                case 70: {
                                        h = c[5348] | 0;
                                        c[t >> 2] = 0 - ((yield* wc(c[(c[Cb >> 2] | 0) + -8 >> 2] | 0, 1)) | 0);
                                        (yield* $d(h, 11875, t)) | 0;
                                        yield* pc(c[5348] | 0);
                                        c[Ab >> 2] = (yield* fc(0, 1, 0)) | 0;
                                        break;
                                    }
                                case 71: {
                                        if (c[c[Cb >> 2] >> 2] & 2 | 0)
                                            yield* mc(11838, u);
                                        if (c[c[Cb >> 2] >> 2] & 8 | 0)
                                            yield* lc(11861, v);
                                        c[Ab >> 2] = (yield* fc(c[(c[Cb >> 2] | 0) + -8 >> 2] | 0, 0, 0)) | 0;
                                        break;
                                    }
                                case 72: {
                                        h = c[5348] | 0;
                                        c[w >> 2] = 0 - ((yield* wc(c[(c[Cb >> 2] | 0) + -8 >> 2] | 0, 1)) | 0);
                                        (yield* $d(h, 11875, w)) | 0;
                                        yield* pc(c[5348] | 0);
                                        c[Ab >> 2] = (yield* fc(c[(c[Cb >> 2] | 0) + -16 >> 2] | 0, 1, 0)) | 0;
                                        break;
                                    }
                                case 73: {
                                        c[Ab >> 2] = 16;
                                        yield* mc(11880, x);
                                        break;
                                    }
                                case 75: {
                                        c[Ab >> 2] = 0;
                                        yield* pc(11916);
                                        if ((c[38] | 0) == -1)
                                            yield* lc(11918, y);
                                        break;
                                    }
                                case 76: {
                                        if (c[c[Cb >> 2] >> 2] & 2 | 0)
                                            yield* mc(11948, A);
                                        if (!(c[c[Cb >> 2] >> 2] & 4))
                                            yield* mc(11979, B);
                                        if (c[c[Cb >> 2] >> 2] & 8 | 0)
                                            yield* lc(12018, C);
                                        if ((c[38] | 0) == -1) {
                                            yield* lc(11918, D);
                                            break b;
                                        }
                                        if (a[(c[5362] | 0) + ((c[38] | 0) * 28 | 0) + 1 >> 0] | 0)
                                            yield* lc(12054, E);
                                        break;
                                    }
                                case 77: {
                                        if ((d[c[Cb >> 2] >> 0] | 0) != 61) {
                                            e = c[5348] | 0;
                                            f = c[(c[Cb >> 2] | 0) + -4 >> 2] | 0;
                                            if ((c[(c[Cb >> 2] | 0) + -4 >> 2] | 0) < 0) {
                                                c[F >> 2] = 0 - f;
                                                (yield* $d(e, 12092, F)) | 0;
                                            } else {
                                                c[G >> 2] = f;
                                                (yield* $d(e, 12098, G)) | 0;
                                            }
                                            yield* pc(c[5348] | 0);
                                        }
                                        break;
                                    }
                                case 78: {
                                        if (c[c[Cb >> 2] >> 2] & 0 | 0)
                                            yield* mc(12103, H);
                                        if (c[c[Cb >> 2] >> 2] & 8 | 0)
                                            yield* lc(12128, I);
                                        if ((d[(c[Cb >> 2] | 0) + -8 >> 0] | 0) != 61) {
                                            h = c[5348] | 0;
                                            c[K >> 2] = d[(c[Cb >> 2] | 0) + -8 >> 0];
                                            (yield* $d(h, 12160, K)) | 0;
                                            yield* pc(c[5348] | 0);
                                        }
                                        e = c[5348] | 0;
                                        f = c[(c[Cb >> 2] | 0) + -12 >> 2] | 0;
                                        if ((c[(c[Cb >> 2] | 0) + -12 >> 2] | 0) < 0) {
                                            c[L >> 2] = 0 - f;
                                            (yield* $d(e, 12163, L)) | 0;
                                        } else {
                                            c[M >> 2] = f;
                                            (yield* $d(e, 12168, M)) | 0;
                                        }
                                        yield* pc(c[5348] | 0);
                                        c[Ab >> 2] = 0;
                                        break;
                                    }
                                case 79: {
                                        yield* mc(12173, N);
                                        h = c[5359] | 0;
                                        c[5359] = h + 1;
                                        c[c[Cb >> 2] >> 2] = h;
                                        h = c[5348] | 0;
                                        c[O >> 2] = c[c[Cb >> 2] >> 2];
                                        (yield* $d(h, 12185, O)) | 0;
                                        yield* pc(c[5348] | 0);
                                        break;
                                    }
                                case 80: {
                                        if (!(!(c[(c[Cb >> 2] | 0) + -12 >> 2] & 8 | 0) ? !(c[c[Cb >> 2] >> 2] & 8 | 0) : 0))
                                            yield* lc(12192, P);
                                        h = c[5348] | 0;
                                        g = c[(c[Cb >> 2] | 0) + -8 >> 2] | 0;
                                        c[Q >> 2] = c[(c[Cb >> 2] | 0) + -8 >> 2];
                                        c[Q + 4 >> 2] = g;
                                        (yield* $d(h, 12216, Q)) | 0;
                                        yield* pc(c[5348] | 0);
                                        c[Ab >> 2] = (c[(c[Cb >> 2] | 0) + -12 >> 2] | c[c[Cb >> 2] >> 2]) & -5;
                                        break;
                                    }
                                case 81: {
                                        yield* mc(12228, S);
                                        h = c[5359] | 0;
                                        c[5359] = h + 1;
                                        c[c[Cb >> 2] >> 2] = h;
                                        h = c[5348] | 0;
                                        c[T >> 2] = c[c[Cb >> 2] >> 2];
                                        (yield* $d(h, 12240, T)) | 0;
                                        yield* pc(c[5348] | 0);
                                        break;
                                    }
                                case 82: {
                                        if (!(!(c[(c[Cb >> 2] | 0) + -12 >> 2] & 8 | 0) ? !(c[c[Cb >> 2] >> 2] & 8 | 0) : 0))
                                            yield* lc(12245, U);
                                        h = c[5359] | 0;
                                        c[5359] = h + 1;
                                        c[o >> 2] = h;
                                        h = c[5348] | 0;
                                        e = c[o >> 2] | 0;
                                        f = c[(c[Cb >> 2] | 0) + -8 >> 2] | 0;
                                        g = c[o >> 2] | 0;
                                        c[V >> 2] = c[(c[Cb >> 2] | 0) + -8 >> 2];
                                        c[V + 4 >> 2] = e;
                                        c[V + 8 >> 2] = f;
                                        c[V + 12 >> 2] = g;
                                        (yield* $d(h, 12269, V)) | 0;
                                        yield* pc(c[5348] | 0);
                                        c[Ab >> 2] = (c[(c[Cb >> 2] | 0) + -12 >> 2] | c[c[Cb >> 2] >> 2]) & -5;
                                        break;
                                    }
                                case 83: {
                                        if (c[c[Cb >> 2] >> 2] & 8 | 0)
                                            yield* lc(12288, W);
                                        c[Ab >> 2] = c[c[Cb >> 2] >> 2] & -5;
                                        yield* mc(12311, X);
                                        yield* pc(12322);
                                        break;
                                    }
                                case 84: {
                                        if (!(!(c[(c[Cb >> 2] | 0) + -8 >> 2] & 8 | 0) ? !(c[c[Cb >> 2] >> 2] & 8 | 0) : 0))
                                            yield* lc(12324, Y);
                                        c[Ab >> 2] = 3;
                                        switch (d[c[(c[Cb >> 2] | 0) + -4 >> 2] >> 0] | 0) {
                                        case 61: {
                                                yield* pc(12356);
                                                break b;
                                            }
                                        case 33: {
                                                yield* pc(12358);
                                                break b;
                                            }
                                        case 60:
                                            if ((d[(c[(c[Cb >> 2] | 0) + -4 >> 2] | 0) + 1 >> 0] | 0) == 61) {
                                                yield* pc(12360);
                                                break b;
                                            } else {
                                                yield* pc(12362);
                                                break b;
                                            }
                                        case 62:
                                            if ((d[(c[(c[Cb >> 2] | 0) + -4 >> 2] | 0) + 1 >> 0] | 0) == 61) {
                                                yield* pc(12364);
                                                break b;
                                            } else {
                                                yield* pc(12366);
                                                break b;
                                            }
                                        default:
                                            break b;
                                        }
                                    }
                                case 85: {
                                        if (!(!(c[(c[Cb >> 2] | 0) + -8 >> 2] & 8 | 0) ? !(c[c[Cb >> 2] >> 2] & 8 | 0) : 0))
                                            yield* lc(12368, Z);
                                        yield* pc(12391);
                                        c[Ab >> 2] = (c[(c[Cb >> 2] | 0) + -8 >> 2] | c[c[Cb >> 2] >> 2]) & -5;
                                        break;
                                    }
                                case 86: {
                                        if (!(!(c[(c[Cb >> 2] | 0) + -8 >> 2] & 8 | 0) ? !(c[c[Cb >> 2] >> 2] & 8 | 0) : 0))
                                            yield* lc(12393, $);
                                        yield* pc(12416);
                                        c[Ab >> 2] = (c[(c[Cb >> 2] | 0) + -8 >> 2] | c[c[Cb >> 2] >> 2]) & -5;
                                        break;
                                    }
                                case 87: {
                                        if (!(!(c[(c[Cb >> 2] | 0) + -8 >> 2] & 8 | 0) ? !(c[c[Cb >> 2] >> 2] & 8 | 0) : 0))
                                            yield* lc(12418, aa);
                                        yield* pc(12441);
                                        c[Ab >> 2] = (c[(c[Cb >> 2] | 0) + -8 >> 2] | c[c[Cb >> 2] >> 2]) & -5;
                                        break;
                                    }
                                case 88: {
                                        if (!(!(c[(c[Cb >> 2] | 0) + -8 >> 2] & 8 | 0) ? !(c[c[Cb >> 2] >> 2] & 8 | 0) : 0))
                                            yield* lc(12443, ba);
                                        yield* pc(12466);
                                        c[Ab >> 2] = (c[(c[Cb >> 2] | 0) + -8 >> 2] | c[c[Cb >> 2] >> 2]) & -5;
                                        break;
                                    }
                                case 89: {
                                        if (!(!(c[(c[Cb >> 2] | 0) + -8 >> 2] & 8 | 0) ? !(c[c[Cb >> 2] >> 2] & 8 | 0) : 0))
                                            yield* lc(12468, ca);
                                        yield* pc(12491);
                                        c[Ab >> 2] = (c[(c[Cb >> 2] | 0) + -8 >> 2] | c[c[Cb >> 2] >> 2]) & -5;
                                        break;
                                    }
                                case 90: {
                                        if (!(!(c[(c[Cb >> 2] | 0) + -8 >> 2] & 8 | 0) ? !(c[c[Cb >> 2] >> 2] & 8 | 0) : 0))
                                            yield* lc(12493, da);
                                        yield* pc(12516);
                                        c[Ab >> 2] = (c[(c[Cb >> 2] | 0) + -8 >> 2] | c[c[Cb >> 2] >> 2]) & -5;
                                        break;
                                    }
                                case 91: {
                                        if (c[c[Cb >> 2] >> 2] & 8 | 0)
                                            yield* lc(12518, ea);
                                        yield* pc(12547);
                                        c[Ab >> 2] = c[c[Cb >> 2] >> 2] & -5;
                                        break;
                                    }
                                case 92: {
                                        c[Ab >> 2] = 1;
                                        e = c[5348] | 0;
                                        f = c[c[Cb >> 2] >> 2] | 0;
                                        if ((c[c[Cb >> 2] >> 2] | 0) < 0) {
                                            c[fa >> 2] = 0 - f;
                                            (yield* $d(e, 12549, fa)) | 0;
                                        } else {
                                            c[ga >> 2] = f;
                                            (yield* $d(e, 12098, ga)) | 0;
                                        }
                                        yield* pc(c[5348] | 0);
                                        break;
                                    }
                                case 93: {
                                        c[l >> 2] = pd(c[c[Cb >> 2] >> 2] | 0) | 0;
                                        c[Ab >> 2] = 1;
                                        if ((c[l >> 2] | 0) == 1 ? (d[c[c[Cb >> 2] >> 2] >> 0] | 0) == 48 : 0)
                                            yield* pc(11916);
                                        else
                                            Db = 210;
                                        do
                                            if ((Db | 0) == 210) {
                                                Db = 0;
                                                if ((c[l >> 2] | 0) == 1 ? (d[c[c[Cb >> 2] >> 2] >> 0] | 0) == 49 : 0) {
                                                    yield* pc(11583);
                                                    break;
                                                }
                                                yield* pc(12554);
                                                yield* pc(c[c[Cb >> 2] >> 2] | 0);
                                                yield* pc(12556);
                                            }
                                        while (0);
                                        se(c[c[Cb >> 2] >> 2] | 0);
                                        break;
                                    }
                                case 94: {
                                        if (c[(c[Cb >> 2] | 0) + -4 >> 2] & 8 | 0)
                                            yield* lc(12558, ha);
                                        c[Ab >> 2] = c[(c[Cb >> 2] | 0) + -4 >> 2] | 1 | 4;
                                        break;
                                    }
                                case 95: {
                                        c[k >> 2] = (yield* wc(c[(c[Cb >> 2] | 0) + -12 >> 2] | 0, 2)) | 0;
                                        if (a[(c[5362] | 0) + ((c[k >> 2] | 0) * 28 | 0) + 1 >> 0] | 0)
                                            c[Ab >> 2] = 8;
                                        else
                                            c[Ab >> 2] = 1;
                                        if (c[(c[Cb >> 2] | 0) + -4 >> 2] | 0) {
                                            c[n >> 2] = (yield* ic(c[(c[Cb >> 2] | 0) + -4 >> 2] | 0)) | 0;
                                            yield* nc(20 + (pd(c[n >> 2] | 0) | 0) | 0);
                                            h = c[5348] | 0;
                                            g = c[n >> 2] | 0;
                                            c[ja >> 2] = c[k >> 2];
                                            c[ja + 4 >> 2] = g;
                                            (yield* $d(h, 12589, ja)) | 0;
                                            jc(c[(c[Cb >> 2] | 0) + -4 >> 2] | 0);
                                        } else {
                                            h = c[5348] | 0;
                                            c[ka >> 2] = c[k >> 2];
                                            (yield* $d(h, 12597, ka)) | 0;
                                        }
                                        yield* pc(c[5348] | 0);
                                        break;
                                    }
                                case 96: {
                                        c[Ab >> 2] = 1;
                                        g = (d[(c[Cb >> 2] | 0) + -4 >> 0] | 0) == 43;
                                        h = c[5348] | 0;
                                        e = c[c[Cb >> 2] >> 2] | 0;
                                        do
                                            if ((c[c[Cb >> 2] >> 2] | 0) < 0) {
                                                e = 0 - e | 0;
                                                f = 0 - (c[c[Cb >> 2] >> 2] | 0) | 0;
                                                if (g) {
                                                    c[la >> 2] = e;
                                                    c[la + 4 >> 2] = f;
                                                    (yield* $d(h, 12602, la)) | 0;
                                                    break;
                                                } else {
                                                    c[ma >> 2] = e;
                                                    c[ma + 4 >> 2] = f;
                                                    (yield* $d(h, 12612, ma)) | 0;
                                                    break;
                                                }
                                            } else {
                                                f = c[c[Cb >> 2] >> 2] | 0;
                                                if (g) {
                                                    c[na >> 2] = e;
                                                    c[na + 4 >> 2] = f;
                                                    (yield* $d(h, 12622, na)) | 0;
                                                    break;
                                                } else {
                                                    c[pa >> 2] = e;
                                                    c[pa + 4 >> 2] = f;
                                                    (yield* $d(h, 12631, pa)) | 0;
                                                    break;
                                                }
                                            }
                                        while (0);
                                        yield* pc(c[5348] | 0);
                                        break;
                                    }
                                case 97: {
                                        c[Ab >> 2] = 1;
                                        e = c[5348] | 0;
                                        f = c[(c[Cb >> 2] | 0) + -4 >> 2] | 0;
                                        do
                                            if ((c[(c[Cb >> 2] | 0) + -4 >> 2] | 0) < 0) {
                                                c[qa >> 2] = 0 - f;
                                                (yield* $d(e, 12640, qa)) | 0;
                                                yield* pc(c[5348] | 0);
                                                e = c[5348] | 0;
                                                f = 0 - (c[(c[Cb >> 2] | 0) + -4 >> 2] | 0) | 0;
                                                if ((d[c[Cb >> 2] >> 0] | 0) == 43) {
                                                    c[ra >> 2] = f;
                                                    (yield* $d(e, 12647, ra)) | 0;
                                                    break;
                                                } else {
                                                    c[sa >> 2] = f;
                                                    (yield* $d(e, 12652, sa)) | 0;
                                                    break;
                                                }
                                            } else {
                                                c[ta >> 2] = f;
                                                (yield* $d(e, 12098, ta)) | 0;
                                                yield* pc(c[5348] | 0);
                                                e = c[5348] | 0;
                                                f = c[(c[Cb >> 2] | 0) + -4 >> 2] | 0;
                                                if ((d[c[Cb >> 2] >> 0] | 0) == 43) {
                                                    c[ua >> 2] = f;
                                                    (yield* $d(e, 12657, ua)) | 0;
                                                    break;
                                                } else {
                                                    c[va >> 2] = f;
                                                    (yield* $d(e, 12662, va)) | 0;
                                                    break;
                                                }
                                            }
                                        while (0);
                                        yield* pc(c[5348] | 0);
                                        break;
                                    }
                                case 98: {
                                        if (c[(c[Cb >> 2] | 0) + -4 >> 2] & 8 | 0)
                                            yield* lc(12667, wa);
                                        yield* pc(12695);
                                        c[Ab >> 2] = 1;
                                        break;
                                    }
                                case 99: {
                                        if (c[(c[Cb >> 2] | 0) + -4 >> 2] & 8 | 0)
                                            yield* lc(12698, xa);
                                        yield* pc(12724);
                                        c[Ab >> 2] = 1;
                                        break;
                                    }
                                case 100: {
                                        if (c[(c[Cb >> 2] | 0) + -4 >> 2] & 8 | 0)
                                            yield* lc(12727, ya);
                                        yield* pc(12754);
                                        c[Ab >> 2] = 1;
                                        break;
                                    }
                                case 101: {
                                        yield* mc(12757, za);
                                        yield* pc(12771);
                                        c[Ab >> 2] = 1;
                                        break;
                                    }
                                case 102: {
                                        yield* mc(12774, Ba);
                                        yield* pc(12790);
                                        c[Ab >> 2] = 1;
                                        break;
                                    }
                                case 103: {
                                        c[Ab >> 2] = (yield* wc(c[c[Cb >> 2] >> 2] | 0, 0)) | 0;
                                        break;
                                    }
                                case 104: {
                                        if (c[(c[Cb >> 2] | 0) + -4 >> 2] & 8 | 0)
                                            yield* lc(12793, Ca);
                                        if (c[(c[Cb >> 2] | 0) + -4 >> 2] & 2 | 0)
                                            yield* mc(12822, Da);
                                        c[Ab >> 2] = (yield* wc(c[(c[Cb >> 2] | 0) + -12 >> 2] | 0, 1)) | 0;
                                        break;
                                    }
                                case 105: {
                                        c[Ab >> 2] = 0;
                                        break;
                                    }
                                case 106: {
                                        c[Ab >> 2] = 1;
                                        break;
                                    }
                                case 107: {
                                        c[Ab >> 2] = 2;
                                        break;
                                    }
                                case 108: {
                                        c[Ab >> 2] = 3;
                                        yield* mc(12846, Fa);
                                        break;
                                    }
                                case 109: {
                                        c[Ab >> 2] = 4;
                                        yield* mc(12863, Ga);
                                        break;
                                    }
                                case 110: {
                                        yield* mc(12877, Ha);
                                        break;
                                    }
                                case 112: {
                                        yield* mc(12898, Ia);
                                        break;
                                    }
                                default: {
                                    }
                                }
                            while (0);
                        c[Cb >> 2] = (c[Cb >> 2] | 0) + (0 - (c[mb >> 2] | 0) << 2);
                        c[wb >> 2] = (c[wb >> 2] | 0) + (0 - (c[mb >> 2] | 0) << 1);
                        h = (c[Cb >> 2] | 0) + 4 | 0;
                        c[Cb >> 2] = h;
                        c[h >> 2] = c[Ab >> 2];
                        c[nb >> 2] = d[12920 + (c[nb >> 2] | 0) >> 0];
                        c[yb >> 2] = (b[5668 + ((c[nb >> 2] | 0) - 53 << 1) >> 1] | 0) + (b[c[wb >> 2] >> 1] | 0);
                        if (0 <= (c[yb >> 2] | 0) & (c[yb >> 2] | 0) <= 719 ? (b[2788 + (c[yb >> 2] << 1) >> 1] | 0) == (b[c[wb >> 2] >> 1] | 0) : 0) {
                            c[yb >> 2] = b[4228 + (c[yb >> 2] << 1) >> 1];
                            break;
                        }
                        c[yb >> 2] = b[5740 + ((c[nb >> 2] | 0) - 53 << 1) >> 1];
                    } else if ((Db | 0) == 269) {
                        Db = 0;
                        if (!(c[lb >> 2] | 0)) {
                            c[5326] = (c[5326] | 0) + 1;
                            yield* lc(13033, Ja);
                        }
                        do
                            if ((c[lb >> 2] | 0) == 3)
                                if ((c[5327] | 0) <= 0)
                                    if (!(c[5327] | 0)) {
                                        Db = 285;
                                        break a;
                                    } else
                                        break;
                                else {
                                    ab(13046, c[zb >> 2] | 0, 21312);
                                    c[5327] = -2;
                                    break;
                                }
                        while (0);
                        c[lb >> 2] = 3;
                        while (1) {
                            c[nb >> 2] = b[2392 + (c[yb >> 2] << 1) >> 1];
                            if ((((c[nb >> 2] | 0) != -144 ? (c[nb >> 2] = (c[nb >> 2] | 0) + 1, 0 <= (c[nb >> 2] | 0) & (c[nb >> 2] | 0) <= 719) : 0) ? (b[2788 + (c[nb >> 2] << 1) >> 1] | 0) == 1 : 0) ? (c[nb >> 2] = b[4228 + (c[nb >> 2] << 1) >> 1], 0 < (c[nb >> 2] | 0)) : 0)
                                break;
                            if ((c[wb >> 2] | 0) == (c[tb >> 2] | 0)) {
                                Db = 285;
                                break a;
                            }
                            ab(13271, d[13073 + (c[yb >> 2] | 0) >> 0] | 0, c[Cb >> 2] | 0);
                            c[Cb >> 2] = (c[Cb >> 2] | 0) + -4;
                            c[wb >> 2] = (c[wb >> 2] | 0) + -2;
                            c[yb >> 2] = b[c[wb >> 2] >> 1];
                        }
                        if ((c[nb >> 2] | 0) == 2) {
                            Db = 284;
                            break a;
                        }
                        h = (c[Cb >> 2] | 0) + 4 | 0;
                        c[Cb >> 2] = h;
                        c[h >> 2] = c[5328];
                        c[yb >> 2] = c[nb >> 2];
                    }
                while (0);
                c[wb >> 2] = (c[wb >> 2] | 0) + 2;
            }
        if ((Db | 0) == 53)
            Ea(0);
        else if ((Db | 0) == 284)
            c[rb >> 2] = 0;
        else if ((Db | 0) == 285)
            c[rb >> 2] = 1;
        else if ((Db | 0) == 286) {
            yield* lc(13286, Ka);
            c[rb >> 2] = 2;
        }
        if ((c[5327] | 0) != 0 & (c[5327] | 0) != -2)
            ab(13303, c[zb >> 2] | 0, 21312);
        while (1) {
            if ((c[wb >> 2] | 0) == (c[tb >> 2] | 0))
                break;
            ab(13333, d[13073 + (b[c[wb >> 2] >> 1] | 0) >> 0] | 0, c[Cb >> 2] | 0);
            c[Cb >> 2] = (c[Cb >> 2] | 0) + -4;
            c[wb >> 2] = (c[wb >> 2] | 0) + -2;
        }
        if ((c[tb >> 2] | 0) == (vb | 0)) {
            Db = c[rb >> 2] | 0;
            i = Eb;
            return Db | 0;
        }
        se(c[tb >> 2] | 0);
        Db = c[rb >> 2] | 0;
        i = Eb;
        return Db | 0;
    }
    function ab(a, b, d) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0;
        f = i;
        i = i + 16 | 0;
        e = f + 8 | 0;
        c[e >> 2] = a;
        c[f + 4 >> 2] = b;
        c[f >> 2] = d;
        if (c[e >> 2] | 0) {
            i = f;
            return;
        }
        c[e >> 2] = 13064;
        i = f;
        return;
    }
    function* bb() {
        var e = 0, f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0;
        C = i;
        i = i + 112 | 0;
        n = C + 40 | 0;
        q = C + 32 | 0;
        p = C + 24 | 0;
        o = C + 16 | 0;
        m = C + 8 | 0;
        l = C;
        z = C + 96 | 0;
        w = C + 92 | 0;
        v = C + 88 | 0;
        t = C + 84 | 0;
        r = C + 80 | 0;
        u = C + 100 | 0;
        y = C + 76 | 0;
        g = C + 72 | 0;
        k = C + 68 | 0;
        h = C + 64 | 0;
        B = C + 60 | 0;
        A = C + 56 | 0;
        j = C + 52 | 0;
        s = C + 48 | 0;
        x = C + 44 | 0;
        if (!(c[5333] | 0)) {
            c[5333] = 1;
            if (!(c[5334] | 0))
                c[5334] = 1;
            if (!(c[5329] | 0))
                c[5329] = c[479];
            if (!(c[5330] | 0))
                c[5330] = c[449];
            if (!(c[5335] | 0 ? (c[c[5335] >> 2] | 0) != 0 : 0)) {
                cb();
                f = (yield* fb(c[5329] | 0, 16384)) | 0;
                c[c[5335] >> 2] = f;
            }
            jb();
        }
        a:
            while (1) {
                c[v >> 2] = c[5338];
                a[c[v >> 2] >> 0] = a[22126] | 0;
                c[t >> 2] = c[v >> 2];
                c[w >> 2] = c[5334];
                b:
                    while (1) {
                        a[u >> 0] = c[156 + (d[c[v >> 2] >> 0] << 2) >> 2];
                        if (b[5812 + (c[w >> 2] << 1) >> 1] | 0) {
                            c[5339] = c[w >> 2];
                            c[5340] = c[v >> 2];
                        }
                        while (1) {
                            e = c[w >> 2] | 0;
                            if ((b[7084 + ((b[6444 + (c[w >> 2] << 1) >> 1] | 0) + (d[u >> 0] | 0) << 1) >> 1] | 0) == (c[w >> 2] | 0))
                                break;
                            c[w >> 2] = b[8302 + (e << 1) >> 1];
                            if ((c[w >> 2] | 0) < 316)
                                continue;
                            a[u >> 0] = c[1180 + (d[u >> 0] << 2) >> 2];
                        }
                        c[w >> 2] = b[8942 + ((b[6444 + (e << 1) >> 1] | 0) + (d[u >> 0] | 0) << 1) >> 1];
                        c[v >> 2] = (c[v >> 2] | 0) + 1;
                        if ((b[6444 + (c[w >> 2] << 1) >> 1] | 0) != 554)
                            continue;
                        c:
                            while (1) {
                                c[r >> 2] = b[5812 + (c[w >> 2] << 1) >> 1];
                                if (!(c[r >> 2] | 0)) {
                                    c[v >> 2] = c[5340];
                                    c[w >> 2] = c[5339];
                                    c[r >> 2] = b[5812 + (c[w >> 2] << 1) >> 1];
                                }
                                c[5331] = c[t >> 2];
                                c[5332] = (c[v >> 2] | 0) - (c[t >> 2] | 0);
                                a[22126] = a[c[v >> 2] >> 0] | 0;
                                a[c[v >> 2] >> 0] = 0;
                                c[5338] = c[v >> 2];
                                d:
                                    while (1) {
                                        switch (c[r >> 2] | 0) {
                                        case 40:
                                            continue a;
                                        case 3: {
                                                f = 28;
                                                break a;
                                            }
                                        case 4: {
                                                f = 29;
                                                break a;
                                            }
                                        case 5: {
                                                f = 30;
                                                break a;
                                            }
                                        case 6: {
                                                f = 31;
                                                break a;
                                            }
                                        case 7: {
                                                f = 32;
                                                break a;
                                            }
                                        case 8: {
                                                f = 33;
                                                break a;
                                            }
                                        case 9: {
                                                f = 34;
                                                break a;
                                            }
                                        case 10: {
                                                f = 35;
                                                break a;
                                            }
                                        case 11: {
                                                f = 36;
                                                break a;
                                            }
                                        case 12: {
                                                f = 37;
                                                break a;
                                            }
                                        case 13: {
                                                f = 38;
                                                break a;
                                            }
                                        case 14: {
                                                f = 39;
                                                break a;
                                            }
                                        case 15: {
                                                f = 40;
                                                break a;
                                            }
                                        case 16: {
                                                f = 41;
                                                break a;
                                            }
                                        case 17: {
                                                f = 42;
                                                break a;
                                            }
                                        case 18: {
                                                f = 43;
                                                break a;
                                            }
                                        case 19: {
                                                f = 44;
                                                break a;
                                            }
                                        case 20: {
                                                f = 45;
                                                break a;
                                            }
                                        case 21: {
                                                f = 46;
                                                break a;
                                            }
                                        case 22: {
                                                f = 47;
                                                break a;
                                            }
                                        case 23: {
                                                f = 48;
                                                break a;
                                            }
                                        case 24: {
                                                f = 49;
                                                break a;
                                            }
                                        case 25: {
                                                f = 50;
                                                break a;
                                            }
                                        case 26: {
                                                f = 51;
                                                break a;
                                            }
                                        case 27: {
                                                f = 52;
                                                break a;
                                            }
                                        case 28: {
                                                f = 53;
                                                break a;
                                            }
                                        case 29: {
                                                f = 54;
                                                break a;
                                            }
                                        case 30: {
                                                f = 55;
                                                break a;
                                            }
                                        case 31: {
                                                f = 56;
                                                break a;
                                            }
                                        case 32: {
                                                f = 57;
                                                break a;
                                            }
                                        case 33: {
                                                f = 58;
                                                break a;
                                            }
                                        case 34: {
                                                f = 59;
                                                break a;
                                            }
                                        case 35: {
                                                f = 60;
                                                break a;
                                            }
                                        case 36: {
                                                f = 61;
                                                break a;
                                            }
                                        case 37: {
                                                f = 62;
                                                break a;
                                            }
                                        case 38: {
                                                f = 63;
                                                break a;
                                            }
                                        case 42: {
                                                f = 75;
                                                break a;
                                            }
                                        case 43: {
                                                f = 76;
                                                break a;
                                            }
                                        case 44: {
                                                f = 86;
                                                break a;
                                            }
                                        case 49:
                                        case 48: {
                                                f = 104;
                                                break a;
                                            }
                                        case 1: {
                                                f = 24;
                                                break b;
                                            }
                                        case 2: {
                                                f = 27;
                                                break b;
                                            }
                                        case 39: {
                                                f = 64;
                                                break b;
                                            }
                                        case 41: {
                                                f = 65;
                                                break b;
                                            }
                                        case 45: {
                                                f = 98;
                                                break b;
                                            }
                                        case 46: {
                                                f = 103;
                                                break b;
                                            }
                                        case 0: {
                                                f = 23;
                                                break d;
                                            }
                                        case 47:
                                            break;
                                        default: {
                                                f = 118;
                                                break b;
                                            }
                                        }
                                        c[s >> 2] = (c[v >> 2] | 0) - (c[5331] | 0) - 1;
                                        a[c[v >> 2] >> 0] = a[22126] | 0;
                                        if (!(c[(c[c[5335] >> 2] | 0) + 44 >> 2] | 0)) {
                                            c[5337] = c[(c[c[5335] >> 2] | 0) + 16 >> 2];
                                            c[c[c[5335] >> 2] >> 2] = c[5329];
                                            c[(c[c[5335] >> 2] | 0) + 44 >> 2] = 1;
                                        }
                                        if ((c[5338] | 0) >>> 0 <= ((c[(c[c[5335] >> 2] | 0) + 4 >> 2] | 0) + (c[5337] | 0) | 0) >>> 0) {
                                            f = 108;
                                            break;
                                        }
                                        switch ((yield* lb()) | 0) {
                                        case 0: {
                                                f = 116;
                                                break c;
                                            }
                                        case 2: {
                                                f = 117;
                                                break d;
                                            }
                                        case 1:
                                            break;
                                        default:
                                            continue a;
                                        }
                                        if (!((yield* nb()) | 0)) {
                                            f = 114;
                                            break b;
                                        }
                                        c[5338] = c[5331];
                                        c[r >> 2] = 47 + (((c[5334] | 0) - 1 | 0) / 2 | 0) + 1;
                                    }
                                if ((f | 0) == 23) {
                                    a[c[v >> 2] >> 0] = a[22126] | 0;
                                    c[v >> 2] = c[5340];
                                    c[w >> 2] = c[5339];
                                    continue;
                                } else if ((f | 0) == 108) {
                                    c[5338] = (c[5331] | 0) + (c[s >> 2] | 0);
                                    c[w >> 2] = ob() | 0;
                                    c[x >> 2] = pb(c[w >> 2] | 0) | 0;
                                    c[t >> 2] = c[5331];
                                    e = c[5338] | 0;
                                    if (c[x >> 2] | 0) {
                                        f = 109;
                                        break;
                                    }
                                    c[v >> 2] = e;
                                    continue;
                                } else if ((f | 0) == 117) {
                                    c[5338] = (c[(c[c[5335] >> 2] | 0) + 4 >> 2] | 0) + (c[5337] | 0);
                                    c[w >> 2] = ob() | 0;
                                    c[v >> 2] = c[5338];
                                    c[t >> 2] = c[5331];
                                    continue;
                                }
                            }
                        if ((f | 0) == 109) {
                            f = e + 1 | 0;
                            c[5338] = f;
                            c[v >> 2] = f;
                            c[w >> 2] = c[x >> 2];
                            continue;
                        } else if ((f | 0) == 116) {
                            c[5338] = (c[5331] | 0) + (c[s >> 2] | 0);
                            c[w >> 2] = ob() | 0;
                            c[v >> 2] = c[5338];
                            c[t >> 2] = c[5331];
                            continue;
                        }
                    }
                if ((f | 0) == 24)
                    if (c[5353] | 0) {
                        yield* lc(13398, l);
                        continue;
                    } else {
                        c[5334] = 3;
                        continue;
                    }
                else if ((f | 0) == 27) {
                    c[5334] = 1;
                    continue;
                } else if ((f | 0) == 64) {
                    c[5380] = (c[5380] | 0) + 1;
                    continue;
                } else if ((f | 0) == 65) {
                    while (1) {
                        f = (yield* kb()) | 0;
                        c[g >> 2] = f;
                        e = c[g >> 2] | 0;
                        if ((f | 0) != 42 ? (c[g >> 2] | 0) != -1 : 0) {
                            if ((e | 0) != 10) {
                                f = 65;
                                continue;
                            }
                            c[5380] = (c[5380] | 0) + 1;
                            f = 65;
                            continue;
                        }
                        if ((e | 0) == 42) {
                            do {
                                f = (yield* kb()) | 0;
                                c[g >> 2] = f;
                            } while ((f | 0) == 42);
                            if ((c[g >> 2] | 0) == 47)
                                continue a;
                            if ((c[g >> 2] | 0) == 10)
                                c[5380] = (c[5380] | 0) + 1;
                        }
                        if ((c[g >> 2] | 0) == -1)
                            break;
                        else
                            f = 65;
                    }
                    (yield* _d(c[508] | 0, 13549, m)) | 0;
                    continue;
                } else if ((f | 0) == 98) {
                    e = d[c[5331] >> 0] | 0;
                    if ((d[c[5331] >> 0] | 0) < 32) {
                        c[p >> 2] = e + 64;
                        yield* lc(13605, p);
                        continue;
                    }
                    f = c[5331] | 0;
                    if ((e | 0) > 126) {
                        c[q >> 2] = d[f >> 0];
                        yield* lc(13628, q);
                        continue;
                    } else {
                        c[n >> 2] = f;
                        yield* lc(13653, n);
                        continue;
                    }
                } else if ((f | 0) == 103) {
                    (yield* ee(c[5331] | 0, c[5332] | 0, 1, c[5330] | 0)) | 0;
                    continue;
                } else if ((f | 0) == 114) {
                    if (0)
                        continue;
                    yield* mb(c[5329] | 0);
                    continue;
                } else if ((f | 0) == 118) {
                    yield* gb(13675);
                    continue;
                }
            }
        switch (f | 0) {
        case 28: {
                c[5380] = (c[5380] | 0) + 1;
                c[5334] = 1;
                c[z >> 2] = 258;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 29: {
                c[z >> 2] = 268;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 30: {
                c[z >> 2] = 269;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 31: {
                c[z >> 2] = 270;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 32: {
                c[z >> 2] = 271;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 33: {
                c[z >> 2] = 272;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 34: {
                c[z >> 2] = 273;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 35: {
                c[z >> 2] = 274;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 36: {
                c[z >> 2] = 275;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 37: {
                c[z >> 2] = 276;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 38: {
                c[z >> 2] = 278;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 39: {
                c[z >> 2] = 279;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 40: {
                c[z >> 2] = 280;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 41: {
                c[z >> 2] = 281;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 42: {
                c[z >> 2] = 277;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 43: {
                c[z >> 2] = 282;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 44: {
                c[z >> 2] = 283;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 45: {
                c[z >> 2] = 285;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 46: {
                c[z >> 2] = 286;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 47: {
                c[z >> 2] = 292;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 48: {
                c[5328] = (yield* cc(c[5331] | 0)) | 0;
                c[z >> 2] = 263;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 49: {
                c[z >> 2] = 284;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 50: {
                c[z >> 2] = 287;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 51: {
                c[z >> 2] = 288;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 52: {
                c[z >> 2] = 289;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 53: {
                c[z >> 2] = 286;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 54: {
                a[21312] = a[c[5331] >> 0] | 0;
                c[z >> 2] = d[c[5331] >> 0];
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 55: {
                c[z >> 2] = 259;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 56: {
                c[z >> 2] = 260;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 57: {
                c[z >> 2] = 261;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 58: {
                a[21312] = a[c[5331] >> 0] | 0;
                c[z >> 2] = d[c[5331] >> 0];
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 59: {
                a[21312] = a[c[5331] >> 0] | 0;
                c[z >> 2] = 265;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 60: {
                a[21312] = 61;
                c[y >> 2] = 1;
                a[c[v >> 2] >> 0] = a[22126] | 0;
                B = (c[t >> 2] | 0) + (c[y >> 2] | 0) | 0;
                c[v >> 2] = B;
                c[5338] = B;
                c[5331] = c[t >> 2];
                c[5332] = (c[v >> 2] | 0) - (c[t >> 2] | 0);
                a[22126] = a[c[v >> 2] >> 0] | 0;
                a[c[v >> 2] >> 0] = 0;
                c[5338] = c[v >> 2];
                c[z >> 2] = 265;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 61: {
                c[5328] = (yield* cc(c[5331] | 0)) | 0;
                c[z >> 2] = 266;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 62: {
                a[21312] = a[c[5331] >> 0] | 0;
                c[z >> 2] = 267;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 63: {
                c[5380] = (c[5380] | 0) + 1;
                c[z >> 2] = 258;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 75: {
                c[5328] = (yield* cc(c[5331] | 0)) | 0;
                c[z >> 2] = 263;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 76: {
                c[h >> 2] = 0;
                c[5328] = (yield* cc(c[5331] | 0)) | 0;
                c[k >> 2] = c[5331];
                while (1) {
                    if (!(d[c[k >> 2] >> 0] | 0))
                        break;
                    if ((d[c[k >> 2] >> 0] | 0) == 10)
                        c[5380] = (c[5380] | 0) + 1;
                    if ((d[c[k >> 2] >> 0] | 0) == 34)
                        c[h >> 2] = (c[h >> 2] | 0) + 1;
                    c[k >> 2] = (c[k >> 2] | 0) + 1;
                }
                if ((c[h >> 2] | 0) != 2)
                    yield* lc(13580, o);
                c[z >> 2] = 262;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 86: {
                c[j >> 2] = pd(c[5331] | 0) | 0;
                if ((d[(c[5331] | 0) + ((c[j >> 2] | 0) - 1) >> 0] | 0) == 46)
                    a[(c[5331] | 0) + ((c[j >> 2] | 0) - 1) >> 0] = 0;
                c[B >> 2] = c[5331];
                c[A >> 2] = c[5331];
                while (1) {
                    e = c[B >> 2] | 0;
                    if ((d[c[B >> 2] >> 0] | 0) != 48)
                        break;
                    c[B >> 2] = e + 1;
                }
                if (!(d[e >> 0] | 0))
                    c[B >> 2] = (c[B >> 2] | 0) + -1;
                while (1) {
                    if (!(d[c[B >> 2] >> 0] | 0))
                        break;
                    y = (d[c[B >> 2] >> 0] | 0) == 92;
                    e = c[B >> 2] | 0;
                    c[B >> 2] = e + 1;
                    if (y) {
                        c[B >> 2] = (c[B >> 2] | 0) + 1;
                        c[5380] = (c[5380] | 0) + 1;
                        continue;
                    } else {
                        x = a[e >> 0] | 0;
                        y = c[A >> 2] | 0;
                        c[A >> 2] = y + 1;
                        a[y >> 0] = x;
                        continue;
                    }
                }
                a[c[A >> 2] >> 0] = 0;
                c[5328] = (yield* cc(c[5331] | 0)) | 0;
                c[z >> 2] = 264;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        case 104: {
                c[z >> 2] = 0;
                B = c[z >> 2] | 0;
                i = C;
                return B | 0;
            }
        }
        return 0;
    }
    function cb() {
        var a = 0, b = 0, d = 0;
        d = i;
        i = i + 16 | 0;
        b = d + 4 | 0;
        a = d;
        if (!(c[5335] | 0)) {
            c[b >> 2] = 1;
            c[5335] = db(c[b >> 2] << 2) | 0;
            ye(c[5335] | 0, 0, c[b >> 2] << 2 | 0) | 0;
            c[5336] = c[b >> 2];
            i = d;
            return;
        }
        if (0 < ((c[5336] | 0) - 1 | 0) >>> 0) {
            i = d;
            return;
        }
        c[a >> 2] = 8;
        c[b >> 2] = (c[5336] | 0) + (c[a >> 2] | 0);
        c[5335] = eb(c[5335] | 0, c[b >> 2] << 2) | 0;
        ye((c[5335] | 0) + (c[5336] << 2) | 0, 0, c[a >> 2] << 2 | 0) | 0;
        c[5336] = c[b >> 2];
        i = d;
        return;
    }
    function db(a) {
        a = a | 0;
        var b = 0, d = 0;
        b = i;
        i = i + 16 | 0;
        d = b;
        c[d >> 2] = a;
        a = re(c[d >> 2] | 0) | 0;
        i = b;
        return a | 0;
    }
    function eb(a, b) {
        a = a | 0;
        b = b | 0;
        var d = 0, e = 0, f = 0;
        d = i;
        i = i + 16 | 0;
        f = d + 4 | 0;
        e = d;
        c[f >> 2] = a;
        c[e >> 2] = b;
        b = te(c[f >> 2] | 0, c[e >> 2] | 0) | 0;
        i = d;
        return b | 0;
    }
    function* fb(a, b) {
        a = a | 0;
        b = b | 0;
        var d = 0, e = 0, f = 0, g = 0;
        g = i;
        i = i + 16 | 0;
        d = g + 8 | 0;
        e = g + 4 | 0;
        f = g;
        c[d >> 2] = a;
        c[e >> 2] = b;
        c[f >> 2] = db(48) | 0;
        if (!(c[f >> 2] | 0))
            yield* gb(13350);
        c[(c[f >> 2] | 0) + 12 >> 2] = c[e >> 2];
        b = db((c[(c[f >> 2] | 0) + 12 >> 2] | 0) + 2 | 0) | 0;
        c[(c[f >> 2] | 0) + 4 >> 2] = b;
        if (!(c[(c[f >> 2] | 0) + 4 >> 2] | 0))
            yield* gb(13350);
        c[(c[f >> 2] | 0) + 20 >> 2] = 1;
        hb(c[f >> 2] | 0, c[d >> 2] | 0);
        i = g;
        return c[f >> 2] | 0;
    }
    function* gb(a) {
        a = a | 0;
        var b = 0, d = 0;
        d = i;
        i = i + 16 | 0;
        b = d;
        d = d + 4 | 0;
        c[d >> 2] = a;
        a = c[508] | 0;
        c[b >> 2] = c[d >> 2];
        (yield* _d(a, 13394, b)) | 0;
        Ea(2);
    }
    function hb(a, b) {
        a = a | 0;
        b = b | 0;
        var d = 0, e = 0, f = 0, g = 0;
        g = i;
        i = i + 16 | 0;
        d = g + 8 | 0;
        e = g + 4 | 0;
        f = g;
        c[d >> 2] = a;
        c[e >> 2] = b;
        c[f >> 2] = c[(hd() | 0) >> 2];
        ib(c[d >> 2] | 0);
        c[c[d >> 2] >> 2] = c[e >> 2];
        c[(c[d >> 2] | 0) + 40 >> 2] = 1;
        if (c[5335] | 0)
            a = c[c[5335] >> 2] | 0;
        else
            a = 0;
        if ((c[d >> 2] | 0) != (a | 0)) {
            c[(c[d >> 2] | 0) + 32 >> 2] = 1;
            c[(c[d >> 2] | 0) + 36 >> 2] = 0;
        }
        if (!(c[e >> 2] | 0)) {
            b = 0;
            e = c[d >> 2] | 0;
            e = e + 24 | 0;
            c[e >> 2] = b;
            e = c[f >> 2] | 0;
            f = hd() | 0;
            c[f >> 2] = e;
            i = g;
            return;
        }
        b = (pe(me(c[e >> 2] | 0) | 0) | 0) > 0 & 1;
        e = c[d >> 2] | 0;
        e = e + 24 | 0;
        c[e >> 2] = b;
        e = c[f >> 2] | 0;
        f = hd() | 0;
        c[f >> 2] = e;
        i = g;
        return;
    }
    function ib(b) {
        b = b | 0;
        var d = 0, e = 0;
        e = i;
        i = i + 16 | 0;
        d = e;
        c[d >> 2] = b;
        if (!(c[d >> 2] | 0)) {
            i = e;
            return;
        }
        c[(c[d >> 2] | 0) + 16 >> 2] = 0;
        a[c[(c[d >> 2] | 0) + 4 >> 2] >> 0] = 0;
        a[(c[(c[d >> 2] | 0) + 4 >> 2] | 0) + 1 >> 0] = 0;
        c[(c[d >> 2] | 0) + 8 >> 2] = c[(c[d >> 2] | 0) + 4 >> 2];
        c[(c[d >> 2] | 0) + 28 >> 2] = 1;
        c[(c[d >> 2] | 0) + 44 >> 2] = 0;
        if (c[5335] | 0)
            b = c[c[5335] >> 2] | 0;
        else
            b = 0;
        if ((c[d >> 2] | 0) != (b | 0)) {
            i = e;
            return;
        }
        jb();
        i = e;
        return;
    }
    function jb() {
        var b = 0;
        c[5337] = c[(c[c[5335] >> 2] | 0) + 16 >> 2];
        b = c[(c[c[5335] >> 2] | 0) + 8 >> 2] | 0;
        c[5338] = b;
        c[5331] = b;
        c[5329] = c[c[c[5335] >> 2] >> 2];
        a[22126] = a[c[5338] >> 0] | 0;
        return;
    }
    function* kb() {
        var b = 0, e = 0, f = 0, g = 0, h = 0;
        h = i;
        i = i + 16 | 0;
        b = h + 8 | 0;
        f = h + 4 | 0;
        g = h;
        a[c[5338] >> 0] = a[22126] | 0;
        a:
            do
                if (!(d[c[5338] >> 0] | 0)) {
                    e = c[5338] | 0;
                    if ((c[5338] | 0) >>> 0 < ((c[(c[c[5335] >> 2] | 0) + 4 >> 2] | 0) + (c[5337] | 0) | 0) >>> 0) {
                        a[e >> 0] = 0;
                        break;
                    }
                    c[g >> 2] = e - (c[5331] | 0);
                    c[5338] = (c[5338] | 0) + 1;
                    switch ((yield* lb()) | 0) {
                    case 2: {
                            yield* mb(c[5329] | 0);
                            break;
                        }
                    case 1:
                        break;
                    case 0: {
                            c[5338] = (c[5331] | 0) + (c[g >> 2] | 0);
                            break a;
                        }
                    default:
                        break a;
                    }
                    if ((yield* nb()) | 0) {
                        c[b >> 2] = -1;
                        g = c[b >> 2] | 0;
                        i = h;
                        return g | 0;
                    }
                    if (!0)
                        yield* mb(c[5329] | 0);
                    c[b >> 2] = (yield* kb()) | 0;
                    g = c[b >> 2] | 0;
                    i = h;
                    return g | 0;
                }
            while (0);
        c[f >> 2] = d[c[5338] >> 0];
        a[c[5338] >> 0] = 0;
        g = (c[5338] | 0) + 1 | 0;
        c[5338] = g;
        a[22126] = a[g >> 0] | 0;
        c[b >> 2] = c[f >> 2];
        g = c[b >> 2] | 0;
        i = h;
        return g | 0;
    }
    function* lb() {
        var b = 0, d = 0, e = 0, f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0;
        o = i;
        i = i + 48 | 0;
        g = o + 36 | 0;
        d = o + 32 | 0;
        f = o + 28 | 0;
        l = o + 24 | 0;
        e = o + 20 | 0;
        m = o + 16 | 0;
        k = o + 12 | 0;
        h = o + 8 | 0;
        n = o + 4 | 0;
        j = o;
        c[d >> 2] = c[(c[c[5335] >> 2] | 0) + 4 >> 2];
        c[f >> 2] = c[5331];
        if ((c[5338] | 0) >>> 0 > ((c[(c[c[5335] >> 2] | 0) + 4 >> 2] | 0) + ((c[5337] | 0) + 1) | 0) >>> 0)
            yield* gb(13419);
        b = (c[5338] | 0) - (c[5331] | 0) | 0;
        if (!(c[(c[c[5335] >> 2] | 0) + 40 >> 2] | 0))
            if ((b - 0 | 0) == 1) {
                c[g >> 2] = 1;
                n = c[g >> 2] | 0;
                i = o;
                return n | 0;
            } else {
                c[g >> 2] = 2;
                n = c[g >> 2] | 0;
                i = o;
                return n | 0;
            }
        c[l >> 2] = b - 1;
        c[e >> 2] = 0;
        while (1) {
            if ((c[e >> 2] | 0) >= (c[l >> 2] | 0))
                break;
            p = c[f >> 2] | 0;
            c[f >> 2] = p + 1;
            p = a[p >> 0] | 0;
            b = c[d >> 2] | 0;
            c[d >> 2] = b + 1;
            a[b >> 0] = p;
            c[e >> 2] = (c[e >> 2] | 0) + 1;
        }
        if ((c[(c[c[5335] >> 2] | 0) + 44 >> 2] | 0) == 2) {
            c[5337] = 0;
            c[(c[c[5335] >> 2] | 0) + 16 >> 2] = 0;
        } else {
            c[k >> 2] = (c[(c[c[5335] >> 2] | 0) + 12 >> 2] | 0) - (c[l >> 2] | 0) - 1;
            while (1) {
                if ((c[k >> 2] | 0) > 0)
                    break;
                if (c[5335] | 0)
                    b = c[c[5335] >> 2] | 0;
                else
                    b = 0;
                c[h >> 2] = b;
                c[n >> 2] = (c[5338] | 0) - (c[(c[h >> 2] | 0) + 4 >> 2] | 0);
                b = c[h >> 2] | 0;
                if (c[(c[h >> 2] | 0) + 20 >> 2] | 0) {
                    c[j >> 2] = c[b + 12 >> 2] << 1;
                    b = (c[h >> 2] | 0) + 12 | 0;
                    d = c[b >> 2] | 0;
                    if ((c[j >> 2] | 0) <= 0) {
                        p = (c[h >> 2] | 0) + 12 | 0;
                        c[p >> 2] = (c[p >> 2] | 0) + ((d >>> 0) / 8 | 0);
                    } else
                        c[b >> 2] = d << 1;
                    p = eb(c[(c[h >> 2] | 0) + 4 >> 2] | 0, (c[(c[h >> 2] | 0) + 12 >> 2] | 0) + 2 | 0) | 0;
                    c[(c[h >> 2] | 0) + 4 >> 2] = p;
                } else
                    c[b + 4 >> 2] = 0;
                if (!(c[(c[h >> 2] | 0) + 4 >> 2] | 0))
                    yield* gb(13475);
                c[5338] = (c[(c[h >> 2] | 0) + 4 >> 2] | 0) + (c[n >> 2] | 0);
                c[k >> 2] = (c[(c[c[5335] >> 2] | 0) + 12 >> 2] | 0) - (c[l >> 2] | 0) - 1;
            }
            if ((c[k >> 2] | 0) > 8192)
                c[k >> 2] = 8192;
            while (1) {
                p = me(c[5329] | 0) | 0;
                p = (yield* oe(p, (c[(c[c[5335] >> 2] | 0) + 4 >> 2] | 0) + (c[l >> 2] | 0) | 0, c[k >> 2] | 0)) | 0;
                c[5337] = p;
                if ((p | 0) >= 0)
                    break;
                if ((c[(hd() | 0) >> 2] | 0) == 4)
                    continue;
                yield* gb(13519);
            }
            c[(c[c[5335] >> 2] | 0) + 16 >> 2] = c[5337];
        }
        do
            if (!(c[5337] | 0))
                if (!(c[l >> 2] | 0)) {
                    c[m >> 2] = 1;
                    yield* mb(c[5329] | 0);
                    break;
                } else {
                    c[m >> 2] = 2;
                    c[(c[c[5335] >> 2] | 0) + 44 >> 2] = 2;
                    break;
                }
            else
                c[m >> 2] = 0;
        while (0);
        c[5337] = (c[5337] | 0) + (c[l >> 2] | 0);
        a[(c[(c[c[5335] >> 2] | 0) + 4 >> 2] | 0) + (c[5337] | 0) >> 0] = 0;
        a[(c[(c[c[5335] >> 2] | 0) + 4 >> 2] | 0) + ((c[5337] | 0) + 1) >> 0] = 0;
        c[5331] = c[(c[c[5335] >> 2] | 0) + 4 >> 2];
        c[g >> 2] = c[m >> 2];
        p = c[g >> 2] | 0;
        i = o;
        return p | 0;
    }
    function* mb(a) {
        a = a | 0;
        var b = 0, d = 0;
        d = i;
        i = i + 16 | 0;
        b = d;
        c[b >> 2] = a;
        if (!(c[5335] | 0 ? (c[c[5335] >> 2] | 0) != 0 : 0)) {
            cb();
            a = (yield* fb(c[5329] | 0, 16384)) | 0;
            c[c[5335] >> 2] = a;
        }
        if (c[5335] | 0)
            a = c[c[5335] >> 2] | 0;
        else
            a = 0;
        hb(a, c[b >> 2] | 0);
        jb();
        i = d;
        return;
    }
    function* nb() {
        var a = 0, b = 0;
        b = i;
        i = i + 16 | 0;
        a = b;
        if ((yield* Za()) | 0)
            c[a >> 2] = 0;
        else
            c[a >> 2] = 1;
        i = b;
        return c[a >> 2] | 0;
    }
    function ob() {
        var e = 0, f = 0, g = 0, h = 0, j = 0;
        j = i;
        i = i + 16 | 0;
        h = j + 4 | 0;
        g = j;
        f = j + 8 | 0;
        c[h >> 2] = c[5334];
        c[g >> 2] = c[5331];
        while (1) {
            if ((c[g >> 2] | 0) >>> 0 >= (c[5338] | 0) >>> 0)
                break;
            if (d[c[g >> 2] >> 0] | 0)
                e = c[156 + (d[c[g >> 2] >> 0] << 2) >> 2] | 0;
            else
                e = 1;
            a[f >> 0] = e;
            if (b[5812 + (c[h >> 2] << 1) >> 1] | 0) {
                c[5339] = c[h >> 2];
                c[5340] = c[g >> 2];
            }
            while (1) {
                e = c[h >> 2] | 0;
                if ((b[7084 + ((b[6444 + (c[h >> 2] << 1) >> 1] | 0) + (d[f >> 0] | 0) << 1) >> 1] | 0) == (c[h >> 2] | 0))
                    break;
                c[h >> 2] = b[8302 + (e << 1) >> 1];
                if ((c[h >> 2] | 0) < 316)
                    continue;
                a[f >> 0] = c[1180 + (d[f >> 0] << 2) >> 2];
            }
            c[h >> 2] = b[8942 + ((b[6444 + (e << 1) >> 1] | 0) + (d[f >> 0] | 0) << 1) >> 1];
            c[g >> 2] = (c[g >> 2] | 0) + 1;
        }
        i = j;
        return c[h >> 2] | 0;
    }
    function pb(e) {
        e = e | 0;
        var f = 0, g = 0, h = 0, j = 0, k = 0;
        k = i;
        i = i + 16 | 0;
        g = k + 8 | 0;
        j = k + 4 | 0;
        f = k;
        h = k + 12 | 0;
        c[g >> 2] = e;
        c[f >> 2] = c[5338];
        a[h >> 0] = 1;
        if (b[5812 + (c[g >> 2] << 1) >> 1] | 0) {
            c[5339] = c[g >> 2];
            c[5340] = c[f >> 2];
        }
        while (1) {
            f = c[g >> 2] | 0;
            if ((b[7084 + ((b[6444 + (c[g >> 2] << 1) >> 1] | 0) + (d[h >> 0] | 0) << 1) >> 1] | 0) == (c[g >> 2] | 0))
                break;
            c[g >> 2] = b[8302 + (f << 1) >> 1];
            if ((c[g >> 2] | 0) < 316)
                continue;
            a[h >> 0] = c[1180 + (d[h >> 0] << 2) >> 2];
        }
        c[g >> 2] = b[8942 + ((b[6444 + (f << 1) >> 1] | 0) + (d[h >> 0] | 0) << 1) >> 1];
        c[j >> 2] = (c[g >> 2] | 0) == 315 & 1;
        i = k;
        return (c[j >> 2] | 0 ? 0 : c[g >> 2] | 0) | 0;
    }
    function* qb(a) {
        a = a | 0;
        var b = 0;
        b = i;
        i = i + 16 | 0;
        c[b >> 2] = a;
        c[5341] = 1;
        i = b;
        return;
    }
    function rb(b) {
        b = b | 0;
        var d = 0, e = 0, f = 0;
        e = i;
        i = i + 16 | 0;
        d = e;
        c[d >> 2] = b;
        f = (c[d >> 2] | 0) + 4 | 0;
        b = c[f >> 2] | 0;
        c[f >> 2] = b + 1;
        i = e;
        return a[(c[(c[5362] | 0) + ((c[c[d >> 2] >> 2] | 0) * 28 | 0) + 4 >> 2] | 0) + b >> 0] | 0;
    }
    function* sb() {
        var b = 0, e = 0, f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0;
        A = i;
        i = i + 112 | 0;
        v = A + 56 | 0;
        u = A + 48 | 0;
        t = A + 40 | 0;
        s = A + 32 | 0;
        y = A + 24 | 0;
        x = A + 16 | 0;
        w = A + 8 | 0;
        r = A;
        m = A + 96 | 0;
        k = A + 92 | 0;
        l = A + 88 | 0;
        h = A + 84 | 0;
        j = A + 101 | 0;
        f = A + 100 | 0;
        n = A + 80 | 0;
        q = A + 76 | 0;
        g = A + 72 | 0;
        p = A + 68 | 0;
        e = A + 64 | 0;
        o = A + 60 | 0;
        c[5376] = 0;
        c[5377] = 0;
        a[22133] = 0;
        Hc(p);
        if (a[22129] | 0)
            na(2, 2) | 0;
        c[5341] = 0;
        a:
            while (1) {
                if (a[22133] | 0 ? 1 : (c[5377] | 0) >= (c[(c[5362] | 0) + ((c[5376] | 0) * 28 | 0) + 12 >> 2] | 0))
                    break;
                if (!((c[5341] | 0) != 0 ^ 1))
                    break;
                a[j >> 0] = rb(21504) | 0;
                do
                    switch (d[j >> 0] | 0) {
                    case 104: {
                            z = 78;
                            break a;
                        }
                    case 65: {
                            c[q >> 2] = (rb(21504) | 0) & 255;
                            if (c[q >> 2] & 128 | 0) {
                                b = (c[q >> 2] & 127) << 8;
                                c[q >> 2] = b + ((rb(21504) | 0) & 255);
                            }
                            yield* Xb(c[q >> 2] | 0);
                            continue a;
                        }
                    case 90:
                    case 66: {
                            a[22132] = ((Lc(c[c[5371] >> 2] | 0) | 0) << 24 >> 24 != 0 ^ 1) & 1;
                            Kb();
                            break;
                        }
                    case 74:
                        break;
                    case 67: {
                            c[n >> 2] = (rb(21504) | 0) & 255;
                            if (c[n >> 2] & 128 | 0) {
                                b = (c[n >> 2] & 127) << 8;
                                c[n >> 2] = b + ((rb(21504) | 0) & 255);
                            }
                            b = c[n >> 2] | 0;
                            if (!(a[(c[5362] | 0) + ((c[n >> 2] | 0) * 28 | 0) >> 0] | 0)) {
                                c[r >> 2] = c[(c[5363] | 0) + (b << 2) >> 2];
                                yield* yc(13726, r);
                                continue a;
                            }
                            yield* bc(21504, b);
                            c[e >> 2] = c[(c[5362] | 0) + ((c[n >> 2] | 0) * 28 | 0) + 24 >> 2];
                            while (1) {
                                if (!(c[e >> 2] | 0))
                                    break;
                                yield* Yb(c[c[e >> 2] >> 2] | 0);
                                c[e >> 2] = c[(c[e >> 2] | 0) + 8 >> 2];
                            }
                            yield* Jb(c[5376] | 0);
                            yield* Jb(c[5377] | 0);
                            yield* Jb(c[5373] | 0);
                            c[5376] = c[n >> 2];
                            c[5377] = 0;
                            continue a;
                        }
                    case 68: {
                            yield* Lb(c[c[5371] >> 2] | 0);
                            continue a;
                        }
                    case 75: {
                            if (!(c[5376] | 0))
                                c[g >> 2] = c[5373];
                            else
                                c[g >> 2] = c[c[5372] >> 2];
                            if ((c[g >> 2] | 0) == 10) {
                                yield* tb(21504);
                                continue a;
                            } else {
                                yield* vb(1, c[g >> 2] | 0);
                                continue a;
                            }
                        }
                    case 76: {
                            c[q >> 2] = (rb(21504) | 0) & 255;
                            if (c[q >> 2] & 128 | 0) {
                                b = (c[q >> 2] & 127) << 8;
                                c[q >> 2] = b + ((rb(21504) | 0) & 255);
                            }
                            yield* Tb(c[q >> 2] | 0);
                            continue a;
                        }
                    case 77: {
                            c[q >> 2] = (rb(21504) | 0) & 255;
                            if (c[q >> 2] & 128 | 0) {
                                b = (c[q >> 2] & 127) << 8;
                                c[q >> 2] = b + ((rb(21504) | 0) & 255);
                            }
                            yield* Vb(c[q >> 2] | 0);
                            continue a;
                        }
                    case 79: {
                            b:
                                while (1) {
                                    b = rb(21504) | 0;
                                    a[f >> 0] = b;
                                    if ((b & 255 | 0) == 34)
                                        break;
                                    if ((d[f >> 0] | 0) != 92) {
                                        yield* sc(d[f >> 0] | 0);
                                        continue;
                                    }
                                    a[f >> 0] = rb(21504) | 0;
                                    if ((d[f >> 0] | 0) == 34)
                                        break;
                                    switch (d[f >> 0] | 0) {
                                    case 97: {
                                            yield* sc(7);
                                            continue b;
                                        }
                                    case 98: {
                                            yield* sc(8);
                                            continue b;
                                        }
                                    case 102: {
                                            yield* sc(12);
                                            continue b;
                                        }
                                    case 110: {
                                            yield* sc(10);
                                            continue b;
                                        }
                                    case 113: {
                                            yield* sc(34);
                                            continue b;
                                        }
                                    case 114: {
                                            yield* sc(13);
                                            continue b;
                                        }
                                    case 116: {
                                            yield* sc(9);
                                            continue b;
                                        }
                                    case 92: {
                                            yield* sc(92);
                                            continue b;
                                        }
                                    default:
                                        continue b;
                                    }
                                }
                            (yield* yd(c[449] | 0)) | 0;
                            continue a;
                        }
                    case 82:
                        if (c[5376] | 0) {
                            _b(c[(c[5362] | 0) + ((c[5376] | 0) * 28 | 0) + 24 >> 2] | 0);
                            _b(c[(c[5362] | 0) + ((c[5376] | 0) * 28 | 0) + 20 >> 2] | 0);
                            (yield* Ib()) | 0;
                            c[5377] = (yield* Ib()) | 0;
                            c[5376] = (yield* Ib()) | 0;
                            continue a;
                        } else {
                            yield* yc(13751, w);
                            continue a;
                        }
                    case 83: {
                            c[q >> 2] = (rb(21504) | 0) & 255;
                            if (c[q >> 2] & 128 | 0) {
                                b = (c[q >> 2] & 127) << 8;
                                c[q >> 2] = b + ((rb(21504) | 0) & 255);
                            }
                            yield* Rb(c[q >> 2] | 0);
                            continue a;
                        }
                    case 84: {
                            a[22132] = Lc(c[c[5371] >> 2] | 0) | 0;
                            wb(d[22132] | 0);
                            continue a;
                        }
                    case 80:
                    case 87: {
                            yield* ed(c[c[5371] >> 2] | 0, c[5374] | 0, 3, c[5353] | 0);
                            if ((d[j >> 0] | 0) == 87)
                                yield* rc(10);
                            yield* Qb(4);
                            (yield* yd(c[449] | 0)) | 0;
                            Kb();
                            continue a;
                        }
                    case 99: {
                            c[n >> 2] = (rb(21504) | 0) & 255;
                            switch (c[n >> 2] | 0) {
                            case 76: {
                                    if (((c[(c[c[5371] >> 2] | 0) + 4 >> 2] | 0) == 1 ? c[(c[c[5371] >> 2] | 0) + 8 >> 2] | 0 : 0) ? (d[c[(c[c[5371] >> 2] | 0) + 24 >> 2] >> 0] | 0) == 0 : 0) {
                                        yield* cd(c[5371] | 0, c[(c[c[5371] >> 2] | 0) + 8 >> 2] | 0);
                                        continue a;
                                    }
                                    yield* cd(c[5371] | 0, (c[(c[c[5371] >> 2] | 0) + 4 >> 2] | 0) + (c[(c[c[5371] >> 2] | 0) + 8 >> 2] | 0) | 0);
                                    continue a;
                                }
                            case 83: {
                                    yield* cd(c[5371] | 0, c[(c[c[5371] >> 2] | 0) + 8 >> 2] | 0);
                                    continue a;
                                }
                            case 82: {
                                    if ((yield* bd(c[5371] | 0, c[5375] | 0)) | 0)
                                        continue a;
                                    yield* yc(13777, x);
                                    continue a;
                                }
                            case 73: {
                                    yield* vb(2, c[5373] | 0);
                                    continue a;
                                }
                            case 88: {
                                    yield* Lb(c[5386] | 0);
                                    yield* cd(c[5371] | 0, be() | 0);
                                    continue a;
                                }
                            default:
                                continue a;
                            }
                        }
                    case 100: {
                            c[q >> 2] = (rb(21504) | 0) & 255;
                            if (c[q >> 2] & 128 | 0) {
                                b = (c[q >> 2] & 127) << 8;
                                c[q >> 2] = b + ((rb(21504) | 0) & 255);
                            }
                            yield* Ub(c[q >> 2] | 0);
                            continue a;
                        }
                    case 105: {
                            c[q >> 2] = (rb(21504) | 0) & 255;
                            if (c[q >> 2] & 128 | 0) {
                                b = (c[q >> 2] & 127) << 8;
                                c[q >> 2] = b + ((rb(21504) | 0) & 255);
                            }
                            yield* Wb(c[q >> 2] | 0);
                            continue a;
                        }
                    case 108: {
                            c[q >> 2] = (rb(21504) | 0) & 255;
                            if (c[q >> 2] & 128 | 0) {
                                b = (c[q >> 2] & 127) << 8;
                                c[q >> 2] = b + ((rb(21504) | 0) & 255);
                            }
                            yield* Sb(c[q >> 2] | 0);
                            continue a;
                        }
                    case 110: {
                            yield* Nc(c[5386] | 0, c[c[5371] >> 2] | 0, c[5371] | 0, 0);
                            continue a;
                        }
                    case 112: {
                            Kb();
                            continue a;
                        }
                    case 115: {
                            c[q >> 2] = (rb(21504) | 0) & 255;
                            if (c[q >> 2] & 128 | 0) {
                                b = (c[q >> 2] & 127) << 8;
                                c[q >> 2] = b + ((rb(21504) | 0) & 255);
                            }
                            yield* Qb(c[q >> 2] | 0);
                            continue a;
                        }
                    case 119: {
                            while (1) {
                                b = rb(21504) | 0;
                                a[f >> 0] = b;
                                if ((b & 255 | 0) == 34)
                                    break;
                                yield* sc(d[f >> 0] | 0);
                            }
                            (yield* yd(c[449] | 0)) | 0;
                            continue a;
                        }
                    case 120: {
                            if (!(((yield* Nb(2)) | 0) << 24 >> 24))
                                continue a;
                            c[o >> 2] = c[c[5371] >> 2];
                            c[c[5371] >> 2] = c[c[(c[5371] | 0) + 4 >> 2] >> 2];
                            c[c[(c[5371] | 0) + 4 >> 2] >> 2] = c[o >> 2];
                            continue a;
                        }
                    case 48: {
                            yield* Lb(c[5386] | 0);
                            continue a;
                        }
                    case 49: {
                            yield* Lb(c[5387] | 0);
                            continue a;
                        }
                    case 33: {
                            a[22132] = Lc(c[c[5371] >> 2] | 0) | 0;
                            wb(d[22132] | 0);
                            continue a;
                        }
                    case 38: {
                            if (!(((yield* Nb(2)) | 0) << 24 >> 24))
                                continue a;
                            if ((Lc(c[c[(c[5371] | 0) + 4 >> 2] >> 2] | 0) | 0) << 24 >> 24)
                                b = 0;
                            else
                                b = (Lc(c[c[5371] >> 2] | 0) | 0) << 24 >> 24 != 0 ^ 1;
                            a[22132] = b & 1;
                            Kb();
                            wb(d[22132] | 0);
                            continue a;
                        }
                    case 124: {
                            if (!(((yield* Nb(2)) | 0) << 24 >> 24))
                                continue a;
                            if ((Lc(c[c[(c[5371] | 0) + 4 >> 2] >> 2] | 0) | 0) << 24 >> 24)
                                b = (Lc(c[c[5371] >> 2] | 0) | 0) << 24 >> 24 != 0 ^ 1;
                            else
                                b = 1;
                            a[22132] = b & 1;
                            Kb();
                            wb(d[22132] | 0);
                            continue a;
                        }
                    case 43: {
                            if (!(((yield* Nb(2)) | 0) << 24 >> 24))
                                continue a;
                            yield* Rc(c[c[(c[5371] | 0) + 4 >> 2] >> 2] | 0, c[c[5371] >> 2] | 0, p, 0);
                            Kb();
                            Kb();
                            yield* Mb(c[p >> 2] | 0);
                            Hc(p);
                            continue a;
                        }
                    case 45: {
                            if (!(((yield* Nb(2)) | 0) << 24 >> 24))
                                continue a;
                            yield* Nc(c[c[(c[5371] | 0) + 4 >> 2] >> 2] | 0, c[c[5371] >> 2] | 0, p, 0);
                            Kb();
                            Kb();
                            yield* Mb(c[p >> 2] | 0);
                            Hc(p);
                            continue a;
                        }
                    case 42: {
                            if (!(((yield* Nb(2)) | 0) << 24 >> 24))
                                continue a;
                            yield* Sc(c[c[(c[5371] | 0) + 4 >> 2] >> 2] | 0, c[c[5371] >> 2] | 0, p, c[5375] | 0);
                            Kb();
                            Kb();
                            yield* Mb(c[p >> 2] | 0);
                            Hc(p);
                            continue a;
                        }
                    case 47: {
                            if (!(((yield* Nb(2)) | 0) << 24 >> 24))
                                continue a;
                            if (!((yield* Xc(c[c[(c[5371] | 0) + 4 >> 2] >> 2] | 0, c[c[5371] >> 2] | 0, p, c[5375] | 0)) | 0)) {
                                Kb();
                                Kb();
                                yield* Mb(c[p >> 2] | 0);
                                Hc(p);
                                continue a;
                            } else {
                                yield* yc(13810, y);
                                continue a;
                            }
                        }
                    case 37: {
                            if (!(((yield* Nb(2)) | 0) << 24 >> 24))
                                continue a;
                            if ((Lc(c[c[5371] >> 2] | 0) | 0) << 24 >> 24) {
                                yield* yc(13825, s);
                                continue a;
                            } else {
                                (yield* _c(c[c[(c[5371] | 0) + 4 >> 2] >> 2] | 0, c[c[5371] >> 2] | 0, p, c[5375] | 0)) | 0;
                                Kb();
                                Kb();
                                yield* Mb(c[p >> 2] | 0);
                                Hc(p);
                                continue a;
                            }
                        }
                    case 94: {
                            if (!(((yield* Nb(2)) | 0) << 24 >> 24))
                                continue a;
                            yield* $c(c[c[(c[5371] | 0) + 4 >> 2] >> 2] | 0, c[c[5371] >> 2] | 0, p, c[5375] | 0);
                            if ((Lc(c[c[(c[5371] | 0) + 4 >> 2] >> 2] | 0) | 0) & 255 | 0 ? (Kc(c[c[5371] >> 2] | 0) | 0) & 255 | 0 : 0)
                                yield* yc(13840, t);
                            Kb();
                            Kb();
                            yield* Mb(c[p >> 2] | 0);
                            Hc(p);
                            continue a;
                        }
                    case 61: {
                            if (!(((yield* Nb(2)) | 0) << 24 >> 24))
                                continue a;
                            a[22132] = (Ic(c[c[(c[5371] | 0) + 4 >> 2] >> 2] | 0, c[c[5371] >> 2] | 0) | 0) == 0;
                            Kb();
                            wb(d[22132] | 0);
                            continue a;
                        }
                    case 35: {
                            if (!(((yield* Nb(2)) | 0) << 24 >> 24))
                                continue a;
                            a[22132] = (Ic(c[c[(c[5371] | 0) + 4 >> 2] >> 2] | 0, c[c[5371] >> 2] | 0) | 0) != 0;
                            Kb();
                            wb(d[22132] | 0);
                            continue a;
                        }
                    case 60: {
                            if (!(((yield* Nb(2)) | 0) << 24 >> 24))
                                continue a;
                            a[22132] = (Ic(c[c[(c[5371] | 0) + 4 >> 2] >> 2] | 0, c[c[5371] >> 2] | 0) | 0) == -1;
                            Kb();
                            wb(d[22132] | 0);
                            continue a;
                        }
                    case 123: {
                            if (!(((yield* Nb(2)) | 0) << 24 >> 24))
                                continue a;
                            a[22132] = (Ic(c[c[(c[5371] | 0) + 4 >> 2] >> 2] | 0, c[c[5371] >> 2] | 0) | 0) <= 0;
                            Kb();
                            wb(d[22132] | 0);
                            continue a;
                        }
                    case 62: {
                            if (!(((yield* Nb(2)) | 0) << 24 >> 24))
                                continue a;
                            a[22132] = (Ic(c[c[(c[5371] | 0) + 4 >> 2] >> 2] | 0, c[c[5371] >> 2] | 0) | 0) == 1;
                            Kb();
                            wb(d[22132] | 0);
                            continue a;
                        }
                    case 125: {
                            if (!(((yield* Nb(2)) | 0) << 24 >> 24))
                                continue a;
                            a[22132] = (Ic(c[c[(c[5371] | 0) + 4 >> 2] >> 2] | 0, c[c[5371] >> 2] | 0) | 0) >= 0;
                            Kb();
                            wb(d[22132] | 0);
                            continue a;
                        }
                    default: {
                            c[u >> 2] = d[j >> 0];
                            yield* yc(13855, u);
                            continue a;
                        }
                    }
                while (0);
                c[m >> 2] = (rb(21504) | 0) & 255;
                b = ((rb(21504) | 0) & 255) << 8;
                c[m >> 2] = (c[m >> 2] | 0) + b;
                do
                    if ((d[j >> 0] | 0) != 74) {
                        if ((d[j >> 0] | 0) == 66 ? d[22132] | 0 : 0)
                            break;
                        if ((d[j >> 0] | 0) != 90 | (a[22132] | 0) != 0)
                            continue a;
                    }
                while (0);
                c[h >> 2] = c[(c[5362] | 0) + ((c[5376] | 0) * 28 | 0) + 16 >> 2];
                c[k >> 2] = c[m >> 2] >> 6;
                c[l >> 2] = (c[m >> 2] | 0) % 64 | 0;
                while (1) {
                    b = c[k >> 2] | 0;
                    c[k >> 2] = b + -1;
                    if ((b | 0) <= 0)
                        break;
                    c[h >> 2] = c[(c[h >> 2] | 0) + 256 >> 2];
                }
                c[5377] = c[(c[h >> 2] | 0) + (c[l >> 2] << 2) >> 2];
            }
        if ((z | 0) == 78)
            Ea(0);
        while (1) {
            if (!(c[5376] | 0))
                break;
            _b(c[(c[5362] | 0) + ((c[5376] | 0) * 28 | 0) + 24 >> 2] | 0);
            _b(c[(c[5362] | 0) + ((c[5376] | 0) * 28 | 0) + 20 >> 2] | 0);
            (yield* Ib()) | 0;
            c[5377] = (yield* Ib()) | 0;
            c[5376] = (yield* Ib()) | 0;
        }
        while (1) {
            if (!(c[5371] | 0))
                break;
            Kb();
        }
        if (!(a[22129] | 0)) {
            i = A;
            return;
        }
        na(2, 1) | 0;
        if (!(c[5341] | 0)) {
            i = A;
            return;
        }
        (yield* he(13880, v)) | 0;
        i = A;
        return;
    }
    function* tb(b) {
        b = b | 0;
        var e = 0, f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0;
        m = i;
        i = i + 48 | 0;
        e = m + 28 | 0;
        f = m + 24 | 0;
        k = m + 16 | 0;
        h = m + 8 | 0;
        j = m + 4 | 0;
        g = m + 32 | 0;
        l = m;
        c[e >> 2] = b;
        b = c[e >> 2] | 0;
        c[k >> 2] = c[b >> 2];
        c[k + 4 >> 2] = c[b + 4 >> 2];
        c[h >> 2] = 0;
        c[j >> 2] = 0;
        a[g >> 0] = rb(k) | 0;
        while (1) {
            if ((d[g >> 0] | 0 | 0) == 46)
                break;
            if ((d[g >> 0] | 0 | 0) == 58)
                break;
            c[h >> 2] = (c[h >> 2] | 0) + 1;
            a[g >> 0] = rb(k) | 0;
        }
        a:
            do
                if ((d[g >> 0] | 0 | 0) == 46) {
                    a[g >> 0] = rb(k) | 0;
                    while (1) {
                        if ((d[g >> 0] | 0 | 0) == 58)
                            break a;
                        c[j >> 2] = (c[j >> 2] | 0) + 1;
                        a[g >> 0] = rb(k) | 0;
                    }
                }
            while (0);
        a[g >> 0] = rb(c[e >> 2] | 0) | 0;
        if ((c[h >> 2] | 0) == 1 & (c[j >> 2] | 0) == 0) {
            if (!(d[g >> 0] | 0)) {
                yield* Lb(c[5386] | 0);
                a[g >> 0] = rb(c[e >> 2] | 0) | 0;
                i = m;
                return;
            }
            if ((d[g >> 0] | 0 | 0) == 1) {
                yield* Lb(c[5387] | 0);
                a[g >> 0] = rb(c[e >> 2] | 0) | 0;
                i = m;
                return;
            }
            if ((d[g >> 0] | 0 | 0) > 9) {
                Hc(f);
                yield* cd(f, d[g >> 0] | 0);
                yield* Mb(c[f >> 2] | 0);
                a[g >> 0] = rb(c[e >> 2] | 0) | 0;
                i = m;
                return;
            }
        }
        if (!(c[h >> 2] | 0)) {
            c[f >> 2] = (yield* Dc(1, c[j >> 2] | 0)) | 0;
            c[l >> 2] = c[(c[f >> 2] | 0) + 24 >> 2];
            b = c[l >> 2] | 0;
            c[l >> 2] = b + 1;
            a[b >> 0] = 0;
        } else {
            c[f >> 2] = (yield* Dc(c[h >> 2] | 0, c[j >> 2] | 0)) | 0;
            c[l >> 2] = c[(c[f >> 2] | 0) + 24 >> 2];
        }
        while (1) {
            if ((d[g >> 0] | 0 | 0) == 58)
                break;
            do
                if ((d[g >> 0] | 0 | 0) != 46)
                    if ((d[g >> 0] | 0 | 0) > 9) {
                        b = c[l >> 2] | 0;
                        c[l >> 2] = b + 1;
                        a[b >> 0] = 9;
                        break;
                    } else {
                        k = a[g >> 0] | 0;
                        b = c[l >> 2] | 0;
                        c[l >> 2] = b + 1;
                        a[b >> 0] = k;
                        break;
                    }
            while (0);
            a[g >> 0] = rb(c[e >> 2] | 0) | 0;
        }
        yield* Mb(c[f >> 2] | 0);
        i = m;
        return;
    }
    function* ub() {
        return (rb(21504) | 0) & 255 | 0;
    }
    function* vb(b, d) {
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0;
        q = i;
        i = i + 48 | 0;
        f = q + 36 | 0;
        g = q + 32 | 0;
        j = q + 28 | 0;
        h = q + 24 | 0;
        p = q + 20 | 0;
        o = q + 16 | 0;
        m = q + 12 | 0;
        k = q + 8 | 0;
        l = q + 4 | 0;
        e = q;
        n = q + 40 | 0;
        c[f >> 2] = b;
        c[g >> 2] = d;
        Hc(p);
        Hc(o);
        Hc(m);
        c[h >> 2] = Gc(c[5386] | 0) | 0;
        a[n >> 0] = 0;
        yield* cd(m, c[g >> 2] | 0);
        c[l >> 2] = (yield* Ia[c[f >> 2] & 3]()) | 0;
        while (1) {
            if ((c[l >> 2] | 0) != 32)
                break;
            c[l >> 2] = (yield* Ia[c[f >> 2] & 3]()) | 0;
        }
        if ((c[l >> 2] | 0) != 43) {
            if ((c[l >> 2] | 0) == 45) {
                a[n >> 0] = 1;
                c[l >> 2] = (yield* Ia[c[f >> 2] & 3]()) | 0;
            }
        } else
            c[l >> 2] = (yield* Ia[c[f >> 2] & 3]()) | 0;
        if ((c[l >> 2] | 0) < 16) {
            c[e >> 2] = c[l >> 2];
            c[l >> 2] = (yield* Ia[c[f >> 2] & 3]()) | 0;
            if ((c[l >> 2] | 0) < 16 ? (c[e >> 2] | 0) >= (c[g >> 2] | 0) : 0)
                c[e >> 2] = (c[g >> 2] | 0) - 1;
            yield* cd(h, c[e >> 2] | 0);
        }
        while (1) {
            d = c[l >> 2] | 0;
            if ((c[l >> 2] | 0) >= 16)
                break;
            if ((d | 0) < 16 ? (c[l >> 2] | 0) >= (c[g >> 2] | 0) : 0)
                c[l >> 2] = (c[g >> 2] | 0) - 1;
            yield* Sc(c[h >> 2] | 0, c[m >> 2] | 0, o, 0);
            yield* cd(p, c[l >> 2] | 0);
            yield* Rc(c[o >> 2] | 0, c[p >> 2] | 0, h, 0);
            c[l >> 2] = (yield* Ia[c[f >> 2] & 3]()) | 0;
        }
        if ((d | 0) == 46) {
            c[l >> 2] = (yield* Ia[c[f >> 2] & 3]()) | 0;
            if ((c[l >> 2] | 0) >= (c[g >> 2] | 0))
                c[l >> 2] = (c[g >> 2] | 0) - 1;
            Ec(o);
            Ec(p);
            c[k >> 2] = Gc(c[5387] | 0) | 0;
            c[o >> 2] = Gc(c[5386] | 0) | 0;
            c[j >> 2] = 0;
            while (1) {
                d = c[o >> 2] | 0;
                if ((c[l >> 2] | 0) >= 16)
                    break;
                yield* Sc(d, c[m >> 2] | 0, o, 0);
                yield* cd(p, c[l >> 2] | 0);
                yield* Rc(c[o >> 2] | 0, c[p >> 2] | 0, o, 0);
                yield* Sc(c[k >> 2] | 0, c[m >> 2] | 0, k, 0);
                c[j >> 2] = (c[j >> 2] | 0) + 1;
                c[l >> 2] = (yield* Ia[c[f >> 2] & 3]()) | 0;
                if ((c[l >> 2] | 0) >= 16)
                    continue;
                if ((c[l >> 2] | 0) < (c[g >> 2] | 0))
                    continue;
                c[l >> 2] = (c[g >> 2] | 0) - 1;
            }
            (yield* Xc(d, c[k >> 2] | 0, o, c[j >> 2] | 0)) | 0;
            yield* Rc(c[h >> 2] | 0, c[o >> 2] | 0, h, 0);
        }
        if (!(a[n >> 0] | 0)) {
            n = c[h >> 2] | 0;
            yield* Mb(n);
            Ec(p);
            Ec(o);
            Ec(m);
            i = q;
            return;
        }
        yield* Nc(c[5386] | 0, c[h >> 2] | 0, h, 0);
        n = c[h >> 2] | 0;
        yield* Mb(n);
        Ec(p);
        Ec(o);
        Ec(m);
        i = q;
        return;
    }
    function wb(b) {
        b = b | 0;
        var d = 0, e = 0;
        d = i;
        i = i + 16 | 0;
        e = d;
        a[e >> 0] = b;
        Ec(c[5371] | 0);
        if (a[e >> 0] | 0) {
            e = Gc(c[5387] | 0) | 0;
            c[c[5371] >> 2] = e;
            i = d;
            return;
        } else {
            e = Gc(c[5386] | 0) | 0;
            c[c[5371] >> 2] = e;
            i = d;
            return;
        }
    }
    function* xb() {
        var a = 0, b = 0, d = 0, e = 0, f = 0, g = 0;
        g = i;
        i = i + 16 | 0;
        e = g + 4 | 0;
        f = g;
        c[f >> 2] = (yield* le()) | 0;
        if ((c[f >> 2] | 0) == 92 ? (c[f >> 2] = (yield* le()) | 0, (c[f >> 2] | 0) == 10) : 0) {
            c[f >> 2] = (yield* le()) | 0;
            c[5378] = 0;
        }
        d = (de(c[f >> 2] | 0) | 0) != 0;
        a = c[f >> 2] | 0;
        do
            if (!d) {
                b = c[f >> 2] | 0;
                if ((a | 0) >= 65 & (c[f >> 2] | 0) <= 70) {
                    c[e >> 2] = b + 10 - 65;
                    break;
                }
                d = c[f >> 2] | 0;
                if ((b | 0) >= 97 & (c[f >> 2] | 0) <= 102) {
                    c[e >> 2] = d + 10 - 97;
                    break;
                }
                a = c[f >> 2] | 0;
                if ((d | 0) == 46 | (c[f >> 2] | 0) == 43 | (c[f >> 2] | 0) == 45) {
                    c[e >> 2] = a;
                    break;
                }
                if ((a | 0) <= 32) {
                    c[e >> 2] = 32;
                    break;
                } else {
                    c[e >> 2] = 58;
                    break;
                }
            } else
                c[e >> 2] = a - 48;
        while (0);
        i = g;
        return c[e >> 2] | 0;
    }
    function yb() {
        Hb(0);
        c[5342] = 0;
        c[5343] = 0;
        a[22127] = 0;
        a[22128] = 0;
        return;
    }
    function* zb(b) {
        b = b | 0;
        var d = 0, e = 0, f = 0, g = 0, h = 0;
        h = i;
        i = i + 16 | 0;
        d = h + 12 | 0;
        g = h + 8 | 0;
        e = h + 4 | 0;
        f = h;
        c[d >> 2] = b;
        if (c[5381] | 0) {
            i = h;
            return;
        }
        b = c[5343] | 0;
        c[5343] = b + 1;
        c[g >> 2] = b;
        c[e >> 2] = (c[5362] | 0) + ((c[5342] | 0) * 28 | 0);
        if ((c[g >> 2] | 0) >= (c[(c[e >> 2] | 0) + 8 >> 2] | 0)) {
            b = (c[e >> 2] | 0) + 8 | 0;
            c[b >> 2] = c[b >> 2] << 1;
            c[f >> 2] = (yield* dc(c[(c[e >> 2] | 0) + 8 >> 2] | 0)) | 0;
            Ce(c[f >> 2] | 0, c[(c[e >> 2] | 0) + 4 >> 2] | 0, (c[(c[e >> 2] | 0) + 8 >> 2] | 0) / 2 | 0 | 0) | 0;
            se(c[(c[e >> 2] | 0) + 4 >> 2] | 0);
            c[(c[e >> 2] | 0) + 4 >> 2] = c[f >> 2];
        }
        a[(c[(c[e >> 2] | 0) + 4 >> 2] | 0) + (c[g >> 2] | 0) >> 0] = c[d >> 2];
        b = (c[e >> 2] | 0) + 12 | 0;
        c[b >> 2] = (c[b >> 2] | 0) + 1;
        i = h;
        return;
    }
    function* Ab(a) {
        a = a | 0;
        var b = 0, d = 0, e = 0, f = 0, g = 0, h = 0;
        g = i;
        i = i + 32 | 0;
        h = g + 16 | 0;
        f = g + 12 | 0;
        d = g + 8 | 0;
        e = g + 4 | 0;
        b = g;
        c[h >> 2] = a;
        c[d >> 2] = c[h >> 2] >> 6;
        c[e >> 2] = (c[h >> 2] | 0) % 64 | 0;
        c[b >> 2] = c[5342];
        if (!(c[(c[5362] | 0) + ((c[b >> 2] | 0) * 28 | 0) + 16 >> 2] | 0)) {
            h = (yield* dc(260)) | 0;
            c[(c[5362] | 0) + ((c[b >> 2] | 0) * 28 | 0) + 16 >> 2] = h;
            c[(c[(c[5362] | 0) + ((c[b >> 2] | 0) * 28 | 0) + 16 >> 2] | 0) + 256 >> 2] = 0;
        }
        c[f >> 2] = c[(c[5362] | 0) + ((c[b >> 2] | 0) * 28 | 0) + 16 >> 2];
        while (1) {
            if ((c[d >> 2] | 0) <= 0)
                break;
            if (!(c[(c[f >> 2] | 0) + 256 >> 2] | 0)) {
                h = (yield* dc(260)) | 0;
                c[(c[f >> 2] | 0) + 256 >> 2] = h;
                c[(c[(c[f >> 2] | 0) + 256 >> 2] | 0) + 256 >> 2] = 0;
            }
            c[f >> 2] = c[(c[f >> 2] | 0) + 256 >> 2];
            c[d >> 2] = (c[d >> 2] | 0) + -1;
        }
        c[(c[f >> 2] | 0) + (c[e >> 2] << 2) >> 2] = c[5343];
        i = g;
        return;
    }
    function Bb(b) {
        b = b | 0;
        var e = 0, f = 0, g = 0, h = 0, j = 0, k = 0, l = 0;
        j = i;
        i = i + 16 | 0;
        g = j + 8 | 0;
        e = j + 4 | 0;
        f = j;
        h = j + 12 | 0;
        c[e >> 2] = b;
        c[f >> 2] = 0;
        a[h >> 0] = 0;
        if ((d[c[c[e >> 2] >> 2] >> 0] | 0) == 45) {
            a[h >> 0] = 1;
            b = c[e >> 2] | 0;
            c[b >> 2] = (c[b >> 2] | 0) + 1;
        }
        while (1) {
            if (!(de(d[c[c[e >> 2] >> 2] >> 0] | 0) | 0))
                break;
            k = (c[f >> 2] | 0) * 10 | 0;
            l = c[e >> 2] | 0;
            b = c[l >> 2] | 0;
            c[l >> 2] = b + 1;
            c[f >> 2] = k + (d[b >> 0] | 0) - 48;
        }
        e = c[f >> 2] | 0;
        if (a[h >> 0] | 0) {
            c[g >> 2] = 0 - e;
            l = c[g >> 2] | 0;
            i = j;
            return l | 0;
        } else {
            c[g >> 2] = e;
            l = c[g >> 2] | 0;
            i = j;
            return l | 0;
        }
        return 0;
    }
    function* Cb(b) {
        b = b | 0;
        var e = 0, f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0;
        n = i;
        i = i + 32 | 0;
        l = n;
        e = n + 24 | 0;
        j = n + 20 | 0;
        f = n + 16 | 0;
        h = n + 12 | 0;
        k = n + 8 | 0;
        g = n + 4 | 0;
        c[e >> 2] = b;
        c[j >> 2] = c[e >> 2];
        a:
            while (1) {
                if (c[5381] | 0 ? 1 : (d[c[j >> 2] >> 0] | 0) == 0) {
                    m = 54;
                    break;
                }
                if (a[22127] | 0) {
                    if ((d[c[j >> 2] >> 0] | 0) == 34)
                        a[22127] = 0;
                    e = c[j >> 2] | 0;
                    c[j >> 2] = e + 1;
                    yield* zb(d[e >> 0] | 0);
                    continue;
                }
                b = d[c[j >> 2] >> 0] | 0;
                if (a[22128] | 0) {
                    e = c[j >> 2] | 0;
                    if ((b | 0) == 10) {
                        c[j >> 2] = e + 1;
                        continue;
                    }
                    if ((d[e >> 0] | 0) == 58) {
                        a[22128] = 0;
                        e = c[j >> 2] | 0;
                        c[j >> 2] = e + 1;
                        yield* zb(d[e >> 0] | 0);
                        continue;
                    }
                    b = c[j >> 2] | 0;
                    if ((d[c[j >> 2] >> 0] | 0) == 46) {
                        c[j >> 2] = b + 1;
                        yield* zb(d[b >> 0] | 0);
                        continue;
                    }
                    e = (d[b >> 0] | 0) >= 65;
                    b = c[j >> 2] | 0;
                    c[j >> 2] = b + 1;
                    b = d[b >> 0] | 0;
                    if (e) {
                        yield* zb(b + 10 - 65 | 0);
                        continue;
                    } else {
                        yield* zb(b - 48 | 0);
                        continue;
                    }
                }
                b:
                    do
                        switch (b | 0) {
                        case 34: {
                                a[22127] = 1;
                                break;
                            }
                        case 78: {
                                c[j >> 2] = (c[j >> 2] | 0) + 1;
                                c[h >> 2] = Bb(j) | 0;
                                yield* Ab(c[h >> 2] | 0);
                                break;
                            }
                        case 90:
                        case 74:
                        case 66: {
                                e = c[j >> 2] | 0;
                                c[j >> 2] = e + 1;
                                yield* zb(d[e >> 0] | 0);
                                c[h >> 2] = Bb(j) | 0;
                                if ((c[h >> 2] | 0) > 65535) {
                                    m = 21;
                                    break a;
                                }
                                yield* zb(c[h >> 2] & 255);
                                yield* zb(c[h >> 2] >> 8 & 255);
                                break;
                            }
                        case 70: {
                                c[j >> 2] = (c[j >> 2] | 0) + 1;
                                c[g >> 2] = Bb(j) | 0;
                                Hb(c[g >> 2] | 0);
                                while (1) {
                                    e = c[j >> 2] | 0;
                                    c[j >> 2] = e + 1;
                                    if ((d[e >> 0] | 0) == 46)
                                        break;
                                    b = c[j >> 2] | 0;
                                    if ((d[c[j >> 2] >> 0] | 0) == 46) {
                                        m = 26;
                                        break;
                                    }
                                    if ((d[b >> 0] | 0) == 42) {
                                        c[j >> 2] = (c[j >> 2] | 0) + 1;
                                        c[f >> 2] = Bb(j) | 0;
                                        e = (yield* fc(c[(c[5362] | 0) + ((c[g >> 2] | 0) * 28 | 0) + 20 >> 2] | 0, c[f >> 2] | 0, 1)) | 0;
                                        c[(c[5362] | 0) + ((c[g >> 2] | 0) * 28 | 0) + 20 >> 2] = e;
                                        continue;
                                    } else {
                                        c[f >> 2] = Bb(j) | 0;
                                        e = (yield* fc(c[(c[5362] | 0) + ((c[g >> 2] | 0) * 28 | 0) + 20 >> 2] | 0, c[f >> 2] | 0, 0)) | 0;
                                        c[(c[5362] | 0) + ((c[g >> 2] | 0) * 28 | 0) + 20 >> 2] = e;
                                        continue;
                                    }
                                }
                                if ((m | 0) == 26) {
                                    m = 0;
                                    c[j >> 2] = b + 1;
                                }
                                while (1) {
                                    if ((d[c[j >> 2] >> 0] | 0) == 91)
                                        break;
                                    if ((d[c[j >> 2] >> 0] | 0) == 44)
                                        c[j >> 2] = (c[j >> 2] | 0) + 1;
                                    c[f >> 2] = Bb(j) | 0;
                                    e = (yield* fc(c[(c[5362] | 0) + ((c[g >> 2] | 0) * 28 | 0) + 24 >> 2] | 0, c[f >> 2] | 0, 0)) | 0;
                                    c[(c[5362] | 0) + ((c[g >> 2] | 0) * 28 | 0) + 24 >> 2] = e;
                                }
                                c[5344] = c[5342];
                                c[5345] = c[5343];
                                c[5342] = c[g >> 2];
                                c[5343] = 0;
                                break;
                            }
                        case 93: {
                                a[(c[5362] | 0) + ((c[5342] | 0) * 28 | 0) >> 0] = 1;
                                c[5342] = c[5344];
                                c[5343] = c[5345];
                                break;
                            }
                        case 67: {
                                b = c[j >> 2] | 0;
                                c[j >> 2] = b + 1;
                                yield* zb(d[b >> 0] | 0);
                                c[g >> 2] = Bb(j) | 0;
                                b = c[g >> 2] | 0;
                                if ((c[g >> 2] | 0) < 128)
                                    yield* zb(b & 255);
                                else {
                                    yield* zb(b >> 8 & 255 | 128);
                                    yield* zb(c[g >> 2] & 255);
                                }
                                if ((d[c[j >> 2] >> 0] | 0) == 44)
                                    c[j >> 2] = (c[j >> 2] | 0) + 1;
                                while (1) {
                                    if ((d[c[j >> 2] >> 0] | 0) == 58)
                                        break;
                                    e = c[j >> 2] | 0;
                                    c[j >> 2] = e + 1;
                                    yield* zb(d[e >> 0] | 0);
                                }
                                yield* zb(58);
                                break;
                            }
                        case 99: {
                                e = c[j >> 2] | 0;
                                c[j >> 2] = e + 1;
                                yield* zb(d[e >> 0] | 0);
                                yield* zb(d[c[j >> 2] >> 0] | 0);
                                break;
                            }
                        case 75: {
                                yield* zb(d[c[j >> 2] >> 0] | 0);
                                a[22128] = 1;
                                break;
                            }
                        case 83:
                        case 76:
                        case 77:
                        case 65:
                        case 115:
                        case 108:
                        case 105:
                        case 100: {
                                b = c[j >> 2] | 0;
                                c[j >> 2] = b + 1;
                                yield* zb(d[b >> 0] | 0);
                                c[k >> 2] = Bb(j) | 0;
                                b = c[k >> 2] | 0;
                                if ((c[k >> 2] | 0) < 128) {
                                    yield* zb(b);
                                    break b;
                                } else {
                                    yield* zb(b >> 8 & 255 | 128);
                                    yield* zb(c[k >> 2] & 255);
                                    break b;
                                }
                            }
                        case 64: {
                                e = (c[j >> 2] | 0) + 1 | 0;
                                c[j >> 2] = e;
                                switch (d[e >> 0] | 0) {
                                case 105: {
                                        yb();
                                        break b;
                                    }
                                case 114: {
                                        yield* sb();
                                        break b;
                                    }
                                default:
                                    break b;
                                }
                            }
                        case 10:
                            break;
                        default:
                            yield* zb(d[c[j >> 2] >> 0] | 0);
                        }
                    while (0);
                c[j >> 2] = (c[j >> 2] | 0) + 1;
            }
        if ((m | 0) == 21) {
            (yield* _d(c[508] | 0, 13905, l)) | 0;
            Ea(1);
        } else if ((m | 0) == 54) {
            i = n;
            return;
        }
    }
    function* Db() {
        c[5364] = 0;
        yield* Eb();
        c[c[5363] >> 2] = 13923;
        c[5367] = 0;
        yield* Fb();
        c[5370] = 0;
        yield* Gb();
        c[5371] = 0;
        c[5372] = 0;
        c[5373] = 10;
        c[5374] = 10;
        c[5375] = 0;
        a[22132] = 0;
        yield* Fc();
        return;
    }
    function* Eb() {
        var b = 0, d = 0, e = 0, f = 0, g = 0, h = 0, j = 0, k = 0;
        h = i;
        i = i + 32 | 0;
        e = h + 16 | 0;
        d = h + 12 | 0;
        f = h + 8 | 0;
        b = h + 4 | 0;
        g = h;
        c[e >> 2] = c[5364];
        c[f >> 2] = c[5362];
        c[g >> 2] = c[5363];
        c[5364] = (c[5364] | 0) + 32;
        c[5362] = (yield* dc((c[5364] | 0) * 28 | 0)) | 0;
        c[5363] = (yield* dc(c[5364] << 2)) | 0;
        c[d >> 2] = 0;
        while (1) {
            if ((c[d >> 2] | 0) >= (c[e >> 2] | 0))
                break;
            j = (c[5362] | 0) + ((c[d >> 2] | 0) * 28 | 0) | 0;
            k = (c[f >> 2] | 0) + ((c[d >> 2] | 0) * 28 | 0) | 0;
            c[j >> 2] = c[k >> 2];
            c[j + 4 >> 2] = c[k + 4 >> 2];
            c[j + 8 >> 2] = c[k + 8 >> 2];
            c[j + 12 >> 2] = c[k + 12 >> 2];
            c[j + 16 >> 2] = c[k + 16 >> 2];
            c[j + 20 >> 2] = c[k + 20 >> 2];
            c[j + 24 >> 2] = c[k + 24 >> 2];
            c[(c[5363] | 0) + (c[d >> 2] << 2) >> 2] = c[(c[g >> 2] | 0) + (c[d >> 2] << 2) >> 2];
            c[d >> 2] = (c[d >> 2] | 0) + 1;
        }
        while (1) {
            if ((c[d >> 2] | 0) >= (c[5364] | 0))
                break;
            c[b >> 2] = (c[5362] | 0) + ((c[d >> 2] | 0) * 28 | 0);
            a[c[b >> 2] >> 0] = 0;
            k = (yield* dc(1024)) | 0;
            c[(c[b >> 2] | 0) + 4 >> 2] = k;
            c[(c[b >> 2] | 0) + 8 >> 2] = 1024;
            c[(c[b >> 2] | 0) + 12 >> 2] = 0;
            c[(c[b >> 2] | 0) + 16 >> 2] = 0;
            c[(c[b >> 2] | 0) + 24 >> 2] = 0;
            c[(c[b >> 2] | 0) + 20 >> 2] = 0;
            c[d >> 2] = (c[d >> 2] | 0) + 1;
        }
        if (!(c[e >> 2] | 0)) {
            i = h;
            return;
        }
        se(c[f >> 2] | 0);
        se(c[g >> 2] | 0);
        i = h;
        return;
    }
    function* Fb() {
        var a = 0, b = 0, d = 0, e = 0, f = 0;
        f = i;
        i = i + 16 | 0;
        a = f + 12 | 0;
        b = f + 8 | 0;
        e = f + 4 | 0;
        d = f;
        c[b >> 2] = c[5367];
        c[e >> 2] = c[5365];
        c[d >> 2] = c[5366];
        c[5367] = (c[5367] | 0) + 32;
        c[5365] = (yield* dc(c[5367] << 2)) | 0;
        c[5366] = (yield* dc(c[5367] << 2)) | 0;
        c[a >> 2] = 3;
        while (1) {
            if ((c[a >> 2] | 0) >= (c[b >> 2] | 0))
                break;
            c[(c[5365] | 0) + (c[a >> 2] << 2) >> 2] = c[(c[e >> 2] | 0) + (c[a >> 2] << 2) >> 2];
            c[(c[5366] | 0) + (c[a >> 2] << 2) >> 2] = c[(c[d >> 2] | 0) + (c[a >> 2] << 2) >> 2];
            c[a >> 2] = (c[a >> 2] | 0) + 1;
        }
        while (1) {
            if ((c[a >> 2] | 0) >= (c[5367] | 0))
                break;
            c[(c[5365] | 0) + (c[a >> 2] << 2) >> 2] = 0;
            c[a >> 2] = (c[a >> 2] | 0) + 1;
        }
        if (!(c[b >> 2] | 0)) {
            i = f;
            return;
        }
        se(c[e >> 2] | 0);
        se(c[d >> 2] | 0);
        i = f;
        return;
    }
    function* Gb() {
        var a = 0, b = 0, d = 0, e = 0, f = 0;
        f = i;
        i = i + 16 | 0;
        a = f + 12 | 0;
        d = f + 8 | 0;
        b = f + 4 | 0;
        e = f;
        c[d >> 2] = c[5370];
        c[b >> 2] = c[5368];
        c[e >> 2] = c[5369];
        c[5370] = (c[5370] | 0) + 32;
        c[5368] = (yield* dc(c[5370] << 2)) | 0;
        c[5369] = (yield* dc(c[5370] << 2)) | 0;
        c[a >> 2] = 1;
        while (1) {
            if ((c[a >> 2] | 0) >= (c[d >> 2] | 0))
                break;
            c[(c[5368] | 0) + (c[a >> 2] << 2) >> 2] = c[(c[b >> 2] | 0) + (c[a >> 2] << 2) >> 2];
            c[(c[5369] | 0) + (c[a >> 2] << 2) >> 2] = c[(c[e >> 2] | 0) + (c[a >> 2] << 2) >> 2];
            c[a >> 2] = (c[a >> 2] | 0) + 1;
        }
        while (1) {
            if ((c[a >> 2] | 0) >= (c[5367] | 0))
                break;
            c[(c[5368] | 0) + (c[a >> 2] << 2) >> 2] = 0;
            c[a >> 2] = (c[a >> 2] | 0) + 1;
        }
        if (!(c[d >> 2] | 0)) {
            i = f;
            return;
        }
        se(c[b >> 2] | 0);
        se(c[e >> 2] | 0);
        i = f;
        return;
    }
    function Hb(b) {
        b = b | 0;
        var d = 0, e = 0, f = 0, g = 0;
        f = i;
        i = i + 16 | 0;
        g = f + 8 | 0;
        d = f + 4 | 0;
        e = f;
        c[g >> 2] = b;
        c[d >> 2] = (c[5362] | 0) + ((c[g >> 2] | 0) * 28 | 0);
        a[c[d >> 2] >> 0] = 0;
        c[(c[d >> 2] | 0) + 12 >> 2] = 0;
        if (c[(c[d >> 2] | 0) + 24 >> 2] | 0) {
            jc(c[(c[d >> 2] | 0) + 24 >> 2] | 0);
            c[(c[d >> 2] | 0) + 24 >> 2] = 0;
        }
        if (c[(c[d >> 2] | 0) + 20 >> 2] | 0) {
            jc(c[(c[d >> 2] | 0) + 20 >> 2] | 0);
            c[(c[d >> 2] | 0) + 20 >> 2] = 0;
        }
        while (1) {
            if (!(c[(c[d >> 2] | 0) + 16 >> 2] | 0))
                break;
            c[e >> 2] = c[(c[(c[d >> 2] | 0) + 16 >> 2] | 0) + 256 >> 2];
            se(c[(c[d >> 2] | 0) + 16 >> 2] | 0);
            c[(c[d >> 2] | 0) + 16 >> 2] = c[e >> 2];
        }
        i = f;
        return;
    }
    function* Ib() {
        var a = 0, b = 0, d = 0;
        d = i;
        i = i + 16 | 0;
        b = d + 8 | 0;
        a = d + 4 | 0;
        if (c[5372] | 0) {
            c[b >> 2] = c[5372];
            c[5372] = c[(c[b >> 2] | 0) + 4 >> 2];
            c[a >> 2] = c[c[b >> 2] >> 2];
            se(c[b >> 2] | 0);
            b = c[a >> 2] | 0;
            i = d;
            return b | 0;
        } else {
            c[a >> 2] = 0;
            yield* yc(13930, d);
            b = c[a >> 2] | 0;
            i = d;
            return b | 0;
        }
        return 0;
    }
    function* Jb(a) {
        a = a | 0;
        var b = 0, d = 0, e = 0;
        b = i;
        i = i + 16 | 0;
        e = b + 4 | 0;
        d = b;
        c[e >> 2] = a;
        c[d >> 2] = (yield* dc(8)) | 0;
        c[(c[d >> 2] | 0) + 4 >> 2] = c[5372];
        c[c[d >> 2] >> 2] = c[e >> 2];
        c[5372] = c[d >> 2];
        i = b;
        return;
    }
    function Kb() {
        var a = 0, b = 0;
        b = i;
        i = i + 16 | 0;
        a = b;
        if (!(c[5371] | 0)) {
            i = b;
            return;
        }
        c[a >> 2] = c[5371];
        c[5371] = c[(c[a >> 2] | 0) + 4 >> 2];
        Ec(c[a >> 2] | 0);
        se(c[a >> 2] | 0);
        i = b;
        return;
    }
    function* Lb(a) {
        a = a | 0;
        var b = 0, d = 0, e = 0;
        b = i;
        i = i + 16 | 0;
        e = b + 4 | 0;
        d = b;
        c[e >> 2] = a;
        c[d >> 2] = (yield* dc(8)) | 0;
        a = Gc(c[e >> 2] | 0) | 0;
        c[c[d >> 2] >> 2] = a;
        c[(c[d >> 2] | 0) + 4 >> 2] = c[5371];
        c[5371] = c[d >> 2];
        i = b;
        return;
    }
    function* Mb(a) {
        a = a | 0;
        var b = 0, d = 0, e = 0;
        b = i;
        i = i + 16 | 0;
        e = b + 4 | 0;
        d = b;
        c[e >> 2] = a;
        c[d >> 2] = (yield* dc(8)) | 0;
        c[c[d >> 2] >> 2] = c[e >> 2];
        c[(c[d >> 2] | 0) + 4 >> 2] = c[5371];
        c[5371] = c[d >> 2];
        i = b;
        return;
    }
    function* Nb(b) {
        b = b | 0;
        var d = 0, e = 0, f = 0, g = 0, h = 0;
        h = i;
        i = i + 16 | 0;
        g = h;
        d = h + 12 | 0;
        e = h + 8 | 0;
        f = h + 4 | 0;
        c[e >> 2] = b;
        c[f >> 2] = c[5371];
        while (1) {
            if (!(c[f >> 2] | 0 ? (c[e >> 2] | 0) > 0 : 0))
                break;
            c[f >> 2] = c[(c[f >> 2] | 0) + 4 >> 2];
            c[e >> 2] = (c[e >> 2] | 0) + -1;
        }
        if ((c[e >> 2] | 0) > 0) {
            yield* yc(13976, g);
            a[d >> 0] = 0;
            g = a[d >> 0] | 0;
            i = h;
            return g | 0;
        } else {
            a[d >> 0] = 1;
            g = a[d >> 0] | 0;
            i = h;
            return g | 0;
        }
        return 0;
    }
    function* Ob(a) {
        a = a | 0;
        var b = 0, d = 0, e = 0;
        e = i;
        i = i + 16 | 0;
        b = e + 4 | 0;
        d = e;
        c[b >> 2] = a;
        c[d >> 2] = c[(c[5365] | 0) + (c[b >> 2] << 2) >> 2];
        if (c[d >> 2] | 0) {
            d = c[d >> 2] | 0;
            i = e;
            return d | 0;
        }
        a = (yield* dc(8)) | 0;
        c[(c[5365] | 0) + (c[b >> 2] << 2) >> 2] = a;
        c[d >> 2] = a;
        Hc(c[d >> 2] | 0);
        d = c[d >> 2] | 0;
        i = e;
        return d | 0;
    }
    function* Pb(d, e) {
        d = d | 0;
        e = e | 0;
        var f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0;
        p = i;
        i = i + 48 | 0;
        f = p + 44 | 0;
        g = p + 40 | 0;
        j = p + 36 | 0;
        h = p + 32 | 0;
        o = p + 28 | 0;
        m = p + 24 | 0;
        k = p + 20 | 0;
        l = p + 16 | 0;
        n = p;
        c[f >> 2] = d;
        c[g >> 2] = e;
        c[j >> 2] = c[(c[5368] | 0) + (c[f >> 2] << 2) >> 2];
        if (!(c[j >> 2] | 0)) {
            d = (yield* dc(12)) | 0;
            c[(c[5368] | 0) + (c[f >> 2] << 2) >> 2] = d;
            c[j >> 2] = d;
            c[c[j >> 2] >> 2] = 0;
            c[(c[j >> 2] | 0) + 8 >> 2] = 0;
            a[(c[j >> 2] | 0) + 4 >> 0] = 0;
        }
        c[h >> 2] = c[c[j >> 2] >> 2];
        if (!(c[h >> 2] | 0)) {
            d = (yield* dc(8)) | 0;
            c[c[j >> 2] >> 2] = d;
            c[h >> 2] = d;
            c[c[h >> 2] >> 2] = 0;
            b[(c[h >> 2] | 0) + 4 >> 1] = 0;
        }
        c[n >> 2] = c[g >> 2] & 63;
        c[k >> 2] = c[g >> 2] >> 6;
        c[m >> 2] = 1;
        while (1) {
            if ((c[k >> 2] | 0) <= 0 ? (c[m >> 2] | 0) >= (b[(c[h >> 2] | 0) + 4 >> 1] | 0) : 0)
                break;
            c[n + (c[m >> 2] << 2) >> 2] = c[k >> 2] & 63;
            c[k >> 2] = c[k >> 2] >> 6;
            c[m >> 2] = (c[m >> 2] | 0) + 1;
        }
        while (1) {
            if ((c[m >> 2] | 0) <= (b[(c[h >> 2] | 0) + 4 >> 1] | 0))
                break;
            c[o >> 2] = (yield* dc(256)) | 0;
            a:
                do
                    if (b[(c[h >> 2] | 0) + 4 >> 1] | 0) {
                        c[c[o >> 2] >> 2] = c[c[h >> 2] >> 2];
                        c[k >> 2] = 1;
                        while (1) {
                            if ((c[k >> 2] | 0) >= 64)
                                break a;
                            c[(c[o >> 2] | 0) + (c[k >> 2] << 2) >> 2] = 0;
                            c[k >> 2] = (c[k >> 2] | 0) + 1;
                        }
                    } else {
                        c[k >> 2] = 0;
                        while (1) {
                            if ((c[k >> 2] | 0) >= 64)
                                break a;
                            d = Gc(c[5386] | 0) | 0;
                            c[(c[o >> 2] | 0) + (c[k >> 2] << 2) >> 2] = d;
                            c[k >> 2] = (c[k >> 2] | 0) + 1;
                        }
                    }
                while (0);
            c[c[h >> 2] >> 2] = c[o >> 2];
            d = (c[h >> 2] | 0) + 4 | 0;
            b[d >> 1] = (b[d >> 1] | 0) + 1 << 16 >> 16;
        }
        c[o >> 2] = c[c[h >> 2] >> 2];
        b:
            while (1) {
                d = c[m >> 2] | 0;
                c[m >> 2] = d + -1;
                if ((d | 0) <= 1)
                    break;
                c[l >> 2] = c[n + (c[m >> 2] << 2) >> 2];
                if (c[(c[o >> 2] | 0) + (c[l >> 2] << 2) >> 2] | 0) {
                    c[o >> 2] = c[(c[o >> 2] | 0) + (c[l >> 2] << 2) >> 2];
                    continue;
                }
                d = (yield* dc(256)) | 0;
                c[(c[o >> 2] | 0) + (c[l >> 2] << 2) >> 2] = d;
                c[o >> 2] = c[(c[o >> 2] | 0) + (c[l >> 2] << 2) >> 2];
                d = (c[m >> 2] | 0) > 1;
                c[k >> 2] = 0;
                if (d)
                    while (1) {
                        if ((c[k >> 2] | 0) >= 64)
                            continue b;
                        c[(c[o >> 2] | 0) + (c[k >> 2] << 2) >> 2] = 0;
                        c[k >> 2] = (c[k >> 2] | 0) + 1;
                    }
                else
                    while (1) {
                        if ((c[k >> 2] | 0) >= 64)
                            continue b;
                        d = Gc(c[5386] | 0) | 0;
                        c[(c[o >> 2] | 0) + (c[k >> 2] << 2) >> 2] = d;
                        c[k >> 2] = (c[k >> 2] | 0) + 1;
                    }
            }
        i = p;
        return (c[o >> 2] | 0) + (c[n >> 2] << 2) | 0;
    }
    function* Qb(b) {
        b = b | 0;
        var e = 0, f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0;
        r = i;
        i = i + 80 | 0;
        o = r + 56 | 0;
        n = r + 48 | 0;
        m = r + 40 | 0;
        l = r + 32 | 0;
        k = r + 24 | 0;
        q = r + 16 | 0;
        p = r + 8 | 0;
        j = r;
        e = r + 68 | 0;
        h = r + 64 | 0;
        f = r + 60 | 0;
        g = r + 72 | 0;
        c[e >> 2] = b;
        if ((c[e >> 2] | 0) > 3) {
            c[h >> 2] = (yield* Ob(c[e >> 2] | 0)) | 0;
            if (!(c[h >> 2] | 0)) {
                i = r;
                return;
            }
            Ec(c[h >> 2] | 0);
            q = Gc(c[c[5371] >> 2] | 0) | 0;
            c[c[h >> 2] >> 2] = q;
            i = r;
            return;
        }
        a[g >> 0] = 0;
        c[f >> 2] = 0;
        a:
            do
                if (!((Kc(c[c[5371] >> 2] | 0) | 0) << 24 >> 24)) {
                    c[f >> 2] = ad(c[c[5371] >> 2] | 0) | 0;
                    q = (Lc(c[c[5371] >> 2] | 0) | 0) << 24 >> 24 == 0;
                    if (q & (c[f >> 2] | 0) == 0)
                        a[g >> 0] = 1;
                } else
                    switch (c[e >> 2] | 0) {
                    case 0: {
                            yield* zc(13989, j);
                            c[f >> 2] = 2;
                            break a;
                        }
                    case 1: {
                            yield* zc(14014, p);
                            c[f >> 2] = 2;
                            break a;
                        }
                    case 2: {
                            yield* zc(14039, q);
                            c[f >> 2] = 0;
                            break a;
                        }
                    default:
                        break a;
                    }
            while (0);
        switch (c[e >> 2] | 0) {
        case 0: {
                if (!((c[f >> 2] | 0) >= 2 | (a[g >> 0] | 0) != 0)) {
                    c[5373] = 2;
                    yield* zc(14064, k);
                    i = r;
                    return;
                }
                if ((c[f >> 2] | 0) <= 16 ? (d[g >> 0] | 0) == 0 : 0) {
                    c[5373] = c[f >> 2];
                    i = r;
                    return;
                }
                c[5373] = 16;
                yield* zc(14090, l);
                i = r;
                return;
            }
        case 1: {
                if (!((c[f >> 2] | 0) >= 2 | (a[g >> 0] | 0) != 0)) {
                    c[5374] = 2;
                    yield* zc(14117, m);
                    i = r;
                    return;
                }
                if ((c[f >> 2] | 0) <= 2147483647 ? (d[g >> 0] | 0) == 0 : 0) {
                    c[5374] = c[f >> 2];
                    i = r;
                    return;
                }
                c[5374] = 2147483647;
                c[n >> 2] = 2147483647;
                yield* zc(14143, n);
                i = r;
                return;
            }
        case 2: {
                if ((c[f >> 2] | 0) <= 2147483647 ? (d[g >> 0] | 0) == 0 : 0) {
                    c[5375] = c[f >> 2];
                    i = r;
                    return;
                }
                c[5375] = 2147483647;
                c[o >> 2] = 2147483647;
                yield* zc(14170, o);
                i = r;
                return;
            }
        default: {
                i = r;
                return;
            }
        }
    }
    function* Rb(a) {
        a = a | 0;
        var b = 0, d = 0, e = 0, f = 0, g = 0;
        g = i;
        i = i + 16 | 0;
        f = g;
        b = g + 12 | 0;
        e = g + 8 | 0;
        d = g + 4 | 0;
        c[b >> 2] = a;
        if (!(((yield* Nb(2)) | 0) << 24 >> 24)) {
            i = g;
            return;
        }
        c[d >> 2] = ad(c[c[(c[5371] | 0) + 4 >> 2] >> 2] | 0) | 0;
        do
            if (!((c[d >> 2] | 0) < 0 | (c[d >> 2] | 0) > 16777215)) {
                if ((c[d >> 2] | 0) == 0 ? (Lc(c[c[(c[5371] | 0) + 4 >> 2] >> 2] | 0) | 0) << 24 >> 24 == 0 : 0)
                    break;
                c[e >> 2] = (yield* Pb(c[b >> 2] | 0, c[d >> 2] | 0)) | 0;
                if (!(c[e >> 2] | 0)) {
                    i = g;
                    return;
                }
                Ec(c[e >> 2] | 0);
                f = Gc(c[c[5371] >> 2] | 0) | 0;
                c[c[e >> 2] >> 2] = f;
                Ec(c[(c[5371] | 0) + 4 >> 2] | 0);
                c[c[(c[5371] | 0) + 4 >> 2] >> 2] = c[c[5371] >> 2];
                Hc(c[5371] | 0);
                Kb();
                i = g;
                return;
            }
        while (0);
        c[f >> 2] = c[(c[5369] | 0) + (c[b >> 2] << 2) >> 2];
        yield* yc(14197, f);
        i = g;
        return;
    }
    function* Sb(a) {
        a = a | 0;
        var b = 0, d = 0, e = 0;
        e = i;
        i = i + 16 | 0;
        b = e + 4 | 0;
        d = e;
        c[b >> 2] = a;
        switch (c[b >> 2] | 0) {
        case 0: {
                yield* Lb(c[5386] | 0);
                yield* cd(c[5371] | 0, c[5373] | 0);
                i = e;
                return;
            }
        case 1: {
                yield* Lb(c[5386] | 0);
                yield* cd(c[5371] | 0, c[5374] | 0);
                i = e;
                return;
            }
        case 2: {
                yield* Lb(c[5386] | 0);
                yield* cd(c[5371] | 0, c[5375] | 0);
                i = e;
                return;
            }
        default: {
                c[d >> 2] = c[(c[5365] | 0) + (c[b >> 2] << 2) >> 2];
                if (c[d >> 2] | 0) {
                    yield* Lb(c[c[d >> 2] >> 2] | 0);
                    i = e;
                    return;
                } else {
                    yield* Lb(c[5386] | 0);
                    i = e;
                    return;
                }
            }
        }
    }
    function* Tb(a) {
        a = a | 0;
        var b = 0, d = 0, e = 0, f = 0, g = 0;
        g = i;
        i = i + 16 | 0;
        f = g;
        b = g + 12 | 0;
        e = g + 8 | 0;
        d = g + 4 | 0;
        c[b >> 2] = a;
        if (!(((yield* Nb(1)) | 0) << 24 >> 24)) {
            i = g;
            return;
        }
        c[d >> 2] = ad(c[c[5371] >> 2] | 0) | 0;
        do
            if (!((c[d >> 2] | 0) < 0 | (c[d >> 2] | 0) > 16777215)) {
                if ((c[d >> 2] | 0) == 0 ? (Lc(c[c[5371] >> 2] | 0) | 0) << 24 >> 24 == 0 : 0)
                    break;
                c[e >> 2] = (yield* Pb(c[b >> 2] | 0, c[d >> 2] | 0)) | 0;
                if (!(c[e >> 2] | 0)) {
                    i = g;
                    return;
                }
                Kb();
                yield* Lb(c[c[e >> 2] >> 2] | 0);
                i = g;
                return;
            }
        while (0);
        c[f >> 2] = c[(c[5369] | 0) + (c[b >> 2] << 2) >> 2];
        yield* yc(14197, f);
        i = g;
        return;
    }
    function* Ub(a) {
        a = a | 0;
        var b = 0, d = 0, e = 0;
        e = i;
        i = i + 32 | 0;
        b = e + 24 | 0;
        d = e + 20 | 0;
        c[b >> 2] = a;
        switch (c[b >> 2] | 0) {
        case 0:
            if ((c[5373] | 0) > 2) {
                c[5373] = (c[5373] | 0) + -1;
                i = e;
                return;
            } else {
                yield* zc(14231, e);
                i = e;
                return;
            }
        case 1:
            if ((c[5374] | 0) > 2) {
                c[5374] = (c[5374] | 0) + -1;
                i = e;
                return;
            } else {
                yield* zc(14253, e + 8 | 0);
                i = e;
                return;
            }
        case 2:
            if ((c[5375] | 0) > 0) {
                c[5375] = (c[5375] | 0) + -1;
                i = e;
                return;
            } else {
                yield* zc(14275, e + 16 | 0);
                i = e;
                return;
            }
        default: {
                c[d >> 2] = (yield* Ob(c[b >> 2] | 0)) | 0;
                if (!(c[d >> 2] | 0)) {
                    i = e;
                    return;
                }
                yield* Nc(c[c[d >> 2] >> 2] | 0, c[5387] | 0, c[d >> 2] | 0, 0);
                i = e;
                return;
            }
        }
    }
    function* Vb(a) {
        a = a | 0;
        var b = 0, d = 0, e = 0, f = 0, g = 0;
        g = i;
        i = i + 16 | 0;
        f = g;
        b = g + 12 | 0;
        e = g + 8 | 0;
        d = g + 4 | 0;
        c[b >> 2] = a;
        if (!(((yield* Nb(1)) | 0) << 24 >> 24)) {
            i = g;
            return;
        }
        c[d >> 2] = ad(c[c[5371] >> 2] | 0) | 0;
        do
            if (!((c[d >> 2] | 0) < 0 | (c[d >> 2] | 0) > 16777215)) {
                if ((c[d >> 2] | 0) == 0 ? (Lc(c[c[5371] >> 2] | 0) | 0) << 24 >> 24 == 0 : 0)
                    break;
                c[e >> 2] = (yield* Pb(c[b >> 2] | 0, c[d >> 2] | 0)) | 0;
                if (!(c[e >> 2] | 0)) {
                    i = g;
                    return;
                }
                Kb();
                yield* Nc(c[c[e >> 2] >> 2] | 0, c[5387] | 0, c[e >> 2] | 0, 0);
                i = g;
                return;
            }
        while (0);
        c[f >> 2] = c[(c[5369] | 0) + (c[b >> 2] << 2) >> 2];
        yield* yc(14197, f);
        i = g;
        return;
    }
    function* Wb(a) {
        a = a | 0;
        var b = 0, d = 0, e = 0;
        e = i;
        i = i + 32 | 0;
        b = e + 24 | 0;
        d = e + 20 | 0;
        c[b >> 2] = a;
        switch (c[b >> 2] | 0) {
        case 0:
            if ((c[5373] | 0) < 16) {
                c[5373] = (c[5373] | 0) + 1;
                i = e;
                return;
            } else {
                yield* zc(14308, e);
                i = e;
                return;
            }
        case 1:
            if ((c[5374] | 0) < 2147483647) {
                c[5374] = (c[5374] | 0) + 1;
                i = e;
                return;
            } else {
                yield* zc(14328, e + 8 | 0);
                i = e;
                return;
            }
        case 2:
            if ((c[5375] | 0) < 2147483647) {
                c[5375] = (c[5375] | 0) + 1;
                i = e;
                return;
            } else {
                yield* zc(14348, e + 16 | 0);
                i = e;
                return;
            }
        default: {
                c[d >> 2] = (yield* Ob(c[b >> 2] | 0)) | 0;
                if (!(c[d >> 2] | 0)) {
                    i = e;
                    return;
                }
                yield* Rc(c[c[d >> 2] >> 2] | 0, c[5387] | 0, c[d >> 2] | 0, 0);
                i = e;
                return;
            }
        }
    }
    function* Xb(a) {
        a = a | 0;
        var b = 0, d = 0, e = 0, f = 0, g = 0;
        g = i;
        i = i + 16 | 0;
        f = g;
        b = g + 12 | 0;
        e = g + 8 | 0;
        d = g + 4 | 0;
        c[b >> 2] = a;
        if (!(((yield* Nb(1)) | 0) << 24 >> 24)) {
            i = g;
            return;
        }
        c[d >> 2] = ad(c[c[5371] >> 2] | 0) | 0;
        do
            if (!((c[d >> 2] | 0) < 0 | (c[d >> 2] | 0) > 16777215)) {
                if ((c[d >> 2] | 0) == 0 ? (Lc(c[c[5371] >> 2] | 0) | 0) << 24 >> 24 == 0 : 0)
                    break;
                c[e >> 2] = (yield* Pb(c[b >> 2] | 0, c[d >> 2] | 0)) | 0;
                if (!(c[e >> 2] | 0)) {
                    i = g;
                    return;
                }
                Kb();
                yield* Rc(c[c[e >> 2] >> 2] | 0, c[5387] | 0, c[e >> 2] | 0, 0);
                i = g;
                return;
            }
        while (0);
        c[f >> 2] = c[(c[5369] | 0) + (c[b >> 2] << 2) >> 2];
        yield* yc(14197, f);
        i = g;
        return;
    }
    function* Yb(b) {
        b = b | 0;
        var d = 0, e = 0, f = 0, g = 0, h = 0;
        g = i;
        i = i + 16 | 0;
        h = g + 12 | 0;
        f = g + 8 | 0;
        d = g + 4 | 0;
        e = g;
        c[h >> 2] = b;
        b = c[h >> 2] | 0;
        if ((c[h >> 2] | 0) > 0) {
            c[e >> 2] = b;
            c[f >> 2] = (yield* dc(8)) | 0;
            c[(c[f >> 2] | 0) + 4 >> 2] = c[(c[5365] | 0) + (c[e >> 2] << 2) >> 2];
            Hc(c[f >> 2] | 0);
            c[(c[5365] | 0) + (c[e >> 2] << 2) >> 2] = c[f >> 2];
            i = g;
            return;
        } else {
            c[e >> 2] = 0 - b;
            c[d >> 2] = (yield* dc(12)) | 0;
            c[(c[d >> 2] | 0) + 8 >> 2] = c[(c[5368] | 0) + (c[e >> 2] << 2) >> 2];
            c[c[d >> 2] >> 2] = 0;
            a[(c[d >> 2] | 0) + 4 >> 0] = 0;
            c[(c[5368] | 0) + (c[e >> 2] << 2) >> 2] = c[d >> 2];
            i = g;
            return;
        }
    }
    function Zb(a, b) {
        a = a | 0;
        b = b | 0;
        var d = 0, e = 0, f = 0, g = 0;
        g = i;
        i = i + 16 | 0;
        d = g + 8 | 0;
        e = g + 4 | 0;
        f = g;
        c[d >> 2] = a;
        c[e >> 2] = b;
        if (!(c[d >> 2] | 0)) {
            i = g;
            return;
        }
        a = (c[e >> 2] | 0) > 1;
        c[f >> 2] = 0;
        a:
            do
                if (a)
                    while (1) {
                        if ((c[f >> 2] | 0) >= 64)
                            break a;
                        Zb(c[(c[d >> 2] | 0) + (c[f >> 2] << 2) >> 2] | 0, (c[e >> 2] | 0) - 1 | 0);
                        c[f >> 2] = (c[f >> 2] | 0) + 1;
                    }
                else
                    while (1) {
                        if ((c[f >> 2] | 0) >= 64)
                            break a;
                        Ec((c[d >> 2] | 0) + (c[f >> 2] << 2) | 0);
                        c[f >> 2] = (c[f >> 2] | 0) + 1;
                    }
            while (0);
        se(c[d >> 2] | 0);
        i = g;
        return;
    }
    function _b(d) {
        d = d | 0;
        var e = 0, f = 0, g = 0, h = 0, j = 0;
        j = i;
        i = i + 16 | 0;
        e = j + 12 | 0;
        h = j + 8 | 0;
        f = j + 4 | 0;
        g = j;
        c[e >> 2] = d;
        while (1) {
            if (!(c[e >> 2] | 0))
                break;
            c[g >> 2] = c[c[e >> 2] >> 2];
            d = c[g >> 2] | 0;
            if ((c[g >> 2] | 0) > 0) {
                c[h >> 2] = c[(c[5365] | 0) + (d << 2) >> 2];
                if (c[h >> 2] | 0) {
                    c[(c[5365] | 0) + (c[g >> 2] << 2) >> 2] = c[(c[h >> 2] | 0) + 4 >> 2];
                    Ec(c[h >> 2] | 0);
                    se(c[h >> 2] | 0);
                }
            } else {
                c[g >> 2] = 0 - d;
                c[f >> 2] = c[(c[5368] | 0) + (c[g >> 2] << 2) >> 2];
                if (c[f >> 2] | 0) {
                    c[(c[5368] | 0) + (c[g >> 2] << 2) >> 2] = c[(c[f >> 2] | 0) + 8 >> 2];
                    if ((a[(c[f >> 2] | 0) + 4 >> 0] | 0) == 0 ? c[c[f >> 2] >> 2] | 0 : 0) {
                        Zb(c[c[c[f >> 2] >> 2] >> 2] | 0, b[(c[c[f >> 2] >> 2] | 0) + 4 >> 1] | 0);
                        se(c[c[f >> 2] >> 2] | 0);
                    }
                    se(c[f >> 2] | 0);
                }
            }
            c[e >> 2] = c[(c[e >> 2] | 0) + 8 >> 2];
        }
        i = j;
        return;
    }
    function* $b(a, b) {
        a = a | 0;
        b = b | 0;
        var d = 0, e = 0, f = 0, g = 0, h = 0;
        h = i;
        i = i + 16 | 0;
        e = h + 12 | 0;
        d = h + 8 | 0;
        g = h + 4 | 0;
        f = h;
        c[e >> 2] = a;
        c[d >> 2] = b;
        c[g >> 2] = (yield* dc(256)) | 0;
        b = (c[d >> 2] | 0) > 1;
        c[f >> 2] = 0;
        if (b) {
            while (1) {
                if ((c[f >> 2] | 0) >= 64)
                    break;
                a = c[f >> 2] | 0;
                if (c[(c[e >> 2] | 0) + (c[f >> 2] << 2) >> 2] | 0) {
                    b = (yield* $b(c[(c[e >> 2] | 0) + (a << 2) >> 2] | 0, (c[d >> 2] | 0) - 1 | 0)) | 0;
                    c[(c[g >> 2] | 0) + (c[f >> 2] << 2) >> 2] = b;
                } else
                    c[(c[g >> 2] | 0) + (a << 2) >> 2] = 0;
                c[f >> 2] = (c[f >> 2] | 0) + 1;
            }
            g = c[g >> 2] | 0;
            i = h;
            return g | 0;
        } else {
            while (1) {
                if ((c[f >> 2] | 0) >= 64)
                    break;
                a = c[f >> 2] | 0;
                if (c[(c[e >> 2] | 0) + (c[f >> 2] << 2) >> 2] | 0) {
                    d = Gc(c[(c[e >> 2] | 0) + (a << 2) >> 2] | 0) | 0;
                    c[(c[g >> 2] | 0) + (c[f >> 2] << 2) >> 2] = d;
                } else
                    c[(c[g >> 2] | 0) + (a << 2) >> 2] = 0;
                c[f >> 2] = (c[f >> 2] | 0) + 1;
            }
            g = c[g >> 2] | 0;
            i = h;
            return g | 0;
        }
        return 0;
    }
    function* ac(a) {
        a = a | 0;
        var d = 0, e = 0, f = 0;
        e = i;
        i = i + 16 | 0;
        f = e + 4 | 0;
        d = e;
        c[f >> 2] = a;
        c[d >> 2] = (yield* dc(8)) | 0;
        b[(c[d >> 2] | 0) + 4 >> 1] = b[(c[f >> 2] | 0) + 4 >> 1] | 0;
        a = (yield* $b(c[c[f >> 2] >> 2] | 0, b[(c[f >> 2] | 0) + 4 >> 1] | 0)) | 0;
        c[c[d >> 2] >> 2] = a;
        i = e;
        return c[d >> 2] | 0;
    }
    function* bc(b, e) {
        b = b | 0;
        e = e | 0;
        var f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0;
        u = i;
        i = i + 80 | 0;
        s = u + 24 | 0;
        r = u + 16 | 0;
        q = u + 8 | 0;
        p = u;
        f = u + 60 | 0;
        v = u + 56 | 0;
        j = u + 64 | 0;
        n = u + 52 | 0;
        k = u + 48 | 0;
        l = u + 44 | 0;
        o = u + 40 | 0;
        h = u + 36 | 0;
        g = u + 32 | 0;
        m = u + 28 | 0;
        c[f >> 2] = b;
        c[v >> 2] = e;
        c[n >> 2] = c[(c[5362] | 0) + ((c[v >> 2] | 0) * 28 | 0) + 20 >> 2];
        while (1) {
            v = rb(c[f >> 2] | 0) | 0;
            a[j >> 0] = v;
            e = (c[n >> 2] | 0) != 0;
            if ((v & 255 | 0) == 58)
                break;
            if (!e) {
                t = 20;
                break;
            }
            if ((d[j >> 0] | 0 | 0) == 48 ? (c[c[n >> 2] >> 2] | 0) > 0 : 0) {
                c[k >> 2] = c[c[n >> 2] >> 2];
                c[o >> 2] = (yield* dc(8)) | 0;
                c[(c[o >> 2] | 0) + 4 >> 2] = c[(c[5365] | 0) + (c[k >> 2] << 2) >> 2];
                c[c[o >> 2] >> 2] = c[c[5371] >> 2];
                Hc(c[5371] | 0);
                c[(c[5365] | 0) + (c[k >> 2] << 2) >> 2] = c[o >> 2];
            } else
                t = 7;
            do
                if ((t | 0) == 7) {
                    t = 0;
                    if ((d[j >> 0] | 0 | 0) == 49 ? (c[c[n >> 2] >> 2] | 0) < 0 : 0) {
                        c[k >> 2] = ad(c[c[5371] >> 2] | 0) | 0;
                        c[m >> 2] = (yield* Pb(c[k >> 2] | 0, 0)) | 0;
                        yield* Yb(c[c[n >> 2] >> 2] | 0);
                        c[l >> 2] = 0 - (c[c[n >> 2] >> 2] | 0);
                        e = c[(c[5368] | 0) + (c[k >> 2] << 2) >> 2] | 0;
                        if ((c[k >> 2] | 0) == (c[l >> 2] | 0))
                            c[h >> 2] = c[e + 8 >> 2];
                        else
                            c[h >> 2] = e;
                        c[g >> 2] = c[(c[5368] | 0) + (c[l >> 2] << 2) >> 2];
                        e = (c[g >> 2] | 0) + 4 | 0;
                        if (c[(c[n >> 2] | 0) + 4 >> 2] | 0) {
                            a[e >> 0] = 1;
                            c[c[g >> 2] >> 2] = c[c[h >> 2] >> 2];
                            break;
                        } else {
                            a[e >> 0] = 0;
                            v = (yield* ac(c[c[h >> 2] >> 2] | 0)) | 0;
                            c[c[g >> 2] >> 2] = v;
                            break;
                        }
                    }
                    e = c[c[n >> 2] >> 2] | 0;
                    if ((c[c[n >> 2] >> 2] | 0) < 0) {
                        c[p >> 2] = c[(c[5369] | 0) + (0 - e << 2) >> 2];
                        yield* yc(14368, p);
                    } else {
                        c[q >> 2] = c[(c[5366] | 0) + (e << 2) >> 2];
                        yield* yc(14406, q);
                    }
                    c[n >> 2] = (c[n >> 2] | 0) + 12;
                }
            while (0);
            Kb();
            c[n >> 2] = c[(c[n >> 2] | 0) + 8 >> 2];
        }
        if ((t | 0) == 20) {
            yield* yc(14445, r);
            i = u;
            return;
        }
        if (!e) {
            i = u;
            return;
        }
        yield* yc(14445, s);
        i = u;
        return;
    }
    function* cc(a) {
        a = a | 0;
        var b = 0, d = 0, e = 0;
        b = i;
        i = i + 16 | 0;
        d = b + 4 | 0;
        e = b;
        c[d >> 2] = a;
        c[e >> 2] = (yield* dc((pd(c[d >> 2] | 0) | 0) + 1 | 0)) | 0;
        a = Pd(c[e >> 2] | 0, c[d >> 2] | 0) | 0;
        i = b;
        return a | 0;
    }
    function* dc(a) {
        a = a | 0;
        var b = 0, d = 0, e = 0;
        d = i;
        i = i + 16 | 0;
        e = d + 4 | 0;
        b = d;
        c[e >> 2] = a;
        c[b >> 2] = re(c[e >> 2] | 0) | 0;
        if (!(c[b >> 2] | 0))
            yield* ec();
        i = d;
        return c[b >> 2] | 0;
    }
    function* ec() {
        var a = 0;
        a = i;
        i = i + 16 | 0;
        (yield* _d(c[508] | 0, 14471, a)) | 0;
        Ea(1);
    }
    function* fc(a, b, d) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0, g = 0, h = 0, j = 0;
        f = i;
        i = i + 16 | 0;
        g = f + 12 | 0;
        j = f + 8 | 0;
        h = f + 4 | 0;
        e = f;
        c[g >> 2] = a;
        c[j >> 2] = b;
        c[h >> 2] = d;
        c[e >> 2] = (yield* dc(12)) | 0;
        c[c[e >> 2] >> 2] = c[j >> 2];
        c[(c[e >> 2] | 0) + 4 >> 2] = c[h >> 2];
        c[(c[e >> 2] | 0) + 8 >> 2] = c[g >> 2];
        i = f;
        return c[e >> 2] | 0;
    }
    function* gc(a) {
        a = a | 0;
        var b = 0, d = 0;
        d = i;
        i = i + 16 | 0;
        b = d;
        c[b >> 2] = a;
        if (c[5346] | 0)
            se(c[5346] | 0);
        c[5346] = c[5347];
        c[5347] = (yield* hc(c[b >> 2] | 0, 1)) | 0;
        i = d;
        return c[5347] | 0;
    }
    function* hc(b, d) {
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0;
        o = i;
        i = i + 64 | 0;
        n = o + 24 | 0;
        m = o + 16 | 0;
        l = o + 8 | 0;
        k = o;
        f = o + 40 | 0;
        g = o + 36 | 0;
        e = o + 32 | 0;
        j = o + 28 | 0;
        h = o + 44 | 0;
        c[g >> 2] = b;
        c[e >> 2] = d;
        if (!(c[g >> 2] | 0)) {
            c[j >> 2] = (yield* dc(c[e >> 2] | 0)) | 0;
            a[c[j >> 2] >> 0] = 0;
            c[f >> 2] = c[j >> 2];
            n = c[f >> 2] | 0;
            i = o;
            return n | 0;
        }
        c[j >> 2] = (yield* hc(c[(c[g >> 2] | 0) + 8 >> 2] | 0, (c[e >> 2] | 0) + 12 | 0)) | 0;
        e = (c[e >> 2] | 0) != 1;
        b = c[c[g >> 2] >> 2] | 0;
        do
            if (c[(c[g >> 2] | 0) + 4 >> 2] | 0)
                if (e) {
                    c[k >> 2] = b;
                    (yield* $d(h, 14511, k)) | 0;
                    break;
                } else {
                    c[l >> 2] = b;
                    (yield* $d(h, 14516, l)) | 0;
                    break;
                }
            else if (e) {
                c[m >> 2] = b;
                (yield* $d(h, 14520, m)) | 0;
                break;
            } else {
                c[n >> 2] = b;
                (yield* $d(h, 14524, n)) | 0;
                break;
            }
        while (0);
        c[j >> 2] = ne(c[j >> 2] | 0, h) | 0;
        c[f >> 2] = c[j >> 2];
        n = c[f >> 2] | 0;
        i = o;
        return n | 0;
    }
    function* ic(b) {
        b = b | 0;
        var d = 0, e = 0, f = 0, g = 0, h = 0;
        h = i;
        i = i + 16 | 0;
        d = h + 12 | 0;
        g = h + 8 | 0;
        e = h + 4 | 0;
        f = h;
        c[d >> 2] = b;
        if (c[5346] | 0)
            se(c[5346] | 0);
        c[5346] = c[5347];
        c[g >> 2] = c[d >> 2];
        c[e >> 2] = 0;
        while (1) {
            b = (c[e >> 2] | 0) + 1 | 0;
            if (!(c[g >> 2] | 0))
                break;
            c[e >> 2] = b;
            c[g >> 2] = c[(c[g >> 2] | 0) + 8 >> 2];
        }
        c[5347] = (yield* dc(b)) | 0;
        c[g >> 2] = c[d >> 2];
        c[f >> 2] = 0;
        while (1) {
            if (!(c[g >> 2] | 0))
                break;
            d = (c[c[g >> 2] >> 2] | 0 ? 49 : 48) & 255;
            e = c[f >> 2] | 0;
            c[f >> 2] = e + 1;
            a[(c[5347] | 0) + e >> 0] = d;
            c[g >> 2] = c[(c[g >> 2] | 0) + 8 >> 2];
        }
        a[(c[5347] | 0) + (c[f >> 2] | 0) >> 0] = 0;
        i = h;
        return c[5347] | 0;
    }
    function jc(a) {
        a = a | 0;
        var b = 0, d = 0, e = 0;
        e = i;
        i = i + 16 | 0;
        b = e + 4 | 0;
        d = e;
        c[b >> 2] = a;
        c[d >> 2] = c[b >> 2];
        while (1) {
            if (!(c[d >> 2] | 0))
                break;
            c[b >> 2] = c[(c[b >> 2] | 0) + 8 >> 2];
            se(c[d >> 2] | 0);
            c[d >> 2] = c[b >> 2];
        }
        i = e;
        return;
    }
    function* kc(a, b) {
        a = a | 0;
        b = b | 0;
        var d = 0, e = 0, f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0;
        n = i;
        i = i + 64 | 0;
        m = n + 32 | 0;
        l = n + 24 | 0;
        k = n + 16 | 0;
        j = n + 8 | 0;
        h = n;
        d = n + 48 | 0;
        e = n + 44 | 0;
        f = n + 40 | 0;
        g = n + 36 | 0;
        c[d >> 2] = a;
        c[e >> 2] = b;
        a:
            do
                if (c[d >> 2] | 0) {
                    c[f >> 2] = c[d >> 2];
                    while (1) {
                        if (!(c[f >> 2] | 0))
                            break a;
                        c[g >> 2] = c[(c[f >> 2] | 0) + 8 >> 2];
                        while (1) {
                            if (!(c[g >> 2] | 0))
                                break;
                            if ((c[c[g >> 2] >> 2] | 0) == (c[c[f >> 2] >> 2] | 0))
                                yield* lc(14527, h);
                            c[g >> 2] = c[(c[g >> 2] | 0) + 8 >> 2];
                        }
                        if (c[(c[f >> 2] | 0) + 4 >> 2] | 0)
                            yield* mc(14575, j);
                        c[f >> 2] = c[(c[f >> 2] | 0) + 8 >> 2];
                    }
                }
            while (0);
        b:
            do
                if (c[e >> 2] | 0) {
                    c[f >> 2] = c[e >> 2];
                    while (1) {
                        if (!(c[f >> 2] | 0))
                            break b;
                        c[g >> 2] = c[(c[f >> 2] | 0) + 8 >> 2];
                        while (1) {
                            if (!(c[g >> 2] | 0))
                                break;
                            if ((c[c[g >> 2] >> 2] | 0) == (c[c[f >> 2] >> 2] | 0))
                                yield* lc(14633, k);
                            c[g >> 2] = c[(c[g >> 2] | 0) + 8 >> 2];
                        }
                        if (c[(c[f >> 2] | 0) + 4 >> 2] | 0)
                            yield* lc(14663, l);
                        c[f >> 2] = c[(c[f >> 2] | 0) + 8 >> 2];
                    }
                }
            while (0);
        if (!((c[d >> 2] | 0) != 0 & (c[e >> 2] | 0) != 0)) {
            i = n;
            return;
        }
        c[f >> 2] = c[d >> 2];
        while (1) {
            if (!(c[f >> 2] | 0))
                break;
            c[g >> 2] = c[e >> 2];
            while (1) {
                if (!(c[g >> 2] | 0))
                    break;
                if ((c[c[g >> 2] >> 2] | 0) == (c[c[f >> 2] >> 2] | 0))
                    yield* lc(14682, m);
                c[g >> 2] = c[(c[g >> 2] | 0) + 8 >> 2];
            }
            c[f >> 2] = c[(c[f >> 2] | 0) + 8 >> 2];
        }
        i = n;
        return;
    }
    function* lc(b, d) {
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0, g = 0, h = 0, j = 0;
        j = i;
        i = i + 48 | 0;
        h = j;
        e = j + 36 | 0;
        g = j + 32 | 0;
        f = j + 16 | 0;
        c[e >> 2] = b;
        c[f >> 2] = d;
        if (a[22131] | 0)
            c[g >> 2] = 14553;
        else
            c[g >> 2] = c[5361];
        d = c[508] | 0;
        b = c[5380] | 0;
        c[h >> 2] = c[g >> 2];
        c[h + 4 >> 2] = b;
        (yield* _d(d, 14567, h)) | 0;
        (yield* Dd(c[508] | 0, c[e >> 2] | 0, f)) | 0;
        (yield* _d(c[508] | 0, 21260, j + 8 | 0)) | 0;
        c[5381] = 1;
        i = j;
        return;
    }
    function* mc(b, d) {
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0;
        m = i;
        i = i + 64 | 0;
        l = m + 24 | 0;
        k = m + 16 | 0;
        j = m + 8 | 0;
        h = m;
        e = m + 52 | 0;
        g = m + 48 | 0;
        f = m + 32 | 0;
        c[e >> 2] = b;
        c[f >> 2] = d;
        if (c[5353] | 0) {
            if (a[22131] | 0)
                c[g >> 2] = 14553;
            else
                c[g >> 2] = c[5361];
            d = c[508] | 0;
            l = c[5380] | 0;
            c[h >> 2] = c[g >> 2];
            c[h + 4 >> 2] = l;
            (yield* _d(d, 14600, h)) | 0;
            (yield* Dd(c[508] | 0, c[e >> 2] | 0, f)) | 0;
            (yield* _d(c[508] | 0, 21260, j)) | 0;
            c[5381] = 1;
            i = m;
            return;
        }
        if (!(c[5352] | 0)) {
            i = m;
            return;
        }
        if (a[22131] | 0)
            c[g >> 2] = 14553;
        else
            c[g >> 2] = c[5361];
        d = c[508] | 0;
        j = c[5380] | 0;
        c[k >> 2] = c[g >> 2];
        c[k + 4 >> 2] = j;
        (yield* _d(d, 14615, k)) | 0;
        (yield* Dd(c[508] | 0, c[e >> 2] | 0, f)) | 0;
        (yield* _d(c[508] | 0, 21260, l)) | 0;
        i = m;
        return;
    }
    function* nc(a) {
        a = a | 0;
        var b = 0, d = 0;
        d = i;
        i = i + 16 | 0;
        b = d;
        c[b >> 2] = a;
        if ((c[b >> 2] | 0) <= (c[5349] | 0)) {
            i = d;
            return;
        }
        if (c[5348] | 0)
            se(c[5348] | 0);
        c[5348] = (yield* dc(c[b >> 2] | 0)) | 0;
        c[5349] = c[b >> 2];
        i = d;
        return;
    }
    function* oc() {
        var b = 0;
        b = i;
        i = i + 16 | 0;
        c[5356] = 0;
        c[5358] = 0;
        c[5359] = 1;
        c[5360] = 2;
        if (c[5350] | 0)
            (yield* he(14724, b)) | 0;
        else
            yb();
        c[5381] = 0;
        a[22130] = 0;
        yield* nc(64);
        i = b;
        return;
    }
    function* pc(b) {
        b = b | 0;
        var d = 0, e = 0, f = 0;
        f = i;
        i = i + 16 | 0;
        e = f;
        d = f + 12 | 0;
        c[d >> 2] = b;
        a[22130] = 1;
        b = c[d >> 2] | 0;
        if (!(c[5350] | 0)) {
            yield* Cb(b);
            i = f;
            return;
        }
        c[e >> 2] = b;
        (yield* he(14727, e)) | 0;
        e = pd(c[d >> 2] | 0) | 0;
        c[5360] = (c[5360] | 0) + e;
        if ((c[5360] | 0) <= 60) {
            i = f;
            return;
        }
        (yield* he(21260, f + 8 | 0)) | 0;
        c[5360] = 0;
        i = f;
        return;
    }
    function* qc() {
        var b = 0, e = 0;
        e = i;
        i = i + 16 | 0;
        b = e;
        do
            if ((c[5381] | 0) == 0 ? d[22130] | 0 : 0)
                if (c[5350] | 0) {
                    (yield* he(14730, b)) | 0;
                    c[5360] = 0;
                    break;
                } else {
                    yield* sb();
                    break;
                }
        while (0);
        if (a[22130] | 0) {
            yield* oc();
            i = e;
            return;
        } else {
            c[5381] = 0;
            i = e;
            return;
        }
    }
    function* rc(a) {
        a = a | 0;
        var b = 0, d = 0;
        d = i;
        i = i + 16 | 0;
        b = d;
        c[b >> 2] = a;
        if ((c[b >> 2] | 0) == 10) {
            c[5378] = 0;
            (yield* je(10)) | 0;
            i = d;
            return;
        }
        c[5378] = (c[5378] | 0) + 1;
        if (c[5379] | 0 ? (c[5378] | 0) == ((c[5379] | 0) - 1 | 0) : 0) {
            (yield* je(92)) | 0;
            (yield* je(10)) | 0;
            c[5378] = 1;
        }
        (yield* je(c[b >> 2] | 0)) | 0;
        i = d;
        return;
    }
    function* sc(a) {
        a = a | 0;
        var b = 0, d = 0;
        d = i;
        i = i + 16 | 0;
        b = d;
        c[b >> 2] = a;
        if ((c[b >> 2] | 0) == 10) {
            c[5378] = 0;
            (yield* je(10)) | 0;
            i = d;
            return;
        }
        if ((c[5353] | 0) == 0 ? (c[5378] = (c[5378] | 0) + 1, c[5379] | 0 ? (c[5378] | 0) == ((c[5379] | 0) - 1 | 0) : 0) : 0) {
            (yield* je(92)) | 0;
            (yield* je(10)) | 0;
            c[5378] = 1;
        }
        (yield* je(c[b >> 2] | 0)) | 0;
        i = d;
        return;
    }
    function tc(a, b) {
        a = a | 0;
        b = b | 0;
        var d = 0, e = 0, f = 0, g = 0, h = 0;
        h = i;
        i = i + 16 | 0;
        e = h + 12 | 0;
        d = h + 8 | 0;
        f = h + 4 | 0;
        g = h;
        c[d >> 2] = a;
        c[f >> 2] = b;
        do
            if (c[d >> 2] | 0) {
                c[g >> 2] = Rd(c[f >> 2] | 0, c[c[d >> 2] >> 2] | 0) | 0;
                if (!(c[g >> 2] | 0)) {
                    c[e >> 2] = c[d >> 2];
                    break;
                }
                d = c[d >> 2] | 0;
                if ((c[g >> 2] | 0) < 0) {
                    c[e >> 2] = tc(c[d + 20 >> 2] | 0, c[f >> 2] | 0) | 0;
                    break;
                } else {
                    c[e >> 2] = tc(c[d + 24 >> 2] | 0, c[f >> 2] | 0) | 0;
                    break;
                }
            } else
                c[e >> 2] = 0;
        while (0);
        i = h;
        return c[e >> 2] | 0;
    }
    function uc(a, d) {
        a = a | 0;
        d = d | 0;
        var e = 0, f = 0, g = 0, h = 0, j = 0, k = 0;
        k = i;
        i = i + 32 | 0;
        f = k + 16 | 0;
        g = k + 12 | 0;
        e = k + 8 | 0;
        h = k + 4 | 0;
        j = k;
        c[g >> 2] = a;
        c[e >> 2] = d;
        d = c[e >> 2] | 0;
        if (!(c[c[g >> 2] >> 2] | 0)) {
            c[c[g >> 2] >> 2] = d;
            c[(c[e >> 2] | 0) + 20 >> 2] = 0;
            c[(c[e >> 2] | 0) + 24 >> 2] = 0;
            b[(c[e >> 2] | 0) + 16 >> 1] = 0;
            c[f >> 2] = 1;
            j = c[f >> 2] | 0;
            i = k;
            return j | 0;
        }
        a = (Rd(c[d >> 2] | 0, c[c[c[g >> 2] >> 2] >> 2] | 0) | 0) < 0;
        d = c[c[g >> 2] >> 2] | 0;
        a:
            do
                if (a) {
                    if (uc(d + 20 | 0, c[e >> 2] | 0) | 0) {
                        e = (c[c[g >> 2] >> 2] | 0) + 16 | 0;
                        b[e >> 1] = (b[e >> 1] | 0) + -1 << 16 >> 16;
                        switch (b[(c[c[g >> 2] >> 2] | 0) + 16 >> 1] | 0) {
                        case 0: {
                                c[f >> 2] = 0;
                                j = c[f >> 2] | 0;
                                i = k;
                                return j | 0;
                            }
                        case -1: {
                                c[f >> 2] = 1;
                                j = c[f >> 2] | 0;
                                i = k;
                                return j | 0;
                            }
                        case -2: {
                                c[h >> 2] = c[c[g >> 2] >> 2];
                                c[j >> 2] = c[(c[c[g >> 2] >> 2] | 0) + 20 >> 2];
                                d = c[(c[j >> 2] | 0) + 24 >> 2] | 0;
                                if ((b[(c[j >> 2] | 0) + 16 >> 1] | 0) <= 0) {
                                    c[(c[h >> 2] | 0) + 20 >> 2] = d;
                                    c[(c[j >> 2] | 0) + 24 >> 2] = c[h >> 2];
                                    c[c[g >> 2] >> 2] = c[j >> 2];
                                    b[(c[h >> 2] | 0) + 16 >> 1] = 0;
                                    b[(c[j >> 2] | 0) + 16 >> 1] = 0;
                                    break a;
                                }
                                c[c[g >> 2] >> 2] = d;
                                c[(c[j >> 2] | 0) + 24 >> 2] = c[(c[c[g >> 2] >> 2] | 0) + 20 >> 2];
                                c[(c[h >> 2] | 0) + 20 >> 2] = c[(c[c[g >> 2] >> 2] | 0) + 24 >> 2];
                                c[(c[c[g >> 2] >> 2] | 0) + 20 >> 2] = c[j >> 2];
                                c[(c[c[g >> 2] >> 2] | 0) + 24 >> 2] = c[h >> 2];
                                switch (b[(c[c[g >> 2] >> 2] | 0) + 16 >> 1] | 0) {
                                case -1: {
                                        b[(c[h >> 2] | 0) + 16 >> 1] = 1;
                                        b[(c[j >> 2] | 0) + 16 >> 1] = 0;
                                        break;
                                    }
                                case 0: {
                                        b[(c[h >> 2] | 0) + 16 >> 1] = 0;
                                        b[(c[j >> 2] | 0) + 16 >> 1] = 0;
                                        break;
                                    }
                                case 1: {
                                        b[(c[h >> 2] | 0) + 16 >> 1] = 0;
                                        b[(c[j >> 2] | 0) + 16 >> 1] = -1;
                                        break;
                                    }
                                default: {
                                    }
                                }
                                b[(c[c[g >> 2] >> 2] | 0) + 16 >> 1] = 0;
                                break a;
                            }
                        default:
                            break a;
                        }
                    }
                } else if (uc(d + 24 | 0, c[e >> 2] | 0) | 0) {
                    e = (c[c[g >> 2] >> 2] | 0) + 16 | 0;
                    b[e >> 1] = (b[e >> 1] | 0) + 1 << 16 >> 16;
                    switch (b[(c[c[g >> 2] >> 2] | 0) + 16 >> 1] | 0) {
                    case 0: {
                            c[f >> 2] = 0;
                            j = c[f >> 2] | 0;
                            i = k;
                            return j | 0;
                        }
                    case 1: {
                            c[f >> 2] = 1;
                            j = c[f >> 2] | 0;
                            i = k;
                            return j | 0;
                        }
                    case 2: {
                            c[h >> 2] = c[c[g >> 2] >> 2];
                            c[j >> 2] = c[(c[c[g >> 2] >> 2] | 0) + 24 >> 2];
                            d = c[(c[j >> 2] | 0) + 20 >> 2] | 0;
                            if ((b[(c[j >> 2] | 0) + 16 >> 1] | 0) >= 0) {
                                c[(c[h >> 2] | 0) + 24 >> 2] = d;
                                c[(c[j >> 2] | 0) + 20 >> 2] = c[h >> 2];
                                c[c[g >> 2] >> 2] = c[j >> 2];
                                b[(c[h >> 2] | 0) + 16 >> 1] = 0;
                                b[(c[j >> 2] | 0) + 16 >> 1] = 0;
                                break a;
                            }
                            c[c[g >> 2] >> 2] = d;
                            c[(c[j >> 2] | 0) + 20 >> 2] = c[(c[c[g >> 2] >> 2] | 0) + 24 >> 2];
                            c[(c[h >> 2] | 0) + 24 >> 2] = c[(c[c[g >> 2] >> 2] | 0) + 20 >> 2];
                            c[(c[c[g >> 2] >> 2] | 0) + 20 >> 2] = c[h >> 2];
                            c[(c[c[g >> 2] >> 2] | 0) + 24 >> 2] = c[j >> 2];
                            switch (b[(c[c[g >> 2] >> 2] | 0) + 16 >> 1] | 0) {
                            case -1: {
                                    b[(c[h >> 2] | 0) + 16 >> 1] = 0;
                                    b[(c[j >> 2] | 0) + 16 >> 1] = 1;
                                    break;
                                }
                            case 0: {
                                    b[(c[h >> 2] | 0) + 16 >> 1] = 0;
                                    b[(c[j >> 2] | 0) + 16 >> 1] = 0;
                                    break;
                                }
                            case 1: {
                                    b[(c[h >> 2] | 0) + 16 >> 1] = -1;
                                    b[(c[j >> 2] | 0) + 16 >> 1] = 0;
                                    break;
                                }
                            default: {
                                }
                            }
                            b[(c[c[g >> 2] >> 2] | 0) + 16 >> 1] = 0;
                            break a;
                        }
                    default:
                        break a;
                    }
                }
            while (0);
        c[f >> 2] = 0;
        j = c[f >> 2] | 0;
        i = k;
        return j | 0;
    }
    function vc() {
        c[5385] = 0;
        c[5382] = 1;
        c[5383] = 1;
        c[5384] = 5;
        return;
    }
    function* wc(a, b) {
        a = a | 0;
        b = b | 0;
        var d = 0, e = 0, f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0;
        m = i;
        i = i + 64 | 0;
        l = m + 32 | 0;
        k = m + 24 | 0;
        j = m + 16 | 0;
        h = m;
        d = m + 48 | 0;
        e = m + 44 | 0;
        f = m + 40 | 0;
        g = m + 36 | 0;
        c[e >> 2] = a;
        c[f >> 2] = b;
        if ((pd(c[e >> 2] | 0) | 0) != 1) {
            c[h >> 2] = c[e >> 2];
            yield* mc(14734, h);
        }
        c[g >> 2] = tc(c[5385] | 0, c[e >> 2] | 0) | 0;
        if (!(c[g >> 2] | 0)) {
            c[g >> 2] = (yield* dc(28)) | 0;
            h = (yield* cc(c[e >> 2] | 0)) | 0;
            c[c[g >> 2] >> 2] = h;
            c[(c[g >> 2] | 0) + 4 >> 2] = 0;
            c[(c[g >> 2] | 0) + 8 >> 2] = 0;
            c[(c[g >> 2] | 0) + 12 >> 2] = 0;
            uc(21540, c[g >> 2] | 0) | 0;
        }
        switch (c[f >> 2] | 0) {
        case 1: {
                if (c[(c[g >> 2] | 0) + 4 >> 2] | 0) {
                    se(c[e >> 2] | 0);
                    c[d >> 2] = 0 - (c[(c[g >> 2] | 0) + 4 >> 2] | 0);
                    l = c[d >> 2] | 0;
                    i = m;
                    return l | 0;
                }
                l = c[5382] | 0;
                c[5382] = l + 1;
                c[(c[g >> 2] | 0) + 4 >> 2] = l;
                if ((c[(c[g >> 2] | 0) + 4 >> 2] | 0) >= 32767) {
                    yield* lc(14760, m + 8 | 0);
                    Ea(1);
                }
                if ((c[(c[g >> 2] | 0) + 4 >> 2] | 0) >= (c[5370] | 0))
                    yield* Gb();
                c[(c[5369] | 0) + (c[(c[g >> 2] | 0) + 4 >> 2] << 2) >> 2] = c[e >> 2];
                c[d >> 2] = 0 - (c[(c[g >> 2] | 0) + 4 >> 2] | 0);
                l = c[d >> 2] | 0;
                i = m;
                return l | 0;
            }
        case 3:
        case 2: {
                if (!(c[(c[g >> 2] | 0) + 8 >> 2] | 0)) {
                    l = c[5383] | 0;
                    c[5383] = l + 1;
                    c[(c[g >> 2] | 0) + 8 >> 2] = l;
                    if ((c[(c[g >> 2] | 0) + 8 >> 2] | 0) >= 32767) {
                        yield* lc(14785, j);
                        Ea(1);
                    }
                    if ((c[(c[g >> 2] | 0) + 8 >> 2] | 0) >= (c[5364] | 0))
                        yield* Eb();
                    c[(c[5363] | 0) + (c[(c[g >> 2] | 0) + 8 >> 2] << 2) >> 2] = c[e >> 2];
                    c[d >> 2] = c[(c[g >> 2] | 0) + 8 >> 2];
                    l = c[d >> 2] | 0;
                    i = m;
                    return l | 0;
                }
                if ((c[f >> 2] | 0) != 2)
                    se(c[e >> 2] | 0);
                if ((c[5351] | 0) != 0 & (c[f >> 2] | 0) == 3 ? (c[(c[g >> 2] | 0) + 8 >> 2] | 0) <= 6 : 0) {
                    l = c[5383] | 0;
                    c[5383] = l + 1;
                    c[(c[g >> 2] | 0) + 8 >> 2] = l;
                }
                c[d >> 2] = c[(c[g >> 2] | 0) + 8 >> 2];
                l = c[d >> 2] | 0;
                i = m;
                return l | 0;
            }
        case 0: {
                if (c[(c[g >> 2] | 0) + 12 >> 2] | 0) {
                    se(c[e >> 2] | 0);
                    c[d >> 2] = c[(c[g >> 2] | 0) + 12 >> 2];
                    l = c[d >> 2] | 0;
                    i = m;
                    return l | 0;
                }
                l = c[5384] | 0;
                c[5384] = l + 1;
                c[(c[g >> 2] | 0) + 12 >> 2] = l;
                if ((c[(c[g >> 2] | 0) + 12 >> 2] | 0) > 32767) {
                    yield* lc(14804, k);
                    Ea(1);
                }
                if ((c[(c[g >> 2] | 0) + 12 >> 2] | 0) >= (c[5367] | 0))
                    yield* Fb();
                c[(c[5366] | 0) + ((c[(c[g >> 2] | 0) + 12 >> 2] | 0) - 1 << 2) >> 2] = c[e >> 2];
                c[d >> 2] = c[(c[g >> 2] | 0) + 12 >> 2];
                l = c[d >> 2] | 0;
                i = m;
                return l | 0;
            }
        default: {
                yield* lc(14823, l);
                Ea(1);
            }
        }
        return 0;
    }
    function* xc() {
        var a = 0, b = 0, d = 0, e = 0, f = 0, g = 0, h = 0;
        a = i;
        i = i + 48 | 0;
        b = a + 40 | 0;
        d = a + 32 | 0;
        e = a + 24 | 0;
        f = a + 16 | 0;
        g = a + 8 | 0;
        h = a;
        c[h >> 2] = 2147483647;
        (yield* he(14880, h)) | 0;
        c[g >> 2] = 16777215;
        (yield* he(14902, g)) | 0;
        c[f >> 2] = 2147483647;
        (yield* he(14925, f)) | 0;
        c[e >> 2] = 2147483647;
        (yield* he(14947, e)) | 0;
        c[d >> 2] = 2147483647;
        (yield* he(14969, d)) | 0;
        c[b >> 2] = 32767;
        (yield* he(14992, b)) | 0;
        i = a;
        return;
    }
    function* yc(b, d) {
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0, g = 0, h = 0, j = 0;
        e = i;
        i = i + 48 | 0;
        h = e;
        g = e + 32 | 0;
        f = e + 16 | 0;
        c[g >> 2] = b;
        b = c[508] | 0;
        j = c[5377] | 0;
        c[h >> 2] = c[(c[5363] | 0) + (c[5376] << 2) >> 2];
        c[h + 4 >> 2] = j;
        (yield* _d(b, 15015, h)) | 0;
        c[f >> 2] = d;
        (yield* Dd(c[508] | 0, c[g >> 2] | 0, f)) | 0;
        (yield* _d(c[508] | 0, 21260, e + 8 | 0)) | 0;
        a[22133] = 1;
        i = e;
        return;
    }
    function* zc(a, b) {
        a = a | 0;
        b = b | 0;
        var d = 0, e = 0, f = 0, g = 0, h = 0;
        d = i;
        i = i + 48 | 0;
        g = d;
        f = d + 32 | 0;
        e = d + 16 | 0;
        c[f >> 2] = a;
        a = c[508] | 0;
        h = c[5377] | 0;
        c[g >> 2] = c[(c[5363] | 0) + (c[5376] << 2) >> 2];
        c[g + 4 >> 2] = h;
        (yield* _d(a, 15049, g)) | 0;
        c[e >> 2] = b;
        (yield* Dd(c[508] | 0, c[f >> 2] | 0, e)) | 0;
        (yield* _d(c[508] | 0, 21260, d + 8 | 0)) | 0;
        i = d;
        return;
    }
    function* Ac() {
        var a = 0;
        a = i;
        i = i + 16 | 0;
        (yield* he(17737, a)) | 0;
        (yield* he(17789, a + 8 | 0)) | 0;
        i = a;
        return;
    }
    function* Bc() {
        var a = 0, b = 0;
        a = i;
        i = i + 16 | 0;
        b = a;
        c[b >> 2] = 17830;
        c[b + 4 >> 2] = 17833;
        c[b + 8 >> 2] = 17841;
        (yield* he(17820, b)) | 0;
        i = a;
        return;
    }
    function* Cc(a) {
        a = a | 0;
        var b = 0, d = 0, e = 0;
        b = i;
        i = i + 16 | 0;
        d = b;
        e = b + 12 | 0;
        c[e >> 2] = a;
        c[d >> 2] = c[e >> 2];
        (yield* he(17922, d)) | 0;
        yield* Bc();
        (yield* he(17926, b + 8 | 0)) | 0;
        i = b;
        return;
    }
    function* Dc(a, b) {
        a = a | 0;
        b = b | 0;
        var d = 0, e = 0, f = 0, g = 0;
        g = i;
        i = i + 16 | 0;
        d = g + 8 | 0;
        e = g + 4 | 0;
        f = g;
        c[d >> 2] = a;
        c[e >> 2] = b;
        if (!(c[5389] | 0)) {
            c[f >> 2] = re(28) | 0;
            if (!(c[f >> 2] | 0))
                yield* ec();
        } else {
            c[f >> 2] = c[5389];
            c[5389] = c[(c[f >> 2] | 0) + 16 >> 2];
        }
        c[c[f >> 2] >> 2] = 0;
        c[(c[f >> 2] | 0) + 4 >> 2] = c[d >> 2];
        c[(c[f >> 2] | 0) + 8 >> 2] = c[e >> 2];
        c[(c[f >> 2] | 0) + 12 >> 2] = 1;
        b = re((c[d >> 2] | 0) + (c[e >> 2] | 0) | 0) | 0;
        c[(c[f >> 2] | 0) + 20 >> 2] = b;
        if (!(c[(c[f >> 2] | 0) + 20 >> 2] | 0))
            yield* ec();
        c[(c[f >> 2] | 0) + 24 >> 2] = c[(c[f >> 2] | 0) + 20 >> 2];
        ye(c[(c[f >> 2] | 0) + 20 >> 2] | 0, 0, (c[d >> 2] | 0) + (c[e >> 2] | 0) | 0) | 0;
        i = g;
        return c[f >> 2] | 0;
    }
    function Ec(a) {
        a = a | 0;
        var b = 0, d = 0;
        d = i;
        i = i + 16 | 0;
        b = d;
        c[b >> 2] = a;
        if (!(c[c[b >> 2] >> 2] | 0)) {
            i = d;
            return;
        }
        a = (c[c[b >> 2] >> 2] | 0) + 12 | 0;
        c[a >> 2] = (c[a >> 2] | 0) + -1;
        if (!(c[(c[c[b >> 2] >> 2] | 0) + 12 >> 2] | 0)) {
            if (c[(c[c[b >> 2] >> 2] | 0) + 20 >> 2] | 0)
                se(c[(c[c[b >> 2] >> 2] | 0) + 20 >> 2] | 0);
            c[(c[c[b >> 2] >> 2] | 0) + 16 >> 2] = c[5389];
            c[5389] = c[c[b >> 2] >> 2];
        }
        c[c[b >> 2] >> 2] = 0;
        i = d;
        return;
    }
    function* Fc() {
        c[5386] = (yield* Dc(1, 0)) | 0;
        c[5387] = (yield* Dc(1, 0)) | 0;
        a[c[(c[5387] | 0) + 24 >> 2] >> 0] = 1;
        c[5388] = (yield* Dc(1, 0)) | 0;
        a[c[(c[5388] | 0) + 24 >> 2] >> 0] = 2;
        return;
    }
    function Gc(a) {
        a = a | 0;
        var b = 0, d = 0;
        d = i;
        i = i + 16 | 0;
        b = d;
        c[b >> 2] = a;
        a = (c[b >> 2] | 0) + 12 | 0;
        c[a >> 2] = (c[a >> 2] | 0) + 1;
        i = d;
        return c[b >> 2] | 0;
    }
    function Hc(a) {
        a = a | 0;
        var b = 0, d = 0;
        b = i;
        i = i + 16 | 0;
        d = b;
        c[d >> 2] = a;
        a = Gc(c[5386] | 0) | 0;
        c[c[d >> 2] >> 2] = a;
        i = b;
        return;
    }
    function Ic(a, b) {
        a = a | 0;
        b = b | 0;
        var d = 0, e = 0, f = 0;
        d = i;
        i = i + 16 | 0;
        f = d + 4 | 0;
        e = d;
        c[f >> 2] = a;
        c[e >> 2] = b;
        b = Jc(c[f >> 2] | 0, c[e >> 2] | 0, 1, 0) | 0;
        i = d;
        return b | 0;
    }
    function Jc(a, b, e, f) {
        a = a | 0;
        b = b | 0;
        e = e | 0;
        f = f | 0;
        var g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0;
        p = i;
        i = i + 32 | 0;
        n = p + 28 | 0;
        o = p + 24 | 0;
        k = p + 20 | 0;
        g = p + 16 | 0;
        h = p + 12 | 0;
        l = p + 8 | 0;
        m = p + 4 | 0;
        j = p;
        c[o >> 2] = a;
        c[k >> 2] = b;
        c[g >> 2] = e;
        c[h >> 2] = f;
        if (c[g >> 2] | 0 ? (c[c[o >> 2] >> 2] | 0) != (c[c[k >> 2] >> 2] | 0) : 0)
            if (!(c[c[o >> 2] >> 2] | 0)) {
                c[n >> 2] = 1;
                o = c[n >> 2] | 0;
                i = p;
                return o | 0;
            } else {
                c[n >> 2] = -1;
                o = c[n >> 2] | 0;
                i = p;
                return o | 0;
            }
        a = c[(c[o >> 2] | 0) + 4 >> 2] | 0;
        if ((c[(c[o >> 2] | 0) + 4 >> 2] | 0) != (c[(c[k >> 2] | 0) + 4 >> 2] | 0)) {
            f = (c[g >> 2] | 0) != 0;
            if ((a | 0) > (c[(c[k >> 2] | 0) + 4 >> 2] | 0)) {
                if (f ? c[c[o >> 2] >> 2] | 0 : 0) {
                    c[n >> 2] = -1;
                    o = c[n >> 2] | 0;
                    i = p;
                    return o | 0;
                }
                c[n >> 2] = 1;
                o = c[n >> 2] | 0;
                i = p;
                return o | 0;
            } else {
                if (f ? c[c[o >> 2] >> 2] | 0 : 0) {
                    c[n >> 2] = 1;
                    o = c[n >> 2] | 0;
                    i = p;
                    return o | 0;
                }
                c[n >> 2] = -1;
                o = c[n >> 2] | 0;
                i = p;
                return o | 0;
            }
        }
        if ((c[(c[o >> 2] | 0) + 8 >> 2] | 0) > (c[(c[k >> 2] | 0) + 8 >> 2] | 0))
            f = c[(c[k >> 2] | 0) + 8 >> 2] | 0;
        else
            f = c[(c[o >> 2] | 0) + 8 >> 2] | 0;
        c[j >> 2] = a + f;
        c[l >> 2] = c[(c[o >> 2] | 0) + 24 >> 2];
        c[m >> 2] = c[(c[k >> 2] | 0) + 24 >> 2];
        while (1) {
            if ((c[j >> 2] | 0) <= 0)
                break;
            if ((d[c[l >> 2] >> 0] | 0 | 0) != (d[c[m >> 2] >> 0] | 0 | 0))
                break;
            c[l >> 2] = (c[l >> 2] | 0) + 1;
            c[m >> 2] = (c[m >> 2] | 0) + 1;
            c[j >> 2] = (c[j >> 2] | 0) + -1;
        }
        if ((c[h >> 2] | 0) != 0 & (c[j >> 2] | 0) == 1 ? (c[(c[o >> 2] | 0) + 8 >> 2] | 0) == (c[(c[k >> 2] | 0) + 8 >> 2] | 0) : 0) {
            c[n >> 2] = 0;
            o = c[n >> 2] | 0;
            i = p;
            return o | 0;
        }
        if (c[j >> 2] | 0) {
            f = (c[g >> 2] | 0) != 0;
            if ((d[c[l >> 2] >> 0] | 0 | 0) > (d[c[m >> 2] >> 0] | 0 | 0)) {
                if (f ? c[c[o >> 2] >> 2] | 0 : 0) {
                    c[n >> 2] = -1;
                    o = c[n >> 2] | 0;
                    i = p;
                    return o | 0;
                }
                c[n >> 2] = 1;
                o = c[n >> 2] | 0;
                i = p;
                return o | 0;
            } else {
                if (f ? c[c[o >> 2] >> 2] | 0 : 0) {
                    c[n >> 2] = 1;
                    o = c[n >> 2] | 0;
                    i = p;
                    return o | 0;
                }
                c[n >> 2] = -1;
                o = c[n >> 2] | 0;
                i = p;
                return o | 0;
            }
        }
        a:
            do
                if ((c[(c[o >> 2] | 0) + 8 >> 2] | 0) != (c[(c[k >> 2] | 0) + 8 >> 2] | 0))
                    if ((c[(c[o >> 2] | 0) + 8 >> 2] | 0) > (c[(c[k >> 2] | 0) + 8 >> 2] | 0)) {
                        c[j >> 2] = (c[(c[o >> 2] | 0) + 8 >> 2] | 0) - (c[(c[k >> 2] | 0) + 8 >> 2] | 0);
                        while (1) {
                            if ((c[j >> 2] | 0) <= 0)
                                break a;
                            m = c[l >> 2] | 0;
                            c[l >> 2] = m + 1;
                            if (d[m >> 0] | 0 | 0)
                                break;
                            c[j >> 2] = (c[j >> 2] | 0) + -1;
                        }
                        if (c[g >> 2] | 0 ? c[c[o >> 2] >> 2] | 0 : 0) {
                            c[n >> 2] = -1;
                            o = c[n >> 2] | 0;
                            i = p;
                            return o | 0;
                        }
                        c[n >> 2] = 1;
                        o = c[n >> 2] | 0;
                        i = p;
                        return o | 0;
                    } else {
                        c[j >> 2] = (c[(c[k >> 2] | 0) + 8 >> 2] | 0) - (c[(c[o >> 2] | 0) + 8 >> 2] | 0);
                        while (1) {
                            if ((c[j >> 2] | 0) <= 0)
                                break a;
                            l = c[m >> 2] | 0;
                            c[m >> 2] = l + 1;
                            if (d[l >> 0] | 0 | 0)
                                break;
                            c[j >> 2] = (c[j >> 2] | 0) + -1;
                        }
                        if (c[g >> 2] | 0 ? c[c[o >> 2] >> 2] | 0 : 0) {
                            c[n >> 2] = 1;
                            o = c[n >> 2] | 0;
                            i = p;
                            return o | 0;
                        }
                        c[n >> 2] = -1;
                        o = c[n >> 2] | 0;
                        i = p;
                        return o | 0;
                    }
            while (0);
        c[n >> 2] = 0;
        o = c[n >> 2] | 0;
        i = p;
        return o | 0;
    }
    function Kc(a) {
        a = a | 0;
        var b = 0, d = 0;
        d = i;
        i = i + 16 | 0;
        b = d;
        c[b >> 2] = a;
        i = d;
        return (c[c[b >> 2] >> 2] | 0) == 1 & 255 | 0;
    }
    function Lc(b) {
        b = b | 0;
        var e = 0, f = 0, g = 0, h = 0, j = 0;
        j = i;
        i = i + 16 | 0;
        f = j + 12 | 0;
        e = j + 8 | 0;
        g = j + 4 | 0;
        h = j;
        c[e >> 2] = b;
        if ((c[e >> 2] | 0) == (c[5386] | 0)) {
            a[f >> 0] = 1;
            h = a[f >> 0] | 0;
            i = j;
            return h | 0;
        }
        c[g >> 2] = (c[(c[e >> 2] | 0) + 4 >> 2] | 0) + (c[(c[e >> 2] | 0) + 8 >> 2] | 0);
        c[h >> 2] = c[(c[e >> 2] | 0) + 24 >> 2];
        while (1) {
            if ((c[g >> 2] | 0) > 0) {
                b = c[h >> 2] | 0;
                c[h >> 2] = b + 1;
                b = (d[b >> 0] | 0 | 0) == 0;
            } else
                b = 0;
            e = c[g >> 2] | 0;
            if (!b)
                break;
            c[g >> 2] = e + -1;
        }
        if (e | 0) {
            a[f >> 0] = 0;
            h = a[f >> 0] | 0;
            i = j;
            return h | 0;
        } else {
            a[f >> 0] = 1;
            h = a[f >> 0] | 0;
            i = j;
            return h | 0;
        }
        return 0;
    }
    function Mc(b, e) {
        b = b | 0;
        e = e | 0;
        var f = 0, g = 0, h = 0, j = 0, k = 0, l = 0;
        l = i;
        i = i + 32 | 0;
        h = l + 16 | 0;
        f = l + 12 | 0;
        g = l + 8 | 0;
        j = l + 4 | 0;
        k = l;
        c[f >> 2] = b;
        c[g >> 2] = e;
        if ((c[g >> 2] | 0) > (c[(c[f >> 2] | 0) + 8 >> 2] | 0))
            c[g >> 2] = c[(c[f >> 2] | 0) + 8 >> 2];
        c[j >> 2] = (c[(c[f >> 2] | 0) + 4 >> 2] | 0) + (c[g >> 2] | 0);
        c[k >> 2] = c[(c[f >> 2] | 0) + 24 >> 2];
        while (1) {
            if ((c[j >> 2] | 0) > 0) {
                g = c[k >> 2] | 0;
                c[k >> 2] = g + 1;
                g = (d[g >> 0] | 0 | 0) == 0;
            } else
                g = 0;
            f = c[j >> 2] | 0;
            if (!g)
                break;
            c[j >> 2] = f + -1;
        }
        do
            if (f | 0) {
                if ((c[j >> 2] | 0) == 1 ? (j = (c[k >> 2] | 0) + -1 | 0, c[k >> 2] = j, (d[j >> 0] | 0 | 0) == 1) : 0)
                    break;
                a[h >> 0] = 0;
                k = a[h >> 0] | 0;
                i = l;
                return k | 0;
            }
        while (0);
        a[h >> 0] = 1;
        k = a[h >> 0] | 0;
        i = l;
        return k | 0;
    }
    function* Nc(a, b, d, e) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        e = e | 0;
        var f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0;
        n = i;
        i = i + 32 | 0;
        g = n + 24 | 0;
        h = n + 20 | 0;
        k = n + 16 | 0;
        j = n + 12 | 0;
        l = n + 8 | 0;
        f = n + 4 | 0;
        m = n;
        c[g >> 2] = a;
        c[h >> 2] = b;
        c[k >> 2] = d;
        c[j >> 2] = e;
        c[l >> 2] = 0;
        b = c[g >> 2] | 0;
        a = c[h >> 2] | 0;
        a:
            do
                if ((c[c[g >> 2] >> 2] | 0) != (c[c[h >> 2] >> 2] | 0)) {
                    c[l >> 2] = (yield* Oc(b, a, c[j >> 2] | 0)) | 0;
                    c[c[l >> 2] >> 2] = c[c[g >> 2] >> 2];
                } else {
                    c[f >> 2] = Jc(b, a, 0, 0) | 0;
                    switch (c[f >> 2] | 0) {
                    case -1: {
                            c[l >> 2] = (yield* Qc(c[h >> 2] | 0, c[g >> 2] | 0, c[j >> 2] | 0)) | 0;
                            c[c[l >> 2] >> 2] = (c[c[h >> 2] >> 2] | 0) == 0 ? 1 : 0;
                            break a;
                        }
                    case 0: {
                            if ((c[(c[g >> 2] | 0) + 8 >> 2] | 0) > (c[(c[h >> 2] | 0) + 8 >> 2] | 0))
                                a = c[(c[g >> 2] | 0) + 8 >> 2] | 0;
                            else
                                a = c[(c[h >> 2] | 0) + 8 >> 2] | 0;
                            do
                                if ((c[j >> 2] | 0) <= (a | 0))
                                    if ((c[(c[g >> 2] | 0) + 8 >> 2] | 0) > (c[(c[h >> 2] | 0) + 8 >> 2] | 0)) {
                                        a = c[(c[g >> 2] | 0) + 8 >> 2] | 0;
                                        break;
                                    } else {
                                        a = c[(c[h >> 2] | 0) + 8 >> 2] | 0;
                                        break;
                                    }
                                else
                                    a = c[j >> 2] | 0;
                            while (0);
                            c[m >> 2] = a;
                            c[l >> 2] = (yield* Dc(1, c[m >> 2] | 0)) | 0;
                            ye(c[(c[l >> 2] | 0) + 24 >> 2] | 0, 0, (c[m >> 2] | 0) + 1 | 0) | 0;
                            break a;
                        }
                    case 1: {
                            c[l >> 2] = (yield* Qc(c[g >> 2] | 0, c[h >> 2] | 0, c[j >> 2] | 0)) | 0;
                            c[c[l >> 2] >> 2] = c[c[g >> 2] >> 2];
                            break a;
                        }
                    default:
                        break a;
                    }
                }
            while (0);
        Ec(c[k >> 2] | 0);
        c[c[k >> 2] >> 2] = c[l >> 2];
        i = n;
        return;
    }
    function* Oc(b, e, f) {
        b = b | 0;
        e = e | 0;
        f = f | 0;
        var g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0;
        u = i;
        i = i + 64 | 0;
        g = u + 48 | 0;
        h = u + 44 | 0;
        j = u + 40 | 0;
        q = u + 36 | 0;
        s = u + 32 | 0;
        r = u + 28 | 0;
        n = u + 24 | 0;
        p = u + 20 | 0;
        t = u + 16 | 0;
        k = u + 12 | 0;
        m = u + 8 | 0;
        o = u + 4 | 0;
        l = u;
        c[g >> 2] = b;
        c[h >> 2] = e;
        c[j >> 2] = f;
        if ((c[(c[g >> 2] | 0) + 8 >> 2] | 0) > (c[(c[h >> 2] | 0) + 8 >> 2] | 0))
            b = c[(c[g >> 2] | 0) + 8 >> 2] | 0;
        else
            b = c[(c[h >> 2] | 0) + 8 >> 2] | 0;
        c[s >> 2] = b;
        if ((c[(c[g >> 2] | 0) + 4 >> 2] | 0) > (c[(c[h >> 2] | 0) + 4 >> 2] | 0))
            b = c[(c[g >> 2] | 0) + 4 >> 2] | 0;
        else
            b = c[(c[h >> 2] | 0) + 4 >> 2] | 0;
        c[r >> 2] = b + 1;
        c[q >> 2] = (yield* Dc(c[r >> 2] | 0, (c[s >> 2] | 0) > (c[j >> 2] | 0) ? c[s >> 2] | 0 : c[j >> 2] | 0)) | 0;
        a:
            do
                if ((c[j >> 2] | 0) > (c[s >> 2] | 0)) {
                    c[t >> 2] = (c[(c[q >> 2] | 0) + 24 >> 2] | 0) + (c[s >> 2] | 0) + (c[r >> 2] | 0);
                    c[l >> 2] = (c[j >> 2] | 0) - (c[s >> 2] | 0);
                    while (1) {
                        if ((c[l >> 2] | 0) <= 0)
                            break a;
                        j = c[t >> 2] | 0;
                        c[t >> 2] = j + 1;
                        a[j >> 0] = 0;
                        c[l >> 2] = (c[l >> 2] | 0) + -1;
                    }
                }
            while (0);
        c[m >> 2] = c[(c[g >> 2] | 0) + 8 >> 2];
        c[o >> 2] = c[(c[h >> 2] | 0) + 8 >> 2];
        c[n >> 2] = (c[(c[g >> 2] | 0) + 24 >> 2] | 0) + (c[(c[g >> 2] | 0) + 4 >> 2] | 0) + (c[m >> 2] | 0) + -1;
        c[p >> 2] = (c[(c[h >> 2] | 0) + 24 >> 2] | 0) + (c[(c[h >> 2] | 0) + 4 >> 2] | 0) + (c[o >> 2] | 0) + -1;
        c[t >> 2] = (c[(c[q >> 2] | 0) + 24 >> 2] | 0) + (c[s >> 2] | 0) + (c[r >> 2] | 0) + -1;
        b:
            do
                if ((c[m >> 2] | 0) != (c[o >> 2] | 0))
                    if ((c[m >> 2] | 0) > (c[o >> 2] | 0))
                        while (1) {
                            if ((c[m >> 2] | 0) <= (c[o >> 2] | 0))
                                break b;
                            r = c[n >> 2] | 0;
                            c[n >> 2] = r + -1;
                            r = a[r >> 0] | 0;
                            s = c[t >> 2] | 0;
                            c[t >> 2] = s + -1;
                            a[s >> 0] = r;
                            c[m >> 2] = (c[m >> 2] | 0) + -1;
                        }
                    else
                        while (1) {
                            if ((c[o >> 2] | 0) <= (c[m >> 2] | 0))
                                break b;
                            r = c[p >> 2] | 0;
                            c[p >> 2] = r + -1;
                            r = a[r >> 0] | 0;
                            s = c[t >> 2] | 0;
                            c[t >> 2] = s + -1;
                            a[s >> 0] = r;
                            c[o >> 2] = (c[o >> 2] | 0) + -1;
                        }
            while (0);
        c[m >> 2] = (c[m >> 2] | 0) + (c[(c[g >> 2] | 0) + 4 >> 2] | 0);
        c[o >> 2] = (c[o >> 2] | 0) + (c[(c[h >> 2] | 0) + 4 >> 2] | 0);
        c[k >> 2] = 0;
        while (1) {
            if (!((c[m >> 2] | 0) > 0 ? (c[o >> 2] | 0) > 0 : 0))
                break;
            r = c[n >> 2] | 0;
            c[n >> 2] = r + -1;
            r = d[r >> 0] | 0;
            s = c[p >> 2] | 0;
            c[p >> 2] = s + -1;
            a[c[t >> 2] >> 0] = r + (d[s >> 0] | 0) + (c[k >> 2] | 0);
            if ((d[c[t >> 2] >> 0] | 0 | 0) > 9) {
                c[k >> 2] = 1;
                s = c[t >> 2] | 0;
                a[s >> 0] = (d[s >> 0] | 0) - 10;
            } else
                c[k >> 2] = 0;
            c[t >> 2] = (c[t >> 2] | 0) + -1;
            c[m >> 2] = (c[m >> 2] | 0) + -1;
            c[o >> 2] = (c[o >> 2] | 0) + -1;
        }
        if (!(c[m >> 2] | 0)) {
            c[m >> 2] = c[o >> 2];
            c[n >> 2] = c[p >> 2];
        }
        while (1) {
            s = c[m >> 2] | 0;
            c[m >> 2] = s + -1;
            if ((s | 0) <= 0)
                break;
            s = c[n >> 2] | 0;
            c[n >> 2] = s + -1;
            a[c[t >> 2] >> 0] = (d[s >> 0] | 0) + (c[k >> 2] | 0);
            if ((d[c[t >> 2] >> 0] | 0 | 0) > 9) {
                c[k >> 2] = 1;
                s = c[t >> 2] | 0;
                a[s >> 0] = (d[s >> 0] | 0) - 10;
            } else
                c[k >> 2] = 0;
            c[t >> 2] = (c[t >> 2] | 0) + -1;
        }
        if ((c[k >> 2] | 0) != 1) {
            t = c[q >> 2] | 0;
            Pc(t);
            t = c[q >> 2] | 0;
            i = u;
            return t | 0;
        }
        t = c[t >> 2] | 0;
        a[t >> 0] = (d[t >> 0] | 0) + 1;
        t = c[q >> 2] | 0;
        Pc(t);
        t = c[q >> 2] | 0;
        i = u;
        return t | 0;
    }
    function Pc(a) {
        a = a | 0;
        var b = 0, e = 0;
        e = i;
        i = i + 16 | 0;
        b = e;
        c[b >> 2] = a;
        while (1) {
            if (d[c[(c[b >> 2] | 0) + 24 >> 2] >> 0] | 0 | 0) {
                b = 5;
                break;
            }
            if ((c[(c[b >> 2] | 0) + 4 >> 2] | 0) <= 1) {
                b = 5;
                break;
            }
            a = (c[b >> 2] | 0) + 24 | 0;
            c[a >> 2] = (c[a >> 2] | 0) + 1;
            a = (c[b >> 2] | 0) + 4 | 0;
            c[a >> 2] = (c[a >> 2] | 0) + -1;
        }
        if ((b | 0) == 5) {
            i = e;
            return;
        }
    }
    function* Qc(b, e, f) {
        b = b | 0;
        e = e | 0;
        f = f | 0;
        var g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0;
        v = i;
        i = i + 64 | 0;
        g = v + 52 | 0;
        h = v + 48 | 0;
        j = v + 44 | 0;
        m = v + 40 | 0;
        o = v + 36 | 0;
        n = v + 32 | 0;
        r = v + 28 | 0;
        q = v + 24 | 0;
        s = v + 20 | 0;
        t = v + 16 | 0;
        p = v + 12 | 0;
        k = v + 8 | 0;
        l = v + 4 | 0;
        u = v;
        c[g >> 2] = b;
        c[h >> 2] = e;
        c[j >> 2] = f;
        if ((c[(c[g >> 2] | 0) + 4 >> 2] | 0) > (c[(c[h >> 2] | 0) + 4 >> 2] | 0))
            b = c[(c[g >> 2] | 0) + 4 >> 2] | 0;
        else
            b = c[(c[h >> 2] | 0) + 4 >> 2] | 0;
        c[n >> 2] = b;
        if ((c[(c[g >> 2] | 0) + 8 >> 2] | 0) > (c[(c[h >> 2] | 0) + 8 >> 2] | 0))
            b = c[(c[g >> 2] | 0) + 8 >> 2] | 0;
        else
            b = c[(c[h >> 2] | 0) + 8 >> 2] | 0;
        c[o >> 2] = b;
        if ((c[(c[g >> 2] | 0) + 4 >> 2] | 0) > (c[(c[h >> 2] | 0) + 4 >> 2] | 0))
            b = c[(c[h >> 2] | 0) + 4 >> 2] | 0;
        else
            b = c[(c[g >> 2] | 0) + 4 >> 2] | 0;
        c[q >> 2] = b;
        if ((c[(c[g >> 2] | 0) + 8 >> 2] | 0) > (c[(c[h >> 2] | 0) + 8 >> 2] | 0))
            b = c[(c[h >> 2] | 0) + 8 >> 2] | 0;
        else
            b = c[(c[g >> 2] | 0) + 8 >> 2] | 0;
        c[r >> 2] = b;
        c[m >> 2] = (yield* Dc(c[n >> 2] | 0, (c[o >> 2] | 0) > (c[j >> 2] | 0) ? c[o >> 2] | 0 : c[j >> 2] | 0)) | 0;
        a:
            do
                if ((c[j >> 2] | 0) > (c[o >> 2] | 0)) {
                    c[p >> 2] = (c[(c[m >> 2] | 0) + 24 >> 2] | 0) + (c[n >> 2] | 0) + (c[o >> 2] | 0);
                    c[l >> 2] = (c[j >> 2] | 0) - (c[o >> 2] | 0);
                    while (1) {
                        if ((c[l >> 2] | 0) <= 0)
                            break a;
                        j = c[p >> 2] | 0;
                        c[p >> 2] = j + 1;
                        a[j >> 0] = 0;
                        c[l >> 2] = (c[l >> 2] | 0) + -1;
                    }
                }
            while (0);
        c[s >> 2] = (c[(c[g >> 2] | 0) + 24 >> 2] | 0) + (c[(c[g >> 2] | 0) + 4 >> 2] | 0) + (c[(c[g >> 2] | 0) + 8 >> 2] | 0) + -1;
        c[t >> 2] = (c[(c[h >> 2] | 0) + 24 >> 2] | 0) + (c[(c[h >> 2] | 0) + 4 >> 2] | 0) + (c[(c[h >> 2] | 0) + 8 >> 2] | 0) + -1;
        c[p >> 2] = (c[(c[m >> 2] | 0) + 24 >> 2] | 0) + (c[n >> 2] | 0) + (c[o >> 2] | 0) + -1;
        c[k >> 2] = 0;
        b:
            do
                if ((c[(c[g >> 2] | 0) + 8 >> 2] | 0) != (c[r >> 2] | 0)) {
                    c[l >> 2] = (c[(c[g >> 2] | 0) + 8 >> 2] | 0) - (c[r >> 2] | 0);
                    while (1) {
                        if ((c[l >> 2] | 0) <= 0)
                            break b;
                        j = c[s >> 2] | 0;
                        c[s >> 2] = j + -1;
                        j = a[j >> 0] | 0;
                        o = c[p >> 2] | 0;
                        c[p >> 2] = o + -1;
                        a[o >> 0] = j;
                        c[l >> 2] = (c[l >> 2] | 0) + -1;
                    }
                } else {
                    c[l >> 2] = (c[(c[h >> 2] | 0) + 8 >> 2] | 0) - (c[r >> 2] | 0);
                    while (1) {
                        if ((c[l >> 2] | 0) <= 0)
                            break b;
                        o = c[t >> 2] | 0;
                        c[t >> 2] = o + -1;
                        c[u >> 2] = 0 - (d[o >> 0] | 0) - (c[k >> 2] | 0);
                        if ((c[u >> 2] | 0) < 0) {
                            c[u >> 2] = (c[u >> 2] | 0) + 10;
                            c[k >> 2] = 1;
                        } else
                            c[k >> 2] = 0;
                        j = c[u >> 2] & 255;
                        o = c[p >> 2] | 0;
                        c[p >> 2] = o + -1;
                        a[o >> 0] = j;
                        c[l >> 2] = (c[l >> 2] | 0) + -1;
                    }
                }
            while (0);
        c[l >> 2] = 0;
        while (1) {
            if ((c[l >> 2] | 0) >= ((c[q >> 2] | 0) + (c[r >> 2] | 0) | 0))
                break;
            j = c[s >> 2] | 0;
            c[s >> 2] = j + -1;
            j = d[j >> 0] | 0;
            o = c[t >> 2] | 0;
            c[t >> 2] = o + -1;
            c[u >> 2] = j - (d[o >> 0] | 0) - (c[k >> 2] | 0);
            if ((c[u >> 2] | 0) < 0) {
                c[u >> 2] = (c[u >> 2] | 0) + 10;
                c[k >> 2] = 1;
            } else
                c[k >> 2] = 0;
            j = c[u >> 2] & 255;
            o = c[p >> 2] | 0;
            c[p >> 2] = o + -1;
            a[o >> 0] = j;
            c[l >> 2] = (c[l >> 2] | 0) + 1;
        }
        if ((c[n >> 2] | 0) == (c[q >> 2] | 0)) {
            u = c[m >> 2] | 0;
            Pc(u);
            u = c[m >> 2] | 0;
            i = v;
            return u | 0;
        }
        c[l >> 2] = (c[n >> 2] | 0) - (c[q >> 2] | 0);
        while (1) {
            if ((c[l >> 2] | 0) <= 0)
                break;
            t = c[s >> 2] | 0;
            c[s >> 2] = t + -1;
            c[u >> 2] = (d[t >> 0] | 0) - (c[k >> 2] | 0);
            if ((c[u >> 2] | 0) < 0) {
                c[u >> 2] = (c[u >> 2] | 0) + 10;
                c[k >> 2] = 1;
            } else
                c[k >> 2] = 0;
            r = c[u >> 2] & 255;
            t = c[p >> 2] | 0;
            c[p >> 2] = t + -1;
            a[t >> 0] = r;
            c[l >> 2] = (c[l >> 2] | 0) + -1;
        }
        u = c[m >> 2] | 0;
        Pc(u);
        u = c[m >> 2] | 0;
        i = v;
        return u | 0;
    }
    function* Rc(a, b, d, e) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        e = e | 0;
        var f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0;
        n = i;
        i = i + 32 | 0;
        g = n + 24 | 0;
        h = n + 20 | 0;
        k = n + 16 | 0;
        j = n + 12 | 0;
        m = n + 8 | 0;
        f = n + 4 | 0;
        l = n;
        c[g >> 2] = a;
        c[h >> 2] = b;
        c[k >> 2] = d;
        c[j >> 2] = e;
        c[m >> 2] = 0;
        b = c[g >> 2] | 0;
        a = c[h >> 2] | 0;
        a:
            do
                if ((c[c[g >> 2] >> 2] | 0) == (c[c[h >> 2] >> 2] | 0)) {
                    c[m >> 2] = (yield* Oc(b, a, c[j >> 2] | 0)) | 0;
                    c[c[m >> 2] >> 2] = c[c[g >> 2] >> 2];
                } else {
                    c[f >> 2] = Jc(b, a, 0, 0) | 0;
                    switch (c[f >> 2] | 0) {
                    case -1: {
                            c[m >> 2] = (yield* Qc(c[h >> 2] | 0, c[g >> 2] | 0, c[j >> 2] | 0)) | 0;
                            c[c[m >> 2] >> 2] = c[c[h >> 2] >> 2];
                            break a;
                        }
                    case 0: {
                            if ((c[(c[g >> 2] | 0) + 8 >> 2] | 0) > (c[(c[h >> 2] | 0) + 8 >> 2] | 0))
                                a = c[(c[g >> 2] | 0) + 8 >> 2] | 0;
                            else
                                a = c[(c[h >> 2] | 0) + 8 >> 2] | 0;
                            do
                                if ((c[j >> 2] | 0) <= (a | 0))
                                    if ((c[(c[g >> 2] | 0) + 8 >> 2] | 0) > (c[(c[h >> 2] | 0) + 8 >> 2] | 0)) {
                                        a = c[(c[g >> 2] | 0) + 8 >> 2] | 0;
                                        break;
                                    } else {
                                        a = c[(c[h >> 2] | 0) + 8 >> 2] | 0;
                                        break;
                                    }
                                else
                                    a = c[j >> 2] | 0;
                            while (0);
                            c[l >> 2] = a;
                            c[m >> 2] = (yield* Dc(1, c[l >> 2] | 0)) | 0;
                            ye(c[(c[m >> 2] | 0) + 24 >> 2] | 0, 0, (c[l >> 2] | 0) + 1 | 0) | 0;
                            break a;
                        }
                    case 1: {
                            c[m >> 2] = (yield* Qc(c[g >> 2] | 0, c[h >> 2] | 0, c[j >> 2] | 0)) | 0;
                            c[c[m >> 2] >> 2] = c[c[g >> 2] >> 2];
                            break a;
                        }
                    default:
                        break a;
                    }
                }
            while (0);
        Ec(c[k >> 2] | 0);
        c[c[k >> 2] >> 2] = c[m >> 2];
        i = n;
        return;
    }
    function* Sc(a, b, d, e) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        e = e | 0;
        var f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0;
        p = i;
        i = i + 48 | 0;
        g = p + 32 | 0;
        h = p + 28 | 0;
        j = p + 24 | 0;
        f = p + 20 | 0;
        o = p + 16 | 0;
        l = p + 12 | 0;
        m = p + 8 | 0;
        k = p + 4 | 0;
        n = p;
        c[g >> 2] = a;
        c[h >> 2] = b;
        c[j >> 2] = d;
        c[f >> 2] = e;
        c[l >> 2] = (c[(c[g >> 2] | 0) + 4 >> 2] | 0) + (c[(c[g >> 2] | 0) + 8 >> 2] | 0);
        c[m >> 2] = (c[(c[h >> 2] | 0) + 4 >> 2] | 0) + (c[(c[h >> 2] | 0) + 8 >> 2] | 0);
        c[k >> 2] = (c[(c[g >> 2] | 0) + 8 >> 2] | 0) + (c[(c[h >> 2] | 0) + 8 >> 2] | 0);
        b = c[k >> 2] | 0;
        if ((c[(c[g >> 2] | 0) + 8 >> 2] | 0) > (c[(c[h >> 2] | 0) + 8 >> 2] | 0))
            a = c[(c[g >> 2] | 0) + 8 >> 2] | 0;
        else
            a = c[(c[h >> 2] | 0) + 8 >> 2] | 0;
        do
            if ((c[f >> 2] | 0) <= (a | 0))
                if ((c[(c[g >> 2] | 0) + 8 >> 2] | 0) > (c[(c[h >> 2] | 0) + 8 >> 2] | 0)) {
                    a = c[(c[g >> 2] | 0) + 8 >> 2] | 0;
                    break;
                } else {
                    a = c[(c[h >> 2] | 0) + 8 >> 2] | 0;
                    break;
                }
            else
                a = c[f >> 2] | 0;
        while (0);
        do
            if ((b | 0) > (a | 0)) {
                if ((c[(c[g >> 2] | 0) + 8 >> 2] | 0) > (c[(c[h >> 2] | 0) + 8 >> 2] | 0))
                    a = c[(c[g >> 2] | 0) + 8 >> 2] | 0;
                else
                    a = c[(c[h >> 2] | 0) + 8 >> 2] | 0;
                if ((c[f >> 2] | 0) > (a | 0)) {
                    a = c[f >> 2] | 0;
                    break;
                }
                if ((c[(c[g >> 2] | 0) + 8 >> 2] | 0) > (c[(c[h >> 2] | 0) + 8 >> 2] | 0)) {
                    a = c[(c[g >> 2] | 0) + 8 >> 2] | 0;
                    break;
                } else {
                    a = c[(c[h >> 2] | 0) + 8 >> 2] | 0;
                    break;
                }
            } else
                a = c[k >> 2] | 0;
        while (0);
        c[n >> 2] = a;
        yield* Tc(c[g >> 2] | 0, c[l >> 2] | 0, c[h >> 2] | 0, c[m >> 2] | 0, o);
        c[c[o >> 2] >> 2] = (c[c[g >> 2] >> 2] | 0) == (c[c[h >> 2] >> 2] | 0) ? 0 : 1;
        c[(c[o >> 2] | 0) + 24 >> 2] = c[(c[o >> 2] | 0) + 20 >> 2];
        c[(c[o >> 2] | 0) + 4 >> 2] = (c[m >> 2] | 0) + (c[l >> 2] | 0) + 1 - (c[k >> 2] | 0);
        c[(c[o >> 2] | 0) + 8 >> 2] = c[n >> 2];
        Pc(c[o >> 2] | 0);
        if (!((Lc(c[o >> 2] | 0) | 0) << 24 >> 24)) {
            n = c[j >> 2] | 0;
            Ec(n);
            n = c[o >> 2] | 0;
            o = c[j >> 2] | 0;
            c[o >> 2] = n;
            i = p;
            return;
        }
        c[c[o >> 2] >> 2] = 0;
        n = c[j >> 2] | 0;
        Ec(n);
        n = c[o >> 2] | 0;
        o = c[j >> 2] | 0;
        c[o >> 2] = n;
        i = p;
        return;
    }
    function* Tc(a, b, d, e, f) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        e = e | 0;
        f = f | 0;
        var g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0;
        C = i;
        i = i + 96 | 0;
        g = C + 80 | 0;
        l = C + 76 | 0;
        h = C + 72 | 0;
        m = C + 68 | 0;
        n = C + 64 | 0;
        y = C + 60 | 0;
        z = C + 56 | 0;
        A = C + 52 | 0;
        B = C + 48 | 0;
        j = C + 44 | 0;
        k = C + 40 | 0;
        s = C + 36 | 0;
        u = C + 32 | 0;
        v = C + 28 | 0;
        o = C + 24 | 0;
        q = C + 20 | 0;
        w = C + 16 | 0;
        x = C + 12 | 0;
        t = C + 8 | 0;
        p = C + 4 | 0;
        r = C;
        c[g >> 2] = a;
        c[l >> 2] = b;
        c[h >> 2] = d;
        c[m >> 2] = e;
        c[n >> 2] = f;
        if ((((c[l >> 2] | 0) + (c[m >> 2] | 0) | 0) >= 80 ? (c[l >> 2] | 0) >= (80 / 4 | 0 | 0) : 0) ? (c[m >> 2] | 0) >= (80 / 4 | 0 | 0) : 0) {
            c[w >> 2] = (((c[l >> 2] | 0) > (c[m >> 2] | 0) ? c[l >> 2] | 0 : c[m >> 2] | 0) + 1 | 0) / 2 | 0;
            if ((c[l >> 2] | 0) < (c[w >> 2] | 0)) {
                c[z >> 2] = Gc(c[5386] | 0) | 0;
                c[y >> 2] = (yield* Vc(c[l >> 2] | 0, 0, c[(c[g >> 2] | 0) + 24 >> 2] | 0)) | 0;
            } else {
                c[z >> 2] = (yield* Vc((c[l >> 2] | 0) - (c[w >> 2] | 0) | 0, 0, c[(c[g >> 2] | 0) + 24 >> 2] | 0)) | 0;
                c[y >> 2] = (yield* Vc(c[w >> 2] | 0, 0, (c[(c[g >> 2] | 0) + 24 >> 2] | 0) + (c[l >> 2] | 0) + (0 - (c[w >> 2] | 0)) | 0)) | 0;
            }
            if ((c[m >> 2] | 0) < (c[w >> 2] | 0)) {
                c[B >> 2] = Gc(c[5386] | 0) | 0;
                c[A >> 2] = (yield* Vc(c[m >> 2] | 0, 0, c[(c[h >> 2] | 0) + 24 >> 2] | 0)) | 0;
            } else {
                c[B >> 2] = (yield* Vc((c[m >> 2] | 0) - (c[w >> 2] | 0) | 0, 0, c[(c[h >> 2] | 0) + 24 >> 2] | 0)) | 0;
                c[A >> 2] = (yield* Vc(c[w >> 2] | 0, 0, (c[(c[h >> 2] | 0) + 24 >> 2] | 0) + (c[m >> 2] | 0) + (0 - (c[w >> 2] | 0)) | 0)) | 0;
            }
            Pc(c[z >> 2] | 0);
            Pc(c[y >> 2] | 0);
            c[j >> 2] = c[(c[y >> 2] | 0) + 4 >> 2];
            Pc(c[B >> 2] | 0);
            Pc(c[A >> 2] | 0);
            c[k >> 2] = c[(c[A >> 2] | 0) + 4 >> 2];
            if ((Lc(c[z >> 2] | 0) | 0) & 255 | 0)
                g = 1;
            else
                g = ((Lc(c[B >> 2] | 0) | 0) & 255 | 0) != 0;
            c[t >> 2] = g & 1;
            Hc(o);
            Hc(q);
            yield* Nc(c[z >> 2] | 0, c[y >> 2] | 0, o, 0);
            c[p >> 2] = c[(c[o >> 2] | 0) + 4 >> 2];
            yield* Nc(c[A >> 2] | 0, c[B >> 2] | 0, q, 0);
            c[r >> 2] = c[(c[q >> 2] | 0) + 4 >> 2];
            if (c[t >> 2] | 0)
                c[s >> 2] = Gc(c[5386] | 0) | 0;
            else
                yield* Tc(c[z >> 2] | 0, c[(c[z >> 2] | 0) + 4 >> 2] | 0, c[B >> 2] | 0, c[(c[B >> 2] | 0) + 4 >> 2] | 0, s);
            if (!((Lc(c[o >> 2] | 0) | 0) & 255 | 0) ? !((Lc(c[q >> 2] | 0) | 0) & 255 | 0) : 0)
                yield* Tc(c[o >> 2] | 0, c[p >> 2] | 0, c[q >> 2] | 0, c[r >> 2] | 0, u);
            else
                c[u >> 2] = Gc(c[5386] | 0) | 0;
            if (!((Lc(c[y >> 2] | 0) | 0) & 255 | 0) ? !((Lc(c[A >> 2] | 0) | 0) & 255 | 0) : 0)
                yield* Tc(c[y >> 2] | 0, c[(c[y >> 2] | 0) + 4 >> 2] | 0, c[A >> 2] | 0, c[(c[A >> 2] | 0) + 4 >> 2] | 0, v);
            else
                c[v >> 2] = Gc(c[5386] | 0) | 0;
            c[x >> 2] = (c[l >> 2] | 0) + (c[m >> 2] | 0) + 1;
            x = (yield* Dc(c[x >> 2] | 0, 0)) | 0;
            c[c[n >> 2] >> 2] = x;
            if (!(c[t >> 2] | 0)) {
                Wc(c[c[n >> 2] >> 2] | 0, c[s >> 2] | 0, c[w >> 2] << 1, 0);
                Wc(c[c[n >> 2] >> 2] | 0, c[s >> 2] | 0, c[w >> 2] | 0, 0);
            }
            Wc(c[c[n >> 2] >> 2] | 0, c[v >> 2] | 0, c[w >> 2] | 0, 0);
            Wc(c[c[n >> 2] >> 2] | 0, c[v >> 2] | 0, 0, 0);
            Wc(c[c[n >> 2] >> 2] | 0, c[u >> 2] | 0, c[w >> 2] | 0, (c[c[o >> 2] >> 2] | 0) != (c[c[q >> 2] >> 2] | 0) & 1);
            Ec(z);
            Ec(y);
            Ec(B);
            Ec(s);
            Ec(A);
            Ec(u);
            Ec(v);
            Ec(o);
            Ec(q);
            i = C;
            return;
        }
        yield* Uc(c[g >> 2] | 0, c[l >> 2] | 0, c[h >> 2] | 0, c[m >> 2] | 0, c[n >> 2] | 0);
        i = C;
        return;
    }
    function* Uc(b, e, f, g, h) {
        b = b | 0;
        e = e | 0;
        f = f | 0;
        g = g | 0;
        h = h | 0;
        var j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0;
        t = i;
        i = i + 64 | 0;
        j = t + 48 | 0;
        w = t + 44 | 0;
        v = t + 40 | 0;
        k = t + 36 | 0;
        u = t + 32 | 0;
        n = t + 28 | 0;
        p = t + 24 | 0;
        r = t + 20 | 0;
        m = t + 16 | 0;
        o = t + 12 | 0;
        l = t + 8 | 0;
        s = t + 4 | 0;
        q = t;
        c[j >> 2] = b;
        c[w >> 2] = e;
        c[v >> 2] = f;
        c[k >> 2] = g;
        c[u >> 2] = h;
        c[q >> 2] = (c[w >> 2] | 0) + (c[k >> 2] | 0) + 1;
        h = (yield* Dc(c[q >> 2] | 0, 0)) | 0;
        c[c[u >> 2] >> 2] = h;
        c[m >> 2] = (c[(c[j >> 2] | 0) + 24 >> 2] | 0) + (c[w >> 2] | 0) + -1;
        c[o >> 2] = (c[(c[v >> 2] | 0) + 24 >> 2] | 0) + (c[k >> 2] | 0) + -1;
        c[r >> 2] = (c[(c[c[u >> 2] >> 2] | 0) + 24 >> 2] | 0) + (c[q >> 2] | 0) + -1;
        c[s >> 2] = 0;
        c[l >> 2] = 0;
        while (1) {
            if ((c[l >> 2] | 0) >= ((c[q >> 2] | 0) - 1 | 0))
                break;
            if (0 > ((c[l >> 2] | 0) - (c[k >> 2] | 0) + 1 | 0))
                b = 0;
            else
                b = (c[l >> 2] | 0) - (c[k >> 2] | 0) + 1 | 0;
            c[n >> 2] = (c[m >> 2] | 0) + (0 - b);
            c[p >> 2] = (c[o >> 2] | 0) + (0 - ((c[l >> 2] | 0) > ((c[k >> 2] | 0) - 1 | 0) ? (c[k >> 2] | 0) - 1 | 0 : c[l >> 2] | 0));
            while (1) {
                if ((c[n >> 2] | 0) >>> 0 < (c[(c[j >> 2] | 0) + 24 >> 2] | 0) >>> 0)
                    break;
                if ((c[p >> 2] | 0) >>> 0 > (c[o >> 2] | 0) >>> 0)
                    break;
                v = c[n >> 2] | 0;
                c[n >> 2] = v + -1;
                v = d[v >> 0] | 0;
                w = c[p >> 2] | 0;
                c[p >> 2] = w + 1;
                w = _(v, d[w >> 0] | 0) | 0;
                c[s >> 2] = (c[s >> 2] | 0) + w;
            }
            v = ((c[s >> 2] | 0) % 10 | 0) & 255;
            w = c[r >> 2] | 0;
            c[r >> 2] = w + -1;
            a[w >> 0] = v;
            c[s >> 2] = (c[s >> 2] | 0) / 10 | 0;
            c[l >> 2] = (c[l >> 2] | 0) + 1;
        }
        a[c[r >> 2] >> 0] = c[s >> 2];
        i = t;
        return;
    }
    function* Vc(a, b, d) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0, g = 0, h = 0, j = 0;
        j = i;
        i = i + 16 | 0;
        e = j + 12 | 0;
        f = j + 8 | 0;
        g = j + 4 | 0;
        h = j;
        c[e >> 2] = a;
        c[f >> 2] = b;
        c[g >> 2] = d;
        if (!(c[5389] | 0)) {
            c[h >> 2] = re(28) | 0;
            if (!(c[h >> 2] | 0))
                yield* ec();
        } else {
            c[h >> 2] = c[5389];
            c[5389] = c[(c[h >> 2] | 0) + 16 >> 2];
        }
        c[c[h >> 2] >> 2] = 0;
        c[(c[h >> 2] | 0) + 4 >> 2] = c[e >> 2];
        c[(c[h >> 2] | 0) + 8 >> 2] = c[f >> 2];
        c[(c[h >> 2] | 0) + 12 >> 2] = 1;
        c[(c[h >> 2] | 0) + 20 >> 2] = 0;
        c[(c[h >> 2] | 0) + 24 >> 2] = c[g >> 2];
        i = j;
        return c[h >> 2] | 0;
    }
    function Wc(b, e, f, g) {
        b = b | 0;
        e = e | 0;
        f = f | 0;
        g = g | 0;
        var h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0;
        q = i;
        i = i + 32 | 0;
        h = q + 28 | 0;
        j = q + 24 | 0;
        k = q + 20 | 0;
        l = q + 16 | 0;
        m = q + 12 | 0;
        p = q + 8 | 0;
        o = q + 4 | 0;
        n = q;
        c[h >> 2] = b;
        c[j >> 2] = e;
        c[k >> 2] = f;
        c[l >> 2] = g;
        c[o >> 2] = c[(c[j >> 2] | 0) + 4 >> 2];
        if (!(d[c[(c[j >> 2] | 0) + 24 >> 2] >> 0] | 0))
            c[o >> 2] = (c[o >> 2] | 0) + -1;
        if (((c[(c[h >> 2] | 0) + 4 >> 2] | 0) + (c[(c[h >> 2] | 0) + 8 >> 2] | 0) | 0) < ((c[k >> 2] | 0) + (c[o >> 2] | 0) | 0))
            la(18670, 18713, 706, 18722);
        c[m >> 2] = (c[(c[h >> 2] | 0) + 24 >> 2] | 0) + (c[(c[h >> 2] | 0) + 4 >> 2] | 0) + (c[(c[h >> 2] | 0) + 8 >> 2] | 0) + (0 - (c[k >> 2] | 0)) + -1;
        c[p >> 2] = (c[(c[j >> 2] | 0) + 24 >> 2] | 0) + (c[(c[j >> 2] | 0) + 4 >> 2] | 0) + -1;
        c[n >> 2] = 0;
        if (c[l >> 2] | 0) {
            while (1) {
                e = c[o >> 2] | 0;
                c[o >> 2] = e + -1;
                if (!e)
                    break;
                g = c[p >> 2] | 0;
                c[p >> 2] = g + -1;
                e = c[m >> 2] | 0;
                a[e >> 0] = (a[e >> 0] | 0) - ((a[g >> 0] | 0) + (c[n >> 2] | 0));
                if ((a[c[m >> 2] >> 0] | 0) < 0) {
                    c[n >> 2] = 1;
                    e = c[m >> 2] | 0;
                    c[m >> 2] = e + -1;
                    a[e >> 0] = (a[e >> 0] | 0) + 10;
                    continue;
                } else {
                    c[n >> 2] = 0;
                    c[m >> 2] = (c[m >> 2] | 0) + -1;
                    continue;
                }
            }
            while (1) {
                if (!(c[n >> 2] | 0))
                    break;
                p = c[m >> 2] | 0;
                a[p >> 0] = (a[p >> 0] | 0) - (c[n >> 2] | 0);
                if ((a[c[m >> 2] >> 0] | 0) < 0) {
                    p = c[m >> 2] | 0;
                    c[m >> 2] = p + -1;
                    a[p >> 0] = (a[p >> 0] | 0) + 10;
                    continue;
                } else {
                    c[n >> 2] = 0;
                    continue;
                }
            }
            i = q;
            return;
        } else {
            while (1) {
                e = c[o >> 2] | 0;
                c[o >> 2] = e + -1;
                if (!e)
                    break;
                g = c[p >> 2] | 0;
                c[p >> 2] = g + -1;
                e = c[m >> 2] | 0;
                a[e >> 0] = (a[e >> 0] | 0) + ((a[g >> 0] | 0) + (c[n >> 2] | 0));
                if ((a[c[m >> 2] >> 0] | 0) > 9) {
                    c[n >> 2] = 1;
                    e = c[m >> 2] | 0;
                    c[m >> 2] = e + -1;
                    a[e >> 0] = (a[e >> 0] | 0) - 10;
                    continue;
                } else {
                    c[n >> 2] = 0;
                    c[m >> 2] = (c[m >> 2] | 0) + -1;
                    continue;
                }
            }
            while (1) {
                if (!(c[n >> 2] | 0))
                    break;
                p = c[m >> 2] | 0;
                a[p >> 0] = (a[p >> 0] | 0) + (c[n >> 2] | 0);
                if ((a[c[m >> 2] >> 0] | 0) > 9) {
                    p = c[m >> 2] | 0;
                    c[m >> 2] = p + -1;
                    a[p >> 0] = (a[p >> 0] | 0) - 10;
                    continue;
                } else {
                    c[n >> 2] = 0;
                    continue;
                }
            }
            i = q;
            return;
        }
    }
    function* Xc(b, e, f, g) {
        b = b | 0;
        e = e | 0;
        f = f | 0;
        g = g | 0;
        var h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0;
        J = i;
        i = i + 112 | 0;
        o = J + 100 | 0;
        p = J + 96 | 0;
        q = J + 92 | 0;
        r = J + 88 | 0;
        s = J + 84 | 0;
        H = J + 80 | 0;
        A = J + 76 | 0;
        B = J + 72 | 0;
        C = J + 68 | 0;
        D = J + 64 | 0;
        z = J + 60 | 0;
        G = J + 56 | 0;
        l = J + 52 | 0;
        I = J + 48 | 0;
        w = J + 44 | 0;
        x = J + 40 | 0;
        m = J + 36 | 0;
        k = J + 32 | 0;
        h = J + 28 | 0;
        v = J + 24 | 0;
        E = J + 20 | 0;
        F = J + 16 | 0;
        t = J + 12 | 0;
        u = J + 8 | 0;
        y = J + 4 | 0;
        n = J + 104 | 0;
        j = J;
        c[p >> 2] = b;
        c[q >> 2] = e;
        c[r >> 2] = f;
        c[s >> 2] = g;
        if ((Lc(c[q >> 2] | 0) | 0) << 24 >> 24) {
            c[o >> 2] = -1;
            I = c[o >> 2] | 0;
            i = J;
            return I | 0;
        }
        if (((c[(c[q >> 2] | 0) + 8 >> 2] | 0) == 0 ? (c[(c[q >> 2] | 0) + 4 >> 2] | 0) == 1 : 0) ? (d[c[(c[q >> 2] | 0) + 24 >> 2] >> 0] | 0) == 1 : 0) {
            c[H >> 2] = (yield* Dc(c[(c[p >> 2] | 0) + 4 >> 2] | 0, c[s >> 2] | 0)) | 0;
            c[c[H >> 2] >> 2] = (c[c[p >> 2] >> 2] | 0) == (c[c[q >> 2] >> 2] | 0) ? 0 : 1;
            ye((c[(c[H >> 2] | 0) + 24 >> 2] | 0) + (c[(c[p >> 2] | 0) + 4 >> 2] | 0) | 0, 0, c[s >> 2] | 0) | 0;
            if ((c[(c[p >> 2] | 0) + 8 >> 2] | 0) > (c[s >> 2] | 0))
                b = c[s >> 2] | 0;
            else
                b = c[(c[p >> 2] | 0) + 8 >> 2] | 0;
            Ce(c[(c[H >> 2] | 0) + 24 >> 2] | 0, c[(c[p >> 2] | 0) + 24 >> 2] | 0, (c[(c[p >> 2] | 0) + 4 >> 2] | 0) + b | 0) | 0;
            Ec(c[r >> 2] | 0);
            c[c[r >> 2] >> 2] = c[H >> 2];
        }
        c[m >> 2] = c[(c[q >> 2] | 0) + 8 >> 2];
        c[z >> 2] = (c[(c[q >> 2] | 0) + 24 >> 2] | 0) + (c[(c[q >> 2] | 0) + 4 >> 2] | 0) + (c[m >> 2] | 0) + -1;
        while (1) {
            if ((c[m >> 2] | 0) >>> 0 <= 0)
                break;
            g = c[z >> 2] | 0;
            c[z >> 2] = g + -1;
            if (d[g >> 0] | 0)
                break;
            c[m >> 2] = (c[m >> 2] | 0) + -1;
        }
        c[w >> 2] = (c[(c[p >> 2] | 0) + 4 >> 2] | 0) + (c[m >> 2] | 0);
        c[l >> 2] = (c[(c[p >> 2] | 0) + 8 >> 2] | 0) - (c[m >> 2] | 0);
        if ((c[l >> 2] | 0) < (c[s >> 2] | 0))
            c[h >> 2] = (c[s >> 2] | 0) - (c[l >> 2] | 0);
        else
            c[h >> 2] = 0;
        c[A >> 2] = re((c[(c[p >> 2] | 0) + 4 >> 2] | 0) + (c[(c[p >> 2] | 0) + 8 >> 2] | 0) + (c[h >> 2] | 0) + 2 | 0) | 0;
        if (!(c[A >> 2] | 0))
            yield* ec();
        ye(c[A >> 2] | 0, 0, (c[(c[p >> 2] | 0) + 4 >> 2] | 0) + (c[(c[p >> 2] | 0) + 8 >> 2] | 0) + (c[h >> 2] | 0) + 2 | 0) | 0;
        Ce((c[A >> 2] | 0) + 1 | 0, c[(c[p >> 2] | 0) + 24 >> 2] | 0, (c[(c[p >> 2] | 0) + 4 >> 2] | 0) + (c[(c[p >> 2] | 0) + 8 >> 2] | 0) | 0) | 0;
        c[x >> 2] = (c[(c[q >> 2] | 0) + 4 >> 2] | 0) + (c[m >> 2] | 0);
        c[B >> 2] = re((c[x >> 2] | 0) + 1 | 0) | 0;
        if (!(c[B >> 2] | 0))
            yield* ec();
        Ce(c[B >> 2] | 0, c[(c[q >> 2] | 0) + 24 >> 2] | 0, c[x >> 2] | 0) | 0;
        a[(c[B >> 2] | 0) + (c[x >> 2] | 0) >> 0] = 0;
        c[z >> 2] = c[B >> 2];
        while (1) {
            if (d[c[z >> 2] >> 0] | 0)
                break;
            c[z >> 2] = (c[z >> 2] | 0) + 1;
            c[x >> 2] = (c[x >> 2] | 0) + -1;
        }
        do
            if ((c[x >> 2] | 0) >>> 0 <= ((c[w >> 2] | 0) + (c[s >> 2] | 0) | 0) >>> 0) {
                a[n >> 0] = 0;
                if ((c[x >> 2] | 0) >>> 0 > (c[w >> 2] | 0) >>> 0) {
                    c[k >> 2] = (c[s >> 2] | 0) + 1;
                    break;
                } else {
                    c[k >> 2] = (c[w >> 2] | 0) - (c[x >> 2] | 0) + (c[s >> 2] | 0) + 1;
                    break;
                }
            } else {
                c[k >> 2] = (c[s >> 2] | 0) + 1;
                a[n >> 0] = 1;
            }
        while (0);
        c[H >> 2] = (yield* Dc((c[k >> 2] | 0) - (c[s >> 2] | 0) | 0, c[s >> 2] | 0)) | 0;
        ye(c[(c[H >> 2] | 0) + 24 >> 2] | 0, 0, c[k >> 2] | 0) | 0;
        c[y >> 2] = re((c[x >> 2] | 0) + 1 | 0) | 0;
        if (!(c[y >> 2] | 0))
            yield* ec();
        a:
            do
                if (!(a[n >> 0] | 0)) {
                    c[j >> 2] = 10 / ((d[c[z >> 2] >> 0] | 0) + 1 | 0) | 0;
                    if ((c[j >> 2] | 0) != 1) {
                        Yc(c[A >> 2] | 0, (c[w >> 2] | 0) + (c[l >> 2] | 0) + (c[h >> 2] | 0) + 1 | 0, c[j >> 2] | 0, c[A >> 2] | 0);
                        Yc(c[z >> 2] | 0, c[x >> 2] | 0, c[j >> 2] | 0, c[z >> 2] | 0);
                    }
                    c[E >> 2] = 0;
                    b = c[(c[H >> 2] | 0) + 24 >> 2] | 0;
                    if ((c[x >> 2] | 0) >>> 0 > (c[w >> 2] | 0) >>> 0)
                        c[G >> 2] = b + (c[x >> 2] | 0) + (0 - (c[w >> 2] | 0));
                    else
                        c[G >> 2] = b;
                    while (1) {
                        if ((c[E >> 2] | 0) >>> 0 > ((c[w >> 2] | 0) + (c[s >> 2] | 0) - (c[x >> 2] | 0) | 0) >>> 0)
                            break a;
                        if ((d[c[z >> 2] >> 0] | 0) == (d[(c[A >> 2] | 0) + (c[E >> 2] | 0) >> 0] | 0))
                            c[F >> 2] = 9;
                        else
                            c[F >> 2] = (((d[(c[A >> 2] | 0) + (c[E >> 2] | 0) >> 0] | 0) * 10 | 0) + (d[(c[A >> 2] | 0) + ((c[E >> 2] | 0) + 1) >> 0] | 0) | 0) / (d[c[z >> 2] >> 0] | 0) | 0;
                        m = _(d[(c[z >> 2] | 0) + 1 >> 0] | 0, c[F >> 2] | 0) | 0;
                        n = (((d[(c[A >> 2] | 0) + (c[E >> 2] | 0) >> 0] | 0) * 10 | 0) + (d[(c[A >> 2] | 0) + ((c[E >> 2] | 0) + 1) >> 0] | 0) - (_(d[c[z >> 2] >> 0] | 0, c[F >> 2] | 0) | 0) | 0) * 10 | 0;
                        if (m >>> 0 > (n + (d[(c[A >> 2] | 0) + ((c[E >> 2] | 0) + 2) >> 0] | 0) | 0) >>> 0 ? (c[F >> 2] = (c[F >> 2] | 0) + -1, m = _(d[(c[z >> 2] | 0) + 1 >> 0] | 0, c[F >> 2] | 0) | 0, n = (((d[(c[A >> 2] | 0) + (c[E >> 2] | 0) >> 0] | 0) * 10 | 0) + (d[(c[A >> 2] | 0) + ((c[E >> 2] | 0) + 1) >> 0] | 0) - (_(d[c[z >> 2] >> 0] | 0, c[F >> 2] | 0) | 0) | 0) * 10 | 0, m >>> 0 > (n + (d[(c[A >> 2] | 0) + ((c[E >> 2] | 0) + 2) >> 0] | 0) | 0) >>> 0) : 0)
                            c[F >> 2] = (c[F >> 2] | 0) + -1;
                        c[t >> 2] = 0;
                        b:
                            do
                                if (c[F >> 2] | 0) {
                                    a[c[y >> 2] >> 0] = 0;
                                    Yc(c[z >> 2] | 0, c[x >> 2] | 0, c[F >> 2] | 0, (c[y >> 2] | 0) + 1 | 0);
                                    c[C >> 2] = (c[A >> 2] | 0) + (c[E >> 2] | 0) + (c[x >> 2] | 0);
                                    c[D >> 2] = (c[y >> 2] | 0) + (c[x >> 2] | 0);
                                    c[v >> 2] = 0;
                                    while (1) {
                                        if ((c[v >> 2] | 0) >>> 0 >= ((c[x >> 2] | 0) + 1 | 0) >>> 0)
                                            break b;
                                        m = d[c[C >> 2] >> 0] | 0;
                                        n = c[D >> 2] | 0;
                                        c[D >> 2] = n + -1;
                                        c[I >> 2] = m - (d[n >> 0] | 0) - (c[t >> 2] | 0);
                                        if ((c[I >> 2] | 0) < 0) {
                                            c[I >> 2] = (c[I >> 2] | 0) + 10;
                                            c[t >> 2] = 1;
                                        } else
                                            c[t >> 2] = 0;
                                        m = c[I >> 2] & 255;
                                        n = c[C >> 2] | 0;
                                        c[C >> 2] = n + -1;
                                        a[n >> 0] = m;
                                        c[v >> 2] = (c[v >> 2] | 0) + 1;
                                    }
                                }
                            while (0);
                        if ((c[t >> 2] | 0) == 1) {
                            c[F >> 2] = (c[F >> 2] | 0) + -1;
                            c[C >> 2] = (c[A >> 2] | 0) + (c[E >> 2] | 0) + (c[x >> 2] | 0);
                            c[D >> 2] = (c[z >> 2] | 0) + (c[x >> 2] | 0) + -1;
                            c[u >> 2] = 0;
                            c[v >> 2] = 0;
                            while (1) {
                                if ((c[v >> 2] | 0) >>> 0 >= (c[x >> 2] | 0) >>> 0)
                                    break;
                                m = d[c[C >> 2] >> 0] | 0;
                                n = c[D >> 2] | 0;
                                c[D >> 2] = n + -1;
                                c[I >> 2] = m + (d[n >> 0] | 0) + (c[u >> 2] | 0);
                                if ((c[I >> 2] | 0) > 9) {
                                    c[I >> 2] = (c[I >> 2] | 0) - 10;
                                    c[u >> 2] = 1;
                                } else
                                    c[u >> 2] = 0;
                                m = c[I >> 2] & 255;
                                n = c[C >> 2] | 0;
                                c[C >> 2] = n + -1;
                                a[n >> 0] = m;
                                c[v >> 2] = (c[v >> 2] | 0) + 1;
                            }
                            if ((c[u >> 2] | 0) == 1)
                                a[c[C >> 2] >> 0] = ((d[c[C >> 2] >> 0] | 0) + 1 | 0) % 10 | 0;
                        }
                        m = c[F >> 2] & 255;
                        n = c[G >> 2] | 0;
                        c[G >> 2] = n + 1;
                        a[n >> 0] = m;
                        c[E >> 2] = (c[E >> 2] | 0) + 1;
                    }
                }
            while (0);
        c[c[H >> 2] >> 2] = (c[c[p >> 2] >> 2] | 0) == (c[c[q >> 2] >> 2] | 0) ? 0 : 1;
        if ((Lc(c[H >> 2] | 0) | 0) << 24 >> 24)
            c[c[H >> 2] >> 2] = 0;
        Pc(c[H >> 2] | 0);
        Ec(c[r >> 2] | 0);
        c[c[r >> 2] >> 2] = c[H >> 2];
        se(c[y >> 2] | 0);
        se(c[A >> 2] | 0);
        se(c[B >> 2] | 0);
        c[o >> 2] = 0;
        I = c[o >> 2] | 0;
        i = J;
        return I | 0;
    }
    function Yc(b, e, f, g) {
        b = b | 0;
        e = e | 0;
        f = f | 0;
        g = g | 0;
        var h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0;
        q = i;
        i = i + 32 | 0;
        h = q + 28 | 0;
        j = q + 24 | 0;
        k = q + 20 | 0;
        l = q + 16 | 0;
        m = q + 12 | 0;
        p = q + 8 | 0;
        n = q + 4 | 0;
        o = q;
        c[h >> 2] = b;
        c[j >> 2] = e;
        c[k >> 2] = f;
        c[l >> 2] = g;
        if (!(c[k >> 2] | 0)) {
            ye(c[l >> 2] | 0, 0, c[j >> 2] | 0) | 0;
            i = q;
            return;
        }
        if ((c[k >> 2] | 0) == 1) {
            Ce(c[l >> 2] | 0, c[h >> 2] | 0, c[j >> 2] | 0) | 0;
            i = q;
            return;
        }
        c[n >> 2] = (c[h >> 2] | 0) + (c[j >> 2] | 0) + -1;
        c[o >> 2] = (c[l >> 2] | 0) + (c[j >> 2] | 0) + -1;
        c[m >> 2] = 0;
        while (1) {
            e = c[j >> 2] | 0;
            c[j >> 2] = e + -1;
            if ((e | 0) <= 0)
                break;
            g = c[n >> 2] | 0;
            c[n >> 2] = g + -1;
            g = _(d[g >> 0] | 0, c[k >> 2] | 0) | 0;
            c[p >> 2] = g + (c[m >> 2] | 0);
            g = ((c[p >> 2] | 0) % 10 | 0) & 255;
            e = c[o >> 2] | 0;
            c[o >> 2] = e + -1;
            a[e >> 0] = g;
            c[m >> 2] = (c[p >> 2] | 0) / 10 | 0;
        }
        if (!(c[m >> 2] | 0)) {
            i = q;
            return;
        }
        a[c[o >> 2] >> 0] = c[m >> 2];
        i = q;
        return;
    }
    function* Zc(a, b, d, e, f) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        e = e | 0;
        f = f | 0;
        var g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0;
        q = i;
        i = i + 48 | 0;
        g = q + 32 | 0;
        h = q + 28 | 0;
        j = q + 24 | 0;
        k = q + 20 | 0;
        l = q + 16 | 0;
        m = q + 12 | 0;
        n = q + 8 | 0;
        p = q + 4 | 0;
        o = q;
        c[h >> 2] = a;
        c[j >> 2] = b;
        c[k >> 2] = d;
        c[l >> 2] = e;
        c[m >> 2] = f;
        c[n >> 2] = 0;
        if ((Lc(c[j >> 2] | 0) | 0) << 24 >> 24) {
            c[g >> 2] = -1;
            p = c[g >> 2] | 0;
            i = q;
            return p | 0;
        }
        if ((c[(c[h >> 2] | 0) + 8 >> 2] | 0) > ((c[(c[j >> 2] | 0) + 8 >> 2] | 0) + (c[m >> 2] | 0) | 0))
            a = c[(c[h >> 2] | 0) + 8 >> 2] | 0;
        else
            a = (c[(c[j >> 2] | 0) + 8 >> 2] | 0) + (c[m >> 2] | 0) | 0;
        c[o >> 2] = a;
        Hc(p);
        (yield* Xc(c[h >> 2] | 0, c[j >> 2] | 0, p, c[m >> 2] | 0)) | 0;
        if (c[k >> 2] | 0)
            c[n >> 2] = Gc(c[p >> 2] | 0) | 0;
        yield* Sc(c[p >> 2] | 0, c[j >> 2] | 0, p, c[o >> 2] | 0);
        yield* Nc(c[h >> 2] | 0, c[p >> 2] | 0, c[l >> 2] | 0, c[o >> 2] | 0);
        Ec(p);
        if (c[k >> 2] | 0) {
            Ec(c[k >> 2] | 0);
            c[c[k >> 2] >> 2] = c[n >> 2];
        }
        c[g >> 2] = 0;
        p = c[g >> 2] | 0;
        i = q;
        return p | 0;
    }
    function* _c(a, b, d, e) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        e = e | 0;
        var f = 0, g = 0, h = 0, j = 0, k = 0;
        f = i;
        i = i + 16 | 0;
        k = f + 12 | 0;
        j = f + 8 | 0;
        h = f + 4 | 0;
        g = f;
        c[k >> 2] = a;
        c[j >> 2] = b;
        c[h >> 2] = d;
        c[g >> 2] = e;
        e = (yield* Zc(c[k >> 2] | 0, c[j >> 2] | 0, 0, c[h >> 2] | 0, c[g >> 2] | 0)) | 0;
        i = f;
        return e | 0;
    }
    function* $c(b, e, f, g) {
        b = b | 0;
        e = e | 0;
        f = f | 0;
        g = g | 0;
        var h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0;
        u = i;
        i = i + 64 | 0;
        j = u + 8 | 0;
        l = u + 48 | 0;
        h = u + 44 | 0;
        m = u + 40 | 0;
        k = u + 36 | 0;
        t = u + 32 | 0;
        q = u + 28 | 0;
        o = u + 24 | 0;
        s = u + 20 | 0;
        r = u + 16 | 0;
        n = u + 12 | 0;
        p = u + 52 | 0;
        c[l >> 2] = b;
        c[h >> 2] = e;
        c[m >> 2] = f;
        c[k >> 2] = g;
        if (c[(c[h >> 2] | 0) + 8 >> 2] | 0)
            yield* zc(18739, u);
        c[o >> 2] = ad(c[h >> 2] | 0) | 0;
        do
            if (!(c[o >> 2] | 0)) {
                if ((c[(c[h >> 2] | 0) + 4 >> 2] | 0) <= 1 ? (d[c[(c[h >> 2] | 0) + 24 >> 2] >> 0] | 0) == 0 : 0)
                    break;
                yield* yc(18766, j);
            }
        while (0);
        if (!(c[o >> 2] | 0)) {
            Ec(c[m >> 2] | 0);
            t = Gc(c[5387] | 0) | 0;
            c[c[m >> 2] >> 2] = t;
            i = u;
            return;
        }
        if ((c[o >> 2] | 0) < 0) {
            a[p >> 0] = 1;
            c[o >> 2] = 0 - (c[o >> 2] | 0);
            c[s >> 2] = c[k >> 2];
        } else {
            a[p >> 0] = 0;
            h = _(c[(c[l >> 2] | 0) + 8 >> 2] | 0, c[o >> 2] | 0) | 0;
            if ((c[k >> 2] | 0) > (c[(c[l >> 2] | 0) + 8 >> 2] | 0))
                b = c[k >> 2] | 0;
            else
                b = c[(c[l >> 2] | 0) + 8 >> 2] | 0;
            do
                if ((h | 0) > (b | 0))
                    if ((c[k >> 2] | 0) > (c[(c[l >> 2] | 0) + 8 >> 2] | 0)) {
                        h = c[k >> 2] | 0;
                        break;
                    } else {
                        h = c[(c[l >> 2] | 0) + 8 >> 2] | 0;
                        break;
                    }
                else
                    h = _(c[(c[l >> 2] | 0) + 8 >> 2] | 0, c[o >> 2] | 0) | 0;
            while (0);
            c[s >> 2] = h;
        }
        c[q >> 2] = Gc(c[l >> 2] | 0) | 0;
        c[r >> 2] = c[(c[l >> 2] | 0) + 8 >> 2];
        while (1) {
            if (c[o >> 2] & 1 | 0)
                break;
            c[r >> 2] = c[r >> 2] << 1;
            yield* Sc(c[q >> 2] | 0, c[q >> 2] | 0, q, c[r >> 2] | 0);
            c[o >> 2] = c[o >> 2] >> 1;
        }
        c[t >> 2] = Gc(c[q >> 2] | 0) | 0;
        c[n >> 2] = c[r >> 2];
        c[o >> 2] = c[o >> 2] >> 1;
        while (1) {
            if ((c[o >> 2] | 0) <= 0)
                break;
            c[r >> 2] = c[r >> 2] << 1;
            yield* Sc(c[q >> 2] | 0, c[q >> 2] | 0, q, c[r >> 2] | 0);
            if ((c[o >> 2] & 1 | 0) == 1) {
                c[n >> 2] = (c[r >> 2] | 0) + (c[n >> 2] | 0);
                yield* Sc(c[t >> 2] | 0, c[q >> 2] | 0, t, c[n >> 2] | 0);
            }
            c[o >> 2] = c[o >> 2] >> 1;
        }
        if (!(a[p >> 0] | 0)) {
            Ec(c[m >> 2] | 0);
            c[c[m >> 2] >> 2] = c[t >> 2];
            if ((c[(c[c[m >> 2] >> 2] | 0) + 8 >> 2] | 0) > (c[s >> 2] | 0))
                c[(c[c[m >> 2] >> 2] | 0) + 8 >> 2] = c[s >> 2];
        } else {
            (yield* Xc(c[5387] | 0, c[t >> 2] | 0, c[m >> 2] | 0, c[s >> 2] | 0)) | 0;
            Ec(t);
        }
        Ec(q);
        i = u;
        return;
    }
    function ad(a) {
        a = a | 0;
        var b = 0, e = 0, f = 0, g = 0, h = 0, j = 0, k = 0;
        j = i;
        i = i + 32 | 0;
        g = j + 16 | 0;
        h = j + 12 | 0;
        f = j + 8 | 0;
        e = j + 4 | 0;
        b = j;
        c[h >> 2] = a;
        c[f >> 2] = 0;
        c[e >> 2] = c[(c[h >> 2] | 0) + 24 >> 2];
        c[b >> 2] = c[(c[h >> 2] | 0) + 4 >> 2];
        while (1) {
            if (!((c[b >> 2] | 0) > 0 ? (c[f >> 2] | 0) <= 214748364 : 0))
                break;
            k = (c[f >> 2] | 0) * 10 | 0;
            a = c[e >> 2] | 0;
            c[e >> 2] = a + 1;
            c[f >> 2] = k + (d[a >> 0] | 0);
            c[b >> 2] = (c[b >> 2] | 0) + -1;
        }
        if ((c[b >> 2] | 0) > 0)
            c[f >> 2] = 0;
        if ((c[f >> 2] | 0) < 0)
            c[f >> 2] = 0;
        b = c[f >> 2] | 0;
        if (!(c[c[h >> 2] >> 2] | 0)) {
            c[g >> 2] = b;
            k = c[g >> 2] | 0;
            i = j;
            return k | 0;
        } else {
            c[g >> 2] = 0 - b;
            k = c[g >> 2] | 0;
            i = j;
            return k | 0;
        }
        return 0;
    }
    function* bd(b, d) {
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0;
        q = i;
        i = i + 48 | 0;
        f = q + 40 | 0;
        g = q + 36 | 0;
        e = q + 32 | 0;
        p = q + 28 | 0;
        h = q + 24 | 0;
        l = q + 20 | 0;
        j = q + 16 | 0;
        m = q + 12 | 0;
        n = q + 8 | 0;
        o = q + 4 | 0;
        k = q;
        c[g >> 2] = b;
        c[e >> 2] = d;
        c[h >> 2] = Ic(c[c[g >> 2] >> 2] | 0, c[5386] | 0) | 0;
        if ((c[h >> 2] | 0) < 0) {
            c[f >> 2] = 0;
            p = c[f >> 2] | 0;
            i = q;
            return p | 0;
        }
        b = c[g >> 2] | 0;
        if (!(c[h >> 2] | 0)) {
            Ec(b);
            p = Gc(c[5386] | 0) | 0;
            c[c[g >> 2] >> 2] = p;
            c[f >> 2] = 1;
            p = c[f >> 2] | 0;
            i = q;
            return p | 0;
        }
        c[h >> 2] = Ic(c[b >> 2] | 0, c[5387] | 0) | 0;
        if (!(c[h >> 2] | 0)) {
            Ec(c[g >> 2] | 0);
            p = Gc(c[5387] | 0) | 0;
            c[c[g >> 2] >> 2] = p;
            c[f >> 2] = 1;
            p = c[f >> 2] | 0;
            i = q;
            return p | 0;
        }
        if ((c[e >> 2] | 0) > (c[(c[c[g >> 2] >> 2] | 0) + 8 >> 2] | 0))
            b = c[e >> 2] | 0;
        else
            b = c[(c[c[g >> 2] >> 2] | 0) + 8 >> 2] | 0;
        c[p >> 2] = b;
        Hc(m);
        Hc(n);
        Hc(k);
        c[o >> 2] = (yield* Dc(1, 1)) | 0;
        a[(c[(c[o >> 2] | 0) + 24 >> 2] | 0) + 1 >> 0] = 5;
        if ((c[h >> 2] | 0) < 0) {
            c[m >> 2] = Gc(c[5387] | 0) | 0;
            c[j >> 2] = c[(c[c[g >> 2] >> 2] | 0) + 8 >> 2];
        } else {
            yield* cd(m, 10);
            yield* cd(n, c[(c[c[g >> 2] >> 2] | 0) + 4 >> 2] | 0);
            yield* Sc(c[n >> 2] | 0, c[o >> 2] | 0, n, 0);
            c[(c[n >> 2] | 0) + 8 >> 2] = 0;
            yield* $c(c[m >> 2] | 0, c[n >> 2] | 0, m, 0);
            Ec(n);
            c[j >> 2] = 3;
        }
        c[l >> 2] = 0;
        while (1) {
            if (!((c[l >> 2] | 0) != 0 ^ 1))
                break;
            Ec(n);
            c[n >> 2] = Gc(c[m >> 2] | 0) | 0;
            (yield* Xc(c[c[g >> 2] >> 2] | 0, c[m >> 2] | 0, m, c[j >> 2] | 0)) | 0;
            yield* Rc(c[m >> 2] | 0, c[n >> 2] | 0, m, 0);
            yield* Sc(c[m >> 2] | 0, c[o >> 2] | 0, m, c[j >> 2] | 0);
            yield* Nc(c[m >> 2] | 0, c[n >> 2] | 0, k, (c[j >> 2] | 0) + 1 | 0);
            if (!((Mc(c[k >> 2] | 0, c[j >> 2] | 0) | 0) << 24 >> 24))
                continue;
            if ((c[j >> 2] | 0) < ((c[p >> 2] | 0) + 1 | 0)) {
                c[j >> 2] = ((c[j >> 2] | 0) * 3 | 0) > ((c[p >> 2] | 0) + 1 | 0) ? (c[p >> 2] | 0) + 1 | 0 : (c[j >> 2] | 0) * 3 | 0;
                continue;
            } else {
                c[l >> 2] = 1;
                continue;
            }
        }
        Ec(c[g >> 2] | 0);
        (yield* Xc(c[m >> 2] | 0, c[5387] | 0, c[g >> 2] | 0, c[p >> 2] | 0)) | 0;
        Ec(m);
        Ec(n);
        Ec(o);
        Ec(k);
        c[f >> 2] = 1;
        p = c[f >> 2] | 0;
        i = q;
        return p | 0;
    }
    function* cd(b, d) {
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0, g = 0, h = 0, j = 0, k = 0, l = 0;
        l = i;
        i = i + 64 | 0;
        e = l + 16 | 0;
        f = l + 12 | 0;
        g = l + 8 | 0;
        k = l + 4 | 0;
        h = l;
        j = l + 20 | 0;
        c[e >> 2] = b;
        c[f >> 2] = d;
        c[h >> 2] = 1;
        a[j >> 0] = 0;
        if ((c[f >> 2] | 0) < 0) {
            a[j >> 0] = 1;
            c[f >> 2] = 0 - (c[f >> 2] | 0);
        }
        c[g >> 2] = l + 22;
        b = ((c[f >> 2] | 0) % 10 | 0) & 255;
        d = c[g >> 2] | 0;
        c[g >> 2] = d + 1;
        a[d >> 0] = b;
        c[f >> 2] = (c[f >> 2] | 0) / 10 | 0;
        while (1) {
            if (!(c[f >> 2] | 0))
                break;
            b = ((c[f >> 2] | 0) % 10 | 0) & 255;
            d = c[g >> 2] | 0;
            c[g >> 2] = d + 1;
            a[d >> 0] = b;
            c[f >> 2] = (c[f >> 2] | 0) / 10 | 0;
            c[h >> 2] = (c[h >> 2] | 0) + 1;
        }
        Ec(c[e >> 2] | 0);
        d = (yield* Dc(c[h >> 2] | 0, 0)) | 0;
        c[c[e >> 2] >> 2] = d;
        if (a[j >> 0] | 0)
            c[c[c[e >> 2] >> 2] >> 2] = 1;
        c[k >> 2] = c[(c[c[e >> 2] >> 2] | 0) + 24 >> 2];
        while (1) {
            d = c[h >> 2] | 0;
            c[h >> 2] = d + -1;
            if ((d | 0) <= 0)
                break;
            b = (c[g >> 2] | 0) + -1 | 0;
            c[g >> 2] = b;
            b = a[b >> 0] | 0;
            d = c[k >> 2] | 0;
            c[k >> 2] = d + 1;
            a[d >> 0] = b;
        }
        i = l;
        return;
    }
    function* dd(a, b, e, f) {
        a = a | 0;
        b = b | 0;
        e = e | 0;
        f = f | 0;
        var g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0;
        o = i;
        i = i + 80 | 0;
        n = o;
        g = o + 24 | 0;
        h = o + 20 | 0;
        p = o + 16 | 0;
        j = o + 12 | 0;
        k = o + 32 | 0;
        m = o + 8 | 0;
        l = o + 4 | 0;
        c[g >> 2] = a;
        c[h >> 2] = b;
        c[p >> 2] = e;
        c[j >> 2] = f;
        if (c[p >> 2] | 0)
            yield* La[c[j >> 2] & 7](32);
        c[n >> 2] = c[g >> 2];
        (yield* $d(k, 18794, n)) | 0;
        c[m >> 2] = pd(k) | 0;
        while (1) {
            if ((c[h >> 2] | 0) <= (c[m >> 2] | 0))
                break;
            yield* La[c[j >> 2] & 7](48);
            c[h >> 2] = (c[h >> 2] | 0) + -1;
        }
        c[l >> 2] = 0;
        while (1) {
            if ((c[l >> 2] | 0) >= (c[m >> 2] | 0))
                break;
            yield* La[c[j >> 2] & 7](d[k + (c[l >> 2] | 0) >> 0] | 0);
            c[l >> 2] = (c[l >> 2] | 0) + 1;
        }
        i = o;
        return;
    }
    function* ed(a, b, e, f) {
        a = a | 0;
        b = b | 0;
        e = e | 0;
        f = f | 0;
        var g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0;
        y = i;
        i = i + 64 | 0;
        g = y + 60 | 0;
        h = y + 56 | 0;
        j = y + 52 | 0;
        k = y + 48 | 0;
        t = y + 44 | 0;
        r = y + 40 | 0;
        o = y + 36 | 0;
        u = y + 32 | 0;
        n = y + 28 | 0;
        w = y + 24 | 0;
        q = y + 20 | 0;
        p = y + 16 | 0;
        l = y + 12 | 0;
        m = y + 8 | 0;
        v = y + 4 | 0;
        s = y;
        c[g >> 2] = a;
        c[h >> 2] = b;
        c[j >> 2] = e;
        c[k >> 2] = f;
        if ((c[c[g >> 2] >> 2] | 0) == 1)
            yield* La[c[j >> 2] & 7](45);
        if ((Lc(c[g >> 2] | 0) | 0) << 24 >> 24) {
            yield* La[c[j >> 2] & 7](48);
            i = y;
            return;
        }
        if ((c[h >> 2] | 0) == 10) {
            c[t >> 2] = c[(c[g >> 2] | 0) + 24 >> 2];
            if ((c[(c[g >> 2] | 0) + 4 >> 2] | 0) <= 1 ? !(d[c[t >> 2] >> 0] | 0 | 0) : 0)
                c[t >> 2] = (c[t >> 2] | 0) + 1;
            else
                x = 8;
            a:
                do
                    if ((x | 0) == 8) {
                        c[r >> 2] = c[(c[g >> 2] | 0) + 4 >> 2];
                        while (1) {
                            if ((c[r >> 2] | 0) <= 0)
                                break a;
                            w = c[j >> 2] | 0;
                            x = c[t >> 2] | 0;
                            c[t >> 2] = x + 1;
                            yield* La[w & 7]((d[x >> 0] | 0) + 48 | 0);
                            c[r >> 2] = (c[r >> 2] | 0) + -1;
                        }
                    }
                while (0);
            if (c[k >> 2] | 0 ? (Lc(c[g >> 2] | 0) | 0) & 255 | 0 : 0)
                yield* La[c[j >> 2] & 7](48);
            if ((c[(c[g >> 2] | 0) + 8 >> 2] | 0) <= 0) {
                i = y;
                return;
            }
            yield* La[c[j >> 2] & 7](46);
            c[r >> 2] = 0;
            while (1) {
                if ((c[r >> 2] | 0) >= (c[(c[g >> 2] | 0) + 8 >> 2] | 0))
                    break;
                w = c[j >> 2] | 0;
                x = c[t >> 2] | 0;
                c[t >> 2] = x + 1;
                yield* La[w & 7]((d[x >> 0] | 0) + 48 | 0);
                c[r >> 2] = (c[r >> 2] | 0) + 1;
            }
            i = y;
            return;
        }
        if (c[k >> 2] | 0 ? (Lc(c[g >> 2] | 0) | 0) & 255 | 0 : 0)
            yield* La[c[j >> 2] & 7](48);
        c[n >> 2] = 0;
        Hc(q);
        (yield* Xc(c[g >> 2] | 0, c[5387] | 0, q, 0)) | 0;
        Hc(p);
        Hc(m);
        Hc(l);
        yield* Nc(c[g >> 2] | 0, c[q >> 2] | 0, p, 0);
        c[c[q >> 2] >> 2] = 0;
        c[c[p >> 2] >> 2] = 0;
        yield* cd(l, c[h >> 2] | 0);
        Hc(s);
        yield* cd(s, (c[h >> 2] | 0) - 1 | 0);
        while (1) {
            if (!((Lc(c[q >> 2] | 0) | 0) << 24 >> 24 != 0 ^ 1))
                break;
            (yield* _c(c[q >> 2] | 0, c[l >> 2] | 0, m, 0)) | 0;
            c[w >> 2] = re(8) | 0;
            if (!(c[w >> 2] | 0))
                yield* ec();
            x = ad(c[m >> 2] | 0) | 0;
            c[c[w >> 2] >> 2] = x;
            c[(c[w >> 2] | 0) + 4 >> 2] = c[n >> 2];
            c[n >> 2] = c[w >> 2];
            (yield* Xc(c[q >> 2] | 0, c[l >> 2] | 0, q, 0)) | 0;
        }
        if ((c[n >> 2] | 0) != 0 & (c[n >> 2] | 0) != 0)
            do {
                c[w >> 2] = c[n >> 2];
                c[n >> 2] = c[(c[n >> 2] | 0) + 4 >> 2];
                if ((c[h >> 2] | 0) <= 16)
                    yield* La[c[j >> 2] & 7](d[18798 + (c[c[w >> 2] >> 2] | 0) >> 0] | 0);
                else
                    yield* dd(c[c[w >> 2] >> 2] | 0, c[(c[s >> 2] | 0) + 4 >> 2] | 0, 1, c[j >> 2] | 0);
                se(c[w >> 2] | 0);
            } while ((c[n >> 2] | 0) != 0);
        if ((c[(c[g >> 2] | 0) + 8 >> 2] | 0) > 0) {
            yield* La[c[j >> 2] & 7](46);
            c[u >> 2] = 0;
            c[v >> 2] = Gc(c[5387] | 0) | 0;
            while (1) {
                if ((c[(c[v >> 2] | 0) + 4 >> 2] | 0) > (c[(c[g >> 2] | 0) + 8 >> 2] | 0))
                    break;
                yield* Sc(c[p >> 2] | 0, c[l >> 2] | 0, p, c[(c[g >> 2] | 0) + 8 >> 2] | 0);
                c[o >> 2] = ad(c[p >> 2] | 0) | 0;
                yield* cd(q, c[o >> 2] | 0);
                yield* Nc(c[p >> 2] | 0, c[q >> 2] | 0, p, 0);
                if ((c[h >> 2] | 0) <= 16)
                    yield* La[c[j >> 2] & 7](d[18798 + (c[o >> 2] | 0) >> 0] | 0);
                else {
                    yield* dd(c[o >> 2] | 0, c[(c[s >> 2] | 0) + 4 >> 2] | 0, c[u >> 2] | 0, c[j >> 2] | 0);
                    c[u >> 2] = 1;
                }
                yield* Sc(c[v >> 2] | 0, c[l >> 2] | 0, v, 0);
            }
            Ec(v);
        }
        Ec(q);
        Ec(p);
        Ec(l);
        Ec(m);
        Ec(s);
        i = y;
        return;
    }
    function fd(a) {
        a = a | 0;
        var b = 0, d = 0;
        b = i;
        i = i + 16 | 0;
        d = b;
        c[d >> 2] = c[a + 60 >> 2];
        a = gd(ja(6, d | 0) | 0) | 0;
        i = b;
        return a | 0;
    }
    function gd(a) {
        a = a | 0;
        if (a >>> 0 > 4294963200) {
            c[(hd() | 0) >> 2] = 0 - a;
            a = -1;
        }
        return a | 0;
    }
    function hd() {
        var a = 0;
        if (!(c[5392] | 0))
            a = 21612;
        else
            a = c[(sa() | 0) + 64 >> 2] | 0;
        return a | 0;
    }
    function* id(b, d, e) {
        b = b | 0;
        d = d | 0;
        e = e | 0;
        var f = 0, g = 0;
        g = i;
        i = i + 80 | 0;
        f = g;
        c[b + 36 >> 2] = 4;
        if ((c[b >> 2] & 64 | 0) == 0 ? (c[f >> 2] = c[b + 60 >> 2], c[f + 4 >> 2] = 21505, c[f + 8 >> 2] = g + 12, ua(54, f | 0) | 0) : 0)
            a[b + 75 >> 0] = -1;
        f = (yield* jd(b, d, e)) | 0;
        i = g;
        return f | 0;
    }
    function* jd(a, b, d) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0;
        q = i;
        i = i + 48 | 0;
        n = q + 16 | 0;
        m = q;
        e = q + 32 | 0;
        o = a + 28 | 0;
        f = c[o >> 2] | 0;
        c[e >> 2] = f;
        p = a + 20 | 0;
        f = (c[p >> 2] | 0) - f | 0;
        c[e + 4 >> 2] = f;
        c[e + 8 >> 2] = b;
        c[e + 12 >> 2] = d;
        k = a + 60 | 0;
        l = a + 44 | 0;
        b = 2;
        f = f + d | 0;
        while (1) {
            if (!(c[5392] | 0)) {
                c[n >> 2] = c[k >> 2];
                c[n + 4 >> 2] = e;
                c[n + 8 >> 2] = b;
                h = gd(Ga(146, n | 0) | 0) | 0;
            } else {
                ka(4, a | 0);
                c[m >> 2] = c[k >> 2];
                c[m + 4 >> 2] = e;
                c[m + 8 >> 2] = b;
                h = gd(Ga(146, m | 0) | 0) | 0;
                ha(0);
            }
            if ((f | 0) == (h | 0)) {
                f = 6;
                break;
            }
            if ((h | 0) < 0) {
                f = 8;
                break;
            }
            f = f - h | 0;
            g = c[e + 4 >> 2] | 0;
            if (h >>> 0 <= g >>> 0)
                if ((b | 0) == 2) {
                    c[o >> 2] = (c[o >> 2] | 0) + h;
                    j = g;
                    b = 2;
                } else
                    j = g;
            else {
                j = c[l >> 2] | 0;
                c[o >> 2] = j;
                c[p >> 2] = j;
                j = c[e + 12 >> 2] | 0;
                h = h - g | 0;
                e = e + 8 | 0;
                b = b + -1 | 0;
            }
            c[e >> 2] = (c[e >> 2] | 0) + h;
            c[e + 4 >> 2] = j - h;
        }
        if ((f | 0) == 6) {
            n = c[l >> 2] | 0;
            c[a + 16 >> 2] = n + (c[a + 48 >> 2] | 0);
            a = n;
            c[o >> 2] = a;
            c[p >> 2] = a;
        } else if ((f | 0) == 8) {
            c[a + 16 >> 2] = 0;
            c[o >> 2] = 0;
            c[p >> 2] = 0;
            c[a >> 2] = c[a >> 2] | 32;
            if ((b | 0) == 2)
                d = 0;
            else
                d = d - (c[e + 4 >> 2] | 0) | 0;
        }
        i = q;
        return d | 0;
    }
    function* kd(a) {
        a = a | 0;
        if (!(c[a + 68 >> 2] | 0))
            ld(a);
        return;
    }
    function ld(a) {
        a = a | 0;
        return;
    }
    function* md(a, b, d) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0, g = 0;
        f = i;
        i = i + 32 | 0;
        g = f;
        e = f + 20 | 0;
        c[g >> 2] = c[a + 60 >> 2];
        c[g + 4 >> 2] = 0;
        c[g + 8 >> 2] = b;
        c[g + 12 >> 2] = e;
        c[g + 16 >> 2] = d;
        if ((gd(Da(140, g | 0) | 0) | 0) < 0) {
            c[e >> 2] = -1;
            a = -1;
        } else
            a = c[e >> 2] | 0;
        i = f;
        return a | 0;
    }
    function* nd(b, d, e) {
        b = b | 0;
        d = d | 0;
        e = e | 0;
        var f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0;
        m = i;
        i = i + 48 | 0;
        h = m + 16 | 0;
        g = m;
        f = m + 32 | 0;
        c[f >> 2] = d;
        j = f + 4 | 0;
        l = b + 48 | 0;
        n = c[l >> 2] | 0;
        c[j >> 2] = e - ((n | 0) != 0 & 1);
        k = b + 44 | 0;
        c[f + 8 >> 2] = c[k >> 2];
        c[f + 12 >> 2] = n;
        if (!(c[5392] | 0)) {
            c[h >> 2] = c[b + 60 >> 2];
            c[h + 4 >> 2] = f;
            c[h + 8 >> 2] = 2;
            f = gd((yield* Fa(145, h | 0)) | 0) | 0;
        } else {
            ka(5, b | 0);
            c[g >> 2] = c[b + 60 >> 2];
            c[g + 4 >> 2] = f;
            c[g + 8 >> 2] = 2;
            f = gd((yield* Fa(145, g | 0)) | 0) | 0;
            ha(0);
        }
        if ((f | 0) >= 1) {
            j = c[j >> 2] | 0;
            if (f >>> 0 > j >>> 0) {
                g = c[k >> 2] | 0;
                h = b + 4 | 0;
                c[h >> 2] = g;
                c[b + 8 >> 2] = g + (f - j);
                if (!(c[l >> 2] | 0))
                    f = e;
                else {
                    c[h >> 2] = g + 1;
                    a[d + (e + -1) >> 0] = a[g >> 0] | 0;
                    f = e;
                }
            }
        } else {
            c[b >> 2] = c[b >> 2] | f & 48 ^ 16;
            c[b + 8 >> 2] = 0;
            c[b + 4 >> 2] = 0;
        }
        i = m;
        return f | 0;
    }
    function* od(a) {
        a = a | 0;
        if (!(c[a + 68 >> 2] | 0))
            ld(a);
        return;
    }
    function pd(b) {
        b = b | 0;
        var d = 0, e = 0, f = 0;
        f = b;
        a:
            do
                if (!(f & 3))
                    e = 4;
                else {
                    d = b;
                    b = f;
                    while (1) {
                        if (!(a[d >> 0] | 0))
                            break a;
                        d = d + 1 | 0;
                        b = d;
                        if (!(b & 3)) {
                            b = d;
                            e = 4;
                            break;
                        }
                    }
                }
            while (0);
        if ((e | 0) == 4) {
            while (1) {
                d = c[b >> 2] | 0;
                if (!((d & -2139062144 ^ -2139062144) & d + -16843009))
                    b = b + 4 | 0;
                else
                    break;
            }
            if ((d & 255) << 24 >> 24)
                do
                    b = b + 1 | 0;
                while ((a[b >> 0] | 0) != 0);
        }
        return b - f | 0;
    }
    function qd(b, d, e) {
        b = b | 0;
        d = d | 0;
        e = e | 0;
        var f = 0, g = 0, h = 0, i = 0;
        h = d & 255;
        f = (e | 0) != 0;
        a:
            do
                if (f & (b & 3 | 0) != 0) {
                    g = d & 255;
                    while (1) {
                        if ((a[b >> 0] | 0) == g << 24 >> 24) {
                            i = 6;
                            break a;
                        }
                        b = b + 1 | 0;
                        e = e + -1 | 0;
                        f = (e | 0) != 0;
                        if (!(f & (b & 3 | 0) != 0)) {
                            i = 5;
                            break;
                        }
                    }
                } else
                    i = 5;
            while (0);
        if ((i | 0) == 5)
            if (f)
                i = 6;
            else
                e = 0;
        b:
            do
                if ((i | 0) == 6) {
                    g = d & 255;
                    if ((a[b >> 0] | 0) != g << 24 >> 24) {
                        f = _(h, 16843009) | 0;
                        c:
                            do
                                if (e >>> 0 > 3)
                                    while (1) {
                                        h = c[b >> 2] ^ f;
                                        if ((h & -2139062144 ^ -2139062144) & h + -16843009 | 0)
                                            break;
                                        b = b + 4 | 0;
                                        e = e + -4 | 0;
                                        if (e >>> 0 <= 3) {
                                            i = 11;
                                            break c;
                                        }
                                    }
                                else
                                    i = 11;
                            while (0);
                        if ((i | 0) == 11)
                            if (!e) {
                                e = 0;
                                break;
                            }
                        while (1) {
                            if ((a[b >> 0] | 0) == g << 24 >> 24)
                                break b;
                            b = b + 1 | 0;
                            e = e + -1 | 0;
                            if (!e) {
                                e = 0;
                                break;
                            }
                        }
                    }
                }
            while (0);
        return (e | 0 ? b : 0) | 0;
    }
    function rd(b, d) {
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0;
        o = i;
        i = i + 112 | 0;
        n = o + 40 | 0;
        l = o + 24 | 0;
        k = o + 16 | 0;
        g = o;
        m = o + 52 | 0;
        f = a[d >> 0] | 0;
        if (qd(21294, f << 24 >> 24, 4) | 0) {
            e = re(1144) | 0;
            if (!e)
                e = 0;
            else {
                h = e;
                j = h + 112 | 0;
                do {
                    c[h >> 2] = 0;
                    h = h + 4 | 0;
                } while ((h | 0) < (j | 0));
                if (!(sd(d, 43) | 0))
                    c[e >> 2] = f << 24 >> 24 == 114 ? 8 : 4;
                if (sd(d, 101) | 0) {
                    c[g >> 2] = b;
                    c[g + 4 >> 2] = 2;
                    c[g + 8 >> 2] = 1;
                    ia(221, g | 0) | 0;
                    f = a[d >> 0] | 0;
                }
                if (f << 24 >> 24 == 97) {
                    c[k >> 2] = b;
                    c[k + 4 >> 2] = 3;
                    f = ia(221, k | 0) | 0;
                    if (!(f & 1024)) {
                        c[l >> 2] = b;
                        c[l + 4 >> 2] = 4;
                        c[l + 8 >> 2] = f | 1024;
                        ia(221, l | 0) | 0;
                    }
                    d = c[e >> 2] | 128;
                    c[e >> 2] = d;
                } else
                    d = c[e >> 2] | 0;
                c[e + 60 >> 2] = b;
                c[e + 44 >> 2] = e + 120;
                c[e + 48 >> 2] = 1024;
                f = e + 75 | 0;
                a[f >> 0] = -1;
                if ((d & 8 | 0) == 0 ? (c[n >> 2] = b, c[n + 4 >> 2] = 21505, c[n + 8 >> 2] = m, (ua(54, n | 0) | 0) == 0) : 0)
                    a[f >> 0] = 10;
                c[e + 32 >> 2] = 3;
                c[e + 36 >> 2] = 4;
                c[e + 40 >> 2] = 2;
                c[e + 12 >> 2] = 1;
                if (!(c[5393] | 0))
                    c[e + 76 >> 2] = -1;
                ya(21596);
                f = c[5398] | 0;
                c[e + 56 >> 2] = f;
                if (f | 0)
                    c[f + 52 >> 2] = e;
                c[5398] = e;
                va(21596);
            }
        } else {
            c[(hd() | 0) >> 2] = 22;
            e = 0;
        }
        i = o;
        return e | 0;
    }
    function sd(b, c) {
        b = b | 0;
        c = c | 0;
        b = td(b, c) | 0;
        return ((a[b >> 0] | 0) == (c & 255) << 24 >> 24 ? b : 0) | 0;
    }
    function td(b, d) {
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0, g = 0;
        f = d & 255;
        a:
            do
                if (!f)
                    b = b + (pd(b) | 0) | 0;
                else {
                    if (b & 3) {
                        e = d & 255;
                        do {
                            g = a[b >> 0] | 0;
                            if (g << 24 >> 24 == 0 ? 1 : g << 24 >> 24 == e << 24 >> 24)
                                break a;
                            b = b + 1 | 0;
                        } while ((b & 3 | 0) != 0);
                    }
                    f = _(f, 16843009) | 0;
                    e = c[b >> 2] | 0;
                    b:
                        do
                            if (!((e & -2139062144 ^ -2139062144) & e + -16843009))
                                do {
                                    g = e ^ f;
                                    if ((g & -2139062144 ^ -2139062144) & g + -16843009 | 0)
                                        break b;
                                    b = b + 4 | 0;
                                    e = c[b >> 2] | 0;
                                } while (!((e & -2139062144 ^ -2139062144) & e + -16843009 | 0));
                        while (0);
                    e = d & 255;
                    while (1) {
                        g = a[b >> 0] | 0;
                        if (g << 24 >> 24 == 0 ? 1 : g << 24 >> 24 == e << 24 >> 24)
                            break;
                        else
                            b = b + 1 | 0;
                    }
                }
            while (0);
        return b | 0;
    }
    function ud(a) {
        a = a | 0;
        return 0;
    }
    function* vd(a) {
        a = a | 0;
        var b = 0, e = 0;
        e = i;
        i = i + 16 | 0;
        b = e;
        if ((c[a + 8 >> 2] | 0) == 0 ? ((yield* wd(a)) | 0) != 0 : 0)
            b = -1;
        else if (((yield* Ka[c[a + 32 >> 2] & 7](a, b, 1)) | 0) == 1)
            b = d[b >> 0] | 0;
        else
            b = -1;
        i = e;
        return b | 0;
    }
    function* wd(b) {
        b = b | 0;
        var d = 0, e = 0;
        d = b + 74 | 0;
        e = a[d >> 0] | 0;
        a[d >> 0] = e + 255 | e;
        d = b + 20 | 0;
        e = b + 44 | 0;
        if ((c[d >> 2] | 0) >>> 0 > (c[e >> 2] | 0) >>> 0)
            (yield* Ka[c[b + 36 >> 2] & 7](b, 0, 0)) | 0;
        c[b + 16 >> 2] = 0;
        c[b + 28 >> 2] = 0;
        c[d >> 2] = 0;
        d = c[b >> 2] | 0;
        if (d & 20)
            if (!(d & 4))
                d = -1;
            else {
                c[b >> 2] = d | 32;
                d = -1;
            }
        else {
            d = c[e >> 2] | 0;
            c[b + 8 >> 2] = d;
            c[b + 4 >> 2] = d;
            d = 0;
        }
        return d | 0;
    }
    function* xd(a) {
        a = a | 0;
        var b = 0, d = 0, e = 0;
        e = (c[a >> 2] & 1 | 0) != 0;
        if (!e) {
            ya(21596);
            d = c[a + 52 >> 2] | 0;
            b = a + 56 | 0;
            if (d | 0)
                c[d + 56 >> 2] = c[b >> 2];
            b = c[b >> 2] | 0;
            if (b | 0)
                c[b + 52 >> 2] = d;
            if ((c[5398] | 0) == (a | 0))
                c[5398] = b;
            va(21596);
        }
        b = (yield* yd(a)) | 0;
        b = Ja[c[a + 12 >> 2] & 1](a) | 0 | b;
        d = c[a + 92 >> 2] | 0;
        if (d | 0)
            se(d);
        if (!e)
            se(a);
        return b | 0;
    }
    function* yd(a) {
        a = a | 0;
        var b = 0, d = 0;
        do
            if (a) {
                if ((c[a + 76 >> 2] | 0) <= -1) {
                    b = (yield* zd(a)) | 0;
                    break;
                }
                d = (ud(a) | 0) == 0;
                b = (yield* zd(a)) | 0;
                if (!d)
                    ld(a);
            } else {
                if (!(c[478] | 0))
                    b = 0;
                else
                    b = (yield* yd(c[478] | 0)) | 0;
                ya(21596);
                a = c[5398] | 0;
                if (a)
                    do {
                        if ((c[a + 76 >> 2] | 0) > -1)
                            d = ud(a) | 0;
                        else
                            d = 0;
                        if ((c[a + 20 >> 2] | 0) >>> 0 > (c[a + 28 >> 2] | 0) >>> 0)
                            b = (yield* zd(a)) | 0 | b;
                        if (d | 0)
                            ld(a);
                        a = c[a + 56 >> 2] | 0;
                    } while ((a | 0) != 0);
                va(21596);
            }
        while (0);
        return b | 0;
    }
    function* zd(a) {
        a = a | 0;
        var b = 0, d = 0, e = 0, f = 0, g = 0, h = 0;
        b = a + 20 | 0;
        g = a + 28 | 0;
        if ((c[b >> 2] | 0) >>> 0 > (c[g >> 2] | 0) >>> 0 ? ((yield* Ka[c[a + 36 >> 2] & 7](a, 0, 0)) | 0, (c[b >> 2] | 0) == 0) : 0)
            b = -1;
        else {
            h = a + 4 | 0;
            d = c[h >> 2] | 0;
            e = a + 8 | 0;
            f = c[e >> 2] | 0;
            if (d >>> 0 < f >>> 0)
                (yield* Ka[c[a + 40 >> 2] & 7](a, d - f | 0, 1)) | 0;
            c[a + 16 >> 2] = 0;
            c[g >> 2] = 0;
            c[b >> 2] = 0;
            c[e >> 2] = 0;
            c[h >> 2] = 0;
            b = 0;
        }
        return b | 0;
    }
    function Ad(a, b, d) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0, g = 0, h = 0;
        e = i;
        i = i + 32 | 0;
        f = e;
        g = e + 16 | 0;
        c[g >> 2] = d;
        h = (c[g >> 2] | 0) + (4 - 1) & ~(4 - 1);
        d = c[h >> 2] | 0;
        c[g >> 2] = h + 4;
        c[f >> 2] = a;
        c[f + 4 >> 2] = b;
        c[f + 8 >> 2] = d;
        d = gd(ua(54, f | 0) | 0) | 0;
        i = e;
        return d | 0;
    }
    function* Bd(b, d, e, f) {
        b = b | 0;
        d = d | 0;
        e = e | 0;
        f = f | 0;
        var g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0;
        n = i;
        i = i + 128 | 0;
        g = n + 112 | 0;
        m = n;
        h = m;
        j = 2148;
        k = h + 112 | 0;
        do {
            c[h >> 2] = c[j >> 2];
            h = h + 4 | 0;
            j = j + 4 | 0;
        } while ((h | 0) < (k | 0));
        if ((d + -1 | 0) >>> 0 > 2147483646)
            if (!d) {
                d = 1;
                l = 4;
            } else {
                c[(hd() | 0) >> 2] = 75;
                d = -1;
            }
        else {
            g = b;
            l = 4;
        }
        if ((l | 0) == 4) {
            l = -2 - g | 0;
            l = d >>> 0 > l >>> 0 ? l : d;
            c[m + 48 >> 2] = l;
            b = m + 20 | 0;
            c[b >> 2] = g;
            c[m + 44 >> 2] = g;
            d = g + l | 0;
            g = m + 16 | 0;
            c[g >> 2] = d;
            c[m + 28 >> 2] = d;
            d = (yield* Dd(m, e, f)) | 0;
            if (l) {
                e = c[b >> 2] | 0;
                a[e + (((e | 0) == (c[g >> 2] | 0)) << 31 >> 31) >> 0] = 0;
            }
        }
        i = n;
        return d | 0;
    }
    function* Cd(a, b, d) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0;
        e = a + 20 | 0;
        f = c[e >> 2] | 0;
        a = (c[a + 16 >> 2] | 0) - f | 0;
        a = a >>> 0 > d >>> 0 ? d : a;
        Ce(f | 0, b | 0, a | 0) | 0;
        c[e >> 2] = (c[e >> 2] | 0) + a;
        return d | 0;
    }
    function* Dd(b, d, e) {
        b = b | 0;
        d = d | 0;
        e = e | 0;
        var f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0;
        s = i;
        i = i + 224 | 0;
        o = s + 120 | 0;
        r = s + 80 | 0;
        q = s;
        p = s + 136 | 0;
        f = r;
        g = f + 40 | 0;
        do {
            c[f >> 2] = 0;
            f = f + 4 | 0;
        } while ((f | 0) < (g | 0));
        c[o >> 2] = c[e >> 2];
        if (((yield* Ed(0, d, o, q, r)) | 0) < 0)
            e = -1;
        else {
            if ((c[b + 76 >> 2] | 0) > -1)
                m = ud(b) | 0;
            else
                m = 0;
            e = c[b >> 2] | 0;
            n = e & 32;
            if ((a[b + 74 >> 0] | 0) < 1)
                c[b >> 2] = e & -33;
            e = b + 48 | 0;
            if (!(c[e >> 2] | 0)) {
                g = b + 44 | 0;
                h = c[g >> 2] | 0;
                c[g >> 2] = p;
                j = b + 28 | 0;
                c[j >> 2] = p;
                k = b + 20 | 0;
                c[k >> 2] = p;
                c[e >> 2] = 80;
                l = b + 16 | 0;
                c[l >> 2] = p + 80;
                f = (yield* Ed(b, d, o, q, r)) | 0;
                if (h) {
                    (yield* Ka[c[b + 36 >> 2] & 7](b, 0, 0)) | 0;
                    f = (c[k >> 2] | 0) == 0 ? -1 : f;
                    c[g >> 2] = h;
                    c[e >> 2] = 0;
                    c[l >> 2] = 0;
                    c[j >> 2] = 0;
                    c[k >> 2] = 0;
                }
            } else
                f = (yield* Ed(b, d, o, q, r)) | 0;
            e = c[b >> 2] | 0;
            c[b >> 2] = e | n;
            if (m | 0)
                ld(b);
            e = (e & 32 | 0) == 0 ? f : -1;
        }
        i = s;
        return e | 0;
    }
    function* Ed(e, f, g, j, l) {
        e = e | 0;
        f = f | 0;
        g = g | 0;
        j = j | 0;
        l = l | 0;
        var m = 0, n = 0, o = 0, p = 0, q = 0.0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0.0, y = 0, z = 0, A = 0, B = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, U = 0, V = 0, W = 0, X = 0, Y = 0, Z = 0, $ = 0, aa = 0, ba = 0, ca = 0, da = 0, ea = 0, fa = 0, ga = 0, ha = 0, ia = 0;
        ia = i;
        i = i + 624 | 0;
        da = ia + 24 | 0;
        fa = ia + 16 | 0;
        ea = ia + 588 | 0;
        aa = ia + 576 | 0;
        ca = ia;
        W = ia + 536 | 0;
        ha = ia + 8 | 0;
        ga = ia + 528 | 0;
        M = (e | 0) != 0;
        N = W + 40 | 0;
        V = N;
        W = W + 39 | 0;
        X = ha + 4 | 0;
        Y = ea;
        Z = 0 - Y | 0;
        $ = aa + 12 | 0;
        aa = aa + 11 | 0;
        ba = $;
        O = ba - Y | 0;
        P = -2 - Y | 0;
        Q = ba + 2 | 0;
        R = da + 288 | 0;
        S = ea + 9 | 0;
        T = S;
        U = ea + 8 | 0;
        m = 0;
        o = 0;
        n = 0;
        y = f;
        a:
            while (1) {
                do
                    if ((m | 0) > -1)
                        if ((o | 0) > (2147483647 - m | 0)) {
                            c[(hd() | 0) >> 2] = 75;
                            m = -1;
                            break;
                        } else {
                            m = o + m | 0;
                            break;
                        }
                while (0);
                f = a[y >> 0] | 0;
                if (!(f << 24 >> 24)) {
                    L = 244;
                    break;
                } else
                    o = y;
                b:
                    while (1) {
                        switch (f << 24 >> 24) {
                        case 37: {
                                f = o;
                                L = 9;
                                break b;
                            }
                        case 0: {
                                f = o;
                                break b;
                            }
                        default: {
                            }
                        }
                        K = o + 1 | 0;
                        f = a[K >> 0] | 0;
                        o = K;
                    }
                c:
                    do
                        if ((L | 0) == 9)
                            while (1) {
                                L = 0;
                                if ((a[f + 1 >> 0] | 0) != 37)
                                    break c;
                                o = o + 1 | 0;
                                f = f + 2 | 0;
                                if ((a[f >> 0] | 0) == 37)
                                    L = 9;
                                else
                                    break;
                            }
                    while (0);
                w = o - y | 0;
                if (M ? (c[e >> 2] & 32 | 0) == 0 : 0)
                    (yield* Fd(y, w, e)) | 0;
                if ((o | 0) != (y | 0)) {
                    o = w;
                    y = f;
                    continue;
                }
                r = f + 1 | 0;
                o = a[r >> 0] | 0;
                p = (o << 24 >> 24) + -48 | 0;
                if (p >>> 0 < 10) {
                    K = (a[f + 2 >> 0] | 0) == 36;
                    r = K ? f + 3 | 0 : r;
                    o = a[r >> 0] | 0;
                    u = K ? p : -1;
                    n = K ? 1 : n;
                } else
                    u = -1;
                f = o << 24 >> 24;
                d:
                    do
                        if ((f & -32 | 0) == 32) {
                            p = 0;
                            while (1) {
                                if (!(1 << f + -32 & 75913)) {
                                    s = p;
                                    break d;
                                }
                                p = 1 << (o << 24 >> 24) + -32 | p;
                                r = r + 1 | 0;
                                o = a[r >> 0] | 0;
                                f = o << 24 >> 24;
                                if ((f & -32 | 0) != 32) {
                                    s = p;
                                    break;
                                }
                            }
                        } else
                            s = 0;
                    while (0);
                do
                    if (o << 24 >> 24 == 42) {
                        o = r + 1 | 0;
                        f = (a[o >> 0] | 0) + -48 | 0;
                        if (f >>> 0 < 10 ? (a[r + 2 >> 0] | 0) == 36 : 0) {
                            c[l + (f << 2) >> 2] = 10;
                            n = 1;
                            r = r + 3 | 0;
                            f = c[j + ((a[o >> 0] | 0) + -48 << 3) >> 2] | 0;
                        } else {
                            if (n | 0) {
                                m = -1;
                                break a;
                            }
                            if (!M) {
                                v = s;
                                n = 0;
                                r = o;
                                K = 0;
                                break;
                            }
                            n = (c[g >> 2] | 0) + (4 - 1) & ~(4 - 1);
                            f = c[n >> 2] | 0;
                            c[g >> 2] = n + 4;
                            n = 0;
                            r = o;
                        }
                        if ((f | 0) < 0) {
                            v = s | 8192;
                            K = 0 - f | 0;
                        } else {
                            v = s;
                            K = f;
                        }
                    } else {
                        p = (o << 24 >> 24) + -48 | 0;
                        if (p >>> 0 < 10) {
                            f = r;
                            o = 0;
                            do {
                                o = (o * 10 | 0) + p | 0;
                                f = f + 1 | 0;
                                p = (a[f >> 0] | 0) + -48 | 0;
                            } while (p >>> 0 < 10);
                            if ((o | 0) < 0) {
                                m = -1;
                                break a;
                            } else {
                                v = s;
                                r = f;
                                K = o;
                            }
                        } else {
                            v = s;
                            K = 0;
                        }
                    }
                while (0);
                e:
                    do
                        if ((a[r >> 0] | 0) == 46) {
                            f = r + 1 | 0;
                            o = a[f >> 0] | 0;
                            if (o << 24 >> 24 != 42) {
                                p = (o << 24 >> 24) + -48 | 0;
                                if (p >>> 0 < 10)
                                    o = 0;
                                else {
                                    s = 0;
                                    break;
                                }
                                while (1) {
                                    o = (o * 10 | 0) + p | 0;
                                    f = f + 1 | 0;
                                    p = (a[f >> 0] | 0) + -48 | 0;
                                    if (p >>> 0 >= 10) {
                                        s = o;
                                        break e;
                                    }
                                }
                            }
                            f = r + 2 | 0;
                            o = (a[f >> 0] | 0) + -48 | 0;
                            if (o >>> 0 < 10 ? (a[r + 3 >> 0] | 0) == 36 : 0) {
                                c[l + (o << 2) >> 2] = 10;
                                s = c[j + ((a[f >> 0] | 0) + -48 << 3) >> 2] | 0;
                                f = r + 4 | 0;
                                break;
                            }
                            if (n | 0) {
                                m = -1;
                                break a;
                            }
                            if (M) {
                                J = (c[g >> 2] | 0) + (4 - 1) & ~(4 - 1);
                                s = c[J >> 2] | 0;
                                c[g >> 2] = J + 4;
                            } else
                                s = 0;
                        } else {
                            s = -1;
                            f = r;
                        }
                    while (0);
                t = 0;
                while (1) {
                    o = (a[f >> 0] | 0) + -65 | 0;
                    if (o >>> 0 > 57) {
                        m = -1;
                        break a;
                    }
                    p = f + 1 | 0;
                    o = a[18815 + (t * 58 | 0) + o >> 0] | 0;
                    r = o & 255;
                    if ((r + -1 | 0) >>> 0 < 8) {
                        f = p;
                        t = r;
                    } else {
                        J = p;
                        break;
                    }
                }
                if (!(o << 24 >> 24)) {
                    m = -1;
                    break;
                }
                p = (u | 0) > -1;
                do
                    if (o << 24 >> 24 == 19)
                        if (p) {
                            m = -1;
                            break a;
                        } else
                            L = 52;
                    else {
                        if (p) {
                            c[l + (u << 2) >> 2] = r;
                            H = j + (u << 3) | 0;
                            I = c[H + 4 >> 2] | 0;
                            L = ca;
                            c[L >> 2] = c[H >> 2];
                            c[L + 4 >> 2] = I;
                            L = 52;
                            break;
                        }
                        if (!M) {
                            m = 0;
                            break a;
                        }
                        Hd(ca, r, g);
                    }
                while (0);
                if ((L | 0) == 52 ? (L = 0, !M) : 0) {
                    o = w;
                    y = J;
                    continue;
                }
                u = a[f >> 0] | 0;
                u = (t | 0) != 0 & (u & 15 | 0) == 3 ? u & -33 : u;
                p = v & -65537;
                I = (v & 8192 | 0) == 0 ? v : p;
                f:
                    do
                        switch (u | 0) {
                        case 110:
                            switch (t | 0) {
                            case 0: {
                                    c[c[ca >> 2] >> 2] = m;
                                    o = w;
                                    y = J;
                                    continue a;
                                }
                            case 1: {
                                    c[c[ca >> 2] >> 2] = m;
                                    o = w;
                                    y = J;
                                    continue a;
                                }
                            case 2: {
                                    o = c[ca >> 2] | 0;
                                    c[o >> 2] = m;
                                    c[o + 4 >> 2] = ((m | 0) < 0) << 31 >> 31;
                                    o = w;
                                    y = J;
                                    continue a;
                                }
                            case 3: {
                                    b[c[ca >> 2] >> 1] = m;
                                    o = w;
                                    y = J;
                                    continue a;
                                }
                            case 4: {
                                    a[c[ca >> 2] >> 0] = m;
                                    o = w;
                                    y = J;
                                    continue a;
                                }
                            case 6: {
                                    c[c[ca >> 2] >> 2] = m;
                                    o = w;
                                    y = J;
                                    continue a;
                                }
                            case 7: {
                                    o = c[ca >> 2] | 0;
                                    c[o >> 2] = m;
                                    c[o + 4 >> 2] = ((m | 0) < 0) << 31 >> 31;
                                    o = w;
                                    y = J;
                                    continue a;
                                }
                            default: {
                                    o = w;
                                    y = J;
                                    continue a;
                                }
                            }
                        case 112: {
                                t = I | 8;
                                s = s >>> 0 > 8 ? s : 8;
                                u = 120;
                                L = 64;
                                break;
                            }
                        case 88:
                        case 120: {
                                t = I;
                                L = 64;
                                break;
                            }
                        case 111: {
                                p = ca;
                                o = c[p >> 2] | 0;
                                p = c[p + 4 >> 2] | 0;
                                if ((o | 0) == 0 & (p | 0) == 0)
                                    f = N;
                                else {
                                    f = N;
                                    do {
                                        f = f + -1 | 0;
                                        a[f >> 0] = o & 7 | 48;
                                        o = ze(o | 0, p | 0, 3) | 0;
                                        p = C;
                                    } while (!((o | 0) == 0 & (p | 0) == 0));
                                }
                                if (!(I & 8)) {
                                    o = I;
                                    t = 0;
                                    r = 19295;
                                    L = 77;
                                } else {
                                    t = V - f | 0;
                                    o = I;
                                    s = (s | 0) > (t | 0) ? s : t + 1 | 0;
                                    t = 0;
                                    r = 19295;
                                    L = 77;
                                }
                                break;
                            }
                        case 105:
                        case 100: {
                                o = ca;
                                f = c[o >> 2] | 0;
                                o = c[o + 4 >> 2] | 0;
                                if ((o | 0) < 0) {
                                    f = xe(0, 0, f | 0, o | 0) | 0;
                                    o = C;
                                    p = ca;
                                    c[p >> 2] = f;
                                    c[p + 4 >> 2] = o;
                                    p = 1;
                                    r = 19295;
                                    L = 76;
                                    break f;
                                }
                                if (!(I & 2048)) {
                                    r = I & 1;
                                    p = r;
                                    r = (r | 0) == 0 ? 19295 : 19297;
                                    L = 76;
                                } else {
                                    p = 1;
                                    r = 19296;
                                    L = 76;
                                }
                                break;
                            }
                        case 117: {
                                o = ca;
                                f = c[o >> 2] | 0;
                                o = c[o + 4 >> 2] | 0;
                                p = 0;
                                r = 19295;
                                L = 76;
                                break;
                            }
                        case 99: {
                                a[W >> 0] = c[ca >> 2];
                                f = W;
                                u = 1;
                                w = 0;
                                v = 19295;
                                o = N;
                                break;
                            }
                        case 109: {
                                o = Jd(c[(hd() | 0) >> 2] | 0) | 0;
                                L = 82;
                                break;
                            }
                        case 115: {
                                o = c[ca >> 2] | 0;
                                o = o | 0 ? o : 21197;
                                L = 82;
                                break;
                            }
                        case 67: {
                                c[ha >> 2] = c[ca >> 2];
                                c[X >> 2] = 0;
                                c[ca >> 2] = ha;
                                f = ha;
                                s = -1;
                                L = 86;
                                break;
                            }
                        case 83: {
                                f = c[ca >> 2] | 0;
                                if (!s) {
                                    yield* Kd(e, 32, K, 0, I);
                                    f = 0;
                                    L = 97;
                                } else
                                    L = 86;
                                break;
                            }
                        case 65:
                        case 71:
                        case 70:
                        case 69:
                        case 97:
                        case 103:
                        case 102:
                        case 101: {
                                q = +h[ca >> 3];
                                c[fa >> 2] = 0;
                                h[k >> 3] = q;
                                if ((c[k + 4 >> 2] | 0) >= 0)
                                    if (!(I & 2048)) {
                                        H = I & 1;
                                        G = H;
                                        H = (H | 0) == 0 ? 21205 : 21210;
                                    } else {
                                        G = 1;
                                        H = 21207;
                                    }
                                else {
                                    q = -q;
                                    G = 1;
                                    H = 21204;
                                }
                                h[k >> 3] = q;
                                F = c[k + 4 >> 2] & 2146435072;
                                do
                                    if (F >>> 0 < 2146435072 | (F | 0) == 2146435072 & 0 < 0) {
                                        x = +Nd(q, fa) * 2.0;
                                        o = x != 0.0;
                                        if (o)
                                            c[fa >> 2] = (c[fa >> 2] | 0) + -1;
                                        D = u | 32;
                                        if ((D | 0) == 97) {
                                            v = u & 32;
                                            y = (v | 0) == 0 ? H : H + 9 | 0;
                                            w = G | 2;
                                            f = 12 - s | 0;
                                            do
                                                if (!(s >>> 0 > 11 | (f | 0) == 0)) {
                                                    q = 8.0;
                                                    do {
                                                        f = f + -1 | 0;
                                                        q = q * 16.0;
                                                    } while ((f | 0) != 0);
                                                    if ((a[y >> 0] | 0) == 45) {
                                                        q = -(q + (-x - q));
                                                        break;
                                                    } else {
                                                        q = x + q - q;
                                                        break;
                                                    }
                                                } else
                                                    q = x;
                                            while (0);
                                            o = c[fa >> 2] | 0;
                                            f = (o | 0) < 0 ? 0 - o | 0 : o;
                                            f = Id(f, ((f | 0) < 0) << 31 >> 31, $) | 0;
                                            if ((f | 0) == ($ | 0)) {
                                                a[aa >> 0] = 48;
                                                f = aa;
                                            }
                                            a[f + -1 >> 0] = (o >> 31 & 2) + 43;
                                            t = f + -2 | 0;
                                            a[t >> 0] = u + 15;
                                            r = (s | 0) < 1;
                                            p = (I & 8 | 0) == 0;
                                            o = ea;
                                            while (1) {
                                                H = ~~q;
                                                f = o + 1 | 0;
                                                a[o >> 0] = d[19279 + H >> 0] | v;
                                                q = (q - +(H | 0)) * 16.0;
                                                do
                                                    if ((f - Y | 0) == 1) {
                                                        if (p & (r & q == 0.0))
                                                            break;
                                                        a[f >> 0] = 46;
                                                        f = o + 2 | 0;
                                                    }
                                                while (0);
                                                if (!(q != 0.0))
                                                    break;
                                                else
                                                    o = f;
                                            }
                                            p = t;
                                            s = (s | 0) != 0 & (P + f | 0) < (s | 0) ? Q + s - p | 0 : O - p + f | 0;
                                            r = s + w | 0;
                                            yield* Kd(e, 32, K, r, I);
                                            if (!(c[e >> 2] & 32))
                                                (yield* Fd(y, w, e)) | 0;
                                            yield* Kd(e, 48, K, r, I ^ 65536);
                                            o = f - Y | 0;
                                            if (!(c[e >> 2] & 32))
                                                (yield* Fd(ea, o, e)) | 0;
                                            f = ba - p | 0;
                                            yield* Kd(e, 48, s - (o + f) | 0, 0, 0);
                                            if (!(c[e >> 2] & 32))
                                                (yield* Fd(t, f, e)) | 0;
                                            yield* Kd(e, 32, K, r, I ^ 8192);
                                            f = (r | 0) < (K | 0) ? K : r;
                                            break;
                                        }
                                        f = (s | 0) < 0 ? 6 : s;
                                        if (o) {
                                            o = (c[fa >> 2] | 0) + -28 | 0;
                                            c[fa >> 2] = o;
                                            q = x * 268435456.0;
                                        } else {
                                            q = x;
                                            o = c[fa >> 2] | 0;
                                        }
                                        F = (o | 0) < 0 ? da : R;
                                        E = F;
                                        o = F;
                                        do {
                                            B = ~~q >>> 0;
                                            c[o >> 2] = B;
                                            o = o + 4 | 0;
                                            q = (q - +(B >>> 0)) * 1.0e9;
                                        } while (q != 0.0);
                                        p = o;
                                        o = c[fa >> 2] | 0;
                                        if ((o | 0) > 0) {
                                            s = F;
                                            while (1) {
                                                t = (o | 0) > 29 ? 29 : o;
                                                r = p + -4 | 0;
                                                do
                                                    if (r >>> 0 < s >>> 0)
                                                        r = s;
                                                    else {
                                                        o = 0;
                                                        do {
                                                            B = Ae(c[r >> 2] | 0, 0, t | 0) | 0;
                                                            B = Be(B | 0, C | 0, o | 0, 0) | 0;
                                                            o = C;
                                                            A = Ke(B | 0, o | 0, 1e9, 0) | 0;
                                                            c[r >> 2] = A;
                                                            o = Je(B | 0, o | 0, 1e9, 0) | 0;
                                                            r = r + -4 | 0;
                                                        } while (r >>> 0 >= s >>> 0);
                                                        if (!o) {
                                                            r = s;
                                                            break;
                                                        }
                                                        r = s + -4 | 0;
                                                        c[r >> 2] = o;
                                                    }
                                                while (0);
                                                while (1) {
                                                    if (p >>> 0 <= r >>> 0)
                                                        break;
                                                    o = p + -4 | 0;
                                                    if (!(c[o >> 2] | 0))
                                                        p = o;
                                                    else
                                                        break;
                                                }
                                                o = (c[fa >> 2] | 0) - t | 0;
                                                c[fa >> 2] = o;
                                                if ((o | 0) > 0)
                                                    s = r;
                                                else
                                                    break;
                                            }
                                        } else
                                            r = F;
                                        if ((o | 0) < 0) {
                                            y = ((f + 25 | 0) / 9 | 0) + 1 | 0;
                                            z = (D | 0) == 102;
                                            v = r;
                                            while (1) {
                                                w = 0 - o | 0;
                                                w = (w | 0) > 9 ? 9 : w;
                                                do
                                                    if (v >>> 0 < p >>> 0) {
                                                        o = (1 << w) + -1 | 0;
                                                        s = 1e9 >>> w;
                                                        r = 0;
                                                        t = v;
                                                        do {
                                                            B = c[t >> 2] | 0;
                                                            c[t >> 2] = (B >>> w) + r;
                                                            r = _(B & o, s) | 0;
                                                            t = t + 4 | 0;
                                                        } while (t >>> 0 < p >>> 0);
                                                        o = (c[v >> 2] | 0) == 0 ? v + 4 | 0 : v;
                                                        if (!r) {
                                                            r = o;
                                                            break;
                                                        }
                                                        c[p >> 2] = r;
                                                        r = o;
                                                        p = p + 4 | 0;
                                                    } else
                                                        r = (c[v >> 2] | 0) == 0 ? v + 4 | 0 : v;
                                                while (0);
                                                o = z ? F : r;
                                                p = (p - o >> 2 | 0) > (y | 0) ? o + (y << 2) | 0 : p;
                                                o = (c[fa >> 2] | 0) + w | 0;
                                                c[fa >> 2] = o;
                                                if ((o | 0) >= 0) {
                                                    z = r;
                                                    break;
                                                } else
                                                    v = r;
                                            }
                                        } else
                                            z = r;
                                        do
                                            if (z >>> 0 < p >>> 0) {
                                                o = (E - z >> 2) * 9 | 0;
                                                s = c[z >> 2] | 0;
                                                if (s >>> 0 < 10)
                                                    break;
                                                else
                                                    r = 10;
                                                do {
                                                    r = r * 10 | 0;
                                                    o = o + 1 | 0;
                                                } while (s >>> 0 >= r >>> 0);
                                            } else
                                                o = 0;
                                        while (0);
                                        A = (D | 0) == 103;
                                        B = (f | 0) != 0;
                                        r = f - ((D | 0) != 102 ? o : 0) + ((B & A) << 31 >> 31) | 0;
                                        if ((r | 0) < (((p - E >> 2) * 9 | 0) + -9 | 0)) {
                                            t = r + 9216 | 0;
                                            r = F + 4 + (((t | 0) / 9 | 0) + -1024 << 2) | 0;
                                            t = ((t | 0) % 9 | 0) + 1 | 0;
                                            if ((t | 0) < 9) {
                                                s = 10;
                                                do {
                                                    s = s * 10 | 0;
                                                    t = t + 1 | 0;
                                                } while ((t | 0) != 9);
                                            } else
                                                s = 10;
                                            w = c[r >> 2] | 0;
                                            y = (w >>> 0) % (s >>> 0) | 0;
                                            t = (r + 4 | 0) == (p | 0);
                                            do
                                                if (t & (y | 0) == 0)
                                                    s = z;
                                                else {
                                                    x = (((w >>> 0) / (s >>> 0) | 0) & 1 | 0) == 0 ? 9007199254740992.0 : 9007199254740994.0;
                                                    v = (s | 0) / 2 | 0;
                                                    if (y >>> 0 < v >>> 0)
                                                        q = .5;
                                                    else
                                                        q = t & (y | 0) == (v | 0) ? 1.0 : 1.5;
                                                    do
                                                        if (G) {
                                                            if ((a[H >> 0] | 0) != 45)
                                                                break;
                                                            x = -x;
                                                            q = -q;
                                                        }
                                                    while (0);
                                                    t = w - y | 0;
                                                    c[r >> 2] = t;
                                                    if (!(x + q != x)) {
                                                        s = z;
                                                        break;
                                                    }
                                                    D = t + s | 0;
                                                    c[r >> 2] = D;
                                                    if (D >>> 0 > 999999999) {
                                                        o = z;
                                                        while (1) {
                                                            s = r + -4 | 0;
                                                            c[r >> 2] = 0;
                                                            if (s >>> 0 < o >>> 0) {
                                                                o = o + -4 | 0;
                                                                c[o >> 2] = 0;
                                                            }
                                                            D = (c[s >> 2] | 0) + 1 | 0;
                                                            c[s >> 2] = D;
                                                            if (D >>> 0 > 999999999)
                                                                r = s;
                                                            else {
                                                                v = o;
                                                                r = s;
                                                                break;
                                                            }
                                                        }
                                                    } else
                                                        v = z;
                                                    o = (E - v >> 2) * 9 | 0;
                                                    t = c[v >> 2] | 0;
                                                    if (t >>> 0 < 10) {
                                                        s = v;
                                                        break;
                                                    } else
                                                        s = 10;
                                                    do {
                                                        s = s * 10 | 0;
                                                        o = o + 1 | 0;
                                                    } while (t >>> 0 >= s >>> 0);
                                                    s = v;
                                                }
                                            while (0);
                                            D = r + 4 | 0;
                                            z = s;
                                            p = p >>> 0 > D >>> 0 ? D : p;
                                        }
                                        w = 0 - o | 0;
                                        while (1) {
                                            if (p >>> 0 <= z >>> 0) {
                                                y = 0;
                                                D = p;
                                                break;
                                            }
                                            r = p + -4 | 0;
                                            if (!(c[r >> 2] | 0))
                                                p = r;
                                            else {
                                                y = 1;
                                                D = p;
                                                break;
                                            }
                                        }
                                        do
                                            if (A) {
                                                f = (B & 1 ^ 1) + f | 0;
                                                if ((f | 0) > (o | 0) & (o | 0) > -5) {
                                                    u = u + -1 | 0;
                                                    f = f + -1 - o | 0;
                                                } else {
                                                    u = u + -2 | 0;
                                                    f = f + -1 | 0;
                                                }
                                                p = I & 8;
                                                if (p | 0)
                                                    break;
                                                do
                                                    if (y) {
                                                        p = c[D + -4 >> 2] | 0;
                                                        if (!p) {
                                                            r = 9;
                                                            break;
                                                        }
                                                        if (!((p >>> 0) % 10 | 0)) {
                                                            s = 10;
                                                            r = 0;
                                                        } else {
                                                            r = 0;
                                                            break;
                                                        }
                                                        do {
                                                            s = s * 10 | 0;
                                                            r = r + 1 | 0;
                                                        } while (!((p >>> 0) % (s >>> 0) | 0 | 0));
                                                    } else
                                                        r = 9;
                                                while (0);
                                                p = ((D - E >> 2) * 9 | 0) + -9 | 0;
                                                if ((u | 32 | 0) == 102) {
                                                    p = p - r | 0;
                                                    p = (p | 0) < 0 ? 0 : p;
                                                    f = (f | 0) < (p | 0) ? f : p;
                                                    p = 0;
                                                    break;
                                                } else {
                                                    p = p + o - r | 0;
                                                    p = (p | 0) < 0 ? 0 : p;
                                                    f = (f | 0) < (p | 0) ? f : p;
                                                    p = 0;
                                                    break;
                                                }
                                            } else
                                                p = I & 8;
                                        while (0);
                                        v = f | p;
                                        s = (v | 0) != 0 & 1;
                                        t = (u | 32 | 0) == 102;
                                        if (t) {
                                            o = (o | 0) > 0 ? o : 0;
                                            u = 0;
                                        } else {
                                            r = (o | 0) < 0 ? w : o;
                                            r = Id(r, ((r | 0) < 0) << 31 >> 31, $) | 0;
                                            if ((ba - r | 0) < 2)
                                                do {
                                                    r = r + -1 | 0;
                                                    a[r >> 0] = 48;
                                                } while ((ba - r | 0) < 2);
                                            a[r + -1 >> 0] = (o >> 31 & 2) + 43;
                                            E = r + -2 | 0;
                                            a[E >> 0] = u;
                                            o = ba - E | 0;
                                            u = E;
                                        }
                                        w = G + 1 + f + s + o | 0;
                                        yield* Kd(e, 32, K, w, I);
                                        if (!(c[e >> 2] & 32))
                                            (yield* Fd(H, G, e)) | 0;
                                        yield* Kd(e, 48, K, w, I ^ 65536);
                                        do
                                            if (t) {
                                                r = z >>> 0 > F >>> 0 ? F : z;
                                                o = r;
                                                do {
                                                    p = Id(c[o >> 2] | 0, 0, S) | 0;
                                                    do
                                                        if ((o | 0) == (r | 0)) {
                                                            if ((p | 0) != (S | 0))
                                                                break;
                                                            a[U >> 0] = 48;
                                                            p = U;
                                                        } else {
                                                            if (p >>> 0 <= ea >>> 0)
                                                                break;
                                                            ye(ea | 0, 48, p - Y | 0) | 0;
                                                            do
                                                                p = p + -1 | 0;
                                                            while (p >>> 0 > ea >>> 0);
                                                        }
                                                    while (0);
                                                    if (!(c[e >> 2] & 32))
                                                        (yield* Fd(p, T - p | 0, e)) | 0;
                                                    o = o + 4 | 0;
                                                } while (o >>> 0 <= F >>> 0);
                                                do
                                                    if (v | 0) {
                                                        if (c[e >> 2] & 32 | 0)
                                                            break;
                                                        (yield* Fd(21239, 1, e)) | 0;
                                                    }
                                                while (0);
                                                if ((f | 0) > 0 & o >>> 0 < D >>> 0) {
                                                    p = o;
                                                    while (1) {
                                                        o = Id(c[p >> 2] | 0, 0, S) | 0;
                                                        if (o >>> 0 > ea >>> 0) {
                                                            ye(ea | 0, 48, o - Y | 0) | 0;
                                                            do
                                                                o = o + -1 | 0;
                                                            while (o >>> 0 > ea >>> 0);
                                                        }
                                                        if (!(c[e >> 2] & 32))
                                                            (yield* Fd(o, (f | 0) > 9 ? 9 : f, e)) | 0;
                                                        p = p + 4 | 0;
                                                        o = f + -9 | 0;
                                                        if (!((f | 0) > 9 & p >>> 0 < D >>> 0)) {
                                                            f = o;
                                                            break;
                                                        } else
                                                            f = o;
                                                    }
                                                }
                                                yield* Kd(e, 48, f + 9 | 0, 9, 0);
                                            } else {
                                                t = y ? D : z + 4 | 0;
                                                if ((f | 0) > -1) {
                                                    s = (p | 0) == 0;
                                                    r = z;
                                                    do {
                                                        o = Id(c[r >> 2] | 0, 0, S) | 0;
                                                        if ((o | 0) == (S | 0)) {
                                                            a[U >> 0] = 48;
                                                            o = U;
                                                        }
                                                        do
                                                            if ((r | 0) == (z | 0)) {
                                                                p = o + 1 | 0;
                                                                if (!(c[e >> 2] & 32))
                                                                    (yield* Fd(o, 1, e)) | 0;
                                                                if (s & (f | 0) < 1) {
                                                                    o = p;
                                                                    break;
                                                                }
                                                                if (c[e >> 2] & 32 | 0) {
                                                                    o = p;
                                                                    break;
                                                                }
                                                                (yield* Fd(21239, 1, e)) | 0;
                                                                o = p;
                                                            } else {
                                                                if (o >>> 0 <= ea >>> 0)
                                                                    break;
                                                                ye(ea | 0, 48, o + Z | 0) | 0;
                                                                do
                                                                    o = o + -1 | 0;
                                                                while (o >>> 0 > ea >>> 0);
                                                            }
                                                        while (0);
                                                        p = T - o | 0;
                                                        if (!(c[e >> 2] & 32))
                                                            (yield* Fd(o, (f | 0) > (p | 0) ? p : f, e)) | 0;
                                                        f = f - p | 0;
                                                        r = r + 4 | 0;
                                                    } while (r >>> 0 < t >>> 0 & (f | 0) > -1);
                                                }
                                                yield* Kd(e, 48, f + 18 | 0, 18, 0);
                                                if (c[e >> 2] & 32 | 0)
                                                    break;
                                                (yield* Fd(u, ba - u | 0, e)) | 0;
                                            }
                                        while (0);
                                        yield* Kd(e, 32, K, w, I ^ 8192);
                                        f = (w | 0) < (K | 0) ? K : w;
                                    } else {
                                        t = (u & 32 | 0) != 0;
                                        s = q != q | 0.0 != 0.0;
                                        o = s ? 0 : G;
                                        r = o + 3 | 0;
                                        yield* Kd(e, 32, K, r, p);
                                        f = c[e >> 2] | 0;
                                        if (!(f & 32)) {
                                            (yield* Fd(H, o, e)) | 0;
                                            f = c[e >> 2] | 0;
                                        }
                                        if (!(f & 32))
                                            (yield* Fd(s ? t ? 21231 : 21235 : t ? 21223 : 21227, 3, e)) | 0;
                                        yield* Kd(e, 32, K, r, I ^ 8192);
                                        f = (r | 0) < (K | 0) ? K : r;
                                    }
                                while (0);
                                o = f;
                                y = J;
                                continue a;
                            }
                        default: {
                                f = y;
                                p = I;
                                u = s;
                                w = 0;
                                v = 19295;
                                o = N;
                            }
                        }
                    while (0);
                g:
                    do
                        if ((L | 0) == 64) {
                            p = ca;
                            o = c[p >> 2] | 0;
                            p = c[p + 4 >> 2] | 0;
                            r = u & 32;
                            if (!((o | 0) == 0 & (p | 0) == 0)) {
                                f = N;
                                do {
                                    f = f + -1 | 0;
                                    a[f >> 0] = d[19279 + (o & 15) >> 0] | r;
                                    o = ze(o | 0, p | 0, 4) | 0;
                                    p = C;
                                } while (!((o | 0) == 0 & (p | 0) == 0));
                                L = ca;
                                if ((t & 8 | 0) == 0 | (c[L >> 2] | 0) == 0 & (c[L + 4 >> 2] | 0) == 0) {
                                    o = t;
                                    t = 0;
                                    r = 19295;
                                    L = 77;
                                } else {
                                    o = t;
                                    t = 2;
                                    r = 19295 + (u >> 4) | 0;
                                    L = 77;
                                }
                            } else {
                                f = N;
                                o = t;
                                t = 0;
                                r = 19295;
                                L = 77;
                            }
                        } else if ((L | 0) == 76) {
                            f = Id(f, o, N) | 0;
                            o = I;
                            t = p;
                            L = 77;
                        } else if ((L | 0) == 82) {
                            L = 0;
                            I = qd(o, 0, s) | 0;
                            H = (I | 0) == 0;
                            f = o;
                            u = H ? s : I - o | 0;
                            w = 0;
                            v = 19295;
                            o = H ? o + s | 0 : I;
                        } else if ((L | 0) == 86) {
                            L = 0;
                            p = 0;
                            o = 0;
                            t = f;
                            while (1) {
                                r = c[t >> 2] | 0;
                                if (!r)
                                    break;
                                o = Ld(ga, r) | 0;
                                if ((o | 0) < 0 | o >>> 0 > (s - p | 0) >>> 0)
                                    break;
                                p = o + p | 0;
                                if (s >>> 0 > p >>> 0)
                                    t = t + 4 | 0;
                                else
                                    break;
                            }
                            if ((o | 0) < 0) {
                                m = -1;
                                break a;
                            }
                            yield* Kd(e, 32, K, p, I);
                            if (!p) {
                                f = 0;
                                L = 97;
                            } else {
                                r = 0;
                                while (1) {
                                    o = c[f >> 2] | 0;
                                    if (!o) {
                                        f = p;
                                        L = 97;
                                        break g;
                                    }
                                    o = Ld(ga, o) | 0;
                                    r = o + r | 0;
                                    if ((r | 0) > (p | 0)) {
                                        f = p;
                                        L = 97;
                                        break g;
                                    }
                                    if (!(c[e >> 2] & 32))
                                        (yield* Fd(ga, o, e)) | 0;
                                    if (r >>> 0 >= p >>> 0) {
                                        f = p;
                                        L = 97;
                                        break;
                                    } else
                                        f = f + 4 | 0;
                                }
                            }
                        }
                    while (0);
                if ((L | 0) == 97) {
                    L = 0;
                    yield* Kd(e, 32, K, f, I ^ 8192);
                    o = (K | 0) > (f | 0) ? K : f;
                    y = J;
                    continue;
                }
                if ((L | 0) == 77) {
                    L = 0;
                    p = (s | 0) > -1 ? o & -65537 : o;
                    o = ca;
                    o = (c[o >> 2] | 0) != 0 | (c[o + 4 >> 2] | 0) != 0;
                    if ((s | 0) != 0 | o) {
                        u = (o & 1 ^ 1) + (V - f) | 0;
                        u = (s | 0) > (u | 0) ? s : u;
                        w = t;
                        v = r;
                        o = N;
                    } else {
                        f = N;
                        u = 0;
                        w = t;
                        v = r;
                        o = N;
                    }
                }
                t = o - f | 0;
                r = (u | 0) < (t | 0) ? t : u;
                s = w + r | 0;
                o = (K | 0) < (s | 0) ? s : K;
                yield* Kd(e, 32, o, s, p);
                if (!(c[e >> 2] & 32))
                    (yield* Fd(v, w, e)) | 0;
                yield* Kd(e, 48, o, s, p ^ 65536);
                yield* Kd(e, 48, r, t, 0);
                if (!(c[e >> 2] & 32))
                    (yield* Fd(f, t, e)) | 0;
                yield* Kd(e, 32, o, s, p ^ 8192);
                y = J;
            }
        h:
            do
                if ((L | 0) == 244)
                    if (!e)
                        if (n) {
                            m = 1;
                            while (1) {
                                n = c[l + (m << 2) >> 2] | 0;
                                if (!n)
                                    break;
                                Hd(j + (m << 3) | 0, n, g);
                                m = m + 1 | 0;
                                if ((m | 0) >= 10) {
                                    m = 1;
                                    break h;
                                }
                            }
                            if ((m | 0) < 10)
                                while (1) {
                                    if (c[l + (m << 2) >> 2] | 0) {
                                        m = -1;
                                        break h;
                                    }
                                    m = m + 1 | 0;
                                    if ((m | 0) >= 10) {
                                        m = 1;
                                        break;
                                    }
                                }
                            else
                                m = 1;
                        } else
                            m = 0;
            while (0);
        i = ia;
        return m | 0;
    }
    function* Fd(b, d, e) {
        b = b | 0;
        d = d | 0;
        e = e | 0;
        var f = 0, g = 0, h = 0, i = 0;
        f = e + 16 | 0;
        g = c[f >> 2] | 0;
        if (!g)
            if (!(Gd(e) | 0)) {
                g = c[f >> 2] | 0;
                h = 5;
            } else
                f = 0;
        else
            h = 5;
        a:
            do
                if ((h | 0) == 5) {
                    i = e + 20 | 0;
                    f = c[i >> 2] | 0;
                    h = f;
                    if ((g - f | 0) >>> 0 < d >>> 0) {
                        f = (yield* Ka[c[e + 36 >> 2] & 7](e, b, d)) | 0;
                        break;
                    }
                    b:
                        do
                            if ((a[e + 75 >> 0] | 0) > -1) {
                                f = d;
                                while (1) {
                                    if (!f) {
                                        g = h;
                                        f = 0;
                                        break b;
                                    }
                                    g = f + -1 | 0;
                                    if ((a[b + g >> 0] | 0) == 10)
                                        break;
                                    else
                                        f = g;
                                }
                                if (((yield* Ka[c[e + 36 >> 2] & 7](e, b, f)) | 0) >>> 0 < f >>> 0)
                                    break a;
                                d = d - f | 0;
                                b = b + f | 0;
                                g = c[i >> 2] | 0;
                            } else {
                                g = h;
                                f = 0;
                            }
                        while (0);
                    Ce(g | 0, b | 0, d | 0) | 0;
                    c[i >> 2] = (c[i >> 2] | 0) + d;
                    f = f + d | 0;
                }
            while (0);
        return f | 0;
    }
    function Gd(b) {
        b = b | 0;
        var d = 0, e = 0;
        d = b + 74 | 0;
        e = a[d >> 0] | 0;
        a[d >> 0] = e + 255 | e;
        d = c[b >> 2] | 0;
        if (!(d & 8)) {
            c[b + 8 >> 2] = 0;
            c[b + 4 >> 2] = 0;
            d = c[b + 44 >> 2] | 0;
            c[b + 28 >> 2] = d;
            c[b + 20 >> 2] = d;
            c[b + 16 >> 2] = d + (c[b + 48 >> 2] | 0);
            d = 0;
        } else {
            c[b >> 2] = d | 32;
            d = -1;
        }
        return d | 0;
    }
    function Hd(a, b, d) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0, g = 0.0;
        a:
            do
                if (b >>> 0 <= 20)
                    do
                        switch (b | 0) {
                        case 9: {
                                e = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);
                                b = c[e >> 2] | 0;
                                c[d >> 2] = e + 4;
                                c[a >> 2] = b;
                                break a;
                            }
                        case 10: {
                                e = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);
                                b = c[e >> 2] | 0;
                                c[d >> 2] = e + 4;
                                e = a;
                                c[e >> 2] = b;
                                c[e + 4 >> 2] = ((b | 0) < 0) << 31 >> 31;
                                break a;
                            }
                        case 11: {
                                e = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);
                                b = c[e >> 2] | 0;
                                c[d >> 2] = e + 4;
                                e = a;
                                c[e >> 2] = b;
                                c[e + 4 >> 2] = 0;
                                break a;
                            }
                        case 12: {
                                e = (c[d >> 2] | 0) + (8 - 1) & ~(8 - 1);
                                b = e;
                                f = c[b >> 2] | 0;
                                b = c[b + 4 >> 2] | 0;
                                c[d >> 2] = e + 8;
                                e = a;
                                c[e >> 2] = f;
                                c[e + 4 >> 2] = b;
                                break a;
                            }
                        case 13: {
                                f = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);
                                e = c[f >> 2] | 0;
                                c[d >> 2] = f + 4;
                                e = (e & 65535) << 16 >> 16;
                                f = a;
                                c[f >> 2] = e;
                                c[f + 4 >> 2] = ((e | 0) < 0) << 31 >> 31;
                                break a;
                            }
                        case 14: {
                                f = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);
                                e = c[f >> 2] | 0;
                                c[d >> 2] = f + 4;
                                f = a;
                                c[f >> 2] = e & 65535;
                                c[f + 4 >> 2] = 0;
                                break a;
                            }
                        case 15: {
                                f = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);
                                e = c[f >> 2] | 0;
                                c[d >> 2] = f + 4;
                                e = (e & 255) << 24 >> 24;
                                f = a;
                                c[f >> 2] = e;
                                c[f + 4 >> 2] = ((e | 0) < 0) << 31 >> 31;
                                break a;
                            }
                        case 16: {
                                f = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);
                                e = c[f >> 2] | 0;
                                c[d >> 2] = f + 4;
                                f = a;
                                c[f >> 2] = e & 255;
                                c[f + 4 >> 2] = 0;
                                break a;
                            }
                        case 17: {
                                f = (c[d >> 2] | 0) + (8 - 1) & ~(8 - 1);
                                g = +h[f >> 3];
                                c[d >> 2] = f + 8;
                                h[a >> 3] = g;
                                break a;
                            }
                        case 18: {
                                f = (c[d >> 2] | 0) + (8 - 1) & ~(8 - 1);
                                g = +h[f >> 3];
                                c[d >> 2] = f + 8;
                                h[a >> 3] = g;
                                break a;
                            }
                        default:
                            break a;
                        }
                    while (0);
            while (0);
        return;
    }
    function Id(b, c, d) {
        b = b | 0;
        c = c | 0;
        d = d | 0;
        var e = 0;
        if (c >>> 0 > 0 | (c | 0) == 0 & b >>> 0 > 4294967295)
            while (1) {
                e = Ke(b | 0, c | 0, 10, 0) | 0;
                d = d + -1 | 0;
                a[d >> 0] = e | 48;
                e = Je(b | 0, c | 0, 10, 0) | 0;
                if (c >>> 0 > 9 | (c | 0) == 9 & b >>> 0 > 4294967295) {
                    b = e;
                    c = C;
                } else {
                    b = e;
                    break;
                }
            }
        if (b)
            while (1) {
                d = d + -1 | 0;
                a[d >> 0] = (b >>> 0) % 10 | 0 | 48;
                if (b >>> 0 < 10)
                    break;
                else
                    b = (b >>> 0) / 10 | 0;
            }
        return d | 0;
    }
    function Jd(b) {
        b = b | 0;
        var c = 0, e = 0;
        c = 0;
        while (1) {
            if ((d[19305 + c >> 0] | 0) == (b | 0)) {
                e = 2;
                break;
            }
            c = c + 1 | 0;
            if ((c | 0) == 87) {
                c = 87;
                b = 19393;
                e = 5;
                break;
            }
        }
        if ((e | 0) == 2)
            if (!c)
                b = 19393;
            else {
                b = 19393;
                e = 5;
            }
        if ((e | 0) == 5)
            while (1) {
                e = b;
                while (1) {
                    b = e + 1 | 0;
                    if (!(a[e >> 0] | 0))
                        break;
                    else
                        e = b;
                }
                c = c + -1 | 0;
                if (!c)
                    break;
                else
                    e = 5;
            }
        return b | 0;
    }
    function* Kd(a, b, d, e, f) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        e = e | 0;
        f = f | 0;
        var g = 0, h = 0, j = 0;
        j = i;
        i = i + 256 | 0;
        h = j;
        do
            if ((d | 0) > (e | 0) & (f & 73728 | 0) == 0) {
                f = d - e | 0;
                ye(h | 0, b | 0, (f >>> 0 > 256 ? 256 : f) | 0) | 0;
                b = c[a >> 2] | 0;
                g = (b & 32 | 0) == 0;
                if (f >>> 0 > 255) {
                    e = d - e | 0;
                    do {
                        if (g) {
                            (yield* Fd(h, 256, a)) | 0;
                            b = c[a >> 2] | 0;
                        }
                        f = f + -256 | 0;
                        g = (b & 32 | 0) == 0;
                    } while (f >>> 0 > 255);
                    if (g)
                        f = e & 255;
                    else
                        break;
                } else if (!g)
                    break;
                (yield* Fd(h, f, a)) | 0;
            }
        while (0);
        i = j;
        return;
    }
    function Ld(a, b) {
        a = a | 0;
        b = b | 0;
        if (!a)
            a = 0;
        else
            a = Md(a, b, 0) | 0;
        return a | 0;
    }
    function Md(b, d, e) {
        b = b | 0;
        d = d | 0;
        e = e | 0;
        do
            if (b) {
                if (d >>> 0 < 128) {
                    a[b >> 0] = d;
                    b = 1;
                    break;
                }
                if (d >>> 0 < 2048) {
                    a[b >> 0] = d >>> 6 | 192;
                    a[b + 1 >> 0] = d & 63 | 128;
                    b = 2;
                    break;
                }
                if (d >>> 0 < 55296 | (d & -8192 | 0) == 57344) {
                    a[b >> 0] = d >>> 12 | 224;
                    a[b + 1 >> 0] = d >>> 6 & 63 | 128;
                    a[b + 2 >> 0] = d & 63 | 128;
                    b = 3;
                    break;
                }
                if ((d + -65536 | 0) >>> 0 < 1048576) {
                    a[b >> 0] = d >>> 18 | 240;
                    a[b + 1 >> 0] = d >>> 12 & 63 | 128;
                    a[b + 2 >> 0] = d >>> 6 & 63 | 128;
                    a[b + 3 >> 0] = d & 63 | 128;
                    b = 4;
                    break;
                } else {
                    c[(hd() | 0) >> 2] = 84;
                    b = -1;
                    break;
                }
            } else
                b = 1;
        while (0);
        return b | 0;
    }
    function Nd(a, b) {
        a = +a;
        b = b | 0;
        return + +Od(a, b);
    }
    function Od(a, b) {
        a = +a;
        b = b | 0;
        var d = 0, e = 0, f = 0;
        h[k >> 3] = a;
        d = c[k >> 2] | 0;
        e = c[k + 4 >> 2] | 0;
        f = ze(d | 0, e | 0, 52) | 0;
        f = f & 2047;
        switch (f | 0) {
        case 0: {
                if (a != 0.0) {
                    a = +Od(a * 18446744073709551616.0, b);
                    d = (c[b >> 2] | 0) + -64 | 0;
                } else
                    d = 0;
                c[b >> 2] = d;
                break;
            }
        case 2047:
            break;
        default: {
                c[b >> 2] = f + -1022;
                c[k >> 2] = d;
                c[k + 4 >> 2] = e & -2146435073 | 1071644672;
                a = +h[k >> 3];
            }
        }
        return +a;
    }
    function Pd(a, b) {
        a = a | 0;
        b = b | 0;
        Qd(a, b) | 0;
        return a | 0;
    }
    function Qd(b, d) {
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0;
        e = d;
        a:
            do
                if (!((e ^ b) & 3)) {
                    if (e & 3)
                        do {
                            e = a[d >> 0] | 0;
                            a[b >> 0] = e;
                            if (!(e << 24 >> 24))
                                break a;
                            d = d + 1 | 0;
                            b = b + 1 | 0;
                        } while ((d & 3 | 0) != 0);
                    e = c[d >> 2] | 0;
                    if (!((e & -2139062144 ^ -2139062144) & e + -16843009)) {
                        f = b;
                        while (1) {
                            d = d + 4 | 0;
                            b = f + 4 | 0;
                            c[f >> 2] = e;
                            e = c[d >> 2] | 0;
                            if ((e & -2139062144 ^ -2139062144) & e + -16843009 | 0)
                                break;
                            else
                                f = b;
                        }
                    }
                    f = 8;
                } else
                    f = 8;
            while (0);
        if ((f | 0) == 8) {
            f = a[d >> 0] | 0;
            a[b >> 0] = f;
            if (f << 24 >> 24)
                do {
                    d = d + 1 | 0;
                    b = b + 1 | 0;
                    f = a[d >> 0] | 0;
                    a[b >> 0] = f;
                } while (f << 24 >> 24 != 0);
        }
        return b | 0;
    }
    function Rd(b, c) {
        b = b | 0;
        c = c | 0;
        var d = 0, e = 0;
        e = a[b >> 0] | 0;
        d = a[c >> 0] | 0;
        if (e << 24 >> 24 == 0 ? 1 : e << 24 >> 24 != d << 24 >> 24)
            c = e;
        else {
            do {
                b = b + 1 | 0;
                c = c + 1 | 0;
                e = a[b >> 0] | 0;
                d = a[c >> 0] | 0;
            } while (!(e << 24 >> 24 == 0 ? 1 : e << 24 >> 24 != d << 24 >> 24));
            c = e;
        }
        return (c & 255) - (d & 255) | 0;
    }
    function Sd(b, d, e) {
        b = b | 0;
        d = d | 0;
        e = e | 0;
        var f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0;
        m = i;
        i = i + 16 | 0;
        l = m + 4 | 0;
        k = m;
        f = c[397] | 0;
        if ((f | 0) == 0 | 0 != 0) {
            c[5390] = 0;
            c[397] = 1;
            f = 1;
        }
        a:
            do
                if (((f | 0) < (b | 0) ? (g = c[d + (f << 2) >> 2] | 0, (g | 0) != 0) : 0) ? (a[g >> 0] | 0) == 45 : 0) {
                    switch (a[g + 1 >> 0] | 0) {
                    case 0: {
                            f = -1;
                            break a;
                        }
                    case 45: {
                            if (!(a[g + 2 >> 0] | 0)) {
                                c[397] = f + 1;
                                f = -1;
                                break a;
                            }
                            break;
                        }
                    default: {
                        }
                    }
                    f = c[5390] | 0;
                    if (!f) {
                        c[5390] = 1;
                        f = 1;
                    }
                    f = Td(l, g + f | 0, 4) | 0;
                    if ((f | 0) < 0) {
                        c[l >> 2] = 65533;
                        j = 1;
                    } else
                        j = f;
                    f = c[397] | 0;
                    n = c[d + (f << 2) >> 2] | 0;
                    g = c[5390] | 0;
                    h = n + g | 0;
                    g = g + j | 0;
                    c[5390] = g;
                    if (!(a[n + g >> 0] | 0)) {
                        c[397] = f + 1;
                        c[5390] = 0;
                    }
                    f = Td(k, e, 4) | 0;
                    b:
                        do
                            if (!f)
                                g = 0;
                            else {
                                g = 0;
                                do {
                                    if ((c[k >> 2] | 0) == (c[l >> 2] | 0))
                                        break b;
                                    g = ((f | 0) < 1 ? 1 : f) + g | 0;
                                    f = Td(k, e + g | 0, 4) | 0;
                                } while ((f | 0) != 0);
                            }
                        while (0);
                    f = c[k >> 2] | 0;
                    if ((f | 0) != (c[l >> 2] | 0)) {
                        if (!((a[e >> 0] | 0) != 58 & 1 != 0)) {
                            f = 63;
                            break;
                        }
                        f = c[d >> 2] | 0;
                        Ud(2, f, pd(f) | 0) | 0;
                        Ud(2, 21241, 18) | 0;
                        Ud(2, h, j) | 0;
                        Ud(2, 21260, 1) | 0;
                        f = 63;
                        break;
                    }
                    if ((a[e + (g + 1) >> 0] | 0) == 58) {
                        g = c[397] | 0;
                        if ((g | 0) < (b | 0)) {
                            c[397] = g + 1;
                            c[5391] = (c[d + (g << 2) >> 2] | 0) + (c[5390] | 0);
                            c[5390] = 0;
                            break;
                        }
                        if ((a[e >> 0] | 0) != 58)
                            if (!1)
                                f = 63;
                            else {
                                f = c[d >> 2] | 0;
                                Ud(2, f, pd(f) | 0) | 0;
                                Ud(2, 21262, 31) | 0;
                                Ud(2, h, j) | 0;
                                Ud(2, 21260, 1) | 0;
                                f = 63;
                            }
                        else
                            f = 58;
                    }
                } else
                    f = -1;
            while (0);
        i = m;
        return f | 0;
    }
    function Td(b, e, f) {
        b = b | 0;
        e = e | 0;
        f = f | 0;
        var g = 0, h = 0, j = 0, k = 0;
        k = i;
        i = i + 16 | 0;
        g = k;
        a:
            do
                if (!e)
                    g = 0;
                else {
                    do
                        if (f | 0) {
                            j = (b | 0) == 0 ? g : b;
                            g = a[e >> 0] | 0;
                            b = g & 255;
                            if (g << 24 >> 24 > -1) {
                                c[j >> 2] = b;
                                g = g << 24 >> 24 != 0 & 1;
                                break a;
                            }
                            g = b + -194 | 0;
                            if (g >>> 0 <= 50) {
                                b = e + 1 | 0;
                                h = c[1592 + (g << 2) >> 2] | 0;
                                if (f >>> 0 < 4 ? h & -2147483648 >>> ((f * 6 | 0) + -6 | 0) | 0 : 0)
                                    break;
                                g = d[b >> 0] | 0;
                                f = g >>> 3;
                                if ((f + -16 | f + (h >> 26)) >>> 0 <= 7) {
                                    g = g + -128 | h << 6;
                                    if ((g | 0) >= 0) {
                                        c[j >> 2] = g;
                                        g = 2;
                                        break a;
                                    }
                                    b = d[e + 2 >> 0] | 0;
                                    if ((b & 192 | 0) == 128) {
                                        b = b + -128 | g << 6;
                                        if ((b | 0) >= 0) {
                                            c[j >> 2] = b;
                                            g = 3;
                                            break a;
                                        }
                                        g = d[e + 3 >> 0] | 0;
                                        if ((g & 192 | 0) == 128) {
                                            c[j >> 2] = g + -128 | b << 6;
                                            g = 4;
                                            break a;
                                        }
                                    }
                                }
                            }
                        }
                    while (0);
                    c[(hd() | 0) >> 2] = 84;
                    g = -1;
                }
            while (0);
        i = k;
        return g | 0;
    }
    function Ud(a, b, d) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0;
        e = i;
        i = i + 16 | 0;
        f = e;
        c[f >> 2] = a;
        c[f + 4 >> 2] = b;
        c[f + 8 >> 2] = d;
        a = gd(Ba(4, f | 0) | 0) | 0;
        i = e;
        return a | 0;
    }
    function Vd(a, b, c, d, e) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        d = d | 0;
        e = e | 0;
        return Wd(a, b, c, d, e, 0) | 0;
    }
    function Wd(b, d, e, f, g, h) {
        b = b | 0;
        d = d | 0;
        e = e | 0;
        f = f | 0;
        g = g | 0;
        h = h | 0;
        var i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0;
        i = c[397] | 0;
        if ((i | 0) == 0 | 0 != 0) {
            c[5390] = 0;
            c[397] = 1;
            i = 1;
        }
        a:
            do
                if (((i | 0) < (b | 0) ? (l = c[d + (i << 2) >> 2] | 0, (l | 0) != 0) : 0) ? (a[l >> 0] | 0) == 45 : 0) {
                    k = l + 1 | 0;
                    j = a[k >> 0] | 0;
                    if (!h) {
                        if (j << 24 >> 24 == 45 ? a[l + 2 >> 0] | 0 : 0) {
                            j = 45;
                            o = 10;
                        }
                    } else if (j << 24 >> 24)
                        o = 10;
                    if ((o | 0) == 10) {
                        h = c[f >> 2] | 0;
                        n = j << 24 >> 24 == 45;
                        b:
                            do
                                if (h | 0) {
                                    m = n ? l + 2 | 0 : k;
                                    k = h;
                                    h = 0;
                                    c:
                                        while (1) {
                                            j = a[k >> 0] | 0;
                                            d:
                                                do
                                                    if (!(j << 24 >> 24)) {
                                                        j = m;
                                                        o = 15;
                                                    } else {
                                                        l = j;
                                                        j = m;
                                                        while (1) {
                                                            if (l << 24 >> 24 != (a[j >> 0] | 0))
                                                                break d;
                                                            k = k + 1 | 0;
                                                            j = j + 1 | 0;
                                                            l = a[k >> 0] | 0;
                                                            if (!(l << 24 >> 24)) {
                                                                o = 15;
                                                                break;
                                                            }
                                                        }
                                                    }
                                                while (0);
                                            e:
                                                do
                                                    if ((o | 0) == 15) {
                                                        o = 0;
                                                        k = a[j >> 0] | 0;
                                                        switch (k << 24 >> 24) {
                                                        case 61:
                                                        case 0:
                                                            break;
                                                        default:
                                                            break e;
                                                        }
                                                        l = c[f + (h << 4) + 4 >> 2] | 0;
                                                        if (k << 24 >> 24 != 61) {
                                                            j = l;
                                                            o = 19;
                                                            break c;
                                                        }
                                                        if (l | 0) {
                                                            o = 18;
                                                            break c;
                                                        }
                                                    }
                                                while (0);
                                            h = h + 1 | 0;
                                            k = c[f + (h << 4) >> 2] | 0;
                                            if (!k)
                                                break b;
                                        }
                                    if ((o | 0) == 18)
                                        c[5391] = j + 1;
                                    else if ((o | 0) == 19)
                                        if ((j | 0) == 1) {
                                            i = i + 1 | 0;
                                            c[397] = i;
                                            o = c[d + (i << 2) >> 2] | 0;
                                            c[5391] = o;
                                            if (!o) {
                                                i = 58;
                                                break a;
                                            }
                                        }
                                    c[397] = i + 1;
                                    if (g | 0)
                                        c[g >> 2] = h;
                                    j = c[f + (h << 4) + 8 >> 2] | 0;
                                    i = c[f + (h << 4) + 12 >> 2] | 0;
                                    if (!j)
                                        break a;
                                    c[j >> 2] = i;
                                    i = 0;
                                    break a;
                                }
                            while (0);
                        if (n) {
                            c[397] = i + 1;
                            i = 63;
                            break;
                        }
                    }
                    i = Sd(b, d, e) | 0;
                } else
                    i = -1;
            while (0);
        return i | 0;
    }
    function Xd(b, d) {
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0, g = 0, h = 0;
        g = i;
        i = i + 32 | 0;
        f = g + 16 | 0;
        e = g;
        if (qd(21294, a[d >> 0] | 0, 4) | 0) {
            h = Yd(d) | 0 | 32768;
            c[e >> 2] = b;
            c[e + 4 >> 2] = h;
            c[e + 8 >> 2] = 438;
            e = gd(Aa(5, e | 0) | 0) | 0;
            if ((e | 0) >= 0) {
                b = rd(e, d) | 0;
                if (!b) {
                    c[f >> 2] = e;
                    ja(6, f | 0) | 0;
                    b = 0;
                }
            } else
                b = 0;
        } else {
            c[(hd() | 0) >> 2] = 22;
            b = 0;
        }
        i = g;
        return b | 0;
    }
    function Yd(b) {
        b = b | 0;
        var c = 0, d = 0, e = 0;
        d = (sd(b, 43) | 0) == 0;
        c = a[b >> 0] | 0;
        d = d ? c << 24 >> 24 != 114 & 1 : 2;
        e = (sd(b, 120) | 0) == 0;
        d = e ? d : d | 128;
        b = (sd(b, 101) | 0) == 0;
        b = b ? d : d | 524288;
        b = c << 24 >> 24 == 114 ? b : b | 64;
        b = c << 24 >> 24 == 119 ? b | 512 : b;
        return (c << 24 >> 24 == 97 ? b | 1024 : b) | 0;
    }
    function Zd(a) {
        a = a | 0;
        return ((a | 0) == 32 | (a + -9 | 0) >>> 0 < 5) & 1 | 0;
    }
    function* _d(a, b, d) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0;
        e = i;
        i = i + 16 | 0;
        f = e;
        c[f >> 2] = d;
        d = (yield* Dd(a, b, f)) | 0;
        i = e;
        return d | 0;
    }
    function* $d(a, b, d) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0;
        e = i;
        i = i + 16 | 0;
        f = e;
        c[f >> 2] = d;
        d = (yield* ae(a, b, f)) | 0;
        i = e;
        return d | 0;
    }
    function* ae(a, b, c) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        return (yield* Bd(a, 2147483647, b, c)) | 0;
    }
    function be() {
        var a = 0, b = 0, d = 0, e = 0;
        ya(21616);
        if (!31) {
            a = (_(c[566] | 0, 1103515245) | 0) + 12345 & 2147483647;
            c[566] = a;
        } else {
            b = c[5406] | 0;
            d = c[597] | 0;
            e = 2264 + (d << 2) | 0;
            a = (c[e >> 2] | 0) + (c[2264 + (b << 2) >> 2] | 0) | 0;
            c[e >> 2] = a;
            d = d + 1 | 0;
            c[597] = (d | 0) == 31 ? 0 : d;
            b = b + 1 | 0;
            c[5406] = (b | 0) == 31 ? 0 : b;
            a = a >>> 1;
        }
        va(21616);
        return a | 0;
    }
    function ce(a, b) {
        a = a | 0;
        b = b | 0;
        var d = 0, e = 0;
        d = i;
        i = i + 16 | 0;
        e = d;
        c[e >> 2] = b;
        b = ((Ad(a, 21505, e) | 0) != 0) << 31 >> 31;
        i = d;
        return b | 0;
    }
    function de(a) {
        a = a | 0;
        return (a + -48 | 0) >>> 0 < 10 | 0;
    }
    function* ee(a, b, d, e) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        e = e | 0;
        var f = 0, g = 0;
        f = _(d, b) | 0;
        if ((c[e + 76 >> 2] | 0) > -1) {
            g = (ud(e) | 0) == 0;
            a = (yield* Fd(a, f, e)) | 0;
            if (!g)
                ld(e);
        } else
            a = (yield* Fd(a, f, e)) | 0;
        if ((a | 0) != (f | 0))
            d = (a >>> 0) / (b >>> 0) | 0;
        return d | 0;
    }
    function* fe(a) {
        a = a | 0;
        var b = 0, e = 0, f = 0;
        if ((c[a + 76 >> 2] | 0) >= 0 ? (ud(a) | 0) != 0 : 0) {
            b = a + 4 | 0;
            e = c[b >> 2] | 0;
            if (e >>> 0 < (c[a + 8 >> 2] | 0) >>> 0) {
                c[b >> 2] = e + 1;
                b = d[e >> 0] | 0;
            } else
                b = (yield* vd(a)) | 0;
            ld(a);
        } else
            f = 3;
        do
            if ((f | 0) == 3) {
                b = a + 4 | 0;
                e = c[b >> 2] | 0;
                if (e >>> 0 < (c[a + 8 >> 2] | 0) >>> 0) {
                    c[b >> 2] = e + 1;
                    b = d[e >> 0] | 0;
                    break;
                } else {
                    b = (yield* vd(a)) | 0;
                    break;
                }
            }
        while (0);
        return b | 0;
    }
    function ge(b, d, e, f) {
        b = b | 0;
        d = d | 0;
        e = e | 0;
        f = f | 0;
        d = b + 75 | 0;
        a[d >> 0] = -1;
        switch (e | 0) {
        case 2: {
                c[b + 48 >> 2] = 0;
                break;
            }
        case 1: {
                a[d >> 0] = 10;
                break;
            }
        default: {
            }
        }
        c[b >> 2] = c[b >> 2] | 64;
        return 0;
    }
    function* he(a, b) {
        a = a | 0;
        b = b | 0;
        var d = 0, e = 0;
        d = i;
        i = i + 16 | 0;
        e = d;
        c[e >> 2] = b;
        b = (yield* Dd(c[449] | 0, a, e)) | 0;
        i = d;
        return b | 0;
    }
    function* ie(b, e) {
        b = b | 0;
        e = e | 0;
        var f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0;
        m = i;
        i = i + 16 | 0;
        l = m;
        k = e & 255;
        a[l >> 0] = k;
        g = b + 16 | 0;
        h = c[g >> 2] | 0;
        if (!h)
            if (!(Gd(b) | 0)) {
                h = c[g >> 2] | 0;
                j = 4;
            } else
                f = -1;
        else
            j = 4;
        do
            if ((j | 0) == 4) {
                g = b + 20 | 0;
                j = c[g >> 2] | 0;
                if (j >>> 0 < h >>> 0 ? (f = e & 255, (f | 0) != (a[b + 75 >> 0] | 0)) : 0) {
                    c[g >> 2] = j + 1;
                    a[j >> 0] = k;
                    break;
                }
                if (((yield* Ka[c[b + 36 >> 2] & 7](b, l, 1)) | 0) == 1)
                    f = d[l >> 0] | 0;
                else
                    f = -1;
            }
        while (0);
        i = m;
        return f | 0;
    }
    function* je(a) {
        a = a | 0;
        return (yield* ke(a, c[449] | 0)) | 0;
    }
    function* ke(b, d) {
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0, g = 0, h = 0, i = 0;
        if ((c[d + 76 >> 2] | 0) >= 0 ? (ud(d) | 0) != 0 : 0) {
            if ((a[d + 75 >> 0] | 0) != (b | 0) ? (f = d + 20 | 0, g = c[f >> 2] | 0, g >>> 0 < (c[d + 16 >> 2] | 0) >>> 0) : 0) {
                c[f >> 2] = g + 1;
                a[g >> 0] = b;
                e = b & 255;
            } else
                e = (yield* ie(d, b)) | 0;
            ld(d);
        } else
            i = 3;
        do
            if ((i | 0) == 3) {
                if ((a[d + 75 >> 0] | 0) != (b | 0) ? (h = d + 20 | 0, e = c[h >> 2] | 0, e >>> 0 < (c[d + 16 >> 2] | 0) >>> 0) : 0) {
                    c[h >> 2] = e + 1;
                    a[e >> 0] = b;
                    e = b & 255;
                    break;
                }
                e = (yield* ie(d, b)) | 0;
            }
        while (0);
        return e | 0;
    }
    function* le() {
        return (yield* fe(c[479] | 0)) | 0;
    }
    function me(a) {
        a = a | 0;
        (c[a + 76 >> 2] | 0) > -1 ? ud(a) | 0 : 0;
        return c[a + 60 >> 2] | 0;
    }
    function ne(a, b) {
        a = a | 0;
        b = b | 0;
        Pd(a + (pd(a) | 0) | 0, b) | 0;
        return a | 0;
    }
    function* oe(a, b, d) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        var e = 0, f = 0;
        e = i;
        i = i + 16 | 0;
        f = e;
        c[f >> 2] = a;
        c[f + 4 >> 2] = b;
        c[f + 8 >> 2] = d;
        a = gd((yield* wa(3, f | 0)) | 0) | 0;
        i = e;
        return a | 0;
    }
    function pe(a) {
        a = a | 0;
        var b = 0;
        b = i;
        i = i + 64 | 0;
        a = (ce(a, b) | 0) == 0 & 1;
        i = b;
        return a | 0;
    }
    function qe(b) {
        b = b | 0;
        var c = 0, d = 0, e = 0, f = 0;
        while (1) {
            c = b + 1 | 0;
            if (!(Zd(a[b >> 0] | 0) | 0))
                break;
            else
                b = c;
        }
        d = a[b >> 0] | 0;
        switch (d << 24 >> 24 | 0) {
        case 45: {
                e = 1;
                f = 5;
                break;
            }
        case 43: {
                e = 0;
                f = 5;
                break;
            }
        default:
            e = 0;
        }
        if ((f | 0) == 5) {
            b = c;
            d = a[c >> 0] | 0;
        }
        c = (d << 24 >> 24) + -48 | 0;
        if (c >>> 0 < 10) {
            d = b;
            b = 0;
            do {
                d = d + 1 | 0;
                b = (b * 10 | 0) - c | 0;
                c = (a[d >> 0] | 0) + -48 | 0;
            } while (c >>> 0 < 10);
        } else
            b = 0;
        return (e | 0 ? b : 0 - b | 0) | 0;
    }
    function re(a) {
        a = a | 0;
        var b = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0;
        do
            if (a >>> 0 < 245) {
                o = a >>> 0 < 11 ? 16 : a + 11 & -8;
                a = o >>> 3;
                j = c[5407] | 0;
                b = j >>> a;
                if (b & 3 | 0) {
                    b = (b & 1 ^ 1) + a | 0;
                    d = 21668 + (b << 1 << 2) | 0;
                    e = d + 8 | 0;
                    f = c[e >> 2] | 0;
                    g = f + 8 | 0;
                    h = c[g >> 2] | 0;
                    do
                        if ((d | 0) != (h | 0)) {
                            if (h >>> 0 < (c[5411] | 0) >>> 0)
                                za();
                            a = h + 12 | 0;
                            if ((c[a >> 2] | 0) == (f | 0)) {
                                c[a >> 2] = d;
                                c[e >> 2] = h;
                                break;
                            } else
                                za();
                        } else
                            c[5407] = j & ~(1 << b);
                    while (0);
                    L = b << 3;
                    c[f + 4 >> 2] = L | 3;
                    L = f + L + 4 | 0;
                    c[L >> 2] = c[L >> 2] | 1;
                    L = g;
                    return L | 0;
                }
                h = c[5409] | 0;
                if (o >>> 0 > h >>> 0) {
                    if (b | 0) {
                        d = 2 << a;
                        d = b << a & (d | 0 - d);
                        d = (d & 0 - d) + -1 | 0;
                        i = d >>> 12 & 16;
                        d = d >>> i;
                        f = d >>> 5 & 8;
                        d = d >>> f;
                        g = d >>> 2 & 4;
                        d = d >>> g;
                        e = d >>> 1 & 2;
                        d = d >>> e;
                        b = d >>> 1 & 1;
                        b = (f | i | g | e | b) + (d >>> b) | 0;
                        d = 21668 + (b << 1 << 2) | 0;
                        e = d + 8 | 0;
                        g = c[e >> 2] | 0;
                        i = g + 8 | 0;
                        f = c[i >> 2] | 0;
                        do
                            if ((d | 0) != (f | 0)) {
                                if (f >>> 0 < (c[5411] | 0) >>> 0)
                                    za();
                                a = f + 12 | 0;
                                if ((c[a >> 2] | 0) == (g | 0)) {
                                    c[a >> 2] = d;
                                    c[e >> 2] = f;
                                    k = c[5409] | 0;
                                    break;
                                } else
                                    za();
                            } else {
                                c[5407] = j & ~(1 << b);
                                k = h;
                            }
                        while (0);
                        h = (b << 3) - o | 0;
                        c[g + 4 >> 2] = o | 3;
                        e = g + o | 0;
                        c[e + 4 >> 2] = h | 1;
                        c[e + h >> 2] = h;
                        if (k | 0) {
                            f = c[5412] | 0;
                            b = k >>> 3;
                            d = 21668 + (b << 1 << 2) | 0;
                            a = c[5407] | 0;
                            b = 1 << b;
                            if (a & b) {
                                a = d + 8 | 0;
                                b = c[a >> 2] | 0;
                                if (b >>> 0 < (c[5411] | 0) >>> 0)
                                    za();
                                else {
                                    l = a;
                                    m = b;
                                }
                            } else {
                                c[5407] = a | b;
                                l = d + 8 | 0;
                                m = d;
                            }
                            c[l >> 2] = f;
                            c[m + 12 >> 2] = f;
                            c[f + 8 >> 2] = m;
                            c[f + 12 >> 2] = d;
                        }
                        c[5409] = h;
                        c[5412] = e;
                        L = i;
                        return L | 0;
                    }
                    a = c[5408] | 0;
                    if (a) {
                        d = (a & 0 - a) + -1 | 0;
                        K = d >>> 12 & 16;
                        d = d >>> K;
                        J = d >>> 5 & 8;
                        d = d >>> J;
                        L = d >>> 2 & 4;
                        d = d >>> L;
                        b = d >>> 1 & 2;
                        d = d >>> b;
                        e = d >>> 1 & 1;
                        e = c[21932 + ((J | K | L | b | e) + (d >>> e) << 2) >> 2] | 0;
                        d = (c[e + 4 >> 2] & -8) - o | 0;
                        b = e;
                        while (1) {
                            a = c[b + 16 >> 2] | 0;
                            if (!a) {
                                a = c[b + 20 >> 2] | 0;
                                if (!a) {
                                    j = e;
                                    break;
                                }
                            }
                            b = (c[a + 4 >> 2] & -8) - o | 0;
                            L = b >>> 0 < d >>> 0;
                            d = L ? b : d;
                            b = a;
                            e = L ? a : e;
                        }
                        g = c[5411] | 0;
                        if (j >>> 0 < g >>> 0)
                            za();
                        i = j + o | 0;
                        if (j >>> 0 >= i >>> 0)
                            za();
                        h = c[j + 24 >> 2] | 0;
                        e = c[j + 12 >> 2] | 0;
                        do
                            if ((e | 0) == (j | 0)) {
                                b = j + 20 | 0;
                                a = c[b >> 2] | 0;
                                if (!a) {
                                    b = j + 16 | 0;
                                    a = c[b >> 2] | 0;
                                    if (!a) {
                                        n = 0;
                                        break;
                                    }
                                }
                                while (1) {
                                    e = a + 20 | 0;
                                    f = c[e >> 2] | 0;
                                    if (f | 0) {
                                        a = f;
                                        b = e;
                                        continue;
                                    }
                                    e = a + 16 | 0;
                                    f = c[e >> 2] | 0;
                                    if (!f)
                                        break;
                                    else {
                                        a = f;
                                        b = e;
                                    }
                                }
                                if (b >>> 0 < g >>> 0)
                                    za();
                                else {
                                    c[b >> 2] = 0;
                                    n = a;
                                    break;
                                }
                            } else {
                                f = c[j + 8 >> 2] | 0;
                                if (f >>> 0 < g >>> 0)
                                    za();
                                a = f + 12 | 0;
                                if ((c[a >> 2] | 0) != (j | 0))
                                    za();
                                b = e + 8 | 0;
                                if ((c[b >> 2] | 0) == (j | 0)) {
                                    c[a >> 2] = e;
                                    c[b >> 2] = f;
                                    n = e;
                                    break;
                                } else
                                    za();
                            }
                        while (0);
                        do
                            if (h | 0) {
                                a = c[j + 28 >> 2] | 0;
                                b = 21932 + (a << 2) | 0;
                                if ((j | 0) == (c[b >> 2] | 0)) {
                                    c[b >> 2] = n;
                                    if (!n) {
                                        c[5408] = c[5408] & ~(1 << a);
                                        break;
                                    }
                                } else {
                                    if (h >>> 0 < (c[5411] | 0) >>> 0)
                                        za();
                                    a = h + 16 | 0;
                                    if ((c[a >> 2] | 0) == (j | 0))
                                        c[a >> 2] = n;
                                    else
                                        c[h + 20 >> 2] = n;
                                    if (!n)
                                        break;
                                }
                                b = c[5411] | 0;
                                if (n >>> 0 < b >>> 0)
                                    za();
                                c[n + 24 >> 2] = h;
                                a = c[j + 16 >> 2] | 0;
                                do
                                    if (a | 0)
                                        if (a >>> 0 < b >>> 0)
                                            za();
                                        else {
                                            c[n + 16 >> 2] = a;
                                            c[a + 24 >> 2] = n;
                                            break;
                                        }
                                while (0);
                                a = c[j + 20 >> 2] | 0;
                                if (a | 0)
                                    if (a >>> 0 < (c[5411] | 0) >>> 0)
                                        za();
                                    else {
                                        c[n + 20 >> 2] = a;
                                        c[a + 24 >> 2] = n;
                                        break;
                                    }
                            }
                        while (0);
                        if (d >>> 0 < 16) {
                            L = d + o | 0;
                            c[j + 4 >> 2] = L | 3;
                            L = j + L + 4 | 0;
                            c[L >> 2] = c[L >> 2] | 1;
                        } else {
                            c[j + 4 >> 2] = o | 3;
                            c[i + 4 >> 2] = d | 1;
                            c[i + d >> 2] = d;
                            a = c[5409] | 0;
                            if (a | 0) {
                                f = c[5412] | 0;
                                b = a >>> 3;
                                e = 21668 + (b << 1 << 2) | 0;
                                a = c[5407] | 0;
                                b = 1 << b;
                                if (a & b) {
                                    a = e + 8 | 0;
                                    b = c[a >> 2] | 0;
                                    if (b >>> 0 < (c[5411] | 0) >>> 0)
                                        za();
                                    else {
                                        p = a;
                                        q = b;
                                    }
                                } else {
                                    c[5407] = a | b;
                                    p = e + 8 | 0;
                                    q = e;
                                }
                                c[p >> 2] = f;
                                c[q + 12 >> 2] = f;
                                c[f + 8 >> 2] = q;
                                c[f + 12 >> 2] = e;
                            }
                            c[5409] = d;
                            c[5412] = i;
                        }
                        L = j + 8 | 0;
                        return L | 0;
                    }
                }
            } else if (a >>> 0 <= 4294967231) {
                a = a + 11 | 0;
                o = a & -8;
                j = c[5408] | 0;
                if (j) {
                    d = 0 - o | 0;
                    a = a >>> 8;
                    if (a)
                        if (o >>> 0 > 16777215)
                            i = 31;
                        else {
                            q = (a + 1048320 | 0) >>> 16 & 8;
                            E = a << q;
                            p = (E + 520192 | 0) >>> 16 & 4;
                            E = E << p;
                            i = (E + 245760 | 0) >>> 16 & 2;
                            i = 14 - (p | q | i) + (E << i >>> 15) | 0;
                            i = o >>> (i + 7 | 0) & 1 | i << 1;
                        }
                    else
                        i = 0;
                    b = c[21932 + (i << 2) >> 2] | 0;
                    a:
                        do
                            if (!b) {
                                a = 0;
                                b = 0;
                                E = 86;
                            } else {
                                f = d;
                                a = 0;
                                g = o << ((i | 0) == 31 ? 0 : 25 - (i >>> 1) | 0);
                                h = b;
                                b = 0;
                                while (1) {
                                    e = c[h + 4 >> 2] & -8;
                                    d = e - o | 0;
                                    if (d >>> 0 < f >>> 0)
                                        if ((e | 0) == (o | 0)) {
                                            a = h;
                                            b = h;
                                            E = 90;
                                            break a;
                                        } else
                                            b = h;
                                    else
                                        d = f;
                                    e = c[h + 20 >> 2] | 0;
                                    h = c[h + 16 + (g >>> 31 << 2) >> 2] | 0;
                                    a = (e | 0) == 0 | (e | 0) == (h | 0) ? a : e;
                                    e = (h | 0) == 0;
                                    if (e) {
                                        E = 86;
                                        break;
                                    } else {
                                        f = d;
                                        g = g << (e & 1 ^ 1);
                                    }
                                }
                            }
                        while (0);
                    if ((E | 0) == 86) {
                        if ((a | 0) == 0 & (b | 0) == 0) {
                            a = 2 << i;
                            a = j & (a | 0 - a);
                            if (!a)
                                break;
                            q = (a & 0 - a) + -1 | 0;
                            m = q >>> 12 & 16;
                            q = q >>> m;
                            l = q >>> 5 & 8;
                            q = q >>> l;
                            n = q >>> 2 & 4;
                            q = q >>> n;
                            p = q >>> 1 & 2;
                            q = q >>> p;
                            a = q >>> 1 & 1;
                            a = c[21932 + ((l | m | n | p | a) + (q >>> a) << 2) >> 2] | 0;
                        }
                        if (!a) {
                            i = d;
                            j = b;
                        } else
                            E = 90;
                    }
                    if ((E | 0) == 90)
                        while (1) {
                            E = 0;
                            q = (c[a + 4 >> 2] & -8) - o | 0;
                            e = q >>> 0 < d >>> 0;
                            d = e ? q : d;
                            b = e ? a : b;
                            e = c[a + 16 >> 2] | 0;
                            if (e | 0) {
                                a = e;
                                E = 90;
                                continue;
                            }
                            a = c[a + 20 >> 2] | 0;
                            if (!a) {
                                i = d;
                                j = b;
                                break;
                            } else
                                E = 90;
                        }
                    if ((j | 0) != 0 ? i >>> 0 < ((c[5409] | 0) - o | 0) >>> 0 : 0) {
                        f = c[5411] | 0;
                        if (j >>> 0 < f >>> 0)
                            za();
                        h = j + o | 0;
                        if (j >>> 0 >= h >>> 0)
                            za();
                        g = c[j + 24 >> 2] | 0;
                        d = c[j + 12 >> 2] | 0;
                        do
                            if ((d | 0) == (j | 0)) {
                                b = j + 20 | 0;
                                a = c[b >> 2] | 0;
                                if (!a) {
                                    b = j + 16 | 0;
                                    a = c[b >> 2] | 0;
                                    if (!a) {
                                        s = 0;
                                        break;
                                    }
                                }
                                while (1) {
                                    d = a + 20 | 0;
                                    e = c[d >> 2] | 0;
                                    if (e | 0) {
                                        a = e;
                                        b = d;
                                        continue;
                                    }
                                    d = a + 16 | 0;
                                    e = c[d >> 2] | 0;
                                    if (!e)
                                        break;
                                    else {
                                        a = e;
                                        b = d;
                                    }
                                }
                                if (b >>> 0 < f >>> 0)
                                    za();
                                else {
                                    c[b >> 2] = 0;
                                    s = a;
                                    break;
                                }
                            } else {
                                e = c[j + 8 >> 2] | 0;
                                if (e >>> 0 < f >>> 0)
                                    za();
                                a = e + 12 | 0;
                                if ((c[a >> 2] | 0) != (j | 0))
                                    za();
                                b = d + 8 | 0;
                                if ((c[b >> 2] | 0) == (j | 0)) {
                                    c[a >> 2] = d;
                                    c[b >> 2] = e;
                                    s = d;
                                    break;
                                } else
                                    za();
                            }
                        while (0);
                        do
                            if (g | 0) {
                                a = c[j + 28 >> 2] | 0;
                                b = 21932 + (a << 2) | 0;
                                if ((j | 0) == (c[b >> 2] | 0)) {
                                    c[b >> 2] = s;
                                    if (!s) {
                                        c[5408] = c[5408] & ~(1 << a);
                                        break;
                                    }
                                } else {
                                    if (g >>> 0 < (c[5411] | 0) >>> 0)
                                        za();
                                    a = g + 16 | 0;
                                    if ((c[a >> 2] | 0) == (j | 0))
                                        c[a >> 2] = s;
                                    else
                                        c[g + 20 >> 2] = s;
                                    if (!s)
                                        break;
                                }
                                b = c[5411] | 0;
                                if (s >>> 0 < b >>> 0)
                                    za();
                                c[s + 24 >> 2] = g;
                                a = c[j + 16 >> 2] | 0;
                                do
                                    if (a | 0)
                                        if (a >>> 0 < b >>> 0)
                                            za();
                                        else {
                                            c[s + 16 >> 2] = a;
                                            c[a + 24 >> 2] = s;
                                            break;
                                        }
                                while (0);
                                a = c[j + 20 >> 2] | 0;
                                if (a | 0)
                                    if (a >>> 0 < (c[5411] | 0) >>> 0)
                                        za();
                                    else {
                                        c[s + 20 >> 2] = a;
                                        c[a + 24 >> 2] = s;
                                        break;
                                    }
                            }
                        while (0);
                        do
                            if (i >>> 0 >= 16) {
                                c[j + 4 >> 2] = o | 3;
                                c[h + 4 >> 2] = i | 1;
                                c[h + i >> 2] = i;
                                a = i >>> 3;
                                if (i >>> 0 < 256) {
                                    d = 21668 + (a << 1 << 2) | 0;
                                    b = c[5407] | 0;
                                    a = 1 << a;
                                    if (b & a) {
                                        a = d + 8 | 0;
                                        b = c[a >> 2] | 0;
                                        if (b >>> 0 < (c[5411] | 0) >>> 0)
                                            za();
                                        else {
                                            u = a;
                                            v = b;
                                        }
                                    } else {
                                        c[5407] = b | a;
                                        u = d + 8 | 0;
                                        v = d;
                                    }
                                    c[u >> 2] = h;
                                    c[v + 12 >> 2] = h;
                                    c[h + 8 >> 2] = v;
                                    c[h + 12 >> 2] = d;
                                    break;
                                }
                                a = i >>> 8;
                                if (a)
                                    if (i >>> 0 > 16777215)
                                        d = 31;
                                    else {
                                        K = (a + 1048320 | 0) >>> 16 & 8;
                                        L = a << K;
                                        J = (L + 520192 | 0) >>> 16 & 4;
                                        L = L << J;
                                        d = (L + 245760 | 0) >>> 16 & 2;
                                        d = 14 - (J | K | d) + (L << d >>> 15) | 0;
                                        d = i >>> (d + 7 | 0) & 1 | d << 1;
                                    }
                                else
                                    d = 0;
                                e = 21932 + (d << 2) | 0;
                                c[h + 28 >> 2] = d;
                                a = h + 16 | 0;
                                c[a + 4 >> 2] = 0;
                                c[a >> 2] = 0;
                                a = c[5408] | 0;
                                b = 1 << d;
                                if (!(a & b)) {
                                    c[5408] = a | b;
                                    c[e >> 2] = h;
                                    c[h + 24 >> 2] = e;
                                    c[h + 12 >> 2] = h;
                                    c[h + 8 >> 2] = h;
                                    break;
                                }
                                f = i << ((d | 0) == 31 ? 0 : 25 - (d >>> 1) | 0);
                                a = c[e >> 2] | 0;
                                while (1) {
                                    if ((c[a + 4 >> 2] & -8 | 0) == (i | 0)) {
                                        d = a;
                                        E = 148;
                                        break;
                                    }
                                    b = a + 16 + (f >>> 31 << 2) | 0;
                                    d = c[b >> 2] | 0;
                                    if (!d) {
                                        E = 145;
                                        break;
                                    } else {
                                        f = f << 1;
                                        a = d;
                                    }
                                }
                                if ((E | 0) == 145)
                                    if (b >>> 0 < (c[5411] | 0) >>> 0)
                                        za();
                                    else {
                                        c[b >> 2] = h;
                                        c[h + 24 >> 2] = a;
                                        c[h + 12 >> 2] = h;
                                        c[h + 8 >> 2] = h;
                                        break;
                                    }
                                else if ((E | 0) == 148) {
                                    a = d + 8 | 0;
                                    b = c[a >> 2] | 0;
                                    L = c[5411] | 0;
                                    if (b >>> 0 >= L >>> 0 & d >>> 0 >= L >>> 0) {
                                        c[b + 12 >> 2] = h;
                                        c[a >> 2] = h;
                                        c[h + 8 >> 2] = b;
                                        c[h + 12 >> 2] = d;
                                        c[h + 24 >> 2] = 0;
                                        break;
                                    } else
                                        za();
                                }
                            } else {
                                L = i + o | 0;
                                c[j + 4 >> 2] = L | 3;
                                L = j + L + 4 | 0;
                                c[L >> 2] = c[L >> 2] | 1;
                            }
                        while (0);
                        L = j + 8 | 0;
                        return L | 0;
                    }
                }
            } else
                o = -1;
        while (0);
        d = c[5409] | 0;
        if (d >>> 0 >= o >>> 0) {
            a = d - o | 0;
            b = c[5412] | 0;
            if (a >>> 0 > 15) {
                L = b + o | 0;
                c[5412] = L;
                c[5409] = a;
                c[L + 4 >> 2] = a | 1;
                c[L + a >> 2] = a;
                c[b + 4 >> 2] = o | 3;
            } else {
                c[5409] = 0;
                c[5412] = 0;
                c[b + 4 >> 2] = d | 3;
                L = b + d + 4 | 0;
                c[L >> 2] = c[L >> 2] | 1;
            }
            L = b + 8 | 0;
            return L | 0;
        }
        a = c[5410] | 0;
        if (a >>> 0 > o >>> 0) {
            J = a - o | 0;
            c[5410] = J;
            L = c[5413] | 0;
            K = L + o | 0;
            c[5413] = K;
            c[K + 4 >> 2] = J | 1;
            c[L + 4 >> 2] = o | 3;
            L = L + 8 | 0;
            return L | 0;
        }
        do
            if (!(c[5525] | 0)) {
                a = xa(30) | 0;
                if (!(a + -1 & a)) {
                    c[5527] = a;
                    c[5526] = a;
                    c[5528] = -1;
                    c[5529] = -1;
                    c[5530] = 0;
                    c[5518] = 0;
                    c[5525] = (Ca(0) | 0) & -16 ^ 1431655768;
                    break;
                } else
                    za();
            }
        while (0);
        h = o + 48 | 0;
        g = c[5527] | 0;
        i = o + 47 | 0;
        f = g + i | 0;
        g = 0 - g | 0;
        j = f & g;
        if (j >>> 0 <= o >>> 0) {
            L = 0;
            return L | 0;
        }
        a = c[5517] | 0;
        if (a | 0 ? (u = c[5515] | 0, v = u + j | 0, v >>> 0 <= u >>> 0 | v >>> 0 > a >>> 0) : 0) {
            L = 0;
            return L | 0;
        }
        b:
            do
                if (!(c[5518] & 4)) {
                    a = c[5413] | 0;
                    c:
                        do
                            if (a) {
                                d = 22076;
                                while (1) {
                                    b = c[d >> 2] | 0;
                                    if (b >>> 0 <= a >>> 0 ? (r = d + 4 | 0, (b + (c[r >> 2] | 0) | 0) >>> 0 > a >>> 0) : 0) {
                                        e = d;
                                        d = r;
                                        break;
                                    }
                                    d = c[d + 8 >> 2] | 0;
                                    if (!d) {
                                        E = 173;
                                        break c;
                                    }
                                }
                                a = f - (c[5410] | 0) & g;
                                if (a >>> 0 < 2147483647) {
                                    b = pa(a | 0) | 0;
                                    if ((b | 0) == ((c[e >> 2] | 0) + (c[d >> 2] | 0) | 0)) {
                                        if ((b | 0) != (-1 | 0)) {
                                            h = b;
                                            f = a;
                                            E = 193;
                                            break b;
                                        }
                                    } else
                                        E = 183;
                                }
                            } else
                                E = 173;
                        while (0);
                    do
                        if ((E | 0) == 173 ? (t = pa(0) | 0, (t | 0) != (-1 | 0)) : 0) {
                            a = t;
                            b = c[5526] | 0;
                            d = b + -1 | 0;
                            if (!(d & a))
                                a = j;
                            else
                                a = j - a + (d + a & 0 - b) | 0;
                            b = c[5515] | 0;
                            d = b + a | 0;
                            if (a >>> 0 > o >>> 0 & a >>> 0 < 2147483647) {
                                v = c[5517] | 0;
                                if (v | 0 ? d >>> 0 <= b >>> 0 | d >>> 0 > v >>> 0 : 0)
                                    break;
                                b = pa(a | 0) | 0;
                                if ((b | 0) == (t | 0)) {
                                    h = t;
                                    f = a;
                                    E = 193;
                                    break b;
                                } else
                                    E = 183;
                            }
                        }
                    while (0);
                    d:
                        do
                            if ((E | 0) == 183) {
                                d = 0 - a | 0;
                                do
                                    if (h >>> 0 > a >>> 0 & (a >>> 0 < 2147483647 & (b | 0) != (-1 | 0)) ? (w = c[5527] | 0, w = i - a + w & 0 - w, w >>> 0 < 2147483647) : 0)
                                        if ((pa(w | 0) | 0) == (-1 | 0)) {
                                            pa(d | 0) | 0;
                                            break d;
                                        } else {
                                            a = w + a | 0;
                                            break;
                                        }
                                while (0);
                                if ((b | 0) != (-1 | 0)) {
                                    h = b;
                                    f = a;
                                    E = 193;
                                    break b;
                                }
                            }
                        while (0);
                    c[5518] = c[5518] | 4;
                    E = 190;
                } else
                    E = 190;
            while (0);
        if ((((E | 0) == 190 ? j >>> 0 < 2147483647 : 0) ? (x = pa(j | 0) | 0, y = pa(0) | 0, x >>> 0 < y >>> 0 & ((x | 0) != (-1 | 0) & (y | 0) != (-1 | 0))) : 0) ? (z = y - x | 0, z >>> 0 > (o + 40 | 0) >>> 0) : 0) {
            h = x;
            f = z;
            E = 193;
        }
        if ((E | 0) == 193) {
            a = (c[5515] | 0) + f | 0;
            c[5515] = a;
            if (a >>> 0 > (c[5516] | 0) >>> 0)
                c[5516] = a;
            i = c[5413] | 0;
            do
                if (i) {
                    e = 22076;
                    do {
                        a = c[e >> 2] | 0;
                        b = e + 4 | 0;
                        d = c[b >> 2] | 0;
                        if ((h | 0) == (a + d | 0)) {
                            A = a;
                            B = b;
                            C = d;
                            D = e;
                            E = 203;
                            break;
                        }
                        e = c[e + 8 >> 2] | 0;
                    } while ((e | 0) != 0);
                    if (((E | 0) == 203 ? (c[D + 12 >> 2] & 8 | 0) == 0 : 0) ? i >>> 0 < h >>> 0 & i >>> 0 >= A >>> 0 : 0) {
                        c[B >> 2] = C + f;
                        L = i + 8 | 0;
                        L = (L & 7 | 0) == 0 ? 0 : 0 - L & 7;
                        K = i + L | 0;
                        L = f - L + (c[5410] | 0) | 0;
                        c[5413] = K;
                        c[5410] = L;
                        c[K + 4 >> 2] = L | 1;
                        c[K + L + 4 >> 2] = 40;
                        c[5414] = c[5529];
                        break;
                    }
                    a = c[5411] | 0;
                    if (h >>> 0 < a >>> 0) {
                        c[5411] = h;
                        j = h;
                    } else
                        j = a;
                    d = h + f | 0;
                    a = 22076;
                    while (1) {
                        if ((c[a >> 2] | 0) == (d | 0)) {
                            b = a;
                            E = 211;
                            break;
                        }
                        a = c[a + 8 >> 2] | 0;
                        if (!a) {
                            b = 22076;
                            break;
                        }
                    }
                    if ((E | 0) == 211)
                        if (!(c[a + 12 >> 2] & 8)) {
                            c[b >> 2] = h;
                            l = a + 4 | 0;
                            c[l >> 2] = (c[l >> 2] | 0) + f;
                            l = h + 8 | 0;
                            l = h + ((l & 7 | 0) == 0 ? 0 : 0 - l & 7) | 0;
                            a = d + 8 | 0;
                            a = d + ((a & 7 | 0) == 0 ? 0 : 0 - a & 7) | 0;
                            k = l + o | 0;
                            g = a - l - o | 0;
                            c[l + 4 >> 2] = o | 3;
                            do
                                if ((a | 0) != (i | 0)) {
                                    if ((a | 0) == (c[5412] | 0)) {
                                        L = (c[5409] | 0) + g | 0;
                                        c[5409] = L;
                                        c[5412] = k;
                                        c[k + 4 >> 2] = L | 1;
                                        c[k + L >> 2] = L;
                                        break;
                                    }
                                    b = c[a + 4 >> 2] | 0;
                                    if ((b & 3 | 0) == 1) {
                                        i = b & -8;
                                        f = b >>> 3;
                                        e:
                                            do
                                                if (b >>> 0 >= 256) {
                                                    h = c[a + 24 >> 2] | 0;
                                                    e = c[a + 12 >> 2] | 0;
                                                    do
                                                        if ((e | 0) == (a | 0)) {
                                                            d = a + 16 | 0;
                                                            e = d + 4 | 0;
                                                            b = c[e >> 2] | 0;
                                                            if (!b) {
                                                                b = c[d >> 2] | 0;
                                                                if (!b) {
                                                                    J = 0;
                                                                    break;
                                                                }
                                                            } else
                                                                d = e;
                                                            while (1) {
                                                                e = b + 20 | 0;
                                                                f = c[e >> 2] | 0;
                                                                if (f | 0) {
                                                                    b = f;
                                                                    d = e;
                                                                    continue;
                                                                }
                                                                e = b + 16 | 0;
                                                                f = c[e >> 2] | 0;
                                                                if (!f)
                                                                    break;
                                                                else {
                                                                    b = f;
                                                                    d = e;
                                                                }
                                                            }
                                                            if (d >>> 0 < j >>> 0)
                                                                za();
                                                            else {
                                                                c[d >> 2] = 0;
                                                                J = b;
                                                                break;
                                                            }
                                                        } else {
                                                            f = c[a + 8 >> 2] | 0;
                                                            if (f >>> 0 < j >>> 0)
                                                                za();
                                                            b = f + 12 | 0;
                                                            if ((c[b >> 2] | 0) != (a | 0))
                                                                za();
                                                            d = e + 8 | 0;
                                                            if ((c[d >> 2] | 0) == (a | 0)) {
                                                                c[b >> 2] = e;
                                                                c[d >> 2] = f;
                                                                J = e;
                                                                break;
                                                            } else
                                                                za();
                                                        }
                                                    while (0);
                                                    if (!h)
                                                        break;
                                                    b = c[a + 28 >> 2] | 0;
                                                    d = 21932 + (b << 2) | 0;
                                                    do
                                                        if ((a | 0) != (c[d >> 2] | 0)) {
                                                            if (h >>> 0 < (c[5411] | 0) >>> 0)
                                                                za();
                                                            b = h + 16 | 0;
                                                            if ((c[b >> 2] | 0) == (a | 0))
                                                                c[b >> 2] = J;
                                                            else
                                                                c[h + 20 >> 2] = J;
                                                            if (!J)
                                                                break e;
                                                        } else {
                                                            c[d >> 2] = J;
                                                            if (J | 0)
                                                                break;
                                                            c[5408] = c[5408] & ~(1 << b);
                                                            break e;
                                                        }
                                                    while (0);
                                                    e = c[5411] | 0;
                                                    if (J >>> 0 < e >>> 0)
                                                        za();
                                                    c[J + 24 >> 2] = h;
                                                    b = a + 16 | 0;
                                                    d = c[b >> 2] | 0;
                                                    do
                                                        if (d | 0)
                                                            if (d >>> 0 < e >>> 0)
                                                                za();
                                                            else {
                                                                c[J + 16 >> 2] = d;
                                                                c[d + 24 >> 2] = J;
                                                                break;
                                                            }
                                                    while (0);
                                                    b = c[b + 4 >> 2] | 0;
                                                    if (!b)
                                                        break;
                                                    if (b >>> 0 < (c[5411] | 0) >>> 0)
                                                        za();
                                                    else {
                                                        c[J + 20 >> 2] = b;
                                                        c[b + 24 >> 2] = J;
                                                        break;
                                                    }
                                                } else {
                                                    d = c[a + 8 >> 2] | 0;
                                                    e = c[a + 12 >> 2] | 0;
                                                    b = 21668 + (f << 1 << 2) | 0;
                                                    do
                                                        if ((d | 0) != (b | 0)) {
                                                            if (d >>> 0 < j >>> 0)
                                                                za();
                                                            if ((c[d + 12 >> 2] | 0) == (a | 0))
                                                                break;
                                                            za();
                                                        }
                                                    while (0);
                                                    if ((e | 0) == (d | 0)) {
                                                        c[5407] = c[5407] & ~(1 << f);
                                                        break;
                                                    }
                                                    do
                                                        if ((e | 0) == (b | 0))
                                                            G = e + 8 | 0;
                                                        else {
                                                            if (e >>> 0 < j >>> 0)
                                                                za();
                                                            b = e + 8 | 0;
                                                            if ((c[b >> 2] | 0) == (a | 0)) {
                                                                G = b;
                                                                break;
                                                            }
                                                            za();
                                                        }
                                                    while (0);
                                                    c[d + 12 >> 2] = e;
                                                    c[G >> 2] = d;
                                                }
                                            while (0);
                                        a = a + i | 0;
                                        g = i + g | 0;
                                    }
                                    a = a + 4 | 0;
                                    c[a >> 2] = c[a >> 2] & -2;
                                    c[k + 4 >> 2] = g | 1;
                                    c[k + g >> 2] = g;
                                    a = g >>> 3;
                                    if (g >>> 0 < 256) {
                                        d = 21668 + (a << 1 << 2) | 0;
                                        b = c[5407] | 0;
                                        a = 1 << a;
                                        do
                                            if (!(b & a)) {
                                                c[5407] = b | a;
                                                K = d + 8 | 0;
                                                L = d;
                                            } else {
                                                a = d + 8 | 0;
                                                b = c[a >> 2] | 0;
                                                if (b >>> 0 >= (c[5411] | 0) >>> 0) {
                                                    K = a;
                                                    L = b;
                                                    break;
                                                }
                                                za();
                                            }
                                        while (0);
                                        c[K >> 2] = k;
                                        c[L + 12 >> 2] = k;
                                        c[k + 8 >> 2] = L;
                                        c[k + 12 >> 2] = d;
                                        break;
                                    }
                                    a = g >>> 8;
                                    do
                                        if (!a)
                                            d = 0;
                                        else {
                                            if (g >>> 0 > 16777215) {
                                                d = 31;
                                                break;
                                            }
                                            K = (a + 1048320 | 0) >>> 16 & 8;
                                            L = a << K;
                                            J = (L + 520192 | 0) >>> 16 & 4;
                                            L = L << J;
                                            d = (L + 245760 | 0) >>> 16 & 2;
                                            d = 14 - (J | K | d) + (L << d >>> 15) | 0;
                                            d = g >>> (d + 7 | 0) & 1 | d << 1;
                                        }
                                    while (0);
                                    e = 21932 + (d << 2) | 0;
                                    c[k + 28 >> 2] = d;
                                    a = k + 16 | 0;
                                    c[a + 4 >> 2] = 0;
                                    c[a >> 2] = 0;
                                    a = c[5408] | 0;
                                    b = 1 << d;
                                    if (!(a & b)) {
                                        c[5408] = a | b;
                                        c[e >> 2] = k;
                                        c[k + 24 >> 2] = e;
                                        c[k + 12 >> 2] = k;
                                        c[k + 8 >> 2] = k;
                                        break;
                                    }
                                    f = g << ((d | 0) == 31 ? 0 : 25 - (d >>> 1) | 0);
                                    a = c[e >> 2] | 0;
                                    while (1) {
                                        if ((c[a + 4 >> 2] & -8 | 0) == (g | 0)) {
                                            d = a;
                                            E = 281;
                                            break;
                                        }
                                        b = a + 16 + (f >>> 31 << 2) | 0;
                                        d = c[b >> 2] | 0;
                                        if (!d) {
                                            E = 278;
                                            break;
                                        } else {
                                            f = f << 1;
                                            a = d;
                                        }
                                    }
                                    if ((E | 0) == 278)
                                        if (b >>> 0 < (c[5411] | 0) >>> 0)
                                            za();
                                        else {
                                            c[b >> 2] = k;
                                            c[k + 24 >> 2] = a;
                                            c[k + 12 >> 2] = k;
                                            c[k + 8 >> 2] = k;
                                            break;
                                        }
                                    else if ((E | 0) == 281) {
                                        a = d + 8 | 0;
                                        b = c[a >> 2] | 0;
                                        L = c[5411] | 0;
                                        if (b >>> 0 >= L >>> 0 & d >>> 0 >= L >>> 0) {
                                            c[b + 12 >> 2] = k;
                                            c[a >> 2] = k;
                                            c[k + 8 >> 2] = b;
                                            c[k + 12 >> 2] = d;
                                            c[k + 24 >> 2] = 0;
                                            break;
                                        } else
                                            za();
                                    }
                                } else {
                                    L = (c[5410] | 0) + g | 0;
                                    c[5410] = L;
                                    c[5413] = k;
                                    c[k + 4 >> 2] = L | 1;
                                }
                            while (0);
                            L = l + 8 | 0;
                            return L | 0;
                        } else
                            b = 22076;
                    while (1) {
                        a = c[b >> 2] | 0;
                        if (a >>> 0 <= i >>> 0 ? (F = a + (c[b + 4 >> 2] | 0) | 0, F >>> 0 > i >>> 0) : 0) {
                            b = F;
                            break;
                        }
                        b = c[b + 8 >> 2] | 0;
                    }
                    g = b + -47 | 0;
                    d = g + 8 | 0;
                    d = g + ((d & 7 | 0) == 0 ? 0 : 0 - d & 7) | 0;
                    g = i + 16 | 0;
                    d = d >>> 0 < g >>> 0 ? i : d;
                    a = d + 8 | 0;
                    e = h + 8 | 0;
                    e = (e & 7 | 0) == 0 ? 0 : 0 - e & 7;
                    L = h + e | 0;
                    e = f + -40 - e | 0;
                    c[5413] = L;
                    c[5410] = e;
                    c[L + 4 >> 2] = e | 1;
                    c[L + e + 4 >> 2] = 40;
                    c[5414] = c[5529];
                    e = d + 4 | 0;
                    c[e >> 2] = 27;
                    c[a >> 2] = c[5519];
                    c[a + 4 >> 2] = c[5520];
                    c[a + 8 >> 2] = c[5521];
                    c[a + 12 >> 2] = c[5522];
                    c[5519] = h;
                    c[5520] = f;
                    c[5522] = 0;
                    c[5521] = a;
                    a = d + 24 | 0;
                    do {
                        a = a + 4 | 0;
                        c[a >> 2] = 7;
                    } while ((a + 4 | 0) >>> 0 < b >>> 0);
                    if ((d | 0) != (i | 0)) {
                        h = d - i | 0;
                        c[e >> 2] = c[e >> 2] & -2;
                        c[i + 4 >> 2] = h | 1;
                        c[d >> 2] = h;
                        a = h >>> 3;
                        if (h >>> 0 < 256) {
                            d = 21668 + (a << 1 << 2) | 0;
                            b = c[5407] | 0;
                            a = 1 << a;
                            if (b & a) {
                                a = d + 8 | 0;
                                b = c[a >> 2] | 0;
                                if (b >>> 0 < (c[5411] | 0) >>> 0)
                                    za();
                                else {
                                    H = a;
                                    I = b;
                                }
                            } else {
                                c[5407] = b | a;
                                H = d + 8 | 0;
                                I = d;
                            }
                            c[H >> 2] = i;
                            c[I + 12 >> 2] = i;
                            c[i + 8 >> 2] = I;
                            c[i + 12 >> 2] = d;
                            break;
                        }
                        a = h >>> 8;
                        if (a)
                            if (h >>> 0 > 16777215)
                                d = 31;
                            else {
                                K = (a + 1048320 | 0) >>> 16 & 8;
                                L = a << K;
                                J = (L + 520192 | 0) >>> 16 & 4;
                                L = L << J;
                                d = (L + 245760 | 0) >>> 16 & 2;
                                d = 14 - (J | K | d) + (L << d >>> 15) | 0;
                                d = h >>> (d + 7 | 0) & 1 | d << 1;
                            }
                        else
                            d = 0;
                        f = 21932 + (d << 2) | 0;
                        c[i + 28 >> 2] = d;
                        c[i + 20 >> 2] = 0;
                        c[g >> 2] = 0;
                        a = c[5408] | 0;
                        b = 1 << d;
                        if (!(a & b)) {
                            c[5408] = a | b;
                            c[f >> 2] = i;
                            c[i + 24 >> 2] = f;
                            c[i + 12 >> 2] = i;
                            c[i + 8 >> 2] = i;
                            break;
                        }
                        e = h << ((d | 0) == 31 ? 0 : 25 - (d >>> 1) | 0);
                        a = c[f >> 2] | 0;
                        while (1) {
                            if ((c[a + 4 >> 2] & -8 | 0) == (h | 0)) {
                                d = a;
                                E = 307;
                                break;
                            }
                            b = a + 16 + (e >>> 31 << 2) | 0;
                            d = c[b >> 2] | 0;
                            if (!d) {
                                E = 304;
                                break;
                            } else {
                                e = e << 1;
                                a = d;
                            }
                        }
                        if ((E | 0) == 304)
                            if (b >>> 0 < (c[5411] | 0) >>> 0)
                                za();
                            else {
                                c[b >> 2] = i;
                                c[i + 24 >> 2] = a;
                                c[i + 12 >> 2] = i;
                                c[i + 8 >> 2] = i;
                                break;
                            }
                        else if ((E | 0) == 307) {
                            a = d + 8 | 0;
                            b = c[a >> 2] | 0;
                            L = c[5411] | 0;
                            if (b >>> 0 >= L >>> 0 & d >>> 0 >= L >>> 0) {
                                c[b + 12 >> 2] = i;
                                c[a >> 2] = i;
                                c[i + 8 >> 2] = b;
                                c[i + 12 >> 2] = d;
                                c[i + 24 >> 2] = 0;
                                break;
                            } else
                                za();
                        }
                    }
                } else {
                    L = c[5411] | 0;
                    if ((L | 0) == 0 | h >>> 0 < L >>> 0)
                        c[5411] = h;
                    c[5519] = h;
                    c[5520] = f;
                    c[5522] = 0;
                    c[5416] = c[5525];
                    c[5415] = -1;
                    a = 0;
                    do {
                        L = 21668 + (a << 1 << 2) | 0;
                        c[L + 12 >> 2] = L;
                        c[L + 8 >> 2] = L;
                        a = a + 1 | 0;
                    } while ((a | 0) != 32);
                    L = h + 8 | 0;
                    L = (L & 7 | 0) == 0 ? 0 : 0 - L & 7;
                    K = h + L | 0;
                    L = f + -40 - L | 0;
                    c[5413] = K;
                    c[5410] = L;
                    c[K + 4 >> 2] = L | 1;
                    c[K + L + 4 >> 2] = 40;
                    c[5414] = c[5529];
                }
            while (0);
            a = c[5410] | 0;
            if (a >>> 0 > o >>> 0) {
                J = a - o | 0;
                c[5410] = J;
                L = c[5413] | 0;
                K = L + o | 0;
                c[5413] = K;
                c[K + 4 >> 2] = J | 1;
                c[L + 4 >> 2] = o | 3;
                L = L + 8 | 0;
                return L | 0;
            }
        }
        c[(hd() | 0) >> 2] = 12;
        L = 0;
        return L | 0;
    }
    function se(a) {
        a = a | 0;
        var b = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0;
        if (!a)
            return;
        d = a + -8 | 0;
        h = c[5411] | 0;
        if (d >>> 0 < h >>> 0)
            za();
        a = c[a + -4 >> 2] | 0;
        b = a & 3;
        if ((b | 0) == 1)
            za();
        e = a & -8;
        m = d + e | 0;
        do
            if (!(a & 1)) {
                a = c[d >> 2] | 0;
                if (!b)
                    return;
                k = d + (0 - a) | 0;
                j = a + e | 0;
                if (k >>> 0 < h >>> 0)
                    za();
                if ((k | 0) == (c[5412] | 0)) {
                    a = m + 4 | 0;
                    b = c[a >> 2] | 0;
                    if ((b & 3 | 0) != 3) {
                        q = k;
                        g = j;
                        break;
                    }
                    c[5409] = j;
                    c[a >> 2] = b & -2;
                    c[k + 4 >> 2] = j | 1;
                    c[k + j >> 2] = j;
                    return;
                }
                e = a >>> 3;
                if (a >>> 0 < 256) {
                    b = c[k + 8 >> 2] | 0;
                    d = c[k + 12 >> 2] | 0;
                    a = 21668 + (e << 1 << 2) | 0;
                    if ((b | 0) != (a | 0)) {
                        if (b >>> 0 < h >>> 0)
                            za();
                        if ((c[b + 12 >> 2] | 0) != (k | 0))
                            za();
                    }
                    if ((d | 0) == (b | 0)) {
                        c[5407] = c[5407] & ~(1 << e);
                        q = k;
                        g = j;
                        break;
                    }
                    if ((d | 0) != (a | 0)) {
                        if (d >>> 0 < h >>> 0)
                            za();
                        a = d + 8 | 0;
                        if ((c[a >> 2] | 0) == (k | 0))
                            f = a;
                        else
                            za();
                    } else
                        f = d + 8 | 0;
                    c[b + 12 >> 2] = d;
                    c[f >> 2] = b;
                    q = k;
                    g = j;
                    break;
                }
                f = c[k + 24 >> 2] | 0;
                d = c[k + 12 >> 2] | 0;
                do
                    if ((d | 0) == (k | 0)) {
                        b = k + 16 | 0;
                        d = b + 4 | 0;
                        a = c[d >> 2] | 0;
                        if (!a) {
                            a = c[b >> 2] | 0;
                            if (!a) {
                                i = 0;
                                break;
                            }
                        } else
                            b = d;
                        while (1) {
                            d = a + 20 | 0;
                            e = c[d >> 2] | 0;
                            if (e | 0) {
                                a = e;
                                b = d;
                                continue;
                            }
                            d = a + 16 | 0;
                            e = c[d >> 2] | 0;
                            if (!e)
                                break;
                            else {
                                a = e;
                                b = d;
                            }
                        }
                        if (b >>> 0 < h >>> 0)
                            za();
                        else {
                            c[b >> 2] = 0;
                            i = a;
                            break;
                        }
                    } else {
                        e = c[k + 8 >> 2] | 0;
                        if (e >>> 0 < h >>> 0)
                            za();
                        a = e + 12 | 0;
                        if ((c[a >> 2] | 0) != (k | 0))
                            za();
                        b = d + 8 | 0;
                        if ((c[b >> 2] | 0) == (k | 0)) {
                            c[a >> 2] = d;
                            c[b >> 2] = e;
                            i = d;
                            break;
                        } else
                            za();
                    }
                while (0);
                if (f) {
                    a = c[k + 28 >> 2] | 0;
                    b = 21932 + (a << 2) | 0;
                    if ((k | 0) == (c[b >> 2] | 0)) {
                        c[b >> 2] = i;
                        if (!i) {
                            c[5408] = c[5408] & ~(1 << a);
                            q = k;
                            g = j;
                            break;
                        }
                    } else {
                        if (f >>> 0 < (c[5411] | 0) >>> 0)
                            za();
                        a = f + 16 | 0;
                        if ((c[a >> 2] | 0) == (k | 0))
                            c[a >> 2] = i;
                        else
                            c[f + 20 >> 2] = i;
                        if (!i) {
                            q = k;
                            g = j;
                            break;
                        }
                    }
                    d = c[5411] | 0;
                    if (i >>> 0 < d >>> 0)
                        za();
                    c[i + 24 >> 2] = f;
                    a = k + 16 | 0;
                    b = c[a >> 2] | 0;
                    do
                        if (b | 0)
                            if (b >>> 0 < d >>> 0)
                                za();
                            else {
                                c[i + 16 >> 2] = b;
                                c[b + 24 >> 2] = i;
                                break;
                            }
                    while (0);
                    a = c[a + 4 >> 2] | 0;
                    if (a)
                        if (a >>> 0 < (c[5411] | 0) >>> 0)
                            za();
                        else {
                            c[i + 20 >> 2] = a;
                            c[a + 24 >> 2] = i;
                            q = k;
                            g = j;
                            break;
                        }
                    else {
                        q = k;
                        g = j;
                    }
                } else {
                    q = k;
                    g = j;
                }
            } else {
                q = d;
                g = e;
            }
        while (0);
        if (q >>> 0 >= m >>> 0)
            za();
        a = m + 4 | 0;
        b = c[a >> 2] | 0;
        if (!(b & 1))
            za();
        if (!(b & 2)) {
            if ((m | 0) == (c[5413] | 0)) {
                p = (c[5410] | 0) + g | 0;
                c[5410] = p;
                c[5413] = q;
                c[q + 4 >> 2] = p | 1;
                if ((q | 0) != (c[5412] | 0))
                    return;
                c[5412] = 0;
                c[5409] = 0;
                return;
            }
            if ((m | 0) == (c[5412] | 0)) {
                p = (c[5409] | 0) + g | 0;
                c[5409] = p;
                c[5412] = q;
                c[q + 4 >> 2] = p | 1;
                c[q + p >> 2] = p;
                return;
            }
            g = (b & -8) + g | 0;
            e = b >>> 3;
            do
                if (b >>> 0 >= 256) {
                    f = c[m + 24 >> 2] | 0;
                    a = c[m + 12 >> 2] | 0;
                    do
                        if ((a | 0) == (m | 0)) {
                            b = m + 16 | 0;
                            d = b + 4 | 0;
                            a = c[d >> 2] | 0;
                            if (!a) {
                                a = c[b >> 2] | 0;
                                if (!a) {
                                    n = 0;
                                    break;
                                }
                            } else
                                b = d;
                            while (1) {
                                d = a + 20 | 0;
                                e = c[d >> 2] | 0;
                                if (e | 0) {
                                    a = e;
                                    b = d;
                                    continue;
                                }
                                d = a + 16 | 0;
                                e = c[d >> 2] | 0;
                                if (!e)
                                    break;
                                else {
                                    a = e;
                                    b = d;
                                }
                            }
                            if (b >>> 0 < (c[5411] | 0) >>> 0)
                                za();
                            else {
                                c[b >> 2] = 0;
                                n = a;
                                break;
                            }
                        } else {
                            b = c[m + 8 >> 2] | 0;
                            if (b >>> 0 < (c[5411] | 0) >>> 0)
                                za();
                            d = b + 12 | 0;
                            if ((c[d >> 2] | 0) != (m | 0))
                                za();
                            e = a + 8 | 0;
                            if ((c[e >> 2] | 0) == (m | 0)) {
                                c[d >> 2] = a;
                                c[e >> 2] = b;
                                n = a;
                                break;
                            } else
                                za();
                        }
                    while (0);
                    if (f | 0) {
                        a = c[m + 28 >> 2] | 0;
                        b = 21932 + (a << 2) | 0;
                        if ((m | 0) == (c[b >> 2] | 0)) {
                            c[b >> 2] = n;
                            if (!n) {
                                c[5408] = c[5408] & ~(1 << a);
                                break;
                            }
                        } else {
                            if (f >>> 0 < (c[5411] | 0) >>> 0)
                                za();
                            a = f + 16 | 0;
                            if ((c[a >> 2] | 0) == (m | 0))
                                c[a >> 2] = n;
                            else
                                c[f + 20 >> 2] = n;
                            if (!n)
                                break;
                        }
                        d = c[5411] | 0;
                        if (n >>> 0 < d >>> 0)
                            za();
                        c[n + 24 >> 2] = f;
                        a = m + 16 | 0;
                        b = c[a >> 2] | 0;
                        do
                            if (b | 0)
                                if (b >>> 0 < d >>> 0)
                                    za();
                                else {
                                    c[n + 16 >> 2] = b;
                                    c[b + 24 >> 2] = n;
                                    break;
                                }
                        while (0);
                        a = c[a + 4 >> 2] | 0;
                        if (a | 0)
                            if (a >>> 0 < (c[5411] | 0) >>> 0)
                                za();
                            else {
                                c[n + 20 >> 2] = a;
                                c[a + 24 >> 2] = n;
                                break;
                            }
                    }
                } else {
                    b = c[m + 8 >> 2] | 0;
                    d = c[m + 12 >> 2] | 0;
                    a = 21668 + (e << 1 << 2) | 0;
                    if ((b | 0) != (a | 0)) {
                        if (b >>> 0 < (c[5411] | 0) >>> 0)
                            za();
                        if ((c[b + 12 >> 2] | 0) != (m | 0))
                            za();
                    }
                    if ((d | 0) == (b | 0)) {
                        c[5407] = c[5407] & ~(1 << e);
                        break;
                    }
                    if ((d | 0) != (a | 0)) {
                        if (d >>> 0 < (c[5411] | 0) >>> 0)
                            za();
                        a = d + 8 | 0;
                        if ((c[a >> 2] | 0) == (m | 0))
                            l = a;
                        else
                            za();
                    } else
                        l = d + 8 | 0;
                    c[b + 12 >> 2] = d;
                    c[l >> 2] = b;
                }
            while (0);
            c[q + 4 >> 2] = g | 1;
            c[q + g >> 2] = g;
            if ((q | 0) == (c[5412] | 0)) {
                c[5409] = g;
                return;
            }
        } else {
            c[a >> 2] = b & -2;
            c[q + 4 >> 2] = g | 1;
            c[q + g >> 2] = g;
        }
        a = g >>> 3;
        if (g >>> 0 < 256) {
            d = 21668 + (a << 1 << 2) | 0;
            b = c[5407] | 0;
            a = 1 << a;
            if (b & a) {
                a = d + 8 | 0;
                b = c[a >> 2] | 0;
                if (b >>> 0 < (c[5411] | 0) >>> 0)
                    za();
                else {
                    o = a;
                    p = b;
                }
            } else {
                c[5407] = b | a;
                o = d + 8 | 0;
                p = d;
            }
            c[o >> 2] = q;
            c[p + 12 >> 2] = q;
            c[q + 8 >> 2] = p;
            c[q + 12 >> 2] = d;
            return;
        }
        a = g >>> 8;
        if (a)
            if (g >>> 0 > 16777215)
                d = 31;
            else {
                o = (a + 1048320 | 0) >>> 16 & 8;
                p = a << o;
                n = (p + 520192 | 0) >>> 16 & 4;
                p = p << n;
                d = (p + 245760 | 0) >>> 16 & 2;
                d = 14 - (n | o | d) + (p << d >>> 15) | 0;
                d = g >>> (d + 7 | 0) & 1 | d << 1;
            }
        else
            d = 0;
        e = 21932 + (d << 2) | 0;
        c[q + 28 >> 2] = d;
        c[q + 20 >> 2] = 0;
        c[q + 16 >> 2] = 0;
        a = c[5408] | 0;
        b = 1 << d;
        do
            if (a & b) {
                f = g << ((d | 0) == 31 ? 0 : 25 - (d >>> 1) | 0);
                a = c[e >> 2] | 0;
                while (1) {
                    if ((c[a + 4 >> 2] & -8 | 0) == (g | 0)) {
                        d = a;
                        e = 130;
                        break;
                    }
                    b = a + 16 + (f >>> 31 << 2) | 0;
                    d = c[b >> 2] | 0;
                    if (!d) {
                        e = 127;
                        break;
                    } else {
                        f = f << 1;
                        a = d;
                    }
                }
                if ((e | 0) == 127)
                    if (b >>> 0 < (c[5411] | 0) >>> 0)
                        za();
                    else {
                        c[b >> 2] = q;
                        c[q + 24 >> 2] = a;
                        c[q + 12 >> 2] = q;
                        c[q + 8 >> 2] = q;
                        break;
                    }
                else if ((e | 0) == 130) {
                    a = d + 8 | 0;
                    b = c[a >> 2] | 0;
                    p = c[5411] | 0;
                    if (b >>> 0 >= p >>> 0 & d >>> 0 >= p >>> 0) {
                        c[b + 12 >> 2] = q;
                        c[a >> 2] = q;
                        c[q + 8 >> 2] = b;
                        c[q + 12 >> 2] = d;
                        c[q + 24 >> 2] = 0;
                        break;
                    } else
                        za();
                }
            } else {
                c[5408] = a | b;
                c[e >> 2] = q;
                c[q + 24 >> 2] = e;
                c[q + 12 >> 2] = q;
                c[q + 8 >> 2] = q;
            }
        while (0);
        q = (c[5415] | 0) + -1 | 0;
        c[5415] = q;
        if (!q)
            a = 22084;
        else
            return;
        while (1) {
            a = c[a >> 2] | 0;
            if (!a)
                break;
            else
                a = a + 8 | 0;
        }
        c[5415] = -1;
        return;
    }
    function te(a, b) {
        a = a | 0;
        b = b | 0;
        var d = 0, e = 0;
        if (!a) {
            a = re(b) | 0;
            return a | 0;
        }
        if (b >>> 0 > 4294967231) {
            c[(hd() | 0) >> 2] = 12;
            a = 0;
            return a | 0;
        }
        d = ue(a + -8 | 0, b >>> 0 < 11 ? 16 : b + 11 & -8) | 0;
        if (d | 0) {
            a = d + 8 | 0;
            return a | 0;
        }
        d = re(b) | 0;
        if (!d) {
            a = 0;
            return a | 0;
        }
        e = c[a + -4 >> 2] | 0;
        e = (e & -8) - ((e & 3 | 0) == 0 ? 8 : 4) | 0;
        Ce(d | 0, a | 0, (e >>> 0 < b >>> 0 ? e : b) | 0) | 0;
        se(a);
        a = d;
        return a | 0;
    }
    function ue(a, b) {
        a = a | 0;
        b = b | 0;
        var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0;
        n = a + 4 | 0;
        o = c[n >> 2] | 0;
        d = o & -8;
        k = a + d | 0;
        i = c[5411] | 0;
        e = o & 3;
        if (!((e | 0) != 1 & a >>> 0 >= i >>> 0 & a >>> 0 < k >>> 0))
            za();
        f = c[k + 4 >> 2] | 0;
        if (!(f & 1))
            za();
        if (!e) {
            if (b >>> 0 < 256) {
                a = 0;
                return a | 0;
            }
            if (d >>> 0 >= (b + 4 | 0) >>> 0 ? (d - b | 0) >>> 0 <= c[5527] << 1 >>> 0 : 0)
                return a | 0;
            a = 0;
            return a | 0;
        }
        if (d >>> 0 >= b >>> 0) {
            d = d - b | 0;
            if (d >>> 0 <= 15)
                return a | 0;
            m = a + b | 0;
            c[n >> 2] = o & 1 | b | 2;
            c[m + 4 >> 2] = d | 3;
            b = m + d + 4 | 0;
            c[b >> 2] = c[b >> 2] | 1;
            ve(m, d);
            return a | 0;
        }
        if ((k | 0) == (c[5413] | 0)) {
            d = (c[5410] | 0) + d | 0;
            if (d >>> 0 <= b >>> 0) {
                a = 0;
                return a | 0;
            }
            m = d - b | 0;
            l = a + b | 0;
            c[n >> 2] = o & 1 | b | 2;
            c[l + 4 >> 2] = m | 1;
            c[5413] = l;
            c[5410] = m;
            return a | 0;
        }
        if ((k | 0) == (c[5412] | 0)) {
            e = (c[5409] | 0) + d | 0;
            if (e >>> 0 < b >>> 0) {
                a = 0;
                return a | 0;
            }
            d = e - b | 0;
            if (d >>> 0 > 15) {
                e = a + b | 0;
                m = e + d | 0;
                c[n >> 2] = o & 1 | b | 2;
                c[e + 4 >> 2] = d | 1;
                c[m >> 2] = d;
                b = m + 4 | 0;
                c[b >> 2] = c[b >> 2] & -2;
            } else {
                c[n >> 2] = o & 1 | e | 2;
                e = a + e + 4 | 0;
                c[e >> 2] = c[e >> 2] | 1;
                e = 0;
                d = 0;
            }
            c[5409] = d;
            c[5412] = e;
            return a | 0;
        }
        if (f & 2 | 0) {
            a = 0;
            return a | 0;
        }
        l = (f & -8) + d | 0;
        if (l >>> 0 < b >>> 0) {
            a = 0;
            return a | 0;
        }
        m = l - b | 0;
        g = f >>> 3;
        do
            if (f >>> 0 >= 256) {
                h = c[k + 24 >> 2] | 0;
                f = c[k + 12 >> 2] | 0;
                do
                    if ((f | 0) == (k | 0)) {
                        e = k + 16 | 0;
                        f = e + 4 | 0;
                        d = c[f >> 2] | 0;
                        if (!d) {
                            d = c[e >> 2] | 0;
                            if (!d) {
                                j = 0;
                                break;
                            }
                        } else
                            e = f;
                        while (1) {
                            f = d + 20 | 0;
                            g = c[f >> 2] | 0;
                            if (g | 0) {
                                d = g;
                                e = f;
                                continue;
                            }
                            f = d + 16 | 0;
                            g = c[f >> 2] | 0;
                            if (!g)
                                break;
                            else {
                                d = g;
                                e = f;
                            }
                        }
                        if (e >>> 0 < i >>> 0)
                            za();
                        else {
                            c[e >> 2] = 0;
                            j = d;
                            break;
                        }
                    } else {
                        g = c[k + 8 >> 2] | 0;
                        if (g >>> 0 < i >>> 0)
                            za();
                        d = g + 12 | 0;
                        if ((c[d >> 2] | 0) != (k | 0))
                            za();
                        e = f + 8 | 0;
                        if ((c[e >> 2] | 0) == (k | 0)) {
                            c[d >> 2] = f;
                            c[e >> 2] = g;
                            j = f;
                            break;
                        } else
                            za();
                    }
                while (0);
                if (h | 0) {
                    d = c[k + 28 >> 2] | 0;
                    e = 21932 + (d << 2) | 0;
                    if ((k | 0) == (c[e >> 2] | 0)) {
                        c[e >> 2] = j;
                        if (!j) {
                            c[5408] = c[5408] & ~(1 << d);
                            break;
                        }
                    } else {
                        if (h >>> 0 < (c[5411] | 0) >>> 0)
                            za();
                        d = h + 16 | 0;
                        if ((c[d >> 2] | 0) == (k | 0))
                            c[d >> 2] = j;
                        else
                            c[h + 20 >> 2] = j;
                        if (!j)
                            break;
                    }
                    f = c[5411] | 0;
                    if (j >>> 0 < f >>> 0)
                        za();
                    c[j + 24 >> 2] = h;
                    d = k + 16 | 0;
                    e = c[d >> 2] | 0;
                    do
                        if (e | 0)
                            if (e >>> 0 < f >>> 0)
                                za();
                            else {
                                c[j + 16 >> 2] = e;
                                c[e + 24 >> 2] = j;
                                break;
                            }
                    while (0);
                    d = c[d + 4 >> 2] | 0;
                    if (d | 0)
                        if (d >>> 0 < (c[5411] | 0) >>> 0)
                            za();
                        else {
                            c[j + 20 >> 2] = d;
                            c[d + 24 >> 2] = j;
                            break;
                        }
                }
            } else {
                e = c[k + 8 >> 2] | 0;
                f = c[k + 12 >> 2] | 0;
                d = 21668 + (g << 1 << 2) | 0;
                if ((e | 0) != (d | 0)) {
                    if (e >>> 0 < i >>> 0)
                        za();
                    if ((c[e + 12 >> 2] | 0) != (k | 0))
                        za();
                }
                if ((f | 0) == (e | 0)) {
                    c[5407] = c[5407] & ~(1 << g);
                    break;
                }
                if ((f | 0) != (d | 0)) {
                    if (f >>> 0 < i >>> 0)
                        za();
                    d = f + 8 | 0;
                    if ((c[d >> 2] | 0) == (k | 0))
                        h = d;
                    else
                        za();
                } else
                    h = f + 8 | 0;
                c[e + 12 >> 2] = f;
                c[h >> 2] = e;
            }
        while (0);
        if (m >>> 0 < 16) {
            c[n >> 2] = l | o & 1 | 2;
            b = a + l + 4 | 0;
            c[b >> 2] = c[b >> 2] | 1;
            return a | 0;
        } else {
            l = a + b | 0;
            c[n >> 2] = o & 1 | b | 2;
            c[l + 4 >> 2] = m | 3;
            b = l + m + 4 | 0;
            c[b >> 2] = c[b >> 2] | 1;
            ve(l, m);
            return a | 0;
        }
        return 0;
    }
    function ve(a, b) {
        a = a | 0;
        b = b | 0;
        var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0;
        o = a + b | 0;
        d = c[a + 4 >> 2] | 0;
        do
            if (!(d & 1)) {
                f = c[a >> 2] | 0;
                if (!(d & 3))
                    return;
                l = a + (0 - f) | 0;
                k = f + b | 0;
                i = c[5411] | 0;
                if (l >>> 0 < i >>> 0)
                    za();
                if ((l | 0) == (c[5412] | 0)) {
                    a = o + 4 | 0;
                    d = c[a >> 2] | 0;
                    if ((d & 3 | 0) != 3) {
                        r = l;
                        g = k;
                        break;
                    }
                    c[5409] = k;
                    c[a >> 2] = d & -2;
                    c[l + 4 >> 2] = k | 1;
                    c[l + k >> 2] = k;
                    return;
                }
                e = f >>> 3;
                if (f >>> 0 < 256) {
                    a = c[l + 8 >> 2] | 0;
                    b = c[l + 12 >> 2] | 0;
                    d = 21668 + (e << 1 << 2) | 0;
                    if ((a | 0) != (d | 0)) {
                        if (a >>> 0 < i >>> 0)
                            za();
                        if ((c[a + 12 >> 2] | 0) != (l | 0))
                            za();
                    }
                    if ((b | 0) == (a | 0)) {
                        c[5407] = c[5407] & ~(1 << e);
                        r = l;
                        g = k;
                        break;
                    }
                    if ((b | 0) != (d | 0)) {
                        if (b >>> 0 < i >>> 0)
                            za();
                        d = b + 8 | 0;
                        if ((c[d >> 2] | 0) == (l | 0))
                            h = d;
                        else
                            za();
                    } else
                        h = b + 8 | 0;
                    c[a + 12 >> 2] = b;
                    c[h >> 2] = a;
                    r = l;
                    g = k;
                    break;
                }
                f = c[l + 24 >> 2] | 0;
                b = c[l + 12 >> 2] | 0;
                do
                    if ((b | 0) == (l | 0)) {
                        a = l + 16 | 0;
                        b = a + 4 | 0;
                        d = c[b >> 2] | 0;
                        if (!d) {
                            d = c[a >> 2] | 0;
                            if (!d) {
                                j = 0;
                                break;
                            }
                        } else
                            a = b;
                        while (1) {
                            b = d + 20 | 0;
                            e = c[b >> 2] | 0;
                            if (e | 0) {
                                d = e;
                                a = b;
                                continue;
                            }
                            b = d + 16 | 0;
                            e = c[b >> 2] | 0;
                            if (!e)
                                break;
                            else {
                                d = e;
                                a = b;
                            }
                        }
                        if (a >>> 0 < i >>> 0)
                            za();
                        else {
                            c[a >> 2] = 0;
                            j = d;
                            break;
                        }
                    } else {
                        e = c[l + 8 >> 2] | 0;
                        if (e >>> 0 < i >>> 0)
                            za();
                        d = e + 12 | 0;
                        if ((c[d >> 2] | 0) != (l | 0))
                            za();
                        a = b + 8 | 0;
                        if ((c[a >> 2] | 0) == (l | 0)) {
                            c[d >> 2] = b;
                            c[a >> 2] = e;
                            j = b;
                            break;
                        } else
                            za();
                    }
                while (0);
                if (f) {
                    d = c[l + 28 >> 2] | 0;
                    a = 21932 + (d << 2) | 0;
                    if ((l | 0) == (c[a >> 2] | 0)) {
                        c[a >> 2] = j;
                        if (!j) {
                            c[5408] = c[5408] & ~(1 << d);
                            r = l;
                            g = k;
                            break;
                        }
                    } else {
                        if (f >>> 0 < (c[5411] | 0) >>> 0)
                            za();
                        d = f + 16 | 0;
                        if ((c[d >> 2] | 0) == (l | 0))
                            c[d >> 2] = j;
                        else
                            c[f + 20 >> 2] = j;
                        if (!j) {
                            r = l;
                            g = k;
                            break;
                        }
                    }
                    b = c[5411] | 0;
                    if (j >>> 0 < b >>> 0)
                        za();
                    c[j + 24 >> 2] = f;
                    d = l + 16 | 0;
                    a = c[d >> 2] | 0;
                    do
                        if (a | 0)
                            if (a >>> 0 < b >>> 0)
                                za();
                            else {
                                c[j + 16 >> 2] = a;
                                c[a + 24 >> 2] = j;
                                break;
                            }
                    while (0);
                    d = c[d + 4 >> 2] | 0;
                    if (d)
                        if (d >>> 0 < (c[5411] | 0) >>> 0)
                            za();
                        else {
                            c[j + 20 >> 2] = d;
                            c[d + 24 >> 2] = j;
                            r = l;
                            g = k;
                            break;
                        }
                    else {
                        r = l;
                        g = k;
                    }
                } else {
                    r = l;
                    g = k;
                }
            } else {
                r = a;
                g = b;
            }
        while (0);
        h = c[5411] | 0;
        if (o >>> 0 < h >>> 0)
            za();
        d = o + 4 | 0;
        a = c[d >> 2] | 0;
        if (!(a & 2)) {
            if ((o | 0) == (c[5413] | 0)) {
                q = (c[5410] | 0) + g | 0;
                c[5410] = q;
                c[5413] = r;
                c[r + 4 >> 2] = q | 1;
                if ((r | 0) != (c[5412] | 0))
                    return;
                c[5412] = 0;
                c[5409] = 0;
                return;
            }
            if ((o | 0) == (c[5412] | 0)) {
                q = (c[5409] | 0) + g | 0;
                c[5409] = q;
                c[5412] = r;
                c[r + 4 >> 2] = q | 1;
                c[r + q >> 2] = q;
                return;
            }
            g = (a & -8) + g | 0;
            e = a >>> 3;
            do
                if (a >>> 0 >= 256) {
                    f = c[o + 24 >> 2] | 0;
                    b = c[o + 12 >> 2] | 0;
                    do
                        if ((b | 0) == (o | 0)) {
                            a = o + 16 | 0;
                            b = a + 4 | 0;
                            d = c[b >> 2] | 0;
                            if (!d) {
                                d = c[a >> 2] | 0;
                                if (!d) {
                                    n = 0;
                                    break;
                                }
                            } else
                                a = b;
                            while (1) {
                                b = d + 20 | 0;
                                e = c[b >> 2] | 0;
                                if (e | 0) {
                                    d = e;
                                    a = b;
                                    continue;
                                }
                                b = d + 16 | 0;
                                e = c[b >> 2] | 0;
                                if (!e)
                                    break;
                                else {
                                    d = e;
                                    a = b;
                                }
                            }
                            if (a >>> 0 < h >>> 0)
                                za();
                            else {
                                c[a >> 2] = 0;
                                n = d;
                                break;
                            }
                        } else {
                            e = c[o + 8 >> 2] | 0;
                            if (e >>> 0 < h >>> 0)
                                za();
                            d = e + 12 | 0;
                            if ((c[d >> 2] | 0) != (o | 0))
                                za();
                            a = b + 8 | 0;
                            if ((c[a >> 2] | 0) == (o | 0)) {
                                c[d >> 2] = b;
                                c[a >> 2] = e;
                                n = b;
                                break;
                            } else
                                za();
                        }
                    while (0);
                    if (f | 0) {
                        d = c[o + 28 >> 2] | 0;
                        a = 21932 + (d << 2) | 0;
                        if ((o | 0) == (c[a >> 2] | 0)) {
                            c[a >> 2] = n;
                            if (!n) {
                                c[5408] = c[5408] & ~(1 << d);
                                break;
                            }
                        } else {
                            if (f >>> 0 < (c[5411] | 0) >>> 0)
                                za();
                            d = f + 16 | 0;
                            if ((c[d >> 2] | 0) == (o | 0))
                                c[d >> 2] = n;
                            else
                                c[f + 20 >> 2] = n;
                            if (!n)
                                break;
                        }
                        b = c[5411] | 0;
                        if (n >>> 0 < b >>> 0)
                            za();
                        c[n + 24 >> 2] = f;
                        d = o + 16 | 0;
                        a = c[d >> 2] | 0;
                        do
                            if (a | 0)
                                if (a >>> 0 < b >>> 0)
                                    za();
                                else {
                                    c[n + 16 >> 2] = a;
                                    c[a + 24 >> 2] = n;
                                    break;
                                }
                        while (0);
                        d = c[d + 4 >> 2] | 0;
                        if (d | 0)
                            if (d >>> 0 < (c[5411] | 0) >>> 0)
                                za();
                            else {
                                c[n + 20 >> 2] = d;
                                c[d + 24 >> 2] = n;
                                break;
                            }
                    }
                } else {
                    a = c[o + 8 >> 2] | 0;
                    b = c[o + 12 >> 2] | 0;
                    d = 21668 + (e << 1 << 2) | 0;
                    if ((a | 0) != (d | 0)) {
                        if (a >>> 0 < h >>> 0)
                            za();
                        if ((c[a + 12 >> 2] | 0) != (o | 0))
                            za();
                    }
                    if ((b | 0) == (a | 0)) {
                        c[5407] = c[5407] & ~(1 << e);
                        break;
                    }
                    if ((b | 0) != (d | 0)) {
                        if (b >>> 0 < h >>> 0)
                            za();
                        d = b + 8 | 0;
                        if ((c[d >> 2] | 0) == (o | 0))
                            m = d;
                        else
                            za();
                    } else
                        m = b + 8 | 0;
                    c[a + 12 >> 2] = b;
                    c[m >> 2] = a;
                }
            while (0);
            c[r + 4 >> 2] = g | 1;
            c[r + g >> 2] = g;
            if ((r | 0) == (c[5412] | 0)) {
                c[5409] = g;
                return;
            }
        } else {
            c[d >> 2] = a & -2;
            c[r + 4 >> 2] = g | 1;
            c[r + g >> 2] = g;
        }
        d = g >>> 3;
        if (g >>> 0 < 256) {
            b = 21668 + (d << 1 << 2) | 0;
            a = c[5407] | 0;
            d = 1 << d;
            if (a & d) {
                d = b + 8 | 0;
                a = c[d >> 2] | 0;
                if (a >>> 0 < (c[5411] | 0) >>> 0)
                    za();
                else {
                    p = d;
                    q = a;
                }
            } else {
                c[5407] = a | d;
                p = b + 8 | 0;
                q = b;
            }
            c[p >> 2] = r;
            c[q + 12 >> 2] = r;
            c[r + 8 >> 2] = q;
            c[r + 12 >> 2] = b;
            return;
        }
        d = g >>> 8;
        if (d)
            if (g >>> 0 > 16777215)
                b = 31;
            else {
                p = (d + 1048320 | 0) >>> 16 & 8;
                q = d << p;
                o = (q + 520192 | 0) >>> 16 & 4;
                q = q << o;
                b = (q + 245760 | 0) >>> 16 & 2;
                b = 14 - (o | p | b) + (q << b >>> 15) | 0;
                b = g >>> (b + 7 | 0) & 1 | b << 1;
            }
        else
            b = 0;
        e = 21932 + (b << 2) | 0;
        c[r + 28 >> 2] = b;
        c[r + 20 >> 2] = 0;
        c[r + 16 >> 2] = 0;
        d = c[5408] | 0;
        a = 1 << b;
        if (!(d & a)) {
            c[5408] = d | a;
            c[e >> 2] = r;
            c[r + 24 >> 2] = e;
            c[r + 12 >> 2] = r;
            c[r + 8 >> 2] = r;
            return;
        }
        f = g << ((b | 0) == 31 ? 0 : 25 - (b >>> 1) | 0);
        d = c[e >> 2] | 0;
        while (1) {
            if ((c[d + 4 >> 2] & -8 | 0) == (g | 0)) {
                b = d;
                e = 127;
                break;
            }
            a = d + 16 + (f >>> 31 << 2) | 0;
            b = c[a >> 2] | 0;
            if (!b) {
                e = 124;
                break;
            } else {
                f = f << 1;
                d = b;
            }
        }
        if ((e | 0) == 124) {
            if (a >>> 0 < (c[5411] | 0) >>> 0)
                za();
            c[a >> 2] = r;
            c[r + 24 >> 2] = d;
            c[r + 12 >> 2] = r;
            c[r + 8 >> 2] = r;
            return;
        } else if ((e | 0) == 127) {
            d = b + 8 | 0;
            a = c[d >> 2] | 0;
            q = c[5411] | 0;
            if (!(a >>> 0 >= q >>> 0 & b >>> 0 >= q >>> 0))
                za();
            c[a + 12 >> 2] = r;
            c[d >> 2] = r;
            c[r + 8 >> 2] = a;
            c[r + 12 >> 2] = b;
            c[r + 24 >> 2] = 0;
            return;
        }
    }
    function we() {
    }
    function xe(a, b, c, d) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        d = d | 0;
        d = b - d - (c >>> 0 > a >>> 0 | 0) >>> 0;
        return (C = d, a - c >>> 0 | 0) | 0;
    }
    function ye(b, d, e) {
        b = b | 0;
        d = d | 0;
        e = e | 0;
        var f = 0, g = 0, h = 0, i = 0;
        f = b + e | 0;
        if ((e | 0) >= 20) {
            d = d & 255;
            h = b & 3;
            i = d | d << 8 | d << 16 | d << 24;
            g = f & ~3;
            if (h) {
                h = b + 4 - h | 0;
                while ((b | 0) < (h | 0)) {
                    a[b >> 0] = d;
                    b = b + 1 | 0;
                }
            }
            while ((b | 0) < (g | 0)) {
                c[b >> 2] = i;
                b = b + 4 | 0;
            }
        }
        while ((b | 0) < (f | 0)) {
            a[b >> 0] = d;
            b = b + 1 | 0;
        }
        return b - e | 0;
    }
    function ze(a, b, c) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        if ((c | 0) < 32) {
            C = b >>> c;
            return a >>> c | (b & (1 << c) - 1) << 32 - c;
        }
        C = 0;
        return b >>> c - 32 | 0;
    }
    function Ae(a, b, c) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        if ((c | 0) < 32) {
            C = b << c | (a & (1 << c) - 1 << 32 - c) >>> 32 - c;
            return a << c;
        }
        C = a << c - 32;
        return 0;
    }
    function Be(a, b, c, d) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        d = d | 0;
        c = a + c >>> 0;
        return (C = b + d + (c >>> 0 < a >>> 0 | 0) >>> 0, c | 0) | 0;
    }
    function Ce(b, d, e) {
        b = b | 0;
        d = d | 0;
        e = e | 0;
        var f = 0;
        if ((e | 0) >= 4096)
            return qa(b | 0, d | 0, e | 0) | 0;
        f = b | 0;
        if ((b & 3) == (d & 3)) {
            while (b & 3) {
                if (!e)
                    return f | 0;
                a[b >> 0] = a[d >> 0] | 0;
                b = b + 1 | 0;
                d = d + 1 | 0;
                e = e - 1 | 0;
            }
            while ((e | 0) >= 4) {
                c[b >> 2] = c[d >> 2];
                b = b + 4 | 0;
                d = d + 4 | 0;
                e = e - 4 | 0;
            }
        }
        while ((e | 0) > 0) {
            a[b >> 0] = a[d >> 0] | 0;
            b = b + 1 | 0;
            d = d + 1 | 0;
            e = e - 1 | 0;
        }
        return f | 0;
    }
    function De(a, b, c) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        if ((c | 0) < 32) {
            C = b >> c;
            return a >>> c | (b & (1 << c) - 1) << 32 - c;
        }
        C = (b | 0) < 0 ? -1 : 0;
        return b >> c - 32 | 0;
    }
    function Ee(b) {
        b = b | 0;
        var c = 0;
        c = a[m + (b & 255) >> 0] | 0;
        if ((c | 0) < 8)
            return c | 0;
        c = a[m + (b >> 8 & 255) >> 0] | 0;
        if ((c | 0) < 8)
            return c + 8 | 0;
        c = a[m + (b >> 16 & 255) >> 0] | 0;
        if ((c | 0) < 8)
            return c + 16 | 0;
        return (a[m + (b >>> 24) >> 0] | 0) + 24 | 0;
    }
    function Fe(a, b) {
        a = a | 0;
        b = b | 0;
        var c = 0, d = 0, e = 0, f = 0;
        f = a & 65535;
        e = b & 65535;
        c = _(e, f) | 0;
        d = a >>> 16;
        a = (c >>> 16) + (_(e, d) | 0) | 0;
        e = b >>> 16;
        b = _(e, f) | 0;
        return (C = (a >>> 16) + (_(e, d) | 0) + (((a & 65535) + b | 0) >>> 16) | 0, a + b << 16 | c & 65535 | 0) | 0;
    }
    function Ge(a, b, c, d) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        d = d | 0;
        var e = 0, f = 0, g = 0, h = 0, i = 0, j = 0;
        j = b >> 31 | ((b | 0) < 0 ? -1 : 0) << 1;
        i = ((b | 0) < 0 ? -1 : 0) >> 31 | ((b | 0) < 0 ? -1 : 0) << 1;
        f = d >> 31 | ((d | 0) < 0 ? -1 : 0) << 1;
        e = ((d | 0) < 0 ? -1 : 0) >> 31 | ((d | 0) < 0 ? -1 : 0) << 1;
        h = xe(j ^ a | 0, i ^ b | 0, j | 0, i | 0) | 0;
        g = C;
        a = f ^ j;
        b = e ^ i;
        return xe((Le(h, g, xe(f ^ c | 0, e ^ d | 0, f | 0, e | 0) | 0, C, 0) | 0) ^ a | 0, C ^ b | 0, a | 0, b | 0) | 0;
    }
    function He(a, b, d, e) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        e = e | 0;
        var f = 0, g = 0, h = 0, j = 0, k = 0, l = 0;
        f = i;
        i = i + 16 | 0;
        j = f | 0;
        h = b >> 31 | ((b | 0) < 0 ? -1 : 0) << 1;
        g = ((b | 0) < 0 ? -1 : 0) >> 31 | ((b | 0) < 0 ? -1 : 0) << 1;
        l = e >> 31 | ((e | 0) < 0 ? -1 : 0) << 1;
        k = ((e | 0) < 0 ? -1 : 0) >> 31 | ((e | 0) < 0 ? -1 : 0) << 1;
        a = xe(h ^ a | 0, g ^ b | 0, h | 0, g | 0) | 0;
        b = C;
        Le(a, b, xe(l ^ d | 0, k ^ e | 0, l | 0, k | 0) | 0, C, j) | 0;
        e = xe(c[j >> 2] ^ h | 0, c[j + 4 >> 2] ^ g | 0, h | 0, g | 0) | 0;
        d = C;
        i = f;
        return (C = d, e) | 0;
    }
    function Ie(a, b, c, d) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        d = d | 0;
        var e = 0, f = 0;
        e = a;
        f = c;
        c = Fe(e, f) | 0;
        a = C;
        return (C = (_(b, f) | 0) + (_(d, e) | 0) + a | a & 0, c | 0 | 0) | 0;
    }
    function Je(a, b, c, d) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        d = d | 0;
        return Le(a, b, c, d, 0) | 0;
    }
    function Ke(a, b, d, e) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        e = e | 0;
        var f = 0, g = 0;
        g = i;
        i = i + 16 | 0;
        f = g | 0;
        Le(a, b, d, e, f) | 0;
        i = g;
        return (C = c[f + 4 >> 2] | 0, c[f >> 2] | 0) | 0;
    }
    function Le(a, b, d, e, f) {
        a = a | 0;
        b = b | 0;
        d = d | 0;
        e = e | 0;
        f = f | 0;
        var g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0;
        l = a;
        j = b;
        k = j;
        h = d;
        n = e;
        i = n;
        if (!k) {
            g = (f | 0) != 0;
            if (!i) {
                if (g) {
                    c[f >> 2] = (l >>> 0) % (h >>> 0);
                    c[f + 4 >> 2] = 0;
                }
                n = 0;
                f = (l >>> 0) / (h >>> 0) >>> 0;
                return (C = n, f) | 0;
            } else {
                if (!g) {
                    n = 0;
                    f = 0;
                    return (C = n, f) | 0;
                }
                c[f >> 2] = a | 0;
                c[f + 4 >> 2] = b & 0;
                n = 0;
                f = 0;
                return (C = n, f) | 0;
            }
        }
        g = (i | 0) == 0;
        do
            if (h) {
                if (!g) {
                    g = (aa(i | 0) | 0) - (aa(k | 0) | 0) | 0;
                    if (g >>> 0 <= 31) {
                        m = g + 1 | 0;
                        i = 31 - g | 0;
                        b = g - 31 >> 31;
                        h = m;
                        a = l >>> (m >>> 0) & b | k << i;
                        b = k >>> (m >>> 0) & b;
                        g = 0;
                        i = l << i;
                        break;
                    }
                    if (!f) {
                        n = 0;
                        f = 0;
                        return (C = n, f) | 0;
                    }
                    c[f >> 2] = a | 0;
                    c[f + 4 >> 2] = j | b & 0;
                    n = 0;
                    f = 0;
                    return (C = n, f) | 0;
                }
                g = h - 1 | 0;
                if (g & h | 0) {
                    i = (aa(h | 0) | 0) + 33 - (aa(k | 0) | 0) | 0;
                    p = 64 - i | 0;
                    m = 32 - i | 0;
                    j = m >> 31;
                    o = i - 32 | 0;
                    b = o >> 31;
                    h = i;
                    a = m - 1 >> 31 & k >>> (o >>> 0) | (k << m | l >>> (i >>> 0)) & b;
                    b = b & k >>> (i >>> 0);
                    g = l << p & j;
                    i = (k << p | l >>> (o >>> 0)) & j | l << m & i - 33 >> 31;
                    break;
                }
                if (f | 0) {
                    c[f >> 2] = g & l;
                    c[f + 4 >> 2] = 0;
                }
                if ((h | 0) == 1) {
                    o = j | b & 0;
                    p = a | 0 | 0;
                    return (C = o, p) | 0;
                } else {
                    p = Ee(h | 0) | 0;
                    o = k >>> (p >>> 0) | 0;
                    p = k << 32 - p | l >>> (p >>> 0) | 0;
                    return (C = o, p) | 0;
                }
            } else {
                if (g) {
                    if (f | 0) {
                        c[f >> 2] = (k >>> 0) % (h >>> 0);
                        c[f + 4 >> 2] = 0;
                    }
                    o = 0;
                    p = (k >>> 0) / (h >>> 0) >>> 0;
                    return (C = o, p) | 0;
                }
                if (!l) {
                    if (f | 0) {
                        c[f >> 2] = 0;
                        c[f + 4 >> 2] = (k >>> 0) % (i >>> 0);
                    }
                    o = 0;
                    p = (k >>> 0) / (i >>> 0) >>> 0;
                    return (C = o, p) | 0;
                }
                g = i - 1 | 0;
                if (!(g & i)) {
                    if (f | 0) {
                        c[f >> 2] = a | 0;
                        c[f + 4 >> 2] = g & k | b & 0;
                    }
                    o = 0;
                    p = k >>> ((Ee(i | 0) | 0) >>> 0);
                    return (C = o, p) | 0;
                }
                g = (aa(i | 0) | 0) - (aa(k | 0) | 0) | 0;
                if (g >>> 0 <= 30) {
                    b = g + 1 | 0;
                    i = 31 - g | 0;
                    h = b;
                    a = k << i | l >>> (b >>> 0);
                    b = k >>> (b >>> 0);
                    g = 0;
                    i = l << i;
                    break;
                }
                if (!f) {
                    o = 0;
                    p = 0;
                    return (C = o, p) | 0;
                }
                c[f >> 2] = a | 0;
                c[f + 4 >> 2] = j | b & 0;
                o = 0;
                p = 0;
                return (C = o, p) | 0;
            }
        while (0);
        if (!h) {
            k = i;
            j = 0;
            i = 0;
        } else {
            m = d | 0 | 0;
            l = n | e & 0;
            k = Be(m | 0, l | 0, -1, -1) | 0;
            d = C;
            j = i;
            i = 0;
            do {
                e = j;
                j = g >>> 31 | j << 1;
                g = i | g << 1;
                e = a << 1 | e >>> 31 | 0;
                n = a >>> 31 | b << 1 | 0;
                xe(k | 0, d | 0, e | 0, n | 0) | 0;
                p = C;
                o = p >> 31 | ((p | 0) < 0 ? -1 : 0) << 1;
                i = o & 1;
                a = xe(e | 0, n | 0, o & m | 0, (((p | 0) < 0 ? -1 : 0) >> 31 | ((p | 0) < 0 ? -1 : 0) << 1) & l | 0) | 0;
                b = C;
                h = h - 1 | 0;
            } while ((h | 0) != 0);
            k = j;
            j = 0;
        }
        h = 0;
        if (f | 0) {
            c[f >> 2] = a;
            c[f + 4 >> 2] = b;
        }
        o = (g | 0) >>> 31 | (k | h) << 1 | (h << 1 | g >>> 31) & 0 | j;
        p = (g << 1 | 0 >>> 31) & -2 | i;
        return (C = o, p) | 0;
    }
    function* Me(a) {
        a = a | 0;
        return (yield* Ia[a & 3]()) | 0;
    }
    function Ne(a, b) {
        a = a | 0;
        b = b | 0;
        return Ja[a & 1](b | 0) | 0;
    }
    function* Oe(a, b, c, d) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        d = d | 0;
        return (yield* Ka[a & 7](b | 0, c | 0, d | 0)) | 0;
    }
    function* Pe(a, b) {
        a = a | 0;
        b = b | 0;
        yield* La[a & 7](b | 0);
    }
    function* Qe() {
        ba(0);
        return 0;
    }
    function Re(a) {
        a = a | 0;
        ba(1);
        return 0;
    }
    function* Se(a, b, c) {
        a = a | 0;
        b = b | 0;
        c = c | 0;
        ba(2);
        return 0;
    }
    function* Te(a) {
        a = a | 0;
        ba(3);
    }
    var Ia = [
        Qe,
        ub,
        xb,
        Qe
    ];
    var Ja = [
        Re,
        fd
    ];
    var Ka = [
        Se,
        id,
        md,
        nd,
        jd,
        Cd,
        Se,
        Se
    ];
    var La = [
        Te,
        Ya,
        qb,
        rc,
        kd,
        od,
        Te,
        Te
    ];
    return {
        _i64Subtract: xe,
        _free: se,
        _i64Add: Be,
        _memset: ye,
        _malloc: re,
        _memcpy: Ce,
        _bitshift64Lshr: ze,
        ___errno_location: hd,
        _bitshift64Shl: Ae,
        runPostSets: we,
        stackAlloc: Ma,
        stackSave: Na,
        stackRestore: Oa,
        establishStackSpace: Pa,
        setThrew: Qa,
        setTempRet0: Ta,
        getTempRet0: Ua,
        dynCall_ii: Ne,
        yld_export: {
            _main: Va,
            dynCall_i: Me,
            dynCall_iiii: Oe,
            dynCall_vi: Pe
        }
    };
}(Module.asmGlobalArg, Module.asmLibraryArg, buffer);
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var _free = Module["_free"] = asm["_free"];
var _main = Module["_main"] = asm["_main"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _memset = Module["_memset"] = asm["_memset"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];
var ___errno_location = Module["___errno_location"] = asm["___errno_location"];
var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
var dynCall_i = Module["dynCall_i"] = asm["dynCall_i"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
Runtime.stackAlloc = asm["stackAlloc"];
Runtime.stackSave = asm["stackSave"];
Runtime.stackRestore = asm["stackRestore"];
Runtime.establishStackSpace = asm["establishStackSpace"];
Runtime.setTempRet0 = asm["setTempRet0"];
Runtime.getTempRet0 = asm["getTempRet0"];
function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = "Program terminated with exit(" + status + ")";
    this.status = status;
}
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
    if (!Module["calledRun"])
        run();
    if (!Module["calledRun"])
        dependenciesFulfilled = runCaller;
};
Module["callMain"] = Module.callMain = function callMain(args) {
    args = args || [];
    ensureInitRuntime();
    var argc = args.length + 1;
    function pad() {
        for (var i = 0; i < 4 - 1; i++) {
            argv.push(0);
        }
    }
    var argv = [allocate(intArrayFromString(Module["thisProgram"]), "i8", ALLOC_NORMAL)];
    pad();
    for (var i = 0; i < argc - 1; i = i + 1) {
        argv.push(allocate(intArrayFromString(args[i]), "i8", ALLOC_NORMAL));
        pad();
    }
    argv.push(0);
    argv = allocate(argv, "i32", ALLOC_NORMAL);
    try {
        var ret = Module["_main"](argc, argv, 0);
        exit(ret, true);
    } catch (e) {
        if (e instanceof ExitStatus) {
            return;
        } else if (e == "SimulateInfiniteLoop") {
            Module["noExitRuntime"] = true;
            return;
        } else {
            if (e && typeof e === "object" && e.stack)
                Module.printErr("exception thrown: " + [
                    e,
                    e.stack
                ]);
            throw e;
        }
    } finally {
        calledMain = true;
    }
};
function run(args) {
    args = args || Module["arguments"];
    if (preloadStartTime === null)
        preloadStartTime = Date.now();
    if (runDependencies > 0) {
        return;
    }
    preRun();
    if (runDependencies > 0)
        return;
    if (Module["calledRun"])
        return;
    function doRun() {
        if (Module["calledRun"])
            return;
        Module["calledRun"] = true;
        if (ABORT)
            return;
        ensureInitRuntime();
        preMain();
        if (Module["onRuntimeInitialized"])
            Module["onRuntimeInitialized"]();
        if (Module["_main"] && shouldRunNow)
            Module["callMain"](args);
        postRun();
    }
    if (Module["setStatus"]) {
        Module["setStatus"]("Running...");
        setTimeout(function () {
            setTimeout(function () {
                Module["setStatus"]("");
            }, 1);
            doRun();
        }, 1);
    } else {
        doRun();
    }
}
Module["run"] = Module.run = run;
function exit(status, implicit) {
    if (implicit && Module["noExitRuntime"]) {
        return;
    }
    if (Module["noExitRuntime"]) {
    } else {
        ABORT = true;
        EXITSTATUS = status;
        STACKTOP = initialStackTop;
        exitRuntime();
        if (Module["onExit"])
            Module["onExit"](status);
    }
    if (ENVIRONMENT_IS_NODE) {
        process["exit"](status);
    } else if (ENVIRONMENT_IS_SHELL && typeof quit === "function") {
        quit(status);
    }
    throw new ExitStatus(status);
}
Module["exit"] = Module.exit = exit;
var abortDecorators = [];
function abort(what) {
    if (what !== undefined) {
        Module.print(what);
        Module.printErr(what);
        what = JSON.stringify(what);
    } else {
        what = "";
    }
    ABORT = true;
    EXITSTATUS = 1;
    var extra = "\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.";
    var output = "abort(" + what + ") at " + stackTrace() + extra;
    if (abortDecorators) {
        abortDecorators.forEach(function (decorator) {
            output = decorator(output, what);
        });
    }
    throw output;
}
Module["abort"] = Module.abort = abort;
if (Module["preInit"]) {
    if (typeof Module["preInit"] == "function")
        Module["preInit"] = [Module["preInit"]];
    while (Module["preInit"].length > 0) {
        Module["preInit"].pop()();
    }
}
var shouldRunNow = true;
if (Module["noInitialRun"]) {
    shouldRunNow = false;
}
Module["noExitRuntime"] = true;
run();