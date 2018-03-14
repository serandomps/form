var serand = require('serand');
var utils = require('utils');

var sourcer = function (form, field) {
    var selector = '.source[data-name=\'' + field + '\']';
    return $(selector, form.el);
};

var Form = function (el, options) {
    this.el = el;
    this.options = options || {};
    this.contexts = {};
};

Form.prototype.render = function (data, done) {
    var form = this;
    var options = form.options;
    async.each(Object.keys(options), function (field, eachDone) {
        var o = options[field];
        var render = o.render;
        if (!render) {
            return eachDone();
        }
        var value = data[field];
        render(form.el, value, function (err, context) {
            form.contexts[field] = context;
            eachDone(err);
        });
    }, done);
};

Form.prototype.create = function (data, done) {
    var form = this;
    var options = form.options;
    async.each(Object.keys(options), function (field, eachDone) {
        var o = options[field];
        var create = o.create;
        if (!create) {
            return eachDone();
        }
        var context = form.contexts[field];
        var value = data[field];
        create(context, value, function (err, value) {
            if (err) {
                return eachDone(err);
            }
            data[field] = value;
            eachDone();
        });
    }, function (err) {
        done(err, data);
    });
};


Form.prototype.find = function (done) {
    var form = this;
    var data = {};
    var errors = {};
    /*async.each($('.source', form.el), function (source, eachDone) {
        source = $(source);
        var name = source.data('name');
        var options = form.options[name];
        if (!options) {
            return eachDone();
        }
        var context = form.contexts[name];
        options.find(context, source, function (err, error, value) {
            if (err) {
                return eachDone(err);
            }
            if (error) {
                errors[name] = error;
            }
            data[name] = value;
            eachDone();
        });
    }, function (err) {
        if (err) {
            return done(err);
        }
        errors = Object.keys(errors).length ? errors : null;
        done(null, errors, data);
    });*/
    async.each(Object.keys(form.options), function (field, eachDone) {
        var options = form.options[field];
        if (!options) {
            return eachDone();
        }
        var context = form.contexts[field];
        var source = sourcer(form, field);
        options.find(context, source, function (err, error, value) {
            if (err) {
                return eachDone(err);
            }
            if (error) {
                errors[field] = error;
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

Form.prototype.update = function (errors, data, done) {
    var value;
    var form = this;
    var fields = Object.keys(data);
    errors = errors || {};
    $('.source', form.el).removeClass('has-error')
        .find('.help-block').html('').addClass('hidden').end()
        .find('.form-control-feedback').addClass('hidden').end();
    async.each(fields, function (field, eachDone) {
        value = data[field];
        var options = form.options[name];
        if (!options) {
            return eachDone();
        }
        var source = sourcer(form, field);
        var context = form.contexts[field];
        options.update(context, source, value, eachDone);
    }, function (err) {
        console.log(errors)
        if (err) {
            return done(err);
        }
        var el;
        var field;
        var error;
        for (field in errors) {
            if (!errors.hasOwnProperty(field)) {
                continue;
            }
            el = sourcer(form, field);
            error = errors[field];
            if (!error) {
                continue;
            }
            el.addClass('has-error')
                .find('.help-block').html(error).removeClass('hidden').end()
                .find('.form-control-feedback')
                .html('<i class="fa fa-times" aria-hidden="true"></i>')
                .removeClass('hidden');
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
