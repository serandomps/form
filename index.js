var serand = require('serand');
var utils = require('utils');

var sourcer = function (form, field) {
    var selector = '.source[data-name=\'' + field + '\']';
    return $(selector, form.el);
};

var findOne = function (form, field, done) {
    var options = form.options[field];
    if (!options) {
        return done();
    }
    var context = form.contexts[field];
    var source = sourcer(form, field);
    options.find(context, source, done);
};

var validateOne = function (form, data, field, done) {
    var options = form.options[field];
    if (!options) {
        return done();
    }
    var context = form.contexts[field];
    options.validate(context, data, data[field], done);
};

var Form = function (elem, options) {
    this.elem = elem;
    this.options = options || {};
    this.contexts = {};
};

Form.prototype.context = function (name, done) {
    return this.contexts[name];
};

Form.prototype.render = function (ctx, data, done) {
    var form = this;
    var options = form.options;
    async.each(Object.keys(options), function (field, eachDone) {
        var o = options[field];
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
    var options = form.options;
    var errors = {};
    async.each(Object.keys(options), function (field, eachDone) {
        var o = options[field];
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
    async.each(Object.keys(form.options), function (field, eachDone) {
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
    var errors = {};
    async.each(Object.keys(form.options), function (field, eachDone) {
        validateOne(form, data, field, function (err, error) {
            if (err) {
                return eachDone(err);
            }
            if (error) {
                errors[field] = error;
                return eachDone();
            }
            eachDone();
        })
    }, function (err) {
        if (err) {
            return done(err);
        }
        errors = Object.keys(errors).length ? errors : null;
        done(null, errors);
    });
};

Form.prototype.update = function (errors, data, done) {
    var form = this;
    data = data || {};
    var fields = Object.keys(data);
    errors = errors || {};
    data = data || {};
    $('.source', form.elem).removeClass('has-error')
        .find('.help-block').html('').addClass('hidden').end()
        .find('.form-control-feedback').addClass('hidden').end();
    async.each(fields, function (field, eachDone) {
        var error = errors[field];
        var value = data[field];
        var options = form.options[field];
        if (!options) {
            return eachDone();
        }
        var source = sourcer(form, field);
        var context = form.contexts[field];
        options.update(context, source, error, value, eachDone);
    }, function (err) {
        console.log(errors)
        if (err) {
            return done(err);
        }
        var el;
        var field;
        var error;
        var errored = false;
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
            el.addClass('has-error')
                .find('.help-block').html(error).removeClass('hidden').end()
                .find('.form-control-feedback')
                .html('<i class="fa fa-times" aria-hidden="true"></i>')
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
            el.addClass('has-success')
                .find('.form-control-feedback')
                .html('<i class="fa fa-check" aria-hidden="true"></i>')
                .removeClass('hidden');
        }
        done();
    });
};

Form.prototype.refresh = function (data, done) {
    var form = this;
    var fields = Object.keys(data);
    data = data || {};
    async.each(fields, function (field, eachDone) {
        var value = data[field];
        var options = form.options[field];
        if (!options) {
            return eachDone();
        }
        var source = sourcer(form, field);
        var context = form.contexts[field];
        options.update(context, source, null, value, eachDone);
    }, done);
};

module.exports.create = function (el, options) {
    return new Form(el, options);
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
