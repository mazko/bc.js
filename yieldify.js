'use strict';

/*
 * Copyright 2016, Oleg Mazko
 *
 * npm i esprima escodegen estraverse
 * node yieldify.js in.emcc.js out.emcc.y.js
 */

const fs = require('fs'),
    assert = require('assert'),
    escope = require('escope'),
    esprima = require('esprima'),
    escodegen = require('escodegen'),
    estraverse = require('estraverse');
    
var ast = esprima.parse(
    fs.readFileSync(process.argv[2], 'utf8'), 
    {loc: true}
);

(function () {

    const traverse_replace_asmjs = (function(){

        const is_asm_node = node => node.type === 'ExpressionStatement' 
            && ['almost asm', 'use asm'].includes(node.expression.value);

        // find asm node
        var asm_node;
        (function(){
            const stack = [];
            estraverse.traverse(ast, {
                enter: (node) => {
                    if(is_asm_node(node)) {
                        assert(!asm_node, 'nested asm ?');
                        [asm_node] = stack.slice(-2);
                    }
                    stack.push(node);
                },
                leave: (node) => {
                    stack.pop(node);
                }
            });
        })();

        assert(asm_node);
        assert(asm_node.type === 'FunctionExpression');

        return ({enter, leave}) => {

            var asm_stack = [], is_asm_scope; 

            ast = estraverse.replace(ast, {
                enter: (node, parent) => {
                    var replace;
                    if(node === asm_node) {
                        // console.log(`Entered ${node.expression.value} scope`);
                        assert(!is_asm_scope);
                        is_asm_scope = true;
                    }
                    if (is_asm_scope) {
                        if (enter) {
                            replace = enter({
                                node, parent, asm: asm_node, stack: asm_stack,
                                assert: (c, m='') => 
                                    assert(c, m + '\n' + JSON.stringify(node.loc))
                            });
                        }
                        asm_stack.push(node);
                    }
                    return replace;
                },

                leave: (node, parent) => {
                    var replace;
                    if (is_asm_scope) {
                        asm_stack.pop();
                        if (leave) {
                            replace = leave({
                                node, parent, asm: asm_node, stack: asm_stack,
                                assert: (c, m='') => 
                                    assert(c, m + '\n' + JSON.stringify(node.loc))
                            });
                        }
                    }
                    if (node === asm_node){
                        // console.log('Left asm scope');
                        is_asm_scope = false;
                    }
                    return replace;
                }
            });       
        }
    })();

    const asm_bindings = {
        fn: new Map(), 
        fn_tables: new Map(),
        syscalls: new Map(),
        return: null
    };

    // first stage - find declarations
    (function() {
        traverse_replace_asmjs({
            enter: ({node, assert, stack, asm}) => {
                switch (node.type) {
                    case 'FunctionExpression': {
                        // var f = function(){};
                        assert(node === asm);
                        break;
                    }
                    case 'FunctionDeclaration': {
                        // function f(){};
                        assert(stack.length === 2,  'Nested functions ?');
                        const {name} = node.id;
                        assert(!asm_bindings.fn.has(name));
                        assert(!asm_bindings.fn_tables.has(name));
                        assert(!asm_bindings.syscalls.has(name));
                        asm_bindings.fn.set(name, { node, callers: new Map() });
                        break;
                    }
                    case 'ArrayExpression': {
                        // var FUNCTION_TABLE_i = [b0,_prog_char];
                        assert(stack.length === 4);
                        const [var_decl, decl] = stack.slice(2);
                        assert(var_decl.kind === 'var');
                        assert(var_decl.type === 'VariableDeclaration');
                        assert(var_decl.declarations.length === 1);
                        assert(decl.type === 'VariableDeclarator');
                        const {name} = decl.id;
                        assert(!asm_bindings.fn_tables.has(name));
                        assert(!asm_bindings.fn.has(name));
                        assert(!asm_bindings.syscalls.has(name));
                        const names = node.elements.map(e => {
                            assert(e.type === 'Identifier');
                            return e.name;
                        });
                        assert(names.length);
                        asm_bindings.fn_tables.set(name, { node: var_decl, callers: new Map(), names });
                        break;
                    }
                    case 'ReturnStatement': {
                        // return { _i64Subtract: _i64Subtract, _main: _main }
                        assert(!asm_bindings.return);
                        if (stack.length === 2) {
                            asm_bindings.return = node;
                            assert(node.argument.type === 'ObjectExpression');
                            for (const p of node.argument.properties) {
                                assert(p.type === 'Property');
                                assert(p.key.type === 'Identifier');
                                assert(p.value.type === 'Identifier');
                            }
                        }
                        break;
                    }
                    case 'MemberExpression': {
                        // var ___syscall145=env.___syscall145;
                        const candidates = ['___syscall145', '___syscall3'];
                        if (node.property.type === 'Identifier' 
                                && candidates.includes(node.property.name)) {
                            assert(node.computed === false);
                            assert(node.object.type === 'Identifier');
                            assert(node.object.name === 'env');
                            assert(stack.length === 4);
                            const [var_decl, decl] = stack.slice(2);
                            assert(var_decl.kind === 'var');
                            assert(var_decl.type === 'VariableDeclaration');
                            assert(var_decl.declarations.length === 1);
                            assert(decl.type === 'VariableDeclarator');
                            const {name} = decl.id;
                            assert(!asm_bindings.syscalls.has(name));
                            assert(!asm_bindings.fn.has(name));
                            assert(!asm_bindings.fn_tables.has(name));
                            asm_bindings.syscalls.set(name, { node: var_decl, callers: new Map() });
                        } else if (node.property.type === 'Literal'){
                            assert(!candidates.includes(node.property.value))
                        }
                        break;
                    }
                }
            }
        });
    })();

    assert(asm_bindings.return);
    assert(asm_bindings.fn.size);
    assert(asm_bindings.fn_tables.size);
    assert(asm_bindings.syscalls.size);

    // console.log(asm_bindings);

    // second stage - find functions callers
    (function() {
        const skip_asserts = [asm_bindings.return, 
            ...Array.from(asm_bindings.fn_tables.values(), v => v.node),
            ...Array.from(asm_bindings.syscalls.values(), v => v.node)];

        // http://mazurov.github.io/escope-demo/
        const scopeManager = escope.analyze(ast);
        var scope;
        const has_ref_to_asm = (id) => {
            for (const variable of scope.variables) {
                for (const ref of variable.references){
                    if (ref.identifier === id) {
                        return true;
                    }
                }
            }
            return false;
        };
        traverse_replace_asmjs({
            enter: ({node, assert, stack, asm}) => {
                if (skip_asserts.includes(node)) {
                    return estraverse.VisitorOption.Skip;
                }
                switch (node.type) {
                    case 'FunctionExpression': {
                        // var f = function(){};
                        assert(node === asm);
                        assert(!scope);
                        scope = scopeManager.acquire(node);
                        break;
                    }
                    case 'CallExpression':
                        const [fn] = stack.slice(2);
                        assert(fn);
                        assert(fn.type === 'FunctionDeclaration');
                        const {callee} = node;
                        switch (callee.type) {
                          case "Identifier":
                            if (!has_ref_to_asm(callee)){
                                break;
                            }
                            if(asm_bindings.fn.has(callee.name)){
                                const {callers} = asm_bindings.fn.get(callee.name);
                                if (callers.has(fn.id.name)){
                                    callers.get(fn.id.name).push(node);
                                } else {
                                    callers.set(fn.id.name, [node]);
                                }
                                skip_asserts.push(callee);
                                // console.log(callee.name)
                                // console.log(callers)
                            } else if(asm_bindings.syscalls.has(callee.name)){
                                const {callers} = asm_bindings.syscalls.get(callee.name);
                                if (callers.has(fn.id.name)){
                                    callers.get(fn.id.name).push(node);
                                } else {
                                    callers.set(fn.id.name, [node]);
                                }
                                skip_asserts.push(callee);
                                // console.log(callee.name)
                                // console.log(callers)
                            }
                            break;
                          case "MemberExpression":
                            assert(callee.object.type === 'Identifier');
                            if (!has_ref_to_asm(callee.object)){
                                break;
                            }
                            assert(asm_bindings.fn_tables.has(callee.object.name))
                            const {callers} = asm_bindings.fn_tables.get(callee.object.name);
                            if (callers.has(fn.id.name)){
                                callers.get(fn.id.name).push(node);
                            } else {
                                callers.set(fn.id.name, [node]);
                            }
                            skip_asserts.push(callee.object);
                            // console.log(callee.object.name)
                            // console.log(callers)
                            break;
                          default:
                            assert(false);
                        }
                        break;

                    case 'Identifier':
                        const la = c => assert(c || !has_ref_to_asm(node));
                        if (asm_bindings.fn.has(node.name)){
                            la(asm_bindings.fn.get(node.name).node.id === node);
                        }
                        la(!asm_bindings.fn_tables.has(node.name));
                        la(!asm_bindings.syscalls.has(node.name));
                        break;
                }
            }
        });
    })();

    //console.log(asm_bindings);

    // final stage - replace nodes
    (function(){
        const yld_fn_names = [], yld_fn_seed = [], yld_callers = [], syscalls = [],
              push_callers = c => {
                for(const a of c.values()) yld_callers.push(...a);
              };

        for (const [key, value] of asm_bindings.syscalls) {
            syscalls.push(value.node);
            const callers_names = [...value.callers.keys()];
            yld_fn_seed.push(...callers_names);
            console.log('Sys calls: ' + callers_names + ' --> ' + key);
            push_callers(value.callers);
            assert(!asm_bindings.fn_tables.has(key));
        }
        const bubble = (names) => {
            const next_names = [];
            for(const name of names) {
                assert(asm_bindings.fn.has(name));
                if (yld_fn_names.includes(name)) continue;
                const {callers} = asm_bindings.fn.get(name);
                const callers_names = [...callers.keys()];
                console.log('Direct calls: ' + callers_names + ' --> ' + name);
                next_names.push(...callers_names);
                push_callers(callers);
                yld_fn_names.push(name);
                for (const [key, value] of asm_bindings.fn_tables) {
                    if(value.names.includes(name)) {
                        console.log('Table: ' + name + ' --> ' + key + '[' + value.names + ']');
                        next_names.push(...value.names);
                        const {callers} = value;
                        const callers_names = [...callers.keys()];
                        console.log('Table calls: ' + callers_names + ' --> ' + key);
                        next_names.push(...callers_names);
                        push_callers(callers);
                    }
                }
            }
            if (next_names.length) bubble(next_names);
        }
        bubble(yld_fn_seed);
        const yld_fn = Array.from(new Set(yld_fn_names), v => asm_bindings.fn.get(v).node);
        traverse_replace_asmjs({
            leave: ({node, assert}) => {
                if (syscalls.includes(node)){
                    assert(node.declarations.length === 1);
                    const decl = node.declarations[0];
                    const new_node = {
                        "type": "FunctionDeclaration",
                        "id": decl.id,
                        "params": [
                            {
                                "type": "Identifier",
                                "name": "which"
                            },
                            {
                                "type": "Identifier",
                                "name": "varargs"
                            }
                        ],
                        "body": {
                            "type": "BlockStatement",
                            "body": [
                                {
                                    "type": "ExpressionStatement",
                                    "expression": {
                                        "type": "AssignmentExpression",
                                        "operator": "=",
                                        "left": {
                                            "type": "MemberExpression",
                                            "computed": false,
                                            "object": {
                                                "type": "Identifier",
                                                "name": "SYSCALLS"
                                            },
                                            "property": {
                                                "type": "Identifier",
                                                "name": "varargs"
                                            }
                                        },
                                        "right": {
                                            "type": "Identifier",
                                            "name": "varargs"
                                        }
                                    }
                                },
                                {
                                    "type": "TryStatement",
                                    "block": {
                                        "type": "BlockStatement",
                                        "body": [
                                            {
                                                "type": "VariableDeclaration",
                                                "declarations": [
                                                    {
                                                        "type": "VariableDeclarator",
                                                        "id": {
                                                            "type": "Identifier",
                                                            "name": "fd"
                                                        },
                                                        "init": {
                                                            "type": "MemberExpression",
                                                            "computed": false,
                                                            "object": {
                                                                "type": "CallExpression",
                                                                "callee": {
                                                                    "type": "MemberExpression",
                                                                    "computed": false,
                                                                    "object": {
                                                                        "type": "Identifier",
                                                                        "name": "SYSCALLS"
                                                                    },
                                                                    "property": {
                                                                        "type": "Identifier",
                                                                        "name": "getStreamFromFD"
                                                                    }
                                                                },
                                                                "arguments": []
                                                            },
                                                            "property": {
                                                                "type": "Identifier",
                                                                "name": "fd"
                                                            }
                                                        }
                                                    }
                                                ],
                                                "kind": "var"
                                            },
                                            {
                                                "type": "IfStatement",
                                                "test": {
                                                    "type": "BinaryExpression",
                                                    "operator": "!==",
                                                    "left": {
                                                        "type": "Identifier",
                                                        "name": "fd"
                                                    },
                                                    "right": {
                                                        "type": "Literal",
                                                        "value": 0,
                                                        "raw": "0"
                                                    }
                                                },
                                                "consequent": {
                                                    "type": "BlockStatement",
                                                    "body": [
                                                        {
                                                            "type": "ThrowStatement",
                                                            "argument": {
                                                                "type": "NewExpression",
                                                                "callee": {
                                                                    "type": "Identifier",
                                                                    "name": "Error"
                                                                },
                                                                "arguments": [
                                                                    {
                                                                        "type": "BinaryExpression",
                                                                        "operator": "+",
                                                                        "left": {
                                                                            "type": "Literal",
                                                                            "value": "ASSERT: Not stdin (0) ? -> ",
                                                                            "raw": "'ASSERT: Not stdin (0) ? -> '"
                                                                        },
                                                                        "right": {
                                                                            "type": "Identifier",
                                                                            "name": "fd"
                                                                        }
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    ]
                                                },
                                                "alternate": {
                                                    "type": "BlockStatement",
                                                    "body": [
                                                        {
                                                            "type": "ExpressionStatement",
                                                            "expression": {
                                                                "type": "YieldExpression",
                                                                "argument": {
                                                                    "type": "CallExpression",
                                                                    "callee": {
                                                                        "type": "MemberExpression",
                                                                        "computed": false,
                                                                        "object": {
                                                                            "type": "Identifier",
                                                                            "name": "Module"
                                                                        },
                                                                        "property": {
                                                                            "type": "Identifier",
                                                                            "name": "get_stdin_promise"
                                                                        }
                                                                    },
                                                                    "arguments": []
                                                                },
                                                                "delegate": false
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    },
                                    "handler": {
                                        "type": "CatchClause",
                                        "param": {
                                            "type": "Identifier",
                                            "name": "e"
                                        },
                                        "body": {
                                            "type": "BlockStatement",
                                            "body": [
                                                {
                                                    "type": "ExpressionStatement",
                                                    "expression": {
                                                        "type": "CallExpression",
                                                        "callee": {
                                                            "type": "MemberExpression",
                                                            "computed": false,
                                                            "object": {
                                                                "type": "Identifier",
                                                                "name": "console"
                                                            },
                                                            "property": {
                                                                "type": "Identifier",
                                                                "name": "warn"
                                                            }
                                                        },
                                                        "arguments": [
                                                            {
                                                                "type": "Identifier",
                                                                "name": "e"
                                                            }
                                                        ]
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    "finalizer": null
                                },
                                {
                                    "type": "ReturnStatement",
                                    "argument": {
                                        "type": "CallExpression",
                                        "callee": {
                                            "type": "MemberExpression",
                                            "computed": false,
                                            "object": decl.init,
                                            "property": {
                                                "type": "Identifier",
                                                "name": "apply"
                                            }
                                        },
                                        "arguments": [
                                            {
                                                "type": "Literal",
                                                "value": null,
                                                "raw": "null"
                                            },
                                            {
                                                "type": "Identifier",
                                                "name": "arguments"
                                            }
                                        ]
                                    }
                                }
                            ]
                        },
                        "generator": true,
                        "expression": false
                    };
                    return new_node;
                }
                if (yld_callers.includes(node)){
                    return {
                        "type": "YieldExpression",
                        "argument": node,
                        "delegate": true
                    };
                }
                if (yld_fn.includes(node)){
                    node.generator = true;
                    return node;
                }
            }
        });
    })();
})();

// fix https://github.com/estools/escodegen/issues/306

ast = estraverse.replace(ast, {
  leave: function (node) {
    if (node.type === 'Literal' ) {
      node['x-verbatim-asmjs'] = {
        content: node.raw,
        precedence: escodegen.Precedence.Primary
      };
      return node;
    }
  }
});

fs.writeFileSync(
  process.argv[3], 
  escodegen.generate(ast, { verbatim: 'x-verbatim-asmjs', format: {compact: !!process.argv[4]} }), 
  'utf8'
);
