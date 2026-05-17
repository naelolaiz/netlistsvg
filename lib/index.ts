'use strict';

import ELK = require('elkjs');
import onml = require('onml');

import { FlatModule } from './FlatModule';
import Yosys from './YosysModel';
import Config from './ConfigModel';
import Skin from './Skin';
import { ElkModel, buildElkGraph } from './elkGraph';
import drawModule, { drawFlatModuleInner } from './drawModule';

const elk = new ELK();

type ICallback = (error: Error, result?: string) => void;

function createFlatModule(skinData: string, yosysNetlist: Yosys.Netlist, configData?: Config): FlatModule {
    Skin.skin = onml.p(skinData);
    return FlatModule.fromNetlist(yosysNetlist, configData);
}

export function dumpLayout(skinData: string, yosysNetlist: Yosys.Netlist,
                           prelayout: boolean, done: ICallback, configData?: Config) {
    const flatModule = createFlatModule(skinData, yosysNetlist, configData);
    const kgraph: ElkModel.Graph = buildElkGraph(flatModule);
    if (prelayout) {
        done(null, JSON.stringify(kgraph, null, 2));
        return;
    }
    const promise = elk.layout(kgraph, { layoutOptions: FlatModule.layoutProps.layoutEngine });
    promise.then((graph: ElkModel.Graph) => {
        done(null, JSON.stringify(graph, null, 2));
    }).catch((reason) => {
        throw Error(reason);
    });
}

async function prepareInternalSubmodulePages(flatModule: FlatModule): Promise<void> {
    const subCells = FlatModule.walkSubModuleCells(flatModule);
    for (const cell of subCells) {
        FlatModule.addDrilldownPage(cell.parent + '.' + cell.Key, [] as any);
    }
    for (const cell of subCells) {
        const subGraph = buildElkGraph(cell.subModule);
        const laid = await elk.layout(subGraph, { layoutOptions: FlatModule.layoutProps.layoutEngine });
        const svg = drawFlatModuleInner(laid, cell.subModule);
        FlatModule.setDrilldownPageSvg(cell.parent + '.' + cell.Key, svg);
    }
}

export function render(skinData: string, yosysNetlist: Yosys.Netlist,
                       done?: ICallback, elkData?: ElkModel.Graph, configData?: Config) {
    const flatModule = createFlatModule(skinData, yosysNetlist, configData);
    const wantInternalLinks: boolean = !!(FlatModule.config && FlatModule.config.render &&
        FlatModule.config.render.internalSubmoduleLinks === true);

    let promise: Promise<string>;
    // if we already have a layout then use it (skips the standalone pre-pass)
    if (elkData) {
        // still need to populate ElkModel.wireNameLookup for drawModule
        buildElkGraph(flatModule);
        promise = Promise.resolve(drawModule(elkData, flatModule));
    } else {
        const prep = wantInternalLinks ?
            prepareInternalSubmodulePages(flatModule) :
            Promise.resolve();
        promise = prep
            .then(() => {
                const kgraph: ElkModel.Graph = buildElkGraph(flatModule);
                return elk.layout(kgraph, { layoutOptions: FlatModule.layoutProps.layoutEngine });
            })
            .then((g: ElkModel.Graph) => drawModule(g, flatModule))
            // tslint:disable-next-line:no-console
            .catch((e) => { console.error(e); return undefined; });
    }

    // support legacy callback style
    if (typeof done === 'function') {
        promise.then((output: string) => {
            done(null, output);
            return output;
        }).catch((reason) => {
            throw Error(reason);
        });
    }
    return promise;
}
