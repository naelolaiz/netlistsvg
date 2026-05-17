import fs = require('fs');
import path = require('path');
import onml = require('onml');

import Cell from '../lib/Cell';
import { FlatModule } from '../lib/FlatModule';
import Skin from '../lib/Skin';
import { normalizeConfig } from '../lib/ConfigModel';
import { render } from '../lib/index';

function loadDefaultSkin() {
    const skinPath = path.join(__dirname, '../lib/default.svg');
    Skin.skin = onml.parse(fs.readFileSync(skinPath).toString());
}

test('generic cell labels are beautified and linkable', () => {
    loadDefaultSkin();
    FlatModule.config = normalizeConfig({
        render: {
            beautifyLabels: true,
            cellLabels: {},
            cellLinks: {
                inner: 'shift_register.svg',
            },
        },
    } as any);
    FlatModule.netlist = {modules: {}} as any;

    const cell = new Cell(
        'inner',
        "$paramod\\shift_register\\WIDTH=s32'00000000000000000000000000010000",
        [],
        [],
        {},
        'top');
    const rendered = onml.stringify(cell.render({
        id: 'top.inner',
        x: 0,
        y: 0,
        width: 30,
        height: 40,
        ports: [],
        labels: [],
    } as any));

    expect(rendered).toContain('<a xlink:href="shift_register.svg">');
    expect(rendered).toContain('>shift_register</text>');
    expect(rendered).toContain('pointer-events="all"');
});

test('configured cell labels override beautified labels', () => {
    loadDefaultSkin();
    FlatModule.config = normalizeConfig({
        render: {
            beautifyLabels: true,
            cellLabels: {
                inner: 'custom_label',
            },
            cellLinks: {},
        },
    } as any);
    FlatModule.netlist = {modules: {}} as any;

    const cell = new Cell('inner', 'single_clock_rom_Brtl_32_9', [], [], {}, 'top');
    const rendered = onml.stringify(cell.render({
        id: 'top.inner',
        x: 0,
        y: 0,
        width: 30,
        height: 40,
        ports: [],
        labels: [],
    } as any));

    expect(rendered).toContain('>custom_label</text>');
    expect(rendered).not.toContain('>single_clock_rom</text>');
});

test('internal submodule links use isolated same-file SVG pages', async () => {
    const skinPath = path.join(__dirname, '../lib/default.svg');
    const netlistPath = path.join(__dirname, 'hierarchy/simple.json');
    const skin = fs.readFileSync(skinPath).toString();
    const netlist = JSON.parse(fs.readFileSync(netlistPath).toString());

    const rendered = await render(skin, netlist, undefined, undefined, {
        hierarchy: {
            enable: 'all',
        },
        render: {
            internalSubmoduleLinks: true,
        },
    } as any);

    expect(rendered).toContain('xlink:href="#netlistsvg_page_top_u_child"');
    expect(rendered).toContain('id="netlistsvg_page_top_u_child"');
    expect(rendered).toContain('class="netlistsvg-page"');
    expect(rendered).toContain('class="netlistsvg-page-default"');
    expect(rendered).not.toContain('<view ');
});

test('internal submodule drilldown page renders external port markers', async () => {
    const skinPath = path.join(__dirname, '../lib/default.svg');
    const netlistPath = path.join(__dirname, 'hierarchy/simple.json');
    const skin = fs.readFileSync(skinPath).toString();
    const netlist = JSON.parse(fs.readFileSync(netlistPath).toString());

    const rendered = await render(skin, netlist, undefined, undefined, {
        hierarchy: {
            enable: 'all',
        },
        render: {
            internalSubmoduleLinks: true,
        },
    } as any);

    // Isolate the drilldown page for the `u_child` submodule
    const startMatch = rendered.match(/<svg[^>]+id="netlistsvg_page_top_u_child"[^>]*>/);
    expect(startMatch).not.toBeNull();
    const pageStart = startMatch.index;
    let i = pageStart + startMatch[0].length;
    let depth = 1;
    while (depth > 0) {
        const nextOpen = rendered.indexOf('<svg', i);
        const nextClose = rendered.indexOf('</svg>', i);
        if (nextOpen !== -1 && nextOpen < nextClose) {
            depth += 1;
            i = nextOpen + 4;
        } else {
            depth -= 1;
            i = nextClose + 6;
        }
    }
    const page = rendered.slice(pageStart, i);

    // The submodule (`child`) has ports a, b (inputs) and y (output) — they should appear as labelled
    // port-marker glyphs on the standalone drilldown page, not as bare wire stubs.
    expect(page).toMatch(/>a<\/text>/);
    expect(page).toMatch(/>b<\/text>/);
    expect(page).toMatch(/>y<\/text>/);
});
