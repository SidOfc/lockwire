import test from 'ava';
import {lockwire} from '../src/index.js';

function sample(arr) {
    return arr[Math.ceil(Math.random() * arr.length) - 1];
}

function factory() {
    const data = {
        users: [
            {id: 1, name: 'Bas', hobbies: [{id: 1, name: 'Golfing'}]},
            {id: 2, name: 'Bob', hobbies: [{id: 2, name: 'Gaming'}]},
            {id: 3, name: 'Sam', hobbies: [{id: 3, name: 'Writing'}]},
            {id: 4, name: 'Kim', hobbies: [{id: 4, name: 'Chess'}]},
        ],
    };

    return {data, state: lockwire(data).state};
}
