// ==UserScript==
// @name          ?Chawan
// @namespace     https://github.com/hiroqn
// @description   make HatenaBookmark more and more convenient ! maybe...  
// @include       http://b.hatena.ne.jp/*/tags.json*
// @include       http://b.hatena.ne.jp/my.name*
// @run-at        document-start
// @version       0.2.0
// ==/UserScript==

var first=Date.now(),dominit,domed,searched,setted;

//<library jQuery="1.7.2" underscor="1.3.1" backbone="0.9.2">

//</library>
/**
 * bookmark add config follow interest favorite follow.recommend
 */

var util={
    addStyle:function (css) {
      if(GM_addStyle){
        GM_addStyle(css);
      }else{
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;
        document.getElementsByTagName('head')[0].appendChild(style);
      }
    },
    setFavicon:function(data){
      var favicon = document.createElement('link');
      favicon.setAttribute('rel', 'icon');
      favicon.setAttribute('href', data);
      document.getElementsByTagName('head')[0].appendChild(favicon);
    },
    storage:{
      get:function(name){
        return JSON.parse(localStorage.getItem(name));
      },
      getText:function(id){
        return localStorage.getItem(id+'-text');
      },
      setText:function(id,text){
        localStorage.setItem(id+'-text', text);
      },
    },
    log:function(){
      return (GM_log || console).apply(null, arguments);
    },
    isUsable:function(){
      return _.all(arguments,function(obj){
        return Boolean(obj);
      });
    }
};
var User = {
    login: false
};
var Hatena = {
    searchData: function(){
      return jQuery.post("http://b.hatena.ne.jp/" + User.id + "/search.data", null, null, 'text');
    },
    myName: function(){
      var dfd = $.Deferred();
      jQuery.get("http://b.hatena.ne.jp/my.name", null, null, 'json').then(function(object){
        if(object.login){
          dfd.resolve(object);
        } else {
          dfd.reject();
        }
      },function(){
        dfd.reject();
      });
      return dfd.promise();
    },
    editComment:function(url,comment){
      var dfd = $.Deferred();
      jQuery.post('http://b.hatena.ne.jp/'+User.id+'/add.edit.json',{
        url:url,
        comment:comment,
        from:'inplace',
        rks:User.rks
      }, null, 'json').then(function(object){
        if(object.success) {
          dfd.resolve(object.comment_raw);
        } else {
          dfd.reject();
        }
      },function(){
        dfd.reject();
      });
      return dfd.promise();
    },
    destroyBookmark:function(bookmark){
      return jQuery.post('http://b.hatena.ne.jp/'+User.id+'/add.delete',{
        url:bookmark.url,
        rks:User.rks
      }, null, 'text');
    }    
};
(function() {
  var us$ = function(fn) {fn();},
  // defferd for dom-load
  domDfd = $.Deferred(),
  // deferd
  searchDataDfd,myNameDfd,
  //url match tags json
  tags = window.location.href.match(/^http.*\/([^\/]+)\/tags\.json(#.+)?$/),
  // url match my.name http://b.hatena.ne.jp/my.name
  myName = window.location.href.match(/^http:\/\/b\.hatena\.ne\.jp\/my\.name(\?chawan=.+)?$/);
  
  if(tags){
    User.id = tags[1];
    searchDataDfd = Hatena.searchData();
    (myNameDfd = Hatena.myName()).done(function(json){
      User.rkm=json.rkm;
      User.rks=json.rks
      User.login=true;
    });
    $(document).ready(function(){
      var tagText=$('pre').text(); // TODO ? at chrome
      $('body').empty();
      domDfd.resolve();
    });
  } else if(myName){
    var chawan = myName[1];
    $(document).ready(function(){
      var Text=$('pre').text(); // TODO ? at chrome
      $('body').empty();
      domDfd.resolve();
    });
  } else {
    //error
    domDfd.reject();
  }
  _(us$).extend({
    dom: domDfd
  });
  window.us$ = us$;
})();
function initialize(callbacks) {
  var localData, result = window.location.href.match(/^http.*\/([^\/]+)\/tags\.json(#.+)?$/), searchDataDfd,myNameDfd;
  User.id = (result && result[1]);
  if(!util.isUsable(User.id, JSON, localStorage)){
    callbacks.onError('Environmental error');
    return false;
  }
  searchDataDfd = Hatena.searchData();
  (myNameDfd = Hatena.myName()).done(function(json){
    User.rkm=json.rkm;
    User.rks=json.rks
    User.login=true;
  });
  document.addEventListener('DOMContentLoaded', function(e) {
    dominit=Date.now();                                                     /** timer */
    util.addStyle(RESOURCE.CSS);
    var tagText=$('pre').text();
    document.title='?Chawan';   // set title
    $('body').empty(); // clear
    callbacks.ready(localData);
    User.tags=JSON.parse(tagText);// save tag
    domed=Date.now();                                                     /** timer */
    searchDataDfd.done(function(text){
      searched=Date.now();                                                     /** timer */
      callbacks.dataset(text);
      setted=Date.now();                                                     /** timer */
// alert('dominit:'+(dominit-first)+'\n domed' +(domed-first)+'\n
// searched'+(searched-first)+ '\n setted'+(setted-first));
    });
    $.when(myNameDfd,searchDataDfd).fail(function(){
      callbacks.onError('not login');
      User.login=false;
      });
  }, false);
}
/*
 * *ここからコピペ
 */
// TODO hover 
//TODO hover , not login ,configuration
var RESOURCE = {
  naviTMPL:'\
<div id="title">?Chawan</div>\
<div id="breadcrumbs">\
  <span data-position="<%- length %>">?Chawan:</span>\
  <% _(list).each(function(d,n){%> / <span data-position="<%-length-n-1 %>"><%- d %></span>  <% }); %>\
</div>',
  folderTMPL:'\
<% _(folders).each(function(folder){%>\
<div class="folder item" data-name="<%- folder.name %>">\
    <h2><%- folder.name %></h2><h3><%- folder.count %></h3>\
</div>\
<% }); %>',
  editerTMPL:'\
<div class="editer">\
  <h1><%- title %></h1>\
  <h2><a href="<%- url %>" target="_blank"><%- url %><\/a></h2>\
  <textarea class="editer-input"><%- rawComment %></textarea>\
  <div class="buttons"><a class="submit">submit</a> <a class="cancel">cancel</a></div>\
</div>',
  bookmarkTMPL:'\
<% _(bookmarks).each(function(bookmark){%>\
<div class="bookmark item"  title="<%- bookmark.comment %>" >\
  <div class="icons">\
    <div class="edit-icon" data-date="<%- bookmark.date %>"></div></div>\
  <div class="title">\
    <a href="<%- bookmark.url %>" target="_blank" title="<%- bookmark.title %>"> <%- bookmark.title %></a>\
  </div>\
<\/div>\
<% }); %>'
};

var TreeManager = new (Backbone.Model.extend({
  initialize: function() {
    var // for [?]
        chawanParam = /\[\?([^%\/\?\[\]]+?(?:\/[^%\/\?\[\]]+?)*)\]/g,
        // for tags
        tagParam = /\[[^%\/\?\[\]]+?\]/g,
        // Folder,Bookmark
        Folder, Bookmark;
    
    this.Folder = Folder = function(name) {
      this.name = name;
      this.bookmarks = [];
      this.folders = [];
    };
    _.extend(Folder.prototype, Backbone.Events, {
      getFolder : function(name) {
        return _(this.folders).find( function(obj) {
          return obj.name == name;
        });
      },
      addFolder : function(name) {
        var folder = new Folder(name);
        this.folders.push(folder);
        return folder;
      },
      addBookmark : function(bookmark) {
        this.bookmarks.push(bookmark);
      },
      takeBookmark: function(bookmark) {
        var index=this.bookmarks.indexOf(bookmark);
        return ~index ? false : (this.bookmarks.splice(index,1),true);// tilde
                                                                      // !!
      },
      getBookmarkCount : function() {
        return this.count =  _(this.folders).reduce( function(memo, folder) {
              return folder.getBookmarkCount() + memo;
            }, 0) + this.bookmarks.length;
      }
    });
    this.Bookmark = Bookmark = function(title, comment, url, others) {
      this.title = title;
      this.url = url;
      this.commentParser(comment);
      var others = others.split('\t');
      this.count = others[0];
      this.date = others[1];
    }
    Bookmark.create = function(title, comment, url, others) {
      return new Bookmark(title, comment, url, others);
    };
    _.extend(Bookmark.prototype, {
      commentParser : function(comment) {
        this.rawComment = comment;
        this.paths = _(comment.match(chawanParam)).map( function(str) {
          return str.slice(2, -1).split('/');
        });
        comment = comment.replace(chawanParam, '');
        this.tags = comment.match(tagParam);
        this.comment = comment.replace(tagParam,'');
      }
    });
    this.root = new Folder('root');
    this.root.root = true;
  },
  getFolder: function(path,isNew) {
    var folder = this.root;
    for ( var i = 0; i < path.length; i++) {
      folder = folder.getFolder(path[i]) || (isNew && folder.addFolder(path[i]));
      if(!folder) {
        return null;
      }
    }
    return folder;
  },
  addByText: function(texts) {
    var array = texts.split('\n'), l = array.length / 4, bookmarks = new Array(l);
    var Tree = this;
    for ( var i = 0; i < l; i++) {
      bookmarks[i] = this.Bookmark.create(array[i * 3], array[1 + i * 3],
          array[2 + i * 3], array[i + l * 3]);
    }
    this.allBookmark = bookmarks;
    _(bookmarks).each( function(bookmark) {
      if (bookmark.paths.length) {
          _(bookmark.paths).each( function(chawan) {
            Tree.getFolder(chawan,true).addBookmark(bookmark);
          });
        } else {// dont have chawan
          bookmark.paths.push([]);
          Tree.root.addBookmark(bookmark);
        }
    });
    this.root.getBookmarkCount();
    this.trigger('change');
    
  },
  moveBookmark: function(bookmark,comment) {
    var Tree = this;
    _(bookmark.paths).each( function(path) {
      Tree.getFolder(path).takeBookmark(bookmark);
    });
    bookmark.commentParser(comment);
    _(bookmark.paths).each( function(chawan) {
      Tree.getFolder(chawan,true).addBookmark(bookmark);
    });
    this.trigger('change');
  },
  setComment: function(bookmark, comment){
    var dfd = Hatena.editComment(bookmark.url,comment);
    var Tree = this;
    dfd.then( function(comment) {
      Tree.moveBookmark(bookmark, comment);
    }, function() {
      
    });
  }
}));

window.app = new (Backbone.Model.extend({
  defaults : {
    'isModal' : false
  },
  initialize : function() {
    this.set('path',[]);
    this.set('TreeManager',TreeManager);
  },
  setText : function(texts) {
    TreeManager.addByText(texts);
  },
  upLevel : function(n) {
    n || (n === 0) ||(n = 1);
    if(this.get('path').length){
      for (var i = 0;i < n;i++){
        this.get('path').pop();
      }
      this.trigger('change:path');
    }
  },
  downLevel : function(name) {
    var path = this.get('path');
    if (TreeManager.getFolder(path = path.concat(name))) {
      this.set('path',path);
    }
  }
}));

var EditerView = Backbone.View.extend({
  tagName: 'div',
  className: 'editer-wrapper',
  events: {
    "click .submit":'submit',
    "click":"cancel"
  }, 
  tmpl:_.template(RESOURCE.editerTMPL),
  initialize: function(options) {
    this.render();
  },
  render: function() {
    this.$el.html(this.tmpl(this.model));
    return this;
  },
  submit: function() {
    var text = this.$('.editer-input').val();
    TreeManager.setComment(this.model, text);
    this.destroy();
  },
  cancel: function(e) {
    if(e.target.className === 'editer-wrapper'){
      this.destroy();
    }
  },
  destroy: function() {
    window.app.set('isModal',false);
    this.remove();
  }
});

var FoldersView = Backbone.View.extend({
  tagName : 'div',
  id : 'contents',
  initialize : function(options) {
    this.render();
  },
  events : {
    "click .folder" : "down",
    "click .upper" : "up",
    "click .edit-icon": "edit"
  },
  bookmarkTmpl : _.template(RESOURCE.bookmarkTMPL),
  folderTmpl : _.template(RESOURCE.folderTMPL),
  render : function() {
    var 
    // bookmarkHTML
    bookmarkHTML =  this.bookmarkTmpl({bookmarks:this.model.bookmarks}),
    // folderHTML
    folderHTML = this.folderTmpl({folders:this.model.folders});
// '<div class="upper item"><h2>↑Parent<\/h2><\/div>'
    this.$el.html(folderHTML + bookmarkHTML );
    return this;
  },
  down : function(e) {
    window.app.downLevel(e.currentTarget.dataset.name);
  },
  up : function() {
    window.app.upLevel();
  },
  edit: function(e) {
    var bookmark = _(this.model.bookmarks).find(function(b){
      return b.date === e.currentTarget.dataset.date;
    });
    bookmark && this.trigger('edit',bookmark);
  }
});


var NaviView = Backbone.View.extend({
  tagName : 'div',
  id : 'navi',
  tmpl : _.template(RESOURCE.naviTMPL),
  events: {
    'click #title': function(e){
      this.model.set('path', []);
    } ,
    'click #breadcrumbs span': function(e){
      var n = Number(e.target.dataset.position);
      if (!isNaN(n)){
        this.model.upLevel(n);
      }
    }
  },
  initialize : function() {
    this.model.on('change:path', this.render, this);
    this.render();
  },
  render : function() {
    this.$el.html(this.tmpl({
      list : this.model.get('path'),
      length: this.model.get('path').length
    }));
  }
});

var AppView = Backbone.View.extend({
  initialize : function(options) {
    this.naviView = new NaviView({
      model : app
    });
    this.model.get('TreeManager').on('change', this.render, this);
    this.model.on('change:path', this.render, this);
    this.model.on('change:isModal',this.modal,this);
    this.$container = $('<div />',{"class":"container"});
    this.$overlay = $('<div />',{"class":"overlay"});
    this.$el.append(this.naviView.el,this.$container,this.$overlay);
  },
  render : function() {
    var folder = this.model.get('TreeManager').getFolder(this.model.get('path'));
    if (folder && folder.getBookmarkCount()) {
      if(this.folderView){
        this.folderView.remove();
      }
      
      this.folderView = new FoldersView({
        model : folder,
        $wrapper: this.$overlay
      });
      this.folderView.on('edit',this.createEditer,this);
      this.$container.append(this.folderView.el);
    }
    return this;
  },
  modal: function() {
    if(this.model.get('isModal')){
      this.$el.addClass('modal-enable');
    } else{
      this.$el.removeClass('modal-enable');
    }
  },
  createEditer: function(bookmark) {
    var eV = new EditerView({model:bookmark});
    window.app.set('isModal',true);
    this.$overlay.append(eV.el);
  }
});

initialize({
  ready : function(localText) {
    var body = $('body');
    new AppView({
      model: app,
      el: 'body'
    });
    var router = new (Backbone.Router.extend({
      routes : {
        "" : "top",
        "!" : "top",
        "!*path" : "moveTo",
        "configure":"configure"
      },
      top : function() {
        window.app.set('path', []);
      },
      moveTo : function(path) {
        window.app.set('path', _(path.split('/')).map( function(str) {return decodeURIComponent(str);}));
      },
      configure: function(){
        
      }
    }));
    app.on('change:path', function(){
      router.navigate('!' + app.get('path').join('/'));
    });
    Backbone.history.start();
    var flag = false;
    var debounce = _.debounce(function(){
      body.removeClass('majik');
      flag = false;
    },1000);
    var scrollMajik = _.throttle(function(){
      if(flag){
        debounce();
      } else {
        _.defer(function(){body.addClass('majik');});
        flag = true;
        debounce();
      }
    },200);
    $(window).scroll(scrollMajik);
  },
  dataset : function(text) {
    window.app.setText(text);
  },
  onError : function(str) {
    alert(str);
  }
});
/*
 * *ここまでコピペ
 */

RESOURCE.CSS="html,body,div,span,applet,object,iframe,h1,h2,h3,h4,h5,h6,p,blockquote,pre,a,abbr,acronym,address,big,cite,code,del,dfn,em,font,img,ins,kbd,q,s,samp,small,strike,strong,sub,sup,tt,var,b,u,i,center,dl,dt,dd,ol,ul,li,fieldset,form,label,legend,table,caption,tbody,tfoot,thead,tr,th,td{margin:0;padding:0;border:0;outline:0;font-size:100%;vertical-align:baseline;background:transparent}body{line-height:1}ol,ul{list-style:none}blockquote,q{quotes:none}blockquote:before,blockquote:after,q:before,q:after{content:'';content:none}:focus{outline:0}ins{text-decoration:none}del{text-decoration:line-through}table{border-collapse:collapse;border-spacing:0}body{background-color:#353535;font-family:'Segoe UI','Meiryo',helvetica,sans-serif;color:#fff;font-size:18px;}.modal-enable{overflow:hidden;position:relative;}#container{margin:5px;min-width:640px;}#navi{text-shadow:0 -1px 0 #888;position:relative;height:100px;padding:1em;}#breadcrumbs{float:left;font-size:1.5em;}#breadcrumbs span{border:solid 2px rgb(255,255,255);border-radius:9px 9px 9px 9px;padding:0.2em;}#navi #title{float:right;font-size:3em;}.overlay{bottom:0;visibility:hidden;left:0;position:fixed;right:0;top:0;z-index:100;}.modal-enable .overlay{visibility:visible;}.editer-wrapper{background:none repeat scroll 0 0 rgba(255,255,255,0.7);bottom:0;display:none;left:0;position:fixed;right:0;top:0;z-index:200;}.modal-enable .editer-wrapper{display:block;}.editer{position:relative;overflow:hidden;width:600px;margin:100px auto;background-color:#393;padding:16px;box-shadow:0 4px 12px rgba(0,0,0,0.6);text-decoration:none;color:#fff;}.editer h1{font-size:24px;color:#000;margin-bottom:12px;}.editer h2{font-size:16px;color:#888;margin-bottom:24px;}.editer-input{line-height:18px;font-size:14px;border-radius:4px 4px 4px 4px;display:block;width:inherit;resize:vertical;margin-bottom:8px;}.buttons{height:32px;}.item{position:relative;display:inline-block;white-space:nowrap;margin:5px;height:150px;overflow:hidden;}.folder{background-color:#1ba1e2;width:150px;height:150px;text-shadow:1px -1px 0 #888;}.folder h2{position:absolute;bottom:5px;left:5px;font-size:24px;}.folder h3{position:absolute;top:5px;right:5px;font-size:24px;}.upper{background-color:#f09609;position:relative;}.upper h2{position:absolute;bottom:5px;left:5px;font-size:130%;}.bookmark{background-color:#00aba9;font-size:100%;text-shadow:1px -1px 1px #444;width:300px;}.bookmark a{text-decoration:none;color:#fff;}.icons{position:absolute;top:3px;left:3px;width:inherit;visibility:hidden;}.bookmark:hover .icons{visibility:visible;}.majik .bookmark:hover .icons{visibility:hidden;}.title{position:absolute;left:3px;bottom:3px;width:inherit;height:2em;display:block;overflow:hidden;white-space:normal;}.edit-icon{width:48px;height:48px;background-repeat:no-repeat;background-image: url('data:image/png;base64,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Sl1NOxERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERGRO+Qfh5eOajemXSYAAAFTbWtCVPrOyv4Af1WJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4nO3W4WmDYBSGUQdxEQdxEBdxEAdxEQexvIELt6Yh/4oJ54FDm0/7601szlOSJEmSJEmSJEmSJEmSJEmSJEkf0XEc577vT+c5y7V397+6T/dvXddzHMdzmqbHz+wY/Sz31L11FsuyPF7HMAx/vod077JjlX2zYXatzfs9tX/VN7/+je5ftut7Vjnrn+V6nX37xtm/ul7T/ctzvu9f/9fneX7aP9fs/31l23ru1+/btv36zPfnv/2/r/oe1/er90Cu1Xf7nEXVnx3Xa5IkSZIkSZIkSfr3BgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+EA/CvmsuD1UqYgAAA7XbWtCVPrOyv4Af594AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4nO2djZEcKQyFHYgTcSAOxIk4EAfiRBzIXunqPte7Z0lAz8/+WK9qame7aRASCNCDnpeXwWAwGAwGg8FgMBgMBoPB4D/8+vXr5efPn3984jr3qufic6WsAGX498H/Uen5iv4zfP/+/eXTp09/fOI69zJ8+fLl388uvn379jvvsDdlBPT7R0bU+7SelZ5P9b8CNtH+rvZf9VH6dpWmk9ft3/mdXVTyrOQEXRq9XqXLrmftvHs+cGrnq3rr7B/la991ubRvex6aD3kFqv6veWX1jvufP3/+93voLdL9+PHj9714hrqoLwtEOr0e6TNE/p4m8oi8uRdlq15IF9f1eeqgaSMvT0cd9Hr8jc+q/8ffr1+//n7uCjr7c01l0fIjTZTPM1mfIz33Mvu7DFGe2wibx9/QmaaJ74xbXHM9RRqd8zi0fUU+pEcXyKnpVO74oAvassod11Qfqmctn/F91/76zBWs/H9WZtb/6X+dvIHM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ICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyI+CiAgICAgICAgIDx4bXA6Q3JlYXRvclRvb2w+QWRvYmUgRmlyZXdvcmtzIENTNDwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxMC0xMC0yNFQwODo1ODo0NVo8L3htcDpDcmVhdGVEYXRlPgogICAgICAgICA8eG1wOk1vZGlmeURhdGU+MjAxMC0xMC0yNFQwOTowMDoxNlo8L3htcDpNb2RpZnlEYXRlPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIj4KICAgICAgICAgPGRjOmZvcm1hdD5pbWFnZS9wbmc8L2RjOmZvcm1hdD4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz7Q8pZEAAABiUlEQVRoge2YPWqEQBhAxxCRdOYAwdpL5AopLHKNXMBqijT2NtPZ2WxttwzptNnGFCk0BuzCTrUgFl8qQRZZMjPqpzAPLBTU9xz/LQAge+YOW0AXE4CNCcDGBGBjArAxAdjsPuBedUXLsrR3niTJwXGcx67rznVdv4Vh+C37cqkcoAOl1AuC4NP3/YdhmRDixbbtZ0LIh9TGAEBp0iFN0yNMwDlvZT0sVRmVU4hS6tm2/dT3/c/1CBBCiBACXNeVuy7XGgFKqVeW5QUAgDHGxvMDeZ6fpT3WCJiSnYqI4/h9cwFT8tcRnPOWMcYIkfdZNOCW/Pioj9eR9VjsQTZ1q1yEJUbgP0d+OIV0fWYP0JFHD9CVRw2YQx4tYC55lIA55VECkiQ5zCW/yRGQkUcJuBUhK796QJqmR0qpNxWhIr9qQBRFrwAAZVlexhFZln2pyq8aML54OeetqrBugPI3cdd1v0VRiKqqTk3TxHMFyKL8SbkVdv9fyARgYwKwMQHYmABsTAA2uw/4A1YqhpADE2r3AAAAAElFTkSuQmCC');}";

