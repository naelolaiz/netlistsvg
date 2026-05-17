const PRIMITIVE_LABELS: {[type: string]: string} = {
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

const BUS_SUFFIX = /(?:-bus)+$/;
const PARAMOD = /^\$paramod(?:\$[^\\]+)?\\([^\\]+)(?:\\.*)?$/;
const GHDL_GENERATED_TYPE = /^(.+)_B[A-Za-z][A-Za-z0-9]*(?:_.*)?$/;

function cleanIdentifier(name: string): string {
    return name.replace(/^\\/, '');
}

function lookupPrimitive(type: string): string {
    return PRIMITIVE_LABELS[type] || null;
}

export function beautifyCellTypeLabel(type: string, hdlName?: string): string {
    const typeWithoutBus = type.replace(BUS_SUFFIX, '');
    const primitive = lookupPrimitive(typeWithoutBus);
    if (primitive !== null) {
        return primitive;
    }
    if (hdlName) {
        return cleanIdentifier(hdlName);
    }

    const paramod = PARAMOD.exec(typeWithoutBus);
    if (paramod) {
        return cleanIdentifier(paramod[1]);
    }

    const ghdlGenerated = GHDL_GENERATED_TYPE.exec(typeWithoutBus);
    if (ghdlGenerated) {
        return cleanIdentifier(ghdlGenerated[1]);
    }

    return cleanIdentifier(typeWithoutBus);
}
