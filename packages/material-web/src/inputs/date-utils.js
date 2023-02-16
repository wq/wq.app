import { parseISO, formatISO9075 } from "date-fns";

export const format = {
    date: (value) => tryFormat(value, { representation: "date" }),
    time: (value) => tryFormat(value, { representation: "time" }),
    datetime: (value) => tryFormat(value),
};

function tryFormat(value, options) {
    try {
        return formatISO9075(value, options);
    } catch (e) {
        return value;
    }
}

export const parse = {
    date: (value) => (value ? parseISO(value) : null),
    time: (value) => (value ? parseISO("9999-01-01 " + value) : null),
    datetime: (value) => (value ? parseISO(value) : null),
};
