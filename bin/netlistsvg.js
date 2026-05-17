#!/usr/bin/env node
'use strict';

var lib = require('../built'),
    fs = require('fs'),
    path = require('path'),
    json5 = require('json5'),
    yargs = require('yargs'),
    Ajv = require('ajv');

var ajv = new Ajv({allErrors: true});
require('ajv-errors')(ajv);

if (require.main === module) {
    var argv = yargs
        .demand(1)
        .usage('usage: $0 input_json_file [-o output_svg_file] [--skin skin_file] [--layout elk_json_file] [--config config_json_file] [--link cell_id=url] [--relabel cell_id=text]')
        .option('link', {
            array: true,
            metavar: 'cell_id=url',
            describe: 'wrap cell_<cell_id> with an SVG hyperlink'
        })
        .option('relabel', {
            array: true,
            metavar: 'cell_id=text',
            describe: 'override the visible label for cell_<cell_id>'
        })
        .option('beautify-labels', {
            type: 'boolean',
            describe: 'rewrite generated Yosys/GHDL cell type labels to readable names'
        })
        .argv;
    main(argv._[0], argv.o, argv.skin, argv.layout, argv.config, argv);
}

function render(skinData, netlist, outputPath, elkData, configData) {
    lib.render(skinData, netlist, (err, svgData) => {
        if (err) throw err;
        fs.writeFile(outputPath, svgData, 'utf-8', (err) => {
            if (err) throw err;
        });
    }, elkData, configData);
}

function parseFiles(skinPath, netlistPath, elkJsonPath, configPath, callback) {
    var elkData;
    var configData;
    fs.readFile(skinPath, 'utf-8', (err, skinData) => {
        if (err) throw err;
        fs.readFile(netlistPath, (err, netlistData) => {
            if (err) throw err;
            if (elkJsonPath) {
                elkData = json5.parse(fs.readFileSync(elkJsonPath));
            } 
            if (configPath) {
                configData = json5.parse(fs.readFileSync(configPath));
            }
            callback(skinData, netlistData, elkData, configData);
        });
    });
}

function parseMapping(arg) {
    var eq = arg.indexOf('=');
    if (eq === -1) {
        throw Error('bad mapping ' + JSON.stringify(arg) + ', expected cell_id=value');
    }
    return {
        key: arg.slice(0, eq),
        value: arg.slice(eq + 1)
    };
}

function applyMappings(target, mappings) {
    mappings = mappings || [];
    for (var i = 0; i < mappings.length; i++) {
        var parsed = parseMapping(mappings[i]);
        target[parsed.key] = parsed.value;
    }
}

function mergeCliConfig(configData, argv) {
    configData = configData || {};
    configData.render = configData.render || {};
    if (argv.beautifyLabels !== undefined) {
        configData.render.beautifyLabels = argv.beautifyLabels;
    }
    if (argv.link && argv.link.length > 0) {
        configData.render.cellLinks = configData.render.cellLinks || {};
        applyMappings(configData.render.cellLinks, argv.link);
    }
    if (argv.relabel && argv.relabel.length > 0) {
        configData.render.cellLabels = configData.render.cellLabels || {};
        applyMappings(configData.render.cellLabels, argv.relabel);
    }
    return configData;
}

function main(netlistPath, outputPath, skinPath, elkJsonPath, configPath, argv) {
    skinPath = skinPath || path.join(__dirname, '../lib/default.svg');
    configPath = configPath || path.join(__dirname, '../lib/config.json');
    outputPath = outputPath || 'out.svg';
    var schemaPath = path.join(__dirname, '../lib/yosys.schema.json5');
    parseFiles(skinPath, netlistPath, elkJsonPath, configPath, (skinData, netlistString, elkData, configData) => {
        if (argv) {
            configData = mergeCliConfig(configData, argv);
        }
        var netlistJson = json5.parse(netlistString);
        var valid = ajv.validate(json5.parse(fs.readFileSync(schemaPath)), netlistJson);
        if (!valid) {
            throw Error(JSON.stringify(ajv.errors, null, 2));
        }
        render(skinData, netlistJson, outputPath, elkData, configData);
    });
}

module.exports.main = main;
