import * as defaultExtensions from './extensions.js';

export function lockwire(data) {
    const events = {};
    const extensions = {...defaultExtensions};
    const api = {};

    api.on = (event, callback, cursor = []) => {
        events[event] ||= [];
        events[event].push({cursor: cursor.map(String), callback});
    };

    api.off = (event, callback) => {
        if (events[event]) {
            events[event] = events[event].filter(
                ({callback}) => other !== callback
            );
        }
    };
    api.extend = (newExtensions) => {
        Object.assign(extensions, newExtensions);
    };

    api.state = proxy(data, extensions, api, [], (payload) => {
        events[payload.event]?.forEach(({cursor, callback}) => {
            if (cursor.every((node, idx) => node === payload.cursor[idx]))
                callback(payload);
        });
    });

    return api;
}

export function relay(cursors, callback) {
    const cache = {};
    const relayInitializer = (extensions, api, relayCursor, register) => {
        const relayGetter = () => {
            if (cache.value) return cache.value;

            const stateCursors = Object.entries(cursors).reduce(
                (state, [name, cursor]) => {
                    state[name] = cursor.reduce(
                        (target, property) => target?.[property],
                        api.state
                    );

                    return state;
                },
                {}
            );

            const value = callback(stateCursors);

            return (cache.value =
                value === Object(value)
                    ? proxy(value, extensions, api, relayCursor, noop)
                    : value);
        };

        const relayUpdater = () => {
            clearTimeout(cache.timeoutId);

            cache.timeoutId = setTimeout(() => {
                delete cache.value;

                register({
                    type: 'relay',
                    event: 'update',
                    cursor: relayCursor,
                    current: relayGetter(),
                });
            });
        };

        Object.values(cursors).forEach((cursor) =>
            api.on('update', relayUpdater, cursor)
        );

        relayGetter.isLockwireRelayGetter = true;

        return relayGetter;
    };

    relayInitializer.isLockwireRelayInitializer = true;

    return relayInitializer;
}

function proxy(value, extensions = {}, api = {}, cursor = [], register) {
    return new Proxy(value, {
        get: getter(extensions, api, cursor, register),
        set: setter(extensions, api, cursor, register),
    });
}

function getter(extensions, api, cursor, register) {
    return (target, key, targetProxy) => {
        if (target[key]?.isLockwireRelayInitializer)
            target[key] = target[key](
                extensions,
                api,
                [...cursor, key],
                register
            );

        if (target[key]?.isLockwireRelayGetter) return target[key]();

        if (typeof extensions[key] === 'function')
            return extensions[key].bind({target, targetProxy, cursor});

        if (typeof target[key] === 'function')
            return target[key].bind(targetProxy);

        if (target[key] === Object(target[key]))
            return proxy(
                target[key],
                extensions,
                api,
                [...cursor, key],
                register
            );

        return target[key];
    };
}

function setter(extensions, api, cursor, register) {
    return (target, key, value, targetProxy) => {
        const previous = target[key];
        target[key] = value;

        if (!(key === 'length' && Array.isArray(target))) {
            register({
                type: 'regular',
                event: 'update',
                cursor: [...cursor, key],
                current: value,
                previous,
            });
        }

        return true;
    };
}

function noop() {}
