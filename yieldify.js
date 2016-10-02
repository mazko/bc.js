'use strict';

/*
 * Copyright 2016, Oleg Mazko
 *
 * npm i acorn escodegen estraverse escope
 * node yieldify.js in.emcc.js out.emcc.y.js
 */

const fs = require('fs'),
    assert = require('assert'),
    escope = require('escope'),
    acorn = require('acorn'),
    escodegen = require('escodegen'),
    estraverse = require('estraverse');

// http://misc.flogisoft.com/bash/tip_colors_and_formatting
console.log('\x1B[92mReading input file...\x1B[0m');

var ast = fs.readFileSync(process.argv[2], 'utf8');

console.log('\x1B[92mAST parsing...\x1B[0m');

ast = acorn.parse(ast, {locations: true});
// ast = acorn.parse(ast);

(function () {

    console.log('\x1B[92mSearching for asm...\x1B[0m');

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
        env: new Map(),
        return: null
    };

    // first stage - find declarations

    console.log('\x1B[92mDeclarations...\x1B[0m');

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
                        assert(!asm_bindings.env.has(name));
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
                        assert(!asm_bindings.env.has(name));
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
                            assert(!asm_bindings.env.has(name));
                            assert(!asm_bindings.fn.has(name));
                            assert(!asm_bindings.fn_tables.has(name));
                            asm_bindings.env.set(name, { node: var_decl, callers: new Map() });
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
    assert(asm_bindings.env.size);

    // console.log(asm_bindings);

    console.log('\x1B[92mBinding...\x1B[0m');

    // second stage - find functions callers
    (function() {
        const skip_asserts = new Set([asm_bindings.return, 
            ...Array.from(asm_bindings.fn_tables.values(), v => v.node),
            ...Array.from(asm_bindings.env.values(), v => v.node)]);

        var has_ref_to_asm;
        traverse_replace_asmjs({
            enter: ({node, assert, stack, asm}) => {
                if (skip_asserts.has(node)) {
                    return estraverse.VisitorOption.Skip;
                }
                switch (node.type) {
                    case 'FunctionExpression': {
                        // var f = function(){};
                        assert(node === asm);
                        assert(!has_ref_to_asm);
                        console.log('Escope...');
                        // http://mazurov.github.io/escope-demo/
                        const scopeManager = escope.analyze(ast),
                              scope = scopeManager.acquire(node),
                              cache_refs = new Set();
                        for (const variable of scope.variables) {
                            for (const ref of variable.references){
                                cache_refs.add(ref.identifier);
                            }
                        }
                        has_ref_to_asm = id => cache_refs.has(id);
                        console.log('Escope is ready !');
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
                                skip_asserts.add(callee);
                                // console.log(callee.name)
                                // console.log(callers)
                            } else if(asm_bindings.env.has(callee.name)){
                                const {callers} = asm_bindings.env.get(callee.name);
                                if (callers.has(fn.id.name)){
                                    callers.get(fn.id.name).push(node);
                                } else {
                                    callers.set(fn.id.name, [node]);
                                }
                                skip_asserts.add(callee);
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
                            skip_asserts.add(callee.object);
                            // console.log(callee.object.name)
                            // console.log(callers)
                            break;
                          default:
                            assert(false);
                        }
                        break;

                    case 'Identifier':
                        if (!has_ref_to_asm(node)){
                            break;
                        }
                        if (asm_bindings.fn.has(node.name)){
                            assert(asm_bindings.fn.get(node.name).node.id === node);
                        }
                        assert(!asm_bindings.fn_tables.has(node.name));
                        assert(!asm_bindings.env.has(node.name));
                        break;
                }
            }
        });
    })();

    //console.log(asm_bindings);

    // final stage - replace nodes
    (function(){
        var yld_callers = [], yld_env = [];
        const yld_fn_names = new Set(), yld_fn_seed = [],
              push_callers = c => {
                for(const a of c.values()) yld_callers.push(...a);
              };

        for (const [key, value] of asm_bindings.env) {
            yld_env.push(value.node);
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
                if (yld_fn_names.has(name)) continue;
                const {callers} = asm_bindings.fn.get(name);
                const callers_names = [...callers.keys()];
                console.log('Direct calls: ' + callers_names + ' --> ' + name);
                next_names.push(...callers_names);
                push_callers(callers);
                yld_fn_names.add(name);
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
        const yld_fn = new Set(Array.from(yld_fn_names, v => asm_bindings.fn.get(v).node));

        console.log('\x1B[92mAST modifications...\x1B[0m');

        yld_callers = new Set(yld_callers);
        yld_env = new Set(yld_env);

        traverse_replace_asmjs({
            leave: ({node, assert}) => {
                if (yld_env.has(node)){
                    assert(node.declarations.length === 1);
                    const decl = node.declarations[0];
                    node.declarations[0].init = {
                        "type": "CallExpression",
                        "callee": {
                            "type": "MemberExpression",
                            "computed": false,
                            "object": {
                                "type": "MemberExpression",
                                "computed": false,
                                "object": {
                                    "type": "Identifier",
                                    "name": "Module"
                                },
                                "property": {
                                    "type": "Identifier",
                                    "name": "yld_api"
                                }
                            },
                            "property": decl.id
                        },
                        "arguments": [
                            decl.init, 
                            {
                                "type": "Identifier",
                                "name": "SYSCALLS"
                            },
                            {
                                "type": "Identifier",
                                "name": "asm"
                            }
                        ]
                    };
                    return node;
                }
                if (yld_callers.has(node)){
                    return {
                        "type": "YieldExpression",
                        "argument": node,
                        "delegate": true
                    };
                }
                if (yld_fn.has(node)){
                    node.generator = true;
                    return node;
                }
                if (node === asm_bindings.return){
                    assert(node.argument.type === 'ObjectExpression');
                    for (const prop of node.argument.properties){
                        assert(prop.key.type === 'Identifier');
                        assert(prop.value.type === 'Identifier');
                        if (yld_fn_names.has(prop.value.name)
                                && prop.key.name !== '_main') {
                            console.log(`ASM export: \x1B[93m${prop.key.name}\x1B[0m become generator !`);
                        }
                    }
                    return node;
                }
            }
        });
    })();

    console.log('\x1B[92mAssert suspicious invoke_ (dyn_Call_)...\x1B[0m');

    (function(){
        var is_variable_used;
        traverse_replace_asmjs({
            enter: ({node, assert, stack, asm}) => {
                switch (node.type) {
                    case 'FunctionExpression': {
                        // var f = function(){};
                        assert(!is_variable_used);
                        // http://mazurov.github.io/escope-demo/
                        const scopeManager = escope.analyze(ast),
                              scope = scopeManager.acquire(node);
                        is_variable_used = id => {
                            for (const variable of scope.variables) {
                                if (variable.identifiers.includes(id)){
                                    for (const ref of variable.references){
                                        if (ref.identifier !== id) {
                                            return true;
                                        }
                                    }
                                }
                            }
                            return false;
                        };
                        break;
                    }
                    case 'MemberExpression': {
                        if (node.property.type === 'Identifier' 
                                && node.property.name.startsWith('invoke_')) {
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
                            if (is_variable_used(decl.id)){
                                console.log(`\x1B[91mSuspicious ${node.property.name}\x1B[0m`);
                            }
                        } else if (node.property.type === 'Literal'){
                            assert(!node.property.raw.startsWith('invoke_'))
                        }
                        break;
                    }
                }
            }
        });
    })();
})();

console.log('\x1B[92mLiterals...\x1B[0m');

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

console.log('\x1B[92mAST to source file...\x1B[0m');

fs.writeFileSync(
  process.argv[3], 
  escodegen.generate(ast, { verbatim: 'x-verbatim-asmjs', format: {compact: !!process.argv[4]} }), 
  'utf8'
);
