'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dumpLayout = dumpLayout;
exports.render = render;
var ELK = require("elkjs");
var onml = require("onml");
var FlatModule_1 = require("./FlatModule");
var Skin_1 = require("./Skin");
var elkGraph_1 = require("./elkGraph");
var drawModule_1 = require("./drawModule");
var elk = new ELK();
function createFlatModule(skinData, yosysNetlist, configData) {
    Skin_1.default.skin = onml.p(skinData);
    return FlatModule_1.FlatModule.fromNetlist(yosysNetlist, configData);
}
function dumpLayout(skinData, yosysNetlist, prelayout, done, configData) {
    var flatModule = createFlatModule(skinData, yosysNetlist, configData);
    var kgraph = (0, elkGraph_1.buildElkGraph)(flatModule);
    if (prelayout) {
        done(null, JSON.stringify(kgraph, null, 2));
        return;
    }
    var promise = elk.layout(kgraph, { layoutOptions: FlatModule_1.FlatModule.layoutProps.layoutEngine });
    promise.then(function (graph) {
        done(null, JSON.stringify(graph, null, 2));
    }).catch(function (reason) {
        throw Error(reason);
    });
}
function prepareInternalSubmodulePages(flatModule) {
    return __awaiter(this, void 0, void 0, function () {
        var subCells, _i, subCells_1, cell, _a, subCells_2, cell, subGraph, laid, svg;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    subCells = FlatModule_1.FlatModule.walkSubModuleCells(flatModule);
                    for (_i = 0, subCells_1 = subCells; _i < subCells_1.length; _i++) {
                        cell = subCells_1[_i];
                        FlatModule_1.FlatModule.addDrilldownPage(cell.parent + '.' + cell.Key, []);
                    }
                    _a = 0, subCells_2 = subCells;
                    _b.label = 1;
                case 1:
                    if (!(_a < subCells_2.length)) return [3 /*break*/, 4];
                    cell = subCells_2[_a];
                    subGraph = (0, elkGraph_1.buildElkGraph)(cell.subModule);
                    return [4 /*yield*/, elk.layout(subGraph, { layoutOptions: FlatModule_1.FlatModule.layoutProps.layoutEngine })];
                case 2:
                    laid = _b.sent();
                    svg = (0, drawModule_1.drawFlatModuleInner)(laid, cell.subModule);
                    FlatModule_1.FlatModule.setDrilldownPageSvg(cell.parent + '.' + cell.Key, svg);
                    _b.label = 3;
                case 3:
                    _a++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function render(skinData, yosysNetlist, done, elkData, configData) {
    var flatModule = createFlatModule(skinData, yosysNetlist, configData);
    var wantInternalLinks = !!(FlatModule_1.FlatModule.config && FlatModule_1.FlatModule.config.render &&
        FlatModule_1.FlatModule.config.render.internalSubmoduleLinks === true);
    var promise;
    // if we already have a layout then use it (skips the standalone pre-pass)
    if (elkData) {
        // still need to populate ElkModel.wireNameLookup for drawModule
        (0, elkGraph_1.buildElkGraph)(flatModule);
        promise = Promise.resolve((0, drawModule_1.default)(elkData, flatModule));
    }
    else {
        var prep = wantInternalLinks ?
            prepareInternalSubmodulePages(flatModule) :
            Promise.resolve();
        promise = prep
            .then(function () {
            var kgraph = (0, elkGraph_1.buildElkGraph)(flatModule);
            return elk.layout(kgraph, { layoutOptions: FlatModule_1.FlatModule.layoutProps.layoutEngine });
        })
            .then(function (g) { return (0, drawModule_1.default)(g, flatModule); })
            // tslint:disable-next-line:no-console
            .catch(function (e) { console.error(e); return undefined; });
    }
    // support legacy callback style
    if (typeof done === 'function') {
        promise.then(function (output) {
            done(null, output);
            return output;
        }).catch(function (reason) {
            throw Error(reason);
        });
    }
    return promise;
}
