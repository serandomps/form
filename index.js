var serand = require('serand');
var utils = require('utils');

var Form = function (el, options) {
    this.el = el;
    this.options = options || {};
};

Form.prototype.find = function (done) {
    var form = this;
    var data = {};
    $('.source', form.el).each(function (source) {
        source = $(source);
        var name = source.data('name');
        var options = form[name];
        data[name] = options.find(source);
    });
    done(null, data);
};

Form.prototype.validate = function (data, done) {
    var form = this;
    var errors = {};
    async.each(form.options, function (field, validated) {
        var o = form.options[field];
        var validator = o.validator;
        if (!validator) {
            return validated();
        }
        validator(field, data[field], function (err, error) {
            if (err) {
                return validated(err);
            }
            errors[field] = error;
            validated();
        });
    }, function (err) {
        done(err, errors);
    });
};

Form.prototype.validated = function (done) {
    var form = this;
    form.find(function (err, data) {
        if (err) {
            return done(err);
        }
        form.validate(data, function (err, errors) {
            done(err, errors, data);
        });
    });
};

Form.prototype.update = function () {

};

module.exports = function (el, options) {
    return new Form(el, options);
};
