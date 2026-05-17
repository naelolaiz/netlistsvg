"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.beautifyCellTypeLabel = beautifyCellTypeLabel;
var PRIMITIVE_LABELS = {
    '$mem_v2': 'RAM',
    '$mem': 'RAM',
    '$divfloor': '/floor',
    '$modfloor': '%floor',
    '$shift': 'shift',
    '$shiftx': 'shift',
    '$shrx': 'shift',
    '$bmux': 'bmux',
    '$demux': 'demux',
    '$ternary': '?:',
    '$dlatchsr': 'latch/SR',
    '$sr': 'SR',
    '$dffe': 'DFF/E',
    '$adffe': 'DFF/AR+E',
    '$sdffe': 'DFF/SR+E',
    '$dffsr': 'DFF/SR2',
    '$dffsre': 'DFF/SR2+E',
    '$mux': 'mux',
    '$pmux': 'pmux',
    '$dff': 'DFF',
    '$adff': 'DFF/AR',
    '$sdff': 'DFF/SR',
    '$dffn': 'DFFN',
    '$dlatch': 'latch',
    '$adlatch': 'latch',
    '$dlatchn': 'latch-n',
    '$tribuf': 'tri',
};
var BUS_SUFFIX = /(?:-bus)+$/;
var PARAMOD = /^\$paramod(?:\$[^\\]+)?\\([^\\]+)(?:\\.*)?$/;
var GHDL_GENERATED_TYPE = /^(.+)_B[A-Za-z][A-Za-z0-9]*(?:_.*)?$/;
function cleanIdentifier(name) {
    return name.replace(/^\\/, '');
}
function lookupPrimitive(type) {
    return PRIMITIVE_LABELS[type] || null;
}
function beautifyCellTypeLabel(type, hdlName) {
    var typeWithoutBus = type.replace(BUS_SUFFIX, '');
    var primitive = lookupPrimitive(typeWithoutBus);
    if (primitive !== null) {
        return primitive;
    }
    if (hdlName) {
        return cleanIdentifier(hdlName);
    }
    var paramod = PARAMOD.exec(typeWithoutBus);
    if (paramod) {
        return cleanIdentifier(paramod[1]);
    }
    var ghdlGenerated = GHDL_GENERATED_TYPE.exec(typeWithoutBus);
    if (ghdlGenerated) {
        return cleanIdentifier(ghdlGenerated[1]);
    }
    return cleanIdentifier(typeWithoutBus);
}
