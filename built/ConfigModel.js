"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeConfig = normalizeConfig;
function normalizeConfig(config) {
    var defaultConfig = {
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
        },
        top: {
            enable: config.top && config.top.enable || defaultConfig.top.enable,
            module: config.top && config.top.module || defaultConfig.top.module,
        },
    };
}
