export interface StringMap {
    [key: string]: string;
}

interface Config {
    hierarchy: Hierarchy;
    render: Render;
    top: Top;
}

interface Render {
    beautifyLabels: boolean;
    cellLabels: StringMap;
    cellLinks: StringMap;
    internalSubmoduleLinks: boolean;
}

interface Hierarchy {
    enable: 'off' | 'level' | 'all' | 'modules';
    expandLevel: number;
    expandModules: ExpandModules;
}

interface ExpandModules {
    types: string[];
    ids: string[];
}

interface Top {
    enable: boolean;
    module: string;
}

export function normalizeConfig(config?: Config): Config {
    const defaultConfig: Config = {
        hierarchy: {
            enable: 'off',
            expandLevel: 0,
            expandModules: {
                types: [],
                ids: [],
            },
        },
        render: {
            beautifyLabels: true,
            cellLabels: {},
            cellLinks: {},
            internalSubmoduleLinks: false,
        },
        top: {
            enable: false,
            module: '',
        },
    };

    if (!config) {
        return defaultConfig;
    }

    return {
        hierarchy: {
            enable: config.hierarchy && config.hierarchy.enable || defaultConfig.hierarchy.enable,
            expandLevel: config.hierarchy && config.hierarchy.expandLevel || defaultConfig.hierarchy.expandLevel,
            expandModules: {
                types: config.hierarchy && config.hierarchy.expandModules &&
                    config.hierarchy.expandModules.types || defaultConfig.hierarchy.expandModules.types,
                ids: config.hierarchy && config.hierarchy.expandModules &&
                    config.hierarchy.expandModules.ids || defaultConfig.hierarchy.expandModules.ids,
            },
        },
        render: {
            beautifyLabels: config.render && config.render.beautifyLabels !== undefined ?
                config.render.beautifyLabels : defaultConfig.render.beautifyLabels,
            cellLabels: config.render && config.render.cellLabels || defaultConfig.render.cellLabels,
            cellLinks: config.render && config.render.cellLinks || defaultConfig.render.cellLinks,
            internalSubmoduleLinks: config.render && config.render.internalSubmoduleLinks !== undefined ?
                config.render.internalSubmoduleLinks : defaultConfig.render.internalSubmoduleLinks,
        },
        top: {
            enable: config.top && config.top.enable || defaultConfig.top.enable,
            module: config.top && config.top.module || defaultConfig.top.module,
        },
    };
}

export default Config;
