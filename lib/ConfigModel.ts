interface Config {
    hierarchy: Hierarchy;
    top: Top;
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
        top: {
            enable: config.top && config.top.enable || defaultConfig.top.enable,
            module: config.top && config.top.module || defaultConfig.top.module,
        },
    };
}

export default Config;
