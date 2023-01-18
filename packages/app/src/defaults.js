const defaults = {
    name: "defaults",
    async context(ctx, routeInfo) {
        const fields = (routeInfo.page_config.form || []).filter(
            (field) => field.type === "repeat" && field.initial
        );
        if (routeInfo.variant === "new" && fields.length > 0) {
            const defaults = {};
            for (let field of fields) {
                defaults[field.name] = await defaultAttachments(
                    field,
                    ctx,
                    this.app
                );
            }
            return defaults;
        }
    },
};
export default defaults;

// List of empty annotations for new objects
async function defaultAttachments(field, context, app) {
    if (field.type != "repeat" || !field.initial) {
        return [];
    }
    if (typeof field.initial == "string" || typeof field.initial == "number") {
        const attachments = [];
        for (let i = 0; i < +field.initial; i++) {
            attachments.push({});
        }
        return attachments;
    }
    let typeField;
    field.children.forEach(function (tf) {
        if (tf.name == field.initial.type_field) {
            typeField = tf;
        }
    });
    if (!typeField) {
        return [];
    }

    const model = app.models[typeField["wq:ForeignKey"]];

    let filterConf = field.initial.filter;
    if (!filterConf || !Object.keys(filterConf).length) {
        if (typeField.filter) {
            filterConf = typeField.filter;
        }
    }
    const filter = computeFilter(filterConf, context);
    const types = await model.filter(filter);
    return types.map((type) => ({
        [typeField.name + "_id"]: type.id,
    }));
}

function computeFilter(filterConf, context) {
    const filter = {};
    Object.entries(filterConf).forEach(([key, value]) => {
        filter[key] = context[value] || value;
    });
    return filter;
}
