import { ElkModel } from './elkGraph';
import { DrilldownPage, FlatModule, removeDups } from './FlatModule';
import Cell from './Cell';
import Skin from './Skin';

import _ = require('lodash');
import onml = require('onml');
import assert = require('assert');

enum WireDirection {
    Up, Down, Left, Right,
}

export default function drawModule(g: ElkModel.Graph, module: FlatModule) {
    const { elements, svgAttrs } = renderFlatModule(g, module);
    const hasDrilldownPages = FlatModule.drilldownPages.length > 0;
    if (FlatModule.config.render &&
            (!_.isEmpty(FlatModule.config.render.cellLinks) || hasDrilldownPages)) {
        svgAttrs['xmlns:xlink'] = svgAttrs['xmlns:xlink'] || 'http://www.w3.org/1999/xlink';
    }

    const styles = getSkinStyles();
    const ret: onml.Element = hasDrilldownPages ?
        ['svg', svgAttrs, styles, getDrilldownPageStyles(),
            ...FlatModule.drilldownPages.map(drilldownPageToSvg),
            createSvgPage('netlistsvg_page_top', 'netlistsvg-page-default',
                g.width, g.height, elements)] :
        ['svg', svgAttrs, styles, ...elements];
    return onml.s(ret);
}

export function drawFlatModuleInner(g: ElkModel.Graph, module: FlatModule): onml.Element {
    const { elements, svgAttrs } = renderFlatModule(g, module);
    const styles = getSkinStyles();
    return ['svg', svgAttrs, styles, ...elements];
}

function renderFlatModule(g: ElkModel.Graph, module: FlatModule):
        { elements: onml.Element[], svgAttrs: onml.Attributes } {
    const nodes: onml.Element[] = module.nodes.map((n: Cell) => {
        const kchild: ElkModel.Cell = _.find(g.children, (c) => c.id === n.parent + '.' + n.Key);
        return n.render(kchild);
    });
    removeDummyEdges(g);
    let lines: onml.Element[] = _.flatMap(g.edges, (e: ElkModel.Edge) => {
        const netId = ElkModel.wireNameLookup[e.id];
        const numWires = netId.split(',').length - 2;
        const lineStyle = 'stroke-width: ' + (numWires > 1 ? 2 : 1);
        const netName = 'net_' + netId.slice(1, netId.length - 1) + ' width_' + numWires;
        return _.flatMap(e.sections, (s: ElkModel.Section) => {
            let startPoint = s.startPoint;
            s.bendPoints = s.bendPoints || [];
            let bends: any[] = s.bendPoints.map((b) => {
                const l = ['line', {
                    x1: startPoint.x,
                    x2: b.x,
                    y1: startPoint.y,
                    y2: b.y,
                    class: netName,
                    style: lineStyle,
                }];
                startPoint = b;
                return l;
            });
            if (e.junctionPoints) {
                const circles: any[] = e.junctionPoints.map((j: ElkModel.WirePoint) =>
                    ['circle', {
                        cx: j.x,
                        cy: j.y,
                        r: (numWires > 1 ? 3 : 2),
                        style: 'fill:#000',
                        class: netName,
                    }]);
                bends = bends.concat(circles);
            }
            const line = [['line', {
                x1: startPoint.x,
                x2: s.endPoint.x,
                y1: startPoint.y,
                y2: s.endPoint.y,
                class: netName,
                style: lineStyle,
            }]];
            return bends.concat(line);
        });
    });
    let labels: any[];
    for (const index in g.edges) {
        if (g.edges.hasOwnProperty(index)) {
            const e = g.edges[index];
            const netId = ElkModel.wireNameLookup[e.id];
            const numWires = netId.split(',').length - 2;
            const netName = 'net_' + netId.slice(1, netId.length - 1) +
                ' width_' + numWires +
                ' busLabel_' + numWires;
            if (e.labels !== undefined &&
                e.labels[0] !== undefined &&
                e.labels[0].text !== undefined) {
                const label = [
                        ['rect',
                            {
                                x: e.labels[0].x + 1,
                                y: e.labels[0].y - 1,
                                width: (e.labels[0].text.length + 2) * 6 - 2,
                                height: 9,
                                class: netName,
                                style: 'fill: white; stroke: none',
                            },
                        ], ['text',
                            {
                                x: e.labels[0].x,
                                y: e.labels[0].y + 7,
                                class: netName,
                            },
                            '/' + e.labels[0].text + '/',
                        ],
                    ];
                if (labels !== undefined) {
                    labels = labels.concat(label);
                } else {
                    labels = label;
                }
            }
        }
    }
    if (labels !== undefined && labels.length > 0) {
        lines = lines.concat(labels);
    }
    const svgAttrs: onml.Attributes = _.assign({}, Skin.skin[1]);
    svgAttrs.width = g.width.toString();
    svgAttrs.height = g.height.toString();
    return { elements: [...nodes, ...lines], svgAttrs };
}

function getSkinStyles(): onml.Element {
    const styles: onml.Element = ['style', {}, ''];
    onml.t(Skin.skin, {
        enter: (node) => {
            if (node.name === 'style') {
                styles[2] += node.full[2];
            }
        },
    });
    return styles;
}

function getDrilldownPageStyles(): onml.Element {
    return ['style', {}, [
        '.netlistsvg-page { display: none; }',
        '.netlistsvg-page-default { display: inline; }',
        '.netlistsvg-page:target { display: inline; }',
        '.netlistsvg-page:target ~ .netlistsvg-page-default { display: none; }',
    ].join('\n')];
}

function createSvgPage(
        id: string,
        className: string,
        width: string | number,
        height: string | number,
        elements: onml.Element[]): onml.Element {
    // Each page declares its own native width/height so it renders at
    // 1:1 inside the outer SVG. Using width/height="100%" would scale
    // the page up to the outer SVG's dimensions (which equal the
    // largest page's dimensions, normally the top page), giving small
    // drilldown pages a ridiculous zoom factor.
    return ['svg', {
        id,
        class: className,
        width: width.toString(),
        height: height.toString(),
        viewBox: '0 0 ' + width.toString() + ' ' + height.toString(),
        preserveAspectRatio: 'xMidYMid meet',
    }, ...elements];
}

function drilldownPageToSvg(page: DrilldownPage): onml.Element {
    const attrs = page.svg[1] as onml.Attributes;
    const width = attrs.width || 1;
    const height = attrs.height || 1;
    return createSvgPage(page.id, 'netlistsvg-page', width, height, page.svg.slice(2) as onml.Element[]);
}

export function drawSubModule(c: ElkModel.Cell, subModule: FlatModule) {
    const nodes: onml.Element[] = [];
    _.forEach(subModule.nodes, (n: Cell) => {
        const kchild: ElkModel.Cell = _.find(c.children, (child) => child.id === n.parent + '.' + n.Key);
        if (kchild) {
            nodes.push(n.render(kchild));
        }
    });
    removeDummyEdges(c);
    const lines: onml.Element[] = _.flatMap(c.edges, (e: ElkModel.Edge) => {
        const netId = ElkModel.wireNameLookup[e.id];
        const netName = 'net_' + netId.slice(1, netId.length - 1);
        return _.flatMap(e.sections, (s: ElkModel.Section) => {
            let startPoint = s.startPoint;
            s.bendPoints = s.bendPoints || [];
            let bends: any[] = s.bendPoints.map((b) => {
                const l = ['line', {
                    x1: startPoint.x,
                    x2: b.x,
                    y1: startPoint.y,
                    y2: b.y,
                    class: netName,
                }];
                startPoint = b;
                return l;
            });
            if (e.junctionPoints) {
                const circles: any[] = e.junctionPoints.map((j: ElkModel.WirePoint) =>
                    ['circle', {
                        cx: j.x,
                        cy: j.y,
                        r: 2,
                        style: 'fill:#000',
                        class: netName,
                    }]);
                bends = bends.concat(circles);
            }
            const line = [['line', {
                x1: startPoint.x,
                x2: s.endPoint.x,
                y1: startPoint.y,
                y2: s.endPoint.y,
                class: netName,
            }]];
            return bends.concat(line);
        });
    });
    const svgAttrs: onml.Attributes = _.assign({}, Skin.skin[1]);
    svgAttrs.width = c.width.toString();
    svgAttrs.height = c.height.toString();

    const elements: onml.Element[] = [...nodes, ...lines];
    const ret: onml.Element = ['svg', svgAttrs, ...elements];
    return ret;
}

function which_dir(start: ElkModel.WirePoint, end: ElkModel.WirePoint): WireDirection {
    if (end.x === start.x && end.y === start.y) {
        throw new Error('start and end are the same');
    }
    if (end.x !== start.x && end.y !== start.y) {
        throw new Error('start and end arent orthogonal');
    }
    if (end.x > start.x) {
        return WireDirection.Right;
    }
    if (end.x < start.x) {
        return WireDirection.Left;
    }
    if (end.y > start.y) {
        return WireDirection.Down;
    }
    if (end.y < start.y) {
        return WireDirection.Up;
    }
    throw new Error('unexpected direction');
}

function findBendNearDummy(
        net: ElkModel.Edge[],
        dummyIsSource: boolean,
        dummyLoc: ElkModel.WirePoint): ElkModel.WirePoint {
    const junctions = _.flatMap(net, (edge) => edge.junctionPoints || []);
    if (junctions.length > 0) {
        return nearestPoint(junctions, dummyLoc);
    }

    const candidates = net.map( (edge) => {
        const bends = edge.sections[0].bendPoints || [null];
        if (dummyIsSource) {
            return _.first(bends);
        } else {
            return _.last(bends);
        }
    }).filter((p) => p !== null);
    if (candidates.length === 0) {
        return dummyLoc;
    }
    return nearestPoint(candidates, dummyLoc);
}

function nearestPoint(points: ElkModel.WirePoint[], dummyLoc: ElkModel.WirePoint): ElkModel.WirePoint {
    return _.minBy(points, (pt: ElkModel.WirePoint) => {
        return Math.abs(dummyLoc.x - pt.x) + Math.abs(dummyLoc.y - pt.y);
    });
}

export function removeDummyEdges(g: ElkModel.Graph|ElkModel.Cell) {
    if (!g.edges) {
        return;
    }

    // go through each edge group for each dummy
    let dummyNum: number = 0;
    // loop until we can't find an edge group or we hit 10,000
    while (dummyNum < 10000) {
        const dummyIdSuffix: string = '$d_' + String(dummyNum);
        let dummyId: string = null;
        // find all edges connected to this dummy
        const edgeGroup = _.filter(g.edges, (e: ElkModel.Edge) => {
            if (isDummyId(e.source, dummyIdSuffix)) {
                dummyId = e.source;
                return true;
            }
            if (isDummyId(e.target, dummyIdSuffix)) {
                dummyId = e.target;
                return true;
            }
            return false;
        });
        if (edgeGroup.length === 0) {
            break;
        }
        let dummyIsSource: boolean;
        let dummyLoc: ElkModel.WirePoint;
        const firstEdge: ElkModel.Edge = edgeGroup[0] as ElkModel.Edge;
        if (firstEdge.source === dummyId) {
            dummyIsSource = true;
            dummyLoc = firstEdge.sections[0].startPoint;
        } else {
            dummyIsSource = false;
            dummyLoc = firstEdge.sections[0].endPoint;
        }
        const newEnd: ElkModel.WirePoint = findBendNearDummy(edgeGroup as ElkModel.Edge[], dummyIsSource, dummyLoc);
        for (const edge of edgeGroup) {
            const e: ElkModel.Edge = edge as ElkModel.Edge;
            const section = e.sections[0];
            if (dummyIsSource) {
                section.startPoint = newEnd;
                if (section.bendPoints) {
                    section.bendPoints.shift();
                }
            } else {
                section.endPoint = newEnd;
                if (section.bendPoints) {
                    section.bendPoints.pop();
                }
            }
        }
        // delete junction point if necessary
        const directions = new Set(_.flatMap(edgeGroup, (edge: ElkModel.Edge) => {
            const section = edge.sections[0];
            if (dummyIsSource) {
                // get first bend or endPoint
                if (section.bendPoints && section.bendPoints.length > 0) {
                    return [section.bendPoints[0]];
                }
                return section.endPoint;
            } else {
                if (section.bendPoints && section.bendPoints.length > 0) {
                    return [_.last(section.bendPoints)];
                }
                return section.startPoint;
            }
        }).map( (pt) => {
            if (pt.x > newEnd.x) {
                return WireDirection.Right;
            }
            if (pt.x < newEnd.x) {
                return WireDirection.Left;
            }
            if (pt.y > newEnd.y) {
                return WireDirection.Down;
            }
            return WireDirection.Up;
        }));
        if (directions.size < 3) {
            // remove junctions at newEnd
            edgeGroup.forEach((edge: ElkModel.Edge) => {
                if (edge.junctionPoints) {
                    edge.junctionPoints = edge.junctionPoints.filter((junct) => {
                        return !_.isEqual(junct, newEnd);
                    });
                }
            });
        }
        dummyNum += 1;
    }
}

function isDummyId(id: string, dummyIdSuffix: string): boolean {
    const prefixedSuffix = '.' + dummyIdSuffix;
    return id === dummyIdSuffix || id.slice(-prefixedSuffix.length) === prefixedSuffix;
}
