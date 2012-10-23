[Project github page](http://hiroqn.github.com/chawan/)
===========
?Chawan
===========
ゆーざすくりぷとで作られたはてなブックマーククライアント、です。
userscirpt for HatenaBookmark
タグを用いたルールを書くことで、フォルダ構造が作れる、すごい！
グリースモンキとかクロムで動く
Firefox with Greasemonkey, Chrome userscript.

Install
==========

Install -> [click](https://github.com/hiroqn/chawan/raw/master/chawan.user.js)

(Note: if you use latest Google Chrome, you cannot install external script directory. Instead, you can do:
1. download script from the link above
2. open chrome://chrome/extensions/ in your browser
3. drag & drop Script file
)

and

Go to -> [here](http://b.hatena.ne.jp/my.name) and write config

How to use
==========
ルールの書き方

    [tag1]

コレでtag1タグを持つブックマークがtag1フォルダに入る。

    [tag1]
     [tag2]

コレでtag1フォルダの中にtag2フォルダが作られる。
tag2フォルダの中に入ったブックマークはtag1フォルダの中にでてこない、注

\[tag1\]\[tag2\]\[tag3\]のたぐを持つブックマークがあって、ルールが下とすると

    [tag1]
     [tag2]
     [tag3]
    [tag3]

そのブックマークはtag1/tag2 , tag1/tag3, tag3のすべてに入る

LICENSE
=======
*MIT LICENSE*