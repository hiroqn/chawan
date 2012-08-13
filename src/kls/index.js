var ObjectCreate,
    _extend = function (dest, src) {
      for (var prop in src) {
        dest[prop] = src[prop];
      }
      return dest;
    },
    slice = Array.prototype.slice;
function Kls() {}
if (!Object.create) {
  ObjectCreate = function (o) {
    function F() {}

    F.prototype = o;
    return new F();
  };
  Kls._statics = {
    statics: statics,
    derive: derive,
    mixin: mixin
    // ,override: override
  }
} else {
  ObjectCreate = Object.create;
  Kls._statics = ObjectCreate(null, {
    statics: {value: statics, enumerable: true},
    derive: {value: derive, enumerable: true},
    mixin: {value: mixin, enumerable: true}
    //,    override: {value: override, enumerable: true}//?need
  });
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
function Singleton() {
  if (!this.constructor._singleton) {

  }

}

function S(m) {
  return function (x) {
    return function (f) {
      return f(m(x)(f))
    }
  }
}

function Zero(x) {
  return function (f) {
    return x;
  }
}
function advice(fn) {
  this._init;
}
//Kls.advice(function () {
//
//});

function loader(fn, context, arg) {
  return fn.apply(context, arg);
}
function derive(_init) {
  var Super = this;
  (Sub.prototype = ObjectCreate(Sub.Super = Super.prototype)).constructor = Sub;
  _extend(Sub, Sub._statics = ObjectCreate(Super._statics));
  Sub._init = _init;
  function Sub() {
    if (_init) {

      this._super = Super;
      return  _init.apply(this, arguments) || this;
    }
    return Super.apply(this, arguments) || this;
  }

  return Sub;
}

var exports = module.exports = derive.call(Kls, Kls);
exports.inherits = function (ctor, superCtor) {// this is Node util.inherits
  ctor.super_ = superCtor;
  ctor.prototype = ObjectCreate(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};