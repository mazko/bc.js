function test_asmjs_fn(zQsRUPhCptGxlYZRxhrSFAbFuIYlRmanoKpVccSRIr){
	var Module = zQsRUPhCptGxlYZRxhrSFAbFuIYlRmanoKpVccSRIr;
	var window = {};
	Module.preInit = function(){ Module.yld_SYSCALLS = SYSCALLS; Module.yld_pre_init(TTY, FS); };
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
	STATICTOP = STATIC_BASE + 5440;
	__ATINIT__.push();
	allocate([
	    12,
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
	    52,
	    13,
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
	    12,
	    0,
	    0,
	    0,
	    132,
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
	    60,
	    17,
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
	    78,
	    101,
	    119,
	    32,
	    109,
	    111,
	    110,
	    107,
	    101,
	    121,
	    32,
	    33,
	    0,
	    77,
	    111,
	    110,
	    107,
	    101,
	    121,
	    32,
	    105,
	    110,
	    112,
	    117,
	    116,
	    32,
	    67,
	    72,
	    65,
	    82,
	    40,
	    115,
	    121,
	    115,
	    99,
	    97,
	    108,
	    108,
	    49,
	    52,
	    53,
	    41,
	    58,
	    32,
	    60,
	    32,
	    37,
	    99,
	    32,
	    62,
	    10,
	    0,
	    77,
	    111,
	    110,
	    107,
	    101,
	    121,
	    32,
	    105,
	    110,
	    112,
	    117,
	    116,
	    32,
	    82,
	    69,
	    65,
	    68,
	    40,
	    115,
	    121,
	    115,
	    99,
	    97,
	    108,
	    108,
	    51,
	    41,
	    58,
	    32,
	    0,
	    69,
	    82,
	    82,
	    79,
	    82,
	    32,
	    82,
	    69,
	    65,
	    68,
	    40,
	    115,
	    121,
	    115,
	    99,
	    97,
	    108,
	    108,
	    51,
	    41,
	    32,
	    98,
	    121,
	    116,
	    101,
	    115,
	    95,
	    114,
	    101,
	    97,
	    100,
	    58,
	    32,
	    37,
	    100,
	    0,
	    77,
	    111,
	    110,
	    107,
	    101,
	    121,
	    32,
	    105,
	    110,
	    112,
	    117,
	    116,
	    32,
	    76,
	    73,
	    78,
	    69,
	    40,
	    115,
	    121,
	    115,
	    99,
	    97,
	    108,
	    108,
	    49,
	    52,
	    53,
	    41,
	    58,
	    32,
	    37,
	    115,
	    0,
	    69,
	    110,
	    100,
	    32,
	    33,
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
	    102,
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
	    0
	], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
	var tempDoublePtr = STATICTOP;
	STATICTOP += 16;
	Module["_i64Subtract"] = _i64Subtract;
	Module["_i64Add"] = _i64Add;
	Module["_memset"] = _memset;
	function _pthread_cleanup_push(routine, arg) {
	    __ATEXIT__.push(function () {
	        Runtime.dynCall("vi", routine, [arg]);
	    });
	    _pthread_cleanup_push.level = __ATEXIT__.length;
	}
	Module["_bitshift64Lshr"] = _bitshift64Lshr;
	Module["_bitshift64Shl"] = _bitshift64Shl;
	function _pthread_cleanup_pop() {
	    assert(_pthread_cleanup_push.level == __ATEXIT__.length, "cannot pop if something else added meanwhile!");
	    __ATEXIT__.pop();
	    _pthread_cleanup_push.level = __ATEXIT__.length;
	}
	function _abort() {
	    Module["abort"]();
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
	function ___setErrNo(value) {
	    if (Module["___errno_location"])
	        HEAP32[Module["___errno_location"]() >> 2] = value;
	    return value;
	}
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
	function _emscripten_memcpy_big(dest, src, num) {
	    HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
	    return dest;
	}
	Module["_memcpy"] = _memcpy;
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
	    "invoke_ii": invoke_ii,
	    "invoke_iiii": invoke_iiii,
	    "invoke_vi": invoke_vi,
	    "_pthread_cleanup_pop": _pthread_cleanup_pop,
	    "___lock": ___lock,
	    "___syscall3": ___syscall3,
	    "_pthread_self": _pthread_self,
	    "_abort": _abort,
	    "___setErrNo": ___setErrNo,
	    "___syscall6": ___syscall6,
	    "_sbrk": _sbrk,
	    "_time": _time,
	    "_pthread_cleanup_push": _pthread_cleanup_push,
	    "_emscripten_memcpy_big": _emscripten_memcpy_big,
	    "___syscall54": ___syscall54,
	    "___unlock": ___unlock,
	    "___syscall140": ___syscall140,
	    "_sysconf": _sysconf,
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
	    var da = env.invoke_ii;
	    var ea = env.invoke_iiii;
	    var fa = env.invoke_vi;
	    var ga = env._pthread_cleanup_pop;
	    var ha = env.___lock;
	    function* ia() {
	        return yield* Module.yld_api.___syscall3.apply(null, arguments);
	    }
	    var ja = env._pthread_self;
	    var ka = env._abort;
	    var la = env.___setErrNo;
	    var ma = env.___syscall6;
	    var na = env._sbrk;
	    var oa = env._time;
	    var pa = env._pthread_cleanup_push;
	    var qa = env._emscripten_memcpy_big;
	    var ra = env.___syscall54;
	    var sa = env.___unlock;
	    var ta = env.___syscall140;
	    var ua = env._sysconf;
	    function* va() {
	        return yield* Module.yld_api.___syscall145.apply(null, arguments);
	    }
	    var wa = env.___syscall146;
	    var xa = 0.0;
	    function Ba(a) {
	        a = a | 0;
	        var b = 0;
	        b = i;
	        i = i + a | 0;
	        i = i + 15 & -16;
	        return b | 0;
	    }
	    function Ca() {
	        return i | 0;
	    }
	    function Da(a) {
	        a = a | 0;
	        i = a;
	    }
	    function Ea(a, b) {
	        a = a | 0;
	        b = b | 0;
	        i = a;
	        j = b;
	    }
	    function Fa(a, b) {
	        a = a | 0;
	        b = b | 0;
	        if (!n) {
	            n = a;
	            o = b;
	        }
	    }
	    function Ga(b) {
	        b = b | 0;
	        a[k >> 0] = a[b >> 0];
	        a[k + 1 >> 0] = a[b + 1 >> 0];
	        a[k + 2 >> 0] = a[b + 2 >> 0];
	        a[k + 3 >> 0] = a[b + 3 >> 0];
	    }
	    function Ha(b) {
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
	    function Ia(a) {
	        a = a | 0;
	        C = a;
	    }
	    function Ja() {
	        return C | 0;
	    }
	    function* Ka() {
	        var a = 0, b = 0, d = 0, e = 0, f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0;
	        m = i;
	        i = i + 1072 | 0;
	        k = m + 24 | 0;
	        l = m + 16 | 0;
	        j = m + 8 | 0;
	        h = m;
	        f = m + 40 | 0;
	        e = m + 32 | 0;
	        g = m + 28 | 0;
	        (yield* tb(244)) | 0;
	        b = c[2] | 0;
	        (yield* ab(b)) | 0;
	        d = c[32] | 0;
	        while (1) {
	            a = ((yield* vb()) | 0) << 24 >> 24;
	            if ((a | 0) != 10) {
	                c[h >> 2] = a;
	                (yield* qb(257, h)) | 0;
	                continue;
	            }
	            a = (yield* xb(wb(d) | 0, f, 1024)) | 0;
	            if ((a | 0) <= 0) {
	                b = 6;
	                break;
	            }
	            (yield* qb(296, j)) | 0;
	            (yield* ob(f, 1, a, b)) | 0;
	            c[e >> 2] = 0;
	            if (((yield* rb(e, g, d)) | 0) == -1) {
	                b = 8;
	                break;
	            }
	            c[k >> 2] = c[e >> 2];
	            (yield* qb(362, k)) | 0;
	            (yield* ab(b)) | 0;
	            zb(c[e >> 2] | 0);
	        }
	        if ((b | 0) == 6) {
	            c[l >> 2] = a;
	            (yield* qb(326, l)) | 0;
	            (yield* tb(396)) | 0;
	            i = m;
	            return 42;
	        } else if ((b | 0) == 8) {
	            (yield* tb(396)) | 0;
	            i = m;
	            return 42;
	        }
	        return 0;
	    }
	    function* La() {
	        (yield* Ka()) | 0;
	        return 42;
	    }
	    function Ma(a) {
	        a = a | 0;
	        var b = 0, d = 0;
	        b = i;
	        i = i + 16 | 0;
	        d = b;
	        c[d >> 2] = c[a + 60 >> 2];
	        a = Na(ma(6, d | 0) | 0) | 0;
	        i = b;
	        return a | 0;
	    }
	    function Na(a) {
	        a = a | 0;
	        if (a >>> 0 > 4294963200) {
	            c[(Oa() | 0) >> 2] = 0 - a;
	            a = -1;
	        }
	        return a | 0;
	    }
	    function Oa() {
	        var a = 0;
	        if (!(c[707] | 0))
	            a = 2872;
	        else
	            a = c[(ja() | 0) + 64 >> 2] | 0;
	        return a | 0;
	    }
	    function* Pa(b, d, e) {
	        b = b | 0;
	        d = d | 0;
	        e = e | 0;
	        var f = 0, g = 0;
	        g = i;
	        i = i + 80 | 0;
	        f = g;
	        c[b + 36 >> 2] = 4;
	        if ((c[b >> 2] & 64 | 0) == 0 ? (c[f >> 2] = c[b + 60 >> 2], c[f + 4 >> 2] = 21505, c[f + 8 >> 2] = g + 12, ra(54, f | 0) | 0) : 0)
	            a[b + 75 >> 0] = -1;
	        f = (yield* Qa(b, d, e)) | 0;
	        i = g;
	        return f | 0;
	    }
	    function* Qa(a, b, d) {
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
	            if (!(c[707] | 0)) {
	                c[n >> 2] = c[k >> 2];
	                c[n + 4 >> 2] = e;
	                c[n + 8 >> 2] = b;
	                h = Na(wa(146, n | 0) | 0) | 0;
	            } else {
	                pa(1, a | 0);
	                c[m >> 2] = c[k >> 2];
	                c[m + 4 >> 2] = e;
	                c[m + 8 >> 2] = b;
	                h = Na(wa(146, m | 0) | 0) | 0;
	                ga(0);
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
	    function Ra(a) {
	        a = a | 0;
	        if (!(c[a + 68 >> 2] | 0))
	            Sa(a);
	        return;
	    }
	    function Sa(a) {
	        a = a | 0;
	        return;
	    }
	    function* Ta(a, b, d) {
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
	        if ((Na(ta(140, g | 0) | 0) | 0) < 0) {
	            c[e >> 2] = -1;
	            a = -1;
	        } else
	            a = c[e >> 2] | 0;
	        i = f;
	        return a | 0;
	    }
	    function* Ua(b, d, e) {
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
	        if (!(c[707] | 0)) {
	            c[h >> 2] = c[b + 60 >> 2];
	            c[h + 4 >> 2] = f;
	            c[h + 8 >> 2] = 2;
	            f = Na((yield* va(145, h | 0)) | 0) | 0;
	        } else {
	            pa(2, b | 0);
	            c[g >> 2] = c[b + 60 >> 2];
	            c[g + 4 >> 2] = f;
	            c[g + 8 >> 2] = 2;
	            f = Na((yield* va(145, g | 0)) | 0) | 0;
	            ga(0);
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
	    function Va(a) {
	        a = a | 0;
	        if (!(c[a + 68 >> 2] | 0))
	            Sa(a);
	        return;
	    }
	    function Wa(b) {
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
	    function Xa(b, d, e) {
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
	    function* Ya(b, e, f, g) {
	        b = b | 0;
	        e = e | 0;
	        f = f | 0;
	        g = g | 0;
	        var h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0;
	        a:
	            do
	                if ((b | 0) != 0 & (e | 0) != 0) {
	                    if (!(c[b >> 2] | 0))
	                        c[e >> 2] = 0;
	                    if ((c[g + 76 >> 2] | 0) > -1)
	                        p = Za(g) | 0;
	                    else
	                        p = 0;
	                    o = g + 4 | 0;
	                    n = g + 8 | 0;
	                    j = 0;
	                    while (1) {
	                        k = c[o >> 2] | 0;
	                        i = k;
	                        l = (c[n >> 2] | 0) - i | 0;
	                        h = Xa(k, f, l) | 0;
	                        m = (h | 0) != 0;
	                        l = m ? 1 - i + h | 0 : l;
	                        h = l + j | 0;
	                        if (h >>> 0 < (c[e >> 2] | 0) >>> 0)
	                            i = c[b >> 2] | 0;
	                        else {
	                            if (l >>> 0 >= (2147483647 - j | 0) >>> 0) {
	                                q = 25;
	                                break;
	                            }
	                            k = h + 2 | 0;
	                            i = k << (k >>> 0 < 1073741823 & 1);
	                            c[e >> 2] = i;
	                            i = Ab(c[b >> 2] | 0, i) | 0;
	                            if (!i) {
	                                c[e >> 2] = k;
	                                i = Ab(c[b >> 2] | 0, k) | 0;
	                                if (!i) {
	                                    q = 25;
	                                    break;
	                                }
	                            }
	                            c[b >> 2] = i;
	                            k = c[o >> 2] | 0;
	                        }
	                        Jb(i + j | 0, k | 0, l | 0) | 0;
	                        i = (c[o >> 2] | 0) + l | 0;
	                        c[o >> 2] = i;
	                        if (m)
	                            break;
	                        if (i >>> 0 >= (c[n >> 2] | 0) >>> 0) {
	                            i = (yield* _a(g)) | 0;
	                            if ((i | 0) == -1) {
	                                q = 18;
	                                break;
	                            }
	                        } else {
	                            c[o >> 2] = i + 1;
	                            i = d[i >> 0] | 0;
	                        }
	                        j = h + 1 | 0;
	                        a[(c[b >> 2] | 0) + h >> 0] = i;
	                        if ((i << 24 >> 24 | 0) == (f | 0)) {
	                            h = j;
	                            break;
	                        }
	                    }
	                    if ((q | 0) == 25) {
	                        if (p | 0)
	                            Sa(g);
	                        c[(Oa() | 0) >> 2] = 12;
	                        h = -1;
	                        break;
	                    }
	                    do
	                        if ((q | 0) == 18) {
	                            if (h | 0 ? c[g >> 2] & 16 | 0 : 0)
	                                break;
	                            if (!p) {
	                                h = -1;
	                                break a;
	                            }
	                            Sa(g);
	                            h = -1;
	                            break a;
	                        }
	                    while (0);
	                    a[(c[b >> 2] | 0) + h >> 0] = 0;
	                    if (p)
	                        Sa(g);
	                } else {
	                    c[(Oa() | 0) >> 2] = 22;
	                    h = -1;
	                }
	            while (0);
	        return h | 0;
	    }
	    function Za(a) {
	        a = a | 0;
	        return 0;
	    }
	    function* _a(a) {
	        a = a | 0;
	        var b = 0, e = 0;
	        e = i;
	        i = i + 16 | 0;
	        b = e;
	        if ((c[a + 8 >> 2] | 0) == 0 ? ((yield* $a(a)) | 0) != 0 : 0)
	            b = -1;
	        else if (((yield* za[c[a + 32 >> 2] & 7](a, b, 1)) | 0) == 1)
	            b = d[b >> 0] | 0;
	        else
	            b = -1;
	        i = e;
	        return b | 0;
	    }
	    function* $a(b) {
	        b = b | 0;
	        var d = 0, e = 0;
	        d = b + 74 | 0;
	        e = a[d >> 0] | 0;
	        a[d >> 0] = e + 255 | e;
	        d = b + 20 | 0;
	        e = b + 44 | 0;
	        if ((c[d >> 2] | 0) >>> 0 > (c[e >> 2] | 0) >>> 0)
	            (yield* za[c[b + 36 >> 2] & 7](b, 0, 0)) | 0;
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
	    function* ab(a) {
	        a = a | 0;
	        var b = 0, d = 0;
	        do
	            if (a) {
	                if ((c[a + 76 >> 2] | 0) <= -1) {
	                    b = (yield* bb(a)) | 0;
	                    break;
	                }
	                d = (Za(a) | 0) == 0;
	                b = (yield* bb(a)) | 0;
	                if (!d)
	                    Sa(a);
	            } else {
	                if (!(c[31] | 0))
	                    b = 0;
	                else
	                    b = (yield* ab(c[31] | 0)) | 0;
	                ha(2856);
	                a = c[713] | 0;
	                if (a)
	                    do {
	                        if ((c[a + 76 >> 2] | 0) > -1)
	                            d = Za(a) | 0;
	                        else
	                            d = 0;
	                        if ((c[a + 20 >> 2] | 0) >>> 0 > (c[a + 28 >> 2] | 0) >>> 0)
	                            b = (yield* bb(a)) | 0 | b;
	                        if (d | 0)
	                            Sa(a);
	                        a = c[a + 56 >> 2] | 0;
	                    } while ((a | 0) != 0);
	                sa(2856);
	            }
	        while (0);
	        return b | 0;
	    }
	    function* bb(a) {
	        a = a | 0;
	        var b = 0, d = 0, e = 0, f = 0, g = 0, h = 0;
	        b = a + 20 | 0;
	        g = a + 28 | 0;
	        if ((c[b >> 2] | 0) >>> 0 > (c[g >> 2] | 0) >>> 0 ? ((yield* za[c[a + 36 >> 2] & 7](a, 0, 0)) | 0, (c[b >> 2] | 0) == 0) : 0)
	            b = -1;
	        else {
	            h = a + 4 | 0;
	            d = c[h >> 2] | 0;
	            e = a + 8 | 0;
	            f = c[e >> 2] | 0;
	            if (d >>> 0 < f >>> 0)
	                (yield* za[c[a + 40 >> 2] & 7](a, d - f | 0, 1)) | 0;
	            c[a + 16 >> 2] = 0;
	            c[g >> 2] = 0;
	            c[b >> 2] = 0;
	            c[e >> 2] = 0;
	            c[h >> 2] = 0;
	            b = 0;
	        }
	        return b | 0;
	    }
	    function* cb(b, d, e) {
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
	        if (((yield* db(0, d, o, q, r)) | 0) < 0)
	            e = -1;
	        else {
	            if ((c[b + 76 >> 2] | 0) > -1)
	                m = Za(b) | 0;
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
	                f = (yield* db(b, d, o, q, r)) | 0;
	                if (h) {
	                    (yield* za[c[b + 36 >> 2] & 7](b, 0, 0)) | 0;
	                    f = (c[k >> 2] | 0) == 0 ? -1 : f;
	                    c[g >> 2] = h;
	                    c[e >> 2] = 0;
	                    c[l >> 2] = 0;
	                    c[j >> 2] = 0;
	                    c[k >> 2] = 0;
	                }
	            } else
	                f = (yield* db(b, d, o, q, r)) | 0;
	            e = c[b >> 2] | 0;
	            c[b >> 2] = e | n;
	            if (m | 0)
	                Sa(b);
	            e = (e & 32 | 0) == 0 ? f : -1;
	        }
	        i = s;
	        return e | 0;
	    }
	    function* db(e, f, g, j, l) {
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
	                            c[(Oa() | 0) >> 2] = 75;
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
	                    (yield* eb(y, w, e)) | 0;
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
	                    o = a[402 + (t * 58 | 0) + o >> 0] | 0;
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
	                        gb(ca, r, g);
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
	                                        o = Hb(o | 0, p | 0, 3) | 0;
	                                        p = C;
	                                    } while (!((o | 0) == 0 & (p | 0) == 0));
	                                }
	                                if (!(I & 8)) {
	                                    o = I;
	                                    t = 0;
	                                    r = 882;
	                                    L = 77;
	                                } else {
	                                    t = V - f | 0;
	                                    o = I;
	                                    s = (s | 0) > (t | 0) ? s : t + 1 | 0;
	                                    t = 0;
	                                    r = 882;
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
	                                    f = Eb(0, 0, f | 0, o | 0) | 0;
	                                    o = C;
	                                    p = ca;
	                                    c[p >> 2] = f;
	                                    c[p + 4 >> 2] = o;
	                                    p = 1;
	                                    r = 882;
	                                    L = 76;
	                                    break f;
	                                }
	                                if (!(I & 2048)) {
	                                    r = I & 1;
	                                    p = r;
	                                    r = (r | 0) == 0 ? 882 : 884;
	                                    L = 76;
	                                } else {
	                                    p = 1;
	                                    r = 883;
	                                    L = 76;
	                                }
	                                break;
	                            }
	                        case 117: {
	                                o = ca;
	                                f = c[o >> 2] | 0;
	                                o = c[o + 4 >> 2] | 0;
	                                p = 0;
	                                r = 882;
	                                L = 76;
	                                break;
	                            }
	                        case 99: {
	                                a[W >> 0] = c[ca >> 2];
	                                f = W;
	                                u = 1;
	                                w = 0;
	                                v = 882;
	                                o = N;
	                                break;
	                            }
	                        case 109: {
	                                o = ib(c[(Oa() | 0) >> 2] | 0) | 0;
	                                L = 82;
	                                break;
	                            }
	                        case 115: {
	                                o = c[ca >> 2] | 0;
	                                o = o | 0 ? o : 2784;
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
	                                    yield* jb(e, 32, K, 0, I);
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
	                                        H = (H | 0) == 0 ? 2792 : 2797;
	                                    } else {
	                                        G = 1;
	                                        H = 2794;
	                                    }
	                                else {
	                                    q = -q;
	                                    G = 1;
	                                    H = 2791;
	                                }
	                                h[k >> 3] = q;
	                                F = c[k + 4 >> 2] & 2146435072;
	                                do
	                                    if (F >>> 0 < 2146435072 | (F | 0) == 2146435072 & 0 < 0) {
	                                        x = +mb(q, fa) * 2.0;
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
	                                            f = hb(f, ((f | 0) < 0) << 31 >> 31, $) | 0;
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
	                                                a[o >> 0] = d[866 + H >> 0] | v;
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
	                                            yield* jb(e, 32, K, r, I);
	                                            if (!(c[e >> 2] & 32))
	                                                (yield* eb(y, w, e)) | 0;
	                                            yield* jb(e, 48, K, r, I ^ 65536);
	                                            o = f - Y | 0;
	                                            if (!(c[e >> 2] & 32))
	                                                (yield* eb(ea, o, e)) | 0;
	                                            f = ba - p | 0;
	                                            yield* jb(e, 48, s - (o + f) | 0, 0, 0);
	                                            if (!(c[e >> 2] & 32))
	                                                (yield* eb(t, f, e)) | 0;
	                                            yield* jb(e, 32, K, r, I ^ 8192);
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
	                                                            B = Ib(c[r >> 2] | 0, 0, t | 0) | 0;
	                                                            B = Fb(B | 0, C | 0, o | 0, 0) | 0;
	                                                            o = C;
	                                                            A = Rb(B | 0, o | 0, 1e9, 0) | 0;
	                                                            c[r >> 2] = A;
	                                                            o = Qb(B | 0, o | 0, 1e9, 0) | 0;
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
	                                            r = hb(r, ((r | 0) < 0) << 31 >> 31, $) | 0;
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
	                                        yield* jb(e, 32, K, w, I);
	                                        if (!(c[e >> 2] & 32))
	                                            (yield* eb(H, G, e)) | 0;
	                                        yield* jb(e, 48, K, w, I ^ 65536);
	                                        do
	                                            if (t) {
	                                                r = z >>> 0 > F >>> 0 ? F : z;
	                                                o = r;
	                                                do {
	                                                    p = hb(c[o >> 2] | 0, 0, S) | 0;
	                                                    do
	                                                        if ((o | 0) == (r | 0)) {
	                                                            if ((p | 0) != (S | 0))
	                                                                break;
	                                                            a[U >> 0] = 48;
	                                                            p = U;
	                                                        } else {
	                                                            if (p >>> 0 <= ea >>> 0)
	                                                                break;
	                                                            Gb(ea | 0, 48, p - Y | 0) | 0;
	                                                            do
	                                                                p = p + -1 | 0;
	                                                            while (p >>> 0 > ea >>> 0);
	                                                        }
	                                                    while (0);
	                                                    if (!(c[e >> 2] & 32))
	                                                        (yield* eb(p, T - p | 0, e)) | 0;
	                                                    o = o + 4 | 0;
	                                                } while (o >>> 0 <= F >>> 0);
	                                                do
	                                                    if (v | 0) {
	                                                        if (c[e >> 2] & 32 | 0)
	                                                            break;
	                                                        (yield* eb(2826, 1, e)) | 0;
	                                                    }
	                                                while (0);
	                                                if ((f | 0) > 0 & o >>> 0 < D >>> 0) {
	                                                    p = o;
	                                                    while (1) {
	                                                        o = hb(c[p >> 2] | 0, 0, S) | 0;
	                                                        if (o >>> 0 > ea >>> 0) {
	                                                            Gb(ea | 0, 48, o - Y | 0) | 0;
	                                                            do
	                                                                o = o + -1 | 0;
	                                                            while (o >>> 0 > ea >>> 0);
	                                                        }
	                                                        if (!(c[e >> 2] & 32))
	                                                            (yield* eb(o, (f | 0) > 9 ? 9 : f, e)) | 0;
	                                                        p = p + 4 | 0;
	                                                        o = f + -9 | 0;
	                                                        if (!((f | 0) > 9 & p >>> 0 < D >>> 0)) {
	                                                            f = o;
	                                                            break;
	                                                        } else
	                                                            f = o;
	                                                    }
	                                                }
	                                                yield* jb(e, 48, f + 9 | 0, 9, 0);
	                                            } else {
	                                                t = y ? D : z + 4 | 0;
	                                                if ((f | 0) > -1) {
	                                                    s = (p | 0) == 0;
	                                                    r = z;
	                                                    do {
	                                                        o = hb(c[r >> 2] | 0, 0, S) | 0;
	                                                        if ((o | 0) == (S | 0)) {
	                                                            a[U >> 0] = 48;
	                                                            o = U;
	                                                        }
	                                                        do
	                                                            if ((r | 0) == (z | 0)) {
	                                                                p = o + 1 | 0;
	                                                                if (!(c[e >> 2] & 32))
	                                                                    (yield* eb(o, 1, e)) | 0;
	                                                                if (s & (f | 0) < 1) {
	                                                                    o = p;
	                                                                    break;
	                                                                }
	                                                                if (c[e >> 2] & 32 | 0) {
	                                                                    o = p;
	                                                                    break;
	                                                                }
	                                                                (yield* eb(2826, 1, e)) | 0;
	                                                                o = p;
	                                                            } else {
	                                                                if (o >>> 0 <= ea >>> 0)
	                                                                    break;
	                                                                Gb(ea | 0, 48, o + Z | 0) | 0;
	                                                                do
	                                                                    o = o + -1 | 0;
	                                                                while (o >>> 0 > ea >>> 0);
	                                                            }
	                                                        while (0);
	                                                        p = T - o | 0;
	                                                        if (!(c[e >> 2] & 32))
	                                                            (yield* eb(o, (f | 0) > (p | 0) ? p : f, e)) | 0;
	                                                        f = f - p | 0;
	                                                        r = r + 4 | 0;
	                                                    } while (r >>> 0 < t >>> 0 & (f | 0) > -1);
	                                                }
	                                                yield* jb(e, 48, f + 18 | 0, 18, 0);
	                                                if (c[e >> 2] & 32 | 0)
	                                                    break;
	                                                (yield* eb(u, ba - u | 0, e)) | 0;
	                                            }
	                                        while (0);
	                                        yield* jb(e, 32, K, w, I ^ 8192);
	                                        f = (w | 0) < (K | 0) ? K : w;
	                                    } else {
	                                        t = (u & 32 | 0) != 0;
	                                        s = q != q | 0.0 != 0.0;
	                                        o = s ? 0 : G;
	                                        r = o + 3 | 0;
	                                        yield* jb(e, 32, K, r, p);
	                                        f = c[e >> 2] | 0;
	                                        if (!(f & 32)) {
	                                            (yield* eb(H, o, e)) | 0;
	                                            f = c[e >> 2] | 0;
	                                        }
	                                        if (!(f & 32))
	                                            (yield* eb(s ? t ? 2818 : 2822 : t ? 2810 : 2814, 3, e)) | 0;
	                                        yield* jb(e, 32, K, r, I ^ 8192);
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
	                                v = 882;
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
	                                    a[f >> 0] = d[866 + (o & 15) >> 0] | r;
	                                    o = Hb(o | 0, p | 0, 4) | 0;
	                                    p = C;
	                                } while (!((o | 0) == 0 & (p | 0) == 0));
	                                L = ca;
	                                if ((t & 8 | 0) == 0 | (c[L >> 2] | 0) == 0 & (c[L + 4 >> 2] | 0) == 0) {
	                                    o = t;
	                                    t = 0;
	                                    r = 882;
	                                    L = 77;
	                                } else {
	                                    o = t;
	                                    t = 2;
	                                    r = 882 + (u >> 4) | 0;
	                                    L = 77;
	                                }
	                            } else {
	                                f = N;
	                                o = t;
	                                t = 0;
	                                r = 882;
	                                L = 77;
	                            }
	                        } else if ((L | 0) == 76) {
	                            f = hb(f, o, N) | 0;
	                            o = I;
	                            t = p;
	                            L = 77;
	                        } else if ((L | 0) == 82) {
	                            L = 0;
	                            I = Xa(o, 0, s) | 0;
	                            H = (I | 0) == 0;
	                            f = o;
	                            u = H ? s : I - o | 0;
	                            w = 0;
	                            v = 882;
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
	                                o = kb(ga, r) | 0;
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
	                            yield* jb(e, 32, K, p, I);
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
	                                    o = kb(ga, o) | 0;
	                                    r = o + r | 0;
	                                    if ((r | 0) > (p | 0)) {
	                                        f = p;
	                                        L = 97;
	                                        break g;
	                                    }
	                                    if (!(c[e >> 2] & 32))
	                                        (yield* eb(ga, o, e)) | 0;
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
	                    yield* jb(e, 32, K, f, I ^ 8192);
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
	                yield* jb(e, 32, o, s, p);
	                if (!(c[e >> 2] & 32))
	                    (yield* eb(v, w, e)) | 0;
	                yield* jb(e, 48, o, s, p ^ 65536);
	                yield* jb(e, 48, r, t, 0);
	                if (!(c[e >> 2] & 32))
	                    (yield* eb(f, t, e)) | 0;
	                yield* jb(e, 32, o, s, p ^ 8192);
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
	                                gb(j + (m << 3) | 0, n, g);
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
	    function* eb(b, d, e) {
	        b = b | 0;
	        d = d | 0;
	        e = e | 0;
	        var f = 0, g = 0, h = 0, i = 0;
	        f = e + 16 | 0;
	        g = c[f >> 2] | 0;
	        if (!g)
	            if (!(fb(e) | 0)) {
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
	                        f = (yield* za[c[e + 36 >> 2] & 7](e, b, d)) | 0;
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
	                                if (((yield* za[c[e + 36 >> 2] & 7](e, b, f)) | 0) >>> 0 < f >>> 0)
	                                    break a;
	                                d = d - f | 0;
	                                b = b + f | 0;
	                                g = c[i >> 2] | 0;
	                            } else {
	                                g = h;
	                                f = 0;
	                            }
	                        while (0);
	                    Jb(g | 0, b | 0, d | 0) | 0;
	                    c[i >> 2] = (c[i >> 2] | 0) + d;
	                    f = f + d | 0;
	                }
	            while (0);
	        return f | 0;
	    }
	    function fb(b) {
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
	    function gb(a, b, d) {
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
	    function hb(b, c, d) {
	        b = b | 0;
	        c = c | 0;
	        d = d | 0;
	        var e = 0;
	        if (c >>> 0 > 0 | (c | 0) == 0 & b >>> 0 > 4294967295)
	            while (1) {
	                e = Rb(b | 0, c | 0, 10, 0) | 0;
	                d = d + -1 | 0;
	                a[d >> 0] = e | 48;
	                e = Qb(b | 0, c | 0, 10, 0) | 0;
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
	    function ib(b) {
	        b = b | 0;
	        var c = 0, e = 0;
	        c = 0;
	        while (1) {
	            if ((d[892 + c >> 0] | 0) == (b | 0)) {
	                e = 2;
	                break;
	            }
	            c = c + 1 | 0;
	            if ((c | 0) == 87) {
	                c = 87;
	                b = 980;
	                e = 5;
	                break;
	            }
	        }
	        if ((e | 0) == 2)
	            if (!c)
	                b = 980;
	            else {
	                b = 980;
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
	    function* jb(a, b, d, e, f) {
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
	                Gb(h | 0, b | 0, (f >>> 0 > 256 ? 256 : f) | 0) | 0;
	                b = c[a >> 2] | 0;
	                g = (b & 32 | 0) == 0;
	                if (f >>> 0 > 255) {
	                    e = d - e | 0;
	                    do {
	                        if (g) {
	                            (yield* eb(h, 256, a)) | 0;
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
	                (yield* eb(h, f, a)) | 0;
	            }
	        while (0);
	        i = j;
	        return;
	    }
	    function kb(a, b) {
	        a = a | 0;
	        b = b | 0;
	        if (!a)
	            a = 0;
	        else
	            a = lb(a, b, 0) | 0;
	        return a | 0;
	    }
	    function lb(b, d, e) {
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
	                    c[(Oa() | 0) >> 2] = 84;
	                    b = -1;
	                    break;
	                }
	            } else
	                b = 1;
	        while (0);
	        return b | 0;
	    }
	    function mb(a, b) {
	        a = +a;
	        b = b | 0;
	        return + +nb(a, b);
	    }
	    function nb(a, b) {
	        a = +a;
	        b = b | 0;
	        var d = 0, e = 0, f = 0;
	        h[k >> 3] = a;
	        d = c[k >> 2] | 0;
	        e = c[k + 4 >> 2] | 0;
	        f = Hb(d | 0, e | 0, 52) | 0;
	        f = f & 2047;
	        switch (f | 0) {
	        case 0: {
	                if (a != 0.0) {
	                    a = +nb(a * 18446744073709551616.0, b);
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
	    function* ob(a, b, d, e) {
	        a = a | 0;
	        b = b | 0;
	        d = d | 0;
	        e = e | 0;
	        var f = 0, g = 0;
	        f = _(d, b) | 0;
	        if ((c[e + 76 >> 2] | 0) > -1) {
	            g = (Za(e) | 0) == 0;
	            a = (yield* eb(a, f, e)) | 0;
	            if (!g)
	                Sa(e);
	        } else
	            a = (yield* eb(a, f, e)) | 0;
	        if ((a | 0) != (f | 0))
	            d = (a >>> 0) / (b >>> 0) | 0;
	        return d | 0;
	    }
	    function* pb(a) {
	        a = a | 0;
	        var b = 0, e = 0, f = 0;
	        if ((c[a + 76 >> 2] | 0) >= 0 ? (Za(a) | 0) != 0 : 0) {
	            b = a + 4 | 0;
	            e = c[b >> 2] | 0;
	            if (e >>> 0 < (c[a + 8 >> 2] | 0) >>> 0) {
	                c[b >> 2] = e + 1;
	                b = d[e >> 0] | 0;
	            } else
	                b = (yield* _a(a)) | 0;
	            Sa(a);
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
	                    b = (yield* _a(a)) | 0;
	                    break;
	                }
	            }
	        while (0);
	        return b | 0;
	    }
	    function* qb(a, b) {
	        a = a | 0;
	        b = b | 0;
	        var d = 0, e = 0;
	        d = i;
	        i = i + 16 | 0;
	        e = d;
	        c[e >> 2] = b;
	        b = (yield* cb(c[2] | 0, a, e)) | 0;
	        i = d;
	        return b | 0;
	    }
	    function* rb(a, b, c) {
	        a = a | 0;
	        b = b | 0;
	        c = c | 0;
	        return (yield* Ya(a, b, 10, c)) | 0;
	    }
	    function* sb(b, e) {
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
	            if (!(fb(b) | 0)) {
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
	                if (((yield* za[c[b + 36 >> 2] & 7](b, l, 1)) | 0) == 1)
	                    f = d[l >> 0] | 0;
	                else
	                    f = -1;
	            }
	        while (0);
	        i = m;
	        return f | 0;
	    }
	    function* tb(b) {
	        b = b | 0;
	        var d = 0, e = 0, f = 0, g = 0;
	        f = c[2] | 0;
	        if ((c[f + 76 >> 2] | 0) > -1)
	            g = Za(f) | 0;
	        else
	            g = 0;
	        do
	            if (((yield* ub(b, f)) | 0) < 0)
	                d = 1;
	            else {
	                if ((a[f + 75 >> 0] | 0) != 10 ? (d = f + 20 | 0, e = c[d >> 2] | 0, e >>> 0 < (c[f + 16 >> 2] | 0) >>> 0) : 0) {
	                    c[d >> 2] = e + 1;
	                    a[e >> 0] = 10;
	                    d = 0;
	                    break;
	                }
	                d = ((yield* sb(f, 10)) | 0) < 0;
	            }
	        while (0);
	        if (g | 0)
	            Sa(f);
	        return d << 31 >> 31 | 0;
	    }
	    function* ub(a, b) {
	        a = a | 0;
	        b = b | 0;
	        return ((yield* ob(a, Wa(a) | 0, 1, b)) | 0) + -1 | 0;
	    }
	    function* vb() {
	        return (yield* pb(c[32] | 0)) | 0;
	    }
	    function wb(a) {
	        a = a | 0;
	        (c[a + 76 >> 2] | 0) > -1 ? Za(a) | 0 : 0;
	        return c[a + 60 >> 2] | 0;
	    }
	    function* xb(a, b, d) {
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
	        a = Na((yield* ia(3, f | 0)) | 0) | 0;
	        i = e;
	        return a | 0;
	    }
	    function yb(a) {
	        a = a | 0;
	        var b = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0;
	        do
	            if (a >>> 0 < 245) {
	                o = a >>> 0 < 11 ? 16 : a + 11 & -8;
	                a = o >>> 3;
	                j = c[719] | 0;
	                b = j >>> a;
	                if (b & 3 | 0) {
	                    b = (b & 1 ^ 1) + a | 0;
	                    d = 2916 + (b << 1 << 2) | 0;
	                    e = d + 8 | 0;
	                    f = c[e >> 2] | 0;
	                    g = f + 8 | 0;
	                    h = c[g >> 2] | 0;
	                    do
	                        if ((d | 0) != (h | 0)) {
	                            if (h >>> 0 < (c[723] | 0) >>> 0)
	                                ka();
	                            a = h + 12 | 0;
	                            if ((c[a >> 2] | 0) == (f | 0)) {
	                                c[a >> 2] = d;
	                                c[e >> 2] = h;
	                                break;
	                            } else
	                                ka();
	                        } else
	                            c[719] = j & ~(1 << b);
	                    while (0);
	                    L = b << 3;
	                    c[f + 4 >> 2] = L | 3;
	                    L = f + L + 4 | 0;
	                    c[L >> 2] = c[L >> 2] | 1;
	                    L = g;
	                    return L | 0;
	                }
	                h = c[721] | 0;
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
	                        d = 2916 + (b << 1 << 2) | 0;
	                        e = d + 8 | 0;
	                        g = c[e >> 2] | 0;
	                        i = g + 8 | 0;
	                        f = c[i >> 2] | 0;
	                        do
	                            if ((d | 0) != (f | 0)) {
	                                if (f >>> 0 < (c[723] | 0) >>> 0)
	                                    ka();
	                                a = f + 12 | 0;
	                                if ((c[a >> 2] | 0) == (g | 0)) {
	                                    c[a >> 2] = d;
	                                    c[e >> 2] = f;
	                                    k = c[721] | 0;
	                                    break;
	                                } else
	                                    ka();
	                            } else {
	                                c[719] = j & ~(1 << b);
	                                k = h;
	                            }
	                        while (0);
	                        h = (b << 3) - o | 0;
	                        c[g + 4 >> 2] = o | 3;
	                        e = g + o | 0;
	                        c[e + 4 >> 2] = h | 1;
	                        c[e + h >> 2] = h;
	                        if (k | 0) {
	                            f = c[724] | 0;
	                            b = k >>> 3;
	                            d = 2916 + (b << 1 << 2) | 0;
	                            a = c[719] | 0;
	                            b = 1 << b;
	                            if (a & b) {
	                                a = d + 8 | 0;
	                                b = c[a >> 2] | 0;
	                                if (b >>> 0 < (c[723] | 0) >>> 0)
	                                    ka();
	                                else {
	                                    l = a;
	                                    m = b;
	                                }
	                            } else {
	                                c[719] = a | b;
	                                l = d + 8 | 0;
	                                m = d;
	                            }
	                            c[l >> 2] = f;
	                            c[m + 12 >> 2] = f;
	                            c[f + 8 >> 2] = m;
	                            c[f + 12 >> 2] = d;
	                        }
	                        c[721] = h;
	                        c[724] = e;
	                        L = i;
	                        return L | 0;
	                    }
	                    a = c[720] | 0;
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
	                        e = c[3180 + ((J | K | L | b | e) + (d >>> e) << 2) >> 2] | 0;
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
	                        g = c[723] | 0;
	                        if (j >>> 0 < g >>> 0)
	                            ka();
	                        i = j + o | 0;
	                        if (j >>> 0 >= i >>> 0)
	                            ka();
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
	                                    ka();
	                                else {
	                                    c[b >> 2] = 0;
	                                    n = a;
	                                    break;
	                                }
	                            } else {
	                                f = c[j + 8 >> 2] | 0;
	                                if (f >>> 0 < g >>> 0)
	                                    ka();
	                                a = f + 12 | 0;
	                                if ((c[a >> 2] | 0) != (j | 0))
	                                    ka();
	                                b = e + 8 | 0;
	                                if ((c[b >> 2] | 0) == (j | 0)) {
	                                    c[a >> 2] = e;
	                                    c[b >> 2] = f;
	                                    n = e;
	                                    break;
	                                } else
	                                    ka();
	                            }
	                        while (0);
	                        do
	                            if (h | 0) {
	                                a = c[j + 28 >> 2] | 0;
	                                b = 3180 + (a << 2) | 0;
	                                if ((j | 0) == (c[b >> 2] | 0)) {
	                                    c[b >> 2] = n;
	                                    if (!n) {
	                                        c[720] = c[720] & ~(1 << a);
	                                        break;
	                                    }
	                                } else {
	                                    if (h >>> 0 < (c[723] | 0) >>> 0)
	                                        ka();
	                                    a = h + 16 | 0;
	                                    if ((c[a >> 2] | 0) == (j | 0))
	                                        c[a >> 2] = n;
	                                    else
	                                        c[h + 20 >> 2] = n;
	                                    if (!n)
	                                        break;
	                                }
	                                b = c[723] | 0;
	                                if (n >>> 0 < b >>> 0)
	                                    ka();
	                                c[n + 24 >> 2] = h;
	                                a = c[j + 16 >> 2] | 0;
	                                do
	                                    if (a | 0)
	                                        if (a >>> 0 < b >>> 0)
	                                            ka();
	                                        else {
	                                            c[n + 16 >> 2] = a;
	                                            c[a + 24 >> 2] = n;
	                                            break;
	                                        }
	                                while (0);
	                                a = c[j + 20 >> 2] | 0;
	                                if (a | 0)
	                                    if (a >>> 0 < (c[723] | 0) >>> 0)
	                                        ka();
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
	                            a = c[721] | 0;
	                            if (a | 0) {
	                                f = c[724] | 0;
	                                b = a >>> 3;
	                                e = 2916 + (b << 1 << 2) | 0;
	                                a = c[719] | 0;
	                                b = 1 << b;
	                                if (a & b) {
	                                    a = e + 8 | 0;
	                                    b = c[a >> 2] | 0;
	                                    if (b >>> 0 < (c[723] | 0) >>> 0)
	                                        ka();
	                                    else {
	                                        p = a;
	                                        q = b;
	                                    }
	                                } else {
	                                    c[719] = a | b;
	                                    p = e + 8 | 0;
	                                    q = e;
	                                }
	                                c[p >> 2] = f;
	                                c[q + 12 >> 2] = f;
	                                c[f + 8 >> 2] = q;
	                                c[f + 12 >> 2] = e;
	                            }
	                            c[721] = d;
	                            c[724] = i;
	                        }
	                        L = j + 8 | 0;
	                        return L | 0;
	                    }
	                }
	            } else if (a >>> 0 <= 4294967231) {
	                a = a + 11 | 0;
	                o = a & -8;
	                j = c[720] | 0;
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
	                    b = c[3180 + (i << 2) >> 2] | 0;
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
	                            a = c[3180 + ((l | m | n | p | a) + (q >>> a) << 2) >> 2] | 0;
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
	                    if ((j | 0) != 0 ? i >>> 0 < ((c[721] | 0) - o | 0) >>> 0 : 0) {
	                        f = c[723] | 0;
	                        if (j >>> 0 < f >>> 0)
	                            ka();
	                        h = j + o | 0;
	                        if (j >>> 0 >= h >>> 0)
	                            ka();
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
	                                    ka();
	                                else {
	                                    c[b >> 2] = 0;
	                                    s = a;
	                                    break;
	                                }
	                            } else {
	                                e = c[j + 8 >> 2] | 0;
	                                if (e >>> 0 < f >>> 0)
	                                    ka();
	                                a = e + 12 | 0;
	                                if ((c[a >> 2] | 0) != (j | 0))
	                                    ka();
	                                b = d + 8 | 0;
	                                if ((c[b >> 2] | 0) == (j | 0)) {
	                                    c[a >> 2] = d;
	                                    c[b >> 2] = e;
	                                    s = d;
	                                    break;
	                                } else
	                                    ka();
	                            }
	                        while (0);
	                        do
	                            if (g | 0) {
	                                a = c[j + 28 >> 2] | 0;
	                                b = 3180 + (a << 2) | 0;
	                                if ((j | 0) == (c[b >> 2] | 0)) {
	                                    c[b >> 2] = s;
	                                    if (!s) {
	                                        c[720] = c[720] & ~(1 << a);
	                                        break;
	                                    }
	                                } else {
	                                    if (g >>> 0 < (c[723] | 0) >>> 0)
	                                        ka();
	                                    a = g + 16 | 0;
	                                    if ((c[a >> 2] | 0) == (j | 0))
	                                        c[a >> 2] = s;
	                                    else
	                                        c[g + 20 >> 2] = s;
	                                    if (!s)
	                                        break;
	                                }
	                                b = c[723] | 0;
	                                if (s >>> 0 < b >>> 0)
	                                    ka();
	                                c[s + 24 >> 2] = g;
	                                a = c[j + 16 >> 2] | 0;
	                                do
	                                    if (a | 0)
	                                        if (a >>> 0 < b >>> 0)
	                                            ka();
	                                        else {
	                                            c[s + 16 >> 2] = a;
	                                            c[a + 24 >> 2] = s;
	                                            break;
	                                        }
	                                while (0);
	                                a = c[j + 20 >> 2] | 0;
	                                if (a | 0)
	                                    if (a >>> 0 < (c[723] | 0) >>> 0)
	                                        ka();
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
	                                    d = 2916 + (a << 1 << 2) | 0;
	                                    b = c[719] | 0;
	                                    a = 1 << a;
	                                    if (b & a) {
	                                        a = d + 8 | 0;
	                                        b = c[a >> 2] | 0;
	                                        if (b >>> 0 < (c[723] | 0) >>> 0)
	                                            ka();
	                                        else {
	                                            u = a;
	                                            v = b;
	                                        }
	                                    } else {
	                                        c[719] = b | a;
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
	                                e = 3180 + (d << 2) | 0;
	                                c[h + 28 >> 2] = d;
	                                a = h + 16 | 0;
	                                c[a + 4 >> 2] = 0;
	                                c[a >> 2] = 0;
	                                a = c[720] | 0;
	                                b = 1 << d;
	                                if (!(a & b)) {
	                                    c[720] = a | b;
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
	                                    if (b >>> 0 < (c[723] | 0) >>> 0)
	                                        ka();
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
	                                    L = c[723] | 0;
	                                    if (b >>> 0 >= L >>> 0 & d >>> 0 >= L >>> 0) {
	                                        c[b + 12 >> 2] = h;
	                                        c[a >> 2] = h;
	                                        c[h + 8 >> 2] = b;
	                                        c[h + 12 >> 2] = d;
	                                        c[h + 24 >> 2] = 0;
	                                        break;
	                                    } else
	                                        ka();
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
	        d = c[721] | 0;
	        if (d >>> 0 >= o >>> 0) {
	            a = d - o | 0;
	            b = c[724] | 0;
	            if (a >>> 0 > 15) {
	                L = b + o | 0;
	                c[724] = L;
	                c[721] = a;
	                c[L + 4 >> 2] = a | 1;
	                c[L + a >> 2] = a;
	                c[b + 4 >> 2] = o | 3;
	            } else {
	                c[721] = 0;
	                c[724] = 0;
	                c[b + 4 >> 2] = d | 3;
	                L = b + d + 4 | 0;
	                c[L >> 2] = c[L >> 2] | 1;
	            }
	            L = b + 8 | 0;
	            return L | 0;
	        }
	        a = c[722] | 0;
	        if (a >>> 0 > o >>> 0) {
	            J = a - o | 0;
	            c[722] = J;
	            L = c[725] | 0;
	            K = L + o | 0;
	            c[725] = K;
	            c[K + 4 >> 2] = J | 1;
	            c[L + 4 >> 2] = o | 3;
	            L = L + 8 | 0;
	            return L | 0;
	        }
	        do
	            if (!(c[837] | 0)) {
	                a = ua(30) | 0;
	                if (!(a + -1 & a)) {
	                    c[839] = a;
	                    c[838] = a;
	                    c[840] = -1;
	                    c[841] = -1;
	                    c[842] = 0;
	                    c[830] = 0;
	                    c[837] = (oa(0) | 0) & -16 ^ 1431655768;
	                    break;
	                } else
	                    ka();
	            }
	        while (0);
	        h = o + 48 | 0;
	        g = c[839] | 0;
	        i = o + 47 | 0;
	        f = g + i | 0;
	        g = 0 - g | 0;
	        j = f & g;
	        if (j >>> 0 <= o >>> 0) {
	            L = 0;
	            return L | 0;
	        }
	        a = c[829] | 0;
	        if (a | 0 ? (u = c[827] | 0, v = u + j | 0, v >>> 0 <= u >>> 0 | v >>> 0 > a >>> 0) : 0) {
	            L = 0;
	            return L | 0;
	        }
	        b:
	            do
	                if (!(c[830] & 4)) {
	                    a = c[725] | 0;
	                    c:
	                        do
	                            if (a) {
	                                d = 3324;
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
	                                a = f - (c[722] | 0) & g;
	                                if (a >>> 0 < 2147483647) {
	                                    b = na(a | 0) | 0;
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
	                        if ((E | 0) == 173 ? (t = na(0) | 0, (t | 0) != (-1 | 0)) : 0) {
	                            a = t;
	                            b = c[838] | 0;
	                            d = b + -1 | 0;
	                            if (!(d & a))
	                                a = j;
	                            else
	                                a = j - a + (d + a & 0 - b) | 0;
	                            b = c[827] | 0;
	                            d = b + a | 0;
	                            if (a >>> 0 > o >>> 0 & a >>> 0 < 2147483647) {
	                                v = c[829] | 0;
	                                if (v | 0 ? d >>> 0 <= b >>> 0 | d >>> 0 > v >>> 0 : 0)
	                                    break;
	                                b = na(a | 0) | 0;
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
	                                    if (h >>> 0 > a >>> 0 & (a >>> 0 < 2147483647 & (b | 0) != (-1 | 0)) ? (w = c[839] | 0, w = i - a + w & 0 - w, w >>> 0 < 2147483647) : 0)
	                                        if ((na(w | 0) | 0) == (-1 | 0)) {
	                                            na(d | 0) | 0;
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
	                    c[830] = c[830] | 4;
	                    E = 190;
	                } else
	                    E = 190;
	            while (0);
	        if ((((E | 0) == 190 ? j >>> 0 < 2147483647 : 0) ? (x = na(j | 0) | 0, y = na(0) | 0, x >>> 0 < y >>> 0 & ((x | 0) != (-1 | 0) & (y | 0) != (-1 | 0))) : 0) ? (z = y - x | 0, z >>> 0 > (o + 40 | 0) >>> 0) : 0) {
	            h = x;
	            f = z;
	            E = 193;
	        }
	        if ((E | 0) == 193) {
	            a = (c[827] | 0) + f | 0;
	            c[827] = a;
	            if (a >>> 0 > (c[828] | 0) >>> 0)
	                c[828] = a;
	            i = c[725] | 0;
	            do
	                if (i) {
	                    e = 3324;
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
	                        L = f - L + (c[722] | 0) | 0;
	                        c[725] = K;
	                        c[722] = L;
	                        c[K + 4 >> 2] = L | 1;
	                        c[K + L + 4 >> 2] = 40;
	                        c[726] = c[841];
	                        break;
	                    }
	                    a = c[723] | 0;
	                    if (h >>> 0 < a >>> 0) {
	                        c[723] = h;
	                        j = h;
	                    } else
	                        j = a;
	                    d = h + f | 0;
	                    a = 3324;
	                    while (1) {
	                        if ((c[a >> 2] | 0) == (d | 0)) {
	                            b = a;
	                            E = 211;
	                            break;
	                        }
	                        a = c[a + 8 >> 2] | 0;
	                        if (!a) {
	                            b = 3324;
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
	                                    if ((a | 0) == (c[724] | 0)) {
	                                        L = (c[721] | 0) + g | 0;
	                                        c[721] = L;
	                                        c[724] = k;
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
	                                                                ka();
	                                                            else {
	                                                                c[d >> 2] = 0;
	                                                                J = b;
	                                                                break;
	                                                            }
	                                                        } else {
	                                                            f = c[a + 8 >> 2] | 0;
	                                                            if (f >>> 0 < j >>> 0)
	                                                                ka();
	                                                            b = f + 12 | 0;
	                                                            if ((c[b >> 2] | 0) != (a | 0))
	                                                                ka();
	                                                            d = e + 8 | 0;
	                                                            if ((c[d >> 2] | 0) == (a | 0)) {
	                                                                c[b >> 2] = e;
	                                                                c[d >> 2] = f;
	                                                                J = e;
	                                                                break;
	                                                            } else
	                                                                ka();
	                                                        }
	                                                    while (0);
	                                                    if (!h)
	                                                        break;
	                                                    b = c[a + 28 >> 2] | 0;
	                                                    d = 3180 + (b << 2) | 0;
	                                                    do
	                                                        if ((a | 0) != (c[d >> 2] | 0)) {
	                                                            if (h >>> 0 < (c[723] | 0) >>> 0)
	                                                                ka();
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
	                                                            c[720] = c[720] & ~(1 << b);
	                                                            break e;
	                                                        }
	                                                    while (0);
	                                                    e = c[723] | 0;
	                                                    if (J >>> 0 < e >>> 0)
	                                                        ka();
	                                                    c[J + 24 >> 2] = h;
	                                                    b = a + 16 | 0;
	                                                    d = c[b >> 2] | 0;
	                                                    do
	                                                        if (d | 0)
	                                                            if (d >>> 0 < e >>> 0)
	                                                                ka();
	                                                            else {
	                                                                c[J + 16 >> 2] = d;
	                                                                c[d + 24 >> 2] = J;
	                                                                break;
	                                                            }
	                                                    while (0);
	                                                    b = c[b + 4 >> 2] | 0;
	                                                    if (!b)
	                                                        break;
	                                                    if (b >>> 0 < (c[723] | 0) >>> 0)
	                                                        ka();
	                                                    else {
	                                                        c[J + 20 >> 2] = b;
	                                                        c[b + 24 >> 2] = J;
	                                                        break;
	                                                    }
	                                                } else {
	                                                    d = c[a + 8 >> 2] | 0;
	                                                    e = c[a + 12 >> 2] | 0;
	                                                    b = 2916 + (f << 1 << 2) | 0;
	                                                    do
	                                                        if ((d | 0) != (b | 0)) {
	                                                            if (d >>> 0 < j >>> 0)
	                                                                ka();
	                                                            if ((c[d + 12 >> 2] | 0) == (a | 0))
	                                                                break;
	                                                            ka();
	                                                        }
	                                                    while (0);
	                                                    if ((e | 0) == (d | 0)) {
	                                                        c[719] = c[719] & ~(1 << f);
	                                                        break;
	                                                    }
	                                                    do
	                                                        if ((e | 0) == (b | 0))
	                                                            G = e + 8 | 0;
	                                                        else {
	                                                            if (e >>> 0 < j >>> 0)
	                                                                ka();
	                                                            b = e + 8 | 0;
	                                                            if ((c[b >> 2] | 0) == (a | 0)) {
	                                                                G = b;
	                                                                break;
	                                                            }
	                                                            ka();
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
	                                        d = 2916 + (a << 1 << 2) | 0;
	                                        b = c[719] | 0;
	                                        a = 1 << a;
	                                        do
	                                            if (!(b & a)) {
	                                                c[719] = b | a;
	                                                K = d + 8 | 0;
	                                                L = d;
	                                            } else {
	                                                a = d + 8 | 0;
	                                                b = c[a >> 2] | 0;
	                                                if (b >>> 0 >= (c[723] | 0) >>> 0) {
	                                                    K = a;
	                                                    L = b;
	                                                    break;
	                                                }
	                                                ka();
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
	                                    e = 3180 + (d << 2) | 0;
	                                    c[k + 28 >> 2] = d;
	                                    a = k + 16 | 0;
	                                    c[a + 4 >> 2] = 0;
	                                    c[a >> 2] = 0;
	                                    a = c[720] | 0;
	                                    b = 1 << d;
	                                    if (!(a & b)) {
	                                        c[720] = a | b;
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
	                                        if (b >>> 0 < (c[723] | 0) >>> 0)
	                                            ka();
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
	                                        L = c[723] | 0;
	                                        if (b >>> 0 >= L >>> 0 & d >>> 0 >= L >>> 0) {
	                                            c[b + 12 >> 2] = k;
	                                            c[a >> 2] = k;
	                                            c[k + 8 >> 2] = b;
	                                            c[k + 12 >> 2] = d;
	                                            c[k + 24 >> 2] = 0;
	                                            break;
	                                        } else
	                                            ka();
	                                    }
	                                } else {
	                                    L = (c[722] | 0) + g | 0;
	                                    c[722] = L;
	                                    c[725] = k;
	                                    c[k + 4 >> 2] = L | 1;
	                                }
	                            while (0);
	                            L = l + 8 | 0;
	                            return L | 0;
	                        } else
	                            b = 3324;
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
	                    c[725] = L;
	                    c[722] = e;
	                    c[L + 4 >> 2] = e | 1;
	                    c[L + e + 4 >> 2] = 40;
	                    c[726] = c[841];
	                    e = d + 4 | 0;
	                    c[e >> 2] = 27;
	                    c[a >> 2] = c[831];
	                    c[a + 4 >> 2] = c[832];
	                    c[a + 8 >> 2] = c[833];
	                    c[a + 12 >> 2] = c[834];
	                    c[831] = h;
	                    c[832] = f;
	                    c[834] = 0;
	                    c[833] = a;
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
	                            d = 2916 + (a << 1 << 2) | 0;
	                            b = c[719] | 0;
	                            a = 1 << a;
	                            if (b & a) {
	                                a = d + 8 | 0;
	                                b = c[a >> 2] | 0;
	                                if (b >>> 0 < (c[723] | 0) >>> 0)
	                                    ka();
	                                else {
	                                    H = a;
	                                    I = b;
	                                }
	                            } else {
	                                c[719] = b | a;
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
	                        f = 3180 + (d << 2) | 0;
	                        c[i + 28 >> 2] = d;
	                        c[i + 20 >> 2] = 0;
	                        c[g >> 2] = 0;
	                        a = c[720] | 0;
	                        b = 1 << d;
	                        if (!(a & b)) {
	                            c[720] = a | b;
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
	                            if (b >>> 0 < (c[723] | 0) >>> 0)
	                                ka();
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
	                            L = c[723] | 0;
	                            if (b >>> 0 >= L >>> 0 & d >>> 0 >= L >>> 0) {
	                                c[b + 12 >> 2] = i;
	                                c[a >> 2] = i;
	                                c[i + 8 >> 2] = b;
	                                c[i + 12 >> 2] = d;
	                                c[i + 24 >> 2] = 0;
	                                break;
	                            } else
	                                ka();
	                        }
	                    }
	                } else {
	                    L = c[723] | 0;
	                    if ((L | 0) == 0 | h >>> 0 < L >>> 0)
	                        c[723] = h;
	                    c[831] = h;
	                    c[832] = f;
	                    c[834] = 0;
	                    c[728] = c[837];
	                    c[727] = -1;
	                    a = 0;
	                    do {
	                        L = 2916 + (a << 1 << 2) | 0;
	                        c[L + 12 >> 2] = L;
	                        c[L + 8 >> 2] = L;
	                        a = a + 1 | 0;
	                    } while ((a | 0) != 32);
	                    L = h + 8 | 0;
	                    L = (L & 7 | 0) == 0 ? 0 : 0 - L & 7;
	                    K = h + L | 0;
	                    L = f + -40 - L | 0;
	                    c[725] = K;
	                    c[722] = L;
	                    c[K + 4 >> 2] = L | 1;
	                    c[K + L + 4 >> 2] = 40;
	                    c[726] = c[841];
	                }
	            while (0);
	            a = c[722] | 0;
	            if (a >>> 0 > o >>> 0) {
	                J = a - o | 0;
	                c[722] = J;
	                L = c[725] | 0;
	                K = L + o | 0;
	                c[725] = K;
	                c[K + 4 >> 2] = J | 1;
	                c[L + 4 >> 2] = o | 3;
	                L = L + 8 | 0;
	                return L | 0;
	            }
	        }
	        c[(Oa() | 0) >> 2] = 12;
	        L = 0;
	        return L | 0;
	    }
	    function zb(a) {
	        a = a | 0;
	        var b = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0;
	        if (!a)
	            return;
	        d = a + -8 | 0;
	        h = c[723] | 0;
	        if (d >>> 0 < h >>> 0)
	            ka();
	        a = c[a + -4 >> 2] | 0;
	        b = a & 3;
	        if ((b | 0) == 1)
	            ka();
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
	                    ka();
	                if ((k | 0) == (c[724] | 0)) {
	                    a = m + 4 | 0;
	                    b = c[a >> 2] | 0;
	                    if ((b & 3 | 0) != 3) {
	                        q = k;
	                        g = j;
	                        break;
	                    }
	                    c[721] = j;
	                    c[a >> 2] = b & -2;
	                    c[k + 4 >> 2] = j | 1;
	                    c[k + j >> 2] = j;
	                    return;
	                }
	                e = a >>> 3;
	                if (a >>> 0 < 256) {
	                    b = c[k + 8 >> 2] | 0;
	                    d = c[k + 12 >> 2] | 0;
	                    a = 2916 + (e << 1 << 2) | 0;
	                    if ((b | 0) != (a | 0)) {
	                        if (b >>> 0 < h >>> 0)
	                            ka();
	                        if ((c[b + 12 >> 2] | 0) != (k | 0))
	                            ka();
	                    }
	                    if ((d | 0) == (b | 0)) {
	                        c[719] = c[719] & ~(1 << e);
	                        q = k;
	                        g = j;
	                        break;
	                    }
	                    if ((d | 0) != (a | 0)) {
	                        if (d >>> 0 < h >>> 0)
	                            ka();
	                        a = d + 8 | 0;
	                        if ((c[a >> 2] | 0) == (k | 0))
	                            f = a;
	                        else
	                            ka();
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
	                            ka();
	                        else {
	                            c[b >> 2] = 0;
	                            i = a;
	                            break;
	                        }
	                    } else {
	                        e = c[k + 8 >> 2] | 0;
	                        if (e >>> 0 < h >>> 0)
	                            ka();
	                        a = e + 12 | 0;
	                        if ((c[a >> 2] | 0) != (k | 0))
	                            ka();
	                        b = d + 8 | 0;
	                        if ((c[b >> 2] | 0) == (k | 0)) {
	                            c[a >> 2] = d;
	                            c[b >> 2] = e;
	                            i = d;
	                            break;
	                        } else
	                            ka();
	                    }
	                while (0);
	                if (f) {
	                    a = c[k + 28 >> 2] | 0;
	                    b = 3180 + (a << 2) | 0;
	                    if ((k | 0) == (c[b >> 2] | 0)) {
	                        c[b >> 2] = i;
	                        if (!i) {
	                            c[720] = c[720] & ~(1 << a);
	                            q = k;
	                            g = j;
	                            break;
	                        }
	                    } else {
	                        if (f >>> 0 < (c[723] | 0) >>> 0)
	                            ka();
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
	                    d = c[723] | 0;
	                    if (i >>> 0 < d >>> 0)
	                        ka();
	                    c[i + 24 >> 2] = f;
	                    a = k + 16 | 0;
	                    b = c[a >> 2] | 0;
	                    do
	                        if (b | 0)
	                            if (b >>> 0 < d >>> 0)
	                                ka();
	                            else {
	                                c[i + 16 >> 2] = b;
	                                c[b + 24 >> 2] = i;
	                                break;
	                            }
	                    while (0);
	                    a = c[a + 4 >> 2] | 0;
	                    if (a)
	                        if (a >>> 0 < (c[723] | 0) >>> 0)
	                            ka();
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
	            ka();
	        a = m + 4 | 0;
	        b = c[a >> 2] | 0;
	        if (!(b & 1))
	            ka();
	        if (!(b & 2)) {
	            if ((m | 0) == (c[725] | 0)) {
	                p = (c[722] | 0) + g | 0;
	                c[722] = p;
	                c[725] = q;
	                c[q + 4 >> 2] = p | 1;
	                if ((q | 0) != (c[724] | 0))
	                    return;
	                c[724] = 0;
	                c[721] = 0;
	                return;
	            }
	            if ((m | 0) == (c[724] | 0)) {
	                p = (c[721] | 0) + g | 0;
	                c[721] = p;
	                c[724] = q;
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
	                            if (b >>> 0 < (c[723] | 0) >>> 0)
	                                ka();
	                            else {
	                                c[b >> 2] = 0;
	                                n = a;
	                                break;
	                            }
	                        } else {
	                            b = c[m + 8 >> 2] | 0;
	                            if (b >>> 0 < (c[723] | 0) >>> 0)
	                                ka();
	                            d = b + 12 | 0;
	                            if ((c[d >> 2] | 0) != (m | 0))
	                                ka();
	                            e = a + 8 | 0;
	                            if ((c[e >> 2] | 0) == (m | 0)) {
	                                c[d >> 2] = a;
	                                c[e >> 2] = b;
	                                n = a;
	                                break;
	                            } else
	                                ka();
	                        }
	                    while (0);
	                    if (f | 0) {
	                        a = c[m + 28 >> 2] | 0;
	                        b = 3180 + (a << 2) | 0;
	                        if ((m | 0) == (c[b >> 2] | 0)) {
	                            c[b >> 2] = n;
	                            if (!n) {
	                                c[720] = c[720] & ~(1 << a);
	                                break;
	                            }
	                        } else {
	                            if (f >>> 0 < (c[723] | 0) >>> 0)
	                                ka();
	                            a = f + 16 | 0;
	                            if ((c[a >> 2] | 0) == (m | 0))
	                                c[a >> 2] = n;
	                            else
	                                c[f + 20 >> 2] = n;
	                            if (!n)
	                                break;
	                        }
	                        d = c[723] | 0;
	                        if (n >>> 0 < d >>> 0)
	                            ka();
	                        c[n + 24 >> 2] = f;
	                        a = m + 16 | 0;
	                        b = c[a >> 2] | 0;
	                        do
	                            if (b | 0)
	                                if (b >>> 0 < d >>> 0)
	                                    ka();
	                                else {
	                                    c[n + 16 >> 2] = b;
	                                    c[b + 24 >> 2] = n;
	                                    break;
	                                }
	                        while (0);
	                        a = c[a + 4 >> 2] | 0;
	                        if (a | 0)
	                            if (a >>> 0 < (c[723] | 0) >>> 0)
	                                ka();
	                            else {
	                                c[n + 20 >> 2] = a;
	                                c[a + 24 >> 2] = n;
	                                break;
	                            }
	                    }
	                } else {
	                    b = c[m + 8 >> 2] | 0;
	                    d = c[m + 12 >> 2] | 0;
	                    a = 2916 + (e << 1 << 2) | 0;
	                    if ((b | 0) != (a | 0)) {
	                        if (b >>> 0 < (c[723] | 0) >>> 0)
	                            ka();
	                        if ((c[b + 12 >> 2] | 0) != (m | 0))
	                            ka();
	                    }
	                    if ((d | 0) == (b | 0)) {
	                        c[719] = c[719] & ~(1 << e);
	                        break;
	                    }
	                    if ((d | 0) != (a | 0)) {
	                        if (d >>> 0 < (c[723] | 0) >>> 0)
	                            ka();
	                        a = d + 8 | 0;
	                        if ((c[a >> 2] | 0) == (m | 0))
	                            l = a;
	                        else
	                            ka();
	                    } else
	                        l = d + 8 | 0;
	                    c[b + 12 >> 2] = d;
	                    c[l >> 2] = b;
	                }
	            while (0);
	            c[q + 4 >> 2] = g | 1;
	            c[q + g >> 2] = g;
	            if ((q | 0) == (c[724] | 0)) {
	                c[721] = g;
	                return;
	            }
	        } else {
	            c[a >> 2] = b & -2;
	            c[q + 4 >> 2] = g | 1;
	            c[q + g >> 2] = g;
	        }
	        a = g >>> 3;
	        if (g >>> 0 < 256) {
	            d = 2916 + (a << 1 << 2) | 0;
	            b = c[719] | 0;
	            a = 1 << a;
	            if (b & a) {
	                a = d + 8 | 0;
	                b = c[a >> 2] | 0;
	                if (b >>> 0 < (c[723] | 0) >>> 0)
	                    ka();
	                else {
	                    o = a;
	                    p = b;
	                }
	            } else {
	                c[719] = b | a;
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
	        e = 3180 + (d << 2) | 0;
	        c[q + 28 >> 2] = d;
	        c[q + 20 >> 2] = 0;
	        c[q + 16 >> 2] = 0;
	        a = c[720] | 0;
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
	                    if (b >>> 0 < (c[723] | 0) >>> 0)
	                        ka();
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
	                    p = c[723] | 0;
	                    if (b >>> 0 >= p >>> 0 & d >>> 0 >= p >>> 0) {
	                        c[b + 12 >> 2] = q;
	                        c[a >> 2] = q;
	                        c[q + 8 >> 2] = b;
	                        c[q + 12 >> 2] = d;
	                        c[q + 24 >> 2] = 0;
	                        break;
	                    } else
	                        ka();
	                }
	            } else {
	                c[720] = a | b;
	                c[e >> 2] = q;
	                c[q + 24 >> 2] = e;
	                c[q + 12 >> 2] = q;
	                c[q + 8 >> 2] = q;
	            }
	        while (0);
	        q = (c[727] | 0) + -1 | 0;
	        c[727] = q;
	        if (!q)
	            a = 3332;
	        else
	            return;
	        while (1) {
	            a = c[a >> 2] | 0;
	            if (!a)
	                break;
	            else
	                a = a + 8 | 0;
	        }
	        c[727] = -1;
	        return;
	    }
	    function Ab(a, b) {
	        a = a | 0;
	        b = b | 0;
	        var d = 0, e = 0;
	        if (!a) {
	            a = yb(b) | 0;
	            return a | 0;
	        }
	        if (b >>> 0 > 4294967231) {
	            c[(Oa() | 0) >> 2] = 12;
	            a = 0;
	            return a | 0;
	        }
	        d = Bb(a + -8 | 0, b >>> 0 < 11 ? 16 : b + 11 & -8) | 0;
	        if (d | 0) {
	            a = d + 8 | 0;
	            return a | 0;
	        }
	        d = yb(b) | 0;
	        if (!d) {
	            a = 0;
	            return a | 0;
	        }
	        e = c[a + -4 >> 2] | 0;
	        e = (e & -8) - ((e & 3 | 0) == 0 ? 8 : 4) | 0;
	        Jb(d | 0, a | 0, (e >>> 0 < b >>> 0 ? e : b) | 0) | 0;
	        zb(a);
	        a = d;
	        return a | 0;
	    }
	    function Bb(a, b) {
	        a = a | 0;
	        b = b | 0;
	        var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0;
	        n = a + 4 | 0;
	        o = c[n >> 2] | 0;
	        d = o & -8;
	        k = a + d | 0;
	        i = c[723] | 0;
	        e = o & 3;
	        if (!((e | 0) != 1 & a >>> 0 >= i >>> 0 & a >>> 0 < k >>> 0))
	            ka();
	        f = c[k + 4 >> 2] | 0;
	        if (!(f & 1))
	            ka();
	        if (!e) {
	            if (b >>> 0 < 256) {
	                a = 0;
	                return a | 0;
	            }
	            if (d >>> 0 >= (b + 4 | 0) >>> 0 ? (d - b | 0) >>> 0 <= c[839] << 1 >>> 0 : 0)
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
	            Cb(m, d);
	            return a | 0;
	        }
	        if ((k | 0) == (c[725] | 0)) {
	            d = (c[722] | 0) + d | 0;
	            if (d >>> 0 <= b >>> 0) {
	                a = 0;
	                return a | 0;
	            }
	            m = d - b | 0;
	            l = a + b | 0;
	            c[n >> 2] = o & 1 | b | 2;
	            c[l + 4 >> 2] = m | 1;
	            c[725] = l;
	            c[722] = m;
	            return a | 0;
	        }
	        if ((k | 0) == (c[724] | 0)) {
	            e = (c[721] | 0) + d | 0;
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
	            c[721] = d;
	            c[724] = e;
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
	                            ka();
	                        else {
	                            c[e >> 2] = 0;
	                            j = d;
	                            break;
	                        }
	                    } else {
	                        g = c[k + 8 >> 2] | 0;
	                        if (g >>> 0 < i >>> 0)
	                            ka();
	                        d = g + 12 | 0;
	                        if ((c[d >> 2] | 0) != (k | 0))
	                            ka();
	                        e = f + 8 | 0;
	                        if ((c[e >> 2] | 0) == (k | 0)) {
	                            c[d >> 2] = f;
	                            c[e >> 2] = g;
	                            j = f;
	                            break;
	                        } else
	                            ka();
	                    }
	                while (0);
	                if (h | 0) {
	                    d = c[k + 28 >> 2] | 0;
	                    e = 3180 + (d << 2) | 0;
	                    if ((k | 0) == (c[e >> 2] | 0)) {
	                        c[e >> 2] = j;
	                        if (!j) {
	                            c[720] = c[720] & ~(1 << d);
	                            break;
	                        }
	                    } else {
	                        if (h >>> 0 < (c[723] | 0) >>> 0)
	                            ka();
	                        d = h + 16 | 0;
	                        if ((c[d >> 2] | 0) == (k | 0))
	                            c[d >> 2] = j;
	                        else
	                            c[h + 20 >> 2] = j;
	                        if (!j)
	                            break;
	                    }
	                    f = c[723] | 0;
	                    if (j >>> 0 < f >>> 0)
	                        ka();
	                    c[j + 24 >> 2] = h;
	                    d = k + 16 | 0;
	                    e = c[d >> 2] | 0;
	                    do
	                        if (e | 0)
	                            if (e >>> 0 < f >>> 0)
	                                ka();
	                            else {
	                                c[j + 16 >> 2] = e;
	                                c[e + 24 >> 2] = j;
	                                break;
	                            }
	                    while (0);
	                    d = c[d + 4 >> 2] | 0;
	                    if (d | 0)
	                        if (d >>> 0 < (c[723] | 0) >>> 0)
	                            ka();
	                        else {
	                            c[j + 20 >> 2] = d;
	                            c[d + 24 >> 2] = j;
	                            break;
	                        }
	                }
	            } else {
	                e = c[k + 8 >> 2] | 0;
	                f = c[k + 12 >> 2] | 0;
	                d = 2916 + (g << 1 << 2) | 0;
	                if ((e | 0) != (d | 0)) {
	                    if (e >>> 0 < i >>> 0)
	                        ka();
	                    if ((c[e + 12 >> 2] | 0) != (k | 0))
	                        ka();
	                }
	                if ((f | 0) == (e | 0)) {
	                    c[719] = c[719] & ~(1 << g);
	                    break;
	                }
	                if ((f | 0) != (d | 0)) {
	                    if (f >>> 0 < i >>> 0)
	                        ka();
	                    d = f + 8 | 0;
	                    if ((c[d >> 2] | 0) == (k | 0))
	                        h = d;
	                    else
	                        ka();
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
	            Cb(l, m);
	            return a | 0;
	        }
	        return 0;
	    }
	    function Cb(a, b) {
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
	                i = c[723] | 0;
	                if (l >>> 0 < i >>> 0)
	                    ka();
	                if ((l | 0) == (c[724] | 0)) {
	                    a = o + 4 | 0;
	                    d = c[a >> 2] | 0;
	                    if ((d & 3 | 0) != 3) {
	                        r = l;
	                        g = k;
	                        break;
	                    }
	                    c[721] = k;
	                    c[a >> 2] = d & -2;
	                    c[l + 4 >> 2] = k | 1;
	                    c[l + k >> 2] = k;
	                    return;
	                }
	                e = f >>> 3;
	                if (f >>> 0 < 256) {
	                    a = c[l + 8 >> 2] | 0;
	                    b = c[l + 12 >> 2] | 0;
	                    d = 2916 + (e << 1 << 2) | 0;
	                    if ((a | 0) != (d | 0)) {
	                        if (a >>> 0 < i >>> 0)
	                            ka();
	                        if ((c[a + 12 >> 2] | 0) != (l | 0))
	                            ka();
	                    }
	                    if ((b | 0) == (a | 0)) {
	                        c[719] = c[719] & ~(1 << e);
	                        r = l;
	                        g = k;
	                        break;
	                    }
	                    if ((b | 0) != (d | 0)) {
	                        if (b >>> 0 < i >>> 0)
	                            ka();
	                        d = b + 8 | 0;
	                        if ((c[d >> 2] | 0) == (l | 0))
	                            h = d;
	                        else
	                            ka();
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
	                            ka();
	                        else {
	                            c[a >> 2] = 0;
	                            j = d;
	                            break;
	                        }
	                    } else {
	                        e = c[l + 8 >> 2] | 0;
	                        if (e >>> 0 < i >>> 0)
	                            ka();
	                        d = e + 12 | 0;
	                        if ((c[d >> 2] | 0) != (l | 0))
	                            ka();
	                        a = b + 8 | 0;
	                        if ((c[a >> 2] | 0) == (l | 0)) {
	                            c[d >> 2] = b;
	                            c[a >> 2] = e;
	                            j = b;
	                            break;
	                        } else
	                            ka();
	                    }
	                while (0);
	                if (f) {
	                    d = c[l + 28 >> 2] | 0;
	                    a = 3180 + (d << 2) | 0;
	                    if ((l | 0) == (c[a >> 2] | 0)) {
	                        c[a >> 2] = j;
	                        if (!j) {
	                            c[720] = c[720] & ~(1 << d);
	                            r = l;
	                            g = k;
	                            break;
	                        }
	                    } else {
	                        if (f >>> 0 < (c[723] | 0) >>> 0)
	                            ka();
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
	                    b = c[723] | 0;
	                    if (j >>> 0 < b >>> 0)
	                        ka();
	                    c[j + 24 >> 2] = f;
	                    d = l + 16 | 0;
	                    a = c[d >> 2] | 0;
	                    do
	                        if (a | 0)
	                            if (a >>> 0 < b >>> 0)
	                                ka();
	                            else {
	                                c[j + 16 >> 2] = a;
	                                c[a + 24 >> 2] = j;
	                                break;
	                            }
	                    while (0);
	                    d = c[d + 4 >> 2] | 0;
	                    if (d)
	                        if (d >>> 0 < (c[723] | 0) >>> 0)
	                            ka();
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
	        h = c[723] | 0;
	        if (o >>> 0 < h >>> 0)
	            ka();
	        d = o + 4 | 0;
	        a = c[d >> 2] | 0;
	        if (!(a & 2)) {
	            if ((o | 0) == (c[725] | 0)) {
	                q = (c[722] | 0) + g | 0;
	                c[722] = q;
	                c[725] = r;
	                c[r + 4 >> 2] = q | 1;
	                if ((r | 0) != (c[724] | 0))
	                    return;
	                c[724] = 0;
	                c[721] = 0;
	                return;
	            }
	            if ((o | 0) == (c[724] | 0)) {
	                q = (c[721] | 0) + g | 0;
	                c[721] = q;
	                c[724] = r;
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
	                                ka();
	                            else {
	                                c[a >> 2] = 0;
	                                n = d;
	                                break;
	                            }
	                        } else {
	                            e = c[o + 8 >> 2] | 0;
	                            if (e >>> 0 < h >>> 0)
	                                ka();
	                            d = e + 12 | 0;
	                            if ((c[d >> 2] | 0) != (o | 0))
	                                ka();
	                            a = b + 8 | 0;
	                            if ((c[a >> 2] | 0) == (o | 0)) {
	                                c[d >> 2] = b;
	                                c[a >> 2] = e;
	                                n = b;
	                                break;
	                            } else
	                                ka();
	                        }
	                    while (0);
	                    if (f | 0) {
	                        d = c[o + 28 >> 2] | 0;
	                        a = 3180 + (d << 2) | 0;
	                        if ((o | 0) == (c[a >> 2] | 0)) {
	                            c[a >> 2] = n;
	                            if (!n) {
	                                c[720] = c[720] & ~(1 << d);
	                                break;
	                            }
	                        } else {
	                            if (f >>> 0 < (c[723] | 0) >>> 0)
	                                ka();
	                            d = f + 16 | 0;
	                            if ((c[d >> 2] | 0) == (o | 0))
	                                c[d >> 2] = n;
	                            else
	                                c[f + 20 >> 2] = n;
	                            if (!n)
	                                break;
	                        }
	                        b = c[723] | 0;
	                        if (n >>> 0 < b >>> 0)
	                            ka();
	                        c[n + 24 >> 2] = f;
	                        d = o + 16 | 0;
	                        a = c[d >> 2] | 0;
	                        do
	                            if (a | 0)
	                                if (a >>> 0 < b >>> 0)
	                                    ka();
	                                else {
	                                    c[n + 16 >> 2] = a;
	                                    c[a + 24 >> 2] = n;
	                                    break;
	                                }
	                        while (0);
	                        d = c[d + 4 >> 2] | 0;
	                        if (d | 0)
	                            if (d >>> 0 < (c[723] | 0) >>> 0)
	                                ka();
	                            else {
	                                c[n + 20 >> 2] = d;
	                                c[d + 24 >> 2] = n;
	                                break;
	                            }
	                    }
	                } else {
	                    a = c[o + 8 >> 2] | 0;
	                    b = c[o + 12 >> 2] | 0;
	                    d = 2916 + (e << 1 << 2) | 0;
	                    if ((a | 0) != (d | 0)) {
	                        if (a >>> 0 < h >>> 0)
	                            ka();
	                        if ((c[a + 12 >> 2] | 0) != (o | 0))
	                            ka();
	                    }
	                    if ((b | 0) == (a | 0)) {
	                        c[719] = c[719] & ~(1 << e);
	                        break;
	                    }
	                    if ((b | 0) != (d | 0)) {
	                        if (b >>> 0 < h >>> 0)
	                            ka();
	                        d = b + 8 | 0;
	                        if ((c[d >> 2] | 0) == (o | 0))
	                            m = d;
	                        else
	                            ka();
	                    } else
	                        m = b + 8 | 0;
	                    c[a + 12 >> 2] = b;
	                    c[m >> 2] = a;
	                }
	            while (0);
	            c[r + 4 >> 2] = g | 1;
	            c[r + g >> 2] = g;
	            if ((r | 0) == (c[724] | 0)) {
	                c[721] = g;
	                return;
	            }
	        } else {
	            c[d >> 2] = a & -2;
	            c[r + 4 >> 2] = g | 1;
	            c[r + g >> 2] = g;
	        }
	        d = g >>> 3;
	        if (g >>> 0 < 256) {
	            b = 2916 + (d << 1 << 2) | 0;
	            a = c[719] | 0;
	            d = 1 << d;
	            if (a & d) {
	                d = b + 8 | 0;
	                a = c[d >> 2] | 0;
	                if (a >>> 0 < (c[723] | 0) >>> 0)
	                    ka();
	                else {
	                    p = d;
	                    q = a;
	                }
	            } else {
	                c[719] = a | d;
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
	        e = 3180 + (b << 2) | 0;
	        c[r + 28 >> 2] = b;
	        c[r + 20 >> 2] = 0;
	        c[r + 16 >> 2] = 0;
	        d = c[720] | 0;
	        a = 1 << b;
	        if (!(d & a)) {
	            c[720] = d | a;
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
	            if (a >>> 0 < (c[723] | 0) >>> 0)
	                ka();
	            c[a >> 2] = r;
	            c[r + 24 >> 2] = d;
	            c[r + 12 >> 2] = r;
	            c[r + 8 >> 2] = r;
	            return;
	        } else if ((e | 0) == 127) {
	            d = b + 8 | 0;
	            a = c[d >> 2] | 0;
	            q = c[723] | 0;
	            if (!(a >>> 0 >= q >>> 0 & b >>> 0 >= q >>> 0))
	                ka();
	            c[a + 12 >> 2] = r;
	            c[d >> 2] = r;
	            c[r + 8 >> 2] = a;
	            c[r + 12 >> 2] = b;
	            c[r + 24 >> 2] = 0;
	            return;
	        }
	    }
	    function Db() {
	    }
	    function Eb(a, b, c, d) {
	        a = a | 0;
	        b = b | 0;
	        c = c | 0;
	        d = d | 0;
	        d = b - d - (c >>> 0 > a >>> 0 | 0) >>> 0;
	        return (C = d, a - c >>> 0 | 0) | 0;
	    }
	    function Fb(a, b, c, d) {
	        a = a | 0;
	        b = b | 0;
	        c = c | 0;
	        d = d | 0;
	        c = a + c >>> 0;
	        return (C = b + d + (c >>> 0 < a >>> 0 | 0) >>> 0, c | 0) | 0;
	    }
	    function Gb(b, d, e) {
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
	    function Hb(a, b, c) {
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
	    function Ib(a, b, c) {
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
	    function Jb(b, d, e) {
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
	    function Kb(a, b, c) {
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
	    function Lb(b) {
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
	    function Mb(a, b) {
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
	    function Nb(a, b, c, d) {
	        a = a | 0;
	        b = b | 0;
	        c = c | 0;
	        d = d | 0;
	        var e = 0, f = 0, g = 0, h = 0, i = 0, j = 0;
	        j = b >> 31 | ((b | 0) < 0 ? -1 : 0) << 1;
	        i = ((b | 0) < 0 ? -1 : 0) >> 31 | ((b | 0) < 0 ? -1 : 0) << 1;
	        f = d >> 31 | ((d | 0) < 0 ? -1 : 0) << 1;
	        e = ((d | 0) < 0 ? -1 : 0) >> 31 | ((d | 0) < 0 ? -1 : 0) << 1;
	        h = Eb(j ^ a | 0, i ^ b | 0, j | 0, i | 0) | 0;
	        g = C;
	        a = f ^ j;
	        b = e ^ i;
	        return Eb((Sb(h, g, Eb(f ^ c | 0, e ^ d | 0, f | 0, e | 0) | 0, C, 0) | 0) ^ a | 0, C ^ b | 0, a | 0, b | 0) | 0;
	    }
	    function Ob(a, b, d, e) {
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
	        a = Eb(h ^ a | 0, g ^ b | 0, h | 0, g | 0) | 0;
	        b = C;
	        Sb(a, b, Eb(l ^ d | 0, k ^ e | 0, l | 0, k | 0) | 0, C, j) | 0;
	        e = Eb(c[j >> 2] ^ h | 0, c[j + 4 >> 2] ^ g | 0, h | 0, g | 0) | 0;
	        d = C;
	        i = f;
	        return (C = d, e) | 0;
	    }
	    function Pb(a, b, c, d) {
	        a = a | 0;
	        b = b | 0;
	        c = c | 0;
	        d = d | 0;
	        var e = 0, f = 0;
	        e = a;
	        f = c;
	        c = Mb(e, f) | 0;
	        a = C;
	        return (C = (_(b, f) | 0) + (_(d, e) | 0) + a | a & 0, c | 0 | 0) | 0;
	    }
	    function Qb(a, b, c, d) {
	        a = a | 0;
	        b = b | 0;
	        c = c | 0;
	        d = d | 0;
	        return Sb(a, b, c, d, 0) | 0;
	    }
	    function Rb(a, b, d, e) {
	        a = a | 0;
	        b = b | 0;
	        d = d | 0;
	        e = e | 0;
	        var f = 0, g = 0;
	        g = i;
	        i = i + 16 | 0;
	        f = g | 0;
	        Sb(a, b, d, e, f) | 0;
	        i = g;
	        return (C = c[f + 4 >> 2] | 0, c[f >> 2] | 0) | 0;
	    }
	    function Sb(a, b, d, e, f) {
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
	                    p = Lb(h | 0) | 0;
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
	                    p = k >>> ((Lb(i | 0) | 0) >>> 0);
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
	            k = Fb(m | 0, l | 0, -1, -1) | 0;
	            d = C;
	            j = i;
	            i = 0;
	            do {
	                e = j;
	                j = g >>> 31 | j << 1;
	                g = i | g << 1;
	                e = a << 1 | e >>> 31 | 0;
	                n = a >>> 31 | b << 1 | 0;
	                Eb(k | 0, d | 0, e | 0, n | 0) | 0;
	                p = C;
	                o = p >> 31 | ((p | 0) < 0 ? -1 : 0) << 1;
	                i = o & 1;
	                a = Eb(e | 0, n | 0, o & m | 0, (((p | 0) < 0 ? -1 : 0) >> 31 | ((p | 0) < 0 ? -1 : 0) << 1) & l | 0) | 0;
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
	    function Tb(a, b) {
	        a = a | 0;
	        b = b | 0;
	        return ya[a & 1](b | 0) | 0;
	    }
	    function* Ub(a, b, c, d) {
	        a = a | 0;
	        b = b | 0;
	        c = c | 0;
	        d = d | 0;
	        return (yield* za[a & 7](b | 0, c | 0, d | 0)) | 0;
	    }
	    function Vb(a, b) {
	        a = a | 0;
	        b = b | 0;
	        Aa[a & 3](b | 0);
	    }
	    function Wb(a) {
	        a = a | 0;
	        ba(0);
	        return 0;
	    }
	    function* Xb(a, b, c) {
	        a = a | 0;
	        b = b | 0;
	        c = c | 0;
	        ba(1);
	        return 0;
	    }
	    function Yb(a) {
	        a = a | 0;
	        ba(2);
	    }
	    var ya = [
	        Wb,
	        Ma
	    ];
	    var za = [
	        Xb,
	        Pa,
	        Ta,
	        Ua,
	        Qa,
	        Xb,
	        Xb,
	        Xb
	    ];
	    var Aa = [
	        Yb,
	        Ra,
	        Va,
	        Yb
	    ];
	    return {
	        _i64Subtract: Eb,
	        _free: zb,
	        _main: La,
	        _i64Add: Fb,
	        _memset: Gb,
	        _malloc: yb,
	        _memcpy: Jb,
	        _bitshift64Lshr: Hb,
	        _fflush: ab,
	        ___errno_location: Oa,
	        _bitshift64Shl: Ib,
	        runPostSets: Db,
	        stackAlloc: Ba,
	        stackSave: Ca,
	        stackRestore: Da,
	        establishStackSpace: Ea,
	        setThrew: Fa,
	        setTempRet0: Ia,
	        getTempRet0: Ja,
	        dynCall_ii: Tb,
	        dynCall_iiii: Ub,
	        dynCall_vi: Vb
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
	var _fflush = Module["_fflush"] = asm["_fflush"];
	var ___errno_location = Module["___errno_location"] = asm["___errno_location"];
	var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
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
	run();}
