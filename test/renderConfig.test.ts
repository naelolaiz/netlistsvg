import fs = require('fs');
import path = require('path');
import onml = require('onml');

import Cell from '../lib/Cell';
import { FlatModule } from '../lib/FlatModule';
import Skin from '../lib/Skin';
import { normalizeConfig } from '../lib/ConfigModel';

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
