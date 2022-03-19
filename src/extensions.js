export function findBy(finder) {
    if (finder.constructor === Object) {
        const keys = Object.keys(finder);

        return this.targetProxy.find((item) =>
            keys.every((key) => item[key] === finder[key])
        );
    }

    return this.targetProxy.find(finder);
}

export function json(...args) {
    return JSON.stringify(this.target, ...args);
}
