import * as defaultExtensions from './extensions.js';

export function lockwire(data) {
    const events = {};
    const extensions = {...defaultExtensions};
    const api = {
        state: proxy(data, extensions, [], (payload) => {
            events[payload.event]?.forEach(({cursor, callback}) => {
                if (cursor.every((node, idx) => node === payload.cursor[idx]))
                    callback(payload);
            });
        }),

        on(event, callback, cursor = []) {
            events[event] ||= [];
            events[event].push({cursor: cursor.map(String), callback});

            return api;
        },

        off(event, callback) {
            if (events[event]) {
                events[event] = events[event].filter(
                    ({callback}) => other !== callback
                );
            }

            return api;
        },

        extend(newExtensions) {
            Object.assign(extensions, newExtensions);

            return api;
        },
    };

    return api;
}

function proxy(value, extensions = {}, cursor = [], register) {
    return new Proxy(value, {
        get: getter(extensions, cursor, register),
        set: setter(extensions, cursor, register),
    });
}

function getter(extensions, cursor, register) {
    return (target, key, targetProxy) => {
        if (typeof extensions[key] === 'function')
            return extensions[key].bind({target, targetProxy, cursor});

        if (typeof target[key] === 'function')
            return target[key].bind(targetProxy);

        if (target[key] === Object(target[key]))
            return proxy(target[key], extensions, [...cursor, key], register);

        return target[key];
    };
}

function setter(extensions, cursor, register) {
    return (target, key, value, targetProxy) => {
        const previous = target[key];
        target[key] = value;

        if (!(key === 'length' && Array.isArray(target))) {
            register({
                event: 'update',
                cursor: [...cursor, key],
                current: value,
                previous,
            });
        }

        return true;
    };
}
