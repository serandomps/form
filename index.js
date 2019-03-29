var serand = require('serand');
var utils = require('utils');

var sourcer = function (form, field) {
    return $(form.elem).find('.source[data-name=\'' + field + '\']');
};

var findOne = function (form, name, done) {
    var fields = form.fields[name];
    if (!fields || !fields.find) {
        return done();
    }
    var context = form.contexts[name];
    var source = sourcer(form, name);
    fields.find(context, source, done);
};

var validateOne = function (form, data, name, done) {
    var fields = form.fields[name];
    var value = data[name];
    if (!fields || !fields.validate) {
        return done(null, null, value);
    }
    var context = form.contexts[name];
    fields.validate(context, data, value, done);
};

var onlyFields = function (o) {
    var oo = {};
    Object.keys(o).forEach(function (key) {
        if (key === '_') {
            return;
        }
        oo[key] = o[key];
    });
    return oo;
};

var Form = function (id, elem, options) {
    this.id = id;
    this.elem = elem;
    this.options = options || {};
    this.fields = onlyFields(options);
    this.contexts = {};
};

Form.prototype.context = function (name, done) {
    return this.contexts[name];
};

Form.prototype.render = function (ctx, data, done) {
    var form = this;
    var fields = form.fields;
    data = data || {};
    async.each(Object.keys(fields), function (field, eachDone) {
        var o = fields[field];
        var render = o.render;
        if (!render) {
            return eachDone();
        }
        var value = data[field];
        render(ctx, form, data, value, function (err, context) {
            form.contexts[field] = context;
            eachDone(err);
        });
    }, done);
};

Form.prototype.create = function (data, done) {
    var form = this;
    var fields = form.fields;
    var errors = {};
    async.each(Object.keys(fields), function (field, eachDone) {
        var o = fields[field];
        var create = o.create;
        if (!create) {
            return eachDone();
        }
        var context = form.contexts[field];
        var value = data[field];
        create(context, value, function (err, error, value) {
            if (err) {
                return eachDone(err);
            }
            if (error) {
                errors[field] = error;
                return eachDone();
            }
            data[field] = value;
            eachDone();
        });
    }, function (err) {
        if (err) {
            return done(err);
        }
        errors = Object.keys(errors).length ? errors : null;
        done(null, errors, data);
    });
};

Form.prototype.find = function (done) {
    var form = this;
    var data = {};
    async.each(Object.keys(form.fields), function (field, eachDone) {
        findOne(form, field, function (err, value) {
            if (err) {
                return eachDone(err);
            }
            data[field] = value;
            eachDone();
        })
    }, function (err) {
        if (err) {
            return done(err);
        }
        done(null, data);
    });
};

Form.prototype.validate = function (data, done) {
    var form = this;
    var fields = form.fields;
    var options = form.options;
    var validateFields = function () {
        var errors = {};
        async.each(Object.keys(fields), function (field, eachDone) {
            validateOne(form, data, field, function (err, error, value) {
                if (err) {
                    return eachDone(err);
                }
                if (error) {
                    errors[field] = error;
                    return eachDone();
                }
                data[field] = value;
                eachDone();
            })
        }, function (err) {
            if (err) {
                return done(err);
            }
            errors = Object.keys(errors).length ? errors : null;
            done(null, errors, data);
        });
    };
    if (!options._ || !options._.validate) {
        return validateFields();
    }
    options._.validate(data, function (err, errors, data) {
        if (err) {
            return done(err);
        }
        if (errors) {
            return done(null, errors, data);
        }
        validateFields();
    });
};

Form.prototype.update = function (errors, data, done) {
    var form = this;
    data = data || {};
    var fields = Object.keys(data);
    errors = errors || {};
    data = data || {};
    $(form.elem).find('.source').removeClass('is-invalid')
        .removeClass('is-valid')
        .find('.invalid-feedback')
        .html('')
        .addClass('hidden');
    async.each(fields, function (name, eachDone) {
        var error = errors[name];
        var value = data[name];
        var fields = form.fields[name];
        if (!fields || !fields.update) {
            return eachDone();
        }
        var source = sourcer(form, name);
        var context = form.contexts[name];
        fields.update(context, source, error, value, eachDone);
    }, function (err) {
        if (err) {
            return done(err);
        }
        var el;
        var field;
        var error;
        var errored;
        for (field in errors) {
            if (!errors.hasOwnProperty(field)) {
                continue;
            }
            el = sourcer(form, field);
            error = errors[field];
            if (!error) {
                continue;
            }
            errored = true;
            el.addClass('is-invalid')
                .find('.invalid-feedback')
                .html(error)
                .removeClass('hidden');
        }
        if (!errored) {
            return done();
        }
        for (field in data) {
            if (!data.hasOwnProperty(field)) {
                continue;
            }
            if (errors[field]) {
                continue;
            }
            el = sourcer(form, field);
            el.addClass('is-valid');
        }
        done();
    });
};

Form.prototype.refresh = function (data, done) {
    var form = this;
    var fields = Object.keys(data);
    data = data || {};
    async.each(fields, function (name, eachDone) {
        var value = data[name];
        var field = form.fields[name];
        if (!field || !field.update) {
            return eachDone();
        }
        var source = sourcer(form, name);
        var context = form.contexts[name];
        field.update(context, source, null, value, eachDone);
    }, done);
};

module.exports.create = function (id, el, options) {
    return new Form(id, el, options);
};

module.exports.selectize = function (elem, html) {
    if (!elem.length) {
        return elem;
    }
    var o = elem[0];
    if (o.selectize) {
        o.selectize.destroy();
    }
    if (html) {
        html(elem);
    }
    elem.selectize();
    return o.selectize;
};

module.exports.select = function (el, html, val) {
    el = el.children('select');
    if (html) {
        el.html(html);
    }
    return val ? el.val(val) : el;
};
