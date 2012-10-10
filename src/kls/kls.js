var ObjectCreate,
    Kls = function () {},
    _extend = function (dest, src) {
      for (var prop in src) {
        dest[prop] = src[prop];
      }
      return dest;
    };
if (Object.create) {
  ObjectCreate = Object.create;
  Kls._statics = ObjectCreate(null, {
    statics: {value: statics, enumerable: true},
    derive: {value: derive, enumerable: true},
    mixin: {value: mixin, enumerable: true}
  });
} else {
  ObjectCreate = function (o) {
    function F() {}

    F.prototype = o;
    return new F();
  };
  Kls._statics = {
    statics: statics,
    derive: derive,
    mixin: mixin
  };
}

function mixin(source, other) {
  var prop,
      proto = this.prototype;
  for (prop in source) {
    proto[prop] = source[prop];
  }
  if (other) {
    for (var l = arguments.length - 1; l > 0; l--) {
      _extend(proto, arguments[l]);
    }
  }
  return this;
}

function statics(prop, value) {
  var _static = this._statics;
  if (value) {
    this[prop] = _static[prop] = value;
  } else {
    for (value in prop) {
      this[value] = _static[value] = prop[value];
    }
  }
  return this;
}

function derive(_init) {
  var Super = Sub.Super = this;
  (Sub.prototype = ObjectCreate(Super.prototype)).constructor = Sub;
  _extend(Sub, Sub._statics = ObjectCreate(Super._statics));
  function Sub() {
    if (_init) {
      this._super = Super;
      return  _init.apply(this, arguments) || this;
    }
    return Super.apply(this, arguments) || this;
  }

  return Sub;
}
module.exports = derive.call(Kls);
